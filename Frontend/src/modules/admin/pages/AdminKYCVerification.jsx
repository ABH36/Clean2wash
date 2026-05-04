import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, Clock, CheckCircle, Package, RefreshCw, 
    Camera, CreditCard, Car, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageShell, { SectionCard, EmptyState, PageLoader } from '../components/PageShell';
import { adminAPI } from '../../../utils/adminApi';

const AdminKYCVerification = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, driverId: null, reason: '' });

    useEffect(() => {
        loadDrivers();
    }, []);

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getSpareDrivers();
            if (res.status === 'success') {
                // Filter only pending drivers
                const pendingDrivers = (res.data.drivers || []).filter(d => 
                    ['pending', 'PENDING', 'kit_payment_pending'].includes(d.status)
                );
                setDrivers(pendingDrivers);
            }
        } catch (error) {
            toast.error('Failed to load drivers: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (driverId) => {
        const loadingToast = toast.loading('Synchronizing approval...');
        try {
            await adminAPI.patch(`/drivers/${driverId}/approve`, {});
            setDrivers(prev => prev.filter(d => d.id !== driverId && d._id !== driverId));
            toast.success('Protocol Verified - Awaiting Kit Deployment', { id: loadingToast });
        } catch(err) {
            toast.error('Sync failure: ' + err.message, { id: loadingToast });
        }
    };

    const handleReject = async (driverId, reason) => {
        const loadingToast = toast.loading('Processing rejection...');
        try {
            await adminAPI.patch(`/drivers/${driverId}/reject`, { reason });
            setDrivers(prev => prev.filter(d => d.id !== driverId && d._id !== driverId));
            toast.success('Entity Rejected - Data Purged', { id: loadingToast });
        } catch(err) {
            toast.error('Rejection failure: ' + err.message, { id: loadingToast });
        }
    };

    const executeRejection = () => {
        if (rejectionModal.reason.trim()) {
            handleReject(rejectionModal.driverId, rejectionModal.reason);
            setRejectionModal({ isOpen: false, driverId: null, reason: '' });
        }
    };

    const getComplianceStatus = (driver) => {
        const policeStatus = driver.policeVerification || 
                           (driver.documents?.policeVerification?.url ? 'VERIFIED' : 'PENDING');
        
        const pStatus = driver.kit?.paymentStatus?.toLowerCase();
        let kitStatus = 'PENDING';
        if (['completed', 'verified'].includes(pStatus)) kitStatus = 'COMPLETED';
        else if (pStatus === 'under_review') kitStatus = 'UNDER REVIEW';
        
        return { policeStatus, kitStatus };
    };

    const stats = [
        { label: 'Pending Review', value: drivers.length, icon: Clock, color: 'text-amber-600' },
        { label: 'Documents Ready', value: drivers.filter(d => d.documents?.aadhaarCard?.url && d.documents?.panCard?.url).length, icon: CheckCircle, color: 'text-emerald-600' },
        { label: 'Kit Purchased', value: drivers.filter(d => d.kit?.paymentStatus === 'completed').length, icon: Package, color: 'text-blue-600' },
        { label: 'Police Verified', value: drivers.filter(d => d.policeVerification === 'VERIFIED').length, icon: Shield, color: 'text-indigo-600' }
    ];

    return (
        <PageShell
            title="KYC Verification Queue"
            subtitle="Driver Onboarding & Document Verification"
            icon={Shield}
            accent="indigo"
            actions={
                <button 
                    onClick={loadDrivers}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            }
        >
            {/* ── STATS GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, idx) => (
                    <SectionCard key={idx} noPad className="group hover:border-amber-500 transition-all cursor-default">
                        <div className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{stat.value}</p>
                            </div>
                            <stat.icon size={20} className={stat.color} />
                        </div>
                    </SectionCard>
                ))}
            </div>

            {/* ── VERIFICATION QUEUE ── */}
            <SectionCard
                title="Verification Pipeline"
                subtitle={`${drivers.length} drivers awaiting review`}
                noPad
            >
                <div className="p-6">
                    {loading ? (
                        <div className="py-24">
                            <PageLoader />
                        </div>
                    ) : drivers.length === 0 ? (
                        <EmptyState 
                            icon={CheckCircle}
                            title="Verification Queue Empty"
                            subtitle="All drivers have been processed. Great work!"
                        />
                    ) : (
                        <div className="space-y-4">
                            {drivers.map(driver => {
                                const { policeStatus, kitStatus } = getComplianceStatus(driver);
                                const allDocumentsReady = (driver.documents?.aadhaarCard?.url || driver.documents?.aadhaarCard?.frontUrl) && 
                                                       driver.documents?.panCard?.url && 
                                                       driver.documents?.drivingLicense?.url;

                                return (
                                    <div 
                                        key={driver._id || driver.id}
                                        className={`p-6 rounded-[2rem] border transition-all duration-300 ${
                                            allDocumentsReady 
                                                ? 'border-emerald-200 bg-emerald-50/30' 
                                                : 'border-slate-100 bg-white'
                                        }`}
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            {/* Driver Info */}
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-amber-500 flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                                                    {driver.name ? driver.name[0] : '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate">{driver.name}</h3>
                                                    <p className="text-[12px] font-black text-slate-500 tracking-widest">{driver.phone}</p>
                                                    <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                        allDocumentsReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {allDocumentsReady ? 'READY FOR APPROVAL' : 'PENDING REQUIREMENTS'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Documents */}
                                            <div className="flex flex-wrap gap-2">
                                                {['aadhaarCard', 'panCard', 'drivingLicense', 'selfie'].map(doc => (
                                                    <a 
                                                        key={doc}
                                                        href={driver.documents?.[doc]?.url || (doc === 'aadhaarCard' ? driver.documents?.aadhaarCard?.frontUrl : '#')} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                                            (driver.documents?.[doc]?.url || (doc === 'aadhaarCard' && driver.documents?.aadhaarCard?.frontUrl))
                                                                ? 'bg-white border-slate-200 text-slate-700 hover:border-amber-500' 
                                                                : 'bg-slate-50 border-slate-100 text-slate-300 pointer-events-none'
                                                        }`}
                                                    >
                                                        {doc.replace(/([A-Z])/g, ' $1')}
                                                    </a>
                                                ))}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-end gap-3">
                                                <button 
                                                    onClick={() => setRejectionModal({ isOpen: true, driverId: driver._id || driver.id, reason: '' })}
                                                    className="px-6 h-11 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
                                                >
                                                    Reject
                                                </button>
                                                <button 
                                                    onClick={() => handleApprove(driver._id || driver.id)}
                                                    className="px-8 h-11 rounded-xl bg-slate-900 text-amber-500 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                                                >
                                                    Approve Entity
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </SectionCard>

            {/* ── REJECTION MODAL ── */}
            <AnimatePresence>
                {rejectionModal.isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl border border-slate-100"
                        >
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">Protocol Rejection</h3>
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-6">Specify violation reason</p>
                            
                            <textarea 
                                className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-amber-400 text-sm font-medium transition-all mb-6"
                                placeholder="Enter rejection reason..."
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
                                    onClick={executeRejection}
                                    className="flex-1 h-12 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

export default AdminKYCVerification;
