import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Building, MapPin, Car, ShieldCheck,
    Clock, Check, ChevronRight, Info, AlertCircle,
    Zap, Calendar, CreditCard, LayoutGrid, Search
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';

const ApartmentWash = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [selectedApartment, setSelectedApartment] = useState(null);
    const [parkingDetails, setParkingDetails] = useState({
        basement: '',
        block: '',
        pillar: '',
        carNumber: '',
        carModel: ''
    });
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const APARTMENTS = [
        { id: 1, name: 'DLF Heights', city: 'Indore', location: 'Vijay Nagar', image: '/assets/appartment/1.png' },
        { id: 2, name: 'Apollo Premium', city: 'Indore', location: 'Bhawarkua', image: '/assets/appartment/2.png' },
        { id: 3, name: 'Omaxe City', city: 'Indore', location: 'Dewas Road', image: '/assets/appartment/3.png' },
        { id: 4, name: 'Grand View', city: 'Indore', location: 'MG Road', image: '/assets/appartment/4.png' }
    ];

    const PLANS = [
        {
            id: 'basic',
            name: 'Eco Shine',
            price: 599,
            washes: '24 Washes/Mo',
            type: 'Primary Dry Wash',
            desc: 'Daily dusting & cleaning',
            color: 'bg-green-50 text-green-600 border-green-100'
        },
        {
            id: 'premium',
            name: 'Bucket Prime',
            price: 999,
            washes: '24 Washes/Mo',
            type: 'Bucket Wash + Wax',
            desc: 'Premium add-on service',
            color: 'bg-brand/5 text-brand border-brand/20',
            popular: true
        }
    ];

    const SLOTS = [
        { id: 'morning', time: '6:00 AM - 9:00 AM', label: 'Morning Primary', icon: Clock },
        { id: 'evening', time: '6:00 PM - 8:00 PM', label: 'Evening Optional', icon: Clock }
    ];

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

            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle" />
                <input
                    placeholder="Search by society name or area..."
                    className="w-full bg-gray-50 border border-gray-100 px-12 py-4 rounded-xl text-xs font-bold text-black outline-none focus:border-brand/20 transition-all shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 gap-3">
                {APARTMENTS.map((apt) => (
                    <motion.button
                        key={apt.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleApartmentClick(apt)}
                        className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-4 text-left shadow-sm active:bg-gray-50 transition-all"
                    >
                        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-50">
                            <img
                                src={`/assets/appartment/${apt.id}.png`}
                                onError={(e) => { e.target.src = '/assets/appartment/default.png'; }}
                                alt={apt.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-black text-content uppercase tracking-tight">{apt.name}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <MapPin size={10} className="text-brand" />
                                <span className="text-[10px] font-bold text-content-subtle uppercase tracking-widest leading-none">{apt.location}, {apt.city}</span>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-content-subtle" />
                    </motion.button>
                ))}
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
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Basement/Floor</label>
                        <select
                            required
                            className="w-full bg-gray-50 border border-gray-100 px-4 py-3.5 rounded-xl text-xs font-bold text-black outline-none focus:border-brand/20 shadow-sm appearance-none"
                            value={parkingDetails.basement}
                            onChange={(e) => setParkingDetails({ ...parkingDetails, basement: e.target.value })}
                        >
                            <option value="">Select Level</option>
                            <option value="B1">Basement 1</option>
                            <option value="B2">Basement 2</option>
                            <option value="Ground">Ground Floor</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Block / Tower</label>
                        <input
                            required placeholder="e.g. Tower A"
                            className="w-full bg-gray-50 border border-gray-100 px-4 py-3.5 rounded-xl text-xs font-bold text-black outline-none focus:border-brand/20 shadow-sm uppercase placeholder:text-black/20"
                            value={parkingDetails.block}
                            onChange={(e) => setParkingDetails({ ...parkingDetails, block: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Pillar No. / Parking Slot</label>
                    <input
                        required placeholder="e.g. P-102"
                        className="w-full bg-gray-50 border border-gray-100 px-4 py-3.5 rounded-xl text-xs font-bold text-black outline-none focus:border-brand/20 shadow-sm uppercase placeholder:text-black/20"
                        value={parkingDetails.pillar}
                        onChange={(e) => setParkingDetails({ ...parkingDetails, pillar: e.target.value })}
                    />
                </div>

                <div className="pt-2 border-t border-gray-100">
                    <div className="space-y-4 pt-4">
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
        </motion.div>
    );

    const renderStep3_PlanSelection = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-5 pt-4 space-y-6"
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Monthly Wash Plan</h2>
                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-relaxed">Subscription based recurring care for your vehicle</p>
            </div>

            <div className="space-y-4">
                {PLANS.map((plan) => (
                    <motion.div
                        key={plan.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePlanSelect(plan)}
                        className={`relative p-6 rounded-[22px] border-2 cursor-pointer transition-all ${plan.popular ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-100'}`}
                    >
                        {plan.popular && (
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-brand text-black text-[8px] font-black uppercase tracking-widest rounded-full">Most Popular</div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter">{plan.name}</h3>
                                <div className="mt-1 flex items-center gap-2">
                                    <Zap size={10} className={plan.popular ? 'text-brand' : 'text-brand'} />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${plan.popular ? 'text-white/60' : 'text-black/40'}`}>{plan.type}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[28px] font-[1000] leading-none">₹{plan.price}</span>
                                <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${plan.popular ? 'text-white/40' : 'text-black/40'}`}>Per Month</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                            <Calendar size={12} className={plan.popular ? 'text-brand' : 'text-brand'} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{plan.washes}</span>
                            <div className="w-1 h-1 rounded-full bg-white/20 mx-1" />
                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-tight">{plan.desc}</span>
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
                {SLOTS.map((slot) => (
                    <motion.button
                        key={slot.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSlotSelect(slot)}
                        className="w-full bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm active:bg-gray-50 transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand/5 rounded-xl flex items-center justify-center text-brand">
                                <slot.icon size={22} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-content uppercase tracking-tight">{slot.label}</h3>
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.1em] mt-1">{slot.time}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="bg-green-50 px-2 py-0.5 rounded text-[8px] font-black text-green-700 uppercase tracking-widest">Available</div>
                            <span className="text-[9px] font-bold text-black/20 uppercase tracking-widest">Fast Track</span>
                        </div>
                    </motion.button>
                ))}
            </div>

            <div className="p-5 bg-black/95 rounded-2xl text-white space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-brand">Business Rules</h4>
                <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tight text-white/60">
                        <Check size={12} className="text-green-500" /> Primary focus on morning 6-9 AM operations
                    </li>
                    <li className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tight text-white/60">
                        <Check size={12} className="text-green-500" /> Sorted workload by Basement → Block → Pillar
                    </li>
                    <li className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tight text-white/60">
                        <Check size={12} className="text-green-500" /> Max 10 cars per slot per compartment
                    </li>
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

            <div className="bg-white border border-gray-100 rounded-[28px] overflow-hidden shadow-sm">
                <div className="bg-[#FFF6E9] p-6 border-b border-black/[0.03]">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[8px] font-black text-brand uppercase tracking-[0.2em] mb-1">Subscription Plan</p>
                            <h3 className="text-2xl font-[1000] text-black uppercase tracking-tighter leading-none">{selectedPlan.name}</h3>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-[1000] text-black">₹{selectedPlan.price}</span>
                            <p className="text-[8px] font-bold text-black/40 uppercase tracking-widest">/ MONTH</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-black/30 uppercase tracking-widest">Apartment</p>
                            <p className="text-[11px] font-black text-black uppercase">{selectedApartment.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-black/30 uppercase tracking-widest">Car Details</p>
                            <p className="text-[11px] font-black text-black uppercase">{parkingDetails.carModel}</p>
                            <p className="text-[9px] font-bold text-brand uppercase leading-none">{parkingDetails.carNumber}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-black/30 uppercase tracking-widest">Parking Location</p>
                            <p className="text-[11px] font-black text-black uppercase">{parkingDetails.basement} • {parkingDetails.block}</p>
                            <p className="text-[9px] font-black text-black/50 uppercase leading-none">Pillar: {parkingDetails.pillar}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-black/30 uppercase tracking-widest">Wash Slot</p>
                            <p className="text-[11px] font-black text-black uppercase">{selectedSlot.label}</p>
                            <p className="text-[9px] font-black text-black/50 uppercase leading-none">{selectedSlot.time}</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <CreditCard size={18} className="text-black/40" />
                                <span className="text-[10px] font-black text-black uppercase tracking-widest">Payment Method</span>
                            </div>
                            <span className="text-[10px] font-black text-brand uppercase tracking-widest">Wallet / UPI</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-8 left-5 right-5 z-50">
                <button
                    onClick={() => {
                        setLoading(true);
                        setTimeout(() => navigate('/booking-confirmation'), 1500);
                    }}
                    disabled={loading}
                    className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all overflow-hidden"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-brand border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            Pay & Subscribe Now
                            <ArrowRight size={16} />
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
                <header className="px-5 pt-8 pb-4 bg-[#FFF6E9] sticky top-0 z-40 border-b border-black/[0.03]">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}
                            className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                        >
                            <ArrowLeft size={20} className="text-black" />
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] leading-none mb-1">Clean2Wash</span>
                            <h1 className="text-sm font-black text-black uppercase tracking-widest">Apartment Flow</h1>
                        </div>
                        <div className="w-10 h-10 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center">
                            <Building size={20} className="text-brand" />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6 h-1 w-full bg-black/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-brand"
                            animate={{ width: `${(step / 5) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
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
