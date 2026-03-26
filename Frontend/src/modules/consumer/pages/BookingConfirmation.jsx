import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Clock, MapPin, Car, Shield, Star, Calendar,
    ChevronLeft, Home, Phone, MessageSquare, Navigation, Zap,
    Timer, Droplets, Camera, ArrowRight, User, Package
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { toast } from 'react-hot-toast';
import { bookingAPI } from '../../../utils/api';
import VerifiedBadge from '../components/ui/VerifiedBadge';

const BookingConfirmation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { bookingId, provider, type, plan, society, parking, slot } = location.state || {};
    const [loading, setLoading] = useState(!!bookingId && type !== 'subscription');

    // Standard Job State Machine (as per document)
    const JOB_STATES = {
        CREATED: 'CREATED',
        ASSIGNED: 'ASSIGNED',
        CAPTAIN_EN_ROUTE: 'CAPTAIN_EN_ROUTE',
        ARRIVED: 'ARRIVED',
        BEFORE_PHOTO_DONE: 'BEFORE_PHOTO_DONE',
        IN_PROGRESS: 'IN_PROGRESS',
        AFTER_PHOTO_DONE: 'AFTER_PHOTO_DONE',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED',
        FAILED: 'FAILED'
    };

    // Mock booking data - in real app this would come from API or context
    const [bookingData, setBookingData] = useState({
        id: bookingId || (type === 'subscription' ? 'SUB' : 'BK') + Date.now(),
        serviceName: type === 'subscription' ? plan : 'Full Studio Clean',
        vehicle: 'Multiple/Subscription',
        vehicleId: 'VH001', // Core Vehicle Object
        price: type === 'subscription' ? '-' : '₹1299',
        type: type || 'scheduled',
        status: type === 'subscription' ? 'ACTIVE' : JOB_STATES.ASSIGNED, // Using proper job state machine
        timestamp: new Date().toISOString(),
        location: type === 'subscription' ? (society || 'Your Apartment') : '123, Sector 15, Gurgaon, Haryana 122001',
        coordinates: { lat: 28.4526, lng: 77.0345 }, // GPS coordinates for tracking
        provider: provider || 'vendor',
        scheduledDate: 'Monthly',
        scheduledTime: '6:00 AM',
        estimatedDuration: 'Daily',
        userId: 'USR001', // Core User Object
        jobId: 'JOB' + Date.now(), // Core Job Object
        insuranceExpiry: '2024-12-31', // Vehicle insurance info
        pucExpiry: '2024-11-30', // PUC expiry info
        subscriptionId: type === 'subscription' ? (bookingId || 'SUB' + Date.now()) : 'SUB001', // Subscription engine
        photos: {
            before: [],
            after: []
        },
        geoTagged: true, // Geo-tagged photos requirement
        timestampLock: true, // Timestamp lock requirement
        captain: {
            id: 'CAP001',
            name: 'Society Supervisor',
            phone: '+91 98765 43210',
            rating: 4.9,
            photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
            capabilities: ['cluster', 'apartment'], // Capability tagging
            isOnline: true, // Online/offline toggle
        },
        vendor: {
            id: 'VEND001',
            name: 'Studio Pro Detailers',
            sla: { pickup: '30min', delivery: '4hrs', quality: 'A+' }, // Vendor SLA tracking
            location: 'Sector 15, Gurgaon'
        }
    });

    const [activeTab, setActiveTab] = useState('details');
    const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 30, seconds: 0 });
    const [showSOS, setShowSOS] = useState(false);

    // Pricing Engine
    const pricingEngine = {
        basePrice: 1299,
        vehicleMultiplier: {
            'hatchback': 1.0,
            'sedan': 1.2,
            'suv': 1.5,
            'muv': 1.4,
            'compact suv': 1.4,
            'luxury sedan': 2.0,
            'luxury suv': 2.2,
            'coupe': 1.8,
            'convertible': 2.0,
            'sports car': 2.5,
            'supercar': 3.0,
            'ev': 1.2,
            'mini truck': 1.8,
            'truck': 2.5,
            'van': 1.8,
            'tractor': 2.0,
            'vintage': 2.5,
            'bike': 0.6,
            'scooter': 0.5,
            'superbike': 0.9,
            'luxury': 2.0
        },
        cityPricing: {
            'gurgaon': 1.0,
            'delhi': 1.1,
            'mumbai': 1.2,
            'bangalore': 1.15
        },
        surgeMultiplier: 1.0, // Peak surge pricing
        subscriptionDiscount: 0.1, // 10% discount for subscribers
        corporateDiscount: 0.15 // 15% discount for corporate
    };

    // Exception Handling System
    const exceptionHandlers = {
        captainNoShow: () => {
            console.log('Captain no-show - Auto reassigning...');
            // Auto reassignment logic
        },
        customerUnreachable: () => {
            console.log('Customer unreachable - Sending notifications...');
            // WhatsApp/SMS fallback
        },
        paymentFailure: () => {
            console.log('Payment failed - Retry mechanism...');
            // Payment retry logic
        },
        rainInterruption: () => {
            console.log('Rain detected - Rescheduling...');
            // Weather-based rescheduling
        }
    };

    const [alerts, setAlerts] = useState([
        { type: 'insurance', message: 'Vehicle insurance expires on 31st Dec 2024', priority: 'high' },
        { type: 'puc', message: 'PUC certificate expires on 30th Nov 2024', priority: 'medium' },
        { type: 'subscription', message: 'Subscription renewal due in 15 days', priority: 'low' },
        { type: 'weather', message: 'Rain expected at 3 PM - Service may be delayed', priority: 'medium' },
        { type: 'promotional', message: 'Get 20% off on your next wash - Use SAVE20', priority: 'low' }
    ]);

    // Corporate Module Data
    const corporateData = {
        accountId: 'CORP001',
        companyName: 'Tech Solutions Pvt Ltd',
        fleetSize: 25,
        employeeBenefit: true,
        monthlyBilling: true,
        dedicatedCaptain: true,
        slaDashboard: {
            onTimeRate: '98%',
            satisfactionScore: '4.7',
            monthlyWashes: 245
        }
    };

    // Apartment Module Data
    const apartmentData = {
        societyId: 'SOC' + (society?.substring(0, 3)?.toUpperCase() || '001'),
        societyName: society || 'Green Valley Apartments',
        totalResidents: 150, // This could be dynamic later
        activeResidents: 89,
        routeClustering: true,
        dedicatedSlots: slot ? [slot] : ['9AM-11AM', '2PM-4PM'],
        demandHeatmap: {
            morning: 45,
            afternoon: 32,
            evening: 12
        },
        parking: parking || {}
    };

    // Route & Cluster Optimization
    const routeOptimization = {
        batchVehicleAssignment: true,
        timeSlotRouting: true,
        captainRoutePlanning: true,
        parkingLotBulkMode: true,
        demandHeatmap: {
            'sector-15': { morning: 12, afternoon: 8, evening: 3 },
            'sector-56': { morning: 8, afternoon: 15, evening: 6 },
            'cyber-hub': { morning: 5, afternoon: 20, evening: 12 }
        }
    };

    // E-Commerce Marketplace
    const eCommerceData = {
        cart: [
            { id: 'PROD001', name: 'Car Wax', price: 299, quantity: 1, delivery: '1-hour' },
            { id: 'PROD002', name: 'Microfiber Cloth', price: 199, quantity: 2, delivery: '1-hour' }
        ],
        ownBrand: {
            priority: true,
            highMargin: true,
            products: ['Premium Wax', 'Dashboard Polish', 'Tire Shine']
        },
        deliveryCaptain: {
            id: 'DELIVERY001',
            name: 'Amit Sharma',
            phone: '+91 98765 1111',
            estimatedDelivery: '45 mins'
        }
    };

    // Performance & Scale Readiness
    const performanceMetrics = {
        cachingLayer: 'Redis',
        queueSystem: 'RabbitMQ',
        retryMechanisms: 3,
        offlineCaptainSupport: true,
        imageCompression: 'WebP',
        monitoring: 'Datadog',
        logs: 'ELK Stack'
    };

    // Supply & Operations Strategy
    const operationsData = {
        captainOnboarding: {
            funnel: 'Application → Verification → Training → Activation',
            minimumEarnings: '₹15,000/month',
            supplyHeatmap: 'Real-time GPS tracking'
        },
        vendorOnboarding: {
            funnel: 'Registration → KYC → Quality Check → Integration',
            qualityStandards: 'ISO 9001',
            fieldSOPs: 'Standard Operating Procedures'
        }
    };
    const handleSOS = () => {
        // Capture live GPS & job data
        const sosData = {
            userId: bookingData.userId,
            jobId: bookingData.jobId,
            location: bookingData.coordinates,
            timestamp: new Date().toISOString(),
            captainId: bookingData.captain.id,
            emergency: true
        };

        console.log('SOS Triggered:', sosData);
        // In real app: Send to control room, alert trusted contacts, enable live tracking
        toast.error('SOS Alert Sent! Emergency contacts and control room notified.', {
            icon: '🚨',
            duration: 6000,
            style: {
                background: '#ef4444',
                color: '#fff',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '10px'
            }
        });
    };

    // Fetch real booking data
    useEffect(() => {
        const fetchBooking = async () => {
            if (!bookingId) return;
            try {
                const res = await bookingAPI.getBooking(bookingId);
                if (res.status === 'success') {
                    const b = res.data.booking;
                    setBookingData({
                        id: b.bookingId || b._id,
                        serviceName: b.service.name,
                        vehicle: b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Selected Vehicle',
                        vehicleId: b.vehicle?._id,
                        price: `₹${b.pricing.totalAmount}`,
                        pricing: b.pricing, // Store full pricing object
                        type: b.schedule.type,
                        status: b.status.toUpperCase(),
                        timestamp: b.createdAt,
                        location: b.location.address.street + (b.location.address.city ? `, ${b.location.address.city}` : ''),
                        coordinates: b.location.address.coordinates,
                        provider: b.service.type,
                        scheduledDate: b.schedule.date ? new Date(b.schedule.date).toLocaleDateString() : 'Today',
                        scheduledTime: b.schedule.timeSlot?.start || '10:00 AM',
                        estimatedDuration: b.schedule.estimatedDuration || '1 hr',
                        userId: b.consumer,
                        jobId: b._id,
                        captain: b.provider.id ? {
                            name: b.provider.name,
                            phone: b.provider.phone,
                            photo: b.provider.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
                            rating: b.provider.rating || 4.8,
                            isVerified: true // Assumption: All assigned partners are verified
                        } : {
                            name: b.service.category === 'Chauffeur' ? 'Assigning Chauffeur' : 'Assigning Captain',
                            phone: '',
                            photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
                            rating: 5.0
                        }
                    });
                }
            } catch (err) {
                console.error("Failed to fetch booking details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [bookingId]);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                } else if (prev.hours > 0) {
                    return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                }
                return prev;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'CREATED': return 'text-gray-600 bg-gray-50 border-gray-200';
            case 'ASSIGNED': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'CAPTAIN_EN_ROUTE': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'ARRIVED': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
            case 'BEFORE_PHOTO_DONE': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'IN_PROGRESS': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'AFTER_PHOTO_DONE': return 'text-pink-600 bg-pink-50 border-pink-200';
            case 'COMPLETED': return 'text-green-600 bg-green-50 border-green-200';
            case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200';
            case 'FAILED': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const formatTimeLeft = () => {
        return `${timeLeft.hours.toString().padStart(2, '0')}:${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`;
    };

    return (
        <MobileLayout>
            {/* Header */}
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
                        className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={16} strokeWidth={2.5} className="text-content" />
                    </motion.button>
                    <div className="flex-1">
                        <h1 className="text-base font-black tracking-tight text-content leading-none">
                            {bookingData.status === 'COMPLETED' ? 'Booking Completed' : 'Booking Confirmed'}
                        </h1>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className={`w-1 h-1 rounded-full animate-pulse ${bookingData.status === 'COMPLETED' ? 'bg-green-500' : 'bg-orange-500'}`} />
                            <p className={`text-[8px] font-black uppercase tracking-widest ${bookingData.status === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'}`}>
                                {bookingData.status}
                            </p>
                        </div>
                    </div>
                    {/* SOS Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSOS}
                        className="w-8 h-8 bg-red-500 border border-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20"
                    >
                        <Phone size={16} strokeWidth={2.5} className="text-white" />
                    </motion.button>
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-2 rounded-xl border-2 flex items-center justify-center gap-2 ${getStatusColor(bookingData.status)}`}>
                    <CheckCircle2 size={16} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                        {bookingData.status === 'SCHEDULED' ? 'Service Scheduled' :
                            bookingData.status === 'ASSIGNED' ? 'Captain Assigned' :
                                bookingData.status === 'IN_PROGRESS' ? 'Service in Progress' : 'Service Completed'}
                    </span>
                </div>
            </header>

            <div className="px-4 pb-32 space-y-4 pt-3">

                {/* Success Animation */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="w-16 h-16 bg-brand rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand/20"
                    >
                        <CheckCircle2 size={32} className="text-white" strokeWidth={3} />
                    </motion.div>
                    <h2 className="text-lg font-black text-brand uppercase tracking-tight mb-2">Booking Successful!</h2>
                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-wider mb-4">
                        Booking ID: {bookingData.id}
                    </p>

                    {/* Countdown Timer */}
                    {bookingData.status === 'SCHEDULED' && (
                        <div className="bg-white rounded-xl p-3 border border-orange-200">
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-wider mb-1">Service Starts In</p>
                            <p className="text-xl font-black text-brand tracking-tighter">{formatTimeLeft()}</p>
                        </div>
                    )}
                </motion.div>

                {/* Smart Alerts Section */}
                {alerts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl border border-gray-100 p-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Smart Alerts</p>
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            {alerts.map((alert, i) => (
                                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${alert.priority === 'high' ? 'bg-red-50 border-red-200' :
                                    alert.priority === 'medium' ? 'bg-orange-50 border-orange-200' :
                                        'bg-blue-50 border-blue-200'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${alert.priority === 'high' ? 'bg-red-500' :
                                        alert.priority === 'medium' ? 'bg-orange-500' :
                                            'bg-blue-500'
                                        }`} />
                                    <p className="text-[8px] font-semibold text-content leading-tight flex-1">{alert.message}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl border border-gray-100 p-1">
                    <div className="grid grid-cols-2 gap-1 mb-1">
                        {[
                            { id: 'details', label: 'Details', icon: Package },
                            { id: 'captain', label: 'Captain', icon: User },
                            { id: 'tracking', label: 'Tracking', icon: Navigation },
                            { id: 'pricing', label: 'Pricing', icon: Star }
                        ].map(tab => (
                            <button key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[8.5px] font-black uppercase tracking-wide transition-all ${activeTab === tab.id
                                    ? 'bg-brand text-white shadow-sm'
                                    : 'text-content-subtle hover:bg-gray-50'
                                    }`}>
                                <tab.icon size={12} strokeWidth={2.5} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {[
                            { id: 'corporate', label: 'Corporate', icon: Package },
                            { id: 'apartment', label: 'Apartment', icon: Home },
                            { id: 'ecommerce', label: 'E-Commerce', icon: Camera }
                        ].map(tab => (
                            <button key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[7px] font-black uppercase tracking-wide transition-all ${activeTab === tab.id
                                    ? 'bg-brand text-white shadow-sm'
                                    : 'text-content-subtle hover:bg-gray-50'
                                    }`}>
                                <tab.icon size={10} strokeWidth={2.5} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'details' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Service Details */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Service Details</p>
                                    <Package size={12} className="text-brand" strokeWidth={3} />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                        <span className="text-[9px] font-semibold text-content-subtle">Service</span>
                                        <span className="text-[9px] font-black text-content">{bookingData.serviceName}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                        <span className="text-[9px] font-semibold text-content-subtle">Vehicle</span>
                                        <span className="text-[9px] font-black text-content">{bookingData.vehicle}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                        <span className="text-[9px] font-semibold text-content-subtle">Date</span>
                                        <span className="text-[9px] font-black text-content">{bookingData.scheduledDate}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                        <span className="text-[9px] font-semibold text-content-subtle">Time</span>
                                        <span className="text-[9px] font-black text-content">{bookingData.scheduledTime}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                        <span className="text-[9px] font-semibold text-content-subtle">Duration</span>
                                        <span className="text-[9px] font-black text-content">{bookingData.estimatedDuration}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-[9px] font-semibold text-content-subtle">Total Price</span>
                                        <span className="text-[12px] font-black text-brand">{bookingData.price}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Pickup Location</p>
                                    <MapPin size={12} className="text-brand" strokeWidth={3} />
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Home size={14} className="text-brand" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-content uppercase tracking-tight leading-none mb-1">Home</p>
                                        <p className="text-[8px] font-bold text-content-subtle leading-tight">{bookingData.location}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'captain' && (
                        <motion.div
                            key="captain"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Captain Info */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Service Captain</p>
                                    <User size={12} className="text-brand" strokeWidth={3} />
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand">
                                        <img src={bookingData.captain.photo} alt={bookingData.captain.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-content uppercase tracking-tight">{bookingData.captain.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Star size={10} fill="#FBBF24" className="text-amber-400" />
                                            <span className="text-[9px] font-black text-content">{bookingData.captain.rating}</span>
                                            {bookingData.captain.isVerified && <VerifiedBadge type="specialist" className="ml-1" />}
                                        </div>

                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand text-white rounded-xl font-black text-[9px] uppercase tracking-wider shadow-sm shadow-brand/20">
                                        <Phone size={12} strokeWidth={2.5} />
                                        Call Captain
                                    </button>
                                    <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-content rounded-xl font-black text-[9px] uppercase tracking-wider border border-gray-200">
                                        <MessageSquare size={12} strokeWidth={2.5} />
                                        Send Message
                                    </button>
                                </div>
                            </div>

                            {/* Captain Stats */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Services', value: '1,247', icon: Package },
                                    { label: 'Rating', value: '4.8⭐', icon: Star },
                                    { label: 'Experience', value: '3+ Years', icon: Timer }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                                        <stat.icon size={16} className="text-brand mx-auto mb-1" strokeWidth={2.5} />
                                        <p className="text-lg font-black text-content tracking-tighter">{stat.value}</p>
                                        <p className="text-[7px] font-bold text-content-subtle uppercase tracking-wider">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'tracking' && (
                        <motion.div
                            key="tracking"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Live Tracking */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Live Tracking</p>
                                    <Navigation size={12} className="text-brand" strokeWidth={3} />
                                </div>

                                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                                        <span className="text-[8px] font-black text-brand uppercase tracking-wider">Captain En Route</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-content-subtle">Estimated arrival in 2h 30m</p>
                                </div>

                                {/* Progress Steps - Standard Job State Machine */}
                                <div className="space-y-3">
                                    {[
                                        { state: 'CREATED', title: 'Booking Created', time: '10:30 AM', completed: true },
                                        { state: 'ASSIGNED', title: 'Captain Assigned', time: '10:32 AM', completed: true },
                                        { state: 'CAPTAIN_EN_ROUTE', title: 'Captain En Route', time: '10:35 AM', completed: true, active: true },
                                        { state: 'ARRIVED', title: 'Arrived at Location', time: 'Estimated 1:00 PM', completed: false },
                                        { state: 'BEFORE_PHOTO_DONE', title: 'Before Photos Taken', time: 'Estimated 1:05 PM', completed: false },
                                        { state: 'IN_PROGRESS', title: 'Service In Progress', time: 'Estimated 1:15 PM', completed: false },
                                        { state: 'AFTER_PHOTO_DONE', title: 'After Photos Taken', time: 'Estimated 4:00 PM', completed: false },
                                        { state: 'COMPLETED', title: 'Service Completed', time: 'Estimated 4:15 PM', completed: false }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${item.completed ? 'bg-brand text-white' : 'bg-gray-100 text-content-subtle'
                                                } ${item.active ? 'ring-2 ring-brand ring-offset-2 animate-pulse' : ''}`}>
                                                {item.completed ? '✓' : item.state.substring(0, 2)}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-[9px] font-black uppercase tracking-tight leading-none ${item.completed ? 'text-content' : 'text-content-subtle'
                                                    }`}>
                                                    {item.title}
                                                </p>
                                                <p className="text-[7px] font-bold text-content-subtle mt-0.5">{item.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Geo-tagged Photos Info */}
                                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Camera size={12} className="text-brand" strokeWidth={3} />
                                        <span className="text-[8px] font-black text-brand uppercase tracking-wider">Photo Requirements</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[7px] font-semibold text-content-subtle flex items-center gap-1">
                                            <CheckCircle2 size={8} className="text-green-500" strokeWidth={2} />
                                            Geo-tagged photos enabled
                                        </p>
                                        <p className="text-[7px] font-semibold text-content-subtle flex items-center gap-1">
                                            <CheckCircle2 size={8} className="text-green-500" strokeWidth={2} />
                                            Timestamp lock active
                                        </p>
                                        <p className="text-[7px] font-semibold text-content-subtle flex items-center gap-1">
                                            <CheckCircle2 size={8} className="text-green-500" strokeWidth={2} />
                                            Live GPS tracking
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'pricing' && (
                        <motion.div
                            key="pricing"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Pricing Breakdown */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Final Bill Breakdown</p>
                                    <Star size={12} className="text-brand" strokeWidth={3} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                        <span className="text-[9px] font-semibold text-content-subtle">Service Base Price</span>
                                        <span className="text-[9px] font-black text-content">₹{bookingData.pricing?.baseAmount || 0}</span>
                                    </div>
                                    {(bookingData.pricing?.addonAmount > 0) && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                            <span className="text-[9px] font-semibold text-content-subtle">Add-on Services</span>
                                            <span className="text-[9px] font-black text-content">₹{bookingData.pricing.addonAmount}</span>
                                        </div>
                                    )}
                                    {(bookingData.pricing?.discountAmount > 0) && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-semibold text-content-subtle">Applied Savings</span>
                                                <span className="text-[7px] font-black text-green-600 uppercase tracking-tight">Coupons & Membership</span>
                                            </div>
                                            <span className="text-[9px] font-black text-green-600">-₹{bookingData.pricing.discountAmount}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between py-2 bg-brand/5 -mx-4 px-4 mt-2">
                                        <span className="text-[10px] font-black text-content uppercase tracking-tight">Total Paid</span>
                                        <span className="text-[14px] font-[1000] text-brand">₹{(bookingData.pricing?.totalAmount || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>


                            {/* Vehicle Pricing */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest mb-3">Vehicle-Based Pricing</p>
                                <div className="space-y-2">
                                    {Object.entries(pricingEngine.vehicleMultiplier).map(([type, multiplier]) => (
                                        <div key={type} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                            <span className="text-[9px] font-semibold text-content-subtle capitalize">{type}</span>
                                            <span className="text-[9px] font-black text-content">{multiplier}x (₹{Math.round(pricingEngine.basePrice * multiplier)})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'corporate' && (
                        <motion.div
                            key="corporate"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Corporate Module */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Corporate Account</p>
                                    <Package size={12} className="text-brand" strokeWidth={3} />
                                </div>
                                <div className="space-y-3">
                                    <div className="text-center pb-3 border-b border-gray-100">
                                        <p className="text-sm font-black text-content uppercase tracking-tight">{corporateData.companyName}</p>
                                        <p className="text-[8px] font-bold text-content-subtle mt-1">Account ID: {corporateData.accountId}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="text-center">
                                            <p className="text-lg font-black text-brand tracking-tighter">{corporateData.fleetSize}</p>
                                            <p className="text-[7px] font-bold text-content-subtle uppercase tracking-wider">Fleet Size</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-black text-brand tracking-tighter">{corporateData.slaDashboard.monthlyWashes}</p>
                                            <p className="text-[7px] font-bold text-content-subtle uppercase tracking-wider">Monthly Washes</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                            <span className="text-[9px] font-semibold text-content-subtle">Employee Benefit</span>
                                            <span className={`text-[8px] font-black ${corporateData.employeeBenefit ? 'text-green-600' : 'text-red-600'}`}>
                                                {corporateData.employeeBenefit ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                            <span className="text-[9px] font-semibold text-content-subtle">Monthly Billing</span>
                                            <span className={`text-[8px] font-black ${corporateData.monthlyBilling ? 'text-green-600' : 'text-red-600'}`}>
                                                {corporateData.monthlyBilling ? 'ENABLED' : 'DISABLED'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-[9px] font-semibold text-content-subtle">Dedicated Captain</span>
                                            <span className={`text-[8px] font-black ${corporateData.dedicatedCaptain ? 'text-green-600' : 'text-red-600'}`}>
                                                {corporateData.dedicatedCaptain ? 'ASSIGNED' : 'NOT ASSIGNED'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SLA Dashboard */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest mb-3">SLA Dashboard</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center">
                                        <p className="text-lg font-black text-green-600 tracking-tighter">{corporateData.slaDashboard.onTimeRate}</p>
                                        <p className="text-[7px] font-bold text-content-subtle uppercase tracking-wider">On-Time</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-brand tracking-tighter">{corporateData.slaDashboard.satisfactionScore}</p>
                                        <p className="text-[7px] font-bold text-content-subtle uppercase tracking-wider">Satisfaction</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-purple-600 tracking-tighter">98%</p>
                                        <p className="text-[7px] font-bold text-content-subtle uppercase tracking-wider">Quality</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'apartment' && (
                        <motion.div
                            key="apartment"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Apartment Module */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Society Management</p>
                                    <Home size={12} className="text-brand" strokeWidth={3} />
                                </div>
                                <div className="space-y-3">
                                    <div className="text-center pb-3 border-b border-gray-100">
                                        <p className="text-sm font-black text-content uppercase tracking-tight">{apartmentData.societyName}</p>
                                        <p className="text-[8px] font-bold text-content-subtle mt-1">Society ID: {apartmentData.societyId}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="text-center">
                                            <p className="text-lg font-black text-brand tracking-tighter">{apartmentData.activeResidents}</p>
                                            <p className="text-[7px] font-bold text-content-subtle uppercase tracking-wider">Active</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-black text-content tracking-tighter">{apartmentData.totalResidents}</p>
                                            <p className="text-[7px] font-bold text-content-subtle uppercase tracking-wider">Total</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                            <span className="text-[9px] font-semibold text-content-subtle">Parking Spot</span>
                                            <span className="text-[8px] font-black text-brand">
                                                {apartmentData.parking.basement} â€¢ {apartmentData.parking.block} â€¢ P-{apartmentData.parking.pillar}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                            <span className="text-[9px] font-semibold text-content-subtle">Route Clustering</span>
                                            <span className={`text-[8px] font-black ${apartmentData.routeClustering ? 'text-green-600' : 'text-red-600'}`}>
                                                {apartmentData.routeClustering ? 'ENABLED' : 'DISABLED'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-[9px] font-semibold text-content-subtle">Dedicated Slots</span>
                                            <span className="text-[8px] font-black text-brand">{apartmentData.dedicatedSlots.join(', ')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Demand Heatmap */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest mb-3">Demand Heatmap</p>
                                <div className="space-y-2">
                                    {Object.entries(apartmentData.demandHeatmap).map(([time, count]) => (
                                        <div key={time} className="flex items-center gap-3">
                                            <span className="text-[9px] font-semibold text-content-subtle capitalize w-16">{time}</span>
                                            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-brand to-orange-400 rounded-full"
                                                    style={{ width: `${(count / Math.max(...Object.values(apartmentData.demandHeatmap))) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] font-black text-content w-8 text-right">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ecommerce' && (
                        <motion.div
                            key="ecommerce"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* E-Commerce Cart */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Shopping Cart</p>
                                    <Camera size={12} className="text-brand" strokeWidth={3} />
                                </div>
                                <div className="space-y-2">
                                    {eCommerceData.cart.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-content uppercase tracking-tight">{item.name}</p>
                                                <p className="text-[7px] font-bold text-content-subtle">Qty: {item.quantity} • {item.delivery}</p>
                                            </div>
                                            <span className="text-[9px] font-black text-content">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Delivery Info */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Delivery Captain</p>
                                    <Navigation size={12} className="text-brand" strokeWidth={3} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                        <User size={16} className="text-brand" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-content uppercase tracking-tight">{eCommerceData.deliveryCaptain.name}</p>
                                        <p className="text-[7px] font-bold text-content-subtle">{eCommerceData.deliveryCaptain.phone}</p>
                                        <p className="text-[7px] font-bold text-brand mt-1">ETA: {eCommerceData.deliveryCaptain.estimatedDelivery}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Own Brand Products */}
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[8.5px] font-black text-brand uppercase tracking-widest">Our Brand</p>
                                    <Star size={12} className="text-brand" strokeWidth={3} />
                                </div>
                                <div className="space-y-1">
                                    {eCommerceData.ownBrand.products.map((product, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-brand rounded-full" />
                                            <span className="text-[8px] font-semibold text-content">{product}</span>
                                            <span className="text-[7px] font-black text-brand ml-auto">PREMIUM</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Trust Badges */}
                <div className="flex gap-2">
                    {[
                        { icon: <Shield size={13} className="text-green-500" />, text: 'Insured' },
                        { icon: <Droplets size={13} className="text-blue-500" />, text: 'Eco-Safe' },
                        { icon: <Zap size={13} className="text-brand" fill="#FF6B00" />, text: 'Instant' },
                        { icon: <Camera size={13} className="text-purple-500" />, text: 'Photo Proof' }
                    ].map(badge => (
                        <div key={badge.text} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-100 rounded-xl py-2.5 shadow-sm">
                            {badge.icon}
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-content-subtle">{badge.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fixed Bottom Actions */}
            <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-[150] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex gap-3">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')}
                        className="flex-1 h-12 bg-gray-100 text-content rounded-xl font-black text-[10px] uppercase tracking-widest border border-gray-200 flex items-center justify-center gap-2"
                    >
                        <Home size={14} strokeWidth={2.5} />
                        Back to Home
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/bookings')}
                        className="flex-1 h-12 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                    >
                        <Package size={14} strokeWidth={2.5} />
                        My Bookings
                    </motion.button>
                </div>
            </div>
        </MobileLayout>
    );
};

export default BookingConfirmation;
