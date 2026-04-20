import React, { useState, useEffect } from 'react';
import {
    UserPlus, Search, Phone, User,
    ShieldCheck, Star, Trash2, Filter,
    CheckCircle2, Clock, MapPin, Zap, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';
import { useAuth } from '../../../context/AuthContext';
import { vendorAPI } from '../../../utils/vendorApi';

const VendorStaff = () => {
    const { getUser } = useAuth();

    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchPhone, setSearchPhone] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [onboardForm, setOnboardForm] = useState({ name: '', phone: '', password: '' });
    const [isOnboarding, setIsOnboarding] = useState(false);

    const fetchStaff = async () => {
        try {
            const res = await vendorAPI.getStaff();
            if (res.status === 'success') {
                setStaffList(res.data.staff);
            }
        } catch (err) {
            console.error("Failed to fetch staff", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleSearchStaff = async (e) => {
        e.preventDefault();
        setError('');
        setSearchResult(null);
        setIsOnboarding(false);

        if (searchPhone.length < 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setIsSearching(true);

        try {
            // Check if already in list
            if (staffList.find(s => s.phone === searchPhone)) {
                setError('This staff member is already in your team.');
                setIsSearching(false);
                return;
            }

            const res = await vendorAPI.searchStaff(searchPhone);
            if (res.status === 'success') {
                setSearchResult(res.data.staff);
            }
        } catch (err) {
            if (err.status === 404) {
                // Not found - trigger onboarding flow
                setIsOnboarding(true);
                setOnboardForm({ ...onboardForm, phone: searchPhone });
            } else {
                setError(err.data?.message || 'Failed to query registry.');
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleLinkStaff = async () => {
        if (!searchResult) return;

        setIsSearching(true);
        try {
            const res = await vendorAPI.linkStaff(searchResult.phone);
            if (res.status === 'success') {
                setShowSuccess(true);
                setSearchResult(null);
                setSearchPhone('');
                fetchStaff();
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (err) {
            setError(err.data?.message || 'Failed to link personnel.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        if (!onboardForm.name) {
            setError('Please enter a name for the new agent');
            return;
        }

        setIsSearching(true);
        try {
            const res = await vendorAPI.createStaff(onboardForm);
            if (res.status === 'success') {
                setShowSuccess(true);
                setIsOnboarding(false);
                setSearchPhone('');
                setOnboardForm({ name: '', phone: '', password: '' });
                fetchStaff();
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (err) {
            setError(err.data?.message || 'Failed to onboard personnel.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleUnlinkStaff = async (id) => {
        try {
            await vendorAPI.unlinkStaff(id);
            fetchStaff();
        } catch (err) {
            console.error("Failed to unlink staff", err);
        }
    };

    return (
        <VendorLayout title="Team Forge" subtitle="Onboard & manage your tactical cleaning agents">
            <div className="space-y-8">
                {/* Search / Add Section */}
                <div className="bg-surface rounded-[2.5rem] p-10 border border-white/5/10 shadow-soft relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-2xl font-black text-content tracking-tighter uppercase mb-2">Deploy <span className="text-brand">New Staff</span></h2>
                        <p className="text-[11px] font-bold text-content-subtle uppercase tracking-widest mb-8">Onboard personnel via mobile number to assign service missions</p>

                        <form onSubmit={handleSearchStaff} className="flex gap-4">
                            <div className="flex-1 relative">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle" size={18} />
                                <input
                                    type="tel"
                                    placeholder="Enter Mobile Number (e.g. 9876543210)"
                                    value={searchPhone}
                                    onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className="w-full h-16 bg-background border border-white/5/10 rounded-[1.5rem] pl-14 pr-6 text-sm font-bold text-content outline-none focus:border-brand transition-all font-mono"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="px-8 h-16 bg-content text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-black/50 shadow-content/20 hover:bg-brand transition-all flex items-center gap-2 group"
                            >
                                {isSearching ? (
                                    <div className="w-5 h-5 border-white/5 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Search Registry <Search size={16} className="group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                        </form>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="mt-3 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl flex items-center gap-2"
                            >
                                <AlertTriangle size={14} className="text-red-500" />
                                <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Search Output / Onboarding Form */}
                    <AnimatePresence>
                        {searchResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mt-10 p-8 bg-background border border-white/5/10 rounded-[2rem] flex items-center justify-between"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-surface border border-white/5/10 rounded-2xl flex items-center justify-center text-brand">
                                        <User size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-content tracking-tight">{searchResult.name}</h3>
                                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest font-mono">Phone: {searchResult.phone}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-green-500/10 border-green-500/20 text-green-500">
                                                Registered Staff Member
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setSearchResult(null)}
                                        className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-content-subtle hover:text-content"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLinkStaff}
                                        disabled={isSearching}
                                        className="h-12 px-8 bg-brand text-white rounded-xl font-black uppercase text-[10px] tracking-[0.1em] shadow-lg shadow-brand/20 flex items-center gap-2 hover:scale-105 transition-all"
                                    >
                                        {isSearching ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Link to My Studio</>}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {isOnboarding && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mt-10 p-8 bg-background border border-brand/20 rounded-[2rem]"
                            >
                                <div className="flex flex-col md:flex-row gap-8 items-center">
                                    <div className="w-20 h-20 bg-brand/5 rounded-[2rem] flex items-center justify-center text-brand shrink-0">
                                        <UserPlus size={32} />
                                    </div>
                                    <div className="flex-1 space-y-4 w-full">
                                        <div>
                                            <h3 className="text-lg font-black text-content tracking-tight uppercase">Personnel <span className="text-brand">Not Found</span></h3>
                                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">Register this agent directly to your studio registry</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={onboardForm.name}
                                                onChange={e => setOnboardForm({ ...onboardForm, name: e.target.value })}
                                                className="h-14 bg-surface border border-white/5/10 rounded-xl px-4 text-[13px] font-bold text-content outline-none focus:border-brand transition-all"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Assign PIN (Optional, default 1234)"
                                                value={onboardForm.password}
                                                onChange={e => setOnboardForm({ ...onboardForm, password: e.target.value })}
                                                className="h-14 bg-surface border border-white/5/10 rounded-xl px-4 text-[13px] font-bold text-content outline-none focus:border-brand transition-all"
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={handleCreateStaff}
                                                disabled={isSearching}
                                                className="h-12 px-8 bg-brand text-white rounded-xl font-black uppercase text-[10px] tracking-[0.1em] shadow-lg shadow-brand/20 flex items-center gap-2 hover:scale-105 transition-all"
                                            >
                                                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <><Zap size={16} /> Quick Onboard</>}
                                            </button>
                                            <button
                                                onClick={() => setIsOnboarding(false)}
                                                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-content-subtle hover:text-content"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {showSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-600"
                        >
                            <ShieldCheck size={20} />
                            <span className="text-[11px] font-black uppercase tracking-widest">Personnel successfully commissioned to your studio team!</span>
                        </motion.div>
                    )}
                </div>

                {/* Team Roster */}
                <div className="space-y-6 pb-20 md:pb-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="pl-2">
                            <h3 className="text-xl font-black text-content tracking-tighter uppercase leading-none">Elite Studio <span className="text-brand">Registry</span></h3>
                            <p className="text-[10px] text-content-subtle font-bold uppercase tracking-widest mt-1.5 opacity-60">Active field operatives & tactical personnel</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="h-11 px-5 bg-surface border border-white/5/10 rounded-2xl flex items-center justify-center gap-2 text-content-subtle hover:text-brand transition-all ">
                                <Filter size={14} className="opacity-60" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Filter Agents</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full flex flex-col items-center gap-4 justify-center py-20 bg-white/[0.02]/5 rounded-[3rem] border border-white/5/5">
                                <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin shadow-lg shadow-brand/20" />
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em]">Accessing Personnel Registry...</p>
                            </div>
                        ) : staffList.map((staff, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={staff._id}
                                className="bg-surface rounded-[2.5rem] border border-white/5/10 p-7 md:p-8 shadow-soft space-y-7 group hover:border-brand/30 transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand/10 transition-colors" />

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-background border border-white/5/10 flex items-center justify-center text-content-muted relative shadow-inner">
                                            <User size={24} className="group-hover:text-brand transition-colors" />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-white/5 border-surface  animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-content tracking-tight uppercase leading-none mb-1.5">{staff.name || 'Agent'}</h4>
                                            <p className="text-[10px] font-black text-brand uppercase tracking-tighter opacity-80 font-mono">{staff.phone}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnlinkStaff(staff._id)}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-content-subtle bg-white/[0.02]/5 border border-white/5/5 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all opacity-0 group-hover:opacity-100 "
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 relative z-10">
                                    <div className="bg-background rounded-2xl p-4 border border-white/5/5 shadow-inner">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1.5 opacity-50">Logistics</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full  shadow-green-500/50" />
                                            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Active Duty</p>
                                        </div>
                                    </div>
                                    <div className="bg-background rounded-2xl p-4 border border-white/5/5 shadow-inner">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1.5 opacity-50">Tactical Grade</p>
                                        <div className="flex items-center gap-1.5">
                                            <Star size={10} className="text-yellow-500" fill="currentColor" />
                                            <p className="text-[11px] font-black text-content">{staff.rating || '5.0'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-5 border-t border-white/5/5 relative z-10">
                                    <div className="flex flex-col">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-0.5 opacity-50">Operation Count</p>
                                        <p className="text-sm font-black text-content leading-none">{staff.completedJobs || 0} <span className="text-[9px] text-content-subtle uppercase tracking-tighter opacity-40">Tactical Ops</span></p>
                                    </div>
                                    <button
                                        className="h-11 px-5 bg-background border border-white/5/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-brand hover:text-brand hover:shadow-lg hover:shadow-brand/5 transition-all flex items-center gap-2 group active:scale-[0.97]"
                                    >
                                        <Zap size={12} className="group-hover:fill-current" /> Assign Ops
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {!loading && staffList.length === 0 && (
                            <div className="col-span-full py-24 flex flex-col items-center gap-6 text-center bg-white/[0.02]/5 border border-dashed border-white/5/20 rounded-[3.5rem] shadow-inner">
                                <div className="w-20 h-20 bg-background rounded-[2rem] flex items-center justify-center text-content-subtle/10 border border-white/5/10">
                                    <UserPlus size={36} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-content uppercase tracking-tighter">Registry Depleted</h3>
                                    <p className="text-[11px] font-bold text-content-subtle uppercase tracking-widest mt-1 opacity-60">Use the tactical search above to deploy field agents</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorStaff;
