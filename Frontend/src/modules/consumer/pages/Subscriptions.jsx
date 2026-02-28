import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ChevronDown, ChevronRight, Car,
    Star, Shield, Check, Crown, Zap, Clock, Info, ArrowRight, Sparkles, User,
    CreditCard, Layout, RefreshCw, Pause, Play, AlertCircle, CheckCircle2,
    Calendar, Wallet, ShieldCheck, ZapOff, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';

const PLANS = [
    {
        id: 'SUB-LITE',
        name: 'Lite Pass',
        price: 299,
        washes: 2,
        maxVehicles: 1,
        rollover: 0,
        features: ['2 Doorstep Washes', 'Standard Interior Clean', '1 Dedicated Vehicle', 'Standard Priority'],
        accent: 'blue',
        subtitle: 'Perfect for basic monthly care'
    },
    {
        id: 'SUB-PRO',
        name: 'Pro Pass',
        price: 599,
        washes: 5,
        maxVehicles: 2,
        rollover: 2,
        features: ['5 Premium Washes', 'Interior Vacuuming', '2 Vehicle Fleet', 'Rollover (Max 2)', 'Priority Booking'],
        accent: 'black',
        subtitle: 'Our best-selling family plan'
    },
    {
        id: 'SUB-ULTRA',
        name: 'Ultra Pass',
        price: 999,
        washes: 10, // Assuming 10 for logic, labeled as Unlimited
        maxVehicles: 3,
        rollover: 5,
        features: ['10 Premium Washes', 'Full Detailing (Monthly)', '3 Vehicle Fleet', 'Max Rollover', 'VIP Support'],
        accent: 'gold',
        subtitle: 'Ultimate luxury for your fleet'
    }
];

const Subscriptions = () => {
    const navigate = useNavigate();
    const { userSubscription, setUserSubscription, vehicles } = useAuth();

    // Flow State: 'DASHBOARD' | 'SELECT_VEHICLE' | 'SELECT_PLAN' | 'PAYMENT' | 'SUCCESS'
    const [flow, setFlow] = useState(userSubscription ? 'DASHBOARD' : 'SELECT_PLAN');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedVehicles, setSelectedVehicles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedTab, setSelectedTab] = useState('monthly');

    // Sync flow with subscription status
    useEffect(() => {
        if (!userSubscription && flow === 'DASHBOARD') {
            setFlow('SELECT_PLAN');
        }
    }, [userSubscription, flow]);

    // Dashboard Info
    const handleDeductWash = () => {
        if (!userSubscription || userSubscription.status !== 'Active') return;
        if (userSubscription.washesLeft <= 0) {
            alert('No washes left! Please renew or upgrade.');
            return;
        }
        setUserSubscription({
            ...userSubscription,
            washesLeft: userSubscription.washesLeft - 1
        });
    };

    const handleToggleStatus = () => {
        const newStatus = userSubscription.status === 'Active' ? 'Paused' : 'Active';
        setUserSubscription({
            ...userSubscription,
            status: newStatus
        });
    };

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setFlow('SELECT_VEHICLE');
    };

    const toggleVehicleSelection = (vehicleId) => {
        if (selectedVehicles.includes(vehicleId)) {
            setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId));
        } else {
            if (selectedVehicles.length >= selectedPlan.maxVehicles) {
                alert(`This plan allows max ${selectedPlan.maxVehicles} vehicles.`);
                return;
            }
            setSelectedVehicles([...selectedVehicles, vehicleId]);
        }
    };

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const newSub = {
                planId: selectedPlan.id,
                planName: selectedPlan.name,
                vehicleIds: selectedVehicles,
                washesLeft: selectedPlan.washes,
                status: 'Active',
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                rolloverCredits: selectedPlan.rollover,
                price: selectedPlan.price
            };
            setUserSubscription(newSub);
            setIsProcessing(false);
            setFlow('SUCCESS');
        }, 2000);
    };

    const renderHeader = (title, showBack = true) => (
        <header className="px-6 pt-6 pb-2 flex items-center justify-between bg-white sticky top-0 z-50">
            <div className="flex items-center gap-3">
                {showBack && (
                    <button onClick={() => {
                        if (flow === 'SELECT_VEHICLE') setFlow('SELECT_PLAN');
                        else if (flow === 'PAYMENT') setFlow('SELECT_VEHICLE');
                        else if (flow === 'SELECT_PLAN' && !userSubscription) navigate('/');
                        else if (flow === 'DASHBOARD') navigate('/');
                        else setFlow('DASHBOARD');
                    }} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg">
                        <ArrowRight className="rotate-180" size={16} />
                    </button>
                )}
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                    <Crown size={20} className="text-[#F29F05]" />
                </div>
                <div className="text-left">
                    <span className="text-[14px] font-[900] text-black uppercase tracking-tight">{title}</span>
                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest leading-none mt-1">clean2wash PASS</p>
                </div>
            </div>
        </header>
    );

    const renderDashboard = () => {
        if (!userSubscription) return null;
        const plan = PLANS.find(p => p.id === userSubscription.planId) || PLANS[0];
        const subVehicles = (vehicles || []).filter(v => userSubscription.vehicleIds?.includes(v.id));

        return (
            <div className="flex flex-col gap-6 pb-24">
                {/* Active Plan Card */}
                <section className="px-5 pt-4">
                    <div className="bg-black rounded-3xl p-6 relative overflow-hidden shadow-2xl border border-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F29F05]/10 rounded-full blur-3xl -mr-16 -mt-16" />

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <div className="bg-[#F29F05] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest mb-2 w-fit">
                                    {userSubscription.status}
                                </div>
                                <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter">
                                    {userSubscription.planName}
                                </h2>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                    Renews on {new Date(userSubscription.expiryDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">Credits</p>
                                <div className="text-white text-3xl font-black italic tracking-tighter leading-none mt-1">
                                    0{userSubscription.washesLeft}/0{plan.washes}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <button
                                onClick={handleDeductWash}
                                disabled={userSubscription.status !== 'Active'}
                                className="bg-white text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <Zap size={14} fill="currentColor" /> Use Credit
                            </button>
                            <button
                                onClick={handleToggleStatus}
                                className={`${userSubscription.status === 'Active' ? 'bg-white/10 text-white' : 'bg-green-500 text-white'} py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all outline-none border border-white/5`}
                            >
                                {userSubscription.status === 'Active' ? <><Pause size={14} /> Pause Plan</> : <><Play size={14} /> Resume Plan</>}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Linked Vehicles */}
                <section className="px-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[13px] font-black text-black uppercase tracking-widest italic">Linked Fleet</h3>
                        <span className="text-black/30 text-[10px] font-black uppercase">{subVehicles.length}/{plan.maxVehicles} Vehicles</span>
                    </div>
                    <div className="space-y-3">
                        {subVehicles.map(v => (
                            <div key={v.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                                    <Car size={24} className="text-black" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[14px] font-black text-black uppercase leading-none">{v.brand} {v.model}</h4>
                                    <p className="text-[10px] font-bold text-black/30 uppercase mt-1 tracking-widest">{v.plate}</p>
                                </div>
                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/20" />
                            </div>
                        ))}
                        {subVehicles.length === 0 && (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-2xl text-center">
                                <Car size={24} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No vehicles linked</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Rollover Info */}
                <section className="px-5">
                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-black text-blue-900 uppercase">Rollover Cap: {plan.rollover} Washes</h4>
                            <p className="text-[10px] font-bold text-blue-800/60 uppercase mt-1 leading-relaxed">
                                Any unused washes (up to {plan.rollover}) will automatically transfer to your next billing cycle.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Upgrade/Manage Options */}
                <section className="px-5 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setFlow('SELECT_PLAN')} className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm">
                            <ArrowRight className="text-black" size={24} />
                            <span className="text-[10px] font-black uppercase text-black">Upgrade Plan</span>
                        </button>
                        <button onClick={() => navigate('/vehicles')} className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm">
                            <Layout className="text-black" size={24} />
                            <span className="text-[10px] font-black uppercase text-black">Manage Fleet</span>
                        </button>
                    </div>
                </section>

                <div className="px-5 mt-4">
                    <button onClick={() => {
                        setUserSubscription(null);
                        setFlow('SELECT_PLAN');
                    }} className="w-full py-4 text-[10px] font-black text-red-500 uppercase tracking-widest">
                        Cancel Subscription
                    </button>
                </div>
            </div>
        );
    };

    const renderPlanSelect = () => (
        <div className="flex flex-col gap-6 pb-24 px-5 pt-4">
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4 border border-gray-200/50">
                <button
                    onClick={() => setSelectedTab('monthly')}
                    className={`flex-1 py-3 text-[11px] font-[900] uppercase tracking-widest rounded-lg transition-all ${selectedTab === 'monthly' ? 'bg-white text-black shadow-md' : 'text-black/40'}`}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setSelectedTab('annual')}
                    className={`flex-1 py-3 text-[11px] font-[900] uppercase tracking-widest rounded-lg transition-all relative ${selectedTab === 'annual' ? 'bg-white text-black shadow-md' : 'text-black/40'}`}
                >
                    Annual
                    <span className="absolute -top-2 right-0 bg-red-600 text-white text-[7px] px-2 py-0.5 rounded-full">Save 40%</span>
                </button>
            </div>

            <div className="space-y-6">
                {PLANS.map((p, i) => {
                    const price = selectedTab === 'monthly' ? p.price : p.price * 10;
                    const isBlack = p.accent === 'black';
                    const isGold = p.accent === 'gold';
                    const bgColor = isBlack ? 'bg-black' : (isGold ? 'bg-[#FFF6E9]' : 'bg-white');

                    return (
                        <motion.div
                            key={p.id}
                            whileTap={{ scale: 0.98 }}
                            className={`${bgColor} px-7 py-8 rounded-3xl border ${isBlack ? 'border-white/10' : 'border-gray-100'} shadow-xl relative overflow-hidden group`}
                        >
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className={`text-[12px] font-[900] ${isBlack ? 'text-white/40' : 'text-black/40'} uppercase tracking-[0.2em] mb-1`}>{p.name}</h3>
                                        <p className={`text-[15px] font-black ${isBlack ? 'text-white' : 'text-black'} tracking-tight`}>{p.subtitle}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-bold ${isBlack ? 'text-[#F29F05]' : 'text-gray-400'} uppercase`}>Starting at</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-[32px] font-[900] ${isBlack ? 'text-white' : 'text-black'} italic tracking-tighter`}>₹{price}</span>
                                            <span className={`text-[10px] font-bold ${isBlack ? 'text-white/20' : 'text-black/20'} uppercase`}>/{selectedTab === 'monthly' ? 'mo' : 'yr'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {p.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full ${isBlack ? 'bg-white/10' : 'bg-gray-100'} flex items-center justify-center`}>
                                                <Check size={10} className={isBlack ? 'text-[#F29F05]' : 'text-green-500'} strokeWidth={4} />
                                            </div>
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${isBlack ? 'text-white/60' : 'text-black/60'}`}>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleSelectPlan(p)}
                                    className={`w-full py-4 rounded-xl font-[900] uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 ${isBlack ? 'bg-[#F29F05] text-black' : 'bg-black text-white'}`}
                                >
                                    Select This Plan
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );

    const renderVehicleSelect = () => (
        <div className="flex flex-col gap-6 pb-24 px-5 pt-4">
            <div className="bg-black text-white p-6 rounded-3xl mb-4">
                <h3 className="text-xl font-black uppercase italic italic tracking-tighter mb-2">{selectedPlan.name} Fleet</h3>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                    You can link up to {selectedPlan.maxVehicles} vehicles to this plan.
                </p>
                <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-[#F29F05] h-full transition-all duration-500"
                            style={{ width: `${(selectedVehicles.length / selectedPlan.maxVehicles) * 100}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black">{selectedVehicles.length}/{selectedPlan.maxVehicles}</span>
                </div>
            </div>

            <div className="space-y-3">
                {(vehicles || []).map(v => (
                    <button
                        key={v.id}
                        onClick={() => toggleVehicleSelection(v.id)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${selectedVehicles.includes(v.id) ? 'border-black bg-white shadow-xl translate-y-[-2px]' : 'border-gray-100 bg-white shadow-sm'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedVehicles.includes(v.id) ? 'bg-black text-white' : 'bg-gray-50 text-black/20'}`}>
                                <Car size={24} />
                            </div>
                            <div>
                                <h4 className="text-[14px] font-black text-black uppercase">{v.brand} {v.model}</h4>
                                <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest mt-0.5">{v.plate}</p>
                            </div>
                        </div>
                        {selectedVehicles.includes(v.id) ? (
                            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                                <Check size={14} className="text-white" strokeWidth={4} />
                            </div>
                        ) : (
                            <div className="w-6 h-6 border-2 border-gray-100 rounded-full" />
                        )}
                    </button>
                ))}

                <button onClick={() => navigate('/vehicles')} className="w-full py-6 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 active:scale-95 transition-all">
                    <Plus size={24} />
                    <span className="text-[10px] font-black uppercase">Add New Vehicle</span>
                </button>
            </div>

            <button
                disabled={selectedVehicles.length === 0}
                onClick={() => setFlow('PAYMENT')}
                className="w-full py-5 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all mt-4 disabled:bg-gray-200 disabled:shadow-none"
            >
                Proceed to Payment
            </button>
        </div>
    );

    const renderPayment = () => (
        <div className="flex flex-col gap-6 pb-24 px-5 pt-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
                <h3 className="text-[13px] font-black text-black uppercase tracking-widest mb-6 italic">Checkout Summary</h3>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-[11px] font-bold text-black/40 uppercase tracking-widest">
                        <span>Plan</span>
                        <span className="text-black">{selectedPlan.name} ({selectedTab})</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-black/40 uppercase tracking-widest">
                        <span>Vehicles</span>
                        <span className="text-black">{selectedVehicles.length} Units</span>
                    </div>
                    <div className="h-px bg-gray-50 my-2" />
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-black uppercase tracking-widest">Grand Total</span>
                        <span className="text-xl font-black italic">₹{selectedTab === 'monthly' ? selectedPlan.price : selectedPlan.price * 10}</span>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck size={18} className="text-green-500" />
                        <span className="text-[10px] font-black uppercase text-green-700">Safe & Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-12 bg-white rounded-xl border border-gray-200 px-4 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-black/30 tracking-widest">Clean Wallet</span>
                            <span className="text-[12px] font-black">₹{selectedTab === 'monthly' ? selectedPlan.price : selectedPlan.price * 10}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full py-5 bg-[#F29F05] text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#F29F05]/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    {isProcessing ? <RefreshCw size={20} className="animate-spin" /> : <><CreditCard size={18} /> Pay Now</>}
                </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-black/20 text-[9px] font-black uppercase tracking-widest">
                <Shield size={12} />
                Encrypted Transaction via Razorpay
            </div>
        </div>
    );

    const renderSuccess = () => (
        <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-8 animate-bounce">
                <CheckCircle2 size={48} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-black text-content">
                Welcome To<br />
                <span className="text-[#F29F05]">PRIME</span> Club
            </h2>
            <p className="text-[11px] font-bold text-black/40 uppercase tracking-widest leading-relaxed mb-10">
                Your subscription is now active. Your fleet is ready for doorstep grooming.
            </p>
            <button
                onClick={() => setFlow('DASHBOARD')}
                className="w-full py-5 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
            >
                View Dashboard
            </button>
        </div>
    );

    return (
        <MobileLayout hideNav={false}>
            <div className="flex flex-col bg-[#F8F9FB] min-h-screen font-outfit">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
                    .font-outfit { font-family: 'Outfit', sans-serif; }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
                    .animate-float { animation: float 3s ease-in-out infinite; }
                `}} />

                {flow === 'SUCCESS' ? null : renderHeader(
                    flow === 'DASHBOARD' ? 'Management' :
                        flow === 'SELECT_PLAN' ? 'Choose Plan' :
                            flow === 'SELECT_VEHICLE' ? 'Select Fleet' : 'Checkout'
                )}

                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={flow}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {flow === 'DASHBOARD' && renderDashboard()}
                            {flow === 'SELECT_PLAN' && renderPlanSelect()}
                            {flow === 'SELECT_VEHICLE' && renderVehicleSelect()}
                            {flow === 'PAYMENT' && renderPayment()}
                            {flow === 'SUCCESS' && renderSuccess()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </MobileLayout>
    );
};

export default Subscriptions;
