import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Navigation, Zap, Gift, Tag, ShieldCheck, Bell, ChevronRight } from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';

const NOTIFICATIONS = [
    { id: 1, type: 'booking', icon: <Navigation size={17} className="text-blue-600" />, iconBg: 'bg-blue-50', title: 'Captain En Route', desc: 'Rahul is 12 mins away. Please be ready near your vehicle.', time: '2 mins ago', isNew: true },
    { id: 2, type: 'cashback', icon: <Zap size={17} className="text-brand" fill="currentColor" />, iconBg: 'bg-brand/10', title: '100% Cashback Credited!', desc: 'Your first wash cashback of ₹299 has been added to Hoora Wallet.', time: 'Yesterday', isNew: true },
    { id: 3, type: 'offer', icon: <Gift size={17} className="text-pink-600" />, iconBg: 'bg-pink-50', title: 'Weekend Special Offer', desc: 'Get 30% off on Full Deep Clean every Sat & Sun. Use WEEKEND30.', time: '2 days ago', isNew: false },
    { id: 4, type: 'completed', icon: <CheckCircle2 size={17} className="text-green-600" />, iconBg: 'bg-green-50', title: 'Wash Completed!', desc: 'Your Eco Doorstep Wash is done. Rate your experience with Vikram.', time: 'Feb 18', isNew: false },
    { id: 5, type: 'security', icon: <ShieldCheck size={17} className="text-violet-600" />, iconBg: 'bg-violet-50', title: 'New Login Detected', desc: 'A new login was detected from Android in Bengaluru.', time: 'Feb 17', isNew: false },
    { id: 6, type: 'promo', icon: <Tag size={17} className="text-amber-600" />, iconBg: 'bg-amber-50', title: 'Hoora FASTag Available', desc: 'Now manage FASTag recharges directly from the Hoora app.', time: 'Feb 15', isNew: false },
];

const Notifications = () => {
    const navigate = useNavigate();
    const newN = NOTIFICATIONS.filter(n => n.isNew);
    const oldN = NOTIFICATIONS.filter(n => !n.isNew);

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 flex items-center justify-between bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">Notifications</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">{newN.length} New</p>
                    </div>
                </div>
                <button className="text-brand text-[9px] font-black uppercase tracking-widest">Mark all read</button>
            </header>

            <div className="px-4 pb-24 pt-4 space-y-5">
                {newN.length > 0 && (
                    <section className="space-y-2">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest px-1">New</p>
                        {newN.map((n, i) => <NotifCard key={n.id} notif={n} delay={i * 0.04} />)}
                    </section>
                )}
                <section className="space-y-2">
                    <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest px-1">Earlier</p>
                    {oldN.map((n, i) => <NotifCard key={n.id} notif={n} delay={i * 0.04} />)}
                </section>
            </div>
        </MobileLayout>
    );
};

const NotifCard = ({ notif: n, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}
        className={`flex items-start gap-3 p-4 rounded-2xl border ${n.isNew ? 'bg-brand/5 border-brand/10' : 'bg-white border-gray-100'}`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.iconBg}`}>{n.icon}</div>
        <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
                <h3 className="font-black text-sm text-content tracking-tight leading-tight">{n.title}</h3>
                {n.isNew && <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-1" />}
            </div>
            <p className="text-[10px] font-bold text-content-subtle leading-relaxed">{n.desc}</p>
            <p className="text-[8px] font-black text-content-subtle/50 uppercase tracking-widest mt-1.5">{n.time}</p>
        </div>
    </motion.div>
);

export default Notifications;
