import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, FileText, CheckCircle2, AlertCircle, Loader2, Power } from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { toast } from 'react-hot-toast';

const STATUS_CONFIG = {
    pending_docs: { label: 'Pending Docs', color: 'bg-blue-50 text-blue-600', icon: <AlertCircle size={14} /> },
    pending_verification: { label: 'Pending Review', color: 'bg-yellow-50 text-yellow-700', icon: <Loader2 size={14} className="animate-spin" /> },
    active: { label: 'Active', color: 'bg-green-50 text-green-700', icon: <CheckCircle2 size={14} /> },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-600', icon: <AlertCircle size={14} /> },
    suspended: { label: 'Suspended', color: 'bg-gray-50 text-gray-600', icon: <AlertCircle size={14} /> },
};

const DriverProfile = () => {
    const [loading, setLoading] = useState(true);
    const [driver, setDriver] = useState(null);
    const [toggling, setToggling] = useState(false);

    const fetchProfile = async () => {
        try {
            const res = await spareDriverAPI.getProfile();
            setDriver(res?.data?.driver);
        } catch (err) {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleToggleOnline = async () => {
        setToggling(true);
        try {
            const newStatus = !driver.isOnline;
            await spareDriverAPI.toggleOnline(newStatus);
            setDriver({ ...driver, isOnline: newStatus });
            toast.success(`You are now ${newStatus ? 'Online' : 'Offline'}`);
        } catch (err) {
            toast.error("Failed to update status");
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <DriverLayout title="Profile">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 size={24} className="animate-spin text-[#F29F05]" />
                </div>
            </DriverLayout>
        );
    }

    const status = STATUS_CONFIG[driver?.status] || STATUS_CONFIG.pending_docs;

    return (
        <DriverLayout title="Profile">
            <div className="px-5 py-6 space-y-6">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center text-[#F29F05]">
                            <User size={32} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-black uppercase leading-none mb-1.5">{driver?.name}</h2>
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase ${status.color}`}>
                                {status.icon} {status.label}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Online Toggle ── */}
                <div className={`p-5 rounded-lg border transition-all ${driver?.isOnline ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[10px] font-black text-black uppercase tracking-widest">Duty Status</p>
                            <p className="text-[9px] font-bold text-black/40 uppercase mt-0.5">
                                {driver?.isOnline ? 'You are receiving new bookings' : 'You are currently offline'}
                            </p>
                        </div>
                        <button
                            onClick={handleToggleOnline}
                            disabled={toggling || driver?.status !== 'active'}
                            className={`w-12 h-6 rounded-full p-1 transition-all flex ${driver?.isOnline ? 'bg-green-600 justify-end' : 'bg-gray-300 justify-start'}`}
                        >
                            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black text-black/60 uppercase">
                        <Power size={12} className={driver?.isOnline ? 'text-green-600' : ''} />
                        {driver?.isOnline ? 'Active on Map' : 'Hidden from Consumers'}
                    </div>
                </div>

                {/* ── Personal Info ── */}
                <div className="space-y-3">
                    <p className="text-[9px] font-black text-black/25 uppercase tracking-widest px-1">Identity Details</p>
                    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm divide-y divide-gray-50">
                        <div className="px-4 py-3.5 flex items-center gap-3">
                            <Mail size={16} className="text-black/30" />
                            <div>
                                <p className="text-[8px] font-black text-black/25 uppercase mb-0.5">Email Address</p>
                                <p className="text-[11px] font-black text-black">{driver?.email}</p>
                            </div>
                        </div>
                        <div className="px-4 py-3.5 flex items-center gap-3">
                            <Phone size={16} className="text-black/30" />
                            <div>
                                <p className="text-[8px] font-black text-black/25 uppercase mb-0.5">Phone Number</p>
                                <p className="text-[11px] font-black text-black">{driver?.phone}</p>
                            </div>
                        </div>
                        <div className="px-4 py-3.5 flex items-center gap-3">
                            <Shield size={16} className="text-black/30" />
                            <div>
                                <p className="text-[8px] font-black text-black/25 uppercase mb-0.5">Driver ID</p>
                                <p className="text-[11px] font-black text-black">{driver?._id?.slice(-12)?.toUpperCase() || '--'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Documents ── */}
                <div className="space-y-3">
                    <p className="text-[9px] font-black text-black/25 uppercase tracking-widest px-1">Compliance Documents</p>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { label: 'Aadhaar Card', url: driver?.documents?.aadhaarCard?.url },
                            { label: 'Driving License', url: driver?.documents?.drivingLicense?.url },
                            { label: 'Live Selfie', url: driver?.documents?.selfie?.url }
                        ].map((doc, i) => (
                            <div key={i} className="bg-white border border-black/[0.04] rounded-[1.35rem] p-3.5 flex items-center justify-between shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                                <div className="flex items-center gap-3">
                                    <FileText size={16} className="text-[#F29F05]" />
                                    <span className="text-[10px] font-black text-black uppercase uppercase tracking-wide">{doc.label}</span>
                                </div>
                                {doc.url ? (
                                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-[9px] font-black text-[#F29F05] uppercase border-b border-[#F29F05]">
                                        View File
                                    </a>
                                ) : (
                                    <span className="text-[9px] font-black text-black/20 uppercase">Missing</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Logout ── */}
                <button
                    onClick={() => {
                        spareDriverAPI.clearToken();
                        window.location.href = '/spare-driver/register';
                    }}
                    className="w-full h-12 border border-black text-black text-[10px] font-black uppercase tracking-widest rounded-[1.15rem] active:scale-95 transition-all mt-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)] bg-white"
                >
                    Logout Account
                </button>

            </div>
        </DriverLayout>
    );
};

export default DriverProfile;
