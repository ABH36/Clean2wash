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
    User
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const TaskDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
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
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Command Header */}
            <header className="bg-white/80 backdrop-blur-xl px-6 pt-12 pb-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
                <button
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm active:scale-95 transition-all"
                >
                    <ChevronLeft size={22} className="text-content" />
                </button>
                <div className="text-center">
                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] leading-none mb-1 shadow-sm">Protocol ID</p>
                    <h1 className="text-xl font-black text-content italic leading-none">{task.id}</h1>
                </div>
                <button className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 group">
                    <AlertCircle size={22} className="text-red-500 group-hover:scale-110 transition-transform" />
                </button>
            </header>

            {/* Tactical Map Overlay */}
            <div className="h-72 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80')] bg-cover bg-center opacity-30 grayscale contrast-125" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                        <div className="w-16 h-16 bg-brand/20 rounded-full animate-ping" />
                        <div className="absolute inset-0 w-16 h-16 bg-brand rounded-full flex items-center justify-center border-4 border-white shadow-2xl">
                            <Navigation2 size={32} className="text-white fill-current animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Tactical HUD */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">GPS Linked</span>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                    <button
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`, '_blank')}
                        className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] text-white shadow-2xl transition-all"
                    >
                        <Navigation2 size={18} className="text-brand fill-current" /> Initialize Tactical Route
                    </button>
                </div>
            </div>

            {/* Content Node */}
            <div className="px-6 -mt-6 relative z-10 space-y-6">

                {/* Protocol Overview */}
                <div className="bg-content rounded-[2.5rem] p-7 shadow-2xl shadow-content/30 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-brand/20 rounded-xl flex items-center justify-center border border-brand/30">
                                <Truck size={20} className="text-brand" />
                            </div>
                            <div>
                                <h3 className="font-black text-[10px] uppercase tracking-[0.25em] text-brand">{currentPhase} Phase</h3>
                                <p className="text-xs font-bold text-white/60 uppercase tracking-widest italic">{task.serviceName}</p>
                            </div>
                        </div>

                        <div className="flex gap-8">
                            <div>
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1.5">Action Time</p>
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-brand" />
                                    <span className="text-2xl font-black italic tracking-tighter">12m <span className="text-xs opacity-40 font-bold uppercase tracking-widest">Rem</span></span>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-white/10 self-end" />
                            <div>
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1.5">Terminal Code</p>
                                <p className="text-lg font-black italic tracking-tighter text-brand uppercase">{id?.split('-')[2] || 'AX-92'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand/10 rounded-full blur-3xl group-hover:bg-brand/20 transition-all duration-700" />
                </div>

                {/* Customer Insight Card */}
                <div className="bg-white rounded-[2.5rem] p-7 shadow-soft border border-gray-100 group">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex gap-4">
                            <div className="w-16 h-16 rounded-[2rem] bg-gray-50 flex items-center justify-center border border-gray-100 font-black text-2xl text-content italic shadow-inner">
                                {task.userName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-content italic leading-none mb-1.5">{task.userName || 'Customer'}</h2>
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em]">{task.phone}</p>
                            </div>
                        </div>
                        <div className="flex gap-2.5">
                            <button className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center border border-brand/20 text-brand shadow-sm hover:scale-105 transition-transform">
                                <Phone size={20} fill="currentColor" />
                            </button>
                            <button className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600 shadow-sm hover:scale-105 transition-transform">
                                <MessageSquare size={20} fill="currentColor" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <MapPin size={20} className="text-brand shrink-0 mt-0.5" />
                            <p className="text-xs font-black text-content leading-relaxed italic uppercase tracking-tighter">{task.address}</p>
                        </div>
                        <div className="flex items-center gap-4 px-4">
                            <ShieldCheck size={20} className="text-content-subtle shrink-0" />
                            <p className="text-sm font-black text-content italic uppercase tracking-widest leading-none pt-0.5">{task.vehicle}</p>
                        </div>
                    </div>
                </div>

                {/* Inspection Protocol Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <h4 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] italic">Inspection Protocol</h4>
                        <span className="text-[9px] font-black text-brand uppercase tracking-widest">{photos.length}/4 Scanned</span>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <motion.button
                                key={i}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setPhotos(prev => prev.includes(i) ? prev : [...prev, i])}
                                className={`aspect-square rounded-[1.5rem] border-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-500 overflow-hidden relative ${photos.includes(i)
                                    ? 'bg-brand/5 border-brand text-brand'
                                    : 'bg-white border-dashed border-gray-200 text-gray-300'
                                    }`}
                            >
                                {photos.includes(i) ? (
                                    <>
                                        <CheckCircle2 size={24} strokeWidth={3} className="relative z-10" />
                                        <div className="absolute inset-0 bg-brand/5 animate-pulse" />
                                    </>
                                ) : (
                                    <Camera size={24} />
                                )}
                                <span className="text-[8px] font-black uppercase tracking-tighter italic">{photos.includes(i) ? 'Stored' : `View ${i}`}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tactical Action Terminal */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-2xl border-t border-gray-100 shadow-2xl z-50">
                {staffStep === 0 && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStaffStep(1)}
                        className="w-full h-16 bg-brand text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand/20 flex items-center justify-center gap-3"
                    >
                        Report Arrival <CheckCircle2 size={20} strokeWidth={3} />
                    </motion.button>
                )}
                {staffStep === 1 && (
                    <div className="space-y-3 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle italic flex items-center justify-center gap-2">
                            <Camera size={12} className="text-brand" /> {4 - photos.length} Mandatory Views Remaining
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            disabled={photos.length < 4}
                            onClick={() => {
                                setStaffStep(2);
                                if (!isDelivery) handleUpdateStatus('in-progress');
                            }}
                            className={`w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all duration-500 ${photos.length >= 4
                                ? 'bg-content text-white shadow-content/30'
                                : 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200'
                                }`}
                        >
                            Execute {isDelivery ? 'Delivery' : 'Pickup'} <Truck size={20} strokeWidth={3} />
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
                        className="w-full h-16 bg-green-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 hover:bg-green-600 transition-all"
                    >
                        {isDelivery ? 'Job Finalized' : 'Handed to Hub'} <CheckCircle2 size={24} strokeWidth={3} />
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default TaskDetails;
