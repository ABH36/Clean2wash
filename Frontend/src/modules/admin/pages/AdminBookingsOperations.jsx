import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Briefcase, 
    Search, 
    RefreshCw, 
    User,
    MapPin,
    Clock,
    DollarSign,
    Shield,
    UserPlus,
    X,
    Eye,
    CheckCircle,
    AlertTriangle,
    Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminBookingsOperations = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showAdvancedView, setShowAdvancedView] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Dummy data for demo
    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = () => {
        setLoading(true);
        setTimeout(() => {
            setBookings([
                {
                    id: 'BK001',
                    customer: 'Priya Sharma',
                    customerPhone: '+91 98765 11111',
                    service: 'Premium Car Wash',
                    location: 'Koramangala, Bangalore',
                    status: 'PENDING',
                    assignedDriver: null,
                    amount: 599,
                    scheduledTime: '2024-04-15 10:00 AM',
                    estimatedDuration: 45,
                    actualStartTime: null,
                    actualEndTime: null,
                    overtimeMinutes: 0,
                    plannedDuration: 45,
                    timeTracking: {
                        travelTime: 0,
                        serviceTime: 0,
                        waitingTime: 0
                    },
                    priority: 'NORMAL'
                },
                {
                    id: 'BK002',
                    customer: 'Rahul Verma',
                    customerPhone: '+91 98765 22222',
                    service: 'Interior Cleaning',
                    location: 'Indiranagar, Bangalore',
                    status: 'ASSIGNED',
                    assignedDriver: 'Rajesh Kumar',
                    amount: 899,
                    scheduledTime: '2024-04-15 11:30 AM',
                    estimatedDuration: 60,
                    actualStartTime: null,
                    actualEndTime: null,
                    overtimeMinutes: 0,
                    plannedDuration: 60,
                    timeTracking: {
                        travelTime: 0,
                        serviceTime: 0,
                        waitingTime: 0
                    },
                    priority: 'HIGH'
                },
                {
                    id: 'BK003',
                    customer: 'Sneha Patel',
                    customerPhone: '+91 98765 33333',
                    service: 'Full Detailing',
                    location: 'Whitefield, Bangalore',
                    status: 'IN_PROGRESS',
                    assignedDriver: 'Vikram Singh',
                    amount: 1499,
                    scheduledTime: '2024-04-15 09:00 AM',
                    estimatedDuration: 120,
                    actualStartTime: '2024-04-15 09:15 AM',
                    actualEndTime: null,
                    overtimeMinutes: 15,
                    plannedDuration: 120,
                    timeTracking: {
                        travelTime: 25,
                        serviceTime: 75,
                        waitingTime: 5
                    },
                    priority: 'HIGH'
                },
                {
                    id: 'BK004',
                    customer: 'Amit Desai',
                    customerPhone: '+91 98765 44444',
                    service: 'Express Wash',
                    location: 'HSR Layout, Bangalore',
                    status: 'COMPLETED',
                    assignedDriver: 'Arjun Reddy',
                    amount: 399,
                    scheduledTime: '2024-04-14 03:00 PM',
                    estimatedDuration: 30,
                    actualStartTime: '2024-04-14 03:05 PM',
                    actualEndTime: '2024-04-14 03:40 PM',
                    overtimeMinutes: 10,
                    plannedDuration: 30,
                    timeTracking: {
                        travelTime: 15,
                        serviceTime: 30,
                        waitingTime: 0
                    },
                    priority: 'NORMAL'
                },
                {
                    id: 'BK005',
                    customer: 'Kavya Nair',
                    customerPhone: '+91 98765 55555',
                    service: 'Premium Car Wash',
                    location: 'Jayanagar, Bangalore',
                    status: 'PENDING',
                    assignedDriver: null,
                    amount: 599,
                    scheduledTime: '2024-04-15 02:00 PM',
                    estimatedDuration: 45,
                    actualStartTime: null,
                    actualEndTime: null,
                    overtimeMinutes: 0,
                    plannedDuration: 45,
                    timeTracking: {
                        travelTime: 0,
                        serviceTime: 0,
                        waitingTime: 0
                    },
                    priority: 'URGENT'
                }
            ]);
            setLoading(false);
        }, 800);
    };

    const openAssignModal = (booking) => {
        setSelectedBooking(booking);
        setAssignModalOpen(true);
    };

    const openBookingDetails = (booking) => {
        setSelectedBooking(booking);
        setShowBookingModal(true);
    };

    const handleReassignDriver = (booking) => {
        setSelectedBooking(booking);
        setAssignModalOpen(true);
    };

    const calculateOvertime = (booking) => {
        if (!booking.actualStartTime || !booking.actualEndTime) return 0;
        const planned = booking.plannedDuration;
        const actual = booking.timeTracking.serviceTime;
        return Math.max(0, actual - planned);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'URGENT': return 'text-red-600 bg-red-50 border-red-200';
            case 'HIGH': return 'text-[var(--warning)] bg-[var(--warning-light)] border-[var(--warning)]';
            case 'NORMAL': return 'text-[var(--primary)] bg-[var(--primary-light)] border-[var(--primary)]';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const handleAssignDriver = (driverName) => {
        setBookings(prev => prev.map(b => 
            b.id === selectedBooking.id ? { ...b, assignedDriver: driverName, status: 'ASSIGNED' } : b
        ));
        toast.success(`Driver ${driverName} assigned successfully`);
        setAssignModalOpen(false);
        setSelectedBooking(null);
    };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch = b.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.service.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'ALL' || b.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'amber';
            case 'ASSIGNED': return 'blue';
            case 'IN_PROGRESS': return 'purple';
            case 'COMPLETED': return 'emerald';
            default: return 'slate';
        }
    };

    return (
        <div className="space-y-6 pb-10 max-w-full mx-auto px-4 bg-[var(--bg)] min-h-screen">
            {/* Header Control Panel */}
            <div className="admin-card">
                <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Booking Operations</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                            <p className="text-sm font-medium text-[var(--primary)] uppercase tracking-wide">Live Order Management</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                        <div className="flex-1 lg:w-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-3 group focus-within:border-[var(--primary)] transition-all">
                            <Search size={14} className="text-gray-500 group-focus-within:text-[var(--primary)]" />
                            <input
                                type="text"
                                placeholder="Search bookings..."
                                className="bg-transparent outline-none text-sm font-medium text-gray-900 w-full placeholder:text-gray-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none cursor-pointer"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                        </select>

                        <button 
                            onClick={loadBookings} 
                            className="w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-[var(--primary)] transition-all shadow-sm"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>

                        <button 
                            onClick={() => setShowAdvancedView(!showAdvancedView)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                                showAdvancedView 
                                    ? 'bg-[var(--primary)] text-white' 
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Clock size={14} />
                            {showAdvancedView ? 'Basic View' : 'Advanced View'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total Bookings', value: bookings.length, icon: <Briefcase size={18} />, color: '[var(--primary)]' },
                    { label: 'Pending', value: bookings.filter(b => b.status === 'PENDING').length, icon: <Clock size={18} />, color: 'amber-500' },
                    { label: 'In Progress', value: bookings.filter(b => b.status === 'IN_PROGRESS').length, icon: <RefreshCw size={18} />, color: 'purple-500' },
                    { label: 'Completed', value: bookings.filter(b => b.status === 'COMPLETED').length, icon: <Shield size={18} />, color: 'emerald-500' },
                    { label: 'Overtime Jobs', value: bookings.filter(b => b.overtimeMinutes > 0).length, icon: <DollarSign size={18} />, color: 'red-500' }
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-${stat.color.replace('-', '-')}/10 flex items-center justify-center text-${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left table-fixed border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Booking Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Status</th>
                                {showAdvancedView && (
                                    <>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Time Tracking</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Overtime</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Priority</th>
                                    </>
                                )}
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned Driver</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right pr-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={showAdvancedView ? "8" : "6"} className="px-5 py-24 text-center">
                                        <div className="w-10 h-10 mx-auto border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                                    </td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={showAdvancedView ? "8" : "6"} className="px-5 py-24 text-center">
                                        <Shield className="mx-auto opacity-20 mb-3" size={32} />
                                        <p className="text-sm font-semibold text-gray-500">No bookings found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <motion.tr 
                                        key={booking.id} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-gray-50 transition-all duration-300"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gray-100 text-gray-700 font-bold text-sm border border-gray-200 group-hover:bg-[var(--primary)] group-hover:text-white transition-all flex items-center justify-center">
                                                    <Briefcase size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 font-mono leading-none mb-1">{booking.id}</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={10} className="text-gray-500" />
                                                        <p className="text-xs font-medium text-gray-500">{booking.scheduledTime}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gray-100 text-gray-700 font-bold text-sm border border-gray-200 group-hover:bg-[var(--primary)] group-hover:text-white transition-all flex items-center justify-center uppercase">
                                                    {booking.customer[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 capitalize leading-none mb-1">{booking.customer}</p>
                                                    <p className="text-xs font-medium text-gray-500">{booking.customerPhone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-sm font-semibold text-gray-900">{booking.service}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={10} className="text-gray-500" />
                                                    <p className="text-xs font-medium text-gray-500 truncate">{booking.location}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <DollarSign size={10} className="text-[var(--primary)]" />
                                                    <p className="text-xs font-semibold text-[var(--primary)]">₹{booking.amount}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border ${
                                                booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                booking.status === 'ASSIGNED' ? 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]' :
                                                booking.status === 'IN_PROGRESS' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                booking.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}>
                                                {booking.status.replace('_', ' ')}
                                            </div>
                                        </td>
                                        {showAdvancedView && (
                                            <>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="text-center">
                                                            <p className="text-xs font-semibold text-gray-700">
                                                                {booking.timeTracking.serviceTime || booking.estimatedDuration}min
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                of {booking.plannedDuration}min
                                                            </p>
                                                        </div>
                                                        {booking.status === 'IN_PROGRESS' && (
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className="bg-[var(--primary)] h-2 rounded-full transition-all" 
                                                                    style={{ width: `${Math.min(100, (booking.timeTracking.serviceTime / booking.plannedDuration) * 100)}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        {booking.overtimeMinutes > 0 ? (
                                                            <>
                                                                <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
                                                                    <Clock size={12} className="text-red-500" />
                                                                    <span className="text-sm font-semibold text-red-600">
                                                                        +{booking.overtimeMinutes}min
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-red-500 font-semibold">Overtime</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                                    <CheckCircle size={12} className="text-emerald-500" />
                                                                    <span className="text-sm font-semibold text-emerald-600">On Time</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(booking.priority)}`}>
                                                        {booking.priority === 'URGENT' && <AlertTriangle size={10} />}
                                                        {booking.priority}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                        <td className="px-6 py-4">
                                            {booking.assignedDriver ? (
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-[var(--primary)]" />
                                                    <p className="text-sm font-semibold text-gray-900 capitalize">{booking.assignedDriver}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm font-medium text-gray-500 italic">Not assigned</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 pr-10">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => openBookingDetails(booking)}
                                                    className="px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all flex items-center gap-1.5"
                                                >
                                                    <Eye size={12} />
                                                    Details
                                                </button>
                                                {!booking.assignedDriver && booking.status === 'PENDING' && (
                                                    <button 
                                                        onClick={() => openAssignModal(booking)}
                                                        className="px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1.5"
                                                    >
                                                        <UserPlus size={12} />
                                                        Assign
                                                    </button>
                                                )}
                                                {booking.assignedDriver && booking.status !== 'COMPLETED' && (
                                                    <button 
                                                        onClick={() => handleReassignDriver(booking)}
                                                        className="px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-600 hover:text-white transition-all flex items-center gap-1.5"
                                                    >
                                                        <RefreshCw size={12} />
                                                        Reassign
                                                    </button>
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

            {/* Assign Driver Modal */}
            <AnimatePresence>
                {assignModalOpen && selectedBooking && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setAssignModalOpen(false)} 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 30 }} 
                            className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden border border-gray-200"
                        >
                            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                                        {selectedBooking.assignedDriver ? 'Reassign Driver' : 'Assign Driver'}
                                    </h2>
                                    <p className="text-sm text-[var(--primary)] font-semibold">Booking {selectedBooking.id}</p>
                                </div>
                                <button 
                                    onClick={() => setAssignModalOpen(false)} 
                                    className="w-10 h-10 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-500 transition-all flex items-center justify-center"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-3">
                                {['Rajesh Kumar', 'Amit Sharma', 'Vikram Singh', 'Arjun Reddy'].map((driver) => (
                                    <button
                                        key={driver}
                                        onClick={() => handleAssignDriver(driver)}
                                        className="w-full p-4 bg-gray-50 hover:bg-[var(--primary-light)] border border-gray-200 hover:border-[var(--primary)] rounded-xl text-left transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[var(--primary-light)] group-hover:bg-[var(--primary)] text-[var(--primary)] group-hover:text-white font-bold text-sm flex items-center justify-center uppercase transition-all">
                                                {driver[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 capitalize">{driver}</p>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Available</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Booking Details Modal */}
            <AnimatePresence>
                {showBookingModal && selectedBooking && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setShowBookingModal(false)} 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 30 }} 
                            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl relative z-10 overflow-hidden border border-gray-200"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--primary)] text-white font-bold text-lg flex items-center justify-center">
                                        <Briefcase size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 font-mono">{selectedBooking.id}</h2>
                                        <p className="text-sm text-gray-600 font-semibold">{selectedBooking.service}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowBookingModal(false)} 
                                    className="w-10 h-10 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-500 transition-all flex items-center justify-center"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Tabs */}
                            <div className="border-b border-gray-200 bg-white">
                                <div className="flex">
                                    {[
                                        { id: 'overview', label: 'Overview', icon: <Info size={16} /> },
                                        { id: 'tracking', label: 'Time Tracking', icon: <Clock size={16} /> },
                                        { id: 'driver', label: 'Driver Info', icon: <User size={16} /> }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
                                                activeTab === tab.id
                                                    ? 'text-[var(--primary)] border-[var(--primary)] bg-[var(--primary-light)]'
                                                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">Booking Information</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-gray-500">Booking ID:</span>
                                                        <span className="text-sm font-bold text-gray-900 font-mono">{selectedBooking.id}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-gray-500">Service:</span>
                                                        <span className="text-sm font-bold text-gray-900">{selectedBooking.service}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-gray-500">Amount:</span>
                                                        <span className="text-sm font-bold text-[var(--primary)]">₹{selectedBooking.amount}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-gray-500">Scheduled:</span>
                                                        <span className="text-sm font-bold text-gray-900">{selectedBooking.scheduledTime}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-gray-500">Priority:</span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(selectedBooking.priority)}`}>
                                                            {selectedBooking.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">Customer Information</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-gray-500">Name:</span>
                                                        <span className="text-sm font-bold text-gray-900">{selectedBooking.customer}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-gray-500">Phone:</span>
                                                        <span className="text-sm font-bold text-gray-900">{selectedBooking.customerPhone}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-gray-500">Location:</span>
                                                        <span className="text-sm font-bold text-gray-900">{selectedBooking.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'tracking' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">Time Tracking Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-[var(--primary-light)] border border-[var(--primary)] rounded-xl p-4 text-center">
                                                <h4 className="text-sm font-bold text-[var(--primary)] mb-2">Planned Duration</h4>
                                                <p className="text-2xl font-bold text-[var(--primary)]">{selectedBooking.plannedDuration}min</p>
                                            </div>
                                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                                                <h4 className="text-sm font-bold text-purple-900 mb-2">Actual Duration</h4>
                                                <p className="text-2xl font-bold text-purple-600">
                                                    {selectedBooking.timeTracking.serviceTime || selectedBooking.estimatedDuration}min
                                                </p>
                                            </div>
                                            <div className={`border rounded-xl p-4 text-center ${
                                                selectedBooking.overtimeMinutes > 0 
                                                    ? 'bg-red-50 border-red-200' 
                                                    : 'bg-emerald-50 border-emerald-200'
                                            }`}>
                                                <h4 className={`text-sm font-bold mb-2 ${
                                                    selectedBooking.overtimeMinutes > 0 ? 'text-red-900' : 'text-emerald-900'
                                                }`}>Overtime</h4>
                                                <p className={`text-2xl font-bold ${
                                                    selectedBooking.overtimeMinutes > 0 ? 'text-red-600' : 'text-emerald-600'
                                                }`}>
                                                    {selectedBooking.overtimeMinutes > 0 ? `+${selectedBooking.overtimeMinutes}min` : 'On Time'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <h4 className="text-md font-bold text-gray-900">Time Breakdown</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-semibold text-gray-600">Travel Time:</span>
                                                    <span className="text-sm font-bold text-gray-900">{selectedBooking.timeTracking.travelTime}min</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-semibold text-gray-600">Service Time:</span>
                                                    <span className="text-sm font-bold text-gray-900">{selectedBooking.timeTracking.serviceTime}min</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-semibold text-gray-600">Waiting Time:</span>
                                                    <span className="text-sm font-bold text-gray-900">{selectedBooking.timeTracking.waitingTime}min</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'driver' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">Driver Assignment</h3>
                                        {selectedBooking.assignedDriver ? (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-16 h-16 rounded-xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center uppercase">
                                                        {selectedBooking.assignedDriver[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-emerald-900">{selectedBooking.assignedDriver}</h4>
                                                        <p className="text-sm text-emerald-700 font-semibold">Assigned Driver</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setShowBookingModal(false);
                                                        handleReassignDriver(selectedBooking);
                                                    }}
                                                    className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-all flex items-center gap-2"
                                                >
                                                    <RefreshCw size={14} />
                                                    Reassign Driver
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                                                <AlertTriangle className="mx-auto text-amber-500 mb-3" size={48} />
                                                <h4 className="text-lg font-bold text-amber-900 mb-2">No Driver Assigned</h4>
                                                <p className="text-sm text-amber-700 mb-4">This booking needs a driver assignment</p>
                                                <button 
                                                    onClick={() => {
                                                        setShowBookingModal(false);
                                                        openAssignModal(selectedBooking);
                                                    }}
                                                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-hover)] transition-all flex items-center gap-2 mx-auto"
                                                >
                                                    <UserPlus size={14} />
                                                    Assign Driver
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end">
                                <button 
                                    onClick={() => setShowBookingModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-300 transition-all"
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

export default AdminBookingsOperations;
