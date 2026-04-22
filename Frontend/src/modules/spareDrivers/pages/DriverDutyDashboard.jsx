import React, { useEffect, useState } from 'react';
import { 
    Clock, Activity, AlertTriangle, Coffee, Timer, 
    ChevronLeft, BarChart3, Zap, ShieldCheck, 
    History, Calendar, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import DriverLayout from '../components/DriverLayout';

const DriverDutyDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await spareDriverAPI.getDutyStats();
                if (res.status === 'success') {
                    setStats(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch duty stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatMinutes = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    if (loading) {
        return (
            <DriverLayout title="Duty Dashboard">
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="text-content/20 font-black uppercase tracking-[0.4em] animate-pulse">Syncing logs...</div>
                </div>
            </DriverLayout>
        );
    }

    const { summary, dutyHours, fatigueAlerts } = stats || {};
    const todayProgress = Math.min(((summary?.todayMinutes || 0) / 480) * 100, 100); // Assuming 8h daily limit

    return (
        <DriverLayout title="Duty Dashboard">
            <div className="px-4 py-4 space-y-6 pb-28">
                {/* ── Header ── */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-surface border border-content/5 flex items-center justify-center text-content/60"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-content uppercase tracking-tight">Duty Dashboard</h1>
                        <p className="text-[9px] font-black text-content/30 uppercase tracking-widest font-mono">Live Session & Fatigue Monitoring</p>
                    </div>
                </div>

                {/* ── Live Duty Meter ── */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-surface border border-content/[0.04] rounded-[2.5rem] p-6 shadow-sm overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                        <Timer size={120} />
                    </div>

                    <div className="relative z-10 text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                            <span className="text-[10px] font-black text-brand uppercase tracking-widest">Active Session</span>
                        </div>
                        
                        <div className="space-y-1">
                            <h2 className="text-5xl font-black text-content tabular-nums tracking-tighter">
                                {formatMinutes(summary?.todayMinutes || 0)}
                            </h2>
                            <p className="text-[10px] font-black text-content/40 uppercase tracking-[0.2em]">Logged today</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-3 bg-content/[0.03] rounded-full overflow-hidden border border-content/[0.05]">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${todayProgress}%` }}
                                className={`h-full rounded-full transition-colors duration-500 ${
                                    summary?.isOverworked ? 'bg-red-500' : summary?.needsBreak ? 'bg-amber-500' : 'bg-brand'
                                }`}
                            />
                        </div>

                        <div className="flex justify-between text-[8px] font-black text-content/20 uppercase tracking-widest px-1">
                            <span>Duty Start: {dutyHours?.today?.startTime ? new Date(dutyHours.today.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                            <span>Limit: 8h 00m</span>
                        </div>
                    </div>
                </motion.div>

                {/* ── Fatigue Alerts ── */}
                <AnimatePresence>
                    {(summary?.isOverworked || summary?.needsBreak || fatigueAlerts?.length > 0) && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center gap-2 px-1">
                                <AlertTriangle size={14} className="text-amber-500" />
                                <h3 className="text-[10px] font-black text-content uppercase tracking-widest">Compliance Alerts</h3>
                            </div>
                            
                            {summary?.isOverworked && (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-red-500 uppercase tracking-tight leading-none mb-1">Overworked Detected</p>
                                        <p className="text-[9px] font-bold text-red-500/60 leading-tight">You have exceeded daily duty limits. Please go offline immediately for safety.</p>
                                    </div>
                                </div>
                            )}

                            {summary?.needsBreak && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                        <Coffee size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-amber-500 uppercase tracking-tight leading-none mb-1">Break Mandatory</p>
                                        <p className="text-[9px] font-bold text-amber-500/60 leading-tight">Mandatory rest period required. Take a 15-minute break to refresh.</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Metrics Grid ── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface border border-content/[0.04] p-5 rounded-[2rem] shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-4">
                            <BarChart3 size={18} />
                        </div>
                        <p className="text-[20px] font-black text-content tabular-nums leading-none mb-1">{formatMinutes(summary?.weeklyMinutes || 0)}</p>
                        <p className="text-[8px] font-black text-content/30 uppercase tracking-widest">Weekly Total</p>
                    </div>
                    
                    <div className="bg-surface border border-content/[0.04] p-5 rounded-[2rem] shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-4">
                            <Zap size={18} />
                        </div>
                        <p className="text-[20px] font-black text-content tabular-nums leading-none mb-1">{dutyHours?.today?.sessions?.length || 0}</p>
                        <p className="text-[8px] font-black text-content/30 uppercase tracking-widest">Active Shifts</p>
                    </div>
                </div>

                {/* ── Recent Activity ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <History size={14} className="text-content/40" />
                            <h3 className="text-[10px] font-black text-content uppercase tracking-widest">Session Logs</h3>
                        </div>
                        <button className="text-[8px] font-black text-brand uppercase tracking-widest">View All</button>
                    </div>

                    <div className="space-y-2">
                        {dutyHours?.today?.sessions?.length > 0 ? (
                            dutyHours.today.sessions.slice().reverse().map((session, i) => (
                                <div key={i} className="bg-surface border border-content/[0.02] p-4 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-content/[0.03] flex items-center justify-center text-content/40">
                                            <Clock size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-content uppercase tracking-tight">
                                                {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                                                {' - '} 
                                                {session.endTime ? new Date(session.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}
                                            </p>
                                            <p className="text-[8px] font-black text-content/20 uppercase tracking-widest">Shift Session</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black text-content">{session.durationMinutes || Math.floor((Date.now() - new Date(session.startTime)) / 60000)}m</p>
                                        <p className="text-[7px] font-black text-green-500 uppercase tracking-widest">Verified</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center bg-surface border border-dashed border-content/10 rounded-2xl">
                                <p className="text-[9px] font-black text-content/20 uppercase tracking-widest">No sessions recorded yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Guidelines ── */}
                <div className="bg-brand/5 border border-brand/10 p-5 rounded-[2rem] flex gap-4">
                    <Info size={18} className="text-brand flex-shrink-0" />
                    <p className="text-[9px] font-bold text-brand/60 leading-relaxed uppercase tracking-wide">
                        Safety first! Take a 15-min break after 4 hours of duty. Maximum daily duty is 8 hours. 
                        Compliance affects your reliability score.
                    </p>
                </div>
            </div>
        </DriverLayout>
    );
};

export default DriverDutyDashboard;
