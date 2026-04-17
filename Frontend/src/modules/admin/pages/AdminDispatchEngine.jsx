import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Search, RefreshCw, MapPin, Clock, User, Car, Target, 
    TrendingUp, Activity, CheckCircle, AlertTriangle, Eye, Settings,
    Navigation, Shield, Star, Timer, Route, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminDispatchEngine = () => {
    const [pendingBookings, setPendingBookings] = useState([]);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [autoAssign, setAutoAssign] = useState(true);
    const [showAdvancedView, setShowAdvancedView] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [dispatchHistory, setDispatchHistory] = useState([]);

    // Dummy data for demo
    useEffect(() => {
        loadDispatchData();
    }, []);

    const loadDispatchData = () => {
        setLoading(true);
        setTimeout(() => {
            setPendingBookings([
                {
                    id: 'BK006',
                    customer: 'Anita Desai',
                    service: 'Premium Car Wash',
                    location: 'Koramangala, Bangalore',
                    coordinates: { lat: 12.9352, lng: 77.6245 },
                    priority: 'URGENT',
                    scheduledTime: '2024-04-15 02:30 PM',
                    amount: 599,
                    estimatedDuration: 45,
                    customerRating: 4.8,
                    specialRequests: 'Premium service required'
                },
                {
                    id: 'BK007',
                    customer: 'Rohit Sharma',
                    service: 'Interior Cleaning',
                    location: 'Indiranagar, Bangalore',
                    coordinates: { lat: 12.9716, lng: 77.6412 },
                    priority: 'HIGH',
                    scheduledTime: '2024-04-15 03:00 PM',
                    amount: 899,
                    estimatedDuration: 60,
                    customerRating: 4.5,
                    specialRequests: 'Pet hair removal needed'
                },
                {
                    id: 'BK008',
                    customer: 'Meera Patel',
                    service: 'Express Wash',
                    location: 'Whitefield, Bangalore',
                    coordinates: { lat: 12.9698, lng: 77.7500 },
                    priority: 'NORMAL',
                    scheduledTime: '2024-04-15 04:00 PM',
                    amount: 399,
                    estimatedDuration: 30,
                    customerRating: 4.2,
                    specialRequests: null
                }
            ]);

            setAvailableDrivers([
                {
                    id: 'DRV006',
                    name: 'Suresh Kumar',
                    currentLocation: 'Koramangala 4th Block',
                    coordinates: { lat: 12.9279, lng: 77.6271 },
                    reliabilityScore: 95,
                    completedJobs: 156,
                    rating: 4.9,
                    vehicleType: 'SEDAN',
                    status: 'AVAILABLE',
                    lastJobCompleted: '1 hour ago',
                    specializations: ['Premium Service', 'Luxury Cars'],
                    estimatedArrival: '8 min'
                },
                {
                    id: 'DRV007',
                    name: 'Prakash Singh',
                    currentLocation: 'Indiranagar Metro',
                    coordinates: { lat: 12.9784, lng: 77.6408 },
                    reliabilityScore: 88,
                    completedJobs: 203,
                    rating: 4.7,
                    vehicleType: 'HATCHBACK',
                    status: 'AVAILABLE',
                    lastJobCompleted: '30 min ago',
                    specializations: ['Interior Cleaning', 'Pet Care'],
                    estimatedArrival: '12 min'
                },
                {
                    id: 'DRV008',
                    name: 'Ramesh Reddy',
                    currentLocation: 'HSR Layout Sector 1',
                    coordinates: { lat: 12.9082, lng: 77.6476 },
                    reliabilityScore: 92,
                    completedJobs: 134,
                    rating: 4.8,
                    vehicleType: 'SUV',
                    status: 'AVAILABLE',
                    lastJobCompleted: '2 hours ago',
                    specializations: ['Express Service', 'Large Vehicles'],
                    estimatedArrival: '15 min'
                }
            ]);

            setDispatchHistory([
                {
                    id: 1,
                    bookingId: 'BK005',
                    driverId: 'DRV005',
                    driverName: 'Arjun Reddy',
                    assignedAt: '2024-04-15 01:45 PM',
                    method: 'AUTO',
                    distance: '2.3 km',
                    estimatedTime: '6 min',
                    actualTime: '8 min',
                    status: 'COMPLETED'
                },
                {
                    id: 2,
                    bookingId: 'BK004',
                    driverId: 'DRV002',
                    driverName: 'Amit Sharma',
                    assignedAt: '2024-04-15 01:30 PM',
                    method: 'MANUAL',
                    distance: '1.8 km',
                    estimatedTime: '5 min',
                    actualTime: '5 min',
                    status: 'COMPLETED'
                }
            ]);

            setLoading(false);
        }, 800);
    };

    const calculateDistance = (booking, driver) => {
        // Simple distance calculation for demo
        const lat1 = booking.coordinates.lat;
        const lng1 = booking.coordinates.lng;
        const lat2 = driver.coordinates.lat;
        const lng2 = driver.coordinates.lng;
        
        const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)) * 111; // Rough km conversion
        return distance.toFixed(1);
    };

    const calculateDriverScore = (booking, driver) => {
        const distance = parseFloat(calculateDistance(booking, driver));
        const distanceScore = Math.max(0, 100 - (distance * 10)); // Closer = higher score
        const reliabilityScore = driver.reliabilityScore;
        const ratingScore = driver.rating * 20; // Convert 5-star to 100-point scale
        
        // Weighted average
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

    const handleAutoAssign = (booking) => {
        const rankedDrivers = getRankedDrivers(booking);
        const bestDriver = rankedDrivers[0];
        
        if (bestDriver) {
            handleAssignDriver(booking.id, bestDriver.id, bestDriver.name, 'AUTO');
        }
    };

    const handleAssignDriver = (bookingId, driverId, driverName, method = 'MANUAL') => {
        // Remove booking from pending
        setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
        
        // Remove driver from available
        setAvailableDrivers(prev => prev.filter(d => d.id !== driverId));
        
        // Add to dispatch history
        const newDispatch = {
            id: Date.now(),
            bookingId,
            driverId,
            driverName,
            assignedAt: new Date().toLocaleString(),
            method,
            distance: '2.1 km',
            estimatedTime: '7 min',
            actualTime: null,
            status: 'ASSIGNED'
        };
        
        setDispatchHistory(prev => [newDispatch, ...prev]);
        
        toast.success(`${method === 'AUTO' ? 'Auto-assigned' : 'Assigned'} ${driverName} to booking ${bookingId}`);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'URGENT': return 'text-red-600 bg-red-50 border-red-200';
            case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'NORMAL': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const filteredBookings = pendingBookings.filter(b =>
        b.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.service.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10 max-w-full mx-auto px-4 bg-gray-50 min-h-screen">
            {/* Header Control Panel */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-gray-900">Dispatch Engine</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Intelligent Driver Assignment</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                        <div className="flex-1 lg:w-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-3 group focus-within:border-blue-500 transition-all">
                            <Search size={14} className="text-gray-500 group-focus-within:text-blue-600" />
                            <input
                                type="text"
                                placeholder="Search bookings..."
                                className="bg-transparent outline-none text-sm font-medium text-gray-900 w-full placeholder:text-gray-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button 
                            onClick={() => setAutoAssign(!autoAssign)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                                autoAssign 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Zap size={14} className={autoAssign ? 'animate-pulse' : ''} />
                            Auto Assign
                        </button>

                        <button 
                            onClick={loadDispatchData} 
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
                            <Settings size={14} />
                            {showAdvancedView ? 'Basic View' : 'Advanced View'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Pending Bookings', value: pendingBookings.length, icon: <Clock size={18} />, color: 'amber-500' },
                    { label: 'Available Drivers', value: availableDrivers.length, icon: <Users size={18} />, color: 'emerald-500' },
                    { label: 'Auto Assignments', value: dispatchHistory.filter(d => d.method === 'AUTO').length, icon: <Zap size={18} />, color: 'blue-600' },
                    { label: 'Avg Response Time', value: '6.2 min', icon: <Timer size={18} />, color: 'purple-500' }
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Bookings */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Pending Assignments</h2>
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full">
                            {filteredBookings.length} pending
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <CheckCircle className="mx-auto text-emerald-500 mb-3" size={48} />
                            <p className="text-lg font-bold text-gray-900 mb-2">All Caught Up!</p>
                            <p className="text-sm text-gray-500">No pending bookings to assign</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredBookings.map((booking) => (
                                <motion.div
                                    key={booking.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 font-bold text-lg flex items-center justify-center">
                                                    <Target size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 font-mono">{booking.id}</h3>
                                                    <p className="text-sm text-gray-600 font-semibold">{booking.service}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(booking.priority)}`}>
                                                    {booking.priority}
                                                </div>
                                                {autoAssign && (
                                                    <button
                                                        onClick={() => handleAutoAssign(booking)}
                                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2"
                                                    >
                                                        <Zap size={14} />
                                                        Auto Assign
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Customer</p>
                                                <p className="text-sm font-bold text-gray-900">{booking.customer}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Star size={12} className="text-yellow-500 fill-current" />
                                                    <span className="text-xs font-semibold text-gray-600">{booking.customerRating}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={12} className="text-gray-500" />
                                                    <p className="text-sm font-bold text-gray-900">{booking.location}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Amount</p>
                                                <p className="text-lg font-bold text-blue-600">₹{booking.amount}</p>
                                            </div>
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                                                <p className="text-lg font-bold text-gray-900">{booking.estimatedDuration}min</p>
                                            </div>
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Scheduled</p>
                                                <p className="text-sm font-bold text-gray-900">{booking.scheduledTime.split(' ')[1]}</p>
                                            </div>
                                        </div>

                                        {booking.specialRequests && (
                                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">Special Requests</p>
                                                <p className="text-sm text-blue-800 font-medium">{booking.specialRequests}</p>
                                            </div>
                                        )}

                                        {showAdvancedView && (
                                            <div className="border-t border-gray-200 pt-4">
                                                <h4 className="text-sm font-bold text-gray-900 mb-3">Recommended Drivers</h4>
                                                <div className="space-y-2">
                                                    {getRankedDrivers(booking).slice(0, 3).map((driver, idx) => (
                                                        <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                                                    idx === 0 ? 'bg-emerald-600 text-white' :
                                                                    idx === 1 ? 'bg-blue-600 text-white' :
                                                                    'bg-gray-600 text-white'
                                                                }`}>
                                                                    {idx + 1}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-900">{driver.name}</p>
                                                                    <p className="text-xs text-gray-500">{driver.distance}km • {driver.estimatedArrival}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-right">
                                                                    <p className="text-sm font-bold text-gray-900">Score: {driver.score}</p>
                                                                    <div className="flex items-center gap-1">
                                                                        <Star size={10} className="text-yellow-500 fill-current" />
                                                                        <span className="text-xs text-gray-600">{driver.rating}</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleAssignDriver(booking.id, driver.id, driver.name)}
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
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Drivers & Dispatch History */}
                <div className="space-y-6">
                    {/* Available Drivers */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-emerald-50">
                            <div className="flex items-center gap-3">
                                <Users className="text-emerald-600" size={20} />
                                <h3 className="text-lg font-bold text-emerald-900">Available Drivers</h3>
                                <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">{availableDrivers.length}</span>
                            </div>
                        </div>
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                            {availableDrivers.map((driver) => (
                                <div key={driver.id} className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center uppercase">
                                                {driver.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{driver.name}</p>
                                                <p className="text-xs text-gray-500 font-mono">{driver.id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1">
                                                <Star size={12} className="text-yellow-500 fill-current" />
                                                <span className="text-sm font-bold text-gray-900">{driver.rating}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{driver.completedJobs} jobs</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={12} className="text-gray-500" />
                                            <p className="text-xs text-gray-600 font-semibold">{driver.currentLocation}</p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-gray-500">Reliability</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-emerald-500 h-2 rounded-full" 
                                                        style={{ width: `${driver.reliabilityScore}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-emerald-600">{driver.reliabilityScore}%</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {driver.specializations.map((spec, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Dispatch History */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                            <div className="flex items-center gap-3">
                                <Activity className="text-blue-600" size={20} />
                                <h3 className="text-lg font-bold text-blue-900">Recent Assignments</h3>
                            </div>
                        </div>
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                            {dispatchHistory.map((dispatch) => (
                                <div key={dispatch.id} className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-bold text-gray-900 font-mono">{dispatch.bookingId}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                dispatch.method === 'AUTO' 
                                                    ? 'bg-emerald-100 text-emerald-800' 
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {dispatch.method}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                dispatch.status === 'COMPLETED' 
                                                    ? 'bg-emerald-100 text-emerald-800' 
                                                    : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {dispatch.status}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">{dispatch.driverName}</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                        <div>Distance: {dispatch.distance}</div>
                                        <div>Time: {dispatch.actualTime || dispatch.estimatedTime}</div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">{dispatch.assignedAt}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDispatchEngine;