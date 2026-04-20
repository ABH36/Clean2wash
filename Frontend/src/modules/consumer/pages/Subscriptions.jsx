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
                        className="bg-white/[0.05] text-content px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        Keep Plan
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const renderHeader = (title, showBack = true) => (
        <header className="px-6 pt-6 pb-2 flex items-center justify-between bg-[#0A0F0D]/90 sticky top-0 z-50">
            <div className="flex items-center gap-3">
                {showBack && (
                    <button onClick={() => {
                        if (flow === 'SELECT_VEHICLE') setFlow('SELECT_PLAN');
                        else if (flow === 'PAYMENT') setFlow('SELECT_VEHICLE');
                        else if (flow === 'SELECT_PLAN' && !currentSubscription) navigate('/');
                        else if (flow === 'DASHBOARD') navigate('/');
                        else setFlow('DASHBOARD');
                    }} className="w-8 h-8 flex items-center justify-center bg-white/[0.05] rounded-lg border border-white/10">
                        <ArrowRight className="rotate-180 text-white" size={16} />
                    </button>
                )}
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                    <Crown size={20} className="text-[#F59E0B]" />
                </div>
                <div className="text-left">
                    <span className="text-[14px] font-[900] text-white uppercase tracking-tight">{title}</span>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none mt-1">{scopeTitle}</p>
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
                    <div className="mx-5 mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-2xl flex items-center justify-between backdrop-blur-sm">
                        <span className="text-[11px] font-black uppercase tracking-tight">{error}</span>
                        <button onClick={() => setError(null)} className="text-rose-500 font-black text-lg leading-none">×</button>
                    </div>
                )}

                {/* Active Plan Card */}
                <section className="px-5 pt-4">
                    <div className="bg-[#0F1412] rounded-3xl p-6 relative overflow-hidden shadow-2xl border border-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/10 rounded-full blur-3xl -mr-16 -mt-16" />

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <div className="bg-[#F59E0B] text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3 w-fit">
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
                                <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">{scopeDashboardTitle}</p>
                                <div className="text-white text-3xl font-black italic tracking-tighter leading-none mt-1">
                                    0{(currentSubscription.monthlyCredits - (currentSubscription.usedCredits || 0)) || 0}/0{currentSubscription.monthlyCredits || 0}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <button
                                onClick={handleDeductWash}
                                disabled={currentSubscription.status !== 'active'}
                                className="bg-white/5 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
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
                        <h3 className="text-[13px] font-black text-white uppercase tracking-widest italic">Linked Fleet</h3>
                        <span className="text-white/20 text-[10px] font-black uppercase">{subVehicles.length}/{plan.maxVehicles} Vehicles</span>
                    </div>
                    <div className="space-y-3">
                        {subVehicles.map(v => (
                            <div key={v.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-4 ">
                                <div className="w-12 h-12 bg-white/[0.02] rounded-xl flex items-center justify-center border border-white/5">
                                    <Car size={24} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[14px] font-black text-white uppercase leading-none">{v.brand} {v.model}</h4>
                                    <p className="text-[10px] font-bold text-white/20 uppercase mt-1 tracking-widest">{v.plate}</p>
                                </div>
                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/20" />
                            </div>
                        ))}
                        {subVehicles.length === 0 && (
                            <div className="bg-white/[0.02] border-white/5 border-dashed border-white/10 p-6 rounded-2xl text-center">
                                <Car size={24} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No vehicles linked</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Rollover Info */}
                <section className="px-5">
                    <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 p-5 rounded-2xl flex items-start gap-4">
                        <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center text-[#F59E0B] flex-shrink-0">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-black text-[#F59E0B] uppercase">Rollover Cap: {plan.rollover} Washes</h4>
                            <p className="text-[10px] font-bold text-white/40 uppercase mt-1 leading-relaxed">
                                Any unused {isSpareDriverScope ? 'trip credits' : 'washes'} (up to {plan.rollover}) will automatically transfer to your next billing cycle.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Upgrade/Manage Options */}
                <section className="px-5 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setFlow('SELECT_PLAN')} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all ">
                            <ArrowRight className="text-white" size={24} />
                            <span className="text-[10px] font-black uppercase text-white">{scopeUpgradeLabel}</span>
                        </button>
                        <button onClick={() => navigate('/vehicles?from=subscriptions')} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all ">
                            <Layout className="text-white" size={24} />
                            <span className="text-[10px] font-black uppercase text-white">Manage Fleet</span>
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
            <div className="flex bg-white/[0.03] p-1.5 rounded-2xl mb-4 border border-white/5">
                <button
                    onClick={() => setSelectedTab('Monthly')}
                    className={`flex-1 py-3 text-[11px] font-[900] uppercase tracking-widest rounded-xl transition-all ${selectedTab === 'Monthly' ? 'bg-white/5 text-[#F59E0B] shadow-2xl border border-white/5' : 'text-white/30'}`}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setSelectedTab('Quarterly')}
                    className={`flex-1 py-3 text-[11px] font-[900] uppercase tracking-widest rounded-xl transition-all relative ${selectedTab === 'Quarterly' ? 'bg-white/5 text-[#F59E0B] shadow-2xl border border-white/5' : 'text-white/30'}`}
                >
                    Quarterly
                    <span className="absolute -top-1.5 right-0 bg-[#F59E0B] text-black text-[7px] font-black px-2 py-0.5 rounded-full uppercase">Save 20%</span>
                </button>
                <button
                    onClick={() => setSelectedTab('Annual')}
                    className={`flex-1 py-3 text-[11px] font-[900] uppercase tracking-widest rounded-xl transition-all relative ${selectedTab === 'Annual' ? 'bg-white/5 text-[#F59E0B] shadow-2xl border border-white/5' : 'text-white/30'}`}
                >
                    Annual
                    <span className="absolute -top-1.5 right-0 bg-white text-black text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Best Value</span>
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
                    const isBlack = p.accent === 'black' || true; // Force all to obsidian
                    const isGold = p.accent === 'gold';
                    const bgColor = 'bg-white/[0.03]';

                    return (
                        <motion.div
                            key={p.id}
                            whileTap={{ scale: 0.98 }}
                            className={`${bgColor} px-7 py-8 rounded-3xl border border-white/5 shadow-2xl shadow-black/50 relative overflow-hidden group`}
                        >
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className={`text-[12px] font-[900] text-white/40 uppercase tracking-[0.2em] mb-1`}>{p.name}</h3>
                                        <p className={`text-[15px] font-black text-white tracking-tight`}>{p.subtitle}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-bold text-[#F59E0B] uppercase`}>Flat Rate</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-[32px] font-[900] text-white italic tracking-tighter`}>₹{price}</span>
                                            <span className={`text-[10px] font-bold text-white/20 uppercase`}>/{selectedTab === 'Monthly' ? 'mo' : selectedTab === 'Quarterly' ? 'qtr' : 'yr'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {p.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full bg-white/[0.05] flex items-center justify-center`}>
                                                <Check size={10} className="text-[#F59E0B]" strokeWidth={4} />
                                            </div>
                                            <span className={`text-[11px] font-black uppercase tracking-widest text-white/60`}>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleSelectPlan(p)}
                                    className={`w-full py-4 rounded-xl font-[900] uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 bg-[#F59E0B] text-black hover:bg-white transition-colors`}
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
                <div className="bg-[#0F1412] text-white p-6 rounded-3xl mb-4 border border-white/10">
                    <h3 className="text-xl font-black uppercase italic italic tracking-tighter mb-2">{selectedPlan.name} Fleet</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-loose">
                        {isSpareDriverScope
                            ? `You can assign this chauffeur plan to up to ${selectedPlan.maxVehicles} vehicles.`
                            : `You can link up to ${selectedPlan.maxVehicles} vehicles to this plan.`}
                    </p>
                    <div className="mt-6 flex items-center gap-4">
                        <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-[#F59E0B] h-full transition-all duration-500"
                                style={{ width: `${(selectedVehicles.length / selectedPlan.maxVehicles) * 100}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-[1000] text-[#F59E0B]">{selectedVehicles.length}/{selectedPlan.maxVehicles}</span>
                    </div>
                </div>

            <div className="space-y-3">
                {(vehicles || []).map(v => (
                    <button
                        key={v.id}
                        onClick={() => toggleVehicleSelection(v.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${selectedVehicles.includes(v.id) ? 'border-[#F59E0B]/30 bg-white/10 translate-y-[-2px]' : 'border-white/5 bg-white/[0.03] '}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedVehicles.includes(v.id) ? 'bg-[#F59E0B] text-black' : 'bg-white/5 text-white/20'}`}>
                                <Car size={24} />
                            </div>
                            <div>
                                <h4 className="text-[14px] font-black text-white uppercase">{v.brand} {v.model}</h4>
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-0.5">{v.plate}</p>
                            </div>
                        </div>
                        {selectedVehicles.includes(v.id) ? (
                            <div className="w-6 h-6 bg-[#F59E0B] rounded-full flex items-center justify-center">
                                <Check size={14} className="text-black" strokeWidth={4} />
                            </div>
                        ) : (
                            <div className="w-6 h-6 border border-white/10 rounded-full" />
                        )}
                    </button>
                ))}

                <button onClick={() => navigate('/vehicles?from=subscriptions')} className="w-full py-6 border-white/5 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-white/20 active:scale-95 transition-all">
                    <Plus size={24} />
                    <span className="text-[10px] font-black uppercase">Add New Vehicle</span>
                </button>
            </div>

            <button
                disabled={selectedVehicles.length === 0}
                onClick={() => setFlow('PAYMENT')}
                className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all mt-4 disabled:opacity-20"
            >
                Proceed to Payment
            </button>
        </div>
    );

    const renderPayment = () => (
        <div className="flex flex-col gap-6 pb-24 px-5 pt-4">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 shadow-2xl shadow-black/50">
                <h3 className="text-[13px] font-black text-white uppercase tracking-widest mb-6 italic">Checkout Summary</h3>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-[11px] font-bold text-white/40 uppercase tracking-widest">
                        <span>Plan</span>
                        <span className="text-white">{selectedPlan.name} ({selectedTab})</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-white/40 uppercase tracking-widest">
                        <span>Vehicles</span>
                        <span className="text-white">{selectedVehicles.length} Units</span>
                    </div>
                    <div className="h-px bg-white/[0.02] my-2" />
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Grand Total</span>
                        <span className="text-xl font-black italic">₹{selectedPlan.price}</span>
                    </div>
                </div>

                {isSpareDriverScope && (
                    <div className="bg-[#F59E0B]/5 p-4 rounded-2xl mb-6 border border-[#F59E0B]/10">
                        <p className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest">Spare Driver Scope</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase mt-1 leading-relaxed">
                            This plan applies only to chauffeur bookings and will not affect wash subscriptions.
                        </p>
                    </div>
                )}

                <div className="bg-white/[0.03] p-4 rounded-2xl mb-8 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase text-emerald-500 tracking-widest">Safe & Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-12 bg-white/5 rounded-xl border border-white/10 px-4 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Clean Wallet</span>
                            <span className="text-[12px] font-black text-white">₹{selectedPlan.price}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full py-5 bg-[#F59E0B] text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#F59E0B]/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    {isProcessing ? <RefreshCw size={20} className="animate-spin" /> : <><CreditCard size={18} /> Pay Now</>}
                </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-white/20 text-[9px] font-black uppercase tracking-widest">
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
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">
                Welcome To<br />
                <span className="text-[#F59E0B]">PRIME</span> Club
            </h2>
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-relaxed mb-10">
                {isSpareDriverScope
                    ? 'Your chauffeur subscription is now active. Trip credits are ready for spare driver bookings.'
                    : 'Your subscription is now active. Your fleet is ready for doorstep grooming.'}
            </p>
            <button
                onClick={() => setFlow('DASHBOARD')}
                className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
            >
                View Dashboard
            </button>
        </div>
    );

    return (
        <MobileLayout hideNav={false}>
            <div className="flex flex-col bg-[#0A0F0D] min-h-screen font-outfit">
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
