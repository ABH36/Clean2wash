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
    RotateCcw,
    Zap
} from 'lucide-react';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../../context/ThemeContext';

const AdminProductDashboard = () => {
    const { theme } = useTheme();
    const [stats, setStats] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // overview, missions, inventory, disputes

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsRes, invRes, missionsRes] = await Promise.all([
                adminAPI.getProductStats(),
                adminAPI.getMasterInventory(),
                adminAPI.getLiveMissions()
            ]);
            setStats(statsRes.data);
            setInventory(invRes.data.inventory);
            setMissions(missionsRes.data.missions);
        } catch (error) {
            console.error(error);
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
                    title="Avg Pickup Time"
                    value={`${stats?.overview?.avgPickupTime || 0}h`}
                    icon={<Zap className="w-6 h-6 text-amber-500" />}
                    trend="Express"
                    isUp={true}
                    warning={parseFloat(stats?.overview?.avgPickupTime) > 2}
                />
            </div>


            {/* Main Content Tabs */}
            <div className="bg-background/40 rounded-2xl border border-border overflow-hidden">
                <div className="flex border-b border-border">
                    {['overview', 'missions', 'inventory', 'disputes'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-brand' : 'text-content-subtle hover:text-content'
                                }`}
                        >
                            {tab === 'missions' && missions.length > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <VendorPerformanceTable vendors={stats?.vendorPerformance || []} />
                    )}
                    {activeTab === 'missions' && (
                        <LiveMissionsTable missions={missions} />
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
    <div className={`p-6 rounded-2xl bg-background border ${warning ? 'border-amber-500/20' : 'border-border'} `}>
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-surface rounded-xl">{icon}</div>
            <div className={`flex items-center space-x-1 text-sm font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                <span>{trend}</span>
                {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
        </div>
        <h3 className="text-content-subtle text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-2xl font-bold text-content">{value}</p>
    </div>
);

const VendorPerformanceTable = ({ vendors }) => (
    <div className="admin-table-container">
        <table className="w-full text-left">
            <thead>
                <tr className="text-content-subtle text-sm font-medium border-b border-border">
                    <th className="pb-4">Vendor / Studio</th>
                    <th className="pb-4">Total Sales</th>
                    <th className="pb-4">Gross Revenue</th>
                    <th className="pb-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {vendors.map((vendor, idx) => (
                    <tr key={idx} className="group hover:bg-surface/50 transition-colors">
                        <td className="py-4 font-medium text-content">
                            {vendor.studioName || vendor.vendorName}
                            <span className="block text-xs text-content-subtle font-normal">{vendor.vendorName}</span>
                        </td>
                        <td className="py-4 text-content-subtle">{vendor.totalSales} units</td>
                        <td className="py-4 text-content font-semibold">₹{vendor.revenue?.toLocaleString()}</td>
                        <td className="py-4 text-right">
                            <button className="p-2 text-content-subtle hover:text-brand transition-colors">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-subtle" />
                <input
                    type="text"
                    placeholder="Search master inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand outline-none"
                />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-background border border-border rounded-xl text-content hover:bg-surface">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
            </button>
        </div>
        <div className="admin-table-container">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-content-subtle text-sm font-medium border-b border-border">
                        <th className="pb-4">Product Name</th>
                        <th className="pb-4">Studio</th>
                        <th className="pb-4">Price</th>
                        <th className="pb-4">Stock</th>
                        <th className="pb-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="group">
                            <td className="py-4 font-medium text-content">{item.name}</td>
                            <td className="py-4 text-content-subtle">{item.vendor}</td>
                            <td className="py-4 text-content">₹{item.price}</td>
                            <td className="py-4 font-mono">{item.stock}</td>
                            <td className="py-4">
                                {item.isLowStock ? (
                                    <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold">LOW STOCK</span>
                                ) : (
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold">GOOD</span>
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
    <div className="text-center py-12 bg-surface rounded-2xl border border-border border-dashed">
        <Package className="w-12 h-12 text-content-subtle mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-content">No Active Product Disputes</h3>
        <p className="text-content-subtle max-w-sm mx-auto mt-2">
            Disputes will appear here if a vendor cancellation is contested or a returns window expires without acknowledgment.
        </p>
    </div>
);

const LiveMissionsTable = ({ missions }) => (
    <div className="admin-table-container">
        {missions.length === 0 ? (
            <div className="text-center py-12">
                <Package className="w-12 h-12 text-border mx-auto mb-4" />
                <p className="text-content-subtle font-medium">No live missions currently active.</p>
            </div>
        ) : (
            <table className="w-full text-left">
                <thead>
                    <tr className="text-content-subtle text-sm font-medium border-b border-border">
                        <th className="pb-4 px-4">Order / Product</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Roles (V/C/P)</th>
                        <th className="pb-4">Timeline</th>
                        <th className="pb-4 text-right">Activity</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {missions.map((mission, idx) => (
                        <tr key={idx} className="group hover:bg-surface/50 transition-colors">
                            <td className="py-4 px-4">
                                <span className="text-xs font-bold text-brand uppercase">#{mission.orderNumber}</span>
                                <p className="text-sm font-bold text-content mt-0.5">{mission.productName}</p>
                            </td>
                            <td className="py-4">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                    mission.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                    mission.status === 'pick_up_broadcasted' ? 'bg-blue-500/10 text-blue-500' :
                                    mission.status === 'picked_up' ? 'bg-purple-500/10 text-purple-500' :
                                    'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                    {mission.status.replace(/_/g, ' ')}
                                </span>
                            </td>
                            <td className="py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center text-[10px] font-black" title={`Vendor: ${mission.vendor?.name}`}>V</div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${mission.captain ? 'bg-brand text-white' : 'bg-red-500/10 text-red-500'}`} title={mission.captain ? `Captain: ${mission.captain.name}` : 'Waiting for Captain'}>C</div>
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-emerald-500" title={`Consumer: ${mission.consumer?.name}`}>P</div>
                                </div>
                            </td>
                            <td className="py-4">
                                <p className="text-xs text-content-subtle font-medium">Started {new Date(mission.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="py-4 text-right">
                                <button className="p-2 text-gold-600 hover:bg-gold-50 rounded-lg transition-colors">
                                    <ArrowUpRight size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </div>
);

export default AdminProductDashboard;

