import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, MapPin, Car, Shield, Star, CheckCircle2,
    ChevronLeft, ArrowRight, Zap, Timer, Droplets, Camera,
    Plus, Minus, Check, Info, Home, Navigation, Phone
} from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';

const FullWashBooking = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { vehicles, addresses, addBooking } = useAuth();

    // Mock data for testing
    const mockVehicles = [
        { id: 1, brand: 'Maruti', model: 'Swift', color: 'White', plateNumber: 'DL01AB1234', isPrimary: true },
        { id: 2, brand: 'Hyundai', model: 'i20', color: 'Blue', plateNumber: 'DL02CD5678', isPrimary: false },
        { id: 3, brand: 'Tata', model: 'Nexon', color: 'Red', plateNumber: 'DL03EF9012', isPrimary: false }
    ];

    const mockAddresses = [
        { id: 1, type: 'Home', address: '123, Sector 15, Gurgaon, Haryana 122001', isPrimary: true },
        { id: 2, type: 'Office', address: '456, Cyber Hub, Gurgaon, Haryana 122002', isPrimary: false },
        { id: 3, type: 'Other', address: '789, MG Road, Gurgaon, Haryana 122003', isPrimary: false }
    ];

    // Use mock data if auth data is not available
    const vehiclesList = vehicles && vehicles.length > 0 ? vehicles : mockVehicles;
    const addressesList = addresses && addresses.length > 0 ? addresses : mockAddresses;

    const [mode, setMode] = useState('instant'); // instant | scheduled
    const [selectedVehicle, setSelectedVehicle] = useState(vehiclesList.find(v => v.isPrimary) || vehiclesList[0]);
    const [selectedDate, setSelectedDate] = useState('Today');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [selectedAddress, setSelectedAddress] = useState(addressesList.find(a => a.isPrimary) || addressesList[0]);

    // Mock service categories for full wash
    const fullWashCategories = [
        {
            id: 'studio-clean',
            title: 'Full Studio Clean',
            tag: 'Clinical Treatment',
            subtitle: 'Vendor pick-up & drop service',
            price: '1299',
            original: '2499',
            duration: '~3-4 hrs',
            image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80',
            features: ['Pickup from home', 'Professional studio', 'Sanitized delivery', 'Damage insured'],
            badge: 'Premium',
            rating: 4.4,
            reviews: 3218,
            addons: [
                { id: 'b1', name: 'Full Exterior Deep Wash', price: 799, included: true },
                { id: 'b2', name: '360° Interior Cleaning', price: 499, included: true },
                { id: 'b3', name: 'Engine Bay Cleaning', price: 299 },
                { id: 'b4', name: 'Paint Protection Film', price: 999 },
                { id: 'b5', name: 'Ceramic Coating (1 Year)', price: 1499 },
            ]
        },
        {
            id: 'deluxe-detail',
            title: 'Deluxe Full Detail',
            tag: 'Complete Care',
            subtitle: 'Premium detailing service',
            price: '1899',
            original: '3499',
            duration: '~4-5 hrs',
            image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&q=80',
            features: ['Complete exterior detail', 'Leather treatment', 'Polish & wax', 'Interior refresh'],
            badge: 'Premium',
            rating: 4.6,
            reviews: 2156,
            addons: [
                { id: 'd1', name: 'Complete Exterior Detail', price: 999, included: true },
                { id: 'd2', name: 'Interior Deep Clean', price: 699, included: true },
                { id: 'd3', name: 'Leather Conditioning', price: 399 },
                { id: 'd4', name: 'Paint Sealant', price: 599 },
            ]
        },
        {
            id: 'ultimate-protection',
            title: 'Ultimate Protection',
            tag: 'Best Value',
            subtitle: 'Maximum protection package',
            price: '2499',
            original: '4499',
            duration: '~5-6 hrs',
            image: 'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=600&q=80',
            features: ['Ceramic coating', 'Paint protection', 'Fabric protection', 'Glass treatment'],
            badge: 'Premium',
            rating: 4.8,
            reviews: 1876,
            addons: [
                { id: 'u1', name: 'Ceramic Coating', price: 1299, included: true },
                { id: 'u2', name: 'Paint Protection Film', price: 999, included: true },
                { id: 'u3', name: 'Fabric Protection', price: 499 },
                { id: 'u4', name: 'Glass Coating', price: 299 },
            ]
        }
    ];

    // Get selected category from URL params or default to first
    const selectedCategoryId = searchParams.get('category') || fullWashCategories[0].id;
    const selectedCategory = fullWashCategories.find(cat => cat.id === selectedCategoryId) || fullWashCategories[0];

    // Update price and service name based on selected category
    const price = searchParams.get('price') || selectedCategory.price;
    const serviceName = searchParams.get('service') || selectedCategory.title;

    const dates = ['Today', 'Tomorrow', '27 Feb', '28 Feb'];
    const timeSlots = [
        '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
    ];

    useEffect(() => {
        if (mode === 'instant') {
            setSelectedDate('Today');
            setSelectedSlot('');
        }
    }, [mode]);

    // Mock addBooking function for testing
    const mockAddBooking = (bookingData) => {
        const newBooking = {
            ...bookingData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        console.log('Mock booking created:', newBooking);
        return newBooking;
    };

    const handleProceed = () => {
        const bookingData = {
            serviceName,
            vehicle: `${selectedVehicle.brand} ${selectedVehicle.model}`,
            price: `₹${price}`,
            type: mode === 'instant' ? 'instant' : 'scheduled',
            status: mode === 'instant' ? 'ASSIGNED' : 'SCHEDULED',
            timestamp: new Date().toISOString(),
            location: selectedAddress?.address || 'Current Location',
            provider: 'vendor',
            scheduledDate: mode === 'scheduled' ? selectedDate : null,
            scheduledTime: mode === 'scheduled' ? selectedSlot : null,
        };

        // Use mock addBooking if auth addBooking is not available
        const newBooking = addBooking ? addBooking(bookingData) : mockAddBooking(bookingData);
        navigate('/booking-confirmation', { state: { bookingId: newBooking.id, provider: 'vendor' } });
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
                    <div>
                        <h1 className="text-base font-black tracking-tight text-content leading-none">Full Wash Booking</h1>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1 h-1 bg-brand rounded-full animate-pulse" />
                            <p className="text-[8px] text-brand font-black uppercase tracking-widest">Studio Service</p>
                        </div>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="bg-gray-100 p-0.5 rounded-xl flex gap-0.5">
                    {[
                        { id: 'instant', label: 'Instant', sub: 'Pickup Now' },
                        { id: 'scheduled', label: 'Scheduled', sub: 'Book Later' }
                    ].map(m => (
                        <button key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`flex-1 px-3 py-2.5 rounded-[9px] text-[8.5px] font-black uppercase tracking-wide transition-all ${
                                mode === m.id
                                    ? 'bg-white text-brand shadow-sm'
                                    : 'text-content-muted'
                            }`}>
                            <div className="text-center">
                                <div>{m.label}</div>
                                <div className="text-[7px] opacity-70 mt-0.5">{m.sub}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Date Picker (scheduled) */}
                <AnimatePresence>
                    {mode === 'scheduled' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex gap-2 mb-3 overflow-x-auto pb-0.5 mt-3"
                        >
                            {dates.map((d, i) => (
                                <button key={d}
                                    onClick={() => setSelectedDate(d)}
                                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wide border transition-all ${
                                        i === 0 ? 'bg-brand text-white border-brand shadow-sm' : 'bg-gray-50 border-gray-100 text-content-muted'
                                    }`}>
                                    {d}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <div className="px-4 pb-32 space-y-4 pt-3">

                {/* Service Category Selector */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-gray-100 p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Select Service</p>
                        <Shield size={12} className="text-brand" strokeWidth={3} />
                    </div>
                    <div className="space-y-2">
                        {fullWashCategories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => {
                                    // Update URL params
                                    const newParams = new URLSearchParams(searchParams);
                                    newParams.set('category', category.id);
                                    newParams.set('service', category.title);
                                    newParams.set('price', category.price);
                                    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
                                    window.location.reload(); // Simple reload to update state
                                }}
                                className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                                    selectedCategory.id === category.id
                                        ? 'border-brand bg-orange-50 shadow-sm'
                                        : 'border-gray-100 bg-gray-50/60 opacity-60 hover:opacity-90'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ${
                                        selectedCategory.id === category.id ? 'ring-2 ring-brand ring-offset-2' : ''
                                    }`}>
                                        <img src={category.image} alt={category.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className={`font-black text-[10px] uppercase tracking-tight leading-none ${
                                                selectedCategory.id === category.id ? 'text-brand' : 'text-content'
                                            }`}>
                                                {category.title}
                                            </p>
                                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[6px] font-black uppercase rounded-full">
                                                {category.tag}
                                            </span>
                                        </div>
                                        <p className="text-[7px] font-bold text-content-subtle uppercase mt-0.5 opacity-70">
                                            {category.subtitle}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] font-black text-brand">₹{category.price}</span>
                                            {category.original && (
                                                <span className="text-[9px] font-bold text-content-subtle line-through opacity-50">₹{category.original}</span>
                                            )}
                                            <span className="text-[7px] font-bold text-content-subtle">• {category.duration}</span>
                                        </div>
                                    </div>
                                    {selectedCategory.id === category.id && (
                                        <div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                                            <Check size={10} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Service Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
                            <Shield size={20} className="text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-black text-brand uppercase tracking-tight">{serviceName}</h3>
                            <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Premium Studio Service</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-black tracking-tighter">₹{price}</p>
                            <p className="text-[8px] font-bold text-black/30">per wash</p>
                        </div>
                    </div>
                    
                    {/* Service Features Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {selectedCategory.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-black/60">
                                <CheckCircle2 size={10} className="text-brand" strokeWidth={3} />
                                <span className="text-[8px] font-semibold">{feature}</span>
                            </div>
                        ))}
                    </div>

                    {/* Rating and Reviews */}
                    <div className="flex items-center justify-between pt-3 border-t border-orange-200">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <Star size={10} fill="#FBBF24" className="text-amber-400" />
                                <span className="text-[10px] font-black text-content">{selectedCategory.rating || 4.4}</span>
                            </div>
                            <span className="text-[8px] font-bold text-content-subtle opacity-50">
                                ({(selectedCategory.reviews || 3218).toLocaleString()})
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock size={10} className="text-brand" strokeWidth={3} />
                            <span className="text-[8px] font-black text-content-subtle">{selectedCategory.duration}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Time Slot Picker (scheduled) */}
                <AnimatePresence>
                    {mode === 'scheduled' && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="bg-white rounded-xl border border-gray-100 p-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Pick Arrival Slot</p>
                                <Clock size={12} className="text-brand" strokeWidth={3} />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {timeSlots.map(slot => (
                                    <button
                                        key={slot}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`py-2 px-2 rounded-lg text-[8.5px] font-black uppercase tracking-wide border transition-all ${
                                            selectedSlot === slot
                                                ? 'bg-brand text-white border-brand shadow-sm'
                                                : 'bg-gray-50 border-gray-100 text-content-muted hover:bg-gray-100'
                                        }`}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Vehicle Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl border border-gray-100 p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Select Vehicle</p>
                        <Car size={12} className="text-brand" strokeWidth={3} />
                    </div>
                    <div className="space-y-2">
                        {vehiclesList.map(vehicle => (
                            <button
                                key={vehicle.id}
                                onClick={() => setSelectedVehicle(vehicle)}
                                className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                                    selectedVehicle.id === vehicle.id
                                        ? 'border-brand bg-orange-50 shadow-sm'
                                        : 'border-gray-100 bg-gray-50/60 opacity-60 hover:opacity-90'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                        selectedVehicle.id === vehicle.id
                                            ? 'bg-brand text-white shadow-sm shadow-brand/25'
                                            : 'bg-white text-content-subtle border border-gray-100'
                                    }`}>
                                        <Car size={14} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-black text-[10px] uppercase tracking-tight leading-none ${
                                            selectedVehicle.id === vehicle.id ? 'text-brand' : 'text-content'
                                        }`}>
                                            {vehicle.brand} {vehicle.model}
                                        </p>
                                        <p className="text-[7px] font-bold text-content-subtle uppercase mt-0.5 opacity-70">
                                            {vehicle.color} • {vehicle.plateNumber}
                                        </p>
                                    </div>
                                    {selectedVehicle.id === vehicle.id && (
                                        <div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                                            <Check size={10} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Address Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl border border-gray-100 p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">Pickup Address</p>
                        <MapPin size={12} className="text-brand" strokeWidth={3} />
                    </div>
                    <div className="space-y-2">
                        {addressesList.map(address => (
                            <button
                                key={address.id}
                                onClick={() => setSelectedAddress(address)}
                                className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                                    selectedAddress.id === address.id
                                        ? 'border-brand bg-orange-50 shadow-sm'
                                        : 'border-gray-100 bg-gray-50/60 opacity-60 hover:opacity-90'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                        selectedAddress.id === address.id
                                            ? 'bg-brand text-white shadow-sm shadow-brand/25'
                                            : 'bg-white text-content-subtle border border-gray-100'
                                    }`}>
                                        <Home size={14} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-black text-[10px] uppercase tracking-tight leading-none ${
                                            selectedAddress.id === address.id ? 'text-brand' : 'text-content'
                                        }`}>
                                            {address.type}
                                        </p>
                                        <p className="text-[7px] font-bold text-content-subtle uppercase mt-0.5 opacity-70 line-clamp-2">
                                            {address.address}
                                        </p>
                                    </div>
                                    {selectedAddress.id === address.id && (
                                        <div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                                            <Check size={10} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Service Process & Benefits */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-xl border border-gray-100 p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[8.5px] font-black text-content-subtle uppercase tracking-widest">How It Works</p>
                        <Timer size={12} className="text-brand" strokeWidth={3} />
                    </div>
                    <div className="space-y-3">
                        {[
                            { step: '01', title: 'Book Service', desc: 'Choose time & location' },
                            { step: '02', title: 'Pickup', desc: 'Captain arrives at your place' },
                            { step: '03', title: 'Studio Service', desc: 'Professional cleaning at studio' },
                            { step: '04', title: 'Delivery', desc: 'Sanitized car delivered back' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-lg bg-brand text-white flex items-center justify-center font-black text-[8px] shadow-sm shadow-brand/20">
                                    {item.step}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black text-content uppercase tracking-tight leading-none">{item.title}</p>
                                    <p className="text-[7px] font-bold text-content-subtle mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-2"
                >
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
                </motion.div>

                {/* Service Info */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 p-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Info size={14} className="text-brand" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[10px] font-black text-brand uppercase tracking-wider mb-2">Studio Service Process</h4>
                            <div className="space-y-1.5">
                                {[
                                    'Captain arrives for pickup',
                                    'Vehicle taken to professional studio',
                                    'Complete cleaning & detailing',
                                    'Sanitized delivery at your location'
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-orange-400 rounded-full" />
                                        <p className="text-[8px] font-semibold text-orange-800">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* Fixed Bottom Action */}
            <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-[150] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex-1">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mb-1.5">
                            {mode === 'instant' ? 'Instant Pickup' : `Scheduled: ${selectedDate}`}
                        </p>
                        <h4 className="text-[11px] font-bold text-gray-900 uppercase">
                            {serviceName}
                        </h4>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black text-black tracking-tighter">₹{price}</p>
                        <p className="text-[8px] font-bold text-black/30">total price</p>
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProceed}
                    disabled={mode === 'scheduled' && !selectedSlot}
                    className="w-full h-12 bg-brand text-white rounded-xl font-black text-[11px] uppercase tracking-[0.3em] shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {mode === 'instant' ? (
                        <>
                            <Zap size={16} className="text-white" fill="currentColor" />
                            Book Instant Pickup
                        </>
                    ) : (
                        <>
                            <Calendar size={16} className="text-white" />
                            Schedule Pickup
                        </>
                    )}
                </motion.button>
            </div>

        </MobileLayout>
    );
};

export default FullWashBooking;
