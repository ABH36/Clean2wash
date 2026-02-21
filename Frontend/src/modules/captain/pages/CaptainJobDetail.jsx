import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    MapPin, Phone, MessageSquare, ChevronLeft, CheckCircle2,
    Shield, Car, Clock, Navigation, Camera, ChevronRight
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';

const JOB = {
    id: 'HOORA-8821',
    customer: { name: 'Aman Verma', phone: '+91 98765 43210', avatar: 'AV', rating: 4.8, washes: 12 },
    service: 'Instant Eco Wash',
    vehicle: 'Honda City',
    plate: 'KA 05 MR 7821',
    color: 'Blue',
    address: 'HSR Layout, Sector 2, Bengaluru 560102',
    landmark: 'Near Agara Lake Gate 2',
    amount: '₹473',
    pin: '7182',
};

const STEPS_ORDER = ['En Route', 'Arrived', 'Washing', 'Done'];

const CaptainJobDetail = () => {
    const navigate = useNavigate();
    const [stepIdx, setStepIdx] = useState(0);
    const [showPin, setShowPin] = useState(false);
    const step = STEPS_ORDER[stepIdx];

    const handleNext = () => {
        if (stepIdx < STEPS_ORDER.length - 1) setStepIdx(stepIdx + 1);
        else navigate('/captain');
    };

    const stepConfig = {
        'En Route': { bg: 'bg-blue-500', label: 'Mark as Arrived', cta: 'I\'ve Arrived' },
        'Arrived': { bg: 'bg-amber-500', label: 'Start the Wash', cta: 'Start Washing' },
        'Washing': { bg: 'bg-brand', label: 'In Progress…', cta: 'Mark Complete' },
        'Done': { bg: 'bg-green-500', label: 'Job Complete!', cta: 'Back to Home' },
    };
    const cfg = stepConfig[step];

    return (
        <CaptainLayout hideNav>
            {/* ── Header ── */}
            <header className="bg-content px-4 pt-10 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/captain')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-white" />
                    </button>
                    <div className="flex-1">
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Active Job</p>
                        <h1 className="text-white text-lg font-black tracking-tight leading-none">{JOB.id}</h1>
                    </div>
                    <span className={`text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${cfg.bg}`}>{step}</span>
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-28">

                {/* ── Progress stepper ── */}
                <div className="flex items-center gap-2">
                    {STEPS_ORDER.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${i < stepIdx ? 'bg-green-500 border-green-500' :
                                    i === stepIdx ? `${cfg.bg} border-transparent` :
                                        'bg-white border-gray-100'}`}>
                                {i < stepIdx
                                    ? <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                                    : <span className={`text-[9px] font-black ${i === stepIdx ? 'text-white' : 'text-gray-300'}`}>{i + 1}</span>
                                }
                            </div>
                            {i < STEPS_ORDER.length - 1 && (
                                <div className={`flex-1 h-1 rounded-full transition-all ${i < stepIdx ? 'bg-green-400' : 'bg-gray-100'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* ── Map ── */}
                <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-soft" style={{ height: 180 }}>
                    <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" alt="Map" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-blue-900/20" />
                    <button className="absolute bottom-3 right-3 bg-brand text-white flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">
                        <Navigation size={12} strokeWidth={2.5} /> Navigate
                    </button>
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2">
                        <p className="font-black text-xs text-content">1.4 km · ETA 8 min</p>
                    </div>
                </div>

                {/* ── Address ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft px-4 py-4 flex items-start gap-3">
                    <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin size={16} className="text-brand" fill="currentColor" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="font-black text-sm text-content tracking-tight">{JOB.address}</p>
                        <p className="text-[9px] font-bold text-content-subtle mt-0.5">📍 {JOB.landmark}</p>
                    </div>
                </div>

                {/* ── Customer Card ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-brand/10 rounded-xl flex items-center justify-center">
                                <span className="font-black text-sm text-brand">{JOB.customer.avatar}</span>
                            </div>
                            <div>
                                <p className="font-black text-sm text-content">{JOB.customer.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-bold text-content-subtle">★ {JOB.customer.rating}</span>
                                    <span className="text-[9px] font-bold text-content-subtle">· {JOB.customer.washes} washes</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <a href={`tel:${JOB.customer.phone}`} className="w-9 h-9 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center">
                                <Phone size={15} className="text-green-600" strokeWidth={2.5} />
                            </a>
                            <button className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
                                <MessageSquare size={15} className="text-blue-600" strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                    {/* Security PIN */}
                    <button onClick={() => setShowPin(!showPin)}
                        className="w-full flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-brand" strokeWidth={2.5} />
                            <span className="font-black text-xs text-content uppercase tracking-widest">Security PIN</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`font-black text-lg tracking-[0.3em] text-content transition-all ${showPin ? '' : 'blur-sm'}`}>{JOB.pin}</span>
                            <ChevronRight size={13} strokeWidth={2.5} className={`text-gray-300 transition-transform ${showPin ? 'rotate-90' : ''}`} />
                        </div>
                    </button>
                </div>

                {/* ── Vehicle Info ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft px-4 py-4 flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Car size={20} className="text-blue-600" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-sm text-content">{JOB.vehicle} · <span className="text-content-subtle font-bold">{JOB.color}</span></p>
                        <p className="text-[9px] font-bold text-content-subtle mt-0.5">{JOB.service}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
                        <p className="font-black text-sm tracking-widest text-content">{JOB.plate}</p>
                    </div>
                </div>

                {/* ── Service Checklist (only during Washing) ── */}
                {step === 'Washing' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-content-subtle">Service Checklist</p>
                        {['Pre-wash foam applied', 'Rinse complete', 'Microfibre wipe', 'Tyre dressing', 'Window & mirror clean'].map((item, i) => (
                            <div key={item} className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-green-100 border border-green-200 rounded-md flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 size={12} className="text-green-600" strokeWidth={2.5} />
                                </div>
                                <p className="font-bold text-sm text-content">{item}</p>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ── Photo Upload (Done phase) ── */}
                {step === 'Done' && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="w-full flex items-center gap-3 bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-4 py-4 hover:border-brand/30 transition-colors">
                        <Camera size={20} className="text-content-subtle" />
                        <div className="text-left">
                            <p className="font-black text-sm text-content">Upload Completion Photo</p>
                            <p className="text-[9px] font-bold text-content-subtle">Before & after shot recommended</p>
                        </div>
                    </motion.button>
                )}
            </div>

            {/* ── CTA Footer ── */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 py-4 z-50">
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                        <Clock size={13} className="text-content-subtle" />
                        <span className="text-[10px] font-bold text-content-subtle">Earnings:</span>
                        <span className="font-black text-sm text-green-600">{JOB.amount}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${cfg.bg} text-white`}>{cfg.label}</span>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
                    className={`w-full h-12 ${cfg.bg} text-white rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2`}>
                    {cfg.cta}
                    {stepIdx < STEPS_ORDER.length - 1 && <ChevronRight size={16} strokeWidth={3} />}
                </motion.button>
            </div>
        </CaptainLayout>
    );
};

export default CaptainJobDetail;
