import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Zap, Calendar, Clock, CheckCircle2,
    CreditCard, ShieldCheck, Tag, ArrowRight, Info, MapPin, Car, Droplets
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';

const PAYMENT_METHODS = [
    { id: 'upi', label: 'UPI', sub: 'GPay, PhonePe, Paytm', icon: '⚡' },
    { id: 'card', label: 'Debit / Credit', sub: 'Visa, Mastercard, RuPay', icon: '💳' },
    { id: 'wallet', label: 'Hoora Wallet', sub: '₹1,240 available', icon: '🧡' },
    { id: 'cod', label: 'Pay at Doorstep', sub: 'Cash on service', icon: '🏠' },
];

const BookingType = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get initial values from URL params
    const initialMode = searchParams.get('mode') || 'instant';
    const initialDate = searchParams.get('date') || 'Today';
    const initialSlotTime = searchParams.get('slot_time') || (initialMode === 'instant' ? '20-30 min' : '09:00 AM');
    const serviceType = searchParams.get('type') || 'captain';

    const [mode, setMode] = useState(initialMode);
    const [payMethod, setPayMethod] = useState('upi');
    const [couponApplied, setCouponApplied] = useState(false);

    const basePrice = 299;
    const ecosystemFee = 29;
    const discount = couponApplied ? 60 : 0;
    const total = basePrice + ecosystemFee - discount;

    return (
        <MobileLayout hideNav>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">Checkout</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">Finalize your wash</p>
                    </div>
                </div>
            </header>

            <div className="px-4 pb-36 space-y-4 pt-4">

                {/* ── Wash Summary Card ── */}
                <div className="bg-content rounded-2xl p-4 shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex items-start justify-between">
                        <div className="space-y-3">
                            <div>
                                <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Service</p>
                                <div className="flex items-center gap-2">
                                    <DropletIcon size={14} className="text-brand" fill="currentColor" />
                                    <h3 className="text-white font-black text-sm tracking-tight">Eco Doorstep Wash</h3>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Timing</p>
                                    <div className="flex items-center gap-1.5">
                                        {mode === 'instant' ? <Zap size={12} className="text-brand" fill="currentColor" /> : <Clock size={12} className="text-brand" />}
                                        <p className="text-white font-black text-xs leading-none">
                                            {mode === 'instant' ? 'Instant (20-30m)' : `${initialDate}, ${initialSlotTime}`}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Vehicle</p>
                                    <div className="flex items-center gap-1.5">
                                        <Car size={12} className="text-blue-400" />
                                        <p className="text-white font-black text-xs leading-none">Honda City</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                            <MapPin size={24} className="text-brand" strokeWidth={1.5} />
                        </div>
                    </div>
                    {/* Decorative wash splash */}
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand/10 blur-3xl rounded-full" />
                </div>

                {/* ── Mode Toggle (Quick Switch) ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-1.5 flex gap-1.5">
                    {[
                        { id: 'instant', label: 'Now', icon: <Zap size={13} fill={mode === 'instant' ? 'currentColor' : 'none'} />, sub: '20-30m ETA' },
                        { id: 'scheduled', label: 'Schedule', icon: <Calendar size={13} strokeWidth={2.5} />, sub: 'Pick a slot' },
                    ].map((m) => (
                        <motion.button key={m.id} onClick={() => setMode(m.id)} whileTap={{ scale: 0.97 }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${mode === m.id ? 'bg-brand text-white shadow-md' : 'text-content-muted hover:bg-gray-50'}`}>
                            {m.icon}
                            <div className="text-left">
                                <p className={`font-black text-[10px] uppercase tracking-wider leading-none ${mode === m.id ? 'text-white' : 'text-content'}`}>{m.label}</p>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* ── Coupon ── */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${couponApplied ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 shadow-soft'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${couponApplied ? 'bg-green-500' : 'bg-gray-50'}`}>
                            {couponApplied ? <CheckCircle2 size={16} className="text-white" /> : <Tag size={16} className="text-content-muted" strokeWidth={2.5} />}
                        </div>
                        <div>
                            <p className="font-black text-sm text-content">
                                {couponApplied ? 'HOORAFIRST Applied' : 'Apply Coupon'}
                            </p>
                            <p className={`text-[9px] font-bold ${couponApplied ? 'text-green-700' : 'text-content-subtle'}`}>
                                {couponApplied ? '₹60 discount applied!' : 'HOORAFIRST — 100% cashback'}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setCouponApplied(!couponApplied)}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${couponApplied ? 'text-red-500 bg-red-50' : 'text-brand bg-brand/10'}`}>
                        {couponApplied ? 'Remove' : 'Apply'}
                    </button>
                </div>

                {/* ── Payment Methods ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-black text-sm text-content tracking-tight">Payment Method</h3>
                        <span className="text-[10px] font-bold text-content-subtle flex items-center gap-1"><ShieldCheck size={10} className="text-green-500" /> Secure</span>
                    </div>
                    {PAYMENT_METHODS.map((pm) => (
                        <button key={pm.id} onClick={() => setPayMethod(pm.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-none ${payMethod === pm.id ? 'bg-brand/5' : 'hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-lg border border-gray-100">{pm.icon}</div>
                                <div className="text-left">
                                    <p className="font-black text-sm text-content">{pm.label}</p>
                                    <p className="text-[9px] font-bold text-content-subtle">{pm.sub}</p>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${payMethod === pm.id ? 'border-brand' : 'border-gray-200'}`}>
                                {payMethod === pm.id && <div className="w-2.5 h-2.5 bg-brand rounded-full shadow-sm" />}
                            </div>
                        </button>
                    ))}
                </div>

                {/* ── Bill Summary ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 space-y-2.5">
                    <h3 className="font-black text-sm text-content tracking-tight mb-2">Detailed Bill</h3>
                    {[
                        { label: 'Wash Charge', val: `₹${basePrice}` },
                        { label: 'Ecosystem Fee', val: `₹${ecosystemFee}`, muted: true },
                        ...(couponApplied ? [{ label: 'Discount', val: `-₹${discount}`, credit: true }] : []),
                    ].map((row) => (
                        <div key={row.label} className="flex justify-between items-center text-xs">
                            <span className={`${row.muted ? 'text-content-subtle font-bold' : 'font-black text-content'}`}>{row.label}</span>
                            <span className={`font-black ${row.credit ? 'text-green-600' : 'text-content'}`}>{row.val}</span>
                        </div>
                    ))}
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center mt-2">
                        <span className="font-black text-sm text-content uppercase tracking-widest">To Pay</span>
                        <span className="font-black text-brand text-xl">₹{total}</span>
                    </div>
                </div>

                {/* ── Safety Note ── */}
                <div className="flex items-center gap-2.5 py-2 px-1">
                    <div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={10} className="text-green-600" />
                    </div>
                    <p className="text-[9px] font-bold text-content-subtle leading-normal">Your car is covered by Hoora's ₹5 Lakh Damage Protection Guarantee. <span className="text-brand">Learn More</span></p>
                </div>

            </div>

            {/* ── Sticky Pay Button ── */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-4 pt-4 pb-8 z-50">
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate(`/booking-status?type=${serviceType}`)}
                    className="group w-full h-14 bg-brand text-white rounded-2xl font-black text-base shadow-xl shadow-brand/30 flex items-center justify-between px-6 relative overflow-hidden">
                    <div className="text-left">
                        <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/60 leading-none mb-1">Confirm Wash</span>
                        <span className="tracking-tight">Pay for Booking</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl font-black">₹{total}</span>
                        <div className="bg-white/20 p-1.5 rounded-xl group-hover:bg-white/30 transition-colors">
                            <ArrowRight size={15} strokeWidth={3} />
                        </div>
                    </div>
                    {/* Shine */}
                    <motion.div animate={{ x: ['100%', '-200%'] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                        className="absolute inset-y-0 w-12 bg-white/15 skew-x-12" />
                </motion.button>
            </div>

        </MobileLayout>
    );
};

const DropletIcon = (props) => (
    <div {...props}>
        <Droplets size={props.size || 14} />
    </div>
);

export default BookingType;
