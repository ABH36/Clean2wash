import React from 'react';
import {
  LayoutDashboard, Users, BarChart3, TrendingUp,
  User, Briefcase,
  Wallet, Car, MapPin, Settings, Tag
} from 'lucide-react';

// ── NEW MODULE IMPORTS ──
const AdminDashboardUpgraded = React.lazy(() => import('./pages/AdminDashboardUpgraded'));

const AdminDriversOperations = React.lazy(() => import('./pages/AdminDriversOperations'));
const AdminVehicleManagement = React.lazy(() => import('./pages/AdminVehicleManagement'));
const AdminBookingsOperations = React.lazy(() => import('./pages/AdminBookingsOperations'));
const AdminLiveTracking = React.lazy(() => import('./pages/AdminLiveTracking'));
const AdminDispatchCenter = React.lazy(() => import('./pages/AdminDispatchCenter'));

const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));

// ── FINANCE MODULE IMPORTS ──
const AdminTransactions = React.lazy(() => import('./pages/finance/AdminTransactions'));
const AdminWalletSystem = React.lazy(() => import('./pages/finance/AdminWalletSystem'));
const AdminPayouts = React.lazy(() => import('./pages/finance/AdminPayouts'));
const AdminPricingEngine = React.lazy(() => import('./pages/finance/AdminPricingEngine'));
const AdminPenalties = React.lazy(() => import('./pages/finance/AdminPenalties'));
const AdminSpareDriverServices = React.lazy(() => import('./pages/finance/AdminSpareDriverServices'));

const AdminServices = React.lazy(() => import('./pages/AdminServices'));
const AdminPromotions = React.lazy(() => import('./pages/AdminPromotions'));
const AdminVehicleCatalog = React.lazy(() => import('./pages/AdminVehicleCatalog'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));

// ── FINAL ROUTES CONFIG ──
export const ADMIN_ROUTES_CONFIG = [

  // ── OVERVIEW ──
  {
    category: 'Overview',
    icon: <LayoutDashboard size={18} />,
    flag: 'OVERVIEW',
    routes: [
      {
        path: '/admin',
        label: 'Dashboard',
        component: <AdminDashboardUpgraded />,
        icon: <LayoutDashboard size={14} />,
        flag: 'OVERVIEW'
      }
    ]
  },

  // ── OPERATIONS (NEW SYSTEM) ──
  {
    category: 'Operations',
    icon: <TrendingUp size={18} />,
    flag: 'OPERATIONS',
    routes: [
      {
        path: '/admin/drivers-operations',
        label: 'Driver Operations',
        component: <AdminDriversOperations />,
        icon: <Users size={14} />,
        flag: 'OPERATIONS'
      },
      {
        path: '/admin/vehicle-management',
        label: 'Vehicle Management',
        component: <AdminVehicleManagement />,
        icon: <Car size={14} />,
        flag: 'OPERATIONS'
      },
      {
        path: '/admin/bookings-operations',
        label: 'Booking Operations',
        component: <AdminBookingsOperations />,
        icon: <Briefcase size={14} />,
        flag: 'OPERATIONS'
      },
      {
        path: '/admin/live-tracking',
        label: 'Live Tracking',
        component: <AdminLiveTracking />,
        icon: <MapPin size={14} />,
        flag: 'OPERATIONS'
      },
      {
        path: '/admin/dispatch-center',
        label: 'Dispatch Center',
        component: <AdminDispatchCenter />,
        icon: <TrendingUp size={14} />,
        flag: 'OPERATIONS'
      }
    ]
  },

  // ── USERS ──
  {
    category: 'Users',
    icon: <Users size={18} />,
    flag: 'USERS',
    routes: [
      {
        path: '/admin/users',
        label: 'Consumer Base',
        component: <AdminUsers />,
        icon: <User size={14} />,
        flag: 'USERS'
      }
    ]
  },

  // ── FINANCE ──
  {
    category: 'Finance',
    icon: <Wallet size={18} />,
    flag: 'FINANCE',
    routes: [
      {
        path: '/admin/finance/transactions',
        label: 'Payments & Transactions',
        component: <AdminTransactions />,
        icon: <Wallet size={14} />,
        flag: 'FINANCE'
      },
      {
        path: '/admin/finance/wallets',
        label: 'Wallet System',
        component: <AdminWalletSystem />,
        icon: <Wallet size={14} />,
        flag: 'FINANCE'
      },
    
      {
        path: '/admin/finance/pricing',
        label: 'Pricing Engine',
        component: <AdminPricingEngine />,
        icon: <TrendingUp size={14} />,
        flag: 'FINANCE'
      },
      {
        path: '/admin/finance/payouts',
        label: 'Driver Payouts',
        component: <AdminPayouts />,
        icon: <Users size={14} />,
        flag: 'FINANCE'
      },
      {
        path: '/admin/finance/penalties',
        label: 'Penalties & Adjustments',
        component: <AdminPenalties />,
        icon: <BarChart3 size={14} />,
        flag: 'FINANCE'
      }
    ]
  },

  // ── SERVICES ──
  {
    category: 'Services',
    icon: <Car size={18} />,
    flag: 'SERVICES',
    routes: [
       {
        path: '/admin/finance/spare-driver-services',
        label: 'Spare Driver Services',
        component: <AdminSpareDriverServices />,
        icon: <Car size={14} />,
        flag: 'FINANCE'
      },
      {
        path: '/admin/vehicle-catalog',
        label: 'Vehicle Catalog',
        component: <AdminVehicleCatalog />,
        icon: <Car size={14} />,
        flag: 'SERVICES'
      }
    ]
  },

  // ── MARKETING ──
  {
    category: 'Marketing',
    icon: <Tag size={18} />,
    flag: 'MARKETING',
    routes: [
      {
        path: '/admin/promotions',
        label: 'Promotions & Banners',
        component: <AdminPromotions />,
        icon: <Tag size={14} />,
        flag: 'MARKETING'
      }
    ]
  },

  // ── SYSTEM CONTROL ──
  {
    category: 'System Control',
    icon: <Settings size={18} />,
    flag: 'SYSTEM_CONTROL',
    routes: [
      {
        path: '/admin/settings',
        label: 'Settings',
        component: <AdminSettings />,
        icon: <Settings size={14} />,
        flag: 'SYSTEM_CONTROL'
      }
    ]
  }
];

// ── FLATTEN ROUTES ──
export const getFlattenedRoutes = () => {
  return ADMIN_ROUTES_CONFIG.reduce((acc, cat) => {
    return [...acc, ...cat.routes];
  }, []);
};