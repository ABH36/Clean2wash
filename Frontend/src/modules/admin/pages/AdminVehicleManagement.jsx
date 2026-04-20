import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Car, Search, RefreshCw, CheckCircle, XCircle, Clock, FileText, Shield, AlertCircle,
    Eye, Edit, Tag, MapPin, Calendar, User, Phone, Settings, Filter, Download,
    Wrench, AlertTriangle, Info, X, Upload, Paperclip
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminVehicleManagement = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [showAdvancedView, setShowAdvancedView] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Dummy data for demo
    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = () => {
        setLoading(true);
        setTimeout(() => {
            setVehicles([
                {
                    id: 'VEH001',
                    vehicleNumber: 'KA-01-AB-1234',
                    model: 'Honda City',
                    year: 2020,
                    color: 'White',
                    driverName: 'Rajesh Kumar',
                    driverPhone: '+91 98765 43210',
                    status: 'PENDING',
                    submittedDate: '2024-04-10',
                    notes: 'RC verification pending',
                    classification: 'SEDAN',
                    specialInstructions: 'Handle with care - premium vehicle',
                    documents: {
                        rc: { status: 'PENDING', url: '', expiryDate: '2025-03-15' },
                        insurance: { status: 'VERIFIED', url: '', expiryDate: '2024-12-20' },
                        puc: { status: 'VERIFIED', url: '', expiryDate: '2024-08-10' }
                    },
                    issues: [
                        { id: 1, type: 'DOCUMENT', description: 'RC copy not clear', status: 'OPEN', reportedAt: '2024-04-10' }
                    ],
                    adminNotes: 'Waiting for clearer RC document'
                },
                {
                    id: 'VEH002',
                    vehicleNumber: 'MH-02-CD-5678',
                    model: 'Maruti Swift',
                    year: 2019,
                    color: 'Silver',
                    driverName: 'Amit Sharma',
                    driverPhone: '+91 98765 43211',
                    status: 'APPROVED',
                    submittedDate: '2024-04-08',
                    notes: 'All documents verified',
                    classification: 'HATCHBACK',
                    specialInstructions: 'Standard vehicle - no special requirements',
                    documents: {
                        rc: { status: 'VERIFIED', url: '', expiryDate: '2025-06-20' },
                        insurance: { status: 'VERIFIED', url: '', expiryDate: '2025-01-15' },
                        puc: { status: 'VERIFIED', url: '', expiryDate: '2024-10-05' }
                    },
                    issues: [],
                    adminNotes: 'Approved - all documents in order'
                },
                {
                    id: 'VEH003',
                    vehicleNumber: 'DL-03-EF-9012',
                    model: 'Hyundai Verna',
                    year: 2021,
                    color: 'Blue',
                    driverName: 'Vikram Singh',
                    driverPhone: '+91 98765 43212',
                    status: 'PENDING',
                    submittedDate: '2024-04-12',
                    notes: 'Insurance expiry check needed',
                    classification: 'SEDAN',
                    specialInstructions: 'New vehicle - priority processing',
                    documents: {
                        rc: { status: 'VERIFIED', url: '', expiryDate: '2026-01-10' },
                        insurance: { status: 'EXPIRING_SOON', url: '', expiryDate: '2024-04-25' },
                        puc: { status: 'VERIFIED', url: '', expiryDate: '2024-09-15' }
                    },
                    issues: [
                        { id: 2, type: 'INSURANCE', description: 'Insurance expires soon', status: 'OPEN', reportedAt: '2024-04-12' }
                    ],
                    adminNotes: 'Insurance renewal required before approval'
                },
                {
                    id: 'VEH004',
                    vehicleNumber: 'TN-04-GH-3456',
                    model: 'Toyota Innova',
                    year: 2018,
                    color: 'Black',
                    driverName: 'Suresh Patel',
                    driverPhone: '+91 98765 43213',
                    status: 'REJECTED',
                    submittedDate: '2024-04-05',
                    notes: 'Invalid insurance documents',
                    classification: 'SUV',
                    specialInstructions: 'Large vehicle - check parking requirements',
                    documents: {
                        rc: { status: 'VERIFIED', url: '', expiryDate: '2025-08-30' },
                        insurance: { status: 'REJECTED', url: '', expiryDate: '2024-02-10' },
                        puc: { status: 'EXPIRED', url: '', expiryDate: '2024-01-20' }
                    },
                    issues: [
                        { id: 3, type: 'DOCUMENT', description: 'Insurance document is fake', status: 'RESOLVED', reportedAt: '2024-04-05' },
                        { id: 4, type: 'DOCUMENT', description: 'PUC certificate expired', status: 'OPEN', reportedAt: '2024-04-05' }
                    ],
                    adminNotes: 'Rejected due to fraudulent insurance document'
                },
                {
                    id: 'VEH005',
                    vehicleNumber: 'KA-05-IJ-7890',
                    model: 'Tata Nexon',
                    year: 2022,
                    color: 'Red',
                    driverName: 'Arjun Reddy',
                    driverPhone: '+91 98765 43214',
                    status: 'APPROVED',
                    submittedDate: '2024-04-09',
                    notes: 'Verified and active',
                    classification: 'SUV',
                    specialInstructions: 'Electric vehicle - special charging requirements',
                    documents: {
                        rc: { status: 'VERIFIED', url: '', expiryDate: '2027-02-15' },
                        insurance: { status: 'VERIFIED', url: '', expiryDate: '2025-03-10' },
                        puc: { status: 'VERIFIED', url: '', expiryDate: '2024-11-20' }
                    },
                    issues: [],
                    adminNotes: 'Premium EV - approved for high-value bookings'
                }
            ]);
            setLoading(false);
        }, 800);
    };

    const handleApprove = (vehicleId) => {
        setVehicles(prev => prev.map(v => 
            v.id === vehicleId ? { ...v, status: 'APPROVED', notes: 'Approved by admin' } : v
        ));
        toast.success('Vehicle approved successfully');
    };

    const handleReject = (vehicleId) => {
        setVehicles(prev => prev.map(v => 
            v.id === vehicleId ? { ...v, status: 'REJECTED', notes: 'Rejected by admin' } : v
        ));
        toast.error('Vehicle rejected');
    };

    const getDocumentStatusColor = (status) => {
        switch (status) {
            case 'VERIFIED': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200';
            case 'EXPIRED': return 'text-red-600 bg-red-50 border-red-200';
            case 'EXPIRING_SOON': return 'text-orange-600 bg-orange-50 border-orange-200';
            default: return 'text-white/60 bg-white/[0.02] border-white/10';
        }
    };

    const getClassificationColor = (classification) => {
        switch (classification) {
            case 'SEDAN': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'HATCHBACK': return 'text-green-600 bg-green-50 border-green-200';
            case 'SUV': return 'text-purple-600 bg-purple-50 border-purple-200';
            default: return 'text-white/60 bg-white/[0.02] border-white/10';
        }
    };

    const openVehicleDetails = (vehicle) => {
        setSelectedVehicle(vehicle);
        setShowVehicleModal(true);
    };

    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.driverName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'ALL' || v.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6 pb-32 max-w-full mx-auto px-4 bg-white/[0.02] min-h-screen">
            {/* Header Control Panel */}
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 ">
                <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Vehicle Management</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Fleet Verification Hub</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                        <div className="flex-1 lg:w-64 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2 flex items-center gap-3 group focus-within:border-blue-500 transition-all">
                            <Search size={14} className="text-[var(--text-muted)] group-focus-within:text-blue-600" />
                            <input
                                type="text"
                                placeholder="Search vehicles..."
                                className="bg-transparent outline-none text-sm font-medium text-[var(--text-primary)] w-full placeholder:text-[var(--text-muted)]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="h-11 px-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none cursor-pointer"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>

                        <button 
                            onClick={loadVehicles} 
                            className="w-11 h-11 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 hover:border-blue-400 transition-all group/refresh"
                        >
                            <RefreshCw size={18} className={`${loading ? 'animate-spin' : 'group-hover/refresh:rotate-180 transition-transform duration-500'}`} />
                        </button>

                        <button 
                            onClick={() => setShowAdvancedView(!showAdvancedView)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                                showAdvancedView 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)]'
                            }`}
                        >
                            <Settings size={14} />
                            {showAdvancedView ? 'Basic View' : 'Advanced View'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total Vehicles', value: vehicles.length, icon: <Car size={18} />, color: 'blue-600' },
                    { label: 'Pending Review', value: vehicles.filter(v => v.status === 'PENDING').length, icon: <Clock size={18} />, color: 'amber-500' },
                    { label: 'Approved', value: vehicles.filter(v => v.status === 'APPROVED').length, icon: <CheckCircle size={18} />, color: 'emerald-500' },
                    { label: 'Rejected', value: vehicles.filter(v => v.status === 'REJECTED').length, icon: <XCircle size={18} />, color: 'red-500' },
                    { label: 'Active Issues', value: vehicles.reduce((acc, v) => acc + (v.issues?.filter(i => i.status === 'OPEN').length || 0), 0), icon: <AlertTriangle size={18} />, color: 'orange-500' }
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] "
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{stat.label}</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-${stat.color.replace('-', '-')}/10 flex items-center justify-center text-${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Vehicles Table */}
            <div className="bg-white/5 rounded-xl border border-white/10  overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left table-fixed border-separate border-spacing-0">
                        <thead>
                             <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Vehicle Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Driver</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide text-center">Status</th>
                                {showAdvancedView && (
                                    <>
                                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide text-center">Classification</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide text-center">Documents</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide text-center">Issues</th>
                                    </>
                                )}
                                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Notes</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide text-right pr-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-24 text-center">
                                        <div className="w-10 h-10 mx-auto border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                                    </td>
                                </tr>
                            ) : filteredVehicles.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-24 text-center">
                                        <Shield className="mx-auto opacity-20 mb-3" size={32} />
                                        <p className="text-sm font-semibold text-[var(--text-muted)]">No vehicles found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredVehicles.map((vehicle) => (
                                    <motion.tr 
                                        key={vehicle.id} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-[var(--bg-secondary)] transition-all duration-300"
                                    >
                                         <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold text-sm border border-[var(--border)] group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center">
                                                    <Car size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-[var(--text-primary)] uppercase leading-none mb-1 truncate tracking-wide">{vehicle.vehicleNumber}</p>
                                                    <p className="text-sm font-medium text-[var(--text-muted)] capitalize truncate">{vehicle.model}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">{vehicle.driverName}</p>
                                            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mt-1">
                                                {vehicle.submittedDate}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border ${
                                                vehicle.status === 'APPROVED' 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                    : vehicle.status === 'REJECTED'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {vehicle.status === 'APPROVED' ? <CheckCircle size={12} /> : 
                                                 vehicle.status === 'REJECTED' ? <XCircle size={12} /> : 
                                                 <Clock size={12} />}
                                                {vehicle.status}
                                            </div>
                                        </td>
                                        {showAdvancedView && (
                                            <>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getClassificationColor(vehicle.classification)}`}>
                                                            {vehicle.classification}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                                            <span>{vehicle.year}</span>
                                                            <span>•</span>
                                                            <span>{vehicle.color}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            {Object.entries(vehicle.documents || {}).map(([docType, doc]) => (
                                                                <div 
                                                                    key={docType} 
                                                                    className={`w-3 h-3 rounded-full border-[var(--border)] ${
                                                                        doc.status === 'VERIFIED' ? 'bg-emerald-500 border-emerald-200' :
                                                                        doc.status === 'PENDING' ? 'bg-amber-500 border-amber-200' :
                                                                        doc.status === 'EXPIRED' || doc.status === 'EXPIRING_SOON' ? 'bg-red-500 border-red-200' :
                                                                        'bg-gray-400 border-[var(--border)]'
                                                                    }`} 
                                                                    title={`${docType.toUpperCase()}: ${doc.status}`} 
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="text-center">
                                                            <span className="text-xs font-semibold text-[var(--text-primary)]">
                                                                {Object.values(vehicle.documents || {}).filter(d => d.status === 'VERIFIED').length}/
                                                                {Object.keys(vehicle.documents || {}).length}
                                                            </span>
                                                            <p className="text-xs text-[var(--text-muted)]">verified</p>
                                                        </div>
                                                        {Object.values(vehicle.documents || {}).some(d => d.status === 'EXPIRING_SOON') && (
                                                            <div className="flex items-center gap-1">
                                                                <AlertTriangle size={10} className="text-orange-500" />
                                                                <span className="text-xs text-orange-600 font-semibold">Expiring</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        {vehicle.issues && vehicle.issues.filter(i => i.status === 'OPEN').length > 0 ? (
                                                            <>
                                                                <div className="flex items-center gap-2 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
                                                                    <AlertTriangle size={14} className="text-red-500" />
                                                                    <span className="text-sm font-semibold text-red-600">
                                                                        {vehicle.issues.filter(i => i.status === 'OPEN').length}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-red-500 font-semibold">Open Issues</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                                    <CheckCircle size={14} className="text-emerald-500" />
                                                                    <span className="text-sm font-semibold text-emerald-600">0</span>
                                                                </div>
                                                                <span className="text-xs text-emerald-600 font-semibold">No Issues</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2">
                                                <FileText size={12} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                                                <p className="text-sm font-medium text-[var(--text-secondary)] line-clamp-2">{vehicle.notes}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 pr-10">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => openVehicleDetails(vehicle)}
                                                    className="h-10 px-4 rounded-xl text-xs font-semibold uppercase tracking-wide bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 group/details"
                                                >
                                                    <Eye size={18} className="group-hover/details:scale-110 transition-transform" />
                                                    Details
                                                </button>
                                                {vehicle.status === 'PENDING' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleApprove(vehicle.id)}
                                                            className="h-10 px-4 rounded-xl text-xs font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1.5 group/approve"
                                                        >
                                                            <CheckCircle size={18} className="group-hover/approve:scale-110 transition-transform" />
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleReject(vehicle.id)}
                                                            className="h-10 px-4 rounded-xl text-xs font-semibold uppercase tracking-wide bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all flex items-center gap-1.5 group/reject"
                                                        >
                                                            <XCircle size={18} className="group-hover/reject:scale-110 transition-transform" />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {vehicle.status !== 'PENDING' && (
                                                    <div className="px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)]">
                                                        Processed
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vehicle Details Modal */}
            <AnimatePresence>
                {showVehicleModal && selectedVehicle && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setShowVehicleModal(false)} 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 30 }} 
                            className="bg-[var(--card)] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl relative z-10 border border-[var(--border)] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                                        <Car size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-wide">{selectedVehicle.vehicleNumber}</h2>
                                        <p className="text-sm text-[var(--text-secondary)] font-semibold">{selectedVehicle.model} • {selectedVehicle.year}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowVehicleModal(false)} 
                                    className="w-10 h-10 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] text-[var(--text-muted)] transition-all flex items-center justify-center"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Tabs */}
                            <div className="border-b border-[var(--border)] bg-[var(--card)]">
                                <div className="flex">
                                    {[
                                        { id: 'overview', label: 'Overview', icon: <Info size={16} /> },
                                        { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
                                        { id: 'issues', label: 'Issues', icon: <AlertTriangle size={16} /> },
                                        { id: 'history', label: 'History', icon: <Clock size={16} /> }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
                                                activeTab === tab.id
                                                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                                                    : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                                            }`}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto flex-1">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        {/* Basic Information */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">Vehicle Information</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Registration Number:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)] uppercase">{selectedVehicle.vehicleNumber}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Model:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)]">{selectedVehicle.model}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Year:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)]">{selectedVehicle.year}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Color:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)]">{selectedVehicle.color}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Classification:</span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getClassificationColor(selectedVehicle.classification)}`}>
                                                            {selectedVehicle.classification}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">Owner Information</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Driver Name:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)]">{selectedVehicle.driverName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Phone:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)]">{selectedVehicle.driverPhone}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Submitted:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)]">{selectedVehicle.submittedDate}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Status:</span>
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide border ${
                                                            selectedVehicle.status === 'APPROVED' 
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                                : selectedVehicle.status === 'REJECTED'
                                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}>
                                                            {selectedVehicle.status === 'APPROVED' ? <CheckCircle size={12} /> : 
                                                             selectedVehicle.status === 'REJECTED' ? <XCircle size={12} /> : 
                                                             <Clock size={12} />}
                                                            {selectedVehicle.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Special Instructions */}
                                        {selectedVehicle.specialInstructions && (
                                            <div className="space-y-3">
                                                <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">Special Instructions</h3>
                                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                                    <p className="text-sm text-blue-800 font-medium">{selectedVehicle.specialInstructions}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Admin Notes */}
                                        {selectedVehicle.adminNotes && (
                                            <div className="space-y-3">
                                                <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">Admin Notes</h3>
                                                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                                                    <p className="text-sm text-[var(--text-secondary)] font-medium">{selectedVehicle.adminNotes}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'documents' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 border-b border-white/10 pb-2">Document Status</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {Object.entries(selectedVehicle.documents || {}).map(([docType, doc]) => (
                                                <div key={docType} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-bold text-gray-900 uppercase">{docType.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                        <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getDocumentStatusColor(doc.status)}`}>
                                                            {doc.status}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-white/40 font-semibold">Expiry Date:</span>
                                                            <span className="text-gray-900 font-bold">{doc.expiryDate}</span>
                                                        </div>
                                                        {doc.status === 'EXPIRING_SOON' && (
                                                            <div className="flex items-center gap-2 text-orange-600">
                                                                <AlertTriangle size={12} />
                                                                <span className="text-xs font-semibold">Expires Soon</span>
                                                            </div>
                                                        )}
                                                        {doc.status === 'EXPIRED' && (
                                                            <div className="flex items-center gap-2 text-red-600">
                                                                <XCircle size={12} />
                                                                <span className="text-xs font-semibold">Expired</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button className="w-full px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-all flex items-center justify-center gap-2">
                                                        <Eye size={12} />
                                                        View Document
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'issues' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-gray-900">Issues & Reports</h3>
                                            <button className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all flex items-center gap-2">
                                                <AlertTriangle size={14} />
                                                Report Issue
                                            </button>
                                        </div>
                                        {selectedVehicle.issues && selectedVehicle.issues.length > 0 ? (
                                            <div className="space-y-4">
                                                {selectedVehicle.issues.map((issue) => (
                                                    <div key={issue.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-3 h-3 rounded-full ${
                                                                    issue.status === 'OPEN' ? 'bg-red-500' : 'bg-emerald-500'
                                                                }`} />
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-gray-900">{issue.type} Issue</h4>
                                                                    <p className="text-xs text-white/40 font-semibold">{issue.reportedAt}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                issue.status === 'OPEN' 
                                                                    ? 'bg-red-50 text-red-600 border border-red-200' 
                                                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                            }`}>
                                                                {issue.status}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-white/80 font-medium mb-3">{issue.description}</p>
                                                        {issue.status === 'OPEN' && (
                                                            <button className="px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-all">
                                                                Mark as Resolved
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <CheckCircle className="mx-auto text-emerald-500 mb-3" size={48} />
                                                <p className="text-sm font-semibold text-white/40">No issues reported</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'history' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 border-b border-white/10 pb-2">Action History</h3>
                                        <div className="space-y-4">
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <span className="text-sm font-bold text-gray-900">Vehicle Submitted</span>
                                                    <span className="text-xs text-white/40 font-semibold">{selectedVehicle.submittedDate}</span>
                                                </div>
                                                <p className="text-sm text-white/60 ml-5">Vehicle registration submitted for approval</p>
                                            </div>
                                            {selectedVehicle.status === 'APPROVED' && (
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        <span className="text-sm font-bold text-gray-900">Vehicle Approved</span>
                                                        <span className="text-xs text-white/40 font-semibold">{selectedVehicle.submittedDate}</span>
                                                    </div>
                                                    <p className="text-sm text-white/60 ml-5">All documents verified and vehicle approved for service</p>
                                                </div>
                                            )}
                                            {selectedVehicle.status === 'REJECTED' && (
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                                        <span className="text-sm font-bold text-gray-900">Vehicle Rejected</span>
                                                        <span className="text-xs text-white/40 font-semibold">{selectedVehicle.submittedDate}</span>
                                                    </div>
                                                    <p className="text-sm text-white/60 ml-5">Vehicle registration rejected due to document issues</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    {selectedVehicle.status === 'PENDING' && (
                                        <>
                                            <button 
                                                onClick={() => {
                                                    handleApprove(selectedVehicle.id);
                                                    setShowVehicleModal(false);
                                                }}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2"
                                            >
                                                <CheckCircle size={14} />
                                                Approve Vehicle
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    handleReject(selectedVehicle.id);
                                                    setShowVehicleModal(false);
                                                }}
                                                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
                                            >
                                                <XCircle size={14} />
                                                Reject Vehicle
                                            </button>
                                        </>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setShowVehicleModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-white/80 rounded-xl text-sm font-semibold hover:bg-gray-300 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminVehicleManagement;
