import React, { useState, useEffect } from 'react';
import { 
    AlertOctagon, ShieldAlert, MapPin, Phone, User, Clock, CheckCircle2, 
    Loader2, RefreshCw, ExternalLink, Activity, Radio, Target, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';
import { socketService } from '../../../utils/socket';
import PageShell, { SectionCard, EmptyState, PageLoader } from '../components/PageShell';

const AdminSOSAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    const fetchSOS = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getActiveSOS();
            if (res.status === 'success') setAlerts(res.data.alerts || []);
        } catch { toast.error("Emergency queue sync failed"); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchSOS();
        socketService.joinAdminRoom();
        const onNew = (data) => {
            const newAlert = data.alert;
            setAlerts(prev => [newAlert, ...prev]);
            toast.error(`PRIORITY ZERO: ${newAlert.consumer?.name || 'User'}`, { 
                duration: 10000, 
                icon: '🚨',
                style: { 
                    background: '#991b1b', 
                    color: '#fff', 
                    fontWeight: '900',
                    borderRadius: '12px',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                } 
            });
        };
        const onClear = (data) => setAlerts(prev => prev.filter(a => a._id !== data.sosId));
        socketService.on('new_sos_alert', onNew);
        socketService.on('sos_alert_cleared', onClear);
        return () => { socketService.off('new_sos_alert', onNew); socketService.off('sos_alert_cleared', onClear); };
    }, []);

    const handleResolve = async (id) => {
        try {
            setProcessing(id);
            const res = await adminAPI.resolveSOS(id);
            if (res.status === 'success') { 
                setAlerts(prev => prev.filter(a => a._id !== id)); 
                toast.success("Incident archived: Sector secure"); 
            }
        } catch { toast.error("Resolution sequence failed"); }
        finally { setProcessing(null); }
    };

    return (
        <PageShell
            title="Responder Command"
            subtitle="Real-time emergency signal decryption and response"
            icon={AlertOctagon}
            accent="rose"
            badge={`Live: ${alerts.length}`}
            actions={
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl">
                        <Radio size={14} className="text-rose-600 animate-pulse" />
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Active Watch</span>
                    </div>
                    <button onClick={fetchSOS} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── LEFT: PRIORITY QUEUE ── */}
                <div className="lg:col-span-8 space-y-4">
                    {loading && alerts.length === 0 ? (
                        <PageLoader />
                    ) : alerts.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm py-32 flex flex-col items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">System Status: Secure</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1">No emergency transmissions detected in current sector.</p>
                            </div>
                            <button onClick={fetchSOS} className="adm-btn adm-btn-ghost text-[10px] uppercase font-black tracking-widest mt-2">
                                Run Diagnostics
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {alerts.map((alert, i) => (
                                <motion.div key={alert._id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-[2.5rem] border-2 border-rose-100 p-8 shadow-xl shadow-rose-500/5 hover:border-rose-400 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity"><AlertOctagon size={160} /></div>
                                    
                                    <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center relative z-10">
                                        {/* Identity Section */}
                                        <div className="flex items-center gap-5 min-w-[280px]">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-3xl bg-slate-100 overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform">
                                                    {alert.consumer?.profile?.avatar
                                                        ? <img src={alert.consumer.profile.avatar} alt="" className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={28} /></div>}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                                                    <Activity size={12} />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1.5">{alert.consumer?.name || 'Protocol-Anonymous'}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="adm-badge adm-badge-error text-[9px] px-2 py-0.5 rounded-lg shadow-sm">
                                                        CRITICAL INCIDENT
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{alert.type || 'SOS'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <button className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                                                        <Phone size={14} />
                                                    </button>
                                                    <span className="text-xs font-black text-slate-600 tracking-wide">{alert.consumer?.phone}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Context Matrix */}
                                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Transmission</p>
                                                <div className="flex items-center gap-2 text-rose-600">
                                                    <Clock size={12} />
                                                    <span className="text-xs font-black uppercase">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Live Uplink</p>
                                            </div>
                                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Entity Trace</p>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">#{alert.booking?.bookingId?.slice(-8) || 'NONE'}</p>
                                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">{alert.booking?.status || 'STANDBY'}</p>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1 bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg shadow-slate-900/10 flex flex-col justify-between cursor-pointer hover:bg-black transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Geolocation</p>
                                                    <Navigation size={12} className="text-amber-500" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-rose-500" />
                                                    <span className="text-[10px] font-black text-white uppercase truncate">Intercept Active</span>
                                                    <ExternalLink size={10} className="ml-auto text-slate-500" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Node */}
                                        <div className="flex flex-col gap-3 shrink-0 w-full lg:w-[180px]">
                                            <a href={`tel:${alert.consumer?.phone}`}
                                                className="adm-btn adm-btn-primary h-12 justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                                <Radio size={14} /> Establish Comms
                                            </a>
                                            <button onClick={() => handleResolve(alert._id)} disabled={processing === alert._id}
                                                className="adm-btn adm-btn-success h-12 justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                                {processing === alert._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                Resolve Signal
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* ── RIGHT: INTEL PANEL ── */}
                <div className="lg:col-span-4 space-y-6">
                    <SectionCard title="Protocol Diagnostics" noPad>
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Response Latency</span>
                                    <span className="text-xs font-black text-emerald-500">&lt; 2.4s</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="bg-emerald-500 h-full" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Incidents</p>
                                    <h4 className="text-xl font-black text-slate-800">{alerts.length}</h4>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clearance</p>
                                    <h4 className="text-xl font-black text-slate-800">100%</h4>
                                </div>
                            </div>

                            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-4">
                                <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-1" />
                                <div>
                                    <p className="text-xs font-black text-rose-600 uppercase tracking-tight">Active Warning</p>
                                    <p className="text-[10px] text-rose-500 font-medium leading-relaxed mt-1">
                                        All field agents are currently in high-alert status. Ensure all resolution logs are signed.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Operational Intel" noPad>
                        <div className="p-6">
                            <div className="space-y-5">
                                {[
                                    { label: 'Dispatch Link', status: 'Stable', color: 'text-emerald-500' },
                                    { label: 'Carrier Signal', status: 'Optimal', color: 'text-emerald-500' },
                                    { label: 'Geo-Fence', status: 'Monitoring', color: 'text-amber-500' },
                                    { label: 'Auth Protocols', status: 'Locked', color: 'text-emerald-500' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{item.label}</span>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase ${item.color}`}>{item.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SectionCard>
                </div>
            </div>
        </PageShell>
    );
};


export default AdminSOSAlerts;

