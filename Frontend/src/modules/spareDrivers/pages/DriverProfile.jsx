import React, { useEffect, useState, useRef } from 'react';
import {
    User, Mail, Phone, MapPin,
    ShieldCheck, LogOut, ChevronRight,
    CreditCard, Camera,
    Loader2, Trophy, ShieldAlert,
    CheckCircle2, Edit2, Save, X,
    TrendingUp, Clock, Star, Target,
    Zap, Activity, DollarSign, Lock,
    Unlock, Calendar, BarChart3, Award, Wallet, Package
} from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const normalizeStatus = (value) => String(value || '').toLowerCase();
const hasKitPurchaseCompleted = (driverData = {}) => (
    String(driverData?.kitStatus || '').toUpperCase() === 'COMPLETED'
    || ['verified', 'under_review'].includes(normalizeStatus(driverData?.kit?.paymentStatus))
);
const canInitiateKitPurchase = (driverData = {}) => {
    const status = normalizeStatus(driverData?.status);
    const kitPaymentStatus = normalizeStatus(driverData?.kit?.paymentStatus);
    if (hasKitPurchaseCompleted(driverData)) return false;
    if (kitPaymentStatus === 'under_review') return false;
    return ['verified_pending_kit', 'kit_payment_pending', 'active'].includes(status);
};

const DriverProfile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchProfile = async () => {
        try {
            const res = await spareDriverAPI.getProfile();
            const driverData = res?.data?.driver || null;
            setDriver(driverData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleLogout = () => {
        spareDriverAPI.clearToken();
        navigate('/login');
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('selfie', file);

        try {
            await spareDriverAPI.updateProfilePicture(formData);
            toast.success('Profile image synchronized');
            fetchProfile();
        } catch (error) {
            toast.error(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <DriverLayout title="Profile">
                <div className="flex h-[60vh] items-center justify-center font-black text-white/30 uppercase tracking-[0.4em] animate-pulse">
                    Scanning profile...
                </div>
            </DriverLayout>
        );
    }

    const isPremium = driver?.verification?.policeStatus === 'approved';
    const isPvrPending = driver?.verification?.policeStatus === 'pending';
    const fullAddress = driver?.address?.street
        ? `${driver.address.street}, ${driver.address.city}, ${driver.address.pincode}`
        : 'Operational base not set';

    return (
        <DriverLayout title="Profile">
            <div className="px-4 py-4 space-y-4 pb-28 min-h-screen">
                {/* ── Compact Profile Header ── */}
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-surface border border-content/[0.04] rounded-[2rem] p-5 shadow-sm relative overflow-hidden transition-all duration-300">
                    <div className="flex items-center gap-4 relative z-10">
                        <div
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className="w-16 h-16 rounded-[1.2rem] bg-brand/10 border border-brand/20 flex items-center justify-center text-brand relative overflow-hidden cursor-pointer"
                        >
                            {uploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                    <Loader2 className="animate-spin text-brand" size={20} />
                                </div>
                            )}
                            {driver?.documents?.selfie?.url ? (
                                <img src={driver.documents.selfie.url} alt="Profile" className="w-full h-full object-cover grayscale" />
                            ) : (
                                <User size={28} />
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-content tracking-tight">{driver?.name}</h2>
                                {isPremium && <ShieldCheck size={16} className="text-brand" />}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-green-500' : 'bg-brand animate-pulse'}`} />
                                <p className="text-[10px] font-black text-content/40 uppercase tracking-widest font-mono">{driver?.driverId || `ID: CW-SD-${driver?._id?.slice(-6)}`}</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/spare-driver/profile/edit')} className="w-10 h-10 rounded-full bg-content/[0.03] flex items-center justify-center text-content/60 hover:text-brand transition-colors border border-content/[0.02]">
                            <Edit2 size={16} />
                        </button>
                    </div>
                </motion.div>

                {/* ── Compact Metrics ── */}
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-2">
                    {[
                        { label: 'Rating', value: driver?.reliabilityScore?.metrics?.avgRating?.toFixed(1) || '5.0', icon: Star, color: 'text-brand' },
                        { label: 'Rely %', value: driver?.reliabilityScore?.score || 100, icon: Trophy, color: 'text-blue-500' },
                        { label: 'Accept', value: `${driver?.reliabilityScore?.metrics?.acceptanceRate || 100}%`, icon: Target, color: 'text-green-500' },
                        { label: 'Trips', value: driver?.reliabilityScore?.metrics?.totalTrips || 0, icon: Activity, color: 'text-purple-500' }
                    ].map((m, i) => (
                        <div key={i} className="bg-surface border border-content/[0.04] p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                            <m.icon size={14} className={`${m.color} mb-1.5`} />
                            <p className="text-[12px] font-black text-content leading-none mb-1">{m.value}</p>
                            <p className="text-[7px] font-black text-content/30 uppercase tracking-[0.1em]">{m.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* ── Status Banner ── */}
                {!isPremium && !isPvrPending && (
                    <motion.button 
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                        onClick={() => navigate('/spare-driver/premium')}
                        className="w-full bg-brand/10 border border-brand/20 rounded-[1.5rem] p-4 flex items-center justify-between active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand"><ShieldCheck size={14} /></div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand/20 pb-0.5 inline-block">Standard Account</p>
                                <p className="text-[11px] font-bold text-content/60 mt-0.5">Upgrade to Elite to unlock priority missions</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-brand opacity-60" />
                    </motion.button>
                )}

                {/* ── Kit Purchase Promotion (High Visibility) ── */}
                {canInitiateKitPurchase(driver) && (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        onClick={() => navigate('/spare-driver/kit-purchase')}
                        className={`p-5 rounded-[2rem] border flex items-center gap-4 cursor-pointer shadow-2xl transition-all active:scale-[0.98] bg-brand/10 border-brand/20 shadow-brand/5`}
                    >
                        <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 bg-brand text-white shadow-lg shadow-brand/20`}>
                            <Package size={24} fill="currentColor" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-brand uppercase tracking-widest leading-none mb-1">Mandatory Protocol</p>
                            <h4 className={`text-sm font-black tracking-tight text-content`}>Starter Driver Kit</h4>
                            <p className={`text-[9px] font-bold mt-1 text-content/40 uppercase leading-tight`}>Complete activation to unlock full operational dashboard and premium missions.</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                             <ChevronRight size={18} className="text-brand" strokeWidth={3} />
                             <span className="text-[8px] font-black text-brand uppercase">Buy Now</span>
                        </div>
                    </motion.div>
                )}

                {/* ── Operational Menu ── */}
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-surface border border-content/[0.04] rounded-[2rem] overflow-hidden shadow-sm">
                    {[
                        { title: 'Wallet & Earnings', subtitle: `₹${(driver?.wallet?.balance || 0).toLocaleString()} Yield`, icon: Wallet, action: () => navigate('/spare-driver/wallet') },
                        { title: 'Trip History', subtitle: `${driver?.reliabilityScore?.metrics?.completedTrips || 0} completed trips`, icon: Clock, action: () => navigate('/spare-driver/trip-history') },
                        { title: 'Duty Dashboard', subtitle: `${((driver?.dutyHours?.today?.totalMinutes || 0)/60).toFixed(1)}h logged today`, icon: Clock, action: () => navigate('/spare-driver/duty-dashboard') },
                        { title: 'Service Portfolio', subtitle: `${driver?.allowedServices?.filter(s => s.isActive).length || 0} active protocols`, icon: Zap, action: () => navigate('/spare-driver/service-portfolio') },
                        { title: 'Shift Planner', subtitle: `${driver?.availabilitySlots?.length || 0} future shifts`, icon: Calendar, action: () => navigate('/spare-driver/availability') },
                        { title: 'Base Sector', subtitle: fullAddress.substring(0, 30) + '...', icon: MapPin, action: () => navigate('/spare-driver/address') }
                    ].map((item, index) => (
                        <button key={index} onClick={item.action} className="w-full p-4 flex items-center justify-between border-b border-content/[0.02] last:border-0 hover:bg-content/[0.01] active:bg-content/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-content/[0.02] border border-content/[0.02] flex items-center justify-center text-content/40">
                                    <item.icon size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[12px] font-black text-content uppercase tracking-tight">{item.title}</p>
                                    <p className="text-[9px] font-black text-content/40 uppercase tracking-widest mt-0.5">{item.subtitle}</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-content/20" />
                        </button>
                    ))}
                </motion.div>

                {/* ── Performance & Trust ── */}
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="space-y-2 pt-2">
                    <p className="text-[9px] font-black text-content/30 uppercase tracking-[0.2em] px-3">Performance & Metrics</p>
                    <div className="bg-surface border border-content/[0.04] rounded-[2rem] overflow-hidden shadow-sm">
                        {[
                            { title: 'Reliability Hub', subtitle: `${driver?.reliabilityScore?.score || 100}% Operational Index`, icon: Target, action: () => navigate('/spare-driver/reliability'), color: 'text-brand' },
                            { title: 'Premium Badge', subtitle: driver?.isPremium ? 'Active Protocol' : 'Upgrade Available', icon: ShieldCheck, action: () => navigate('/spare-driver/premium'), color: 'text-blue-500' }
                        ].map((item, index) => (
                            <button key={index} onClick={item.action} className="w-full p-4 flex items-center justify-between border-b border-content/[0.02] last:border-0 hover:bg-content/[0.01] active:bg-content/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl bg-content/[0.02] border border-content/[0.02] flex items-center justify-center ${item.color}`}>
                                        <item.icon size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[12px] font-black text-content uppercase tracking-tight">{item.title}</p>
                                        <p className="text-[9px] font-black text-content/40 uppercase tracking-widest mt-0.5">{item.subtitle}</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-content/20" />
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* ── Security & Compliance Menu ── */}
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-2 pt-2">
                    <p className="text-[9px] font-black text-content/30 uppercase tracking-[0.2em] px-3">Compliance & Access</p>
                    <div className="bg-surface border border-content/[0.04] rounded-[1.5rem] overflow-hidden shadow-sm">
                        <button onClick={() => navigate('/spare-driver/premium')} className="w-full p-4 flex items-center justify-between border-b border-content/[0.02] hover:bg-content/[0.01] transition-colors">
                            <div className="flex items-center gap-3">
                                <ShieldAlert size={16} className="text-content/40" />
                                <span className="text-[11px] font-bold text-content uppercase tracking-widest">Police Check</span>
                            </div>
                            <span className={`text-[8px] font-black text-content/40 uppercase bg-content/[0.03] border border-content/[0.05] px-2 py-1 rounded`}>
                                {driver?.verification?.policeStatus || 'Incomplete'}
                            </span>
                        </button>
                        <button onClick={handleLogout} className="w-full p-4 flex items-center justify-between hover:bg-red-500/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <LogOut size={16} className="text-red-500" />
                                <span className="text-[11px] font-black text-red-500 uppercase tracking-widest">Terminate Session</span>
                            </div>
                        </button>
                    </div>
                </motion.div>
            </div>
        </DriverLayout>
    );
};

export default DriverProfile;
