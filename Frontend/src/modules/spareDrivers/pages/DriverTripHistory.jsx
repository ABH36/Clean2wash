import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
    Calendar, MapPin, Clock, DollarSign, Star, 
    ChevronRight, Filter, Search, TrendingUp, Award,
    Navigation, Phone, MessageSquare, User
} from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { useTheme } from '../../../context/ThemeContext';
import StarRating from '../../../components/StarRating';

const DriverTripHistory = () => {
    const { isDarkMode } = useTheme();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, rated, unrated
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalTrips: 0,
        totalEarnings: 0,
        avgRating: 0,
        ratedTrips: 0
    });

    useEffect(() => {
        fetchTripHistory();
    }, []);

    const fetchTripHistory = async () => {
        try {
            setLoading(true);
            const response = await spareDriverAPI.getTripHistory();
            const tripData = response.data.trips || [];
            
            setTrips(tripData);
            
            // Calculate stats
            const totalTrips = tripData.length;
            const totalEarnings = tripData.reduce((sum, trip) => sum + (trip.pricing?.driverEarning || 0), 0);
            const ratedTrips = tripData.filter(trip => trip.feedback?.rating).length;
            const avgRating = ratedTrips > 0
                ? tripData.reduce((sum, trip) => sum + (trip.feedback?.rating || 0), 0) / ratedTrips
                : 0;
            
            setStats({
                totalTrips,
                totalEarnings,
                avgRating,
                ratedTrips
            });
        } catch (error) {
            console.error('Error fetching trip history:', error);
            toast.error('Failed to load trip history');
        } finally {
            setLoading(false);
        }
    };

    const filteredTrips = trips.filter(trip => {
        // Filter by rating status
        if (filter === 'rated' && !trip.feedback?.rating) return false;
        if (filter === 'unrated' && trip.feedback?.rating) return false;
        
        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesUser = trip.consumer?.name?.toLowerCase().includes(query);
            const matchesBookingId = trip.bookingId?.toLowerCase().includes(query);
            const matchesLocation = trip.location?.address?.street?.toLowerCase().includes(query);
            
            return matchesUser || matchesBookingId || matchesLocation;
        }
        
        return true;
    });

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRatingColor = (rating) => {
        if (rating >= 4.5) return 'text-green-500';
        if (rating >= 3.5) return 'text-yellow-500';
        if (rating >= 2.5) return 'text-orange-500';
        return 'text-red-500';
    };

    if (loading) {
        return (
            <DriverLayout title="Trip History">
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm font-black text-content/40 uppercase tracking-widest">
                            Loading History...
                        </p>
                    </div>
                </div>
            </DriverLayout>
        );
    }

    return (
        <DriverLayout title="Trip History">
            <div className="px-6 py-6 space-y-6 pb-24">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface border border-content/[0.04] rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={16} className="text-green-500" />
                            <p className="text-[7px] font-black text-content/20 uppercase tracking-widest">
                                Total Trips
                            </p>
                        </div>
                        <p className="text-2xl font-black text-content tabular-nums">
                            {stats.totalTrips}
                        </p>
                    </div>

                    <div className="bg-surface border border-content/[0.04] rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={16} className="text-green-500" />
                            <p className="text-[7px] font-black text-content/20 uppercase tracking-widest">
                                Total Earned
                            </p>
                        </div>
                        <p className="text-2xl font-black text-content tabular-nums">
                            ₹{stats.totalEarnings}
                        </p>
                    </div>

                    <div className="bg-surface border border-content/[0.04] rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Star size={16} className="text-yellow-500" />
                            <p className="text-[7px] font-black text-content/20 uppercase tracking-widest">
                                Avg Rating
                            </p>
                        </div>
                        <p className="text-2xl font-black text-content tabular-nums">
                            {stats.avgRating.toFixed(1)}
                        </p>
                    </div>

                    <div className="bg-surface border border-content/[0.04] rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Award size={16} className="text-brand" />
                            <p className="text-[7px] font-black text-content/20 uppercase tracking-widest">
                                Rated Trips
                            </p>
                        </div>
                        <p className="text-2xl font-black text-content tabular-nums">
                            {stats.ratedTrips}/{stats.totalTrips}
                        </p>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-content/20" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by customer, booking ID, location..."
                            className="w-full h-12 pl-12 pr-4 bg-surface border border-content/[0.04] rounded-xl text-sm font-bold text-content placeholder:text-content/20 focus:outline-none focus:border-brand/20"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2">
                        {[
                            { id: 'all', label: 'All Trips', count: trips.length },
                            { id: 'rated', label: 'Rated', count: stats.ratedTrips },
                            { id: 'unrated', label: 'Unrated', count: stats.totalTrips - stats.ratedTrips }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                    filter === tab.id
                                        ? 'bg-brand text-white'
                                        : 'bg-surface border border-content/[0.04] text-content/40'
                                }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Trip List */}
                <div className="space-y-3">
                    {filteredTrips.length === 0 ? (
                        <div className="h-[40vh] flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-full bg-content/[0.02] flex items-center justify-center mb-4">
                                <Calendar size={32} className="text-content/20" />
                            </div>
                            <p className="text-sm font-black text-content/40 uppercase tracking-wider">
                                No trips found
                            </p>
                            <p className="text-[10px] font-bold text-content/20 mt-2">
                                {searchQuery ? 'Try a different search' : 'Complete trips will appear here'}
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filteredTrips.map((trip, index) => (
                                <motion.div
                                    key={trip._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-surface border border-content/[0.04] rounded-2xl p-4 space-y-4"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-[8px] font-black text-brand uppercase tracking-widest">
                                                    {trip.bookingId}
                                                </p>
                                                {trip.feedback?.rating && (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 rounded-full">
                                                        <Star size={10} className="fill-yellow-500 text-yellow-500" />
                                                        <span className={`text-[9px] font-black ${getRatingColor(trip.feedback.rating)}`}>
                                                            {trip.feedback.rating.toFixed(1)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-black text-content uppercase tracking-tight">
                                                {trip.service?.name || 'Chauffeur Service'}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-green-500 tabular-nums">
                                                ₹{trip.pricing?.driverEarning || 0}
                                            </p>
                                            <p className="text-[7px] font-black text-content/20 uppercase">
                                                Earned
                                            </p>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="flex items-center gap-3 p-3 bg-content/[0.02] rounded-xl">
                                        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                                            <User size={18} className="text-brand" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-content/20 uppercase tracking-widest mb-0.5">
                                                Customer
                                            </p>
                                            <p className="text-xs font-black text-content truncate">
                                                {trip.consumer?.name || 'Customer'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-start gap-3">
                                        <MapPin size={14} className="text-brand mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-content/20 uppercase tracking-widest mb-0.5">
                                                Pickup Location
                                            </p>
                                            <p className="text-[10px] font-bold text-content line-clamp-2">
                                                {trip.location?.address?.street || 'Location not available'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Date & Time */}
                                    <div className="flex items-center gap-4 pt-3 border-t border-content/[0.04]">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} className="text-content/20" />
                                            <span className="text-[9px] font-bold text-content/40">
                                                {formatDate(trip.tracking?.completedAt || trip.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="text-content/20" />
                                            <span className="text-[9px] font-bold text-content/40">
                                                {formatTime(trip.tracking?.completedAt || trip.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Rating Display */}
                                    {trip.feedback?.rating && (
                                        <div className="pt-3 border-t border-content/[0.04]">
                                            <p className="text-[8px] font-black text-content/20 uppercase tracking-widest mb-2">
                                                Customer Rating
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <StarRating 
                                                    rating={trip.feedback.rating} 
                                                    readonly={true}
                                                    size={20}
                                                />
                                                <span className={`text-sm font-black ${getRatingColor(trip.feedback.rating)}`}>
                                                    {trip.feedback.rating.toFixed(1)}
                                                </span>
                                            </div>
                                            {trip.feedback.review && (
                                                <div className="mt-3 p-3 bg-content/[0.02] rounded-xl">
                                                    <p className="text-[10px] font-bold text-content/60 italic">
                                                        "{trip.feedback.review}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* No Rating Yet */}
                                    {!trip.feedback?.rating && (
                                        <div className="pt-3 border-t border-content/[0.04]">
                                            <div className="flex items-center gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                                                <Star size={14} className="text-yellow-500" />
                                                <p className="text-[9px] font-bold text-yellow-600 dark:text-yellow-500">
                                                    Customer hasn't rated this trip yet
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </DriverLayout>
    );
};

export default DriverTripHistory;
