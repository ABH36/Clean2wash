import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Search, RefreshCw, MapPin, Clock, User, Car, Target, 
    TrendingUp, Activity, CheckCircle, AlertTriangle, Eye, Settings,
    Navigation, Shield, Star, Timer, Route, Users, Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';

const AdminDispatchEngine = () => {
    const [pendingBookings, setPendingBookings] = useState([]);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [autoAssign, setAutoAssign] = useState(true);
    const [showAdvancedView, setShowAdvancedView] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [dispatchHistory, setDispatchHistory] = useState([]);
    const [dispatchStats, setDispatchStats] = useState(null);

    // 🚀 Real API Integration
    useEffect(() => {
        loadDispatchData();
        
        // Socket Integration for Real-time Updates
        const token = localStorage.getItem('admin_token');
        socketService.connect(token);
        socketService.joinAdminRoom();
        
        // Listen for dispatch events
        socketService.on('booking_escalation', (data) => {
            toast.error(`🚨 Booking Stuck: ${data.message}`, {
                duration: 6000
            });
            loadDispatchData(); // Refresh data
        });

        socketService.on('driver_assigned', (data) => {
            if (data.autoAssigned) {
                toast.success(`🤖 Auto-assigned: ${data.driverName}`, {
                    duration: 4000
                });
            }
            loadDispatchData(); // Refresh data
        });

        socketService.on('new_booking_broadcast', (data) => {
            if (data.booking?.service?.category === 'Chauffeur') {
                loadDispatchData(); // Refresh data
            }
        });

        return () => {
            socketService.off('booking_escalation');
            socketService.off('driver_assigned');
            socketService.off('new_booking_broadcast');
        };
    }, []);

    const loadDispatchData = async () => {
        setLoading(true);
        try {
            // Load pending bookings, available drivers, and dispatch stats
            const [pendingRes, driversRes, statsRes] = await Promise.all([
                adminAPI.getPendingBookings(),
                adminAPI.getSpareDrivers(),
                adminAPI.getDispatchStats()
            ]);

            if (pendingRes.status === 'success') {
                setPendingBookings(pendingRes.data.bookings || []);
            }

            if (driversRes.status === 'success') {
                // Filter only ACTIVE, APPROVED, ONLINE drivers
                const activeDrivers = (driversRes.data.drivers || []).filter(d => 
                    d.status === 'ACTIVE' && 
                    d.verificationStatus === 'APPROVED' &&
                    d.onlineStatus?.isOnline
                );
                setAvailableDrivers(activeDrivers);
            }

            if (statsRes.status === 'success') {
                setDispatchStats(statsRes.data.stats);
            }
        } catch (error) {
            console.error('Failed to load dispatch data:', error);
            toast.error('Failed to load dispatch data');
        } finally {
            setLoading(false);
        }
    };

    const calculateDistance = (booking, driver) => {
        // Use booking and driver location coordinates if available
        const bookingLat = booking.location?.address?.coordinates?.lat || booking.coordinates?.lat;
        const bookingLng = booking.location?.address?.coordinates?.lng || booking.coordinates?.lng;
        const driverLat = driver.currentLocation?.coordinates?.lat || driver.coordinates?.lat;
        const driverLng = driver.currentLocation?.coordinates?.lng || driver.coordinates?.lng;
        
        if (!bookingLat || !bookingLng || !driverLat || !driverLng) {
            return 5.0; // Default distance if coordinates not available
        }
        
        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = (driverLat - bookingLat) * Math.PI / 180;
        const dLng = (driverLng - bookingLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(bookingLat * Math.PI / 180) * Math.cos(driverLat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance.toFixed(1);
    };

    const calculateDriverScore = (booking, driver) => {
        const distance = parseFloat(calculateDistance(booking, driver));
        const distanceScore = Math.max(0, 100 - (distance * 10)); // Closer = higher score
        const reliabilityScore = driver.reliabilityScore?.score || 50;
        const ratingScore = (driver.reliabilityScore?.score || 50); // Use reliability score as rating
        
        // Weighted average: Distance (40%) + Reliability (40%) + Rating (20%)
        const totalScore = (distanceScore * 0.4) + (reliabilityScore * 0.4) + (ratingScore * 0.2);
        return Math.round(totalScore);
    };

    const getRankedDrivers = (booking) => {
        return availableDrivers
            .map(driver => ({
                ...driver,
                distance: calculateDistance(booking, driver),
                score: calculateDriverScore(booking, driver)
            }))
            .sort((a, b) => b.score - a.score);
    };

    // 🚀 Real Auto-Assignment Function
    const handleAutoAssign = async (booking) => {
        try {
            const res = await adminAPI.triggerAutoAssign(booking._id);
            
            if (res.status === 'success') {
                toast.success(`🤖 Auto-assigned: ${res.data.driver.name}`, {
                    duration: 4000
                });
                
                // Refresh data
                loadDispatchData();
            }
        } catch (error) {
            console.error('Auto-assignment failed:', error);
            toast.error(error.response?.data?.message || 'Auto-assignment failed');
        }
    };

    // Manual assignment function
    const handleAssignDriver = async (bookingId, driverId, driverName, method = 'MANUAL') => {
        try {
            await adminAPI.assignCaptain(bookingId, driverId);
            
            toast.success(`${method === 'AUTO' ? 'Auto-assigned' : 'Assigned'} ${driverName} to booking ${bookingId}`);
            
            // Refresh data
            loadDispatchData();
        } catch (error) {
            console.error('Driver assignment failed:', error);
            toast.error(error.response?.data?.message || 'Failed to assign driver');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'URGENT': return 'text-red-600 bg-red-50 border-red-200';
            case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'NORMAL': return 'text-[var(--primary)] bg-[var(--primary-light)] border-[var(--primary)]';
            default: return 'text-[var(--text-muted)] bg-[var(--bg-secondary)] border-[var(--border)]';
        }
    };

    const filteredBookings = pendingBookings.filter(b => {
        // Map backend data structure to display structure
        const bookingId = b.bookingId || b._id || '';
        const customerName = b.consumer?.name || b.user?.name || b.customer || '';
        const serviceName = b.service?.name || b.serviceName || '';
        
        return bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
               customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6 pb-10 max-w-full mx-auto px-4 bg-[var(--bg)] min-h-screen">
            {/* Header Control Panel */}
            <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] ">
                <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dispatch Engine</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                            <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wide">Intelligent Driver Assignment</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                        <div className="flex-1 lg:w-64 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2 flex items-center gap-3 group focus-within:border-[var(--primary)] transition-all">
                            <Search size={14} className="text-[var(--text-muted)] group-focus-within:text-[var(--primary)]" />
                            <input
                                type="text"
                                placeholder="Search bookings..."
                                className="bg-transparent outline-none text-sm font-medium text-[var(--text-primary)] w-full placeholder:text-[var(--text-muted)]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button 
                            onClick={() => setAutoAssign(!autoAssign)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                                autoAssign 
                                    ? 'bg-[var(--success)] text-white' 
                                    : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)]'
                            }`}
                        >
                            <Zap size={14} className={autoAssign ? 'animate-pulse' : ''} />
                            Auto Assign
                        </button>

                        <button 
                            onClick={loadDispatchData} 
                            className="w-11 h-11 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] transition-all "
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>

                        <button 
                            onClick={() => setShowAdvancedView(!showAdvancedView)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                                showAdvancedView 
                                    ? 'bg-[var(--primary)] text-white' 
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Pending Bookings', value: pendingBookings.length, icon: <Clock size={18} />, colorClass: 'text-[var(--warning)] bg-[var(--warning-light)]' },
                    { label: 'Available Drivers', value: availableDrivers.length, icon: <Users size={18} />, colorClass: 'text-[var(--success)] bg-[var(--success-light)]' },
                    { label: 'Auto Assignments', value: dispatchStats?.autoAssignedToday || 0, icon: <Zap size={18} />, colorClass: 'text-[var(--primary)] bg-[var(--primary-light)]' },
                    { label: 'Online Drivers', value: dispatchStats?.onlineDrivers || availableDrivers.length, icon: <Timer size={18} />, colorClass: 'text-[var(--info)] bg-[var(--info-light)]' }
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
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.colorClass}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Bookings */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">Pending Assignments</h2>
                        <span className="px-3 py-1 bg-[var(--warning-light)] text-[var(--warning-text)] text-sm font-semibold rounded-full border border-[var(--warning)]">
                            {filteredBookings.length} pending
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-12 text-center">
                            <CheckCircle className="mx-auto text-[var(--success)] mb-3" size={48} />
                            <p className="text-lg font-bold text-[var(--text-primary)] mb-2">All Caught Up!</p>
                            <p className="text-sm text-[var(--text-muted)]">No pending bookings to assign</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredBookings.map((booking) => {
                                // Map backend data structure to display structure
                                const bookingId = booking.bookingId || booking._id?.substring(0, 8).toUpperCase() || 'N/A';
                                const customerName = booking.consumer?.name || booking.user?.name || booking.customer || 'Unknown Customer';
                                const serviceName = booking.service?.name || booking.serviceName || 'Chauffeur Service';
                                const location = booking.location?.address?.street || booking.location?.address || booking.location || 'Unknown Location';
                                const amount = booking.pricing?.totalAmount || booking.amount || 0;
                                const estimatedDuration = booking.schedule?.duration || booking.estimatedDuration || 60;
                                const scheduledTime = booking.schedule?.startTime 
                                    ? new Date(booking.schedule.startTime).toLocaleTimeString() 
                                    : new Date(booking.createdAt).toLocaleTimeString();
                                const priority = booking.priority || 'NORMAL';
                                const customerRating = booking.consumer?.rating || booking.customerRating || 4.5;
                                const specialRequests = booking.specialRequests || booking.notes || null;
                                
                                return (
                                <motion.div
                                    key={booking._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[var(--card)] rounded-xl border border-[var(--border)]  overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] font-bold text-lg flex items-center justify-center border border-[var(--primary)]">
                                                    <Target size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-[var(--text-primary)] font-mono">{bookingId}</h3>
                                                    <p className="text-sm text-[var(--text-secondary)] font-semibold">{serviceName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(priority)}`}>
                                                    {priority}
                                                </div>
                                                {autoAssign && (
                                                    <button
                                                        onClick={() => handleAutoAssign(booking)}
                                                        className="px-4 py-2 bg-[var(--success)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--success-dark)] transition-all flex items-center gap-2"
                                                    >
                                                        <Zap size={14} />
                                                        Auto Assign
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Customer</p>
                                                <p className="text-sm font-bold text-[var(--text-primary)]">{customerName}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Star size={12} className="text-yellow-500 fill-current" />
                                                    <span className="text-xs font-semibold text-[var(--text-secondary)]">{customerRating}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Location</p>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={12} className="text-[var(--text-muted)]" />
                                                    <p className="text-sm font-bold text-[var(--text-primary)]">{location}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
                                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Amount</p>
                                                <p className="text-lg font-bold text-[var(--primary)]">₹{amount}</p>
                                            </div>
                                            <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
                                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Duration</p>
                                                <p className="text-lg font-bold text-[var(--text-primary)]">{estimatedDuration}min</p>
                                            </div>
                                            <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
                                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Scheduled</p>
                                                <p className="text-sm font-bold text-[var(--text-primary)]">{scheduledTime}</p>
                                            </div>
                                        </div>

                                        {specialRequests && (
                                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">Special Requests</p>
                                                <p className="text-sm text-blue-800 font-medium">{specialRequests}</p>
                                            </div>
                                        )}

                                        {showAdvancedView && (
                                            <div className="border-t border-[var(--border)] pt-4">
                                                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">Recommended Drivers</h4>
                                                <div className="space-y-2">
                                                    {getRankedDrivers(booking).slice(0, 3).map((driver, idx) => (
                                                        <div key={driver._id} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${
                                                                    idx === 0 ? 'bg-[var(--success)] text-white border-[var(--success)]' :
                                                                    idx === 1 ? 'bg-[var(--primary)] text-white border-[var(--primary)]' :
                                                                    'bg-[var(--text-muted)] text-white border-[var(--text-muted)]'
                                                                }`}>
                                                                    {idx + 1}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-[var(--text-primary)]">{driver.name}</p>
                                                                    <p className="text-xs text-[var(--text-muted)]">{driver.distance}km • ETA: {Math.ceil(driver.distance * 3)}min</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-right">
                                                                    <p className="text-sm font-bold text-[var(--text-primary)]">Score: {driver.score}</p>
                                                                    <div className="flex items-center gap-1">
                                                                        <Star size={10} className="text-yellow-500 fill-current" />
                                                                        <span className="text-xs text-[var(--text-secondary)]">{(driver.reliabilityScore?.score || 50) / 20}</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleAssignDriver(booking._id, driver._id, driver.name)}
                                                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all"
                                                                >
                                                                    Assign
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )})}
                        </div>
                    )}
                </div>

                {/* Available Drivers & Dispatch History */}
                <div className="space-y-6">
                    {/* Available Drivers */}
                    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)]  overflow-hidden">
                        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--success-light)]">
                            <div className="flex items-center gap-3">
                                <Users className="text-[var(--success)]" size={20} />
                                <h3 className="text-lg font-bold text-[var(--success-text)]">Available Drivers</h3>
                                <span className="px-2 py-1 bg-[var(--success)] text-white text-xs font-bold rounded-full">{availableDrivers.length}</span>
                            </div>
                        </div>
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                            {availableDrivers.map((driver) => (
                                <div key={driver._id} className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[var(--success-light)] text-[var(--success-text)] font-bold text-sm flex items-center justify-center uppercase border border-[var(--success)]">
                                                {driver.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[var(--text-primary)]">{driver.name}</p>
                                                <p className="text-xs text-[var(--text-muted)] font-mono">{driver.driverId}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1">
                                                <Star size={12} className="text-yellow-500 fill-current" />
                                                <span className="text-sm font-bold text-[var(--text-primary)]">{((driver.reliabilityScore?.score || 50) / 20).toFixed(1)}</span>
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)]">{driver.reliabilityScore?.metrics?.totalTrips || 0} trips</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={12} className="text-[var(--text-muted)]" />
                                            <p className="text-xs text-[var(--text-secondary)] font-semibold">{driver.currentLocation?.address || 'Location updating...'}</p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-[var(--text-muted)]">Reliability</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-[var(--border)] rounded-full h-2">
                                                    <div 
                                                        className="bg-[var(--success)] h-2 rounded-full" 
                                                        style={{ width: `${driver.reliabilityScore?.score || 50}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-[var(--success-text)]">{driver.reliabilityScore?.score || 50}%</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-[var(--text-muted)]">Status</span>
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                                                <span className="text-xs font-bold text-[var(--success-text)]">Online</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Dispatch History */}
                    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)]  overflow-hidden">
                        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--primary-light)]">
                            <div className="flex items-center gap-3">
                                <Activity className="text-[var(--primary)]" size={20} />
                                <h3 className="text-lg font-bold text-[var(--primary-text)]">Dispatch Stats</h3>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            {dispatchStats ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-[var(--success-light)] rounded-lg border border-[var(--success)]">
                                        <p className="text-xs font-semibold text-[var(--success-text)] uppercase tracking-wide mb-1">Auto Today</p>
                                        <p className="text-2xl font-bold text-[var(--success)]">{dispatchStats.autoAssignedToday}</p>
                                    </div>
                                    <div className="text-center p-3 bg-[var(--primary-light)] rounded-lg border border-[var(--primary)]">
                                        <p className="text-xs font-semibold text-[var(--primary-text)] uppercase tracking-wide mb-1">Manual Today</p>
                                        <p className="text-2xl font-bold text-[var(--primary)]">{dispatchStats.manualAssignedToday}</p>
                                    </div>
                                    <div className="text-center p-3 bg-[var(--warning-light)] rounded-lg border border-[var(--warning)]">
                                        <p className="text-xs font-semibold text-[var(--warning-text)] uppercase tracking-wide mb-1">Pending</p>
                                        <p className="text-2xl font-bold text-[var(--warning)]">{dispatchStats.pending}</p>
                                    </div>
                                    <div className="text-center p-3 bg-[var(--info-light)] rounded-lg border border-[var(--info)]">
                                        <p className="text-xs font-semibold text-[var(--info-text)] uppercase tracking-wide mb-1">Assigned</p>
                                        <p className="text-2xl font-bold text-[var(--info)]">{dispatchStats.assigned}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Activity className="mx-auto text-gray-400 mb-2" size={32} />
                                    <p className="text-sm text-[var(--text-muted)]">Loading dispatch statistics...</p>
                                </div>
                            )}
                            
                            {dispatchStats?.stuckBookings > 0 && (
                                <div className="mt-4 p-3 bg-[var(--error-light)] border border-[var(--error)] rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={16} className="text-[var(--error)]" />
                                        <p className="text-sm font-bold text-[var(--error-text)]">
                                            {dispatchStats.stuckBookings} booking(s) need attention
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDispatchEngine;