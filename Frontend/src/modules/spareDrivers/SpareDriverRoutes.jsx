/**
 * SpareDriverRoutes.jsx
 *
 * ── SELF-CONTAINED ROUTING FOR THE SPARE DRIVER MODULE ──
 * This file owns all /spare-driver/* routes.
 * It does NOT use consumer's AuthContext or ProtectedRoute.
 * App.jsx only needs: <Route path="/spare-driver/*" element={<SpareDriverRoutes />} />
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ─── Spare Driver Pages (internal to this module) ───
import DriverRegistration from './pages/DriverRegistration';
import DriverDashboard from './pages/DriverDashboard';
import DriverBookings from './pages/DriverBookings';
import DriverEarnings from './pages/DriverEarnings';

// ─── Consumer-facing booking pages that relate to spare drivers ───
// These pages are used BY consumers to book a driver, so they stay
// in the consumer module but are referenced here for clarity.
import SpareDriverBooking from '../consumer/pages/SpareDriverBooking';
import SpareDriverHistory from '../consumer/pages/SpareDriverHistory';
import SpareDriverSupport from '../consumer/pages/SpareDriverSupport';
import MonthlySpareDriver from '../consumer/pages/MonthlySpareDriver';

// ─── Internal Guard: checks chauffeur_token (NOT consumer JWT) ───
const DriverProtect = ({ children }) => {
    const token = localStorage.getItem('chauffeur_token');
    if (!token) return <Navigate to="/spare-driver/register" replace />;
    return children;
};

const SpareDriverRoutes = () => {
    return (
        <Routes>
            {/* ── Public Routes ── */}
            <Route path="register" element={<DriverRegistration />} />

            {/* ── Driver Panel (requires chauffeur_token) ── */}
            <Route path="dashboard" element={<DriverProtect><DriverDashboard /></DriverProtect>} />
            <Route path="bookings" element={<DriverProtect><DriverBookings /></DriverProtect>} />
            <Route path="earnings" element={<DriverProtect><DriverEarnings /></DriverProtect>} />
            <Route path="profile" element={<DriverProtect><DriverDashboard /></DriverProtect>} />

            {/* ── Consumer-facing Spare Driver pages ── */}
            <Route path="" element={<SpareDriverBooking />} />
            <Route path="history" element={<SpareDriverHistory />} />
            <Route path="support" element={<SpareDriverSupport />} />
            <Route path="monthly" element={<MonthlySpareDriver />} />

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/spare-driver/register" replace />} />
        </Routes>
    );
};

export default SpareDriverRoutes;
