import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronLeft, ShieldCheck, CreditCard, Smartphone,
    Check, ArrowRight, Wallet, Lock, Info, Zap
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';

const PaymentCheckout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        addBooking,
        getRazorpayKey,
        createPaymentOrder,
        verifyPayment,
        sessions,
        paymentMethods,
        loadPaymentMethods
    } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('upi');

    useEffect(() => {
        loadPaymentMethods();
    }, [loadPaymentMethods]);

    useEffect(() => {
        const defaultMethod = paymentMethods.find(m => m.isDefault);
        if (defaultMethod) {
            setSelectedMethod(defaultMethod.type.toLowerCase());
        }
    }, [paymentMethods]);

    // Get booking data from navigation state or fallback
    const { amount, serviceName, date, time, bookingInfo } = location.state || {
        amount: 299,
        serviceName: 'Premium Chauffeur',
        date: 'Today',
        time: 'Now'
    };

    // Helper to load Razorpay script
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            // 1. Create a "Pending" booking first
            const bookingResult = await addBooking({
                ...bookingInfo,
                payment: {
                    method: selectedMethod,
                    status: 'pending'
                }
            });

            if (!bookingResult.success) {
                throw new Error(bookingResult.error || 'Failed to initialize booking');
            }

            const bookingId = bookingResult.data._id;

            // 2. Load Razorpay Script
            const res = await loadRazorpayScript();
            if (!res) {
                throw new Error('Razorpay SDK failed to load. Check your internet connection.');
            }

            // 3. Get Razorpay Key from Backend
            const keyRes = await getRazorpayKey();
            if (!keyRes.success) throw new Error('Failed to fetch payment configuration');

            // 4. Create Order on Backend
            const orderRes = await createPaymentOrder(amount, 'INR', bookingId);
            if (!orderRes.success) throw new Error('Failed to create payment order');

            const { id: order_id, amount: order_amount, currency } = orderRes.data;

            // 5. Initialize Razorpay Options
            const options = {
                key: keyRes.data.key_id,
                amount: order_amount,
                currency: currency,
                name: 'Spare Driver',
                description: `Payment for ${serviceName}`,
                image: '/logo192.png',
                order_id: order_id,
                handler: async (response) => {
                    try {
                        setIsProcessing(true);
                        // 6. Verify Payment on Backend
                        const verifyRes = await verifyPayment(
                            response.razorpay_order_id,
                            response.razorpay_payment_id,
                            response.razorpay_signature,
                            bookingId
                        );

                        if (verifyRes.success) {
                            setPaymentSuccess(true);
                            setTimeout(() => {
                                navigate('/bookings');
                            }, 3000);
                        } else {
                            throw new Error('Payment verification failed');
                        }
                    } catch (err) {
                        console.error('Verification Error:', err);
                        alert('Payment verification failed. Please contact support if amount was deducted.');
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: sessions.consumer?.name || '',
                    email: sessions.consumer?.email || '',
                    contact: sessions.consumer?.phone || ''
                },
                notes: {
                    booking_id: bookingId
                },
                theme: {
                    color: '#000000'
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Payment Error:', error);
            alert(error.message || 'Something went wrong during payment');
            setIsProcessing(false);
        }
    };

    return (
        <MobileLayout hideNav={true}>
            <div className="bg-[#FAFAFA] min-h-screen pb-40">
                {/* ── Header ── */}
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-5 py-6 border-b border-gray-100 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-black active:scale-90 transition-transform">
                        <ChevronLeft size={24} strokeWidth={3} />
                    </button>
                    <div>
                        <h1 className="text-base font-[1000] text-black uppercase tracking-tight italic">Secure Checkout</h1>
                        <p className="text-[9px] font-black text-black/20 uppercase tracking-widest leading-none mt-0.5">Payment Authentication</p>
                    </div>
                </header>

                <div className="px-5 pt-4 space-y-4">
                    {/* ── Order Summary ── */}
                    <div className="bg-white rounded-[1.5rem] border border-black/[0.04] p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-3xl -mr-12 -mt-12" />

                        <div className="relative z-10 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-[12px] font-[1000] text-black uppercase tracking-tight mb-1">{serviceName}</h3>
                                    <p className="text-[8px] font-black text-black/30 uppercase tracking-widest leading-none">{date} • {time}</p>
                                </div>
                                <div className="bg-brand/10 px-1.5 py-0.5 rounded text-[7px] font-black text-brand uppercase tracking-widest">In-Store</div>
                            </div>

                            <div className="h-px bg-black/[0.03] w-full" />

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[7px] font-black text-black/20 uppercase tracking-widest leading-none mb-1">Total Payable</p>
                                    <h2 className="text-2xl font-[1000] text-black tracking-tighter leading-none italic">₹{amount}</h2>
                                </div>
                                <div className="flex items-center gap-1.5 text-emerald-500">
                                    <ShieldCheck size={12} />
                                    <span className="text-[7px] font-black uppercase tracking-widest">Encrypted</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Payment Methods ── */}
                    <div className="space-y-3">
                        <h4 className="text-[8px] font-black text-black/25 uppercase tracking-[0.2em] pl-1">Select Payment Protocol</h4>

                        <div className="space-y-2">
                            {/* UPI */}
                            <button
                                onClick={() => setSelectedMethod('upi')}
                                className={`w-full flex items-center justify-between p-3.5 rounded-[1.25rem] border transition-all duration-300 ${selectedMethod === 'upi' ? 'bg-white border-brand shadow-lg ring-2 ring-brand/5' : 'bg-white/50 border-black/[0.02] grayscale opacity-60'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedMethod === 'upi' ? 'bg-brand/10 text-brand' : 'bg-gray-100'}`}>
                                        <Smartphone size={18} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-left">
                                        <h5 className="text-[10px] font-[1000] text-black uppercase tracking-tight">UPI Transfer</h5>
                                        <p className="text-[7px] font-black text-black/20 uppercase tracking-widest leading-none mt-0.5">GPay, PhonePe, Paytm</p>
                                    </div>
                                </div>
                                {selectedMethod === 'upi' && <div className="w-4 h-4 bg-brand rounded-full flex items-center justify-center text-white"><Check size={8} strokeWidth={4} /></div>}
                            </button>

                            {/* Card */}
                            <button
                                onClick={() => setSelectedMethod('card')}
                                className={`w-full flex items-center justify-between p-3.5 rounded-[1.25rem] border transition-all duration-300 ${selectedMethod === 'card' ? 'bg-white border-brand shadow-lg ring-2 ring-brand/5' : 'bg-white/50 border-black/[0.02] grayscale opacity-60'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedMethod === 'card' ? 'bg-brand/10 text-brand' : 'bg-gray-100'}`}>
                                        <CreditCard size={18} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-left">
                                        <h5 className="text-[10px] font-[1000] text-black uppercase tracking-tight">Credit / Debit Card</h5>
                                        <p className="text-[7px] font-black text-black/20 uppercase tracking-widest leading-none mt-0.5">Visa, Mastercard, RuPay</p>
                                    </div>
                                </div>
                                {selectedMethod === 'card' && <div className="w-4 h-4 bg-brand rounded-full flex items-center justify-center text-white"><Check size={8} strokeWidth={4} /></div>}
                            </button>

                            {/* Wallet */}
                            <button
                                onClick={() => setSelectedMethod('wallet')}
                                className={`w-full flex items-center justify-between p-3.5 rounded-[1.25rem] border transition-all duration-300 ${selectedMethod === 'wallet' ? 'bg-white border-brand shadow-lg ring-2 ring-brand/5' : 'bg-white/50 border-black/[0.02] grayscale opacity-60'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedMethod === 'wallet' ? 'bg-brand/10 text-brand' : 'bg-gray-100'}`}>
                                        <Wallet size={18} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-left">
                                        <h5 className="text-[10px] font-[1000] text-black uppercase tracking-tight">C2W Wallet</h5>
                                        <p className="text-[7px] font-black text-black/20 uppercase tracking-widest leading-none mt-0.5">Quick 1-tap checkout</p>
                                    </div>
                                </div>
                                {selectedMethod === 'wallet' && <div className="w-4 h-4 bg-brand rounded-full flex items-center justify-center text-white"><Check size={8} strokeWidth={4} /></div>}
                            </button>
                        </div>
                    </div>

                    {/* ── Security Trust ── */}
                    <div className="bg-black text-white/40 rounded-[1.5rem] p-4 flex flex-col items-center text-center gap-3">
                        <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-brand">
                            <Lock size={18} />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-[10px] uppercase tracking-tight leading-none mb-1">Military Grade Encryption</h4>
                            <p className="text-[7px] font-bold uppercase tracking-widest opacity-50 px-4">Protected by 256-bit SSL encryption. We do not store your full CVV or OTP details.</p>
                        </div>
                    </div>
                </div>

                {/* ── Checkout Button ── */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-black/[0.04] p-5 pb-8 z-[100]">
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full bg-black text-white h-14 rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] shadow-2xl flex items-center justify-center relative group overflow-hidden disabled:opacity-80"
                    >
                        {isProcessing ? (
                            <div className="flex items-center gap-3 text-brand">
                                <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Verifying</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 group">
                                <span>Pay ₹{amount} Securely</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </motion.button>
                </div>

                {/* ── Success Overlay ── */}
                <AnimatePresence>
                    {paymentSuccess && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 z-[200] bg-brand flex flex-col items-center justify-center p-10 text-black overflow-hidden"
                        >
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 20 }}
                                className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl"
                            >
                                <Check size={60} strokeWidth={4} className="text-brand" />
                            </motion.div>
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl font-[1000] tracking-tighter uppercase italic leading-[0.85] text-center"
                            >
                                PAYMENT<br />SUCCESS
                            </motion.h2>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-[10px] font-black uppercase tracking-[0.2em] mt-6 opacity-60"
                            >
                                Booking Authentication Complete
                            </motion.p>

                            {/* Decorative Elements */}
                            <div className="absolute top-[-10%] left-[-10%] w-60 h-60 bg-white/20 rounded-full blur-[80px]" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-60 h-60 bg-black/5 rounded-full blur-[80px]" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

export default PaymentCheckout;
