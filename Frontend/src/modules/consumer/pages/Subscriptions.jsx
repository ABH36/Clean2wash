import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ChevronDown, ChevronRight, Car,
    Star, Shield, Check, Crown, Zap, Clock, Info, ArrowRight, Sparkles, User,
    CreditCard, Layout, RefreshCw, Pause, Play, AlertCircle, CheckCircle2,
    Calendar, Wallet, ShieldCheck, ZapOff, Plus
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import api, { serviceAPI, subscriptionAPI } from '../../../utils/api';
import { toast } from 'react-hot-toast';

const Subscriptions = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { userSubscription, setUserSubscription, vehicles, createPaymentOrder, verifyPayment, getRazorpayKey } = useAuth();
    const moduleScope = searchParams.get('moduleScope') || '';
    const serviceCategory = searchParams.get('category') || '';
    const isSpareDriverScope = moduleScope === 'spare-driver';
    const isApartmentScope = moduleScope === 'apartment-wash';

    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [scopedSubscription, setScopedSubscription] = useState(null);

    // Flow State: 'DASHBOARD' | 'SELECT_VEHICLE' | 'SELECT_PLAN' | 'PAYMENT' | 'SUCCESS'
    const currentSubscription = (isSpareDriverScope || isApartmentScope) ? scopedSubscription : userSubscription;
    const setCurrentSubscription = (isSpareDriverScope || isApartmentScope) ? setScopedSubscription : setUserSubscription;
    const [flow, setFlow] = useState(currentSubscription ? 'DASHBOARD' : 'SELECT_PLAN');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedVehicles, setSelectedVehicles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedTab, setSelectedTab] = useState('Monthly'); // Matches API interval
    const [error, setError] = useState(null);
    const scopeTitle = isSpareDriverScope
        ? 'Chauffeur Pass'
        : isApartmentScope
            ? 'Apartment Pass'
            : 'clean2wash PASS';
    const scopeDashboardTitle = isSpareDriverScope
        ? 'Ride Credits'
        : isApartmentScope
            ? 'Wash Credits'
            : 'Credits';
    const scopeUpgradeLabel = isSpareDriverScope
        ? 'Upgrade Chauffeur Plan'
        : isApartmentScope
            ? 'Upgrade Apartment Plan'
            : 'Upgrade Plan';

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await serviceAPI.getPlans({
                    ...(serviceCategory ? { category: serviceCategory } : {}),
                    ...(moduleScope ? { moduleScope } : {})
                });
                if (res.status === 'success') {
                    setPlans(res.data.plans || []);
                }
            } catch (err) {
                console.error('Failed to load dynamic plans:', err);
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchPlans();
    }, [moduleScope, serviceCategory]);

    useEffect(() => {
        if (!moduleScope) return undefined;

        const fetchScopedSubscription = async () => {
            try {
                const res = await subscriptionAPI.getSubscription({ moduleScope });
                if (res?.status === 'success') {
                    setScopedSubscription(res.data.subscription || null);
                }
            } catch (err) {
                console.error('Failed to load scoped subscription:', err);
            }
        };

        fetchScopedSubscription();
        return undefined;
    }, [moduleScope]);

    // Sync flow with subscription status
    useEffect(() => {
        if (!currentSubscription && flow === 'DASHBOARD') {
            setFlow('SELECT_PLAN');
        }
    }, [currentSubscription, flow]);

    // Dashboard Info — Use a wash credit via real API
    const handleDeductWash = async () => {
        if (!currentSubscription || currentSubscription.status !== 'active') return;
        
        setIsProcessing(true);
        setError(null);
        try {
            const res = await subscriptionAPI.useSubscriptionCredit(moduleScope ? { moduleScope } : {});
            if (res.status === 'success') {
                setCurrentSubscription(res.data.subscription);
                toast.success('Credit used successfully!');
            }
        } catch (err) {
            setError(err.message || 'Failed to use credit.');
            toast.error('Credit usage failed');
        } finally {
            setIsProcessing(false);
        }
    };

    // Pause or Resume subscription via real API
    const handleToggleStatus = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            let res;
            if (currentSubscription.status === 'active') {
                res = await subscriptionAPI.pauseSubscription(moduleScope ? { moduleScope } : {});
            } else {
                res = await subscriptionAPI.resumeSubscription(moduleScope ? { moduleScope } : {});
            }
            if (res?.status === 'success') {
                setCurrentSubscription(res.data.subscription);
            }
        } catch (err) {
            setError(err.message || 'Failed to update subscription status.');
        } finally {
            setIsProcessing(false);
        }
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
                setError(`This plan allows max ${selectedPlan.maxVehicles} vehicles.`);
                return;
            }
            setSelectedVehicles([...selectedVehicles, vehicleId]);
        }
    };

    // ── Real Razorpay Payment Flow ──────────────────────────────────
    const handlePayment = async () => {
        if (!selectedPlan) return;
        setIsProcessing(true);
        setError(null);

        try {
            // 1. Get Razorpay key
            const keyRes = await getRazorpayKey();
            if (!keyRes.success) throw new Error('Failed to load payment gateway.');
            const razorpayKey = keyRes.data?.key || keyRes.data?.data?.key;

            // 2. Create payment order on backend
            const orderRes = await createPaymentOrder(selectedPlan.price, 'INR', `sub_${Date.now()}`);
            if (!orderRes.success) throw new Error(orderRes.error || 'Failed to create payment order.');
            const orderData = orderRes.data?.data || orderRes.data;

            // 3. Open Razorpay Checkout
            await new Promise((resolve, reject) => {
                const options = {
                    key: razorpayKey,
                    amount: orderData.amount,
                    currency: orderData.currency || 'INR',
                    name: 'Spare Driver',
                    description: `${selectedPlan.name} Subscription`,
                    image: 'https://cdn-icons-png.flaticon.com/512/3003/3003984.png', // Public URL to avoid localhost loopback CORS issues
                    order_id: orderData.id,
                    theme: { color: '#0B1222' },
                    handler: async (response) => {
                        try {
                            // 4. Verify payment
                            const verifyRes = await verifyPayment(
                                response.razorpay_order_id,
                                response.razorpay_payment_id,
                                response.razorpay_signature
                            );
                            if (!verifyRes.success) throw new Error('Payment verification failed.');

                            // 5. Create subscription on backend
                            const { subscriptionAPI } = await import('../../../utils/api');
                            const subRes = await subscriptionAPI.createSubscription({
                                planId: selectedPlan._id || selectedPlan.id,
                                plan: selectedPlan.name,
                                paymentMethod: 'razorpay',
                                vehicleIds: selectedVehicles,
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                                signature: response.razorpay_signature,
                                autoRenew: false,
                                ...(moduleScope ? { moduleScope } : {})
                            });

                            if (subRes?.status === 'success') {
                                setCurrentSubscription({
                                    ...subRes.data.subscription,
                                    planName: selectedPlan.name,
                                    vehicleIds: selectedVehicles
                                });
                                setFlow('SUCCESS');
                                resolve();
                            } else {
                                throw new Error('Subscription activation failed. Please contact support.');
                            }
                        } catch (err) {
                            reject(err);
                        }
                    },
                    modal: {
                        ondismiss: () => reject(new Error('Payment cancelled. Please try again.'))
                    }
                };

                if (!window.Razorpay) {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = () => { new window.Razorpay(options).open(); };
                    script.onerror = () => reject(new Error('Failed to load Razorpay. Check your connection.'));
                    document.body.appendChild(script);
                } else {
                    new window.Razorpay(options).open();
                }
            });

        } catch (err) {
            console.error('Subscription payment error:', err);
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Cancel Subscription — real API ──────────────────────────────
    const handleCancelSubscription = async () => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-content uppercase tracking-tight">Are you sure you want to cancel your subscription?</p>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            setIsProcessing(true);
                            setError(null);
                            try {
                                await subscriptionAPI.cancelSubscription(moduleScope ? { moduleScope } : {});
                                setCurrentSubscription(null);
                                setFlow('SELECT_PLAN');
                                toast.success('Subscription cancelled');
                            } catch (err) {
                                setError(err.message || 'Failed to cancel subscription.');
                                toast.error('Cancellation failed');
                            } finally {
                                setIsProcessing(false);
                            }
                        }}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        Confirm Cancel
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-gray-100 text-content px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        Keep Plan
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const renderHeader = (title, showBack = true) => (
        <header className="px-6 pt-6 pb-2 flex items-center justify-between bg-white sticky top-0 z-50">
            <div className="flex items-center gap-3">
                {showBack && (
                    <button onClick={() => {
                        if (flow === 'SELECT_VEHICLE') setFlow('SELECT_PLAN');
                        else if (flow === 'PAYMENT') setFlow('SELECT_VEHICLE');
                        else if (flow === 'SELECT_PLAN' && !currentSubscription) navigate('/');
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
                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest leading-none mt-1">{scopeTitle}</p>
                </div>
            </div>
        </header>
    );

    const renderDashboard = () => {
        if (!currentSubscription) return null;
        const plan = plans.find((p) => (p.id || p._id) === currentSubscription.planId) || plans[0] || {};
        const subVehicles = (vehicles || []).filter(v => currentSubscription.vehicleIds?.includes(v.id));

        return (
            <div className="flex flex-col gap-6 pb-24">
                {/* Error Banner */}
                {error && (
                    <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between">
                        <span className="text-[11px] font-bold">{error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 font-black text-lg leading-none">×</button>
                    </div>
                )}

                {/* Active Plan Card */}
                <section className="px-5 pt-4">
                    <div className="bg-black rounded-3xl p-6 relative overflow-hidden shadow-2xl border border-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F29F05]/10 rounded-full blur-3xl -mr-16 -mt-16" />

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <div className="bg-[#F29F05] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest mb-2 w-fit">
                                    {currentSubscription.status}
                                </div>
                                <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter">
                                    {currentSubscription.planName || currentSubscription.plan}
                                </h2>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                    Renews on {currentSubscription.endDate ? new Date(currentSubscription.endDate).toLocaleDateString() : currentSubscription.expiryDate ? new Date(currentSubscription.expiryDate).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">{scopeDashboardTitle}</p>
                                <div className="text-white text-3xl font-black italic tracking-tighter leading-none mt-1">
                                    0{(currentSubscription.monthlyCredits - (currentSubscription.usedCredits || 0)) || 0}/0{currentSubscription.monthlyCredits || 0}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <button
                                onClick={handleDeductWash}
                                disabled={currentSubscription.status !== 'active'}
                                className="bg-white text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <Zap size={14} fill="currentColor" /> {isSpareDriverScope ? 'Use Trip Credit' : 'Use Credit'}
                            </button>
                            <button
                                onClick={handleToggleStatus}
                                disabled={isProcessing}
                                className={`${currentSubscription.status === 'active' ? 'bg-white/10 text-white' : 'bg-green-500 text-white'} py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all outline-none border border-white/5 disabled:opacity-60`}
                            >
                                {isProcessing ? 'Please wait...' : currentSubscription.status === 'active' ? <><Pause size={14} /> Pause Plan</> : <><Play size={14} /> Resume Plan</>}
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
                                Any unused {isSpareDriverScope ? 'trip credits' : 'washes'} (up to {plan.rollover}) will automatically transfer to your next billing cycle.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Upgrade/Manage Options */}
                <section className="px-5 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setFlow('SELECT_PLAN')} className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm">
                            <ArrowRight className="text-black" size={24} />
                            <span className="text-[10px] font-black uppercase text-black">{scopeUpgradeLabel}</span>
                        </button>
                        <button onClick={() => navigate('/vehicles?from=subscriptions')} className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm">
                            <Layout className="text-black" size={24} />
                            <span className="text-[10px] font-black uppercase text-black">Manage Fleet</span>
                        </button>
                    </div>
                </section>

                <div className="px-5 mt-4">
                    <button
                        onClick={handleCancelSubscription}
                        disabled={isProcessing}
                        className="w-full py-4 text-[10px] font-black text-red-500 uppercase tracking-widest disabled:opacity-50"
                    >
                        {isProcessing ? 'Please wait...' : 'Cancel Subscription'}
                    </button>
                </div>
            </div>
        );
    };

    const renderPlanSelect = () => (
        <div className="flex flex-col gap-6 pb-24 px-5 pt-4">
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4 border border-gray-200/50">
                <button
                    onClick={() => setSelectedTab('Monthly')}
                    className={`flex-1 py-3 text-[11px] font-[900] uppercase tracking-widest rounded-lg transition-all ${selectedTab === 'Monthly' ? 'bg-white text-black shadow-md' : 'text-black/40'}`}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setSelectedTab('Quarterly')}
                    className={`flex-1 py-3 text-[11px] font-[900] uppercase tracking-widest rounded-lg transition-all relative ${selectedTab === 'Quarterly' ? 'bg-white text-black shadow-md' : 'text-black/40'}`}
                >
                    Quarterly
                    <span className="absolute -top-2 right-0 bg-blue-600 text-white text-[7px] px-2 py-0.5 rounded-full">Save 20%</span>
                </button>
                <button
                    onClick={() => setSelectedTab('Annual')}
                    className={`flex-1 py-3 text-[11px] font-[900] uppercase tracking-widest rounded-lg transition-all relative ${selectedTab === 'Annual' ? 'bg-white text-black shadow-md' : 'text-black/40'}`}
                >
                    Annual
                    <span className="absolute -top-2 right-0 bg-red-600 text-white text-[7px] px-2 py-0.5 rounded-full">Save 40%</span>
                </button>
            </div>

            <div className="space-y-6">
                {loadingPlans ? (
                    <div className="py-20 text-center">
                        <RefreshCw className="mx-auto text-brand animate-spin mb-4" size={32} />
                        <p className="text-xs font-black text-content-subtle uppercase tracking-widest italic">Syncing Matrix...</p>
                    </div>
                ) : plans.filter(p => p.interval === selectedTab).map((p, i) => {
                    const price = p.price;
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
                                        <span className={`text-[10px] font-bold ${isBlack ? 'text-[#F29F05]' : 'text-gray-400'} uppercase`}>Flat Rate</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-[32px] font-[900] ${isBlack ? 'text-white' : 'text-black'} italic tracking-tighter`}>₹{price}</span>
                                            <span className={`text-[10px] font-bold ${isBlack ? 'text-white/20' : 'text-black/20'} uppercase`}>/{selectedTab === 'Monthly' ? 'mo' : selectedTab === 'Quarterly' ? 'qtr' : 'yr'}</span>
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
                        {isSpareDriverScope
                            ? `You can assign this chauffeur plan to up to ${selectedPlan.maxVehicles} vehicles.`
                            : `You can link up to ${selectedPlan.maxVehicles} vehicles to this plan.`}
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

                <button onClick={() => navigate('/vehicles?from=subscriptions')} className="w-full py-6 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 active:scale-95 transition-all">
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
                        <span className="text-xl font-black italic">₹{selectedPlan.price}</span>
                    </div>
                </div>

                {isSpareDriverScope && (
                    <div className="bg-amber-50 p-4 rounded-2xl mb-6 border border-amber-100">
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Spare Driver Scope</p>
                        <p className="text-[10px] font-bold text-amber-900/70 uppercase mt-1 leading-relaxed">
                            This plan applies only to chauffeur bookings and will not affect wash subscriptions.
                        </p>
                    </div>
                )}

                <div className="bg-gray-50 p-4 rounded-2xl mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck size={18} className="text-green-500" />
                        <span className="text-[10px] font-black uppercase text-green-700">Safe & Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-12 bg-white rounded-xl border border-gray-200 px-4 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-black/30 tracking-widest">Clean Wallet</span>
                            <span className="text-[12px] font-black">₹{selectedPlan.price}</span>
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
                {isSpareDriverScope
                    ? 'Your chauffeur subscription is now active. Trip credits are ready for spare driver bookings.'
                    : 'Your subscription is now active. Your fleet is ready for doorstep grooming.'}
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
