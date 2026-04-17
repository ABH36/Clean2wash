import React, { useEffect, useState, useRef } from 'react';
import {
    User, Mail, Phone, MapPin,
    ShieldCheck, LogOut, ChevronRight,
    CreditCard, Camera,
    Loader2, Trophy, ShieldAlert,
    CheckCircle2
} from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const DriverProfile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchProfile = async () => {
        try {
            const res = await spareDriverAPI.getProfile();
            setDriver(res?.data?.driver || null);
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
            <DriverLayout title="Dossier">
                <div className="flex h-[60vh] items-center justify-center font-black text-content/20 uppercase tracking-[0.4em] animate-pulse">
                    Scanning Dossier...
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
        <DriverLayout title="Operator Dossier">
            <div className="px-6 py-6 space-y-6 pb-24">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black rounded-[2.8rem] p-8 shadow-2xl relative overflow-hidden transition-colors duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[60px]" />
                    <div className="flex items-center gap-6 relative z-10">
                        <div
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className="w-20 h-20 rounded-[2rem] bg-brand/10 border-2 border-brand/20 flex items-center justify-center text-brand relative overflow-hidden cursor-pointer group"
                        >
                            <AnimatePresence>
                                {uploading ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                        <Loader2 className="animate-spin text-brand" size={24} />
                                    </motion.div>
                                ) : (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                                        <Camera size={20} className="text-brand" />
                                    </div>
                                )}
                            </AnimatePresence>

                            {driver?.documents?.selfie?.url ? (
                                <img src={driver.documents.selfie.url} alt="Profile" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                            ) : (
                                <User size={36} />
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{driver?.name}</h2>
                                {isPremium && <Trophy size={18} className="text-brand fill-brand" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isPremium ? 'bg-green-500' : 'bg-brand'} animate-pulse`} />
                                <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] font-mono">
                                    ID: {driver?.driverId || `CW-SD-${driver?._id?.slice(-6)}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`rounded-[2.5rem] p-6 border transition-all duration-500 relative overflow-hidden ${isPremium ? 'bg-gradient-to-br from-brand/20 to-brand/5 border-brand/30 shadow-brand/10 shadow-2xl' : 'bg-surface border-content/[0.04]'}`}
                >
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPremium ? 'bg-black text-brand' : 'bg-content/[0.04] text-content/20'}`}>
                                <ShieldCheck size={24} className={isPremium ? 'animate-pulse' : ''} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-brand uppercase tracking-widest">{isPremium ? 'Elite Operator' : 'Elite Status'}</p>
                                <h3 className="text-sm font-black text-content uppercase tracking-tight">{isPremium ? 'Premium Verified' : 'Standard Access'}</h3>
                            </div>
                        </div>

                        {!isPremium && !isPvrPending && (
                            <button
                                onClick={() => navigate('/spare-driver/premium')}
                                className="px-5 h-10 bg-brand text-black rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand/20"
                            >
                                Upgrade
                            </button>
                        )}
                        {isPvrPending && (
                            <div className="px-4 py-2 bg-content/[0.05] rounded-xl flex items-center gap-2 border border-content/[0.03]">
                                <Loader2 size={12} className="animate-spin text-content/40" />
                                <span className="text-[9px] font-black text-content/40 uppercase">Reviewing</span>
                            </div>
                        )}
                        {isPremium && (
                            <CheckCircle2 size={24} className="text-green-500" />
                        )}
                    </div>
                </motion.div>

                <div className="bg-surface border border-content/[0.04] rounded-[2.2rem] p-6 space-y-5 transition-colors duration-500 shadow-sm relative overflow-hidden">
                    <button
                        onClick={() => navigate('/spare-driver/address')}
                        className="absolute top-4 right-4 text-brand text-[8px] font-black uppercase tracking-widest border border-brand/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                    >
                        Update Base
                    </button>
                    {[
                        { l: 'Communications', v: driver?.email || 'Not set', i: Mail },
                        { l: 'Tactical Link', v: driver?.phone || 'Not set', i: Phone },
                        { l: 'Operational Base', v: fullAddress, i: MapPin }
                    ].map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-content/[0.04] flex items-center justify-center text-content/20"><item.i size={18} /></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[8px] font-black text-content/20 uppercase tracking-widest">{item.l}</p>
                                <p className="text-sm font-black text-content uppercase truncate">{item.v}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] font-black text-content/30 uppercase tracking-[0.3em] px-2">Compliance Vault</p>
                    <div className="bg-surface border border-content/[0.04] rounded-[2.2rem] overflow-hidden transition-colors duration-500 shadow-sm divide-y divide-content/[0.04]">
                        {[
                            { l: 'Auth Protocols', s: 'Verified', i: ShieldCheck },
                            { l: 'Elite Tier', s: isPremium ? 'Premium' : 'Standard', i: Trophy },
                            { l: 'PVR Badge', s: driver?.verification?.policeStatus || 'Incomplete', i: ShieldAlert },
                            { l: 'Billing Signal', s: driver?.wallet?.balance ? 'Active' : 'Standby', i: CreditCard }
                        ].map((item, index) => (
                            <button key={index} className="w-full p-5 flex items-center justify-between active:bg-content/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="text-brand"><item.i size={20} /></div>
                                    <span className="text-[11px] font-black text-content uppercase">{item.l}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase ${item.s === 'Premium' ? 'text-green-500' : 'text-content/30'}`}>{item.s}</span>
                                    <ChevronRight size={16} className="text-content/10" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {['verified_pending_kit', 'kit_payment_pending', 'active'].includes(driver?.status) && (
                    <button
                        onClick={() => navigate('/spare-driver/kit-purchase')}
                        className="w-full bg-surface border border-content/[0.04] rounded-[2rem] px-5 py-4 flex items-center justify-between active:scale-[0.99] transition-all shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                                <CreditCard size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black text-brand uppercase tracking-widest">Kit Purchasing</p>
                                <p className="text-[10px] font-black text-content/45 uppercase tracking-wider mt-1">
                                    {driver?.status === 'active' ? 'View kit status and recovery plan' : 'Complete payment to unlock operations'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-content/20" />
                    </button>
                )}

                {['verified_pending_kit', 'kit_payment_pending', 'active'].includes(driver?.status) && (
                    <button
                        onClick={() => navigate('/spare-driver/premium')}
                        className="w-full bg-surface border border-content/[0.04] rounded-[2rem] px-5 py-4 flex items-center justify-between active:scale-[0.99] transition-all shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                                <ShieldCheck size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black text-brand uppercase tracking-widest">Premium Driver</p>
                                <p className="text-[10px] font-black text-content/45 uppercase tracking-wider mt-1">
                                    View premium benefits and police verification
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-content/20" />
                    </button>
                )}

                <button onClick={handleLogout} className="w-full h-15 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all mb-8 border border-red-500/10 shadow-sm">
                    <LogOut size={18} /> Terminate Session
                </button>
            </div>
        </DriverLayout>
    );
};

export default DriverProfile;
