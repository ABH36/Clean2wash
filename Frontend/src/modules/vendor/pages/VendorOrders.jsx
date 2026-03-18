import React, { useState, useEffect } from 'react';
import {
    Calendar, ChevronRight, Filter, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorLayout from '../components/VendorLayout';
import { vendorAPI } from '../../../utils/vendorApi';

const VendorOrders = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Active');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await vendorAPI.getOrders();
                if (res.status === 'success') {
                    setOrders(res.data.orders);
                }
            } catch (err) {
                console.error('Failed to load orders', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const mappedOrders = orders.map(b => ({
        id: b._id || b.id,
        customer: b.consumer?.name || 'Guest',
        car: b.vehicle?.brand ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Unknown',
        type: b.service?.name || 'Service',
        status: (b.status || 'pending').toUpperCase(),
        date: new Date(b.createdAt).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        amount: b.price || b.service?.defaultPrice || '₹0',
        location: b.consumer?.profile?.address?.city || 'Bengaluru'
    }));

    // Local filtering based on tab
    const filteredOrders = mappedOrders.filter(o => {
        if (activeTab === 'Active') return ['ACCEPTED', 'CONFIRMED', 'ASSIGNED', 'PICKUP-ASSIGNED', 'EN_ROUTE', 'AT-STUDIO', 'IN_PROGRESS', 'QUALITY-CHECK', 'DELIVERY-ASSIGNED'].includes(o.status);
        if (activeTab === 'Completed') return o.status === 'COMPLETED';
        if (activeTab === 'Cancelled') return ['CANCELLED', 'REFUNDED'].includes(o.status);
        if (activeTab === 'Market') return o.status === 'PENDING';
        return true;
    });

    return (
        <VendorLayout
            title="Order Management"
            subtitle="Track & Manage History"
        >
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Tabs */}
                <div className="flex gap-2 bg-background p-1 rounded-xl w-fit border border-gray-100/10">
                    {['Market', 'Active', 'Completed', 'Cancelled'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)}
                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-surface text-brand shadow-sm' : 'text-content-subtle hover:text-content'
                                }`}>
                            {t}
                        </button>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-surface rounded-2xl border border-gray-100/10 shadow-sm overflow-hidden transition-colors">
                    <table className="w-full text-left">
                        <thead className="bg-background border-b border-gray-100/10 text-[10px] font-black uppercase tracking-widest text-content-subtle">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Car & Service</th>
                                <th className="px-6 py-4">Scheduled</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/5">
                            {loading && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center">
                                        <div className="w-8 h-8 mx-auto border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
                                        <p className="text-[10px] mt-4 font-black text-content-subtle uppercase italic">Loading Orders...</p>
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center text-[10px] font-black uppercase tracking-widest text-content-subtle italic bg-surface-hover/30">
                                        No Orders in {activeTab} Tab
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredOrders.map(order => (
                                <tr
                                    key={order.id}
                                    onClick={() => navigate(`/vendor/order/${order.id}`)}
                                    className="hover:bg-background/50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-black text-brand tracking-wider">{order.id.substring(0, 8)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-content tracking-tight">{order.customer}</span>
                                            <span className="text-[10px] font-bold text-content-subtle">{order.location}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-content">{order.car}</span>
                                            <span className="text-[10px] font-black text-brand uppercase tracking-tight">{order.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={13} className="text-content-subtle" />
                                            <span className="text-xs font-bold text-content">{order.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-green-500 tracking-tight">{order.amount}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`w-fit px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                                            order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {order.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight size={16} className="inline text-content-subtle group-hover:text-brand transition-colors" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 pb-20">
                    {loading ? (
                        <div className="bg-surface p-10 rounded-2xl border border-gray-100/10 mb-4 flex justify-center">
                            <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {filteredOrders.length === 0 && (
                                <div className="bg-surface p-10 rounded-2xl border border-gray-100/10 flex justify-center text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-content-subtle italic">No Orders in {activeTab} Tab</p>
                                </div>
                            )}
                            {filteredOrders.map(order => (
                                <div key={order.id} className="bg-surface p-5 rounded-2xl border border-gray-100/10 shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">{order.id.substring(0, 8)}</p>
                                            <h3 className="font-black text-base text-content tracking-tight">{order.customer}</h3>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {order.status}
                                        </div>
                                    </div>
                                    <div className="space-y-2 py-3 border-y border-gray-100/5 text-[11px]">
                                        <div className="flex justify-between">
                                            <span className="text-content-subtle font-bold">Service</span>
                                            <span className="text-content font-black">{order.type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-content-subtle font-bold">Scheduled</span>
                                            <span className="text-content font-black">{order.date}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-content-subtle font-bold">Amount</span>
                                            <span className="text-green-500 font-black">{order.amount}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/vendor/order/${order.id}`)}
                                        className="w-full h-11 bg-background rounded-xl font-black text-[10px] uppercase tracking-widest text-content-subtle hover:bg-surface-hover transition-all"
                                    >
                                        View Summary
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorOrders;
