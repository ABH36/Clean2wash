import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    MapPin, ChevronLeft, Search, Navigation, Home, Briefcase,
    Plus, ChevronRight, Check, Zap, Calendar, Clock,
    ChevronDown
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';

const SAVED = [
    { id: 1, label: 'Home', sub: 'HSR Layout, Sector 2, Bengaluru 560102', icon: <Home size={16} />, color: 'bg-blue-50 text-blue-600' },
    { id: 2, label: 'Office', sub: 'Koramangala 5th Block, Bengaluru 560095', icon: <Briefcase size={16} />, color: 'bg-violet-50 text-violet-600' },
];

const NEARBY = [
    { id: 3, label: 'Forum Mall Parking', sub: '0.3 km · Koramangala' },
    { id: 4, label: 'EGL Tech Park, B Block', sub: '1.1 km · Brookefield' },
    { id: 5, label: 'Nexus Mall Open Lot', sub: '2.0 km · Whitefield' },
    { id: 6, label: 'Salt Lake Society Gate 3', sub: '2.7 km · HSR Layout' },
];

const DATES = [
    { day: 'Today', date: '21 Feb' },
    { day: 'Tomorrow', date: '22 Feb' },
    { day: 'Sun', date: '23 Feb' },
    { day: 'Mon', date: '24 Feb' },
    { day: 'Tue', date: '25 Feb' },
];

const SLOTS = [
    { id: 's1', time: '09:00 AM', label: 'Morning' },
    { id: 's2', time: '11:00 AM', label: 'Morning' },
    { id: 's3', time: '01:00 PM', label: 'Afternoon' },
    { id: 's4', time: '04:00 PM', label: 'Evening' },
    { id: 's5', time: '07:00 PM', label: 'Late Evening' },
];

const MapScreen = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'captain';
    const studioId = searchParams.get('studio');
    const price = searchParams.get('price');

    const [selected, setSelected] = useState(SAVED[0]);
    const [search, setSearch] = useState('');
    const [mode, setMode] = useState('instant'); // 'instant' or 'scheduled'
    const [selectedDate, setSelectedDate] = useState(DATES[0].date);
    const [selectedSlot, setSelectedSlot] = useState('s1');

    return (
        <MobileLayout hideNav>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">Wash Location</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">Where is your vehicle parked?</p>
                    </div>
                </div>
                {/* Search */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    <Search size={16} className="text-content-subtle flex-shrink-0" strokeWidth={2.5} />
                    <input type="text" placeholder="Search area, landmark or address…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm font-bold text-content outline-none placeholder:text-content-subtle placeholder:font-medium" />
                </div>
            </header>

            <div className={`space-y-4 pt-4 px-4 ${mode === 'scheduled' ? 'pb-80' : 'pb-44'}`}>

                {/* ── Map Preview ── */}
                <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-soft" style={{ height: 220 }}>
                    <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80"
                        alt="Map" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-blue-900/20" />

                    {/* Pulsing pin */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10">
                        <div className="relative">
                            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                                <MapPin size={18} className="text-white" fill="white" strokeWidth={1.5} />
                            </div>
                            <div className="w-2 h-2 bg-brand rounded-full mx-auto mt-0.5" />
                            <div className="absolute inset-0 bg-brand/25 rounded-xl animate-ping scale-125" />
                        </div>
                    </div>

                    {/* Current location button */}
                    <button className="absolute bottom-4 right-4 bg-white px-3 py-2 rounded-xl shadow-md border border-gray-100 flex items-center gap-2">
                        <Navigation size={14} className="text-brand" strokeWidth={2.5} />
                        <span className="text-[10px] font-black text-content uppercase tracking-widest">Use Current</span>
                    </button>

                    {/* Selected label */}
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 max-w-[55%] shadow-md">
                        <p className="text-[9px] font-black uppercase tracking-widest text-content-subtle">Selected</p>
                        <p className="text-sm font-black text-content truncate">{selected.label}</p>
                    </div>
                </div>

                {/* ── Saved Addresses ── */}
                <section className="space-y-2">
                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-1">Saved Places</p>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                        {SAVED.map((addr, i) => (
                            <motion.button key={addr.id} whileTap={{ scale: 0.99 }} onClick={() => setSelected(addr)}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 ${i < SAVED.length - 1 ? 'border-b border-gray-50' : ''} transition-colors ${selected.id === addr.id ? 'bg-brand/5' : 'hover:bg-gray-50'}`}>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${addr.color}`}>{addr.icon}</div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="font-black text-sm text-content">{addr.label}</p>
                                    <p className="text-[10px] font-bold text-content-subtle truncate mt-0.5">{addr.sub}</p>
                                </div>
                                {selected.id === addr.id && <Check size={16} className="text-brand flex-shrink-0" strokeWidth={2.5} />}
                            </motion.button>
                        ))}
                        <button onClick={() => navigate('/addresses')}
                            className="w-full flex items-center gap-4 px-4 py-3.5 border-t border-gray-50 hover:bg-gray-50 transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0">
                                <Plus size={16} className="text-content-subtle" strokeWidth={2.5} />
                            </div>
                            <p className="font-black text-sm text-content-subtle">Add New Address</p>
                        </button>
                    </div>
                </section>

                {/* ── Nearby Locations ── */}
                <section className="space-y-2">
                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-1">Nearby</p>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                        {NEARBY.map((loc, i) => (
                            <motion.button key={loc.id} whileTap={{ scale: 0.99 }} onClick={() => setSelected(loc)}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 ${i < NEARBY.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50 transition-colors`}>
                                <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                                    <MapPin size={16} className="text-content-subtle" strokeWidth={2} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-sm text-content">{loc.label}</p>
                                    <p className="text-[10px] font-bold text-content-subtle mt-0.5">{loc.sub}</p>
                                </div>
                                <ChevronRight size={13} strokeWidth={2.5} className="text-gray-300" />
                            </motion.button>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── Sticky Footer with Schedule Options ── */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-3xl overflow-hidden">

                {/* Mode Selector */}
                <div className="px-4 pt-4">
                    <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
                        <button onClick={() => setMode('instant')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${mode === 'instant' ? 'bg-white text-brand shadow-sm' : 'text-content-muted'}`}>
                            <Zap size={13} fill={mode === 'instant' ? 'currentColor' : 'none'} strokeWidth={2.5} />
                            <span className="font-black text-[9px] uppercase tracking-wider">Instant Wash</span>
                        </button>
                        <button onClick={() => setMode('scheduled')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${mode === 'scheduled' ? 'bg-white text-brand shadow-sm' : 'text-content-muted'}`}>
                            <Calendar size={13} strokeWidth={2.5} />
                            <span className="font-black text-[9px] uppercase tracking-wider">Schedule Later</span>
                        </button>
                    </div>
                </div>

                {/* Expanded Schedule Options */}
                <AnimatePresence>
                    {mode === 'scheduled' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="px-4 pt-4 space-y-4">

                            {/* Date Picker */}
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-2">Select Date</p>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {DATES.map(d => (
                                        <button key={d.date} onClick={() => setSelectedDate(d.date)}
                                            className={`flex-shrink-0 min-w-[64px] flex flex-col items-center py-2.5 rounded-2xl border transition-all ${selectedDate === d.date ? 'bg-brand border-brand shadow-md text-white' : 'bg-gray-50 border-gray-100'}`}>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${selectedDate === d.date ? 'text-white/70' : 'text-content-subtle'}`}>{d.day}</span>
                                            <span className="text-sm font-black tracking-tight">{d.date.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Slot Picker */}
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-2">Available Slots</p>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {SLOTS.map(s => (
                                        <button key={s.id} onClick={() => setSelectedSlot(s.id)}
                                            className={`flex-shrink-0 px-4 py-2.5 rounded-2xl border flex flex-col items-center transition-all ${selectedSlot === s.id ? 'bg-content border-content text-white' : 'bg-gray-50 border-gray-100 text-content-muted'}`}>
                                            <span className="text-sm font-black tracking-tight">{s.time}</span>
                                            <span className={`text-[8px] font-bold uppercase tracking-widest ${selectedSlot === s.id ? 'text-white/50' : 'text-content-subtle'}`}>{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Final Confirm Row */}
                <div className="px-4 py-5 flex items-center justify-between gap-4 border-t border-gray-50 mt-2 bg-white">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-5 h-5 bg-brand/10 rounded-lg flex items-center justify-center">
                                {mode === 'instant' ? <Zap size={10} className="text-brand" fill="currentColor" /> : <Clock size={10} className="text-brand" strokeWidth={3} />}
                            </div>
                            <p className="font-black text-[10px] text-content leading-none">
                                {mode === 'instant' ? 'Instant Wash' : `${selectedDate}, ${SLOTS.find(s => s.id === selectedSlot).time}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin size={10} className="text-content-subtle" />
                            <p className="text-[9px] font-bold text-content-subtle truncate">{selected.label}</p>
                        </div>
                    </div>

                    <motion.button whileTap={{ scale: 0.96 }}
                        onClick={() => navigate(`/booking-type?mode=${mode}&date=${selectedDate}&slot=${selectedSlot}&type=${type}${studioId ? `&studio=${studioId}` : ''}${price ? `&price=${price}` : ''}`)}
                        className="bg-brand text-white px-7 h-12 rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-brand/25 flex items-center gap-2 group">
                        Next
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" strokeWidth={3} />
                    </motion.button>
                </div>
            </div>
        </MobileLayout>
    );
};

export default MapScreen;
