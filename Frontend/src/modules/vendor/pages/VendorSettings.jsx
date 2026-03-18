import React, { useState, useEffect } from 'react';
import { vendorAPI } from '../../../utils/vendorApi';
import { toast } from 'react-hot-toast';
import {
    User, Store, CreditCard, Shield,
    Bell, Save, CheckCircle2, Clock, AlertCircle, Eye, FileText, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';

const SECTIONS = [
    { id: 'Profile', label: 'Studio Profile', sub: 'Master identity', icon: Store },
    { id: 'Verification', label: 'Identity Proof', sub: 'Security & Trust', icon: Shield },
    { id: 'Payments', label: 'Payout Settings', sub: 'Bank & Wallet', icon: CreditCard },
    { id: 'Notifications', label: 'Alert Config', sub: 'Tactical updates', icon: Bell }
];

const VendorSettings = () => {
    const [vendor, setVendor] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('Profile');
    const [form, setForm] = useState({
        studioName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        notifications: {
            email: true,
            sms: true
        }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await vendorAPI.getProfile();
                if (res.status === 'success') {
                    const v = res.data.vendor;
                    setVendor(v);
                    setForm({
                        studioName: v.profile?.studioName || '',
                        phone: v.phone || '',
                        email: v.email || '',
                        address: v.profile?.address?.street || '',
                        city: v.profile?.city || '',
                        notifications: v.profile?.notifications || { email: true, sms: true }
                    });
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await vendorAPI.updateProfile({
                phone: form.phone,
                email: form.email,
                'profile.studioName': form.studioName,
                'profile.address.street': form.address,
                'profile.city': form.city,
                'profile.notifications': form.notifications
            });
            if (res.status === 'success') {
                toast.success('Profile updated successfully');
            }
        } catch (err) {
            console.error('Failed to update profile', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <VendorLayout
            title="Studio Configurations"
            subtitle="Manage your business identity"
        >

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Settings Sidebar */}
                <aside className="w-full lg:w-72 space-y-2">
                    {SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left ${activeSection === section.id
                                ? 'bg-surface border-brand shadow-lg shadow-brand/10'
                                : 'bg-transparent border-transparent hover:bg-surface hover:border-gray-100/10'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeSection === section.id ? 'bg-brand text-white' : 'bg-background text-content-muted border border-gray-100/10'}`}>
                                <section.icon size={18} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-black tracking-tight ${activeSection === section.id ? 'text-content' : 'text-content-muted'}`}>{section.label}</p>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">{section.sub}</p>
                            </div>
                        </button>
                    ))}
                </aside>

                {/* Settings Form */}
                <div className="flex-1 bg-surface rounded-[2rem] border border-gray-100/10 shadow-soft p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-content italic tracking-tight">{activeSection} Settings</h2>
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mt-1">Updates reflect across the customer app</p>
                        </div>
                        {activeSection === 'Profile' && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-brand text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand/20 flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save size={16} /> Save Changes</>}
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="w-10 h-10 text-brand animate-spin" />
                        </div>
                    ) : activeSection === 'Verification' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-background rounded-[2rem] p-8 border border-gray-100/10 flex flex-col md:flex-row items-center gap-8">
                                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl ${(vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified') ? 'bg-green-500 text-white shadow-green-500/20' :
                                    (vendor.profile?.verificationStatus === 'rejected' || vendor.verificationStatus === 'rejected') ? 'bg-red-500 text-white shadow-red-500/20' :
                                        'bg-brand text-white shadow-brand/20'
                                    }`}>
                                    {(vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified') ? <CheckCircle2 size={40} /> :
                                        (vendor.profile?.verificationStatus === 'rejected' || vendor.verificationStatus === 'rejected') ? <AlertCircle size={40} /> : <Clock size={40} />}
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-2 italic">Official Registry Status</p>
                                    <h3 className="text-3xl font-black text-content italic leading-none uppercase tracking-tighter">
                                        {(vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified') ? 'Identity Verified' :
                                            (vendor.profile?.verificationStatus === 'rejected' || vendor.verificationStatus === 'rejected') ? 'Clearance Rejected' : 'Verification Pending'}
                                    </h3>
                                    <p className="text-[11px] font-bold text-content-subtle uppercase mt-3 tracking-widest">
                                        {(vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified') ? 'Your studio is fully cleared for all marketplace operations.' :
                                            (vendor.profile?.verificationStatus === 'rejected' || vendor.verificationStatus === 'rejected') ? 'Discrepancies found in your documentation. Please re-apply.' :
                                                'Our tactical team is currently auditing your submitted documents.'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-background border border-gray-100/10 rounded-[2rem] p-6 shadow-sm">
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-4 italic flex items-center gap-2">
                                        <FileText size={14} className="text-brand" /> Document Registry
                                    </p>
                                    <div className="aspect-video bg-surface rounded-2xl overflow-hidden border border-gray-100/10 group relative">
                                        <img src={vendor.profile?.idProof} alt="ID Proof" className="w-full h-full object-cover opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => window.open(vendor.profile?.idProof, '_blank')}
                                                className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 text-black"
                                            >
                                                <Eye size={14} /> View Document
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest mt-4 text-center">Submitted on: {new Date(vendor.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="bg-background border border-gray-100/10 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-4 italic flex items-center gap-2">
                                            <Shield size={14} className="text-brand" /> Operational Limits
                                        </p>
                                        <ul className="space-y-3">
                                            {[
                                                { label: 'Marketplace Listing', ok: vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified' },
                                                { label: 'Revenue Withdrawals', ok: vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified' },
                                                { label: 'Booking Management', ok: vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified' },
                                                { label: 'Fleet Integration', ok: vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified' }
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    {item.ok ? <CheckCircle2 size={14} className="text-green-500" /> : <Clock size={14} className="text-orange-400" />}
                                                    <span className={`text-[11px] font-bold uppercase tracking-tight ${item.ok ? 'text-content' : 'text-content-subtle'}`}>{item.label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="relative mt-6">
                                        <input
                                            type="file"
                                            className="hidden"
                                            id="id-upload"
                                            accept="image/*,.pdf"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = async () => {
                                                        setSaving(true);
                                                        try {
                                                            const res = await vendorAPI.updateProfile({
                                                                'profile.idProof': reader.result
                                                            });
                                                            if (res.status === 'success') {
                                                                setVendor(res.data.vendor);
                                                                toast.success('ID Proof uploaded for re-verification');
                                                            }
                                                        } catch (err) {
                                                            console.error('Upload failed', err);
                                                            toast.error('Upload failed. Please try again.');
                                                        } finally {
                                                            setSaving(false);
                                                        }
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="id-upload"
                                            className="w-full py-3 bg-surface border border-gray-100/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-content-subtle hover:text-brand transition-colors flex items-center justify-center cursor-pointer"
                                        >
                                            {saving ? <Loader2 size={12} className="animate-spin" /> : 'Re-upload Documents'}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeSection === 'Payments' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-background rounded-[2rem] p-8 border border-gray-100/10">
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-3">Available Balance</p>
                                <h3 className="text-4xl font-black text-content italic">₹{vendor.wallet?.balance?.toLocaleString('en-IN') || '0'}.<span className="text-brand">00</span></h3>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-4">Synced with Financial Forge</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-background rounded-3xl border border-gray-100/10">
                                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-1 opacity-60">Settlement Method</p>
                                    <p className="text-sm font-black text-content uppercase italic tracking-tighter">Bank Transfer (IMPS/NEFT)</p>
                                </div>
                                <div className="p-6 bg-background rounded-3xl border border-gray-100/10">
                                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-1 opacity-60">Processing Time</p>
                                    <p className="text-sm font-black text-content uppercase italic tracking-tighter">24 - 48 Tactical Hours</p>
                                </div>
                            </div>
                        </div>
                    ) : activeSection === 'Notifications' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {[
                                { id: 'email', label: 'Email Tactical Alerts', sub: 'Receive order updates via registered email' },
                                { id: 'sms', label: 'SMS Response Unit', sub: 'Critical alerts delivered to mobile' }
                            ].map((opt) => (
                                <div key={opt.id} className="flex items-center justify-between p-6 bg-background rounded-3xl border border-gray-100/10">
                                    <div>
                                        <p className="text-[13px] font-black text-content tracking-tight">{opt.label}</p>
                                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">{opt.sub}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newNotifs = { ...form.notifications, [opt.id]: !form.notifications[opt.id] };
                                            setForm({ ...form, notifications: newNotifs });
                                        }}
                                        className={`w-14 h-8 rounded-full relative transition-all duration-300 ${form.notifications?.[opt.id] ? 'bg-brand' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 ${form.notifications?.[opt.id] ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            ))}
                            <div className="pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full h-14 bg-brand text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Preferences'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest block italic">Studio Name</label>
                                <input
                                    type="text"
                                    value={form.studioName}
                                    onChange={e => setForm({ ...form, studioName: e.target.value })}
                                    className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-4 text-[13px] font-bold text-content outline-none focus:border-brand transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest block italic">Primary Contact</label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-4 text-[13px] font-bold text-content outline-none focus:border-brand transition-all font-mono"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-2 block italic">Studio Address</label>
                                <textarea
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    className="w-full bg-background border border-gray-100/10 rounded-2xl p-4 text-[13px] font-bold text-content outline-none focus:border-brand transition-all resize-none h-32"
                                    placeholder="Enter physical studio location"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest block italic">Operating City</label>
                                <input
                                    type="text"
                                    value={form.city}
                                    onChange={e => setForm({ ...form, city: e.target.value })}
                                    className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-4 text-[13px] font-bold text-content outline-none focus:border-brand transition-all"
                                    placeholder="e.g. Noida, Delhi"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest block italic">Platform Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-4 text-[13px] font-bold text-content outline-none focus:border-brand transition-all"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </VendorLayout >
    );
};


export default VendorSettings;
