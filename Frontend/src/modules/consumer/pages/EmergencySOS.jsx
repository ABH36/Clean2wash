import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft, ShieldAlert, Camera, Send,
    ShieldCheck, AlertTriangle, Phone, PhoneCall,
    MapPin, MessageSquare, X, CheckCircle2, ChevronRight, PhoneIncoming
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';

const isSpareDriverBooking = (booking = {}) => (
    booking?.service?.type === 'sparedriver'
    || booking?.type === 'sparedriver'
    || booking?.service?.category === 'Chauffeur'
    || String(booking?.serviceName || '').toLowerCase().includes('chauffeur')
    || String(booking?.serviceName || '').toLowerCase().includes('spare driver')
);

const EmergencySOS = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { bookings, dispatchSOS } = useAuth();
    const { isDarkMode } = useTheme();

    const bookingId = searchParams.get('id');
    const spareBookings = (bookings || []).filter(isSpareDriverBooking);
    const liveBooking = spareBookings.find((b) => (b._id === bookingId || b.id === bookingId))
        || spareBookings.find((b) => ['pending', 'confirmed', 'accepted', 'assigned', 'en_route', 'arrived', 'active'].includes(b.status))
        || { id: 'SPARE-DRIVER' };

    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const fileInputRef = useRef(null);

    const handlePhotoCapture = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleInstantHelp = async () => {
        setIsSubmitting(true);
        try {
            let coords = [77.1025, 28.7041];
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    coords = [pos.coords.longitude, pos.coords.latitude];
                } catch (geoErr) {}
            }
            const res = await dispatchSOS({
                coordinates: coords,
                address: "Emergency location (instant help)",
                description: `Emergency alert: User requested immediate assistance for order ${liveBooking.bookingId || liveBooking.id}.`,
                photo: null
            });
            if (res.success) {
                setSubmitted(true);
                setTimeout(() => navigate('/sos-active'), 1500);
            } else {
                toast.error(res.error || 'Failed to dispatch SOS');
            }
        } catch (err) {
            toast.error('Dispatch failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (!description) { toast.error("Provide a description of the emergency."); return; }
        setIsSubmitting(true);
        try {
            let coords = [77.1025, 28.7041];
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    coords = [pos.coords.longitude, pos.coords.latitude];
                } catch (geoErr) {}
            }
            const res = await dispatchSOS({
                coordinates: coords,
                address: "Emergency location",
                description: `[Order: ${liveBooking.bookingId || liveBooking.id}] ${description}`,
                photo: photo || null
            });
            if (res.success) {
                setSubmitted(true);
                setTimeout(() => navigate('/sos-active'), 1500);
            } else {
                toast.error(res.error || 'Failed to dispatch SOS');
            }
        } catch (err) {
            toast.error('Dispatch failed. Call us immediately.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <MobileLayout hideNav>
                <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-white/5">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-20 bg-emerald-50 rounded-[1.8rem] flex items-center justify-center mb-8 border border-emerald-100 "
                    >
                        <ShieldCheck size={40} className="text-emerald-500" />
                    </motion.div>
                    <h2 className="text-[24px] font-bold text-slate-900 tracking-tight leading-none mb-3">Response dispatched</h2>
                    <p className="text-[13px] font-medium text-slate-400 leading-relaxed mb-12">
                        The management and control room have been notified. Stay in a safe location until arrival.
                    </p>

                    <div className="w-full space-y-3">
                        <button onClick={() => window.location.href = 'tel:100'} className="w-full h-15 bg-rose-500 text-white rounded-[1.8rem] flex items-center justify-center gap-3 font-bold text-[14px] shadow-2xl shadow-black/50">
                            <PhoneCall size={18} /> Call 100 now
                        </button>
                        <button onClick={() => navigate('/')} className="w-full h-15 bg-slate-50 text-slate-900 rounded-[1.8rem] flex items-center justify-center font-bold text-[14px]">
                            Back to dashboard
                        </button>
                    </div>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout>
            <div className={`min-h-screen font-sans pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                <header className={`px-4 py-3 flex items-center justify-between sticky top-0 z-[60] border-b backdrop-blur-xl transition-all ${
                    isDarkMode ? 'bg-[#0A0F0D]/80 border-white/05' : 'bg-white/80 border-black/10'
                }`}>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className={`w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all ${
                            isDarkMode ? 'bg-white/[0.05]' : 'bg-black/[0.05]'
                        }`}>
                            <ChevronLeft size={18} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
                        </button>
                        <div>
                            <h1 className="text-[18px] font-black text-[#F43F5E] tracking-tight leading-none">Emergency SOS</h1>
                            <p className="text-[10px] text-[#FF9900] font-black tracking-widest mt-1 uppercase leading-none">Order: {liveBooking.bookingId || liveBooking.id}</p>
                        </div>
                    </div>
                </header>

                <div className="px-4 pt-4 space-y-5">
                    <div className="bg-rose-600 p-4 rounded-[28px] flex items-start gap-4 shadow-2xl shadow-black/50 shadow-rose-900/10 border border-white/5 relative overflow-hidden">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center text-white shrink-0 border border-white/10 shadow-inner relative z-10">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-[13px] font-black text-white tracking-tight mb-1">Critical protocol</h3>
                            <p className="text-white/60 text-[10px] font-bold tracking-tight leading-tight">
                                Use only for real emergencies. Misuse may result in account termination.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <p className={`text-[10px] font-black tracking-tight ml-1 uppercase ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Situation details</p>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what's happening..."
                            className={`w-full border rounded-[22px] p-4 min-h-[120px] text-[12px] font-bold tracking-tight outline-none focus:border-[#FF9900]/20 resize-none transition-all ${
                                isDarkMode ? 'bg-white/[0.03] border-white/05 text-white' : 'bg-white border-black/05 text-black'
                            }`}
                        />
                    </div>

                    <div className="space-y-2">
                        <p className={`text-[10px] font-black tracking-tight ml-1 uppercase ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Visual evidence</p>
                        <div className="flex gap-2">
                            <button onClick={() => fileInputRef.current.click()} className={`w-16 h-16 border border-dashed rounded-xl flex flex-col items-center justify-center active:scale-95 transition-all ${
                                isDarkMode ? 'bg-white/[0.03] border-white/10 text-white/20' : 'bg-black/[0.02] border-black/10 text-black/20'
                            }`}>
                                <Camera size={18} />
                                <span className="text-[8px] font-black mt-1">Snap</span>
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoCapture} />
                            {photo && (
                                <div className={`relative w-16 h-16 rounded-xl overflow-hidden border ${isDarkMode ? 'border-white/10' : 'border-black/05'}`}>
                                    <img src={photo} className="w-full h-full object-cover" alt="" />
                                    <button onClick={() => setPhoto(null)} className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-lg"><X size={8} /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`p-4 rounded-[22px] flex items-center gap-3 border ${isDarkMode ? 'bg-[#0F172A] border-white/05' : 'bg-white border-black/05 shadow-sm'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-black/05'}`}>
                            <MapPin size={16} className="text-[#FF9900]" />
                        </div>
                        <div className="flex-1">
                            <p className={`text-[10px] font-black tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Live GPS enforcement</p>
                            <p className={`text-[8px] font-black tracking-tight uppercase ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>Active coordinates logged</p>
                        </div>
                        <div className="w-1.5 h-1.5 bg-[#FF9900] rounded-full animate-pulse shadow-[0_0_10px_#FF9900]" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                        <button onClick={() => window.location.href = 'tel:100'} className={`h-12 border rounded-xl flex items-center justify-center gap-2 font-black text-[11px] tracking-tight active:scale-95 transition-all ${
                            isDarkMode ? 'bg-white/5 border-rose-500/20 text-rose-500' : 'bg-white border-rose-100 text-rose-600 shadow-sm'
                        }`}>
                            <Phone size={14} /> Call 100
                        </button>
                        <button onClick={() => window.location.href = 'tel:+918069100000'} className={`h-12 border rounded-xl flex items-center justify-center gap-2 font-black text-[11px] tracking-tight active:scale-95 transition-all ${
                            isDarkMode ? 'bg-white/5 border-white/05 text-white' : 'bg-white border-black/05 text-slate-900 shadow-sm'
                        }`}>
                            <PhoneIncoming size={14} className="text-[#FF9900]" /> Agent
                        </button>
                    </div>

                    <button
                        onClick={handleInstantHelp}
                        disabled={isSubmitting}
                        className="w-full h-15 bg-rose-600 text-white rounded-[22px] flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-[0.1em] shadow-2xl shadow-rose-900/20 active:scale-98 transition-all disabled:opacity-30"
                    >
                        {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ShieldAlert size={18} /> Quick Assistance</>}
                    </button>
                </div>

                <div className={`fixed bottom-0 left-0 right-0 p-4 backdrop-blur-xl border-t z-50 transition-all ${
                    isDarkMode ? 'bg-[#0A0F0D]/80 border-white/05' : 'bg-white/80 border-black/05'
                }`}>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !description}
                        className={`w-full h-14 rounded-xl font-black text-[12px] tracking-[0.1em] flex items-center justify-center gap-3 shadow-2xl active:scale-98 transition-all disabled:opacity-30 ${
                            isDarkMode ? 'bg-white text-black shadow-white/5' : 'bg-[#0F172A] text-white shadow-black/20'
                        }`}
                    >
                        {isSubmitting ? <div className={`w-4 h-4 border-2 rounded-full animate-spin ${isDarkMode ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'}`} /> : <><Send size={16} className={isDarkMode ? 'text-black' : 'text-[#FF9900]'} strokeWidth={3} /> Dispatch SOS</>}
                    </button>
                </div>
            </div>
        </MobileLayout>
    );
};

export default EmergencySOS;
