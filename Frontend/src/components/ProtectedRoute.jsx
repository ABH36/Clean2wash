import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LOGIN_PATHS = {
    consumer: '/login',
    admin: '/admin/login',
    captain: '/captain/login',
    vendor: '/vendor/login',
    staff: '/staff/login',
};

/**
 * Wraps a route so only logged-in users of the given role can access it.
 * Unauthorized users are redirected to the appropriate login page.
 */
const ProtectedRoute = ({ role, children }) => {
    const { isLoggedIn } = useAuth();
    const location = useLocation();

    if (!isLoggedIn(role)) {
        return (
            <Navigate
                to={LOGIN_PATHS[role]}
                state={{ from: location.pathname }}
                replace
            />
        );
    }

    return children;
};

export default ProtectedRoute;
