import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Eye, Clock, Filter, RefreshCw, User, Phone, Mail } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { toast } from 'react-hot-toast';

const STATUS_CONFIG = {
    onboarding: { label: 'Onboarding', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-400' },
    pending_verification: { label: 'Pending', color: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-400' },
    active: { label: 'Active', color: 'bg-green-50 text-green-700', dot: 'bg-green-400' },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
    suspended: { label: 'Suspended', color: 'bg-gray-50 text-gray-600', dot: 'bg-gray-400' },
};

const AdminSpareDrivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selected, setSelected] = useState(null); // driver being reviewed
    const [actionNote, setActionNote] = useState('');
    const [actioning, setActioning] = useState(false);

    const fetchDrivers = async (status = filter) => {
        setLoading(true);
        try {
            const res = await spareDriverAPI.adminGetDrivers(status || undefined);
            setDrivers(res.data.drivers);
        } catch (err) {
            console.error('Failed to fetch drivers:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDrivers(); }, []);

    const handleVerify = async (status) => {
        setActioning(true);
        try {
            await spareDriverAPI.adminVerifyDriver(selected._id, status, actionNote);
            setSelected(null);
            fetchDrivers();
            toast.success(`Driver status updated to ${status}`);
        } catch (err) {
            toast.error('Action failed: ' + err.message);
        } finally {
            setActioning(false);
        }
    };

    const pendingCount = drivers.filter(d => d.status === 'pending_verification').length;

    return (
        <AdminLayout title="Spare Driver Verification">
            <div className="space-y-6">

                {/* ── Stats Bar ── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => { setFilter(key); fetchDrivers(key); }}
                            className={`p-4 bg-white border rounded-lg text-left transition-all hover:shadow-sm ${filter === key ? 'border-brand' : 'border-gray-100'}`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">{cfg.label}</span>
                            </div>
                            <p className="text-xl font-black text-black">
                                {drivers.filter(d => d.status === key).length}
                            </p>
                        </button>
                    ))}
                </div>

                {/* ── Toolbar ── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <select
                            value={filter}
                            onChange={e => { setFilter(e.target.value); fetchDrivers(e.target.value); }}
                            className="h-9 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black uppercase outline-none"
                        >
                            <option value="">All Drivers</option>
                            <option value="pending_verification">Pending Review</option>
                            <option value="active">Active</option>
                            <option value="rejected">Rejected</option>
                            <option value="onboarding">Onboarding</option>
                        </select>
                        {pendingCount > 0 && (
                            <span className="px-2.5 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase rounded-md">
                                {pendingCount} need review
                            </span>
                        )}
                    </div>
                    <button onClick={() => fetchDrivers()} className="flex items-center gap-2 h-9 px-4 border border-gray-200 rounded-md text-[10px] font-black text-black/50 uppercase hover:border-black hover:text-black transition-colors">
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>

                {/* ── Drivers Table ── */}
                <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                        <span className="col-span-4 text-[9px] font-black text-black/30 uppercase tracking-widest">Driver</span>
                        <span className="col-span-3 text-[9px] font-black text-black/30 uppercase tracking-widest">Contact</span>
                        <span className="col-span-2 text-[9px] font-black text-black/30 uppercase tracking-widest">Status</span>
                        <span className="col-span-2 text-[9px] font-black text-black/30 uppercase tracking-widest">Docs</span>
                        <span className="col-span-1 text-[9px] font-black text-black/30 uppercase tracking-widest">Action</span>
                    </div>

                    {loading ? (
                        <div className="py-16 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                        </div>
                    ) : drivers.length === 0 ? (
                        <div className="py-16 text-center">
                            <User size={32} className="mx-auto text-black/10 mb-3" />
                            <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">No drivers found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {drivers.map(driver => {
                                const cfg = STATUS_CONFIG[driver.status] || STATUS_CONFIG.onboarding;
                                const docsCount = [
                                    driver.documents?.aadhaarCard?.url,
                                    driver.documents?.drivingLicense?.url,
                                    driver.documents?.selfie?.url,
                                ].filter(Boolean).length;

                                return (
                                    <div key={driver._id} className="grid grid-cols-12 px-5 py-4 items-center hover:bg-gray-50/50 transition-colors">
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black/30">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-black uppercase">{driver.name}</p>
                                                <p className="text-[8px] font-bold text-black/25 uppercase mt-0.5">
                                                    {new Date(driver.createdAt).toLocaleDateString('en-IN')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="col-span-3">
                                            <p className="text-[10px] font-black text-black/60">{driver.phone}</p>
                                            <p className="text-[9px] font-bold text-black/25 truncate">{driver.email}</p>
                                        </div>

                                        <div className="col-span-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-black uppercase ${cfg.color}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                {cfg.label}
                                            </span>
                                        </div>

                                        <div className="col-span-2">
                                            <span className={`text-[10px] font-black ${docsCount === 3 ? 'text-green-600' : 'text-black/30'}`}>
                                                {docsCount}/3 uploaded
                                            </span>
                                        </div>

                                        <div className="col-span-1">
                                            <button
                                                onClick={() => { setSelected(driver); setActionNote(''); }}
                                                className="flex items-center gap-1 text-[9px] font-black text-black/40 uppercase hover:text-black transition-colors"
                                            >
                                                <Eye size={13} /> Review
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Review Modal ── */}
                {selected && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
                        <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden shadow-2xl">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Driver Review</p>
                                    <h3 className="text-lg font-black text-black uppercase">{selected.name}</h3>
                                </div>
                                <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase ${STATUS_CONFIG[selected.status]?.color}`}>
                                    {STATUS_CONFIG[selected.status]?.label}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="px-6 py-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="border border-gray-100 rounded-md p-3">
                                        <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Phone</p>
                                        <p className="text-[11px] font-black text-black">{selected.phone}</p>
                                    </div>
                                    <div className="border border-gray-100 rounded-md p-3">
                                        <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Email</p>
                                        <p className="text-[10px] font-black text-black truncate">{selected.email}</p>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div>
                                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Documents</p>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Aadhaar Card', url: selected.documents?.aadhaarCard?.url },
                                            { label: 'Driving License', url: selected.documents?.drivingLicense?.url },
                                            { label: 'Live Selfie', url: selected.documents?.selfie?.url },
                                        ].map(({ label, url }) => (
                                            <div key={label} className="flex items-center justify-between px-3 py-2.5 border border-gray-100 rounded-md">
                                                <span className="text-[10px] font-black text-black uppercase">{label}</span>
                                                {url
                                                    ? <a href={url} target="_blank" rel="noreferrer" className="text-[9px] font-black text-brand uppercase underline">View</a>
                                                    : <span className="text-[9px] font-black text-black/20 uppercase">Not uploaded</span>
                                                }
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Note */}
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Admin Note (optional)</label>
                                    <textarea
                                        rows={2}
                                        value={actionNote}
                                        onChange={e => setActionNote(e.target.value)}
                                        placeholder="Reason for rejection or any note..."
                                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-[11px] font-bold text-black resize-none outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 pb-5 grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setSelected(null)}
                                    className="h-10 border border-gray-200 text-black/40 text-[10px] font-black uppercase rounded-md hover:border-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleVerify('rejected')}
                                    disabled={actioning}
                                    className="h-10 bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <XCircle size={13} /> Reject
                                </button>
                                <button
                                    onClick={() => handleVerify('active')}
                                    disabled={actioning}
                                    className="h-10 bg-black text-white text-[10px] font-black uppercase rounded-md flex items-center justify-center gap-1.5 hover:bg-brand hover:text-black transition-colors"
                                >
                                    <CheckCircle2 size={13} /> Approve
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminSpareDrivers;
