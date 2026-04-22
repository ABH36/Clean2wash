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
import KYCVerification from './modules/consumer/pages/KYCVerification';
import ComplianceCenter from './modules/consumer/pages/ComplianceCenter';
import PublicLiveTrack from './modules/consumer/pages/PublicLiveTrack';
import PaymentMethods from './modules/consumer/pages/PaymentMethods';
import SafetyContacts from './modules/consumer/pages/SafetyContacts';
import IncidentLog from './modules/consumer/pages/IncidentLog';

import SpareDriverBooking from './modules/consumer/pages/SpareDriverBooking';
import SpareDriverHistory from './modules/consumer/pages/SpareDriverHistory';
import SpareDriverSupport from './modules/consumer/pages/SpareDriverSupport';
import MonthlySpareDriver from './modules/consumer/pages/MonthlySpareDriver';
import DriverLogin from './modules/spareDrivers/pages/DriverLogin';
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
import DriverChatEnhanced from './modules/spareDrivers/pages/DriverChatEnhanced';
import DriverWallet from './modules/spareDrivers/pages/DriverWallet';
import DriverProfileEdit from './modules/spareDrivers/pages/DriverProfileEdit';
import DriverTripHistory from './modules/spareDrivers/pages/DriverTripHistory';
import DriverDutyDashboard from './modules/spareDrivers/pages/DriverDutyDashboard';
import DriverServicePortfolio from './modules/spareDrivers/pages/DriverServicePortfolio';
import DriverReliability from './modules/spareDrivers/pages/DriverReliability';
import DriverAvailability from './modules/spareDrivers/pages/DriverAvailability';

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
                                            <Route path="/share-trip/:id" element={<PublicLiveTrack />} />

                                            <Route path="/" element={<Home />} />

                                            <Route path="/spare-driver" element={<SpareDriverBooking />} />
                                            <Route path="/spare-driver/login" element={<DriverLogin />} />
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
                                            <Route path="/spare-driver/chat/:bookingId" element={<DriverChatEnhanced />} />
                                            <Route path="/spare-driver/wallet" element={<DriverWallet />} />
                                            <Route path="/spare-driver/profile/edit" element={<DriverProfileEdit />} />
                                            <Route path="/spare-driver/duty-dashboard" element={<DriverDutyDashboard />} />
                                            <Route path="/spare-driver/service-portfolio" element={<DriverServicePortfolio />} />
                                            <Route path="/spare-driver/reliability" element={<DriverReliability />} />
                                            <Route path="/spare-driver/availability" element={<DriverAvailability />} />
                                            <Route path="/spare-driver/trip-history" element={<DriverTripHistory />} />

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
                                            <Route path="/kyc-verification" element={P('consumer', <KYCVerification />)} />
                                            <Route path="/compliance" element={P('consumer', <ComplianceCenter />)} />
                                            <Route path="/payments" element={P('consumer', <PaymentMethods />)} />
                                            <Route path="/safety/contacts" element={P('consumer', <SafetyContacts />)} />
                                            <Route path="/safety/incidents" element={P('consumer', <IncidentLog />)} />

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
                                                    background: '#0A0F0D',
                                                    color: '#F59E0B',
                                                    borderRadius: '24px',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    fontSize: '11px',
                                                    fontWeight: '900',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.1em'
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
