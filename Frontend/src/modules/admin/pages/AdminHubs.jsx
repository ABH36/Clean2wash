import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, LayoutGrid, List, Plus, MapPin, Edit2, Trash2,
    Globe, Navigation, Users, X, CheckCircle2, RefreshCw,
    Activity, Shield, Zap, Target
} from 'lucide-react';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';
import PageShell, { SectionCard, FilterBar, SearchBox, StatusTabs, EmptyState, PageLoader } from '../components/PageShell';

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
        const matchesSearch = h.name?.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase());
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

    const stats = [
        { label: 'Global Nodes', value: hubs.length, icon: MapPin, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Operational', value: hubs.filter(h => h.status === 'Online').length, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Maintenance', value: hubs.filter(h => h.status === 'Offline').length, icon: Shield, color: 'text-rose-500', bg: 'bg-rose-50' },
        { label: 'Cluster Load', value: 'Moderate', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' }
    ];

    return (
        <PageShell
            title="Infrastructure Matrix"
            subtitle="Network node management and deployment protocols"
            icon={MapPin}
            accent="amber"
            badge="Mesh-v2"
            actions={
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchHubs}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                    >
                        <RefreshCw size={18} className={pageLoading ? 'animate-spin text-slate-900' : ''} />
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="adm-btn adm-btn-primary h-10 px-5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                        <Plus size={18} /> Deploy Node
                    </button>
                </div>
            }
        >
            <div className="space-y-8">
                {/* ── STATS GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className={`p-6 rounded-[2rem] border border-slate-100 ${stat.bg} relative overflow-hidden group`}>
                            <div className="relative z-10">
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${stat.color}`}>{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                            </div>
                            <stat.icon className={`absolute -bottom-4 -right-4 w-20 h-20 opacity-[0.05] transition-transform group-hover:scale-110 ${stat.color}`} />
                        </div>
                    ))}
                </div>

                <SectionCard
                    title="Cluster Telemetry"
                    actions={
                        <FilterBar className="!border-0 !p-0 !bg-transparent">
                            <SearchBox 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                placeholder="Identify node..." 
                            />
                            <div className="h-6 w-[1px] bg-slate-100 hidden md:block" />
                            <StatusTabs 
                                tabs={[
                                    { label: 'Omni', value: 'All' },
                                    { label: 'Online', value: 'Online' },
                                    { label: 'Offline', value: 'Offline' }
                                ]}
                                active={filter}
                                onChange={setFilter}
                            />
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16} /></button>
                                <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={16} /></button>
                            </div>
                        </FilterBar>
                    }
                    noPad
                >
                    {pageLoading ? (
                        <PageLoader />
                    ) : filteredHubs.length === 0 ? (
                        <EmptyState 
                            icon={MapPin} 
                            title="Registry Void" 
                            subtitle="No infrastructure nodes identified in this sector." 
                        />
                    ) : view === 'grid' ? (
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredHubs.map((hub, i) => (
                                <motion.div
                                    key={hub.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-amber-500 hover:shadow-xl transition-all flex flex-col group overflow-hidden"
                                >
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 bg-slate-900 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <MapPin size={28} />
                                            </div>
                                            <div className={`adm-badge ${hub.status === 'Online' ? 'adm-badge-success' : 'adm-badge-error'} px-3 py-1.5`}>
                                                {hub.status}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-amber-600 transition-colors">{hub.name}</h4>
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <div className="flex items-center gap-2">
                                                    <Globe size={12} className="text-slate-400" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{hub.city} • {hub.type}</p>
                                                </div>
                                                {hub.vendor && (
                                                    <div className="flex items-center gap-2">
                                                        <Users size={12} className="text-amber-500" />
                                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{hub.vendor.profile?.studioName || hub.vendor.name}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-8 py-6 grid grid-cols-3 gap-4 border-t border-slate-50 mt-auto bg-slate-50/50">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Captains</p>
                                            <h5 className="text-sm font-black text-slate-800">{hub.captains || 0}</h5>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Load</p>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${hub.load === 'Peak' ? 'bg-red-100 text-red-600' : hub.load === 'High' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {hub.load || 'MOD'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Signal</p>
                                            <h5 className="text-sm font-black text-emerald-500">{hub.efficiency || '98%'}</h5>
                                        </div>
                                    </div>

                                    <div className="p-4 border-t border-slate-50 flex gap-2">
                                        <button onClick={() => handleOpenEdit(hub)} className="flex-1 h-11 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"><Edit2 size={16} /></button>
                                        <button onClick={() => setDeleteConfirm({ isOpen: true, id: hub.id })} className="flex-1 h-11 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="adm-table-container">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Node / Sector</th>
                                        <th>Command</th>
                                        <th className="text-center">Resources</th>
                                        <th className="text-center">Metrics</th>
                                        <th className="text-right">Signal Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHubs.map(hub => (
                                        <tr key={hub.id} className="group transition-all">
                                            <td>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                                        <MapPin size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{hub.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{hub.city} • {hub.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[12px] font-black text-slate-700 leading-none">{hub.vendor?.name || hub.manager || 'No Manager'}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{hub.vendor?.profile?.studioName || 'Lead Manager'}</p>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                                                    <Users size={12} className="text-amber-500" />
                                                    <span className="text-[11px] font-black text-slate-600 uppercase">{hub.captains || 0} Active</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <p className="text-[13px] font-black text-slate-800 leading-none">{hub.efficiency || '98%'}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Flow</p>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-4">
                                                    <div className={`adm-badge ${hub.status === 'Online' ? 'adm-badge-success' : 'adm-badge-error'} px-3 py-1.5`}>
                                                        {hub.status}
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button onClick={() => handleOpenEdit(hub)} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all"><Edit2 size={16} /></button>
                                                        <button onClick={() => setDeleteConfirm({ isOpen: true, id: hub.id })} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>
            </div>

            {/* ── MODALS ── */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{editingHub ? 'Sync Protocol' : 'Deploy Node'}</h2>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1.5">Infrastructure Hub Configuration</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
                            </div>
                            
                            <div className="p-10 overflow-y-auto">
                                <form onSubmit={handleSave} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Node Identity</label>
                                            <input required placeholder="Registry Name" className="adm-input h-12" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deployment Sector</label>
                                            <input required placeholder="City/Region" className="adm-input h-12" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Infrastructure Class</label>
                                            <select className="adm-input h-12 appearance-none uppercase text-xs font-bold" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                                <option value="Studio">Elite Studio</option>
                                                <option value="Node">Operational Node</option>
                                                <option value="Hub">Logistics Hub</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Command Personnel</label>
                                            <select className="adm-input h-12 appearance-none uppercase text-xs font-bold" value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })}>
                                                <option value="">Select Vendor</option>
                                                {vendors.map(v => (
                                                    <option key={v._id} value={v._id}>{v.profile?.studioName || v.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Gated Complex Protocol</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enable specialized society management</p>
                                        </div>
                                        <button type="button" onClick={() => setFormData({ ...formData, metadata: { ...formData.metadata, isSociety: !formData.metadata.isSociety } })} className={`w-12 h-7 rounded-full transition-all relative ${formData.metadata.isSociety ? 'bg-amber-500' : 'bg-slate-200'}`}>
                                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.metadata.isSociety ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {formData.metadata.isSociety && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tower Registry</label>
                                                <input placeholder="A1, B2, C3" className="adm-input h-12" value={formData.metadata.blocks} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, blocks: e.target.value } })} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Level Matrix</label>
                                                <input placeholder="B1, B2, B3" className="adm-input h-12" value={formData.metadata.parkingLevels} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, parkingLevels: e.target.value } })} />
                                            </div>
                                        </motion.div>
                                    )}

                                    <button disabled={loading} className="adm-btn adm-btn-primary h-14 w-full text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-amber-200 mt-4">
                                        {loading ? <RefreshCw className="animate-spin mx-auto" size={24} /> : (editingHub ? 'Confirm Configuration' : 'Deploy Infrastructure')}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteConfirm.isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm({ isOpen: false, id: null })} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-sm rounded-[3rem] p-10 relative z-10 border border-slate-100 shadow-2xl text-center">
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Decommission?</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed px-4">Permanently terminate this infrastructure node from the global network.</p>
                            <div className="flex flex-col gap-3">
                                <button onClick={handleDelete} className="adm-btn adm-btn-error h-14 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-200">Confirm Termination</button>
                                <button onClick={() => setDeleteConfirm({ isOpen: false, id: null })} className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Abort Command</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

export default AdminHubs;
