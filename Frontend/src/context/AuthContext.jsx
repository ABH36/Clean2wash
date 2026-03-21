import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import apiClient, { authAPI, walletAPI, paymentAPI, orderAPI } from '../utils/api';
import { captainAPI } from '../utils/captainApi';
import { adminAPI } from '../utils/adminApi';
import { vendorAPI } from '../utils/vendorApi';
import { staffAPI } from '../utils/staffApi';

import { socketService } from '../utils/socket';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

// Each panel stores its session under a separate key
const SESSION_KEYS = {
    consumer: 'auth_consumer',
    admin: 'auth_admin',
    captain: 'auth_captain',
    vendor: 'auth_vendor',
    staff: 'auth_staff',
};

// Mock credentials removed to force API usage

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Removed static registered users state, users should only come from backend API

    // Initialize state from localStorage - moved up to fix initialization order
    const [sessions, setSessions] = useState(() => {
        const result = {};
        for (const [role, key] of Object.entries(SESSION_KEYS)) {
            try {
                const raw = localStorage.getItem(key);
                result[role] = raw ? JSON.parse(raw) : null;
            } catch {
                result[role] = null;
            }
        }
        return result;
    });
    const [trustedContacts, setTrustedContacts] = useState([]);

    // Dynamic Token Restoration on mount
    useEffect(() => {
        if (sessions.consumer?.token) apiClient.setToken(sessions.consumer.token);
        if (sessions.vendor?.token) vendorAPI.setToken(sessions.vendor.token);
        if (sessions.admin?.token) adminAPI.setToken(sessions.admin.token);
        if (sessions.staff?.token) staffAPI.setToken(sessions.staff.token);
        if (sessions.captain?.token) captainAPI.setToken(sessions.captain.token);

        // 🔗 Global Socket Lifecycle: High Productivity Flow
        // Find the first available token across all roles to establish the real-time link
        const activeToken = sessions.consumer?.token ||
            sessions.captain?.token ||
            sessions.admin?.token ||
            sessions.vendor?.token ||
            sessions.staff?.token;

        if (activeToken) {
            socketService.connect(activeToken);

            // 🔔 Phase 3: Global Notification Listener
            const handleGlobalStatusUpdate = (data) => {
                console.log('🔄 Global Status Update Received:', data);
                if (data.bookingId || data._id) {
                    setBookings(prev => prev.map(booking => {
                        const id = booking._id || booking.id;
                        if (id === (data.bookingId || data._id)) {
                            return { ...booking, status: data.status, ...data.updatedFields };
                        }
                        return booking;
                    }));
                }
                setLastRealTimeAlert({
                    title: 'Booking Updated 📦',
                    message: data.message || `Status changed to ${data.status}`,
                    type: 'status_update'
                });

                // Display Global Toast
                toast.success(data.message || `Booking status: ${data.status}`, {
                    id: data.bookingId || data._id, // Prevent duplicate toasts for same update
                    duration: 4000,
                    icon: '🚗'
                });
            };

            const handleProductOrderStatusUpdate = (data) => {
                console.log('🔄 Product Order Status Update Received:', data);
                if (data.orderId) {
                    setProductOrders(prev => prev.map(order => {
                        if (order._id === data.orderId) {
                            return {
                                ...order,
                                status: data.status,
                                statusHistory: [...(order.statusHistory || []), {
                                    status: data.status,
                                    comment: data.message,
                                    timestamp: new Date()
                                }]
                            };
                        }
                        return order;
                    }));
                }

                toast.success(data.message || `Order status: ${data.status}`, {
                    duration: 5000,
                    icon: '📦'
                });
            };

            const handleNewNotification = (data) => {
                console.log('📬 New Real-time Notification:', data);
                const notification = data.notification || {};

                setLastRealTimeAlert({
                    title: notification.title || 'New Notification!',
                    message: notification.message || 'Check your notifications panel.',
                    type: 'notification'
                });

                // Display Global Professional Toast
                toast(
                    (t) => (
                        <div className="flex flex-col gap-1">
                            <span className="font-black text-xs uppercase tracking-tight">{notification.title || 'Notification'}</span>
                            <span className="text-[11px] font-bold opacity-60 leading-tight">{notification.message}</span>
                        </div>
                    ),
                    {
                        icon: notification.type === 'booking' ? '📦' : '🔔',
                        duration: 5000,
                    }
                );
            };

            socketService.on('booking_status_updated', handleGlobalStatusUpdate);
            socketService.on('product_order_status_updated', handleProductOrderStatusUpdate);
            socketService.on('new_notification', handleNewNotification);
            socketService.on('new_captain_notification', handleNewNotification);
            socketService.on('new_vendor_notification', handleNewNotification);

            return () => {
                socketService.off('booking_status_updated', handleGlobalStatusUpdate);
                socketService.off('product_order_status_updated', handleProductOrderStatusUpdate);
                socketService.off('new_notification', handleNewNotification);
                socketService.off('new_captain_notification', handleNewNotification);
                socketService.off('new_vendor_notification', handleNewNotification);
            };
        } else {
            socketService.disconnect();
        }
    }, [sessions]);

    const [lastRealTimeAlert, setLastRealTimeAlert] = useState(null);

    // --- CORE AUTH FUNCTIONS (Moved to top to prevent reference errors) ---
    const isLoggedIn = useCallback((role) => !!sessions[role], [sessions]);

    const getUser = useCallback((role) => sessions[role], [sessions]);

    const login = useCallback((role, userData) => {
        const data = { ...userData, loggedInAt: Date.now() };
        localStorage.setItem(SESSION_KEYS[role], JSON.stringify(data));
        setSessions(prev => ({ ...prev, [role]: data }));
        return true;
    }, []);

    const logout = useCallback((role) => {
        localStorage.removeItem(SESSION_KEYS[role]);

        // Clear consumer-specific state and legacy storage
        if (role === 'consumer') {
            localStorage.removeItem('carwash_bookings');
            localStorage.removeItem('carwash_subscription');
            setBookings([]);
            setUserSubscription(null);
            setWalletBalance(0);
            setTrustedContacts([]);
        }

        setSessions(prev => ({ ...prev, [role]: null }));
    }, []);

    const sendOTP = useCallback(async (identifier, type = 'phone', userData = null) => {
        try {
            const response = await authAPI.sendOTP(identifier, type, userData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Send OTP error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const verifyOTP = useCallback(async (identifier, otp, type = 'phone', options = {}) => {
        try {
            const { isSignup = false, userData: signupUserData = null } = options;
            const response = await authAPI.verifyOTP(identifier, otp, type, { isSignup, userData: signupUserData });
            const token = response.token || response.data?.token;
            const consumer = response.data?.consumer || response.consumer || response.data;

            if (token) {
                apiClient.setToken(token);
            }

            const userSession = {
                id: consumer._id,
                name: consumer.name,
                email: consumer.email,
                phone: consumer.phone,
                token,
                role: 'consumer',
                ...consumer
            };

            login('consumer', userSession);
            return { success: true, data: { consumer: userSession, token } };
        } catch (error) {
            console.error('Verify OTP error:', error);
            return { success: false, error: error.message };
        }
    }, [login]);

    const apiLogin = useCallback(async (identifier, password) => {
        try {
            const response = await authAPI.login(identifier, password);
            const token = response.token || response.data?.token;
            const consumer = response.data?.consumer || response.consumer || response.data;

            if (token) {
                apiClient.setToken(token);
            }

            const userSession = {
                id: consumer._id,
                name: consumer.name,
                email: consumer.email,
                phone: consumer.phone,
                token,
                role: 'consumer',
                ...consumer
            };

            login('consumer', userSession);
            return { success: true, data: { consumer: userSession, token } };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }, [login]);

    const apiSignup = useCallback(async (userData) => {
        try {
            const response = await authAPI.signup(userData);
            const token = response.token || response.data?.token;
            const consumer = response.data?.consumer || response.consumer || response.data;

            if (token) {
                apiClient.setToken(token);
            }

            const userSession = {
                id: consumer._id,
                name: consumer.name,
                email: consumer.email,
                phone: consumer.phone,
                role: 'consumer',
                ...consumer
            };

            login('consumer', userSession);
            return { success: true, data: { consumer: userSession, token } };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }
    }, [login]);

    const apiLogout = useCallback(async (role) => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        apiClient.setToken(null);
        logout(role);
    }, [logout]);
    // ----------------------------------------------------------------------






    // Vehicle management with backend integration
    const [vehicles, setVehicles] = useState([]);
    const [vehiclesLoading, setVehiclesLoading] = useState(false);
    const [globalCatalog, setGlobalCatalog] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(false);

    // Load global catalog for vehicle selection
    const loadGlobalCatalog = useCallback(async () => {
        try {
            setCatalogLoading(true);
            const response = await apiClient.getVehicleModels();
            setGlobalCatalog(response.data.models || []);
        } catch (error) {
            console.error('Failed to load global catalog:', error);
        } finally {
            setCatalogLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGlobalCatalog();
    }, [loadGlobalCatalog]);

    // Load vehicles from backend when user logs in
    useEffect(() => {
        if (sessions.consumer && sessions.consumer.id) {
            loadVehicles();
        }
    }, [sessions.consumer]);

    const loadVehicles = useCallback(async () => {
        if (!sessions.consumer || !sessions.consumer.id) {
            console.log('User not logged in, skipping vehicle load');
            return;
        }
        try {
            setVehiclesLoading(true);
            const response = await apiClient.getVehicles();
            setVehicles(response.data.vehicles || []);
        } catch (error) {
            console.error('Failed to load vehicles:', error);
            // Don't show error for unauthorized requests
            if (error.response?.status !== 401) {
                console.error('Failed to load vehicles:', error);
            }
        } finally {
            setVehiclesLoading(false);
        }
    }, [sessions.consumer]);

    const addVehicle = useCallback(async (vehicleData) => {
        try {
            const response = await apiClient.addVehicle(vehicleData);
            setVehicles(prev => [...prev, response.data.vehicle]);
            return { success: true, data: response.data.vehicle };
        } catch (error) {
            console.error('Failed to add vehicle:', error);
            const errorMsg = error.data?.errors ? error.data.errors.join(', ') : (error.data?.message || error.message);
            return { success: false, error: errorMsg };
        }
    }, []);

    const updateVehicle = useCallback(async (vehicleId, vehicleData) => {
        try {
            const response = await apiClient.updateVehicle(vehicleId, vehicleData);
            setVehicles(prev => prev.map(v => v._id === vehicleId ? response.data.vehicle : v));
            return { success: true, data: response.data.vehicle };
        } catch (error) {
            console.error('Failed to update vehicle:', error);
            const errorMsg = error.data?.errors ? error.data.errors.join(', ') : (error.data?.message || error.message);
            return { success: false, error: errorMsg };
        }
    }, []);

    const removeVehicle = useCallback(async (vehicleId) => {
        try {
            await apiClient.deleteVehicle(vehicleId);
            setVehicles(prev => prev.filter(v => v._id !== vehicleId));
            return { success: true };
        } catch (error) {
            console.error('Failed to remove vehicle:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const setPrimaryVehicle = useCallback(async (vehicleId) => {
        try {
            await apiClient.updateVehicle(vehicleId, { isPrimary: true });
            setVehicles(prev => prev.map(v => ({
                ...v,
                isPrimary: v._id === vehicleId
            })));
            return { success: true };
        } catch (error) {
            console.error('Failed to set primary vehicle:', error);
            const errorMsg = error.data?.errors ? error.data.errors.join(', ') : (error.data?.message || error.message);
            return { success: false, error: errorMsg };
        }
    }, []);

    // Trusted contacts management
    const [trustedContactsLoading, setTrustedContactsLoading] = useState(false);

    const loadTrustedContacts = useCallback(async () => {
        if (!sessions.consumer || !sessions.consumer.id) return;
        try {
            setTrustedContactsLoading(true);
            const response = await apiClient.getTrustedContacts();
            setTrustedContacts(response.data.contacts || []);
        } catch (error) {
            console.error('Failed to load trusted contacts:', error);
        } finally {
            setTrustedContactsLoading(false);
        }
    }, [sessions.consumer]);

    // Load contacts on mount/login
    useEffect(() => {
        if (sessions.consumer?.id) {
            loadTrustedContacts();
        }
    }, [sessions.consumer?.id, loadTrustedContacts]);

    const addContact = useCallback(async (contactData) => {
        try {
            const response = await apiClient.addTrustedContact(contactData);
            setTrustedContacts(response.data.contacts);
            return { success: true };
        } catch (error) {
            console.error('Failed to add contact:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const removeContact = useCallback(async (contactId) => {
        try {
            const response = await apiClient.removeTrustedContact(contactId);
            setTrustedContacts(response.data.contacts);
            return { success: true };
        } catch (error) {
            console.error('Failed to remove contact:', error);
            return { success: false, error: error.message };
        }
    }, []);
    // Booking management with backend integration - trust API as single source of truth
    const [bookings, setBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);

    // Bookings are now managed by backend - no localStorage sync needed

    // Load bookings from backend when user logs in
    useEffect(() => {
        if (sessions.consumer && sessions.consumer.id) {
            loadBookings();
        }
    }, [sessions.consumer]);

    const loadBookings = useCallback(async () => {
        if (!sessions.consumer || !sessions.consumer.id) {
            console.log('User not logged in, skipping bookings load');
            return;
        }
        try {
            setBookingsLoading(true);
            const response = await apiClient.getBookings();
            setBookings(response.data.bookings || []);
        } catch (error) {
            // Don't show error for unauthorized requests
            if (error.response?.status !== 401) {
                console.error('Failed to load bookings:', error);
            }
        } finally {
            setBookingsLoading(false);
        }
    }, [sessions.consumer]);

    const addBooking = useCallback(async (bookingData) => {
        const enrichedData = {
            ...bookingData,
            userId: bookingData.userId || sessions.consumer?.id || 'GUEST'
        };

        try {
            // If the booking object already has an ID, it was likely created on the server 
            // and we're just syncing it back to the context. Skip call to prevent duplicates.
            if (bookingData._id || bookingData.id) {
                setBookings(prev => {
                    const exists = prev.some(b => (b._id === (bookingData._id || bookingData.id)) || (b.id === (bookingData._id || bookingData.id)));
                    if (exists) return prev;
                    return [bookingData, ...prev];
                });
                return { success: true, data: bookingData };
            }

            const response = await apiClient.createBooking(enrichedData);
            const newBooking = response.data.booking;
            setBookings(prev => [newBooking, ...prev]);
            return { success: true, data: newBooking };
        } catch (error) {
            console.error('Failed to create booking:', error);

            // Fallback for development/offline/guest
            if (import.meta.env.DEV || !sessions.consumer) {
                const mockBooking = {
                    ...enrichedData,
                    _id: enrichedData._id || 'mock-' + Date.now(),
                    id: enrichedData.id || 'C2W-' + Math.floor(1000 + Math.random() * 9000),
                    status: enrichedData.status || 'pending',
                    timestamp: enrichedData.timestamp || new Date().toISOString()
                };
                setBookings(prev => [mockBooking, ...prev]);
                return { success: true, data: mockBooking, isMock: true };
            }

            return { success: false, error: error.message };
        }
    }, [sessions.consumer]);

    const updateBookingStatus = useCallback(async (bookingId, status, extraData = {}) => {
        try {
            const response = await apiClient.updateBooking(bookingId, { status, ...extraData });
            setBookings(prev => prev.map(b =>
                b._id === bookingId ? response.data.booking : b
            ));
            return { success: true, data: response.data.booking };
        } catch (error) {
            console.error('Failed to update booking:', error);
            // Fallback to local update for now
            setBookings(prev => prev.map(b =>
                b._id === bookingId ? { ...b, status, ...extraData } : b
            ));
            return { success: false, error: error.message };
        }
    }, []);

    // --- PRODUCT ORDER MANAGEMENT (PHASE 29) ---
    const [productOrders, setProductOrders] = useState([]);
    const [productOrdersLoading, setProductOrdersLoading] = useState(false);

    const loadProductOrders = useCallback(async () => {
        if (!sessions.consumer?.id) return;
        try {
            setProductOrdersLoading(true);
            const response = await orderAPI.getOrders();
            setProductOrders(response.data.orders || []);
        } catch (error) {
            if (error.status !== 401) {
                console.error('Failed to load product orders:', error);
            }
        } finally {
            setProductOrdersLoading(false);
        }
    }, [sessions.consumer]);

    useEffect(() => {
        if (sessions.consumer?.id) {
            loadProductOrders();
        }
    }, [sessions.consumer?.id, loadProductOrders]);

    const addProductOrder = useCallback(async (orderData) => {
        try {
            const response = await orderAPI.createOrder(orderData);
            const newOrder = response.data.order;
            setProductOrders(prev => [newOrder, ...prev]);
            return { success: true, data: newOrder };
        } catch (error) {
            console.error('Failed to create product order:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const verifyProductOrderPayment = useCallback(async (paymentData) => {
        try {
            const response = await orderAPI.verifyOrderPayment(paymentData);
            const updatedOrder = response.data.order;
            setProductOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
            return { success: true, data: updatedOrder };
        } catch (error) {
            console.error('Failed to verify product order payment:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const [userSubscription, setUserSubscription] = useState(null);

    // Load subscription from backend when consumer logs in
    useEffect(() => {
        if (sessions.consumer?.token) {
            const loadSubscription = async () => {
                try {
                    const response = await apiClient.getSubscription();
                    if (response?.data?.subscription) {
                        setUserSubscription(response.data.subscription);
                    } else {
                        setUserSubscription(null);
                    }
                } catch (error) {
                    // 404 = no active subscription, that's fine
                    if (error.status !== 404 && error.status !== 401) {
                        console.error('Failed to load subscription:', error);
                    }
                    setUserSubscription(null);
                }
            };
            loadSubscription();
        } else {
            setUserSubscription(null);
        }
    }, [sessions.consumer?.token]);

    const isBlackPassMember = useMemo(() => {
        if (!userSubscription) return false;
        const planName = userSubscription.planName || userSubscription.name || userSubscription.plan || '';
        const isActive = userSubscription.status === 'active' || userSubscription.status === 'Active';
        return isActive && (planName.toLowerCase().includes('black'));
    }, [userSubscription]);

    // Wallet management with backend integration
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletLoading, setWalletLoading] = useState(false);


    const loadWallet = useCallback(async () => {
        if (!sessions.consumer || !sessions.consumer.id) {
            console.log('User not logged in, skipping wallet load');
            return;
        }
        try {
            setWalletLoading(true);
            const response = await apiClient.getWallet();
            setWalletBalance(response?.data?.wallet?.balance || 0);
        } catch (error) {
            // Don't show error for unauthorized requests
            if (error.response?.status !== 401) {
                console.error('Failed to load wallet:', error);
            }
        } finally {
            setWalletLoading(false);
        }
    }, [sessions.consumer]);

    // Load wallet from backend when user logs in
    useEffect(() => {
        if (sessions.consumer?.token) {
            loadWallet();
        }
    }, [sessions.consumer?.token, loadWallet]);

    const addToWallet = useCallback(async (amount, paymentMethod) => {
        try {
            const response = await apiClient.addToWallet(amount, paymentMethod);
            setWalletBalance(response.data.wallet?.balance || walletBalance + amount);
            return { success: true, data: response.data.wallet };
        } catch (error) {
            console.error('Failed to add to wallet:', error);
            return { success: false, error: error.message };
        }
    }, [walletBalance]);

    // Payment methods
    const getRazorpayKey = useCallback(async () => {
        try {
            const response = await paymentAPI.getRazorpayKey();
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get Razorpay key error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const createPaymentOrder = useCallback(async (amount, currency = 'INR', receipt) => {
        try {
            const response = await paymentAPI.createOrder(amount, currency, receipt);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Create payment order error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const verifyPayment = useCallback(async (orderId, paymentId, signature, bookingId) => {
        try {
            const response = await paymentAPI.verifyPayment(orderId, paymentId, signature, bookingId);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Verify payment error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    // Bookings are now managed by backend - no localStorage needed

    useEffect(() => {
        // localStorage sync removed - now backend persisted
    }, [trustedContacts]);

    useEffect(() => {
        // localStorage sync removed — subscription is now backend-persisted only
    }, [userSubscription]);

    // Wallet is now managed by backend - no localStorage needed

    // Cross-tab synchronization
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (SESSION_KEYS[e.key] || Object.values(SESSION_KEYS).includes(e.key)) {
                const newSessions = {};
                for (const [role, key] of Object.entries(SESSION_KEYS)) {
                    const raw = localStorage.getItem(key);
                    newSessions[role] = raw ? JSON.parse(raw) : null;
                }
                setSessions(newSessions);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);



    // Socket.io Integration
    useEffect(() => {
        const activeSession = sessions.consumer || sessions.captain || sessions.vendor || sessions.admin || sessions.staff;
        const userId = activeSession?.id || activeSession?._id;
        const token = activeSession?.token;

        if (userId && token) {
            socketService.connect(token);

            // Admins join broadcast room for real-time alerts
            if (sessions.admin?.id) {
                socketService.joinAdminRoom();
            }

            // Rejoin rooms for current active bookings
            bookings.forEach(b => {
                const activeStatuses = [
                    'pending', 'confirmed', 'accepted', 'assigned', 'pickup-assigned',
                    'en_route', 'arrived', 'at-studio', 'in_progress', 'washing',
                    'quality-check', 'ready-for-delivery'
                ];
                if (activeStatuses.includes(b.status)) {
                    socketService.joinBookingRoom(b._id);
                }
            });
        } else {
            socketService.disconnect();
        }

        const handleBookingUpdate = async (data) => {
            console.log('Real-time booking update received:', data);

            // Show toast notification for important status changes
            const statusLabels = {
                'confirmed': 'Booking confirmed!',
                'pickup-assigned': 'Driver assigned for pickup!',
                'en_route': 'Captain is on the way!',
                'arrived': 'Captain has arrived at your location!',
                'at-studio': 'Vehicle reached the Studio Hub!',
                'in_progress': 'Wash has started!',
                'quality-check': 'Quality inspection in progress!',
                'ready-for-delivery': 'Wash complete! Ready for delivery.',
                'completed': 'Service completed! Your vehicle is ready.',
                'cancelled': 'Booking has been cancelled.'
            };

            if (statusLabels[data.status]) {
                const { toast } = await import('react-hot-toast');
                toast.success(statusLabels[data.status], {
                    icon: '🚗',
                    style: { borderRadius: '12px', background: '#000', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
                });
            }

            // Update Consumer Bookings
            setBookings(prev => prev.map(b => {
                if (b._id === data.bookingId) {
                    return {
                        ...b,
                        status: data.status,
                        tracking: data.tracking || b.tracking,
                        provider: data.staff ? { ...b.provider, id: { ...b.provider?.id, ...data.staff } } : (data.provider || b.provider)
                    };
                }
                return b;
            }));
        };

        const handleCaptainVerified = async (data) => {
            console.log('Real-time captain verified received:', data);
            const { toast } = await import('react-hot-toast');
            toast.success(data.message || 'Your account has been verified!', {
                icon: '✅',
                style: { borderRadius: '12px', background: '#000', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
            });

            // Update context seamlessly
            setSessions(prev => {
                if (prev.captain) {
                    const updatedCaptain = { ...prev.captain, isVerified: true };
                    localStorage.setItem('auth_captain', JSON.stringify(updatedCaptain));
                    return { ...prev, captain: updatedCaptain };
                }
                return prev;
            });
        };

        const handleNewCaptainNotification = async (data) => {
            console.log('Real-time new captain notification received:', data);
            const { toast } = await import('react-hot-toast');
            toast(data.notification?.title || 'New Notification', {
                icon: '🔔',
                style: { borderRadius: '12px', background: '#000', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
            });
        };

        const handleAdminNotification = async (data) => {
            console.log('Real-time admin notification received:', data);
            const { toast } = await import('react-hot-toast');

            // Special styling for high priority or SOS alerts
            const isSOS = data.priority === 'high' || data.type === 'SOS';

            toast.error(data.title, {
                icon: isSOS ? '🚨' : '🛡️',
                duration: isSOS ? 10000 : 5000,
                style: {
                    borderRadius: '16px',
                    background: isSOS ? '#ef4444' : '#000',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: '900',
                    border: isSOS ? '2px solid white' : 'none',
                    boxShadow: isSOS ? '0 0 20px rgba(239, 68, 68, 0.5)' : 'none'
                }
            });

            // Refresh dashboard or bookings if needed by emitting a local event or re-fetching
            // For now, the toast is enough for high visibility
        };

        socketService.on('booking_status_updated', handleBookingUpdate);
        socketService.on('captain_verified', handleCaptainVerified);
        socketService.on('new_captain_notification', handleNewCaptainNotification);
        socketService.on('admin_notification', handleAdminNotification);

        return () => {
            socketService.off('booking_status_updated', handleBookingUpdate);
            socketService.off('captain_verified', handleCaptainVerified);
            socketService.off('new_captain_notification', handleNewCaptainNotification);
            socketService.off('admin_notification', handleAdminNotification);
        };
    }, [sessions, bookings]);






    const adminLogout = useCallback(async () => {
        adminAPI.setToken(null);
        logout('admin');
        return { success: true };
    }, [logout]);

    const vendorLogout = useCallback(async () => {
        vendorAPI.setToken(null);
        logout('vendor');
        return { success: true };
    }, [logout]);

    const staffLogout = useCallback(async () => {
        staffAPI.setToken(null);
        logout('staff');
        return { success: true };
    }, [logout]);

    // Legacy support placeholders
    const validateCredentials = () => null;
    const register = () => true;


    // Admin API-based methods
    const adminLogin = useCallback(async (email, password) => {
        try {
            const response = await adminAPI.login(email, password);
            const token = response.token || response.data?.token;
            const adminData = response.data?.admin || response.admin || response.data;

            if (token) {
                adminAPI.setToken(token);
            }

            const userSession = {
                id: adminData._id,
                name: adminData.name,
                email: adminData.email,
                role: 'admin',
                token,
                ...adminData
            };

            login('admin', userSession);
            return { success: true, data: userSession };
        } catch (error) {
            console.error('Admin Login error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    // Vendor API-based methods
    const vendorLogin = useCallback(async (email, password) => {
        try {
            const response = await vendorAPI.login(email, password);
            const token = response.token || response.data?.token;
            const vendorData = response.data?.vendor || response.vendor || response.data;

            if (token) {
                vendorAPI.setToken(token);
            }

            const userSession = {
                id: vendorData._id,
                name: vendorData.name,
                email: vendorData.email,
                role: 'vendor',
                token,
                ...vendorData
            };

            login('vendor', userSession);
            return { success: true, data: userSession };
        } catch (error) {
            console.error('Vendor Login error:', error);
            return { success: false, error: error.message };
        }
    }, [login]);

    const vendorSignup = useCallback(async (userData) => {
        try {
            const response = await vendorAPI.signup(userData);
            const token = response.token || response.data?.token;
            const vendorData = response.data?.vendor || response.vendor || response.data;

            if (token) {
                vendorAPI.setToken(token);
            }

            const userSession = {
                id: vendorData._id,
                name: vendorData.name,
                email: vendorData.email,
                role: 'vendor',
                token,
                ...vendorData
            };

            login('vendor', userSession);
            return { success: true, data: userSession };
        } catch (error) {
            console.error('Vendor Signup error:', error);
            return { success: false, error: error.message };
        }
    }, [login]);

    const vendorSendOTP = useCallback(async (phone) => {
        try {
            const response = await vendorAPI.sendOTP(phone);
            return { success: true, data: response };
        } catch (error) {
            console.error('Vendor Send OTP error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const vendorGetProfile = useCallback(async () => {
        try {
            const response = await vendorAPI.getProfile();
            const vendorData = response.data?.vendor || response.vendor || response.data;

            setSessions(prev => {
                const currentSession = prev.vendor;
                if (currentSession) {
                    const updatedSession = { ...currentSession, ...vendorData };
                    localStorage.setItem(SESSION_KEYS.vendor, JSON.stringify(updatedSession));
                    return { ...prev, vendor: updatedSession };
                }
                return prev;
            });

            return { success: true, data: vendorData };
        } catch (error) {
            console.error('Vendor Get Profile error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    // Captain API-based methods
    const captainSignup = useCallback(async (userData) => {
        try {
            const response = await captainAPI.signup(userData);
            const token = response.token || response.data?.token;
            const captainData = response.data?.captain || response.captain || response.data;

            if (token) {
                captainAPI.setToken(token);
            }

            const userSession = {
                id: captainData._id,
                name: captainData.name,
                email: captainData.email,
                phone: captainData.phone,
                role: 'captain',
                token,
                ...captainData
            };

            login('captain', userSession);
            return { success: true, data: userSession };
        } catch (error) {
            console.error('Captain Signup error:', error);
            return { success: false, error: error.message };
        }
    }, [login]);

    const captainLogin = useCallback(async (phone, password) => {
        try {
            const response = await captainAPI.login(phone, password);
            const token = response.token || response.data?.token;
            const captainData = response.data?.captain || response.captain || response.data;

            if (token) {
                captainAPI.setToken(token);
            }

            const userSession = {
                id: captainData._id,
                name: captainData.name,
                email: captainData.email,
                phone: captainData.phone,
                role: 'captain',
                token,
                ...captainData
            };

            login('captain', userSession);
            return { success: true, data: userSession };
        } catch (error) {
            console.error('Captain Login error:', error);
            return { success: false, error: error.message };
        }
    }, [login]);

    // Staff API-based methods
    const staffSendOTP = useCallback(async (phone) => {
        try {
            const response = await staffAPI.sendOTP(phone);
            return { success: true, data: response };
        } catch (error) {
            console.error('Staff Send OTP error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const staffLogin = useCallback(async (phone, otp) => {
        try {
            const response = await staffAPI.login(phone, otp);
            const token = response.token || response.data?.token;
            const user = response?.data?.user || response?.user || response;

            if (!user || !user._id) {
                return { success: false, error: 'Auth failed: User not found' };
            }

            const userSession = {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: 'staff',
                vendorId: user.profile?.vendorId || null,
                token,
                ...user
            };

            login('staff', userSession);
            return { success: true, data: userSession };
        } catch (error) {
            console.error('Staff Login error:', error);
            return { success: false, error: error.message };
        }
    }, [login]);




    const updateBalance = useCallback((amountToAdd) => {
        setWalletBalance(prev => prev + amountToAdd);
    }, []);

    const assignStaffToBooking = useCallback((bookingId, staffId, role = 'pickup', vendorId = null) => {
        setBookings(prev => prev.map(b =>
            b.id === bookingId ? {
                ...b,
                staffId: staffId,
                [`${role}StaffId`]: staffId,
                status: role === 'pickup' ? 'confirmed' : 'delivery',
                vendorId: vendorId || b.vendorId
            } : b
        ));
    }, []);


    const addTrustedContact = useCallback((contact) => setTrustedContacts(prev => [...prev, { ...contact, id: Date.now() }]), []);
    const removeTrustedContact = useCallback((id) => setTrustedContacts(prev => prev.filter(c => c.id !== id)), []);

    // Notification functions (placeholder for future implementation)
    const [notifications, setNotifications] = useState([]);
    const markNotificationRead = useCallback((id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);
    const markAllNotificationsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const deleteUser = useCallback((role, userId) => {
        // Replaced by backend user management
        console.warn('deleteUser deprecated');
    }, []);

    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const loadStats = useCallback(async () => {
        if (!sessions.consumer) return;
        try {
            setStatsLoading(true);
            const response = await apiClient.getStats();
            setStats(response.data.stats);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, [sessions.consumer]);

    useEffect(() => {
        if (sessions.consumer?.token) {
            loadStats();
        }
    }, [sessions.consumer?.token, loadStats]);


    const updateUser = useCallback((role, userId, updatedData) => {
        setSessions(prev => {
            const currentSession = prev[role];
            if (currentSession && currentSession.id === userId) {
                const updatedSession = { ...currentSession, ...updatedData };
                localStorage.setItem(SESSION_KEYS[role], JSON.stringify(updatedSession));
                return { ...prev, [role]: updatedSession };
            }
            return prev;
        });
    }, []);

    // Global unauthorized handler
    useEffect(() => {
        console.log('AuthContext: Attaching auth:unauthorized listener');
        const handleUnauthorized = () => {
            console.error('AuthContext: auth:unauthorized event caught! Logging out...');
            Object.keys(SESSION_KEYS).forEach(role => logout(role));
            // Optional: redirect to login
            window.location.href = '/login';
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => {
            console.log('AuthContext: Removing auth:unauthorized listener');
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, [logout]);

    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            login,
            logout,
            getUser,
            validateCredentials,
            register,
            deleteUser,
            updateUser,
            sessions,
            setSessions,
            user: sessions.consumer,
            stats,
            statsLoading,
            loadStats,
            bookings,
            addBooking,
            updateBookingStatus,
            productOrders,
            productOrdersLoading,
            loadProductOrders,
            addProductOrder,
            verifyProductOrderPayment,
            assignStaffToBooking,
            vehicles,
            vehiclesLoading,
            addVehicle,
            updateVehicle,
            removeVehicle,
            setPrimaryVehicle,
            globalCatalog,
            catalogLoading,
            loadGlobalCatalog,
            trustedContacts,
            addTrustedContact,
            removeTrustedContact,
            userSubscription,
            walletBalance,
            lastRealTimeAlert,
            setLastRealTimeAlert,
            updateBalance,
            loadWallet,
            addToWallet,
            notifications,
            markNotificationRead,
            markAllNotificationsRead,
            // Payment methods
            getRazorpayKey,
            createPaymentOrder,
            verifyPayment,

            adminLogin,
            adminLogout,
            vendorLogin,
            vendorLogout,
            vendorSignup,
            vendorSendOTP,
            vendorGetProfile,
            captainSignup,
            captainLogin,
            staffLogin,
            staffLogout,
            staffSendOTP,
            sendOTP,
            verifyOTP,
            apiLogin,
            apiSignup,
            apiLogout,
            setUserSubscription,
            isBlackPassMember,
            loadTrustedContacts,
            addContact,
            removeContact,
            trustedContactsLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
