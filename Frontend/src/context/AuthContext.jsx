import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import apiClient, { authAPI, walletAPI, paymentAPI } from '../utils/api';
import captainAPI from '../utils/captainApi';

// Each panel stores its session under a separate key
const SESSION_KEYS = {
    consumer: 'auth_consumer',
    admin: 'auth_admin',
    captain: 'auth_captain',
    vendor: 'auth_vendor',
    staff: 'auth_staff',
};

// Mock credentials (replace with real API later)
const MOCK_CREDENTIALS = {
    admin: { id: 'ADM001', email: 'admin@carwash.in', password: 'admin123' },
    captain: { id: 'CPT001', phone: '9999999999', password: 'captain123' },
    vendor: { id: 'VND001', email: 'vendor@carwash.in', password: 'vendor123' },
    staff: { id: 'STF001', phone: '8888888888', password: 'staff123', vendorId: 'VND001' },
    // consumer uses OTP — no password needed
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Track registered users from localStorage
    const [registeredUsers, setRegisteredUsers] = useState(() => {
        const DEFAULT = { consumer: [], captain: [], vendor: [], staff: [] };
        try {
            const saved = localStorage.getItem('carwash_registered_users');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults so all keys always exist even with old cached data
                return { ...DEFAULT, ...parsed };
            }

            // Initial Seed Data for Demo
            return {
                consumer: [],
                captain: [],
                vendor: [
                    {
                        id: 'VND-DEMO-01',
                        name: 'Aryan Pathak',
                        email: 'vendor@carwash.in',
                        password: 'vendor123',
                        studioName: 'Premium Shine Studio',
                        phone: '9876543210',
                        city: 'Mumbai',
                        role: 'vendor',
                        verificationStatus: 'pending',
                        registeredAt: new Date().toISOString(),
                        idProof: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800&q=80'
                    }
                ],
                staff: []
            };
        } catch {
            return DEFAULT;
        }
    });

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

    // Captain-specific backend integration
    const [captainJobs, setCaptainJobs] = useState([]);
    const [captainJobsLoading, setCaptainJobsLoading] = useState(false);
    const [captainEarnings, setCaptainEarnings] = useState({ balance: 0, totalEarned: 0, jobs: [] });
    const [captainEarningsLoading, setCaptainEarningsLoading] = useState(false);

    // Load captain jobs when captain logs in
    useEffect(() => {
        if (sessions.captain && sessions.captain.id) {
            loadCaptainJobs();
            loadCaptainEarnings();
        }
    }, [sessions.captain]);

    const loadCaptainJobs = useCallback(async () => {
        if (!sessions.captain) return;
        try {
            setCaptainJobsLoading(true);
            const response = await captainAPI.getMyJobs();
            setCaptainJobs(response.data.jobs || []);
        } catch (error) {
            console.error('Failed to load captain jobs:', error);
        } finally {
            setCaptainJobsLoading(false);
        }
    }, [sessions.captain]);

    const loadCaptainEarnings = useCallback(async () => {
        if (!sessions.captain) return;
        try {
            setCaptainEarningsLoading(true);
            const response = await captainAPI.getEarnings();
            setCaptainEarnings(response.data || { balance: 0, totalEarned: 0, jobs: [] });
        } catch (error) {
            console.error('Failed to load captain earnings:', error);
        } finally {
            setCaptainEarningsLoading(false);
        }
    }, [sessions.captain]);

    const acceptJob = useCallback(async (jobId) => {
        try {
            const response = await captainAPI.acceptJob(jobId);
            setCaptainJobs(prev => prev.map(job =>
                job.id === jobId ? { ...job, status: 'accepted' } : job
            ));
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Failed to accept job:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const updateJobStatus = useCallback(async (jobId, status) => {
        try {
            const response = await captainAPI.updateJobStatus(jobId, { status });
            setCaptainJobs(prev => prev.map(job =>
                job.id === jobId ? { ...job, status, ...response.data.job } : job
            ));
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Failed to update job status:', error);
            return { success: false, error: error.message };
        }
    }, []);

    // Vehicle management with backend integration
    const [vehicles, setVehicles] = useState([
        {
            id: 'demo-vehicle-1',
            _id: 'demo-vehicle-1',
            brand: 'Maruti Suzuki',
            model: 'Baleno',
            type: 'Sedan',
            plate: 'DEMO-1234',
            isPrimary: true,
            img: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400&q=80'
        }
    ]);
    const [vehiclesLoading, setVehiclesLoading] = useState(false);

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
            return { success: false, error: error.message };
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
            return { success: false, error: error.message };
        }
    }, []);

    // Track addresses from localStorage (temporary - will be migrated to backend)
    const [addresses, setAddresses] = useState(() => {
        try {
            const saved = localStorage.getItem('carwash_addresses');
            const initial = [
                { id: 1, label: 'Home', address: 'HSR Layout, Sector 2, Bengaluru', isPrimary: true, userId: 'GUEST' }
            ];
            return saved ? JSON.parse(saved) : initial;
        } catch { return []; }
    });

    // Track trusted contacts from localStorage
    const [trustedContacts, setTrustedContacts] = useState(() => {
        try {
            const saved = localStorage.getItem('carwash_trusted_contacts');
            return saved ? JSON.parse(saved) : [
                { id: 1, name: 'Aryan Pathak (Self)', phone: '9876543210', relation: 'Brother', userId: 'GUEST' }
            ];
        } catch { return []; }
    });
    // Booking management with backend integration
    const [bookings, setBookings] = useState(() => {
        try {
            const saved = localStorage.getItem('carwash_bookings');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [bookingsLoading, setBookingsLoading] = useState(false);

    // Save bookings locally whenever they change
    useEffect(() => {
        localStorage.setItem('carwash_bookings', JSON.stringify(bookings));
    }, [bookings]);

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
            // Development fallback for bookings
            if (import.meta.env.DEV && error.message?.includes('500')) {
                console.warn('Backend returned 500 for bookings, using local data.');
                return;
            }
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

    // Track user subscription
    const [userSubscription, setUserSubscription] = useState(() => {
        try {
            const saved = localStorage.getItem('carwash_subscription');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    // Wallet management with backend integration
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletLoading, setWalletLoading] = useState(false);

    // Load wallet from backend when user logs in
    useEffect(() => {
        if (sessions.consumer && sessions.consumer.id) {
            loadWallet();
        }
    }, [sessions.consumer]);

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
            // Fallback for development if backend is partially failing
            if (import.meta.env.DEV && error.message?.includes('500')) {
                console.warn('Backend returned 500 for wallet, using fallback for dev.');
                setWalletBalance(2450); // Dummy dev balance
                return;
            }
            // Don't show error for unauthorized requests
            if (error.response?.status !== 401) {
                console.error('Failed to load wallet:', error);
            }
        } finally {
            setWalletLoading(false);
        }
    }, [sessions.consumer]);

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

    const verifyPayment = useCallback(async (orderId, paymentId, signature) => {
        try {
            const response = await paymentAPI.verifyPayment(orderId, paymentId, signature);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Verify payment error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    // Persist data to localStorage
    useEffect(() => {
        localStorage.setItem('carwash_registered_users', JSON.stringify(registeredUsers));
    }, [registeredUsers]);

    // Bookings are now managed by backend - no localStorage needed

    useEffect(() => {
        localStorage.setItem('carwash_trusted_contacts', JSON.stringify(trustedContacts));
    }, [trustedContacts]);

    useEffect(() => {
        localStorage.setItem('carwash_subscription', JSON.stringify(userSubscription));
    }, [userSubscription]);

    // Wallet is now managed by backend - no localStorage needed

    // Cross-tab synchronization
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'carwash_bookings' && e.newValue) {
                setBookings(JSON.parse(e.newValue));
            }
            if (e.key === 'carwash_registered_users' && e.newValue) {
                setRegisteredUsers(JSON.parse(e.newValue));
            }
            if (SESSION_KEYS[e.key] || Object.values(SESSION_KEYS).includes(e.key) || e.key === 'carwash_registered_users') {
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

    // Effect to sync logged-in session data with master registeredUsers list
    useEffect(() => {
        Object.entries(sessions).forEach(([role, sessionUser]) => {
            if (sessionUser && sessionUser.id) {
                const masterUser = (registeredUsers[role] || []).find(u => u.id === sessionUser.id);
                if (masterUser) {
                    const hasChanges = Object.keys(masterUser).some(key => masterUser[key] !== sessionUser[key]);
                    if (hasChanges) {
                        const updatedSession = { ...sessionUser, ...masterUser };
                        localStorage.setItem(SESSION_KEYS[role], JSON.stringify(updatedSession));
                        setSessions(prev => ({ ...prev, [role]: updatedSession }));
                    }
                }
            }
        });
    }, [registeredUsers, sessions]);

    const isLoggedIn = useCallback((role) => !!sessions[role], [sessions]);

    const login = useCallback((role, userData) => {
        const data = { ...userData, loggedInAt: Date.now() };
        localStorage.setItem(SESSION_KEYS[role], JSON.stringify(data));
        setSessions(prev => ({ ...prev, [role]: data }));
        return true;
    }, []);

    const logout = useCallback((role) => {
        localStorage.removeItem(SESSION_KEYS[role]);
        setSessions(prev => ({ ...prev, [role]: null }));
    }, []);

    const getUser = useCallback((role) => sessions[role], [sessions]);

    // Validate mock or registered credentials
    const validateCredentials = useCallback((role, creds) => {
        const users = registeredUsers[role] || [];
        const inputEmail = (creds.email || '').toLowerCase().trim();
        const inputPhone = (creds.phone || '').trim();
        const inputPassword = (creds.password || '').trim();

        const registeredUser = users.find(u => {
            if (u.email && u.email.toLowerCase().trim() === inputEmail) return u.password === inputPassword;
            if (u.phone && u.phone.trim() === inputPhone) return u.password === inputPassword;
            return false;
        });

        if (registeredUser) return registeredUser;

        const mock = MOCK_CREDENTIALS[role];
        if (mock) {
            const mockEmailMatch = mock.email && (inputEmail === mock.email.toLowerCase() || (role === 'admin' && inputEmail === 'admin'));
            const mockPhoneMatch = mock.phone && inputPhone === mock.phone;
            const mockPassMatch = inputPassword === mock.password;

            if ((mockEmailMatch || mockPhoneMatch) && mockPassMatch) {
                return { ...mock, role, name: role.charAt(0).toUpperCase() + role.slice(1) };
            }
        }

        return null;
    }, [registeredUsers]);

    const register = useCallback((role, userData) => {
        setRegisteredUsers(prev => ({
            ...prev,
            [role]: [...(prev[role] || []), userData]
        }));
        return true;
    }, []);

    // Captain API-based authentication methods
    const captainSendOTP = useCallback(async (phone, userData = null) => {
        try {
            const response = await captainAPI.sendOTP(phone, userData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Captain Send OTP error:', error);
            // Development fallback for any backend error (offline, 500, etc)
            console.log('Simulating Captain OTP send (1234) due to:', error.message);
            return { success: true, data: { message: 'OTP sent (Development Mode)', otp: '1234' } };
        }
    }, []);

    const captainVerifyOTP = useCallback(async (phone, otp, options = {}) => {
        try {
            const { userData = null, isSignup = false } = options;
            const response = await captainAPI.verifyOTP(phone, otp, { isSignup, userData });
            const { captain, token } = response.data;

            if (token) {
                apiClient.setToken(token);
            }

            const sessionData = {
                id: captain._id,
                name: captain.name,
                email: captain.email,
                phone: captain.phone,
                role: 'captain',
                ...captain
            };

            login('captain', sessionData);
            return { success: true, data: { captain: sessionData, token } };
        } catch (error) {
            console.error('Captain Verify OTP error:', error);
            // Universal development fallback for OTP 1234
            if (otp === '1234') {
                console.log('Simulating Captain verification (1234) due to:', error.message);
                const mockCaptain = {
                    _id: 'test-cap-' + Date.now(),
                    name: 'Test Captain',
                    phone: phone,
                    role: 'captain',
                    status: 'active'
                };
                login('captain', mockCaptain);
                return { success: true, data: { captain: mockCaptain, token: 'mock-cap-token' } };
            }
            return { success: false, error: error.message };
        }
    }, []);

    const captainLogin = useCallback(async (phone, password) => {
        try {
            const response = await captainAPI.login(phone, password);
            const { captain, token } = response.data;

            if (token) {
                apiClient.setToken(token);
            }

            const sessionData = {
                id: captain._id,
                name: captain.name,
                email: captain.email,
                phone: captain.phone,
                role: 'captain',
                ...captain
            };

            login('captain', sessionData);
            return { success: true, data: { captain: sessionData, token } };
        } catch (error) {
            console.error('Captain Login error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const captainLogout = useCallback(async () => {
        try {
            await captainAPI.logout();
            apiClient.setToken(null);
            logout('captain');
            return { success: true };
        } catch (error) {
            console.error('Captain Logout error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const captainGetProfile = useCallback(async () => {
        try {
            const response = await captainAPI.getProfile();
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Captain Get Profile error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const captainUpdateProfile = useCallback(async (profileData) => {
        try {
            const response = await captainAPI.updateProfile(profileData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Captain Update Profile error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    // API-based authentication methods
    const sendOTP = useCallback(async (identifier, type = 'phone', userData = null) => {
        try {
            const response = await authAPI.sendOTP(identifier, type, userData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Send OTP error:', error);
            // Development fallback for any backend error (offline, 500, etc)
            console.log('Simulating Consumer OTP send (1234) due to:', error.message);
            return { success: true, data: { message: 'OTP sent (Development Mode)', otp: '1234' } };
        }
    }, []);

    // Login = verify only (no data stored). Signup = verify + userData stored on backend.
    const verifyOTP = useCallback(async (identifier, otp, type = 'phone', options = {}) => {
        try {
            const { isSignup = false, userData: signupUserData = null } = options;
            const response = await authAPI.verifyOTP(identifier, otp, type, { isSignup, userData: signupUserData });
            const { consumer, token } = response.data;

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
            console.error('Verify OTP error:', error);
            // Universal development fallback for OTP 1234
            if (otp === '1234') {
                console.log('Simulating Consumer verification (1234) due to:', error.message);
                const mockUser = {
                    _id: 'dev-user-' + Date.now(),
                    id: 'dev-user-' + Date.now(),
                    name: 'Developer Mode',
                    email: type === 'email' ? identifier : `dev@clean2wash.in`,
                    phone: type === 'phone' ? identifier : '1234567890',
                    role: 'consumer'
                };

                login('consumer', mockUser);
                return { success: true, data: { consumer: mockUser, token: 'dev-mock-token' } };
            }
            return { success: false, error: error.message };
        }
    }, []);

    const apiLogin = useCallback(async (identifier, password) => {
        try {
            const response = await authAPI.login(identifier, password);
            const { consumer, token } = response.data;

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
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const apiSignup = useCallback(async (userData) => {
        try {
            const response = await authAPI.signup(userData);
            const { consumer, token } = response.data;

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
            register('consumer', userSession);
            return { success: true, data: { consumer: userSession, token } };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }
    }, [register]);

    const apiLogout = useCallback(async (role) => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        apiClient.setToken(null);
        logout(role);
    }, [logout]);

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


    const addAddress = useCallback((a) => setAddresses(prev => [...prev, a]), []);
    const removeAddress = useCallback((id) => setAddresses(prev => prev.filter(a => a.id !== id)), []);
    const setPrimaryAddress = useCallback((id) => setAddresses(prev => prev.map(a => ({ ...a, isPrimary: a.id === id }))), []);

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
        setRegisteredUsers(prev => ({
            ...prev,
            [role]: prev[role].filter(u => u.id !== userId)
        }));
    }, []);

    const updateUser = useCallback((role, userId, updatedData) => {
        setRegisteredUsers(prev => ({
            ...prev,
            [role]: prev[role].map(u => u.id === userId ? { ...u, ...updatedData } : u)
        }));

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
            bookings,
            addBooking,
            updateBookingStatus,
            assignStaffToBooking,
            vehicles,
            addVehicle,
            removeVehicle,
            setPrimaryVehicle,
            addresses,
            addAddress,
            removeAddress,
            setPrimaryAddress,
            trustedContacts,
            addTrustedContact,
            removeTrustedContact,
            userSubscription,
            walletBalance,
            addToWallet,
            notifications,
            markNotificationRead,
            markAllNotificationsRead,
            // Payment methods
            getRazorpayKey,
            createPaymentOrder,
            verifyPayment,
            // Captain-specific
            captainJobs,
            captainJobsLoading,
            captainEarnings,
            captainEarningsLoading,
            loadCaptainJobs,
            loadCaptainEarnings,
            acceptJob,
            updateJobStatus,
            // API methods
            sendOTP,
            verifyOTP,
            apiLogin,
            apiSignup,
            captainSendOTP,
            captainVerifyOTP,
            captainLogin,
            captainLogout,
            captainGetProfile,
            captainUpdateProfile
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
