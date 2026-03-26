import React, { useState, useEffect } from 'react';
import {
    Calendar, ChevronRight, Filter, Search, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorLayout from '../components/VendorLayout';
import { vendorAPI } from '../../../utils/vendorApi';
import { socketService } from '../../../utils/socket';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const VendorOrders = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Active');
    const [viewMode, setViewMode] = useState('services'); // 'services' or 'products'
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const { getUser } = useAuth();
    const vendor = getUser('vendor');

    const fetchOrders = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = viewMode === 'services'
                ? await vendorAPI.getOrders()
                : await vendorAPI.getProductOrders();

            if (res.status === 'success') {
                setOrders(res.data.orders);
            }
        } catch (err) {
            console.error('Failed to load orders', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        if (vendor?.id) {
            // Socket system is handled globally by AuthContext
            console.log('[VendorOrders] Monitoring live protocol...');
            socketService.joinUserRoom(vendor.id);

            const handleUpdate = (data) => {
                console.log('[Vendor Orders] 📡 Real-time update:', data.type || 'status_change');
                fetchOrders(true); // Silent refresh

                if (data.type === 'new_studio_booking' || data.type === 'new_product_order') {
                    toast.success(`New ${data.type === 'new_studio_booking' ? 'Work' : 'Order'} Request available!`, {
                        icon: '🔔',
                        duration: 5000
                    });
                }
            };

            socketService.on('new_studio_booking', handleUpdate);
            socketService.on('booking_status_updated', handleUpdate);
            socketService.on('new_product_order', handleUpdate);
            socketService.on('product_order_status_updated', handleUpdate);

            return () => {
                socketService.off('new_studio_booking', handleUpdate);
                socketService.off('booking_status_updated', handleUpdate);
                socketService.off('new_product_order', handleUpdate);
                socketService.off('product_order_status_updated', handleUpdate);
            };
        }
    }, [vendor?.id, viewMode]);

    const mappedOrders = orders.map(b => {
        if (viewMode === 'services') {
            return {
                id: b._id || b.id,
                customer: b.consumer?.name || 'Guest',
                car: b.vehicle?.brand ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Unknown',
                type: b.service?.name || 'Service',
                status: (b.status || 'pending').toUpperCase(),
                date: new Date(b.createdAt).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                amount: b.price || b.service?.defaultPrice || '₹0',
                location: b.consumer?.profile?.address?.city || 'Bengaluru',
                isProduct: false
            };
        } else {
            // Product Logic
            return {
                id: b._id || b.id,
                customer: b.consumer?.name || 'Guest',
                itemsCount: b.myItems?.length || 0,
                type: b.myItems?.map(i => i.name).join(', ') || 'Products',
                status: (b.status || 'pending').toUpperCase(),
                date: new Date(b.createdAt).toLocaleString([], { day: '2-digit', month: 'short' }),
                amount: `₹${b.myItems?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || 0}`,
                location: b.consumer?.profile?.city || 'Bengaluru',
                isProduct: true
            };
        }
    });

    // Local filtering based on tab
    const filteredOrders = mappedOrders.filter(o => {
        if (activeTab === 'Active') {
            const activeStatuses = o.isProduct
                ? ['PENDING', 'PROCESSING', 'SHIPPED', 'PACKING', 'ACCEPTED']
                : ['ACCEPTED', 'CONFIRMED', 'ASSIGNED', 'PICKUP-ASSIGNED', 'EN_ROUTE', 'AT-STUDIO', 'IN_PROGRESS', 'QUALITY-CHECK', 'DELIVERY-ASSIGNED'];
            return activeStatuses.includes(o.status);
        }
        if (activeTab === 'Completed') return o.status === 'DELIVERED' || o.status === 'COMPLETED';
        if (activeTab === 'Cancelled') return ['CANCELLED', 'REFUNDED'].includes(o.status);
        if (activeTab === 'Market') return o.status === 'PENDING' && !o.isProduct;
        return true;
    });

    return (
        <VendorLayout
            title="Order Management"
            subtitle="Track & Manage History"
        >
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Mode Toggle */}
                    <div className="flex bg-background p-1 rounded-xl border border-gray-100/10 h-11 w-full md:w-fit">
                        <button
                            onClick={() => setViewMode('services')}
                            className={`flex-1 md:flex-none px-6 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'services' ? 'bg-surface text-brand shadow-sm' : 'text-content-subtle hover:text-content'}`}
                        >
                            Services
                        </button>
                        <button
                            onClick={() => setViewMode('products')}
                            className={`flex-1 md:flex-none px-6 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'products' ? 'bg-surface text-brand shadow-sm' : 'text-content-subtle hover:text-content'}`}
                        >
                            Products
                        </button>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex gap-2 bg-background p-1 rounded-xl w-fit border border-gray-100/10 h-11">
                        {['Market', 'Active', 'Completed', 'Cancelled'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`px-6 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-surface text-brand shadow-sm' : 'text-content-subtle hover:text-content'
                                    }`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-surface rounded-[2.5rem] border border-gray-100/10 shadow-soft overflow-hidden transition-colors">
                    <div className="admin-table-container">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/5 border-b border-gray-100/10">
                                <tr>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">Registry ID</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">Customer Profile</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">{viewMode === 'services' ? 'Command & Ops' : 'Tactical Units'}</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">{viewMode === 'services' ? 'Scheduled' : 'Registry Date'}</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">Total Sum</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle text-right">Dispatch</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/5">
                                {loading && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin shadow-lg shadow-brand/20" />
                                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em]">Accessing Encrypted Registry...</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredOrders.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-24 text-center text-[10px] font-black uppercase tracking-[0.3em] text-content-subtle bg-surface-hover/10">
                                            No tactical data in {activeTab} sector
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredOrders.map(order => (
                                    <tr
                                        key={order.id}
                                        onClick={() => navigate(viewMode === 'services' ? `/vendor/order/${order.id}` : `/vendor/product-order/${order.id}`)}
                                        className="hover:bg-gray-50/5 transition-all cursor-pointer group active:scale-[0.995]"
                                    >
                                        <td className="px-6 py-5">
                                            <span className="text-[11px] font-black text-brand tracking-[0.15em] uppercase">#{order.id.substring(0, 8)}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-content tracking-tight uppercase leading-none mb-1">{order.customer}</span>
                                                <span className="text-[10px] font-bold text-content-subtle uppercase tracking-tight opacity-60">{order.location}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                {viewMode === 'services' ? (
                                                    <>
                                                        <span className="text-xs font-black text-content tracking-tight uppercase mb-0.5">{order.car}</span>
                                                        <span className="text-[9px] font-black text-brand uppercase tracking-widest leading-none">{order.type}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-xs font-black text-content truncate max-w-[180px] tracking-tight uppercase mb-0.5">{order.type}</span>
                                                        <span className="text-[9px] font-black text-brand uppercase tracking-widest leading-none">{order.itemsCount} Tactical Items</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-content-subtle opacity-40" />
                                                <span className="text-[11px] font-black text-content uppercase tracking-tight">{order.date}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-black text-content tracking-tight">{order.amount}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`w-fit px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-sm ${order.status === 'COMPLETED' || order.status === 'DELIVERED' ? 'bg-green-500/10 text-green-500' :
                                                order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {order.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="w-9 h-9 ml-auto rounded-2xl bg-gray-50/5 flex items-center justify-center text-content-subtle group-hover:bg-brand group-hover:text-white transition-all shadow-sm">
                                                <ArrowRight size={14} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                                    <p className="text-[10px] font-black uppercase tracking-widest text-content-subtle">No Orders in {activeTab} Tab</p>
                                </div>
                            )}
                            {filteredOrders.map(order => (
                                <div key={order.id} className="bg-surface p-5 rounded-2xl border border-gray-100/10 shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">{order.id.substring(0, 8)}</p>
                                            <h3 className="font-black text-base text-content tracking-tight">{order.customer}</h3>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${order.status === 'COMPLETED' || order.status === 'DELIVERED' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {order.status}
                                        </div>
                                    </div>
                                    <div className="space-y-2 py-3 border-y border-gray-100/5 text-[11px]">
                                        <div className="flex justify-between">
                                            <span className="text-content-subtle font-bold">{viewMode === 'services' ? 'Service' : 'Products'}</span>
                                            <span className="text-content font-black truncate max-w-[150px]">{order.type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-content-subtle font-bold">{viewMode === 'services' ? 'Scheduled' : 'Date'}</span>
                                            <span className="text-content font-black">{order.date}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-content-subtle font-bold">Amount</span>
                                            <span className="text-green-500 font-black">{order.amount}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(viewMode === 'services' ? `/vendor/order/${order.id}` : `/vendor/product-order/${order.id}`)}
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
