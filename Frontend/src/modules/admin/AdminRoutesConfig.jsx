import React from 'react';
import { 
    LayoutDashboard, Car, Tag, Settings, Users, Package, 
    MapPin, Bell, BarChart3, Shield, Truck, Building, 
    CreditCard, Wallet, DollarSign, FileText, Activity,
    Calendar, Search, AlertTriangle, CheckCircle, Clock,
    TrendingUp, Database, Zap, Target, Crown
} from 'lucide-react';

// ── Dashboard & Analytics ──
const AdminDashboardUpgraded = React.lazy(() => import('./pages/AdminDashboardUpgraded'));
// ── Operations ──
const AdminSpareDrivers = React.lazy(() => import('./pages/AdminSpareDrivers'));
const AdminBookings = React.lazy(() => import('./pages/AdminBookings'));
const AdminBookingsOperations = React.lazy(() => import('./pages/AdminBookingsOperations'));
const AdminDispatchEngine = React.lazy(() => import('./pages/AdminDispatchEngine'));
const AdminLiveTracking = React.lazy(() => import('./pages/AdminLiveTracking'));

// ── Driver Management ──
const AdminDriversOperations = React.lazy(() => import('./pages/AdminDriversOperations'));
// ── User Management ──
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));

// ── Vehicle Management ──
const AdminVehicleCatalog = React.lazy(() => import('./pages/AdminVehicleCatalog'));
const AdminVehicleManagement = React.lazy(() => import('./pages/AdminVehicleManagement'));

// ── Finance ──
const AdminTransactions = React.lazy(() => import('./pages/finance/AdminTransactions'));
const AdminDriverPayouts = React.lazy(() => import('./pages/finance/AdminDriverPayouts'));
const AdminPenalties = React.lazy(() => import('./pages/finance/AdminPenalties'));
const AdminPricingEngine = React.lazy(() => import('./pages/finance/AdminPricingEngine'));
const AdminSpareDriverServices = React.lazy(() => import('./pages/finance/AdminSpareDriverServices'));
const AdminWalletSystem = React.lazy(() => import('./pages/finance/AdminWalletSystem'));

// ── Growth & Marketing ──
const AdminPromotions = React.lazy(() => import('./pages/AdminPromotions'));

// ── Super Admin Control ──
const AdminManagement = React.lazy(() => import('./pages/superadmin/AdminManagement'));
const RoleManagement = React.lazy(() => import('./pages/superadmin/RoleManagement'));
const ActivityLogs = React.lazy(() => import('./pages/superadmin/ActivityLogs'));

// ── System ──
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));
const TestPage = React.lazy(() => import('./pages/TestPage'));

export const ADMIN_ROUTES_CONFIG = [
    {
        category: 'Dashboard & Analytics',
        icon: <LayoutDashboard size={18} />,
        routes: [
            {
                path: '/admin',
                label: 'Dashboard',
                component: <AdminDashboardUpgraded />,
                icon: <LayoutDashboard size={14} />
            },
        ]
    },
    {
        category: 'Operations',
        icon: <Activity size={18} />,
        routes: [
            {
                path: '/admin/spare-drivers/*',
                label: 'Driver Sections',
                component: <AdminSpareDrivers />,
                icon: <Car size={14} />,
                hidden: true
            },
            {
                path: '/admin/bookings-operations',
                label: 'Booking Operations',
                component: <AdminBookingsOperations />,
                icon: <Target size={14} />
            },
            {
                path: '/admin/dispatch-engine',
                label: 'Dispatch Engine',
                component: <AdminDispatchEngine />,
                icon: <Database size={14} />
            },
            {
                path: '/admin/live-tracking',
                label: 'Live Tracking',
                component: <AdminLiveTracking />,
                icon: <MapPin size={14} />
            }
        ]
    },
    {
        category: 'Driver Management',
        icon: <Users size={18} />,
        routes: [
            {
                path: '/admin/drivers-operations',
                label: 'Driver Operations',
                component: <AdminDriversOperations />,
                icon: <Users size={14} />
            },
             {
                path: '/admin/driver-payouts',
                label: 'Driver Payouts',
                component: <AdminDriverPayouts />,
                icon: <Wallet size={14} />
            },
            {
                path: '/admin/vehicle-management',
                label: 'Vehicle Management',
                component: <AdminVehicleManagement />,
                icon: <Truck size={14} />
            }
        ]
    },
    {
        category: 'User Management',
        icon: <Users size={18} />,
        routes: [
            {
                path: '/admin/users',
                label: 'Users',
                component: <AdminUsers />,
                icon: <Users size={14} />
            }
        ]
    },
    {
        category: 'Services',
        icon: <Package size={18} />,
        routes: [
            {
                path: '/admin/spare-driver-services',
                label: 'Spare Driver Services',
                component: <AdminSpareDriverServices />,
                icon: <Car size={14} />
            },
             {
                path: '/admin/pricing-engine',
                label: 'Pricing Engine',
                component: <AdminPricingEngine />,
                icon: <TrendingUp size={14} />
            },
        ]
    },
    {
        category: 'Vehicle Management',
        icon: <Car size={18} />,
        routes: [
            {
                path: '/admin/vehicle-catalog',
                label: 'Vehicle Catalog',
                component: <AdminVehicleCatalog />,
                icon: <Car size={14} />
            },
            
        ]
    },
    {
        category: 'Finance',
        icon: <DollarSign size={18} />,
        routes: [
            {
                path: '/admin/transactions',
                label: 'Transactions',
                component: <AdminTransactions />,
                icon: <CreditCard size={14} />
            }, 
            {
                path: '/admin/penalties',
                label: 'Penalties',
                component: <AdminPenalties />,
                icon: <AlertTriangle size={14} />
            },
            {
                path: '/admin/wallet-system',
                label: 'Wallet System',
                component: <AdminWalletSystem />,
                icon: <Wallet size={14} />
            }
        ]
    },
  
    {
        category: 'Growth & Marketing',
        icon: <Tag size={18} />,
        routes: [
            {
                path: '/admin/promotions',
                label: 'Promotions',
                component: <AdminPromotions />,
                icon: <Tag size={14} />
            }
        ]
    },
    {
        category: 'Super Admin Control',
        icon: <Crown size={18} />,
        routes: [
            {
                path: '/admin/admin-management',
                label: 'Admin Management',
                component: <AdminManagement />,
                icon: <Users size={14} />
            },
            {
                path: '/admin/role-management',
                label: 'Role Management',
                component: <RoleManagement />,
                icon: <Shield size={14} />
            },
            {
                path: '/admin/activity-logs',
                label: 'Activity Logs',
                component: <ActivityLogs />,
                icon: <Activity size={14} />
            }
        ]
    },
    {
        category: 'System',
        icon: <Settings size={18} />,
        routes: [
            {
                path: '/admin/settings',
                label: 'Settings',
                component: <AdminSettings />,
                icon: <Settings size={14} />
            },
            {
                path: '/admin/test',
                label: 'Test Page',
                component: <TestPage />,
                icon: <Activity size={14} />
            }
        ]
    }
];

export const getFlattenedRoutes = () => ADMIN_ROUTES_CONFIG.reduce((acc, category) => [...acc, ...category.routes], []);
