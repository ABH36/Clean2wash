import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Plus, Car, Trash2, Check, Edit3, ShieldAlert, Zap, X, Search, ChevronRight, Info, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { vehicleAPI } from '../../../utils/api';
import { toast as hotToast } from 'react-hot-toast';
import MobileLayout from '../components/layout/MobileLayout';

const BLANK_FORM = { brand: '', model: '', type: 'Sedan', color: '#000000', plate: '', insuranceExpiry: '', PUCExpiry: '', image: '' };

const PREMIUM_COLORS = [
    { name: 'Obsidian Black', hex: '#000000' },
    { name: 'Crystal White', hex: '#FFFFFF' },
    { name: 'Graphite Grey', hex: '#4B5563' },
    { name: 'Royal Blue', hex: '#1E3A8A' },
    { name: 'Champage Gold', hex: '#D4AF37' },
    { name: 'Ruby Red', hex: '#991B1B' }
];

const BRAND_LOGOS = {
    'MARUTI SUZUKI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Suzuki_logo_2.svg/2560px-Suzuki_logo_2.svg.png',
    'TATA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Tata_logo.svg/2000px-Tata_logo.svg.png',
    'MAHINDRA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Mahindra_Twin_Peaks_Logo.svg/1024px-Mahindra_Twin_Peaks_Logo.svg.png',
    'HYUNDAI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_Motor_Company_logo.svg/2560px-Hyundai_Motor_Company_logo.svg.png',
    'TOYOTA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_car_logo.svg/1200px-Toyota_car_logo.svg.png',
    'KIA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Kia_logo.svg/2560px-Kia_logo.svg.png',
    'HONDA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Honda_Logo.svg/2560px-Honda_Logo.svg.png',
    'BMW': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/2048px-BMW.svg.png',
    'MERCEDES-BENZ': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Benz_Logo_2010.svg/1024px-Mercedes-Benz_Logo_2010.svg.png',
    'AUDI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Audi-Logo_2016.svg/2560px-Audi-Logo_2016.svg.png',
    'ROYAL ENFIELD': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/00/Royal_Enfield_logo.svg/1200px-Royal_Enfield_logo.svg.png',
    'HARLEY DAVIDSON': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Harley-Davidson_brand_logo.svg/1200px-Harley-Davidson_brand_logo.svg.png',
    'BAJAJ': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Bajaj_Auto_logo.svg/2560px-Bajaj_Auto_logo.svg.png',
    'HERO': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/97/Hero_MotoCorp_Logo.svg/1200px-Hero_MotoCorp_Logo.svg.png',
    'SUZUKI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Suzuki_logo_2.svg/2560px-Suzuki_logo_2.svg.png',
    'YAMAHA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Yamaha_Motor_Logo.svg/1200px-Yamaha_Motor_Logo.svg.png',
    'TRIUMPH': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Triumph_Motorcycles_logo.svg/1200px-Triumph_Motorcycles_logo.svg.png',
    'PORSCHE': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d9/Porsche_logo.svg/1200px-Porsche_logo.svg.png',
    'LAMBORGHINI': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/df/Lamborghini_Logo.svg/800px-Lamborghini_Logo.svg.png',
    'LAND ROVER': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/Land_Rover_logo.svg/1200px-Land_Rover_logo.svg.png'
};

const VehicleManager = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [searchParams] = useSearchParams();
    const fromPage = searchParams.get('from');
    const mode = searchParams.get('mode');

    const { vehicles, addVehicle, updateVehicle, removeVehicle, setPrimaryVehicle } = useAuth();
    
    const [step, setStep] = useState(mode === 'add' ? 'type' : 'list');
    const [selectedType, setSelectedType] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);

    const [form, setForm] = useState(BLANK_FORM);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const brandsRes = await vehicleAPI.getVehicleBrands({ type: selectedType });
            console.log('Brands API Response:', brandsRes);
            if (brandsRes?.status === 'success') {
                const brandsList = brandsRes.data?.brands || [];
                setBrands(Array.isArray(brandsList) ? brandsList : []);
            }
        } catch (err) {
            console.error('Brands failed:', err);
            hotToast.error('Failed to load brands');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedType || step === 'brand') fetchBrands();
    }, [selectedType, step]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const typesRes = await vehicleAPI.getVehicleTypes();
                if (typesRes.status === 'success') setTypes(typesRes.data.vehicleTypes || []);
            } catch (err) {
                console.error('Core resources failed:', err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (selectedBrand) {
            const fetchModels = async () => {
                setLoading(true);
                try {
                    const res = await vehicleAPI.getVehicleModels({ brand: selectedBrand, type: selectedType });
                    if (res.status === 'success') setModels(res.data.vehicleModels || []);
                } catch (err) {
                    console.error('Models failed:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchModels();
        }
    }, [selectedBrand, selectedType]);

    const showToast = (msg, type = 'success') => {
        if (type === 'success') hotToast.success(msg);
        else hotToast.error(msg);
    };

    const handleSave = async () => {
        if (!selectedBrand || !selectedType) {
            showToast('Please select vehicle type and brand first', 'error');
            setStep('type');
            return;
        }

        if (!form.plate) { setErrors({ plate: 'Plate number is required' }); return; }
        
        const finalModel = selectedModel?.model === 'Custom Model' ? form.model : selectedModel?.model;
        if (!finalModel || finalModel === 'Custom Model') {
            showToast('Please provide a valid vehicle model', 'error');
            return;
        }

        const vehiclePayload = {
            brand: selectedBrand,
            model: finalModel,
            type: selectedModel?.type || (selectedType === '2 Wheeler' ? 'Bike' : 'Sedan'),
            image: selectedModel?.image || form.image || (selectedType === '2 Wheeler' ? 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400' : 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400'),
            color: form.color,
            plate: form.plate.replace(/\s/g, '').toUpperCase(),
            compliance: {
                insuranceExpiry: form.insuranceExpiry || null,
                pucExpiry: form.PUCExpiry || null
            }
        };

        setIsSaving(true);
        try {
            const result = await addVehicle(vehiclePayload);
            if (result.success) {
                showToast('Vehicle added to garage');
                if (fromPage) navigate(-1);
                else setStep('list');
            } else {
                showToast(result.error || 'Failed to save', 'error');
            }
        } catch (err) {
            console.error('Save failed:', err);
            showToast('Connection error. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const renderTypeSelection = () => (
        <div className="px-6 py-8">
            <h2 className={`text-3xl font-[1000] tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Choose Your<br />Vehicle Type</h2>
            <p className={`text-sm font-medium mb-10 ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>You can add more vehicles later from the home screen</p>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { id: '4 Wheeler', title: '4 WHEELER', desc: 'I have a', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400' },
                    { id: '2 Wheeler', title: '2 WHEELER / BIKE', desc: 'I have a', image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400' }
                ].map(item => (
                    <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setSelectedType(item.id); setStep('brand'); }}
                        className={`relative h-[180px] rounded-[2rem] overflow-hidden group ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.03] border-black/10'} border`}
                    >
                        <div className="absolute inset-0 p-5 z-10 flex flex-col justify-start text-left">
                            <span className="text-[#F59E0B] text-[10px] font-black tracking-widest leading-none mb-1">{item.desc}</span>
                            <span className={`text-[13px] font-[1000] leading-tight max-w-[80px] ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.title}</span>
                        </div>
                        <img 
                            src={item.image} 
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = item.id === '4 Wheeler' 
                                    ? 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect fill="%23f3f4f6" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3ECar%3C/text%3E%3C/svg%3E'
                                    : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect fill="%23f3f4f6" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EBike%3C/text%3E%3C/svg%3E';
                            }}
                            className="absolute bottom-0 right-[-10%] w-[120%] h-[70%] object-contain grayscale group-hover:grayscale-0 transition-all duration-700" 
                            alt="" 
                        />
                    </motion.button>
                ))}
            </div>
        </div>
    );

    const renderBrandSelection = () => {
        const filteredBrands = brands.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase()));
        return (
            <div className="px-0 py-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="px-6 mb-6">
                    <div className="relative mb-8">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`} size={18} />
                        <input 
                            type="text" 
                            placeholder='Search Brand (e.g. "Maruti")' 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full h-14 pl-12 pr-4 rounded-2xl text-[13px] font-bold border outline-none focus:border-[#F59E0B]/20 transition-all ${isDarkMode ? 'bg-white/[0.02] text-white border-black/05' : 'bg-white text-black border-black/10'}`}
                        />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Popular Brands</h3>
                        <button className="bg-[#F59E0B] text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Can't find yours?</button>
                    </div>

                    {/* Brands Grid */}
                    <div className="grid grid-cols-3 gap-y-10 gap-x-4">
                        {loading && brands.length === 0 ? (
                            <div className="col-span-3 py-10 flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Loading Brands...</p>
                            </div>
                        ) : filteredBrands.length > 0 ? (
                            filteredBrands.map(brand => (
                                <motion.button
                                    key={brand}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => { setSelectedBrand(brand); setStep('model'); setSearchQuery(''); }}
                                    className="flex flex-col items-center group"
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border mb-3 group-hover:border-[#F59E0B]/20 transition-all p-3 overflow-hidden ${isDarkMode ? 'bg-white/5 border-black/05' : 'bg-black/[0.03] border-black/10'}`}>
                                        {BRAND_LOGOS[brand.toUpperCase()] ? (
                                            <img 
                                                src={BRAND_LOGOS[brand.toUpperCase()]} 
                                                alt={brand} 
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = `<span class="text-[10px] font-black ${isDarkMode ? 'text-white/40' : 'text-black/40'} uppercase">${brand.slice(0, 3)}</span>`;
                                                }}
                                                className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500" 
                                            />
                                        ) : (
                                            <span className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>{brand.slice(0, 3)}</span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tighter text-center ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>{brand}</span>
                                </motion.button>
                            ))
                        ) : (
                            <div className="col-span-3 py-10 flex flex-col items-center">
                                <p className={`text-[10px] font-bold tracking-widest ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>No brands found</p>
                                <button 
                                    onClick={() => { setSelectedType(null); fetchBrands(); }}
                                    className="mt-2 text-[10px] font-black text-[#F59E0B] underline"
                                >
                                    View all brands
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderModelSelection = () => (
        <div className="px-0 py-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="px-6 mb-6">
                <h2 className={`text-2xl font-[1000] tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Vehicles by</h2>
                <h3 className="text-xl font-black text-[#F59E0B] uppercase tracking-widest">{selectedBrand}</h3>
            </div>

            <div className="grid grid-cols-3 gap-y-10 gap-x-4 px-6 pb-20">
                {models.map(m => (
                    <motion.button
                        key={m._id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setSelectedModel(m); setStep('details'); }}
                        className="flex flex-col items-center group"
                    >
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden mb-3 border group-hover:bg-white/5 transition-all ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-black/[0.03] border-black/10'}`}>
                            <img 
                                src={m.image} 
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = selectedType === '2 Wheeler' 
                                        ? 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect fill="%23f3f4f6" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EBike%3C/text%3E%3C/svg%3E'
                                        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect fill="%23f3f4f6" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3ECar%3C/text%3E%3C/svg%3E';
                                }}
                                className="w-[85%] h-[85%] object-contain group-hover:scale-110 transition-transform duration-500" 
                                alt={m.model} 
                            />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-tight text-center leading-tight truncate w-full ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>{m.model}</span>
                    </motion.button>
                ))}
                
                {/* Fallback Option */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setSelectedModel({ model: 'Custom Model' }); setStep('details'); }}
                    className="flex flex-col items-center group"
                >
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border border-dashed mb-3 group-hover:bg-white/5 transition-all ${isDarkMode ? 'bg-white/[0.03] border-white/10 text-white/20' : 'bg-black/[0.03] border-black/10 text-black/20'}`}>
                        <Plus size={24} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tight text-center ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Others</span>
                </motion.button>
            </div>
        </div>
    );

    const renderFinalDetails = () => (
        <div className="px-6 py-4 animate-in fade-in slide-in-from-bottom-4">
             <div className="mb-4 p-4 bg-black rounded-[2rem] relative overflow-hidden shadow-2xl">
                <div className="absolute right-[-10%] top-0 h-full w-[60%] opacity-20 transform skew-x-[-20deg]">
                    <img 
                        src={selectedModel?.image} 
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = selectedType === '2 Wheeler' 
                                ? 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect fill="%23f3f4f6" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EBike%3C/text%3E%3C/svg%3E'
                                : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect fill="%23f3f4f6" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3ECar%3C/text%3E%3C/svg%3E';
                        }}
                        className="h-full w-full object-cover" 
                        alt="" 
                    />
                </div>
                <div className="relative z-10">
                    <span className="text-[#F59E0B] text-[8px] font-black tracking-[0.3em]">{selectedBrand}</span>
                    <h3 className="text-white text-xl font-[1000] tracking-tighter leading-tight mt-1">{selectedModel?.model || 'Custom vehicle'}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-white/10 text-white text-[7px] font-black px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">{selectedType}</span>
                    </div>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 right-4 w-28 h-28">
                    <img 
                        src={selectedModel?.image} 
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = selectedType === '2 Wheeler' 
                                ? 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect fill="%23f3f4f6" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EBike%3C/text%3E%3C/svg%3E'
                                : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect fill="%23f3f4f6" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3ECar%3C/text%3E%3C/svg%3E';
                        }}
                        className="w-full h-full object-contain drop-shadow-2xl" 
                        alt="" 
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Select Color</label>
                    <div className="flex items-center gap-3 px-1 overflow-x-auto no-scrollbar py-1">
                        {PREMIUM_COLORS.map(c => (
                            <button
                                key={c.hex}
                                onClick={() => setForm({...form, color: c.hex})}
                                className={`w-8 h-8 rounded-full flex-shrink-0 transition-all border-white/5 ${form.color === c.hex ? 'border-[#F59E0B] scale-110 shadow-lg' : 'border-black/05'}`}
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Vehicle Model</label>
                    <input 
                        placeholder="EX: GLANZA / SWIFT" 
                        value={selectedModel?.model === 'Custom Model' ? form.model : selectedModel?.model} 
                        disabled={selectedModel?.model !== 'Custom Model'}
                        onChange={e => setForm({...form, model: e.target.value.toUpperCase()})}
                        className={`w-full h-14 border rounded-2xl px-6 font-black text-base uppercase tracking-[0.1em] outline-none focus:border-[#F59E0B]/30 transition-all ${isDarkMode ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-black/10 text-black'} ${selectedModel?.model !== 'Custom Model' ? 'opacity-50' : ''}`} 
                    />
                </div>

                <div className="space-y-1">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Plate Number</label>
                    <input 
                        placeholder="EX: KA05M1234" 
                        value={form.plate} 
                        onChange={e => setForm({...form, plate: e.target.value.toUpperCase()})}
                        className={`w-full h-14 border ${errors.plate ? 'border-rose-500/50' : isDarkMode ? 'border-white/10' : 'border-black/10'} rounded-2xl px-6 font-black text-base uppercase tracking-[0.1em] outline-none focus:border-[#F59E0B]/30 transition-all ${isDarkMode ? 'bg-white/[0.03] text-white' : 'bg-white text-black'}`} 
                    />
                    {errors.plate && <p className="text-[9px] font-black text-rose-500 uppercase ml-1">{errors.plate}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Insurance Expiry</label>
                        <input 
                            type="date" 
                            value={form.insuranceExpiry} 
                            onChange={e => setForm({...form, insuranceExpiry: e.target.value})}
                            className={`w-full h-12 border rounded-2xl px-4 font-bold text-[12px] outline-none focus:border-[#F59E0B]/30 ${isDarkMode ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-black/10 text-black'}`} 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>PUC Expiry</label>
                        <input 
                            type="date" 
                            value={form.PUCExpiry} 
                            onChange={e => setForm({...form, PUCExpiry: e.target.value})}
                            className={`w-full h-12 border rounded-2xl px-4 font-bold text-[12px] outline-none focus:border-[#F59E0B]/30 ${isDarkMode ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-black/10 text-black'}`} 
                        />
                    </div>
                </div>

                <div className={`p-3 rounded-2xl border flex items-center gap-4 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-black/[0.03] border-black/10'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[#F59E0B] flex-shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                        <Info size={16} />
                    </div>
                    <div>
                        <h4 className={`text-[9px] font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Verify vehicle</h4>
                        <p className={`text-[8px] font-medium leading-tight ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>Match details with your registration documents.</p>
                    </div>
                </div>

                <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="w-full h-14 bg-black text-[#F59E0B] rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30 shadow-2xl shadow-black/50 mt-2"
                >
                    {isSaving ? <X size={18} className="animate-spin" /> : <Check size={18} strokeWidth={4} />}
                    Secure Vehicle
                </motion.button>
            </div>
        </div>
    );

    const renderList = () => (
        <div className="px-6 pt-4 space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className={`text-[11px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Active Garage</h2>
                <span className={`text-[9px] font-black ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>{vehicles?.length} Active Assets</span>
            </div>

            {vehicles?.map((v) => (
                <motion.div 
                    key={v._id || v.id} 
                    className={`rounded-3xl border overflow-hidden relative transition-all group ${v.isPrimary ? 'border-[#F59E0B]/30 shadow-xl shadow-black/5' : isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/[0.03] border-black/10'}`}
                >
                    <div className={`relative h-32 flex items-center justify-center p-4 ${isDarkMode ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                        <img 
                            src={v.image || "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&q=80&w=600"} 
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = v.type === 'Bike' || v.type === '2 Wheeler'
                                    ? 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3EBike%3C/text%3E%3C/svg%3E'
                                    : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3ECar%3C/text%3E%3C/svg%3E';
                            }}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" 
                            alt="" 
                        />
                        {v.isPrimary && (
                            <div className="absolute top-4 left-4 bg-black text-[#F59E0B] text-[7px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-black/50">
                                Primary Asset
                            </div>
                        )}
                        <div className="absolute top-4 right-4 flex gap-1.5">
                            <button onClick={() => removeVehicle(v._id || v.id)} className={`w-8 h-8 shadow-lg shadow-black/50 rounded-xl flex items-center justify-center text-rose-500 active:scale-90 transition-all border ${isDarkMode ? 'bg-white/5 border-black/05' : 'bg-white border-black/10'}`}><Trash2 size={14} /></button>
                             {!v.isPrimary && (
                                <button onClick={() => setPrimaryVehicle(v._id || v.id)} className="h-8 px-4 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all shadow-lg shadow-black/50">Activate</button>
                             )}
                        </div>
                    </div>
                    <div className="px-5 py-3 flex items-center justify-between">
                        <div>
                            <span className="text-[#F59E0B] text-[8px] font-black tracking-[0.2em]">{v.brand}</span>
                            <h4 className={`text-lg font-[1000] tracking-tighter leading-none mt-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>{v.model}</h4>
                        </div>
                        <div className={`border px-3 py-1.5 rounded-lg ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/10'}`}>
                            <span className={`text-[10px] font-black tracking-widest uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}>{v.plate || v.regNo}</span>
                        </div>
                    </div>
                </motion.div>
            ))}

            <button 
                onClick={() => setStep('type')}
                className={`w-full h-16 border-dashed rounded-[2.5rem] flex items-center justify-center gap-4 transition-all active:scale-[0.98] ${isDarkMode ? 'border-white/5 text-white/20 hover:text-white/40 hover:border-white/10' : 'border-black/10 text-black/30 hover:text-black/50 hover:border-black/20'}`}
            >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}><Plus size={20} /></div>
                <span className="text-[12px] font-black uppercase tracking-widest">Register New Asset</span>
            </button>
        </div>
    );

    return (
        <MobileLayout>
            <div className={`min-h-screen font-sans pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                <header className={`px-6 py-5 flex items-center justify-between backdrop-blur-xl sticky top-0 z-[60] border-b transition-colors ${isDarkMode ? 'bg-[#0A0F0D]/90 border-white/5' : 'bg-white/80 border-black/05'}`}>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => {
                                if (step === 'list') navigate(-1);
                                else if (step === 'type') setStep('list');
                                else if (step === 'brand') setStep('type');
                                else if (step === 'model') setStep('brand');
                                else if (step === 'details') setStep('model');
                            }} 
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center active:scale-95 transition-all border ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.03] border-black/10'}`}
                        >
                            <ChevronLeft size={20} className={isDarkMode ? 'text-white' : 'text-black'} />
                        </button>
                        <div>
                             <h1 className={`text-xl font-[1000] tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {step === 'list' ? 'My garage' : 'Add vehicle'}
                             </h1>
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center border border-[#F59E0B]/20">
                        <Sparkles size={16} className="text-[#F59E0B]" fill="currentColor" />
                    </div>
                </header>

                <div className="pb-10">
                    {step === 'list' && renderList()}
                    {step === 'type' && renderTypeSelection()}
                    {step === 'brand' && renderBrandSelection()}
                    {step === 'model' && renderModelSelection()}
                    {step === 'details' && renderFinalDetails()}
                </div>
            </div>
        </MobileLayout>
    );
};

export default VehicleManager;
