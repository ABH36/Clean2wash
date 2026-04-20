import React, { useEffect, useState } from 'react';
import { Bell, Trash2, ChevronLeft, Clock, AlertCircle, Info, CheckCircle2, Loader2, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { socketService } from '../../../utils/socket';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const DriverNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        try {
            const res = await spareDriverAPI.getNotifications();
            setNotifications(res.data.notifications || []);
        } catch (e) { toast.error("Sync failure"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const clear = async () => {
        try {
            await spareDriverAPI.clearNotifications();
            setNotifications([]);
            toast.success("Archives purged");
        } catch (e) { toast.error("Purge failed"); }
    };

    if (loading) return <DriverLayout title="Signals"><div className="flex h-[60vh] items-center justify-center font-black text-content/20 uppercase tracking-[0.4em] animate-pulse">Scanning Hub...</div></DriverLayout>;

    return (
        <DriverLayout title="Signal Center">
            <div className="px-6 py-6 space-y-6 pb-24">
                <div className="flex justify-between items-center px-2">
                    <p className="text-[10px] font-black text-content/30 uppercase tracking-[0.3em]">Operational Alerts</p>
                    {notifications.length > 0 && (
                        <button onClick={clear} className="text-[9px] font-black text-brand uppercase tracking-widest flex items-center gap-1.5 border-b border-brand transition-colors active:scale-95">
                            <Trash2 size={10} /> Purge Hub
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {notifications.length > 0 ? notifications.map((n, i) => (
                        <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={i} className="bg-surface border border-content/[0.04] rounded-[1.8rem] p-5  relative overflow-hidden flex gap-4 transition-colors duration-500">
                            <div className="w-10 h-10 rounded-xl bg-content/[0.04] flex items-center justify-center shrink-0">
                                <Zap size={18} className="text-brand" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-1">
                                    <h4 className="text-[11px] font-black uppercase text-content truncate">{n.title}</h4>
                                    <span className="text-[8px] font-black text-content/20 uppercase tabular-nums">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-[10px] text-content/60 leading-relaxed uppercase">{n.message}</p>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="py-20 text-center opacity-20 text-content"><Bell size={32} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">Quiet Sector</p></div>
                    )}
                </div>
            </div>
        </DriverLayout>
    );
};

export default DriverNotifications;
