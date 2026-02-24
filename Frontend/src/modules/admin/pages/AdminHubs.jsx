import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import {
    MapPin,
    Navigation,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Activity,
    Shield,
    Users,
    Zap,
    LayoutGrid,
    List,
    MoreVertical,
    CheckCircle2,
    Globe
} from 'lucide-react';

const AdminHubs = () => {
    const [view, setView] = useState('grid');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHub, setEditingHub] = useState(null);
    const [hubs, setHubs] = useState(() => {
        const saved = localStorage.getItem('CarWash_hubs');
        return saved ? JSON.parse(saved) : [
            { id: 'HUB-001', name: 'Sector 15 Studio', city: 'Faridabad', captains: 24, status: 'Online', efficiency: '98%', manager: 'Rahul K.', load: 'High', type: 'Studio' },
            { id: 'HUB-002', name: 'Cyber Hub Node', city: 'Gurugram', captains: 42, status: 'Online', efficiency: '95%', manager: 'Sneha G.', load: 'Peak', type: 'Node' },
            { id: 'HUB-003', name: 'Indirapuram Hub', city: 'Noida', captains: 18, status: 'Offline', efficiency: '88%', manager: 'Amit S.', load: 'Low', type: 'Hub' },
            { id: 'HUB-004', name: 'HSR Layout Node', city: 'Bengaluru', captains: 35, status: 'Online', efficiency: '92%', manager: 'Vikram D.', load: 'Moderate', type: 'Node' },
        ];
    });

    const [formData, setFormData] = useState({ name: '', city: '', captains: '', manager: '', status: 'Online', type: 'Studio', load: 'Moderate' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem('CarWash_hubs', JSON.stringify(hubs));
    }, [hubs]);

    const filteredHubs = hubs.filter(h => {
        const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'All' || h.status === filter;
        return matchesSearch && matchesFilter;
    });

    const handleOpenAdd = () => {
        setEditingHub(null);
        setFormData({ name: '', city: '', captains: '', manager: '', status: 'Online', type: 'Studio', load: 'Moderate' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (hub) => {
        setEditingHub(hub);
        setFormData({ ...hub });
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            if (editingHub) {
                setHubs(prev => prev.map(h => h.id === editingHub.id ? { ...h, ...formData } : h));
            } else {
                const newId = `HUB-${String(hubs.length + 1).padStart(3, '0')}`;
                setHubs(prev => [{ ...formData, id: newId, efficiency: '0%' }, ...prev]);
            }
            setLoading(false);
            setIsModalOpen(false);
        }, 600);
    };

    const handleDelete = (id) => {
        if (window.confirm('Decommission this infrastructure node?')) {
            setHubs(prev => prev.filter(h => h.id !== id));
        }
    };

    return (
        <AdminLayout title="Hub Infrastructure">
            <div className="space-y-6">
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
                {view === 'grid' ? (
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
                                                <button onClick={() => handleDelete(hub.id)} className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-content hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xl font-black text-content italic uppercase tracking-tight truncate group-hover:text-brand transition-colors">{hub.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Globe size={10} className="text-content-subtle" />
                                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest italic">{hub.city} • {hub.id}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 py-6 grid grid-cols-3 gap-4 border-t border-gray-50 mt-auto">
                                    <div>
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Captains</p>
                                        <h5 className="text-sm font-black text-content italic">{hub.captains}</h5>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Efficiency</p>
                                        <h5 className="text-sm font-black text-brand italic">{hub.efficiency}</h5>
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
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest italic">Node / Location</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest italic">Management</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest italic text-center">Resources</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest italic text-right">Metrics</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest italic text-right">Status</th>
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
                                                    <p className="text-xs font-black text-content italic leading-none mb-1.5 uppercase truncate max-w-[200px]">{hub.name}</p>
                                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">{hub.city} • {hub.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <p className="text-[10px] font-black text-content italic leading-none">{hub.manager}</p>
                                                <p className="text-[8px] font-bold text-content-subtle uppercase tracking-widest mt-1">Lead Manager</p>
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
                                                <p className="text-sm font-black text-content italic leading-none">{hub.efficiency}</p>
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
                                                    <button onClick={() => handleDelete(hub.id)} className="p-2 bg-gray-50 hover:bg-red-500 hover:text-white rounded-xl text-content-subtle transition-all"><Trash2 size={13} /></button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Infrastructure Configuration Terminal */}
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
                            className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100"
                        >
                            <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-content italic leading-none uppercase">{editingHub ? 'Update Node Configuration' : 'Deploy New Node'}</h2>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-2 italic px-1">Infrastructure Control Terminal</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 text-content-subtle transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-10">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Node Identity</label>
                                            <input
                                                required
                                                placeholder="e.g. Cyber Node Alpha"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Deployment City</label>
                                            <input
                                                required
                                                placeholder="e.g. Gurugram"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.city}
                                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Station Type</label>
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
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Ops Status</label>
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
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Active Captains</label>
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
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Lead Manager</label>
                                            <input
                                                required
                                                placeholder="e.g. John Doe"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.manager}
                                                onChange={e => setFormData({ ...formData, manager: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            disabled={loading}
                                            className="w-full bg-content text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl shadow-content/20 flex items-center justify-center gap-3 hover:bg-brand transition-all disabled:opacity-50"
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
            </AnimatePresence>
        </AdminLayout>
    );
};

export default AdminHubs;
