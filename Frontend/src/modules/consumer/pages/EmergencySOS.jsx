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
import { toast } from 'react-hot-toast';

const EmergencySOS = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { bookings, dispatchSOS } = useAuth();

    const bookingId = searchParams.get('id');
    const liveBooking = bookings.find(b => (b._id === bookingId || b.id === bookingId)) || { id: 'Generic' };

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
                <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-white">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-20 bg-emerald-50 rounded-[1.8rem] flex items-center justify-center mb-8 border border-emerald-100 shadow-sm"
                    >
                        <ShieldCheck size={40} className="text-emerald-500" />
                    </motion.div>
                    <h2 className="text-[24px] font-bold text-slate-900 tracking-tight leading-none mb-3">Response dispatched</h2>
                    <p className="text-[13px] font-medium text-slate-400 leading-relaxed mb-12">
                        The management and control room have been notified. Stay in a safe location until arrival.
                    </p>

                    <div className="w-full space-y-3">
                        <button onClick={() => window.location.href = 'tel:100'} className="w-full h-15 bg-rose-500 text-white rounded-[1.8rem] flex items-center justify-center gap-3 font-bold text-[14px] shadow-xl">
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
            <div className="bg-slate-50 min-h-screen font-sans pb-32">
                {/* ── Compact Header ── */}
                <header className="px-5 pt-8 pb-4 bg-white sticky top-0 z-[60] border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                            <ChevronLeft size={22} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[20px] font-bold text-rose-500 tracking-tight leading-none">Emergency SOS</h1>
                            <p className="text-[11px] text-slate-400 font-medium mt-1.5">Order ID: {liveBooking.bookingId || liveBooking.id}</p>
                        </div>
                    </div>
                    <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
                        <ShieldAlert size={18} className="text-rose-500" />
                    </div>
                </header>

                <div className="px-5 pt-6 space-y-6">
                    {/* ── Warning Card ── */}
                    <div className="bg-rose-500 p-5 rounded-[2.5rem] flex items-start gap-4 shadow-xl shadow-rose-500/10 border border-white/10 relative overflow-hidden">
                        <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0 border border-white/10 shadow-inner relative z-10">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-[15px] font-bold text-white leading-none mb-1.5">Critical protocol</h3>
                            <p className="text-white/60 text-[11px] font-medium leading-relaxed">
                                Use this only for real emergencies. Misuse may result in account termination.
                            </p>
                        </div>
                        <ShieldAlert size={80} className="absolute -bottom-6 -right-6 text-white/5 -rotate-12" />
                    </div>

                    {/* ── Situation Input ── */}
                    <div className="space-y-2">
                        <p className="text-[11px] font-bold text-slate-400 ml-1">Describe situation</p>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What happened? (e.g. Captain behavior, safety issue)"
                            className="w-full bg-white border border-slate-100 rounded-[1.8rem] p-5 min-h-[140px] text-[14px] font-bold text-slate-900 outline-none focus:border-rose-500/20 shadow-sm"
                        />
                    </div>

                    {/* ── Proofs ── */}
                    <div className="space-y-3">
                        <p className="text-[11px] font-bold text-slate-300 ml-1 uppercase tracking-widest leading-none">Visual evidence</p>
                        <div className="flex gap-3">
                            <button onClick={() => fileInputRef.current.click()} className="w-20 h-20 bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 active:scale-95 transition-all">
                                <Camera size={20} />
                                <span className="text-[9px] font-bold mt-1 uppercase">Capture</span>
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoCapture} />
                            {photo && (
                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                    <img src={photo} className="w-full h-full object-cover" alt="" />
                                    <button onClick={() => setPhoto(null)} className="absolute top-1 right-1 bg-slate-900/60 text-white p-1 rounded-lg"><X size={10} /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Status Track ── */}
                    <div className="bg-white/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <MapPin size={18} className="text-slate-300" />
                        <div className="flex-1">
                            <p className="text-[11px] font-bold text-slate-900">Enforcement protocol</p>
                            <p className="text-[9px] font-medium text-slate-400">Live GPS coordinates are being recorded</p>
                        </div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    </div>

                    {/* ── Quick Actions ── */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button onClick={() => window.location.href = 'tel:100'} className="h-14 bg-white border border-rose-100 text-rose-500 rounded-2xl flex items-center justify-center gap-2 font-bold text-[13px] active:scale-95 transition-all">
                            <Phone size={16} /> Call 100
                        </button>
                        <button onClick={() => window.location.href = 'tel:+918069100000'} className="h-14 bg-white border border-slate-100 text-slate-900 rounded-2xl flex items-center justify-center gap-2 font-bold text-[13px] active:scale-95 transition-all">
                            <PhoneIncoming size={16} /> Contact agent
                        </button>
                    </div>

                    <button
                        onClick={handleInstantHelp}
                        disabled={isSubmitting}
                        className="w-full h-16 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center gap-3 font-bold text-[15px] shadow-xl shadow-rose-500/10 active:scale-98 transition-all disabled:opacity-30"
                    >
                        {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ShieldAlert size={20} /> Instant help now</>}
                    </button>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-md border-t border-slate-50">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !description}
                        className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-bold text-[15px] flex items-center justify-center gap-3 shadow-xl disabled:opacity-30 active:scale-98 transition-all"
                    >
                        {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={18} /> Dispatch SOS alert</>}
                    </button>
                </div>
            </div>
        </MobileLayout>
    );
};

export default EmergencySOS;
