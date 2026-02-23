import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Plus, Truck, Star, Phone, MessageSquare, MoreVertical
} from 'lucide-react';
import VendorLayout from '../components/VendorLayout';
import { useAuth } from '../../../context/AuthContext';

const VendorFleet = () => {
    const { registeredUsers, getUser } = useAuth();
    const vendor = getUser('vendor');
    const [activeTab, setActiveTab] = useState('Drivers');

    const staffList = (registeredUsers.staff || []).filter(s => s.vendorId === vendor?.id);

    const DRIVERS = staffList.map(s => ({
        id: s.id,
        name: s.name,
        status: 'Active',
        rating: '4.8',
        trips: '12',
        image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80',
        phone: s.phone || '+91 91234 56789'
    }));

    const VEHICLES = [
        { id: 'VH-9921', model: 'Hero Electric Nyx', plate: 'KA 01 MR 4421', status: 'Available', Type: 'Two Wheeler' },
        { id: 'VH-8812', model: 'Tata Ace (Chota Hathi)', plate: 'KA 03 GH 8812', status: 'On Route', Type: 'Mini Truck' },
    ];

    return (
        <VendorLayout
            title="Fleet Management"
            subtitle="Drivers & Pickup Vehicles"
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    {/* Tabs */}
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
                        {['Drivers', 'Vehicles', 'Maintenance'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-brand shadow-sm' : 'text-content-muted hover:text-content'
                                    }`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    <button className="bg-brand text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand/20">
                        <Plus size={14} strokeWidth={3} /> Add New
                    </button>
                </div>

                {/* Content Area */}
                {activeTab === 'Drivers' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {DRIVERS.map(driver => (
                            <motion.div key={driver.id} whileHover={{ y: -4 }} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft relative overflow-hidden group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-gray-50 bg-gray-50">
                                            <img src={driver.image} alt={driver.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-base text-content tracking-tight leading-none mb-1">{driver.name}</h3>
                                            <p className="text-[10px] font-black text-brand uppercase tracking-widest italic">{driver.id}</p>
                                        </div>
                                    </div>
                                    <button className="text-content-muted"><MoreVertical size={18} /></button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <div className="bg-gray-50 rounded-2xl p-3">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">Status</p>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${driver.status === 'Active' ? 'bg-green-500' : driver.status === 'Offline' ? 'bg-gray-400' : 'bg-blue-500 animate-pulse'}`} />
                                            <span className="text-[10px] font-bold text-content">{driver.status}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-3">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">Rating</p>
                                        <div className="flex items-center gap-1">
                                            <Star size={10} className="text-accent-yellow fill-accent-yellow" />
                                            <span className="text-[10px] font-bold text-content">{driver.rating} <span className="text-content-subtle italic">({driver.trips})</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button className="flex-1 h-11 bg-gray-50 hover:bg-gray-100 transition-all rounded-xl flex items-center justify-center text-content-muted text-[10px] font-black uppercase tracking-widest gap-2">
                                        <Phone size={14} /> Call
                                    </button>
                                    <button className="flex-1 h-11 bg-gray-50 hover:bg-gray-100 transition-all rounded-xl flex items-center justify-center text-content-muted text-[10px] font-black uppercase tracking-widest gap-2">
                                        <MessageSquare size={14} /> Msg
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {VEHICLES.map(v => (
                            <motion.div key={v.id} whileHover={{ y: -4 }} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft relative overflow-hidden group">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 text-brand">
                                        <Truck size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base text-content tracking-tight">{v.model}</h3>
                                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-[0.15em]">{v.plate}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 rounded-2xl px-4 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-content-subtle uppercase italic tracking-widest mb-1">Service Type</span>
                                        <span className="text-[10px] font-black text-content">{v.Type}</span>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${v.status === 'Available' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {v.status}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default VendorFleet;
