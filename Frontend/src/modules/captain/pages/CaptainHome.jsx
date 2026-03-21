import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Zap, MapPin, Star, TrendingUp, CheckCircle2,
    Clock, ChevronRight, Bell, ToggleLeft, ToggleRight,
    Navigation, Shield, Car, ArrowRight, Sun, Moon,
    Locate, X, Compass
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import CaptainLayout from '../components/CaptainLayout';
import LocationIndicator from '../../../components/Location/LocationIndicator';
import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../hooks/useCaptain';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { socketService } from '../../../utils/socket';

// Fix Leaflet default icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// Custom pulse icon for captain's own position
const captainIcon = L.divIcon({
    className: '',
    html: `
        <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(255,107,0,0.2);animation:ping 1.5s infinite;"></div>
            <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(255,107,0,0.35);"></div>
            <div style="position:relative;width:18px;height:18px;border-radius:50%;background:#FF6B00;border:3px solid white;box-shadow:0 2px 10px rgba(255,107,0,0.6);"></div>
        </div>
        <style>@keyframes ping{0%{transform:scale(1);opacity:1}75%,100%{transform:scale(2.5);opacity:0}}</style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

/**
 * Suppress browser intervention warnings for vibration
 */
const safeVibrate = (pattern) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
            // Only attempt if user has interacted, otherwise it warns/intervenes
            navigator.vibrate(pattern);
        } catch (e) {
            // Silently fail
        }
    }
};

// Custom job request marker
const jobIcon = L.divIcon({
    className: '',
    html: `
        <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(59,130,246,0.2);animation:ping2 2s infinite;"></div>
            <div style="width:22px;height:22px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 2px 10px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;">
                <span style="color:white;font-size:10px;font-weight:900;">★</span>
            </div>
        </div>
        <style>@keyframes ping2{0%{transform:scale(1);opacity:1}75%,100%{transform:scale(2.5);opacity:0}}</style>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

// Live recenter map to captain position
const LiveRecenterer = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) map.setView(position, map.getZoom(), { animate: true });
    }, [position]);
    return null;
};

const CITY_COORDINATES = {
    'Bangalore': [12.9716, 77.5946],
    'Bengaluru': [12.9716, 77.5946],
    'Mumbai': [19.0760, 72.8777],
    'Delhi': [28.6139, 77.2090],
    'New Delhi': [28.6139, 77.2090],
    'Pune': [18.5204, 73.8567],
    'Hyderabad': [17.3850, 78.4867],
    'Chennai': [13.0827, 80.2707],
    'Kolkata': [22.5726, 88.3639],
    'Ahmedabad': [23.0225, 72.5714],
    'Lucknow': [26.8467, 80.9462],
    'Jaipur': [26.9124, 75.7873],
    'Chandigarh': [30.7333, 76.7794],
    'Surat': [21.1702, 72.8311],
    'Indore': [22.7196, 75.8577],
    'Bhopal': [23.2599, 77.4126],
    'Nagpur': [21.1458, 79.0882],
    'Patna': [25.5941, 85.1376],
    'Kochi': [9.9312, 76.2673],
};

const CountdownTimer = ({ targetTime }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!targetTime || !targetTime.timeSlot?.start) return;

        const calculateTime = () => {
            const now = new Date();
            const dateStr = new Date(targetTime.date).toDateString();
            const timeStr = targetTime.timeSlot.start; // e.g. "09:00 AM"

            const fullDateStr = `${dateStr} ${timeStr}`;
            const target = new Date(fullDateStr);

            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft('Time to start!');
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            let res = '';
            if (h > 0) res += `${h}h `;
            res += `${m}m ${s}s`;
            setTimeLeft(res);
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [targetTime]);

    return <span>{timeLeft}</span>;
};

const CaptainHome = () => {
    const navigate = useNavigate();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { sessions } = useAuth();
    const {
        captainJobsLoading,
        captainEarnings,
        acceptJob,
        declineJob,
        commitToScheduledJob,
        toggleOnline,
        loadCaptainDashboard,
        availableProductMissions,
        productMissionsLoading,
        loadAvailableProductMissions,
        acceptProductMission,
        acceptProductBatch
    } = useCaptain();

    const handleAcceptProductMission = async (orderId, itemId, isBatch = false, batchItems = []) => {
        let res;
        if (isBatch) {
            res = await acceptProductBatch(batchItems);
        } else {
            res = await acceptProductMission(orderId, itemId);
        }

        if (res.success) {
            toast.success(isBatch ? 'Batch Mission Claimed!' : 'Product Mission Claimed!', { icon: '📦' });
            if (!isBatch) {
                navigate(`/captain/product-mission/${orderId}/${itemId}`);
            } else {
                // Navigate to the first item with a batch flag
                navigate(`/captain/product-mission/${batchItems[0].orderId}/${batchItems[0].itemId}?isBatch=true`);
            }
        } else {
            toast.error(res.error || 'Failed to claim mission');
        }
    };

    // Mission Commitment Logic
    const needsCommitment = captainJobs.find(j =>
        j.status === 'confirmed' &&
        j.schedule?.type === 'scheduled' &&
        !j.isDoorstepCommitted
    );
    const [isCommitting, setIsCommitting] = useState(null);

    const handleCommit = async (jobId) => {
        setIsCommitting(jobId);
        const res = await commitToScheduledJob(jobId);
        if (res.success) {
            toast.success('Mission Confirmed! See you at the slot.', { icon: '✅' });
        }
        setIsCommitting(null);
    };

    const user = sessions.captain || { name: 'Captain', id: 'CPT-DEFAULT', isOnline: false };
    const online = user.isOnline;
    const userCity = user.profile?.city || user.city || '';

    // Function to get initial coordinates based on user city
    const getInitialCoords = () => {
        if (!userCity) return [12.9716, 77.5946]; // Default to Bangalore if nothing else

        // Find match in our coordinates map
        const matched = Object.keys(CITY_COORDINATES).find(
            c => c.toLowerCase() === userCity.toLowerCase()
        );

        return matched ? CITY_COORDINATES[matched] : [12.9716, 77.5946];
    };

    // Dynamic Stats from backend
    const completedJobs = captainJobs.filter(job => job.status === 'completed');
    const todayEarned = captainEarnings.today?.earned || 0;
    const todayJobsCount = captainEarnings.today?.jobs || 0;
    const totalWeeklyEarnings = captainEarnings.week?.earned || 0;
    const walletBalance = captainEarnings.balance || 0;
    const totalJobsCount = captainEarnings.totalJobs || completedJobs.length;
    const currentRating = captainEarnings.rating || user.rating || 5.0;

    const pendingRequests = captainJobs.filter(job => job.status === 'pending');
    const activeJobs = captainJobs.filter(job => ['accepted', 'confirmed', 'en_route', 'arrived', 'before_photo', 'washing', 'after_photo'].includes(job.status));
    const activeJob = activeJobs[0] || null;

    const [acceptedJobId, setAcceptedJobId] = useState(null);
    const [captainPosition, setCaptainPosition] = useState(getInitialCoords());
    const [positionReady, setPositionReady] = useState(false);
    const [recenter, setRecenter] = useState(false);
    const [currentRegion, setCurrentRegion] = useState('Fetching region...');

    // Haversine formula — calculate real distance in km between two lat/lng points
    const calcDistance = useCallback((lat1, lng1, lat2, lng2) => {
        if (!lat1 || !lng1 || !lat2 || !lng2) return null;
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
    }, []);

    // Get real distance from captain's current GPS to job location
    const getJobDistance = useCallback((job) => {
        const jobLat = job.location?.coordinates?.[1] || job.location?.address?.coordinates?.lat;
        const jobLng = job.location?.coordinates?.[0] || job.location?.address?.coordinates?.lng;
        if (!jobLat || !jobLng) return null;
        const [capLat, capLng] = captainPosition;
        return calcDistance(capLat, capLng, jobLat, jobLng);
    }, [captainPosition, calcDistance]);

    // Alert & Timeout State
    const [timeLeft, setTimeLeft] = useState(30);
    const audioRef = useRef(null);
    const vibrateIntervalRef = useRef(null);
    const timeoutRef = useRef(null);

    // Create beep sound via Web Audio as fallback for missing mp3
    const playBeep = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.4);
        } catch (e) {
            // Silently fail if audio context not available
        }
    }, []);

    // Live GPS tracking
    useEffect(() => {
        if (!('geolocation' in navigator)) return;
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCaptainPosition([latitude, longitude]);
                setPositionReady(true);
            },
            (err) => {
                console.warn('Geolocation error:', err);
                setPositionReady(true); // Use default
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Reverse geocode to show current waiting region
    useEffect(() => {
        const getRegion = async () => {
            // Prefer stored working location from backend if online, otherwise live GPS
            const storedCoords = user.location?.coordinates;
            const pos = (online && storedCoords && (storedCoords[0] !== 0 || storedCoords[1] !== 0))
                ? [storedCoords[1], storedCoords[0]]
                : captainPosition;

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}&zoom=14`);
                const data = await res.json();
                const regionName = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || data.address?.city || 'Selected Region';
                setCurrentRegion(online && storedCoords ? `Working in ${regionName}` : regionName);
            } catch (err) {
                setCurrentRegion(online && storedCoords ? 'Active Zone' : 'Current Location');
            }
        };
        if (captainPosition) getRegion();
    }, [captainPosition, user.location, online]);

    // Handle incoming job alerts and auto-decline
    useEffect(() => {
        if (online && !activeJob && pendingRequests.length > 0) {
            const currentJobId = pendingRequests[0].id || pendingRequests[0]._id;

            // Play alert beep
            playBeep();
            const beepInterval = setInterval(playBeep, 2000);

            // Vibration
            safeVibrate([200, 100, 200]);
            vibrateIntervalRef.current = setInterval(() => {
                safeVibrate([200, 100, 200]);
            }, 2000);

            // Countdown
            setTimeLeft(30);
            timeoutRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        declineJob(currentJobId);
                        clearInterval(beepInterval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                clearInterval(beepInterval);
                safeVibrate(0);
            };
        } else {
            if (vibrateIntervalRef.current) clearInterval(vibrateIntervalRef.current);
            if (timeoutRef.current) clearInterval(timeoutRef.current);
            safeVibrate(0);
        }

        return () => {
            if (vibrateIntervalRef.current) clearInterval(vibrateIntervalRef.current);
            if (timeoutRef.current) clearInterval(timeoutRef.current);
        };
    }, [online, activeJob, pendingRequests.length, declineJob, playBeep]);

    // Load dashboard on mount (Socket context handles subsequent live updates)
    useEffect(() => {
        loadCaptainDashboard?.();
        loadAvailableProductMissions?.();
    }, [loadCaptainDashboard, loadAvailableProductMissions]);


    const handleAccept = async (jobId) => {
        setAcceptedJobId(jobId);
        const result = await acceptJob(jobId);
        if (result.success) {
            setTimeout(() => {
                setAcceptedJobId(null);
                navigate(`/captain/job?id=${jobId}`);
            }, 800);
        } else {
            setAcceptedJobId(null);
        }
    };

    const handleDecline = async (jobId) => {
        await declineJob(jobId);
    };

    const handleToggleOnline = async () => {
        if (!user.isVerified) {
            toast.error('Identity Verification Required to go Online', {
                icon: '🛡️',
                style: {
                    borderRadius: '15px',
                    background: isDarkMode ? '#1E293B' : '#fff',
                    color: isDarkMode ? '#fff' : '#000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
                }
            });
            return;
        }
        const newStatus = !online;
        await toggleOnline?.(newStatus);
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // --- Scheduled Job Socket Listeners ---
    useEffect(() => {
        const captainId = user?.id;
        if (!captainId) return;

        // 30-minute pre-alert from booking monitor
        const handleScheduledReminder = (data) => {
            toast(
                (t) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <strong style={{ fontSize: 13 }}>⏰ Scheduled Wash Reminder</strong>
                        <span style={{ fontSize: 11, opacity: 0.8 }}>Your job starts in ~30 minutes. Get ready!</span>
                        <button
                            onClick={() => { navigate(`/captain/job?id=${data.bookingId}`); toast.dismiss(t.id); }}
                            style={{ background: '#F29F05', color: '#000', border: 'none', borderRadius: 8, padding: '4px 10px', fontWeight: 900, fontSize: 11, cursor: 'pointer', marginTop: 4 }}
                        >
                            View Job →
                        </button>
                    </div>
                ),
                { duration: 15000, icon: '📅' }
            );
        };

        // Time-arrived alert — captain must go NOW
        const handleScheduledJobStarting = (data) => {
            // Play alert beep
            playBeep();
            safeVibrate([300, 100, 300, 100, 300]);

            toast(
                (t) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <strong style={{ fontSize: 14 }}>🚀 Time to Go! Scheduled Wash</strong>
                        <span style={{ fontSize: 11, opacity: 0.8 }}>Your scheduled booking time has arrived. Head to the customer now!</span>
                        <button
                            onClick={() => { navigate(`/captain/job?id=${data.bookingId}`); toast.dismiss(t.id); }}
                            style={{ background: '#000', color: '#F29F05', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 900, fontSize: 12, cursor: 'pointer', marginTop: 4 }}
                        >
                            Open Job Details ⚡
                        </button>
                    </div>
                ),
                { duration: 30000, icon: '⚡' }
            );
        };

        socketService.on('scheduled_reminder', handleScheduledReminder);
        socketService.on('scheduled_job_starting', handleScheduledJobStarting);

        return () => {
            socketService.off('scheduled_reminder', handleScheduledReminder);
            socketService.off('scheduled_job_starting', handleScheduledJobStarting);
        };
    }, [user?.id, navigate, playBeep]);

    // Map job locations (jobs with location data)
    const jobsWithLocation = pendingRequests.filter(j => j.location?.coordinates?.length === 2);

    return (
        <CaptainLayout>
            {/* ── Header ── */}
            <header className={`${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} px-4 pt-10 pb-4 sticky top-0 z-40 transition-colors duration-500`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                        <p className={`${isDarkMode ? 'text-white/40' : 'text-content-subtle'} text-[9px] font-black uppercase tracking-widest`}>Captain App</p>
                        <h1 className={`${isDarkMode ? 'text-white' : 'text-content'} text-xl font-black tracking-tight mt-0.5 italic`}>{getGreeting()}, {(user?.name || 'Captain').split(' ')[0]} 👋</h1>
                        <LocationIndicator variant={isDarkMode ? 'dark' : 'light'} className="mt-3 !py-1 !px-2 shadow-none border-none bg-transparent" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={toggleDarkMode}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 border border-white/10 text-brand' : 'bg-gray-100 border border-gray-200 text-brand'}`}
                        >
                            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                        </button>
                        <button
                            onClick={() => navigate('/captain/notifications')}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-gray-100 border-gray-200 text-gray-400 hover:text-brand'}`}>
                            <Bell size={14} />
                        </button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={handleToggleOnline}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${online
                                ? isDarkMode ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-green-500/10 border-green-200 text-green-600'
                                : isDarkMode ? 'bg-white/5 border-white/10 text-white/20' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                            {online ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            {online ? 'ON' : 'OFF'}
                        </motion.button>
                    </div>
                </div>

                {/* Today's Dynamic Stats */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                    {[
                        { label: 'Jobs', value: totalJobsCount.toString(), color: isDarkMode ? 'text-white' : 'text-content' },
                        { label: 'Wallet', value: `₹${(walletBalance).toLocaleString()}`, color: isDarkMode ? 'text-green-400' : 'text-green-600' },
                        { label: 'Rating', value: `${currentRating.toFixed(1)}★`, color: 'text-amber-500' },
                        { label: 'Status', value: online ? 'ON' : 'OFF', color: online ? 'text-green-500' : 'text-brand' },
                    ].map(s => (
                        <div key={s.label} className={`${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'} border rounded-xl px-2 py-3 text-center transition-all duration-500 hover:scale-105 active:scale-95 cursor-pointer`}>
                            {captainJobsLoading ? (
                                <div className="space-y-2">
                                    <div className={`h-4 w-10 mx-auto rounded-md animate-pulse ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                                    <div className={`h-2 w-8 mx-auto rounded-md animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
                                </div>
                            ) : (
                                <>
                                    <p className={`font-black text-base leading-none ${s.color}`}>{s.value}</p>
                                    <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[8px] font-black uppercase tracking-widest mt-1`}>{s.label}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </header>

            {/* ── Full-Screen Rapido-Style Map Layer ── */}
            <div className="relative w-full shadow-md z-30" style={{ height: 320 }}>
                {positionReady && (
                    <MapContainer
                        center={captainPosition}
                        zoom={14}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        attributionControl={false}
                    >
                        <TileLayer
                            url={isDarkMode
                                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            }
                        />

                        {/* Captain's own position */}
                        <Marker position={captainPosition} icon={captainIcon} />

                        {/* Radius circle for working area when online or area is selected */}
                        {online && (
                            <Circle
                                center={
                                    (user.location?.coordinates && (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0))
                                        ? [user.location.coordinates[1], user.location.coordinates[0]]
                                        : captainPosition
                                }
                                radius={5000} // Matches backend limit of 5km
                                pathOptions={{
                                    color: '#FF6B00',
                                    fillColor: '#FF6B00',
                                    fillOpacity: 0.04,
                                    weight: 1.5,
                                    dashArray: '6 4',
                                    opacity: 0.5
                                }}
                            />
                        )}

                        {/* Pending job markers */}
                        {jobsWithLocation.map(job => (
                            <Marker
                                key={job.id}
                                position={[job.location.coordinates[1], job.location.coordinates[0]]}
                                icon={jobIcon}
                            />
                        ))}

                        {recenter && <LiveRecenterer position={captainPosition} />}
                    </MapContainer>
                )}

                {/* Map Loading State */}
                {!positionReady && (
                    <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-[#1E293B]' : 'bg-slate-100'}`}>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Acquiring GPS...</p>
                        </div>
                    </div>
                )}

                {/* Map Overlay — Captain Status Pill */}
                <div className="absolute top-4 left-4 right-4 z-[500] flex items-center justify-between pointer-events-none">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-xl border shadow-2xl pointer-events-auto ${online
                        ? isDarkMode ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-green-500/15 border-green-400/40 text-green-700'
                        : isDarkMode ? 'bg-black/50 border-white/10 text-white/50' : 'bg-white/80 border-gray-200 text-gray-500'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                        <span className="font-black text-[10px] uppercase tracking-widest">
                            {online ? `Online · ${pendingRequests.length} requests nearby` : 'Offline'}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2 pointer-events-auto">
                        <button
                            onClick={() => setRecenter(r => !r)}
                            className={`w-10 h-10 rounded-2xl backdrop-blur-xl border flex items-center justify-center shadow-xl transition-all active:scale-90 ${recenter ? 'bg-brand border-brand text-white shadow-brand/20' : isDarkMode ? 'bg-black/50 border-white/10 text-white hover:bg-white/20' : 'bg-white/80 border-gray-200 text-content hover:bg-white'}`}
                        >
                            <Locate size={16} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => navigate('/captain/area-select')}
                            className={`w-10 h-10 rounded-2xl backdrop-blur-xl border flex items-center justify-center shadow-xl transition-all active:scale-90 ${isDarkMode ? 'bg-black/50 border-white/10 text-brand' : 'bg-white/80 border-gray-200 text-brand'}`}
                        >
                            <Compass size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Top and Bottom gradient fade into content */}
                <div className={`absolute top-0 left-0 right-0 h-4 pointer-events-none ${isDarkMode ? 'bg-gradient-to-b from-[#0F172A]/50' : 'bg-gradient-to-b from-gray-50/50'}`} />
                <div className={`absolute bottom-0 left-0 right-0 h-14 pointer-events-none ${isDarkMode ? 'bg-gradient-to-t from-[#0F172A]' : 'bg-gradient-to-t from-gray-50'}`} />

                {/* Working Region Label */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] pointer-events-auto flex flex-col items-center">
                    <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        onClick={() => navigate('/captain/area-select')}
                        className={`px-4 py-2 rounded-full border shadow-2xl backdrop-blur-xl flex items-center gap-2 cursor-pointer active:scale-95 transition-all ${isDarkMode ? 'bg-black/40 border-white/5 text-white/80' : 'bg-white/80 border-black/5 text-black/70'
                            }`}
                    >
                        <MapPin size={10} className="text-brand" fill="currentColor" />
                        <span className="text-[9px] font-[1000] uppercase tracking-widest">{currentRegion}</span>
                    </motion.div>
                </div>
            </div>

            <div className="px-4 py-4 space-y-4 pb-28">

                {/* ── Scheduled Mission Commitment Alert (PASS 4) ── */}
                {needsCommitment && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-[2rem] border-2 shadow-2xl overflow-hidden relative ${isDarkMode ? 'bg-[#1E293B] border-brand/30' : 'bg-white border-brand/20'}`}
                    >
                        {/* Shimmering background for urgency */}
                        <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-brand/5 animate-pulse" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
                                        <Clock size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-black italic uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>High Priority Slot</h4>
                                        <p className="text-brand text-[9px] font-black uppercase tracking-widest leading-none">Confim Attendance Now</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-xl border font-black text-[10px] tabular-nums ${isDarkMode ? 'bg-white/5 border-white/10 text-white/40' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                    Starts in <CountdownTimer targetTime={needsCommitment.schedule} />
                                </div>
                            </div>

                            <div className={`p-4 rounded-2xl mb-4 border transition-all ${isDarkMode ? 'bg-black/20 border-white/5 shadow-inner' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-black text-base italic leading-none ${isDarkMode ? 'text-white' : 'text-content'}`}>{needsCommitment.serviceName}</h3>
                                    <p className="font-black text-sm text-brand">{needsCommitment.price}</p>
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <MapPin size={10} className="text-brand" fill="currentColor" />
                                    <p className={`text-[11px] font-bold truncate ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>{needsCommitment.address}</p>
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                disabled={isCommitting === needsCommitment.id}
                                onClick={() => handleCommit(needsCommitment.id)}
                                className={`w-full h-12 rounded-2xl font-black text-sm text-white shadow-xl transition-all flex items-center justify-center gap-3 bg-brand shadow-brand/30`}
                            >
                                {isCommitting === needsCommitment.id ? (
                                    <>Synchronizing Protocol... <Zap size={15} className="animate-pulse" /></>
                                ) : (
                                    <>Acknowledge & Confirm <ArrowRight size={18} strokeWidth={3} /></>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ── Product Gig Board (Phase 33) ── */}
                {online && availableProductMissions.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Available Product Gigs</p>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-brand italic">
                                Flash Gig <Zap size={10} className="fill-brand" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            {availableProductMissions.map((mission) => {
                                const isBatch = mission.isBatched;
                                return (
                                    <motion.div
                                        key={isBatch ? `batch-${mission.items[0].itemId}` : `${mission.orderId}-${mission._id}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`p-4 rounded-[1.5rem] border shadow-lg relative overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100'}`}
                                    >
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`px-1.5 py-0.5 border rounded-lg ${isBatch ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-brand/10 border-brand/20'}`}>
                                                        <span className={`font-black text-[8px] uppercase tracking-tighter ${isBatch ? 'text-indigo-400' : 'text-brand'}`}>
                                                            {isBatch ? `${mission.itemsCount}x Batched Pickup` : 'Product Pickup'}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[9px] font-bold ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                                                        {mission.vendorName || mission.vendorNames}
                                                    </span>
                                                </div>
                                                <h4 className={`text-sm font-black tracking-tight leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-content'}`}>
                                                    {mission.productName || mission.productNames}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <MapPin size={10} className="text-brand" fill="currentColor" />
                                                    <p className={`text-[10px] font-bold truncate ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
                                                        {isBatch ? 'Multiple Pickup Points' : `Pick from: ${mission.vendorName} Studio`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-brand uppercase tracking-widest mb-1">Fee</p>
                                                <p className={`text-lg font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>
                                                    ₹{mission.estimatedEarnings || 40}
                                                </p>
                                            </div>
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleAcceptProductMission(mission.orderId, mission._id, isBatch, mission.items)}
                                            className="w-full mt-4 h-10 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/20 flex items-center justify-center gap-2"
                                        >
                                            {isBatch ? 'Claim Batch Missions' : 'Claim Pickup Mission'} <ArrowRight size={14} />
                                        </motion.button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Verification Banner ── */}
                {!user.isVerified && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-2xl border flex items-center gap-4 ${isDarkMode ? 'bg-orange-500/10 border-orange-500/20 shadow-lg shadow-orange-500/5' : 'bg-orange-50 border-orange-100 shadow-sm'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                            <Clock size={20} className="text-orange-500" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <h4 className={`text-xs font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>Verification Pending</h4>
                            <p className={`text-[9px] font-bold leading-tight mt-0.5 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Your documents are under review. You'll be notified once approved.</p>
                        </div>
                        <Shield size={16} className="text-orange-500 opacity-20" />
                    </motion.div>
                )}

                {/* ── Active Job Card ── */}
                {activeJob && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className={`rounded-2xl border p-4 transition-all duration-500 flex flex-col gap-4 cursor-pointer hover:brightness-105 active:scale-[0.98] ${isDarkMode ? 'bg-brand border-white/10' : 'bg-[#0F172A] border-white/5 text-white'} shadow-xl`}
                        onClick={() => navigate(`/captain/job?id=${activeJob.id}`)}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white/20' : 'bg-brand/20'}`}>
                                <Zap size={24} className={isDarkMode ? 'text-white' : 'text-brand'} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">
                                    {activeJob.schedule?.type === 'scheduled' ? 'Scheduled Mission' : 'Active Mission'}
                                </p>
                                <h3 className="text-white font-black text-lg tracking-tight leading-none truncate">{activeJob.serviceName}</h3>
                                <p className="text-white/60 text-[10px] font-bold mt-1.5">{activeJob.address}</p>
                            </div>
                            <ChevronRight size={18} className="text-white/20" />
                        </div>

                        {activeJob.schedule?.type === 'scheduled' && activeJob.status === 'confirmed' && (
                            <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between border border-white/10">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-white/40" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Starts at {activeJob.schedule.timeSlot?.start}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                    <span className="text-[11px] font-black tabular-nums text-white">
                                        <CountdownTimer targetTime={activeJob.schedule} />
                                    </span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── RAPIDO-STYLE INCOMING REQUEST OVERLAY ── */}
                <AnimatePresence>
                    {online && !activeJob && pendingRequests.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[1000] flex flex-col items-center justify-end p-5 bg-black/40 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ y: "100%", scale: 0.9 }}
                                animate={{ y: 0, scale: 1 }}
                                exit={{ y: "100%", opacity: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_-15px_60px_rgba(0,0,0,0.3)] overflow-hidden"
                            >
                                {/* Request Header - High Energy */}
                                <div className="bg-brand px-6 py-5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                                        <h2 className="text-white font-[1000] text-[15px] uppercase tracking-widest leading-none">New Instant Request</h2>
                                    </div>
                                    <div className="bg-black/10 px-3 py-1.5 rounded-xl border border-white/20">
                                        <span className="text-white font-black text-xs tabular-nums">{timeLeft}s remaining</span>
                                    </div>
                                </div>

                                <div className="p-7 space-y-6">
                                    {/* Service & Price Summary */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="px-2 py-0.5 bg-brand/10 border border-brand/20 rounded-md">
                                                    <span className="text-brand font-black text-[9px] uppercase tracking-tighter">Instant Wash</span>
                                                </div>
                                                <div className="px-2 py-0.5 bg-black/5 rounded-md">
                                                    <span className="text-black/40 font-black text-[9px] uppercase tracking-tighter italic">
                                                        {getJobDistance(pendingRequests[0]) || 'Nearby'}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-[1000] text-black tracking-tighter leading-none mb-2">
                                                {pendingRequests[0].serviceName}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <Car size={14} className="text-black/30" />
                                                <span className="text-[13px] font-black text-black/60 uppercase tracking-tight">{pendingRequests[0].vehicle}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-black/20 uppercase tracking-widest mb-1">Your Earnings</p>
                                            <p className="text-3xl font-[1000] text-black tracking-tighter italic tabular-nums leading-none">
                                                {pendingRequests[0].price}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Location Detail - Rapido Style Pin Map Icon */}
                                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
                                        <div className="relative mt-1">
                                            <div className="w-10 h-10 bg-brand text-black rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
                                                <MapPin size={22} fill="currentColor" />
                                            </div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-6 bg-brand/20 border-l border-dashed border-brand/50 mt-1" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">Pickup Address</p>
                                            <p className="text-[14px] font-[1000] text-black leading-tight mb-1 truncate">
                                                {pendingRequests[0].address}
                                            </p>
                                            <p className="text-[12px] font-bold text-brand leading-none truncate">
                                                {pendingRequests[0].landmark || 'Near Main Landmark'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleDecline(pendingRequests[0].id)}
                                            className="w-20 h-16 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 text-black/40 transition-colors"
                                        >
                                            <X size={24} strokeWidth={3} />
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleAccept(pendingRequests[0].id)}
                                            className={`flex-1 h-16 rounded-2xl font-[1000] text-[15px] uppercase tracking-[0.2em] text-white shadow-2xl transition-all flex items-center justify-center gap-3 ${acceptedJobId === pendingRequests[0].id ? 'bg-green-500 shadow-green-500/30' : 'bg-black shadow-black/30'
                                                }`}
                                        >
                                            {acceptedJobId === pendingRequests[0].id ? (
                                                <>Syncing... <Zap size={18} fill="currentColor" className="animate-pulse" /></>
                                            ) : (
                                                <>Accept Wash <ArrowRight size={20} strokeWidth={3} /></>
                                            )}
                                        </motion.button>
                                    </div>

                                    {/* Dynamic Progress Bar at very bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100">
                                        <motion.div
                                            initial={{ width: "100%" }}
                                            animate={{ width: `${(timeLeft / 30) * 100}%` }}
                                            transition={{ ease: "linear", duration: 1 }}
                                            className={`h-full ${timeLeft <= 10 ? 'bg-red-500' : 'bg-brand'}`}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Offline hint when offline ── */}
                {!online && !activeJob && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`p-5 rounded-2xl border flex flex-col items-center gap-3 text-center transition-all ${isDarkMode ? 'bg-white/3 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <ToggleLeft size={28} className={isDarkMode ? 'text-white/20' : 'text-gray-300'} />
                        </div>
                        <div>
                            <p className={`font-black text-sm uppercase tracking-tight ${isDarkMode ? 'text-white/50' : 'text-content-subtle'}`}>You're Offline</p>
                            <p className={`text-[10px] font-bold mt-1 max-w-[200px] mx-auto ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Tap "Offline" above to go online and receive new service requests.</p>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleToggleOnline}
                            className="bg-brand text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg shadow-brand/30">
                            Go Online Now
                        </motion.button>
                    </motion.div>
                )}

                {/* ── Today's Mission Timeline (PASS 7) ── */}
                {online && activeJobs.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Daily Mission Timeline</p>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-brand italic">
                                Protocols Active <Shield size={10} className="fill-brand" />
                            </div>
                        </div>
                        <div className={`rounded-3xl border p-4 transition-all duration-500 overflow-hidden space-y-4 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/30' : 'bg-white border-gray-100 shadow-soft'}`}>
                            {activeJobs.map((job, i) => {
                                const isCurrent = job.id === activeJob?.id || job._id === activeJob?._id;
                                return (
                                    <div key={job.id} className="relative pl-6">
                                        {/* Timeline Line */}
                                        {i < activeJobs.length - 1 && (
                                            <div className={`absolute left-[5px] top-4 w-[2px] h-[calc(100%+8px)] transition-colors ${isCurrent ? 'bg-brand' : isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
                                        )}
                                        {/* Dot */}
                                        <div className={`absolute left-0 top-1 w-3 h-3 rounded-full border-2 z-10 transition-all ${isCurrent ? 'bg-brand border-white' : isDarkMode ? 'bg-[#0F172A] border-white/10' : 'bg-white border-gray-200'}`} />

                                        <div onClick={() => navigate(`/captain/job?id=${job.id}`)} className={`group block p-3 rounded-2xl border transition-all active:scale-95 ${isCurrent ? (isDarkMode ? 'bg-brand/10 border-brand/20' : 'bg-brand/5 border-brand/10') : 'border-transparent'}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 pr-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className={`text-xs font-black italic tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-content'}`}>
                                                            {job.serviceName}
                                                        </h4>
                                                        {job.schedule?.type === 'scheduled' && (
                                                            <div className="px-1.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase tracking-widest border border-indigo-500/10">Slotted</div>
                                                        )}
                                                    </div>
                                                    <p className={`text-[10px] font-bold truncate ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>{job.address}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-[10px] font-black tabular-nums transition-colors ${isCurrent ? 'text-brand' : isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>
                                                        {job.schedule?.timeSlot?.start || 'Instant'}
                                                    </p>
                                                    <div className={`mt-1.5 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${job.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        job.status === 'en_route' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                                                            'bg-brand/10 text-brand'
                                                        }`}>
                                                        {job.status.replace('_', ' ')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Recent Completed Jobs ── */}
                <section className="space-y-2">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Today's Completed Jobs</p>
                    <div className={`rounded-2xl border transition-all duration-500 overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-soft'}`}>
                        {completedJobs.length > 0 ? completedJobs.slice(0, 5).map((job, i, arr) => (
                            <div key={job.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < arr.length - 1 ? (isDarkMode ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDarkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
                                    <CheckCircle2 size={17} className="text-green-500" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className={`font-black text-sm ${isDarkMode ? 'text-white/90' : 'text-content'}`}>{job.serviceName}</p>
                                        <span className={`text-[8px] font-black ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>· {job.userName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[9px] font-bold ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>
                                            {job.timestamp ? new Date(job.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                                        </span>
                                        <span className="flex text-amber-400 text-[10px]">
                                            {job.feedback?.rating
                                                ? '★'.repeat(Math.round(job.feedback.rating)) + '☆'.repeat(5 - Math.round(job.feedback.rating))
                                                : '★★★★★'
                                            }
                                        </span>
                                    </div>
                                </div>
                                <p className="font-black text-sm text-green-500">{job.price}</p>
                            </div>
                        )) : (
                            <div className="px-4 py-10 text-center opacity-40">
                                <p className={`text-[10px] font-black uppercase tracking-widest italic ${isDarkMode ? 'text-white' : 'text-content'}`}>No jobs completed today</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Performance Card ── */}
                <div className={`${isDarkMode ? 'bg-brand shadow-brand/20' : 'bg-[#0F172A] shadow-content/20'} rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden shadow-xl transition-all duration-500`}
                    onClick={() => navigate('/captain/earnings')} role="button">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDarkMode ? 'bg-white/20' : 'bg-brand/20'}`}>
                        <TrendingUp size={22} className={isDarkMode ? 'text-white' : 'text-brand'} />
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-black text-sm tracking-tight">Weekly Earnings: ₹{(totalWeeklyEarnings).toLocaleString()}</p>
                        <p className="text-white/40 text-[9px] font-bold mt-0.5">
                            {(user.rating || 5.0) >= 4.8 ? 'Top 5% of captains' : 'Top Performing Captain'}
                        </p>
                    </div>
                    <ChevronRight size={14} strokeWidth={2.5} className="text-white/30" />
                    {!isDarkMode && <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand/10 rounded-full blur-xl" />}
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainHome;
