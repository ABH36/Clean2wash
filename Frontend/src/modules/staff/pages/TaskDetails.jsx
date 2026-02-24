import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft,
    MapPin,
    Phone,
    MessageSquare,
    Truck,
    ShieldCheck,
    CheckCircle2,
    Navigation2,
    Clock,
    Camera,
    AlertCircle,
    ArrowUpRight,
    Search,
    User,
    Package
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const TaskDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { isDarkMode } = useTheme();
    const { bookings, updateBookingStatus } = useAuth();

    // Find the real booking
    const liveBooking = bookings.find(b => b.id === id);

    // Fallback if booking is not found (for demo safety)
    const task = liveBooking || {
        id: id || 'CW-TSK-402',
        userName: 'Aryan Pathak',
        phone: '+91 98765 43210',
        price: '₹1,299',
        address: 'Sec-15, Faridabad, Near Crown Plaza',
        vehicle: 'Fortuner (HR 51 BZ 1234)',
        serviceName: 'Full Studio Clean + Studio Pickup',
        status: 'pending'
    };

    const [staffStep, setStaffStep] = useState(0); // 0: Navigating, 1: Arrived, 2: Inspected/Picked
    const [photos, setPhotos] = useState([]);

    const handleUpdateStatus = (globalStatus) => {
        updateBookingStatus(task.id, globalStatus);
    };

    const isDelivery = task.status === 'delivery-assigned' || task.status === 'completed';
    const currentPhase = isDelivery ? 'Delivery' : 'Pickup';

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#FAFBFF]'} pb-32 transition-colors duration-500`}>
            {/* Command Header */}
            <header className={`${isDarkMode ? 'bg-[#0F172A]/80 border-white/5' : 'bg-white/80 border-gray-100'} backdrop-blur-xl px-5 pt-10 pb-4 border-b flex items-center justify-between sticky top-0 z-50 transition-all`}>
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-gray-100 text-content shadow-sm'}`}
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                    <p className={`text-[8px] font-black uppercase tracking-[0.25em] leading-none mb-1 ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>Task Active</p>
                    <h1 className={`text-base font-black italic leading-none tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>{task.id}</h1>
                </div>
                <button className={`w-10 h-10 rounded-xl flex items-center justify-center border group transition-all ${isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-500 shadow-sm'}`}>
                    <AlertCircle size={20} />
                </button>
            </header>

            {/* Tactical Map Overlay */}
            <div className="h-56 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80')] bg-cover bg-center opacity-20 grayscale contrast-125" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

                <div className="absolute inset-0 flex items-center justify-center -mt-6">
                    <div className="relative">
                        <div className="w-12 h-12 bg-brand/30 rounded-full animate-ping" />
                        <div className="absolute inset-0 w-12 h-12 bg-brand rounded-full flex items-center justify-center border-2 border-white shadow-2xl">
                            <Navigation2 size={24} className="text-white fill-current animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Tactical HUD */}
                <div className="absolute top-4 left-4">
                    <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[7px] font-black text-white uppercase tracking-widest leading-none">GPS: Active_Stream</span>
                    </div>
                </div>

                <div className="absolute bottom-4 left-5 right-5">
                    <button
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`, '_blank')}
                        className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-[0.2em] text-white shadow-2xl transition-all"
                    >
                        <Navigation2 size={14} className="text-brand fill-current" /> Initialize Route
                    </button>
                </div>
            </div>

            {/* Content Node */}
            <div className="px-5 -mt-4 relative z-10 space-y-5">

                {/* Protocol Overview Card */}
                <div className={`rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group border transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-black/40' : 'bg-white border-gray-100 shadow-soft'}`}>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${isDarkMode ? 'bg-brand/10 border-brand/20' : 'bg-brand/5 border-brand/10'}`}>
                                {currentPhase === 'Pickup' ? <Truck size={22} className="text-brand" /> : <Package size={22} className="text-brand" />}
                            </div>
                            <div>
                                <h3 className={`font-black text-[9px] uppercase tracking-[0.25em] ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>{currentPhase} Operation</h3>
                                <p className={`text-sm font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>{task.serviceName}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[7px] font-black uppercase tracking-widest mb-1`}>Rem. Time</p>
                            <div className="flex items-center justify-end gap-1.5 text-brand">
                                <Clock size={14} />
                                <span className="text-lg font-black italic leading-none">12:00</span>
                            </div>
                        </div>
                    </div>
                    <div className={`absolute -right-6 -bottom-6 w-24 h-24 bg-brand/5 rounded-full blur-2xl group-hover:bg-brand/10 transition-all duration-700`} />
                </div>

                {/* Customer Insight Node */}
                <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} rounded-[2rem] p-6 border transition-all duration-500`}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border font-black text-lg italic shadow-inner ${isDarkMode ? 'bg-white/5 border-white/10 text-white/50' : 'bg-gray-50 border-gray-100 text-content-subtle'}`}>
                                {task.userName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h2 className={`text-lg font-black italic leading-none mb-1 uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{task.userName || 'Customer'}</h2>
                                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{task.phone}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-brand/5 border-brand/10 text-brand'}`}>
                                <Phone size={18} fill="currentColor" />
                            </button>
                            <button className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                <MessageSquare size={18} fill="currentColor" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
                            <MapPin size={18} className="text-brand shrink-0 mt-0.5" />
                            <p className={`text-xs font-bold leading-snug uppercase tracking-tight ${isDarkMode ? 'text-white/70' : 'text-content-muted'}`}>{task.address}</p>
                        </div>
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_8px_rgba(255,107,0,0.5)]" />
                            <p className={`text-[10px] font-black italic uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>{task.vehicle}</p>
                        </div>
                    </div>
                </div>

                {/* Inspection Protocol Node */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-3">
                        <h4 className={`text-[9px] font-black uppercase tracking-[0.2em] italic ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Vehicle Verification Scans</h4>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>{photos.length} OF 4 COMPLETE</span>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <motion.button
                                key={i}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setPhotos(prev => prev.includes(i) ? prev : [...prev, i])}
                                className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-500 overflow-hidden relative ${photos.includes(i)
                                    ? (isDarkMode ? 'bg-brand/10 border-brand/40 text-brand' : 'bg-brand/5 border-brand/20 text-brand')
                                    : (isDarkMode ? 'bg-white/5 border-dashed border-white/10 text-white/10' : 'bg-white border-dashed border-gray-200 text-gray-200')
                                    }`}
                            >
                                {photos.includes(i) ? (
                                    <>
                                        <CheckCircle2 size={20} className="relative z-10" />
                                        <div className="absolute inset-0 bg-brand/5 animate-pulse" />
                                    </>
                                ) : (
                                    <Camera size={20} />
                                )}
                                <span className="text-[7px] font-black uppercase tracking-tighter italic">{photos.includes(i) ? 'Stored' : `Frame_${i}`}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tactical Action Terminal */}
            <div className={`fixed bottom-0 left-0 right-0 p-5 backdrop-blur-3xl border-t z-50 transition-all duration-500 ${isDarkMode ? 'bg-[#0F172A]/90 border-white/5 shadow-[0_-15px_50px_rgba(0,0,0,0.4)]' : 'bg-white/90 border-gray-100 shadow-[0_-15px_40px_rgba(0,0,0,0.06)]'}`}>
                {staffStep === 0 && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStaffStep(1)}
                        className="w-full h-14 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-brand/20 flex items-center justify-center gap-3 active:bg-brand-dark"
                    >
                        Report Arrival <CheckCircle2 size={18} strokeWidth={3} />
                    </motion.button>
                )}
                {staffStep === 1 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                            <div className="flex -space-x-1.5">
                                {[1, 2, 3].map(p => (
                                    <div key={p} className={`w-4 h-4 rounded-full border border-white flex items-center justify-center ${photos.length >= p ? 'bg-brand text-[6px]' : 'bg-gray-200 text-[6px]'} transition-colors`}>
                                        {photos.length >= p && '✓'}
                                    </div>
                                ))}
                            </div>
                            <p className={`text-[8px] font-black uppercase tracking-widest italic ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Complete mandatory scans ({4 - photos.length} left)</p>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            disabled={photos.length < 4}
                            onClick={() => {
                                setStaffStep(2);
                                if (!isDelivery) handleUpdateStatus('in-progress');
                            }}
                            className={`w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-500 shadow-xl ${photos.length >= 4
                                ? (isDarkMode ? 'bg-white text-[#0F172A] shadow-white/5' : 'bg-content text-white shadow-content/30')
                                : (isDarkMode ? 'bg-white/5 text-white/5 border border-white/5 cursor-not-allowed opacity-50' : 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200')
                                }`}
                        >
                            Execute {isDelivery ? 'Delivery' : 'Pickup'} <Truck size={18} strokeWidth={3} />
                        </motion.button>
                    </div>
                )}
                {staffStep === 2 && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            if (isDelivery) {
                                handleUpdateStatus('completed');
                            } else {
                                handleUpdateStatus('at-studio');
                            }
                            navigate('/staff');
                        }}
                        className="w-full h-14 bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 hover:bg-green-600 transition-all"
                    >
                        {isDelivery ? 'Job Finalized' : 'Transfer to Hub'} <CheckCircle2 size={18} strokeWidth={3} />
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default TaskDetails;
