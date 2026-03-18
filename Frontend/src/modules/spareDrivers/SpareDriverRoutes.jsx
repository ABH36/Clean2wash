/**
 * SpareDriverRoutes.jsx
 *
 * ── SELF-CONTAINED ROUTING FOR THE SPARE DRIVER MODULE ──
 * This file owns all /spare-driver/* routes.
 * It does NOT use consumer's AuthContext or ProtectedRoute.
 * App.jsx only needs: <Route path="/spare-driver/*" element={<SpareDriverRoutes />} />
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ─── Spare Driver Pages (internal to this module) ───
const DriverRegistration = lazy(() => import('./pages/DriverRegistration'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const DriverBookings = lazy(() => import('./pages/DriverBookings'));
const DriverEarnings = lazy(() => import('./pages/DriverEarnings'));

// ─── Consumer-facing booking pages that relate to spare drivers ───
const SpareDriverBooking = lazy(() => import('../consumer/pages/SpareDriverBooking'));
const SpareDriverHistory = lazy(() => import('../consumer/pages/SpareDriverHistory'));
const SpareDriverSupport = lazy(() => import('../consumer/pages/SpareDriverSupport'));
const MonthlySpareDriver = lazy(() => import('../consumer/pages/MonthlySpareDriver'));

// ─── Internal Guard: checks chauffeur_token (NOT consumer JWT) ───
const DriverProtect = ({ children }) => {
    const token = localStorage.getItem('chauffeur_token');
    if (!token) return <Navigate to="/spare-driver/register" replace />;
    return children;
};

const SpareDriverRoutes = () => {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
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
        </Suspense>
    );
};

export default SpareDriverRoutes;
