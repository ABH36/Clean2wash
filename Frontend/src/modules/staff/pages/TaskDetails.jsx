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

const TaskDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [status, setStatus] = useState('accepted'); // 'accepted' | 'arrived' | 'picked' | 'delivered'

    // Mock data
    const task = {
        id: id || 'TASK-001',
        customer: 'Aryan Pathak',
        phone: '+91 98765 43210',
        address: 'Sec-15, Faridabad, Near Crown Plaza',
        vehicle: 'Fortuner (HR 51 BZ 1234)',
        service: 'Full Studio Clean + Studio Pickup',
        price: '₹1,299',
        instructions: 'Please be careful with the side mirrors.'
    };

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
                                {task.customer[0]}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-content italic">{task.customer}</h2>
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">{task.phone}</p>
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
                        <h3 className="font-black text-xs uppercase tracking-[0.2em]">{task.service}</h3>
                    </div>
                    <div>
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Pick up arrival</p>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-white/60" />
                            <span className="text-lg font-black italic">15 mins</span>
                        </div>
                    </div>
                </div>

                {/* Photos Section */}
                <div>
                    <h4 className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-3 px-2">Departure Inspection</h4>
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                            <button key={i} className="aspect-square bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 opacity-60">
                                <Camera size={16} className="text-content-subtle" />
                                <span className="text-[7px] font-black uppercase">Click</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-xl border-t border-gray-100">
                {status === 'accepted' && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStatus('arrived')}
                        className="w-full bg-brand text-white py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/20 flex items-center justify-center gap-2"
                    >
                        Reached Customer <CheckCircle2 size={20} strokeWidth={3} />
                    </motion.button>
                )}
                {status === 'arrived' && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStatus('picked')}
                        className="w-full bg-content text-white py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-content/20 flex items-center justify-center gap-2"
                    >
                        Pick Vehicle <Truck size={20} strokeWidth={3} />
                    </motion.button>
                )}
                {status === 'picked' && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStatus('delivered')}
                        className="w-full bg-accent-green text-white py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-green-500/20 flex items-center justify-center gap-2"
                    >
                        Delivered to Hub <CheckCircle2 size={20} strokeWidth={3} />
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default TaskDetails;
