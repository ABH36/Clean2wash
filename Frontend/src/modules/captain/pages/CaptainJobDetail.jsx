import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin, Phone, MessageSquare, ChevronLeft, CheckCircle2,
    Shield, Car, Clock, Navigation, Camera, ChevronRight,
    Zap, ArrowRight, XCircle
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../hooks/useCaptain';
import { useTheme } from '../../../context/ThemeContext';

// Fix for Leaflet marker icons in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const STEPS_ORDER = ['Confirmed', 'En Route', 'Arrived', 'Before Wash', 'Washing', 'After Wash', 'Completed'];

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
    const fileInputRef = React.useRef(null);
    const pinRefs = [React.useRef(), React.useRef(), React.useRef(), React.useRef()];

    useEffect(() => {
        if (liveBooking) setStepIdx(getInitialStep());
    }, [liveBooking?.status]);

    if (!liveBooking) {
        return (
            <CaptainLayout hideNav>
                <div className="flex flex-col items-center justify-center min-h-[90vh] px-8 text-center relative overflow-hidden transition-colors duration-500">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
                        <motion.div animate={{ scale: [1, 1.5], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeOut" }}
                            className={`absolute w-64 h-64 border-2 rounded-full ${isDarkMode ? 'border-brand/40' : 'border-brand/20'}`} />
                        <motion.div animate={{ scale: [1, 1.5], opacity: [0.2, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeOut", delay: 1.5 }}
                            className={`absolute w-96 h-96 border rounded-full ${isDarkMode ? 'border-brand/30' : 'border-brand/10'}`} />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-24 h-24 rounded-[40px] flex items-center justify-center mb-8 border shadow-xl relative transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-brand/5 border-brand/10'}`}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                className={`absolute inset-0 border-2 border-dashed rounded-[40px] opacity-30 ${isDarkMode ? 'border-white' : 'border-brand'}`} />
                            <div className={`w-16 h-16 rounded-[30px] flex items-center justify-center border shadow-inner transition-colors ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-brand/10'}`}>
                                <Zap size={32} className="text-brand" fill="currentColor" />
                            </div>
                        </div>
                        <div className="space-y-3 mb-12">
                            <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>
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
                                    className={`mt-4 p-5 rounded-3xl border text-left transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-xl'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-brand text-[9px] font-black uppercase tracking-widest mb-1">Service</p>
                                            <h3 className={`font-black text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{pendingRequest.serviceName}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[9px] font-black uppercase tracking-widest mb-1`}>Payout</p>
                                            <p className={`font-black text-xl italic ${isDarkMode ? 'text-white' : 'text-content'}`}>{pendingRequest.price}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-100'}`}>
                                            <MapPin size={16} className="text-brand" fill="currentColor" strokeWidth={1.5} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`font-black text-xs truncate ${isDarkMode ? 'text-white/80' : 'text-content'}`}>{pendingRequest.address}</p>
                                            <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[9px] font-bold`}>Nearby Request</p>
                                        </div>
                                    </div>
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleAcceptRequest(pendingRequest.id)}
                                        className={`w-full h-12 rounded-2xl font-black text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 ${isAccepting ? 'bg-green-500 shadow-green-500/20' : 'bg-brand shadow-brand/30'}`}>
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
                                className={`group flex items-center gap-4 px-8 py-4 rounded-3xl transition-all shadow-xl ${isDarkMode ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-gray-100 hover:bg-gray-50'}`}>
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

    const handleCapture = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedPhoto(reader.result);
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
                // Moving to before_photo status
                const result = await updateJobStatus(liveBooking.id, 'before_photo', { photo: 'init' }); // Placeholder to bypass strict check if needed
                if (result.success) {
                    setStepIdx(nextIdx);
                    setCapturedPhoto(null);
                }
            } else if (currentStep === 'Before Wash') {
                // Must have photo AND PIN
                if (!capturedPhoto) {
                    alert('Please capture a "Before Wash" photo to proceed.');
                    return;
                }
                if (!pinInput || pinInput.length < 4) {
                    alert('Please enter the 4-digit Security PIN from the customer.');
                    return;
                }
                const result = await updateJobStatus(liveBooking.id, 'washing', {
                    photo: capturedPhoto,
                    securityPin: pinInput
                });
                if (result.success) {
                    setStepIdx(nextIdx);
                    setCapturedPhoto(null);
                    setPinInput('');
                }
            } else if (currentStep === 'Washing') {
                const result = await updateJobStatus(liveBooking.id, 'after_photo', { photo: 'init' });
                if (result.success) setStepIdx(nextIdx);
            } else if (currentStep === 'After Wash') {
                if (!capturedPhoto) {
                    alert('Please capture an "After Wash" photo to verify quality.');
                    return;
                }
                const result = await updateJobStatus(liveBooking.id, 'completed', { photo: capturedPhoto });
                if (result.success) {
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
    };
    const cfg = stepConfig[step] || stepConfig['Done'];

    return (
        <CaptainLayout hideNav>
            <header className={`${isDarkMode ? 'bg-[#1E293B]/70 border-white/5' : 'bg-white/70 border-gray-100'} backdrop-blur-xl px-4 pt-10 pb-4 border-b sticky top-0 z-40 transition-colors duration-500`}>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/captain')} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-content'}`}>
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
                            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${i < stepIdx ? 'bg-green-500 border-green-500' :
                                i === stepIdx ? `${cfg.bg} border-transparent` :
                                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                {i < stepIdx
                                    ? <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                                    : <span className={`text-[9px] font-black ${i === stepIdx ? 'text-white' : isDarkMode ? 'text-white/20' : 'text-gray-300'}`}>{i + 1}</span>
                                }
                            </div>
                            {i < STEPS_ORDER.length - 1 && (
                                <div className={`flex-1 h-1 rounded-full transition-all ${i < stepIdx ? 'bg-green-400' : isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className={`relative rounded-2xl overflow-hidden border shadow-soft transition-colors ${isDarkMode ? 'border-white/5 shadow-2xl shadow-black/40' : 'border-gray-100 shadow-sm'}`} style={{ height: 280 }}>
                    <MapContainer
                        center={liveBooking.location?.mapCoordinates ? [liveBooking.location.mapCoordinates.lat, liveBooking.location.mapCoordinates.lng] :
                            liveBooking.location?.coordinates?.lat ? [liveBooking.location.coordinates.lat, liveBooking.location.coordinates.lng] :
                                [12.9716, 77.5946]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            url={isDarkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                            attribution='&copy; OpenStreetMap'
                        />
                        <Marker position={liveBooking.location?.mapCoordinates ? [liveBooking.location.mapCoordinates.lat, liveBooking.location.mapCoordinates.lng] :
                            liveBooking.location?.coordinates?.lat ? [liveBooking.location.coordinates.lat, liveBooking.location.coordinates.lng] :
                                [12.9716, 77.5946]}>
                            <Popup>
                                <div className="text-[10px] font-bold">Customer Location</div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                    <button
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(liveBooking.address)}`, '_blank')}
                        className="absolute bottom-3 right-3 bg-brand text-white flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:brightness-110 active:scale-95 transition-all z-[1000]"
                    >
                        <Navigation size={12} strokeWidth={2.5} /> Navigate
                    </button>
                </div>

                <div className={`rounded-2xl border px-4 py-4 flex items-start gap-3 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/20' : 'bg-white border-gray-100 shadow-soft'}`}>
                    <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin size={16} className="text-brand" fill="currentColor" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Pickup Address</p>
                        <p className={`font-bold text-[13px] leading-tight mt-1 ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveBooking.address || 'Loading...'}</p>
                        {liveBooking.landmark && (
                            <div className="flex items-center gap-1.5 mt-2">
                                <Shield size={10} className="text-brand" />
                                <p className={`text-[10px] font-bold ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Landmark: {liveBooking.landmark}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`rounded-2xl border px-4 py-4 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-soft'}`}>
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
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[9px] font-bold ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>★ {liveBooking.userRating || 4.9}</span>
                                    <span className={`text-[9px] font-bold ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>· Verified User</span>
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
                    {/* OTP Security Notice */}
                    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border border-dashed transition-colors ${isDarkMode ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50 border-orange-200'}`}>
                        <Shield size={14} className="text-orange-500" strokeWidth={2.5} />
                        <p className={`text-[10px] font-bold leading-tight ${isDarkMode ? 'text-orange-200/60' : 'text-orange-700'}`}>
                            Ask the customer for the <span className="font-black">4-digit Security PIN</span> to verify and start the service.
                        </p>
                    </div>
                </div>

                {['Before Wash', 'After Wash'].includes(step) && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-all space-y-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
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
                                <button onClick={() => setCapturedPhoto(null)} className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white">
                                    <XCircle size={16} />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center relative overflow-hidden group cursor-pointer"
                            >
                                <Camera size={24} className="text-brand group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-brand/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}

                        <div className="text-center">
                            <p className={`font-black text-sm uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>
                                {capturedPhoto ? 'Verification Photo Ready ✅' : step === 'Before Wash' ? 'Take Mandatory Selfie + Vehicle' : 'After Wash Proof Ready'}
                            </p>
                            <p className={`text-[9px] font-bold max-w-[180px] mx-auto ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>
                                {capturedPhoto ? 'Click to retake' : `Capture a clear ${step === 'Before Wash' ? 'Selfie with the vehicle' : 'photo of the cleaned vehicle'} to proceed.`}
                            </p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-white text-gray-400'}`}>
                            Portfolio Check: {step === 'Before Wash' ? 'Identity & Entry' : 'Job Completion'}
                        </div>
                    </motion.div>
                )}

                {step === 'Before Wash' && capturedPhoto && (
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
                                    className={`w-14 h-16 rounded-xl text-center text-3xl font-black transition-all outline-none border-2 ${pinInput[index] && pinInput[index] !== ' '
                                        ? 'border-brand bg-brand/10 text-brand shadow-lg shadow-brand/10'
                                        : isDarkMode
                                            ? 'bg-black/40 border-white/10 text-white focus:border-white/30'
                                            : 'bg-white border-gray-200 text-content focus:border-brand shadow-sm'
                                        }`}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {(stepIdx >= 3 || step === 'Washing') && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border p-4 space-y-3 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-soft'}`}>
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

            <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md backdrop-blur-md border-t px-4 py-4 z-50 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B]/90 border-white/5 shadow-[0_-15px_50px_rgba(0,0,0,0.4)]' : 'bg-white/90 border-gray-100 shadow-[0_-15px_40px_rgba(0,0,0,0.05)]'}`}>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    disabled={isVerifying}
                    className={`w-full h-14 rounded-2xl flex items-center justify-between px-6 shadow-2xl transition-all ${isVerifying ? 'opacity-70 cursor-not-allowed' : ''} ${cfg.bg}`}
                >
                    <div className="flex flex-col items-start">
                        <span className="text-white/60 text-[8px] font-black uppercase tracking-widest">{cfg.label}</span>
                        <span className="text-white font-black text-sm uppercase italic tracking-wider">{cfg.cta}</span>
                    </div>
                    {isVerifying ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-inner">
                            <ArrowRight size={18} className="text-white" strokeWidth={3} />
                        </div>
                    )}
                </motion.button>
            </div>
        </CaptainLayout>
    );
};

export default CaptainJobDetail;
