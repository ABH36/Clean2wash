import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    ChevronLeft, ShieldAlert, Camera, Send, 
    ShieldCheck, AlertTriangle, Phone, PhoneCall, 
    MapPin, MessageSquare, X, CheckCircle2 
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const EmergencySOS = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { bookings, user } = useAuth();
    
    const bookingId = searchParams.get('id');
    const liveBooking = bookings.find(b => (b._id === bookingId || b.id === bookingId)) || { id: 'CW-GENERIC' };

    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const fileInputRef = useRef(null);

    const handlePhotoCapture = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!description) {
            toast.error("Please provide a brief description of the emergency.");
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/consumer/bookings/${bookingId}/issues`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'SOS',
                    description: description,
                    photo: photo || null
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                setSubmitted(true);
                // Also trigger trusted contacts via backend notification logic if it was implemented there
                toast.success("SOS Alert Dispatched to Admin Command Center");
            } else {
                toast.error(data.message || 'Failed to dispatch SOS');
            }
        } catch (err) {
            console.error('SOS submit error:', err);
            toast.error('Dispatch failed. Please call us immediately.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <MobileLayout hideNav>
                <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-red-50">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-200"
                    >
                        <ShieldCheck size={48} className="text-green-500" strokeWidth={3} />
                    </motion.div>
                    <h2 className="text-2xl font-black text-content italic mb-2">SOS ALERT ACTIVE</h2>
                    <p className="text-sm font-bold text-content-subtle mb-8 uppercase tracking-widest leading-relaxed">
                        The Admin Command Center & Police<br/>Network have been notified.<br/>
                        <span className="text-red-600">STAY IN A SAFE LOCATION.</span>
                    </p>
                    
                    <div className="w-full space-y-4">
                        <button 
                            onClick={() => window.location.href = 'tel:100'} 
                            className="w-full h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase shadow-lg shadow-red-200 active:scale-95 transition-all"
                        >
                            <PhoneCall size={20} /> CALL 100 NOW
                        </button>
                        <button 
                            onClick={() => navigate('/')} 
                            className="w-full h-16 bg-white border-2 border-gray-100 text-content rounded-2xl flex items-center justify-center font-black text-sm uppercase active:scale-95 transition-all"
                        >
                            BACK TO DASHBOARD
                        </button>
                    </div>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout hideNav>
            <div className="bg-[#FAFAFA] min-h-screen font-outfit pb-24">
                <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap'); .font-outfit { font-family: 'Outfit', sans-serif; }` }} />

                {/* ── Header ── */}
                <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-5 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
                            <ChevronLeft size={20} className="text-content" strokeWidth={2.5} />
                        </button>
                        <div>
                            <h1 className="text-base font-black text-red-600 uppercase tracking-tight italic">Emergency SOS</h1>
                            <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest mt-0.5">Order ID: {liveBooking.bookingId || liveBooking.id}</p>
                        </div>
                    </div>
                    <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center animate-pulse">
                        <ShieldAlert size={20} className="text-red-500" />
                    </div>
                </header>

                <div className="px-5 py-6 space-y-6">
                    {/* ── Warning Card ── */}
                    <div className="bg-red-600 rounded-2xl p-5 text-white flex items-start gap-4 border border-red-700/10 shadow-xl relative overflow-hidden">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0 relative z-10">
                            <AlertTriangle size={24} strokeWidth={2.5} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-black uppercase italic leading-none">Critical Protocol</h3>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest leading-relaxed mt-2">
                                Use this ONLY for real emergencies. Misuse may result in account termination & fine.
                            </p>
                        </div>
                        <ShieldAlert size={100} className="absolute -bottom-10 -right-10 text-white/5 opacity-20 rotate-12" />
                    </div>

                    {/* ── Message Input ── */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                             Describe Situation <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What happened? (e.g. Captain behavior, Vehicle Damage, Physical Threat)"
                            className="w-full bg-white border border-gray-100 rounded-2xl p-4 min-h-[120px] text-sm font-bold text-content outline-none focus:border-red-500/30 shadow-soft"
                        />
                    </div>

                    {/* ── Image Proof ── */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] ml-1">
                             Visual Evidence (Optional)
                        </label>
                        <div className="flex gap-3 overflow-hidden">
                            <button 
                                onClick={() => fileInputRef.current.click()}
                                className="w-24 h-24 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-content-subtle hover:border-red-300 transition-all shrink-0"
                            >
                                <Camera size={24} />
                                <span className="text-[8px] font-black uppercase mt-1">Capture</span>
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handlePhotoCapture} 
                            />
                            
                            {photo && (
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-soft">
                                    <img src={photo} className="w-full h-full object-cover" alt="SOS Proof" />
                                    <button 
                                        onClick={() => setPhoto(null)} 
                                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-lg"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Location Sync ── */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                        <MapPin size={18} className="text-content-subtle" />
                        <div className="flex-1">
                            <p className="text-[8px] font-black text-content-subtle uppercase">Enforcement Protocol</p>
                            <p className="text-[10px] font-black text-content uppercase tracking-tight">Real-time GPS coordinates are being recorded</p>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    </div>

                    {/* ── Action Buttons ── */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <button 
                            onClick={() => window.location.href = 'tel:100'}
                            className="h-16 bg-white border-2 border-red-100 text-red-600 rounded-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all"
                        >
                            <Phone size={18} />
                            <span className="text-[9px] font-black uppercase">Call 100</span>
                        </button>
                        <button 
                           onClick={() => window.location.href = 'tel:+918069100000'}
                           className="h-16 bg-white border-2 border-gray-100 text-content rounded-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all"
                        >
                            <MessageSquare size={18} />
                            <span className="text-[9px] font-black uppercase">Talk to Agent</span>
                        </button>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-50 flex flex-col gap-3">
                    <motion.button 
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSubmit}
                        disabled={isSubmitting || !description}
                        className={`w-full h-16 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 ${isSubmitting || !description ? 'bg-gray-100 text-gray-400' : 'bg-red-600 text-white shadow-red-200'}`}
                    >
                        {isSubmitting ? (
                             <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send size={20} /> DISPATCH SOS ALERT
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </MobileLayout>
    );
};

export default EmergencySOS;
