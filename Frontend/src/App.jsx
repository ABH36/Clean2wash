import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { CaptainProvider } from './context/CaptainContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

// ── Consumer Pages ──
import Home from './modules/consumer/pages/Home';
import InstantWash from './modules/consumer/pages/InstantWash';
import BookingType from './modules/consumer/pages/BookingType';
import BookingStatus from './modules/consumer/pages/BookingStatus';
import Profile from './modules/consumer/pages/Profile';
import Onboarding from './modules/consumer/pages/Onboarding';
import Login from './modules/consumer/pages/Login';
import ServiceSelection from './modules/consumer/pages/ServiceSelection';
import MapScreen from './modules/consumer/pages/MapScreen';
import Signup from './modules/consumer/pages/Signup';
import OTPVerification from './modules/consumer/pages/OTPVerification';
import MyBookings from './modules/consumer/pages/MyBookings';
import MyOrders from './modules/consumer/pages/MyOrders';
import Notifications from './modules/consumer/pages/Notifications';
import RateExperience from './modules/consumer/pages/RateExperience';
import VehicleManager from './modules/consumer/pages/VehicleManager';
import HelpSupport from './modules/consumer/pages/HelpSupport';
import ReferEarn from './modules/consumer/pages/ReferEarn';
import OrderDetails from './modules/consumer/pages/OrderDetails';
import AddressManager from './modules/consumer/pages/AddressManager';
import OffersPage from './modules/consumer/pages/OffersPage';
import StudioDiscovery from './modules/consumer/pages/StudioDiscovery';
import PaymentMethods from './modules/consumer/pages/PaymentMethods';
import InsuranceCenter from './modules/consumer/pages/InsuranceCenter';
import ShopPage from './modules/consumer/pages/ShopPage';
import CartPage from './modules/consumer/pages/CartPage';
import WashAndCare from './modules/consumer/pages/WashAndCare';
import Subscriptions from './modules/consumer/pages/Subscriptions';
import ServiceDetails from './modules/consumer/pages/ServiceDetails';
import EShop from './modules/consumer/pages/EShop';
import Wishlist from './modules/consumer/pages/Wishlist';
import Wallet from './modules/consumer/pages/Wallet';
import ModelDetail from './modules/consumer/pages/ModelDetail';
import FullWashBooking from './modules/consumer/pages/FullWashBooking';
import BookingConfirmation from './modules/consumer/pages/BookingConfirmation';
import SafetyContacts from './modules/consumer/pages/SafetyContacts';
import ComplianceCenter from './modules/consumer/pages/ComplianceCenter';
import IncidentLog from './modules/consumer/pages/IncidentLog';
import ProductDetail from './modules/consumer/pages/ProductDetail';
import ApartmentWash from './modules/consumer/pages/ApartmentWash';
import ApartmentWashHistory from './modules/consumer/pages/ApartmentWashHistory';
import ApartmentWashSupport from './modules/consumer/pages/ApartmentWashSupport';
import OrderTracking from './modules/consumer/pages/OrderTracking';
import SOSActive from './modules/consumer/pages/SOSActive';
import EmergencySOS from './modules/consumer/pages/EmergencySOS';

// ── Spare Driver Pages ──
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

// ── Captain Module ──
import CaptainHome from './modules/captain/pages/CaptainHome';
import CaptainJobDetail from './modules/captain/pages/CaptainJobDetail';
import CaptainApartmentRoute from './modules/captain/pages/CaptainApartmentRoute';
import CaptainEarnings from './modules/captain/pages/CaptainEarnings';
import CaptainProfile from './modules/captain/pages/CaptainProfile';
import CaptainLogin from './modules/captain/pages/CaptainLogin';
import CaptainSignup from './modules/captain/pages/CaptainSignup';
import CaptainHistory from './modules/captain/pages/CaptainHistory';
import CaptainSafety from './modules/captain/pages/CaptainSafety';
import CaptainSettings from './modules/captain/pages/CaptainSettings';
import CaptainSupport from './modules/captain/pages/CaptainSupport';
import CaptainRewards from './modules/captain/pages/CaptainRewards';
import CaptainProfileEdit from './modules/captain/pages/CaptainProfileEdit';
import CaptainNotifications from './modules/captain/pages/CaptainNotifications';
import CaptainPersonalInfo from './modules/captain/pages/CaptainPersonalInfo';
import CaptainPortfolio from './modules/captain/pages/CaptainPortfolio';
import CaptainLocationSelector from './modules/captain/pages/CaptainLocationSelector';
import CaptainOTPVerification from './modules/captain/pages/CaptainOTPVerification';

// ── Vendor Module ──
import VendorHome from './modules/vendor/pages/VendorHome';
import VendorOrders from './modules/vendor/pages/VendorOrders';
import VendorFleet from './modules/vendor/pages/VendorFleet';
import VendorEarnings from './modules/vendor/pages/VendorEarnings';
import VendorSettings from './modules/vendor/pages/VendorSettings';
import VendorCustomers from './modules/vendor/pages/VendorCustomers';
import VendorOrderDetail from './modules/vendor/pages/VendorOrderDetail';
import VendorInventory from './modules/vendor/pages/VendorInventory';
import VendorServices from './modules/vendor/pages/VendorServices';
import VendorReports from './modules/vendor/pages/VendorReports';
import VendorLogin from './modules/vendor/pages/VendorLogin';
import VendorSignup from './modules/vendor/pages/VendorSignup';
import VendorProducts from './modules/vendor/pages/VendorProducts';
import VendorStaff from './modules/vendor/pages/VendorStaff';
import VendorProductOrderDetail from './modules/vendor/pages/VendorProductOrderDetail';

// ── Staff Module ──
import StaffDashboard from './modules/staff/pages/StaffDashboard';
import TaskDetails from './modules/staff/pages/TaskDetails';
import StaffLogin from './modules/staff/pages/StaffLogin';
import StaffSignup from './modules/staff/pages/StaffSignup';
import StaffHistory from './modules/staff/pages/StaffHistory';
import StaffProfile from './modules/staff/pages/StaffProfile';
import StaffPersonalInfo from './modules/staff/pages/StaffPersonalInfo';
import StaffSecurity from './modules/staff/pages/StaffSecurity';
import StaffSupport from './modules/staff/pages/StaffSupport';
import StaffNotifications from './modules/staff/pages/StaffNotifications';
import StaffMapView from './modules/staff/pages/StaffMapView';
import StaffProductTaskDetail from './modules/staff/pages/StaffProductTaskDetail';
import CaptainProductMission from './modules/captain/pages/CaptainProductMission';

import AdminPanelLayout from './modules/admin/components/AdminLayout';
import AdminLogin from './modules/admin/pages/AdminLogin';
import { getFlattenedRoutes } from './modules/admin/AdminRoutesConfig.jsx';
import LocationPromptModal from './modules/consumer/components/LocationPromptModal';
import FeatureGuard from './components/FeatureGuard';

// ── Scroll to top on route change ──
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith('/admin')) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
};

// ── Global error logger (dev) ──
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

// Helper to wrap with ProtectedRoute
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
                      {/* ── Stealth Mode: Driver-Only Pivot ── */}
                      <Route path="/captain/*" element={<Navigate to="/" replace />} />
                      <Route path="/vendor/*" element={<Navigate to="/" replace />} />
                      <Route path="/staff/*" element={<Navigate to="/" replace />} />
                      <Route path="/instant-wash/*" element={<Navigate to="/" replace />} />
                      <Route path="/e-shop/*" element={<Navigate to="/" replace />} />
                      <Route path="/shop/*" element={<Navigate to="/" replace />} />
                      <Route path="/cart/*" element={<Navigate to="/" replace />} />
                      <Route path="/apartment-wash/*" element={<Navigate to="/" replace />} />
                      <Route path="/full-wash-booking/*" element={<Navigate to="/" replace />} />
                      <Route path="/studios/*" element={<Navigate to="/" replace />} />
                      <Route path="/subscriptions/*" element={<Navigate to="/" replace />} />

                      {/* ── Public Auth Routes ── */}
                      <Route path="/onboarding" element={<Onboarding />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/otp-verify" element={<OTPVerification />} />
                      <Route path="/admin/login" element={<AdminLogin />} />

                      {/* ── Consumer: Public ── */}
                      <Route path="/" element={<Home />} />

                      {/* ── Spare Driver Module (Made public for UI testing) ── */}
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

                      {/* ── Consumer: Protected ── */}
                      <Route path="/map" element={P('consumer', <MapScreen />)} />
                      <Route path="/service/:id" element={P('consumer', <ServiceDetails />)} />
                      <Route path="/booking-type" element={P('consumer', <BookingType />)} />
                      <Route path="/booking-status" element={P('consumer', <BookingStatus />)} />
                      <Route path="/profile" element={P('consumer', <Profile />)} />
                      <Route path="/vehicles" element={P('consumer', <VehicleManager />)} />
                      <Route path="/addresses" element={P('consumer', <AddressManager />)} />
                      <Route path="/wash-and-care" element={P('consumer', <WashAndCare />)} />
                      <Route path="/wallet" element={P('consumer', <Wallet />)} />
                      <Route path="/refer" element={P('consumer', <ReferEarn />)} />
                      <Route path="/help" element={P('consumer', <HelpSupport />)} />
                      <Route path="/offers" element={P('consumer', <OffersPage />)} />
                      <Route path="/payments" element={P('consumer', <PaymentMethods />)} />
                      <Route path="/insurance" element={P('consumer', <InsuranceCenter />)} />
                      <Route path="/bookings" element={P('consumer', <MyBookings />)} />
                      <Route path="/orders" element={P('consumer', <MyOrders />)} />
                      <Route path="/order-tracking/:id" element={P('consumer', <OrderTracking />)} />
                      <Route path="/order/:id" element={P('consumer', <OrderDetails />)} />
                      <Route path="/rate" element={P('consumer', <RateExperience />)} />
                      <Route path="/notifications" element={P('consumer', <Notifications />)} />
                      <Route path="/specialized-model/:type" element={P('consumer', <ModelDetail />)} />
                      <Route path="/safety/contacts" element={P('consumer', <SafetyContacts />)} />
                      <Route path="/compliance" element={P('consumer', <ComplianceCenter />)} />
                      <Route path="/safety/incidents" element={P('consumer', <IncidentLog />)} />
                      <Route path="/sos-active" element={P('consumer', <SOSActive />)} />
                      <Route path="/safety/sos" element={P('consumer', <EmergencySOS />)} />

                      {/* ── Admin: Protected ── */}
                      <Route element={P('admin', <AdminPanelLayout />)}>
                        {/* ── Dynamic Admin Routes (Engineering Next Level) ── */}
                        {getFlattenedRoutes().map((route) => (
                          <Route 
                            key={route.path}
                            path={route.path} 
                            element={
                              <FeatureGuard feature={route.flag}>
                                {route.component}
                              </FeatureGuard>
                            } 
                          />
                        ))}
                        
                        {/* Subscriptions legacy route */}
                        <Route path="/admin/subscriptions" element={<Navigate to="/admin/spare-drivers/subscriptions" replace />} />
                      </Route>

                      {/* ── Fallback ── */}
                      <Route path="*" element={<Home />} />
                    </Routes>
                    <Toaster position="top-center" reverseOrder={false}
                      toastOptions={{
                        style: { background: '#FFF', color: '#000', borderRadius: '16px', fontWeight: 'bold' },
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
