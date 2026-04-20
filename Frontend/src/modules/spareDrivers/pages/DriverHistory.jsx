import React, { useState, useEffect } from 'react';
import { History, MapPin, Clock, Star, ChevronLeft, Calendar, Loader2, Navigation, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { motion } from 'framer-motion';

const DriverHistory = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        spareDriverAPI.getTripHistory()
            .then(res => setTrips(res.data.bookings || []))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <DriverLayout title="Logs"><div className="flex h-[60vh] items-center justify-center font-black text-content/20 uppercase tracking-[0.4em] animate-pulse">Retrieving Archives...</div></DriverLayout>;

    return (
        <DriverLayout title="Archival Logs">
            <div className="px-6 py-6 space-y-6 pb-24">
                <div className="flex justify-between items-center px-2">
                    <p className="text-[10px] font-black text-content/30 uppercase tracking-[0.3em]">Sector History ({trips.length})</p>
                </div>

                <div className="space-y-4">
                    {trips.length > 0 ? trips.map((t, i) => (
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} key={i} className="bg-surface border border-content/[0.04] rounded-[2.2rem] p-6  relative overflow-hidden group transition-colors duration-500">
                           <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-content/[0.02] border border-content/[0.03] rounded-xl flex items-center justify-center text-content/20"><Navigation size={18} /></div>
                                    <div>
                                        <p className="text-[11px] font-black text-content uppercase tracking-tight mb-1">{t.service?.name}</p>
                                        <div className="flex items-center gap-3 text-content/25">
                                            <div className="flex items-center gap-1"><Calendar size={10} /><span className="text-[8px] font-black uppercase">{new Date(t.createdAt).toLocaleDateString()}</span></div>
                                            <div className="flex items-center gap-1"><Clock size={10} /><span className="text-[8px] font-black uppercase">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-content tracking-tighter">₹{t.pricing?.totalAmount}</p>
                                    <div className="flex items-center justify-end gap-1 text-green-600 dark:text-green-500 mt-1">
                                        <ShieldCheck size={10} />
                                        <span className="text-[8px] font-black uppercase">Secured</span>
                                    </div>
                                </div>
                           </div>

                           <div className="space-y-4 pt-5 border-t border-content/[0.03]">
                                <div className="flex gap-4">
                                    <MapPin size={14} className="text-brand shrink-0" />
                                    <p className="text-[10px] font-black text-content/60 uppercase leading-snug">{t.location?.address?.street}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-black text-brand flex items-center justify-center font-black text-[10px]">{(t.consumer?.name || 'U')[0]}</div>
                                        <span className="text-[10px] font-black text-content uppercase">{t.consumer?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star size={10} className="text-brand fill-brand" />
                                        <span className="text-[10px] font-black text-content">5.0</span>
                                    </div>
                                </div>
                           </div>
                        </motion.div>
                    )) : (
                        <div className="py-20 text-center opacity-20 text-content"><History size={32} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">No Archival Logs</p></div>
                    )}
                </div>
            </div>
        </DriverLayout>
    );
};

export default DriverHistory;
