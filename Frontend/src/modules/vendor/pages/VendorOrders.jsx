import React, { useState } from 'react';
import {
    Calendar, ChevronRight, Filter, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorLayout from '../components/VendorLayout';
import { useAuth } from '../../../context/AuthContext';

const VendorOrders = () => {
    const navigate = useNavigate();
    const { bookings, getUser } = useAuth();
    const user = getUser('vendor');
    const [activeTab, setActiveTab] = useState('Active');

    const vendorBookings = bookings.filter(b => b.vendorId === user?.id || (b.type === 'vendor' && !b.vendorId && activeTab === 'Market'));

    const mappedOrders = vendorBookings.map(b => ({
        id: b.id,
        customer: b.userName || 'Guest',
        car: b.vehicle || 'Unknown',
        type: b.serviceName,
        status: b.status.toUpperCase(),
        date: new Date(b.timestamp).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        amount: b.price,
        location: b.address || 'Bengaluru'
    }));

    // Local filtering based on tab
    const filteredOrders = mappedOrders.filter(o => {
        if (activeTab === 'Active') return ['ACCEPTED', 'CONFIRMED', 'IN-PROGRESS', 'AT-STUDIO', 'DELIVERY-ASSIGNED'].includes(o.status);
        if (activeTab === 'Completed') return o.status === 'COMPLETED';
        if (activeTab === 'Cancelled') return o.status === 'CANCELLED';
        if (activeTab === 'Market') return o.status === 'PENDING';
        return true;
    });

    const ORDERS = filteredOrders;

    return (
        <VendorLayout
            title="Order Management"
            subtitle="Track & Manage History"
        >
            <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit overflow-x-auto max-w-full">
                    {['Market', 'Active', 'Completed', 'Cancelled'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-brand shadow-sm' : 'text-content-muted hover:text-content'
                                }`}>
                            {t}
                        </button>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[0.15em] text-content-subtle">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Car & Service</th>
                                <th className="px-6 py-4">Scheduled</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {ORDERS.map(order => (
                                <tr
                                    key={order.id}
                                    onClick={() => navigate(`/vendor/order/${order.id}`)}
                                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-black text-brand tracking-wider italic">{order.id}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-content tracking-tight">{order.customer}</span>
                                            <span className="text-[10px] font-bold text-content-subtle lowercase">{order.location}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-content">{order.car}</span>
                                            <span className="text-[10px] font-black text-brand uppercase tracking-tighter italic">{order.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-content-subtle" />
                                            <span className="text-xs font-bold text-content">{order.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-black text-green-600 tracking-tight">{order.amount}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={`w-fit px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${order.status === 'Completed' ? 'bg-green-50 text-green-600' :
                                            order.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                                                order.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            {order.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button className="text-content-muted hover:text-brand transition-colors">
                                            <ChevronRight size={18} strokeWidth={3} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 pb-20">
                    {ORDERS.map(order => (
                        <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 italic">{order.id}</p>
                                    <h3 className="font-black text-base text-content tracking-tight">{order.customer}</h3>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${order.status === 'Completed' ? 'bg-green-50 text-green-600' :
                                    order.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                                        order.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                    {order.status}
                                </div>
                            </div>
                            <div className="space-y-2 py-3 border-y border-gray-50 text-[11px]">
                                <div className="flex justify-between text-content-subtle font-bold">
                                    <span>Car & Service</span>
                                    <span className="text-content font-black">{order.car} · {order.type}</span>
                                </div>
                                <div className="flex justify-between text-content-subtle font-bold">
                                    <span>Scheduled At</span>
                                    <span className="text-content font-black">{order.date}</span>
                                </div>
                                <div className="flex justify-between text-content-subtle font-bold">
                                    <span>Amount</span>
                                    <span className="text-green-600 font-black">{order.amount}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/vendor/order/${order.id}`)}
                                className="w-full h-11 bg-gray-50 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-content-muted hover:bg-gray-100 transition-all"
                            >
                                View Detailed Summary
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorOrders;
