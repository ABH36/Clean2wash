import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Crown, Sparkles, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { serviceAPI, subscriptionAPI, paymentAPI } from '../../../../utils/api';

const BlackPassModal = ({ isOpen, onClose }) => {
    const { user, login, userSubscription, setUserSubscription, getRazorpayKey, createPaymentOrder, verifyPayment } = useAuth();
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchBlackPlan();
        }
    }, [isOpen]);

    const fetchBlackPlan = async () => {
        try {
            setLoading(true);
            const res = await serviceAPI.getPlans();
            if (res.status === 'success' && res.data?.plans) {
                const blackPass = res.data.plans.find(p => p.name?.toLowerCase().includes('black'));

                if (blackPass) {
                    setPlan(blackPass);
                } else {
                    // Fallback to static mock if not found in DB yet
                    setPlan({
                        id: 'black-pass-proto',
                        name: 'Black Pass',
                        price: 599,
                        features: [
                            '30% OFF on All Services',
                            'Zero Pickup & Delivery Fee',
                            'Priority Booking Slots',
                            'Premium Studio Chemicals',
                            'Global Access to CW Hubs'
                        ]
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch plan", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!user) {
            setError("Please login to purchase Black Pass");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 1. Get Razorpay Key from backend
            const { data: { key_id } } = await getRazorpayKey();

            // 2. Create payment order (599 INR for Black Pass)
            const orderRes = await createPaymentOrder(599, 'INR', `black_pass_${Date.now()}`);
            const { order_id, amount, currency } = orderRes.data;

            // 3. Initialize Razorpay options
            const options = {
                key: key_id,
                amount: amount, // Amount in paise as returned by backend
                currency: currency,
                name: 'Clean2Wash Black',
                description: 'Black Pass Premium Membership',
                image: 'https://cdn-icons-png.flaticon.com/512/3003/3003984.png', // Public URL to avoid localhost loopback CORS issues
                order_id: order_id,
                handler: async function (response) {
                    try {
                        setLoading(true); // Use setLoading for consistency
                        // 4. Verify payment
                        const verificationResult = await verifyPayment(
                            response.razorpay_order_id,
                            response.razorpay_payment_id,
                            response.razorpay_signature
                        );

                        if (verificationResult.success) {
                            // 5. Create subscription record
                            const subRes = await subscriptionAPI.createSubscription({
                                plan: plan?.name || plan?.id || 'black',
                                planId: plan?.id || plan?._id,
                                paymentMethod: 'razorpay',
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id
                            });

                            if (subRes.status === 'success') {
                                setUserSubscription(subRes.data.subscription);
                                // Re-fetch profile to sync state (if login updates user context)
                                if (user?.phone) await login('consumer', user);
                                onClose(); // Close modal on success
                                // Trigger success confetti or message could go here
                            } else {
                                console.error("Subscription creation failed:", subRes);
                                setError(subRes.message || "Subscription creation failed.");
                            }
                        } else {
                            setError('Payment verification failed.');
                        }
                    } catch (err) {
                        console.error("Payment/Subscription error:", err);
                        setError(`Payment failure: ${err.message || "Please contact support."}`);
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone
                },
                theme: { color: "#F29F05" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            setError(err.message || "Purchase failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-5">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl"
                    >
                        {/* Premium Header */}
                        <div className="relative h-48 bg-black flex flex-col items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent z-0" />

                            {/* Animated Background Sparks */}
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-brand rounded-full"
                                    animate={{
                                        y: [-20, -100],
                                        x: [0, (i - 3) * 20],
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2 + i * 0.5,
                                        delay: i * 0.3
                                    }}
                                    style={{
                                        bottom: '20%',
                                        left: `${40 + i * 5}%`
                                    }}
                                />
                            ))}

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="relative z-10 flex flex-col items-center"
                            >
                                <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mb-4 border border-brand/20 shadow-2xl">
                                    <Crown size={32} className="text-brand" fill="#F29F05" />
                                </div>
                                <h2 className="text-2xl font-[1000] text-white uppercase tracking-tighter leading-none">Black Pass</h2>
                                <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mt-2">Lifetime Ecosystem Access</p>
                            </motion.div>

                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Benefits List */}
                        <div className="p-8 pb-10">
                            {loading && !plan ? (
                                <div className="py-10 flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-brand animate-spin mb-4" />
                                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Calibrating Benefits...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4 mb-10">
                                        {(plan?.features || []).map((feat, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.3 + i * 0.1 }}
                                                className="flex items-center gap-4"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 size={12} className="text-brand" strokeWidth={3} />
                                                </div>
                                                <span className="text-[11px] font-[1000] text-black/70 uppercase tracking-tight">{feat}</span>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                                            <ShieldCheck size={16} className="text-red-500" />
                                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight">{error}</p>
                                        </div>
                                    )}

                                    <div className="bg-gray-50 rounded-[2rem] p-6 mb-8 border border-gray-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em] mb-1">Standard Price</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-[1000] text-black italic leading-none">₹{plan?.price || 599}</span>
                                                <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">/ Month</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm">
                                            <Zap size={20} className="text-brand" fill="#F29F05" />
                                        </div>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handlePurchase}
                                        disabled={loading}
                                        className={`w-full h-16 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 group transition-all duration-300 ${userSubscription ? 'bg-emerald-500 text-white' : 'bg-black text-white hover:bg-brand'}`}
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                {userSubscription ? 'Extend Premium Membership' : 'Unlock Premium Now'}
                                                <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </motion.button>

                                    <p className="text-center text-[8px] font-bold text-black/20 uppercase tracking-[0.2em] mt-6">
                                        Powered by Razorpay Secure
                                    </p>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BlackPassModal;
