import React, { useState } from 'react';
import {
    User, Store, CreditCard, Shield,
    Bell, Save
} from 'lucide-react';
import VendorLayout from '../components/VendorLayout';

const VendorSettings = () => {
    const [activeSection, setActiveSection] = useState('Profile');

    const SECTIONS = [
        { id: 'Profile', icon: User, label: 'Studio Profile', sub: 'Details, Logo, Bio' },
        { id: 'Business', icon: Store, label: 'Business Hours', sub: 'Weekly schedule' },
        { id: 'Payments', icon: CreditCard, label: 'Payout Methods', sub: 'Bank, UPI, Wallet' },
        { id: 'Security', icon: Shield, label: 'Security', sub: 'Password, 2FA' },
        { id: 'Notifs', icon: Bell, label: 'Notifications', sub: 'Alerts, Emails' },
    ];

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
                                ? 'bg-white border-brand shadow-lg shadow-brand/10'
                                : 'bg-transparent border-transparent hover:bg-white hover:border-gray-100'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeSection === section.id ? 'bg-brand text-white' : 'bg-gray-100 text-content-muted'}`}>
                                <section.icon size={18} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-black tracking-tight ${activeSection === section.id ? 'text-content' : 'text-content-muted'}`}>{section.label}</p>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">{section.sub}</p>
                            </div>
                            <ChevronRight size={14} className={activeSection === section.id ? 'text-brand' : 'text-content-muted'} />
                        </button>
                    ))}
                </aside>

                {/* Settings Form */}
                <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-soft p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-content italic tracking-tight">{activeSection} Settings</h2>
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mt-1">Updates reflect across the customer app</p>
                        </div>
                        <button className="bg-brand text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand/20 flex items-center gap-2 hover:scale-105 transition-all">
                            <Save size={16} /> Save Changes
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <InputGroup label="Studio Name" placeholder="Perfect Shine Car Spa" />
                        <InputGroup label="Primary Contact" placeholder="+91 98765 43210" />
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-2 block italic">Studio Address</label>
                            <textarea
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[13px] font-bold text-content outline-none focus:border-brand transition-all resize-none h-32"
                                placeholder="Indiranagar, Sector 4, MG Road, Bengaluru - 560038"
                            />
                        </div>
                        <InputGroup label="Registration ID" placeholder="CarWash-V-IND-04" />
                        <InputGroup label="Support Email" placeholder="hello@perfectshine.com" />
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-brand">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-content">Public Visibility</p>
                                    <p className="text-[10px] font-bold text-content-subtle">Control if your studio is visible to new customers</p>
                                </div>
                            </div>
                            <div className="w-12 h-6 bg-brand rounded-full relative p-1 cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute right-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

const InputGroup = ({ label, placeholder }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest block italic">{label}</label>
        <input
            type="text"
            placeholder={placeholder}
            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-4 text-[13px] font-bold text-content outline-none focus:border-brand transition-all placeholder:text-content-muted"
        />
    </div>
);

const ChevronRight = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>
);

export default VendorSettings;
