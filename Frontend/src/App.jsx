import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';

// ── Consumer Pages ──
import Home from './modules/consumer/pages/Home';
import ServiceSelection from './modules/consumer/pages/ServiceSelection';
import MapScreen from './modules/consumer/pages/MapScreen';
import BookingType from './modules/consumer/pages/BookingType';
import BookingStatus from './modules/consumer/pages/BookingStatus';
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

// ── Captain Module ──
import CaptainHome from './modules/captain/pages/CaptainHome';
import CaptainJobDetail from './modules/captain/pages/CaptainJobDetail';
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

// ── Admin Module ──
import AdminDashboard from './modules/admin/pages/AdminDashboard';
import AdminAnalytics from './modules/admin/pages/AdminAnalytics';
import AdminUsers from './modules/admin/pages/AdminUsers';
import AdminServices from './modules/admin/pages/AdminServices';
import AdminBookings from './modules/admin/pages/AdminBookings';
import AdminSettings from './modules/admin/pages/AdminSettings';
import AdminHubs from './modules/admin/pages/AdminHubs';
import AdminPromotions from './modules/admin/pages/AdminPromotions';
import AdminLogin from './modules/admin/pages/AdminLogin';

// ── Scroll to top on route change ──
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
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
        <ThemeProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* ── Public Auth Routes ── */}
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/otp-verify" element={<OTPVerification />} />
                <Route path="/captain/login" element={<CaptainLogin />} />
                <Route path="/captain/signup" element={<CaptainSignup />} />
                <Route path="/vendor/login" element={<VendorLogin />} />
                <Route path="/vendor/signup" element={<VendorSignup />} />
                <Route path="/staff/login" element={<StaffLogin />} />
                <Route path="/staff/signup" element={<StaffSignup />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* ── Consumer: Public ── */}
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/cart" element={<CartPage />} />

                {/* ── Consumer: Protected ── */}
                <Route path="/services" element={P('consumer', <ServiceSelection />)} />
                <Route path="/studios" element={P('consumer', <StudioDiscovery />)} />
                <Route path="/map" element={P('consumer', <MapScreen />)} />
                <Route path="/booking-type" element={P('consumer', <BookingType />)} />
                <Route path="/booking-status" element={P('consumer', <BookingStatus />)} />
                <Route path="/profile" element={P('consumer', <Profile />)} />
                <Route path="/vehicles" element={P('consumer', <VehicleManager />)} />
                <Route path="/addresses" element={P('consumer', <AddressManager />)} />
                <Route path="/wash-and-care" element={P('consumer', <WashAndCare />)} />
                <Route path="/subscriptions" element={P('consumer', <Subscriptions />)} />

                <Route path="/refer" element={P('consumer', <ReferEarn />)} />
                <Route path="/help" element={P('consumer', <HelpSupport />)} />
                <Route path="/offers" element={P('consumer', <OffersPage />)} />
                <Route path="/payments" element={P('consumer', <PaymentMethods />)} />
                <Route path="/insurance" element={P('consumer', <InsuranceCenter />)} />
                <Route path="/bookings" element={P('consumer', <MyBookings />)} />
                <Route path="/order/:id" element={P('consumer', <OrderDetails />)} />
                <Route path="/rate" element={P('consumer', <RateExperience />)} />
                <Route path="/notifications" element={P('consumer', <Notifications />)} />

                {/* ── Captain: Protected ── */}
                <Route path="/captain" element={P('captain', <CaptainHome />)} />
                <Route path="/captain/job" element={P('captain', <CaptainJobDetail />)} />
                <Route path="/captain/earnings" element={P('captain', <CaptainEarnings />)} />
                <Route path="/captain/profile" element={P('captain', <CaptainProfile />)} />
                <Route path="/captain/history" element={P('captain', <CaptainHistory />)} />
                <Route path="/captain/safety" element={P('captain', <CaptainSafety />)} />
                <Route path="/captain/settings" element={P('captain', <CaptainSettings />)} />
                <Route path="/captain/support" element={P('captain', <CaptainSupport />)} />
                <Route path="/captain/rewards" element={P('captain', <CaptainRewards />)} />
                <Route path="/captain/profile/edit" element={P('captain', <CaptainProfileEdit />)} />

                {/* ── Vendor: Protected ── */}
                <Route path="/vendor" element={P('vendor', <VendorHome />)} />
                <Route path="/vendor/orders" element={P('vendor', <VendorOrders />)} />
                <Route path="/vendor/fleet" element={P('vendor', <VendorFleet />)} />
                <Route path="/vendor/earnings" element={P('vendor', <VendorEarnings />)} />
                <Route path="/vendor/settings" element={P('vendor', <VendorSettings />)} />
                <Route path="/vendor/customers" element={P('vendor', <VendorCustomers />)} />
                <Route path="/vendor/order/:id" element={P('vendor', <VendorOrderDetail />)} />
                <Route path="/vendor/inventory" element={P('vendor', <VendorInventory />)} />
                <Route path="/vendor/products" element={P('vendor', <VendorProducts />)} />
                <Route path="/vendor/services" element={P('vendor', <VendorServices />)} />
                <Route path="/vendor/reports" element={P('vendor', <VendorReports />)} />
                <Route path="/vendor/staff" element={P('vendor', <VendorStaff />)} />

                {/* ── Staff: Protected ── */}
                <Route path="/staff" element={P('staff', <StaffDashboard />)} />
                <Route path="/staff/task/:id" element={P('staff', <TaskDetails />)} />
                <Route path="/staff/history" element={P('staff', <StaffHistory />)} />
                <Route path="/staff/profile" element={P('staff', <StaffProfile />)} />
                <Route path="/staff/profile/personal" element={P('staff', <StaffPersonalInfo />)} />
                <Route path="/staff/profile/security" element={P('staff', <StaffSecurity />)} />
                <Route path="/staff/profile/support" element={P('staff', <StaffSupport />)} />
                <Route path="/staff/profile/notifications" element={P('staff', <StaffNotifications />)} />

                {/* ── Admin: Protected ── */}
                <Route path="/admin" element={P('admin', <AdminDashboard />)} />
                <Route path="/admin/analytics" element={P('admin', <AdminAnalytics />)} />
                <Route path="/admin/users" element={P('admin', <AdminUsers />)} />
                <Route path="/admin/services" element={P('admin', <AdminServices />)} />
                <Route path="/admin/bookings" element={P('admin', <AdminBookings />)} />
                <Route path="/admin/settings" element={P('admin', <AdminSettings />)} />
                <Route path="/admin/hubs" element={P('admin', <AdminHubs />)} />
                <Route path="/admin/promotions" element={P('admin', <AdminPromotions />)} />

                {/* ── Fallback ── */}
                <Route path="*" element={<Home />} />
              </Routes>
            </Router>
          </CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const PlaceholderPanel = ({ name, emoji = '✨' }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background p-10 text-center">
    <div className="text-5xl mb-5">{emoji}</div>
    <h2 className="text-2xl font-black text-content tracking-tight">{name}</h2>
    <p className="text-content-subtle text-sm font-bold mt-2">This module is currently in development.</p>
    <button onClick={() => window.history.back()}
      className="mt-8 text-brand font-black uppercase text-xs tracking-widest border-b border-brand/30 pb-0.5">
      ← Go Back
    </button>
  </div>
);

export default App;
