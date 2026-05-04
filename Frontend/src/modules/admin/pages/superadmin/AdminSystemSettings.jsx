import React, { useState, useEffect } from 'react';
import { 
    Settings2, Globe, Bell, Shield, Wallet, Zap, Database, 
    Cloud, CheckCircle2, Loader2, Save, AlertTriangle,
    ShieldCheck, Lock, Unlock, Mail, Percent, RefreshCw,
    Server, Cpu, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../../utils/adminApi';
import { toast } from 'react-hot-toast';
import PageShell, { SectionCard, PageLoader } from '../../components/PageShell';

const AdminSystemSettings = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // Key being saved

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getSettings();
            if (res.status === 'success') {
                setSettings(res.data.settings || []);
            }
        } catch (err) {
            toast.error("Failed to load platform configuration");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSettings(); }, []);

    const handleUpdate = async (key, value) => {
        try {
            setSaving(key);
            const res = await adminAPI.updateSetting(key, value);
            if (res.status === 'success') {
                setSettings(prev => prev.map(s => s.key === key ? res.data.setting : s));
                toast.success(`${key.replace(/_/g, ' ').toUpperCase()} updated`);
            }
        } catch (err) {
            toast.error(`Update failed for ${key}`);
        } finally {
            setSaving(null);
        }
    };

    const getSetting = (key) => settings.find(s => s.key === key);

    return (
        <PageShell
            title="System Orchestration"
            subtitle="Global platform configuration and mission-critical control desk"
            icon={Cpu}
            accent="slate"
            badge="Core-V1"
            actions={
                <div className="flex items-center gap-3">
                    <button onClick={fetchSettings} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-black uppercase">Secure Protocol Active</span>
                    </div>
                </div>
            }
        >
            {loading ? (
                <PageLoader />
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* ── CRITICAL SWITCHES ── */}
                    <div className="space-y-8">
                        <SectionCard 
                            title="Primary Override Switches" 
                            icon={Zap}
                            className="bg-slate-900 !border-slate-800"
                            headerClassName="!border-white/5"
                            titleClassName="!text-white"
                        >
                            <div className="space-y-6">
                                {/* Maintenance Mode */}
                                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl ${getSetting('maintenance_mode')?.value ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/40 shadow-inner'}`}>
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase text-white tracking-tight">Maintenance Mode</h4>
                                            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mt-1">Halt all consumer operations</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleUpdate('maintenance_mode', !getSetting('maintenance_mode')?.value)}
                                        className={`w-14 h-8 rounded-full relative transition-all ${getSetting('maintenance_mode')?.value ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-white/10'}`}
                                    >
                                        <motion.div 
                                            animate={{ x: getSetting('maintenance_mode')?.value ? 28 : 4 }}
                                            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                        />
                                    </button>
                                </div>

                                {/* Payout Freeze */}
                                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl ${getSetting('payout_freeze')?.value ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/40 shadow-inner'}`}>
                                            <Lock size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase text-white tracking-tight">Payout Freeze</h4>
                                            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mt-1">Suspend wallet withdrawals</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleUpdate('payout_freeze', !getSetting('payout_freeze')?.value)}
                                        className={`w-14 h-8 rounded-full relative transition-all ${getSetting('payout_freeze')?.value ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'bg-white/10'}`}
                                    >
                                        <motion.div 
                                            animate={{ x: getSetting('payout_freeze')?.value ? 28 : 4 }}
                                            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                        />
                                    </button>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Revenue Settings */}
                        <SectionCard title="Revenue & Commercial Rules" icon={Wallet}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Platform Commission</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            className="adm-input h-14 pl-6 pr-12 text-lg font-black"
                                            value={getSetting('platform_commission')?.value || 0}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setSettings(prev => prev.map(s => s.key === 'platform_commission' ? { ...s, value: val } : s));
                                            }}
                                            onBlur={(e) => handleUpdate('platform_commission', Number(e.target.value))}
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-black">%</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Min Withdrawal</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            className="adm-input h-14 pl-12 pr-6 text-lg font-black"
                                            value={getSetting('min_withdrawal')?.value || 0}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setSettings(prev => prev.map(s => s.key === 'min_withdrawal' ? { ...s, value: val } : s));
                                            }}
                                            onBlur={(e) => handleUpdate('min_withdrawal', Number(e.target.value))}
                                        />
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-black">₹</div>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    {/* ── PLATFORM DEFAULTS ── */}
                    <div className="space-y-8">
                        <SectionCard title="Global Platform Parameters" icon={Globe}>
                            <div className="space-y-8">
                                {/* Support Email */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Support Endpoint Email</label>
                                    <div className="flex gap-3">
                                        <div className="flex-1 relative">
                                            <input 
                                                className="adm-input h-14 pl-12"
                                                value={getSetting('support_email')?.value || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSettings(prev => prev.map(s => s.key === 'support_email' ? { ...s, value: val } : s));
                                                }}
                                            />
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        </div>
                                        <button 
                                            onClick={() => handleUpdate('support_email', getSetting('support_email')?.value)}
                                            className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all shadow-lg"
                                        >
                                            {saving === 'support_email' ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Firewall Node */}
                                <div className="p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-between group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-inner">
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Security Perimeter</h4>
                                            <p className="text-sm font-black text-slate-800 uppercase">{getSetting('firewall_mode')?.value || 'Active Protocol'}</p>
                                        </div>
                                    </div>
                                    <button className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-700 tracking-widest">Rotate Keys</button>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Third Party Infrastructure */}
                        <SectionCard title="Infrastructure Gateways" icon={Server}>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Cloudinary', status: 'Online', icon: Cloud },
                                    { label: 'Firebase', status: 'Online', icon: Bell },
                                    { label: 'Stripe', status: 'Online', icon: Wallet },
                                    { label: 'Twilio', status: 'Online', icon: Mail }
                                ].map((gw) => (
                                    <div key={gw.label} className="p-5 rounded-[2rem] border border-slate-50 bg-slate-50/50 flex items-center justify-between group hover:border-slate-200 transition-all grayscale opacity-50 hover:grayscale-0 hover:opacity-100 cursor-default">
                                        <div className="flex items-center gap-3">
                                            <gw.icon size={16} className="text-slate-400" />
                                            <span className="text-[11px] font-black uppercase tracking-tighter text-slate-600">{gw.label}</span>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </div>
                </div>
            )}
        </PageShell>
    );
};

export default AdminSystemSettings;
