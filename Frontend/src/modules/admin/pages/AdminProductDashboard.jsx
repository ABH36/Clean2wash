import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Package,
    TrendingUp,
    Users,
    AlertTriangle,
    ShoppingBag,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    MoreVertical,
    CheckCircle,
    XCircle,
    RotateCcw
} from 'lucide-react';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../../context/ThemeContext';

const AdminProductDashboard = () => {
    const { theme } = useTheme();
    const [stats, setStats] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // overview, inventory, disputes

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsRes, invRes] = await Promise.all([
                adminAPI.getProductStats(),
                adminAPI.getMasterInventory()
            ]);
            setStats(statsRes.data);
            setInventory(invRes.data.inventory);
        } catch (error) {
            toast.error('Failed to load product analytics');
        } finally {
            setLoading(false);
        }
    };

    const handleResolveDispute = async (orderId, itemId, action) => {
        try {
            await adminAPI.resolveProductDispute({ orderId, itemId, action });
            toast.success('Dispute resolved successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to resolve dispute');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats?.overview?.totalRevenue?.toLocaleString() || 0}`}
                    icon={<DollarSign className="w-6 h-6 text-green-500" />}
                    trend="+12.5%"
                    isUp={true}
                />
                <StatCard
                    title="Total Orders"
                    value={stats?.overview?.totalOrders || 0}
                    icon={<ShoppingBag className="w-6 h-6 text-blue-500" />}
                    trend="+8.2%"
                    isUp={true}
                />
                <StatCard
                    title="Avg Order Value"
                    value={`₹${Math.round(stats?.overview?.avgOrderValue || 0)}`}
                    icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
                    trend="-2.1%"
                    isUp={false}
                />
                <StatCard
                    title="Low Stock Items"
                    value={inventory.filter(i => i.isLowStock).length}
                    icon={<AlertTriangle className="w-6 h-6 text-amber-500" />}
                    trend="Check"
                    isUp={false}
                    warning={inventory.some(i => i.isLowStock)}
                />
            </div>

            {/* Main Content Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-onyx-100 overflow-hidden">
                <div className="flex border-b border-onyx-100">
                    {['overview', 'inventory', 'disputes'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-gold-600' : 'text-onyx-500 hover:text-onyx-700'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500"
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <VendorPerformanceTable vendors={stats?.vendorPerformance || []} />
                    )}
                    {activeTab === 'inventory' && (
                        <InventoryTable
                            inventory={inventory}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                        />
                    )}
                    {activeTab === 'disputes' && (
                        <DisputesPanel onResolve={handleResolveDispute} />
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, trend, isUp, warning }) => (
    <div className={`p-6 rounded-2xl bg-white border ${warning ? 'border-amber-200' : 'border-onyx-100'} shadow-sm`}>
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-onyx-50 rounded-xl">{icon}</div>
            <div className={`flex items-center space-x-1 text-sm font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                <span>{trend}</span>
                {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
        </div>
        <h3 className="text-onyx-500 text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-2xl font-bold text-onyx-900">{value}</p>
    </div>
);

const VendorPerformanceTable = ({ vendors }) => (
    <div className="admin-table-container">
        <table className="w-full text-left">
            <thead>
                <tr className="text-onyx-500 text-sm font-medium border-b border-onyx-50">
                    <th className="pb-4">Vendor / Studio</th>
                    <th className="pb-4">Total Sales</th>
                    <th className="pb-4">Gross Revenue</th>
                    <th className="pb-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-onyx-50">
                {vendors.map((vendor, idx) => (
                    <tr key={idx} className="group hover:bg-onyx-50/50 transition-colors">
                        <td className="py-4 font-medium text-onyx-900">
                            {vendor.studioName || vendor.vendorName}
                            <span className="block text-xs text-onyx-500 font-normal">{vendor.vendorName}</span>
                        </td>
                        <td className="py-4 text-onyx-700">{vendor.totalSales} units</td>
                        <td className="py-4 text-onyx-900 font-semibold">₹{vendor.revenue?.toLocaleString()}</td>
                        <td className="py-4 text-right">
                            <button className="p-2 text-onyx-400 hover:text-gold-600 transition-colors">
                                <ArrowUpRight className="w-5 h-5" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const InventoryTable = ({ inventory, searchTerm, setSearchTerm }) => (
    <div className="space-y-4">
        <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-onyx-400" />
                <input
                    type="text"
                    placeholder="Search master inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-onyx-50 border-none rounded-xl focus:ring-2 focus:ring-gold-500"
                />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-onyx-100 rounded-xl text-onyx-600 hover:bg-onyx-50">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
            </button>
        </div>
        <div className="admin-table-container">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-onyx-500 text-sm font-medium border-b border-onyx-50">
                        <th className="pb-4">Product Name</th>
                        <th className="pb-4">Studio</th>
                        <th className="pb-4">Price</th>
                        <th className="pb-4">Stock</th>
                        <th className="pb-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-onyx-50">
                    {inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="group">
                            <td className="py-4 font-medium text-onyx-900">{item.name}</td>
                            <td className="py-4 text-onyx-600">{item.vendor}</td>
                            <td className="py-4 text-onyx-900">₹{item.price}</td>
                            <td className="py-4 font-mono">{item.stock}</td>
                            <td className="py-4">
                                {item.isLowStock ? (
                                    <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">LOW STOCK</span>
                                ) : (
                                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold">GOOD</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const DisputesPanel = ({ onResolve }) => (
    <div className="text-center py-12 bg-onyx-50 rounded-2xl border-2 border-dashed border-onyx-100">
        <Package className="w-12 h-12 text-onyx-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-onyx-800">No Active Product Disputes</h3>
        <p className="text-onyx-500 max-w-sm mx-auto mt-2">
            Disputes will appear here if a vendor cancellation is contested or a returns window expires without acknowledgment.
        </p>
    </div>
);

export default AdminProductDashboard;
