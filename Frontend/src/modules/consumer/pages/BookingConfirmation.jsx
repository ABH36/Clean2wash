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
import { bookingAPI, subscriptionAPI } from '../../../utils/api';
import VerifiedBadge from '../components/ui/VerifiedBadge';

const BookingConfirmation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { bookingId, provider, type, plan, society, parking, slot, price, service, planPrice } = location.state || {};
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

    // Mock booking data - enriched with real state from navigation
    const [bookingData, setBookingData] = useState({
        id: bookingId || (type === 'subscription' ? 'SUB' : 'BK') + Math.random().toString(36).substr(2, 9).toUpperCase(),
        serviceName: service || (type === 'subscription' ? (plan || 'Apartment Wash') : 'Full Studio Clean'),
        vehicle: parking?.carModel ? `${parking.carModel} (${parking.carNumber || 'VH001'})` : (type === 'subscription' ? 'Society Subscription' : 'Full Detail Package'),
        vehicleId: parking?.vehicleId || 'VH001',
        price: price ? `₹${price}` : (type === 'subscription' ? 'FREE' : '₹1299'),
        pricing: { baseAmount: price || 0, totalAmount: price || 0, discountAmount: 0 },
        type: type || 'scheduled',
        status: type === 'subscription' ? 'ACTIVE' : JOB_STATES.CREATED,
        timestamp: new Date().toISOString(),
        location: type === 'subscription' 
            ? `${society || 'Your Hub'}${parking?.block ? ` • ${parking.block}` : ''}${parking?.pillar ? ` • Pillar ${parking.pillar}` : ''}` 
            : 'Fetching location...',
        coordinates: { lat: 28.4526, lng: 77.0345 },
        provider: provider || 'vendor',
        scheduledDate: type === 'subscription' ? 'Monthly' : 'Today',
        scheduledTime: slot || '6:00 AM',
        estimatedDuration: type === 'subscription' ? 'Sequence' : '1.5 Hours',
        userId: 'USER_ID',
        jobId: 'JOB_ID',
        photos: { before: [], after: [] },
        geoTagged: true,
        timestampLock: true,
        captain: {
            id: 'CAP001',
            name: society ? `${society} Hub Lead` : (type === 'subscription' ? 'Assigning Supervisor' : 'Assigning Specialist'),
            phone: '',
            rating: 4.9,
            photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
            capabilities: ['cluster', 'apartment'],
            isOnline: true,
            stats: {
                services: '450+',
                experience: 'Elite'
            }
        },
        vendor: {
            id: 'VEND_ID',
            name: society ? `${society} Hub` : 'ZerOne Management',
            sla: { pickup: '30min', delivery: '4hrs', quality: 'A+' },
            location: society || 'Cluster Campus'
        }
    });

    const [activeTab, setActiveTab] = useState('details');
    const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 30, seconds: 0 });
    const [showSOS, setShowSOS] = useState(false);

    // --- DYNAMIC TRACKING ENGINE ---
    const trackingSteps = [
        { 
            label: 'Booking Created', 
            status: 'completed', 
            time: new Date(bookingData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            icon: CheckCircle2 
        },
        { 
            label: 'Captain Assigned', 
            status: ['ASSIGNED', 'CAPTAIN_EN_ROUTE', 'ARRIVED', 'BEFORE_PHOTO_DONE', 'IN_PROGRESS', 'AFTER_PHOTO_DONE', 'COMPLETED'].includes(bookingData.status) ? 'completed' : 'pending', 
            time: bookingData.status !== 'CREATED' ? 'Matched with Hub' : 'In Batching...', 
            icon: User 
        },
        { 
            label: 'Captain En Route', 
            status: ['CAPTAIN_EN_ROUTE', 'ARRIVED', 'BEFORE_PHOTO_DONE', 'IN_PROGRESS', 'AFTER_PHOTO_DONE', 'COMPLETED'].includes(bookingData.status) ? 'completed' : 'pending', 
            time: bookingData.status === 'CAPTAIN_EN_ROUTE' ? 'En route now' : 'Scheduled', 
            icon: Navigation 
        },
        { 
            label: 'Arrived at Location', 
            status: ['ARRIVED', 'BEFORE_PHOTO_DONE', 'IN_PROGRESS', 'AFTER_PHOTO_DONE', 'COMPLETED'].includes(bookingData.status) ? 'completed' : 'pending', 
            time: bookingData.status === 'ARRIVED' ? 'Just arrived' : '--:--', 
            icon: MapPin 
        },
        { 
            label: 'Service In Progress', 
            status: ['IN_PROGRESS', 'AFTER_PHOTO_DONE', 'COMPLETED'].includes(bookingData.status) ? 'completed' : 'pending', 
            time: bookingData.status === 'IN_PROGRESS' ? 'Service started' : '--:--', 
            icon: Droplets 
        },
        { 
            label: 'Service Completed', 
            status: bookingData.status === 'COMPLETED' ? 'completed' : 'pending', 
            time: bookingData.status === 'COMPLETED' ? 'Completed now' : '--:--', 
            icon: Star 
        }
    ];

    const renderTrackingTab = () => (
        <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] font-black text-orange-900 uppercase tracking-wider">
                        {type === 'subscription' ? 'SUBSCRIPTION ACTIVE' : 'LIVE TRACKING'}
                    </span>
                </div>
                <p className="text-[10px] font-bold text-orange-700 leading-tight">
                    {type === 'subscription' 
                        ? `Daily sequence for ${society || 'your hub'} is active. Cleaning follows Pillar Hierarchy.` 
                        : 'Tracking captain movement in real-time.'}
                </p>
            </div>

            <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                {trackingSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                            step.status === 'completed' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-100 text-gray-400'
                        }`}>
                            <step.icon size={16} />
                        </div>
                        <div className="flex-1">
                            <p className={`text-[12px] font-black uppercase tracking-tight ${step.status === 'completed' ? 'text-gray-900' : 'text-gray-400'}`}>
                                {step.label}
                            </p>
                            <p className="text-[10px] font-bold text-gray-500 mt-0.5">{step.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

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

    const [alerts, setAlerts] = useState(type === 'subscription' ? [
        { type: 'subscription', message: `${plan || 'Apartment'} subscription activated for ${society || 'your society'}`, priority: 'high' },
        { type: 'parking', message: `Captain will clean at ${parking?.block || 'your block'} / Pillar ${parking?.pillar || 'assigned'}`, priority: 'medium' },
        { type: 'schedule', message: `Daily service scheduled during ${slot || 'Morning'} slot`, priority: 'low' },
        { type: 'weather', message: 'Weather monitor active: Service may adjust for rain', priority: 'medium' }
    ] : [
        { type: 'booking', message: 'Booking confirmed: Captain will reach shortly', priority: 'high' },
        { type: 'location', message: 'Live ETA tracking will be enabled once captain starts', priority: 'medium' },
        { type: 'weather', message: 'No rain expected: Service on track', priority: 'low' }
    ]);

    // Apartment-Specific Live Analytics (derived from Hub data)
    const [apartmentStats, setApartmentStats] = useState({
        activeResidents: 45
    });

    const [hubData, setHubData] = useState(null);

    // Route & Cluster Optimization (derived metrics)
    const routeOptimization = {
        batchVehicleAssignment: true,
        timeSlotRouting: true,
        captainRoutePlanning: true,
        parkingLotBulkMode: true,
        demandHeatmap: hubData?.metadata?.demandHeatmap || {
            morning: 15, afternoon: 10, evening: 5
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
            products: ['ZerOne Gold Wax', 'Elite Dashboard Polish', 'HyperShine Tire Care']
        },
        deliveryCaptain: {
            id: 'DELIVERY001',
            name: 'ZerOne Hub Delivery',
            phone: '9110022334',
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
        // Navigate to the Emergency SOS reporting page with context
        const contextId = bookingData.id || bookingData._id || 'GENERAL';
        navigate(`/safety/sos?id=${contextId}`);
        
        toast.loading('Opening Emergency Support...', {
            duration: 1000,
            style: {
                background: '#ef4444',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '10px'
            }
        });
    };

    // Fetch real booking or subscription data
    useEffect(() => {
        const fetchData = async () => {
            if (!bookingId) return;
            try {
                let res;
                if (type === 'subscription') {
                    // Fetch subscription details if it's a subscription flow
                    res = await subscriptionAPI.getSubscription(bookingId);
                } else {
                    // Fetch standard booking details
                    res = await bookingAPI.getBooking(bookingId);
                }

                if (res.status === 'success') {
                    const data = type === 'subscription' ? res.data.subscription : res.data.booking;
                    
                    // Map data based on type (Booking vs Subscription)
                    const isSub = type === 'subscription';
                    
                    if (data.hub) {
                        setHubData(data.hub);
                        // Update apartment stats from real hub data
                        setApartmentStats({
                            activeResidents: data.hub.activeResidents || 45
                        });
                    }

                    setBookingData(prev => ({
                        ...prev,
                        id: data.bookingId || data._id,
                        serviceName: isSub ? (data.plan?.name || prev.serviceName) : data.service.name,
                        vehicle: isSub 
                            ? (data.parkingDetails?.carModel ? `${data.parkingDetails.carModel} (${data.parkingDetails.carNumber})` : prev.vehicle)
                            : (data.vehicle ? `${data.vehicle.brand} ${data.vehicle.model}` : prev.vehicle),
                        price: isSub ? `₹${data.pricing?.totalAmount || price || 0}` : `₹${data.pricing.totalAmount}`,
                        status: data.status.toUpperCase(),
                        location: isSub 
                            ? `${data.hub?.name || society || 'Society Hub'}`
                            : (data.location.address.street + (data.location.address.city ? `, ${data.location.address.city}` : '')),
                        captain: (data.provider?.id || data.assignedStaff?._id) ? {
                            name: data.provider?.name || data.assignedStaff?.name,
                            phone: data.provider?.phone || data.assignedStaff?.phone,
                            photo: (data.provider?.photo || data.assignedStaff?.photo) || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
                            rating: data.provider?.rating || data.assignedStaff?.rating || 4.9,
                            isVerified: true,
                            stats: {
                                services: data.provider?.totalServices || `${Math.floor(Math.random() * 100) + 400}+`,
                                experience: data.provider?.experienceYears || (isSub ? 'Hub Specialist' : 'Senior Specialist')
                            }
                        } : {
                            name: isSub ? (data.hub?.vendor?.name || data.hub?.manager || 'Emerald Heights Lead') : 'Assigning Lead Captain',
                            phone: isSub ? (data.hub?.vendor?.phone || '9110022334') : '',
                            photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
                            rating: 4.9,
                            isOnline: true,
                            stats: {
                                services: data.hub?.captains ? `${(data.hub.captains * 50)}+` : '450+',
                                experience: 'Elite Supervisor'
                            }
                        }
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [bookingId, type]);

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
                    <div className="grid grid-cols-2 gap-1">
                        {[
                            { id: 'apartment', label: 'Apartment', icon: Home },
                            { id: 'ecommerce', label: 'E-Commerce', icon: Camera }
                        ].map(tab => (
                            <button key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-wide transition-all ${activeTab === tab.id
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
                                    <button 
                                        onClick={() => {
                                            if (bookingData.captain.phone) {
                                                window.location.href = `tel:${bookingData.captain.phone}`;
                                            } else {
                                                toast.error('Contact details not assigned yet');
                                            }
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand text-white rounded-xl font-black text-[9px] uppercase tracking-wider shadow-sm shadow-brand/20"
                                    >
                                        <Phone size={12} strokeWidth={2.5} />
                                        Call Captain
                                    </button>
                                    <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-content rounded-xl font-black text-[9px] uppercase tracking-wider border border-gray-200">
                                        <MessageSquare size={12} strokeWidth={2.5} />
                                        Send Message
                                    </button>
                                </div>
                                      {/* Captain Stats (Dynamic) */}
                             <div className="grid grid-cols-3 gap-2">
                                 {[
                                     { label: 'Services', value: bookingData.captain.stats?.services || '450+', icon: Package },
                                     { label: 'Rating', value: `${bookingData.captain.rating || '4.9'} ⭐`, icon: Star },
                                     { label: 'Level', value: bookingData.captain.stats?.experience || 'Elite Supervisor', icon: Timer }
                                 ].map((stat, i) => (
                                     <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 text-center transition-all hover:bg-orange-50/30">
                                         <stat.icon size={16} className="text-brand mx-auto mb-1" strokeWidth={2.5} />
                                         <p className="text-[14px] font-[1000] text-content tracking-tighter leading-none">{stat.value}</p>
                                         <p className="text-[7px] font-black text-content-subtle uppercase tracking-wider mt-1">{stat.label}</p>
                                     </div>
                                 ))}
                             </div>
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
                            {/* Live Tracking Module (Dynamic) */}
                            {renderTrackingTab()}
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


                            {/* Pricing Policy */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest mb-3">Pricing Policy</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <span className="text-[9px] font-semibold text-content-subtle">Base Fare</span>
                                        <span className="text-[9px] font-black text-content">Included in Plan</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <span className="text-[9px] font-semibold text-content-subtle">Convenience Fee</span>
                                        <span className="text-[9px] font-black text-content">₹0 (Member Benefit)</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <span className="text-[9px] font-semibold text-content-subtle">Tax (GST)</span>
                                        <span className="text-[9px] font-black text-content">Inclusive</span>
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
                                        <p className="text-sm font-black text-content uppercase tracking-tight">{hubData?.name || society || 'Green Valley Apartments'}</p>
                                        <p className="text-[8px] font-bold text-content-subtle mt-1">Society ID: HUB-{hubData?._id?.toString()?.slice(-6).toUpperCase() || 'GS01'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="text-center">
                                            <p className="text-lg font-black text-brand tracking-tighter">{apartmentStats.activeResidents}</p>
                                            <p className="text-[7px] font-bold text-content-subtle uppercase tracking-wider">Active Users</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-black text-content tracking-tighter">{hubData?.captains || 0}</p>
                                            <p className="text-[7px] font-bold text-content-subtle uppercase tracking-wider">Dedicated Staff</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                            <span className="text-[9px] font-semibold text-content-subtle">Parking Spot</span>
                                            <span className="text-[8px] font-black text-brand">
                                                {parking?.basement || 'B1'} • {parking?.block || 'A'} • P-{parking?.pillar || '00'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-[9px] font-semibold text-content-subtle">Service Slot</span>
                                            <span className="text-[8px] font-black text-brand">{slot || 'Morning'}</span>
                                        </div>
                                    </div>
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
