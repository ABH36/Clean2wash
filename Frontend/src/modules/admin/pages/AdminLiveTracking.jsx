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
    CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminLiveTracking = () => {
    const [activeTrips, setActiveTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [showAdvancedView, setShowAdvancedView] = useState(false);
    const [alerts, setAlerts] = useState([]);

    // Dummy data for demo
    useEffect(() => {
        loadActiveTrips();
    }, []);

    // Auto-refresh simulation
    useEffect(() => {
        if (!autoRefresh) return;
        
        const interval = setInterval(() => {
            // Simulate location updates
            setActiveTrips(prev => prev.map(trip => ({
                ...trip,
                lastUpdate: new Date().toLocaleTimeString(),
                progress: Math.min(100, trip.progress + Math.random() * 5)
            })));
        }, 5000);

        return () => clearInterval(interval);
    }, [autoRefresh]);

    const loadActiveTrips = () => {
        setLoading(true);
        setTimeout(() => {
            setActiveTrips([
                {
                    id: 'TRIP001',
                    driverName: 'Rajesh Kumar',
                    driverId: 'DRV001',
                    customerName: 'Priya Sharma',
                    vehicleNumber: 'KA-01-AB-1234',
                    currentLocation: 'Koramangala 5th Block, Bangalore',
                    destination: 'Indiranagar, Bangalore',
                    status: 'EN_ROUTE',
                    startTime: '10:00 AM',
                    estimatedArrival: '10:45 AM',
                    lastUpdate: new Date().toLocaleTimeString(),
                    progress: 45,
                    distance: '8.5 km',
                    speed: 35,
                    idleTime: 0,
                    routeDeviation: false,
                    alerts: []
                },
                {
                    id: 'TRIP002',
                    driverName: 'Vikram Singh',
                    driverId: 'DRV003',
                    customerName: 'Sneha Patel',
                    vehicleNumber: 'DL-03-EF-9012',
                    currentLocation: 'Whitefield Main Road, Bangalore',
                    destination: 'Electronic City, Bangalore',
                    status: 'WASHING',
                    startTime: '09:00 AM',
                    estimatedArrival: '11:30 AM',
                    lastUpdate: new Date().toLocaleTimeString(),
                    progress: 75,
                    distance: '15.2 km',
                    speed: 0,
                    idleTime: 8,
                    routeDeviation: false,
                    alerts: []
                },
                {
                    id: 'TRIP003',
                    driverName: 'Arjun Reddy',
                    driverId: 'DRV005',
                    customerName: 'Rahul Verma',
                    vehicleNumber: 'KA-05-IJ-7890',
                    currentLocation: 'HSR Layout Sector 2, Bangalore',
                    destination: 'BTM Layout, Bangalore',
                    status: 'EN_ROUTE',
                    startTime: '11:30 AM',
                    estimatedArrival: '12:15 PM',
                    lastUpdate: new Date().toLocaleTimeString(),
                    progress: 30,
                    distance: '6.8 km',
                    speed: 25,
                    idleTime: 12,
                    routeDeviation: true,
                    alerts: [
                        { type: 'IDLE', message: 'Driver idle for 12 minutes', severity: 'HIGH' },
                        { type: 'ROUTE_DEVIATION', message: 'Off planned route', severity: 'MEDIUM' }
                    ]
                },
                {
                    id: 'TRIP004',
                    driverName: 'Amit Sharma',
                    driverId: 'DRV002',
                    customerName: 'Kavya Nair',
                    vehicleNumber: 'MH-02-CD-5678',
                    currentLocation: 'Jayanagar 4th Block, Bangalore',
                    destination: 'JP Nagar, Bangalore',
                    status: 'RETURNING',
                    startTime: '08:30 AM',
                    estimatedArrival: '01:00 PM',
                    lastUpdate: new Date().toLocaleTimeString(),
                    progress: 90,
                    distance: '4.2 km',
                    speed: 40,
                    idleTime: 0,
                    routeDeviation: false,
                    alerts: []
                }
            ]);
            
            // Set global alerts
            setAlerts([
                { id: 1, type: 'IDLE', tripId: 'TRIP003', message: 'Driver DRV005 idle for 12 minutes', severity: 'HIGH', timestamp: new Date().toLocaleTimeString() },
                { id: 2, type: 'ROUTE_DEVIATION', tripId: 'TRIP003', message: 'Driver DRV005 off planned route', severity: 'MEDIUM', timestamp: new Date().toLocaleTimeString() }
            ]);
            
            setLoading(false);
        }, 800);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'EN_ROUTE': return 'blue';
            case 'WASHING': return 'purple';
            case 'RETURNING': return 'emerald';
            default: return 'slate';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'EN_ROUTE': return 'En Route';
            case 'WASHING': return 'Service Active';
            case 'RETURNING': return 'Returning';
            default: return status;
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
                        <div className="flex-1 lg:w-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-3 group focus-within:border-blue-500 transition-all">
                            <Search size={14} className="text-gray-500 group-focus-within:text-blue-600" />
                            <input
                                type="text"
                                placeholder="Search trips..."
                                className="bg-transparent outline-none text-sm font-medium text-gray-900 w-full placeholder:text-gray-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button 
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`h-11 px-4 rounded-xl border transition-all flex items-center gap-2 font-bold text-[10px] uppercase ${
                                autoRefresh 
                                    ? 'bg-brand text-white border-brand shadow-sm' 
                                    : 'bg-surface border-slate-200 dark:border-slate-800 text-content hover:bg-background'
                            }`}
                        >
                            <Activity size={14} className={autoRefresh ? 'animate-pulse' : ''} />
                            Auto Refresh
                        </button>

                        <button 
                            onClick={loadActiveTrips} 
                            className="w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-blue-600 transition-all shadow-sm"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>

                        <button 
                            onClick={() => setShowAdvancedView(!showAdvancedView)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                                showAdvancedView 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
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
                    { label: 'En Route', value: activeTrips.filter(t => t.status === 'EN_ROUTE').length, icon: <Car size={18} />, color: 'blue-500' },
                    { label: 'Service Active', value: activeTrips.filter(t => t.status === 'WASHING').length, icon: <Activity size={18} />, color: 'purple-500' },
                    { label: 'Returning', value: activeTrips.filter(t => t.status === 'RETURNING').length, icon: <TrendingUp size={18} />, color: 'emerald-500' },
                    { label: 'Active Alerts', value: alerts.length, icon: <AlertTriangle size={18} />, color: 'red-500' }
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

            {/* Alerts Section */}
            {showAdvancedView && alerts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
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
                                            <p className="text-xs text-gray-500 font-semibold">Trip {alert.tripId} • {alert.timestamp}</p>
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
                                        <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-all">
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
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                            {/* Trip Header */}
                            <div className="bg-gray-50 border-b border-gray-200 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center uppercase">
                                            {trip.driverName[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 capitalize">{trip.driverName}</p>
                                            <p className="text-xs font-semibold text-gray-500 font-mono tracking-wide">{trip.driverId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border ${
                                            trip.status === 'EN_ROUTE' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                            trip.status === 'WASHING' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                            trip.status === 'RETURNING' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                            'bg-gray-50 text-gray-600 border-gray-200'
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
                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
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
                                    <span className="text-sm font-bold text-gray-900 capitalize">{trip.customerName}</span>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <MapPin size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Current Location</p>
                                            <p className="text-sm font-semibold text-gray-900">{trip.currentLocation}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Navigation size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Destination</p>
                                            <p className="text-sm font-semibold text-gray-900">{trip.destination}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Advanced Features */}
                                {showAdvancedView && (
                                    <div className="space-y-3 pt-3 border-t border-gray-200">
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
                                        <span className="text-gray-500">Trip Progress</span>
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
                                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200">
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Started</p>
                                        <p className="text-sm font-bold text-gray-900">{trip.startTime}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">ETA</p>
                                        <p className="text-sm font-bold text-blue-600">{trip.estimatedArrival}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Distance</p>
                                        <p className="text-sm font-bold text-gray-900">{trip.distance}</p>
                                    </div>
                                </div>

                                {/* Last Update */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} className="text-gray-500" />
                                        <span className="text-xs font-semibold text-gray-500">Last Update</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900 font-mono">{trip.lastUpdate}</span>
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
