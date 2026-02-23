import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, MapPin, Clock, CheckCircle2, Navigation,
    Star, Phone, MessageSquare, ShieldCheck, Download, RotateCcw
} from 'lucide-react';

const TIMELINE = [
    { status: 'Order Placed', time: '2:28 PM', done: true },
    { status: 'Captain Matched', time: '2:29 PM', done: true },
    { status: 'Captain En Route', time: '2:30 PM', done: true },
    { status: 'Wash In Progress', time: '3:05 PM', done: true },
    { status: 'Completed', time: '3:47 PM', done: true },
];

const OrderDetails = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                            <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                        </button>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-content leading-none">Order Details</h1>
                            <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">#CarWash-7761</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-content-muted text-[9px] font-black uppercase tracking-widest">
                        <Download size={13} strokeWidth={2.5} /> Invoice
                    </button>
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-28">

                {/* ── Service Banner ── */}
                <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-soft" style={{ height: 160 }}>
                    <img src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&q=80"
                        alt="Service" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 p-5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="bg-green-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <CheckCircle2 size={9} strokeWidth={3} /> Completed
                            </span>
                            <span className="bg-white/20 backdrop-blur-sm text-white text-[9px] font-black px-3 py-1 rounded-lg">Feb 19 · 3:47 PM</span>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-black tracking-tight leading-none mb-0.5">Full Deep Clean</h2>
                            <p className="text-white/60 text-[10px] font-bold">Honda City · KA 05 MR 7821</p>
                        </div>
                    </div>
                </div>

                {/* ── Quick Stats ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Amount', value: '₹1,199' },
                        { label: 'Duration', value: '42 min' },
                        { label: 'Rating', value: '4.9 ★' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-soft px-3 py-3.5 text-center">
                            <p className="font-black text-base text-content tracking-tight leading-none">{s.value}</p>
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Location ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft px-4 py-4 flex items-start gap-3">
                    <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin size={16} className="text-brand" fill="currentColor" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-0.5">Service Location</p>
                        <p className="font-black text-sm text-content tracking-tight">HSR Layout, Sector 2</p>
                        <p className="text-[10px] font-bold text-content-subtle mt-0.5">Bengaluru, Karnataka 560102</p>
                    </div>
                </div>

                {/* ── Captain Card ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle">Captain</p>
                    </div>
                    <div className="px-4 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80"
                                    alt="Amit" className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm text-content tracking-tight">Amit Singh</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex items-center gap-1">
                                        <Star size={10} className="text-yellow-500" fill="currentColor" />
                                        <span className="font-black text-[10px] text-content">4.9</span>
                                    </div>
                                    <span className="text-content-subtle text-[9px] font-bold">1,800 washes</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="w-9 h-9 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center">
                                <Phone size={15} className="text-green-600" strokeWidth={2.5} />
                            </button>
                            <button className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
                                <MessageSquare size={15} className="text-blue-600" strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Timeline ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle">Order Timeline</p>
                    </div>
                    <div className="px-4 py-3 space-y-0">
                        {TIMELINE.map((step, i) => (
                            <div key={step.status} className="flex items-start gap-4 py-2.5 relative">
                                {/* Connector */}
                                {i < TIMELINE.length - 1 && (
                                    <div className="absolute left-[17px] top-9 w-px h-4 bg-brand/20" />
                                )}
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border-2 ${step.done ? 'bg-brand border-brand' : 'bg-gray-50 border-gray-100'
                                    }`}>
                                    <CheckCircle2 size={16} className={step.done ? 'text-white' : 'text-gray-300'} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 flex items-center justify-between pt-1.5">
                                    <p className={`font-black text-sm tracking-tight ${step.done ? 'text-content' : 'text-gray-300'}`}>{step.status}</p>
                                    <p className="text-[9px] font-black text-content-subtle">{step.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Bill Breakdown ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 space-y-2.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-1">Payment Summary</p>
                    {[
                        { label: 'Full Deep Clean', val: '₹999', muted: false },
                        { label: 'Ecosystem Fee', val: '₹89', muted: true },
                        { label: 'CarWashFIRST Discount', val: '-₹0', muted: true },
                    ].map(row => (
                        <div key={row.label} className="flex justify-between">
                            <span className={`text-sm ${row.muted ? 'font-bold text-content-subtle' : 'font-black text-content'}`}>{row.label}</span>
                            <span className="font-black text-sm text-content">{row.val}</span>
                        </div>
                    ))}
                    <div className="border-t border-gray-100 pt-2.5 flex justify-between">
                        <span className="font-black text-content">Total Paid</span>
                        <span className="font-black text-brand text-base">₹1,199</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 mt-1">
                        <ShieldCheck size={13} className="text-green-600" />
                        <p className="text-[9px] font-black text-green-700">Paid via GPay · Transaction ID: GPAY7282817</p>
                    </div>
                </div>

            </div>

            {/* ── Sticky Actions ── */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 py-4 flex gap-3 z-50">
                <button className="flex-1 h-12 bg-gray-50 border border-gray-100 rounded-xl text-content-muted font-black text-sm flex items-center justify-center gap-2">
                    <RotateCcw size={15} strokeWidth={2.5} /> Rebook
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/rate')}
                    className="flex-1 h-12 bg-brand rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-brand/25">
                    <Star size={15} fill="white" strokeWidth={1.5} /> Rate Wash
                </motion.button>
            </div>
        </div>
    );
};

export default OrderDetails;
