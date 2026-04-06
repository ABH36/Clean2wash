import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    LayoutGrid,
    List,
    Plus,
    MapPin,
    Edit2,
    Trash2,
    Globe,
    Navigation,
    Users,
    X,
    CheckCircle2
} from 'lucide-react';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';

const AdminHubs = () => {
    const [view, setView] = useState('grid');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHub, setEditingHub] = useState(null);
    const [hubs, setHubs] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [formData, setFormData] = useState({
        name: '', city: '', captains: '', manager: '', status: 'Online',
        type: 'Studio', load: 'Moderate', vendor: '',
        metadata: {
            isSociety: false,
            blocks: '',
            parkingLevels: '',
            pillarRange: { min: 1, max: 100 }
        }
    });
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

    useEffect(() => {
        fetchHubs();
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await adminAPI.getUsers('vendor');
            if (response.status === 'success') {
                setVendors(response.data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch vendors:', error);
        }
    };

    const fetchHubs = async () => {
        try {
            setPageLoading(true);
            const response = await adminAPI.getHubs();
            if (response.status === 'success') {
                setHubs(response.data.hubs.map(h => ({ ...h, id: h._id })));
            }
        } catch (error) {
            console.error('Failed to fetch hubs:', error);
        } finally {
            setPageLoading(false);
        }
    };

    const filteredHubs = hubs.filter(h => {
        const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'All' || h.status === filter;
        return matchesSearch && matchesFilter;
    });

    const handleOpenAdd = () => {
        setEditingHub(null);
        setFormData({
            name: '', city: '', captains: '', manager: '', status: 'Online',
            type: 'Studio', load: 'Moderate', vendor: '',
            metadata: {
                isSociety: false,
                blocks: '',
                parkingLevels: '',
                pillarRange: { min: 1, max: 100 }
            }
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (hub) => {
        setEditingHub(hub);
        setFormData({
            ...hub,
            vendor: hub.vendor?._id || hub.vendor || '',
            metadata: {
                isSociety: hub.metadata?.isSociety || false,
                blocks: Array.isArray(hub.metadata?.blocks) ? hub.metadata.blocks.join(', ') : '',
                parkingLevels: Array.isArray(hub.metadata?.parkingLevels) ? hub.metadata.parkingLevels.join(', ') : '',
                pillarRange: hub.metadata?.pillarRange || { min: 1, max: 100 }
            }
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                metadata: {
                    ...formData.metadata,
                    blocks: typeof formData.metadata.blocks === 'string' ? formData.metadata.blocks.split(',').map(b => b.trim()).filter(b => b) : formData.metadata.blocks,
                    parkingLevels: typeof formData.metadata.parkingLevels === 'string' ? formData.metadata.parkingLevels.split(',').map(p => p.trim()).filter(p => p) : formData.metadata.parkingLevels
                }
            };

            if (editingHub) {
                await adminAPI.updateHub(editingHub._id, payload);
            } else {
                await adminAPI.createHub(payload);
            }
            await fetchHubs();
            setIsModalOpen(false);
            toast.success(editingHub ? 'Node configuration updated' : 'New node deployed successfully');
        } catch (error) {
            toast.error('Operation failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const id = deleteConfirm.id;
        if (!id) return;

        try {
            await adminAPI.deleteHub(id);
            setHubs(prev => prev.filter(h => h.id !== id));
            toast.success('Infrastructure node decommissioned');
            setDeleteConfirm({ isOpen: false, id: null });
        } catch (error) {
            toast.error('Decommission failed: ' + error.message);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="rounded-[2rem] border border-brand/15 bg-brand/5 px-6 py-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand/70">Apartment Wash Ops</p>
                            <p className="mt-2 text-sm font-bold leading-6 text-content-subtle">
                                Apartment wash registry aur live apartment operations ab dedicated ops desk me manage honge.
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.assign('/admin/apartment-wash')}
                            className="rounded-2xl bg-black px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand"
                        >
                            Open Apartment Desk
                        </button>
                    </div>
                </div>
                {/* Infrastructure Control Header */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto scrollbar-hide">
                        {['All', 'Online', 'Offline'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`flex-1 lg:px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === tab ? 'bg-white text-brand shadow-sm' : 'text-content-subtle hover:text-content'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 lg:w-72 bg-white border border-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-soft group focus-within:border-brand transition-all">
                            <Search size={16} className="text-content-subtle group-focus-within:text-brand" />
                            <input
                                type="text"
                                placeholder="Locate node..."
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
                            <Plus size={18} /> New Node
                        </button>
                    </div>
                </div>

                {/* Hub Grid/List */}
                {pageLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-soft">
                        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em]">Scanning Node Grid...</p>
                    </div>
                ) : filteredHubs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-soft">
                        <MapPin size={40} className="text-gray-100 mb-4" />
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em]">No operational nodes detected</p>
                    </div>
                ) : view === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredHubs.map((hub, i) => (
                            <motion.div
                                key={hub.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft overflow-hidden group hover:border-brand transition-all flex flex-col"
                            >
                                <div className="p-8 pb-4">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-brand border border-gray-100 group-hover:bg-brand group-hover:text-white transition-all shadow-sm">
                                            <MapPin size={28} />
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${hub.status === 'Online' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {hub.status}
                                            </span>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleOpenEdit(hub)} className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-content hover:bg-brand hover:text-white transition-all"><Edit2 size={12} /></button>
                                                <button onClick={() => setDeleteConfirm({ isOpen: true, id: hub.id })} className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-content hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xl font-black text-content uppercase tracking-tight truncate group-hover:text-brand transition-colors">{hub.name}</h4>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <div className="flex items-center gap-2">
                                                <Globe size={10} className="text-content-subtle" />
                                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">{hub.city}</p>
                                            </div>
                                            {hub.vendor && (
                                                <div className="flex items-center gap-2">
                                                    <Users size={10} className="text-brand" />
                                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest">{hub.vendor.profile?.studioName || hub.vendor.name}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 py-6 grid grid-cols-3 gap-4 border-t border-gray-50 mt-auto">
                                    <div>
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Captains</p>
                                        <h5 className="text-sm font-black text-content">{hub.captains}</h5>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Efficiency</p>
                                        <h5 className="text-sm font-black text-brand">{hub.efficiency}</h5>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Load</p>
                                        <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md ${hub.load === 'Peak' ? 'bg-red-100 text-red-600' : hub.load === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                            {hub.load}
                                        </span>
                                    </div>
                                </div>

                                <div className="px-4 pb-4">
                                    <button className="w-full h-12 bg-gray-50 rounded-2xl flex items-center justify-center gap-2 group-hover:bg-content group-hover:text-white transition-all overflow-hidden relative">
                                        <span className="text-[10px] font-black uppercase tracking-widest z-10">Configure Node</span>
                                        <Navigation size={14} className="group-hover:translate-x-3 transition-all duration-300" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft overflow-hidden">
                        <div className="admin-table-container">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Node / Location</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Management</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-center">Resources</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-right">Metrics</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredHubs.map(hub => (
                                        <tr key={hub.id} className="group hover:bg-gray-50/30 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-brand border border-gray-100 group-hover:bg-brand group-hover:text-white transition-all">
                                                        <MapPin size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-content leading-none mb-1.5 uppercase truncate max-w-[200px]">{hub.name}</p>
                                                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">{hub.city} • {hub.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <p className="text-[10px] font-black text-content leading-none">{hub.vendor?.name || hub.manager || 'No Manager'}</p>
                                                    <p className="text-[8px] font-bold text-content-subtle uppercase tracking-widest mt-1">{hub.vendor?.profile?.studioName || 'Lead Manager'}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Users size={12} className="text-brand" />
                                                    <span className="text-[10px] font-bold text-content-muted uppercase">{hub.captains} Active</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <p className="text-sm font-black text-content leading-none">{hub.efficiency}</p>
                                                    <p className="text-[8px] font-bold text-content-subtle uppercase tracking-widest mt-1">Avg Efficiency</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-4">
                                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${hub.status === 'Online' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {hub.status}
                                                    </span>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button onClick={() => handleOpenEdit(hub)} className="p-2 bg-gray-50 hover:bg-brand hover:text-white rounded-xl text-content-subtle transition-all"><Edit2 size={13} /></button>
                                                        <button onClick={() => setDeleteConfirm({ isOpen: true, id: hub.id })} className="p-2 bg-gray-50 hover:bg-red-500 hover:text-white rounded-xl text-content-subtle transition-all"><Trash2 size={13} /></button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Infrastructure Configuration Terminal */}
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
                            className="bg-white w-[95%] md:w-full max-w-3xl rounded-[2rem] md:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-content leading-none uppercase">{editingHub ? 'Update Node Configuration' : 'Deploy New Node'}</h2>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-2 px-1">Infrastructure Control Terminal</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 text-content-subtle transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 md:p-10">
                                <form onSubmit={handleSave} className="space-y-4 md:space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Node Identity</label>
                                            <input
                                                required
                                                placeholder="e.g. Cyber Node Alpha"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Deployment City</label>
                                            <input
                                                required
                                                placeholder="e.g. Gurugram"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.city}
                                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Station Type</label>
                                            <select
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm appearance-none"
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                <option value="Studio">Elite Studio</option>
                                                <option value="Node">Operational Node</option>
                                                <option value="Hub">Logistics Hub</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Ops Status</label>
                                            <select
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm appearance-none"
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="Online">Operational (Online)</option>
                                                <option value="Offline">Maintenance (Offline)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Active Captains</label>
                                            <input
                                                required
                                                type="number"
                                                placeholder="e.g. 24"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.captains}
                                                onChange={e => setFormData({ ...formData, captains: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Managed By (Vendor)</label>
                                            <select
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm appearance-none"
                                                value={formData.vendor}
                                                onChange={e => {
                                                    const selectedVendor = vendors.find(v => v._id === e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        vendor: e.target.value,
                                                        manager: selectedVendor ? selectedVendor.name : formData.manager
                                                    });
                                                }}
                                            >
                                                <option value="">Select Vendor Partner</option>
                                                {vendors.map(v => (
                                                    <option key={v._id} value={v._id}>{v.profile?.studioName || v.name} ({v.name})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Backup Manager Name</label>
                                            <input
                                                required
                                                placeholder="e.g. John Doe"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.manager}
                                                onChange={e => setFormData({ ...formData, manager: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-span-full pt-4 border-t border-gray-100 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-[10px] font-black text-content uppercase tracking-widest leading-none">Society Configuration</h4>
                                                    <p className="text-[8px] font-bold text-content-subtle uppercase tracking-widest mt-1">Enable cluster mode for apartment complexes</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, metadata: { ...formData.metadata, isSociety: !formData.metadata.isSociety } })}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${formData.metadata?.isSociety ? 'bg-brand' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.metadata?.isSociety ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>

                                            {formData.metadata?.isSociety && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                >
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Tower / Blocks (Comma separated)</label>
                                                        <input
                                                            placeholder="Block A, Block B, Tower 1"
                                                            className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand"
                                                            value={formData.metadata.blocks}
                                                            onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, blocks: e.target.value } })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Parking Levels (Comma separated)</label>
                                                        <input
                                                            placeholder="B1, B2, Ground"
                                                            className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand"
                                                            value={formData.metadata.parkingLevels}
                                                            onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, parkingLevels: e.target.value } })}
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-2 md:pt-4">
                                        <button
                                            disabled={loading}
                                            className="w-full bg-content text-white py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl shadow-content/20 flex items-center justify-center gap-3 hover:bg-brand transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Initializing Node...' : (
                                                <>{editingHub ? 'Commit Configuration' : 'Confirm Deployment'} <CheckCircle2 size={18} /></>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
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
                                <h3 className="text-xl font-black text-content leading-none uppercase tracking-tighter mb-2">Decommission Node?</h3>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mb-8 px-4">This action will permanently terminate this infrastructure node protocol.</p>

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

export default AdminHubs;
