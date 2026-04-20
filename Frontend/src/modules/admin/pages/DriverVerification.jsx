import React, { useState, useEffect } from 'react';
import {
    Search, ShieldCheck, Ban, Camera, FileText, CheckCircle,
    User, Phone, Mail, MapPin, Car, Clock, CreditCard, Award,
    Package, Star, ChevronDown, ChevronUp, ExternalLink, Eye,
    Loader2, AlertCircle, Check, X, RefreshCw, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { driverService } from '../services/driverService';
import { toast } from 'react-hot-toast';

/* ────────────────────────── Helpers ────────────────────────── */
const StatusBadge = ({ value, map }) => {
    const cfg = map[value] || map['DEFAULT'] || { label: value, color: 'text-white/40 bg-white/5 border-white/10' };
    return (
        <span className={`inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.color}`}>
            {cfg.label}
        </span>
    );
};

const VERIFY_STATUS_MAP = {
    PENDING:   { label: 'Pending',  color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    APPROVED:  { label: 'Approved', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    REJECTED:  { label: 'Rejected', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
    DEFAULT:   { label: 'Unknown',  color: 'text-white/20 bg-white/5 border-white/10' },
};
const KIT_STATUS_MAP = {
    NOT_PURCHASED: { label: 'Not purchased', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
    PENDING:       { label: 'Pending',        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    COMPLETED:     { label: 'Paid',           color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    DEFAULT:       { label: 'N/A',            color: 'text-white/20 bg-white/5 border-white/10' },
};
const POLICE_STATUS_MAP = {
    PENDING:  { label: 'Not verified', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    VERIFIED: { label: 'Verified',     color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    REJECTED: { label: 'Rejected',     color: 'text-red-400 bg-red-400/10 border-red-400/20' },
    DEFAULT:  { label: 'Unknown',      color: 'text-white/20 bg-white/5 border-white/10' },
};

/* ── Document Viewer ── */
const DocThumb = ({ url, label }) => (
    <a href={url || '#'} target="_blank" rel="noreferrer"
        className={`group relative rounded-xl overflow-hidden flex flex-col items-center justify-center border transition-all ${url ? 'border-white/10 bg-black/20 hover:border-yellow-500/30' : 'border-dashed border-white/5 bg-white/[0.01]'}`}
        style={{ height: 80 }}>
        {url ? (
            <>
                <img src={url} alt={label} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2 pb-1">
                    <span className="text-[6px] font-black uppercase tracking-widest text-white/80">{label}</span>
                    <ExternalLink size={8} className="text-white/40" />
                </div>
            </>
        ) : (
            <div className="flex flex-col items-center gap-1 opacity-20">
                <FileText size={16} />
                <span className="text-[6px] font-black uppercase tracking-widest">{label}</span>
            </div>
        )}
    </a>
);

/* ── Info Row ── */
const InfoRow = ({ label, value, mono }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-white/5">
        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
        <span className={`text-[9px] font-bold text-white text-right max-w-[60%] truncate ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
);

/* ── Driver Detail Drawer ── */
const DriverDetailDrawer = ({ driver, isOpen, onClose, onApprove, onReject }) => {
    if (!driver) return null;

    const { documents = {}, aadhaarNumber, panNumber, licenseNumber, bankDetails = {}, profile = {}, kit = {}, policeVerification, kitStatus, verificationStatus, reliabilityScore = {} } = driver;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="relative z-10 ml-auto w-full max-w-lg h-full bg-[#0f1410] border-l border-white/5 overflow-y-auto flex flex-col"
                    >
                        {/* Drawer Header */}
                        <div className="sticky top-0 bg-[#0f1410]/95 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 overflow-hidden flex-shrink-0">
                                    {documents?.selfie?.url ? (
                                        <img src={documents.selfie.url} alt={driver.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Camera size={16} className="text-white/10" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white capitalize tracking-tight leading-none">{driver.name}</h3>
                                    <p className="text-[8px] font-mono text-white/30 mt-0.5">{driver.driverId}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 text-white/30 flex items-center justify-center hover:bg-white/10 transition-all">
                                <X size={14} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 space-y-6">
                            {/* Status Overview */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
                                    <StatusBadge value={verificationStatus} map={VERIFY_STATUS_MAP} />
                                    <p className="text-[6px] font-black text-white/20 uppercase tracking-widest mt-1.5">Verification</p>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
                                    <StatusBadge value={kitStatus} map={KIT_STATUS_MAP} />
                                    <p className="text-[6px] font-black text-white/20 uppercase tracking-widest mt-1.5">Kit status</p>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
                                    <StatusBadge value={policeVerification} map={POLICE_STATUS_MAP} />
                                    <p className="text-[6px] font-black text-white/20 uppercase tracking-widest mt-1.5">Police check</p>
                                </div>
                            </div>

                            {/* Personal Info */}
                            <Section title="Personal information" icon={<User size={12} />}>
                                <InfoRow label="Full name" value={driver.name} />
                                <InfoRow label="Phone" value={driver.phone} />
                                <InfoRow label="Email" value={driver.email} />
                                <InfoRow label="City" value={profile?.city || driver.city} />
                                <InfoRow label="Availability" value={profile?.availability} />
                                <InfoRow label="Registered on" value={driver.createdAt ? new Date(driver.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null} />
                            </Section>

                            {/* Identity Documents */}
                            <Section title="Identity details" icon={<ShieldCheck size={12} />}>
                                <InfoRow label="Aadhaar no" value={aadhaarNumber || driver.aadhaarNumber} mono />
                                <InfoRow label="PAN no" value={panNumber || driver.panNumber} mono />
                                <InfoRow label="DL number" value={licenseNumber || driver.licenseNumber} mono />
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                    <DocThumb url={documents?.aadhaarCard?.frontUrl || documents?.aadhaarCard?.url} label="Aadhaar front" />
                                    <DocThumb url={documents?.aadhaarCard?.backUrl} label="Aadhaar back" />
                                    <DocThumb url={documents?.panCard?.url} label="PAN card" />
                                    <DocThumb url={documents?.drivingLicense?.url} label="Driving license" />
                                    <DocThumb url={documents?.selfie?.url} label="Profile photo" />
                                    <DocThumb url={documents?.policeVerification?.url} label="Police cert." />
                                </div>
                            </Section>

                            {/* Kit Information */}
                            <Section title="Kit & equipment" icon={<Package size={12} />}>
                                <InfoRow label="Kit type" value={driver.kitName || kit?.paymentStatus} />
                                <InfoRow label="Kit price" value={driver.kitFee ? `₹${driver.kitFee}` : '—'} />
                                <InfoRow label="Payment status" value={kit?.paymentStatus} />
                                <InfoRow label="Payment ref" value={kit?.paymentReference} mono />
                                <InfoRow label="Paid on" value={kit?.paidAt ? new Date(kit.paidAt).toLocaleDateString('en-IN') : null} />
                                {kit?.paymentProofUrl && (
                                    <div className="mt-3">
                                        <DocThumb url={kit.paymentProofUrl} label="Payment proof" />
                                    </div>
                                )}
                            </Section>

                            {/* Bank Details */}
                            <Section title="Bank & payout details" icon={<CreditCard size={12} />}>
                                <InfoRow label="Account holder" value={bankDetails.accountName} />
                                <InfoRow label="Account no" value={bankDetails.accountNumber} mono />
                                <InfoRow label="IFSC code" value={bankDetails.ifscCode} mono />
                                <InfoRow label="Bank name" value={bankDetails.bankName} />
                                <InfoRow label="UPI ID" value={bankDetails.upiId} mono />
                            </Section>

                            {/* Reliability Score */}
                            <Section title="Performance metrics" icon={<Star size={12} />}>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Reliability score</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${reliabilityScore.score || 0}%` }} />
                                        </div>
                                        <span className="text-[9px] font-black text-yellow-500">{reliabilityScore.score ?? 100}/100</span>
                                    </div>
                                </div>
                                <InfoRow label="Total trips" value={reliabilityScore.metrics?.totalTrips ?? 0} />
                                <InfoRow label="Completion rate" value={reliabilityScore.metrics?.completionRate ? `${reliabilityScore.metrics.completionRate}%` : '100%'} />
                                <InfoRow label="Avg rating" value={reliabilityScore.metrics?.avgRating?.toFixed(1) ?? '5.0'} />
                            </Section>

                            {/* Admin Note */}
                            {driver.adminNote && (
                                <Section title="Admin note" icon={<AlertCircle size={12} />}>
                                    <p className="text-[9px] text-white/50 leading-relaxed">{driver.adminNote}</p>
                                </Section>
                            )}
                        </div>

                        {/* Action Footer */}
                        {verificationStatus === 'PENDING' && (
                            <div className="sticky bottom-0 bg-[#0f1410]/95 backdrop-blur-md border-t border-white/5 p-4 flex gap-3">
                                <button
                                    onClick={() => onReject(driver._id)}
                                    className="flex-1 h-11 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                >
                                    <Ban size={12} /> Reject
                                </button>
                                <button
                                    onClick={() => onApprove(driver._id)}
                                    className="flex-1 h-11 bg-yellow-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 hover:bg-yellow-400 transition-all active:scale-95"
                                >
                                    <CheckCircle size={12} /> Approve
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const Section = ({ title, icon, children }) => (
    <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
            <div className="text-yellow-500">{icon}</div>
            <h4 className="text-[9px] font-black text-white/60 uppercase tracking-widest">{title}</h4>
        </div>
        {children}
    </div>
);

/* ────────────────────────── Main Component ────────────────────────── */
const DriverVerification = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, id: null, reason: '' });
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => { fetchPending(); }, []);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const res = await driverService.getAllDrivers({ verificationStatus: 'PENDING', limit: 100 });
            if (res?.status === 'success') setDrivers(res.data.drivers || []);
        } catch { toast.error('Failed to sync verification queue'); }
        finally { setLoading(false); }
    };

    const openDrawer = async (driver) => {
        // Try to fetch full details
        try {
            const res = await driverService.getDriverById(driver._id);
            setSelectedDriver(res?.data?.driver || driver);
        } catch {
            setSelectedDriver(driver);
        }
        setDrawerOpen(true);
    };

    const handleApprove = async (id) => {
        setActionLoading(id);
        try {
            const res = await driverService.approveDriver(id);
            if (res.status === 'success') {
                toast.success('Driver approved and activated');
                setDrivers(prev => prev.filter(d => d._id !== id));
                setDrawerOpen(false);
            }
        } catch (e) { toast.error(e.message || 'Approval failed'); }
        finally { setActionLoading(null); }
    };

    const handleRejectTrigger = (id) => {
        setRejectionModal({ isOpen: true, id, reason: '' });
        setDrawerOpen(false);
    };

    const executeRejection = async () => {
        if (!rejectionModal.reason.trim()) return toast.error('Please enter a rejection reason');
        setActionLoading(rejectionModal.id);
        try {
            const res = await driverService.rejectDriver(rejectionModal.id, rejectionModal.reason);
            if (res.status === 'success') {
                toast.success('Driver rejected');
                setDrivers(prev => prev.filter(d => d._id !== rejectionModal.id));
                setRejectionModal({ isOpen: false, id: null, reason: '' });
            }
        } catch (e) { toast.error(e.message || 'Rejection failed'); }
        finally { setActionLoading(null); }
    };

    const filtered = drivers.filter(d =>
        !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.phone?.includes(search) || d.driverId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-[1600px] mx-auto px-4 pb-20 space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-surface p-6 rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-soft">
                <div>
                    <h2 className="text-2xl font-black text-content tracking-tighter">Verification desk</h2>
                    <p className="text-[11px] font-black tracking-widest text-content-subtle opacity-60 uppercase mt-1">
                        {filtered.length} {loading ? 'loading...' : 'drivers pending review'}
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex-1 md:w-60 bg-background border border-slate-200 dark:border-white/10 rounded-xl px-4 flex items-center gap-3 transition-all focus-within:border-brand/40">
                        <Search size={14} className="text-content-subtle opacity-40" />
                        <input
                            type="text"
                            placeholder="Search by name, phone or ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-11 bg-transparent text-xs font-bold text-content outline-none"
                        />
                    </div>
                    <button onClick={fetchPending} className="h-11 w-11 bg-background border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center text-content-subtle hover:text-brand hover:border-brand/30 transition-all" title="Refresh">
                        <RefreshCw size={16} className={loading ? 'animate-spin text-brand' : ''} />
                    </button>
                </div>
            </header>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-surface rounded-[2rem] border border-slate-200/60 dark:border-white/5 p-6 animate-pulse">
                            <div className="flex gap-4 mb-5">
                                <div className="w-14 h-14 bg-slate-200 dark:bg-white/5 rounded-2xl flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-1/2" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-5">
                                {[1,2,3].map(j => <div key={j} className="h-16 bg-slate-200 dark:bg-white/5 rounded-xl" />)}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="h-11 bg-slate-200 dark:bg-white/5 rounded-xl" />
                                <div className="h-11 bg-slate-200 dark:bg-white/5 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-surface border border-slate-200/60 dark:border-white/5 rounded-[2rem]">
                    <ShieldCheck size={48} className="opacity-20 text-brand mb-4" />
                    <p className="text-sm font-black text-content">Queue emptied</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-content-subtle mt-2">All drivers have been processed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(driver => (
                        <motion.div
                            key={driver._id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-soft p-6 group hover:border-brand/20 dark:hover:border-yellow-500/20 transition-all"
                        >
                            {/* Driver Avatar + Name */}
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 overflow-hidden flex-shrink-0">
                                    {driver.documents?.selfie?.url ? (
                                        <img src={driver.documents.selfie.url} alt={driver.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><Camera size={20} className="opacity-20" /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-black text-content capitalize tracking-tight leading-none mb-1 truncate">{driver.name}</h3>
                                    <p className="text-xs font-bold text-content-subtle truncate">{driver.phone}</p>
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        <StatusBadge value={driver.verificationStatus} map={VERIFY_STATUS_MAP} />
                                        {driver.profile?.city && (
                                            <span className="text-[7px] font-bold text-content-subtle opacity-50 flex items-center gap-0.5">
                                                <MapPin size={9} />{driver.profile.city}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick doc grid */}
                            <div className="grid grid-cols-3 gap-2 mb-5">
                                <DocThumb url={driver.documents?.aadhaarCard?.frontUrl || driver.documents?.aadhaarCard?.url} label="Aadhaar" />
                                <DocThumb url={driver.documents?.drivingLicense?.url} label="Lic" />
                                <DocThumb url={driver.documents?.selfie?.url} label="Photo" />
                            </div>

                            {/* Status pills */}
                            <div className="flex flex-col gap-2 p-3.5 bg-background border border-slate-200/60 dark:border-white/5 rounded-2xl mb-5 space-y-1.5">
                                <div className="flex justify-between items-center text-[9px]">
                                    <span className="font-bold uppercase tracking-widest text-content-subtle opacity-60">Kit status</span>
                                    <StatusBadge value={driver.kitStatus} map={KIT_STATUS_MAP} />
                                </div>
                                <div className="flex justify-between items-center text-[9px]">
                                    <span className="font-bold uppercase tracking-widest text-content-subtle opacity-60">Police check</span>
                                    <StatusBadge value={driver.policeVerification} map={POLICE_STATUS_MAP} />
                                </div>
                                <div className="flex justify-between items-center text-[9px]">
                                    <span className="font-bold uppercase tracking-widest text-content-subtle opacity-60">Registered</span>
                                    <span className="font-black text-content">{driver.createdAt ? new Date(driver.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => openDrawer(driver)}
                                    className="h-11 col-span-1 rounded-xl flex items-center justify-center gap-1.5 bg-background border border-slate-200 dark:border-white/10 text-content-subtle text-[9px] font-black uppercase tracking-widest hover:border-brand/30 hover:text-brand transition-colors"
                                >
                                    <Eye size={12} /> View
                                </button>
                                <button
                                    onClick={() => setRejectionModal({ isOpen: true, id: driver._id, reason: '' })}
                                    className="h-11 rounded-xl flex items-center justify-center gap-1.5 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <Ban size={12} /> Reject
                                </button>
                                <button
                                    onClick={() => handleApprove(driver._id)}
                                    disabled={actionLoading === driver._id}
                                    className="h-11 rounded-xl flex items-center justify-center gap-1.5 bg-brand text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {actionLoading === driver._id ? <Loader2 size={12} className="animate-spin" /> : <><CheckCircle size={12} /> Ok</>}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Full Details Drawer */}
            <DriverDetailDrawer
                driver={selectedDriver}
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onApprove={handleApprove}
                onReject={handleRejectTrigger}
            />

            {/* Rejection Modal */}
            <AnimatePresence>
                {rejectionModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectionModal({ isOpen: false, id: null, reason: '' })} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-surface relative z-10 w-full max-w-md rounded-[2rem] p-8 border border-white/10 shadow-2xl"
                        >
                            <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-2xl border border-red-500/20 mx-auto mb-4">
                                <Ban size={20} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-content tracking-tighter mb-1 text-center">Reject driver</h3>
                            <p className="text-[10px] font-bold text-center text-content-subtle uppercase tracking-widest opacity-60 mb-6">This action will notify the driver.</p>
                            <textarea
                                value={rejectionModal.reason}
                                onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="State the reason for rejection (e.g. incomplete documents, invalid DL)..."
                                className="w-full h-28 bg-background border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold text-content outline-none focus:border-red-500/40 mb-4 resize-none shadow-inner"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setRejectionModal({ isOpen: false, id: null, reason: '' })}
                                    className="h-12 bg-background border border-slate-200 dark:border-white/10 text-content-subtle rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand/20 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!rejectionModal.reason.trim() || actionLoading}
                                    onClick={executeRejection}
                                    className="h-12 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all hover:bg-red-600 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : 'Confirm rejection'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DriverVerification;
