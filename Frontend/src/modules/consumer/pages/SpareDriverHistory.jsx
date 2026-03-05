import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, History, MapPin, Clock, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';

const SpareDriverHistory = () => {
    const navigate = useNavigate();

    const historicalTrips = [
        { id: 'T-8821', date: '21 Feb 2026', time: '10:00 AM', type: 'Point-to-Point', status: 'Completed', driver: 'Rahul S.', price: '₹299' },
        { id: 'T-8742', date: '18 Feb 2026', time: '02:30 PM', type: 'Hourly (4h)', status: 'Completed', driver: 'Karan K.', price: '₹499' },
        { id: 'T-8520', date: '10 Feb 2026', time: '07:00 AM', type: 'Full Day', status: 'Completed', driver: 'Amit J.', price: '₹999' }
    ];

    return (
        <MobileLayout>
            <div className="min-h-screen bg-white flex flex-col">
                <header className="px-5 pt-12 pb-4 flex items-center gap-4 border-b border-gray-100">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black">
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl font-black text-black tracking-tight uppercase leading-none">Chauffeur History</h1>
                </header>

                <div className="p-5 space-y-4">
                    {historicalTrips.map((trip) => (
                        <motion.div
                            key={trip.id}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <p className="text-[14px] font-black text-black leading-none">{trip.price}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center text-brand border border-brand/20">
                                    <History size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-[13px] font-black text-black uppercase tracking-tight leading-none mb-1">{trip.type}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">{trip.status} • {trip.date}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/[0.03]">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center">
                                        <Clock size={12} className="text-black/40" />
                                    </div>
                                    <span className="text-[10px] font-black text-black/60 uppercase">{trip.time}</span>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-[10px] font-black text-black/60 uppercase">Driver: {trip.driver}</span>
                                    <Star size={10} fill="#F29F05" className="text-brand" />
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    <div className="pt-8 flex flex-col items-center">
                        <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">End of History</p>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default SpareDriverHistory;
