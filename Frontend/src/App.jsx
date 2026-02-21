import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// ── Consumer Pages ──
import Home from './modules/consumer/pages/Home';
import ServiceSelection from './modules/consumer/pages/ServiceSelection';
import MapScreen from './modules/consumer/pages/MapScreen';
import BookingType from './modules/consumer/pages/BookingType';
import BookingStatus from './modules/consumer/pages/BookingStatus';
import Profile from './modules/consumer/pages/Profile';
import Onboarding from './modules/consumer/pages/Onboarding';
import Login from './modules/consumer/pages/Login';
import MyBookings from './modules/consumer/pages/MyBookings';
import Notifications from './modules/consumer/pages/Notifications';
import Wallet from './modules/consumer/pages/Wallet';
import RateExperience from './modules/consumer/pages/RateExperience';
import VehicleManager from './modules/consumer/pages/VehicleManager';
import HelpSupport from './modules/consumer/pages/HelpSupport';
import ReferEarn from './modules/consumer/pages/ReferEarn';
import OrderDetails from './modules/consumer/pages/OrderDetails';
import AddressManager from './modules/consumer/pages/AddressManager';
import OffersPage from './modules/consumer/pages/OffersPage';
import StudioDiscovery from './modules/consumer/pages/StudioDiscovery';

// ── Captain Module ──
import CaptainHome from './modules/captain/pages/CaptainHome';
import CaptainJobDetail from './modules/captain/pages/CaptainJobDetail';
import CaptainEarnings from './modules/captain/pages/CaptainEarnings';
import CaptainProfile from './modules/captain/pages/CaptainProfile';
import CaptainLogin from './modules/captain/pages/CaptainLogin';
import CaptainSignup from './modules/captain/pages/CaptainSignup';

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
      console.log('%c Hoora Dev Error: ', 'background:#FF6B00;color:#fff;font-weight:bold;padding:2px 5px;');
      console.error(e);
    };
    window.addEventListener('error', handle);
    return () => window.removeEventListener('error', handle);
  }, []);
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* ── Auth ── */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />

          {/* ── Consumer: Core Flow ── */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<ServiceSelection />} />
          <Route path="/studios" element={<StudioDiscovery />} />
          <Route path="/map" element={<MapScreen />} />
          <Route path="/booking-type" element={<BookingType />} />
          <Route path="/booking-status" element={<BookingStatus />} />

          {/* ── Consumer: Profile & Account ── */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/vehicles" element={<VehicleManager />} />
          <Route path="/addresses" element={<AddressManager />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/refer" element={<ReferEarn />} />
          <Route path="/help" element={<HelpSupport />} />
          <Route path="/offers" element={<OffersPage />} />

          {/* ── Consumer: Orders ── */}
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/order/:id" element={<OrderDetails />} />
          <Route path="/rate" element={<RateExperience />} />

          {/* ── Consumer: Utility ── */}
          <Route path="/notifications" element={<Notifications />} />

          {/* ── Captain Module ── */}
          <Route path="/captain/login" element={<CaptainLogin />} />
          <Route path="/captain/signup" element={<CaptainSignup />} />
          <Route path="/captain" element={<CaptainHome />} />
          <Route path="/captain/job" element={<CaptainJobDetail />} />
          <Route path="/captain/earnings" element={<CaptainEarnings />} />
          <Route path="/captain/profile" element={<CaptainProfile />} />

          {/* ── Vendor Module ── */}
          <Route path="/vendor" element={<VendorHome />} />
          <Route path="/vendor/orders" element={<VendorOrders />} />
          <Route path="/vendor/fleet" element={<VendorFleet />} />
          <Route path="/vendor/earnings" element={<VendorEarnings />} />
          <Route path="/vendor/settings" element={<VendorSettings />} />
          <Route path="/vendor/customers" element={<VendorCustomers />} />
          <Route path="/vendor/order/:id" element={<VendorOrderDetail />} />
          <Route path="/vendor/inventory" element={<VendorInventory />} />
          <Route path="/vendor/services" element={<VendorServices />} />
          <Route path="/vendor/reports" element={<VendorReports />} />

          {/* ── Other Placeholders ── */}
          <Route path="/admin" element={<PlaceholderPanel name="Admin Dashboard" emoji="🏢" />} />

          {/* ── Fallback ── */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
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
