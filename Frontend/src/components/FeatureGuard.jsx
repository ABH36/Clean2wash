import React from 'react';
import { Navigate } from 'react-router-dom';
import { isFeatureEnabled } from '../utils/platformConfig';
import { useAuth } from '../context/AuthContext';

/**
 * FeatureGuard Component
 * Protects routes based on feature flags AND user permissions.
 */
const FeatureGuard = ({ feature, children, fallback = '/admin', requiredRoles = [] }) => {
    const { getUser } = useAuth();
    const adminUser = getUser('admin');

    // 1. Check Platform Feature Flag (Global)
    if (!isFeatureEnabled(feature)) {
        console.warn(`[GUARD] Feature "${feature}" is disabled globally.`);
        return <Navigate to={fallback} replace />;
    }

    // 2. Check User Role (if requiredRoles provided)
    if (requiredRoles.length > 0 && adminUser) {
        if (!requiredRoles.includes(adminUser.role)) {
            console.warn(`[GUARD] Access Denied for role: ${adminUser.role} on feature: ${feature}`);
            return <Navigate to={fallback} replace />;
        }
    }

    // 3. Admin-only check (generic for all admin routes)
    if (!adminUser) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default FeatureGuard;
