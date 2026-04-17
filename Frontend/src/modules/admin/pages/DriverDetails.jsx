import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Calendar, CreditCard, Shield, FileText, CheckCircle, Ban, Clock, Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { driverService } from '../services/driverService';
import { toast } from 'react-hot-toast';
import { socketService } from '../../../utils/socket';

const DocumentThumb = ({ url, label }) => (
    <a 
        href={url || '#'} 
        target="_blank" 
        rel="noreferrer"
        className="group relative h-32 bg-background border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center hover:border-brand/50 transition-colors cursor-pointer"
    >
        {url ? (
            <img src={url} alt={label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
            <div className="flex flex-col items-center opacity-30 group-hover:opacity-60 transition-opacity">
                <FileText size={24} className="mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">Missing</span>
            </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-white shadow-sm">{label}</span>
        </div>
    </a>
);

const DriverDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDriver = async () => {
            try {
                const res = await driverService.getDriverById(id);
                if (res?.status === 'success') {
                    setDriver(res.data.driver);
                }
            } catch (error) {
                toast.error(error.message || 'Failed to sync driver profile');
                navigate('/admin/drivers');
            } finally {
                setLoading(false);
            }
        };

        fetchDriver();

        socketService.on('driver_updated', (payload) => {
            if (payload && payload.driverId === id) {
                setDriver(prev => ({ ...prev, ...payload.data }));
            }
        });

        return () => {
            socketService.off('driver_updated');
        };
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-content-subtle">Extracting Profile Nexus</span>
                </div>
            </div>
        );
    }

    if (!driver) return null;

    const toggleStatus = async () => {
        try {
            const newStatus = driver.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
            const res = await driverService.updateDriverStatus(driver._id, newStatus);
            if (res.status === 'success') {
                toast.success(`Operative ${newStatus}`);
                setDriver(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update operative status');
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto px-4 pb-20 space-y-6">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-content-subtle hover:text-brand transition-colors mb-4"
            >
                <ArrowLeft size={14} /> Back to Registry
            </button>

            {/* Top Profile Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-soft p-6 lg:p-8 relative overflow-hidden"
            >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
                    <User size={200} />
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-brand to-orange-400 p-[2px] shrink-0">
                        <div className="w-full h-full bg-surface rounded-[22px] overflow-hidden">
                            {driver.profile?.profilePhoto ? (
                                <img src={driver.profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-content">
                                    {driver.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-content tracking-tighter capitalize">{driver.name}</h1>
                                <p className="text-xs font-bold text-brand uppercase tracking-[0.2em] mt-1">{driver.driverId}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                    driver.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full ${driver.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    {driver.status}
                                </div>
                                <button 
                                    onClick={toggleStatus}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        driver.status === 'BLOCKED' 
                                            ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white hover:scale-105'
                                            : 'bg-red-500 shadow-lg shadow-red-500/20 text-white hover:scale-105'
                                    }`}
                                >
                                    {driver.status === 'BLOCKED' ? 'Reactivate' : 'Block Operative'}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mt-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/5">
                                    <Phone size={14} className="text-brand" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-wider">Contact</p>
                                    <p className="text-sm font-black text-content tabular-nums">{driver.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/5">
                                    <MapPin size={14} className="text-brand" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-wider">Base Location</p>
                                    <p className="text-sm font-black text-content capitalize">{driver.profile?.city || 'Unassigned'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/5">
                                    <Calendar size={14} className="text-brand" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-wider">System Entry</p>
                                    <p className="text-sm font-black text-content">{new Date(driver.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compliance & Vetting Box */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface rounded-[2rem] border border-slate-200/60 dark:border-white/5 p-6 shadow-soft space-y-6">
                    <h3 className="text-sm font-black text-content uppercase tracking-widest flex items-center gap-2">
                        <Shield size={16} className="text-brand" /> Operational Compliance
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-background border border-slate-200/60 dark:border-white/5 rounded-2xl">
                            <div>
                                <p className="text-xs font-black text-content uppercase tracking-widest">Verification Desk</p>
                                <p className="text-[10px] font-bold text-content-subtle mt-1 opacity-70">Overarching document approval state</p>
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
                                driver.verificationStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                driver.verificationStatus === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                                {driver.verificationStatus}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-background border border-slate-200/60 dark:border-white/5 rounded-2xl">
                            <div>
                                <p className="text-xs font-black text-content uppercase tracking-widest">Background Check</p>
                                <p className="text-[10px] font-bold text-content-subtle mt-1 opacity-70">Police vetting resolution</p>
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
                                driver.policeVerification === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                driver.policeVerification === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                                {driver.policeVerification}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-background border border-slate-200/60 dark:border-white/5 rounded-2xl">
                            <div>
                                <p className="text-xs font-black text-content uppercase tracking-widest">Equipment State</p>
                                <p className="text-[10px] font-bold text-content-subtle mt-1 opacity-70">Hardware & uniform assignment</p>
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
                                driver.kitStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                driver.kitStatus === 'NOT_PURCHASED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                                {driver.kitStatus}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Financial Sandbox */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-surface rounded-[2rem] border border-slate-200/60 dark:border-white/5 p-6 shadow-soft space-y-6 flex flex-col">
                    <h3 className="text-sm font-black text-content uppercase tracking-widest flex items-center gap-2">
                        <CreditCard size={16} className="text-brand" /> Financial Matrix
                    </h3>
                    
                    {driver.bankDetails?.bankName ? (
                        <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between border border-white/10 shadow-2xl">
                            {/* Card Decoration */}
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute right-4 bottom-4 opacity-20"><CreditCard size={48} className="text-white" /></div>

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Financial Institution</p>
                                <p className="text-lg font-black text-white tracking-widest uppercase">{driver.bankDetails.bankName}</p>
                            </div>
                            
                            <div className="mt-8 space-y-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Account Beneficiary</p>
                                    <p className="text-sm font-black text-white tracking-wider uppercase">{driver.bankDetails.accountHolderName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Routing (IFSC)</p>
                                        <p className="text-sm font-black text-white tracking-wider uppercase">{driver.bankDetails.ifscCode}</p>
                                    </div>
                                    {driver.bankDetails.upiId && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">UPI Handle</p>
                                            <p className="text-sm font-black text-white">{driver.bankDetails.upiId}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                            <CreditCard size={32} className="text-content-subtle opacity-30 mb-3" />
                            <p className="text-sm font-black text-content">No Link Established</p>
                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1 opacity-70">Operative has not synced bank matrix</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Document Sandbox */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface rounded-[2rem] border border-slate-200/60 dark:border-white/5 p-6 lg:p-8 shadow-soft">
                <h3 className="text-sm font-black text-content uppercase tracking-widest flex items-center gap-2 mb-6">
                    <FileText size={16} className="text-brand" /> Document Sandbox
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DocumentThumb url={driver.documents?.aadhaarCard?.frontUrl} label="Aadhaar Front" />
                    <DocumentThumb url={driver.documents?.aadhaarCard?.backUrl} label="Aadhaar Back" />
                    <DocumentThumb url={driver.documents?.drivingLicense?.url} label="Driving License" />
                    <DocumentThumb url={driver.documents?.selfie?.url} label="Identity Selfie" />
                </div>
            </motion.div>

        </div>
    );
};

export default DriverDetails;
