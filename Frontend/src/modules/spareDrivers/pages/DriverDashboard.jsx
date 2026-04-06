import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { TrendingUp, Star, Clock, MapPin, ChevronRight, AlertCircle, Zap, FileText, Bell, Route } from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { socketService } from '../../../utils/socket';
import GoogleMapBox from '../../../components/common/GoogleMapBox';

const SERVICE_ASSETS = {
    point: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
    hourly: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    full: 'https://cdn-icons-png.flaticon.com/512/2436/2436874.png',
    outstation: 'https://cdn-icons-png.flaticon.com/512/2330/2330453.png',
    user: 'https://cdn-icons-png.flaticon.com/512/7077/7077313.png'
};

const SERVICE_ACCENTS = {
    point: '#3B82F6',
    hourly: '#10B981',
    full: '#F29F05',
    outstation: '#A855F7'
};

const svgToDataUrl = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const createDriverMarkerIcon = (accent = '#F29F05') => svgToDataUrl(`
<svg width="64" height="78" viewBox="0 0 64 78" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="32" cy="69" rx="15" ry="5" fill="rgba(15,23,42,0.18)"/>
  <path d="M32 4C20.954 4 12 12.954 12 24C12 39 32 58 32 58C32 58 52 39 52 24C52 12.954 43.046 4 32 4Z" fill="#101828"/>
  <path d="M32 7.5C22.887 7.5 15.5 14.887 15.5 24C15.5 36.173 32 52.166 32 52.166C32 52.166 48.5 36.173 48.5 24C48.5 14.887 41.113 7.5 32 7.5Z" fill="#111827" stroke="${accent}" stroke-width="2"/>
  <circle cx="32" cy="24" r="12.5" fill="white" fill-opacity="0.96"/>
  <rect x="23" y="23.5" width="18" height="5.2" rx="2.6" fill="${accent}"/>
  <rect x="26" y="19" width="12" height="4.8" rx="2.2" fill="${accent}" fill-opacity="0.82"/>
  <circle cx="27" cy="30.5" r="2.6" fill="#111827"/>
  <circle cx="37" cy="30.5" r="2.6" fill="#111827"/>
</svg>
`);

const createCustomerMarkerIcon = (accent = '#F29F05') => svgToDataUrl(`
<svg width="72" height="84" viewBox="0 0 72 84" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="36" cy="75" rx="18" ry="6" fill="rgba(15,23,42,0.16)"/>
  <path d="M36 5C23.85 5 14 14.85 14 27C14 43.5 36 64 36 64C36 64 58 43.5 58 27C58 14.85 48.15 5 36 5Z" fill="white" stroke="${accent}" stroke-width="2.4"/>
  <circle cx="36" cy="22" r="10.5" fill="#FFF7ED"/>
  <circle cx="36" cy="18.6" r="4.2" fill="#F97316"/>
  <path d="M29.2 28.8C29.2 26.5 31.1 24.6 33.4 24.6H38.6C40.9 24.6 42.8 26.5 42.8 28.8V31.2H29.2V28.8Z" fill="${accent}"/>
  <rect x="24" y="33.8" width="24" height="6.6" rx="3.3" fill="#111827"/>
  <circle cx="30" cy="41.8" r="2.8" fill="#111827"/>
  <circle cx="42" cy="41.8" r="2.8" fill="#111827"/>
</svg>
`);

const createDestinationMarkerIcon = () => svgToDataUrl(`
<svg width="64" height="78" viewBox="0 0 64 78" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="32" cy="69" rx="15" ry="5" fill="rgba(15,23,42,0.16)"/>
  <path d="M32 5C20.954 5 12 13.954 12 25C12 40 32 58 32 58C32 58 52 40 52 25C52 13.954 43.046 5 32 5Z" fill="white" stroke="#EF4444" stroke-width="2.4"/>
  <circle cx="32" cy="25" r="10.5" fill="#FEE2E2"/>
  <path d="M32 18L35.2 24.5L42 25.4L37 30.1L38.3 36.8L32 33.5L25.7 36.8L27 30.1L22 25.4L28.8 24.5L32 18Z" fill="#EF4444"/>
</svg>
`);

const DRIVER_ACTIVE_STATUS = 'active';
const LIVE_JOB_STATUSES = ['en_route', 'arrived', 'active'];

const isFullDayBooking = (booking) => {
    const identity = [
        booking?.service?.metadata?.id,
        booking?.service?.name,
        booking?.service?.title
    ].filter(Boolean).join(' ').toLowerCase();

    return identity.includes('full day') || identity.includes('full-day') || identity.includes('fullday');
};

const getBookedDurationLabel = (booking) => (
    booking?.service?.duration || booking?.schedule?.estimatedDuration || null
);

const isOutstationBooking = (booking) => {
    const identity = [
        booking?.service?.metadata?.id,
        booking?.service?.name,
        booking?.service?.title
    ].filter(Boolean).join(' ').toLowerCase();

    return identity.includes('outstation');
};

const getServiceKind = (booking) => {
    const identity = [
        booking?.service?.metadata?.id,
        booking?.service?.name,
        booking?.service?.title
    ].filter(Boolean).join(' ').toLowerCase();

    if (identity.includes('outstation')) return 'outstation';
    if (identity.includes('full day') || identity.includes('full-day') || identity.includes('fullday')) return 'full';
    if (identity.includes('hourly')) return 'hourly';
    if (identity.includes('point')) return 'point';
    return 'full';
};

const hasValidCoords = (location) => (
    location
    && typeof location.lat === 'number'
    && typeof location.lng === 'number'
    && Number.isFinite(location.lat)
    && Number.isFinite(location.lng)
);

const useSmoothedLocation = (targetLocation, duration = 900) => {
    const [displayLocation, setDisplayLocation] = useState(
        hasValidCoords(targetLocation) ? targetLocation : null
    );
    const frameRef = useRef(null);

    useEffect(() => {
        if (!hasValidCoords(targetLocation)) {
            return undefined;
        }

        const startLocation = hasValidCoords(displayLocation) ? displayLocation : targetLocation;
        const distance = Math.abs(startLocation.lat - targetLocation.lat) + Math.abs(startLocation.lng - targetLocation.lng);

        if (distance < 0.00001) {
            setDisplayLocation(targetLocation);
            return undefined;
        }

        const startedAt = Date.now();
        const tick = () => {
            const progress = Math.min(1, (Date.now() - startedAt) / duration);
            setDisplayLocation({
                lat: startLocation.lat + ((targetLocation.lat - startLocation.lat) * progress),
                lng: startLocation.lng + ((targetLocation.lng - startLocation.lng) * progress)
            });

            if (progress < 1) {
                frameRef.current = window.requestAnimationFrame(tick);
            }
        };

        frameRef.current = window.requestAnimationFrame(tick);

        return () => {
            if (frameRef.current) {
                window.cancelAnimationFrame(frameRef.current);
            }
        };
    }, [targetLocation?.lat, targetLocation?.lng, duration]);

    return hasValidCoords(displayLocation) ? displayLocation : (hasValidCoords(targetLocation) ? targetLocation : null);
};

const DriverDashboard = () => {
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(false);
    const [driver, setDriver] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [consumerLiveLocation, setConsumerLiveLocation] = useState(null);

    const refreshDashboard = async () => {
        const [profileRes, bookingsRes, transRes] = await Promise.all([
            spareDriverAPI.getProfile(),
            spareDriverAPI.getBookings(),
            spareDriverAPI.getTransactions({ limit: 5 })
        ]);

        const nextDriver = profileRes?.data?.driver || null;
        setDriver(nextDriver);
        setBookings(bookingsRes?.data?.bookings || []);
        setTransactions(transRes?.data?.transactions || []);
        setIsOnline(Boolean(nextDriver?.isOnline));
        return nextDriver;
    };

    useEffect(() => {
        const token = localStorage.getItem('chauffeur_token');
        if (!token) {
            navigate('/spare-driver/register');
            return;
        }

        setLoading(true);
        refreshDashboard()
            .catch((error) => {
                toast.error(error.message || 'Failed to load driver dashboard');
                navigate('/spare-driver/register');
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    useEffect(() => {
        let watchId = null;
        if (!isOnline || driver?.status !== DRIVER_ACTIVE_STATUS) {
            return undefined;
        }

        if ('geolocation' in navigator) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    setDriver((current) => current ? ({
                        ...current,
                        currentLocation: {
                            ...(current.currentLocation || {}),
                            coordinates: [longitude, latitude]
                        }
                    }) : current);

                    spareDriverAPI.updateLocation(latitude, longitude).catch((error) => {
                        console.error('Pulse failed:', error);
                    });

                    const activeTrip = bookings.find((booking) => LIVE_JOB_STATUSES.includes(booking.status));
                    if (activeTrip) {
                        socketService.connect(localStorage.getItem('chauffeur_token'));
                        socketService.joinBookingRoom(activeTrip._id);

                        const socket = socketService.getSocket();
                        if (socket) {
                            socket.emit('update_location', {
                                bookingId: activeTrip._id,
                                location: { lat: latitude, lng: longitude }
                            });
                        }
                    }
                },
                (error) => console.error('GPS protocol error:', error),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        }

        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [isOnline, bookings, driver?.status]);

    useEffect(() => {
        const token = localStorage.getItem('chauffeur_token');
        if (!token) return undefined;

        socketService.connect(token);
        const socket = socketService.getSocket();
        if (!socket) return undefined;

        const currentLiveJob =
            bookings.find((booking) => LIVE_JOB_STATUSES.includes(booking.status)) ||
            (isOnline && driver?.status === DRIVER_ACTIVE_STATUS
                ? bookings.find((booking) => booking.status === 'pending')
                : null);

        if (currentLiveJob?._id) {
            socketService.joinBookingRoom(currentLiveJob._id);
        }

        const refreshBookings = () => {
            spareDriverAPI.getBookings()
                .then((res) => setBookings(res?.data?.bookings || []))
                .catch(() => {});
        };

        const handleNewBooking = (payload) => {
            toast.success(`New mission arrived: ${payload.serviceName}`, {
                duration: 8000,
                style: { background: '#F29F05', color: '#000', fontWeight: 'bold' }
            });
            refreshBookings();
        };

        const handleVerificationUpdate = (payload) => {
            setDriver((current) => current ? {
                ...current,
                status: payload.status,
                adminNote: payload.adminNote,
                isOnline: payload.status === DRIVER_ACTIVE_STATUS ? current.isOnline : false
            } : current);

            if (payload.status !== DRIVER_ACTIVE_STATUS) {
                setIsOnline(false);
                setBookings((current) => current.filter((booking) => LIVE_JOB_STATUSES.includes(booking.status)));
            }

            toast(payload.status === DRIVER_ACTIVE_STATUS ? 'Your account has been approved' : `Driver status updated: ${payload.status}`);
        };

        const handleConsumerLocation = (payload) => {
            if (!currentLiveJob?._id || payload?.bookingId !== currentLiveJob._id || !payload?.location) return;
            setConsumerLiveLocation(payload.location);
        };

        socket.on('new_booking_broadcast', handleNewBooking);
        socket.on('booking_status_updated', refreshBookings);
        socket.on('driver_verification_updated', handleVerificationUpdate);
        socket.on('consumer_location_updated', handleConsumerLocation);

        return () => {
            socket.off('new_booking_broadcast', handleNewBooking);
            socket.off('booking_status_updated', refreshBookings);
            socket.off('driver_verification_updated', handleVerificationUpdate);
            socket.off('consumer_location_updated', handleConsumerLocation);
        };
    }, [bookings, driver?.status, isOnline]);

    const activeJob =
        bookings.find((booking) => LIVE_JOB_STATUSES.includes(booking.status)) ||
        (isOnline && driver?.status === DRIVER_ACTIVE_STATUS
            ? bookings.find((booking) => booking.status === 'pending')
            : null);

    useEffect(() => {
        setConsumerLiveLocation(null);
    }, [activeJob?._id]);

    const getJobDisplay = (job) => {
        if (!job) return null;

        return {
            customer: job.consumer?.name || 'Customer',
            pickup: job.location?.address?.street || 'Pick up location',
            destination: job.location?.destination?.street || job.location?.destination?.address?.street || null,
            time: job.status === 'pending'
                ? (job.schedule?.type === 'scheduled' && job.schedule?.date
                    ? new Date(job.schedule.date).toLocaleString()
                    : 'Immediate')
                : 'In Progress',
            type: job.service?.name || 'Chauffeur Service',
            reward: `₹${job.pricing?.totalAmount || 0}`
        };
    };

    const driverPosition = Array.isArray(driver?.currentLocation?.coordinates) && driver.currentLocation.coordinates.length === 2
        ? {
            lat: driver.currentLocation.coordinates[1],
            lng: driver.currentLocation.coordinates[0]
        }
        : null;
    const animatedDriverPosition = useSmoothedLocation(driverPosition, 850);
    const animatedConsumerPosition = useSmoothedLocation(consumerLiveLocation, 850);
    const activeServiceKind = useMemo(() => getServiceKind(activeJob), [activeJob]);
    const activeServiceAccent = SERVICE_ACCENTS[activeServiceKind] || SERVICE_ACCENTS.full;

    const pickupPosition = animatedConsumerPosition || (
        activeJob?.location?.address?.coordinates?.lat && activeJob?.location?.address?.coordinates?.lng
            ? {
                lat: activeJob.location.address.coordinates.lat,
                lng: activeJob.location.address.coordinates.lng
            }
            : null
    );
    const destinationCoordinates = activeJob?.location?.destination?.address?.coordinates || activeJob?.location?.destination?.coordinates;
    const destinationPosition = destinationCoordinates?.lat && destinationCoordinates?.lng
        ? {
            lat: destinationCoordinates.lat,
            lng: destinationCoordinates.lng
        }
        : null;
    const liveMapMarkers = ['en_route', 'arrived', 'active'].includes(activeJob?.status) && pickupPosition
        ? [
            {
                position: pickupPosition,
                icon: {
                    url: createCustomerMarkerIcon(activeServiceAccent),
                    scaledSize: { width: 48, height: 56 },
                    anchor: { x: 24, y: 48 }
                },
                infoContent: (
                    <div className="p-1 font-black text-[9px] uppercase text-brand tracking-widest text-center">
                        {consumerLiveLocation ? 'Live Customer' : 'Customer Terminal'}
                    </div>
                )
            },
            ...(animatedDriverPosition ? [{
                position: animatedDriverPosition,
                icon: {
                    url: createDriverMarkerIcon(activeServiceAccent),
                    scaledSize: { width: 46, height: 56 },
                    anchor: { x: 23, y: 46 }
                },
                infoContent: <div className="p-1 font-black text-[9px] uppercase text-green-600 tracking-widest text-center">Your Position</div>
            }] : []),
            ...(destinationPosition ? [{
                position: destinationPosition,
                icon: {
                    url: createDestinationMarkerIcon(),
                    scaledSize: { width: 42, height: 52 },
                    anchor: { x: 21, y: 44 }
                },
                infoContent: <div className="p-1 font-black text-[9px] uppercase text-red-600 tracking-widest text-center">Drop Point</div>
            }] : [])
        ]
        : [];
    const liveMapCircles = pickupPosition
        ? [
            {
                center: pickupPosition,
                radius: consumerLiveLocation ? 90 : 150,
                options: {
                    strokeColor: activeServiceAccent,
                    strokeOpacity: 0.22,
                    strokeWeight: 1,
                    fillColor: activeServiceAccent,
                    fillOpacity: consumerLiveLocation ? 0.07 : 0.09
                }
            },
            ...(animatedDriverPosition ? [{
                center: animatedDriverPosition,
                radius: 110,
                options: {
                    strokeColor: '#111827',
                    strokeOpacity: 0.18,
                    strokeWeight: 1,
                    fillColor: '#111827',
                    fillOpacity: 0.08
                }
            }] : [])
        ]
        : [];

    const handleToggleOnline = async () => {
        if (driver?.status !== DRIVER_ACTIVE_STATUS) {
            toast.error('Verification approval is required before going online');
            return;
        }

        const nextStatus = !isOnline;
        setIsOnline(nextStatus);

        try {
            const response = await spareDriverAPI.toggleOnline(nextStatus);
            const nextIsOnline = response?.data?.isOnline ?? nextStatus;
            setIsOnline(nextIsOnline);
            setDriver((current) => current ? { ...current, isOnline: nextIsOnline } : current);

            const bookingsRes = await spareDriverAPI.getBookings();
            setBookings(bookingsRes?.data?.bookings || []);
        } catch (error) {
            setIsOnline(!nextStatus);
            toast.error(error.message || 'Failed to update driver status');
        }
    };

    const handleUpdateStatus = async (bookingId, nextStatus) => {
        let pin = null;
        if (nextStatus === 'active') {
            pin = window.prompt('Enter 4-digit security PIN from customer:');
            if (!pin) return;
        }

        try {
            await spareDriverAPI.updateBookingStatus(bookingId, nextStatus, pin);
            await refreshDashboard();
            toast.success(`Trip marked ${nextStatus.replace('_', ' ')}`);
        } catch (error) {
            toast.error(error.message || 'Failed to update status');
        }
    };

    const handleCancel = async (bookingId) => {
        const reason = window.prompt('Please provide a reason for cancellation:');
        if (reason === null) return;

        try {
            await spareDriverAPI.cancelBooking(bookingId, reason);
            await refreshDashboard();
            toast.success('Booking cancelled successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to cancel booking');
        }
    };

    const handleAccept = async (bookingId) => {
        try {
            await spareDriverAPI.acceptBooking(bookingId);
            await refreshDashboard();
            toast.success('Booking accepted');
        } catch (error) {
            toast.error(error.message || 'Failed to accept booking');
        }
    };

    const handleReject = async (bookingId) => {
        const reason = window.prompt('Optional reason for rejecting this request:') || '';

        try {
            const response = await spareDriverAPI.rejectBooking(bookingId, reason);
            await refreshDashboard();
            toast.success(response?.message || 'Booking rejected');
        } catch (error) {
            toast.error(error.message || 'Failed to reject booking');
        }
    };

    const jobInfo = getJobDisplay(activeJob);
    const bookedDuration = getBookedDurationLabel(activeJob);

    if (loading) {
        return (
            <DriverLayout title="Dashboard">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-8 h-8 border-2 border-[#F29F05] border-t-transparent rounded-full animate-spin" />
                </div>
            </DriverLayout>
        );
    }

    return (
        <DriverLayout title="Dashboard">
            <div className="px-5 py-6 space-y-5">
                <div className="border border-black/[0.04] rounded-[1.75rem] bg-white p-4 flex items-center justify-between transition-all duration-500 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                    <div>
                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">Status</p>
                        <p className={`text-sm font-black uppercase transition-colors ${isOnline ? 'text-green-600' : 'text-black'}`}>
                            {isOnline ? 'Online - Preparing Pulse' : 'Offline'}
                        </p>
                    </div>
                    <button
                        onClick={handleToggleOnline}
                        disabled={driver?.status !== DRIVER_ACTIVE_STATUS}
                        className={`w-12 h-6 rounded-sm relative transition-colors duration-300 flex items-center px-0.5 ${isOnline ? 'bg-[#F29F05]' : 'bg-gray-200'} ${driver?.status !== DRIVER_ACTIVE_STATUS ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-sm shadow transition-transform duration-300 ${isOnline ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Today's Pay", value: `₹${driver?.wallet?.balance || 0}`, note: 'wallet' },
                        { label: 'Rating', value: (driver?.rating || 5.0).toFixed(1), note: 'star' },
                        { label: 'Status', value: driver?.status === DRIVER_ACTIVE_STATUS ? 'Verified' : 'Reviewing', note: 'shield' },
                    ].map((item, index) => (
                        <div key={index} className="border border-black/[0.04] rounded-[1.35rem] p-3 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">{item.label}</p>
                            <p className="text-[17px] font-black text-black leading-none">{item.value}</p>
                            <p className="text-[8px] font-black text-[#F29F05] uppercase mt-1">{item.note}</p>
                        </div>
                    ))}
                </div>

                {jobInfo ? (
                    <div className={`border rounded-[2rem] p-4 space-y-3 transition-all shadow-[0_24px_55px_rgba(15,23,42,0.08)] ${activeJob.status === 'pending' ? 'border-black/[0.04] bg-white' : 'border-[#F29F05]/25 bg-[linear-gradient(180deg,#FFFBF0_0%,#FFFFFF_100%)]'}`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${activeJob.status === 'pending' ? 'text-black/30' : 'text-[#F29F05]'}`}>
                                {activeJob.status === 'pending' ? 'Available Request' : 'Active Mission'}
                            </span>
                            <div className="flex flex-col items-end">
                                <p className="text-[12px] font-black text-black leading-none">₹{activeJob.pricing?.totalAmount || 0}</p>
                                <p className="text-[7px] font-bold text-black/25 uppercase tracking-widest mt-0.5">Current Fare</p>
                            </div>
                        </div>

                        {isOutstationBooking(activeJob) && (
                            <div className="bg-blue-600 text-white px-3 py-1.5 rounded-md flex items-center gap-2 w-fit">
                                <Zap size={10} fill="currentColor" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Outstation Mission</span>
                            </div>
                        )}
                        {isFullDayBooking(activeJob) && (
                            <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md flex items-center gap-2 w-fit border border-amber-100">
                                <Clock size={10} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Full Day Shift</span>
                            </div>
                        )}

                        <div>
                            <p className="text-sm font-black text-black uppercase">{jobInfo.type}</p>
                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-1.5 text-black/40">
                                    <Clock size={11} />
                                    <span className="text-[10px] font-black uppercase">{jobInfo.time} ({activeJob.status})</span>
                                </div>
                                {activeJob.notes?.internal?.includes('[WAITING]') && (
                                    <span className="text-[7px] font-black text-[#F29F05] bg-[#F29F05]/10 px-1.5 py-0.5 rounded-sm uppercase tracking-widest animate-pulse">
                                        Wait Charge Applied
                                    </span>
                                )}
                            </div>
                            {bookedDuration && (
                                <p className="text-[9px] font-black text-black/35 uppercase tracking-widest mt-2">
                                    Booked Window: {bookedDuration}
                                </p>
                            )}
                            {isOutstationBooking(activeJob) && (
                                <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mt-2">
                                    Long route trip. Track destination, tolls and return timing carefully.
                                </p>
                            )}
                        </div>

                        {['active', 'arrived'].includes(activeJob.status) && activeJob.pricing?.breakdown?.filter((item) => item.amount > 0).length > 0 && (
                            <div className="px-3 py-2 bg-black/[0.02] border border-black/5 rounded-lg space-y-1">
                                <p className="text-[7px] font-black text-black/20 uppercase tracking-widest mb-1">Fare Breakdown</p>
                                {activeJob.pricing.breakdown.filter((item) => item.amount > 0).map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-[8px] font-bold text-black/40 uppercase">{item.name}</span>
                                        <span className="text-[8px] font-black text-black">+₹{item.amount}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {['en_route', 'arrived', 'active'].includes(activeJob.status) && pickupPosition && (
                            <div className="mt-2 rounded-[1.7rem] border border-black/[0.04] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div>
                                        <p className="text-[8px] font-black text-black/25 uppercase tracking-[0.24em] leading-none">Live Route Desk</p>
                                        <p className="text-[12px] font-[1000] text-black uppercase tracking-[0.08em] leading-none mt-2">
                                            {consumerLiveLocation ? 'Customer Live on Map' : 'Pickup Route Locked'}
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-[#FFF7ED] border border-[#FED7AA] px-3 py-2">
                                        <span className="text-[8px] font-black uppercase tracking-[0.24em]" style={{ color: activeServiceAccent }}>
                                            {activeJob.status === 'active' ? 'Trip Active' : activeJob.status === 'arrived' ? 'At Pickup' : 'On Route'}
                                        </span>
                                    </div>
                                </div>

                                <div className="h-[240px] w-full rounded-[1.45rem] overflow-hidden border border-black/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_16px_34px_rgba(15,23,42,0.06)]">
                                    <GoogleMapBox
                                        center={pickupPosition}
                                        zoom={15}
                                        markers={liveMapMarkers}
                                        circles={liveMapCircles}
                                        darkMode={false}
                                    />
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <div className="rounded-[1.15rem] border border-black/[0.05] bg-white px-3 py-3">
                                        <p className="text-[8px] font-black text-black/25 uppercase tracking-[0.22em] leading-none">Customer Marker</p>
                                        <p className="text-[10px] font-[1000] text-black/70 uppercase leading-snug mt-2">
                                            {consumerLiveLocation ? 'Live moving position' : 'Pickup point locked'}
                                        </p>
                                    </div>
                                    <div className="rounded-[1.15rem] border border-black/[0.05] bg-white px-3 py-3">
                                        <p className="text-[8px] font-black text-black/25 uppercase tracking-[0.22em] leading-none">Driver Marker</p>
                                        <p className="text-[10px] font-[1000] text-black/70 uppercase leading-snug mt-2">
                                            Smooth premium route view
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1 pt-2 border-t border-black/5">
                            <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                <MapPin size={12} className="text-brand shrink-0" />
                                <span className="text-[10px] font-black text-black/60 uppercase truncate">{jobInfo.pickup}</span>
                                <span className="text-[7px] font-black text-brand uppercase ml-auto">Pickup</span>
                            </div>
                            {bookedDuration && (
                                <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                    <Clock size={12} className="text-black/25 shrink-0" />
                                    <span className="text-[10px] font-black text-black/60 uppercase truncate">{bookedDuration}</span>
                                    <span className="text-[7px] font-black text-amber-700 uppercase ml-auto">
                                        {isFullDayBooking(activeJob) ? 'Shift Window' : 'Duration'}
                                    </span>
                                </div>
                            )}
                            {jobInfo.destination && (
                                <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                    <MapPin size={12} className="text-red-500 shrink-0" />
                                    <span className="text-[10px] font-black text-black/60 uppercase truncate">{jobInfo.destination}</span>
                                    <span className="text-[7px] font-black text-red-500 uppercase ml-auto">Drop</span>
                                </div>
                            )}
                            {isOutstationBooking(activeJob) && (
                                <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                    <Zap size={12} className="text-blue-500 shrink-0" />
                                    <span className="text-[10px] font-black text-black/60 uppercase truncate">Stay, tolls and parking follow outstation policy</span>
                                    <span className="text-[7px] font-black text-blue-600 uppercase ml-auto">Protocol</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            {activeJob.status === 'en_route' && (
                                <button
                                    onClick={() => handleUpdateStatus(activeJob._id, 'arrived')}
                                    className="w-full h-11 text-[10px] font-black uppercase tracking-widest rounded-[1rem] bg-black text-white shadow-[0_14px_30px_rgba(0,0,0,0.16)] flex items-center justify-center gap-2"
                                >
                                    Confirm Arrival at Location
                                </button>
                            )}

                            {activeJob.status === 'arrived' && (
                                <button
                                    onClick={() => handleUpdateStatus(activeJob._id, 'active')}
                                    className="w-full h-11 text-[10px] font-black uppercase tracking-widest rounded-[1rem] bg-[#F29F05] text-black shadow-[0_16px_32px_rgba(242,159,5,0.24)] flex items-center justify-center gap-2"
                                >
                                    Verify PIN and Start Trip
                                </button>
                            )}

                            {activeJob.status === 'active' && (
                                <button
                                    onClick={() => handleUpdateStatus(activeJob._id, 'completed')}
                                    className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-md bg-green-600 text-white flex items-center justify-center gap-2"
                                >
                                    Complete Mission
                                </button>
                            )}

                            {['en_route', 'arrived'].includes(activeJob.status) && (
                                <button
                                    onClick={() => handleCancel(activeJob._id)}
                                    className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-md border border-red-100 text-red-500 flex items-center justify-center gap-2 mt-2"
                                >
                                    Cancel Request
                                </button>
                            )}

                            {activeJob.status === 'pending' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleReject(activeJob._id)}
                                        className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-md border border-red-100 text-red-500 flex items-center justify-center gap-2"
                                    >
                                        Reject Request
                                    </button>
                                    <button
                                        onClick={() => handleAccept(activeJob._id)}
                                        className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-md bg-[#F29F05] text-black flex items-center justify-center gap-2"
                                    >
                                        Accept Request
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center gap-2">
                        <AlertCircle size={20} className="text-black/15" />
                        <p className="text-[9px] font-black text-black/25 uppercase tracking-widest text-center">
                            {isOnline ? 'Waiting for job broadcasts...' : 'Go online to receive jobs'}
                        </p>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-black/25 uppercase tracking-widest leading-none">Recent Earnings</p>
                        <button
                            onClick={() => navigate('/spare-driver/history-log')}
                            className="text-[9px] font-black text-[#F29F05] uppercase tracking-widest leading-none"
                        >
                            View All
                        </button>
                    </div>

                    <div className="border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-50 bg-white">
                        {transactions.length > 0 ? (
                            transactions.map((transaction, index) => (
                                <div key={transaction._id || index} className="px-4 py-3.5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                                            <TrendingUp size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-black leading-none mb-1 uppercase tracking-tight">Booking Multiplier</p>
                                            <p className="text-[8px] font-bold text-black/20 uppercase tracking-widest">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs font-black text-green-600 leading-none">+₹{transaction.amount}</p>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center bg-gray-50/30">
                                <p className="text-[8px] font-bold text-black/20 uppercase tracking-widest">No earnings recorded yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <p className="text-[9px] font-black text-black/25 uppercase tracking-widest mb-3">Driver Hub</p>
                    <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
                        {[
                            { label: 'Document Center', icon: FileText, action: () => navigate('/spare-driver/profile') },
                            { label: 'Alert Center', icon: Bell, action: () => navigate('/spare-driver/notifications') },
                            { label: 'Trip Records', icon: Route, action: () => navigate('/spare-driver/history-log') },
                        ].map(({ label, icon: Icon, action }, index) => (
                            <button key={index} onClick={action} className="w-full px-4 py-3.5 flex items-center justify-between active:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Icon size={14} className="text-black/30" />
                                    <span className="text-[11px] font-black text-black uppercase tracking-tight">{label}</span>
                                </div>
                                <ChevronRight size={13} className="text-black/20" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </DriverLayout>
    );
};

export default DriverDashboard;
