import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Zap,
    X,
    Activity,
    Server,
    Terminal,
    Key,
    Save,
    RefreshCcw,
    Layers,
    Share2
} from 'lucide-react';

const AdminSettings = () => {
    const [search, setSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const SETTINGS_GROUPS = [
        {
            title: 'CORE ARCHITECTURE',
            items: [
                { icon: <Cpu />, label: 'Neural Engine', sub: 'v4.2.0-STABLE', status: 'OPTIMAL', color: 'text-brand', bg: 'bg-brand/10' },
                { icon: <Database />, label: 'Data Warehouse', sub: 'Postgres Cluster: ACTIVE', status: '98%', color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: <Zap />, label: 'API Gateway', sub: 'Edge Routing: ENABLED', status: '8ms', color: 'text-amber-600', bg: 'bg-amber-50' },
            ]
        },
        {
            title: 'PLATFORM PROTOCOLS',
            items: [
                { icon: <Shield />, label: 'Security Firewall', sub: '2FA / JWT / CORS Matrix', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { icon: <Bell />, label: 'Event Dispatcher', sub: 'FCM / Webhooks / SMTP', color: 'text-rose-600', bg: 'bg-rose-50' },
                { icon: <CreditCard />, label: 'Liquidity Bridges', sub: 'Razorpay / Stripe / UPI', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ]
        },
        {
            title: 'OPERATIONAL LOGIC',
            items: [
                { icon: <Globe />, label: 'Cluster Mapping', sub: 'Multi-Region Hub Grid', color: 'text-cyan-600', bg: 'bg-cyan-50' },
                { icon: <Lock />, label: 'RBAC Protocols', sub: 'Identity & Access Control', color: 'text-violet-600', bg: 'bg-violet-50' },
                { icon: <Share2 />, label: 'Integration Bus', sub: 'Third-party Service Mesh', color: 'text-slate-600', bg: 'bg-slate-50' },
            ]
        }
    ];

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1500);
    };

    return (
        <AdminLayout title="System Configuration">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Tactical Command Bar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-soft relative overflow-hidden group">
                    <div className="flex items-center gap-5 z-10">
                        <div className="w-16 h-16 bg-content text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-content/20 group-hover:bg-brand transition-all">
                            <Terminal size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-content italic uppercase tracking-tighter leading-none">Command Center</h3>
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mt-2 italic px-1">Infrastructure Control Unit</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto z-10">
                        <div className="relative flex-1 lg:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle" size={16} />
                            <input
                                type="text"
                                placeholder="Query parameters..."
                                className="w-full h-14 bg-gray-50 border border-gray-100 rounded-[1.25rem] pl-12 pr-4 text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`h-14 px-8 rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all ${isSaving ? 'bg-brand text-white' : 'bg-content text-white hover:bg-brand shadow-lg shadow-content/10 hover:shadow-brand/20'}`}
                        >
                            {isSaving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
                            {isSaving ? 'Syncing' : 'Apply'}
                        </button>
                    </div>
                    <Activity className="absolute -top-10 -right-10 text-gray-50 size-48 opacity-10 group-hover:text-brand/5 transition-colors" />
                </div>

                {/* Configuration Matrix */}
                <div className="grid grid-cols-1 gap-12 pb-20">
                    {SETTINGS_GROUPS.map((group, i) => (
                        <div key={i} className="space-y-8">
                            <div className="flex items-center gap-4 px-6">
                                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                <h4 className="text-[11px] font-black text-content uppercase tracking-[0.4em] italic">{group.title}</h4>
                                <div className="h-[2px] flex-1 bg-gradient-to-r from-gray-100 to-transparent" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {group.items.filter(item =>
                                    item.label.toLowerCase().includes(search.toLowerCase()) ||
                                    item.sub.toLowerCase().includes(search.toLowerCase())
                                ).map((item, j) => (
                                    <motion.button
                                        key={j}
                                        whileHover={{ y: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-soft text-left hover:border-brand hover:shadow-2xl transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center group-hover:bg-content group-hover:text-white transition-all shadow-sm`}>
                                                {React.cloneElement(item.icon, { size: 24 })}
                                            </div>
                                            {item.status && (
                                                <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest italic border ${item.status === 'OPTIMAL' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-brand/10 text-brand border-brand/20'}`}>
                                                    {item.status}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative z-10">
                                            <h5 className="text-base font-black text-content uppercase tracking-tight italic mb-1.5 group-hover:text-brand transition-colors">{item.label}</h5>
                                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-tighter opacity-70 mb-8">{item.sub}</p>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between relative z-10 pt-6 border-t border-gray-50">
                                            <span className="text-[9px] font-black text-brand uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 italic">Update Parameters →</span>
                                            <Key size={16} className="text-gray-200 group-hover:text-brand transition-all" />
                                        </div>
                                        <Layers className="absolute -bottom-6 -right-6 text-gray-50 size-24 group-hover:text-brand/5 transition-colors" />
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Infrastructure Integrity Manifest */}
                <div className="flex flex-col md:flex-row items-center justify-between text-content-subtle border-t border-gray-100 pt-10 px-6 gap-6 mb-10">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <Github size={14} className="group-hover:text-brand transition-colors" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-content transition-colors italic">Repo: CW-Engine-v4</p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <Server size={14} className="group-hover:text-brand transition-colors" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-content transition-colors italic">Cluster: Azure-South-Asia</p>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">© 2026 CarWash Intelligence Systems</p>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
