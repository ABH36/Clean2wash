import React, { useState } from 'react';
import {
    UserPlus, Search, Phone, User,
    ShieldCheck, Star, Trash2, Filter,
    CheckCircle2, Clock, MapPin, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';
import { useAuth } from '../../../context/AuthContext';

const VendorStaff = () => {
    const { getUser, register, registeredUsers, updateUser } = useAuth();
    const vendor = getUser('vendor') || {};

    // Get staff members associated with this vendor
    const staffList = (registeredUsers.staff || []).filter(s => s.vendorId === vendor?.id);

    const [searchPhone, setSearchPhone] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSearchStaff = (e) => {
        e.preventDefault();
        setError('');
        setSearchResult(null);

        if (searchPhone.length < 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setIsSearching(true);

        // Simulate search delay
        setTimeout(() => {
            // Check if user already exists as staff for this vendor
            const alreadyExists = staffList.find(s => s.phone === searchPhone);
            if (alreadyExists) {
                setError('This staff member is already in your team.');
                setIsSearching(false);
                return;
            }

            // Check if user exists in 'captain' or 'staff' overall registry
            const existingCaptain = (registeredUsers.captain || []).find(c => c.phone === searchPhone);
            const existingStaff = (registeredUsers.staff || []).find(s => s.phone === searchPhone && !s.vendorId);

            const foundUser = existingCaptain || existingStaff;

            if (foundUser) {
                setSearchResult(foundUser);
            } else {
                // If not found, we offer to "invite" or "create" a new entry
                setSearchResult({
                    name: 'New Personnel',
                    phone: searchPhone,
                    isNew: true
                });
            }
            setIsSearching(false);
        }, 800);
    };

    const handleAddStaff = () => {
        if (!searchResult) return;

        if (searchResult.isNew) {
            // Register as new staff
            const newStaff = {
                id: 'STF-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                name: 'Agent ' + searchPhone.slice(-4),
                phone: searchPhone,
                role: 'staff',
                vendorId: vendor.id,
                status: 'active',
                joinedAt: new Date().toISOString(),
                rating: 5.0,
                completedJobs: 0
            };
            register('staff', newStaff);
        } else {
            // Link existing user to this vendor
            const role = registeredUsers.captain?.find(c => c.id === searchResult.id) ? 'captain' : 'staff';
            updateUser(role, searchResult.id, { vendorId: vendor.id });
        }

        setShowSuccess(true);
        setSearchResult(null);
        setSearchPhone('');
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleRemoveStaff = (id) => {
        // Disconnect staff from vendor (don't delete user, just remove vendorId)
        updateUser('staff', id, { vendorId: null });
    };

    return (
        <VendorLayout title="Team Forge" subtitle="Onboard & manage your tactical cleaning agents">
            <div className="space-y-8">
                {/* Search / Add Section */}
                <div className="bg-surface rounded-[2.5rem] p-10 border border-gray-100/10 shadow-soft relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-2xl font-black text-content italic tracking-tighter uppercase mb-2">Deploy <span className="text-brand">New Staff</span></h2>
                        <p className="text-[11px] font-bold text-content-subtle uppercase tracking-widest mb-8">Onboard personnel via mobile number to assign service missions</p>

                        <form onSubmit={handleSearchStaff} className="flex gap-4">
                            <div className="flex-1 relative">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle" size={18} />
                                <input
                                    type="tel"
                                    placeholder="Enter Mobile Number (e.g. 9876543210)"
                                    value={searchPhone}
                                    onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className="w-full h-16 bg-background border border-gray-100/10 rounded-[1.5rem] pl-14 pr-6 text-sm font-bold text-content outline-none focus:border-brand transition-all font-mono"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="px-8 h-16 bg-content text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-xl shadow-content/20 hover:bg-brand transition-all flex items-center gap-2 group"
                            >
                                {isSearching ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Search Registry <Search size={16} className="group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                        </form>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="mt-3 text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl inline-block"
                            >
                                {error}
                            </motion.p>
                        )}
                    </div>

                    {/* Search Output */}
                    <AnimatePresence>
                        {searchResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mt-10 p-8 bg-background border border-gray-100/10 rounded-[2rem] flex items-center justify-between"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-surface border border-gray-100/10 rounded-2xl flex items-center justify-center text-brand">
                                        <User size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-content tracking-tight">{searchResult.name}</h3>
                                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest font-mono">Registry ID: {searchResult.id || 'N/A'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${searchResult.isNew ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                                                {searchResult.isNew ? 'Ready for Onboarding' : 'Existing System Agent'}
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
                                        onClick={handleAddStaff}
                                        className="h-12 px-8 bg-brand text-white rounded-xl font-black uppercase text-[10px] tracking-[0.1em] shadow-lg shadow-brand/20 flex items-center gap-2 hover:scale-105 transition-all"
                                    >
                                        <CheckCircle2 size={16} /> Link to My Studio
                                    </button>
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
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-content italic tracking-tighter uppercase leading-none">Studio <span className="text-brand">Roster</span></h3>
                            <p className="text-[10px] text-content-subtle font-bold uppercase tracking-widest mt-1">Active field agents & personnel</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="w-10 h-10 bg-surface border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted hover:text-brand transition-all">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {staffList.map((staff, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={staff.id}
                                className="bg-surface rounded-[2.5rem] border border-gray-100/10 p-8 shadow-soft space-y-6 group hover:border-brand/20 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center text-content-muted relative">
                                            <User size={22} />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-surface animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-content tracking-tight">{staff.name}</h4>
                                            <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest font-mono">{staff.phone}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveStaff(staff.id)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-content-subtle hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-background rounded-2xl p-4 border border-gray-100/5">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest italic mb-1">Status</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 bg-green-500 rounded-full" />
                                            <p className="text-[10px] font-black text-green-500 uppercase">Available</p>
                                        </div>
                                    </div>
                                    <div className="bg-background rounded-2xl p-4 border border-gray-100/5">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest italic mb-1">Rating</p>
                                        <div className="flex items-center gap-1.5">
                                            <Star size={10} className="text-yellow-500" fill="currentColor" />
                                            <p className="text-[10px] font-black text-content">{staff.rating || '5.0'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100/5">
                                    <div className="flex flex-col">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest">Completed Jobs</p>
                                        <p className="text-xs font-black text-content italic mt-0.5">{staff.completedJobs || 0} <span className="text-[9px] text-content-subtle uppercase tracking-tighter not-italic">Missions</span></p>
                                    </div>
                                    <button
                                        className="h-10 px-5 bg-background border border-gray-100/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-brand hover:text-brand transition-all flex items-center gap-2"
                                        onClick={() => alert('Assigning to jobs functionality can be extended from Fleet & Drivers section.')}
                                    >
                                        <Zap size={12} /> Assign Duty
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {staffList.length === 0 && (
                            <div className="col-span-full py-20 flex flex-col items-center gap-4 text-center bg-surface/50 border border-dashed border-gray-100/20 rounded-[3rem]">
                                <UserPlus size={40} className="text-content-subtle/10" />
                                <div>
                                    <h3 className="text-base font-black text-content italic uppercase tracking-tighter">No Active Agents</h3>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">Use the search registry above to build your team</p>
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
