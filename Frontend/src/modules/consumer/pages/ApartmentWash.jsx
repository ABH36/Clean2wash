import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    ArrowLeft, Building, MapPin, Car, ShieldCheck,
    Clock, Check, ChevronRight, ChevronDown, Info, Calendar, CreditCard, Search,
    ArrowRight
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { serviceAPI, subscriptionAPI } from '../../../utils/api';

const ApartmentWash = () => {
    const navigate = useNavigate();
    const { vehicles, user, refreshStats, getRazorpayKey, createPaymentOrder, verifyPayment } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Dynamic Data State
    const [apartments, setApartments] = useState([]);
    const [plans, setPlans] = useState([]);
    const [slots, setSlots] = useState([]);
    const [businessRules, setBusinessRules] = useState([]);
    const [apartmentService, setApartmentService] = useState(null);
    const [fetchError, setFetchError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [selectedApartment, setSelectedApartment] = useState(null);
    const [parkingDetails, setParkingDetails] = useState({
        basement: '',
        block: '',
        pillar: '',
        carNumber: '',
        carModel: '',
        vehicleId: ''
    });
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const loadRazorpayScript = () => new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve(true);

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
        document.body.appendChild(script);
    });

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setFetching(true);
                setFetchError('');

                const cityHint = user?.profile?.address?.city || '';
                const response = await serviceAPI.getApartmentFlowData({
                    city: cityHint,
                    serviceKey: 'APARTMENT_WASH'
                });

                if (response.status === 'success') {
                    setApartmentService(response.data?.service || null);
                    setApartments(response.data?.apartments || []);
                    setPlans(response.data?.plans || []);
                    setSlots(response.data?.slots || []);
                    setBusinessRules(response.data?.rules || []);
                }
            } catch (err) {
                console.error("Failed to fetch apartment data:", err);
                setFetchError(err.message || 'Failed to load apartment wash data');
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, [user?.profile?.address?.city]);

    // Filtered apartments
    const filteredApartments = useMemo(() => {
        if (!searchQuery) return apartments;
        return apartments.filter(apt =>
            apt?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (apt?.location && apt.location.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [apartments, searchQuery]);

    const handleApartmentClick = (apt) => {
        setSelectedApartment(apt);
        setStep(2);
    };

    const handleDetailsSubmit = (e) => {
        e.preventDefault();
        setStep(3);
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setStep(4);
    };

    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
        setStep(5);
    };

    const renderStep1_ApartmentSelection = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 pt-4 space-y-6"
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Select Your Apartment</h2>
                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Available in premium cluster societies</p>
            </div>

            <div className="relative group">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-brand transition-colors" />
                <input
                    placeholder="Search by society name or area..."
                    className="w-full bg-gray-50/50 border border-black/[0.03] px-14 py-5 rounded-3xl text-[11px] font-[1000] text-black outline-none focus:border-brand/20 transition-all shadow-sm placeholder:text-black/10 uppercase tracking-widest font-outfit"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {fetchError && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{fetchError}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3">
                {fetching ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Loading Societies...</span>
                    </div>
                ) : filteredApartments.length > 0 ? (
                    filteredApartments.map((apt) => (
                        <motion.button
                            key={apt._id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleApartmentClick(apt)}
                            className="bg-white border border-black/[0.03] rounded-3xl p-4 flex items-center gap-4 text-left shadow-sm active:bg-gray-50 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0 border border-black/[0.03] flex items-center justify-center p-3">
                                {apt.iconUrl ? (
                                    <img
                                        src={apt.iconUrl}
                                        onError={(e) => { e.target.src = '/assets/appartment/default.png'; }}
                                        alt={apt.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <Building className="text-black/10" size={28} />
                                )}
                            </div>
                            <div className="flex-1 relative z-10">
                                <h3 className="text-[13px] font-[1000] text-black uppercase tracking-tight">{apt.name}</h3>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <MapPin size={10} className="text-brand" strokeWidth={3} />
                                    <span className="text-[9px] font-black text-black/30 uppercase tracking-[0.15em] leading-none font-outfit">
                                        {apt.location || 'Premium Complex'}, {apt.city}
                                    </span>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
                                <ChevronRight size={14} strokeWidth={3} />
                            </div>
                        </motion.button>
                    ))
                ) : (
                    <div className="py-20 text-center">
                        <p className="text-xs font-bold text-content-subtle uppercase">No Societies found matching search</p>
                    </div>
                )}
            </div>

            <div className="bg-brand/5 border border-brand/10 p-5 rounded-xl flex gap-4 items-start">
                <Info size={18} className="text-brand shrink-0" />
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest leading-none">Can't find your society?</p>
                    <p className="text-[9px] font-bold text-content-subtle uppercase tracking-tight leading-relaxed">We clusters apartments for efficiency. Suggest your society for next expansion.</p>
                </div>
            </div>
        </motion.div>
    );

    const renderStep2_ParkingDetails = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-5 pt-4 space-y-6 pb-20"
        >
            <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                    <Building size={14} className="text-brand" />
                    <span className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">{selectedApartment.name}</span>
                </div>
                <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Identify Your Parking</h2>
                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-relaxed">Precise location helps us serve you better every morning</p>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Select Your Registered Vehicle</label>
                    <div className="grid grid-cols-1 gap-2">
                        {vehicles && vehicles.length > 0 ? (
                            vehicles.map((v) => (
                                <button
                                    key={v._id}
                                    type="button"
                                    onClick={() => setParkingDetails({
                                        ...parkingDetails,
                                        carModel: `${v.brand} ${v.model}`,
                                        carNumber: v.plate || v.plateNumber,
                                        vehicleId: v._id
                                    })}
                                    className={`p-4 rounded-3xl border flex items-center gap-4 transition-all active:scale-[0.98] ${parkingDetails.vehicleId === v._id ? 'border-brand bg-brand/5 shadow-lg shadow-brand/5' : 'border-black/[0.03] bg-white shadow-sm'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${parkingDetails.vehicleId === v._id ? 'bg-brand text-white' : 'bg-gray-50 text-black/20'}`}>
                                        <Car size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-[11px] font-[1000] text-black uppercase tracking-tight">{v.brand} {v.model}</p>
                                        <p className="text-[8.5px] font-black text-black/20 uppercase tracking-[0.2em] mt-1 font-outfit">{v.plate || v.plateNumber}</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${parkingDetails.vehicleId === v._id ? 'border-brand bg-brand text-white' : 'border-black/[0.05] bg-transparent'}`}>
                                        {parkingDetails.vehicleId === v._id && <Check size={12} strokeWidth={4} />}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="text-[9px] font-bold text-content-subtle uppercase p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">No registered vehicles found</p>
                        )}
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em] ml-2">Level / Floor</label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full bg-gray-50/50 border border-black/[0.03] px-5 py-4 rounded-2xl text-[11px] font-[1000] text-black outline-none focus:border-brand/20 shadow-sm appearance-none font-outfit"
                                    value={parkingDetails.basement}
                                    onChange={(e) => setParkingDetails({ ...parkingDetails, basement: e.target.value })}
                                >
                                    <option value="">Select Level</option>
                                    <option value="B1">Basement 1</option>
                                    <option value="B2">Basement 2</option>
                                    <option value="Ground">Ground Floor</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-black/20 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em] ml-2">Block / Tower</label>
                            <input
                                required placeholder="e.g. Tower A"
                                className="w-full bg-gray-50/50 border border-black/[0.03] px-5 py-4 rounded-2xl text-[11px] font-[1000] text-black outline-none focus:border-brand/20 shadow-sm uppercase placeholder:text-black/10 font-outfit"
                                value={parkingDetails.block}
                                onChange={(e) => setParkingDetails({ ...parkingDetails, block: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em] ml-2">Pillar / Slot No.</label>
                        <input
                            required placeholder="e.g. P-102"
                            className="w-full bg-gray-50/50 border border-black/[0.03] px-5 py-4 rounded-2xl text-[11px] font-[1000] text-black outline-none focus:border-brand/20 shadow-sm uppercase placeholder:text-black/10 font-outfit"
                            value={parkingDetails.pillar}
                            onChange={(e) => setParkingDetails({ ...parkingDetails, pillar: e.target.value })}
                        />
                    </div>

                    {!parkingDetails.vehicleId && (
                        <div className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Car Model</label>
                                <input
                                    required placeholder="e.g. Toyota Fortuner"
                                    className="w-full bg-gray-50 border border-gray-100 px-4 py-3.5 rounded-xl text-xs font-bold text-black outline-none focus:border-brand/20 shadow-sm uppercase placeholder:text-black/20"
                                    value={parkingDetails.carModel}
                                    onChange={(e) => setParkingDetails({ ...parkingDetails, carModel: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Car Number Plate</label>
                                <input
                                    required placeholder="e.g. MP 09 AB 1234"
                                    className="w-full bg-gray-50 border border-gray-100 px-4 py-3.5 rounded-xl text-xs font-bold text-black outline-none focus:border-brand/20 shadow-sm uppercase placeholder:text-black/20"
                                    value={parkingDetails.carNumber}
                                    onChange={(e) => setParkingDetails({ ...parkingDetails, carNumber: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="fixed bottom-8 left-5 right-5 z-50">
                    <button
                        type="submit"
                        className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
                    >
                        Save & Continue
                        <ChevronRight size={16} />
                    </button>
                </div>
            </form>
        </motion.div >
    );

    const renderStep3_PlanSelection = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-5 pt-4 space-y-6"
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Monthly Wash Plan</h2>
                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-relaxed">{apartmentService?.description || 'Subscription based recurring care for your vehicle'}</p>
            </div>

            <div className="space-y-4">
                {plans.length === 0 ? (
                    <div className="bg-white border border-dashed border-black/10 rounded-3xl p-8 text-center">
                        <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">No apartment plans available right now</p>
                    </div>
                ) : plans.map((plan) => (
                    <motion.div
                        key={plan.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePlanSelect(plan)}
                        className={`relative p-7 rounded-[32px] border-2 cursor-pointer transition-all shadow-xl ${plan.popular ? 'bg-black text-white border-black' : 'bg-white text-black border-black/[0.03]'}`}
                    >
                        {plan.popular && (
                            <div className="absolute -top-3 left-8 px-4 py-1.5 bg-brand text-black text-[9px] font-[1000] uppercase tracking-[0.2em] rounded-full shadow-lg shadow-brand/20 relative z-20">Elite Choice</div>
                        )}
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h3 className="text-2xl font-[1000] uppercase tracking-tighter leading-none">{plan.name}</h3>
                                <div className="mt-2.5 flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${plan.popular ? 'bg-brand' : 'bg-brand'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${plan.popular ? 'text-white/40' : 'text-black/30'}`}>{plan.type || 'Society Pass'}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[32px] font-[1000] leading-none tracking-tighter">â‚¹{plan.price}</span>
                                <p className={`text-[9px] font-black uppercase tracking-widest mt-1.5 font-outfit ${plan.popular ? 'text-white/30' : 'text-black/20'}`}>PER {plan.interval || 'MONTH'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-5 border-t border-black/[0.05] relative z-10">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${plan.popular ? 'bg-white/5' : 'bg-gray-50'}`}>
                                <Calendar size={12} className="text-brand" strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-tight">{plan.washes}</span>
                            </div>
                            <div className="flex-1">
                                <span className={`text-[10px] font-[1000] uppercase tracking-[0.05em] block truncate ${plan.popular ? 'text-white/60' : 'text-black/40'}`}>{plan.desc}</span>
                            </div>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${plan.popular ? 'bg-white/10 text-brand' : 'bg-black text-white'}`}>
                                <ArrowRight size={14} strokeWidth={3} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl flex gap-4 items-center">
                <ShieldCheck size={20} className="text-blue-600 shrink-0" />
                <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-tight">Professional dry wash eco-care protocol 100% Guaranteed</p>
            </div>
        </motion.div>
    );

    const renderStep4_SlotSelection = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-5 pt-4 space-y-6"
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Choose Service Slot</h2>
                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-relaxed">Cluster efficiency target: 10 cars per worker per slot</p>
            </div>

            <div className="space-y-3">
                {(slots.length > 0 ? slots : [
                    { id: 'morning', time: '6:00 AM - 9:00 AM', label: 'Morning Primary' },
                    { id: 'evening', time: '6:00 PM - 8:00 PM', label: 'Evening Optional' }
                ]).map((slot) => {
                    const SlotIcon = Clock
                    return (
                        <motion.button
                            key={slot.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSlotSelect(slot)}
                            className="w-full bg-white border border-black/[0.03] rounded-3xl p-5 flex items-center justify-between shadow-sm active:bg-gray-50 transition-all text-left relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-black/20 group-hover:text-brand transition-colors">
                                    <SlotIcon size={26} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-[13px] font-[1000] text-black uppercase tracking-tight">{slot.label}</h3>
                                    <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.15em] mt-1.5 font-outfit">{slot.time}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 relative z-10">
                                <div className="bg-emerald-50 px-3 py-1 rounded-lg text-[9px] font-[1000] text-emerald-600 uppercase tracking-widest shadow-sm shadow-emerald-500/5">Available</div>
                                <span className="text-[9px] font-black text-black/10 uppercase tracking-widest">Premium Slot</span>
                            </div>
                        </motion.button>
                    )
                })}
            </div>

            <div className="p-5 bg-black/95 rounded-2xl text-white space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-brand">Business Rules</h4>
                <ul className="space-y-2">
                    {(businessRules.length > 0 ? businessRules : [
                        'Primary focus on morning 6-9 AM operations',
                        'Sorted workload by Basement -> Block -> Pillar',
                        'Max 10 cars per slot per compartment'
                    ]).map((rule, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tight text-white/60">
                            <Check size={12} className="text-green-500" /> {rule}
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );

    const renderStep5_Confirmation = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-5 pt-4 space-y-6 pb-20"
        >
            <div className="flex flex-col items-center text-center py-6">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4 border border-green-100 shadow-sm">
                    <ShieldCheck size={40} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Pre-Booking Summary</h2>
                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mt-1">Review your apartment subscription</p>
            </div>

            <div className="bg-white border border-black/[0.03] rounded-[32px] overflow-hidden shadow-xl">
                <div className="bg-black p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.25em] mb-2 leading-none">Subscription Active</p>
                            <h3 className="text-3xl font-[1000] text-white uppercase tracking-tighter leading-none">{selectedPlan.name}</h3>
                        </div>
                        <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-2xl font-[1000] text-white tracking-tighter">â‚¹{selectedPlan.price}</span>
                            </div>
                            <p className="text-[9px] font-[1000] text-white/30 uppercase tracking-widest mt-1.5 font-outfit">PER MONTH</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-7 bg-white">
                    <div className="grid grid-cols-2 gap-y-7 gap-x-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Building size={12} className="text-brand" strokeWidth={3} />
                                <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] leading-none font-outfit">Society</p>
                            </div>
                            <p className="text-[12px] font-[1000] text-black uppercase tracking-tight leading-tight">{selectedApartment.name}</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Car size={12} className="text-brand" strokeWidth={3} />
                                <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] leading-none font-outfit">Vehicle</p>
                            </div>
                            <p className="text-[12px] font-[1000] text-black uppercase tracking-tight leading-none">{parkingDetails.carModel}</p>
                            <span className="text-[9px] font-black text-brand uppercase tracking-[0.15em] leading-none font-outfit">{parkingDetails.carNumber}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <MapPin size={12} className="text-brand" strokeWidth={3} />
                                <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] leading-none font-outfit">Parking</p>
                            </div>
                            <p className="text-[12px] font-[1000] text-black uppercase tracking-tight leading-none">{parkingDetails.basement} â€¢ {parkingDetails.block}</p>
                            <span className="text-[9px] font-black text-black/40 uppercase tracking-widest leading-none font-outfit">Pillar {parkingDetails.pillar}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-brand" strokeWidth={3} />
                                <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] leading-none font-outfit">Schedule</p>
                            </div>
                            <p className="text-[12px] font-[1000] text-black uppercase tracking-tight leading-none">{selectedSlot.label}</p>
                            <span className="text-[9px] font-black text-black/40 uppercase tracking-widest leading-none font-outfit">{selectedSlot.time}</span>
                        </div>
                    </div>

                    <div className="pt-7 border-t border-black/[0.03]">
                        <div className="flex justify-between items-center bg-gray-50/50 p-5 rounded-2xl border border-black/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.03] flex items-center justify-center text-black/20">
                                    <CreditCard size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-black/30 uppercase tracking-widest block leading-none mb-1 font-outfit">Payment Gateway</span>
                                    <span className="text-[11px] font-[1000] text-black uppercase tracking-tight">Razorpay Secure</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-500">
                                <ShieldCheck size={14} strokeWidth={3} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-8 left-5 right-5 z-50">
                <button
                    onClick={async () => {
                        if (!selectedPlan || !selectedApartment || !selectedSlot) {
                            toast.error('Please complete all subscription steps first.');
                            return;
                        }

                        try {
                            setLoading(true);
                            const keyRes = await getRazorpayKey();
                            if (!keyRes.success) {
                                throw new Error(keyRes.error || 'Failed to load payment gateway');
                            }

                            const razorpayKey = keyRes.data?.key_id || keyRes.data?.key;
                            if (!razorpayKey) {
                                throw new Error('Payment key not available');
                            }

                            const orderRes = await createPaymentOrder(
                                selectedPlan.price,
                                'INR',
                                `apt_sub_${Date.now()}`
                            );
                            if (!orderRes.success) {
                                throw new Error(orderRes.error || 'Failed to create payment order');
                            }

                            const orderData = orderRes.data || {};
                            const orderId = orderData.order_id || orderData.id;
                            const amount = orderData.amount;
                            const currency = orderData.currency || 'INR';
                            if (!orderId || !amount) {
                                throw new Error('Invalid order details from payment gateway');
                            }

                            await loadRazorpayScript();

                            await new Promise((resolve, reject) => {
                                const options = {
                                    key: razorpayKey,
                                    amount,
                                    currency,
                                    name: 'Clean2Wash',
                                    description: `${selectedPlan.name} - Apartment Subscription`,
                                    image: 'https://cdn-icons-png.flaticon.com/512/3003/3003984.png',
                                    order_id: orderId,
                                    prefill: {
                                        name: user?.name,
                                        email: user?.email,
                                        contact: user?.phone
                                    },
                                    theme: { color: '#F29F05' },
                                    modal: {
                                        ondismiss: () => reject(new Error('Payment cancelled by user'))
                                    },
                                    handler: async (response) => {
                                        try {
                                            const verifyRes = await verifyPayment(
                                                response.razorpay_order_id,
                                                response.razorpay_payment_id,
                                                response.razorpay_signature
                                            );
                                            if (!verifyRes.success) {
                                                throw new Error(verifyRes.error || 'Payment verification failed');
                                            }

                                            const subscriptionPayload = {
                                                plan: selectedPlan.id || selectedPlan.planKey || selectedPlan.name,
                                                vehicleId: parkingDetails.vehicleId || undefined,
                                                hubId: selectedApartment._id,
                                                serviceKey: apartmentService?.key || 'APARTMENT_WASH',
                                                serviceId: apartmentService?.id || 'apartment-wash',
                                                parkingDetails: {
                                                    basement: parkingDetails.basement,
                                                    block: parkingDetails.block,
                                                    pillar: parkingDetails.pillar,
                                                    carModel: parkingDetails.carModel,
                                                    carNumber: parkingDetails.carNumber
                                                },
                                                slot: selectedSlot.id,
                                                paymentMethod: 'razorpay',
                                                paymentId: response.razorpay_payment_id,
                                                orderId: response.razorpay_order_id,
                                                autoRenew: false
                                            };

                                            const subRes = await subscriptionAPI.createSubscription(subscriptionPayload);
                                            if (subRes?.status !== 'success') {
                                                throw new Error(subRes?.message || 'Subscription activation failed');
                                            }

                                            refreshStats();
                                            toast.success('Apartment subscription activated successfully');
                                            navigate('/booking-confirmation', {
                                                state: {
                                                    type: 'subscription',
                                                    service: apartmentService?.title || 'Apartment Car Wash',
                                                    plan: selectedPlan.name,
                                                    society: selectedApartment.name,
                                                    slot: selectedSlot.label
                                                }
                                            });
                                            resolve(true);
                                        } catch (error) {
                                            reject(error);
                                        }
                                    }
                                };

                                new window.Razorpay(options).open();
                            });
                        } catch (err) {
                            console.error("Payment initialization failed:", err);
                            toast.error(err.message || 'Payment or subscription setup failed');
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                    className="w-full bg-black text-white py-5 rounded-3xl font-[1000] text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all overflow-hidden relative group"
                >
                    <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-brand border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <span className="relative z-10">Pay & Subscribe Now</span>
                            <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );

    return (
        <MobileLayout hideNav={step < 5}>
            <div className="bg-white min-h-screen font-sans">
                {/* Header */}
                <header className="px-5 pt-10 pb-6 bg-white sticky top-0 z-40 border-b border-black/[0.03]">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}
                            className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                        >
                            <ArrowLeft size={20} className="text-black" strokeWidth={2.5} />
                        </button>
                        <div className="flex-1 flex flex-col items-center">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <div className="w-1 h-1 rounded-full bg-brand animate-pulse" />
                                <span className="text-[9px] font-[1000] text-black/20 uppercase tracking-[0.3em] leading-none font-outfit">SOCIETY PASS</span>
                            </div>
                            <h1 className="text-[13px] font-[1000] text-black uppercase tracking-tight">{apartmentService?.title || 'Apartment Wash'}</h1>
                        </div>
                        <div className="w-11 h-11 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10">
                            <Building size={20} strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Progress Bar (Apple-Style) */}
                    <div className="mt-8 px-2">
                        <div className="h-[3px] w-full bg-black/5 rounded-full overflow-hidden flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <motion.div
                                    key={s}
                                    className="h-full flex-1 rounded-full bg-black"
                                    initial={{ opacity: 0.1, scaleX: 0 }}
                                    animate={{ 
                                        opacity: s <= step ? 1 : 0.1,
                                        scaleX: s <= step ? 1 : 0
                                    }}
                                    transition={{ duration: 0.4 }}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between mt-3 px-0.5">
                            <span className="text-[8px] font-black text-brand uppercase tracking-widest leading-none">Step 0{step}</span>
                            <span className="text-[8px] font-[1000] text-black/20 uppercase tracking-widest leading-none">/ 05</span>
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {step === 1 && renderStep1_ApartmentSelection()}
                    {step === 2 && renderStep2_ParkingDetails()}
                    {step === 3 && renderStep3_PlanSelection()}
                    {step === 4 && renderStep4_SlotSelection()}
                    {step === 5 && renderStep5_Confirmation()}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

export default ApartmentWash;
