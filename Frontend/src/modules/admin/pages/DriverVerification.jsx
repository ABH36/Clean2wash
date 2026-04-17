import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, Ban, Camera, FileText, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { driverService } from '../services/driverService';
import { toast } from 'react-hot-toast';

const DocumentThumb = ({ url, label }) => (
    <a 
        href={url || '#'} 
        target="_blank" 
        rel="noreferrer"
        className="group relative h-24 bg-background border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center hover:border-brand/50 transition-colors cursor-pointer"
    >
        {url ? (
            <img src={url} alt={label} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
        ) : (
            <div className="flex flex-col items-center opacity-30 group-hover:opacity-60 transition-opacity">
                <FileText size={20} className="mb-2" />
                <span className="text-[9px] font-black uppercase tracking-widest">Missing</span>
            </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white shadow-sm">{label}</span>
        </div>
    </a>
);

const DriverVerification = () => {
    const [pendingDrivers, setPendingDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, id: null, reason: '' });

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const res = await driverService.getAllDrivers({ verificationStatus: 'PENDING', limit: 100 });
            if (res?.status === 'success') {
                setPendingDrivers(res.data.drivers);
            }
        } catch (error) {
            toast.error('Failed to sync verification queue');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const res = await driverService.approveDriver(id);
            if (res.status === 'success') {
                toast.success('Operative Approved & Activated');
                setPendingDrivers(prev => prev.filter(d => d._id !== id));
            }
        } catch (error) {
            toast.error(error.message || 'Failed to approve. Check prerequisites.');
        }
    };

    const executeRejection = async () => {
        try {
            const res = await driverService.rejectDriver(rejectionModal.id, rejectionModal.reason);
            if (res.status === 'success') {
                toast.success('Operative Rejected');
                setPendingDrivers(prev => prev.filter(d => d._id !== rejectionModal.id));
                setRejectionModal({ isOpen: false, id: null, reason: '' });
            }
        } catch (error) {
            toast.error(error.message || 'Failed to reject operative');
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto px-4 pb-20 space-y-6">
            <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface p-6 rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-soft">
                <div>
                    <h2 className="text-2xl font-black text-content tracking-tighter">Verification Desk</h2>
                    <p className="text-[11px] font-black tracking-widest text-content-subtle opacity-60 uppercase mt-1">
                        {pendingDrivers.length} Items Pending Review
                    </p>
                </div>
                
                <button 
                    onClick={fetchPending}
                    className="h-12 px-8 bg-background border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand/30 hover:text-brand transition-colors"
                >
                    Refresh Queue
                </button>
            </header>

            {loading ? (
                <div className="h-48 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
                </div>
            ) : pendingDrivers.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-surface border border-slate-200/60 dark:border-white/5 rounded-[2rem]">
                    <ShieldCheck size={48} className="opacity-20 text-brand mb-4" />
                    <p className="text-sm font-black text-content">Queue Emptied</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-content-subtle mt-2">All operatives have been processed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingDrivers.map(driver => (
                        <motion.div 
                            key={driver._id}
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-surface rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-soft p-6 group"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-brand/10 p-[1px] overflow-hidden flex-shrink-0 border border-brand/20">
                                    {driver.documents?.selfie?.url ? (
                                        <img src={driver.documents.selfie.url} alt="Selfie" className="w-full h-full object-cover rounded-[15px]" />
                                    ) : (
                                        <div className="w-full h-full bg-background rounded-[15px] flex items-center justify-center"><Camera size={20} className="opacity-30" /></div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-content capitalize tracking-tight leading-none mb-1">{driver.name}</h3>
                                    <p className="text-xs font-black text-content-subtle mb-0.5">{driver.phone}</p>
                                    <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest opacity-60">ID: {driver.driverId}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <DocumentThumb url={driver.documents?.aadhaarCard?.frontUrl} label="Aadhaar Front" />
                                <DocumentThumb url={driver.documents?.aadhaarCard?.backUrl} label="Aadhaar Back" />
                                <DocumentThumb url={driver.documents?.drivingLicense?.url} label="DL" />
                            </div>

                            <div className="flex flex-col gap-2 p-4 bg-background border border-slate-200/60 dark:border-white/5 rounded-2xl mb-6">
                               <div className="flex justify-between items-center text-[10px]">
                                   <span className="font-bold uppercase tracking-widest text-content-subtle">Kit Status</span>
                                   <span className={`font-black ${driver.kitStatus === 'COMPLETED' ? 'text-emerald-500' : 'text-amber-500'}`}>{driver.kitStatus}</span>
                               </div>
                               <div className="flex justify-between items-center text-[10px]">
                                   <span className="font-bold uppercase tracking-widest text-content-subtle">Background Check</span>
                                   <span className={`font-black ${driver.policeVerification === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'}`}>{driver.policeVerification}</span>
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setRejectionModal({ isOpen: true, id: driver._id, reason: '' })}
                                    className="h-12 rounded-xl flex items-center justify-center gap-2 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <Ban size={14} /> Reject
                                </button>
                                <button 
                                    onClick={() => handleApprove(driver._id)}
                                    className="h-12 rounded-xl flex items-center justify-center gap-2 bg-brand text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <CheckCircle size={14} /> Approve
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Rejection Modal */}
            <AnimatePresence>
                {rejectionModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectionModal({ isOpen: false, id: null, reason: '' })} />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-surface relative z-10 w-full max-w-md rounded-[2rem] p-8 border border-white/10 shadow-2xl"
                        >
                            <h3 className="text-xl font-black text-content tracking-tighter mb-2 text-center">Reject Profile</h3>
                            <p className="text-[11px] font-bold text-center text-content-subtle uppercase tracking-widest opacity-60 mb-6">Action is irreversible.</p>
                            
                            <textarea 
                                value={rejectionModal.reason}
                                onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="State reason for rejection..."
                                className="w-full h-32 bg-background border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold text-content outline-none focus:border-red-500/50 mb-6 resize-none shadow-inner"
                            />
                            
                            <button 
                                disabled={!rejectionModal.reason.trim()}
                                onClick={executeRejection}
                                className="w-full h-14 bg-red-500 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Confirm Rejection
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DriverVerification;
