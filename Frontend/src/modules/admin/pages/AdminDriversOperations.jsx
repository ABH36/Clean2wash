import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, User, Search, RefreshCw, Power, Ban, CheckCircle, Clock,
    Phone, MapPin, Activity, TrendingUp, Shield, AlertTriangle,
    Coffee, Calendar, Target, Percent, Timer, Zap, XCircle,
    Eye, Edit, BarChart3, Award, AlertCircle, ChevronDown,
    ChevronUp, Filter, Download, Plus, Settings, Gauge, 
    UserCheck, Briefcase, X, Camera, Package, Car, CreditCard
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageShell, { SectionCard, FilterBar, SearchBox, StatusTabs, EmptyState, PageLoader } from '../components/PageShell';
import { adminAPI } from '../../../utils/adminApi';

const AdminDriversOperations = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showAdvancedView, setShowAdvancedView] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // overview, schedule, alerts, analytics
    const [showDriverModal, setShowDriverModal] = useState(false);

    // Fetch real drivers from API
    useEffect(() => {
        loadDrivers();
    }, []);

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getSpareDrivers();
            if (res.status === 'success') {
                setDrivers(res.data.drivers || []);
            }
        } catch (error) {
            toast.error('Failed to load drivers: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleOnlineStatus = async (driverId) => {
        try {
            // Optimistic update
            setDrivers(prev => prev.map(d => 
                (d._id === driverId || d.id === driverId) ? { ...d, onlineStatus: { ...d.onlineStatus, isOnline: !d.onlineStatus?.isOnline } } : d
            ));
            
            toast.success('Driver signal updated');
        } catch (error) {
            toast.error('Failed to update status');
            loadDrivers();
        }
    };

    const toggleBlockStatus = async (driverId) => {
        try {
            const driver = drivers.find(d => d._id === driverId || d.id === driverId);
            const newStatus = driver.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
            
            setDrivers(prev => prev.map(d => 
                (d._id === driverId || d.id === driverId) ? { ...d, status: newStatus } : d
            ));
            
            toast.success(`Driver ${newStatus === 'BLOCKED' ? 'Blocked' : 'Unblocked'}`);
        } catch (error) {
            toast.error('Failed to modify access');
            loadDrivers();
        }
    };

     const getFatigueColor = (level) => {
        switch (level) {
            case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'HIGH': return 'text-rose-600 bg-rose-50 border-rose-100';
            default: return 'text-slate-400 bg-slate-50 border-slate-100';
        }
    };

    const getVerificationColor = (driverInfo) => {
        const { status } = driverInfo || {};
        switch (status) {
            case 'active':
            case 'ACTIVE':
            case 'verified_pending_kit': return 'adm-badge-success';
            case 'pending':
            case 'PENDING': return 'adm-badge-warning';
            case 'rejected':
            case 'REJECTED': return 'adm-badge-error';
            default: return 'bg-slate-100 text-slate-400';
        }
    };

    const openDriverDetails = (driver) => {
        setSelectedDriver(driver);
        setShowDriverModal(true);
    };

    const filteredDrivers = drivers.filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone?.includes(searchTerm) ||
        (d.driverId || d._id || d.id)?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { label: 'Total Fleet', value: drivers.length, icon: Users, accent: 'navy' },
        { label: 'Live Signal', value: drivers.filter(d => d.onlineStatus?.isOnline).length, icon: Activity, accent: 'emerald' },
        { label: 'Active Duty', value: drivers.filter(d => d.status === 'ACTIVE').length, icon: CheckCircle, accent: 'blue' },
        { label: 'Fleet Load', value: `${(drivers.reduce((acc, d) => acc + (d.utilizationRate || 0), 0) / drivers.length || 0).toFixed(1)}%`, icon: Gauge, accent: 'purple' },
        { label: 'Fatigue Risk', value: drivers.filter(d => d.alerts?.includes('FATIGUE_WARNING')).length, icon: AlertTriangle, accent: 'amber' },
        { label: 'Terminal Ban', value: drivers.filter(d => d.status === 'BLOCKED').length, icon: Ban, accent: 'rose' }
    ];

    return (
        <PageShell
            title="Fleet Command"
            subtitle="Live Operations & Asset Management"
            icon={Users}
            accent="navy"
            actions={
                <div className="flex items-center gap-2">
                    <button 
                        onClick={loadDrivers}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowAdvancedView(!showAdvancedView)}
                        className={`px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${
                            showAdvancedView 
                                ? 'bg-slate-900 text-amber-500 border-slate-900' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-500 hover:text-amber-500'
                        }`}
                    >
                        <Settings size={14} />
                        {showAdvancedView ? 'Standard' : 'Advanced'}
                    </button>
                </div>
            }
        >
            {/* ── STATS GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {stats.map((stat, idx) => (
                    <SectionCard key={idx} noPad className="group hover:border-amber-500 transition-all cursor-default">
                        <div className="p-5 flex items-center justify-between">
                            <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center`}>
                                <stat.icon size={18} className="text-slate-600" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{stat.value}</p>
                            </div>
                        </div>
                    </SectionCard>
                ))}
            </div>

            {/* ── MAIN WORKSPACE ── */}
            <SectionCard
                title="Active Fleet Deployment"
                actions={
                    <SearchBox 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Locate node..."
                    />
                }
                noPad
            >
                <div className="adm-table-container">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Driver Entity</th>
                                    <th>Secure Line</th>
                                    <th className="text-center">Signal / Status</th>
                                    <th className="text-center">Compliance</th>
                                    <th className="text-center">Efficiency</th>
                                    {showAdvancedView && (
                                        <>
                                            <th className="text-center">Load</th>
                                            <th className="text-center">Fatigue</th>
                                            <th className="text-center">Duty</th>
                                            <th className="text-center">Alerts</th>
                                        </>
                                    )}
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={showAdvancedView ? 10 : 6} className="text-center py-24">
                                            <PageLoader />
                                        </td>
                                    </tr>
                                ) : filteredDrivers.length === 0 ? (
                                    <tr>
                                        <td colSpan={showAdvancedView ? 10 : 6}>
                                            <EmptyState 
                                                icon={Shield}
                                                title="No matching logistical nodes found"
                                                subtitle="Refine your search parameters or check filters"
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDrivers.map((driver) => (
                                        <tr key={driver._id || driver.id} className="group transition-all">
                                            <td>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center font-black text-sm group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                                        {driver.name ? driver.name[0] : '?'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{driver.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 font-mono tracking-wide uppercase truncate">{driver.driverId || driver._id?.substring(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={10} className="text-amber-500" />
                                                        <span className="text-[12px] font-black text-slate-600">{driver.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={10} className="text-slate-400" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{driver.city}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className={`adm-badge ${driver.onlineStatus?.isOnline ? 'adm-badge-success' : 'bg-slate-100 text-slate-400'} px-3 py-1`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${driver.onlineStatus?.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                        {driver.onlineStatus?.isOnline ? 'Online' : 'Offline'}
                                                    </div>
                                                    <div className={`adm-badge ${driver.status === 'ACTIVE' ? 'adm-badge-info' : 'adm-badge-error'} px-2 py-0.5 text-[9px]`}>
                                                        {driver.status}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className={`adm-badge ${getVerificationColor(driver)} px-3 py-1.5 text-[10px]`}>
                                                    {driver.status}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <TrendingUp size={12} className="text-amber-500" />
                                                        <span className="text-[13px] font-black text-slate-800">{driver.reliabilityScore?.score || 0}</span>
                                                    </div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{driver.completedTrips || 0} Missions</p>
                                                </div>
                                            </td>
                                            {showAdvancedView && (
                                                <>
                                                    <td className="text-center">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <span className="text-[12px] font-black text-slate-800">{driver.utilizationRate || 0}%</span>
                                                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="bg-amber-500 h-full" style={{ width: `${driver.utilizationRate || 0}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`adm-badge ${getFatigueColor(driver.fatigueLevel)} px-2 py-1 text-[9px]`}>
                                                            {driver.fatigueLevel || 'LOW'}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[12px] font-black text-slate-800">{Math.round((driver.dutyHours?.today?.totalMinutes || 0) / 60)}h</span>
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Shift</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        {driver.alerts && driver.alerts.length > 0 ? (
                                                            <div className="flex items-center justify-center gap-1.5 text-red-500">
                                                                <AlertTriangle size={14} className="animate-pulse" />
                                                                <span className="text-[12px] font-black">{driver.alerts.length}</span>
                                                            </div>
                                                        ) : (
                                                            <CheckCircle size={16} className="text-emerald-500 mx-auto" />
                                                        )}
                                                    </td>
                                                </>
                                            )}
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => openDriverDetails(driver)} className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                                        <Eye size={18} />
                                                    </button>
                                                    <button onClick={() => toggleOnlineStatus(driver._id || driver.id)} className={`w-10 h-10 border rounded-xl flex items-center justify-center transition-all shadow-sm ${driver.onlineStatus?.isOnline ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}>
                                                        <Power size={18} />
                                                    </button>
                                                    <button onClick={() => toggleBlockStatus(driver._id || driver.id)} className={`w-10 h-10 border rounded-xl flex items-center justify-center transition-all shadow-sm ${driver.status === 'BLOCKED' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-500 hover:text-white'}`}>
                                                        {driver.status === 'BLOCKED' ? <CheckCircle size={18} /> : <Ban size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
            </SectionCard>

            {/* ── DRIVER DETAILS MODAL ── */}
            <AnimatePresence>
                {showDriverModal && selectedDriver && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            onClick={() => setShowDriverModal(false)} 
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col border border-slate-200"
                        >
                            {/* Modal Header */}
                            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-lg">
                                        {selectedDriver.name ? selectedDriver.name[0] : '?'}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{selectedDriver.name}</h2>
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mt-1">ID: {selectedDriver.driverId || selectedDriver._id}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowDriverModal(false)} 
                                    className="w-12 h-12 bg-white border border-slate-200 hover:bg-slate-900 hover:text-white rounded-2xl text-slate-400 transition-all flex items-center justify-center shadow-sm"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Navigation */}
                            <div className="px-10 py-4 bg-white flex border-b border-slate-50 overflow-x-auto no-scrollbar gap-2">
                                {[
                                    { id: 'overview', label: 'Operational Overview', icon: Activity },
                                    { id: 'schedule', label: 'Availability Matrix', icon: Calendar },
                                    { id: 'alerts', label: 'Incident Reports', icon: AlertTriangle },
                                    { id: 'analytics', label: 'Deep Analytics', icon: BarChart3 }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-slate-900 text-amber-500 shadow-lg'
                                                : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        <tab.icon size={16} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-10">
                                {activeTab === 'overview' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {/* Basic Info */}
                                        <div className="space-y-6">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Network Logistics</h3>
                                            <div className="space-y-4">
                                                <DetailItem label="Secure Line" value={selectedDriver.phone} icon={<Phone size={14} />} />
                                                <DetailItem label="Operational Sector" value={selectedDriver.city} icon={<MapPin size={14} />} />
                                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Status</span>
                                                    <span className={`adm-badge ${selectedDriver.status === 'ACTIVE' ? 'adm-badge-success' : 'adm-badge-error'} px-3 py-1.5`}>
                                                        {selectedDriver.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance metrics */}
                                        <div className="space-y-6">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Logistical Efficiency</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <MetricBox label="Reliability" value={`${selectedDriver.reliabilityScore?.score || 0}/100`} sub="Network Score" color="text-amber-500" />
                                                <MetricBox label="Utilization" value={`${selectedDriver.utilizationRate || 0}%`} sub="Fleet Load" color="text-indigo-500" />
                                                <MetricBox label="Completed" value={selectedDriver.completedTrips || 0} sub="Successful Missions" color="text-emerald-500" />
                                                <MetricBox label="Fatigue" value={selectedDriver.fatigueLevel || 'LOW'} sub="Health Index" color="text-red-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'schedule' && (
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6">Availability Protocol Matrix</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {Object.entries(selectedDriver.availabilitySchedule || {}).map(([day, schedule]) => (
                                                <div key={day} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] group hover:border-amber-500 transition-all">
                                                    <div className="flex items-center gap-6">
                                                        <span className="text-[12px] font-black text-slate-800 uppercase tracking-widest w-24">{day}</span>
                                                        <span className={`adm-badge ${schedule.available ? 'adm-badge-success' : 'adm-badge-error'} px-3 py-1.5`}>
                                                            {schedule.available ? 'AVAILABLE' : 'OFFLINE'}
                                                        </span>
                                                    </div>
                                                    {schedule.available && (
                                                        <div className="flex items-center gap-3">
                                                            <Clock size={14} className="text-amber-500" />
                                                            <span className="text-[12px] font-black text-slate-600 font-mono">{schedule.start} ── {schedule.end}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'alerts' && (
                                    <div className="space-y-6">
                                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6">Incident History Log</h3>
                                         {selectedDriver.alerts && selectedDriver.alerts.length > 0 ? (
                                            <div className="space-y-4">
                                                {selectedDriver.alerts.map((alert, idx) => (
                                                    <div key={idx} className="p-6 bg-red-50 border border-red-200 rounded-[2rem] flex items-center justify-between group">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                                                                <AlertTriangle size={24} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[14px] font-black text-red-800 uppercase tracking-tight">{alert.replace(/_/g, ' ')}</h4>
                                                                <p className="text-[10px] font-bold text-red-600/70 uppercase tracking-widest mt-1">Operational Protocol Violation</p>
                                                            </div>
                                                        </div>
                                                        <button className="adm-btn adm-btn-error h-10 px-6 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                                            Acknowledge
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                         ) : (
                                            <EmptyState 
                                                icon={CheckCircle}
                                                title="No Active Incidents"
                                                subtitle="Logistical Integrity Confirmed"
                                            />
                                         )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

const DetailItem = ({ label, value, icon }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
        <div className="flex items-center gap-3">
            <div className="text-amber-500">{icon}</div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-[13px] font-black text-slate-800 tracking-tight">{value}</span>
    </div>
);

const MetricBox = ({ label, value, sub, color }) => (
    <div className="p-5 bg-slate-50 border border-slate-100 rounded-[2rem]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-2xl font-black ${color} tracking-tighter leading-none mb-1`}>{value}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{sub}</p>
    </div>
);

export default AdminDriversOperations;
