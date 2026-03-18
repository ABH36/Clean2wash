import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Plus, Car, Trash2, Check, Edit3, AlertCircle, CheckCircle2, ShieldAlert, FileSearch, Zap, Calendar, Radar, Clock } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { vehicleAPI } from '../../../utils/api';
import { toast as hotToast } from 'react-hot-toast';

const BRANDS = ['Honda', 'Maruti', 'Hyundai', 'Toyota', 'Tata', 'Mahindra', 'Kia', 'BMW', 'Mercedes', 'Audi', 'Skoda', 'Volkswagen', 'Nissan', 'Renault', 'MG', 'Jeep', 'Land Rover', 'Jaguar', 'Volvo', 'Porsche', 'Ferrari', 'Lamborghini', 'Bentley', 'Rolls Royce', 'Others'];
const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#ffffff', '#1a1a1a', '#95a5a6', '#e67e22'];
const TYPES = [
    'Hatchback', 'Sedan', 'SUV', 'MUV', 'Compact SUV', 'MPV', 'Pickup',
    'Luxury Sedan', 'Luxury SUV', 'Coupe', 'Convertible', 'Sports Car', 'Supercar',
    'EV', 'Mini Truck', 'Truck', 'Van', 'Bus', 'Traveler', 'Tractor', 'Vintage',
    'Bike', 'Scooter', 'Superbike'
];

const BLANK_FORM = { brand: '', model: '', type: 'Sedan', color: '#3498db', plate: '', insuranceExpiry: '', pucExpiry: '' };

const TYPE_IMG = {
    Hatchback: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80',
    Sedan: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    SUV: 'https://images.unsplash.com/photo-1518987048-93e29699e79a?w=400&q=80',
    MUV: 'https://images.unsplash.com/photo-1594731802111-07ee4940d995?w=400&q=80',
    'Compact SUV': 'https://images.unsplash.com/photo-1517524008410-b44336d29a0c?w=400&q=80',
    'Luxury Sedan': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80',
    'Luxury SUV': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80',
    Coupe: 'https://images.unsplash.com/photo-1502877338535-766e145cca6c?w=400&q=80',
    Convertible: 'https://images.unsplash.com/photo-1551830820-330a71b99659?w=400&q=80',
    'Sports Car': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80',
    Supercar: 'https://images.unsplash.com/photo-1525609002952-7621bfea801d?w=400&q=80',
    EV: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=80',
    'Mini Truck': 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400&q=80',
    Truck: 'https://images.unsplash.com/photo-1586191582056-a15cd11ec618?w=400&q=80',
    Van: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&q=80',
    Tractor: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80',
    Vintage: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&q=80',
    Bike: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=400&q=80',
    Scooter: 'https://images.unsplash.com/photo-1449495940867-33d54ed0ec84?w=400&q=80',
    Superbike: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&q=80',
    Luxury: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80',
    MPV: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80',
    Pickup: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80',
};

const Toast = ({ msg, type = 'success', onDone }) => (
    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }} onAnimationComplete={() => setTimeout(onDone, 2000)}
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] max-w-xs w-[92%] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
        {type === 'success'
            ? <CheckCircle2 size={18} className="text-white flex-shrink-0" strokeWidth={2.5} />
            : <AlertCircle size={18} className="text-white flex-shrink-0" strokeWidth={2.5} />}
        <p className="text-white font-black text-sm">{msg}</p>
    </motion.div>
);

const VehicleManager = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const fromPage = searchParams.get('from');
    
    const { vehicles, addVehicle, updateVehicle, removeVehicle, setPrimaryVehicle, user } = useAuth();
    const [showSheet, setShowSheet] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(BLANK_FORM);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [globalCatalog, setGlobalCatalog] = useState([]);
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const res = await vehicleAPI.getVehicleModels();
                if (res.status === 'success' && res.data?.vehicleModels) {
                    setGlobalCatalog(res.data.vehicleModels);
                } else {
                    setGlobalCatalog([]);
                }
            } catch (err) {
                console.error('Failed to fetch global catalog:', err);
            } finally {
                setLoadingCatalog(false);
            }
        };
        fetchCatalog();
    }, []);

    // Matching Logic: Find Catalog Models that match User Vehicles
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

    const openAdd = () => {
        setForm(BLANK_FORM);
        setEditId(null);
        setErrors({});
        setShowSheet(true);
    };

    const openEdit = (v) => {
        setForm({
            brand: v.brand,
            model: v.model,
            type: v.type,
            color: v.color || '#3498db',
            plate: v.plate,
            insuranceExpiry: v.insuranceExpiry || '',
            pucExpiry: v.pucExpiry || ''
        });
        setEditId(v._id || v.id); // Support both MongoDB _id and legacy id
        setErrors({});
        setShowSheet(true);
    };

    const handleVahanFetch = async () => {
        if (!form.plate) {
            setErrors({ plate: 'Enter plate number first' });
            return;
        }
        setIsFetching(true);
        // Simulate VAHAN API delay
        await new Promise(r => setTimeout(r, 1500));

        // Smart mock: pick a random model from catalog if available, else fallback
        const mockModel = globalCatalog.length > 0 
            ? globalCatalog[Math.floor(Math.random() * globalCatalog.length)]
            : { brand: 'Maruti', model: 'Swift ZXI', type: 'Hatchback' };

        setForm(prev => ({
            ...prev,
            brand: mockModel.brand,
            model: mockModel.model,
            type: mockModel.type,
            insuranceExpiry: new Date(Date.now() + 31536000000).toISOString().split('T')[0], // 1 year later
            pucExpiry: new Date(Date.now() + 15552000000).toISOString().split('T')[0] // 6 months later
        }));
        setIsFetching(false);
        showToast('Details fetched from VAHAN!');
    };

    const validate = () => {
        const e = {};
        if (!form.brand) e.brand = 'Required';
        if (!form.model.trim()) e.model = 'Required';
        if (!form.plate.trim()) e.plate = 'Required';
        else if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/.test(form.plate.replace(/\s/g, '').toUpperCase())) {
            e.plate = 'Invalid Plate (Ex: KA05M1234)';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSetPrimary = async (id) => {
        const result = await setPrimaryVehicle(id);
        if (result.success) {
            showToast('Set as primary vehicle');
            if (fromPage === 'instant-wash') {
                setTimeout(() => navigate(-1), 1000);
            }
        } else {
            showToast(result.error || 'Failed to set primary vehicle', 'error');
        }
    };

    const handleDelete = async (id) => {
        hotToast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-content uppercase tracking-tight">Delete this vehicle from your garage?</p>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            hotToast.dismiss(t.id);
                            const result = await removeVehicle(id);
                            if (result.success) {
                                showToast('Vehicle removed', 'success');
                            } else {
                                showToast(result.error || 'Failed to remove vehicle', 'error');
                            }
                        }}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => hotToast.dismiss(t.id)}
                        className="bg-gray-100 text-content px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const handleSave = async () => {
        if (!validate()) return;

        // Align with Backend Schema requirements
        const cleanedPlate = form.plate.replace(/\s/g, '').toUpperCase();
        const img = TYPE_IMG[form.type] || TYPE_IMG['Sedan'];

        const vehiclePayload = {
            brand: form.brand,
            model: form.model,
            type: form.type,
            color: form.color,
            plate: cleanedPlate,
            compliance: {
                insuranceExpiry: form.insuranceExpiry || null,
                pucExpiry: form.pucExpiry || null
            },
            specifications: {
                fuelType: 'Petrol', // Default
                transmission: 'Manual' // Default
            }
        };

        setIsSaving(true);
        try {
            if (editId) {
                const result = await updateVehicle(editId, vehiclePayload);
                if (result.success) {
                    showToast('Vehicle updated successfully!');
                    closeSheet();
                } else {
                    showToast(result.error || 'Failed to update vehicle', 'error');
                }
            } else {
                const result = await addVehicle(vehiclePayload);
                if (result.success) {
                    showToast('Vehicle added to garage!');
                    closeSheet();
                    if (fromPage === 'instant-wash') {
                        // The backend might auto-set it as primary if it's the first vehicle
                        setTimeout(() => navigate(-1), 1000);
                    }
                } else {
                    showToast(result.error || 'Failed to add vehicle', 'error');
                }
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
        if (days < 30) return { label: `${days}d left`, color: 'text-orange-500', bg: 'bg-orange-50' };
        return { label: 'Active', color: 'text-green-500', bg: 'bg-green-50' };
    };

    const setField = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
    };

    return (
        <div className="min-h-screen bg-gray-50 font-outfit">
            <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap'); .font-outfit { font-family: 'Outfit', sans-serif; }` }} />

            <AnimatePresence>
                {toast && <Toast key={toast.msg} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
            </AnimatePresence>

            <header className="px-5 pt-12 pb-6 bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-black/[0.03]">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-11 h-11 bg-gray-50 border border-black/[0.02] rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-sm">
                        <ChevronLeft size={20} className="text-black" />
                    </button>
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] leading-none mb-1.5 italic">Fleet Management</p>
                        <h1 className="text-[22px] font-[1000] tracking-tighter text-black leading-none uppercase italic">Your Garaj</h1>
                    </div>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-2xl font-black text-[10px] shadow-2xl shadow-black/20 active:scale-95 transition-all uppercase tracking-widest">
                        <Plus size={14} strokeWidth={3} /> Register
                    </button>
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-24">
                <AnimatePresence>
                    {vehicles.map((v, i) => {
                        const insStatus = getExpiryStatus(v.insuranceExpiry);
                        const pucStatus = getExpiryStatus(v.pucExpiry);
                        const vId = v._id || v.id;

                        return (
                            <motion.div key={vId} layout
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                                className={`group bg-white rounded-[2.5rem] border overflow-hidden transition-all duration-300 ${v.isPrimary ? 'border-brand/30 shadow-2xl shadow-brand/10' : 'border-black/[0.03] shadow-xl hover:shadow-2xl'}`}>

                                <div className="relative h-56 overflow-hidden">
                                    <img src={v.image || v.img || TYPE_IMG[v.type]} alt={v.model} className="w-full h-full object-cover transform scale-100 group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                    
                                    <div className="absolute top-5 left-6 flex items-center gap-2">
                                        {v.isPrimary ? (
                                            <div className="bg-[#00FF66] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-[#00FF66]/20">
                                                <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                                                Active Session Protocol
                                            </div>
                                        ) : (
                                            <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-inner">
                                                {v.type}
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="flex items-end justify-between gap-4">
                                            <div>
                                                <p className="text-brand text-[10px] font-black uppercase tracking-[0.3em] mb-1.5 leading-none italic">{v.brand}</p>
                                                <h3 className="text-white font-[1000] text-[24px] tracking-tighter leading-none uppercase italic">
                                                    {v.model}
                                                </h3>
                                            </div>
                                            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-white flex flex-col items-center shadow-2xl">
                                                <p className="text-[7px] font-black text-black/20 uppercase leading-none mb-1.5 tracking-[0.2em]">Plate Registry</p>
                                                <p className="text-[12px] font-[1000] text-black tracking-[0.1em] leading-none block">{v.plate.replace(/\s/g, '').toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-6 bg-white">
                                    {/* Compliance Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {insStatus && (
                                            <div className={`px-4 py-3.5 rounded-2xl border ${insStatus.bg.replace('bg-', 'border-').replace('50', '200')} ${insStatus.bg} flex items-center gap-3`}>
                                                <div className={`p-2 rounded-xl ${insStatus.bg.replace('bg-', 'bg-').replace('50', '100')} ${insStatus.color}`}>
                                                    <ShieldAlert size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[7px] font-black text-black/20 uppercase tracking-widest leading-none mb-1">Insurance</p>
                                                    <p className={`text-[10px] font-black uppercase ${insStatus.color} leading-none`}>{insStatus.label}</p>
                                                </div>
                                            </div>
                                        )}
                                        {pucStatus && (
                                            <div className={`px-4 py-3.5 rounded-2xl border ${pucStatus.bg.replace('bg-', 'border-').replace('50', '200')} ${pucStatus.bg} flex items-center gap-3`}>
                                                <div className={`p-2 rounded-xl ${pucStatus.bg.replace('bg-', 'bg-').replace('50', '100')} ${pucStatus.color}`}>
                                                    <Zap size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[7px] font-black text-black/20 uppercase tracking-widest leading-none mb-1">Compliance</p>
                                                    <p className={`text-[10px] font-black uppercase ${pucStatus.color} leading-none`}>{pucStatus.label}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {!v.isPrimary ? (
                                                <button onClick={() => handleSetPrimary(vId)}
                                                    className="px-6 h-10 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand transition-all flex items-center gap-2 shadow-lg shadow-black/10">
                                                    <Check size={14} strokeWidth={3} /> Select Protocol
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 px-4 h-10 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl border border-emerald-100">
                                                    <CheckCircle2 size={14} strokeWidth={3} /> Station Paired
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(v)} className="w-10 h-10 bg-gray-50 text-black rounded-2xl flex items-center justify-center border border-black/[0.03] hover:border-brand hover:text-brand transition-all shadow-sm">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(vId)} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Master Fleet Registry (Premium Edition) */}
                <div className="pt-12 space-y-6">
                    <div className="px-2">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-[18px] font-[1000] text-black uppercase tracking-tighter leading-none italic">Master Fleet Registry</h2>
                                <p className="text-[10px] font-bold text-black/30 uppercase tracking-[0.1em] mt-2">Pair your model with the Studio Grade protocol</p>
                            </div>
                            <div className="bg-black text-white px-3 py-2 rounded-2xl flex items-center gap-2 shadow-xl shadow-black/10">
                                <Radar size={12} className="animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">{filteredCatalog.length}</span>
                            </div>
                        </div>

                        {/* Search Bar - Luxury Glass */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <FileSearch size={16} className="text-black/20 group-focus-within:text-brand transition-colors" />
                            </div>
                            <input 
                                type="text"
                                placeholder="SEARCH YOUR MODEL (E.G. BMW, THAR...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-black/[0.03] rounded-[2rem] px-14 py-5 font-black text-[12px] text-black tracking-[0.05em] uppercase focus:border-brand focus:ring-8 focus:ring-brand/5 transition-all outline-none shadow-xl shadow-black/[0.02]"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-5 flex items-center text-black/20 hover:text-rose-500 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-12">
                        {loadingCatalog ? (
                            [1, 2, 3, 4].map(n => (
                                <div key={n} className="h-48 bg-gray-100 rounded-[2rem] animate-pulse" />
                            ))
                        ) : (
                            filteredCatalog.map((m, idx) => {
                                const isMatched = matchedCatalogIds.has(m._id);
                                return (
                                    <motion.div
                                        key={m._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            if (isMatched) {
                                                const userV = vehicles.find(v =>
                                                    v.brand?.toLowerCase() === m.brand?.toLowerCase() &&
                                                    v.model?.toLowerCase() === m.model?.toLowerCase()
                                                );
                                                if (userV) handleSetPrimary(userV.id || userV._id);
                                                navigate(-1);
                                            } else {
                                                setForm({
                                                    ...BLANK_FORM,
                                                    brand: m.brand,
                                                    model: m.model,
                                                    type: m.type
                                                });
                                                setShowSheet(true);
                                            }
                                        }}
                                        className={`relative group h-52 rounded-[2.5rem] overflow-hidden transition-all duration-500 ${isMatched ? 'ring-2 ring-[#00FF66] shadow-2xl shadow-[#00FF66]/20' : 'bg-white shadow-xl hover:shadow-2xl'}`}
                                    >
                                        <img src={m.image || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80'}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={m.model} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                                        {isMatched && (
                                            <div className="absolute top-3 left-3 bg-[#00FF66] text-black text-[7px] font-[1000] uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
                                                <div className="w-1 h-1 rounded-full bg-black animate-ping" /> MATCHED
                                            </div>
                                        )}

                                        <div className="absolute bottom-4 left-4 right-4">
                                            <p className="text-white/60 text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1">{m.brand}</p>
                                            <h3 className="text-white font-[1000] text-[13px] leading-tight uppercase tracking-tighter line-clamp-1 italic">{m.model}</h3>
                                            
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex items-center gap-1 text-white/40 text-[8px] font-black uppercase tracking-widest">
                                                    <Clock size={8} />
                                                    {m.sessionTime || 45}m
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className="text-brand text-[8px] font-black uppercase tracking-widest">{m.difficulty || 'Normal'}</span>
                                            </div>
                                        </div>

                                        {/* Luxury Selection Overlay */}
                                        <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center`}>
                                            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all">
                                                <Plus size={20} strokeWidth={3} />
                                            </div>
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={closeSheet} />

                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-[2.5rem] z-50 overflow-hidden shadow-2xl"
                            style={{ maxHeight: '90vh' }}>

                            <div className="px-6 pt-5 pb-3 border-b border-gray-50 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-xl tracking-tight text-gray-900 italic uppercase">
                                        {editId ? 'Modify Fleet' : 'Recruit Vehicle'}
                                    </h3>
                                    <button onClick={closeSheet} className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 font-black">✕</button>
                                </div>
                            </div>

                            <div className="overflow-y-auto px-6 py-6 pb-12 space-y-6">
                                {/* VAHAN FETCH Integration */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand italic">Vehicle Identification</p>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input placeholder="ENTER PLATE (e.g. KA05MR7821)" value={form.plate}
                                                onChange={e => setField('plate', e.target.value.toUpperCase())}
                                                className={`w-full bg-gray-50 border ${errors.plate ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'} rounded-2xl px-4 py-4 font-black text-sm text-gray-900 tracking-widest uppercase focus:border-brand transition-all outline-none`} />
                                            {errors.plate && <p className="text-[10px] font-bold text-red-500 mt-1 ml-1 uppercase tracking-tighter">{errors.plate}</p>}
                                        </div>
                                        <button onClick={handleVahanFetch} disabled={isFetching}
                                            className={`w-14 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 ${isFetching ? 'animate-pulse' : 'active:scale-95'}`}>
                                            {isFetching ? <Zap size={20} className="animate-spin" /> : <ShieldAlert size={20} />}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 px-1">
                                        <FileSearch size={12} className="text-gray-400" />
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Auto-fill details via VAHAN API</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Brand</p>
                                        <select value={form.brand} onChange={e => setField('brand', e.target.value)}
                                            className={`w-full bg-gray-50 border ${errors.brand ? 'border-red-300' : 'border-gray-100'} rounded-2xl px-4 py-3.5 font-bold text-sm text-gray-900 outline-none appearance-none`}>
                                            <option value="">Select</option>
                                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                        {errors.brand && <p className="text-[8px] font-bold text-red-500 ml-1 uppercase">{errors.brand}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Type</p>
                                        <select value={form.type} onChange={e => setField('type', e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 font-bold text-sm text-gray-900 outline-none appearance-none">
                                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Model Name</p>
                                    <input placeholder="e.g. Range Rover Evoque" value={form.model}
                                        onChange={e => setField('model', e.target.value)}
                                        className={`w-full bg-gray-50 border ${errors.model ? 'border-red-300' : 'border-gray-100'} rounded-2xl px-5 py-4 font-bold text-sm text-gray-900 outline-none focus:border-brand/30`} />
                                    {errors.model && <p className="text-[8px] font-bold text-red-500 ml-1 uppercase">{errors.model}</p>}
                                </div>

                                {/* COMPLIANCE DATES */}
                                <div className="space-y-3 pt-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand italic">Compliance & Reminders</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Insurance Exp.</span>
                                                <Calendar size={10} className="text-blue-500" />
                                            </div>
                                            <input type="date" value={form.insuranceExpiry} onChange={e => setField('insuranceExpiry', e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 font-bold text-xs text-gray-900" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">PUC / Emission</span>
                                                <Calendar size={10} className="text-emerald-500" />
                                            </div>
                                            <input type="date" value={form.pucExpiry} onChange={e => setField('pucExpiry', e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 font-bold text-xs text-gray-900" />
                                        </div>
                                    </div>
                                </div>

                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={isSaving}
                                    className={`w-full h-14 ${isSaving ? 'bg-gray-400' : 'bg-gray-900'} text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-900/20 flex items-center justify-center gap-3 uppercase italic tracking-widest transition-all`}>
                                    {isSaving ? (
                                        <Zap size={18} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={18} />
                                    )}
                                    {isSaving ? 'Establishing Connection...' : (editId ? 'Update Modifications' : 'Confirm Registration')}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VehicleManager;
