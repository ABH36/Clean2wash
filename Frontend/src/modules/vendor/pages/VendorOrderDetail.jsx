import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Car, User, Clock,
    CheckCircle2, AlertCircle, Phone, MessageSquare,
    Camera, ChevronRight, Package, Truck, Star,
    ShieldCheck, X, Upload, Zap, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';
import { vendorAPI } from '../../../utils/vendorApi';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { socketService } from '../../../utils/socket';
import { toast } from 'react-hot-toast';


const VendorOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getUser } = useAuth();
    const { isDarkMode } = useTheme();
    const vendor = getUser('vendor');

    const [staffList, setStaffList] = useState([]);
    const [assignedStaff, setAssignedStaff] = useState({ pickup: null, delivery: null });
    const [liveBooking, setLiveBooking] = useState(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [showDriverPicker, setShowDriverPicker] = useState(false);
    const [pickerRole, setPickerRole] = useState('pickup');
    const [showPinModal, setShowPinModal] = useState(false);
    const [enteredPin, setEnteredPin] = useState('');
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        try {
            const [orderRes, staffRes] = await Promise.all([
                vendorAPI.getOrderById(id),
                vendorAPI.getStaff()
            ]);

            if (orderRes.status === 'success') {
                setLiveBooking(orderRes.data.order);
                setStatus(orderRes.data.order.status);
                setAssignedStaff({
                    pickup: orderRes.data.order.pickupStaff,
                    delivery: orderRes.data.order.deliveryStaff
                });
            }

            if (staffRes.status === 'success') {
                setStaffList(staffRes.data.staff);
            }
        } catch (err) {
            console.error('Failed to load order details', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Socket Listeners - joinBookingRoom is needed for real-time status updates for this specific booking
        socketService.joinBookingRoom(id);

        socketService.on('booking_status_updated', (data) => {
            if (data.status) {
                setStatus(data.status);
            }
            fetchData(); // Refresh all data
        });

        return () => {
            socketService.off('booking_status_updated');
        };
    }, [id]);

    const handleAcceptRequest = async () => {
        try {
            const res = await vendorAPI.updateOrderStatus(id, 'accepted');
            if (res.status === 'success') {
                setLiveBooking(res.data.booking);
                setStatus('accepted');
            }
        } catch (error) {
            console.error('Error accepting job', error);
        }
    };

    const handleUpdateStatus = async () => {
        try {
            const res = await vendorAPI.updateOrderStatus(id, status);
            if (res.status === 'success') {
                const updatedBooking = res.data.booking || res.data.order;
                setLiveBooking(updatedBooking);
                setStatus(updatedBooking.status);
                toast.success(`Status updated to ${status.replace(/_/g, ' ')}`);
            }
        } catch (error) {
            console.error('Error updating status', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleVerifyPin = async () => {
        try {
            const res = await vendorAPI.verifyBookingPin(id, enteredPin);
            if (res.status === 'success') {
                toast.success("Security PIN Verified! Handover confirmed.");
                setShowPinModal(false);
                setEnteredPin('');
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid PIN. Access Denied.");
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const res = await vendorAPI.updateOrderStatus(id, status, [reader.result]);
                if (res.status === 'success') {
                    toast.success("Evidence uploaded successfully");
                    fetchData();
                }
            } catch (error) {
                toast.error("Upload failed");
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleAssignStaff = async (staffId) => {
        try {
            const res = await vendorAPI.assignStaff(id, staffId, pickerRole);
            if (res.status === 'success') {
                const updatedBooking = res.data.booking;
                setLiveBooking(updatedBooking);
                setAssignedStaff({
                    pickup: updatedBooking.pickupStaff,
                    delivery: updatedBooking.deliveryStaff
                });
                setShowDriverPicker(false);
                toast.success(`Unit Successfully Dispatched for ${pickerRole.toUpperCase()}`);
            }
        } catch (error) {
            console.error('Error assigning staff', error);
            toast.error(error.message || 'Dispatch Protocol Failure');
        }
    };

    const openDriverPicker = (role) => {
        setPickerRole(role);
        setShowDriverPicker(true);
    };

    const getProgressWidth = () => {
        if (!liveBooking) return '0%';
        const statusMap = {
            'pending': '10%',
            'accepted': '20%',
            'confirmed': '25%',
            'assigned': '30%',
            'pickup-assigned': '35%',
            'en_route': '45%',
            'arrived': '55%',
            'before_photo': '60%',
            'at-studio': '70%',
            'in_progress': '80%',
            'quality-check': '90%',
            'ready-for-delivery': '91%',
            'delivery-assigned': '93%',
            'out_for_delivery': '95%',
            'at_delivery_address': '98%',
            'completed': '100%'
        };
        return statusMap[liveBooking.status] || '0%';
    };

    const timeline = liveBooking ? [
        { label: 'Booking Request', time: new Date(liveBooking.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'completed' },
        { label: 'Studio Accepted', time: liveBooking.vendor ? 'OK' : '--', status: liveBooking.vendor ? 'completed' : 'pending' },
        { label: 'Pickup Assigned', time: '--', status: liveBooking.pickupStaff ? 'completed' : 'pending' },
        { label: 'Vehicle at Studio', time: '--', status: ['at-studio', 'in_progress', 'quality-check', 'ready-for-delivery', 'completed'].includes(liveBooking.status) ? 'completed' : 'pending' },
        { label: 'Detaling & QC', time: '--', status: ['quality-check', 'ready-for-delivery', 'completed'].includes(liveBooking.status) ? (['ready-for-delivery', 'completed', 'delivery-assigned', 'out_for_delivery', 'at_delivery_address'].includes(liveBooking.status) ? 'completed' : 'active') : 'pending' },
        { label: 'Ready for Home', time: '--', status: ['ready-for-delivery', 'delivery-assigned', 'out_for_delivery', 'at_delivery_address', 'completed'].includes(liveBooking.status) ? (liveBooking.status === 'ready-for-delivery' ? 'active' : 'completed') : 'pending' },
        { label: 'Handover Complete', time: '--', status: liveBooking.status === 'completed' ? 'completed' : 'pending' },
    ] : [];



    return (
        <VendorLayout
            title={`Order ${id.substring(0, 8)}`}
            subtitle="Job Details & Execution"
        >
            <div className="space-y-8 max-w-6xl mx-auto pb-32 lg:pb-12">
                {loading || !liveBooking ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin shadow-lg shadow-brand/20" />
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.4em]">Accessing Order Logic...</p>
                    </div>
                ) : (
                    <>
                        {/* Header Actions */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-content-subtle hover:text-brand font-black text-[10px] uppercase tracking-[0.3em] transition-all group w-fit">
                                <div className="w-8 h-8 rounded-full bg-surface border border-gray-100/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ArrowLeft size={16} />
                                </div>
                                Back to Command
                            </button>
                            <div className="flex flex-wrap items-center gap-3">
                                {liveBooking.status === 'pending' && (
                                    !liveBooking.vendor || liveBooking.vendor !== vendor?.id
                                ) && (
                                        <button onClick={handleAcceptRequest} className="h-12 px-8 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all">
                                            Accept Mission
                                        </button>
                                    )}
                                {['accepted', 'assigned', 'pickup-assigned'].includes(liveBooking.status) && (
                                    <button onClick={() => setShowPinModal(true)} className="h-12 px-8 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                        <ShieldCheck size={18} strokeWidth={2.5} /> Verify Clearance
                                    </button>
                                )}
                                <button className="h-12 px-6 border border-gray-100/10 bg-surface rounded-2xl text-content-subtle font-black text-[10px] uppercase tracking-[0.2em] hover:text-brand transition-all active:scale-95">
                                    Archive Ledger
                                </button>
                                <button className="h-12 px-6 bg-red-500/10 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all active:scale-95">
                                    Abort Mission
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Job Info */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Status Card */}
                                <div className="bg-surface rounded-[3rem] p-8 md:p-12 text-content relative overflow-hidden shadow-2xl border border-gray-100/10 group">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

                                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 ${isDarkMode ? 'bg-brand/10 border-brand/20' : 'bg-brand/5 border-brand/10'} border rounded-full`}>
                                                    <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                                                    <p className="text-[9px] font-black text-brand uppercase tracking-[0.2em]">Live Telemetry Active</p>
                                                </div>
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 ${liveBooking.schedule?.type === 'scheduled' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'} border rounded-full`}>
                                                    {liveBooking.schedule?.type === 'scheduled' ? <Clock size={10} /> : <Zap size={10} fill="currentColor" />}
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em]">
                                                        {liveBooking.schedule?.type === 'scheduled' ? `Timed Mission: ${new Date(liveBooking.schedule.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} @ ${liveBooking.schedule.timeSlot?.start || 'Scheduled'}` : 'Instant Protocol: ASAP'}
                                                    </p>
                                                </div>
                                            </div>
                                            <h2 className="text-5xl font-black tracking-tighter uppercase leading-none text-content transform group-hover:-skew-x-6 transition-transform duration-700">{liveBooking.status.replace(/-/g, ' ')}</h2>
                                            <div className="space-y-2">
                                                <div className="h-2 w-full max-w-sm bg-background/50 rounded-full overflow-hidden border border-gray-100/5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: getProgressWidth() }}
                                                        transition={{ duration: 1.5, ease: "circOut" }}
                                                        className="h-full bg-brand shadow-[0_0_20px_rgba(var(--brand-rgb),0.5)]"
                                                    />
                                                </div>
                                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] opacity-60">Mission completion: {getProgressWidth()}</p>
                                            </div>
                                        </div>
                                         <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                             <div className="relative group/select">
                                                 <select
                                                     className="h-14 sm:h-16 w-full sm:w-auto bg-background/60 backdrop-blur-sm border border-gray-100/10 rounded-2xl sm:rounded-[1.5rem] px-6 sm:px-8 text-[10px] sm:text-xs font-black uppercase tracking-widest outline-none focus:border-brand/50 transition-all cursor-pointer text-content shadow-inner appearance-none min-w-[180px]"
                                                     value={status}
                                                     onChange={(e) => setStatus(e.target.value)}
                                                 >
                                                     <option value="accepted">Mission Accepted</option>
                                                     <option value="en_route">En Route</option>
                                                     <option value="at-studio">At Workshop</option>
                                                     <option value="in_progress">Work in Progress</option>
                                                     <option value="quality-check">Audit (QC)</option>
                                                     <option value="ready-for-delivery">Deployment Ready</option>
                                                     <option value="completed">Mission Secured</option>
                                                 </select>
                                                 <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-content-subtle group-focus-within/select:text-brand transition-colors">
                                                     <ChevronRight className="w-4 h-4" />
                                                 </div>
                                             </div>
                                             <button onClick={handleUpdateStatus} className="h-14 sm:h-16 bg-content text-white px-8 sm:px-10 rounded-2xl sm:rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-content/30 hover:bg-brand transition-all active:scale-95 whitespace-nowrap">
                                                 Commit Update
                                             </button>
                                         </div>
                                    </div>
                                </div>

                                {/* Customer & Vehicle Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-surface/60 backdrop-blur-sm p-8 rounded-[3rem] border border-gray-100/10 shadow-soft space-y-6 group hover:border-brand/30 transition-all">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] px-2">Customer Profile</h3>
                                            <div className="flex gap-2">
                                                <button className="w-10 h-10 bg-background/50 border border-gray-100/10 rounded-xl text-brand hover:bg-brand hover:text-white transition-all flex items-center justify-center shadow-sm"><Phone size={16} /></button>
                                                <button className="w-10 h-10 bg-background/50 border border-gray-100/10 rounded-xl text-brand hover:bg-brand hover:text-white transition-all flex items-center justify-center shadow-sm"><MessageSquare size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 sm:gap-6">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-background rounded-2xl sm:rounded-3xl flex items-center justify-center border border-gray-100/10 text-brand font-black text-2xl sm:text-3xl shadow-inner group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                                                {liveBooking.consumer?.profile?.photo ? (
                                                    <img src={liveBooking.consumer.profile.photo} className="w-full h-full object-cover" alt="Customer" />
                                                ) : (
                                                    liveBooking.consumer?.name?.charAt(0) || 'U'
                                                )}
                                            </div>
                                            <div className="space-y-0.5 sm:space-y-1 min-w-0">
                                                <h4 className="font-black text-xl sm:text-2xl text-content tracking-tighter uppercase leading-none truncate">{liveBooking.consumer?.name || 'GUEST ASSET'}</h4>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
                                                        <Star size={10} fill="currentColor" />
                                                        <span className="text-[9px] sm:text-[10px] font-black">4.8</span>
                                                    </div>
                                                    <span className="text-[8px] sm:text-[9px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-40">Tier: Platinum</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-surface/60 backdrop-blur-sm p-8 rounded-[3rem] border border-gray-100/10 shadow-soft space-y-6 group hover:border-brand/30 transition-all">
                                        <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] px-2">Vehicle Asset</h3>
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-background rounded-3xl flex items-center justify-center border border-gray-100/10 text-content-muted font-black shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                <Car size={32} strokeWidth={1.5} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-black text-2xl text-content tracking-tighter uppercase leading-none">{liveBooking.vehicle?.brand ? `${liveBooking.vehicle.brand} ${liveBooking.vehicle.model}` : 'UNKNOWN UNIT'}</h4>
                                                <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] bg-brand/5 w-fit px-3 py-1 rounded-lg border border-brand/10">{liveBooking.vehicle?.plate || 'VERIFIED REGISTRY'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Service Breakdown */}
                                <div className="bg-surface p-10 rounded-[3rem] border border-gray-100/10 shadow-soft relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] mb-8 relative z-10">Operation Parameters</h3>
                                    <div className="space-y-6 relative z-10">
                                        <div className="flex items-center justify-between py-6 border-b border-gray-100/5 group/row">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center text-brand transition-transform group-hover/row:rotate-6 duration-500 shadow-lg shadow-brand/5">
                                                    <Package size={24} strokeWidth={1.5} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xl font-black text-content tracking-tighter uppercase leading-none">{liveBooking.service?.name}</p>
                                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-40">Industrial Grade Detaling</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-3xl font-black tracking-tighter text-content leading-none">₹{liveBooking.price || liveBooking.service?.defaultPrice}</span>
                                                <p className="text-[9px] font-black text-brand uppercase tracking-widest mt-1">Paid via Credits</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-3 pt-4">
                                            {(liveBooking.addons && liveBooking.addons.length > 0 ? liveBooking.addons : ['Premium Hydro-Seal', 'Interior Sterilization', 'Tactical Polish']).map(addon => (
                                                <span key={addon} className="px-5 py-2.5 bg-background/50 backdrop-blur-sm border border-gray-100/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-content-muted shadow-sm hover:border-brand/40 transition-colors">
                                                    + {addon}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Inspection Photos */}
                                <div className="bg-surface p-10 rounded-[3rem] border border-gray-100/10 shadow-soft">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                        <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em]">Tactical Evidence Ledger</h3>
                                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-brand/5 rounded-2xl border border-brand/10">
                                            <Camera size={14} className="text-brand" />
                                            <span className="text-[10px] font-black text-content uppercase tracking-[0.2em]"><span className="text-brand">{liveBooking.inspectionPhotos?.length || 0}</span> Assets Recorded</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
                                        {(liveBooking.inspectionPhotos || [
                                            'https://images.unsplash.com/photo-1507136390302-cd99245fe028?w=400&q=80',
                                            'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&q=80'
                                        ]).map((img, i) => (
                                            <div key={i} className="aspect-square rounded-[2rem] overflow-hidden border border-gray-100/10 bg-background group relative shadow-xl">
                                                <img src={img} alt="Inspection" className="w-full h-full object-cover group-hover:scale-110 active:scale-125 transition-transform duration-700" />
                                                <div className="absolute inset-0 bg-content/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button onClick={() => window.open(img, '_blank')} className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-black shadow-2xl active:scale-90 transition-transform"><Star size={16} fill="black" /></button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Dynamic Evidence Photos */}
                                        {(liveBooking.serviceImages?.before || []).map((img, i) => (
                                            <div key={`before-${i}`} className="aspect-square rounded-[2rem] overflow-hidden border-2 border-brand/20 bg-background group relative shadow-2xl shadow-brand/10">
                                                <img src={img} alt="Before Wash" className="w-full h-full object-cover" />
                                                <div className="absolute top-4 left-4 bg-brand text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg">Before Data</div>
                                            </div>
                                        ))}
                                        {(liveBooking.serviceImages?.after || []).map((img, i) => (
                                            <div key={`after-${i}`} className="aspect-square rounded-[2rem] overflow-hidden border-2 border-green-500/20 bg-background group relative shadow-2xl shadow-green-500/10">
                                                <img src={img} alt="After Wash" className="w-full h-full object-cover" />
                                                <div className="absolute top-4 left-4 bg-green-500 text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg">Post-Operation</div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => document.getElementById('photo-upload').click()}
                                            disabled={uploading}
                                            className="aspect-square rounded-[2rem] border-2 border-dashed border-gray-100/20 bg-background/50 flex flex-col items-center justify-center gap-3 text-content-subtle hover:border-brand/50 hover:text-brand hover:bg-brand/5 transition-all group active:scale-95"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-surface border border-gray-100/5 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all shadow-inner">
                                                {uploading ? <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /> : <Camera size={24} strokeWidth={1.5} />}
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">{uploading ? 'UPLOADING...' : 'LOG ASSET'}</span>
                                        </button>
                                        <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Sidebar Tasks */}
                            <div className="space-y-8">
                                {/* Driver Control */}
                                <div className="bg-surface p-8 rounded-[3rem] border border-gray-100/10 shadow-soft space-y-8 group">
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] px-2 flex justify-between items-center">
                                        Personnel Dispatch
                                        <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
                                    </h3>

                                    {/* Pickup Driver */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.4em] opacity-60">Field Unit: Intake</p>
                                            {assignedStaff.pickup && <span className="text-[7px] font-black bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>}
                                        </div>
                                        <div className={`flex items-center gap-5 p-5 rounded-[2rem] border transition-all duration-500 ${assignedStaff.pickup ? 'bg-brand/5 border-brand/20 shadow-lg shadow-brand/5' : 'bg-background/40 border-gray-100/5 shadow-inner'}`}>
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${assignedStaff.pickup ? 'bg-brand text-white shadow-xl shadow-brand/20' : 'bg-brand/10 text-brand border border-brand/20'}`}>
                                                {assignedStaff.pickup?.profile?.photo ? (
                                                    <img src={assignedStaff.pickup.profile.photo} className="w-full h-full object-cover rounded-2xl" alt="Staff" />
                                                ) : (
                                                    <Truck size={24} strokeWidth={1.5} />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-base font-black text-content tracking-tighter uppercase leading-none">{assignedStaff.pickup?.name || 'UNASSIGNED'}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${assignedStaff.pickup ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                                    <p className="text-[9px] font-black text-brand uppercase tracking-widest">{assignedStaff.pickup ? 'Deployment Active' : 'Hold Standby'}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => openDriverPicker('pickup')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 ${assignedStaff.pickup ? 'bg-brand text-white' : 'bg-surface border border-gray-100/10 text-brand hover:bg-brand hover:text-white'}`}>
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Delivery Driver */}
                                    <div className="space-y-4 pt-4 border-t border-gray-100/5">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.4em] opacity-60">Field Unit: Deployment</p>
                                            {assignedStaff.delivery && <span className="text-[7px] font-black bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Reserved</span>}
                                        </div>
                                        <div className={`flex items-center gap-5 p-5 rounded-[2rem] border transition-all duration-500 ${assignedStaff.delivery ? 'bg-brand/5 border-brand/20 shadow-lg shadow-brand/5' : 'bg-background/40 border-gray-100/5 shadow-inner'}`}>
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${assignedStaff.delivery ? 'bg-brand text-white shadow-xl shadow-brand/20' : 'bg-brand/10 text-brand border border-brand/20'}`}>
                                                {assignedStaff.delivery?.profile?.photo ? (
                                                    <img src={assignedStaff.delivery.profile.photo} className="w-full h-full object-cover rounded-2xl" alt="Staff" />
                                                ) : (
                                                    <Truck size={24} strokeWidth={1.5} />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-base font-black text-content tracking-tighter uppercase leading-none">{assignedStaff.delivery?.name || 'UNASSIGNED'}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${assignedStaff.delivery ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                                    <p className="text-[9px] font-black text-brand uppercase tracking-widest">{assignedStaff.delivery ? 'Ready for Mission' : 'Hold Standby'}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => openDriverPicker('delivery')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 ${assignedStaff.delivery ? 'bg-brand text-white' : 'bg-surface border border-gray-100/10 text-brand hover:bg-brand hover:text-white'}`}>
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Audit */}
                                <div className="bg-surface/60 backdrop-blur-sm p-8 rounded-[3rem] border border-gray-100/10 shadow-soft space-y-6 group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl" />
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] mb-2 relative z-10 px-2">Sector Intelligence</h3>
                                    <div className="h-44 bg-background rounded-[2rem] border border-gray-100/10 relative overflow-hidden group/map shadow-inner">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-brand/20 rounded-full blur-xl animate-pulse" />
                                                <MapPin size={40} className="text-brand relative z-10 group-hover/map:scale-125 transition-transform duration-700" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                    <div className="px-2 space-y-2 relative z-10">
                                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em] leading-none">Primary Sector</p>
                                        <p className="text-sm font-black text-content leading-tight uppercase tracking-tight">{liveBooking.consumer?.profile?.address?.city || 'SECTOR REDACTED'}</p>
                                        <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest opacity-40 leading-relaxed">Cross-referenced with verified customer bio-metrics.</p>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="bg-surface p-8 rounded-[3rem] border border-gray-100/10 shadow-soft space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-brand/5" />
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] px-2">Operational Timeline</h3>
                                    <div className="space-y-10 relative">
                                        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-brand/10" />
                                        {timeline.map((step, i) => (
                                            <div key={i} className="flex gap-6 relative z-10 group/item">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden ${step.status === 'completed' ? 'bg-brand text-white shadow-[0_0_15px_rgba(var(--brand-rgb),0.4)]' :
                                                    step.status === 'active' ? 'bg-surface border-2 border-brand text-brand shadow-lg shadow-brand/20 animate-bounce' :
                                                        'bg-surface border-2 border-gray-100/10 text-content-subtle/20'
                                                    }`}>
                                                    {step.status === 'completed' ? <CheckCircle2 size={12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                                </div>
                                                <div className="space-y-1 transform group-hover/item:translate-x-2 transition-transform">
                                                    <p className={`text-[11px] font-black uppercase tracking-[0.1em] leading-none ${step.status === 'pending' ? 'text-content-subtle opacity-40' : 'text-content'}`}>{step.label}</p>
                                                    <p className="text-[9px] font-black text-brand uppercase tracking-[0.2em] opacity-60 leading-none">{step.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* PIN Verification Modal */}
            <AnimatePresence>
                {showPinModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] bg-content/90 backdrop-blur-2xl flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-surface w-full max-w-sm rounded-[4rem] border border-gray-100/10 p-12 space-y-10 text-center relative overflow-hidden"
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px]" />

                            <div className="space-y-4 relative z-10">
                                <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-2xl">
                                    <ShieldCheck size={48} strokeWidth={1} />
                                </div>
                                <h2 className="text-3xl font-black text-content tracking-tighter uppercase leading-none">Security <span className="text-amber-500">Node</span></h2>
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto opacity-70">Enter the customer-provided tactical PIN to confirm asset acquisition.</p>
                            </div>

                            <div className="relative z-10">
                                <input
                                    type="text"
                                    maxLength="4"
                                    value={enteredPin}
                                    onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="----"
                                    className="w-full h-24 bg-background border border-gray-100/10 rounded-[2rem] text-center text-5xl font-black tracking-[0.5em] outline-none focus:border-amber-500 transition-all text-content shadow-inner"
                                />
                            </div>

                            <div className="flex flex-col gap-4 relative z-10">
                                <button
                                    onClick={handleVerifyPin}
                                    disabled={enteredPin.length !== 4}
                                    className="w-full h-16 bg-amber-500 disabled:opacity-20 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-amber-500/40 transition-all active:scale-95"
                                >
                                    Verify Clearance
                                </button>
                                <button
                                    onClick={() => setShowPinModal(false)}
                                    className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] hover:text-brand transition-all"
                                >
                                    Dismiss Request
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Driver Picker Modal */}
            <AnimatePresence>
                {showDriverPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-content/85 backdrop-blur-xl flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-surface w-full max-w-md rounded-[4rem] border border-gray-100/10 p-10 space-y-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 rounded-full blur-[80px]" />

                            <div className="flex justify-between items-center relative z-10">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-content tracking-tighter uppercase leading-none">Dispatch <span className="text-brand">Hub</span></h2>
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] opacity-60">Deploy Personnel for: {pickerRole}</p>
                                </div>
                                <button onClick={() => setShowDriverPicker(false)} className="w-12 h-12 bg-background border border-gray-100/10 rounded-[1.5rem] flex items-center justify-center text-content-subtle hover:text-red-500 transition-all shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>
                             <div className="space-y-4 relative z-10 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                                 {staffList.length > 0 ? (
                                     staffList.map(driver => (
                                         <button
                                             key={driver._id}
                                             onClick={() => handleAssignStaff(driver._id)}
                                             className="w-full flex items-center justify-between p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100/10 bg-background/50 backdrop-blur-sm hover:border-brand hover:bg-brand/5 transition-all text-left group shadow-inner mb-3"
                                         >
                                             <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                                                 <div className="w-12 h-12 sm:w-14 sm:h-14 bg-surface border border-gray-100/10 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center text-content-subtle group-hover:bg-brand group-hover:text-white group-hover:rotate-6 transition-all shadow-sm">
                                                     {driver.profile?.photo ? (
                                                         <img src={driver.profile.photo} className="w-full h-full object-cover rounded-xl sm:rounded-2xl" alt="" />
                                                     ) : (
                                                         <User className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                                                     )}
                                                 </div>
                                                 <div className="space-y-0.5 sm:space-y-1 min-w-0">
                                                     <p className="text-sm sm:text-lg font-black text-content tracking-tighter uppercase leading-none truncate">{driver.name}</p>
                                                     <div className="flex items-center gap-2">
                                                         <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                         <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-green-500">Available Field Unit</p>
                                                     </div>
                                                 </div>
                                             </div>
                                             <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand/10 border border-brand/20 flex-shrink-0 flex items-center justify-center text-brand opacity-0 group-hover:opacity-100 transition-all">
                                                 <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                             </div>
                                         </button>
                                     ))
                                ) : (
                                    <div className="p-12 text-center bg-background/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-gray-100/10 space-y-6">
                                        <div className="w-16 h-16 bg-gray-100/5 rounded-full flex items-center justify-center mx-auto">
                                            <User size={32} className="text-content-subtle opacity-20" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-black text-content uppercase tracking-tight">Personnel Depleted</p>
                                            <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest opacity-60">No field units available for deployment in the current sector.</p>
                                        </div>
                                        <button onClick={() => navigate('/vendor/fleet')} className="h-12 px-8 bg-brand/10 text-brand border border-brand/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand hover:text-white transition-all">Recruit Units</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </VendorLayout>
    );
};

export default VendorOrderDetail;
