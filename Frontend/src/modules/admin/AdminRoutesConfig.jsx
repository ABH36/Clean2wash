import React from 'react';
import { 
    LayoutDashboard, Car, Tag, Settings, Users, Package, 
    MapPin, Bell, BarChart3, Shield, Truck, Building, 
    CreditCard, Wallet, DollarSign, FileText, Activity,
    Calendar, Search, AlertTriangle, CheckCircle, Clock,
    TrendingUp, Database, Zap, Target, Crown, MessageCircle,
    ClipboardList, Share2, Megaphone, BellRing, Settings2,
    CheckSquare, LifeBuoy, AlertOctagon, History, RefreshCcw
} from 'lucide-react';

/**
 * ─── ADMIN ROUTES CONFIGURATION ───────────────────────────────────
 * Structured for Phase 1 Redesign matching the reference cockpit.
 * Phase 4: Missing Module Shells integrated.
 */

// ── Dashboard & Analytics ──
const AdminDashboardUpgraded = React.lazy(() => import('./pages/AdminDashboardUpgraded'));
const AdminReports = React.lazy(() => import('./pages/reports/AdminReports'));
const AdminNotifications = React.lazy(() => import('./pages/AdminNotifications'));
// ── Support Desk ──
const AdminSupportTickets = React.lazy(() => import('./pages/AdminSupportTickets'));
const AdminSOSAlerts = React.lazy(() => import('./pages/AdminSOSAlerts'));
const AdminChatSupport = React.lazy(() => import('./pages/AdminChatSupport'));

// ── Operations ──
const AdminBookings = React.lazy(() => import('./pages/AdminBookings'));
const AdminBookingsOperations = React.lazy(() => import('./pages/AdminBookingsOperations'));
const AdminDispatchEngine = React.lazy(() => import('./pages/AdminDispatchEngine'));
const AdminLiveTracking = React.lazy(() => import('./pages/AdminLiveTracking'));
const ZoneManagement = React.lazy(() => import('./pages/operations/ZoneManagement'));

// ── Driver Management ──
const AdminDriversOperations = React.lazy(() => import('./pages/AdminDriversOperations'));
const AdminSpareDrivers = React.lazy(() => import('./pages/AdminSpareDrivers'));

// ── User Management ──
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));

// ── Finance ──
const AdminTransactions = React.lazy(() => import('./pages/finance/AdminTransactions'));
const AdminDriverPayouts = React.lazy(() => import('./pages/finance/AdminDriverPayouts'));
const AdminRefunds = React.lazy(() => import('./pages/finance/AdminRefunds'));

// ── Growth & Marketing ──
const AdminPromotions = React.lazy(() => import('./pages/AdminPromotions'));
const AdminAdvertisements = React.lazy(() => import('./pages/AdminAdvertisements'));
const AdminSocialCampaigns = React.lazy(() => import('./pages/AdminSocialCampaigns'));

// ── Task Management ──
const AdminTaskManager = React.lazy(() => import('./pages/AdminTaskManager'));

// ── Notifications ──
const AdminSystemAlerts = React.lazy(() => import('./pages/AdminSystemAlerts'));

// ── Super Admin Control ──
const AdminManagement = React.lazy(() => import('./pages/superadmin/AdminManagement'));
const RoleManagement = React.lazy(() => import('./pages/superadmin/RoleManagement'));
const ActivityLogs = React.lazy(() => import('./pages/superadmin/ActivityLogs'));
const AdminSystemSettings = React.lazy(() => import('./pages/superadmin/AdminSystemSettings'));

// ── Placeholder Shells (remaining small modules) ──
const ComingSoon = ({ title }) => (
    <div className="flex items-center justify-center min-h-[400px] flex-col gap-4 text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <Activity size={48} className="animate-pulse" />
        <div className="text-center">
            <p className="text-sm font-black text-slate-800 uppercase tracking-widest">{title || 'Module'} Coming Soon</p>
            <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">Wiring data feed in Phase 5</p>
        </div>
    </div>
);

export const ADMIN_ROUTES_CONFIG = [
    {
        path: '/admin',
        label: 'Dashboard',
        component: <AdminDashboardUpgraded />,
        icon: <LayoutDashboard size={18} />
    },
    {
        category: 'Bookings',
        icon: <Calendar size={18} />,
        routes: [
            {
                path: '/admin/bookings',
                label: 'All Bookings',
                component: <AdminBookings />,
                icon: <ClipboardList size={14} />
            },
            {
                path: '/admin/bookings-operations',
                label: 'Operations',
                component: <AdminBookingsOperations />,
                icon: <Target size={14} />
            }
        ]
    },
    {
        category: 'Operations',
        icon: <Activity size={18} />,
        routes: [
            {
                path: '/admin/dispatch-engine',
                label: 'Dispatch Engine',
                component: <AdminDispatchEngine />,
                icon: <Zap size={14} />
            },
            {
                path: '/admin/live-tracking',
                label: 'Live Tracking',
                component: <AdminLiveTracking />,
                icon: <MapPin size={14} />
            },
            {
                path: '/admin/zones',
                label: 'Service Zones',
                component: <ZoneManagement />,
                icon: <Building size={14} />
            }
        ]
    },
    {
        category: 'Drivers',
        icon: <Car size={18} />,
        routes: [
            {
                path: '/admin/drivers-operations',
                label: 'Driver Management',
                component: <AdminDriversOperations />,
                icon: <Users size={14} />
            },
            {
                path: '/admin/drivers/kyc',
                label: 'KYC Verification',
                component: <AdminSpareDrivers />,
                icon: <Shield size={14} />
            }
        ]
    },
    {
        category: 'Customers',
        icon: <Users size={18} />,
        routes: [
            {
                path: '/admin/users',
                label: 'User Management',
                component: <AdminUsers />,
                icon: <Users size={14} />
            }
        ]
    },
    {
        category: 'Support Desk',
        icon: <LifeBuoy size={18} />,
        routes: [
            {
                path: '/admin/support/tickets',
                label: 'Tickets',
                component: <AdminSupportTickets />,
                icon: <FileText size={14} />
            },
            {
                path: '/admin/support/sos',
                label: 'SOS Alerts',
                component: <AdminSOSAlerts />,
                icon: <AlertOctagon size={14} />,
                badge: 'Live'
            },
            {
                path: '/admin/support/chat',
                label: 'Chat Support',
                component: <AdminChatSupport />,
                icon: <MessageCircle size={14} />,
                badge: 'New'
            }
        ]
    },
    {
        path: '/admin/tasks',
        label: 'Task Management',
        component: <AdminTaskManager />,
        icon: <CheckSquare size={18} />,
        badge: 'New'
    },
    {
        category: 'Finance',
        icon: <DollarSign size={18} />,
        routes: [
            {
                path: '/admin/finance/transactions',
                label: 'Transactions',
                component: <AdminTransactions />,
                icon: <History size={14} />
            },
            {
                path: '/admin/finance/payouts',
                label: 'Driver Payouts',
                component: <AdminDriverPayouts />,
                icon: <Wallet size={14} />
            },
            {
                path: '/admin/finance/refunds',
                label: 'Refunds',
                component: <AdminRefunds />,
                icon: <RefreshCcw size={14} />
            }
        ]
    },
    {
        category: 'Promotions',
        icon: <Tag size={18} />,
        routes: [
            {
                path: '/admin/promotions',
                label: 'Coupons / Offers',
                component: <AdminPromotions />,
                icon: <Zap size={14} />
            },
            {
                path: '/admin/promotions/ads',
                label: 'Advertisements',
                component: <AdminAdvertisements />,
                icon: <Megaphone size={14} />,
                badge: 'New'
            }
        ]
    },
    {
        category: 'Social Media',
        icon: <Share2 size={18} />,
        routes: [
            {
                path: '/admin/social/campaigns',
                label: 'Campaigns',
                component: <AdminSocialCampaigns />,
                icon: <TrendingUp size={14} />
            }
        ]
    },
    {
        category: 'Notifications',
        icon: <Bell size={18} />,
        routes: [
            {
                path: '/admin/notifications/push',
                label: 'Push Notifications',
                component: <AdminNotifications />,
                icon: <BellRing size={14} />
            },
            {
                path: '/admin/notifications/system',
                label: 'System Alerts',
                component: <AdminSystemAlerts />,
                icon: <AlertTriangle size={14} />
            }
        ]
    },
    {
        path: '/admin/reports',
        label: 'Reports & Analytics',
        component: <AdminReports />,
        icon: <BarChart3 size={18} />
    },
    {
        path: '/admin/fraud',
        label: 'Security & Fraud',
        component: <ActivityLogs />, // Pointing to ActivityLogs as placeholder for Fraud security
        icon: <Shield size={18} />
    },
    {
        category: 'Admin Control',
        icon: <Settings size={18} />,
        routes: [
            {
                path: '/admin/superadmin/roles',
                label: 'Roles & Permissions',
                component: <RoleManagement />,
                icon: <Crown size={14} />
            },
            {
                path: '/admin/superadmin/staff',
                label: 'Staff Management',
                component: <AdminManagement />,
                icon: <Users size={14} />
            },
            {
                path: '/admin/superadmin/settings',
                label: 'System Settings',
                component: <AdminSystemSettings />,
                icon: <Settings2 size={14} />
            },
            {
                path: '/admin/superadmin/logs',
                label: 'Activity Logs',
                component: <ActivityLogs />,
                icon: <FileText size={14} />
            }
        ]
    }
];

/**
 * Utility to flatten nested route configuration for React Router consumption.
 */
export const getFlattenedRoutes = () => {
    const flattened = [];
    const flatten = (items) => {
        items.forEach(item => {
            if (item.path && item.component) {
                flattened.push(item);
            }
            if (item.routes) {
                flatten(item.routes);
            }
        });
    };
    flatten(ADMIN_ROUTES_CONFIG);
    return flattened;
};
