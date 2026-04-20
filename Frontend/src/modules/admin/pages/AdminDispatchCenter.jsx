import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, MapPin, Clock, TrendingUp, Zap, AlertTriangle,
    CheckCircle, RefreshCw, Search, Filter, Target, Navigation,
    User, Car, Phone, Activity, Timer, Award, Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminDispatchCenter = () => {
    const [pendingBookings, setPendingBookings] = useState([]);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [assignmentHistory, setAssignmentHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);

    useEffect(() => {
        loadDispatchData();
    }, []);

    const loadDispatchData = () => {
        setLoading(true);
        setTimeout(() => {
            // Dummy pending bookings
            setPendingBookings([
                {
                    id: 'BK001',
                    customerName: 'Priya Sharma',
                    customerPhone: '+91 98765 43210',
                    pickupLocation: 'Koramangala 5th Block, Bangalore',
                    dropLocation: 'Indiranagar, Bangalore',
                    serviceType: 'INSTANT',
                    requestedTime: '2024-04-16T10:30:00Z',
                    estimatedDuration: 45,
                    priority: 'HIGH',
                    distance: 8.5,
                    waitingTime: 5 // minutes
                },
                {
                    id: 'BK002',
                    customerName: 'Rahul Verma',
                    customerPhone: '+91 98765 43211',
                    pickupLocation: 'HSR Layout Sector 2, Bangalore',
                    dropLocation: 'BTM Layout, Bangalore',
                    serviceType: 'SCHEDULED',
                    requestedTime: '2024-04-16T14:00:00Z',
                    estimatedDuration: 30,
                    priority: 'MEDIUM',
                    distance: 6.8,
                    waitingTime: 0
                },
                {
                    id: 'BK003',
                    customerName: 'Sneha Patel',
                    customerPhone: '+91 98765 43212',
                    pickupLocation: 'Whitefield Main Road, Bangalore',
                    dropLocation: 'Electronic City, Bangalore',
                    serviceType: 'INSTANT',
                    requestedTime: '2024-04-16T11:15:00Z',
                    estimatedDuration: 60,
                    priority: 'HIGH',
                    distance: 15.2,
                    waitingTime: 12
                }
            ]);

            // Dummy available drivers
            setAvailableDrivers([
                {
                    id: 'DRV001',
                    name: 'Rajesh Kumar',
                    phone: '+91 98765 43210',
                    currentLocation: 'Koramangala 4th Block, Bangalore',
                    reliabilityScore: 4.8,
                    rating: 4.9,
                    completedTrips: 245,
                    distanceFromPickup: 0.8,
                    estimatedArrival: 3,
                    isAvailable: true,
                    vehicleType: 'SEDAN',
                    lastActive: '2 min ago'
                },
                {
                    id: 'DRV002',
                    name: 'Vikram Singh',
                    phone: '+91 98765 43213',
                    currentLocation: 'Indiranagar Metro Station, Bangalore',
                    reliabilityScore: 4.9,
                    rating: 4.8,
                    completedTrips: 312,
                    distanceFromPickup: 2.1,
                    estimatedArrival: 7,
                    isAvailable: true,
                    vehicleType: 'SUV',
                    lastActive: '1 min ago'
                },
                {
                    id: 'DRV003',
                    name: 'Arjun Reddy',
                    phone: '+91 98765 43214',
                    currentLocation: 'HSR Layout Sector 1, Bangalore',
                    reliabilityScore: 4.7,
                    rating: 4.6,
                    completedTrips: 267,
                    distanceFromPickup: 1.2,
                    estimatedArrival: 4,
                    isAvailable: true,
                    vehicleType: 'HATCHBACK',
                    lastActive: '30 sec ago'
                }
            ]);

            // Dummy assignment history
            setAssignmentHistory([
                {
                    id: 'AS001',
                    bookingId: 'BK004',
                    driverId: 'DRV005',
                    driverName: 'Amit Sharma',
                    customerName: 'Kavya Nair',
                    assignedAt: '10:15 AM',
                    status: 'COMPLETED',
                    completionTime: 42,
                    rating: 4.8
                },
                {
                    id: 'AS002',
                    bookingId: 'BK005',
                    driverId: 'DRV006',
                    driverName: 'Suresh Patel',
                    customerName: 'Deepak Singh',
                    assignedAt: '09:45 AM',
                    status: 'IN_PROGRESS',
                    completionTime: null,
                    rating: null
                }
            ]);

            setLoading(false);
        }, 800);
    };

    const calculateDriverScore = (driver, booking) => {
        const distanceScore = Math.max(0, 100 - (driver.distanceFromPickup * 10));
        const reliabilityScore = driver.reliabilityScore * 20;
        const ratingScore = driver.rating * 20;
        const experienceScore = Math.min(20, driver.completedTrips / 10);
        
        return Math.round(distanceScore + reliabilityScore + ratingScore + experienceScore);
    };

    const autoAssignBooking = (booking) => {
        const sortedDrivers = availableDrivers
            .filter(d => d.isAvailable)
            .map(d => ({ ...d, score: calculateDriverScore(d, booking) }))
            .sort((a, b) => b.score - a.score);

        if (sortedDrivers.length > 0) {
            const bestDriver = sortedDrivers[0];
            assignBooking(booking.id, bestDriver.id);
        } else {
            toast.error('No available drivers for auto-assignment');
        }
    };

    const assignBooking = (bookingId, driverId) => {
        const booking = pendingBookings.find(b => b.id === bookingId);
        const driver = availableDrivers.find(d => d.id === driverId);
        
        if (booking && driver) {
            // Remove from pending
            setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
            
            // Mark driver as unavailable
            setAvailableDrivers(prev => prev.map(d => 
                d.id === driverId ? { ...d, isAvailable: false } : d
            ));

            // Add to assignment history
            const newAssignment = {
                id: `AS${Date.now()}`,
                bookingId: booking.id,
                driverId: driver.id,
                driverName: driver.name,
                customerName: booking.customerName,
                assignedAt: new Date().toLocaleTimeString(),
                status: 'ASSIGNED',
                completionTime: null,
                rating: null
            };
            setAssignmentHistory(prev => [newAssignment, ...prev]);

            toast.success(`Booking ${bookingId} assigned to ${driver.name}`);
            setShowAssignModal(false);
        }
    };

    const openAssignModal = (booking) => {
        setSelectedBooking(booking);
        setShowAssignModal(true);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
            case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            default: return 'text-white/60 bg-white/[0.02] border-white/10';
        }
    };

    return (
        <div className="space-y-6 pb-10 max-w-full mx-auto px-4 bg-[var(--bg)] min-h-screen">
            {/* Header */}
            <div className="admin-card">
                <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Dispatch Center</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                            <p className="text-sm font-medium text-[var(--primary)] uppercase tracking-wide">Real-Time Assignment Engine</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setAutoAssignEnabled(!autoAssignEnabled)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                autoAssignEnabled 
                                    ? 'bg-[var(--primary)] text-white' 
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]'
                            }`}
                        >
                            <Zap size={14} className={autoAssignEnabled ? 'animate-pulse' : ''} />
                            Auto Assign
                        </button>
                        
                        <button 
                            onClick={loadDispatchData} 
                            className="btn-secondary w-10 h-10 p-0 flex items-center justify-center"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                    { label: 'Pending Bookings', value: pendingBookings.length, icon: <Clock size={18} />, color: 'text-amber-600' },
                    { label: 'Available Drivers', value: availableDrivers.filter(d => d.isAvailable).length, icon: <Users size={18} />, color: 'text-emerald-600' },
                    { label: 'Avg Response Time', value: '3.2 min', icon: <Timer size={18} />, color: 'text-[var(--primary)]' },
                    { label: 'Assignment Rate', value: '94.5%', icon: <Target size={18} />, color: 'text-blue-600' },
                    { label: 'Active Assignments', value: assignmentHistory.filter(a => a.status === 'IN_PROGRESS' || a.status === 'ASSIGNED').length, icon: <Activity size={18} />, color: 'text-purple-600' }
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
                                <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Dispatch Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Bookings Queue */}
                <div className="admin-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Pending Bookings</h3>
                        <span className="bg-[var(--warning-light)] text-[var(--warning-text)] px-3 py-1 rounded-full text-sm font-semibold">
                            {pendingBookings.length} Waiting
                        </span>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {pendingBookings.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                                <p className="text-sm font-semibold text-white/40">No pending bookings</p>
                            </div>
                        ) : (
                            pendingBookings.map((booking) => (
                                <motion.div
                                    key={booking.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] hover:shadow-2xl shadow-black/40 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] font-semibold text-sm flex items-center justify-center uppercase">
                                                {booking.customerName[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[var(--text-primary)] text-sm">{booking.customerName}</p>
                                                <p className="text-xs text-[var(--text-muted)] font-mono">{booking.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(booking.priority)}`}>
                                                {booking.priority}
                                            </span>
                                            {booking.waitingTime > 0 && (
                                                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-semibold">
                                                    {booking.waitingTime}m wait
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-start gap-2">
                                            <MapPin size={12} className="text-emerald-500 mt-1 flex-shrink-0" />
                                            <p className="text-xs text-[var(--text-secondary)]">{booking.pickupLocation}</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Navigation size={12} className="text-red-500 mt-1 flex-shrink-0" />
                                            <p className="text-xs text-[var(--text-secondary)]">{booking.dropLocation}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-4">
                                        <span>{booking.distance} km • {booking.estimatedDuration} min</span>
                                        <span className={`px-2 py-1 rounded-full font-semibold ${
                                            booking.serviceType === 'INSTANT' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {booking.serviceType}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openAssignModal(booking)}
                                            className="btn-secondary flex-1 text-xs"
                                        >
                                            Manual Assign
                                        </button>
                                        <button 
                                            onClick={() => autoAssignBooking(booking)}
                                            disabled={!autoAssignEnabled}
                                            className="btn-primary flex-1 text-xs disabled:opacity-50"
                                        >
                                            Auto Assign
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Available Drivers Panel */}
                <div className="admin-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Available Drivers</h3>
                        <span className="bg-[var(--success-light)] text-[var(--success-text)] px-3 py-1 rounded-full text-sm font-semibold">
                            {availableDrivers.filter(d => d.isAvailable).length} Online
                        </span>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {availableDrivers.filter(d => d.isAvailable).map((driver) => (
                            <motion.div
                                key={driver.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] hover:shadow-2xl shadow-black/40 transition-all"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 font-semibold text-xs flex items-center justify-center uppercase">
                                            {driver.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text-primary)] text-sm">{driver.name}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{driver.vehicleType}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1">
                                            <Award size={12} className="text-[var(--primary)]" />
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">{driver.rating}</span>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)]">{driver.completedTrips} trips</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                    <span>{driver.currentLocation}</span>
                                    <span className="font-semibold text-emerald-600">{driver.lastActive}</span>
                                </div>

                                {selectedBooking && (
                                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)]">Distance: {driver.distanceFromPickup} km</p>
                                                <p className="text-xs text-[var(--text-muted)]">ETA: {driver.estimatedArrival} min</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[var(--primary)]">
                                                    Score: {calculateDriverScore(driver, selectedBooking)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Assignment History */}
            <div className="admin-card">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Recent Assignments</h3>
                
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Driver</th>
                                <th>Customer</th>
                                <th>Assigned At</th>
                                <th>Status</th>
                                <th>Completion</th>
                                <th>Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignmentHistory.map((assignment) => (
                                <tr key={assignment.id}>
                                    <td className="font-mono text-sm">{assignment.bookingId}</td>
                                    <td className="font-semibold">{assignment.driverName}</td>
                                    <td>{assignment.customerName}</td>
                                    <td className="font-mono text-sm">{assignment.assignedAt}</td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            assignment.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                            assignment.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' :
                                            'bg-amber-100 text-amber-600'
                                        }`}>
                                            {assignment.status}
                                        </span>
                                    </td>
                                    <td className="font-mono text-sm">
                                        {assignment.completionTime ? `${assignment.completionTime} min` : '-'}
                                    </td>
                                    <td>
                                        {assignment.rating ? (
                                            <div className="flex items-center gap-1">
                                                <Award size={12} className="text-[var(--primary)]" />
                                                <span className="font-semibold">{assignment.rating}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Assignment Modal */}
            <AnimatePresence>
                {showAssignModal && selectedBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setShowAssignModal(false)} 
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="admin-card relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Assign Driver</h3>
                                <button 
                                    onClick={() => setShowAssignModal(false)}
                                    className="w-8 h-8 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="mb-6 p-4 bg-[var(--bg-secondary)] rounded-lg">
                                <h4 className="font-semibold text-[var(--text-primary)] mb-2">Booking Details</h4>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    <strong>{selectedBooking.customerName}</strong> • {selectedBooking.id}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {selectedBooking.pickupLocation} → {selectedBooking.dropLocation}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold text-[var(--text-primary)]">Available Drivers (Sorted by Score)</h4>
                                {availableDrivers
                                    .filter(d => d.isAvailable)
                                    .map(d => ({ ...d, score: calculateDriverScore(d, selectedBooking) }))
                                    .sort((a, b) => b.score - a.score)
                                    .map((driver) => (
                                        <div 
                                            key={driver.id}
                                            className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] hover:shadow-2xl shadow-black/40 transition-all cursor-pointer"
                                            onClick={() => assignBooking(selectedBooking.id, driver.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 font-semibold text-sm flex items-center justify-center uppercase">
                                                        {driver.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[var(--text-primary)]">{driver.name}</p>
                                                        <p className="text-sm text-[var(--text-secondary)]">{driver.vehicleType} • {driver.rating}★</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-[var(--primary)]">Score: {driver.score}</p>
                                                    <p className="text-sm text-[var(--text-secondary)]">{driver.distanceFromPickup} km • {driver.estimatedArrival} min</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDispatchCenter;