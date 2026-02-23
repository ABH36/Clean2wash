import React from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import {
    Shield,
    Bell,
    Globe,
    Smartphone,
    Database,
    Lock,
    CreditCard,
    ChevronRight,
    Search,
    Github,
    Cpu,
    Zap
} from 'lucide-react';

const AdminSettings = () => {
    const SETTINGS_GROUPS = [
        {
            title: 'Infrastructure',
            items: [
                { icon: <Cpu />, label: 'System Engine', sub: 'Version 4.2.0 (Stable)', status: 'Optimal', type: 'system' },
                { icon: <Database />, label: 'Data Warehouse', sub: '92% Performance Index', status: 'Healthy', type: 'system' },
                { icon: <Zap />, label: 'API Gateway', sub: 'Latancy < 20ms', status: 'Optimal', type: 'system' },
            ]
        },
        {
            title: 'Platform Logic',
            items: [
                { icon: <Shield />, label: 'Security & Auth', sub: '2FA, Session Control, CORS', type: 'config' },
                { icon: <Bell />, label: 'Notification Hub', sub: 'FCM, Webhook, SMS Config', type: 'config' },
                { icon: <CreditCard />, label: 'Payment Bridges', sub: 'Razorpay, Stripe, UPI Gateway', type: 'config' },
            ]
        },
        {
            title: 'Admin Experience',
            items: [
                { icon: <Globe />, label: 'Multi-Region Support', sub: 'Bengaluru, Delhi, Noida Hubs', type: 'config' },
                { icon: <Lock />, label: 'RBAC Controls', sub: 'Admin Roles & Permissions', type: 'config' },
            ]
        }
    ];

    return (
        <AdminLayout title="System Settings">
            <div className="max-w-5xl mx-auto space-y-10">
                {/* Search / filter top bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
                            <Cpu size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-content italic uppercase tracking-tight leading-none">Global Control Center</h3>
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mt-1 italic">Hoora Platform Config</p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle" size={16} />
                        <input
                            type="text"
                            placeholder="Search parameters..."
                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 text-xs font-bold text-content outline-none focus:border-brand"
                        />
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 gap-12 pb-20">
                    {SETTINGS_GROUPS.map((group, i) => (
                        <div key={i} className="space-y-6">
                            <div className="flex items-center gap-4 px-4">
                                <h4 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] font-black italic">{group.title}</h4>
                                <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {group.items.map((item, j) => (
                                    <motion.button
                                        key={j}
                                        whileTap={{ scale: 0.98 }}
                                        className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft text-left hover:border-brand hover:shadow-lg transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-content-subtle group-hover:bg-brand/10 group-hover:text-brand transition-all">
                                                {React.cloneElement(item.icon, { size: 20 })}
                                            </div>
                                            {item.status && (
                                                <span className="bg-green-50 text-green-600 text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest italic">
                                                    {item.status}
                                                </span>
                                            )}
                                        </div>
                                        <h5 className="text-sm font-black text-content uppercase tracking-tight italic mb-1 group-hover:text-brand transition-colors">{item.label}</h5>
                                        <p className="text-[10px] font-bold text-content-subtle lowercase">{item.sub}</p>

                                        <div className="mt-6 flex items-center justify-between">
                                            <span className="text-[8px] font-black text-brand uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Configure →</span>
                                            <ChevronRight size={14} className="text-gray-200 group-hover:text-brand transition-all" />
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* System Footer info */}
                <div className="flex items-center justify-between text-content-subtle border-t border-gray-100 pt-8 italic">
                    <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Github size={12} />
                        Repo Connected: hoora-base-core
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest">© 2026 Hoora Auto Technologies</p>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
