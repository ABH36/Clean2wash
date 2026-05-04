import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';
import {
    Shield, Bell, Globe, Smartphone, Database, Lock, CreditCard,
    ChevronRight, Search, Github, Cpu, Zap, X, Activity, Server,
    Terminal, Key, Save, RefreshCcw, Layers, Share2, Settings
} from 'lucide-react';
import PageShell, { SectionCard, SearchBox } from '../components/PageShell';

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
                toast.success("Security Protocol Synchronized");
            }
        } catch (err) {
            console.error("Failed to update setting", err);
            toast.error("Update failed");
        } finally {
            setIsSaving(false);
        }
    };

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
                type: 'toggle'
            }))
        }
    ];

    return (
        <PageShell
            title="Command Center"
            subtitle="Infrastructure control and system parameter management"
            icon={Terminal}
            accent="navy"
            badge="Admin-v4"
            actions={
                <div className="flex items-center gap-4">
                    <SearchBox 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        placeholder="Query parameters..." 
                        className="lg:w-80"
                    />
                    <button 
                        onClick={fetchSettings} 
                        disabled={isSaving} 
                        className="adm-btn adm-btn-primary h-11 px-6 flex items-center gap-2"
                    >
                        {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Syncing' : 'Apply Changes'}
                    </button>
                </div>
            }
        >
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="adm-spinner" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Loading protocols...</span>
                </div>
            ) : (
                <div className="space-y-12">
                    {groupedSettings.map((group, i) => {
                        const items = group.items.filter(item => 
                            item.label.toLowerCase().includes(search.toLowerCase()) || 
                            item.sub.toLowerCase().includes(search.toLowerCase())
                        );
                        if (items.length === 0) return null;

                        return (
                            <div key={i} className="space-y-6">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">{group.title}</h4>
                                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {items.map((item, j) => (
                                        <SectionCard key={j} className="hover:border-amber-400 transition-all group relative overflow-hidden flex flex-col min-h-[220px]">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.type === 'toggle' ? (item.value ? 'bg-amber-100 text-amber-600 shadow-inner' : 'bg-slate-100 text-slate-400') : 'bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white'}`}>
                                                    {React.cloneElement(item.icon, { size: 20 })}
                                                </div>
                                                {item.status && (
                                                    <span className={`adm-badge ${['OPTIMAL', 'STABLE', 'ACTIVE'].includes(item.status) || item.status.includes('%') ? 'adm-badge-success' : 'adm-badge-info'}`}>
                                                        {item.status}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1">
                                                <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1 group-hover:text-amber-600 transition-colors">{item.label}</h5>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 line-clamp-1">{item.sub}</p>

                                                <div className="mt-auto">
                                                    {item.type === 'toggle' ? (
                                                        <button 
                                                            onClick={() => {
                                                                const newVal = !item.value;
                                                                setSettings(prev => prev.map(s => s.key === item.key ? { ...s, value: newVal } : s));
                                                                handleUpdate(item.key, newVal);
                                                            }} 
                                                            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${item.value ? 'bg-amber-500' : 'bg-slate-200'}`}
                                                        >
                                                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${item.value ? 'translate-x-6' : 'translate-x-0'} shadow-sm`} />
                                                        </button>
                                                    ) : (
                                                        <input 
                                                            type={typeof item.value === 'number' ? 'number' : 'text'} 
                                                            className="adm-input w-full h-10 text-xs font-bold" 
                                                            value={item.value} 
                                                            onChange={e => {
                                                                const val = typeof item.value === 'number' ? Number(e.target.value) : e.target.value;
                                                                setSettings(prev => prev.map(s => s.key === item.key ? { ...s, value: val } : s));
                                                            }} 
                                                            onBlur={e => {
                                                                const val = typeof item.value === 'number' ? Number(e.target.value) : e.target.value;
                                                                handleUpdate(item.key, val);
                                                            }} 
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <Layers className="absolute -bottom-6 -right-6 text-slate-50 w-24 h-24 group-hover:text-amber-500/5 transition-colors pointer-events-none" />
                                        </SectionCard>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex flex-col md:flex-row items-center justify-between border-t border-slate-100 pt-10 mt-16 text-slate-400 gap-6">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-slate-800 transition-colors">
                        <Github size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Repo: CW-Engine-v4</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                    <div className="flex items-center gap-2 cursor-pointer hover:text-slate-800 transition-colors">
                        <Server size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Cluster: Azure-South-Asia</span>
                    </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">© 2026 Spare Driver Intelligence</p>
            </div>
        </PageShell>
    );
};

export default AdminSettings;

