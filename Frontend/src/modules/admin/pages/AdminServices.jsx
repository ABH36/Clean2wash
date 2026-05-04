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
        <PageShell
            title="Protocol Control"
            subtitle="Service architecture and operational grid management"
            icon={Settings}
            accent="navy"
            badge="Grid-V2"
            actions={
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
                        <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="adm-btn adm-btn-amber h-11 px-6 flex items-center gap-2 shrink-0"
                    >
                        <Plus size={18} /> Deploy Protocol
                    </button>
                </div>
            }
        >
            <FilterBar>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`flex-shrink-0 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                filter === cat 
                                    ? 'bg-slate-900 text-amber-500 shadow-lg' 
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {cat === 'Express' ? 'Instant Wash' : cat}
                        </button>
                    ))}
                </div>
                <div className="ml-auto relative group w-64">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Locate protocol..."
                        className="adm-input pl-12 h-11 text-xs font-bold uppercase"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </FilterBar>


            {/* ── SERVICE ARCHITECTURE ── */}
            {isFetching ? (
                <div className="adm-card py-32 flex flex-col items-center justify-center">
                    <div className="adm-spinner" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6">Scanning Service Grid...</p>
                </div>
            ) : filteredServices.length === 0 ? (
                <div className="adm-card py-32 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-6">
                        <Settings size={48} />
                    </div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No active protocols detected</p>
                </div>
            ) : view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredServices.map((service, i) => (
                        <motion.div
                            key={service._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="adm-card group hover:border-amber-500 transition-all flex flex-col overflow-hidden"
                        >
                            <div className="h-44 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                {service.image ? (
                                    <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <ImageIcon size={40} className="text-slate-300" />
                                )}
                                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-all" />
                                
                                <div className="absolute top-4 left-4">
                                    <div className={`adm-badge ${service.status === 'Live' ? 'adm-badge-success' : 'adm-badge-error'} px-2 py-1`}>
                                        {service.status}
                                    </div>
                                </div>
                                
                                <div className="absolute top-4 right-4 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => handleOpenEdit(service)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-lg"><Edit2 size={16} /></button>
                                    <button onClick={() => setDeleteConfirm({ isOpen: true, id: service._id })} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-lg"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{service.category}</p>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">#{service._id.slice(-6)}</p>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 leading-tight mb-6 group-hover:text-amber-600 transition-colors uppercase tracking-tight">{service.name}</h3>
                                
                                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-slate-400" />
                                        <span className="text-[11px] font-black text-slate-600 uppercase">{service.time}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Standard Unit</p>
                                        <p className="text-xl font-black text-slate-900 leading-none">₹{service.price}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="adm-card overflow-hidden">
                    <div className="adm-table-container">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Protocol Desc</th>
                                    <th>Metadata</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-right">Valuation</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredServices.map(service => (
                                    <tr key={service._id} className="group transition-all">
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                                    <Settings size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{service.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{service.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className="text-amber-500" />
                                                    <span className="text-[11px] font-black text-slate-600 uppercase">{service.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Shield size={12} className="text-slate-400" />
                                                    <span className="text-[11px] font-black text-slate-400 uppercase">{service.type || 'Standard'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className={`adm-badge ${service.status === 'Live' ? 'adm-badge-success' : 'adm-badge-error'} px-3 py-1.5 mx-auto`}>
                                                {service.status}
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <p className="text-lg font-black text-slate-900">₹{service.price}</p>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleOpenEdit(service)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Edit2 size={16} /></button>
                                                <button onClick={() => setDeleteConfirm({ isOpen: true, id: service._id })} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── PROTOCOL CONFIGURATION TERMINAL ── */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
                        >
                            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{editingService ? 'Modify Protocol' : 'New Service Node'}</h2>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mt-1.5">Control Configuration Terminal</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-white border border-slate-200 hover:bg-slate-900 hover:text-white rounded-2xl text-slate-400 transition-all flex items-center justify-center shadow-sm">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Terminal Tabs */}
                            <div className="px-10 py-2 bg-white border-b border-slate-50 flex items-center gap-8">
                                {[
                                    { id: 'basic', label: 'Core Sync' },
                                    { id: 'advanced', label: 'Advanced Protocol' },
                                    { id: 'loyalty', label: 'Loyalty & Plans' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${
                                            activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <motion.div layoutId="modal-tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                                <form onSubmit={handleSave} className="space-y-8">
                                    {activeTab === 'basic' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Identity</label>
                                                <input
                                                    required
                                                    placeholder="e.g. ULTRA STEAM DETAIL"
                                                    className="adm-input"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Category</label>
                                                <select
                                                    className="adm-input appearance-none"
                                                    value={formData.category}
                                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                >
                                                    <option value="Express">EXPRESS (INSTANT WASH)</option>
                                                    <option value="Doorstep">DOORSTEP DELIVERY</option>
                                                    <option value="Studio">STUDIO DETAILING</option>
                                                    <option value="Add-ons">SUPPLEMENTAL ADD-ON</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Network Node Type</label>
                                                <select
                                                    className="adm-input appearance-none"
                                                    value={formData.type}
                                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                >
                                                    <option value="Standard">STANDARD</option>
                                                    <option value="Premium">PREMIUM</option>
                                                    <option value="Elite">ELITE</option>
                                                    <option value="Waterless">WATERLESS</option>
                                                    <option value="Steam">STEAM</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valuation (₹)</label>
                                                <input
                                                    required
                                                    type="number"
                                                    placeholder="e.g. 599"
                                                    className="adm-input text-lg font-black"
                                                    value={formData.price}
                                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Duration</label>
                                                <input
                                                    required
                                                    placeholder="e.g. 45m"
                                                    className="adm-input"
                                                    value={formData.time}
                                                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marketing Note / Admin Instructions</label>
                                                <textarea
                                                    className="adm-input min-h-[100px] py-4"
                                                    placeholder="Operational notes for dispatch teams..."
                                                    value={formData.adminNote}
                                                    onChange={e => setFormData({ ...formData, adminNote: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'advanced' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            {/* Dynamic Pricing Console */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="adm-card bg-slate-50 p-6 border-slate-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Multiplier Console</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Dynamic demand-based pricing</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, multiplierEnabled: !prev.multiplierEnabled }))}
                                                        className={`w-14 h-8 rounded-full transition-all relative ${formData.multiplierEnabled ? 'bg-amber-500 shadow-lg shadow-amber-200' : 'bg-slate-200'}`}
                                                    >
                                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.multiplierEnabled ? 'left-7' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Starting Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        className="adm-input"
                                                        value={formData.startingPrice}
                                                        onChange={e => setFormData({ ...formData, startingPrice: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Scope & Assets Management */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                <div className="space-y-6">
                                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                                        <Settings size={14} className="text-amber-500" /> Detailed Coverage Scope
                                                    </label>
                                                    <div className="space-y-3">
                                                        {formData.detailedCoverage.map((point, idx) => (
                                                            <div key={idx} className="flex gap-3">
                                                                <input
                                                                    className="adm-input h-10"
                                                                    value={point}
                                                                    onChange={e => handleUpdateArrayItem('detailedCoverage', idx, e.target.value)}
                                                                />
                                                                <button type="button" onClick={() => handleRemoveArrayItem('detailedCoverage', idx)} className="w-10 h-10 bg-slate-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                                                            </div>
                                                        ))}
                                                        <button type="button" onClick={() => handleAddArrayItem('detailedCoverage')} className="w-full h-12 border border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-amber-500 hover:text-amber-500 transition-all">+ Add Scope Protocol</button>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                                        <ImageIcon size={14} className="text-amber-500" /> Protocol Visuals
                                                    </label>
                                                    <div className="space-y-4">
                                                        <div className="space-y-1.5">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Display Asset</p>
                                                            <input className="adm-input h-10" placeholder="https://..." value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Banner Component URL</p>
                                                            <input className="adm-input h-10" placeholder="https://..." value={formData.bannerImage} onChange={e => setFormData({ ...formData, bannerImage: e.target.value })} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Trust Rating</p>
                                                                <input type="number" step="0.1" className="adm-input h-10" value={formData.rating} onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })} />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Visual Badge</p>
                                                                <input className="adm-input h-10" placeholder="BEST SELLER" value={formData.tag} onChange={e => setFormData({ ...formData, tag: e.target.value })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sub-System Modules (Features, Steps, FAQs) */}
                                            <div className="pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                                            <Stars size={14} className="text-amber-500" /> Premium Features
                                                        </label>
                                                        <button type="button" onClick={() => setFormData({ ...formData, features: [...formData.features, { icon: 'CheckCircle2', text: '' }] })} className="text-[9px] font-black text-amber-600 uppercase hover:underline">+ New Feature</button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {formData.features.map((f, idx) => (
                                                            <div key={idx} className="flex gap-3">
                                                                <input
                                                                    className="adm-input h-10 flex-1"
                                                                    placeholder="e.g. Eco-Friendly"
                                                                    value={f.text}
                                                                    onChange={e => {
                                                                        const newF = [...formData.features];
                                                                        newF[idx].text = e.target.value;
                                                                        setFormData({ ...formData, features: newF });
                                                                    }}
                                                                />
                                                                <button type="button" onClick={() => setFormData({ ...formData, features: formData.features.filter((_, i) => i !== idx) })} className="w-10 h-10 text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all"><Trash2 size={14} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                                            <Settings size={14} className="text-blue-500" /> Execution Matrix
                                                        </label>
                                                        <button type="button" onClick={() => setFormData({ ...formData, protocolSteps: [...formData.protocolSteps, ''] })} className="text-[9px] font-black text-blue-600 uppercase hover:underline">+ New Step</button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {formData.protocolSteps.map((step, idx) => (
                                                            <div key={idx} className="flex gap-3 items-center">
                                                                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] font-black shrink-0">{idx + 1}</div>
                                                                <input
                                                                    className="adm-input h-10 flex-1"
                                                                    value={step}
                                                                    onChange={e => {
                                                                        const newS = [...formData.protocolSteps];
                                                                        newS[idx] = e.target.value;
                                                                        setFormData({ ...formData, protocolSteps: newS });
                                                                    }}
                                                                />
                                                                <button type="button" onClick={() => setFormData({ ...formData, protocolSteps: formData.protocolSteps.filter((_, i) => i !== idx) })} className="text-red-500 hover:scale-110 transition-transform"><Trash2 size={14} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                                      {activeTab === 'loyalty' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            {/* Promotional Offers */}
                                            <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                                            <Gift size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest leading-none">Promotional Offers</p>
                                                            <p className="text-[9px] font-bold text-emerald-700/60 mt-1 uppercase">Banners shown in protocol modal</p>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => setFormData({ ...formData, offers: [...formData.offers, { text: '', code: '', color: 'brand' }] })} className="adm-btn adm-btn-ghost text-[10px] h-9 px-4">+ Add Offer</button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {formData.offers.map((offer, idx) => (
                                                        <div key={idx} className="bg-white rounded-xl p-4 border border-emerald-100 space-y-4 relative group">
                                                            <button type="button" onClick={() => setFormData({ ...formData, offers: formData.offers.filter((_, i) => i !== idx) })} className="absolute top-2 right-2 p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-lg"><X size={14} /></button>
                                                            <div className="space-y-3">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Offer Message</label>
                                                                    <input
                                                                        className="adm-input h-9 text-[11px]"
                                                                        placeholder="e.g. 20% OFF on your first wash"
                                                                        value={offer.text}
                                                                        onChange={e => {
                                                                            const newO = [...formData.offers];
                                                                            newO[idx].text = e.target.value;
                                                                            setFormData({ ...formData, offers: newO });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Promo Code</label>
                                                                        <input
                                                                            className="adm-input h-9 text-[11px]"
                                                                            placeholder="CLEAN20"
                                                                            value={offer.code}
                                                                            onChange={e => {
                                                                                const newO = [...formData.offers];
                                                                                newO[idx].code = e.target.value;
                                                                                setFormData({ ...formData, offers: newO });
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Theme</label>
                                                                        <select
                                                                            className="adm-input h-9 text-[11px] appearance-none"
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
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Monthly Plans Management */}
                                            <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                                        <Crown size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-none">Monthly Subscriptions</p>
                                                        <p className="text-[9px] font-bold text-indigo-700/60 mt-1">Define tiered wash cycles</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <textarea
                                                        rows={4}
                                                        placeholder="4 Times/Month | 249 | 996&#10;8 Times/Month | 139 | 1112"
                                                        className="adm-input min-h-[120px] py-4 text-xs font-bold"
                                                        value={formData.plansText || ''}
                                                        onChange={e => setFormData(prev => ({ ...prev, plansText: e.target.value }))}
                                                    />
                                                    <p className="text-[9px] font-bold text-indigo-300 ml-1">Format: Label | PerWashPrice | TotalPrice (One per line)</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-8 sticky bottom-0 bg-white">
                                        <button
                                            disabled={loading}
                                            className="adm-btn adm-btn-primary w-full h-14 text-sm font-black uppercase tracking-widest shadow-xl"
                                        >
                                            {loading ? 'Synchronizing Node...' : (
                                                <>{editingService ? 'Apply Synchronization' : 'Commit Protocol'} <CheckCircle2 size={18} className="ml-2" /></>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm.isOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 relative z-10 border border-slate-100 shadow-2xl text-center"
                        >
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">Decommission Node?</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">This action will permanently purge this service protocol from the operational grid.</p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                                    className="flex-1 adm-btn adm-btn-ghost h-12 text-[10px] font-black uppercase tracking-widest"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 adm-btn bg-rose-500 text-white h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200"
                                >
                                    Execute
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

export default AdminServices;

