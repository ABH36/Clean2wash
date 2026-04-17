import React, { useState, useEffect } from 'react';
import { 
    Calendar, MapPin, Clock, Search, Filter, 
    ChevronRight, ArrowUpRight, Zap, Bell, 
    MoreHorizontal, FilterX, Loader2, Navigation,
    ArrowLeft, X, ShieldCheck, User, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { toast } from 'react-hot-toast';
import GoogleMapBox from '../../../components/common/GoogleMapBox';

const STATUS_TONE = {
    pending: 'bg-brand text-black',
    en_route: 'bg-brand text-black shadow-lg shadow-brand/10',
    arrived: 'bg-brand text-black shadow-lg shadow-brand/10',
    active: 'bg-green-600 text-white',
    completed: 'bg-content/[0.05] text-content/30',
};

const DriverBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedJob, setSelectedJob] = useState(null);

    const fetch = async () => {
        try {
            const res = await spareDriverAPI.getBookings();
            setBookings(res.data.bookings || []);
        } catch (e) { toast.error("Sync error"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const filtered = bookings.filter(b => filter === 'all' || b.status === filter);

    return (
        <DriverLayout title="Sector Control">
            <div className="px-6 py-6 space-y-6 pb-24">
                {/* ── Filter Node ── */}
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                    {['all', 'pending', 'active', 'completed'].map((tab) => (
                        <button 
                            key={tab} 
                            onClick={() => setFilter(tab)}
                            className={`px-6 h-10 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === tab ? 'bg-black dark:bg-brand text-brand dark:text-black shadow-lg' : 'bg-surface border border-content/[0.04] text-content/30'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── Registry ── */}
                <div className="space-y-4">
                    {filtered.length > 0 ? filtered.map((b) => (
                        <motion.div 
                            key={b._id} 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }}
                            onClick={() => setSelectedJob(b)}
                            className="bg-surface border border-content/[0.04] rounded-[2rem] p-5 shadow-sm relative overflow-hidden active:scale-[0.98] transition-all duration-500"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${STATUS_TONE[b.status] || STATUS_TONE.completed}`}>{b.status}</span>
                                <p className="text-lg font-black text-content tracking-tighter">₹{b.pricing?.totalAmount}</p>
                            </div>
                            <h3 className="text-[11px] font-black text-content uppercase mb-1">{b.service?.name}</h3>
                            <div className="flex items-center gap-4 text-content/25">
                                <div className="flex items-center gap-1.5"><Calendar size={12} /><span className="text-[9px] font-black uppercase">{new Date(b.createdAt).toLocaleDateString()}</span></div>
                                <div className="flex items-center gap-1.5"><Navigation size={12} /><span className="text-[9px] font-black uppercase">{b.service?.duration || 'Express'}</span></div>
                            </div>
                            <div className="mt-4 flex items-center gap-3 pt-4 border-t border-content/[0.03]">
                                <MapPin size={14} className="text-brand shrink-0" />
                                <p className="text-[10px] font-black text-content/60 uppercase truncate">{b.location?.address?.street}</p>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="py-20 text-center opacity-20 text-content"><Search size={32} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">Sector Clear</p></div>
                    )}
                </div>
            </div>

            {/* ── Intel Drawer ── */}
            <AnimatePresence>
                {selectedJob && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedJob(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
                        <motion.div 
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
                            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-surface rounded-t-[2.8rem] z-[70] overflow-hidden shadow-2xl transition-colors duration-500"
                        >
                            <div className="w-12 h-1.5 bg-content/10 rounded-full mx-auto mt-4 mb-2" />
                            <div className="p-8 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div><p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">Mission Intel</p><h2 className="text-2xl font-black text-content uppercase tracking-tight">{selectedJob.service?.name}</h2></div>
                                    <button onClick={() => setSelectedJob(null)} className="p-2 bg-content/[0.04] rounded-xl text-content/20"><X size={20} /></button>
                                </div>

                                <div className="h-44 w-full rounded-2xl overflow-hidden border border-content/5 bg-content/[0.02] relative shadow-inner">
                                    <GoogleMapBox 
                                        center={{ lat: selectedJob.location?.address?.coordinates?.lat || 28.6139, lng: selectedJob.location?.address?.coordinates?.lng || 77.2090 }}
                                        zoom={14}
                                        markers={[{ position: { lat: selectedJob.location?.address?.coordinates?.lat, lng: selectedJob.location?.address?.coordinates?.lng }, icon: { url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', scaledSize: { width: 32, height: 32 } } }]}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-4"><User size={18} className="text-content/20" /><div><p className="text-[9px] font-black text-content/20 uppercase tracking-widest">Customer</p><p className="text-sm font-black text-content uppercase">{selectedJob.consumer?.name}</p></div></div>
                                    <div className="flex gap-4"><MapPin size={18} className="text-brand" /><div><p className="text-[9px] font-black text-content/20 uppercase tracking-widest">Target Terminal</p><p className="text-sm font-black text-content uppercase leading-snug">{selectedJob.location?.address?.street}, {selectedJob.location?.address?.city}</p></div></div>
                                </div>

                                <div className="flex gap-3">
                                    <a href={`tel:${selectedJob.consumer?.phone}`} className="flex-1 h-15 bg-black dark:bg-brand text-white dark:text-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg"><Phone size={18} /><span className="text-[11px] font-black uppercase tracking-widest">Contact</span></a>
                                    <div className="px-6 h-15 bg-content/[0.04] border border-content/[0.03] rounded-2xl flex flex-col justify-center text-right"><p className="text-[8px] font-black text-content/20 uppercase">Yield</p><p className="text-lg font-black text-content tracking-tight">₹{selectedJob.pricing?.totalAmount}</p></div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </DriverLayout>
    );
};

export default DriverBookings;
