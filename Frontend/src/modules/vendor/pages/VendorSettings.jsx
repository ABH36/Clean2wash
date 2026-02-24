import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    User, Store, CreditCard, Shield,
    Bell, Save, CheckCircle2, Clock, AlertCircle, Eye, FileText
} from 'lucide-react';
import VendorLayout from '../components/VendorLayout';

const VendorSettings = () => {
    const { getUser, updateUser } = useAuth();
    const user = getUser('vendor') || {};
    const [activeSection, setActiveSection] = useState('Profile');
    const [form, setForm] = useState({
        studioName: user.studioName || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || ''
    });
    const [toast, setToast] = useState(null);

    const SECTIONS = [
        { id: 'Profile', icon: User, label: 'Studio Profile', sub: 'Details, Logo, Bio' },
        { id: 'Business', icon: Store, label: 'Business Hours', sub: 'Weekly schedule' },
        { id: 'Verification', icon: Shield, label: 'Identity Protocol', sub: 'Security & Clearance' },
        { id: 'Payments', icon: CreditCard, label: 'Payout Methods', sub: 'Bank, UPI, Wallet' },
        { id: 'Security', icon: Shield, label: 'Security', sub: 'Password, 2FA' },
        { id: 'Notifs', icon: Bell, label: 'Notifications', sub: 'Alerts, Emails' },
    ];

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = () => {
        updateUser('vendor', user.id, form);
        showToast('Profile updated successfully');
    };

    return (
        <VendorLayout
            title="Studio Configurations"
            subtitle="Manage your business identity"
        >
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-green-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-2"
                >
                    <CheckCircle2 size={16} /> {toast}
                </motion.div>
            )}

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
                            <button onClick={handleSave} className="bg-brand text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand/20 flex items-center gap-2 hover:scale-105 transition-all">
                                <Save size={16} /> Save Changes
                            </button>
                        )}
                    </div>

                    {activeSection === 'Verification' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-background rounded-[2rem] p-8 border border-gray-100/10 flex flex-col md:flex-row items-center gap-8">
                                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl ${user.verificationStatus === 'verified' ? 'bg-green-500 text-white shadow-green-500/20' :
                                    user.verificationStatus === 'rejected' ? 'bg-red-500 text-white shadow-red-500/20' :
                                        'bg-brand text-white shadow-brand/20'
                                    }`}>
                                    {user.verificationStatus === 'verified' ? <CheckCircle2 size={40} /> :
                                        user.verificationStatus === 'rejected' ? <AlertCircle size={40} /> : <Clock size={40} />}
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-2 italic">Official Registry Status</p>
                                    <h3 className="text-3xl font-black text-content italic leading-none uppercase tracking-tighter">
                                        {user.verificationStatus === 'verified' ? 'Identity Verified' :
                                            user.verificationStatus === 'rejected' ? 'Clearance Rejected' : 'Verification Pending'}
                                    </h3>
                                    <p className="text-[11px] font-bold text-content-subtle uppercase mt-3 tracking-widest">
                                        {user.verificationStatus === 'verified' ? 'Your studio is fully cleared for all marketplace operations.' :
                                            user.verificationStatus === 'rejected' ? 'Discrepancies found in your documentation. Please re-apply.' :
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
                                        <img src={user.idProof} alt="ID Proof" className="w-full h-full object-cover opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 text-black">
                                                <Eye size={14} /> View Document
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest mt-4 text-center">Submitted on: {new Date(user.registeredAt).toLocaleDateString()}</p>
                                </div>
                                <div className="bg-background border border-gray-100/10 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-4 italic flex items-center gap-2">
                                            <Shield size={14} className="text-brand" /> Operational Limits
                                        </p>
                                        <ul className="space-y-3">
                                            {[
                                                { label: 'Marketplace Listing', ok: user.verificationStatus === 'verified' },
                                                { label: 'Revenue Withdrawals', ok: user.verificationStatus === 'verified' },
                                                { label: 'Booking Management', ok: user.verificationStatus === 'verified' },
                                                { label: 'Fleet Integration', ok: user.verificationStatus === 'verified' }
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    {item.ok ? <CheckCircle2 size={14} className="text-green-500" /> : <Clock size={14} className="text-orange-400" />}
                                                    <span className={`text-[11px] font-bold uppercase tracking-tight ${item.ok ? 'text-content' : 'text-content-subtle'}`}>{item.label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button className="w-full mt-6 py-3 bg-surface border border-gray-100/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-content-subtle hover:text-brand transition-colors">
                                        Re-upload Documents
                                    </button>
                                </div>
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
        </VendorLayout>
    );
};


export default VendorSettings;
