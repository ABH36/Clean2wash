import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Crown, Sparkles, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { serviceAPI, subscriptionAPI, paymentAPI } from '../../../../utils/api';

const GoldPassModal = ({ isOpen, onClose }) => {
    const { user, login, userSubscription, setUserSubscription, getRazorpayKey, createPaymentOrder, verifyPayment } = useAuth();
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchGoldPlan();
        }
    }, [isOpen]);

    const fetchGoldPlan = async () => {
        try {
            setLoading(true);
            const res = await serviceAPI.getPlans();
            if (res.status === 'success' && res.data?.plans) {
                const goldPass = res.data.plans.find(p => p.name?.toLowerCase().includes('gold') || p.name?.toLowerCase().includes('black'));

                if (goldPass) {
                    setPlan(goldPass);
                } else {
                    // Fallback to static mock if not found in DB yet
                    setPlan({
                        id: 'gold-pass-proto',
                        name: 'Gold Pass',
                        price: 399,
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
            setError("Please login to purchase Gold Pass");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 1. Get Razorpay Key from backend
            const { data: { key_id } } = await getRazorpayKey();

            // 2. Create payment order (399 INR for Gold Pass)
            const orderRes = await createPaymentOrder(399, 'INR', `gold_pass_${Date.now()}`);
            const { order_id, amount, currency } = orderRes.data;

            // 3. Initialize Razorpay options
            const options = {
                key: key_id,
                amount: amount, // Amount in paise as returned by backend
                currency: currency,
                name: 'Spare Driver Gold',
                description: 'Gold Pass Premium Membership',
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
                                plan: plan?.name || plan?.id || 'gold',
                                planId: plan?.id || plan?._id,
                                paymentMethod: 'razorpay',
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                                signature: response.razorpay_signature
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
                        className="bg-white/5 w-full max-w-[340px] rounded-[2rem] overflow-hidden relative z-10 shadow-2xl"
                    >
                        {/* Premium Header - Compact Native Style */}
                        <div className="relative h-36 bg-black flex flex-col items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent z-0" />

                            {/* Animated Background Sparks */}
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-brand rounded-full"
                                    animate={{
                                        y: [-10, -80],
                                        x: [0, (i - 2) * 15],
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2 + i * 0.5,
                                        delay: i * 0.3
                                    }}
                                    style={{
                                        bottom: '15%',
                                        left: `${45 + i * 4}%`
                                    }}
                                />
                            ))}

                            <motion.div
                                initial={{ y: 15, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="relative z-10 flex flex-col items-center"
                            >
                                <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mb-3 border border-brand/20 shadow-2xl">
                                    <Crown size={28} className="text-brand" fill="#F29F05" />
                                </div>
                                <h2 className="text-xl font-[1000] text-white uppercase tracking-tighter leading-none">Gold Pass</h2>
                                <p className="text-[9px] font-black text-brand uppercase tracking-[0.4em] mt-1.5 opacity-80">Lifetime Access</p>
                            </motion.div>

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Benefits List - Compact */}
                        <div className="p-6 pb-8">
                            {loading && !plan ? (
                                <div className="py-8 flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-brand animate-spin mb-4" />
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Calibrating Benefits...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3 mb-8">
                                        {(plan?.features || []).map((feat, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.3 + i * 0.1 }}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 size={10} className="text-brand" strokeWidth={3} />
                                                </div>
                                                <span className="text-[10px] font-[1000] text-black/70 uppercase tracking-tight leading-none">{feat}</span>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {error && (
                                        <div className="mb-5 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-red-500" />
                                            <p className="text-[9px] font-bold text-red-600 uppercase tracking-tight">{error}</p>
                                        </div>
                                    )}

                                    <div className="bg-white/[0.02] rounded-2xl p-4 mb-6 border border-white/5 flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] font-black text-black/30 uppercase tracking-[0.2em] mb-0.5">Premium Price</p>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-xl font-[1000] text-white italic leading-none">₹{plan?.price || 399}</span>
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">/ Limitless</span>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 ">
                                            <Zap size={18} className="text-brand" fill="#F29F05" />
                                        </div>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.96 }}
                                        onClick={handlePurchase}
                                        disabled={loading}
                                        className={`w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 group transition-all duration-300 ${userSubscription ? 'bg-emerald-500 text-white' : 'bg-black text-white hover:bg-brand shadow-lg active:shadow-none'}`}
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <span>{userSubscription ? 'Extend Pass' : 'Unlock Gold Pass'}</span>
                                                <ArrowRight size={14} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </motion.button>

                                    <p className="text-center text-[7px] font-bold text-white/20 uppercase tracking-[0.2em] mt-5">
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

export default GoldPassModal;
