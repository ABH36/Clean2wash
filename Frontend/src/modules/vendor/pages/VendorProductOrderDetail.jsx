import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, User, Clock,
    CheckCircle2, Phone, MessageSquare,
    Package, Truck, ShieldCheck, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';
import { vendorAPI } from '../../../utils/vendorApi';
import { useAuth } from '../../../context/AuthContext';
import { socketService } from '../../../utils/socket';
import { toast } from 'react-hot-toast';

const VendorProductOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getUser } = useAuth();
    const vendor = getUser('vendor');

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState([]);
    const [showStaffPicker, setShowStaffPicker] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [activeItemId, setActiveItemId] = useState(null);
    const [enteredPin, setEnteredPin] = useState('');

    const fetchData = async () => {
        try {
            const [ordersRes, staffRes] = await Promise.all([
                vendorAPI.getProductOrders(),
                vendorAPI.getStaff()
            ]);

            if (ordersRes.status === 'success') {
                const foundOrder = ordersRes.data.orders.find(o => o._id === id);
                setOrder(foundOrder);
            }

            if (staffRes.status === 'success') {
                setStaffList(staffRes.data.staff);
            }
        } catch (err) {
            console.error('Failed to load product order details', err);
            toast.error('Failed to load order data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        socketService.joinBookingRoom(id); // Reusing booking room logic for product orders

        const handleUpdate = (data) => {
            console.log('[Vendor Product Order] 📡 Update:', data);
            fetchData();
            if (data.status === 'delivered') {
                toast.success('Your item has been delivered!');
            }
        };

        socketService.on('product_order_status_updated', handleUpdate);

        return () => {
            socketService.off('product_order_status_updated');
        };
    }, [id]);

    const handleAssignAgent = async (staffId) => {
        try {
            const res = await vendorAPI.assignProductAgent(id, activeItemId, staffId, 'staff');
            if (res.status === 'success') {
                toast.success('Staff assigned and dispatched!');
                setShowStaffPicker(false);
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Assignment failed');
        }
    };

    const handleVerifyPin = async () => {
        try {
            const res = await vendorAPI.verifyProductPin(id, activeItemId, enteredPin);
            if (res.status === 'success') {
                toast.success('Handover Verified! Payment Credited.');
                setShowPinModal(false);
                setEnteredPin('');
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid PIN');
        }
    };

    const openStaffPicker = (itemId) => {
        setActiveItemId(itemId);
        setShowStaffPicker(true);
    };

    const openPinModal = (itemId) => {
        setActiveItemId(itemId);
        setShowPinModal(true);
    };

    const handleCancelProduct = async (itemId) => {
        const reason = window.prompt('Enter reason for cancellation (e.g. Out of Stock):');
        if (reason === null) return;

        try {
            const res = await vendorAPI.cancelProductItem(id, itemId, reason);
            if (res.status === 'success') {
                toast.success('Item cancelled and Refunded!');
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Cancellation failed');
        }
    };

    const handleAcknowledgeReturn = async (itemId) => {
        try {
            const res = await vendorAPI.acknowledgeProductReturn(id, itemId);
            if (res.status === 'success') {
                toast.success('Return Acknowledged. Inventory sync recommended.');
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to acknowledge return');
        }
    };

    return (
        <VendorLayout
            title={`Order ${id.substring(0, 8)}`}
            subtitle="Product Fulfillment Hub"
        >
            <div className="space-y-6 max-w-5xl mx-auto pb-24">
                {loading || !order ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Header Actions */}
                        <div className="flex items-center justify-between">
                            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-content-subtle hover:text-content font-black text-[10px] uppercase tracking-widest transition-all">
                                <ArrowLeft size={16} /> Back to History
                            </button>
                            <div className="flex gap-2">
                                <button className="h-10 px-4 border border-gray-100/10 bg-surface rounded-xl text-content-muted font-black text-[10px] uppercase tracking-widest hover:text-brand transition-all">
                                    Invoice
                                </button>
                                <button className="h-10 px-6 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all">
                                    Flag Issue
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Order Items */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Order Status Summary */}
                                <div className="bg-surface rounded-[2.5rem] p-8 text-content relative overflow-hidden shadow-2xl border border-gray-100/10">
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] italic mb-1">Order Status</p>
                                            <h2 className="text-3xl font-black italic tracking-tighter uppercase">{order.status}</h2>
                                        </div>
                                        <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center text-brand">
                                            <Package size={32} />
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -mr-32 -mt-32" />
                                </div>

                                {/* Product Items belonging to this Vendor */}
                                <div className="bg-surface p-8 rounded-[2.5rem] border border-gray-100/10 shadow-soft">
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic mb-6">Dispatch Manifest</h3>
                                    <div className="space-y-4">
                                        {order.myItems.map(item => (
                                            <div key={item._id} className="p-6 bg-background rounded-[2rem] border border-gray-100/10 space-y-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-4">
                                                        <div className="w-16 h-16 bg-surface rounded-2xl overflow-hidden border border-gray-100/10">
                                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-lg text-content tracking-tight">{item.name}</h4>
                                                            <p className="text-[10px] font-bold text-content-subtle uppercase">Qty: {item.quantity} · ₹{item.price}</p>
                                                            <div className={`mt-2 w-fit px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${item.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                                                                    item.status === 'shipped' ? 'bg-amber-500/10 text-amber-500' :
                                                                        item.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                                                            item.status === 'returning_to_pickup' ? 'bg-purple-500/10 text-purple-500' :
                                                                                item.status === 'returned' ? 'bg-blue-500/10 text-blue-500' :
                                                                                    'bg-blue-500/10 text-blue-500'
                                                                }`}>
                                                                {item.status.replace(/_/g, ' ')}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Fulfillment Action */}
                                                    <div className="flex flex-col items-end gap-2">
                                                        {item.status === 'processing' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleCancelProduct(item._id)}
                                                                    className="h-10 px-4 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => openStaffPicker(item._id)}
                                                                    className="h-10 px-6 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-105 transition-all flex items-center gap-2"
                                                                >
                                                                    <Truck size={14} /> Assign
                                                                </button>
                                                            </div>
                                                        )}
                                                        {item.status === 'returning_to_pickup' && (
                                                            <button
                                                                onClick={() => handleAcknowledgeReturn(item._id)}
                                                                className="h-10 px-6 bg-purple-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 transition-all flex items-center gap-2"
                                                            >
                                                                <Package size={14} /> Acknowledge Return
                                                            </button>
                                                        )}
                                                        {item.status === 'shipped' && (
                                                            <button
                                                                onClick={() => openPinModal(item._id)}
                                                                className="h-10 px-6 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-2"
                                                            >
                                                                <ShieldCheck size={14} /> Verify PIN
                                                            </button>
                                                        )}
                                                        {item.status === 'delivered' && (
                                                            <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase tracking-widest">
                                                                <CheckCircle2 size={16} /> Handed Over
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Agent Details if Shipped */}
                                                {item.fulfillment?.agentId && (
                                                    <div className="pt-4 border-t border-gray-100/5 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-surface border border-gray-100/10 flex items-center justify-center text-content-subtle">
                                                                <User size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-content uppercase tracking-tight">Delivery Agent</p>
                                                                <p className="text-[9px] font-bold text-content-subtle italic">Assigned at {new Date(item.fulfillment.dispatchedAt).toLocaleTimeString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button className="p-2 bg-surface rounded-lg text-brand"><Phone size={12} /></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Sidebar */}
                            <div className="space-y-6">
                                {/* Shipping Destination */}
                                <div className="bg-surface p-6 rounded-[2rem] border border-gray-100/10 shadow-soft space-y-4">
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Shipping Destination</h3>
                                    <div className="h-32 bg-background rounded-2xl border border-gray-100/10 relative overflow-hidden group">
                                        <div className="absolute inset-0 flex items-center justify-center text-content-subtle">
                                            <MapPin size={24} className="group-hover:scale-125 transition-transform" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[12px] font-black text-content">{order.consumer?.name}</p>
                                        <p className="text-[11px] font-bold text-content-subtle leading-snug">{order.shippingAddress?.addressLine}, {order.shippingAddress?.city}</p>
                                        <p className="text-[11px] font-bold text-content-subtle italic">PIN: {order.shippingAddress?.pincode}</p>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button className="flex-1 h-10 bg-background border border-gray-100/10 rounded-xl text-brand font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Phone size={14} /> Call
                                        </button>
                                        <button className="flex-1 h-10 bg-background border border-gray-100/10 rounded-xl text-brand font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                            <MessageSquare size={14} /> Chat
                                        </button>
                                    </div>
                                </div>

                                {/* Order Timeline */}
                                <div className="bg-surface p-6 rounded-[2rem] border border-gray-100/10 shadow-soft space-y-6">
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Logistics Timeline</h3>
                                    <div className="space-y-4 relative">
                                        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100/10" />
                                        {order.history?.map((event, i) => (
                                            <div key={i} className="flex gap-4 relative z-10">
                                                <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center">
                                                    <Clock size={12} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-tight text-content">{event.status}</p>
                                                    <p className="text-[9px] font-bold text-content-subtle italic">{new Date(event.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* PIN Verification Modal */}
            <AnimatePresence>
                {showPinModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-content/80 backdrop-blur-xl flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-surface w-full max-w-sm rounded-[3rem] border border-gray-100/10 p-10 space-y-8 text-center"
                        >
                            <div className="space-y-2">
                                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck size={32} />
                                </div>
                                <h2 className="text-2xl font-black text-content italic tracking-tight">Security Handover</h2>
                                <p className="text-sm font-bold text-content-subtle leading-relaxed italic">Enter the unique 4-digit PIN provided by the consumer to release the item.</p>
                            </div>

                            <input
                                type="text"
                                maxLength="4"
                                value={enteredPin}
                                onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="----"
                                className="w-full h-20 bg-background border-2 border-gray-100/10 rounded-3xl text-center text-4xl font-black tracking-[0.5em] outline-none focus:border-amber-500 transition-all text-content"
                            />

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleVerifyPin}
                                    disabled={enteredPin.length !== 4}
                                    className="w-full h-14 bg-amber-500 disabled:opacity-30 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all active:scale-95"
                                >
                                    Confirm Delivery
                                </button>
                                <button
                                    onClick={() => setShowPinModal(false)}
                                    className="w-full h-14 bg-transparent text-content-subtle rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-content transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Staff Picker Modal */}
            <AnimatePresence>
                {showStaffPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-content/60 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-surface w-full max-w-md rounded-[2.5rem] border border-gray-100/10 p-8 space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black text-content italic tracking-tight">Assign Delivery Staff</h2>
                                <button onClick={() => setShowStaffPicker(false)} className="w-10 h-10 bg-background border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted">✕</button>
                            </div>
                            <div className="space-y-2">
                                {staffList.length > 0 ? (
                                    staffList.map(staff => (
                                        <button
                                            key={staff.id}
                                            onClick={() => handleAssignAgent(staff.id)}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100/10 bg-background hover:border-brand hover:bg-brand/5 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-surface border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted group-hover:bg-brand group-hover:text-white transition-all">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-content tracking-tight">{staff.name}</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-500">Available</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-brand" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-8 text-center bg-background rounded-2xl border border-dashed border-gray-100/10">
                                        <p className="text-sm font-bold text-content-subtle">No staff members found.</p>
                                        <button onClick={() => navigate('/vendor/fleet')} className="text-[10px] font-black text-brand uppercase tracking-widest mt-2 border-b border-brand/20">Add Staff</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </VendorLayout>
    );
};

export default VendorProductOrderDetail;
