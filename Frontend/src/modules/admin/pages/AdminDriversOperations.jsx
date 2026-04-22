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

const AdminDriversOperations = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showAdvancedView, setShowAdvancedView] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // overview, schedule, alerts, analytics, verification
    const [showDriverModal, setShowDriverModal] = useState(false);
    const [operationsTab, setOperationsTab] = useState('drivers'); // drivers, verification

    // Fetch real drivers from API
    useEffect(() => {
        loadDrivers();
    }, []);

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const res = await import('../services/driverService').then(m => m.driverService.getAllDrivers());
            if (res.status === 'success') {
                setDrivers(res.data.drivers);
            }
        } catch (error) {
            toast.error('Failed to load drivers: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleOnlineStatus = (driverId) => {
        setDrivers(prev => prev.map(d => 
            (d._id === driverId || d.id === driverId) ? { ...d, isOnline: !d.isOnline } : d
        ));
        toast.success('Driver status updated');
    };

    const toggleBlockStatus = (driverId) => {
        setDrivers(prev => prev.map(d => 
            (d._id === driverId || d.id === driverId) ? { ...d, status: d.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' } : d
        ));
        toast.success('Driver access modified');
    };

     const getFatigueColor = (level) => {
        switch (level) {
            case 'LOW': return 'text-[var(--success-text)] bg-[var(--success-light)] border-[var(--success)]';
            case 'MEDIUM': return 'text-[var(--warning-text)] bg-[var(--warning-light)] border-[var(--warning)]';
            case 'HIGH': return 'text-[var(--error-text)] bg-[var(--error-light)] border-[var(--error)]';
            default: return 'text-[var(--text-muted)] bg-[var(--bg-secondary)] border-[var(--border)]';
        }
    };

    const getVerificationColor = (driverInfo) => {
        const { status } = driverInfo || {};
        switch (status) {
            case 'active':
            case 'ACTIVE':
            case 'verified_pending_kit': return 'text-[var(--success-text)] bg-[var(--success-light)] border-[var(--success)]';
            case 'pending':
            case 'PENDING': return 'text-[var(--warning-text)] bg-[var(--warning-light)] border-[var(--warning)]';
            case 'rejected':
            case 'REJECTED': return 'text-[var(--error-text)] bg-[var(--error-light)] border-[var(--error)]';
            default: return 'text-[var(--text-muted)] bg-[var(--bg-secondary)] border-[var(--border)]';
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

    return (
        <div className="space-y-6 pb-32 max-w-full mx-auto px-4 bg-[var(--bg)] min-h-screen">
            {/* Header Control Panel */}
            <div className="admin-card">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Driver Operations</h1>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                                <p className="text-sm font-medium text-[var(--primary)] uppercase tracking-wide">Live Fleet Management</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                            <div className="flex-1 lg:w-72 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2.5 flex items-center gap-3 group focus-within:border-[var(--primary)] transition-all">
                                <Search size={18} className="text-[var(--text-muted)] group-focus-within:text-[var(--primary)]" />
                                <input
                                    type="text"
                                    placeholder="Search drivers..."
                                    className="bg-transparent outline-none text-sm font-semibold text-[var(--text-primary)] w-full placeholder:text-[var(--text-muted)]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={loadDrivers} 
                                className="btn-secondary w-12 h-12 p-0 flex items-center justify-center rounded-xl"
                            >
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>

                            <button 
                                onClick={() => setShowAdvancedView(!showAdvancedView)}
                                className={`h-12 px-5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${
                                    showAdvancedView 
                                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20' 
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--card-hover)]'
                                }`}
                            >
                                <Settings size={18} />
                                {showAdvancedView ? 'Standard Mode' : 'Advanced View'}
                            </button>
                        </div>
                    </div>

                    {/* Operations Tabs */}
                    <div className="flex border-b border-[var(--border)]">
                        <button
                            onClick={() => setOperationsTab('drivers')}
                            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                                operationsTab === 'drivers'
                                    ? 'border-[var(--primary)] text-[var(--primary)]'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <Users size={16} />
                            Driver Management
                        </button>
                        <button
                            onClick={() => setOperationsTab('verification')}
                            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                                operationsTab === 'verification'
                                    ? 'border-[var(--primary)] text-[var(--primary)]'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <UserCheck size={16} />
                            Verification Queue
                            {drivers.filter(d => ['pending', 'PENDING'].includes(d.status)).length > 0 && (
                                <span className="bg-[var(--warning)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {drivers.filter(d => ['pending', 'PENDING'].includes(d.status)).length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Conditional based on Operations Tab */}
            {operationsTab === 'drivers' ? (
                <div className="space-y-6">
                    {/* Enhanced Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {[
                     { label: 'Total Drivers', value: drivers.length, icon: <Users size={18} />, color: 'text-[var(--primary)]' },
                    { label: 'Online Now', value: drivers.filter(d => d.isOnline).length, icon: <Activity size={18} />, color: 'text-[var(--success)]' },
                    { label: 'Active Status', value: drivers.filter(d => d.status === 'ACTIVE').length, icon: <CheckCircle size={18} />, color: 'text-[var(--primary)]' },
                    { label: 'Avg Utilization', value: `${(drivers.reduce((acc, d) => acc + (d.utilizationRate || 0), 0) / drivers.length || 0).toFixed(1)}%`, icon: <Gauge size={18} />, color: 'text-[var(--primary)]' },
                    { label: 'Fatigue Alerts', value: drivers.filter(d => d.alerts?.includes('FATIGUE_WARNING')).length, icon: <AlertTriangle size={18} />, color: 'text-[var(--warning)]' },
                    { label: 'Blocked', value: drivers.filter(d => d.status === 'BLOCKED').length, icon: <Ban size={18} />, color: 'text-[var(--error)]' }
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="admin-card-compact"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{stat.label}</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Drivers Table */}
            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Driver Info</th>
                                <th>Contact</th>
                                <th className="text-center">Status</th>
                                <th className="text-center">Verification</th>
                                <th className="text-center">Performance</th>
                                {showAdvancedView && (
                                    <>
                                        <th className="text-center">Utilization</th>
                                        <th className="text-center">Fatigue</th>
                                        <th className="text-center">Duty Hours</th>
                                        <th className="text-center">Alerts</th>
                                    </>
                                )}
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-24 text-center">
                                        <div className="w-10 h-10 mx-auto border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                                    </td>
                                </tr>
                            ) : filteredDrivers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-24 text-center">
                                        <Shield className="mx-auto opacity-20 mb-3" size={32} />
                                        <p className="text-sm font-semibold text-[var(--text-muted)]">No drivers found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDrivers.map((driver) => (
                                    <motion.tr 
                                        key={driver._id || driver.id} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-white/[0.02] transition-all duration-300"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-sm border border-[var(--border)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all flex items-center justify-center uppercase">
                                                    {driver.name[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-[var(--text-primary)] capitalize leading-none mb-1 truncate">{driver.name}</p>
                                                    <p className="text-xs font-medium text-[var(--text-muted)] font-mono tracking-wide truncate">{driver.driverId || driver._id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Phone size={12} className="text-[var(--primary)]" />
                                                    <span className="text-sm font-medium text-[var(--text-primary)]">{driver.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={12} className="text-[var(--text-muted)]" />
                                                    <span className="text-sm font-medium text-[var(--text-muted)]">{driver.city}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                 <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                                    driver.isOnline 
                                                        ? 'bg-[var(--success-light)] text-[var(--success-text)] border-[var(--success)]' 
                                                        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${driver.isOnline ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--text-muted)]'}`} />
                                                    {driver.isOnline ? 'Online' : 'Offline'}
                                                </div>
                                                <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                                    driver.status === 'ACTIVE' 
                                                        ? 'bg-[var(--primary-light)] text-[var(--primary)]' 
                                                        : 'bg-[var(--error-light)] text-[var(--error-text)] border border-[var(--error)]'
                                                }`}>
                                                    {driver.status}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border ${getVerificationColor(driver)}`}>
                                                <div className={`w-2 h-2 rounded-full ${
                                                    ['active', 'ACTIVE', 'verified_pending_kit'].includes(driver.status) ? 'bg-emerald-500' :
                                                    ['pending', 'PENDING'].includes(driver.status) ? 'bg-amber-500' :
                                                    'bg-red-500'
                                                }`} />
                                                {driver.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp size={12} className="text-[var(--primary)]" />
                                                    <span className="text-sm font-medium text-[var(--text-primary)]">Score: {driver.reliabilityScore?.score || 0}/5.0</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className="text-[var(--text-muted)]" />
                                                    <span className="text-sm font-medium text-[var(--text-muted)]">{Math.round((driver.dutyHours?.today?.totalMinutes || 0) / 60)}h duty</span>
                                                </div>
                                                <span className="text-xs font-medium text-gray-400">{driver.completedTrips} trips</span>
                                            </div>
                                        </td>
                                        {showAdvancedView && (
                                            <>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Gauge size={12} className="text-[var(--primary)]" />
                                                            <span className="text-sm font-semibold text-gray-900">{driver.utilizationRate}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-[60px]">
                                                            <div 
                                                                className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${driver.utilizationRate}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getFatigueColor(driver.fatigueLevel)}`}>
                                                            {driver.fatigueLevel}
                                                        </span>
                                                        <span className="text-xs text-white/40">
                                                            Break: {driver.lastBreak}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Timer size={12} className="text-amber-600" />
                                                            <span className="text-sm font-semibold text-gray-900">{Math.round((driver.dutyHours?.weekly?.totalMinutes || 0) / 60)}h</span>
                                                        </div>
                                                        <span className="text-xs text-white/40">This week</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        {driver.alerts && driver.alerts.length > 0 ? (
                                                            <>
                                                                <div className="flex items-center gap-1">
                                                                    <AlertTriangle size={12} className="text-red-500" />
                                                                    <span className="text-sm font-semibold text-red-600">{driver.alerts.length}</span>
                                                                </div>
                                                                <span className="text-xs text-red-500">Active alerts</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle size={16} className="text-emerald-500" />
                                                                <span className="text-xs text-emerald-600">All clear</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                         <td className="px-6 py-4 pr-10">
                                             <div className="flex items-center justify-end gap-2">

                                                <button 
                                                    onClick={() => openDriverDetails(driver)}
                                                    className="w-11 h-11 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all flex items-center justify-center shadow-lg shadow-[var(--primary)]/10"
                                                    title="View Profile"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => toggleOnlineStatus(driver._id || driver.id)}
                                                    className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center border shadow-lg ${
                                                        driver.isOnline
                                                            ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--card-hover)]'
                                                            : 'bg-[var(--success-light)] text-[var(--success-text)] border-[var(--success)] hover:bg-[var(--success)] hover:text-white shadow-[var(--success)]/10'
                                                    }`}
                                                    title={driver.isOnline ? "Set Offline" : "Set Online"}
                                                >
                                                    <Power size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => toggleBlockStatus(driver._id || driver.id)}
                                                    className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center border shadow-lg ${
                                                        driver.status === 'BLOCKED'
                                                            ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white shadow-[var(--primary)]/10'
                                                            : 'bg-[var(--error-light)] text-[var(--error-text)] border border-[var(--error)] hover:bg-[var(--error)] hover:text-white shadow-red-500/10'
                                                    }`}
                                                    title={driver.status === 'BLOCKED' ? "Unblock Driver" : "Block Driver"}
                                                >
                                                    {driver.status === 'BLOCKED' ? <CheckCircle size={18} /> : <Ban size={18} />}
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                    </div>
                </div>
            ) : (
                // Verification Queue Tab Content
                <VerificationQueue 
                    drivers={drivers.filter(d => ['pending', 'PENDING', 'kit_payment_pending'].includes(d.status))}
                    onApprove={async (driverId) => {
                        const loadingToast = toast.loading('Approving driver...');
                        try {
                            const { driverService } = await import('../services/driverService');
                            await driverService.approveDriver(driverId);
                            setDrivers(prev => prev.map(d => d.id === driverId || d._id === driverId ? { ...d, status: 'verified_pending_kit' } : d));
                            toast.success('✅ Driver FULLY VERIFIED - Moved to kit payment phase!', { id: loadingToast });
                        } catch(err) {
                            toast.error('Approval failed: ' + err.message, { id: loadingToast });
                        }
                    }}
                    onReject={async (driverId, reason) => {
                        const loadingToast = toast.loading('Rejecting driver...');
                        try {
                            const { driverService } = await import('../services/driverService');
                            await driverService.rejectDriver(driverId, reason);
                            setDrivers(prev => prev.map(d => d.id === driverId || d._id === driverId ? { ...d, status: 'rejected', adminNote: reason } : d));
                            toast.success('❌ Driver REJECTED - Need to re-upload documents', { id: loadingToast });
                        } catch(err) {
                            toast.error('Rejection failed: ' + err.message, { id: loadingToast });
                        }
                    }}
                />
            )}

            {/* Driver Details Modal */}
            <AnimatePresence>
                {showDriverModal && selectedDriver && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setShowDriverModal(false)} 
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            className="bg-[var(--bg-primary)] w-full max-w-4xl rounded-xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto border border-[var(--border)]"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Driver Details</h2>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">{selectedDriver.name} • {selectedDriver.id}</p>
                                </div>
                                <button 
                                    onClick={() => setShowDriverModal(false)} 
                                    className="w-10 h-10 bg-[var(--bg-secondary)] hover:bg-[var(--card-hover)] rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition-all flex items-center justify-center"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6">
                                {/* Tab Navigation */}
                                <div className="flex border-b border-[var(--border)] mb-6">
                                    {[
                                        { id: 'overview', label: 'Overview', icon: <User size={16} /> },
                                        { id: 'schedule', label: 'Schedule', icon: <Calendar size={16} /> },
                                        { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={16} /> },
                                        { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                                                activeTab === tab.id
                                                    ? 'border-[var(--primary)] text-[var(--primary)]'
                                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                            }`}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                {activeTab === 'overview' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Basic Info */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Basic Information</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--text-muted)]">Phone:</span>
                                                    <span className="font-medium text-[var(--text-primary)]">{selectedDriver.phone}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--text-muted)]">City:</span>
                                                    <span className="font-medium text-[var(--text-primary)]">{selectedDriver.city}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--text-muted)]">Status:</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        selectedDriver.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {selectedDriver.status}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--text-muted)]">Online:</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        selectedDriver.isOnline ? 'bg-green-100 text-green-800' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                                                    }`}>
                                                        {selectedDriver.isOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance Metrics */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Performance</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--text-muted)]">Reliability Score:</span>
                                                    <span className="font-medium text-[var(--text-primary)]">{selectedDriver.reliabilityScore?.score || 0}/5.0</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--text-muted)]">Utilization Rate:</span>
                                                    <span className="font-medium text-[var(--text-primary)]">{selectedDriver.utilizationRate}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--text-muted)]">Completed Trips:</span>
                                                    <span className="font-medium text-[var(--text-primary)]">{selectedDriver.completedTrips}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--text-muted)]">Fatigue Level:</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getFatigueColor(selectedDriver.fatigueLevel)}`}>
                                                        {selectedDriver.fatigueLevel}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Duty Hours */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Duty Hours</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--text-muted)]">Today:</span>
                                                    <span className="font-medium text-[var(--text-primary)]">{Math.round((selectedDriver.dutyHours?.today?.totalMinutes || 0) / 60)}h</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--text-muted)]">This Week:</span>
                                                    <span className="font-medium text-[var(--text-primary)]">{Math.round((selectedDriver.dutyHours?.weekly?.totalMinutes || 0) / 60)}h</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--text-muted)]">Last Break:</span>
                                                    <span className="font-medium text-[var(--text-primary)]">{selectedDriver.lastBreak}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Alerts */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Active Alerts</h3>
                                            {selectedDriver.alerts && selectedDriver.alerts.length > 0 ? (
                                                <div className="space-y-2">
                                                    {selectedDriver.alerts.map((alert, index) => (
                                                        <div key={index} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                            <AlertTriangle size={16} className="text-red-500" />
                                                            <span className="text-sm text-red-700">{alert.replace('_', ' ')}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                                    <CheckCircle size={16} className="text-green-500" />
                                                    <span className="text-sm text-green-700">No active alerts</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'schedule' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Weekly Availability Schedule</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {Object.entries(selectedDriver.availabilitySchedule || {}).map(([day, schedule]) => (
                                                <div key={day} className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium text-[var(--text-primary)] capitalize w-20">{day}</span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            schedule.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {schedule.available ? 'Available' : 'Unavailable'}
                                                        </span>
                                                    </div>
                                                    {schedule.available && schedule.start && schedule.end && (
                                                        <span className="text-sm text-[var(--text-muted)]">
                                                            {schedule.start} - {schedule.end}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'alerts' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Alert Management</h3>
                                        {selectedDriver.alerts && selectedDriver.alerts.length > 0 ? (
                                            <div className="space-y-4">
                                                {selectedDriver.alerts.map((alert, index) => (
                                                    <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start gap-3">
                                                                <AlertTriangle size={20} className="text-red-500 mt-0.5" />
                                                                <div>
                                                                    <h4 className="font-medium text-red-800">{alert.replace('_', ' ')}</h4>
                                                                    <p className="text-sm text-red-600 mt-1">
                                                                        {alert === 'FATIGUE_WARNING' && 'Driver has been working for extended hours. Consider mandatory break.'}
                                                                        {alert === 'OVERTIME_ALERT' && 'Driver has exceeded recommended daily duty hours.'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors">
                                                                Acknowledge
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                                <h4 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Active Alerts</h4>
                                                <p className="text-[var(--text-muted)]">This driver has no active alerts or warnings.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'analytics' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Performance Analytics</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                                                <h4 className="font-medium text-[var(--text-primary)] mb-2">Utilization Trend</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-[var(--text-muted)]">Current Rate:</span>
                                                        <span className="font-medium text-[var(--text-primary)]">{selectedDriver.utilizationRate}%</span>
                                                    </div>
                                                    <div className="w-full bg-[var(--border)] rounded-full h-2">
                                                        <div 
                                                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${selectedDriver.utilizationRate}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                                                <h4 className="font-medium text-[var(--text-primary)] mb-2">Weekly Performance</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-[var(--text-muted)]">Duty Hours:</span>
                                                        <span className="font-medium text-[var(--text-primary)]">{Math.round((selectedDriver.dutyHours?.weekly?.totalMinutes || 0) / 60)}h / 60h</span>
                                                    </div>
                                                    <div className="w-full bg-[var(--border)] rounded-full h-2">
                                                        <div 
                                                            className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${Math.min(100, (Math.round((selectedDriver.dutyHours?.weekly?.totalMinutes || 0) / 60) / 60) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Verification Queue Component - UNIFIED SINGLE ACTION SYSTEM
const VerificationQueue = ({ drivers, onApprove, onReject }) => {
    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, driverId: null, reason: '' });

    const executeRejection = () => {
        if (rejectionModal.reason.trim()) {
            onReject(rejectionModal.driverId, rejectionModal.reason);
            setRejectionModal({ isOpen: false, driverId: null, reason: '' });
        }
    };

    const handleApproveAll = (driverId) => {
        // Single action approval - sets all verification flags
        onApprove(driverId);
    };

    const getDocumentStatus = (document) => {
        return document ? 'READY' : 'MISSING';
    };

    const getComplianceStatus = (driver) => {
        // Check police verification status - can be set at root level or in documents
        const policeStatus = driver.policeVerification || 
                           (driver.documents?.policeVerification?.url ? 'VERIFIED' : 'PENDING');
        
        // Kit status - check kit payment status (match backend statuses)
        const pStatus = driver.kit?.paymentStatus?.toLowerCase();
        let kitStatus = 'PENDING';
        if (['completed', 'verified'].includes(pStatus)) kitStatus = 'COMPLETED';
        else if (pStatus === 'under_review') kitStatus = 'UNDER REVIEW';
        
        return { policeStatus, kitStatus };
    };

    return (
        <div className="space-y-6">
            {/* Verification Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Pending Review', value: drivers.length, icon: <Clock size={18} />, color: 'text-amber-600' },
                    { label: 'Documents Ready', value: drivers.filter(d => {
                        const hasAadhaar = d.documents?.aadhaarCard?.url || d.documents?.aadhaarCard?.frontUrl;
                        const hasPAN = d.documents?.panCard?.url;
                        const hasLicense = d.documents?.drivingLicense?.url;
                        const hasSelfie = d.documents?.selfie?.url;
                        return hasAadhaar && hasPAN && hasLicense && hasSelfie;
                    }).length, icon: <CheckCircle size={18} />, color: 'text-emerald-600' },
                    { label: 'Kit Purchased', value: drivers.filter(d => d.kit?.paymentStatus === 'completed').length, icon: <Package size={18} />, color: 'text-[var(--primary)]' },
                    { label: 'Police Verified', value: drivers.filter(d => d.policeVerification === 'VERIFIED' || d.documents?.policeVerification?.url).length, icon: <Shield size={18} />, color: 'text-blue-600' }
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="admin-card-compact"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{stat.label}</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Unified Verification Queue */}
            {drivers.length === 0 ? (
                <div className="admin-card text-center py-16">
                    <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Queue Empty</h3>
                    <p className="text-white/60">All drivers have been processed. Great work!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {drivers.map(driver => {
                        const { policeStatus, kitStatus } = getComplianceStatus(driver);
                        
                        // Check if all required documents are present
                        const hasAadhaar = driver.documents?.aadhaarCard?.url || driver.documents?.aadhaarCard?.frontUrl;
                        const hasPAN = driver.documents?.panCard?.url;
                        const hasLicense = driver.documents?.drivingLicense?.url;
                        const hasSelfie = driver.documents?.selfie?.url;
                        
                        const allDocumentsReady = hasAadhaar && hasPAN && hasLicense && hasSelfie;
                        
                        // Updated approval logic: Only documents required, kit can be purchased later
                        const readyForApproval = allDocumentsReady;
                        
                        // Police verification is a bonus but not required for approval
                        const hasPoliceVerification = policeStatus === 'VERIFIED';

                        return (
                            <motion.div 
                                key={driver._id || driver.id}
                                initial={{ opacity: 0, y: 15 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className={`admin-card border-white/5 transition-all duration-300 ${
                                    readyForApproval 
                                        ? 'border-emerald-200 bg-emerald-50' 
                                        : 'border-amber-200 bg-amber-50'
                                }`}
                            >
                                {/* 3-Column Layout: Info | Documents | Compliance */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    
                                    {/* LEFT: Driver Info */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-[var(--primary-light)] border-white/5 border-[var(--primary)] flex items-center justify-center text-[var(--primary)] font-bold text-xl uppercase flex-shrink-0">
                                                {driver.name[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-gray-900 capitalize truncate">{driver.name}</h3>
                                                <p className="text-sm text-white/60 font-mono">{driver.phone}</p>
                                                <p className="text-xs text-white/40 font-mono uppercase tracking-wide">ID: {driver.id}</p>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                            <h4 className="text-sm font-semibold text-white/80 mb-2">Current Status</h4>
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border ${
                                                readyForApproval 
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}>
                                                <div className={`w-2 h-2 rounded-full ${
                                                    readyForApproval ? 'bg-emerald-500' : 'bg-amber-500'
                                                }`} />
                                                {readyForApproval ? 'READY FOR APPROVAL' : 'PENDING REQUIREMENTS'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CENTER: Documents */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-white/80 border-b border-white/10 pb-2">Document Verification</h4>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Aadhaar Front */}
                                            <a href={driver.documents?.aadhaarCard?.frontUrl || driver.documents?.aadhaarCard?.url || '#'} target="_blank" rel="noreferrer" className="block text-center p-3 bg-white/5 rounded-lg border border-white/10 hover:border-yellow-500 hover:shadow-2xl shadow-black/40 transition-all cursor-pointer">
                                                <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <User size={16} className="text-blue-600" />
                                                </div>
                                                <p className="text-xs font-semibold text-white/60 mb-1">Aadhaar Front</p>
                                                <p className={`text-xs font-bold ${
                                                    getDocumentStatus(driver.documents?.aadhaarCard?.frontUrl || driver.documents?.aadhaarCard?.url) === 'READY' 
                                                        ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                    {getDocumentStatus(driver.documents?.aadhaarCard?.frontUrl || driver.documents?.aadhaarCard?.url)}
                                                </p>
                                            </a>

                                            {/* Aadhaar Back */}
                                            <a href={driver.documents?.aadhaarCard?.backUrl || driver.documents?.aadhaarCard?.url || '#'} target="_blank" rel="noreferrer" className="block text-center p-3 bg-white/5 rounded-lg border border-white/10 hover:border-yellow-500 hover:shadow-2xl shadow-black/40 transition-all cursor-pointer">
                                                <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <User size={16} className="text-blue-600" />
                                                </div>
                                                <p className="text-xs font-semibold text-white/60 mb-1">Aadhaar Back</p>
                                                <p className={`text-xs font-bold ${
                                                    getDocumentStatus(driver.documents?.aadhaarCard?.backUrl || driver.documents?.aadhaarCard?.url) === 'READY' 
                                                        ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                    {getDocumentStatus(driver.documents?.aadhaarCard?.backUrl || driver.documents?.aadhaarCard?.url)}
                                                </p>
                                            </a>

                                            {/* Driving License */}
                                            <a href={driver.documents?.drivingLicense?.url || '#'} target="_blank" rel="noreferrer" className="block text-center p-3 bg-white/5 rounded-lg border border-white/10 hover:border-yellow-500 hover:shadow-2xl shadow-black/40 transition-all cursor-pointer">
                                                <div className="w-8 h-8 mx-auto mb-2 bg-purple-100 rounded-lg flex items-center justify-center">
                                                    <Car size={16} className="text-purple-600" />
                                                </div>
                                                <p className="text-xs font-semibold text-white/60 mb-1">License</p>
                                                <p className={`text-xs font-bold ${
                                                    getDocumentStatus(driver.documents?.drivingLicense?.url) === 'READY' 
                                                        ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                    {getDocumentStatus(driver.documents?.drivingLicense?.url)}
                                                </p>
                                            </a>

                                            {/* Selfie */}
                                            <a href={driver.documents?.selfie?.url || '#'} target="_blank" rel="noreferrer" className="block text-center p-3 bg-white/5 rounded-lg border border-white/10 hover:border-yellow-500 hover:shadow-2xl shadow-black/40 transition-all cursor-pointer">
                                                <div className="w-8 h-8 mx-auto mb-2 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                    <Camera size={16} className="text-emerald-600" />
                                                </div>
                                                <p className="text-xs font-semibold text-white/60 mb-1">Selfie</p>
                                                <p className={`text-xs font-bold ${
                                                    getDocumentStatus(driver.documents?.selfie?.url) === 'READY' 
                                                        ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                    {getDocumentStatus(driver.documents?.selfie?.url)}
                                                </p>
                                            </a>

                                            {/* PAN Card */}
                                            <a href={driver.documents?.panCard?.url || '#'} target="_blank" rel="noreferrer" className="block text-center p-3 bg-white/5 rounded-lg border border-white/10 hover:border-yellow-500 hover:shadow-2xl shadow-black/40 transition-all cursor-pointer">
                                                <div className="w-8 h-8 mx-auto mb-2 bg-orange-100 rounded-lg flex items-center justify-center">
                                                    <CreditCard size={16} className="text-orange-600" />
                                                </div>
                                                <p className="text-xs font-semibold text-white/60 mb-1">PAN Card</p>
                                                <p className={`text-xs font-bold ${
                                                    getDocumentStatus(driver.documents?.panCard?.url) === 'READY' 
                                                        ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                    {getDocumentStatus(driver.documents?.panCard?.url)}
                                                </p>
                                            </a>
                                        </div>

                                        {/* Police Verification Document (if available) */}
                                        {driver.documents?.policeVerification?.url && (
                                            <div className="mt-3">
                                                <a href={driver.documents.policeVerification.url} target="_blank" rel="noreferrer" className="block text-center p-3 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer">
                                                    <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <Shield size={16} className="text-blue-600" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-blue-700 mb-1">Police Verification</p>
                                                    <p className="text-xs font-bold text-emerald-600">VERIFIED</p>
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT: Compliance */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-white/80 border-b border-white/10 pb-2">Compliance Status</h4>
                                        
                                        <div className="space-y-3">
                                            {/* Police Verification */}
                                            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Shield size={14} className="text-blue-600" />
                                                        <span className="text-sm font-semibold text-white/80">Police Verification</span>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                        policeStatus === 'VERIFIED' 
                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {policeStatus}
                                                    </span>
                                                </div>
                                                {driver.documents?.policeVerification?.url && (
                                                    <a 
                                                        href={driver.documents.policeVerification.url} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="text-xs text-blue-500 hover:text-blue-700 underline"
                                                    >
                                                        View Certificate
                                                    </a>
                                                )}
                                            </div>

                                            {/* Kit Status - OPTIONAL (Not required for approval) */}
                                            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Package size={14} className="text-[var(--primary)]" />
                                                        <span className="text-sm font-semibold text-white/80">Kit Status</span>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                        kitStatus === 'COMPLETED' 
                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                            : kitStatus === 'UNDER REVIEW'
                                                            ? 'bg-blue-100 text-blue-700 animate-pulse'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {kitStatus}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-white/40 mt-1">Optional - Can purchase later</p>
                                            </div>

                                            {/* Background Check */}
                                            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle size={14} className="text-emerald-600" />
                                                        <span className="text-sm font-semibold text-white/80">Background Check</span>
                                                    </div>
                                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                        CLEAR
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons - SINGLE ACTION SYSTEM */}
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {readyForApproval ? (
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <CheckCircle size={16} />
                                                    <span className="text-sm font-semibold">Ready for Single Action Approval</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-600">
                                                    <AlertTriangle size={16} />
                                                    <span className="text-sm font-semibold">Pending Requirements</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setRejectionModal({ isOpen: true, driverId: driver._id || driver.id, reason: '' })}
                                                className="btn-danger flex items-center gap-2 text-sm px-4 py-2"
                                            >
                                                <Ban size={14} />
                                                REJECT
                                            </button>
                                            <button 
                                                onClick={() => handleApproveAll(driver._id || driver.id)}
                                                disabled={!readyForApproval}
                                                className={`flex items-center gap-2 text-sm px-6 py-2 rounded-lg font-semibold transition-all ${
                                                    readyForApproval
                                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg'
                                                        : 'bg-gray-300 text-white/40 cursor-not-allowed'
                                                }`}
                                            >
                                                <CheckCircle size={14} />
                                                ✅ APPROVE ALL
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Rejection Modal */}
            <AnimatePresence>
                {rejectionModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setRejectionModal({ isOpen: false, driverId: null, reason: '' })} 
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="admin-card relative z-10 w-full max-w-md"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                    <Ban size={20} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">Reject Driver</h3>
                                    <p className="text-sm text-white/60">This action will reject all verification</p>
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-white/80 mb-2">
                                    Rejection Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea 
                                    value={rejectionModal.reason}
                                    onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Please provide a detailed reason for rejection..."
                                    className="admin-input h-32 resize-none"
                                    required
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setRejectionModal({ isOpen: false, driverId: null, reason: '' })}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button 
                                    disabled={!rejectionModal.reason.trim()}
                                    onClick={executeRejection}
                                    className="btn-danger flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDriversOperations;
