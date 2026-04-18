import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { CaptainProvider } from './context/CaptainContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

import Home from './modules/consumer/pages/Home';
import Profile from './modules/consumer/pages/Profile';
import Onboarding from './modules/consumer/pages/Onboarding';
import Login from './modules/consumer/pages/Login';
import Signup from './modules/consumer/pages/Signup';
import OTPVerification from './modules/consumer/pages/OTPVerification';
import MyBookings from './modules/consumer/pages/MyBookings';
import Notifications from './modules/consumer/pages/Notifications';
import RateExperience from './modules/consumer/pages/RateExperience';
import VehicleManager from './modules/consumer/pages/VehicleManager';
import HelpSupport from './modules/consumer/pages/HelpSupport';
import ReferEarn from './modules/consumer/pages/ReferEarn';
import AddressManager from './modules/consumer/pages/AddressManager';
import Wallet from './modules/consumer/pages/Wallet';
import SOSActive from './modules/consumer/pages/SOSActive';
import EmergencySOS from './modules/consumer/pages/EmergencySOS';

import SpareDriverBooking from './modules/consumer/pages/SpareDriverBooking';
import SpareDriverHistory from './modules/consumer/pages/SpareDriverHistory';
import SpareDriverSupport from './modules/consumer/pages/SpareDriverSupport';
import MonthlySpareDriver from './modules/consumer/pages/MonthlySpareDriver';
import DriverRegistration from './modules/spareDrivers/pages/DriverRegistration';
import DriverDashboard from './modules/spareDrivers/pages/DriverDashboard';
import DriverBookings from './modules/spareDrivers/pages/DriverBookings';
import DriverEarnings from './modules/spareDrivers/pages/DriverEarnings';
import DriverHistory from './modules/spareDrivers/pages/DriverHistory';
import DriverProfile from './modules/spareDrivers/pages/DriverProfile';
import DriverNotifications from './modules/spareDrivers/pages/DriverNotifications';
import DriverInquiry from './modules/spareDrivers/pages/DriverInquiry';
import DriverKitPurchase from './modules/spareDrivers/pages/DriverKitPurchase';
import DriverPremium from './modules/spareDrivers/pages/DriverPremium';
import DriverAddress from './modules/spareDrivers/pages/DriverAddress';

import AdminPanelLayout from './modules/admin/components/AdminLayout';
import AdminLogin from './modules/admin/pages/AdminLogin';
import { getFlattenedRoutes } from './modules/admin/AdminRoutesConfig.jsx';
import LocationPromptModal from './modules/consumer/components/LocationPromptModal';
import FeatureGuard from './components/FeatureGuard';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        if (!pathname.startsWith('/admin')) {
            window.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
};

const ErrorBoundary = ({ children }) => {
    useEffect(() => {
        const handle = (e) => {
            console.log('%c CarWash Dev Error: ', 'background:#FF6B00;color:#fff;font-weight:bold;padding:2px 5px;');
            console.error(e);
        };

        window.addEventListener('error', handle);
        return () => window.removeEventListener('error', handle);
    }, []);

    return children;
};

const P = (role, element) => <ProtectedRoute role={role}>{element}</ProtectedRoute>;

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <LocationProvider>
                    <CaptainProvider>
                        <ThemeProvider>
                            <WishlistProvider>
                                <CartProvider>
                                    <Router>
                                        <ScrollToTop />
                                        <Routes>
                                            <Route path="/onboarding" element={<Onboarding />} />
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/signup" element={<Signup />} />
                                            <Route path="/otp-verify" element={<OTPVerification />} />
                                            <Route path="/admin/login" element={<AdminLogin />} />

                                            <Route path="/" element={<Home />} />

                                            <Route path="/spare-driver" element={<SpareDriverBooking />} />
                                            <Route path="/spare-driver/register" element={<DriverRegistration />} />
                                            <Route path="/spare-driver/history" element={<SpareDriverHistory />} />
                                            <Route path="/spare-driver/support" element={<SpareDriverSupport />} />
                                            <Route path="/spare-driver/monthly" element={<MonthlySpareDriver />} />
                                            <Route path="/spare-driver/dashboard" element={<DriverDashboard />} />
                                            <Route path="/spare-driver/bookings" element={<DriverBookings />} />
                                            <Route path="/spare-driver/earnings" element={<DriverEarnings />} />
                                            <Route path="/spare-driver/history-log" element={<DriverHistory />} />
                                            <Route path="/spare-driver/profile" element={<DriverProfile />} />
                                            <Route path="/spare-driver/notifications" element={<DriverNotifications />} />
                                            <Route path="/spare-driver/inquiry" element={<DriverInquiry />} />
                                            <Route path="/spare-driver/kit-purchase" element={<DriverKitPurchase />} />
                                            <Route path="/spare-driver/premium" element={<DriverPremium />} />
                                            <Route path="/spare-driver/address" element={<DriverAddress />} />

                                            <Route path="/profile" element={P('consumer', <Profile />)} />
                                            <Route path="/vehicles" element={P('consumer', <VehicleManager />)} />
                                            <Route path="/addresses" element={P('consumer', <AddressManager />)} />
                                            <Route path="/wallet" element={P('consumer', <Wallet />)} />
                                            <Route path="/refer" element={P('consumer', <ReferEarn />)} />
                                            <Route path="/help" element={P('consumer', <HelpSupport />)} />
                                            <Route path="/bookings" element={P('consumer', <MyBookings />)} />
                                            <Route path="/rate" element={P('consumer', <RateExperience />)} />
                                            <Route path="/notifications" element={P('consumer', <Notifications />)} />
                                            <Route path="/sos-active" element={P('consumer', <SOSActive />)} />
                                            <Route path="/safety/sos" element={P('consumer', <EmergencySOS />)} />

                                            <Route element={P('admin', <AdminPanelLayout />)}>
                                                {getFlattenedRoutes().map((route) => (
                                                    <Route
                                                        key={route.path}
                                                        path={route.path}
                                                        element={(
                                                            <FeatureGuard feature={route.flag}>
                                                                {route.component}
                                                            </FeatureGuard>
                                                        )}
                                                    />
                                                ))}
                                            </Route>

                                            <Route path="*" element={<Home />} />
                                        </Routes>

                                        <Toaster
                                            position="top-center"
                                            reverseOrder={false}
                                            toastOptions={{
                                                style: {
                                                    background: '#FFF',
                                                    color: '#000',
                                                    borderRadius: '16px',
                                                    fontWeight: 'bold'
                                                }
                                            }}
                                        />

                                        <LocationPromptModal />
                                    </Router>
                                </CartProvider>
                            </WishlistProvider>
                        </ThemeProvider>
                    </CaptainProvider>
                </LocationProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
