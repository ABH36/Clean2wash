import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Phone, MessageSquare, ChevronLeft, CheckCircle2,
    Shield, Car, Clock, Navigation, Camera, ChevronRight,
    Zap, ArrowRight, XCircle, Lock, X
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import { toast } from 'react-hot-toast';

import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../hooks/useCaptain';
import { useTheme } from '../../../context/ThemeContext';

// Leaflet icon fix removed

const STEPS_ORDER = ['Confirmed', 'En Route', 'Arrived', 'Before Wash', 'Washing', 'After Wash', 'Completed'];

const createSvgDataUri = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const APARTMENT_MARKER_ICON = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
  <defs>
    <linearGradient id="apg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF5A1F"/>
      <stop offset="100%" stop-color="#FF7F2A"/>
    </linearGradient>
  </defs>
  <circle cx="28" cy="28" r="26" fill="#fff"/>
  <circle cx="28" cy="28" r="24" fill="url(#apg)"/>
  <path d="M18 37h20V22l-10-6-10 6v15zm4-2v-4h4v4h-4zm0-6v-5h4v5h-4zm6 6v-4h4v4h-4zm0-6v-5h4v5h-4zm6 6v-11h2v11h-2z" fill="#fff"/>
</svg>
`);

const CAPTAIN_MARKER_ICON = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="58" height="58" viewBox="0 0 58 58">
  <defs>
    <linearGradient id="cpg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B1B39"/>
      <stop offset="100%" stop-color="#1E88FF"/>
    </linearGradient>
  </defs>
  <circle cx="29" cy="29" r="27" fill="#fff"/>
  <circle cx="29" cy="29" r="25" fill="url(#cpg)"/>
  <path d="M19 33h20l-2-7c-.5-1.7-2.1-2.9-3.9-2.9H24.9c-1.8 0-3.4 1.2-3.9 2.9L19 33zm6.5-1.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="#fff"/>
  <rect x="17" y="32" width="4" height="5" rx="1.5" fill="#fff"/>
  <rect x="37" y="32" width="4" height="5" rx="1.5" fill="#fff"/>
</svg>
`);

const CaptainJobDetail = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [searchParams] = useSearchParams();
    const { sessions } = useAuth();
    const { captainJobs, updateJobStatus, acceptJob, updateLocation } = useCaptain();

    const bookingId = searchParams.get('id');
    const [liveBooking, setLiveBooking] = useState(null);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [isAccepting, setIsAccepting] = useState(false);

    // Phase 7: GPS Pulse Mode (High-frequency tracking EN ROUTE)
    useEffect(() => {
        if (!liveBooking || liveBooking.status !== 'en_route') return;

        console.log('[Phase 7] 🛰️ GPS Pulse Mode Engaged (8s intervals)');
        const pulse = setInterval(() => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    updateLocation(latitude, longitude);
                }, (err) => console.warn('Pulse geolocation error:', err), {
                    enableHighAccuracy: true
                });
            }
        }, 8000);

        return () => {
            console.log('[Phase 7] 🛰️ GPS Pulse Mode Disengaged');
            clearInterval(pulse);
        };
    }, [liveBooking?.status, updateLocation]);

    useEffect(() => {
        let found = captainJobs.find(job => job.id === bookingId || job._id === bookingId);
        if (!found && !bookingId) {
            // Find any active job the captain might be in
            found = captainJobs.find(job => !['completed', 'cancelled', 'pending'].includes(job.status));
        }
        setLiveBooking(found);

        if (!found) {
            const pending = captainJobs.find(job => job.status === 'pending');
            setPendingRequest(pending);
        } else {
            setPendingRequest(null);
        }
    }, [bookingId, captainJobs]);

    const handleAcceptRequest = async (jobId) => {
        setIsAccepting(true);
        const result = await acceptJob(jobId);
        if (result.success) {
            setTimeout(() => {
                setIsAccepting(false);
                navigate(`/captain/job?id=${jobId}`);
            }, 800);
        } else {
            setIsAccepting(false);
        }
    };

    const getInitialStep = () => {
        if (!liveBooking) return 0;
        const s = liveBooking.status || 'pending';
        // Map backend statuses to granular UI steps
        if (['completed', 'cancelled'].includes(s)) return 6;
        if (['after_photo', 'quality-check', 'ready-for-delivery'].includes(s)) return 5;
        if (['washing', 'in_progress'].includes(s)) return 4;
        if (['before_photo'].includes(s)) return 3;
        if (['arrived'].includes(s)) return 2;
        if (['en_route', 'assigned'].includes(s)) return 1;
        return 0; // 'pending', 'confirmed', 'accepted'
    };

    const [stepIdx, setStepIdx] = useState(0);
    const [showPin, setShowPin] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [capturedPhotoMeta, setCapturedPhotoMeta] = useState(null);
    const fileInputRef = React.useRef(null);
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const pinRefs = [React.useRef(), React.useRef(), React.useRef(), React.useRef()];

    const [cameraActive, setCameraActive] = useState(false);
    const [cameraTimeLeft, setCameraTimeLeft] = useState(60);
    const [captainLivePosition, setCaptainLivePosition] = useState(null);

    useEffect(() => {
        if (liveBooking) setStepIdx(getInitialStep());
    }, [liveBooking?.status]);

    useEffect(() => {
        if (!('geolocation' in navigator)) return undefined;
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setCaptainLivePosition({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            () => { },
            { enableHighAccuracy: true, maximumAge: 8000, timeout: 12000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const isApartmentMission = !!liveBooking?.isApartment || !!liveBooking?.location?.parkingDetails || !!liveBooking?.hubName;
    const missionRouteMeta = [liveBooking?.hubName, liveBooking?.apartmentRoute].filter(Boolean).join(' · ');
    const hasBeforeProof = (liveBooking?.serviceImages?.before?.length || 0) > 0 || liveBooking?.status === 'before_photo';
    const hasAfterProof = (liveBooking?.serviceImages?.after?.length || 0) > 0 || liveBooking?.status === 'after_photo';

    // Phase 8: Live Capture Protocol (60s Window) - Moved to top level for React Compliance
    useEffect(() => {
        let timer;
        if (cameraActive && cameraTimeLeft > 0) {
            timer = setInterval(() => {
                setCameraTimeLeft(prev => {
                    if (prev <= 1) {
                        closeCamera();
                        toast.error('Mission window closed. Retake required.', { icon: '⏰' });
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cameraActive, cameraTimeLeft]);

    if (!liveBooking) {
        return (
            <CaptainLayout hideNav>
                <div className="flex flex-col items-center justify-center min-h-[90vh] px-8 text-center relative overflow-hidden transition-colors duration-500">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
                        <motion.div animate={{ scale: [1, 1.5], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeOut" }}
                            className={`absolute w-64 h-64 border-white/5 rounded-full ${isDarkMode ? 'border-brand/40' : 'border-brand/20'}`} />
                        <motion.div animate={{ scale: [1, 1.5], opacity: [0.2, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeOut", delay: 1.5 }}
                            className={`absolute w-96 h-96 border rounded-full ${isDarkMode ? 'border-brand/30' : 'border-brand/10'}`} />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-24 h-24 rounded-[40px] flex items-center justify-center mb-8 border shadow-2xl shadow-black/50 relative transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-brand/5 border-brand/10'}`}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                className={`absolute inset-0 border-white/5 border-dashed rounded-[40px] opacity-30 ${isDarkMode ? 'border-white' : 'border-brand'}`} />
                            <div className={`w-16 h-16 rounded-[30px] flex items-center justify-center border shadow-inner transition-colors ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white/5 border-brand/10'}`}>
                                <Zap size={32} className="text-brand" fill="currentColor" />
                            </div>
                        </div>
                        <div className="space-y-3 mb-12">
                            <h2 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>
                                {pendingRequest ? 'New Request Found!' : 'Captain Standby'}
                            </h2>
                            <div className="flex items-center justify-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${pendingRequest ? 'bg-orange-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
                                <p className="text-brand text-[10px] font-black uppercase tracking-[0.3em]">
                                    {pendingRequest ? 'Action Required' : 'Scanning For Requests'}
                                </p>
                            </div>

                            {pendingRequest ? (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className={`mt-4 p-5 rounded-3xl border text-left transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/5 border-white/5 shadow-2xl shadow-black/50'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-brand text-[9px] font-black uppercase tracking-widest mb-1">Service</p>
                                            <h3 className={`font-black text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{pendingRequest.serviceName}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[9px] font-black uppercase tracking-widest mb-1`}>Payout</p>
                                            <p className={`font-black text-xl ${isDarkMode ? 'text-white' : 'text-content'}`}>{pendingRequest.price}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white/[0.02] border border-white/5'}`}>
                                            <MapPin size={16} className="text-brand" fill="currentColor" strokeWidth={1.5} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`font-black text-xs truncate ${isDarkMode ? 'text-white/80' : 'text-content'}`}>{pendingRequest.address}</p>
                                            <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[9px] font-bold`}>Nearby Request</p>
                                        </div>
                                    </div>
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleAcceptRequest(pendingRequest.id)}
                                        className={`w-full h-12 rounded-2xl font-black text-sm text-white shadow-2xl shadow-black/50 transition-all flex items-center justify-center gap-2 ${isAccepting ? 'bg-green-500 shadow-green-500/20' : 'bg-brand shadow-brand/30'}`}>
                                        {isAccepting ? (
                                            <>Accepting... <Zap size={15} className="animate-pulse" /></>
                                        ) : (
                                            <>Accept Request <ArrowRight size={15} strokeWidth={3} /></>
                                        )}
                                    </motion.button>
                                </motion.div>
                            ) : (
                                <p className={`text-xs font-bold leading-relaxed max-w-[260px] mx-auto pt-2 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>
                                    You are currently online. New jobs in your area will appear on the dashboard.
                                </p>
                            )}
                        </div>
                        {!pendingRequest && (
                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/captain')}
                                className={`group flex items-center gap-4 px-8 py-4 rounded-3xl transition-all shadow-2xl shadow-black/50 ${isDarkMode ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white/5 border border-white/5 hover:bg-white/[0.02]'}`}>
                                <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-content'}`}>Go to Dashboard</span>
                                <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center group-hover:bg-brand-dark transition-all">
                                    <ArrowRight size={16} className="text-white" strokeWidth={3} />
                                </div>
                            </motion.button>
                        )}
                    </div>
                </div>
            </CaptainLayout>
        );
    }

    const stepIdx_safe = Math.max(0, Math.min(stepIdx, STEPS_ORDER.length - 1));
    const step = STEPS_ORDER[stepIdx_safe];
    const apartmentPosition = liveBooking.location?.mapCoordinates
        ? { lat: liveBooking.location.mapCoordinates.lat, lng: liveBooking.location.mapCoordinates.lng }
        : liveBooking.location?.address?.coordinates?.lat
            ? { lat: liveBooking.location.address.coordinates.lat, lng: liveBooking.location.address.coordinates.lng }
            : liveBooking.location?.coordinates?.lat
                ? { lat: liveBooking.location.coordinates.lat, lng: liveBooking.location.coordinates.lng }
                : { lat: 28.6139, lng: 77.2090 };

    const captainSessionPosition = Array.isArray(sessions.captain?.location?.coordinates) && sessions.captain.location.coordinates.length === 2
        ? { lat: sessions.captain.location.coordinates[1], lng: sessions.captain.location.coordinates[0] }
        : null;

    const captainMapPosition = captainLivePosition || liveBooking?.tracking?.currentLocation || captainSessionPosition;

    const mapMarkers = [
        {
            id: 'apartment',
            position: apartmentPosition,
            title: 'Apartment',
            icon: APARTMENT_MARKER_ICON
        },
        ...(captainMapPosition?.lat && captainMapPosition?.lng
            ? [{
                id: 'captain',
                position: captainMapPosition,
                title: 'Captain',
                icon: CAPTAIN_MARKER_ICON
            }]
            : [])
    ];

    const mapPolylines = captainMapPosition?.lat && captainMapPosition?.lng
        ? [{
            path: [captainMapPosition, apartmentPosition],
            options: {
                strokeColor: '#0F172A',
                strokeOpacity: 0.95,
                strokeWeight: 4,
                geodesic: true,
                icons: [{
                    icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
                    offset: '0',
                    repeat: '14px'
                }]
            }
        }]
        : [];

    const resetCapturedProof = () => {
        setCapturedPhoto(null);
        setCapturedPhotoMeta(null);
    };

    const captureProofMeta = () => new Promise((resolve) => {
        const fallbackMeta = {
            capturedAt: new Date().toISOString(),
            source: 'captain-app'
        };

        if (!('geolocation' in navigator)) {
            resolve(fallbackMeta);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve({
                ...fallbackMeta,
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }),
            () => resolve(fallbackMeta),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    });

    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, 
                audio: false 
            });
            setCameraActive(true);
            setCameraTimeLeft(60);
            setTimeout(() => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            }, 100);
        } catch (err) {
            console.error('Camera Error:', err);
            toast.error('Optic sensor access denied. Check permissions.');
            fileInputRef.current?.click(); // Fallback to traditional picker
        }
    };

    const closeCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    };

    const capturePhoto = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setCapturedPhoto(dataUrl);
            const meta = await captureProofMeta();
            setCapturedPhotoMeta(meta);
            closeCamera();
            toast.success('Visual evidence secured');
        }
    };

    const handleCapture = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                setCapturedPhoto(reader.result);
                const meta = await captureProofMeta();
                setCapturedPhotoMeta(meta);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNext = async () => {
        setIsVerifying(true);
        try {
            const nextIdx = stepIdx + 1;
            const currentStep = STEPS_ORDER[stepIdx];

            if (currentStep === 'Confirmed') {
                const result = await updateJobStatus(liveBooking.id, 'en_route');
                if (result.success) setStepIdx(nextIdx);
            } else if (currentStep === 'En Route') {
                const result = await updateJobStatus(liveBooking.id, 'arrived');
                if (result.success) setStepIdx(nextIdx);
            } else if (currentStep === 'Arrived') {
                setStepIdx(nextIdx);
                resetCapturedProof();
            } else if (currentStep === 'Before Wash') {
                // Apartment wash is an unattended protocol: photo proof only, no PIN handoff.
                if (!capturedPhoto) {
                    alert('Please capture a "Before Wash" photo to proceed.');
                    return;
                }
                if (!hasBeforeProof) {
                    const beforeProof = await updateJobStatus(liveBooking.id, 'before_photo', {
                        photo: capturedPhoto,
                        photoMeta: capturedPhotoMeta
                    });
                    if (!beforeProof.success) {
                        throw new Error(beforeProof.error || 'Before wash proof upload failed');
                    }
                }
                if (!isApartmentMission && (!pinInput || pinInput.length < 4)) {
                    alert('Please enter the 4-digit Security PIN from the customer.');
                    return;
                }
                const payload = isApartmentMission ? {} : { securityPin: pinInput };
                const result = await updateJobStatus(liveBooking.id, 'washing', payload);
                if (result.success) {
                    setStepIdx(nextIdx);
                    resetCapturedProof();
                    setPinInput('');
                }
            } else if (currentStep === 'Washing') {
                setStepIdx(nextIdx);
                resetCapturedProof();
            } else if (currentStep === 'After Wash') {
                if (!capturedPhoto) {
                    alert('Please capture an "After Wash" photo to verify quality.');
                    return;
                }
                if (!hasAfterProof) {
                    const afterProof = await updateJobStatus(liveBooking.id, 'after_photo', {
                        photo: capturedPhoto,
                        photoMeta: capturedPhotoMeta
                    });
                    if (!afterProof.success) {
                        throw new Error(afterProof.error || 'After wash proof upload failed');
                    }
                }
                const result = await updateJobStatus(liveBooking.id, 'completed');
                if (result.success) {
                    resetCapturedProof();
                    navigate('/captain');
                }
            }
        } catch (error) {
            console.error("Workflow Error:", error);
            const msg = error.response?.data?.message || error.message || "Failed to update status";
            toast.error(msg);
        } finally {
            setIsVerifying(false);
        }
    };

    const stepConfig = {
        'Confirmed': { bg: 'bg-emerald-500', label: 'Job Accepted', cta: 'Start Journey' },
        'En Route': { bg: 'bg-blue-500', label: 'Going to site', cta: 'I\'ve Arrived' },
        'Arrived': { bg: 'bg-orange-500', label: 'Near Location', cta: 'Ready for Photo/OTP' },
        'Before Wash': { bg: 'bg-indigo-500', label: 'Documentation', cta: 'Start Cleaning' },
        'Washing': { bg: 'bg-brand', label: 'Wash in Progress', cta: 'Finish & Verify' },
        'After Wash': { bg: 'bg-emerald-600', label: 'Quality Verification', cta: 'Complete & Payout' },
        'Completed': { bg: 'bg-green-500', label: 'Job Finished!', cta: 'Back to Home' },
        'vehicle_not_available': { bg: 'bg-red-500', label: 'Vehicle Missing', cta: 'Back to Home' },
        'skipped': { bg: 'bg-gray-500', label: 'Wash Skipped', cta: 'Back to Home' },
    };

    const handleReportIssue = async () => {
        const reason = prompt("Why is the vehicle not available? (e.g. Not found, gate locked, owner cancelled)");
        if (!reason) return;

        setIsVerifying(true);
        try {
            const result = await updateJobStatus(liveBooking.id, 'vehicle_not_available', { reason });
            if (result.success) {
                navigate('/captain');
            }
        } catch (error) {
            console.error("Report Error:", error);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSkipService = async () => {
        const reason = prompt("Why is this apartment wash being skipped? (e.g. owner requested skip, vehicle moved, access restricted)");
        if (!reason) return;

        setIsVerifying(true);
        try {
            const result = await updateJobStatus(liveBooking.id, 'skipped', { reason });
            if (result.success) {
                navigate('/captain/apartment-route');
            }
        } catch (error) {
            console.error("Skip Error:", error);
            toast.error(error.response?.data?.message || error.message || 'Could not skip this apartment wash');
        } finally {
            setIsVerifying(false);
        }
    };
    const cfg = stepConfig[step] || stepConfig['Done'];

    return (
        <CaptainLayout hideNav>
            <header className={`${isDarkMode ? 'bg-[#1E293B]/70 border-white/5' : 'bg-white/70 border-white/5'} backdrop-blur-xl px-4 pt-10 pb-4 border-b sticky top-0 z-40 transition-colors duration-500`}>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/captain')} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/[0.02] border-white/5 text-content'}`}>
                        <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>
                    <div className="flex-1">
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Active Job</p>
                        <h1 className={`text-lg font-black tracking-tight leading-none truncate max-w-[150px] ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveBooking.bookingId || liveBooking.id}</h1>
                    </div>
                    <span className={`text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${cfg.bg} shadow-lg shadow-black/10`}>{step}</span>
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-32">
                <div className="flex items-center gap-2">
                    {STEPS_ORDER.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border-white/5 transition-all ${i < stepIdx ? 'bg-green-500 border-green-500' :
                                i === stepIdx ? `${cfg.bg} border-transparent` :
                                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/5 border-white/5'}`}>
                                {i < stepIdx
                                    ? <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                                    : <span className={`text-[9px] font-black ${i === stepIdx ? 'text-white' : isDarkMode ? 'text-white/20' : 'text-gray-300'}`}>{i + 1}</span>
                                }
                            </div>
                            {i < STEPS_ORDER.length - 1 && (
                                <div className={`flex-1 h-1 rounded-full transition-all ${i < stepIdx ? 'bg-green-400' : isDarkMode ? 'bg-white/5' : 'bg-white/[0.05]'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className={`relative rounded-3xl overflow-hidden border shadow-soft transition-colors ${isDarkMode ? 'border-white/5 shadow-2xl shadow-black/40' : 'border-white/5 '}`} style={{ height: '80vh', minHeight: 340 }}>
                    <GoogleMapBox
                        center={captainMapPosition?.lat ? captainMapPosition : apartmentPosition}
                        zoom={15}
                        darkMode={false}
                        markers={mapMarkers}
                        polylines={mapPolylines}
                        options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                            gestureHandling: 'greedy'
                        }}
                    />
                    <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-black/5 shadow-2xl shadow-black/40">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-content">Live Route</span>
                    </div>
                    <button
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(liveBooking.address)}`, '_blank')}
                        className="absolute bottom-3 right-3 bg-brand text-white flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl shadow-black/40 hover:brightness-110 active:scale-95 transition-all z-[1000]"
                    >
                        <Navigation size={12} strokeWidth={2.5} /> Navigate
                    </button>
                </div>

                <div className={`rounded-2xl border px-4 py-4 flex items-start gap-3 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/20' : 'bg-white/5 border-white/5 shadow-soft'}`}>
                    <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin size={16} className="text-brand" fill="currentColor" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{isApartmentMission ? 'Apartment / Society Location' : 'Pickup Address'}</p>
                        <p className={`font-bold text-[13px] leading-tight mt-1 ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveBooking.address || 'Loading...'}</p>
                        {liveBooking.landmark && (
                            <div className="flex items-center gap-1.5 mt-2">
                                <Shield size={10} className="text-brand" />
                                <p className={`text-[10px] font-bold ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Landmark: {liveBooking.landmark}</p>
                            </div>
                        )}
                        {isApartmentMission && missionRouteMeta && (
                            <p className="mt-2 text-brand text-[10px] font-black uppercase tracking-widest">{missionRouteMeta}</p>
                        )}
                    </div>
                </div>

                {liveBooking.location?.parkingDetails && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border px-4 py-4 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-brand/5 border-brand/10 shadow-soft'}`}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Car size={14} className="text-brand" />
                            <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-content'}`}>Parking Logistics</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-0.5">
                                <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle font-sans opacity-50'}`}>Basement</p>
                                <p className={`font-black text-[13px] uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveBooking.location.parkingDetails.basement || '—'}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle font-sans opacity-50'}`}>Block</p>
                                <p className={`font-black text-[13px] uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveBooking.location.parkingDetails.block || '—'}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle font-sans opacity-50'}`}>Pillar No.</p>
                                <p className={`font-black text-[13px] uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveBooking.location.parkingDetails.pillar || '—'}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle font-sans opacity-50'}`}>Slot No.</p>
                                <p className={`font-black text-[13px] uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveBooking.location.parkingDetails.slotNumber || '—'}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className={`rounded-2xl border px-4 py-4 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-white/5 border-white/5 shadow-soft'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-brand/10 border border-brand/20 rounded-xl overflow-hidden flex items-center justify-center">
                                {liveBooking.userPhoto ? (
                                    <img src={liveBooking.userPhoto} alt="Customer" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-black text-sm text-brand">{liveBooking.userName?.charAt(0) || 'C'}</span>
                                )}
                            </div>
                            <div>
                                <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveBooking.userName || 'Customer'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {liveBooking.isUserVerified ? (
                                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/30 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                            <Shield size={10} className="text-amber-500" fill="currentColor" />
                                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-600">Verified Elite</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-500/10 border border-gray-500/20 rounded-full">
                                            <Shield size={9} className="text-gray-400" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{liveBooking.userKycStatus === 'pending' ? 'Verification Pending' : 'Basic Trust'}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-brand/5 border border-brand/10 rounded-full">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-brand">⭐ {liveBooking.userRating || 5.0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {liveBooking.userPhone && (
                                <a href={`tel:${liveBooking.userPhone}`} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${isDarkMode ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-100 text-green-600'}`}>
                                    <Phone size={15} strokeWidth={2.5} />
                                </a>
                            )}
                        </div>
                    </div>
                    {isApartmentMission ? (
                        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border border-dashed transition-colors ${isDarkMode ? 'bg-brand/10 border-brand/20' : 'bg-brand/5 border-brand/20'}`}>
                            <Shield size={14} className="text-brand" strokeWidth={2.5} />
                            <p className={`text-[10px] font-bold leading-tight ${isDarkMode ? 'text-white/70' : 'text-content'}`}>
                                Apartment wash protocol active. Capture vehicle proof and follow the parking route. No customer PIN is required for this mission.
                            </p>
                        </div>
                    ) : (
                        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border border-dashed transition-colors ${isDarkMode ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50 border-orange-200'}`}>
                            <Shield size={14} className="text-orange-500" strokeWidth={2.5} />
                            <p className={`text-[10px] font-bold leading-tight ${isDarkMode ? 'text-orange-200/60' : 'text-orange-700'}`}>
                                Ask the customer for the <span className="font-black">4-digit Security PIN</span> to verify and start the service.
                            </p>
                        </div>
                    )}
                </div>

                {['Before Wash', 'After Wash'].includes(step) && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`w-full flex flex-col items-center justify-center border-white/5 border-dashed rounded-2xl p-8 transition-all space-y-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/10'}`}>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleCapture}
                        />

                        {capturedPhoto ? (
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
                                <img src={capturedPhoto} className="w-full h-full object-cover" alt="Captured" />
                                <button onClick={() => setCapturedPhoto(null)} className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/20">
                                    <XCircle size={16} />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={openCamera}
                                className="w-20 h-20 bg-brand/10 border-white/5 border-brand/20 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-lg shadow-brand/5 active:scale-95 transition-all"
                            >
                                <div className="absolute inset-0 bg-brand/20 animate-pulse opacity-50" />
                                <Camera size={32} className="text-brand group-hover:scale-110 transition-transform relative z-10" fill="currentColor" />
                            </div>
                        )}

                        <div className="text-center">
                            <p className={`font-black text-sm uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>
                                {capturedPhoto ? 'Verification Photo Ready ✅' : step === 'Before Wash' ? (isApartmentMission ? 'Capture Vehicle Proof Photo' : 'Take Mandatory Selfie + Vehicle') : 'After Wash Proof Ready'}
                            </p>
                            <p className={`text-[9px] font-bold max-w-[180px] mx-auto ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>
                                {capturedPhoto ? 'Click to retake' : `Capture a clear ${step === 'Before Wash' ? (isApartmentMission ? 'photo of the parked vehicle' : 'Selfie with the vehicle') : 'photo of the cleaned vehicle'} to proceed.`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-white/5 text-gray-400'}`}>
                                Portfolio Check: {step === 'Before Wash' ? (isApartmentMission ? 'Vehicle Proof & Slot Match' : 'Identity & Entry') : 'Job Completion'}
                            </div>
                            <div className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isDarkMode ? 'bg-brand/10 text-brand' : 'bg-brand/5 text-brand'}`}>
                                <Shield size={10} fill="currentColor" /> Privacy Auto-Protected
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'Before Wash' && capturedPhoto && !isApartmentMission && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className={`rounded-2xl border p-5 space-y-4 transition-all duration-500 ${isDarkMode ? 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_30px_rgba(242,159,5,0.1)]' : 'bg-brand/5 border-brand/10 shadow-soft'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                                <Shield size={20} className="text-white" fill="currentColor" />
                            </div>
                            <div>
                                <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-content'}`}>Security PIN Verification</p>
                                <p className={`text-[9px] font-bold ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Enter 4-digit code from customer</p>
                            </div>
                        </div>
                        <div className="flex justify-between gap-3 px-2">
                            {[0, 1, 2, 3].map((index) => (
                                <input
                                    key={index}
                                    ref={pinRefs[index]}
                                    type="tel"
                                    maxLength={1}
                                    value={pinInput[index] || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(-1);
                                        if (val) {
                                            const pinArr = pinInput.split('');
                                            // Fill gaps if any
                                            for (let i = 0; i < index; i++) if (!pinArr[i]) pinArr[i] = ' ';
                                            pinArr[index] = val;
                                            setPinInput(pinArr.join(''));
                                            if (index < 3) pinRefs[index + 1].current?.focus();
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Backspace') {
                                            if (!pinInput[index] && index > 0) {
                                                const pinArr = pinInput.split('');
                                                pinArr[index - 1] = '';
                                                setPinInput(pinArr.join(''));
                                                pinRefs[index - 1].current?.focus();
                                            } else {
                                                const pinArr = pinInput.split('');
                                                pinArr[index] = '';
                                                setPinInput(pinArr.join(''));
                                            }
                                        }
                                    }}
                                    className={`w-14 h-16 rounded-xl text-center text-3xl font-black transition-all outline-none border-white/5 ${pinInput[index] && pinInput[index] !== ' '
                                        ? 'border-brand bg-brand/10 text-brand shadow-lg shadow-brand/10'
                                        : isDarkMode
                                            ? 'bg-black/40 border-white/10 text-white focus:border-white/30'
                                            : 'bg-white/5 border-white/10 text-content focus:border-brand '
                                        }`}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {(stepIdx >= 3 || step === 'Washing') && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border p-4 space-y-3 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-white/5 border-white/5 shadow-soft'}`}>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Service Checklist</p>
                        {(liveBooking.service?.features?.length > 0 ? liveBooking.service.features : ['Exterior Foam Wash', 'Interior Vacuum', 'Microfiber Dry', 'Tire Dressing']).map((item, i) => (
                            <div key={item} className="flex items-center gap-3">
                                <div className={`w-5 h-5 border rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${isDarkMode ? 'bg-brand/20 border-brand/30' : 'bg-brand/5 border-brand/20'}`}>
                                    <CheckCircle2 size={12} className="text-brand" strokeWidth={2.5} />
                                </div>
                                <p className={`font-bold text-sm ${isDarkMode ? 'text-white/90' : 'text-content'}`}>{item}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>

            <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md backdrop-blur-md border-t px-4 py-4 z-50 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B]/90 border-white/5 shadow-[0_-15px_50px_rgba(0,0,0,0.4)]' : 'bg-white/90 border-white/5 shadow-[0_-15px_40px_rgba(0,0,0,0.05)]'}`}>
                {['Arrived', 'Before Wash'].includes(step) && (
                    <div className="grid grid-cols-1 gap-3 mb-3">
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={handleReportIssue}
                            className="w-full h-12 rounded-2xl border-white/5 border-red-500/30 text-red-500 font-black text-[10px] uppercase tracking-widest bg-red-500/5 hover:bg-red-500/10 transition-colors"
                        >
                            Vehicle Not Found / Access Issue
                        </motion.button>
                        {isApartmentMission && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleSkipService}
                                className="w-full h-12 rounded-2xl border-white/5 border-gray-300/50 text-white/80 font-black text-[10px] uppercase tracking-widest bg-white/[0.05]/70 hover:bg-gray-200 transition-colors"
                            >
                                Skip Today&apos;s Wash
                            </motion.button>
                        )}
                    </div>
                )}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    disabled={isVerifying}
                    className={`w-full h-14 rounded-2xl flex items-center justify-between px-6 shadow-2xl transition-all ${isVerifying ? 'opacity-70 cursor-not-allowed' : ''} ${cfg.bg}`}
                >
                    <div className="flex flex-col items-start">
                        <span className="text-white/60 text-[8px] font-black uppercase tracking-widest">{cfg.label}</span>
                        <span className="text-white font-black text-sm uppercase tracking-wider">{cfg.cta}</span>
                    </div>
                    {isVerifying ? (
                        <div className="w-6 h-6 border-white/5 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-inner">
                            <ArrowRight size={18} className="text-white" strokeWidth={3} />
                        </div>
                    )}
                </motion.button>
            </div>
            {/* Live Visual Verification Overlay */}
            <AnimatePresence>
                {cameraActive && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col pt-12"
                    >
                        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
                            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-white font-black text-xs uppercase tracking-widest leading-none mt-0.5">Live View</span>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl border backdrop-blur-xl transition-colors flex items-center gap-3 ${cameraTimeLeft < 10 ? 'bg-red-500/20 border-red-500/30' : 'bg-white/10 border-white/10'}`}>
                                <Clock size={16} className={cameraTimeLeft < 10 ? 'text-red-500' : 'text-white'} />
                                <span className={`font-black text-sm tracking-widest ${cameraTimeLeft < 10 ? 'text-red-500' : 'text-white'}`}>00:{cameraTimeLeft.toString().padStart(2, '0')}s</span>
                            </div>
                            <button onClick={closeCamera} className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover scale-x-[-1] absolute"
                            />
                            {/* Visual HUD Focus Frame */}
                            <div className="relative w-64 h-64 border-white/5 border-white/20 rounded-[3rem] shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-brand rounded-tl-2xl" />
                                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-brand rounded-tr-2xl" />
                                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-brand rounded-bl-2xl" />
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-brand rounded-br-2xl" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-t from-black via-black/80 to-transparent p-10 flex flex-col items-center gap-6 z-20">
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] text-center max-w-[200px]">
                                Center the vehicle within the frame for protocol compliance
                            </p>
                            <button 
                                onClick={capturePhoto}
                                className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center p-2 active:scale-90 transition-transform shadow-2xl shadow-white/10"
                            >
                                <div className="w-full h-full border-4 border-black/5 rounded-full flex items-center justify-center">
                                    <div className="w-14 h-14 bg-brand rounded-full shadow-inner" />
                                </div>
                            </button>
                            <div className="flex items-center gap-2 text-white/20">
                                <Shield size={12} />
                                <span className="text-[8px] font-black uppercase tracking-widest">Encrypted Stream Protocol 8.2</span>
                            </div>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </motion.div>
                )}
            </AnimatePresence>
        </CaptainLayout>
    );
};

export default CaptainJobDetail;
