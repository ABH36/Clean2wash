import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Package,
    MapPin,
    Phone,
    Clock,
    ShieldCheck,
    Navigation,
    CheckCircle2,
    Loader2,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staffAPI } from '../../../utils/staffApi';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';

const StaffProductTaskDetail = () => {
    const { orderId, itemId } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState(null);
    const [pin, setPin] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchTaskDetails = useCallback(async () => {
        try {
            // We fetch all tasks and find the specific one
            const res = await staffAPI.getTasks();
            if (res.status === 'success') {
                const foundTask = res.data.productTasks?.find(t => t._id === itemId);
                if (foundTask) {
                    setTask(foundTask);
                } else {
                    toast.error('Task not found');
                    navigate('/staff/dashboard');
                }
            }
        } catch (err) {
            toast.error('Failed to load mission data');
        } finally {
            setLoading(false);
        }
    }, [itemId, navigate]);

    useEffect(() => {
        fetchTaskDetails();
    }, [fetchTaskDetails]);

    const handleUpdateStatus = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            const res = await staffAPI.updateProductItemStatus(orderId, itemId, newStatus);
            if (res.status === 'success') {
                toast.success(`Protocol Updated: ${newStatus.toUpperCase()}`);
                setTask(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            toast.error(err.message || 'Transmission Failure');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleVerifyPin = async () => {
        if (pin.length !== 4) return toast.error('Enter 4-digit security PIN');

        setIsVerifying(true);
        try {
            const res = await staffAPI.verifyProductItemPin(orderId, itemId, pin);
            if (res.status === 'success') {
                toast.success('Handover Verified 🛡️');
                navigate('/staff/dashboard');
            }
        } catch (err) {
            toast.error(err.message || 'Invalid Security PIN');
        } finally {
            setIsVerifying(false);
        }
    };

    if (loading) return (
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
            <Loader2 className="animate-spin text-brand" size={40} />
        </div>
    );

    if (!task) return null;

    return (
        <div className={`min-h-screen pb-24 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 px-6 py-5">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                        <ChevronLeft size={20} className="text-content dark:text-white" />
                    </button>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">Operation ID</p>
                        <h1 className="text-sm font-black text-content dark:text-white uppercase">#{task.orderNumber?.slice(-8)}</h1>
                    </div>
                    <div className="w-10" />
                </div>
            </div>

            <div className="px-6 pt-6 space-y-6">
                {/* Product Card */}
                <div className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] p-6 border border-gray-100 dark:border-white/5 shadow-soft">
                    <div className="flex gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                            <Package size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">Package Content</p>
                            <h2 className="text-xl font-black text-content dark:text-white uppercase leading-none">{task.product?.name}</h2>
                            <p className="text-[10px] font-bold text-content-subtle mt-1">Quantity: {task.quantity} Units</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4">
                            <p className="text-[8px] font-black text-content-subtle dark:text-white/20 uppercase tracking-widest mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                <span className="text-[10px] font-black text-content dark:text-white uppercase">{task.status}</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4">
                            <p className="text-[8px] font-black text-content-subtle dark:text-white/20 uppercase tracking-widest mb-1">Dispatched</p>
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-brand" />
                                <span className="text-[10px] font-black text-content dark:text-white uppercase">Recently</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Consumer Details */}
                <div className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] p-6 border border-gray-100 dark:border-white/5 shadow-soft">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black text-content-subtle dark:text-white/20 uppercase tracking-widest">Target Destination</h3>
                        <div className="flex items-center gap-1 bg-brand/10 px-2 py-0.5 rounded-lg">
                            <span className="text-[8px] font-black text-brand uppercase">Consumer</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.consumer?._id}`} alt="Consumer" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-base font-black text-content dark:text-white uppercase leading-none mb-1">{task.consumer?.name}</h4>
                            <p className="text-[10px] font-bold text-content-subtle">{task.consumer?.phone}</p>
                        </div>
                        <a href={`tel:${task.consumer?.phone}`} className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
                            <Phone size={20} />
                        </a>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-start gap-3">
                                <MapPin size={16} className="text-brand shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[8px] font-black text-content-subtle dark:text-white/20 uppercase tracking-widest mb-1">Address</p>
                                    <p className="text-xs font-bold text-content dark:text-white/80 leading-tight">
                                        {task.shippingAddress?.addressLine}, {task.shippingAddress?.city}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${task.shippingAddress?.lat},${task.shippingAddress?.lng}`)}
                            className="w-14 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 active:scale-95 transition-transform"
                        >
                            <Navigation size={22} />
                        </button>
                    </div>
                </div>

                {/* Handover Section */}
                {task.status === 'arrived' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-brand rounded-[2.8rem] p-8 text-white shadow-xl shadow-brand/30 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldCheck size={100} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                                    <ShieldCheck size={22} />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-widest">Handover Protocol</h3>
                            </div>

                            <p className="text-xs font-bold text-white/80 mb-6 leading-relaxed">
                                Enter the 4-digit security PIN provided by the consumer to finalize this mission.
                            </p>

                            <div className="flex gap-3 mb-8">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className="flex-1 h-16 bg-white/10 border-2 border-white/20 rounded-2xl flex items-center justify-center">
                                        {pin[i] ? (
                                            <span className="text-2xl font-black tabular-nums">{pin[i]}</span>
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-white/30" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Num Pad Mockup or simple Input */}
                            <input
                                type="tel"
                                maxLength="4"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                className="absolute inset-0 opacity-0 cursor-default"
                                autoFocus
                            />

                            <button
                                onClick={handleVerifyPin}
                                disabled={isVerifying || pin.length !== 4}
                                className="w-full h-16 bg-white text-brand rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-white/90"
                            >
                                {isVerifying ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <>
                                        Verify Handover
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        <button
                            onClick={() => handleUpdateStatus('arrived')}
                            disabled={updatingStatus}
                            className={`w-full h-18 rounded-3xl flex items-center justify-center gap-3 font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? 'bg-white text-brand' : 'bg-brand text-white'
                                }`}
                        >
                            {updatingStatus ? <Loader2 className="animate-spin" /> : (
                                <>
                                    Arrived at Location
                                    <CheckCircle2 size={20} />
                                </>
                            )}
                        </button>
                        <p className="text-center text-[10px] font-bold text-content-subtle uppercase tracking-widest">
                            Update your status once you reach the destination
                        </p>
                    </div>
                )}
            </div>

            {/* Help / Issue Section */}
            <div className="px-6 mt-8 mb-12">
                <button className={`w-full p-6 rounded-[2.5rem] border border-dashed flex items-center justify-center gap-3 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
                    }`}>
                    <AlertCircle size={18} className="text-red-500" />
                    <span className={`text-xs font-black uppercase ${isDarkMode ? 'text-white/60' : 'text-content-subtle'}`}>Report Delivery Issue</span>
                </button>
            </div>
        </div>
    );
};

export default StaffProductTaskDetail;
