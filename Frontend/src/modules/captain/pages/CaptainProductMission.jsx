import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin, Phone, MessageSquare, ChevronLeft, CheckCircle2,
    Shield, Package, Clock, Navigation, Camera, ChevronRight,
    Zap, ArrowRight, XCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../hooks/useCaptain';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';

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

const MISSION_STEPS = ['Arrived at Studio', 'Picked Up', 'Arrived at Customer', 'Delivered'];

const CaptainProductMission = () => {
    const navigate = useNavigate();
    const { orderId, itemId } = useParams();
    const searchParams = new URLSearchParams(window.location.search);
    const isBatchMode = searchParams.get('isBatch') === 'true';

    const { isDarkMode } = useTheme();
    const { sessions } = useAuth();
    const { captainJobs, updateLocation, updateProductMissionStatus } = useCaptain();

    const [mainMission, setMainMission] = useState(null);
    const [batchedItems, setBatchedItems] = useState([]);
    const [stepIdx, setStepIdx] = useState(0);
    const [pinInput, setPinInput] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        // Find the primary mission from URL params
        const primary = captainJobs.find(j =>
            (j.orderId === orderId && (j._id === itemId || j.id === itemId)) ||
            (j.type === 'product_order' && (j._id === itemId || j.id === itemId))
        );

        if (primary) {
            setMainMission(primary);

            // If in batch mode, find all other linked missions (assigned to same captain, not delivered)
            if (isBatchMode) {
                const others = captainJobs.filter(j =>
                    j.id !== primary.id &&
                    j.type === 'product_order' &&
                    j.status !== 'delivered'
                );
                setBatchedItems([primary, ...others]);
            } else {
                setBatchedItems([primary]);
            }

            // Map status to step index (using primary as reference)
            const s = primary.status;
            if (s === 'delivered') setStepIdx(3);
            else if (s === 'arrived_delivery') setStepIdx(2);
            else if (s === 'shipped') setStepIdx(1);
            else if (s === 'arrived_pickup') setStepIdx(0);
            else setStepIdx(0);
        }
    }, [orderId, itemId, captainJobs, isBatchMode]);

    const handleNextStatus = async () => {
        setIsVerifying(true);
        try {
            const currentStep = MISSION_STEPS[stepIdx];
            let status = '';
            if (currentStep === 'Arrived at Studio') status = 'arrived_pickup';
            else if (currentStep === 'Picked Up') status = 'shipped';
            else if (currentStep === 'Arrived at Customer') status = 'arrived_delivery';
            else if (currentStep === 'Delivered') {
                if (!pinInput || pinInput.length < 4) {
                    toast.error('Enter 4-digit PIN');
                    setIsVerifying(false);
                    return;
                }
                status = 'delivered';
            }

            // For batches, we update the primary item first, then others if applicable
            // In a more robust system, we'd have individual status buttons for each stop
            // But for this "Batch Mission", we assume they arrive at pickup/delivery together

            const results = await Promise.all(batchedItems.map(item =>
                updateProductMissionStatus(item.orderId, item._id || item.id, status, status === 'delivered' ? { deliveryPin: pinInput } : {})
            ));

            const allSuccess = results.every(res => res.success);

            if (results[0].success) {
                toast.success(`Batch Progress: ${status.replace('_', ' ')}`);
                if (status === 'delivered') navigate('/captain');
                else setStepIdx(prev => prev + 1);
            } else {
                toast.error(results[0].error || 'Update failed');
            }

        } catch (error) {
            toast.error('Update failed');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleRejectDelivery = async () => {
        if (!window.confirm('Mark this delivery as rejected by customer? You will need to return the items to the studio.')) return;

        setIsVerifying(true);
        try {
            const results = await Promise.all(batchedItems.map(item =>
                updateProductMissionStatus(item.orderId, item._id || item.id, 'returning_to_pickup')
            ));

            if (results[0].success) {
                toast.success('Items marked for Return to Studio', { icon: '🔄' });
                navigate('/captain');
            } else {
                toast.error(results[0].error || 'Rejection failed');
            }
        } catch (error) {
            toast.error('Operation failed');
        } finally {
            setIsVerifying(false);
        }
    };

    if (!mainMission) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
        );
    }

    return (
        <CaptainLayout hideNav>
            <header className={`${isDarkMode ? 'bg-[#1E293B]/70 border-white/5' : 'bg-white/70 border-gray-100'} backdrop-blur-xl px-4 pt-10 pb-4 border-b sticky top-0 z-40 transition-colors duration-500`}>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/captain')} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-content'}`}>
                        <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>
                    <div className="flex-1">
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Product Pickup</p>
                        <h1 className={`text-lg font-black tracking-tight leading-none truncate max-w-[150px] ${isDarkMode ? 'text-white' : 'text-content'}`}>
                            {isBatchMode ? `Batch: ${batchedItems.length} Items` : mainMission.productName}
                        </h1>
                    </div>
                    <span className={`text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-orange-500 shadow-lg shadow-black/10`}>{MISSION_STEPS[stepIdx]}</span>
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-32">
                {/* Visual Progress */}
                <div className="flex items-center gap-2">
                    {MISSION_STEPS.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${i < stepIdx ? 'bg-green-500 border-green-500' :
                                i === stepIdx ? `bg-orange-500 border-transparent` :
                                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                {i < stepIdx
                                    ? <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                                    : <span className={`text-[9px] font-black ${i === stepIdx ? 'text-white' : isDarkMode ? 'text-white/20' : 'text-gray-300'}`}>{i + 1}</span>
                                }
                            </div>
                            {i < MISSION_STEPS.length - 1 && (
                                <div className={`flex-1 h-1 rounded-full transition-all ${i < stepIdx ? 'bg-green-400' : isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Multi-Stop List */}
                <div className="space-y-4">
                    {batchedItems.map((item, idx) => (
                        <div key={item.id} className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                                        <Package size={20} className="text-brand" />
                                    </div>
                                    <div>
                                        <h3 className={`text-sm font-black leading-none ${isDarkMode ? 'text-white' : 'text-content'}`}>{item.productName}</h3>
                                        <p className={`text-[10px] font-bold mt-1 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>QTY: {item.quantity}</p>
                                    </div>
                                </div>
                                <div className="px-2 py-1 bg-black/5 rounded-lg">
                                    <span className="text-[9px] font-black text-black/40 uppercase tracking-widest italic">Item #{idx + 1}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-brand/10 rounded-lg flex items-center justify-center mt-0.5">
                                        <MapPin size={12} className="text-brand" fill="currentColor" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-brand uppercase tracking-widest">Pickup Studio</p>
                                        <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-content'}`}>{item.vendorName}</p>
                                    </div>
                                    <button onClick={() => window.open(`tel:${item.vendorPhone || '9999999999'}`)} className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                                        <Phone size={14} />
                                    </button>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mt-0.5">
                                        <Navigation size={12} className="text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Delivery Point</p>
                                        <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-content'}`}>{item.address || 'Consumer Destination'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Delivery PIN Section */}
                {stepIdx === 2 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className={`rounded-3xl border p-6 space-y-4 transition-all duration-500 ${isDarkMode ? 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_30px_rgba(242,159,5,0.1)]' : 'bg-brand/5 border-brand/10 shadow-soft'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                                <Shield size={20} className="text-white" fill="currentColor" />
                            </div>
                            <div>
                                <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-content'}`}>Handover PIN Verification</p>
                                <p className={`text-[9px] font-bold ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Ask customer for delivery secret</p>
                            </div>
                        </div>
                        <input
                            type="tel"
                            maxLength={4}
                            placeholder="0 0 0 0"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full h-16 rounded-2xl text-center text-4xl font-black tracking-[1em] transition-all outline-none border-2 bg-white/10 border-white/10 text-brand"
                        />
                        <button
                            onClick={handleRejectDelivery}
                            disabled={isVerifying}
                            className={`w-full py-4 rounded-2xl border-2 border-dashed font-bold text-xs uppercase tracking-widest transition-all ${isDarkMode ? 'border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/50' : 'border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-500/50'}`}
                        >
                            Customer Rejected? Return to Studio
                        </button>
                    </motion.div>
                )}
            </div>

            <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md backdrop-blur-md border-t px-4 py-4 z-50 transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B]/90 border-white/5 shadow-2xl' : 'bg-white/90 border-gray-100'}`}>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextStatus}
                    disabled={isVerifying}
                    className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 shadow-2xl transition-all bg-brand text-white font-black uppercase italic tracking-wider`}
                >
                    {isVerifying ? 'Updating Status...' : (
                        <>
                            {stepIdx === 0 && 'I Have Arrived at Studio'}
                            {stepIdx === 1 && 'Confirm Pickup & Start Delivery'}
                            {stepIdx === 2 && 'Verify PIN & Complete Delivery'}
                            <ArrowRight size={18} strokeWidth={3} />
                        </>
                    )}
                </motion.button>
            </div>
        </CaptainLayout>
    );
};

export default CaptainProductMission;
