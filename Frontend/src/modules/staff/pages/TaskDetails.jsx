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
    AlertCircle
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
        id: id || 'TASK-001',
        userName: 'Aryan Pathak',
        phone: '+91 98765 43210',
        price: '₹1,299',
        address: 'Sec-15, Faridabad, Near Crown Plaza',
        vehicle: 'Fortuner (HR 51 BZ 1234)',
        serviceName: 'Full Studio Clean + Studio Pickup',
        status: 'pending'
    };

    // Initialize status based on global state
    const getStaffStatus = () => {
        if (task.status === 'completed') return 'completed';
        if (task.status === 'delivery-assigned') return 'delivering';
        if (task.status === 'at-studio') return 'at-studio';
        if (task.status === 'in-progress') return 'in-progress';
        if (task.status === 'confirmed') return 'pickup-assigned';
        return 'unknown';
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
            {/* Header */}
            <header className="bg-white px-5 pt-12 pb-6 border-b border-gray-100 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <ChevronLeft size={20} className="text-content" />
                </button>
                <div className="text-center">
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest leading-none mb-1">Active Job</p>
                    <h1 className="text-lg font-black text-content italic leading-none">{task.id}</h1>
                </div>
                <button className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
                    <AlertCircle size={20} className="text-accent-red" />
                </button>
            </header>

            {/* Fake Map View */}
            <div className="h-64 bg-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80')] bg-cover bg-center opacity-40 grayscale" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                        <div className="w-12 h-12 bg-brand/30 rounded-full animate-ping" />
                        <div className="absolute inset-0 w-12 h-12 bg-brand rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                            <Navigation2 size={24} className="text-white fill-current" />
                        </div>
                    </div>
                </div>
                {/* Overlay Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                    <button className="flex-1 bg-white/90 backdrop-blur-md py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg">
                        <Navigation2 size={16} className="text-brand fill-current" /> Open Maps
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-5 pt-6 space-y-6">
                {/* Customer Info */}
                <div className="bg-white rounded-[2.5rem] p-6 shadow-soft border border-gray-100">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                            <div className="w-14 h-14 rounded-3xl bg-gray-50 flex items-center justify-center border border-gray-100 uppercase font-black text-lg text-brand italic">
                                {task.userName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-content italic">{task.userName || 'Customer'}</h2>
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">{task.phone || '+91 99999 00000'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center border border-brand/20">
                                <Phone size={18} className="text-brand" fill="currentColor" />
                            </button>
                            <button className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                                <MessageSquare size={18} className="text-blue-600" fill="currentColor" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin size={18} className="text-brand shrink-0" />
                            <p className="text-xs font-black text-content leading-relaxed">{task.address}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={18} className="text-content-subtle shrink-0" />
                            <p className="text-sm font-black text-content italic uppercase tracking-tighter">{task.vehicle}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-content text-white rounded-[2.5rem] p-6 shadow-xl shadow-content/20">
                    <div className="flex items-center gap-3 mb-4">
                        <Truck size={20} className="text-brand" />
                        <h3 className="font-black text-xs uppercase tracking-[0.2em]">{currentPhase}: {task.serviceName || task.service}</h3>
                    </div>
                    <div>
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Expected Arrival</p>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-white/60" />
                            <span className="text-lg font-black italic">15 mins</span>
                        </div>
                    </div>
                </div>

                {/* Photos Section */}
                <div>
                    <h4 className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-3 px-2">Vehicle Inspection (Required)</h4>
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                            <button key={i} onClick={() => setPhotos(prev => [...prev, i])} className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${photos.includes(i) ? 'bg-brand/10 border-brand text-brand opacity-100' : 'bg-white border-dashed border-gray-200 opacity-60'}`}>
                                <Camera size={16} />
                                <span className="text-[7px] font-black uppercase">{photos.includes(i) ? 'Snap' : 'Click'}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-xl border-t border-gray-100">
                {staffStep === 0 && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStaffStep(1)}
                        className="w-full bg-brand text-white py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/20 flex items-center justify-center gap-2"
                    >
                        Reached {isDelivery ? 'Customer' : 'Pick Location'} <CheckCircle2 size={20} strokeWidth={3} />
                    </motion.button>
                )}
                {staffStep === 1 && (
                    <div className="space-y-3">
                        <p className="text-center text-[10px] font-black uppercase tracking-widest text-content-subtle italic">Take 4 photos to proceed</p>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            disabled={photos.length < 4}
                            onClick={() => {
                                setStaffStep(2);
                                if (!isDelivery) handleUpdateStatus('in-progress');
                            }}
                            className={`w-full py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 ${photos.length >= 4 ? 'bg-content text-white shadow-content/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            Verify & {isDelivery ? 'Deliver' : 'Pick'} Vehicle <Truck size={20} strokeWidth={3} />
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
                        className="w-full bg-green-500 text-white py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-green-500/20 flex items-center justify-center gap-2"
                    >
                        {isDelivery ? 'Delivered to Customer' : 'Handed to Studio'} <CheckCircle2 size={20} strokeWidth={3} />
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default TaskDetails;
