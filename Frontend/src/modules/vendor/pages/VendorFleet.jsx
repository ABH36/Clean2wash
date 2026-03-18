import React, { useState, useEffect } from 'react';
import {
    Users, Truck, Plus, Search,
    MoreVertical, MapPin, Phone, Mail,
    Star, Shield, AlertCircle, X, Check,
    Trash2, Edit3, Briefcase, Zap, Car, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import VendorLayout from '../components/VendorLayout';
import { vendorAPI } from '../../../utils/vendorApi';

const VEHICLE_TYPES = ['Electric Eco', 'Service Van', 'Mobile Unit', 'Mini Truck'];

const VendorFleet = () => {
    const [vehicles, setVehicles] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('personnel'); // 'personnel' or 'vehicles'
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState({ model: '', plate: '', status: 'Available', type: 'Electric Eco' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, staffRes] = await Promise.all([
                    vendorAPI.getProfile(),
                    vendorAPI.getStaff()
                ]);
                if (profileRes.status === 'success') {
                    setVehicles(profileRes.data.vendor.profile?.fleet || []);
                }
                if (staffRes.status === 'success') {
                    setStaffList(staffRes.data.staff || []);
                }
            } catch (err) {
                console.error('Failed to fetch fleet data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleOpenDrawer = (target = null) => {
        if (target) {
            setEditTarget(target);
            setForm(target);
        } else {
            setEditTarget(null);
            setForm({ model: '', plate: '', status: 'Available', type: 'Electric Eco' });
        }
        setDrawerOpen(true);
    };

    const handleSaveVehicle = async () => {
        if (!form.model || !form.plate) return;
        setSaving(true);

        try {
            let updatedVehicles;
            if (editTarget) {
                updatedVehicles = vehicles.map(v => v.id === editTarget.id ? { ...form } : v);
            } else {
                const timestamp = Date.now().toString().slice(-4);
                const random = Math.random().toString(36).substr(2, 2).toUpperCase();
                const newVehicle = { ...form, id: `VH-${timestamp}-${random}` };
                updatedVehicles = [...vehicles, newVehicle];
            }

            const res = await vendorAPI.updateProfile({ 'profile.fleet': updatedVehicles });
            if (res.status === 'success') {
                setVehicles(updatedVehicles);
                setDrawerOpen(false);
            }
        } catch (err) {
            console.error('Failed to save vehicle', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteVehicle = async (id) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-content uppercase tracking-tight italic">Are you sure you want to delete this unit?</p>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const updatedVehicles = vehicles.filter(v => v.id !== id);
                            try {
                                const res = await vendorAPI.updateProfile({ 'profile.fleet': updatedVehicles });
                                if (res.status === 'success') {
                                    setVehicles(updatedVehicles);
                                    toast.success('Unit decommissioned');
                                }
                            } catch (err) {
                                console.error('Failed to delete vehicle', err);
                                toast.error('Decommissioning failed');
                            }
                        }}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        Decommission
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-gray-100 text-content px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        Keep Unit
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    return (
        <VendorLayout title="Fleet Ops" subtitle="Manage your mobile service units & field agents">
            <div className="space-y-8">
                {/* Global Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Agents', val: String(staffList.length).padStart(2, '0'), icon: Users, color: 'text-blue-500' },
                        { label: 'Units Deployed', val: String(vehicles.length).padStart(2, '0'), icon: Truck, color: 'text-amber-500' },
                        { label: 'On Service', val: '00', icon: MapPin, color: 'text-green-500' },
                        { label: 'Fleet Health', val: '98%', icon: Zap, color: 'text-purple-500' },
                    ].map(s => (
                        <div key={s.label} className="bg-surface p-5 rounded-3xl border border-gray-100/10 shadow-soft flex items-center justify-between transition-all hover:scale-105">
                            <div>
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-none mb-2">{s.label}</p>
                                <h3 className={`text-xl font-black ${s.color}`}>{s.val}</h3>
                            </div>
                            <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center text-content-muted">
                                <s.icon size={18} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tactical Tabs */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 bg-background p-1 rounded-2xl border border-gray-100/10">
                        <button
                            onClick={() => setActiveTab('personnel')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic flex items-center gap-2 ${activeTab === 'personnel' ? 'bg-surface text-brand shadow-sm' : 'text-content-subtle hover:text-content'}`}
                        >
                            <Users size={14} /> Personnel
                        </button>
                        <button
                            onClick={() => setActiveTab('vehicles')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic flex items-center gap-2 ${activeTab === 'vehicles' ? 'bg-surface text-brand shadow-sm' : 'text-content-subtle hover:text-content'}`}
                        >
                            <Truck size={14} /> Vehicle Registry
                        </button>
                    </div>

                    {activeTab === 'vehicles' && (
                        <button
                            onClick={() => handleOpenDrawer()}
                            className="h-12 px-6 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2 hover:scale-105 transition-all"
                        >
                            <Plus size={16} /> Commission Unit
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="w-10 h-10 text-brand animate-spin" />
                        </div>
                    ) : activeTab === 'personnel' ? (
                        <motion.div
                            key="personnel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {staffList.length > 0 ? staffList.map((staff) => (
                                <div key={staff.id} className="bg-surface rounded-[2.5rem] border border-gray-100/10 p-8 shadow-soft space-y-6 relative group overflow-hidden transition-colors">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center text-content-muted relative">
                                            <Users size={28} />
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-lg border-4 border-surface flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-content tracking-tight">{staff.name}</h3>
                                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest italic">{staff.id}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-background rounded-2xl p-4 border border-gray-100/5">
                                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest italic mb-1">Status</p>
                                            <p className="text-[11px] font-black text-green-500">On Standby</p>
                                        </div>
                                        <div className="bg-background rounded-2xl p-4 border border-gray-100/5">
                                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest italic mb-1">Rating</p>
                                            <div className="flex items-center gap-1">
                                                <Star size={10} className="text-yellow-500" fill="currentColor" />
                                                <p className="text-[11px] font-black text-content">4.9</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-gray-100/5">
                                        <div className="flex items-center gap-3 text-content-muted">
                                            <Phone size={14} />
                                            <span className="text-[10px] font-bold">{staff.phone || 'Registry Missing'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-content-muted">
                                            <Briefcase size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{staff.specialization || 'General Ops'}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-20 flex flex-col items-center gap-4 text-center bg-surface border border-dashed border-gray-100/20 rounded-[3rem]">
                                    <Users size={32} className="text-content-subtle/20" />
                                    <h3 className="text-base font-black text-content italic uppercase tracking-tighter">No Personnel Registered</h3>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">Register staff in the Settings module</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="vehicles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="bg-surface rounded-[3rem] border border-gray-100/10 shadow-soft overflow-hidden transition-colors"
                        >
                            <table className="w-full text-left">
                                <thead className="bg-background border-b border-gray-100/10">
                                    <tr className="text-[10px] font-black text-content-subtle uppercase tracking-widest">
                                        <th className="px-8 py-5">Unit Info</th>
                                        <th className="px-8 py-5">Unit ID</th>
                                        <th className="px-8 py-5">Registry Plate</th>
                                        <th className="px-8 py-5">Tactical Type</th>
                                        <th className="px-8 py-5">Deployment Status</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/5">
                                    {vehicles.map((v) => (
                                        <tr key={v.id} className="group hover:bg-background/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-content-subtle">
                                                        <Truck size={18} />
                                                    </div>
                                                    <span className="text-sm font-black text-content tracking-tight uppercase tracking-tighter italic">{v.model}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-[11px] font-bold text-content-subtle font-mono">{v.id}</span>
                                            </td>
                                            <td className="px-8 py-5 font-black italic text-xs tracking-tighter text-content">
                                                {v.plate}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-background border border-gray-100/5 rounded-lg text-content-muted italic">{v.type}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'Available' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${v.status === 'Available' ? 'text-green-500' : 'text-amber-500'}`}>{v.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => handleOpenDrawer(v)} className="w-9 h-9 bg-surface border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted hover:text-brand shadow-sm"><Edit3 size={15} /></button>
                                                    <button onClick={() => handleDeleteVehicle(v.id)} className="w-9 h-9 bg-surface border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted hover:text-red-500 shadow-sm"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {vehicles.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Car size={32} className="text-content-subtle/20" />
                                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">Global Fleet Unassigned</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Vehicle Ops Drawer */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" />
                        <motion.aside
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface z-[210] shadow-2xl flex flex-col border-l border-gray-100/10"
                        >
                            <div className="p-8 border-b border-gray-100/10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-content italic tracking-tight uppercase tracking-tighter">Unit <span className="text-brand">Deployment</span></h2>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">Register new tactical fleet asset</p>
                                </div>
                                <button onClick={() => setDrawerOpen(false)} className="w-10 h-10 bg-background rounded-xl flex items-center justify-center text-content-muted border border-gray-100/10"><X size={20} /></button>
                            </div>
                            <div className="flex-1 p-8 space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4 italic mb-2 block">Model Name</label>
                                    <input
                                        type="text" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="e.g. Hero Electric Nyx"
                                        className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4 italic mb-2 block">Plate Number</label>
                                    <input
                                        type="text" value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} placeholder="KA 03 GH 8812"
                                        className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4 italic mb-2 block">Tactical Category</label>
                                    <select
                                        value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                        className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand appearance-none transition-all"
                                    >
                                        {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="p-8 border-t border-gray-100/10">
                                <button
                                    onClick={handleSaveVehicle}
                                    disabled={saving}
                                    className="w-full h-16 bg-content text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-content/20 hover:bg-brand transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check size={18} strokeWidth={3} /> {editTarget ? 'Update Dispatch' : 'Complete Registry'}</>}
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </VendorLayout>
    );
};

export default VendorFleet;
