import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin, Phone, MessageSquare, ChevronLeft, CheckCircle2,
    Shield, Car, Clock, Navigation, Camera, ChevronRight,
    Zap, ArrowRight
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const MOCK_JOB = {
    id: 'CarWash-8821',
    customer: { name: 'Aman Verma', phone: '+91 98765 43210', avatar: 'AV', rating: 4.8, washes: 12 },
    service: 'Instant Eco Wash',
    vehicle: 'Honda City',
    plate: 'KA 05 MR 7821',
    color: 'Blue',
    address: 'HSR Layout, Sector 2, Bengaluru 560102',
    landmark: 'Near Agara Lake Gate 2',
    amount: '₹473',
    pin: '7182',
};

const STEPS_ORDER = ['En Route', 'Arrived', 'Washing', 'Done'];

const CaptainJobDetail = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [searchParams] = useSearchParams();
    const { bookings, updateBookingStatus, getUser } = useAuth();
    const user = getUser('captain') || { id: 'CPT-DEFAULT' };

    const bookingId = searchParams.get('id');
    const [liveBooking, setLiveBooking] = useState(null);

    const [pendingRequest, setPendingRequest] = useState(null);

    useEffect(() => {
        let found = bookings.find(b => b.id === bookingId);
        if (!found && !bookingId) {
            found = bookings.find(b => (b.status === 'confirmed' || b.status === 'in-progress') && b.captainId === user.id);
        }
        setLiveBooking(found);

        // If no active job, look for pending ones
        if (!found) {
            const pending = bookings.find(b => b.status === 'pending' && b.type === 'captain');
            setPendingRequest(pending);
        } else {
            setPendingRequest(null);
        }
    }, [bookingId, bookings, user.id]);

    const [isAccepting, setIsAccepting] = useState(false);
    const handleAcceptRequest = (jobId) => {
        setIsAccepting(true);
        updateBookingStatus(jobId, 'confirmed', { captainId: user.id });
        setTimeout(() => {
            setIsAccepting(false);
            navigate(`/captain/job?id=${jobId}`);
        }, 800);
    };

    const getInitialStep = () => {
        if (!liveBooking) return 0;
        if (liveBooking.status === 'completed') return 3;
        if (liveBooking.status === 'in-progress') return 2;
        if (liveBooking.status === 'confirmed') return 0;
        return 0;
    };

    const [stepIdx, setStepIdx] = useState(0);
    const [showPin, setShowPin] = useState(false);

    useEffect(() => {
        if (liveBooking) setStepIdx(getInitialStep());
    }, [liveBooking?.status]);

    if (!liveBooking) {
        return (
            <CaptainLayout hideNav>
                <div className="flex flex-col items-center justify-center min-h-[90vh] px-8 text-center relative overflow-hidden transition-colors duration-500">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
                        <motion.div animate={{ scale: [1, 1.5], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeOut" }}
                            className={`absolute w-64 h-64 border-2 rounded-full ${isDarkMode ? 'border-brand/40' : 'border-brand/20'}`} />
                        <motion.div animate={{ scale: [1, 1.5], opacity: [0.2, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeOut", delay: 1.5 }}
                            className={`absolute w-96 h-96 border rounded-full ${isDarkMode ? 'border-brand/30' : 'border-brand/10'}`} />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-24 h-24 rounded-[40px] flex items-center justify-center mb-8 border shadow-xl relative transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-brand/5 border-brand/10'}`}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                className={`absolute inset-0 border-2 border-dashed rounded-[40px] opacity-30 ${isDarkMode ? 'border-white' : 'border-brand'}`} />
                            <div className={`w-16 h-16 rounded-[30px] flex items-center justify-center border shadow-inner transition-colors ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-brand/10'}`}>
                                <Zap size={32} className="text-brand" fill="currentColor" />
                            </div>
                        </div>
                        <div className="space-y-3 mb-12">
                            <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>
                                {pendingRequest ? 'New Request Found!' : 'Captain Standby'}
                            </h2>
                            <div className="flex items-center justify-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${pendingRequest ? 'bg-orange-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
                                <p className="text-brand text-[10px] font-black uppercase tracking-[0.3em]">
                                    {pendingRequest ? 'Action Required' : 'Scanning For Requests'}
                                </p>
                            </div>

                            {pendingRequest ? (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className={`mt-4 p-5 rounded-3xl border text-left transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-xl'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-brand text-[9px] font-black uppercase tracking-widest mb-1">Service</p>
                                            <h3 className={`font-black text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{pendingRequest.serviceName}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[9px] font-black uppercase tracking-widest mb-1`}>Payout</p>
                                            <p className={`font-black text-xl italic ${isDarkMode ? 'text-white' : 'text-content'}`}>{pendingRequest.price}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-100'}`}>
                                            <MapPin size={16} className="text-brand" fill="currentColor" strokeWidth={1.5} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`font-black text-xs truncate ${isDarkMode ? 'text-white/80' : 'text-content'}`}>{pendingRequest.address}</p>
                                            <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[9px] font-bold`}>HSR Layout · 1.2 km away</p>
                                        </div>
                                    </div>
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleAcceptRequest(pendingRequest.id)}
                                        className={`w-full h-12 rounded-2xl font-black text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 ${isAccepting ? 'bg-green-500 shadow-green-500/20' : 'bg-brand shadow-brand/30'}`}>
                                        {isAccepting ? (
                                            <>Accepting... <Zap size={15} className="animate-pulse" /></>
                                        ) : (
                                            <>Accept Request <ArrowRight size={15} strokeWidth={3} /></>
                                        )}
                                    </motion.button>
                                </motion.div>
                            ) : (
                                <p className={`text-xs font-bold leading-relaxed max-w-[260px] mx-auto pt-2 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>
                                    You are currently online. New jobs in your area will appear on the dashboard.
                                </p>
                            )}
                        </div>
                        {!pendingRequest && (
                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/captain')}
                                className={`group flex items-center gap-4 px-8 py-4 rounded-3xl transition-all shadow-xl ${isDarkMode ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-gray-100 hover:bg-gray-50'}`}>
                                <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-content'}`}>Go to Dashboard</span>
                                <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center group-hover:bg-brand-dark transition-all">
                                    <ArrowRight size={16} className="text-white" strokeWidth={3} />
                                </div>
                            </motion.button>
                        )}
                    </div>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full px-12">
                        <div className={`flex justify-between items-center py-4 border-t transition-colors ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                            <div className="text-left">
                                <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>System Status</p>
                                <p className="text-green-500 text-[10px] font-black italic">Active & Secure</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Location</p>
                                <p className={`text-[10px] font-black italic ${isDarkMode ? 'text-white/80' : 'text-content'}`}>HSR Layout, BLR</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CaptainLayout>
        );
    }

    const stepIdx_safe = Math.max(0, Math.min(stepIdx, STEPS_ORDER.length - 1));
    const step = STEPS_ORDER[stepIdx_safe];

    const handleNext = () => {
        const nextIdx = stepIdx + 1;
        if (nextIdx === 1) {
            setStepIdx(nextIdx);
        } else if (nextIdx === 2) {
            updateBookingStatus(bookingId, 'in-progress');
            setStepIdx(nextIdx);
        } else if (nextIdx === 3) {
            updateBookingStatus(bookingId, 'completed');
            setStepIdx(nextIdx);
        } else {
            navigate('/captain');
        }
    };

    const stepConfig = {
        'En Route': { bg: 'bg-blue-500', label: 'Mark as Arrived', cta: 'I\'ve Arrived' },
        'Arrived': { bg: 'bg-amber-500', label: 'Start the Wash', cta: 'Start Washing' },
        'Washing': { bg: 'bg-brand', label: 'In Progress…', cta: 'Mark Complete' },
        'Done': { bg: 'bg-green-500', label: 'Job Complete!', cta: 'Back to Home' },
    };
    const cfg = stepConfig[step];

    return (
        <CaptainLayout hideNav>
            <header className={`${isDarkMode ? 'bg-[#1E293B]/70 border-white/5' : 'bg-white/70 border-gray-100'} backdrop-blur-xl px-4 pt-10 pb-4 border-b sticky top-0 z-40 transition-colors duration-500`}>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/captain')} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-content'}`}>
                        <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>
                    <div className="flex-1">
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Active Job</p>
                        <h1 className={`text-lg font-black tracking-tight leading-none truncate max-w-[150px] ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveBooking.id}</h1>
                    </div>
                    <span className={`text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${cfg.bg} shadow-lg shadow-black/10`}>{step}</span>
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-32">
                <div className="flex items-center gap-2">
                    {STEPS_ORDER.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${i < stepIdx ? 'bg-green-500 border-green-500' :
                                i === stepIdx ? `${cfg.bg} border-transparent` :
                                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                {i < stepIdx
                                    ? <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                                    : <span className={`text-[9px] font-black ${i === stepIdx ? 'text-white' : isDarkMode ? 'text-white/20' : 'text-gray-300'}`}>{i + 1}</span>
                                }
                            </div>
                            {i < STEPS_ORDER.length - 1 && (
                                <div className={`flex-1 h-1 rounded-full transition-all ${i < stepIdx ? 'bg-green-400' : isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className={`relative rounded-2xl overflow-hidden border shadow-soft transition-colors ${isDarkMode ? 'border-white/5 shadow-2xl shadow-black/40' : 'border-gray-100 shadow-sm'}`} style={{ height: 180 }}>
                    <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" alt="Map" className={`w-full h-full object-cover ${isDarkMode ? 'grayscale invert opacity-50' : ''}`} />
                    <div className="absolute inset-0 bg-blue-900/10" />
                    <button className="absolute bottom-3 right-3 bg-brand text-white flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">
                        <Navigation size={12} strokeWidth={2.5} /> Navigate
                    </button>
                    <div className={`absolute top-3 left-3 rounded-xl px-3 py-2 transition-colors ${isDarkMode ? 'bg-[#1E293B]/90 text-white/90 shadow-2xl shadow-black' : 'bg-white/90 text-content shadow-sm'}`}>
                        <p className="font-black text-xs">1.4 km · ETA 8 min</p>
                    </div>
                </div>

                <div className={`rounded-2xl border px-4 py-4 flex items-start gap-3 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/20' : 'bg-white border-gray-100 shadow-soft'}`}>
                    <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin size={16} className="text-brand" fill="currentColor" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className={`font-black text-sm tracking-tight ${isDarkMode ? 'text-white/90' : 'text-content'}`}>{liveBooking.address || MOCK_JOB.address}</p>
                        <p className={`text-[9px] font-bold mt-0.5 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>📍 {MOCK_JOB.landmark}</p>
                    </div>
                </div>

                <div className={`rounded-2xl border px-4 py-4 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-soft'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-brand/10 rounded-xl flex items-center justify-center">
                                <span className="font-black text-sm text-brand">{liveBooking.userName?.charAt(0) || 'U'}</span>
                            </div>
                            <div>
                                <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveBooking.userName || 'User'}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[9px] font-bold ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>★ {MOCK_JOB.customer.rating}</span>
                                    <span className={`text-[9px] font-bold ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>· {MOCK_JOB.customer.washes} washes</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <a href={`tel:${MOCK_JOB.customer.phone}`} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${isDarkMode ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-100 text-green-600'}`}>
                                <Phone size={15} strokeWidth={2.5} />
                            </a>
                            <button className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                <MessageSquare size={15} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setShowPin(!showPin)}
                        className={`w-full flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${isDarkMode ? 'bg-white/[0.03] border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-brand" strokeWidth={2.5} />
                            <span className={`font-black text-xs uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-content'}`}>Security PIN</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`font-black text-lg tracking-[0.3em] transition-all ${isDarkMode ? 'text-white' : 'text-content'} ${showPin ? '' : 'blur-sm'}`}>7721</span>
                            <ChevronRight size={13} strokeWidth={2.5} className={`text-gray-300 transition-transform ${showPin ? 'rotate-90' : ''}`} />
                        </div>
                    </button>
                </div>

                <div className={`rounded-2xl border px-4 py-4 flex items-center gap-4 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-soft'}`}>
                    <div className={`w-11 h-11 border rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                        <Car size={20} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveBooking.vehicle || MOCK_JOB.vehicle}</p>
                        <p className={`text-[9px] font-bold mt-0.5 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>{liveBooking.serviceName || MOCK_JOB.service}</p>
                    </div>
                </div>

                {step === 'Washing' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border p-4 space-y-3 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-soft'}`}>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Service Checklist</p>
                        {['Pre-wash foam applied', 'Rinse complete', 'Microfibre wipe', 'Tyre dressing', 'Window & mirror clean'].map((item, i) => (
                            <div key={item} className="flex items-center gap-3">
                                <div className={`w-5 h-5 border rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${isDarkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-100 border-green-200'}`}>
                                    <CheckCircle2 size={12} className="text-green-500" strokeWidth={2.5} />
                                </div>
                                <p className={`font-bold text-sm ${isDarkMode ? 'text-white/90' : 'text-content'}`}>{item}</p>
                            </div>
                        ))}
                    </motion.div>
                )}

                {step === 'Done' && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`w-full flex items-center gap-3 border border-dashed rounded-2xl px-4 py-4 transition-all ${isDarkMode ? 'bg-white/5 border-white/20 hover:border-brand/40' : 'bg-gray-50 border-gray-200 hover:border-brand/30'}`}>
                        <Camera size={20} className={isDarkMode ? 'text-white/20' : 'text-content-subtle'} />
                        <div className="text-left">
                            <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-content'}`}>Upload Completion Photo</p>
                            <p className={`text-[9px] font-bold ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Before & after shot recommended</p>
                        </div>
                    </motion.button>
                )}
            </div>

            <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md backdrop-blur-md border-t px-4 py-4 z-50 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B]/90 border-white/5 shadow-[0_-15px_50px_rgba(0,0,0,0.4)]' : 'bg-white/90 border-gray-100 shadow-[0_-15px_40px_rgba(0,0,0,0.05)]'}`}>
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                        <Clock size={13} className={isDarkMode ? 'text-white/20' : 'text-content-subtle'} />
                        <span className={`text-[10px] font-bold ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Earnings:</span>
                        <span className="font-black text-sm text-green-500">{liveBooking.price || MOCK_JOB.amount}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${cfg.bg} text-white shadow-lg shadow-black/10`}>{cfg.label}</span>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
                    className={`w-full h-12 ${cfg.bg} text-white rounded-xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all hover:brightness-110`}>
                    {cfg.cta}
                    {stepIdx < STEPS_ORDER.length - 1 && <ChevronRight size={16} strokeWidth={3} />}
                </motion.button>
            </div>
        </CaptainLayout>
    );
};

export default CaptainJobDetail;
