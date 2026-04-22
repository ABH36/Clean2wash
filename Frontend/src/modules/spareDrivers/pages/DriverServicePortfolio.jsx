import React, { useEffect, useState } from 'react';
import { 
    Zap, ChevronLeft, ShieldCheck, Star, 
    TrendingUp, Award, CheckCircle2, XCircle,
    Info, Settings, Filter, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import DriverLayout from '../components/DriverLayout';

const DriverServicePortfolio = () => {
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
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <DriverLayout title="Service Portfolio">
                <div className="flex h-[60vh] items-center justify-center font-black text-white/20 uppercase tracking-[0.4em] animate-pulse">
                    Loading protocols...
                </div>
            </DriverLayout>
        );
    }

    const services = driver?.allowedServices || [
        { type: 'point', isActive: true, completedTrips: 0, rating: 5.0 },
        { type: 'hourly', isActive: true, completedTrips: 0, rating: 5.0 },
        { type: 'full_day', isActive: false, completedTrips: 0, rating: 5.0 },
        { type: 'outstation', isActive: false, completedTrips: 0, rating: 5.0 }
    ];

    const getServiceLabel = (type) => {
        const labels = {
            'point': 'Point to Point',
            'hourly': 'Hourly Booking',
            'full_day': 'Full Day (8h)',
            'outstation': 'Outstation Trip'
        };
        return labels[type] || type.replace('_', ' ');
    };

    const getServiceIcon = (type) => {
        switch(type) {
            case 'point': return <TrendingUp size={18} />;
            case 'hourly': return <Star size={18} />;
            case 'full_day': return <Award size={18} />;
            case 'outstation': return <Zap size={18} />;
            default: return <Settings size={18} />;
        }
    };

    return (
        <DriverLayout title="Service Portfolio">
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
                        <h1 className="text-xl font-black text-content uppercase tracking-tight">Service Portfolio</h1>
                        <p className="text-[9px] font-black text-content/30 uppercase tracking-widest font-mono">Active Protocols & Permissions</p>
                    </div>
                </div>

                {/* ── Summary Card ── */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-brand border border-brand/20 rounded-[2.5rem] p-6 shadow-xl shadow-brand/10 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                        <Zap size={120} className="text-white" />
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="bg-white/20 px-3 py-1 rounded-full border border-white/20">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Services</span>
                            </div>
                            <ShieldCheck className="text-white/40" size={20} />
                        </div>
                        
                        <div className="flex items-end gap-2">
                            <h2 className="text-5xl font-black text-white tabular-nums tracking-tighter">
                                {services.filter(s => s.isActive).length}
                            </h2>
                            <p className="text-white/60 font-black uppercase text-[11px] mb-2 tracking-widest">Protocols Deployed</p>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <div className="flex-1 bg-white/10 rounded-2xl p-3 border border-white/5">
                                <p className="text-[18px] font-black text-white leading-none mb-1">{driver?.reliabilityScore?.metrics?.avgRating?.toFixed(1) || '5.0'}</p>
                                <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Avg Efficiency</p>
                            </div>
                            <div className="flex-1 bg-white/10 rounded-2xl p-3 border border-white/5">
                                <p className="text-[18px] font-black text-white leading-none mb-1">{driver?.reliabilityScore?.metrics?.totalTrips || 0}</p>
                                <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Total Missions</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Services List ── */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Filter size={14} className="text-content/40" />
                        <h3 className="text-[10px] font-black text-content uppercase tracking-widest">Service Authorization</h3>
                    </div>

                    <div className="space-y-3">
                        {services.map((service, i) => (
                            <motion.div 
                                key={i}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={`bg-surface border p-4 rounded-[2rem] flex items-center justify-between transition-all ${
                                    service.isActive ? 'border-brand/10 shadow-sm' : 'border-content/[0.02] opacity-60'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                                        service.isActive ? 'bg-brand/10 text-brand' : 'bg-content/[0.03] text-content/20'
                                    }`}>
                                        {getServiceIcon(service.type)}
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-black text-content uppercase tracking-tight">{getServiceLabel(service.type)}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${service.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                                {service.isActive ? 'Active' : 'Locked'}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-content/10" />
                                            <span className="text-[8px] font-black text-content/20 uppercase tracking-widest">{service.completedTrips || 0} Trips</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {service.isActive ? (
                                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                        <CheckCircle2 size={16} />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-content/[0.03] flex items-center justify-center text-content/10">
                                        <XCircle size={16} />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ── Guidelines ── */}
                <div className="bg-content/[0.02] border border-content/5 p-5 rounded-[2rem] flex gap-4">
                    <Info size={18} className="text-content/30 flex-shrink-0" />
                    <p className="text-[9px] font-bold text-content/40 leading-relaxed uppercase tracking-wide">
                        Authorized services are assigned by the operations team based on your experience and vehicle proficiency. 
                        To unlock more services, maintain a 4.8+ rating.
                    </p>
                </div>

                {/* ── Help Button ── */}
                <button 
                    onClick={() => navigate('/spare-driver/support')}
                    className="w-full h-14 bg-surface border border-content/5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <Search size={16} className="text-content/40" />
                    <span className="text-[10px] font-black text-content/60 uppercase tracking-[0.2em]">Contact Operations</span>
                </button>
            </div>
        </DriverLayout>
    );
};

export default DriverServicePortfolio;
