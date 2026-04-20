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
    Image as ImageIcon,
    Tag,
    Car,
    Percent,
    Ticket,
    Droplets,
    Check,
    Zap,
    Shield
} from 'lucide-react';

const VEHICLE_TYPES = [
    'Hatchback', 'Sedan', 'SUV', 'MUV', 'Compact SUV', 'MPV', 'Pickup',
    'Luxury Sedan', 'Luxury SUV', 'Coupe', 'Convertible', 'Sports Car', 'Supercar',
    'EV', 'Mini Truck', 'Truck', 'Van', 'Bus', 'Traveler', 'Tractor', 'Vintage',
    'Bike', 'Scooter', 'Superbike'
];

const AdminVehicleCatalog = () => {
    const [view, setView] = useState('grid');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingModel, setEditingModel] = useState(null);
    const [vehicleModels, setVehicleModels] = useState([]);
    const [isFetching, setIsFetching] = useState(true);

    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        type: 'Sedan',
        image: '',
        basePrice: '',
        sessionTime: 45,
        difficulty: 'Medium',
        offers: [],
        coupons: [],
        detailedCoverage: {
            exteriorCeramic: true,
            interiorDeepClean: true,
            tyrePolish: true,
            leatherConditioning: false,
            glassWipe: true,
            engineBayWash: false,
            microfiberDrying: true,
            dashboardPolish: true
        },
        isActive: true,
        features: [],
        faqs: [],
        protocolSteps: []
    });

    const [newOffer, setNewOffer] = useState({ title: '', description: '', discountPercentage: '' });
    const [newCoupon, setNewCoupon] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

    const fetchVehicleModels = async () => {
        setIsFetching(true);
        try {
            if (typeFilter === 'Pending') {
                const res = await adminAPI.getVehicleSuggestions();
                setVehicleModels(res.data.pendingModels || []);
            } else {
                const params = {};
                if (typeFilter !== 'All') params.type = typeFilter;
                const res = await adminAPI.getVehicleModels(params);
                setVehicleModels(res.data.vehicleModels || []);
            }
        } catch (err) {
            console.error('Failed to fetch vehicle models:', err.message);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchVehicleModels();
    }, [typeFilter]);

    const filteredModels = vehicleModels.filter(m => {
        const matchesSearch = (m.brand + ' ' + m.model).toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const handleOpenAdd = () => {
        setEditingModel(null);
        setFormData({
            brand: '',
            model: '',
            type: 'Sedan',
            image: '',
            basePrice: '',
            sessionTime: 45,
            difficulty: 'Medium',
            offers: [],
            coupons: [],
            detailedCoverage: {
                exteriorCeramic: true,
                interiorDeepClean: true,
                tyrePolish: true,
                leatherConditioning: true,
                glassWipe: true,
                engineBayWash: true,
                microfiberDrying: true,
                dashboardPolish: true
            },
            isActive: true,
            features: [],
            faqs: [],
            protocolSteps: []
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (m) => {
        setEditingModel(m);
        setFormData({
            brand: m.brand || '',
            model: m.model || '',
            type: m.type || 'Sedan',
            image: m.image || '',
            basePrice: m.basePrice || '',
            sessionTime: m.sessionTime || m.baseDuration || 45,
            difficulty: m.difficulty || 'Medium',
            offers: m.offers || [],
            coupons: m.coupons || [],
            detailedCoverage: m.detailedCoverage || {
                exteriorCeramic: true,
                interiorDeepClean: true,
                tyrePolish: true,
                leatherConditioning: false,
                glassWipe: true,
                engineBayWash: false,
                microfiberDrying: true,
                dashboardPolish: true
            },
            isActive: m.isActive,
            features: m.features || [],
            faqs: m.faqs || [],
            protocolSteps: m.protocolSteps || []
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingModel) {
                if (editingModel.status === 'Pending') {
                    await adminAPI.reviewVehicleSuggestion(editingModel._id, { ...formData, status: 'Verified' });
                } else {
                    await adminAPI.updateVehicleModel(editingModel._id, formData);
                }
            } else {
                await adminAPI.createVehicleModel(formData);
            }
            await fetchVehicleModels();
            setIsModalOpen(false);
            toast.success(editingModel ? 'Vehicle model updated' : 'New vehicle model added');
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
            await fetchVehicleModels();
            toast.success('Vehicle model deactivated');
            setDeleteConfirm({ isOpen: false, id: null });
        } catch (err) {
            toast.error('Delete failed: ' + err.message);
        }
    };

    const addOffer = () => {
        if (!newOffer.title) return;
        setFormData(prev => ({
            ...prev,
            offers: [...prev.offers, { ...newOffer, discountPercentage: Number(newOffer.discountPercentage) }]
        }));
        setNewOffer({ title: '', description: '', discountPercentage: '' });
    };

    const removeOffer = (index) => {
        setFormData(prev => ({
            ...prev,
            offers: prev.offers.filter((_, i) => i !== index)
        }));
    };

    const addCoupon = () => {
        if (!newCoupon) return;
        setFormData(prev => ({
            ...prev,
            coupons: [...prev.coupons, newCoupon.toUpperCase()]
        }));
        setNewCoupon('');
    };

    const removeCoupon = (index) => {
        setFormData(prev => ({
            ...prev,
            coupons: prev.coupons.filter((_, i) => i !== index)
        }));
    };

    return (
        <>
              <div className="space-y-3 pb-10">
                {/* Header Control Panel */}
                <div className="admin-card">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col gap-0.5 min-w-[200px]">
                            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight leading-none uppercase">Vehicle Catalog</h1>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                                <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest opacity-80">Global Fleet Registry</p>
                            </div>
                        </div>

                        <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border)]">
                            <button
                                onClick={() => setTypeFilter('All')}
                                className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${typeFilter === 'All' ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                            >
                                Catalog
                            </button>
                            <button
                                onClick={() => setTypeFilter('Pending')}
                                className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${typeFilter === 'Pending' ? 'bg-[var(--error)] text-white shadow-lg shadow-[var(--error)]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                            >
                                Verification Desk
                            </button>
                        </div>

                        <div className="flex items-center gap-2 w-full lg:w-auto">
                            <div className="flex-1 lg:w-72 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-1.5 flex items-center gap-3 group focus-within:border-[var(--primary)] transition-all">
                                <Search size={15} className="text-[var(--text-muted)] group-focus-within:text-[var(--primary)]" />
                                <input
                                    type="text"
                                    placeholder="Search Brand or Model..."
                                    className="bg-transparent outline-none text-[10px] font-bold text-[var(--text-primary)] w-full placeholder:text-[var(--text-muted)]"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border)]">
                                <button onClick={() => setView('grid')} className={`p-2.5 rounded-lg transition-all ${view === 'grid' ? 'bg-[var(--bg-secondary)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><LayoutGrid size={18} /></button>
                                <button onClick={() => setView('list')} className={`p-2.5 rounded-lg transition-all ${view === 'list' ? 'bg-[var(--bg-secondary)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><List size={18} /></button>
                            </div>
                            <button
                                onClick={handleOpenAdd}
                                className="h-11 px-5 bg-[var(--primary)] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all group/new"
                            >
                                <Plus size={20} className="group-hover/new:scale-110 transition-transform" /> Add Model
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard Loading */}
                {isFetching ? (
                    <div className="h-64 flex items-center justify-center text-content-subtle font-black text-xs uppercase tracking-[0.2em]">Synchronizing Catalog...</div>
                ) : (
                    <>
                         {view === 'grid' ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                                {filteredModels.map((m, i) => (
                                    <motion.div
                                        key={m._id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="admin-card p-0 overflow-hidden group hover:border-[var(--primary)] transition-all flex flex-col shadow-sm hover:shadow-xl hover:shadow-[var(--primary)]/5"
                                    >
                                        <div className="h-24 bg-[var(--bg-secondary)] relative overflow-hidden flex items-center justify-center">
                                            <img 
                                                src={m.image} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                alt={m.model} 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            
                                            <div className="absolute top-3 left-3">
                                                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                                    m.isActive 
                                                        ? 'bg-[var(--success-light)] text-[var(--success-text)] border-[var(--success)]/20' 
                                                        : 'bg-[var(--error-light)] text-[var(--error-text)] border-[var(--error)]/20'
                                                }`}>
                                                    {m.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                             <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                                {typeFilter === 'Pending' ? (
                                                    <button 
                                                        onClick={() => handleOpenEdit(m)} 
                                                        className="h-9 px-5 bg-[var(--primary)] text-white rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20 active:scale-95 transition-all group/verify"
                                                    >
                                                        <Shield size={18} className="group-hover/verify:scale-110 transition-transform" /> Verify
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => handleOpenEdit(m)} 
                                                            title="Edit Configuration"
                                                            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all group/edit"
                                                        >
                                                            <Edit2 size={15} className="group-hover/edit:rotate-12 transition-transform" />
                                                        </button>
                                                        <button 
                                                            onClick={() => setDeleteConfirm({ isOpen: true, id: m._id })} 
                                                            title="Deactivate Model"
                                                            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-all group/del"
                                                        >
                                                            <Trash2 size={15} className="group-hover/del:scale-110 transition-transform" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {m.offers?.length > 0 && (
                                                    <div className="flex items-center gap-1 bg-[var(--success-light)] px-1.5 py-0.5 rounded-md">
                                                        <Percent size={8} className="text-[var(--success-text)]" />
                                                        <span className="text-[7px] font-bold text-[var(--success-text)] uppercase">{m.offers[0].discountPercentage}% OFF</span>
                                                    </div>
                                                )}
                                                {m.sessionTime && (
                                                    <div className="flex items-center gap-1 bg-[var(--bg-primary)] px-1.5 py-0.5 rounded-md border border-[var(--border)]">
                                                        <Clock size={8} className="text-[var(--text-muted)]" />
                                                        <span className="text-[7px] font-bold text-[var(--text-primary)] uppercase">{m.sessionTime}m</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto flex items-end justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Base Fare</span>
                                                    <p className="text-sm font-black text-[var(--text-primary)] leading-none">₹{m.basePrice || '--'}</p>
                                                </div>
                                                <Zap size={10} className="text-[var(--primary)] opacity-30" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[var(--bg-primary)]">
                                            <th className="px-8 py-5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Vehicle Identity</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Configuration</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center">Status</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Valuation</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right pr-10">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {filteredModels.map(m => (
                                            <tr key={m._id} className="group hover:bg-[var(--bg-primary)]/50 transition-all">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-primary)]">
                                                            <img src={m.image} className="w-full h-full object-cover" alt={m.model} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-[var(--text-primary)] leading-none mb-1.5 uppercase">{m.model}</p>
                                                            <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest">{m.brand}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-primary)] rounded-lg border border-[var(--border)]">
                                                            <Clock size={12} className="text-[var(--primary)]" />
                                                            <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase">{m.sessionTime}m</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-primary)] rounded-lg border border-[var(--border)]">
                                                            <Car size={12} className="text-[var(--primary)]" />
                                                            <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase">{m.type}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                                                        m.isActive 
                                                            ? 'bg-[var(--success-light)] text-[var(--success-text)] border-[var(--success)]/20' 
                                                            : 'bg-[var(--error-light)] text-[var(--error-text)] border-[var(--error)]/20'
                                                    }`}>
                                                        {m.isActive ? 'Active' : 'Offline'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right font-black text-xs text-[var(--text-primary)]">₹{m.basePrice || '--'}</td>
                                                <td className="px-8 py-5 text-right pr-10">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleOpenEdit(m)} 
                                                            className="w-10 h-10 bg-[var(--bg-primary)] hover:bg-[var(--primary)] hover:text-white rounded-xl text-[var(--text-muted)] border border-[var(--border)] transition-all flex items-center justify-center shadow-sm group/edit"
                                                        >
                                                            <Edit2 size={18} className="group-hover/edit:scale-110 transition-transform" />
                                                        </button>
                                                        <button 
                                                            onClick={() => setDeleteConfirm({ isOpen: true, id: m._id })} 
                                                            className="w-10 h-10 bg-[var(--bg-primary)] hover:bg-red-500 hover:text-white rounded-xl text-[var(--text-muted)] border border-[var(--border)] transition-all flex items-center justify-center shadow-sm group/trash"
                                                        >
                                                            <Trash2 size={18} className="group-hover/trash:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                </td>/td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Terminal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-content/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white/5 w-full max-w-4xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]/50">
                                <div>
                                    <h2 className="text-xl font-black text-content leading-none uppercase">{editingModel ? 'Edit Vehicle Profile' : 'New Identity Entry'}</h2>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-2 px-1">Model Configuration Matrix</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/[0.02] rounded-2xl border border-white/5 text-content-subtle transition-all"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 font-sans custom-scrollbar">
                                <form onSubmit={handleSave} className="space-y-10">
                                    {/* Brand & Model Identity */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1.5 flex flex-col flex-1 min-w-0">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Brand Entity</label>
                                            <input required placeholder="Maruti Suzuki" className="w-full bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white/5 transition-all " value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5 flex flex-col flex-1 min-w-0">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Model Designation</label>
                                            <input required placeholder="Grand Vitara" className="w-full bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white/5 transition-all " value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5 flex flex-col flex-1 min-w-0">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Type Protocol</label>
                                            <select className="w-full bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white/5 transition-all  appearance-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                                {VEHICLE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Valuation & Time Matrix */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5 flex flex-col flex-1 min-w-0">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Specific Valuation (₹)</label>
                                            <input type="number" placeholder="499" className="w-full bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white/5 transition-all " value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5 flex flex-col flex-1 min-w-0">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Session Duration (m)</label>
                                            <input type="number" placeholder="45" className="w-full bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white/5 transition-all " value={formData.sessionTime} onChange={e => setFormData({ ...formData, sessionTime: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Visual Entity Profile */}
                                    <div className="space-y-1.5 flex flex-col flex-1 min-w-0">
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Visual Entity Link (Image URL)</label>
                                        <input required placeholder="https://..." className="w-full bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white/5 transition-all " value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                                    </div>

                                    {/* Promotional Pulse (Offers & Coupons) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <Clock size={18} className="text-brand" />
                                                    <h3 className="text-[10px] font-black text-content uppercase tracking-[0.2em]">Duration Strategy</h3>
                                                </div>
                                                <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                                                    <input type="number" placeholder="Min" className="w-full bg-white/5 border border-white/5 px-4 py-3 rounded-xl text-[10px] font-bold outline-none text-content" value={formData.sessionTime} onChange={e => setFormData({ ...formData, sessionTime: e.target.value })} />
                                                    <span className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Minutes Required</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <Zap size={18} className="text-brand" />
                                                    <h3 className="text-[10px] font-black text-content uppercase tracking-[0.2em]">Complexity Index</h3>
                                                </div>
                                                <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                                                    <select
                                                        className="flex-1 bg-white/5 border border-white/5 px-4 py-3 rounded-xl text-[10px] font-bold outline-none text-content"
                                                        value={formData.difficulty}
                                                        onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                                    >
                                                        <option value="Easy">Standard (Easy)</option>
                                                        <option value="Medium">Advanced (Medium)</option>
                                                        <option value="Hard">Complex (Hard)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Offer Entry Matrix */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Percent size={18} className="text-brand" />
                                                <h3 className="text-xs font-black text-content uppercase tracking-widest">Offer Protocols</h3>
                                            </div>
                                            <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5 space-y-3">
                                                <input placeholder="Offer Label (e.g. Launch Offer)" className="w-full bg-white/5 border border-white/5 px-4 py-3 rounded-xl text-[10px] font-bold outline-none text-content" value={newOffer.title} onChange={e => setNewOffer({ ...newOffer, title: e.target.value })} />
                                                <div className="flex gap-2">
                                                    <input type="number" placeholder="Disc %" className="w-20 bg-white/5 border border-white/5 px-4 py-3 rounded-xl text-[10px] font-bold outline-none text-content" value={newOffer.discountPercentage} onChange={e => setNewOffer({ ...newOffer, discountPercentage: e.target.value })} />
                                                    <button type="button" onClick={addOffer} className="flex-1 bg-brand text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-brand/10 hover:scale-[1.02] active:scale-95 transition-all">Engage Offer</button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.offers.map((offer, idx) => (
                                                    <div key={idx} className="bg-brand/10 border border-brand/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-brand uppercase tracking-tight">{offer.title} (-{offer.discountPercentage}%)</span>
                                                        <button type="button" onClick={() => removeOffer(idx)} className="text-brand hover:text-red-500 transition-colors"><X size={12} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Coupon Entry Matrix */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Ticket size={20} className="text-brand" />
                                                <h3 className="text-xs font-black text-content uppercase tracking-widest">Coupon Protocols</h3>
                                            </div>
                                            <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5 flex gap-2">
                                                <input placeholder="NEW2026" className="flex-1 bg-white/5 border border-white/5 px-4 py-3 rounded-xl text-[10px] font-bold outline-none text-content uppercase" value={newCoupon} onChange={e => setNewCoupon(e.target.value)} />
                                                <button type="button" onClick={addCoupon} className="px-6 bg-content text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-brand transition-all">Add</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.coupons.map((coupon, idx) => (
                                                    <div key={idx} className="bg-white/[0.05] px-3 py-1.5 rounded-xl flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-content uppercase tracking-tight">{coupon}</span>
                                                        <button type="button" onClick={() => removeCoupon(idx)} className="text-content-subtle hover:text-red-500 transition-colors"><X size={12} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Advanced Identity Protocols */}
                                    <div className="pt-10 border-t border-white/5 space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Features Section */}
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest flex items-center justify-between">
                                                    <span className="flex items-center gap-2"><Tag size={18} className="text-amber-500" /> Identity Highlights</span>
                                                    <button type="button" onClick={() => setFormData({ ...formData, features: [...formData.features, ''] })} className="text-brand text-[9px] hover:underline">+ Add Feature</button>
                                                </label>
                                                <div className="space-y-2">
                                                    {formData.features.map((f, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <input
                                                                className="flex-1 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl text-[11px] font-bold outline-none"
                                                                placeholder="e.g. Extra Luxury Care"
                                                                value={f}
                                                                onChange={e => {
                                                                    const newF = [...formData.features];
                                                                    newF[idx] = e.target.value;
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
                                                    <span className="flex items-center gap-2"><Zap size={18} className="text-blue-500" /> Model Prep Protocol</span>
                                                    <button type="button" onClick={() => setFormData({ ...formData, protocolSteps: [...formData.protocolSteps, ''] })} className="text-brand text-[9px] hover:underline">+ Add Step</button>
                                                </label>
                                                <div className="space-y-2">
                                                    {formData.protocolSteps.map((step, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <span className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                                                            <input
                                                                className="flex-1 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl text-[11px] font-bold outline-none"
                                                                placeholder="e.g. Special Wheel Care"
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
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button disabled={loading} className="w-full bg-brand text-white py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-brand/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                                            {loading ? 'Synchronizing Model...' : (
                                                <>{editingModel ? 'Update Profile' : 'Commit Configuration'} <CheckCircle2 size={18} /></>
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
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white/5 w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 border border-white/5 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-black text-content uppercase tracking-tighter mb-2">Deactivate Model?</h3>
                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mb-8 px-4">This action will deactivate this vehicle model from the operational catalog.</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                                    className="flex-1 bg-white/[0.05] text-content-subtle py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                                >
                                    Deactivate
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminVehicleCatalog;
