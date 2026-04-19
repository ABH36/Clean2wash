import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Car, Trash2, Check, Edit3, AlertCircle, CheckCircle2, ShieldAlert, FileSearch, Zap, Calendar, Radar, Clock, X, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { vehicleAPI } from '../../../utils/api';
import { toast as hotToast } from 'react-hot-toast';
import MobileLayout from '../components/layout/MobileLayout';

const BLANK_FORM = { brand: '', model: '', type: 'Sedan', color: '#3498db', plate: '', insuranceExpiry: '', PUCExpiry: '' };

const VehicleManager = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const fromPage = searchParams.get('from');

    const { vehicles, addVehicle, updateVehicle, removeVehicle, setPrimaryVehicle } = useAuth();
    const [showSheet, setShowSheet] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(BLANK_FORM);
    const [errors, setErrors] = useState({});
    const [isFetching, setIsFetching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [dynamicBrands, setDynamicBrands] = useState(['Honda', 'Maruti', 'Hyundai', 'Toyota', 'Tata', 'Others']);
    const [dynamicTypes, setDynamicTypes] = useState([]);
    const [globalCatalog, setGlobalCatalog] = useState([]);
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const [modelsRes, brandsRes, typesRes] = await Promise.all([
                    vehicleAPI.getVehicleModels(),
                    vehicleAPI.getVehicleBrands(),
                    vehicleAPI.getVehicleTypes()
                ]);
                if (modelsRes.status === 'success') setGlobalCatalog(modelsRes.data.vehicleModels || []);
                if (brandsRes.status === 'success') setDynamicBrands(brandsRes.data.brands || []);
                if (typesRes.status === 'success') setDynamicTypes(typesRes.data.vehicleTypes || []);
            } catch (err) {
                console.error('Failed to fetch resources:', err);
            } finally {
                setLoadingCatalog(false);
            }
        };
        fetchResources();
    }, []);

    const getTypeImage = (typeName) => {
        const typeObj = dynamicTypes.find(t => t.type === typeName || t.name === typeName);
        return typeObj?.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80';
    };

    const matchedCatalogIds = useMemo(() => {
        const matched = new Set();
        if (!Array.isArray(globalCatalog)) return matched;
        vehicles.forEach(v => {
            const match = globalCatalog.find(m =>
                m.brand?.toLowerCase() === v.brand?.toLowerCase() &&
                m.model?.toLowerCase() === v.model?.toLowerCase()
            );
            if (match) matched.add(match._id);
        });
        return matched;
    }, [vehicles, globalCatalog]);

    const filteredCatalog = useMemo(() => {
        if (!Array.isArray(globalCatalog)) return [];
        const filtered = globalCatalog.filter(m =>
            m.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.type?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return [...filtered].sort((a, b) => {
            const aMatched = matchedCatalogIds.has(a._id);
            const bMatched = matchedCatalogIds.has(b._id);
            if (aMatched && !bMatched) return -1;
            if (!aMatched && bMatched) return 1;
            return 0;
        });
    }, [globalCatalog, matchedCatalogIds, searchQuery]);

    const showToast = (msg, type = 'success') => {
        if (type === 'success') hotToast.success(msg);
        else hotToast.error(msg);
    };

    const closeSheet = () => { setShowSheet(false); setEditId(null); setErrors({}); };

    const openAdd = () => { setForm(BLANK_FORM); setEditId(null); setErrors({}); setShowSheet(true); };

    const openEdit = (v) => {
        setForm({
            brand: v.brand,
            model: v.model,
            type: v.type,
            color: v.color || '#3498db',
            plate: v.plate,
            insuranceExpiry: v.compliance?.insuranceExpiry || v.insuranceExpiry || '',
            PUCExpiry: v.compliance?.pucExpiry || v.pucExpiry || ''
        });
        setEditId(v._id || v.id);
        setErrors({});
        setShowSheet(true);
    };

    const handleVahanFetch = async () => {
        if (!form.plate) { setErrors({ plate: 'Enter plate number first' }); return; }
        setIsFetching(true);
        await new Promise(r => setTimeout(r, 1500));
        const mockModel = globalCatalog.length > 0
            ? globalCatalog[Math.floor(Math.random() * globalCatalog.length)]
            : { brand: 'Maruti', model: 'Swift', type: 'Hatchback' };

        setForm(prev => ({
            ...prev,
            brand: mockModel.brand,
            model: mockModel.model,
            type: mockModel.type,
            insuranceExpiry: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
            PUCExpiry: new Date(Date.now() + 15552000000).toISOString().split('T')[0]
        }));
        setIsFetching(false);
        showToast('Details updated via Vahan');
    };

    const validate = () => {
        const e = {};
        if (!form.brand) e.brand = 'Required';
        if (!form.model.trim()) e.model = 'Required';
        if (!form.plate.trim()) e.plate = 'Required';
        else if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/.test(form.plate.replace(/\s/g, '').toUpperCase())) {
            e.plate = 'Invalid plate (e.g. KA05M1234)';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSetPrimary = async (id) => {
        const result = await setPrimaryVehicle(id);
        if (result.success) {
            showToast('Set as primary vehicle');
            if (fromPage) setTimeout(() => navigate(-1), 1000);
        } else {
            showToast(result.error || 'Failed to set primary vehicle', 'error');
        }
    };

    const handleDelete = async (id) => {
        hotToast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-[13px] font-bold text-slate-800">Remove this vehicle from your garage?</p>
                <div className="flex gap-2">
                    <button onClick={async () => { hotToast.dismiss(t.id); await removeVehicle(id); showToast('Vehicle removed'); }} className="bg-red-500 text-white px-4 py-2 rounded-xl text-[11px] font-bold">Delete</button>
                    <button onClick={() => hotToast.dismiss(t.id)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[11px] font-bold">Cancel</button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const handleSave = async () => {
        if (!validate()) return;
        const cleanedPlate = form.plate.replace(/\s/g, '').toUpperCase();
        const vehiclePayload = {
            brand: form.brand,
            model: form.model,
            type: form.type,
            color: form.color,
            plate: cleanedPlate,
            compliance: {
                insuranceExpiry: form.insuranceExpiry || null,
                pucExpiry: form.PUCExpiry || null
            }
        };

        setIsSaving(true);
        try {
            const result = editId ? await updateVehicle(editId, vehiclePayload) : await addVehicle(vehiclePayload);
            if (result.success) {
                showToast(editId ? 'Vehicle updated' : 'Vehicle added');
                closeSheet();
                if (fromPage) setTimeout(() => navigate(-1), 1000);
            } else {
                showToast(result.error || 'Failed to save', 'error');
            }
        } catch (error) {
            showToast('Failed to save vehicle', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const getExpiryStatus = (date) => {
        if (!date) return null;
        const diff = new Date(date) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0) return { label: 'Expired', color: 'text-red-500', bg: 'bg-red-50' };
        if (days < 30) return { label: `${days} days left`, color: 'text-amber-500', bg: 'bg-amber-50' };
        return { label: 'Active', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    };

    const setField = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
    };

    return (
        <MobileLayout>
            <div className="min-h-screen bg-slate-50 font-sans pb-32">
                <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-[60] border-b border-gray-100 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center active:scale-95 transition-all">
                            <ChevronLeft size={18} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[17px] font-[1000] text-slate-900 tracking-tighter uppercase leading-none">My Garage</h1>
                        </div>
                    </div>
                    <button onClick={openAdd} className="h-9 px-4 bg-slate-900 text-[#FF9900] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-lg">
                        <Plus size={14} strokeWidth={3} /> Add New
                    </button>
                </header>

                <div className="px-4 pt-4 space-y-5">
                    <AnimatePresence mode="popLayout">
                        {vehicles.map((v) => {
                            const insStatus = getExpiryStatus(v.compliance?.insuranceExpiry || v.insuranceExpiry);
                            const pucStatus = getExpiryStatus(v.compliance?.pucExpiry || v.PUCExpiry);
                            const vId = v._id || v.id;
                            return (
                                <motion.div key={vId} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className={`bg-white rounded-[28px] border overflow-hidden transition-all ${v.isPrimary ? 'border-[#FF9900]/20 shadow-xl' : 'border-gray-50 shadow-sm'}`}>
                                    <div className="relative h-40 overflow-hidden">
                                        <img src={v.image || v.img || getTypeImage(v.type)} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            {v.isPrimary && (
                                                <div className="bg-[#FF9900] text-slate-900 text-[8px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-widest">
                                                    <CheckCircle2 size={10} strokeWidth={3} /> Primary
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                                            <div>
                                                <p className="text-[#FF9900] text-[9px] font-black uppercase tracking-[0.2em] mb-1">{v.brand}</p>
                                                <h3 className="text-white text-[18px] font-[1000] uppercase tracking-tighter leading-none">{v.model}</h3>
                                            </div>
                                            <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 flex flex-col items-center shadow-lg">
                                                <span className="text-[10px] font-black text-slate-900 tracking-[0.15em]">{v.plate.replace(/\s/g, '').toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            {insStatus && (
                                                <div className={`p-2 rounded-xl border ${insStatus.bg} ${insStatus.color.replace('text-', 'border-')}/10 flex items-center gap-2.5`}>
                                                    <ShieldAlert size={14} className={insStatus.color} strokeWidth={3} />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Insurance</p>
                                                        <p className={`text-[8px] font-black uppercase tracking-widest opacity-60 leading-none`}>{insStatus.label}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {pucStatus && (
                                                <div className={`p-2 rounded-xl border ${pucStatus.bg} ${pucStatus.color.replace('text-', 'border-')}/10 flex items-center gap-2.5`}>
                                                    <Zap size={14} className={pucStatus.color} strokeWidth={3} />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Pollution</p>
                                                        <p className={`text-[8px] font-black uppercase tracking-widest opacity-60 leading-none`}>{pucStatus.label}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                            <div className="flex gap-2">
                                                {!v.isPrimary ? (
                                                    <button onClick={() => handleSetPrimary(vId)} className="h-8 px-4 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg active:scale-95 transition-all">Set Primary</button>
                                                ) : (
                                                    <span className="h-8 px-4 bg-[#FF9900]/10 text-[#FF9900] text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 border border-[#FF9900]/10">Service Ready</span>
                                                )}
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => openEdit(v)} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center border border-gray-100 active:scale-90 transition-all"><Edit3 size={12} /></button>
                                                <button onClick={() => handleDelete(vId)} className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center border border-rose-100 active:scale-90 transition-all"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    <div className="pt-4 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div>
                                <h2 className="text-[13px] font-[1000] text-slate-900 uppercase tracking-tight leading-none">Catalog Library</h2>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Register from direct models</p>
                            </div>
                            <div className="bg-slate-900 text-[#FF9900] h-6 px-3 rounded-full flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest">
                                <Radar size={10} strokeWidth={3} /> {filteredCatalog.length}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center text-[#FF9900]"><Search size={14} strokeWidth={3} /></div>
                            <input type="text" placeholder="SEARCH MODELS (E.G. CRETA, THAR)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-gray-100 rounded-xl text-[11px] font-black uppercase tracking-widest outline-none focus:border-[#FF9900]/20 shadow-sm" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pb-12">
                            {loadingCatalog ? (
                                [1, 2, 3, 4].map(n => <div key={n} className="h-36 bg-gray-50 rounded-[22px] animate-pulse" />)
                            ) : (
                                filteredCatalog.map((m, idx) => {
                                    const isMatched = matchedCatalogIds.has(m._id);
                                    return (
                                        <motion.div key={m._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.02 }}
                                            onClick={() => {
                                                if (isMatched) { navigate(-1); } 
                                                else { setForm({ ...BLANK_FORM, brand: m.brand, model: m.model, type: m.type }); setShowSheet(true); }
                                            }}
                                            className={`relative h-36 rounded-[22px] overflow-hidden shadow-sm group border-2 ${isMatched ? 'border-[#FF9900]' : 'border-transparent'}`}
                                        >
                                            <img src={m.image || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                                            {isMatched && ( <div className="absolute top-2 right-2 bg-[#FF9900] text-slate-900 text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Matched</div> )}
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <p className="text-[#FF9900] text-[8px] font-black uppercase tracking-[0.15em] leading-none mb-1">{m.brand}</p>
                                                <h3 className="text-white text-[11px] font-[1000] uppercase tracking-tight leading-tight truncate">{m.model}</h3>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showSheet && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeSheet} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000]" />
                            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-x-0 bottom-0 bg-white rounded-t-[32px] z-[1001] p-6 pb-10 shadow-2xl overflow-y-auto max-h-[88vh]">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-[16px] font-[1000] text-slate-900 uppercase tracking-tight">{editId ? 'Vehicle Settings' : 'Register Vehicle'}</h2>
                                    <button onClick={closeSheet} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><X size={16} /></button>
                                </div>
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Plate Number</p>
                                        <div className="flex gap-2">
                                            <input placeholder="EX: KA05M1234" value={form.plate} onChange={e => setField('plate', e.target.value.toUpperCase())}
                                                className={`flex-1 h-12 bg-slate-50 border ${errors.plate ? 'border-rose-200' : 'border-gray-100'} rounded-xl px-5 font-black text-[12px] text-slate-900 uppercase tracking-widest outline-none focus:border-[#FF9900]/30`} />
                                            <button onClick={handleVahanFetch} disabled={isFetching} className="w-12 h-12 bg-slate-900 text-[#FF9900] rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                                                {isFetching ? <RefreshCw size={18} className="animate-spin" /> : <Radar size={18} strokeWidth={3} />}
                                            </button>
                                        </div>
                                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-tight ml-1">Identify vehicle automatically via Vahan API</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Brand</p>
                                            <select value={form.brand} onChange={e => setField('brand', e.target.value)} className="w-full h-11 bg-slate-50 border border-gray-100 rounded-xl px-4 font-black text-[11px] text-slate-900 uppercase outline-none focus:border-[#FF9900]/30">
                                                <option value="">SELECT</option>
                                                {dynamicBrands.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Category</p>
                                            <select value={form.type} onChange={e => setField('type', e.target.value)} className="w-full h-11 bg-slate-50 border border-gray-100 rounded-xl px-4 font-black text-[11px] text-slate-900 uppercase outline-none focus:border-[#FF9900]/30">
                                                {dynamicTypes.map(t => <option key={t.type || t.name} value={t.type || t.name}>{t.name || t.type}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Full Model Description</p>
                                        <input placeholder="EX: CRETA 1.5 DIESEL" value={form.model} onChange={e => setField('model', e.target.value)}
                                            className="w-full h-12 bg-slate-50 border border-gray-100 rounded-xl px-5 font-black text-[12px] text-slate-900 uppercase tracking-tight outline-none focus:border-[#FF9900]/30" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Insurance Expiry</p>
                                            <input type="date" value={form.insuranceExpiry} onChange={e => setField('insuranceExpiry', e.target.value)}
                                                className="w-full h-11 bg-slate-50 border border-gray-100 rounded-xl px-4 font-black text-[11px] text-slate-900 outline-none focus:border-[#FF9900]/30" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">PUC Expiry</p>
                                            <input type="date" value={form.PUCExpiry} onChange={e => setField('PUCExpiry', e.target.value)}
                                                className="w-full h-11 bg-slate-50 border border-gray-100 rounded-xl px-4 font-black text-[11px] text-slate-900 outline-none focus:border-[#FF9900]/30" />
                                        </div>
                                    </div>
                                    <button onClick={handleSave} disabled={isSaving} className="w-full h-14 bg-slate-900 text-[#FF9900] rounded-xl font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30 shadow-xl mt-4">
                                        {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} strokeWidth={3} />}
                                        {editId ? 'Apply Updates' : 'Secure Vehicle'}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

const RefreshCw = ({ size, className }) => <RefreshCwIcon size={size} className={className} />;
import { RefreshCw as RefreshCwIcon } from 'lucide-react';

export default VehicleManager;
