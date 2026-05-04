import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Shield, AlertTriangle, Clock, CheckCircle, 
    Package, Phone, Eye, X, CheckSquare 
} from 'lucide-react';
import DriverLaneGrid from './DriverLaneGrid';

const VerificationSection = ({
    lanes,
    driverLane,
    laneCounts,
    onSelectLane,
    loading,
    verificationDrivers,
    statusConfig,
    onApprove,
    onReject,
    openDriverReview
}) => {
    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, driverId: null, reason: '' });

    const getComplianceStatus = (driver) => {
        const hasAadhaar = driver.documents?.aadhaarCard?.url || driver.documents?.aadhaarCard?.frontUrl;
        const hasPan = driver.documents?.panCard?.url;
        const hasDL = driver.documents?.drivingLicense?.url;
        const allDocsReady = hasAadhaar && hasPan && hasDL;
        
        const kitStatus = driver.status === 'kit_payment_pending' ? 'PAID' : 'PENDING';
        
        return { allDocsReady, kitStatus };
    };

    const handleRejectClick = (driverId) => {
        setRejectionModal({ isOpen: true, driverId, reason: '' });
    };

    const confirmRejection = () => {
        if (rejectionModal.reason.trim()) {
            onReject(rejectionModal.driverId, rejectionModal.reason);
            setRejectionModal({ isOpen: false, driverId: null, reason: '' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Filter Lane */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Shield size={16} className="text-amber-500" />
                            Verification Pipeline
                        </h3>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">Review registrations and activate chauffeur accounts</p>
                    </div>
                </div>
                <div className="p-4 bg-white">
                    <DriverLaneGrid
                        lanes={lanes.filter(l => ['all', 'pending_verification', 'kit_payment_pending', 'rejected'].includes(l.id))}
                        driverLane={driverLane}
                        laneCounts={laneCounts}
                        onSelect={onSelectLane}
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Pending Review', value: laneCounts.pending_verification || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Kit Reviews', value: laneCounts.kit_payment_pending || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total in Queue', value: verificationDrivers.length, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Rejected Protocol', value: laneCounts.rejected || 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' }
                ].map((stat, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{stat.value}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={18} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Driver Cards */}
            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning network nodes...</p>
                </div>
            ) : verificationDrivers.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <CheckCircle size={48} className="mx-auto text-emerald-500/20 mb-4" />
                    <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Verification Queue Empty</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">All chauffeur protocols are synchronized</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {verificationDrivers.map((driver) => {
                        const { allDocsReady, kitStatus } = getComplianceStatus(driver);
                        const cfg = statusConfig[driver.status] || statusConfig.pending_docs;

                        return (
                            <motion.div 
                                layout
                                key={driver._id} 
                                className={`p-6 rounded-[2.5rem] border bg-white shadow-sm transition-all hover:shadow-xl hover:border-amber-100 group ${
                                    allDocsReady ? 'border-emerald-100 ring-4 ring-emerald-50/50' : 'border-slate-100'
                                }`}
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                                    {/* Driver Info */}
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-900 text-amber-500 flex items-center justify-center font-black text-xl shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                                            {driver.name ? driver.name[0] : '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate leading-tight">{driver.name}</h3>
                                            <p className="text-[12px] font-black text-slate-400 tracking-widest mt-0.5">{driver.phone}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                                {allDocsReady && (
                                                    <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                        <CheckSquare size={10} /> Ready
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Compliance & Docs */}
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Protocol Validation</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['aadhaarCard', 'panCard', 'drivingLicense', 'selfie'].map(doc => {
                                                const hasDoc = driver.documents?.[doc]?.url || (doc === 'aadhaarCard' && driver.documents?.aadhaarCard?.frontUrl);
                                                return (
                                                    <a 
                                                        key={doc}
                                                        href={hasDoc ? (driver.documents?.[doc]?.url || driver.documents?.aadhaarCard?.frontUrl) : '#'} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                                            hasDoc 
                                                                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900' 
                                                                : 'bg-slate-50/50 border-dashed border-slate-100 text-slate-300 pointer-events-none'
                                                        }`}
                                                    >
                                                        {doc.replace(/([A-Z])/g, ' $1')}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                        <div className="flex items-center gap-4 pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <Package size={12} className={kitStatus === 'PAID' ? 'text-emerald-500' : 'text-slate-300'} />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kit: {kitStatus}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} className="text-slate-300" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Joined: {new Date(driver.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Deck */}
                                    <div className="flex items-center justify-end gap-3">
                                        <button 
                                            onClick={() => openDriverReview(driver)}
                                            className="w-11 h-11 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                            title="Deep Review"
                                        >
                                            <Eye size={20} />
                                        </button>
                                        <button 
                                            onClick={() => handleRejectClick(driver._id)}
                                            className="px-6 h-11 rounded-2xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm shadow-rose-100/50"
                                        >
                                            Reject
                                        </button>
                                        <button 
                                            onClick={() => onApprove(driver._id, driver.status)}
                                            className="px-8 h-11 rounded-2xl bg-slate-900 text-amber-500 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                                        >
                                            Approve Protocol
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Protocol Rejection Modal */}
            <AnimatePresence>
                {rejectionModal.isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl border border-slate-100"
                        >
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">Protocol Rejection</h3>
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-6">Specify protocol violation reason</p>
                            
                            <textarea 
                                className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-amber-400 text-sm font-medium transition-all mb-6"
                                placeholder="e.g. Invalid document resolution, Fake ID detection..."
                                value={rejectionModal.reason}
                                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                            />

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}
                                    className="flex-1 h-12 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmRejection}
                                    className="flex-1 h-12 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VerificationSection;
