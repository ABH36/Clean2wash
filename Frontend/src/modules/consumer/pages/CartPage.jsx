import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    ChevronLeft, ShoppingBag, Trash2, Plus, Minus, ArrowRight,
    Tag, ShieldCheck, Truck, RotateCcw, Check, ArrowLeft,
    Clock, Zap, CreditCard, Gift, Shield, Crown, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';

const CartPage = () => {
    const navigate = useNavigate();
    const { cartItems, updateQty, removeFromCart, clearCart, cartTotal, discountedTotal } = useCart();
    const { isBlackPassMember } = useAuth();
    const {
        getUser,
        addBooking,
        addProductOrder,
        verifyProductOrderPayment,
        getRazorpayKey,
        createPaymentOrder
    } = useAuth();
    const user = getUser('consumer');
    const [coupon, setCoupon] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [deliverySpeed, setDeliverySpeed] = useState('standard');

    const discount = couponApplied ? Math.round(cartTotal * 0.1) : 0;
    const standardDeliveryFee = cartTotal > 999 ? 0 : 49;
    const expressFee = deliverySpeed === 'express' ? 49 : 0;
    const finalTotal = discountedTotal - discount + standardDeliveryFee + expressFee;
    const blackSavings = isBlackPassMember ? (cartTotal - discountedTotal) : 0;

    const handleApplyCoupon = () => {
        if (coupon.toUpperCase() === 'CARWASH10') {
            setCouponApplied(true);
        } else {
            toast.error('Invalid coupon code. Try CARWASH10');
        }
    };

    const handlePlaceOrder = async () => {
        if (!user) {
            toast.error('Please login to place an order');
            navigate('/login');
            return;
        }

        setPlacing(true);
        try {
            // 1. Create Product Order in Pending State
            const orderPayload = {
                items: cartItems.map(item => ({
                    product: item._id || item.id,
                    quantity: item.qty,
                    price: item.salePrice
                })),
                pricing: {
                    itemsPrice: cartTotal,
                    deliveryFee: standardDeliveryFee + expressFee,
                    discount: blackSavings + discount,
                    totalPrice: finalTotal
                },
                shippingAddress: user.addresses?.find(a => a.isPrimary) || user.addresses?.[0] || {
                    type: 'Home',
                    addressLine: 'Default Address' // Placeholder if no address
                },
                deliveryType: deliverySpeed === 'express' ? 'express' : 'standard'
            };

            const orderRes = await addProductOrder(orderPayload);
            if (!orderRes.success) throw new Error(orderRes.error);

            const productOrder = orderRes.data;

            // 2. Initialize Razorpay Payment
            const keyRes = await getRazorpayKey();
            if (!keyRes.success) throw new Error('Could not get payment gateway key');

            const razorpayOrderRes = await createPaymentOrder(finalTotal, 'INR', productOrder.orderId);
            if (!razorpayOrderRes.success) throw new Error('Could not create payment order');

            const options = {
                key: keyRes.data.key,
                amount: razorpayOrderRes.data.amount,
                currency: razorpayOrderRes.data.currency,
                name: 'Clean-2-Wash',
                description: `Payment for Product Order #${productOrder.orderId}`,
                order_id: razorpayOrderRes.data.id,
                handler: async (response) => {
                    // 3. Verify Payment
                    const verifyRes = await verifyProductOrderPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        orderId: productOrder._id
                    });

                    if (verifyRes.success) {
                        toast.success('Order placed successfully! 📦');
                        clearCart();
                        navigate(`/order-tracking/${productOrder._id}`);
                    } else {
                        toast.error('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone
                },
                theme: { color: '#000000' },
                modal: {
                    ondismiss: () => {
                        setPlacing(false);
                        toast.error('Payment cancelled');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Order placement failed:', error);
            toast.error(error.message || 'Order placement failed');
        } finally {
            setPlacing(false);
        }
    };

    return (
        <MobileLayout>
            <div className="bg-[#FAFAFA] min-h-screen pb-40">
                {/* ── HEADER ── */}
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-5 py-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
                            <ArrowLeft size={20} className="text-content" />
                        </button>
                        <div>
                            <h1 className="text-base font-[1000] text-content uppercase tracking-tight italic">My Basket</h1>
                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest leading-none mt-0.5">{cartItems.length} Products</p>
                        </div>
                    </div>
                    {cartItems.length > 0 && (
                        <button onClick={clearCart} className="text-[10px] font-[1000] text-red-500 uppercase tracking-widest active:scale-95 transition-transform">
                            Clear
                        </button>
                    )}
                </header>

                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 px-10 text-center">
                        <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center mb-5 border border-gray-100">
                            <ShoppingBag size={24} className="text-gray-300" />
                        </div>
                        <h2 className="text-base font-[1000] text-content uppercase tracking-tight italic">Empty Basket</h2>
                        <p className="text-content-subtle text-[9px] font-bold uppercase tracking-widest mt-2 mb-8">Ready to upgrade your car care?</p>
                        <button onClick={() => navigate('/e-shop')}
                            className="px-8 py-3.5 bg-brand text-white rounded-lg font-black text-[9px] uppercase tracking-[0.2em] shadow-xl shadow-brand/20">
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="px-5 pt-6 space-y-6">
                        {/* ── DELIVERY SPEED ── */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Delivery Speed</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setDeliverySpeed('standard')}
                                    className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-1 ${deliverySpeed === 'standard' ? 'border-brand bg-brand/5' : 'border-white bg-white border-gray-100'}`}
                                >
                                    <Clock size={14} className={deliverySpeed === 'standard' ? 'text-brand' : 'text-content-subtle'} />
                                    <p className="text-[10px] font-black uppercase tracking-tight text-content mt-1">Standard</p>
                                    <p className="text-[8px] font-bold text-content-subtle uppercase">24-48 Hours</p>
                                </button>
                                <button
                                    onClick={() => setDeliverySpeed('express')}
                                    className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-1 relative overflow-hidden ${deliverySpeed === 'express' ? 'border-brand bg-brand/5' : 'border-white bg-white border-gray-100'}`}
                                >
                                    <Zap size={14} className={deliverySpeed === 'express' ? 'text-brand' : 'text-content-subtle'} />
                                    <p className="text-[10px] font-black uppercase tracking-tight text-content mt-1">Express</p>
                                    <p className="text-[8px] font-bold text-content-subtle uppercase">Within 1 Hour</p>
                                    <div className="absolute top-2 right-2 bg-brand/10 px-1 py-0.5 rounded text-[7px] font-black text-brand uppercase tracking-widest">+₹49</div>
                                </button>
                            </div>
                        </div>

                        {/* ── SAVINGS INDICATOR (Subtle) ── */}
                        {cartTotal >= 1000 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-green-100 rounded-lg p-2.5 flex items-center justify-between shadow-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-green-50 rounded flex items-center justify-center">
                                        <Zap size={12} className="text-green-600 fill-green-600" />
                                    </div>
                                    <span className="text-[9px] font-black text-content uppercase tracking-widest">Free Delivery Applied</span>
                                </div>
                                <span className="text-green-600 font-[1000] italic text-[9px]">SAVED ₹49</span>
                            </motion.div>
                        )}

                        {/* ── CART ITEMS ── */}
                        <div className="space-y-3">
                            <AnimatePresence>
                                {cartItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-white rounded-xl border border-gray-100 p-3 flex gap-4 shadow-sm relative group"
                                    >
                                        <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-50">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                            <div>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <span className="text-[8px] font-black text-brand uppercase tracking-widest leading-none">{item.category}</span>
                                                        <h4 className="text-[10px] font-[1000] text-content uppercase tracking-tight leading-tight mt-1 line-clamp-1 pr-4">{item.name}</h4>
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.id)} className="p-1 hover:text-red-500 text-gray-200 transition-colors">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-end justify-between mt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-[1000] text-content italic leading-none">₹{(item.salePrice * item.qty).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                                    <button onClick={() => updateQty(item.id, item.qty - 1)}
                                                        className="w-5 h-5 rounded-md bg-white border border-gray-100 flex items-center justify-center text-content active:scale-90 transition-transform">
                                                        <Minus size={10} strokeWidth={3} />
                                                    </button>
                                                    <span className="w-3 text-center text-[10px] font-[1000] text-content">{item.qty}</span>
                                                    <button onClick={() => updateQty(item.id, item.qty + 1)}
                                                        className="w-5 h-5 rounded-md bg-content text-white flex items-center justify-center active:scale-90 transition-transform">
                                                        <Plus size={10} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* ── PROMOTIONS ── */}
                        <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
                            {couponApplied ? (
                                <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Check size={12} className="text-green-600" strokeWidth={3} />
                                        <div>
                                            <p className="text-[9px] font-black text-content uppercase tracking-tight">Code Applied</p>
                                            <p className="text-[8px] font-bold text-brand uppercase tracking-widest mt-0.5">₹{discount.toLocaleString()} Saved</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setCouponApplied(false); setCoupon(''); }}
                                        className="text-[8px] font-black text-red-500 uppercase tracking-widest">Remove</button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-subtle" />
                                        <input
                                            type="text"
                                            value={coupon}
                                            onChange={e => setCoupon(e.target.value.toUpperCase())}
                                            placeholder="Coupon Code"
                                            className="w-full h-10 bg-gray-50 border border-gray-100 rounded-lg pl-8 pr-3 text-[9px] font-black text-content uppercase tracking-widest outline-none focus:border-brand/40 transition-colors"
                                        />
                                    </div>
                                    <button onClick={handleApplyCoupon}
                                        className="px-4 h-10 bg-content text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-[0.98] transition-all">
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Cross-Sell / Smart Suggestions ── */}
                        {cartItems.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] italic">Procurement Bundle Suggestion</h3>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-brand uppercase">
                                        <Sparkles size={12} fill="currentColor" /> AI-Curated
                                    </div>
                                </div>

                                <div className="bg-content rounded-3xl p-5 relative overflow-hidden group shadow-2xl">
                                    <div className="absolute top-0 right-0 w-32 h-full bg-brand/5 skew-x-[-20deg] pointer-events-none" />
                                    <div className="flex gap-4 relative z-10">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                                            <img src="https://images.unsplash.com/photo-1558227691-41ea78d1f631?w=200&q=80" className="w-full h-full object-cover" alt="Microfiber" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-[12px] font-black text-white italic uppercase tracking-tight leading-none mb-1">Microfiber Elite Pack</h4>
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-3">800GSM Super Absorbent (Set of 3)</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-brand italic">₹499 <span className="text-[8px] text-white/30 line-through ml-1 italic font-bold">₹799</span></span>
                                                <button className="bg-brand text-white px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-brand/20 active:scale-90 transition-transform">
                                                    Add Bundle
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── PRICE SUMMARY ── */}
                        <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm space-y-2.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-content-subtle uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span className={`${isBlackPassMember ? 'line-through opacity-50' : 'text-content font-black'}`}>₹{cartTotal.toLocaleString()}</span>
                            </div>
                            {isBlackPassMember && (
                                <div className="flex justify-between items-center text-[9px] font-black text-brand uppercase tracking-widest">
                                    <span className="flex items-center gap-1">
                                        <Crown size={10} fill="currentColor" /> Black Membership Benefit
                                    </span>
                                    <span>-₹{blackSavings.toLocaleString()}</span>
                                </div>
                            )}
                            {discount > 0 && (
                                <div className="flex justify-between items-center text-[9px] font-bold text-brand uppercase tracking-widest">
                                    <span>Savings</span>
                                    <span className="font-black">-₹{discount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-[9px] font-bold text-content-subtle uppercase tracking-widest">
                                <span>Shipping</span>
                                <span className={`font-black ${standardDeliveryFee === 0 ? 'text-green-600' : 'text-content'}`}>
                                    {standardDeliveryFee === 0 ? 'FREE' : `₹${standardDeliveryFee}`}
                                </span>
                            </div>
                            {expressFee > 0 && (
                                <div className="flex justify-between items-center text-[9px] font-bold text-brand uppercase tracking-widest">
                                    <span>Express Priority (1hr)</span>
                                    <span className="font-black">₹{expressFee}</span>
                                </div>
                            )}
                            <div className="h-px bg-gray-50 w-full" />
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-[11px] font-[1000] text-content uppercase tracking-tight italic">Order Total</span>
                                <span className="text-[16px] font-[1000] text-content italic leading-none tracking-tight">₹{finalTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* ── SECURITY ── */}
                        <div className="flex items-center gap-2 px-1">
                            <Shield className="text-content-subtle opacity-20" size={12} />
                            <p className="text-[7px] font-bold text-content-subtle uppercase tracking-[0.1em] leading-relaxed">
                                SSL Secure Checkout • 256-bit Encryption
                            </p>
                        </div>
                    </div>
                )}

                {/* ── CHECKOUT BAR ── */}
                <AnimatePresence>
                    {cartItems.length > 0 && (
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-xl border-t border-gray-100 px-5 pt-3 pb-24 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.02)]"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-content-subtle uppercase tracking-[0.2em]">Final Amount</span>
                                    <span className="text-[14px] font-[1000] text-content italic leading-none">₹{finalTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex -space-x-1 opacity-30 scale-[0.65] origin-right">
                                    <div className="w-5 h-5 rounded-full bg-blue-50 border border-white flex items-center justify-center"><CreditCard size={8} className="text-blue-500" /></div>
                                    <div className="w-5 h-5 rounded-full bg-orange-50 border border-white flex items-center justify-center"><Shield size={8} className="text-orange-500" /></div>
                                    <div className="w-5 h-5 rounded-full bg-green-50 border border-white flex items-center justify-center"><Check size={8} className="text-green-500" /></div>
                                </div>
                            </div>
                            <button
                                onClick={handlePlaceOrder}
                                disabled={placing}
                                className="w-full h-12 bg-brand text-white rounded-lg font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-brand/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
                            >
                                {placing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>Place Order</span>
                                        <ArrowRight size={14} strokeWidth={3} />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

export default CartPage;
