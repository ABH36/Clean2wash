import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
    TrendingUp, Star, Clock, MapPin, ChevronRight, AlertCircle, 
    Zap, FileText, Bell, Route, ShieldCheck, CreditCard, 
    Radar, ZapOff, MessageSquareText, Wallet, User, Navigation, Loader2, Upload, Phone, Package
} from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { socketService } from '../../../utils/socket';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import { useTheme } from '../../../context/ThemeContext';
import DriverLocationPrompt from '../components/DriverLocationPrompt';
import { useOfflineQueue } from '../../../hooks/useOfflineQueue';
import OfflineIndicator from '../../../components/OfflineIndicator';
import SOSButton from '../../../components/SOSButton';

const svgToDataUrl = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const createMarkerIcon = (accent) => svgToDataUrl(`
<svg width="64" height="78" viewBox="0 0 64 78" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="32" cy="69" rx="15" ry="5" fill="rgba(15,23,42,0.1)"/>
  <path d="M32 4C20.9 4 12 12.9 12 24C12 39 32 58 32 58C32 58 52 39 52 24C52 12.9 43.1 4 32 4Z" fill="#111827" stroke="${accent}" stroke-width="2.5"/>
  <circle cx="32" cy="24" r="10" fill="white" fill-opacity="0.9"/>
  <circle cx="32" cy="24" r="5" fill="${accent}"/>
</svg>
`);

const createConsumerMarkerIcon = () => svgToDataUrl(`
<svg width="68" height="82" viewBox="0 0 68 82" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="34" cy="73" rx="16" ry="5" fill="rgba(15,23,42,0.12)"/>
  <path d="M34 5C22.4 5 13 14.4 13 26C13 41.8 34 62 34 62C34 62 55 41.8 55 26C55 14.4 45.6 5 34 5Z" fill="white" stroke="#FACD15" stroke-width="2.2"/>
  <circle cx="34" cy="24" r="11.5" fill="#FEF9C3"/>
  <rect x="24.5" y="23.2" width="19" height="5.4" rx="2.7" fill="#111827"/>
  <rect x="28" y="18.6" width="12" height="4.8" rx="2.4" fill="#FACD15"/>
  <circle cx="29.5" cy="30.7" r="2.7" fill="#111827"/>
  <circle cx="38.5" cy="30.7" r="2.7" fill="#111827"/>
</svg>
`);

const DRIVER_ACTIVE_STATUS = 'active';
const LIVE_JOB_STATUSES = ['en_route', 'arrived', 'active'];
const ADDRESS_PROMPT_COOLDOWN_MS = 3 * 60 * 60 * 1000;
const KIT_PROMPT_COOLDOWN_MS = 2 * 60 * 60 * 1000;
const POLICE_PROMPT_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const DEFAULT_KIT_CONFIG = {
    title: 'Starter Driver Kit',
    subtitle: 'Complete payment to unlock your chauffeur dashboard.',
    kitPrice: 1499,
    monthlyDeductionAmount: 199,
    monthlyDeductionMonths: 2,
    imageUrls: []
};
const DEFAULT_PREMIUM_CONFIG = {
    title: 'Premium Driver Program',
    subtitle: 'Police-verified chauffeurs get premium trust and booking visibility.',
    benefits: [
        'Premium badge on profile and operational identity',
        'Priority visibility for high-trust customer trips',
        'Higher confidence score during manual assignment'
    ]
};

const loadRazorpayScript = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);

    const existingScript = document.querySelector('script[data-razorpay-sdk="true"]');
    if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Razorpay checkout script')), { once: true });
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpaySdk = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
});

const useSmoothedLocation = (target, duration = 900) => {
    const [display, setDisplay] = useState(target);
    const frame = useRef();
    useEffect(() => {
        if (!target) return;
        if (!display) return setDisplay(target);
        const start = display;
        const startTime = Date.now();
        const tick = () => {
            const p = Math.min(1, (Date.now() - startTime) / duration);
            setDisplay({
                lat: start.lat + (target.lat - start.lat) * p,
                lng: start.lng + (target.lng - start.lng) * p
            });
            if (p < 1) frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame.current);
    }, [target?.lat, target?.lng]);
    return display;
};

const DriverDashboard = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [isOnline, setIsOnline] = useState(false);
    const [driver, setDriver] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [consumerLiveLocation, setConsumerLiveLocation] = useState(null);
    const [kitPopupOpen, setKitPopupOpen] = useState(false);
    const [kitPaying, setKitPaying] = useState(false);
    const [kitConfig, setKitConfig] = useState(DEFAULT_KIT_CONFIG);
    const [premiumConfig, setPremiumConfig] = useState(DEFAULT_PREMIUM_CONFIG);
    const [policePopupOpen, setPolicePopupOpen] = useState(false);
    const [addressPopupOpen, setAddressPopupOpen] = useState(false);
    const [pvrFile, setPvrFile] = useState(null);
    const [pvrNumber, setPvrNumber] = useState('');
    const [pvrSubmitting, setPvrSubmitting] = useState(false);
    const [localCoords, setLocalCoords] = useState(null);
    const [routePath, setRoutePath] = useState([]);
    const lastGpsSyncRef = useRef(0);
    
    // Offline Queue Hook
    const offlineQueue = useOfflineQueue(spareDriverAPI);

    const hasAddressConfigured = (driverData) => {
        const street = String(driverData?.address?.street || '').trim();
        const city = String(driverData?.address?.city || '').trim();
        return Boolean(street && city);
    };

    const shouldShowAddressPopup = (driverData) => {
        if (!driverData?._id) return false;
        if (!['kit_payment_pending', 'active'].includes(driverData.status)) return false;
        if (hasAddressConfigured(driverData)) return false;
        const cooldownKey = `spare_driver_address_prompt_next_at_${driverData._id}`;
        const nextAllowedAt = Number(localStorage.getItem(cooldownKey) || 0);
        const shownInSession = sessionStorage.getItem(`spare_driver_address_prompt_shown_${driverData._id}`) === '1';
        return Date.now() >= nextAllowedAt && !shownInSession;
    };

    const shouldShowKitPopup = (driverData) => {
        if (!driverData?._id) return false;
        if (driverData.status !== 'verified_pending_kit') return false;
        const cooldownKey = `spare_driver_kit_prompt_next_at_${driverData._id}`;
        const nextAllowedAt = Number(localStorage.getItem(cooldownKey) || 0);
        const shownInSession = sessionStorage.getItem(`spare_driver_kit_prompt_shown_${driverData._id}`) === '1';
        return Date.now() >= nextAllowedAt && !shownInSession;
    };

    const shouldShowPolicePopup = (driverData) => {
        if (!driverData?._id) return false;
        const policeUploaded = Boolean(driverData?.documents?.policeVerification?.url);
        const policeApproved = driverData?.verification?.policeStatus === 'approved';
        const policeRejected = driverData?.verification?.policeStatus === 'rejected';
        const eligible = driverData?.status === 'active' && !policeApproved && (policeRejected || !policeUploaded);
        if (!eligible) return false;
        const cooldownKey = `spare_driver_police_prompt_next_at_${driverData._id}`;
        const nextAllowedAt = Number(localStorage.getItem(cooldownKey) || 0);
        const shownInSession = sessionStorage.getItem(`spare_driver_police_prompt_shown_${driverData._id}`) === '1';
        return Date.now() >= nextAllowedAt && !shownInSession;
    };

    const refresh = async () => {
        try {
            const [p, b, unreadCount] = await Promise.all([
                spareDriverAPI.getProfile(), 
                spareDriverAPI.getBookings(),
                spareDriverAPI.getUnreadMessageCount()
            ]);
            
            const driverData = p.data.driver;
            driverData.unreadMessages = unreadCount.data?.unreadCount || 0;
            
            setDriver(driverData);
            setBookings(b.data.bookings || []);
            setIsOnline(!!driverData.isOnline);

            const needsKitPayment = shouldShowKitPopup(driverData);
            if (needsKitPayment) {
                setKitPopupOpen(true);
                if (driverData?._id) {
                    sessionStorage.setItem(`spare_driver_kit_prompt_shown_${driverData._id}`, '1');
                }
                setAddressPopupOpen(false);
            } else if (driverData?.status !== 'verified_pending_kit') {
                setKitPopupOpen(false);
            }

            const needsAddressPopup = shouldShowAddressPopup(driverData);

            if (needsAddressPopup && !needsKitPayment) {
                setAddressPopupOpen(true);
                if (driverData?._id) {
                    sessionStorage.setItem(`spare_driver_address_prompt_shown_${driverData._id}`, '1');
                }
            } else if (!needsAddressPopup) {
                setAddressPopupOpen(false);
                if (driverData?._id && hasAddressConfigured(driverData)) {
                    localStorage.removeItem(`spare_driver_address_prompt_next_at_${driverData._id}`);
                    sessionStorage.removeItem(`spare_driver_address_prompt_shown_${driverData._id}`);
                }
            }

            const canTriggerPolicePopup = shouldShowPolicePopup(driverData);
            if (canTriggerPolicePopup && !needsKitPayment && !needsAddressPopup) {
                setPolicePopupOpen(true);
                if (driverData?._id) {
                    sessionStorage.setItem(`spare_driver_police_prompt_shown_${driverData._id}`, '1');
                }
            } else if (!canTriggerPolicePopup) {
                setPolicePopupOpen(false);
            }

            const policeUploaded = Boolean(driverData?.documents?.policeVerification?.url);
            if (policeUploaded) {
                setPvrFile(null);
                setPvrNumber(driverData?.documents?.policeVerification?.number || '');
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!kitPopupOpen) return;
        spareDriverAPI.getKitConfig()
            .then((res) => {
                const config = res?.data?.kitConfig || {};
                setKitConfig((prev) => ({
                    ...prev,
                    ...config,
                    imageUrls: Array.isArray(config?.imageUrls) ? config.imageUrls : prev.imageUrls
                }));
            })
            .catch(() => {});
    }, [kitPopupOpen]);

    useEffect(() => {
        if (!policePopupOpen) return;
        spareDriverAPI.getPremiumConfig()
            .then((res) => {
                const config = res?.data?.premiumConfig || {};
                setPremiumConfig((prev) => ({
                    ...prev,
                    ...config,
                    benefits: Array.isArray(config?.benefits) ? config.benefits : prev.benefits
                }));
            })
            .catch(() => {});
    }, [policePopupOpen]);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 20000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('chauffeur_token');
        if (!token) return;
        socketService.connect(token);
        const socket = socketService.getSocket();
        if (!socket) return;

        const activeJob = bookings.find(b => LIVE_JOB_STATUSES.includes(b.status));
        if (activeJob) {
            socketService.joinBookingRoom(activeJob._id);
        }

        socket.on('consumer_location_updated', (payload) => {
            if (activeJob && payload.bookingId === activeJob._id) {
                setConsumerLiveLocation(payload.location);
            }
        });

        socket.on('booking_status_updated', (payload) => {
            if (activeJob && payload?.bookingId === activeJob._id) {
                refresh();
            }
        });
        
        socket.on('new_booking_broadcast', () => {
            toast.success("NEW MISSION SIGNAL DETECTED", { 
                style: { background: '#000', color: '#FACD15', fontWeight: '900' },
                icon: '⚡'
            });
            refresh();
        });

        socket.on('new_message', (data) => {
            // Update unread count when new message received
            setDriver(prev => prev ? {
                ...prev,
                unreadMessages: (prev.unreadMessages || 0) + 1
            } : null);
            
            toast.success("New message received", {
                style: { background: '#000', color: '#FACD15', fontWeight: '900' },
                duration: 2000
            });
        });

        return () => {
            socket.off('consumer_location_updated');
            socket.off('new_booking_broadcast');
            socket.off('booking_status_updated');
            socket.off('new_message');
        };
    }, [bookings]);

    // 📍 Real-time Telemetry & Route Calculation
    useEffect(() => {
        if (!isOnline || !('geolocation' in navigator)) return;
        
        const activeJob = bookings.find(b => LIVE_JOB_STATUSES.includes(b.status));
        
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocalCoords(coords);
                
                if (activeJob) {
                    socketService.emit('update_location', {
                        bookingId: activeJob._id,
                        location: coords
                    });

                    const now = Date.now();
                    if (now - lastGpsSyncRef.current >= 12000) {
                        lastGpsSyncRef.current = now;
                        
                        // Try to update location, queue if offline
                        if (offlineQueue.isOnline) {
                            spareDriverAPI.updateLocation(coords.lat, coords.lng).catch((error) => {
                                console.error('Location update failed:', error);
                                // Queue for retry
                                offlineQueue.enqueue('location', { lat: coords.lat, lng: coords.lng }, 'normal');
                            });
                        } else {
                            // Offline - queue immediately
                            offlineQueue.enqueue('location', { lat: coords.lat, lng: coords.lng }, 'normal');
                        }
                    }

                    // Update Route if consumer location is known
                    if (consumerLiveLocation && window.google) {
                        const ds = new window.google.maps.DirectionsService();
                        ds.route({
                            origin: coords,
                            destination: consumerLiveLocation,
                            travelMode: window.google.maps.TravelMode.DRIVING
                        }, (result, status) => {
                            if (status === 'OK' && result.routes[0]) {
                                setRoutePath(
                                    result.routes[0].overview_path.map((point) => ({
                                        lat: point.lat(),
                                        lng: point.lng()
                                    }))
                                );
                            }
                        });
                    }
                }
            },
            (err) => console.warn("GPS Uplink Warning:", err),
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isOnline, bookings, consumerLiveLocation]);

    const activeJob = bookings.find(b => LIVE_JOB_STATUSES.includes(b.status)) || (isOnline ? bookings.find(b => b.status === 'pending' || b.status === 'confirmed') : null);

    useEffect(() => {
        setRoutePath([]);
        setConsumerLiveLocation(null);
    }, [activeJob?._id]);

    const driverPosition = useMemo(() => {
        if (localCoords) return localCoords;
        if (!driver?.currentLocation?.coordinates) return null;
        return { lat: driver.currentLocation.coordinates[1], lng: driver.currentLocation.coordinates[0] };
    }, [driver, localCoords]);

    const smoothedDriver = useSmoothedLocation(driverPosition);
    const smoothedConsumer = useSmoothedLocation(consumerLiveLocation);

    const mapCenter = useMemo(() => {
        if (!smoothedDriver && !smoothedConsumer) return { lat: 20.5937, lng: 78.9629 };
        if (smoothedDriver && !smoothedConsumer) return smoothedDriver;
        if (!smoothedDriver && smoothedConsumer) return smoothedConsumer;
        // Calculation of midpoint for better multi-point visibility
        return {
            lat: (smoothedDriver.lat + smoothedConsumer.lat) / 2,
            lng: (smoothedDriver.lng + smoothedConsumer.lng) / 2
        };
    }, [smoothedDriver, smoothedConsumer]);

    const handleToggle = async () => {
        if (driver?.status !== DRIVER_ACTIVE_STATUS) return toast.error('VERIFICATION REQUIRED');
        try {
            const res = await spareDriverAPI.toggleOnline(!isOnline);
            setIsOnline(res.data.isOnline);
            refresh();
        } catch (e) { toast.error('UPLINK ERROR'); }
    };

    const handleStatus = async (bid, st) => {
        let pin = st === 'active' ? prompt('ENTER 4-DIGIT SECURITY PIN:') : null;
        if (st === 'active' && !pin) return;
        
        try {
            if (offlineQueue.isOnline) {
                await spareDriverAPI.updateBookingStatus(bid, st, pin);
                refresh();
                toast.success(`PROTOCOL: ${st.toUpperCase()}`);
            } else {
                // Offline - queue the status update
                offlineQueue.enqueue('status_update', { bookingId: bid, status: st, pin }, 'high');
                toast.success(`QUEUED: ${st.toUpperCase()} (Will sync when online)`);
            }
        } catch (e) {
            // If online but failed, queue for retry
            if (offlineQueue.isOnline) {
                offlineQueue.enqueue('status_update', { bookingId: bid, status: st, pin }, 'high');
                toast.error(`${e.message} - Queued for retry`);
            } else {
                toast.error(e.message);
            }
        }
    };

    const handleKitRazorpay = async () => {
        setKitPaying(true);
        try {
            await loadRazorpayScript();
            const keyRes = await spareDriverAPI.getKitPaymentKey();
            const orderRes = await spareDriverAPI.createKitPaymentOrder();

            const keyId = keyRes?.data?.key_id;
            const orderData = orderRes?.data;

            if (!keyId || !orderData?.order_id) {
                throw new Error('Could not initialize kit payment');
            }

            await new Promise((resolve, reject) => {
                const razorpay = new window.Razorpay({
                    key: keyId,
                    amount: orderData.amount,
                    currency: orderData.currency || 'INR',
                    name: 'Spare Driver',
                    description: 'Spare Driver Starter Kit',
                    order_id: orderData.order_id,
                    prefill: {
                        name: driver?.name || '',
                        email: driver?.email || '',
                        contact: driver?.phone || ''
                    },
                    theme: { color: '#FACD15' },
                    handler: async (response) => {
                        try {
                            await spareDriverAPI.verifyKitPayment(response);
                            resolve(true);
                        } catch (verificationError) {
                            reject(verificationError);
                        }
                    },
                    modal: {
                        ondismiss: () => reject(new Error('Kit payment checkout was cancelled'))
                    }
                });

                razorpay.on('payment.failed', (event) => {
                    reject(new Error(event?.error?.description || 'Kit payment failed'));
                });

                razorpay.open();
            });

            toast.success('Kit payment submitted successfully');
            setKitPopupOpen(false);
            if (driver?._id) {
                localStorage.setItem(`spare_driver_kit_prompt_next_at_${driver._id}`, String(Date.now() + KIT_PROMPT_COOLDOWN_MS));
            }
            await refresh();
        } catch (error) {
            toast.error(error.message || 'Could not complete kit payment');
        } finally {
            setKitPaying(false);
        }
    };

    const handlePoliceVerificationSubmit = async () => {
        if (!pvrFile) {
            toast.error('Police verification document is required');
            return;
        }

        setPvrSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('pvrFile', pvrFile);
            formData.append('pvrNumber', pvrNumber);
            await spareDriverAPI.uploadPoliceVerification(formData);
            toast.success('Police verification submitted');
            setPolicePopupOpen(false);
            if (driver?._id) {
                localStorage.setItem(`spare_driver_police_prompt_next_at_${driver._id}`, String(Date.now() + POLICE_PROMPT_COOLDOWN_MS));
            }
            await refresh();
        } catch (err) {
            toast.error(err.message || 'Could not submit police verification');
        } finally {
            setPvrSubmitting(false);
        }
    };

    const handleAddressPopupDismiss = () => {
        if (!driver?._id) return setAddressPopupOpen(false);
        const cooldownKey = `spare_driver_address_prompt_next_at_${driver._id}`;
        localStorage.setItem(cooldownKey, String(Date.now() + ADDRESS_PROMPT_COOLDOWN_MS));
        setAddressPopupOpen(false);
    };

    const handleEmergency = async (emergencyData) => {
        try {
            await spareDriverAPI.reportEmergency(emergencyData);
            
            // Emit socket event for real-time admin notification
            socketService.emit('driver_emergency', {
                driverId: driver?._id,
                bookingId: emergencyData.bookingId,
                reason: emergencyData.reason,
                location: {
                    lat: emergencyData.latitude,
                    lng: emergencyData.longitude
                },
                timestamp: new Date()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Emergency report failed:', error);
            throw error;
        }
    };

    const showNavigationHUD = activeJob && LIVE_JOB_STATUSES.includes(activeJob.status);
    const fallbackRoutePath = useMemo(() => {
        if (!smoothedDriver || !smoothedConsumer) return [];
        return [smoothedDriver, smoothedConsumer];
    }, [smoothedDriver, smoothedConsumer]);
    const liveRoutePath = routePath.length > 1 ? routePath : fallbackRoutePath;
    const liveDistanceKm = useMemo(() => {
        if (liveRoutePath.length < 2) return 0;
        let distance = 0;
        for (let i = 1; i < liveRoutePath.length; i += 1) {
            const a = liveRoutePath[i - 1];
            const b = liveRoutePath[i];
            const toRad = (value) => (value * Math.PI) / 180;
            const dLat = toRad(b.lat - a.lat);
            const dLng = toRad(b.lng - a.lng);
            const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * (Math.sin(dLng / 2) ** 2);
            const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
            distance += 6371 * c;
        }
        return distance;
    }, [liveRoutePath]);
    const liveEtaMinutes = useMemo(() => {
        if (!Number.isFinite(liveDistanceKm) || liveDistanceKm <= 0) return 0;
        const avgCitySpeedKmH = 22;
        return Math.max(1, Math.round((liveDistanceKm / avgCitySpeedKmH) * 60));
    }, [liveDistanceKm]);

    if (loading) return <DriverLayout><div className="flex h-[60vh] items-center justify-center font-black text-brand uppercase tracking-[0.4em] animate-pulse">Syncing Telemetry...</div></DriverLayout>;

    return (
        <>
            {/* Offline Indicator */}
            <OfflineIndicator 
                isOnline={offlineQueue.isOnline}
                queueSize={offlineQueue.queueSize}
                isSyncing={offlineQueue.isSyncing}
                onSync={offlineQueue.syncQueue}
            />
            
            <DriverLayout 
                title={showNavigationHUD ? "Navigation Mode" : "Command Center"} 
                hideNav={showNavigationHUD} 
                hideHeader={showNavigationHUD}
                isOnline={isOnline}
                onToggle={handleToggle}
                showToggle={!showNavigationHUD}
            >
            {showNavigationHUD ? (
                /* ── High-Fidelity Navigation HUD (Full Screen Mode) ── */
                <div className="fixed inset-0 z-0 bg-slate-900 overflow-hidden">
                    <GoogleMapBox 
                        center={mapCenter}
                        zoom={16}
                        darkMode={false}
                        options={{ gestureHandling: 'greedy' }}
                        markers={[
                            ...(smoothedDriver ? [{ 
                                position: smoothedDriver, 
                                icon: { 
                                    url: createMarkerIcon('#FACD15'), 
                                    scaledSize: { width: 44, height: 52 },
                                    anchor: { x: 22, y: 44 }
                                }
                            }] : []),
                            ...(smoothedConsumer ? [{ 
                                position: smoothedConsumer, 
                                icon: { 
                                    url: createConsumerMarkerIcon(),
                                    scaledSize: { width: 48, height: 56 },
                                    anchor: { x: 24, y: 46 }
                                }
                            }] : [])
                        ]}
                        polylines={liveRoutePath.length > 1 ? [{
                            path: liveRoutePath,
                            options: {
                                strokeColor: '#FACD15',
                                strokeOpacity: 0.9,
                                strokeWeight: 6,
                                geodesic: true,
                                icons: [{
                                    icon: {
                                        path: 'M 0,-1 0,1',
                                        strokeOpacity: 0.75,
                                        scale: 3
                                    },
                                    offset: '0',
                                    repeat: '12px'
                                }]
                            }
                        }] : []}
                    />

                    {/* Edge-to-Edge Tactical Navigation Dock (Full Width) */}
                    <div className="absolute inset-x-0 bottom-0 z-20">
                        <motion.div 
                            initial={{ y: 100 }} 
                            animate={{ y: 0 }} 
                            className="bg-slate-900/95 backdrop-blur-3xl border-t border-white/10 rounded-t-[2.5rem] p-4 pb-8 shadow-[0_-12px_40px_rgba(0,0,0,0.6)] flex items-center gap-4 overflow-hidden relative"
                        >
                            {/* Left: High-Density Telemetry Cluster */}
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-14 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Clock size={12} className="text-brand" />
                                    <span className="text-[12px] font-black text-white tabular-nums">{liveEtaMinutes ? `${liveEtaMinutes}m` : '--'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Route size={12} className="text-brand/50" />
                                    <span className="text-[10px] font-black text-white/40 tabular-nums">{liveDistanceKm ? `${liveDistanceKm.toFixed(1)}k` : '--'}</span>
                                </div>
                            </div>

                            {/* Middle: Mission Target Hub */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-tighter truncate">{activeJob.userName || 'VIP Client'}</h4>
                                </div>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.1em] truncate italic">{activeJob.location?.address?.street || 'Scanning Sector...'}</p>
                            </div>

                            {/* Right: Operational Triggers */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {/* SOS Button */}
                                <SOSButton
                                    onEmergency={handleEmergency}
                                    bookingId={activeJob._id}
                                    currentLocation={smoothedDriver}
                                    isActive={true}
                                    className="flex-shrink-0"
                                />
                                
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => activeJob?.userPhone ? (window.location.href = `tel:${activeJob.userPhone}`) : toast.error('Uplink Busy: Contact Unavailable')}
                                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-brand"
                                >
                                    <Phone size={20} />
                                </motion.button>

                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => navigate(`/spare-driver/chat/${activeJob._id}`)}
                                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400"
                                >
                                    <MessageSquareText size={20} />
                                </motion.button>
                                
                                <motion.button 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStatus(activeJob._id, activeJob.status === 'en_route' ? 'arrived' : activeJob.status === 'arrived' ? 'active' : 'completed')} 
                                    className="h-14 px-8 bg-brand text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-black/50 shadow-brand/20"
                                >
                                    {activeJob.status === 'en_route' ? 'Arrived' : activeJob.status === 'arrived' ? 'Initiate' : 'Done'}
                                    <ChevronRight size={16} strokeWidth={3} />
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            ) : (
                /* ── Standard Dashboard Interface ── */
                <div className="px-6 py-6 space-y-6 pb-24">

                {/* ── Security Alerts (Fraud Detection) ── */}
                {driver && driver.fraudAlerts && driver.fraudAlerts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/5 p-3 flex items-center gap-3 shadow-lg shadow-red-500/5"
                    >
                        <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20 flex-shrink-0">
                            <AlertCircle size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-black text-red-500 uppercase tracking-widest leading-none mb-0.5">Security Alert</p>
                            <p className="text-[11px] font-black text-white leading-tight">
                                {driver.fraudAlerts[0].type.replace('_', ' ')} Detected
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate('/spare-driver/inquiry')}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase"
                        >
                            Review
                        </button>
                    </motion.div>
                )}

                {/* ── Communication Notifications ── */}
                {driver && driver.unreadMessages > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-500/5 p-3 flex items-center gap-3 shadow-lg shadow-blue-500/5 cursor-pointer active:scale-[0.98] transition-all"
                        onClick={() => navigate('/spare-driver/bookings')}
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                            <MessageSquareText size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none mb-0.5">New Messages</p>
                            <p className="text-[11px] font-black text-white leading-tight">
                                {driver.unreadMessages} New conversation{driver.unreadMessages > 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">
                            {driver.unreadMessages}
                        </div>
                    </motion.div>
                )}

                {/* ── Kit Payment Banner (persistent nudge after approval) ── */}
                {driver && ['active', 'ACTIVE', 'verified_pending_kit'].includes(driver.status) && driver.kitStatus === 'NOT_PURCHASED' && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-2xl border border-brand/30 bg-brand/5 p-3 flex items-center gap-3 shadow-lg shadow-brand/5 cursor-pointer active:scale-[0.98] transition-all"
                        onClick={() => navigate('/spare-driver/kit-purchase')}
                    >
                        <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/20 flex-shrink-0 relative z-10">
                            <Package size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0 relative z-10">
                            <p className="text-[8px] font-black text-brand uppercase tracking-widest leading-none mb-0.5">Action required</p>
                            <p className="text-[11px] font-black text-white leading-tight">Complete driver kit activation</p>
                        </div>
                        <ChevronRight size={14} className="text-brand flex-shrink-0 relative z-10" strokeWidth={3} />
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand animate-ping opacity-60" />
                    </motion.div>
                )}

                {/* ── Metrics Grid (Compact) ── */}
                <div className="grid grid-cols-3 gap-2 px-1">
                    {[
                        { l: 'Yield', v: `₹${driver?.wallet?.balance || 0}`, i: Wallet, c: 'text-green-500' },
                        { l: 'Rating', v: (driver?.rating || 4.9).toFixed(1), i: Star, c: 'text-brand' },
                        { l: 'Status', v: isOnline ? 'Online' : 'Standby', i: Radar, c: isOnline ? 'text-brand' : 'text-content/20' }
                    ].map((m, i) => (
                        <div key={i} className="bg-surface border border-content/[0.04] p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                            <p className="text-[7px] font-black text-content/20 uppercase tracking-[0.2em] mb-1">{m.l}</p>
                            <p className="text-[14px] font-black text-content tracking-tighter leading-none">{m.v}</p>
                            <m.i size={12} className={`${m.c} mt-1.5`} />
                        </div>
                    ))}
                </div>

                {/* ── Mission Node ── */}
                <AnimatePresence mode="wait">
                    {activeJob ? (
                        <motion.div key={activeJob._id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`rounded-[2.5rem] p-6 border transition-colors duration-500 ${activeJob.status === 'pending' ? 'bg-surface border-content/5 ' : 'bg-surface border-brand/10 shadow-lg'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeJob.status === 'pending' ? 'bg-black text-brand' : 'bg-brand text-white'}`}>
                                        <Bell size={18} className={activeJob.status === 'pending' ? 'animate-bounce' : ''} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-brand uppercase tracking-widest">Live Mission</p>
                                        <h3 className="text-sm font-black text-content uppercase">{activeJob.service?.name}</h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-content tabular-nums leading-none">₹{activeJob.pricing?.totalAmount}</p>
                                    <p className="text-[7px] font-black text-content/20 uppercase mt-1">Est. Payout</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex gap-4">
                                    <MapPin size={16} className="text-brand shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black text-content/20 uppercase tracking-widest mb-0.5">Pick Logistics</p>
                                        <p className="text-[11px] font-black text-content uppercase truncate">{activeJob.location?.address?.street}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {activeJob.status === 'pending' ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    if (offlineQueue.isOnline) {
                                                        await spareDriverAPI.rejectBooking(activeJob._id);
                                                        refresh();
                                                        toast.success('Booking rejected');
                                                    } else {
                                                        offlineQueue.enqueue('booking_reject', { bookingId: activeJob._id, reason: 'Not available' }, 'high');
                                                        toast.success('Rejection queued (Will sync when online)');
                                                    }
                                                } catch (e) {
                                                    if (offlineQueue.isOnline) {
                                                        offlineQueue.enqueue('booking_reject', { bookingId: activeJob._id, reason: 'Not available' }, 'high');
                                                        toast.error(`${e.message} - Queued for retry`);
                                                    } else {
                                                        toast.error(e.message);
                                                    }
                                                }
                                            }}
                                            className="h-12 rounded-xl border-white/5 border-content/[0.04] text-[10px] font-black uppercase text-content/60"
                                        >
                                            Deny
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    if (offlineQueue.isOnline) {
                                                        await spareDriverAPI.acceptBooking(activeJob._id);
                                                        refresh();
                                                        toast.success('Booking accepted');
                                                    } else {
                                                        offlineQueue.enqueue('booking_accept', { bookingId: activeJob._id }, 'high');
                                                        toast.success('Acceptance queued (Will sync when online)');
                                                    }
                                                } catch (e) {
                                                    if (offlineQueue.isOnline) {
                                                        offlineQueue.enqueue('booking_accept', { bookingId: activeJob._id }, 'high');
                                                        toast.error(`${e.message} - Queued for retry`);
                                                    } else {
                                                        toast.error(e.message);
                                                    }
                                                }
                                            }}
                                            className="h-12 bg-black dark:bg-brand dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-white"
                                        >
                                            Authorize
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Navigation and Communication Row */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <button 
                                                onClick={() => {
                                                    const destination = `${activeJob.location?.address?.coordinates?.lat || 0},${activeJob.location?.address?.coordinates?.lng || 0}`;
                                                    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
                                                    window.open(url, '_blank');
                                                }}
                                                className="h-12 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <Navigation size={14} />
                                                Navigate
                                            </button>
                                            <a 
                                                href={`tel:${activeJob.consumer?.phone}`}
                                                className="h-12 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <Phone size={14} />
                                                Call
                                            </a>
                                            <button 
                                                onClick={() => navigate(`/spare-driver/chat/${activeJob._id}`)}
                                                className="h-12 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <MessageSquareText size={14} />
                                                Chat
                                            </button>
                                        </div>
                                        
                                        {/* SOS Button Row */}
                                        <div className="flex items-center justify-center py-2">
                                            <SOSButton
                                                onEmergency={handleEmergency}
                                                bookingId={activeJob._id}
                                                currentLocation={localCoords}
                                                isActive={true}
                                            />
                                        </div>
                                        
                                        {/* Status Update Button */}
                                        <button 
                                            onClick={() => handleStatus(activeJob._id, activeJob.status === 'en_route' ? 'arrived' : activeJob.status === 'arrived' ? 'active' : 'completed')} 
                                            className="w-full h-14 bg-black dark:bg-brand dark:text-white text-brand rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-black/50 shadow-black/10 flex items-center justify-center gap-3 transition-all active:scale-95"
                                        >
                                            {activeJob.status === 'en_route' ? 'Mark Arrived' : activeJob.status === 'arrived' ? 'Start Trip' : 'Complete Trip'}
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-[50vh] bg-surface/50 border border-content/[0.03] rounded-[2.5rem] flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-500 shadow-inner">
                            {/* Scanning Radar Effect */}
                            <div className="absolute inset-0 z-0 opacity-10">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--brand)_0%,transparent_70%)] animate-pulse" />
                            </div>
                            
                            <div className="relative z-10 p-8">
                                <div className="relative w-24 h-24 mx-auto mb-8">
                                    <div className="absolute inset-0 border-2 border-brand/20 rounded-full animate-[ping_3s_linear_infinite]" />
                                    <div className="absolute inset-0 border border-brand/40 rounded-full animate-[ping_2s_linear_infinite]" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Radar size={48} className={`${isOnline ? 'text-brand animate-spin' : 'text-content/10'}`} style={{ animationDuration: '4s' }} />
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-content/30 uppercase tracking-[0.5em] mb-3 leading-none italic">Sector Scanning...</p>
                                <h3 className="text-[16px] font-black text-content/80 uppercase tracking-tighter leading-tight">
                                    {isOnline ? 'Searching for Priority Missions' : 'Uplink Offline: Standby'}
                                </h3>
                                {!isOnline && (
                                    <button 
                                        onClick={handleToggle}
                                        className="mt-6 px-6 py-2.5 bg-brand text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand/20"
                                    >
                                        Connect to Fleet
                                    </button>
                                )}
                            </div>

                            {/* Decorative Grid */}
                            <div className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--content) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        )}
        <AnimatePresence>
                {kitPopupOpen && driver?.status === 'verified_pending_kit' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm px-6 flex items-end justify-center pb-12"
                    >
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-[400px] bg-surface border border-content/[0.08] rounded-[3rem] p-8 shadow-[0_-20px_40px_rgba(0,0,0,0.4)] relative"
                        >
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-content/[0.1]" />
                            
                            <div className="flex flex-col items-center text-center mb-8 pt-4">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-brand/10 flex items-center justify-center text-brand mb-4">
                                    <Package size={32} />
                                </div>
                                <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-1">Logistics Required</p>
                                <h3 className="text-xl font-black text-content uppercase tracking-tighter leading-none">{kitConfig.title || 'Elite Driver Kit'}</h3>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="p-4 rounded-2xl bg-content/[0.02] border border-content/[0.05] flex items-center justify-between">
                                    <div>
                                        <p className="text-[8px] font-black text-content/30 uppercase mb-1">Activation Fee</p>
                                        <p className="text-lg font-black text-content">₹{driver?.kit?.price || kitConfig.kitPrice || 1499}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-content/30 uppercase mb-1">Deduction</p>
                                        <p className="text-xs font-black text-content uppercase">₹{kitConfig.monthlyDeductionAmount}/mo</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-content/40 text-center px-4 leading-relaxed uppercase italic">
                                    "Professional gear is mandatory for Elite service verification."
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleKitRazorpay}
                                    disabled={kitPaying}
                                    className="w-full h-14 bg-brand text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-black/50 shadow-brand/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    {kitPaying ? <Loader2 size={16} className="animate-spin" /> : 'Authorize Purchase'}
                                </button>
                                <button 
                                    onClick={() => {
                                        if (driver?._id) localStorage.setItem(`spare_driver_kit_prompt_next_at_${driver._id}`, String(Date.now() + KIT_PROMPT_COOLDOWN_MS));
                                        setKitPopupOpen(false);
                                    }}
                                    className="w-full h-12 rounded-2xl border border-content/[0.05] text-[10px] font-black text-content/40 uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    Dismiss Protocol
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {addressPopupOpen && !kitPopupOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm px-6 flex items-end justify-center pb-12"
                    >
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-[400px] bg-surface border border-content/[0.08] rounded-[3rem] p-8 shadow-[0_-20px_40px_rgba(0,0,0,0.4)] relative"
                        >
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-content/[0.1]" />
                            
                            <div className="flex flex-col items-center text-center mb-8 pt-4">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-brand/10 flex items-center justify-center text-brand mb-4">
                                    <MapPin size={32} />
                                </div>
                                <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-1">Matching Algorithm</p>
                                <h3 className="text-xl font-black text-content uppercase tracking-tighter leading-none">Define Base Sector</h3>
                            </div>

                            <div className="rounded-[1.5rem] border border-brand/20 bg-yellow-50/50 p-4 space-y-3 mb-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                                    <p className="text-[11px] font-black text-content/60 uppercase leading-relaxed">
                                        Defining your hub allows the system to prioritize missions in your immediate sector.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => {
                                        if (driver?._id) localStorage.setItem(`spare_driver_address_prompt_next_at_${driver._id}`, String(Date.now() + (20 * 60 * 1000)));
                                        setAddressPopupOpen(false);
                                        navigate('/spare-driver/address');
                                    }}
                                    className="w-full h-14 bg-black dark:bg-brand dark:text-white text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-black/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    Configure Sector <ChevronRight size={16} />
                                </button>
                                <button 
                                    onClick={handleAddressPopupDismiss}
                                    className="w-full h-12 rounded-2xl border border-content/[0.05] text-[10px] font-black text-content/40 uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    Standby Mode
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {policePopupOpen && !kitPopupOpen && !addressPopupOpen && driver?.status === 'active' && driver?.verification?.policeStatus !== 'approved' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm px-6 flex items-end justify-center pb-12"
                    >
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-[400px] bg-surface border border-content/[0.08] rounded-[3rem] p-8 shadow-[0_-20px_40px_rgba(0,0,0,0.4)] relative"
                        >
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-content/[0.1]" />
                            
                            <div className="flex flex-col items-center text-center mb-8 pt-4">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-brand/10 flex items-center justify-center text-brand mb-4">
                                    <ShieldCheck size={32} />
                                </div>
                                <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-1">Security Protocol</p>
                                <h3 className="text-xl font-black text-content uppercase tracking-tighter leading-none">Police Verification</h3>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-content/30 uppercase tracking-widest ml-4">Certificate ID</label>
                                    <input
                                        value={pvrNumber}
                                        onChange={(e) => setPvrNumber(e.target.value)}
                                        placeholder="Enter PVR Reference"
                                        className="w-full h-14 rounded-2xl bg-content/[0.03] border border-content/[0.05] px-6 text-sm font-black text-content placeholder:text-content/20 outline-none focus:border-brand/50 transition-colors"
                                    />
                                </div>

                                <label className="w-full h-24 rounded-2xl border-white/5 border-dashed border-content/[0.1] bg-content/[0.01] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-content/[0.03] transition-all">
                                    <Upload size={20} className="text-content/30" />
                                    <span className="text-[10px] font-black text-content/40 uppercase">{pvrFile ? pvrFile.name : 'Upload Doc'}</span>
                                    <input 
                                        type="file" accept="image/*,.pdf" className="hidden" 
                                        onChange={(e) => setPvrFile(e.target.files?.[0] || null)} 
                                    />
                                </label>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handlePoliceVerificationSubmit}
                                    disabled={pvrSubmitting}
                                    className="w-full h-14 bg-black dark:bg-brand dark:text-white text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-black/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    {pvrSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Clearance'}
                                </button>
                                <button 
                                    onClick={() => {
                                        if (driver?._id) localStorage.setItem(`spare_driver_police_prompt_next_at_${driver._id}`, String(Date.now() + POLICE_PROMPT_COOLDOWN_MS));
                                        setPolicePopupOpen(false);
                                    }}
                                    className="w-full h-12 rounded-2xl border border-content/[0.05] text-[10px] font-black text-content/40 uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {driver?.status === 'active'
                && driver?.verification?.policeStatus === 'approved'
                && !kitPopupOpen
                && !policePopupOpen
                && !addressPopupOpen
                && hasAddressConfigured(driver) && (
                    <DriverLocationPrompt onLocationSet={refresh} />
                )}
            </DriverLayout>
        </>
    );
};

export default DriverDashboard;
