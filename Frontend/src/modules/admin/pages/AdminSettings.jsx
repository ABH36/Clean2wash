import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';
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
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getSettings();
            if (res.status === 'success') {
                setSettings(res.data.settings);
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key, value) => {
        try {
            setIsSaving(true);
            const res = await adminAPI.updateSetting(key, value);
            if (res.status === 'success') {
                await fetchSettings();
                toast.success("Security Protocol Synchronized: Update Successful");
            }
        } catch (err) {
            console.error("Failed to update setting", err);
            toast.error("Security Protocol Breach: Update Failed");
        } finally {
            setIsSaving(false);
        }
    };

    // Grouping logic for the UI
    const groupedSettings = [
        {
            title: 'CORE ARCHITECTURE',
            items: settings.filter(s => s.category === 'Ops' || s.category === 'General').map(s => ({
                key: s.key,
                value: s.value,
                icon: s.key.includes('firewall') ? <Cpu /> : <Database />,
                label: s.key.split('_').map(word => word.toUpperCase()).join(' '),
                sub: s.description || 'System Parameter',
                status: typeof s.value === 'number' ? 'SCALABLE' : 'STABLE',
                color: 'text-brand',
                bg: 'bg-brand/10'
            }))
        },
        {
            title: 'FINANCIAL PROTOCOLS',
            items: settings.filter(s => s.category === 'Financial').map(s => ({
                key: s.key,
                value: s.value,
                icon: <CreditCard />,
                label: s.key.split('_').map(word => word.toUpperCase()).join(' '),
                sub: s.description || 'Revenue Logic',
                status: `${s.value}${s.key.includes('commission') ? '%' : ''}`,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50'
            }))
        },
        {
            title: 'EMERGENCY & SECURITY',
            items: settings.filter(s => s.category === 'Security' || s.key.includes('mode') || s.key.includes('freeze')).map(s => ({
                key: s.key,
                value: s.value,
                icon: s.key.includes('maintenance') ? <Zap /> : <Shield />,
                label: s.key.split('_').map(word => word.toUpperCase()).join(' '),
                sub: s.description || 'Defense Protocol',
                status: s.value === true ? 'ACTIVE' : 'INACTIVE',
                color: s.value === true ? 'text-brand' : 'text-content-subtle',
                bg: s.value === true ? 'bg-brand/10' : 'bg-gray-100/5',
                type: 'toggle'
            }))
        }
    ];

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Tactical Command Bar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-soft relative overflow-hidden group">
                    <div className="flex items-center gap-5 z-10">
                        <div className="w-16 h-16 bg-content text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-content/20 group-hover:bg-brand transition-all">
                            <Terminal size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-content uppercase tracking-tighter leading-none">Command Center</h3>
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mt-2 px-1">Infrastructure Control Unit</p>
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
                            onClick={fetchSettings}
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
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-12 pb-20">
                        {groupedSettings.map((group, i) => (
                            <div key={i} className="space-y-8">
                                <div className="flex items-center gap-4 px-6">
                                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                    <h4 className="text-[11px] font-black text-content uppercase tracking-[0.4em]">{group.title}</h4>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-gray-100 to-transparent" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {group.items.filter(item =>
                                        item.label.toLowerCase().includes(search.toLowerCase()) ||
                                        item.sub.toLowerCase().includes(search.toLowerCase())
                                    ).map((item, j) => (
                                        <motion.div
                                            key={j}
                                            whileHover={{ y: -5 }}
                                            className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-soft text-left hover:border-brand hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col"
                                        >
                                            <div className="flex justify-between items-start mb-8 relative z-10">
                                                <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center group-hover:bg-content group-hover:text-white transition-all shadow-sm`}>
                                                    {React.cloneElement(item.icon, { size: 24 })}
                                                </div>
                                                {item.status && (
                                                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${item.status === 'OPTIMAL' || item.status === 'STABLE' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-brand/10 text-brand border-brand/20'}`}>
                                                        {item.status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative z-10">
                                                <h5 className="text-base font-black text-content uppercase tracking-tight mb-1.5 group-hover:text-brand transition-colors">{item.label}</h5>
                                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-tighter opacity-70 mb-4">{item.sub}</p>

                                                <div className="mb-6">
                                                    {item.type === 'toggle' ? (
                                                        <div
                                                            onClick={() => {
                                                                const newVal = !item.value;
                                                                setSettings(prev => prev.map(s => s.key === item.key ? { ...s, value: newVal } : s));
                                                                handleUpdate(item.key, newVal);
                                                            }}
                                                            className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-300 ${item.value === true ? 'bg-brand' : 'bg-gray-200'}`}
                                                        >
                                                            <motion.div
                                                                animate={{ x: item.value === true ? 24 : 0 }}
                                                                className="w-6 h-6 bg-white rounded-full shadow-lg"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type={typeof item.value === 'number' ? 'number' : 'text'}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-content outline-none focus:border-brand transition-all"
                                                            value={item.value}
                                                            onChange={(e) => {
                                                                const val = typeof item.value === 'number' ? Number(e.target.value) : e.target.value;
                                                                setSettings(prev => prev.map(s => s.key === item.key ? { ...s, value: val } : s));
                                                            }}
                                                            onBlur={(e) => {
                                                                const val = typeof item.value === 'number' ? Number(e.target.value) : e.target.value;
                                                                handleUpdate(item.key, val);
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between relative z-10 pt-6 border-t border-gray-50">
                                                <span className="text-[9px] font-black text-brand uppercase tracking-widest">Live Parameter</span>
                                                <Key size={16} className="text-gray-200 group-hover:text-brand transition-all" />
                                            </div>
                                            <Layers className="absolute -bottom-6 -right-6 text-gray-50 size-24 group-hover:text-brand/5 transition-colors" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Infrastructure Integrity Manifest */}
                <div className="flex flex-col md:flex-row items-center justify-between text-content-subtle border-t border-gray-100 pt-10 px-6 gap-6 mb-10">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <Github size={14} className="group-hover:text-brand transition-colors" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-content transition-colors">Repo: CW-Engine-v4</p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <Server size={14} className="group-hover:text-brand transition-colors" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-content transition-colors">Cluster: Azure-South-Asia</p>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">© 2026 Spare Driver Intelligence Systems</p>
                </div>
            </div>
        </>
    );
};

export default AdminSettings;
