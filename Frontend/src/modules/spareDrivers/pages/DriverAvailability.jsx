import React, { useEffect, useState } from 'react';
import { 
    Calendar, Clock, Plus, Trash2, 
    ChevronLeft, Save, Loader2, Info, 
    CheckCircle2, AlertCircle, CalendarDays,
    Settings, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import DriverLayout from '../components/DriverLayout';

const DriverAvailability = () => {
    const navigate = useNavigate();
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // New slot form state
    const [newSlot, setNewSlot] = useState({
        date: new Date().toISOString().split('T')[0],
        start: '09:00',
        end: '18:00'
    });

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const res = await spareDriverAPI.getDutyStats();
                if (res.status === 'success') {
                    // Process backend slots to match frontend state
                    const backendSlots = res.data.availabilitySlots || [];
                    const formattedSlots = backendSlots.map(s => ({
                        id: s._id || Math.random().toString(36).substr(2, 9),
                        date: new Date(s.date).toISOString().split('T')[0],
                        start: s.timeSlots?.[0]?.start || '09:00',
                        end: s.timeSlots?.[0]?.end || '18:00',
                        isBooked: s.timeSlots?.[0]?.isBooked || false
                    }));
                    setSlots(formattedSlots);
                }
            } catch (error) {
                console.error('Failed to fetch availability:', error);
                toast.error('Could not load shift data');
            } finally {
                setLoading(false);
            }
        };
        fetchAvailability();
    }, []);

    const handleAddSlot = () => {
        // Basic validation
        if (newSlot.start >= newSlot.end) {
            toast.error('End time must be after start time');
            return;
        }

        const newId = Math.random().toString(36).substr(2, 9);
        setSlots([...slots, { ...newSlot, id: newId, isBooked: false }]);
        toast.success('Shift added to planner');
    };

    const handleRemoveSlot = (id) => {
        setSlots(slots.filter(s => s.id !== id));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Group slots by date as backend expects
            const grouped = slots.reduce((acc, slot) => {
                const existing = acc.find(a => a.date === slot.date);
                if (existing) {
                    existing.timeSlots.push({ start: slot.start, end: slot.end });
                } else {
                    acc.push({
                        date: slot.date,
                        timeSlots: [{ start: slot.start, end: slot.end }],
                        isAvailable: true
                    });
                }
                return acc;
            }, []);

            await spareDriverAPI.updateAvailability(grouped);
            toast.success('Shift schedule synchronized');
            navigate('/spare-driver/profile');
        } catch (error) {
            toast.error('Failed to sync schedule');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DriverLayout title="Shift Planner">
                <div className="flex h-[60vh] items-center justify-center font-black text-white/20 uppercase tracking-[0.4em] animate-pulse">
                    Syncing Schedule...
                </div>
            </DriverLayout>
        );
    }

    return (
        <DriverLayout title="Shift Planner">
            <div className="px-4 py-4 space-y-6 pb-28">
                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-surface border border-content/5 flex items-center justify-center text-content/60"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-content uppercase tracking-tight">Availability</h1>
                            <p className="text-[9px] font-black text-content/30 uppercase tracking-widest font-mono">Future Shift Planning</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="h-11 px-6 bg-brand text-white rounded-xl flex items-center gap-2 shadow-lg shadow-brand/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">Sync</span>
                    </button>
                </div>

                {/* ── New Shift Form ── */}
                <div className="bg-surface border border-content/[0.04] rounded-[2.5rem] p-6 space-y-5 shadow-sm">
                    <div className="flex items-center gap-2 px-1">
                        <Calendar size={14} className="text-brand" />
                        <h3 className="text-[10px] font-black text-content uppercase tracking-widest">Plan New Shift</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-content/30 uppercase tracking-widest px-1">Date</label>
                            <input 
                                type="date" 
                                value={newSlot.date}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                                className="w-full h-12 bg-content/[0.02] border border-content/[0.05] rounded-2xl px-4 text-xs font-bold outline-none focus:border-brand"
                            />
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[8px] font-black text-content/30 uppercase tracking-widest px-1">Start Time</label>
                                <input 
                                    type="time" 
                                    value={newSlot.start}
                                    onChange={(e) => setNewSlot({...newSlot, start: e.target.value})}
                                    className="w-full h-12 bg-content/[0.02] border border-content/[0.05] rounded-2xl px-4 text-xs font-bold outline-none focus:border-brand"
                                />
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[8px] font-black text-content/30 uppercase tracking-widest px-1">End Time</label>
                                <input 
                                    type="time" 
                                    value={newSlot.end}
                                    onChange={(e) => setNewSlot({...newSlot, end: e.target.value})}
                                    className="w-full h-12 bg-content/[0.02] border border-content/[0.05] rounded-2xl px-4 text-xs font-bold outline-none focus:border-brand"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleAddSlot}
                            className="w-full h-12 bg-black text-white rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                        >
                            <Plus size={16} className="text-brand" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Add to Schedule</span>
                        </button>
                    </div>
                </div>

                {/* ── Active Planner ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-content/30" />
                            <h3 className="text-[10px] font-black text-content/40 uppercase tracking-widest">Planned Shifts</h3>
                        </div>
                        <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-full">{slots.length} Slots</span>
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {slots.length > 0 ? (
                                slots.sort((a,b) => new Date(a.date) - new Date(b.date)).map((slot) => (
                                    <motion.div 
                                        key={slot.id}
                                        layout
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className="bg-surface border border-content/[0.04] p-4 rounded-[1.5rem] flex items-center justify-between shadow-sm"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-content/[0.02] flex flex-col items-center justify-center border border-content/[0.05]">
                                                <span className="text-[8px] font-black text-brand uppercase leading-none mb-0.5">
                                                    {new Date(slot.date).toLocaleDateString('en-IN', { month: 'short' })}
                                                </span>
                                                <span className="text-[14px] font-black text-content leading-none">
                                                    {new Date(slot.date).getDate()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <p className="text-[12px] font-black text-content uppercase tracking-tight">
                                                        {slot.start} — {slot.end}
                                                    </p>
                                                    {slot.isBooked && (
                                                        <span className="text-[7px] font-black bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full uppercase tracking-widest">Booked</span>
                                                    )}
                                                </div>
                                                <p className="text-[8px] font-black text-content/30 uppercase tracking-widest">
                                                    {new Date(slot.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {!slot.isBooked && (
                                            <button 
                                                onClick={() => handleRemoveSlot(slot.id)}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-20">
                                    <CalendarDays size={48} className="mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No shifts planned</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Help/Info ── */}
                <div className="bg-content/[0.02] border border-content/5 p-5 rounded-[2rem] flex gap-4">
                    <Info size={18} className="text-content/30 flex-shrink-0" />
                    <p className="text-[9px] font-bold text-content/40 leading-relaxed uppercase tracking-wide">
                        The matching algorithm prioritizes drivers who have pre-planned shifts. 
                        Once a shift is booked, it cannot be removed from the planner.
                    </p>
                </div>
            </div>
        </DriverLayout>
    );
};

export default DriverAvailability;
