import React from 'react';
import { LayoutDashboard, Car, Tag, Settings } from 'lucide-react';

const AdminSpareDrivers = React.lazy(() => import('./pages/AdminSpareDrivers'));
const AdminPromotions = React.lazy(() => import('./pages/AdminPromotions'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));

export const ADMIN_ROUTES_CONFIG = [
    {
        category: 'Spare Driver Ops',
        icon: <Car size={18} />,
        routes: [
            {
                path: '/admin',
                label: 'Control Center',
                component: <AdminSpareDrivers />,
                icon: <LayoutDashboard size={14} />
            },
            {
                path: '/admin/spare-drivers',
                label: 'Driver Desk',
                component: <AdminSpareDrivers />,
                icon: <Car size={14} />
            },
            {
                path: '/admin/spare-drivers/*',
                label: 'Driver Sections',
                component: <AdminSpareDrivers />,
                icon: <Car size={14} />,
                hidden: true
            }
        ]
    },
    {
        category: 'Growth',
        icon: <Tag size={18} />,
        routes: [
            {
                path: '/admin/promotions',
                label: 'Campaigns',
                component: <AdminPromotions />,
                icon: <Tag size={14} />
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
            }
        ]
    }
];

export const getFlattenedRoutes = () => ADMIN_ROUTES_CONFIG.reduce((acc, category) => [...acc, ...category.routes], []);
