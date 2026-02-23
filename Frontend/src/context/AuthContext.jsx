import React, { createContext, useContext, useState, useCallback } from 'react';

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
        setRegisteredUsers(prev => {
            const updated = {
                ...prev,
                [role]: [...(prev[role] || []), userData]
            };
            localStorage.setItem('hoora_registered_users', JSON.stringify(updated));
            return updated;
        });
        return true;
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout, getUser, validateCredentials, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
