import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft, MapPin, Phone, MessageSquare, Truck,
    ShieldCheck, CheckCircle2, Navigation2, Clock,
    Camera, AlertCircle, ArrowUpRight, Search, User,
    Package, X, Lock
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { staffAPI } from '../../../utils/staffApi';

const PinModal = ({ isOpen, onConfirm, onCancel, title, isDarkMode }) => {
    const [pin, setPin] = useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}
            />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                className={`relative w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-gray-100'}`}
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center text-brand mb-2">
                        <Lock size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-black italic uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{title}</h3>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Enter 4-digit security code</p>
                    </div>
                    
                    <input
                        type="tel" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className={`w-full h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 transition-all outline-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand' : 'bg-gray-50 border-gray-100 text-content focus:border-brand'}`}
                        placeholder="••••" autoFocus
                    />

                    <div className="flex gap-3 w-full pt-4">
                        <button onClick={onCancel} className={`flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-content-muted'}`}>Cancel</button>
                        <button onClick={() => onConfirm(pin)} disabled={pin.length < 4} className="flex-1 h-14 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 disabled:opacity-50">Verify</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const TaskDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { isDarkMode } = useTheme();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [staffStep, setStaffStep] = useState(0);
    const [photos, setPhotos] = useState([]);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const res = await staffAPI.getTaskById(id);
                if (res.status === 'success') {
                    setTask(res.data.task);
                    if (res.data.task.status === 'en_route') setStaffStep(0);
                    if (['arrived', 'before_photo'].includes(res.data.task.status)) setStaffStep(1);
                    if (['at-studio', 'in_progress', 'quality-check'].includes(res.data.task.status)) setStaffStep(2);
                    if (res.data.task.status === 'ready-for-delivery') setStaffStep(3);
                    if (res.data.task.status === 'completed') setStaffStep(4);
                }
            } catch (err) {
                console.error('Failed to load task', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [id]);

    const handleUpdateStatus = async (status, pin = null) => {
        try {
            setIsSubmitting(true);
            const payload = { status };
            if (pin) payload.pin = pin;
            if (photos.length > 0) payload.photos = photos;

            const res = await staffAPI.updateTaskStatus(id, payload);
            if (res.status === 'success') {
                setTask(res.data.task);
                return true;
            }
        } catch (err) {
            alert(err.message || 'Operation failed');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleActionClick = (nextStatus) => {
        if (nextStatus === 'arrived' || nextStatus === 'completed') {
            setPendingStatus(nextStatus);
            setShowPinModal(true);
        } else {
            handleUpdateStatus(nextStatus);
        }
    };

    const handlePinConfirm = async (pin) => {
        const success = await handleUpdateStatus(pendingStatus, pin);
        if (success) {
            setShowPinModal(false);
            if (pendingStatus === 'completed') navigate('/staff');
        }
    };

    const capturePhoto = () => {
        if (photos.length >= 2) return;
        setPhotos([...photos, `proof_${Date.now()}`]);
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#FAFBFF]'}`}>
                <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
            </div>
        );
    }

    const taskData = task || {
        _id: id,
        consumer: { name: 'Guest', phone: '--', profile: { address: {} } },
        service: { name: 'Unknown Service' },
        vehicle: { brand: 'Unknown', model: '', plate: '--' },
        status: 'pending'
    };

    const isDelivery = ['quality-check', 'delivery-assigned', 'completed'].includes(taskData.status);
    const currentPhase = isDelivery ? 'Delivery' : 'Pickup';

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#FAFBFF]'} pb-32 transition-colors duration-500`}>
            {/* Header */}
            <header className={`${isDarkMode ? 'bg-[#0F172A]/80 border-white/5' : 'bg-white/80 border-gray-100'} backdrop-blur-xl px-5 pt-10 pb-4 border-b flex items-center justify-between sticky top-0 z-50 transition-all`}>
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-gray-100 text-content shadow-sm'}`}
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                    <p className={`text-[8px] font-black uppercase tracking-[0.25em] leading-none mb-1 ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>Elite Task</p>
                    <h1 className={`text-base font-black italic leading-none tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>{String(taskData._id).substring(0, 8)}</h1>
                </div>
                <div className="w-10" />
            </header>

            {/* Map Placeholder */}
            <div className="h-48 bg-slate-900 relative">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80')] bg-cover bg-center opacity-30 grayscale" />
                 <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                 <div className="absolute inset-0 flex items-center justify-center">
                     <Navigation2 size={32} className="text-brand animate-pulse" />
                 </div>
            </div>

            <div className="px-5 -mt-6 relative z-10 space-y-4">
                {/* Protocol Card */}
                <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} rounded-[2rem] p-6 border transition-all shadow-2xl`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center text-brand">
                            {isDelivery ? <Package size={22} /> : <Truck size={22} />}
                        </div>
                        <div>
                            <h3 className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>{currentPhase} Operation</h3>
                            <p className={`text-sm font-black italic uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>{taskData.service?.name}</p>
                        </div>
                    </div>
                </div>

                {/* Consumer Node */}
                <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} rounded-[2rem] p-6 border transition-all`}>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center font-black italic text-content-subtle">
                                {taskData.consumer?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h2 className={`text-lg font-black italic leading-none ${isDarkMode ? 'text-white' : 'text-content'}`}>{taskData.consumer?.name || 'Customer'}</h2>
                                <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{taskData.consumer?.phone}</p>
                            </div>
                        </div>
                        <a href={`tel:${taskData.consumer?.phone}`} className="w-10 h-10 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center text-brand">
                            <Phone size={18} fill="currentColor" />
                        </a>
                    </div>
                    <div className="flex items-start gap-2 pt-4 border-t border-gray-50 mt-2">
                        <MapPin size={16} className="text-brand shrink-0" />
                        <p className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-white/50' : 'text-content-subtle'}`}>{taskData.consumer?.profile?.address?.street || 'Pick-up location provided'}</p>
                    </div>
                </div>

                {/* Proof Node */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-3">
                        <h4 className={`text-[9px] font-black uppercase tracking-widest italic ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Elite Proof Collection</h4>
                        <span className="text-[8px] font-black uppercase text-brand">{photos.length}/2</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2].map(i => (
                            <button key={i} onClick={capturePhoto} className={`h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${photos.length >= i ? 'bg-brand/5 border-brand/30 text-brand' : 'bg-white border-gray-100 text-gray-300'}`}>
                                {photos.length >= i ? <CheckCircle2 size={24} /> : <Camera size={24} />}
                                <span className="text-[7px] font-black uppercase italic tracking-tighter">Proof_{i}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Terminal */}
            <div className={`fixed bottom-0 left-0 right-0 p-5 backdrop-blur-3xl border-t z-50 transition-all ${isDarkMode ? 'bg-[#0F172A]/90 border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' : 'bg-white/90 border-gray-100 shadow-soft'}`}>
                {taskData.status === 'pickup-assigned' && (
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleUpdateStatus('en_route')} className="w-full h-14 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                        Start Pickup <Truck size={18} />
                    </motion.button>
                )}
                {taskData.status === 'en_route' && (
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleActionClick('arrived')} className="w-full h-14 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                        Verify Arrival <Lock size={18} />
                    </motion.button>
                )}
                {taskData.status === 'arrived' && (
                    <motion.button whileTap={{ scale: 0.98 }} disabled={photos.length < 2 && !isDelivery} onClick={() => handleUpdateStatus('at-studio')} className="w-full h-14 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50">
                        Handover to Hub <CheckCircle2 size={18} />
                    </motion.button>
                )}
                {taskData.status === 'ready-for-delivery' && (
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleUpdateStatus('en_route')} className="w-full h-14 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                        Start Delivery <Package size={18} />
                    </motion.button>
                )}
                {taskData.status === 'quality-check' && (
                    <div className="text-center p-4">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Studio Audit in progress...</p>
                    </div>
                )}
                {['at-studio', 'in_progress'].includes(taskData.status) && (
                    <div className="text-center p-4">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Studio processing vehicle...</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showPinModal && (
                    <PinModal 
                        isOpen={showPinModal} 
                        title={pendingStatus === 'completed' ? 'Final Handover' : 'Pickup Verification'}
                        onConfirm={handlePinConfirm}
                        onCancel={() => setShowPinModal(false)}
                        isDarkMode={isDarkMode}
                    />
                )}
            </AnimatePresence>

            {isSubmitting && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[200] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

export default TaskDetails;
