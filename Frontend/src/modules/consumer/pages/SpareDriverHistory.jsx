import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, History, MapPin, Clock, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import api from '../../../utils/api';

const SpareDriverHistory = () => {
    const navigate = useNavigate();
    const [historicalTrips, setHistoricalTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Fetch from standard booking history but filtered for Chauffeur category
                const res = await api.request('/bookings/history?category=Chauffeur');
                if (res.data?.bookings) {
                    setHistoricalTrips(res.data.bookings);
                }
            } catch (err) {
                console.error("Failed to fetch Chauffeur history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

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
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : historicalTrips.length > 0 ? (
                        historicalTrips.map((trip) => (
                            <motion.div
                                key={trip._id}
                                whileTap={{ scale: 0.98 }}
                                className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <p className="text-[14px] font-black text-black leading-none">₹{trip.pricing?.totalAmount || 0}</p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center text-brand border border-brand/20 text-xs font-black">
                                        <History size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-[13px] font-black text-black uppercase tracking-tight leading-none mb-1">{trip.service?.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${trip.status === 'completed' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">{trip.status} • {new Date(trip.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/[0.03]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center">
                                            <Clock size={12} className="text-black/40" />
                                        </div>
                                        <span className="text-[10px] font-black text-black/60 uppercase">{new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                        <span className="text-[10px] font-black text-black/60 uppercase">Driver: {trip.provider?.id?.name || 'Assigned'}</span>
                                        <Star size={10} fill="#F29F05" className="text-brand" />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center py-20 gap-3 opacity-20">
                            <History size={48} />
                            <p className="text-sm font-black uppercase tracking-widest">No Trips Found</p>
                        </div>
                    )}

                    <div className="pt-8 flex flex-col items-center">
                        <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">End of History</p>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default SpareDriverHistory;
