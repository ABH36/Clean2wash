import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    MapPin, 
    Search, 
    RefreshCw, 
    Navigation,
    Activity,
    Clock,
    User,
    Car,
    Shield,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Phone,
    MessageCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';

const AdminLiveTracking = () => {
    const [activeTrips, setActiveTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [showAdvancedView, setShowAdvancedView] = useState(false);
    const [alerts, setAlerts] = useState([]);

    // Load active spare driver bookings
    useEffect(() => {
        loadActiveTrips();
        
        // Socket listeners for real-time updates
        socketService.on('booking_status_updated', handleBookingUpdate);
        socketService.on('driver_location_updated', handleLocationUpdate);
        socketService.on('booking_assigned', handleBookingUpdate);
        socketService.on('booking_accepted', handleBookingUpdate);
        
        return () => {
            socketService.off('booking_status_updated', handleBookingUpdate);
            socketService.off('driver_location_updated', handleLocationUpdate);
            socketService.off('booking_assigned', handleBookingUpdate);
            socketService.off('booking_accepted', handleBookingUpdate);
        };
    }, []);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        
        const interval = setInterval(() => {
            loadActiveTrips();
        }, 10000);

        return () => clearInterval(interval);
    }, [autoRefresh]);

    const handleBookingUpdate = (data) => {
        console.log('Booking update received:', data);
        loadActiveTrips(); // Refresh trips on any booking update
    };

    const handleLocationUpdate = (data) => {
        console.log('Location update received:', data);
        
        // Update specific trip location in real-time
        setActiveTrips(prev => prev.map(trip => {
            if (trip.driverId === data.driverId || trip.bookingId === data.bookingId) {
                return {
                    ...trip,
                    currentLocation: data.address || trip.currentLocation,
                    currentCoordinates: data.coordinates || trip.currentCoordinates,
                    speed: data.speed || trip.speed,
                    lastUpdate: new Date().toLocaleTimeString()
                };
            }
            return trip;
        }));
    };

    const loadActiveTrips = async () => {
        try {
            setLoading(true);
            
            // Try to fetch active spare driver bookings
            let response;
            try {
                response = await adminAPI.getSpareDriverBookings({
                    status: 'assigned,accepted,en_route,arrived,in_progress',
                    limit: 100
                });
            } catch (error) {
                console.warn('Spare driver bookings endpoint failed, trying general bookings:', error);
                // Fallback to general bookings endpoint
                response = await adminAPI.getAllBookings();
                
                // Filter for chauffeur bookings and active statuses
                if (response.status === 'success' && response.data?.bookings) {
                    const activeStatuses = ['assigned', 'accepted', 'en_route', 'arrived', 'in_progress'];
                    response.data.bookings = response.data.bookings.filter(booking => 
                        booking.service?.category === 'Chauffeur' && 
                        activeStatuses.includes(booking.status?.toLowerCase())
                    );
                }
            }

            if (response.status === 'success' && response.data?.bookings) {
                const formattedTrips = response.data.bookings.map(booking => {
                    const driver = booking.provider?.id;
                    const consumer = booking.consumer;
                    
                    // Calculate progress based on status
                    let progress = 0;
                    if (booking.status === 'assigned') progress = 10;
                    else if (booking.status === 'accepted') progress = 25;
                    else if (booking.status === 'en_route') progress = 50;
                    else if (booking.status === 'arrived') progress = 75;
                    else if (booking.status === 'in_progress') progress = 90;
                    
                    // Calculate idle time (if driver hasn't updated location recently)
                    const lastLocationUpdate = driver?.location?.lastUpdated 
                        ? new Date(driver.location.lastUpdated) 
                        : null;
                    const idleMinutes = lastLocationUpdate 
                        ? Math.floor((Date.now() - lastLocationUpdate.getTime()) / 60000)
                        : 0;
                    
                    // Detect alerts
                    const tripAlerts = [];
                    if (idleMinutes > 10) {
                        tripAlerts.push({
                            type: 'IDLE',
                            message: `Driver idle for ${idleMinutes} minutes`,
                            severity: idleMinutes > 15 ? 'HIGH' : 'MEDIUM'
                        });
                    }
                    
                    return {
                        id: booking.bookingId || booking._id,
                        bookingId: booking._id,
                        driverName: driver?.name || 'Unknown Driver',
                        driverId: driver?._id || driver?.driverId || 'N/A',
                        driverPhone: driver?.phone || 'N/A',
                        customerName: consumer?.name || 'Unknown Customer',
                        customerId: consumer?._id,
                        customerPhone: consumer?.phone || 'N/A',
                        vehicleNumber: driver?.vehicle?.registrationNumber || 'N/A',
                        vehicleType: driver?.vehicle?.type || 'N/A',
                        currentLocation: driver?.location?.address || 'Location updating...',
                        currentCoordinates: driver?.location?.coordinates || {},
                        destination: booking.dropoff?.address || 'N/A',
                        destinationCoordinates: booking.dropoff?.coordinates || {},
                        status: booking.status.toUpperCase(),
                        startTime: booking.scheduledAt 
                            ? new Date(booking.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                            : new Date(booking.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                        estimatedArrival: booking.estimatedArrival 
                            ? new Date(booking.estimatedArrival).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                            : 'Calculating...',
                        lastUpdate: lastLocationUpdate 
                            ? lastLocationUpdate.toLocaleTimeString('en-IN')
                            : 'No updates',
                        progress,
                        distance: booking.distance 
                            ? `${(booking.distance / 1000).toFixed(1)} km`
                            : 'N/A',
                        speed: driver?.location?.speed || 0,
                        idleTime: idleMinutes,
                        routeDeviation: false, // Can be enhanced with route tracking
                        alerts: tripAlerts,
                        serviceType: booking.service?.name || 'Spare Driver',
                        pricing: booking.pricing?.totalAmount || 0
                    };
                });

                setActiveTrips(formattedTrips);
                
                // Collect all alerts
                const allAlerts = [];
                formattedTrips.forEach(trip => {
                    trip.alerts.forEach(alert => {
                        allAlerts.push({
                            id: `${trip.id}-${alert.type}`,
                            type: alert.type,
                            tripId: trip.id,
                            driverId: trip.driverId,
                            message: `${trip.driverName}: ${alert.message}`,
                            severity: alert.severity,
                            timestamp: new Date().toLocaleTimeString('en-IN')
                        });
                    });
                });
                setAlerts(allAlerts);
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Failed to load active trips:', error);
            toast.error(`Failed to load active trips: ${error.message || 'Unknown error'}`);
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ASSIGNED': return 'yellow';
            case 'ACCEPTED': return 'cyan';
            case 'EN_ROUTE': return 'blue';
            case 'ARRIVED': return 'indigo';
            case 'IN_PROGRESS': return 'purple';
            case 'RETURNING': return 'emerald';
            default: return 'slate';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ASSIGNED': return 'Assigned';
            case 'ACCEPTED': return 'Accepted';
            case 'EN_ROUTE': return 'En Route';
            case 'ARRIVED': return 'Arrived';
            case 'IN_PROGRESS': return 'Service Active';
            case 'RETURNING': return 'Returning';
            default: return status;
        }
    };

    const contactDriver = (trip) => {
        if (trip.driverPhone && trip.driverPhone !== 'N/A') {
            window.open(`tel:${trip.driverPhone}`, '_self');
        } else {
            toast.error('Driver phone number not available');
        }
    };

    const contactCustomer = (trip) => {
        if (trip.customerPhone && trip.customerPhone !== 'N/A') {
            window.open(`tel:${trip.customerPhone}`, '_self');
        } else {
            toast.error('Customer phone number not available');
        }
    };

    const viewOnMap = (trip) => {
        const { currentCoordinates, destinationCoordinates } = trip;
        
        if (currentCoordinates?.lat && currentCoordinates?.lng) {
            const origin = `${currentCoordinates.lat},${currentCoordinates.lng}`;
            const destination = destinationCoordinates?.lat && destinationCoordinates?.lng
                ? `${destinationCoordinates.lat},${destinationCoordinates.lng}`
                : '';
            
            const url = destination
                ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
                : `https://www.google.com/maps/search/?api=1&query=${origin}`;
            
            window.open(url, '_blank');
        } else {
            toast.error('Location coordinates not available');
        }
    };

    const filteredTrips = activeTrips.filter(trip =>
        trip.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10 max-w-full mx-auto px-4 bg-[var(--bg)] min-h-screen">
            {/* Header Control Panel */}
            <div className="admin-card">
                <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Live Tracking</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                            <p className="text-sm font-medium text-[var(--primary)] uppercase tracking-wide">Real-Time Fleet Monitor</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                        <div className="flex-1 lg:w-64 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2 flex items-center gap-3 group focus-within:border-blue-500 transition-all">
                            <Search size={14} className="text-[var(--text-muted)] group-focus-within:text-blue-600" />
                            <input
                                type="text"
                                placeholder="Search trips..."
                                className="bg-transparent outline-none text-sm font-medium text-[var(--text-primary)] w-full placeholder:text-[var(--text-muted)]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button 
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`h-11 px-4 rounded-xl border transition-all flex items-center gap-2 font-bold text-[10px] uppercase ${
                                autoRefresh 
                                    ? 'bg-brand text-white border-brand ' 
                                    : 'bg-surface border-slate-200 dark:border-slate-800 text-content hover:bg-background'
                            }`}
                        >
                            <Activity size={14} className={autoRefresh ? 'animate-pulse' : ''} />
                            Auto Refresh
                        </button>

                        <button 
                            onClick={loadActiveTrips} 
                            className="w-11 h-11 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 transition-all "
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>

                        <button 
                            onClick={() => setShowAdvancedView(!showAdvancedView)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                                showAdvancedView 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)]'
                            }`}
                        >
                            <Activity size={14} />
                            {showAdvancedView ? 'Basic View' : 'Advanced View'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                    { label: 'Active Trips', value: activeTrips.length, icon: <Navigation size={18} />, color: 'blue-600' },
                    { label: 'Assigned', value: activeTrips.filter(t => t.status === 'ASSIGNED' || t.status === 'ACCEPTED').length, icon: <CheckCircle size={18} />, color: 'cyan-500' },
                    { label: 'En Route', value: activeTrips.filter(t => t.status === 'EN_ROUTE' || t.status === 'ARRIVED').length, icon: <Car size={18} />, color: 'blue-500' },
                    { label: 'Service Active', value: activeTrips.filter(t => t.status === 'IN_PROGRESS').length, icon: <Activity size={18} />, color: 'purple-500' },
                    { label: 'Active Alerts', value: alerts.length, icon: <AlertTriangle size={18} />, color: 'red-500' }
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

            {/* Alerts Section */}
            {showAdvancedView && alerts.length > 0 && (
                <div className="bg-[var(--card)] rounded-xl border border-[var(--border)]  overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--border)] bg-red-50">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-red-600" size={20} />
                            <h3 className="text-lg font-bold text-red-900">Active Alerts</h3>
                            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">{alerts.length}</span>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {alerts.map((alert) => (
                            <div key={alert.id} className={`p-4 rounded-xl border ${
                                alert.severity === 'HIGH' ? 'bg-red-50 border-red-200' :
                                alert.severity === 'MEDIUM' ? 'bg-orange-50 border-orange-200' :
                                'bg-yellow-50 border-yellow-200'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${
                                            alert.severity === 'HIGH' ? 'bg-red-500' :
                                            alert.severity === 'MEDIUM' ? 'bg-orange-500' :
                                            'bg-yellow-500'
                                        }`} />
                                        <div>
                                            <p className={`text-sm font-bold ${
                                                alert.severity === 'HIGH' ? 'text-red-900' :
                                                alert.severity === 'MEDIUM' ? 'text-orange-900' :
                                                'text-yellow-900'
                                            }`}>{alert.message}</p>
                                            <p className="text-xs text-[var(--text-muted)] font-semibold">Trip {alert.tripId} • {alert.timestamp}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            alert.severity === 'HIGH' ? 'bg-red-600 text-white' :
                                            alert.severity === 'MEDIUM' ? 'bg-orange-600 text-white' :
                                            'bg-yellow-600 text-white'
                                        }`}>
                                            {alert.severity}
                                        </span>
                                        <button className="px-3 py-1 bg-gray-200 text-white/80 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-all">
                                            Acknowledge
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Trips Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-2 flex items-center justify-center py-24">
                        <div className="w-10 h-10 border-4 border-brand/10 border-t-brand rounded-full animate-spin" />
                    </div>
                ) : filteredTrips.length === 0 ? (
                    <div className="col-span-2 flex flex-col items-center justify-center py-24">
                        <Shield className="opacity-20 mb-3" size={48} />
                        <p className="text-sm font-bold text-content-subtle opacity-60">No active trips</p>
                    </div>
                ) : (
                    filteredTrips.map((trip) => (
                        <motion.div
                            key={trip.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[var(--card)] rounded-xl border border-[var(--border)]  overflow-hidden"
                        >
                            {/* Trip Header */}
                            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center uppercase">
                                            {trip.driverName[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text-primary)] capitalize">{trip.driverName}</p>
                                            <p className="text-xs font-semibold text-[var(--text-muted)] font-mono tracking-wide">{trip.driverId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border ${
                                            trip.status === 'ASSIGNED' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                            trip.status === 'ACCEPTED' ? 'bg-cyan-50 text-cyan-600 border-cyan-200' :
                                            trip.status === 'EN_ROUTE' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                            trip.status === 'ARRIVED' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                            trip.status === 'IN_PROGRESS' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                            trip.status === 'RETURNING' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                            'bg-white/[0.02] text-white/60 border-white/10'
                                        }`}>
                                            {getStatusLabel(trip.status)}
                                        </div>
                                        {trip.alerts && trip.alerts.length > 0 && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
                                                <AlertTriangle size={12} className="text-red-500" />
                                                <span className="text-xs font-bold text-red-600">{trip.alerts.length}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                                    <Car size={12} />
                                    <span className="uppercase tracking-wider">{trip.vehicleNumber}</span>
                                    <span className="mx-2">•</span>
                                    <span className="font-mono">{trip.id}</span>
                                </div>
                            </div>

                            {/* Trip Details */}
                            <div className="p-4 space-y-4">
                                {/* Customer */}
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-blue-600" />
                                    <span className="text-sm font-bold text-[var(--text-primary)] capitalize">{trip.customerName}</span>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <MapPin size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Current Location</p>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{trip.currentLocation}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Navigation size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Destination</p>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{trip.destination}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => contactDriver(trip)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                                    >
                                        <Phone size={14} />
                                        Call Driver
                                    </button>
                                    <button
                                        onClick={() => contactCustomer(trip)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                                    >
                                        <MessageCircle size={14} />
                                        Call Customer
                                    </button>
                                    <button
                                        onClick={() => viewOnMap(trip)}
                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-semibold hover:bg-gray-700 transition-colors"
                                    >
                                        <MapPin size={14} />
                                        Map
                                    </button>
                                </div>

                                {/* Advanced Features */}
                                {showAdvancedView && (
                                    <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                                        {/* Speed & Idle Detection */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Speed</p>
                                                <p className="text-lg font-bold text-[var(--text-primary)]">{trip.speed} km/h</p>
                                            </div>
                                            <div className={`text-center p-3 rounded-lg border ${
                                                trip.idleTime > 10 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
                                            }`}>
                                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Idle Time</p>
                                                <p className={`text-lg font-bold ${
                                                    trip.idleTime > 10 ? 'text-red-600' : 'text-emerald-600'
                                                }`}>{trip.idleTime}min</p>
                                                {trip.idleTime > 10 && (
                                                    <div className="flex items-center justify-center gap-1 mt-1">
                                                        <AlertTriangle size={12} className="text-red-500" />
                                                        <span className="text-xs font-semibold text-red-600">Alert</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Route Status with Enhanced Alerts */}
                                        <div className={`p-3 rounded-lg border ${
                                            trip.routeDeviation 
                                                ? 'bg-orange-50 border-orange-200' 
                                                : 'bg-emerald-50 border-emerald-200'
                                        }`}>
                                            <div className="flex items-center gap-2">
                                                {trip.routeDeviation ? (
                                                    <>
                                                        <AlertTriangle size={14} className="text-orange-500" />
                                                        <span className="text-sm font-bold text-orange-900">Route Deviation Detected</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle size={14} className="text-emerald-500" />
                                                        <span className="text-sm font-bold text-emerald-900">On Planned Route</span>
                                                    </>
                                                )}
                                            </div>
                                            {trip.routeDeviation && (
                                                <div className="mt-2 flex gap-2">
                                                    <button className="px-2 py-1 bg-orange-600 text-white text-xs font-semibold rounded hover:bg-orange-700 transition-colors">
                                                        Contact Driver
                                                    </button>
                                                    <button className="px-2 py-1 bg-gray-600 text-white text-xs font-semibold rounded hover:bg-gray-700 transition-colors">
                                                        View Route
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Active Alerts with Action Buttons */}
                                        {trip.alerts && trip.alerts.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Active Alerts</p>
                                                {trip.alerts.map((alert, idx) => (
                                                    <div key={idx} className={`p-3 rounded-lg text-xs border ${
                                                        alert.severity === 'HIGH' ? 'bg-red-50 text-red-800 border-red-200' :
                                                        alert.severity === 'MEDIUM' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                                                        'bg-yellow-50 text-yellow-800 border-yellow-200'
                                                    }`}>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${
                                                                    alert.severity === 'HIGH' ? 'bg-red-500' :
                                                                    alert.severity === 'MEDIUM' ? 'bg-orange-500' :
                                                                    'bg-yellow-500'
                                                                }`} />
                                                                <span className="font-semibold">{alert.message}</span>
                                                            </div>
                                                            <button className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                alert.severity === 'HIGH' ? 'bg-red-600 text-white hover:bg-red-700' :
                                                                alert.severity === 'MEDIUM' ? 'bg-orange-600 text-white hover:bg-orange-700' :
                                                                'bg-yellow-600 text-white hover:bg-yellow-700'
                                                            } transition-colors`}>
                                                                Resolve
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-[var(--text-muted)]">Trip Progress</span>
                                        <span className="text-blue-600">{Math.round(trip.progress)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${trip.progress}%` }}
                                            transition={{ duration: 0.5 }}
                                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                                        />
                                    </div>
                                </div>

                                {/* Time & Distance */}
                                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[var(--border)]">
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Started</p>
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{trip.startTime}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">ETA</p>
                                        <p className="text-sm font-bold text-blue-600">{trip.estimatedArrival}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Distance</p>
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{trip.distance}</p>
                                    </div>
                                </div>

                                {/* Last Update */}
                                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} className="text-[var(--text-muted)]" />
                                        <span className="text-xs font-semibold text-[var(--text-muted)]">Last Update</span>
                                    </div>
                                    <span className="text-xs font-bold text-[var(--text-primary)] font-mono">{trip.lastUpdate}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminLiveTracking;
