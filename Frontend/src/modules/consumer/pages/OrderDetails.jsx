import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft, MapPin, Clock, CheckCircle2, Navigation,
    Star, Phone, MessageSquare, ShieldCheck, Download, RotateCcw,
    ShoppingBag, Package, Truck, CheckCircle, Sparkles, Warehouse
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

import BeforeAfterSlider from '../../../components/BeforeAfterSlider';

const OrderDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { bookings } = useAuth();

    // Find the specific order
    const order = useMemo(() => {
        return bookings.find(b => b.id === id || b._id === id || b.bookingId === id);
    }, [bookings, id]);

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-10 text-center">
                <ShoppingBag size={48} className="text-gray-200 mb-4" />
                <h2 className="text-lg font-black text-content uppercase tracking-tight italic">Order Not Found</h2>
                <p className="text-content-subtle text-[10px] font-bold mt-2 uppercase tracking-widest leading-relaxed">We couldn't find the order with ID: <span className="text-brand">#{id}</span></p>
                <button onClick={() => navigate('/')} className="mt-8 px-8 py-3 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20">Go Home</button>
            </div>
        );
    }

    // Elite Studio Protocol Timeline
    const getTimeline = (status) => {
        const steps = [
            { 
                label: 'Order Placed', 
                done: true, 
                icon: <Package size={16} />,
                subtitle: 'Request received'
            },
            { 
                label: 'Studio Confirmed', 
                done: ['confirmed', 'assigned', 'pickup-assigned', 'en_route', 'at-studio', 'washing', 'quality-check', 'ready-for-delivery', 'completed'].includes(status), 
                icon: <ShieldCheck size={16} />,
                subtitle: 'Slot secured'
            },
            { 
                label: 'Pickup Agent', 
                done: ['pickup-assigned', 'en_route', 'at-studio', 'washing', 'quality-check', 'ready-for-delivery', 'completed'].includes(status), 
                icon: <MapPin size={16} />,
                subtitle: status === 'pickup-assigned' ? 'Agent assigned' : 'Protocol active'
            },
            { 
                label: 'In Transit', 
                done: ['en_route', 'at-studio', 'washing', 'quality-check', 'ready-for-delivery', 'completed'].includes(status), 
                icon: <Truck size={16} />,
                subtitle: status === 'en_route' ? 'Transit to Studio' : 'Handover complete'
            },
            { 
                label: 'At Studio', 
                done: ['at-studio', 'washing', 'quality-check', 'ready-for-delivery', 'completed'].includes(status), 
                icon: <Warehouse size={16} />,
                subtitle: status === 'washing' ? 'Deep clean active' : status === 'at-studio' ? 'Arrived at workshop' : 'Treatment lab'
            },
            { 
                label: 'Quality Check', 
                done: ['quality-check', 'ready-for-delivery', 'completed'].includes(status), 
                icon: <Sparkles size={16} />,
                subtitle: status === 'quality-check' ? 'Pro QC inspection' : 'Ready'
            },
            { 
                label: 'Delivered', 
                done: status === 'completed', 
                icon: <CheckCircle2 size={16} />,
                subtitle: 'Protocol successful'
            }
        ];
        return steps;
    };

    const timeline = getTimeline(order.status);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
                            <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                        </button>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-content leading-none">Order Status</h1>
                            <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">#{order.bookingId || order.id || order._id}</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-content-muted text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                        <Download size={13} strokeWidth={2.5} /> Tracking
                    </button>
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-28">

                {/* ── Status Banner ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <div className="relative z-10">
                        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 ${order.status === 'completed' ? 'bg-green-500 text-white' : 'bg-brand text-white animate-pulse'
                            }`}>
                            {order.status === 'completed' ? <CheckCircle2 size={30} /> : <Package size={30} />}
                        </div>
                        <h2 className="text-lg font-black text-content tracking-tighter uppercase italic leading-none mb-1">
                            {order.status === 'pending' ? 'Waiting for Vendor' :
                                order.status === 'confirmed' ? 'Vendor Confirmed' :
                                    order.status === 'in-progress' || order.status === 'en_route' ? 'Out for Delivery' : 'Delivered Success'}
                        </h2>
                        <p className="text-content-subtle text-[8px] font-black uppercase tracking-[0.2em] opacity-70">
                            {order.status === 'pending' ? 'Your order request has been sent to nearby vendors' :
                                order.status === 'confirmed' ? 'A vendor has accepted your order and preparing' :
                                    order.status === 'in-progress' || order.status === 'en_route' ? 'Our delivery partner is on the way' : 'Your products have been safely delivered'}
                        </p>
                    </div>
                </div>

                {/* ── Security PIN ── */}
                {['pickup-assigned', 'accepted', 'assigned'].includes(order.status) && order.securityPin && (
                    <div className="bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200 p-6 text-center space-y-3 shadow-amber-500/5 shadow-xl">
                        <div className="flex items-center justify-center gap-2 text-amber-600 font-extrabold text-[10px] uppercase tracking-widest italic animate-pulse">
                            <ShieldCheck size={16} /> Security Handover Protocol
                        </div>
                        <div className="flex justify-center gap-2 py-2">
                            {String(order.securityPin).split('').map((digit, i) => (
                                <div key={i} className="w-12 h-16 bg-white border-2 border-amber-100 rounded-xl flex items-center justify-center text-3xl font-black text-amber-600 shadow-sm font-mono">
                                    {digit}
                                </div>
                            ))}
                        </div>
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.15em] leading-relaxed">
                            ⚠️ DO NOT SHARE UNTIL OUR STAFF ARRIVES. <br />
                            VERIFY STAFF BEFORE CAR HANDOVER.
                        </p>
                    </div>
                )}

                {/* ── Timeline ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-widest text-content-subtle">Live Track History</p>
                        <span className="text-[8px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Live</span>
                    </div>
                    <div className="px-5 py-5 space-y-0">
                        {timeline.map((step, i) => {
                            const isActive = step.done && (i === timeline.length - 1 || !timeline[i+1].done);
                            return (
                                <div key={step.label} className="flex items-start gap-4 py-3 relative">
                                    {i < timeline.length - 1 && (
                                        <div className={`absolute left-[17px] top-11 w-px h-6 ${step.done ? 'bg-brand' : 'bg-gray-100'}`} />
                                    )}
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border-2 transition-all duration-500 ${
                                        isActive ? 'bg-brand border-brand text-white shadow-xl shadow-brand/40 scale-110' :
                                        step.done ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-gray-50 border-gray-100 text-gray-300'
                                    }`}>
                                        {isActive ? (
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20" />
                                                {step.icon}
                                            </div>
                                        ) : step.icon}
                                    </div>
                                    <div className="flex-1 flex items-center justify-between pt-1">
                                        <div>
                                            <p className={`font-[1000] text-xs underline-offset-4 tracking-tight transition-colors ${isActive ? 'text-brand underline italic' : step.done ? 'text-content' : 'text-gray-300'}`}>{step.label}</p>
                                            <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isActive ? 'text-brand animate-pulse' : 'text-content-subtle'}`}>{step.done ? step.subtitle : 'Coming up...'}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Service Evidence (Photos) ── */}
                {(order.serviceImages?.before?.length > 0 || order.serviceImages?.after?.length > 0) && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
                        <BeforeAfterSlider 
                            before={order.serviceImages.before} 
                            after={order.serviceImages.after} 
                            title="Work Transformation"
                        />
                    </div>
                )}

                {/* ── Order Content ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-content-subtle">Order Summary</p>
                    </div>
                    <div className="p-4 space-y-3">
                        {order.items?.length > 0 ? order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden">
                                    <img src={item.image || "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=100&q=80"} className="w-8 h-8 object-contain" alt="" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-content uppercase tracking-tight leading-none">{item.name || item.serviceName || order.service?.name}</p>
                                    <p className="text-[8px] font-bold text-content-subtle uppercase tracking-widest mt-1">Qty: {item.qty || 1} · ₹{(item.salePrice || item.price || 0).toLocaleString()}</p>
                                </div>
                                <p className="text-[11px] font-black text-content">₹{((item.salePrice || item.price || 0) * (item.qty || 1)).toLocaleString()}</p>
                            </div>
                        )) : (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden">
                                    <ShoppingBag size={18} className="text-content-subtle" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-content uppercase tracking-tight leading-none">{order.service?.name || order.serviceName || 'Car Service'}</p>
                                    <p className="text-[8px] font-bold text-content-subtle uppercase tracking-widest mt-1">Qty: 1</p>
                                </div>
                                <p className="text-[11px] font-black text-content">₹{(order.pricing?.totalAmount || order.amount || order.price || 0).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Bill Breakdown ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold text-content-subtle uppercase tracking-widest">
                        <span>Total Payable</span>
                        <span className="text-content font-black text-base">₹{(order.pricing?.totalAmount || order.amount || order.price || 0).toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-50 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-green-600" />
                        <p className="text-[8px] font-black text-green-700 uppercase tracking-widest">Paid via Digital Wallet</p>
                    </div>
                </div>

            </div>

            {/* ── Footer ── */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-6 py-4 flex gap-4 z-50">
                <button className="flex-1 h-12 bg-gray-50 border border-gray-100 rounded-xl text-content font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <MessageSquare size={16} /> Support
                </button>
                <button onClick={() => navigate('/')} className="flex-1 h-12 bg-content text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    Back to Feed
                </button>
            </div>
        </div>
    );
};

export default OrderDetails;
