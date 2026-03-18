import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import React, { useEffect, Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CaptainProvider } from './context/CaptainContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';

// ── Consumer Pages ──
const Home = lazy(() => import('./modules/consumer/pages/Home'));
const InstantWash = lazy(() => import('./modules/consumer/pages/InstantWash'));
const BookingType = lazy(() => import('./modules/consumer/pages/BookingType'));
const BookingStatus = lazy(() => import('./modules/consumer/pages/BookingStatus'));
const Profile = lazy(() => import('./modules/consumer/pages/Profile'));
const Onboarding = lazy(() => import('./modules/consumer/pages/Onboarding'));
const Login = lazy(() => import('./modules/consumer/pages/Login'));
const ServiceSelection = lazy(() => import('./modules/consumer/pages/ServiceSelection'));
const MapScreen = lazy(() => import('./modules/consumer/pages/MapScreen'));
const Signup = lazy(() => import('./modules/consumer/pages/Signup'));
const OTPVerification = lazy(() => import('./modules/consumer/pages/OTPVerification'));
const MyBookings = lazy(() => import('./modules/consumer/pages/MyBookings'));
const Notifications = lazy(() => import('./modules/consumer/pages/Notifications'));
const RateExperience = lazy(() => import('./modules/consumer/pages/RateExperience'));
const VehicleManager = lazy(() => import('./modules/consumer/pages/VehicleManager'));
const HelpSupport = lazy(() => import('./modules/consumer/pages/HelpSupport'));
const ReferEarn = lazy(() => import('./modules/consumer/pages/ReferEarn'));
const OrderDetails = lazy(() => import('./modules/consumer/pages/OrderDetails'));
const AddressManager = lazy(() => import('./modules/consumer/pages/AddressManager'));
const OffersPage = lazy(() => import('./modules/consumer/pages/OffersPage'));
const StudioDiscovery = lazy(() => import('./modules/consumer/pages/StudioDiscovery'));
const PaymentMethods = lazy(() => import('./modules/consumer/pages/PaymentMethods'));
const InsuranceCenter = lazy(() => import('./modules/consumer/pages/InsuranceCenter'));
const ShopPage = lazy(() => import('./modules/consumer/pages/ShopPage'));
const CartPage = lazy(() => import('./modules/consumer/pages/CartPage'));
const WashAndCare = lazy(() => import('./modules/consumer/pages/WashAndCare'));
const Subscriptions = lazy(() => import('./modules/consumer/pages/Subscriptions'));
const ServiceDetails = lazy(() => import('./modules/consumer/pages/ServiceDetails'));
const EShop = lazy(() => import('./modules/consumer/pages/EShop'));
const Wishlist = lazy(() => import('./modules/consumer/pages/Wishlist'));
const Wallet = lazy(() => import('./modules/consumer/pages/Wallet'));
const ModelDetail = lazy(() => import('./modules/consumer/pages/ModelDetail'));
const FullWashBooking = lazy(() => import('./modules/consumer/pages/FullWashBooking'));
const BookingConfirmation = lazy(() => import('./modules/consumer/pages/BookingConfirmation'));
const SafetyContacts = lazy(() => import('./modules/consumer/pages/SafetyContacts'));
const ComplianceCenter = lazy(() => import('./modules/consumer/pages/ComplianceCenter'));
const IncidentLog = lazy(() => import('./modules/consumer/pages/IncidentLog'));
const ProductDetail = lazy(() => import('./modules/consumer/pages/ProductDetail'));
const Portfolio = lazy(() => import('./modules/consumer/pages/Portfolio'));
const EmergencySOS = lazy(() => import('./modules/consumer/pages/EmergencySOS'));
const PaymentCheckout = lazy(() => import('./modules/consumer/pages/PaymentCheckout.jsx'));
const ApartmentWash = lazy(() => import('./modules/consumer/pages/ApartmentWash'));

// ── Spare Driver Module (self-contained) ──
import SpareDriverRoutes from './modules/sparedrivers/SpareDriverRoutes.jsx';

// ── Captain Module ──
const CaptainHome = lazy(() => import('./modules/captain/pages/CaptainHome'));
const CaptainJobDetail = lazy(() => import('./modules/captain/pages/CaptainJobDetail'));
const CaptainEarnings = lazy(() => import('./modules/captain/pages/CaptainEarnings'));
const CaptainProfile = lazy(() => import('./modules/captain/pages/CaptainProfile'));
const CaptainLogin = lazy(() => import('./modules/captain/pages/CaptainLogin'));
const CaptainSignup = lazy(() => import('./modules/captain/pages/CaptainSignup'));
const CaptainHistory = lazy(() => import('./modules/captain/pages/CaptainHistory'));
const CaptainPortfolio = lazy(() => import('./modules/captain/pages/CaptainPortfolio'));
const CaptainSafety = lazy(() => import('./modules/captain/pages/CaptainSafety'));
const CaptainSettings = lazy(() => import('./modules/captain/pages/CaptainSettings'));
const CaptainSupport = lazy(() => import('./modules/captain/pages/CaptainSupport'));
const CaptainRewards = lazy(() => import('./modules/captain/pages/CaptainRewards'));
const CaptainProfileEdit = lazy(() => import('./modules/captain/pages/CaptainProfileEdit'));
const CaptainPersonalInfo = lazy(() => import('./modules/captain/pages/CaptainPersonalInfo'));
const CaptainNotifications = lazy(() => import('./modules/captain/pages/CaptainNotifications'));
const CaptainOTPVerification = lazy(() => import('./modules/captain/pages/CaptainOTPVerification'));
const CaptainLocationSelector = lazy(() => import('./modules/captain/pages/CaptainLocationSelector'));

// ── Vendor Module ──
const VendorHome = lazy(() => import('./modules/vendor/pages/VendorHome'));
const VendorOrders = lazy(() => import('./modules/vendor/pages/VendorOrders'));
const VendorFleet = lazy(() => import('./modules/vendor/pages/VendorFleet'));
const VendorEarnings = lazy(() => import('./modules/vendor/pages/VendorEarnings'));
const VendorSettings = lazy(() => import('./modules/vendor/pages/VendorSettings'));
const VendorCustomers = lazy(() => import('./modules/vendor/pages/VendorCustomers'));
const VendorOrderDetail = lazy(() => import('./modules/vendor/pages/VendorOrderDetail'));
const VendorInventory = lazy(() => import('./modules/vendor/pages/VendorInventory'));
const VendorServices = lazy(() => import('./modules/vendor/pages/VendorServices'));
const VendorReports = lazy(() => import('./modules/vendor/pages/VendorReports'));
const VendorLogin = lazy(() => import('./modules/vendor/pages/VendorLogin'));
const VendorSignup = lazy(() => import('./modules/vendor/pages/VendorSignup'));
const VendorProducts = lazy(() => import('./modules/vendor/pages/VendorProducts'));
const VendorStaff = lazy(() => import('./modules/vendor/pages/VendorStaff'));

// ── Staff Module ──
const StaffDashboard = lazy(() => import('./modules/staff/pages/StaffDashboard'));
const TaskDetails = lazy(() => import('./modules/staff/pages/TaskDetails'));
const StaffLogin = lazy(() => import('./modules/staff/pages/StaffLogin'));
const StaffSignup = lazy(() => import('./modules/staff/pages/StaffSignup'));
const StaffHistory = lazy(() => import('./modules/staff/pages/StaffHistory'));
const StaffProfile = lazy(() => import('./modules/staff/pages/StaffProfile'));
const StaffPersonalInfo = lazy(() => import('./modules/staff/pages/StaffPersonalInfo'));
const StaffSecurity = lazy(() => import('./modules/staff/pages/StaffSecurity'));
const StaffSupport = lazy(() => import('./modules/staff/pages/StaffSupport'));
const StaffNotifications = lazy(() => import('./modules/staff/pages/StaffNotifications'));

// ── Admin Module ──
const AdminDashboard = lazy(() => import('./modules/admin/pages/AdminDashboard'));
const AdminAnalytics = lazy(() => import('./modules/admin/pages/AdminAnalytics'));
const AdminUsers = lazy(() => import('./modules/admin/pages/AdminUsers'));
const AdminServices = lazy(() => import('./modules/admin/pages/AdminServices'));
const AdminBookings = lazy(() => import('./modules/admin/pages/AdminBookings'));
const AdminSettings = lazy(() => import('./modules/admin/pages/AdminSettings'));
const AdminHubs = lazy(() => import('./modules/admin/pages/AdminHubs'));
const AdminPromotions = lazy(() => import('./modules/admin/pages/AdminPromotions'));
const AdminSubscriptions = lazy(() => import('./modules/admin/pages/AdminSubscriptions'));
const AdminLogin = lazy(() => import('./modules/admin/pages/AdminLogin'));
const AdminProductVerification = lazy(() => import('./modules/admin/pages/AdminProductVerification'));
const AdminSpareDrivers = lazy(() => import('./modules/admin/pages/AdminSpareDrivers'));
const AdminTransactions = lazy(() => import('./modules/admin/pages/AdminTransactions'));
const AdminVehicleCatalog = lazy(() => import('./modules/admin/pages/AdminVehicleCatalog'));

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
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '16px',
            padding: '12px 24px',
          },
          success: {
            iconTheme: {
              primary: '#FF6B00',
              secondary: '#fff',
            },
          },
        }}
      />
      <AuthProvider>
        <CaptainProvider>
          <ThemeProvider>
          <WishlistProvider>
            <CartProvider>
              <Router>
                <ScrollToTop />
                <Suspense fallback={<PageLoader />}>
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
                    <Route path="/shop" element={<Navigate to="/e-shop" replace />} />
                    <Route path="/cart" element={<CartPage />} />

                    {/* ── Consumer: Protected ── */}
                    <Route path="/instant-wash" element={P('consumer', <InstantWash />)} />
                    <Route path="/apartments" element={P('consumer', <ApartmentWash />)} />
                    <Route path="/e-shop" element={P('consumer', <EShop />)} />
                    <Route path="/e-shop/product/:id" element={P('consumer', <ProductDetail />)} />
                    <Route path="/wishlist" element={P('consumer', <Wishlist />)} />
                    <Route path="/studios" element={P('consumer', <StudioDiscovery />)} />
                    <Route path="/map" element={P('consumer', <MapScreen />)} />
                    <Route path="/service/:id" element={P('consumer', <ServiceDetails />)} />
                    <Route path="/booking-type" element={P('consumer', <BookingType />)} />
                    <Route path="/booking-status" element={P('consumer', <BookingStatus />)} />
                    <Route path="/profile" element={P('consumer', <Profile />)} />
                    <Route path="/vehicles" element={P('consumer', <VehicleManager />)} />
                    <Route path="/add-vehicle" element={P('consumer', <VehicleManager />)} />
                    <Route path="/addresses" element={P('consumer', <AddressManager />)} />
                    <Route path="/wash-and-care" element={P('consumer', <WashAndCare />)} />
                    <Route path="/subscriptions" element={P('consumer', <Subscriptions />)} />
                    <Route path="/wallet" element={P('consumer', <Wallet />)} />
                    <Route path="/refer" element={P('consumer', <ReferEarn />)} />
                    <Route path="/help" element={P('consumer', <HelpSupport />)} />
                    <Route path="/offers" element={P('consumer', <OffersPage />)} />
                    <Route path="/payments" element={P('consumer', <PaymentMethods />)} />
                    <Route path="/insurance" element={P('consumer', <InsuranceCenter />)} />
                    <Route path="/bookings" element={P('consumer', <MyBookings />)} />
                    <Route path="/order/:id" element={P('consumer', <OrderDetails />)} />
                    <Route path="/rate" element={P('consumer', <RateExperience />)} />
                    <Route path="/notifications" element={P('consumer', <Notifications />)} />
                    <Route path="/specialized-model/:type" element={P('consumer', <ModelDetail />)} />
                    <Route path="/full-wash-booking" element={P('consumer', <FullWashBooking />)} />
                    <Route path="/booking-confirmation" element={P('consumer', <BookingConfirmation />)} />
                    <Route path="/safety/contacts" element={P('consumer', <SafetyContacts />)} />
                    <Route path="/compliance" element={P('consumer', <ComplianceCenter />)} />
                    <Route path="/safety/incidents" element={P('consumer', <IncidentLog />)} />
                    <Route path="/portfolio" element={P('consumer', <Portfolio />)} />
                    <Route path="/sos" element={P('consumer', <EmergencySOS />)} />

                    {/* ── Payment Checkout ── */}
                    <Route path="/payment-checkout" element={P('consumer', <PaymentCheckout />)} />

                    {/* ── Spare Driver Module (fully self-contained) ── */}
                    <Route path="/spare-driver/*" element={<SpareDriverRoutes />} />

                    {/* ── Captain: Protected ── */}
                    <Route path="/captain" element={P('captain', <CaptainHome />)} />
                    <Route path="/captain/dashboard" element={<Navigate to="/captain" replace />} />
                    <Route path="/captain/status" element={<Navigate to="/captain" replace />} />
                    <Route path="/captain/job" element={P('captain', <CaptainJobDetail />)} />
                    <Route path="/captain/earnings" element={P('captain', <CaptainEarnings />)} />
                    <Route path="/captain/profile" element={P('captain', <CaptainProfile />)} />
                    <Route path="/captain/history" element={P('captain', <CaptainHistory />)} />
                    <Route path="/captain/portfolio" element={P('captain', <CaptainPortfolio />)} />
                    <Route path="/captain/safety" element={P('captain', <CaptainSafety />)} />
                    <Route path="/captain/settings" element={P('captain', <CaptainSettings />)} />
                    <Route path="/captain/support" element={P('captain', <CaptainSupport />)} />
                    <Route path="/captain/rewards" element={P('captain', <CaptainRewards />)} />
                    <Route path="/captain/profile/edit" element={P('captain', <CaptainProfileEdit />)} />
                    <Route path="/captain/profile/personal" element={P('captain', <CaptainPersonalInfo />)} />
                    <Route path="/captain/notifications" element={P('captain', <CaptainNotifications />)} />
                    <Route path="/captain/otp-verify" element={<CaptainOTPVerification />} />
                    <Route path="/captain/area-select" element={P('captain', <CaptainLocationSelector />)} />

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
                    <Route path="/admin/vehicle-catalog" element={P('admin', <AdminVehicleCatalog />)} />
                    <Route path="/admin/subscriptions" element={P('admin', <AdminSubscriptions />)} />
                    <Route path="/admin/bookings" element={P('admin', <AdminBookings />)} />
                    <Route path="/admin/settings" element={P('admin', <AdminSettings />)} />
                    <Route path="/admin/hubs" element={P('admin', <AdminHubs />)} />
                    <Route path="/admin/products" element={P('admin', <AdminProductVerification />)} />
                    <Route path="/admin/promotions" element={P('admin', <AdminPromotions />)} />
                    <Route path="/admin/spare-drivers" element={P('admin', <AdminSpareDrivers />)} />
                    <Route path="/admin/transactions" element={P('admin', <AdminTransactions />)} />

                    {/* ── Fallback ── */}
                    <Route path="*" element={<Home />} />
                  </Routes>
                </Suspense>
              </Router>
            </CartProvider>
          </WishlistProvider>
          </ThemeProvider>
        </CaptainProvider>
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
