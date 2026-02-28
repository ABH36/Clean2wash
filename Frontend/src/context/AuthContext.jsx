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
        try {
            const saved = localStorage.getItem('carwash_registered_users');
            if (saved) return JSON.parse(saved);

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
            return { consumer: [], captain: [], vendor: [], staff: [] };
        }
    });

    // Track vehicles from localStorage
    const [vehicles, setVehicles] = useState(() => {
        try {
            const saved = localStorage.getItem('carwash_vehicles');
            const initial = [
                { id: 1, brand: 'Honda', model: 'City', type: 'Sedan', color: '#3498db', plate: 'KA 05 MR 7821', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', isPrimary: true, userId: 'GUEST' }
            ];
            return saved ? JSON.parse(saved) : initial;
        } catch { return []; }
    });

    // Track addresses from localStorage
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
    const [bookings, setBookings] = useState(() => {
        try {
            const saved = localStorage.getItem('carwash_bookings');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Track user subscription
    const [userSubscription, setUserSubscription] = useState(() => {
        try {
            const saved = localStorage.getItem('carwash_subscription');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
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
        localStorage.setItem('carwash_registered_users', JSON.stringify(registeredUsers));
    }, [registeredUsers]);

    useEffect(() => {
        localStorage.setItem('carwash_bookings', JSON.stringify(bookings));
    }, [bookings]);

    useEffect(() => {
        localStorage.setItem('carwash_vehicles', JSON.stringify(vehicles));
    }, [vehicles]);

    useEffect(() => {
        localStorage.setItem('carwash_trusted_contacts', JSON.stringify(trustedContacts));
    }, [trustedContacts]);

    useEffect(() => {
        localStorage.setItem('carwash_subscription', JSON.stringify(userSubscription));
    }, [userSubscription]);

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

    const addBooking = useCallback((bookingData) => {
        const newBooking = {
            ...bookingData,
            id: 'CARWASH-' + Math.floor(1000 + Math.random() * 9000),
            status: 'CREATED',
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

    const addVehicle = useCallback((v) => setVehicles(prev => [...prev, v]), []);
    const removeVehicle = useCallback((id) => setVehicles(prev => prev.filter(v => v.id !== id)), []);
    const setPrimaryVehicle = useCallback((id) => setVehicles(prev => prev.map(v => ({ ...v, isPrimary: v.id === id }))), []);

    const addAddress = useCallback((a) => setAddresses(prev => [...prev, a]), []);
    const removeAddress = useCallback((id) => setAddresses(prev => prev.filter(a => a.id !== id)), []);
    const setPrimaryAddress = useCallback((id) => setAddresses(prev => prev.map(a => ({ ...a, isPrimary: a.id === id }))), []);

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
            registeredUsers,
            trustedContacts,
            addContact: (c) => setTrustedContacts(prev => [...prev, { ...c, id: Date.now() }]),
            removeContact: (id) => setTrustedContacts(prev => prev.filter(c => c.id !== id)),
            userSubscription,
            setUserSubscription
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
