import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';
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
    Gift,
    Crown,
    Stars,
    MessageSquare
} from 'lucide-react';

const CATEGORIES = ['All', 'Express', 'Doorstep', 'Studio', 'Add-ons'];

const AdminServices = () => {
    const [view, setView] = useState('grid');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [editingService, setEditingService] = useState(null);
    const [services, setServices] = useState([]);
    const [isFetching, setIsFetching] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        category: 'Doorstep',
        price: '',
        time: '',
        status: 'Live',
        type: 'Standard',
        subscriptionOffer: { enabled: true, washCount: 10, freeWashes: 1, label: '' },
        plans: [],
        plansText: '',
        detailedCoverage: [],
        inclusions: [],
        exclusions: [],
        adminNote: '',
        startingPrice: 0,
        multiplierEnabled: true,
        image: '',
        videoUrl: '',
        rating: 4.9,
        bannerImage: '',
        tag: '',
        features: [],
        faqs: [],
        protocolSteps: [],
        offers: []
    });
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

    const fetchServices = async () => {
        setIsFetching(true);
        try {
            const res = await adminAPI.getServices(filter);
            setServices(res.data.services || []);
        } catch (err) {
            console.error('Failed to fetch services:', err.message);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [filter]);

    const filteredServices = services.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const handleOpenAdd = () => {
        setEditingService(null);
        setFormData({
            name: '',
            category: 'Doorstep',
            price: '',
            time: '',
            status: 'Live',
            type: 'Standard',
            subscriptionOffer: { enabled: true, washCount: 10, freeWashes: 1, label: '' },
            plans: [],
            plansText: '',
            detailedCoverage: [],
            inclusions: [],
            exclusions: [],
            adminNote: '',
            startingPrice: 0,
            multiplierEnabled: true,
            image: '',
            videoUrl: '',
            rating: 4.9,
            bannerImage: '',
            tag: '',
            features: [],
            faqs: [],
            protocolSteps: [],
            offers: []
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (service) => {
        setEditingService(service);
        const plansText = (service.plans || []).map(p => `${p.label} | ${p.perWash} | ${p.total}`).join('\n');
        setFormData({
            ...service,
            plansText,
            detailedCoverage: service.detailedCoverage || [],
            inclusions: service.inclusions || [],
            exclusions: service.exclusions || [],
            adminNote: service.adminNote || '',
            startingPrice: service.startingPrice || 0,
            multiplierEnabled: service.multiplierEnabled !== undefined ? service.multiplierEnabled : true,
            image: service.image || '',
            videoUrl: service.videoUrl || '',
            rating: service.rating || 4.9,
            bannerImage: service.bannerImage || '',
            tag: service.tag || '',
            features: service.features || [],
            faqs: service.faqs || [],
            protocolSteps: service.protocolSteps || [],
            offers: service.offers || []
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        const parsedPlans = (formData.plansText || '').split('\n')
            .filter(line => line.includes('|'))
            .map((line, idx) => {
                const [label, perWash, total] = line.split('|').map(s => s.trim());
                return { label, perWash: parseInt(perWash), total: parseInt(total) };
            });

        const finalData = { ...formData, plans: parsedPlans };

        try {
            if (editingService) {
                await adminAPI.updateService(editingService._id, finalData);
            } else {
                await adminAPI.createService(finalData);
            }
            await fetchServices();
            setIsModalOpen(false);
            toast.success(editingService ? 'Service updated' : 'New service created');
        } catch (err) {
            toast.error('Operation failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const id = deleteConfirm.id;
        if (!id) return;

        try {
            await adminAPI.deleteService(id);
            await fetchServices();
            toast.success('Service decommissioned');
            setDeleteConfirm({ isOpen: false, id: null });
        } catch (err) {
            toast.error('Delete failed: ' + err.message);
        }
    };

    const handleAddArrayItem = (field, defaultValue = '') => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], defaultValue] }));
    };

    const handleUpdateArrayItem = (field, index, value) => {
        const newList = [...formData[field]];
        newList[index] = value;
        setFormData(prev => ({ ...prev, [field]: newList }));
    };

    const handleRemoveArrayItem = (field, index) => {
        const newList = formData[field].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [field]: newList }));
    };

    const handleAddInclusion = () => {
        const newInc = { id: 'inc_' + Math.random().toString(36).substr(2, 9), name: '', price: 0, icon: 'Plus', isRecommended: false };
        setFormData(prev => ({ ...prev, inclusions: [...prev.inclusions, newInc] }));
    };

    const handleUpdateInclusion = (index, field, value) => {
        const newList = [...formData.inclusions];
        newList[index] = { ...newList[index], [field]: value };
        setFormData(prev => ({ ...prev, inclusions: newList }));
    };

    const handleRemoveInclusion = (index) => {
        const newList = formData.inclusions.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, inclusions: newList }));
    };

    return (
        <>
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
                                {cat === 'Express' ? 'Instant Wash' : cat}
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
                                key={service._id}
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
                                        <button onClick={() => setDeleteConfirm({ isOpen: true, id: service._id })} className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-content hover:bg-red-500 hover:text-white shadow-sm transition-all"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[9px] font-black text-brand uppercase tracking-widest">{service.category}</p>
                                        <p className="text-[9px] font-bold text-content-subtle">{service._id.slice(-6).toUpperCase()}</p>
                                    </div>
                                    <h3 className="text-sm font-black text-content leading-tight mb-4 group-hover:text-brand transition-colors">{service.name}</h3>
                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-content-subtle"><Clock size={14} /></div>
                                            <p className="text-[10px] font-black text-content">{service.time}</p>
                                        </div>
                                        <p className="text-lg font-black text-content leading-none truncate ml-2">₹{service.price}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="admin-table-container">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Protocol Desc</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Metadata</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-right">Valuation</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredServices.map(service => (
                                    <tr key={service._id} className="group hover:bg-gray-50/30 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-2xl ${service.color || 'bg-brand'} bg-opacity-10 flex items-center justify-center text-content border border-gray-100 group-hover:bg-brand group-hover:text-white transition-all`}>
                                                    <Settings size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-content leading-none mb-1.5 uppercase truncate max-w-[200px]">{service.name}</p>
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
                                            <p className="text-sm font-black text-content">₹{service.price}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleOpenEdit(service)} className="p-2.5 bg-gray-50 hover:bg-brand hover:text-white rounded-xl text-content-subtle transition-all shadow-sm">
                                                    <Edit2 size={13} />
                                                </button>
                                                <button onClick={() => setDeleteConfirm({ isOpen: true, id: service._id })} className="p-2.5 bg-gray-50 hover:bg-red-500 hover:text-white rounded-xl text-content-subtle transition-all shadow-sm">
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
            < AnimatePresence >
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
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-content leading-none uppercase">{editingService ? 'Update Protocol' : 'New Service Node'}</h2>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-2 px-1">Control Configuration Terminal</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 text-content-subtle transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Tabs UI */}
                            <div className="px-10 py-4 bg-white border-b border-gray-100 flex items-center gap-6 overflow-x-auto scrollbar-hide">
                                {[
                                    { id: 'basic', label: 'Core Sync' },
                                    { id: 'advanced', label: 'Advanced Protocol' },
                                    { id: 'loyalty', label: 'Loyalty & Plans' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        type="button"
                                        className={`pb-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id ? 'text-brand' : 'text-content-subtle'}`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-full" />}
                                    </button>
                                ))}
                            </div>

                            <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <form onSubmit={handleSave} className="space-y-6">
                                    {activeTab === 'basic' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
                                            <div className="md:col-span-2 space-y-1.5 font-sans">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Protocol Identity</label>
                                                <input
                                                    required
                                                    placeholder="e.g. Ultra Steam Detail"
                                                    className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5 font-sans">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Operational Category</label>
                                                <select
                                                    className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm appearance-none"
                                                    value={formData.category}
                                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                >
                                                    <option value="Express">Express (Instant Wash)</option>
                                                    <option value="Doorstep">Doorstep Delivery</option>
                                                    <option value="Studio">Studio Detailing</option>
                                                    <option value="Add-ons">Supplemental Add-on</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5 font-sans">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Network Node Type</label>
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
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Valuation (₹)</label>
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
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Protocol Duration</label>
                                                <input
                                                    required
                                                    placeholder="e.g. 45m"
                                                    className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                    value={formData.time}
                                                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'advanced' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-300">
                                            {/* Multiplier & Starting Price */}
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex-1 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Multiplier Status</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, multiplierEnabled: !prev.multiplierEnabled }))}
                                                            className={`w-10 h-5 rounded-full relative transition-all ${formData.multiplierEnabled ? 'bg-brand' : 'bg-gray-300'}`}
                                                        >
                                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.multiplierEnabled ? 'left-5.5' : 'left-0.5'}`} />
                                                        </button>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-content-subtle uppercase">Dynamic demand-based pricing</p>
                                                </div>
                                                <div className="flex-1 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest block mb-2">Starting Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white border border-gray-100 px-4 py-2 rounded-xl text-xs font-bold focus:border-brand outline-none"
                                                        value={formData.startingPrice}
                                                        onChange={e => setFormData({ ...formData, startingPrice: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Detailed Coverage */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest flex items-center gap-2">
                                                        <Settings size={14} className="text-brand" /> Detailed Coverage
                                                    </label>
                                                </div>
                                                <div className="space-y-2">
                                                    {formData.detailedCoverage.map((point, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <input
                                                                className="flex-1 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-brand focus:bg-white"
                                                                value={point}
                                                                onChange={e => handleUpdateArrayItem('detailedCoverage', idx, e.target.value)}
                                                            />
                                                            <button type="button" onClick={() => handleRemoveArrayItem('detailedCoverage', idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={14} /></button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => handleAddArrayItem('detailedCoverage')} className="w-full py-3 border border-dashed border-gray-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-content-subtle hover:border-brand hover:text-brand transition-all">+ Add Scope Item</button>
                                                </div>
                                            </div>

                                            {/* Protocol Inclusions (Add-ons) */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest flex items-center gap-2">
                                                        <Plus size={14} className="text-brand" /> Protocol Inclusions (Add-ons)
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {formData.inclusions.map((inc, idx) => (
                                                        <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group">
                                                            <button type="button" onClick={() => handleRemoveInclusion(idx)} className="absolute top-2 right-2 p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
                                                            <input
                                                                placeholder="Item Name"
                                                                className="w-full bg-white border border-gray-100 px-3 py-2 rounded-lg text-xs font-bold outline-none focus:border-brand"
                                                                value={inc.name}
                                                                onChange={e => handleUpdateInclusion(idx, 'name', e.target.value)}
                                                            />
                                                            <div className="flex items-center justify-between gap-2">
                                                                <input
                                                                    type="number"
                                                                    placeholder="Price"
                                                                    className="w-20 bg-white border border-gray-100 px-3 py-2 rounded-lg text-xs font-bold outline-none focus:border-brand"
                                                                    value={inc.price}
                                                                    onChange={e => handleUpdateInclusion(idx, 'price', parseInt(e.target.value))}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateInclusion(idx, 'isRecommended', !inc.isRecommended)}
                                                                    className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${inc.isRecommended ? 'bg-brand text-white' : 'bg-white text-content-subtle border border-gray-100'}`}
                                                                >
                                                                    Rec
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={handleAddInclusion} className="md:col-span-2 py-4 border border-dashed border-gray-200 rounded-2xl text-[9px] font-black uppercase tracking-widest text-content-subtle hover:border-brand hover:text-brand transition-all">+ Add Add-on Item</button>
                                                </div>
                                            </div>

                                            {/* Target Exclusions */}
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest flex items-center gap-2">
                                                    <X size={14} className="text-red-500" /> Target Exclusions
                                                </label>
                                                <div className="space-y-2">
                                                    {formData.exclusions.map((point, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <input
                                                                className="flex-1 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-red-500"
                                                                value={point}
                                                                onChange={e => handleUpdateArrayItem('exclusions', idx, e.target.value)}
                                                            />
                                                            <button type="button" onClick={() => handleRemoveArrayItem('exclusions', idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={14} /></button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => handleAddArrayItem('exclusions')} className="w-full py-3 border border-dashed border-gray-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-content-subtle hover:border-red-500 hover:text-red-500 transition-all">+ Add Exclusion</button>
                                                </div>
                                            </div>

                                            {/* Media Assets */}
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest flex items-center gap-2">
                                                    <ImageIcon size={14} className="text-brand" /> Media Visuals
                                                </label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Main Image URL</label>
                                                        <input
                                                            className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-brand"
                                                            placeholder="https://..."
                                                            value={formData.image}
                                                            onChange={e => setFormData({ ...formData, image: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Promo Video URL</label>
                                                        <input
                                                            className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-brand"
                                                            placeholder="Video Link"
                                                            value={formData.videoUrl}
                                                            onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Category Banner URL</label>
                                                        <input
                                                            className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-brand"
                                                            placeholder="Banner Image"
                                                            value={formData.bannerImage}
                                                            onChange={e => setFormData({ ...formData, bannerImage: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Fixed Rating</label>
                                                            <input
                                                                type="number" step="0.1"
                                                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-brand"
                                                                value={formData.rating}
                                                                onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Badge/Tag</label>
                                                            <input
                                                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-brand"
                                                                placeholder="BEST SELLER"
                                                                value={formData.tag}
                                                                onChange={e => setFormData({ ...formData, tag: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Advanced Info management (Features, Steps, FAQs) */}
                                            <div className="pt-6 border-t border-gray-100 space-y-8">
                                                {/* Features Section */}
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest flex items-center justify-between">
                                                        <span className="flex items-center gap-2"><Stars size={14} className="text-amber-500" /> Premium Features</span>
                                                        <button type="button" onClick={() => setFormData({ ...formData, features: [...formData.features, { icon: 'CheckCircle2', text: '' }] })} className="text-brand text-[9px]">+ Add Feature</button>
                                                    </label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {formData.features.map((f, idx) => (
                                                            <div key={idx} className="flex gap-2">
                                                                <input
                                                                    className="flex-1 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-[11px] font-bold outline-none"
                                                                    placeholder="e.g. Eco-Friendly"
                                                                    value={f.text}
                                                                    onChange={e => {
                                                                        const newF = [...formData.features];
                                                                        newF[idx].text = e.target.value;
                                                                        setFormData({ ...formData, features: newF });
                                                                    }}
                                                                />
                                                                <button type="button" onClick={() => setFormData({ ...formData, features: formData.features.filter((_, i) => i !== idx) })} className="p-2 text-red-500"><Trash2 size={12} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Protocol Steps Section */}
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest flex items-center justify-between">
                                                        <span className="flex items-center gap-2"><Settings size={14} className="text-blue-500" /> Execution Steps</span>
                                                        <button type="button" onClick={() => setFormData({ ...formData, protocolSteps: [...formData.protocolSteps, ''] })} className="text-brand text-[9px]">+ Add Step</button>
                                                    </label>
                                                    <div className="space-y-2">
                                                        {formData.protocolSteps.map((step, idx) => (
                                                            <div key={idx} className="flex gap-2">
                                                                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                                                                <input
                                                                    className="flex-1 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-[11px] font-bold outline-none"
                                                                    placeholder="e.g. Foam Pre-wash"
                                                                    value={step}
                                                                    onChange={e => {
                                                                        const newS = [...formData.protocolSteps];
                                                                        newS[idx] = e.target.value;
                                                                        setFormData({ ...formData, protocolSteps: newS });
                                                                    }}
                                                                />
                                                                <button type="button" onClick={() => setFormData({ ...formData, protocolSteps: formData.protocolSteps.filter((_, i) => i !== idx) })} className="p-2 text-red-500"><Trash2 size={12} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* FAQs Section */}
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest flex items-center justify-between">
                                                        <span className="flex items-center gap-2"><MessageSquare size={14} className="text-emerald-500" /> Service FAQs</span>
                                                        <button type="button" onClick={() => setFormData({ ...formData, faqs: [...formData.faqs, { question: '', answer: '' }] })} className="text-brand text-[9px]">+ Add FAQ</button>
                                                    </label>
                                                    <div className="space-y-4">
                                                        {formData.faqs.map((faq, idx) => (
                                                            <div key={idx} className="bg-gray-50 rounded-2xl p-4 space-y-2 relative group">
                                                                <button type="button" onClick={() => setFormData({ ...formData, faqs: formData.faqs.filter((_, i) => i !== idx) })} className="absolute top-2 right-2 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                                                                <input
                                                                    className="w-full bg-white border border-gray-200 px-4 py-2 rounded-xl text-[11px] font-bold outline-none"
                                                                    placeholder="Question"
                                                                    value={faq.question}
                                                                    onChange={e => {
                                                                        const newF = [...formData.faqs];
                                                                        newF[idx].question = e.target.value;
                                                                        setFormData({ ...formData, faqs: newF });
                                                                    }}
                                                                />
                                                                <textarea
                                                                    className="w-full bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-medium outline-none resize-none"
                                                                    placeholder="Answer"
                                                                    rows={2}
                                                                    value={faq.answer}
                                                                    onChange={e => {
                                                                        const newF = [...formData.faqs];
                                                                        newF[idx].answer = e.target.value;
                                                                        setFormData({ ...formData, faqs: newF });
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Admin Note */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Marketing Note / Admin Instructions</label>
                                                <textarea
                                                    className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm resize-none"
                                                    rows={3}
                                                    value={formData.adminNote}
                                                    onChange={e => setFormData({ ...formData, adminNote: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'loyalty' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-5 duration-300">
                                            {/* ── Loyalty Reward Protocol (Customizable) ── */}
                                            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                                                            <Gift size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none">Reward Protocol</p>
                                                            <p className="text-[9px] font-bold text-amber-700/60 mt-1 uppercase">Buy X, Get Y Free Offer</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, subscriptionOffer: { ...prev.subscriptionOffer, enabled: !prev.subscriptionOffer?.enabled } }))}
                                                        className={`w-11 h-6 rounded-full transition-all relative ${formData.subscriptionOffer?.enabled ? 'bg-amber-500' : 'bg-gray-200'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${formData.subscriptionOffer?.enabled ? 'left-5' : 'left-0.5'}`} />
                                                    </button>
                                                </div>

                                                {formData.subscriptionOffer?.enabled && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-200/50">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest ml-1">Pay for Washes (X)</label>
                                                            <input
                                                                type="number" min="1"
                                                                placeholder="10"
                                                                className="w-full bg-white border border-amber-200 px-4 py-3 rounded-xl text-xs font-bold text-content outline-none focus:border-amber-500 transition-all"
                                                                value={formData.subscriptionOffer?.washCount || 10}
                                                                onChange={e => setFormData(prev => ({ ...prev, subscriptionOffer: { ...prev.subscriptionOffer, washCount: parseInt(e.target.value) } }))}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest ml-1">Get Free Washes (Y)</label>
                                                            <input
                                                                type="number" min="1"
                                                                placeholder="1"
                                                                className="w-full bg-white border border-amber-200 px-4 py-3 rounded-xl text-xs font-bold text-content outline-none focus:border-amber-500 transition-all"
                                                                value={formData.subscriptionOffer?.freeWashes || 1}
                                                                onChange={e => setFormData(prev => ({ ...prev, subscriptionOffer: { ...prev.subscriptionOffer, freeWashes: parseInt(e.target.value) } }))}
                                                            />
                                                        </div>
                                                        <div className="col-span-2 space-y-1.5">
                                                            <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest ml-1">Custom Ribbon Text (Preview)</label>
                                                            <input
                                                                type="text"
                                                                placeholder={`Buy ${formData.subscriptionOffer?.washCount || 10} Get ${formData.subscriptionOffer?.freeWashes || 1} FREE`}
                                                                className="w-full bg-white border border-amber-200 px-4 py-3 rounded-xl text-xs font-bold text-content outline-none focus:border-amber-500 transition-all"
                                                                value={formData.subscriptionOffer?.label || ''}
                                                                onChange={e => setFormData(prev => ({ ...prev, subscriptionOffer: { ...prev.subscriptionOffer, label: e.target.value } }))}
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>

                                            {/* ── Promotional Offers Management ── */}
                                            <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                                            <Gift size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest leading-none">Promotional Offers</p>
                                                            <p className="text-[9px] font-bold text-emerald-700/60 mt-1 uppercase">BANNERS SHOWN IN PROTOCOL MODAL</p>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => setFormData({ ...formData, offers: [...formData.offers, { text: '', code: '', color: 'brand' }] })} className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">+ Add Offer</button>
                                                </div>

                                                <div className="space-y-3">
                                                    {formData.offers.map((offer, idx) => (
                                                        <div key={idx} className="bg-white rounded-xl p-4 border border-emerald-100 space-y-3 relative group">
                                                            <button type="button" onClick={() => setFormData({ ...formData, offers: formData.offers.filter((_, i) => i !== idx) })} className="absolute top-2 right-2 p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="col-span-2 space-y-1">
                                                                    <label className="text-[8px] font-black text-content-subtle uppercase">Offer Message</label>
                                                                    <input
                                                                        className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg text-[10px] font-bold outline-none"
                                                                        placeholder="e.g. 20% OFF on your first wash"
                                                                        value={offer.text}
                                                                        onChange={e => {
                                                                            const newO = [...formData.offers];
                                                                            newO[idx].text = e.target.value;
                                                                            setFormData({ ...formData, offers: newO });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] font-black text-content-subtle uppercase">Promo Code</label>
                                                                    <input
                                                                        className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg text-[10px] font-bold outline-none"
                                                                        placeholder="CLEAN20"
                                                                        value={offer.code}
                                                                        onChange={e => {
                                                                            const newO = [...formData.offers];
                                                                            newO[idx].code = e.target.value;
                                                                            setFormData({ ...formData, offers: newO });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] font-black text-content-subtle uppercase">Theme</label>
                                                                    <select
                                                                        className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg text-[10px] font-bold outline-none"
                                                                        value={offer.color}
                                                                        onChange={e => {
                                                                            const newO = [...formData.offers];
                                                                            newO[idx].color = e.target.value;
                                                                            setFormData({ ...formData, offers: newO });
                                                                        }}
                                                                    >
                                                                        <option value="brand">Brand Gold</option>
                                                                        <option value="emerald">Emerald Green</option>
                                                                        <option value="rose">Rose Pink</option>
                                                                        <option value="blue">Electric Blue</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* ── Monthly Plans Management ── */}
                                            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                                        <Crown size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Monthly Subscriptions</p>
                                                        <p className="text-[9px] font-bold text-indigo-700/60 mt-0.5">Define tiered wash cycles</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <textarea
                                                        rows={3}
                                                        placeholder="4 Times/Month | 249 | 996&#10;8 Times/Month | 139 | 1112"
                                                        className="w-full bg-white border border-indigo-100 px-4 py-3 rounded-xl text-xs font-bold text-indigo-900 outline-none focus:border-indigo-400 transition-all resize-none shadow-sm"
                                                        value={formData.plansText || ''}
                                                        onChange={e => setFormData(prev => ({ ...prev, plansText: e.target.value }))}
                                                    />
                                                    <p className="text-[8px] font-bold text-indigo-300 ml-1 select-none">Format: Label | PerWashPrice | TotalPrice (One per line)</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 pb-2 sticky bottom-0 bg-white">
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
                )
                }
            </AnimatePresence >

            {/* Delete Confirmation Modal */}
            < AnimatePresence >
                {
                    deleteConfirm.isOpen && (
                        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 border border-gray-100 shadow-2xl text-center"
                            >
                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="text-xl font-black text-content leading-none uppercase tracking-tighter mb-2">Decommission?</h3>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mb-8 px-4">This action will permanently decommissioning this service protocol.</p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                                        className="flex-1 bg-gray-100 text-content-subtle py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                                    >
                                        Terminate
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </>
    );
};

export default AdminServices;
