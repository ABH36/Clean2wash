import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import {
    Car,
    Clock,
    Plus,
    Edit2,
    Trash2,
    LayoutGrid,
    List,
    ToggleLeft,
    ToggleRight,
    Tag,
    X
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const VisibilityToggle = () => {
    const [enabled, setEnabled] = useState(true);
    return (
        <button
            onClick={() => setEnabled(!enabled)}
            className={`transition-colors ${enabled ? 'text-brand' : 'text-gray-300'}`}
        >
            {enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
        </button>
    );
};

const DEFAULT_SERVICES = [
    { id: 'SVC-001', name: 'Eco-Express Wash', category: 'Doorstep', price: '₹299', time: '30m', status: 'Live', type: 'Waterless', color: 'bg-green-500' },
    { id: 'SVC-002', name: 'Full Deep Clean', category: 'Doorstep', price: '₹1,299', time: '90m', status: 'Live', type: 'Steam', color: 'bg-brand' },
    { id: 'SVC-003', name: 'Ceramic Coating', category: 'Studio', price: '₹14,999', time: '4h', status: 'Featured', type: 'Pro', color: 'bg-violet-600' },
    { id: 'SVC-004', name: 'Interior Detailing', category: 'Studio', price: '₹899', time: '60m', status: 'Live', type: 'Chemical', color: 'bg-blue-600' },
    { id: 'SVC-005', name: 'Tire & Rim Polish', category: 'Add-ons', price: '₹199', time: '15m', status: 'Live', type: 'Wash', color: 'bg-amber-500' },
];

const AdminServices = () => {
    const [view, setView] = useState('grid');
    const [activeTab, setActiveTab] = useState('All Services');
    const [showModal, setShowModal] = useState(false);
    const [editService, setEditService] = useState(null);

    // Load from localStorage on first render, fallback to defaults
    const [servicesList, setServicesList] = useState(() => {
        try {
            const saved = localStorage.getItem('admin_services');
            return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
        } catch {
            return DEFAULT_SERVICES;
        }
    });

    // Persist to localStorage whenever list changes
    React.useEffect(() => {
        localStorage.setItem('admin_services', JSON.stringify(servicesList));
    }, [servicesList]);

    const [newService, setNewService] = useState({
        name: '',
        category: 'Doorstep',
        price: '',
        time: '',
        type: 'Standard',
        color: 'bg-brand'
    });

    const handleAddService = (e) => {
        e.preventDefault();
        const id = `SVC-${String(servicesList.length + 1).padStart(3, '0')}`;
        const updated = [...servicesList, { ...newService, id, status: 'Live', price: `₹${newService.price}` }];
        setServicesList(updated);
        setShowModal(false);
        setNewService({ name: '', category: 'Doorstep', price: '', time: '', type: 'Standard', color: 'bg-brand' });
    };

    const openEdit = (svc) => {
        setEditService({ ...svc, rawPrice: svc.price.replace('₹', '').replace(',', '') });
    };

    const handleEditService = (e) => {
        e.preventDefault();
        const updated = servicesList.map(s =>
            s.id === editService.id
                ? { ...editService, price: `₹${Number(editService.rawPrice).toLocaleString('en-IN')}` }
                : s
        );
        setServicesList(updated);
        setEditService(null);
    };

    const handleDelete = (id) => {
        if (window.confirm('Kya aap is service ko delete karna chahte hain?')) {
            setServicesList(servicesList.filter(s => s.id !== id));
        }
    };

    const filteredServices = activeTab === 'All Services'
        ? servicesList
        : servicesList.filter(svc => svc.category === activeTab);

    return (
        <AdminLayout title="Service Catalog">
            <div className="space-y-6">
                {/* catalog actions */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center lg:text-left">
                        <h3 className="text-lg font-black text-content italic uppercase tracking-tight leading-none">Global Catalog</h3>
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em]">Manage prices and service logic</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-1 rounded-xl flex items-center">
                            <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white text-brand shadow-sm' : 'text-content-subtle'}`}>
                                <LayoutGrid size={16} />
                            </button>
                            <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white text-brand shadow-sm' : 'text-content-subtle'}`}>
                                <List size={16} />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="h-11 px-6 bg-content text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-content/20 flex items-center gap-2"
                        >
                            <Plus size={16} /> New Service
                        </button>
                    </div>
                </div>

                {/* categories filter */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {['All Services', 'Doorstep', 'Studio', 'Add-ons', 'Prestige'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`shrink-0 px-6 py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-soft italic ${activeTab === cat
                                ? 'bg-white border-brand/50 text-brand scale-105'
                                : 'bg-white border-gray-100 text-content-subtle hover:text-brand hover:border-brand/20'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid View */}
                {view === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredServices.map((svc, i) => (
                            <motion.div
                                key={svc.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-6 rounded-[3rem] border border-gray-100 shadow-soft group hover:border-brand transition-all relative"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${svc.color} shadow-lg`}>
                                        <Car size={24} />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${svc.status === 'Live' ? 'bg-green-50 text-green-600' : 'bg-brand/10 text-brand'
                                            }`}>
                                            {svc.status}
                                        </span>
                                        <span className="text-[10px] font-black text-content-subtle italic uppercase">{svc.category}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xl font-black text-content italic uppercase tracking-tight">{svc.name}</h4>
                                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">Tech: <span className="text-brand">{svc.type}</span></p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} className="text-content-subtle" />
                                                <span className="text-xs font-black text-content italic">{svc.time}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Tag size={12} className="text-content-subtle" />
                                                <span className="text-base font-black text-brand italic">{svc.price}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEdit(svc)}
                                                className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-content-subtle hover:bg-brand hover:text-white transition-all shadow-sm z-10 relative"
                                                title="Edit"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(svc.id)}
                                                className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-content-subtle hover:bg-red-500 hover:text-white transition-all shadow-sm z-10 relative"
                                                title="Delete"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* background decorative */}
                                <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${svc.color} opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700`} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-soft overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Service ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Name</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Category</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Price</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Visible</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredServices.map((svc, i) => (
                                    <tr key={i} className="hover:bg-gray-50/30 transition-all">
                                        <td className="px-8 py-5"><span className="text-[10px] font-black text-brand italic tracking-widest uppercase">{svc.id}</span></td>
                                        <td className="px-8 py-5"><span className="text-xs font-black text-content italic uppercase">{svc.name}</span></td>
                                        <td className="px-8 py-5"><span className="text-[10px] font-black text-content-subtle uppercase tracking-widest">{svc.category}</span></td>
                                        <td className="px-8 py-5"><span className="text-sm font-black text-content italic">{svc.price}</span></td>
                                        <td className="px-8 py-5">
                                            <VisibilityToggle />
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(svc)}
                                                    className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-content-subtle hover:bg-brand hover:text-white transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(svc.id)}
                                                    className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-content-subtle hover:bg-red-500 hover:text-white transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Service Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-content/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[3rem] p-8 relative z-10 shadow-2xl overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-content italic uppercase tracking-tight">Add New Service</h3>
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Global Catalog Entry</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddService} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Service Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Hydro-Shield Wax"
                                        className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                        value={newService.name}
                                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Category</label>
                                        <select
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all appearance-none"
                                            value={newService.category}
                                            onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                                        >
                                            <option value="Doorstep">Doorstep</option>
                                            <option value="Studio">Studio</option>
                                            <option value="Add-ons">Add-ons</option>
                                            <option value="Prestige">Prestige</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Tech Type</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Steam/Wash/Pro"
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                            value={newService.type}
                                            onChange={(e) => setNewService({ ...newService, type: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Price (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="499"
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all font-mono"
                                            value={newService.price}
                                            onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Duration</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="45m / 2h"
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                            value={newService.time}
                                            onChange={(e) => setNewService({ ...newService, time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 h-14 bg-gray-50 text-content-subtle rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] h-14 bg-brand text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Create Service
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Service Modal */}
            <AnimatePresence>
                {editService && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditService(null)}
                            className="absolute inset-0 bg-content/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[3rem] p-8 relative z-10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-content italic uppercase tracking-tight">Edit Service</h3>
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">{editService.id}</p>
                                </div>
                                <button onClick={() => setEditService(null)} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleEditService} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Service Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                        value={editService.name}
                                        onChange={(e) => setEditService({ ...editService, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Category</label>
                                        <select
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all appearance-none"
                                            value={editService.category}
                                            onChange={(e) => setEditService({ ...editService, category: e.target.value })}
                                        >
                                            <option value="Doorstep">Doorstep</option>
                                            <option value="Studio">Studio</option>
                                            <option value="Add-ons">Add-ons</option>
                                            <option value="Prestige">Prestige</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Status</label>
                                        <select
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all appearance-none"
                                            value={editService.status}
                                            onChange={(e) => setEditService({ ...editService, status: e.target.value })}
                                        >
                                            <option value="Live">Live</option>
                                            <option value="Featured">Featured</option>
                                            <option value="Draft">Draft</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Price (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all font-mono"
                                            value={editService.rawPrice}
                                            onChange={(e) => setEditService({ ...editService, rawPrice: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Duration</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                            value={editService.time}
                                            onChange={(e) => setEditService({ ...editService, time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Tech Type</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                        value={editService.type}
                                        onChange={(e) => setEditService({ ...editService, type: e.target.value })}
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditService(null)}
                                        className="flex-1 h-14 bg-gray-50 text-content-subtle rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] h-14 bg-brand text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default AdminServices;
