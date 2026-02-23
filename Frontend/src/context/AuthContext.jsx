import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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
    admin: { email: 'admin@hoora.in', password: 'admin123' },
    captain: { phone: '9999999999', password: 'captain123' },
    vendor: { email: 'vendor@hoora.in', password: 'vendor123' },
    staff: { phone: '8888888888', password: 'staff123' },
    // consumer uses OTP — no password needed
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Track registered users from localStorage
    const [registeredUsers, setRegisteredUsers] = useState(() => {
        try {
            const saved = localStorage.getItem('hoora_registered_users');
            return saved ? JSON.parse(saved) : { consumer: [], captain: [], vendor: [], staff: [] };
        } catch {
            return { consumer: [], captain: [], vendor: [], staff: [] };
        }
    });

    // Track vehicles from localStorage
    const [vehicles, setVehicles] = useState(() => {
        try {
            const saved = localStorage.getItem('hoora_vehicles');
            const initial = [
                { id: 1, brand: 'Honda', model: 'City', type: 'Sedan', color: '#3498db', plate: 'KA 05 MR 7821', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', isPrimary: true, userId: 'GUEST' }
            ];
            return saved ? JSON.parse(saved) : initial;
        } catch { return []; }
    });

    // Track addresses from localStorage
    const [addresses, setAddresses] = useState(() => {
        try {
            const saved = localStorage.getItem('hoora_addresses');
            const initial = [
                { id: 1, label: 'Home', address: 'HSR Layout, Sector 2, Bengaluru', isPrimary: true, userId: 'GUEST' }
            ];
            return saved ? JSON.parse(saved) : initial;
        } catch { return []; }
    });



    // Track bookings from localStorage
    const [bookings, setBookings] = useState(() => {
        try {
            const saved = localStorage.getItem('hoora_bookings');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Initialize state from localStorage
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

    // Persist data to localStorage
    useEffect(() => {
        localStorage.setItem('hoora_registered_users', JSON.stringify(registeredUsers));
    }, [registeredUsers]);

    useEffect(() => {
        localStorage.setItem('hoora_bookings', JSON.stringify(bookings));
    }, [bookings]);

    useEffect(() => {
        localStorage.setItem('hoora_vehicles', JSON.stringify(vehicles));
    }, [vehicles]);

    useEffect(() => {
        localStorage.setItem('hoora_addresses', JSON.stringify(addresses));
    }, [addresses]);



    // Cross-tab synchronization
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'hoora_bookings' && e.newValue) {
                setBookings(JSON.parse(e.newValue));
            }
            if (SESSION_KEYS[e.key] || Object.values(SESSION_KEYS).includes(e.key)) {
                // Refresh sessions if auth changes in another tab
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
        // 1. Check Registered Users first
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

        // 2. Check Mock Credentials (Fallback)
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

    const addBooking = useCallback((bookingData) => {
        const newBooking = {
            ...bookingData,
            id: 'HOORA-' + Math.floor(1000 + Math.random() * 9000),
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        setBookings(prev => [newBooking, ...prev]);
        return newBooking;
    }, []);

    const updateBookingStatus = useCallback((bookingId, status, extraData = {}) => {
        setBookings(prev => prev.map(b =>
            b.id === bookingId ? {
                ...b,
                status,
                ...extraData
            } : b
        ));
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

    // Vehicle Helpers
    const addVehicle = useCallback((v) => setVehicles(prev => [...prev, v]), []);
    const removeVehicle = useCallback((id) => setVehicles(prev => prev.filter(v => v.id !== id)), []);
    const setPrimaryVehicle = useCallback((id) => setVehicles(prev => prev.map(v => ({ ...v, isPrimary: v.id === id }))), []);

    // Address Helpers
    const addAddress = useCallback((a) => setAddresses(prev => [...prev, a]), []);
    const removeAddress = useCallback((id) => setAddresses(prev => prev.filter(a => a.id !== id)), []);
    const setPrimaryAddress = useCallback((id) => setAddresses(prev => prev.map(a => ({ ...a, isPrimary: a.id === id }))), []);



    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            login,
            logout,
            getUser,
            validateCredentials,
            register,
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
            registeredUsers
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
