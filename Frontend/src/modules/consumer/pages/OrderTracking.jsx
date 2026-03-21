import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Package, Clock, Truck, CheckCircle2,
    MapPin, Home, HelpCircle, ArrowRight, Star,
    MoreVertical, Info, LayoutTemplate, Phone
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import RatingModal from '../components/RatingModal';
import { productAPI } from '../../../utils/api';

const ORDER_STEPS = [
    { id: 'pending', label: 'Order Placed', desc: 'Securely received your request', Icon: Package, color: 'text-violet-500', bg: 'bg-violet-50' },
    { id: 'processing', label: 'Processing', desc: 'Vendor is preparing your items', Icon: LayoutTemplate, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'shipped', label: 'In Transit', desc: 'Logistics partner on the way', Icon: Truck, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'delivered', label: 'Delivered', desc: 'Package arrived at destination', Icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' }
];

const OrderTracking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { productOrders, loadProductOrders } = useAuth();
    const [loading, setLoading] = useState(false);
    const [reviewModal, setReviewModal] = useState({ isOpen: false, productId: null, productName: '' });

    const order = useMemo(() => productOrders.find(o => o._id === id || o.orderId === id), [productOrders, id]);

    useEffect(() => {
        if (!order) {
            loadProductOrders();
        }
    }, [order, loadProductOrders]);

    const itemsByVendor = useMemo(() => {
        if (!order || !order.items) return {};
        return order.items.reduce((acc, item) => {
            const vendorName = item.vendor?.businessName || item.vendor?.name || 'Authorized Vendor';
            const vendorId = item.vendor?._id || item.vendor?.id || 'default';
            if (!acc[vendorId]) {
                acc[vendorId] = {
                    name: vendorName,
                    items: []
                };
            }
            acc[vendorId].items.push(item);
            return acc;
        }, {});
    }, [order]);

    const handleReviewSubmit = async (reviewData) => {
        return await productAPI.submitProductReview(reviewData);
    };

    if (!order) {
        return (
            <MobileLayout hideNav>
                <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
                    <h2 className="text-xl font-black text-content tracking-tight uppercase italic">Syncing Protocol</h2>
                    <p className="text-content-subtle text-xs font-bold mt-2">Retrieving your order data from the cloud...</p>
                    <button onClick={() => navigate(-1)} className="mt-8 text-brand font-black text-xs uppercase tracking-widest border-b border-brand/20">Back to Shopping</button>
                </div>
            </MobileLayout>
        );
    }

    const currentStepIndex = ORDER_STEPS.findIndex(s => s.id === order.status);
    const activeStep = currentStepIndex !== -1 ? currentStepIndex : 0;

    return (
        <MobileLayout hideNav>
            {/* ── Header ─────────────────────────────── */}
            <header className="px-5 pt-12 pb-5 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
                    <ChevronLeft size={20} strokeWidth={2.5} className="text-content" />
                </button>
                <div className="text-center">
                    <p className="text-[9px] font-black text-content-subtle tracking-[0.2em] uppercase mb-0.5">Order ID: #{order.orderId}</p>
                    <h1 className="text-base font-black tracking-tight text-content italic uppercase">Track Package</h1>
                </div>
                <button className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
                    <HelpCircle size={18} className="text-content" />
                </button>
            </header>

            <div className="p-5 space-y-6 pb-32">
                {/* ── Status Pulse ─────────────────────────────── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Live Updates</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
                            {ORDER_STEPS[activeStep].Icon && (() => {
                                const StatusIcon = ORDER_STEPS[activeStep].Icon;
                                return <StatusIcon size={24} className="text-brand" />;
                            })()}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-content tracking-tight italic uppercase leading-none mb-1">{ORDER_STEPS[activeStep].label}</h2>
                            <p className="text-xs font-bold text-content-subtle opacity-70">{ORDER_STEPS[activeStep].desc}</p>
                        </div>
                    </div>

                    {/* Progress Visualizer */}
                    <div className="relative flex justify-between px-2">
                        {/* Connector Line */}
                        <div className="absolute top-4 left-8 right-8 h-1 bg-gray-100 rounded-full z-0 overflow-hidden">
                            <motion.div
                                initial={{ width: '0%' }}
                                animate={{ width: `${(activeStep / (ORDER_STEPS.length - 1)) * 100}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-brand rounded-full"
                            />
                        </div>

                        {ORDER_STEPS.map((s, i) => {
                            const isDone = i < activeStep;
                            const isActive = i === activeStep;
                            return (
                                <div key={s.id} className="relative z-10 flex flex-col items-center">
                                    <div className={`w-9 h-9 rounded-xl border-4 transition-all duration-500 flex items-center justify-center ${isDone ? 'bg-brand border-white shadow-lg' :
                                        isActive ? 'bg-white border-brand shadow-xl' :
                                            'bg-white border-gray-50'
                                        }`}>
                                        {isDone ? (
                                            <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                                        ) : (
                                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-brand animate-pulse' : 'bg-gray-200'}`} />
                                        )}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest mt-2 ${isActive ? 'text-brand' : 'text-content-subtle opacity-40'}`}>
                                        {s.label.split(' ')[0]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Security Handover Section ─────────────────────────────── */}
                {order.status !== 'delivered' && (
                    <div className="bg-brand/5 rounded-3xl border-2 border-brand/20 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <ShieldCheck size={60} className="text-brand" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center">
                                    <ShieldCheck size={18} />
                                </div>
                                <h3 className="text-sm font-black text-content uppercase tracking-widest italic">Security Handover</h3>
                            </div>
                            <p className="text-[10px] font-bold text-content-subtle mb-4 leading-relaxed pr-8">
                                Share this PIN with the specialist only after you have received and verified your items.
                            </p>
                            <div className="flex gap-2">
                                {order.items?.[0]?.fulfillment?.deliveryPin?.split('').map((digit, i) => (
                                    <div key={i} className="flex-1 h-14 bg-white border-2 border-brand/10 rounded-2xl flex items-center justify-center">
                                        <span className="text-2xl font-black text-brand tabular-nums">{digit}</span>
                                    </div>
                                )) || (
                                        <div className="w-full h-14 bg-white/50 border border-dashed border-gray-300 rounded-2xl flex items-center justify-center">
                                            <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">PIN Generating...</span>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Delivery Agent ─────────────────────────────── */}
                {order.items?.some(it => it.fulfillment?.agentId) && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Assigned Specialist</h3>
                            <div className="flex items-center gap-1 bg-brand/10 px-2 py-0.5 rounded-lg">
                                <span className="text-[8px] font-black text-brand uppercase italic">Verified</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-100 overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${order.items.find(it => it.fulfillment?.agentId)?.fulfillment?.agentId}`} alt="Agent" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-content italic uppercase leading-none mb-1">
                                    {order.items.find(it => it.fulfillment?.agentId)?.fulfillment?.name || 'Logistics Specialist'}
                                </h4>
                                <p className="text-[10px] font-bold text-content-subtle opacity-70">Clean-2-Wash Certified Partner</p>
                            </div>
                            <a href={`tel:${order.items.find(it => it.fulfillment?.agentId)?.fulfillment?.phone}`} className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center active:scale-90 transition-transform">
                                <Phone size={20} />
                            </a>
                        </div>
                    </div>
                )}

                {/* ── Estimated Arrival ─────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/5 rounded-2xl p-4 border border-black/5">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Expected Arrival</p>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-brand" />
                            <span className="text-sm font-black text-content">Today, 8:00 PM</span>
                        </div>
                    </div>
                    <div className="bg-black/5 rounded-2xl p-4 border border-black/5">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Carrier Slot</p>
                        <div className="flex items-center gap-2">
                            <Truck size={16} className="text-brand" />
                            <span className="text-sm font-black text-content">{order.deliveryType === 'express' ? 'Express Hub' : 'Standard'}</span>
                        </div>
                    </div>
                </div>

                {/* ── Package Summary ─────────────────────────────── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black text-content uppercase tracking-[0.2em] italic">Consignment Details</h3>
                        <div className="flex items-center gap-1.5 text-xs font-black text-brand italic">
                            <Package size={14} /> {order.items?.length || 0} Items
                        </div>
                    </div>

                    {Object.entries(itemsByVendor).map(([vendorId, vendorGroup]) => (
                        <div key={vendorId} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-soft">
                            <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-content/5 flex items-center justify-center">
                                        <Home size={12} className="text-content-subtle" />
                                    </div>
                                    <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-none mt-0.5">{vendorGroup.name}</span>
                                </div>
                                <span className="text-[9px] font-black text-brand italic">Verified Vendor</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {vendorGroup.items.map((item, idx) => (
                                    <div key={idx} className="p-4 flex gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-100 overflow-hidden flex-shrink-0">
                                            <img src={item.product?.image || item.product?.images?.[0] || 'https://images.unsplash.com/photo-1558227691-41ea78d1f631?w=200&q=80'} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-black text-content tracking-tight mb-1 truncate">{item.product?.name || 'Premium Product'}</h4>
                                            <p className="text-[10px] font-bold text-content-subtle leading-tight opacity-70">Qty: {item.quantity} • {item.product?.category}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs font-black text-content">₹{item.price?.toLocaleString()}</span>
                                                <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-lg">
                                                    <span className="text-[9px] font-black text-green-600 uppercase">Paid</span>
                                                </div>
                                            </div>
                                            {order.status === 'delivered' && (
                                                <button
                                                    onClick={() => setReviewModal({
                                                        isOpen: true,
                                                        productId: item.product?._id || item.product?.id,
                                                        productName: item.product?.name
                                                    })}
                                                    className="mt-3 flex items-center gap-1.5 text-[9px] font-black text-brand uppercase tracking-widest border border-brand/20 px-3 py-1.5 rounded-xl hover:bg-brand hover:text-white transition-all"
                                                >
                                                    <Star size={10} fill="currentColor" />
                                                    Rate Product
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Shipping Address ─────────────────────────────── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-content">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-0.5">Delivery Destination</p>
                            <h4 className="text-sm font-black text-content italic uppercase">{order.shippingAddress?.type || 'Home'}</h4>
                        </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                        <p className="text-[11px] font-bold text-content-subtle leading-relaxed">
                            {order.shippingAddress?.addressLine || 'Address details not found in protocol.'}
                        </p>
                    </div>
                </div>

                {/* ── Price Breakdown ─────────────────────────────── */}
                <div className="bg-content rounded-3xl p-6 text-white shadow-2xl">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Financial Overview</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white/60 uppercase tracking-widest italic">Item Subtotal</span>
                            <span className="font-black tabular-nums">₹{order.pricing?.itemsPrice?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white/60 uppercase tracking-widest italic">Logistics Fee</span>
                            <span className="font-black tabular-nums">₹{order.pricing?.deliveryFee?.toLocaleString()}</span>
                        </div>
                        {order.pricing?.discount > 0 && (
                            <div className="flex justify-between items-center text-xs text-brand">
                                <span className="font-bold uppercase tracking-widest italic">Applied Discount</span>
                                <span className="font-black tabular-nums">-₹{order.pricing?.discount?.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                            <span className="text-sm font-black uppercase tracking-widest italic">Total Commitment</span>
                            <span className="text-xl font-black tabular-nums">₹{order.pricing?.totalPrice?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* ── Need Help ─────────────────────────────── */}
                <button className="w-full h-14 rounded-2xl bg-white border border-gray-100 shadow-soft flex items-center justify-center gap-3 active:scale-95 transition-transform group">
                    <HelpCircle size={20} className="text-content transition-colors group-hover:text-brand" />
                    <span className="text-xs font-black text-content uppercase tracking-widest italic">Conflict Support & Help</span>
                </button>
            </div>

            {/* ── Sticky Footer CTA ─────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-10 z-[100]">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/shop')}
                    className="w-full h-16 bg-content text-white rounded-[2rem] font-black text-sm uppercase tracking-widest italic shadow-2xl shadow-black/20 flex items-center justify-center gap-3"
                >
                    Continue Procuring <ArrowRight size={18} />
                </motion.button>
            </div>

            <RatingModal
                isOpen={reviewModal.isOpen}
                onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
                onSubmit={handleReviewSubmit}
                productName={reviewModal.productName}
                productId={reviewModal.productId}
                orderId={order._id || order.orderId}
            />

        </MobileLayout>
    );
};

export default OrderTracking;
