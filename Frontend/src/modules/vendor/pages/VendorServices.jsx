import React, { useState } from 'react';
import {
    Plus, Search, Power, Edit3,
    Trash2, ChevronRight, LayoutGrid, List,
    Sparkles, ShieldCheck, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';

const VendorServices = () => {
    const [viewMode, setViewMode] = useState('grid');

    const SERVICES = [
        { id: 1, name: 'Eco Waterless Wash', price: '₹599', duration: '45 mins', active: true, icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 2, name: 'Deep Interior Clean', price: '₹1,299', duration: '2 hours', active: true, icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50' },
        { id: 3, name: 'Full Studio Detail', price: '₹2,499', duration: '4 hours', active: true, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
        { id: 4, name: 'Ceramic Coating', price: '₹8,999', duration: '1 day', active: false, icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-50' },
    ];

    return (
        <VendorLayout
            title="Service Catalog"
            subtitle="Manage your offerings & pricing"
        >
            <div className="space-y-8">
                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl">
                        <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-brand shadow-sm' : 'text-content-muted'}`}>
                            <LayoutGrid size={18} />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-brand shadow-sm' : 'text-content-muted'}`}>
                            <List size={18} />
                        </button>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle" size={16} />
                            <input type="text" placeholder="Search services..." className="w-full h-12 bg-white border border-gray-100 rounded-xl pl-12 pr-4 text-[11px] font-bold text-content outline-none focus:border-brand shadow-soft" />
                        </div>
                        <button className="h-12 px-6 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2">
                            <Plus size={16} /> Create Service
                        </button>
                    </div>
                </div>

                {/* Services Grid */}
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                    {SERVICES.map((s, i) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className={`bg-white rounded-[2.5rem] border border-gray-100 shadow-soft overflow-hidden group hover:border-brand/20 transition-all ${viewMode === 'list' ? 'flex items-center p-4' : 'p-8 space-y-6'}`}
                        >
                            <div className={`${viewMode === 'list' ? 'flex items-center gap-4 flex-1' : 'space-y-6'}`}>
                                <div className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center ${s.color} transition-transform group-hover:rotate-12`}>
                                    <s.icon size={28} />
                                </div>

                                <div className={`${viewMode === 'list' ? 'flex-1' : 'space-y-1'}`}>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-content tracking-tight">{s.name}</h3>
                                        {!s.active && <span className="text-[8px] font-black bg-gray-100 text-content-muted px-2 py-0.5 rounded uppercase">Inactive</span>}
                                    </div>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest italic">{s.duration}</p>
                                </div>

                                {viewMode === 'list' && (
                                    <div className="px-8 border-x border-gray-50 mx-8">
                                        <span className="text-xl font-black italic tracking-tighter text-content">{s.price}</span>
                                    </div>
                                )}
                            </div>

                            {viewMode === 'grid' && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-2xl font-black italic tracking-tighter text-content">{s.price}</span>
                                    <div className="flex gap-2">
                                        <button className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-content-muted hover:text-brand transition-all">
                                            <Edit3 size={18} />
                                        </button>
                                        <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${s.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            <Power size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {viewMode === 'list' && (
                                <div className="flex gap-2">
                                    <button className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-content-muted hover:text-brand transition-all">
                                        <Edit3 size={18} />
                                    </button>
                                    <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${s.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        <Power size={18} />
                                    </button>
                                    <button className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}

                    <button className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 text-content-subtle hover:border-brand hover:text-brand transition-all bg-gray-50/30">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-soft">
                            <Plus size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-center">Templates available<br />for quick setup</span>
                    </button>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorServices;
