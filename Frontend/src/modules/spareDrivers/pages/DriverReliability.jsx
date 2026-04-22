import React, { useEffect, useState } from 'react';
import { 
    ShieldCheck, ChevronLeft, Target, TrendingUp, 
    Zap, AlertCircle, CheckCircle2, XCircle,
    BarChart3, Award, Info, ZapOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import DriverLayout from '../components/DriverLayout';

const DriverReliability = () => {
    const navigate = useNavigate();
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await spareDriverAPI.getProfile();
                if (res.status === 'success') {
                    setDriver(res.data.driver);
                }
            } catch (error) {
                console.error('Failed to fetch reliability data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <DriverLayout title="Reliability Center">
                <div className="flex h-[60vh] items-center justify-center font-black text-white/20 uppercase tracking-[0.4em] animate-pulse">
                    Calculating Reputation...
                </div>
            </DriverLayout>
        );
    }

    const reliability = driver?.reliabilityScore || {
        score: 100,
        metrics: {
            totalTrips: 0,
            completedTrips: 0,
            cancelledTrips: 0,
            acceptedBookings: 0,
            rejectedBookings: 0,
            completionRate: 100
        }
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-500';
        if (score >= 75) return 'text-brand';
        if (score >= 50) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreLevel = (score) => {
        if (score >= 95) return 'Elite Operator';
        if (score >= 85) return 'Pro Driver';
        if (score >= 70) return 'Reliable';
        return 'Needs Improvement';
    };

    return (
        <DriverLayout title="Reliability Center">
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
                        <h1 className="text-xl font-black text-content uppercase tracking-tight">Reliability Hub</h1>
                        <p className="text-[9px] font-black text-content/30 uppercase tracking-widest font-mono">Performance Telemetry</p>
                    </div>
                </div>

                {/* ── Main Score Card ── */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-surface border border-content/[0.05] rounded-[3rem] p-8 shadow-xl relative overflow-hidden flex flex-col items-center text-center"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none" />
                    
                    <div className="relative mb-6">
                        <svg className="w-48 h-48 transform -rotate-90">
                            <circle
                                cx="96"
                                cy="96"
                                r="88"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-content/[0.03]"
                            />
                            <motion.circle
                                cx="96"
                                cy="96"
                                r="88"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={552.9}
                                initial={{ strokeDashoffset: 552.9 }}
                                animate={{ strokeDashoffset: 552.9 - (552.9 * (reliability.score || 0)) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={getScoreColor(reliability.score)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <h2 className={`text-6xl font-black tabular-nums tracking-tighter ${getScoreColor(reliability.score)}`}>
                                {reliability.score}
                            </h2>
                            <p className="text-[10px] font-black text-content/20 uppercase tracking-widest mt-[-4px]">Index Score</p>
                        </div>
                    </div>

                    <div className="bg-brand/10 px-4 py-1.5 rounded-full border border-brand/20 mb-2">
                        <span className="text-[11px] font-black text-brand uppercase tracking-widest">{getScoreLevel(reliability.score)}</span>
                    </div>
                    <p className="text-[10px] font-bold text-content/40 uppercase tracking-tight max-w-[200px]">
                        Your score determines your priority in the mission assignment queue.
                    </p>
                </motion.div>

                {/* ── Metrics Grid ── */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface border border-content/[0.04] p-5 rounded-[2rem] space-y-1 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 mb-3">
                            <CheckCircle2 size={18} />
                        </div>
                        <p className="text-2xl font-black text-content tabular-nums">{reliability.metrics.completionRate}%</p>
                        <p className="text-[8px] font-black text-content/30 uppercase tracking-widest">Completion Rate</p>
                    </div>

                    <div className="bg-surface border border-content/[0.04] p-5 rounded-[2rem] space-y-1 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
                            <Target size={18} />
                        </div>
                        <p className="text-2xl font-black text-content tabular-nums">
                            {Math.round((reliability.metrics.acceptedBookings / (reliability.metrics.acceptedBookings + reliability.metrics.rejectedBookings || 1)) * 100)}%
                        </p>
                        <p className="text-[8px] font-black text-content/30 uppercase tracking-widest">Acceptance Rate</p>
                    </div>
                </div>

                {/* ── Detailed Breakdown ── */}
                <div className="bg-surface border border-content/[0.04] rounded-[2.5rem] p-6 space-y-6">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={16} className="text-brand" />
                        <h3 className="text-[10px] font-black text-content uppercase tracking-widest">Mission Breakdown</h3>
                    </div>

                    <div className="space-y-4">
                        {[
                            { label: 'Total Assigned', value: reliability.metrics.totalTrips || 0, icon: Zap, color: 'text-content' },
                            { label: 'Successfully Done', value: reliability.metrics.completedTrips || 0, icon: CheckCircle2, color: 'text-green-500' },
                            { label: 'Driver Cancellations', value: reliability.metrics.cancelledTrips || 0, icon: XCircle, color: 'text-red-500' },
                            { label: 'Rejections', value: reliability.metrics.rejectedBookings || 0, icon: ZapOff, color: 'text-amber-500' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <item.icon size={14} className={item.color} />
                                    <span className="text-[11px] font-bold text-content/60 uppercase">{item.label}</span>
                                </div>
                                <span className="text-sm font-black text-content tabular-nums">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Pro Tips ── */}
                <div className="bg-brand border border-brand/20 p-6 rounded-[2.5rem] relative overflow-hidden">
                    <Award className="absolute top-[-10px] right-[-10px] text-white/10" size={100} />
                    <div className="relative z-10 space-y-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-white" />
                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Boost Your Score</h4>
                        </div>
                        <ul className="space-y-2">
                            {[
                                'Complete missions without cancellations',
                                'Accept 90%+ of assigned bookings',
                                'Maintain a 4.8+ customer rating'
                            ].map((tip, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-white/40 mt-1.5 shrink-0" />
                                    <p className="text-[9px] font-bold text-white/70 uppercase leading-relaxed">{tip}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ── Info Disclosure ── */}
                <div className="flex gap-3 px-2">
                    <Info size={14} className="text-content/20 shrink-0" />
                    <p className="text-[8px] font-medium text-content/30 italic">
                        The reliability score is recalculated every 24 hours based on your last 30 days of operational activity.
                    </p>
                </div>
            </div>
        </DriverLayout>
    );
};

export default DriverReliability;
