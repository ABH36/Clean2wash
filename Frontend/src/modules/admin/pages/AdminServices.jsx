import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Clock,
    LayoutGrid,
    List,
    CheckCircle2,
    Settings,
    Shield,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

const CATEGORIES = ['All', 'Doorstep', 'Studio', 'Add-ons'];

const AdminServices = () => {
    const [view, setView] = useState('grid');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [services, setServices] = useState(() => {
        const saved = localStorage.getItem('CarWash_services');
        return saved ? JSON.parse(saved) : [
            { id: 'SVC-001', name: 'Eco-Express Wash', category: 'Doorstep', price: '299', time: '30m', status: 'Live', type: 'Waterless', color: 'bg-green-500' },
            { id: 'SVC-002', name: 'Full Deep Clean', category: 'Doorstep', price: '1299', time: '90m', status: 'Live', type: 'Steam', color: 'bg-brand' },
            { id: 'SVC-003', name: 'Ceramic Coating', category: 'Studio', price: '14999', time: '4h', status: 'Featured', type: 'Pro', color: 'bg-violet-600' },
            { id: 'SVC-004', name: 'Interior Detailing', category: 'Studio', price: '899', time: '60m', status: 'Live', type: 'Chemical', color: 'bg-blue-600' },
            { id: 'SVC-005', name: 'Tire & Rim Polish', category: 'Add-ons', price: '199', time: '15m', status: 'Live', type: 'Wash', color: 'bg-amber-500' },
        ];
    });

    const [formData, setFormData] = useState({ name: '', category: 'Doorstep', price: '', time: '', status: 'Live', type: 'Standard' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem('CarWash_services', JSON.stringify(services));
    }, [services]);

    const filteredServices = services.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'All' || s.category === filter;
        return matchesSearch && matchesFilter;
    });

    const handleOpenAdd = () => {
        setEditingService(null);
        setFormData({ name: '', category: 'Doorstep', price: '', time: '', status: 'Live', type: 'Standard' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (service) => {
        setEditingService(service);
        setFormData({ ...service });
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            if (editingService) {
                setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...formData } : s));
            } else {
                const newId = `SVC-${String(services.length + 1).padStart(3, '0')}`;
                setServices(prev => [{ ...formData, id: newId }, ...prev]);
            }
            setLoading(false);
            setIsModalOpen(false);
        }, 600);
    };

    const handleDelete = (id) => {
        if (window.confirm('Decommission this service protocol?')) {
            setServices(prev => prev.filter(s => s.id !== id));
        }
    };

    return (
        <AdminLayout title="Catalog Control">
            <div className="space-y-6">
                {/* Control Matrix Header */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`flex-1 lg:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === cat ? 'bg-white text-brand shadow-sm' : 'text-content-subtle hover:text-content'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 lg:w-72 bg-white border border-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-soft group focus-within:border-brand transition-all">
                            <Search size={16} className="text-content-subtle group-focus-within:text-brand" />
                            <input
                                type="text"
                                placeholder="Locate protocol..."
                                className="bg-transparent outline-none text-xs font-bold text-content w-full"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-2xl">
                            <button onClick={() => setView('grid')} className={`p-2 rounded-xl transition-all ${view === 'grid' ? 'bg-white text-brand shadow-sm' : 'text-content-subtle'}`}><LayoutGrid size={18} /></button>
                            <button onClick={() => setView('list')} className={`p-2 rounded-xl transition-all ${view === 'list' ? 'bg-white text-brand shadow-sm' : 'text-content-subtle'}`}><List size={18} /></button>
                        </div>
                        <button
                            onClick={handleOpenAdd}
                            className="h-11 px-6 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus size={18} /> New Protocol
                        </button>
                    </div>
                </div>

                {/* Service Grid/List */}
                {view === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredServices.map((service, i) => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-[2rem] border border-gray-100 shadow-soft overflow-hidden group hover:border-brand transition-all flex flex-col"
                            >
                                <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                    <div className={`absolute inset-0 ${service.color || 'bg-brand'} opacity-10`} />
                                    <ImageIcon size={40} className="text-gray-300 relative z-10" />
                                    <div className="absolute top-4 left-4">
                                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${service.status === 'Live' ? 'bg-green-100 text-green-600' : 'bg-brand/10 text-brand'}`}>
                                            {service.status}
                                        </span>
                                    </div>
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => handleOpenEdit(service)} className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-content hover:bg-brand hover:text-white shadow-sm transition-all"><Edit2 size={12} /></button>
                                        <button onClick={() => handleDelete(service.id)} className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-content hover:bg-red-500 hover:text-white shadow-sm transition-all"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[9px] font-black text-brand uppercase tracking-widest italic">{service.category}</p>
                                        <p className="text-[9px] font-bold text-content-subtle">{service.id}</p>
                                    </div>
                                    <h3 className="text-sm font-black text-content italic leading-tight mb-4 group-hover:text-brand transition-colors">{service.name}</h3>
                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-content-subtle"><Clock size={14} /></div>
                                            <p className="text-[10px] font-black text-content italic">{service.time}</p>
                                        </div>
                                        <p className="text-lg font-black text-content italic leading-none truncate ml-2">₹{service.price}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest italic">Protocol Desc</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest italic">Metadata</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest italic text-center">Status</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest italic text-right">Valuation</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest italic text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredServices.map(service => (
                                    <tr key={service.id} className="group hover:bg-gray-50/30 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-2xl ${service.color || 'bg-brand'} bg-opacity-10 flex items-center justify-center text-content italic border border-gray-100 group-hover:bg-brand group-hover:text-white transition-all`}>
                                                    <Settings size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-content italic leading-none mb-1.5 uppercase truncate max-w-[200px]">{service.name}</p>
                                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">{service.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className="text-brand" />
                                                    <span className="text-[10px] font-bold text-content-muted uppercase whitespace-nowrap">{service.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Shield size={12} className="text-brand" />
                                                    <span className="text-[10px] font-bold text-content-muted uppercase whitespace-nowrap">{service.type || 'Standard'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border ${service.status === 'Live' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-brand/10 text-brand border-brand/10'}`}>
                                                {service.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="text-sm font-black text-content italic">₹{service.price}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleOpenEdit(service)} className="p-2.5 bg-gray-50 hover:bg-brand hover:text-white rounded-xl text-content-subtle transition-all shadow-sm">
                                                    <Edit2 size={13} />
                                                </button>
                                                <button onClick={() => handleDelete(service.id)} className="p-2.5 bg-gray-50 hover:bg-red-500 hover:text-white rounded-xl text-content-subtle transition-all shadow-sm">
                                                    <Trash2 size={13} />
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

            {/* Protocol Configuration Terminal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-content/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100"
                        >
                            <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-content italic leading-none uppercase">{editingService ? 'Update Protocol' : 'New Service Node'}</h2>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-2 italic px-1">Control Configuration Terminal</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 text-content-subtle transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-10">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2 space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Protocol Identity</label>
                                            <input
                                                required
                                                placeholder="e.g. Ultra Steam Detail"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Operational Category</label>
                                            <select
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm appearance-none"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                <option value="Doorstep">Doorstep Delivery</option>
                                                <option value="Studio">Studio Detailing</option>
                                                <option value="Add-ons">Supplemental Add-on</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Network Node Type</label>
                                            <select
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm appearance-none"
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                <option value="Standard">Standard</option>
                                                <option value="Premium">Premium</option>
                                                <option value="Elite">Elite</option>
                                                <option value="Waterless">Waterless</option>
                                                <option value="Steam">Steam</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Valuation (₹)</label>
                                            <input
                                                required
                                                type="number"
                                                placeholder="e.g. 599"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Protocol Duration</label>
                                            <input
                                                required
                                                placeholder="e.g. 45m"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.time}
                                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            disabled={loading}
                                            className="w-full bg-content text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl shadow-content/20 flex items-center justify-center gap-3 hover:bg-brand transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Synchronizing Node...' : (
                                                <>{editingService ? 'Apply Synchronization' : 'Commit Protocol'} <CheckCircle2 size={18} /></>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default AdminServices;
