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

            <div className="flex flex-col lg:flex-row gap-8 pb-24 lg:pb-0">
                {/* Settings Sidebar */}
                <aside className="w-full lg:w-80 flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 gap-3 scrollbar-hide">
                    {SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex-shrink-0 lg:flex-shrink flex items-center gap-4 p-5 rounded-[2rem] border transition-all duration-300 text-left relative overflow-hidden group ${activeSection === section.id
                                ? 'bg-surface border-brand shadow-xl shadow-brand/10 ring-1 ring-brand/20'
                                : 'bg-surface/40 border-gray-100/5 hover:border-gray-100/20'
                                }`}
                        >
                            {activeSection === section.id && (
                                <motion.div layoutId="activeBG" className="absolute left-0 w-1.5 h-full bg-brand" />
                            )}
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${activeSection === section.id ? 'bg-brand text-white rotate-6' : 'bg-background text-content-subtle border border-gray-100/10'}`}>
                                <section.icon size={20} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 pr-4">
                                <p className={`text-[13px] font-black tracking-tighter uppercase leading-none mb-1.5 ${activeSection === section.id ? 'text-content' : 'text-content-muted'}`}>{section.label}</p>
                                <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-60 truncate">{section.sub}</p>
                            </div>
                        </button>
                    ))}
                </aside>

                {/* Settings Form */}
                <div className="flex-1 bg-surface rounded-[3rem] border border-gray-100/10 shadow-soft p-6 md:p-10 space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div>
                            <h2 className="text-2xl font-black text-content tracking-tighter uppercase leading-none mb-2">{activeSection} <span className="text-brand">Protocol</span></h2>
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] opacity-60">System-wide operational adjustments</p>
                        </div>
                        {activeSection === 'Profile' && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="h-12 px-8 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand/20 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save size={16} strokeWidth={2.5} /> Update Registry</>}
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="py-32 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin shadow-lg shadow-brand/20" />
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.4em] leading-none">Accessing Central Data...</p>
                        </div>
                    ) : activeSection === 'Verification' ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                            <div className="bg-background/80 backdrop-blur-sm rounded-[2.5rem] p-8 md:p-12 border border-gray-100/10 flex flex-col md:flex-row items-center gap-10 shadow-inner group">
                                <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105 duration-500 ${(vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified') ? 'bg-green-500 text-white shadow-green-500/20' :
                                    (vendor.profile?.verificationStatus === 'rejected' || vendor.verificationStatus === 'rejected') ? 'bg-red-500 text-white shadow-red-500/20' :
                                        'bg-brand text-white shadow-brand/20'
                                    }`}>
                                    {(vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified') ? <CheckCircle2 size={56} strokeWidth={1} /> :
                                        (vendor.profile?.verificationStatus === 'rejected' || vendor.verificationStatus === 'rejected') ? <AlertCircle size={56} strokeWidth={1} /> : <Clock size={56} strokeWidth={1} />}
                                </div>
                                <div className="text-center md:text-left space-y-3">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 rounded-full border border-brand/20">
                                        <Shield size={12} className="text-brand" />
                                        <p className="text-[9px] font-black text-brand uppercase tracking-[0.2em]">Official Audit Trail</p>
                                    </div>
                                    <h3 className="text-4xl font-black text-content leading-none uppercase tracking-tighter">
                                        {(vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified') ? 'Identity Verified' :
                                            (vendor.profile?.verificationStatus === 'rejected' || vendor.verificationStatus === 'rejected') ? 'Clearance Denied' : 'Audit In Progress'}
                                    </h3>
                                    <p className="text-xs font-black text-content-subtle uppercase tracking-[0.1em] leading-relaxed max-w-md opacity-60">
                                        {(vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified') ? 'Proprietary studio clearance achieved. All marketplace channels are active.' :
                                            (vendor.profile?.verificationStatus === 'rejected' || vendor.verificationStatus === 'rejected') ? 'Critical discrepancies detected in tactical registry. Please re-submit credentials.' :
                                                'Central intelligence is currently auditing your operational documentation. Stay on standby.'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-background/40 backdrop-blur-sm border border-gray-100/10 rounded-[2.5rem] p-8 shadow-inner group/card">
                                    <p className="text-[10px] font-black text-content uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                        <FileText size={16} className="text-brand" /> Registry Proof
                                    </p>
                                    <div className="aspect-[4/3] bg-surface rounded-[2rem] overflow-hidden border border-gray-100/10 group relative shadow-2xl">
                                        <img src={vendor.profile?.idProof} alt="ID Proof" className="w-full h-full object-cover opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 active:scale-110" />
                                        <div className="absolute inset-0 bg-brand/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6">
                                            <button
                                                onClick={() => window.open(vendor.profile?.idProof, '_blank')}
                                                className="w-full h-14 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                                            >
                                                <Eye size={18} /> Inspect Asset
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex items-center justify-center gap-2 py-3 bg-surface/50 rounded-xl border border-gray-100/5">
                                        <Clock size={12} className="text-content-subtle/40" />
                                        <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest opacity-40">Submitted: {new Date(vendor.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="bg-background/40 backdrop-blur-sm border border-gray-100/10 rounded-[2.5rem] p-8 shadow-inner flex flex-col justify-between">
                                    <div className="space-y-8">
                                        <p className="text-[10px] font-black text-content uppercase tracking-[0.3em] flex items-center gap-3">
                                            <Shield size={16} className="text-brand" /> Operational Clearance
                                        </p>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Marketplace Dominance', ok: vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified' },
                                                { label: 'Revenue Extractions', ok: vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified' },
                                                { label: 'Tactical Dispatch', ok: vendor.profile?.verificationStatus === 'verified' || vendor.verificationStatus === 'verified' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-surface/30 rounded-2xl border border-gray-100/5">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${item.ok ? 'text-content' : 'text-content-subtle'}`}>{item.label}</span>
                                                    {item.ok ? (
                                                        <div className="w-6 h-6 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center text-green-500">
                                                            <CheckCircle2 size={14} strokeWidth={3} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-6 h-6 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-500">
                                                            <Clock size={14} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative mt-10">
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
                                                                toast.success('Credentials uploaded for audit');
                                                            }
                                                        } catch (err) {
                                                            console.error('Upload failed', err);
                                                            toast.error('Tactical failure during upload.');
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
                                            className="w-full h-14 bg-surface border border-brand/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand hover:bg-brand hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                                        >
                                            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Re-Submit Credentials'}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeSection === 'Payments' ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                            <div className="bg-background/60 backdrop-blur-sm rounded-[3rem] p-10 md:p-14 border border-gray-100/10 relative overflow-hidden group">
                                <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand/5 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.4em] mb-4 opacity-60">Liquid Asset Balance</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-content opacity-30">₹</span>
                                    <h3 className="text-6xl font-black text-content tracking-tighter leading-none">{vendor.wallet?.balance?.toLocaleString('en-IN') || '0'}<span className="text-brand opacity-60">.00</span></h3>
                                </div>
                                <div className="mt-10 inline-flex items-center gap-3 px-5 py-2.5 bg-brand/10 border border-brand/20 rounded-2xl">
                                    <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">Secured by Financial Ledger</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 bg-background/40 backdrop-blur-sm rounded-[2.5rem] border border-gray-100/10 shadow-inner group hover:border-brand/30 transition-all">
                                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.3em] mb-3 opacity-60">Settlement Method</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
                                            <CreditCard size={18} strokeWidth={2.5} />
                                        </div>
                                        <p className="text-base font-black text-content uppercase tracking-tighter">Bank Wire <span className="text-brand">(IMPS)</span></p>
                                    </div>
                                </div>
                                <div className="p-8 bg-background/40 backdrop-blur-sm rounded-[2.5rem] border border-gray-100/10 shadow-inner group hover:border-brand/30 transition-all">
                                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.3em] mb-3 opacity-60">Liquidity Window</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
                                            <Clock size={18} strokeWidth={2.5} />
                                        </div>
                                        <p className="text-base font-black text-content uppercase tracking-tighter">Instant <span className="opacity-40">Extractions</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeSection === 'Notifications' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                            {[
                                { id: 'email', label: 'Tactical Email Logs', sub: 'Master dispatch and audit records via email', icon: FileText },
                                { id: 'sms', label: 'SMS Response Unit', sub: 'Critical field alerts delivered to mobile', icon: Bell }
                            ].map((opt) => (
                                <div key={opt.id} className="flex items-center justify-between p-8 bg-background/40 backdrop-blur-sm rounded-[2.5rem] border border-gray-100/10 shadow-inner group">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${form.notifications?.[opt.id] ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-surface/50 text-content-subtle border border-gray-100/5'}`}>
                                            <opt.icon size={24} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-content tracking-tighter uppercase leading-none mb-2">{opt.label}</p>
                                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-60">{opt.sub}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newNotifs = { ...form.notifications, [opt.id]: !form.notifications[opt.id] };
                                            setForm({ ...form, notifications: newNotifs });
                                        }}
                                        className={`w-16 h-9 rounded-full relative transition-all duration-500 shadow-inner ${form.notifications?.[opt.id] ? 'bg-brand shadow-brand/40' : 'bg-white/5'}`}
                                    >
                                        <div className={`absolute top-1.5 w-6 h-6 rounded-full bg-white shadow-2xl transition-all duration-500 flex items-center justify-center ${form.notifications?.[opt.id] ? 'left-8.5' : 'left-1.5'}`}>
                                            <div className={`w-1 h-1 rounded-full ${form.notifications?.[opt.id] ? 'bg-brand' : 'bg-gray-200'}`} />
                                        </div>
                                    </button>
                                </div>
                            ))}
                            <div className="pt-6">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full h-16 bg-content text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-content/20 flex items-center justify-center gap-4 hover:bg-brand transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} strokeWidth={2.5} /> Deploy Configurations</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                            {[
                                { id: 'studioName', label: 'Studio Identity', icon: Store, type: 'text' },
                                { id: 'phone', label: 'Battle-Line Contact', icon: Clock, type: 'text', font: 'font-mono' },
                                { id: 'email', label: 'Command Email', icon: FileText, type: 'email' },
                                { id: 'city', label: 'Sector Location', icon: Shield, type: 'text' }
                            ].map((field) => (
                                <div key={field.id} className="space-y-3 group">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] block px-4 group-focus-within:text-brand transition-colors">{field.label}</label>
                                    <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle/30 group-focus-within:text-brand transition-colors">
                                            <field.icon size={16} />
                                        </div>
                                        <input
                                            type={field.type}
                                            value={form[field.id]}
                                            onChange={e => setForm({ ...form, [field.id]: e.target.value })}
                                            className={`w-full h-16 bg-background/60 backdrop-blur-sm border border-gray-100/10 rounded-2xl pl-14 pr-6 text-sm font-black text-content outline-none focus:border-brand/50 focus:bg-background transition-all shadow-inner ${field.font || ''} uppercase tracking-tight`}
                                        />
                                    </div>
                                </div>
                            ))}
                            <div className="md:col-span-2 space-y-3 group">
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] mb-2 block px-4 group-focus-within:text-brand transition-colors">Tactical Base Address</label>
                                <div className="relative">
                                    <textarea
                                        value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                        className="w-full bg-background/60 backdrop-blur-sm border border-gray-100/10 rounded-[2rem] p-6 text-sm font-black text-content outline-none focus:border-brand/50 focus:bg-background transition-all resize-none h-40 shadow-inner uppercase tracking-tight leading-relaxed placeholder:text-content-subtle/20"
                                        placeholder="EXPLAIN PHYSICAL COMMAND HUB LOCATION..."
                                    />
                                    <div className="absolute right-6 bottom-6 opacity-5 group-focus-within:opacity-20 transition-opacity">
                                        <Store size={48} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </VendorLayout >
    );
};


export default VendorSettings;
