import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ShoppingBag, Trash2, Plus, Minus, ArrowRight,
    Tag, ShieldCheck, Truck, RotateCcw, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { useCart } from '../../../context/CartContext';

const CartPage = () => {
    const navigate = useNavigate();
    const { cartItems, updateQty, removeFromCart, clearCart, cartTotal } = useCart();
    const [coupon, setCoupon] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [placing, setPlacing] = useState(false);

    const discount = couponApplied ? Math.round(cartTotal * 0.1) : 0;
    const deliveryFee = cartTotal > 999 ? 0 : 49;
    const finalTotal = cartTotal - discount + deliveryFee;

    const handleApplyCoupon = () => {
        if (coupon.toUpperCase() === 'CARWASH10') {
            setCouponApplied(true);
        } else {
            alert('Invalid coupon code. Try CARWASH10');
        }
    };

    const handlePlaceOrder = () => {
        setPlacing(true);
        setTimeout(() => {
            setPlacing(false);
            setOrderPlaced(true);
            clearCart();
        }, 1800);
    };

    if (orderPlaced) {
        return (
            <MobileLayout>
                <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center pb-20">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/30"
                    >
                        <Check size={40} className="text-white" strokeWidth={3} />
                    </motion.div>
                    <h2 className="text-2xl font-black text-content tracking-tight mb-2">Order Placed! 🎉</h2>
                    <p className="text-content-subtle text-[12px] font-bold leading-relaxed max-w-xs mb-8">
                        Your order has been confirmed. Estimated delivery: <span className="text-brand font-black">3-5 Business Days</span>
                    </p>
                    <button onClick={() => navigate('/shop')}
                        className="w-full py-4 bg-brand text-white rounded-2xl font-black shadow-lg shadow-brand/20 mb-3">
                        Continue Shopping
                    </button>
                    <button onClick={() => navigate('/')}
                        className="w-full py-3 bg-gray-100 text-content-muted rounded-2xl font-black text-sm">
                        Go to Home
                    </button>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 pt-10 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
                            <ChevronLeft size={18} className="text-content" />
                        </button>
                        <div>
                            <h1 className="text-base font-black text-content tracking-tight leading-none">My Cart</h1>
                            <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest mt-0.5">
                                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                            </p>
                        </div>
                    </div>
                    {cartItems.length > 0 && (
                        <button onClick={clearCart}
                            className="text-[9px] font-black text-red-400 uppercase tracking-widest border-b border-red-200">
                            Clear All
                        </button>
                    )}
                </div>
            </header>

            {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5">
                        <ShoppingBag size={32} className="text-gray-300" />
                    </div>
                    <h2 className="text-lg font-black text-content mb-2">Your cart is empty</h2>
                    <p className="text-content-subtle text-[12px] font-bold mb-8">Add some products from our store</p>
                    <button onClick={() => navigate('/shop')}
                        className="px-8 py-3.5 bg-brand text-white rounded-2xl font-black shadow-lg shadow-brand/20">
                        Shop Now
                    </button>
                </div>
            ) : (
                <div className="px-4 pb-60 pt-3 space-y-3">

                    {/* Trust Bar */}
                    <div className="flex items-center justify-around bg-gray-50 rounded-2xl py-3 px-2 mb-2 border border-gray-100">
                        {[
                            { icon: Truck, label: 'Free Delivery', sub: 'Above ₹999', color: 'text-blue-500' },
                            { icon: RotateCcw, label: 'Easy Returns', sub: '7-Day Policy', color: 'text-green-500' },
                            { icon: ShieldCheck, label: 'Secure Pay', sub: '100% Safe', color: 'text-brand' },
                        ].map(t => (
                            <div key={t.label} className="flex flex-col items-center gap-1">
                                <t.icon size={16} className={t.color} />
                                <p className="text-[9px] font-black text-content uppercase tracking-widest">{t.label}</p>
                                <p className="text-[8px] font-bold text-content-subtle">{t.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Cart Items */}
                    <AnimatePresence>
                        {cartItems.map(item => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 flex gap-3"
                            >
                                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[8px] font-black text-brand uppercase tracking-widest mb-0.5">{item.category}</p>
                                    <h3 className="text-[12px] font-black text-content leading-tight mb-2 pr-2">{item.name}</h3>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-base font-black text-content tracking-tight">
                                                ₹{(item.salePrice * item.qty).toLocaleString()}
                                            </p>
                                            <p className="text-[9px] text-content-subtle">₹{item.salePrice.toLocaleString()} each</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateQty(item.id, item.qty - 1)}
                                                className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors">
                                                <Minus size={12} />
                                            </button>
                                            <span className="w-6 text-center text-sm font-black text-content">{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, item.qty + 1)}
                                                className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center">
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)}
                                    className="self-start p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Coupon */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Tag size={14} className="text-brand" />
                            <p className="text-[11px] font-black text-content uppercase tracking-widest">Coupon Code</p>
                        </div>
                        {couponApplied ? (
                            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Check size={14} className="text-green-600" strokeWidth={3} />
                                    <div>
                                        <p className="text-[11px] font-black text-green-700">CARWASH10 Applied</p>
                                        <p className="text-[9px] font-bold text-green-600">You saved ₹{discount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setCouponApplied(false); setCoupon(''); }}
                                    className="text-[9px] font-black text-red-400 uppercase">Remove</button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={coupon}
                                    onChange={e => setCoupon(e.target.value.toUpperCase())}
                                    placeholder="Enter code (try CARWASH10)"
                                    className="flex-1 h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-[11px] font-bold text-content outline-none focus:border-brand/40 transition-colors"
                                />
                                <button onClick={handleApplyCoupon}
                                    className="px-5 h-11 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4">
                        <h3 className="text-[11px] font-black text-content uppercase tracking-widest mb-4">Order Summary</h3>
                        <div className="space-y-3 text-[12px]">
                            <div className="flex justify-between">
                                <span className="font-bold text-content-muted">Subtotal ({cartItems.reduce((a, i) => a + i.qty, 0)} items)</span>
                                <span className="font-black text-content">₹{cartTotal.toLocaleString()}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span className="font-bold">Coupon Discount</span>
                                    <span className="font-black">- ₹{discount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="font-bold text-content-muted">Delivery Fee</span>
                                <span className={`font-black ${deliveryFee === 0 ? 'text-green-600' : 'text-content'}`}>
                                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                                </span>
                            </div>
                            <div className="border-t border-gray-100 pt-3 flex justify-between">
                                <span className="font-black text-content text-sm">Total</span>
                                <span className="font-black text-content text-base">₹{finalTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Savings Banner */}
                    {cartTotal >= 1000 && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                            <Truck size={16} className="text-green-600 flex-shrink-0" />
                            <p className="text-[11px] font-black text-green-700">
                                🎉 You've got <span className="underline">Free Delivery</span> on this order!
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Checkout Bar */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 pb-6 pt-3 bg-white border-t border-gray-100 z-50">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePlaceOrder}
                        disabled={placing}
                        className="w-full py-4 bg-brand text-white rounded-2xl font-black text-sm shadow-xl shadow-brand/30 flex items-center justify-between px-5 disabled:opacity-70"
                    >
                        <span className="text-white/70 text-[11px] font-bold">₹{finalTotal.toLocaleString()}</span>
                        <span>{placing ? 'Placing Order...' : 'Place Order'}</span>
                        {!placing && <ArrowRight size={18} strokeWidth={2.5} />}
                    </motion.button>
                </div>
            )}
        </MobileLayout>
    );
};

export default CartPage;
