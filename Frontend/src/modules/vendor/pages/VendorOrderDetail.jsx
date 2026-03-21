import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Car, User, Clock,
    CheckCircle2, AlertCircle, Phone, MessageSquare,
    Camera, ChevronRight, Package, Truck, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';
import { vendorAPI } from '../../../utils/vendorApi';
import { useAuth } from '../../../context/AuthContext';
import { socketService } from '../../../utils/socket';
import { toast } from 'react-hot-toast';
import { Upload, X, ShieldCheck } from 'lucide-react';

const VendorOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getUser } = useAuth();
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
            }
        } catch (error) {
            console.error('Error assigning staff', error);
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
            'ready-for-delivery': '95%',
            'completed': '100%'
        };
        return statusMap[liveBooking.status] || '0%';
    };

    const timeline = liveBooking ? [
        { label: 'Booking Request', time: new Date(liveBooking.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'completed' },
        { label: 'Studio Accepted', time: liveBooking.vendor ? 'OK' : '--', status: liveBooking.vendor ? 'completed' : 'pending' },
        { label: 'Pickup Assigned', time: '--', status: ['pickup-assigned', 'at-studio', 'in_progress', 'quality-check', 'ready-for-delivery', 'completed'].includes(liveBooking.status) ? 'completed' : 'pending' },
        { label: 'Vehicle at Studio', time: '--', status: ['at-studio', 'in_progress', 'quality-check', 'ready-for-delivery', 'completed'].includes(liveBooking.status) ? 'active' : 'pending' },
        { label: 'Detaling & QC', time: '--', status: ['quality-check', 'ready-for-delivery', 'completed'].includes(liveBooking.status) ? 'active' : 'pending' },
        { label: 'Ready for Home', time: '--', status: ['ready-for-delivery', 'completed'].includes(liveBooking.status) ? 'active' : 'pending' },
        { label: 'Handover Complete', time: '--', status: liveBooking.status === 'completed' ? 'completed' : 'pending' },
    ] : [];



    return (
        <VendorLayout
            title={`Order ${id.substring(0, 8)}`}
            subtitle="Job Details & Execution"
        >
            <div className="space-y-6 max-w-5xl mx-auto pb-24">
                {loading || !liveBooking ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Header Actions */}
                        <div className="flex items-center justify-between">
                            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-content-subtle hover:text-content font-black text-[10px] uppercase tracking-widest transition-all">
                                <ArrowLeft size={16} /> Back to Dashboard
                            </button>
                            <div className="flex gap-2">
                                {liveBooking.status === 'pending' && (
                                    !liveBooking.vendor || liveBooking.vendor !== vendor?.id
                                ) && (
                                        <button onClick={handleAcceptRequest} className="h-10 px-6 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-105 transition-all">
                                            Accept Request
                                        </button>
                                    )}
                                {['accepted', 'pickup-assigned'].includes(liveBooking.status) && (
                                    <button onClick={() => setShowPinModal(true)} className="h-10 px-6 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-2">
                                        <ShieldCheck size={14} /> Verify PIN
                                    </button>
                                )}
                                <button className="h-10 px-4 border border-gray-100/10 bg-surface rounded-xl text-content-muted font-black text-[10px] uppercase tracking-widest hover:text-brand transition-all">
                                    Print Invoice
                                </button>
                                <button className="h-10 px-6 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all">
                                    Cancel Job
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Job Info */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Status Card */}
                                <div className="bg-surface rounded-[2.5rem] p-8 text-content relative overflow-hidden shadow-2xl border border-gray-100/10">
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] italic mb-1">Current Progress</p>
                                            <h2 className="text-3xl font-black italic tracking-tighter uppercase">{liveBooking.status}</h2>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="h-1.5 w-32 bg-background rounded-full overflow-hidden">
                                                    <div className="h-full bg-brand transition-all duration-1000" style={{ width: getProgressWidth() }} />
                                                </div>
                                                <span className="text-[10px] font-black text-brand italic">
                                                    {liveBooking.status === 'completed' ? 'Delivered successfully' : 'Live tracking active'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <select
                                                className="h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-xs font-black uppercase tracking-widest outline-none focus:border-brand transition-all cursor-pointer text-content"
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                            >
                                                <option value="accepted" className="text-content">Accepted</option>
                                                <option value="at-studio" className="text-content">In Studio</option>
                                                <option value="in_progress" className="text-content">Washing</option>
                                                <option value="quality-check" className="text-content">Quality Check</option>
                                                <option value="ready-for-delivery" className="text-content">Ready for Home</option>
                                                <option value="completed" className="text-content">Completed</option>
                                            </select>
                                            <button onClick={handleUpdateStatus} className="h-14 bg-brand text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand/30 hover:scale-105 transition-all">
                                                Update
                                            </button>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -mr-32 -mt-32" />
                                </div>

                                {/* Customer & Vehicle Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-surface p-6 rounded-[2rem] border border-gray-100/10 shadow-soft space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Customer Profile</h3>
                                            <div className="flex gap-1">
                                                <button className="p-2 bg-background border border-gray-100/10 rounded-lg text-brand hover:scale-105 transition-all"><Phone size={14} /></button>
                                                <button className="p-2 bg-background border border-gray-100/10 rounded-lg text-brand hover:scale-105 transition-all"><MessageSquare size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center border border-gray-100/10 text-brand italic font-black text-xl">
                                                {liveBooking.consumer?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg text-content tracking-tight">{liveBooking.consumer?.name || 'Guest'}</h4>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-0.5 text-amber-500">
                                                        <Star size={10} fill="currentColor" />
                                                        <span className="text-[10px] font-black">4.8</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">· Live Booking</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-surface p-6 rounded-[2rem] border border-gray-100/10 shadow-soft space-y-4">
                                        <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Vehicle Details</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center border border-gray-100/10 text-content-muted font-black italic">
                                                {liveBooking.vehicle?.brand?.substring(0, 3) || 'SUV'}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg text-content tracking-tight">{liveBooking.vehicle?.brand ? `${liveBooking.vehicle.brand} ${liveBooking.vehicle.model}` : 'Unknown Vehicle'}</h4>
                                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest italic">{liveBooking.vehicle?.plate || 'Verified Vehicle'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Service Breakdown */}
                                <div className="bg-surface p-8 rounded-[2.5rem] border border-gray-100/10 shadow-soft">
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic mb-6">Service Package Breakdown</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-4 border-b border-gray-100/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-brand/5 rounded-xl flex items-center justify-center text-brand">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-content tracking-tight">{liveBooking.service?.name}</p>
                                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest italic">Professional Studio Grade</p>
                                                </div>
                                            </div>
                                            <span className="text-base font-black italic tracking-tighter text-content">{liveBooking.price || liveBooking.service?.defaultPrice}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {(liveBooking.addons && liveBooking.addons.length > 0 ? liveBooking.addons : ['Standard Finish']).map(addon => (
                                                <span key={addon} className="px-3 py-1.5 bg-background border border-gray-100/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-content-muted">
                                                    + {addon}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Inspection Photos */}
                                <div className="bg-surface p-8 rounded-[2.5rem] border border-gray-100/10 shadow-soft">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Pre-Service Inspection</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-brand uppercase tracking-widest">
                                            <Camera size={14} /> {liveBooking.inspectionPhotos?.length || 0} Photos
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                                        {(liveBooking.inspectionPhotos || [
                                            'https://images.unsplash.com/photo-1507136390302-cd99245fe028?w=200&q=80',
                                            'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=200&q=80'
                                        ]).map((img, i) => (
                                            <div key={i} className="aspect-square rounded-2xl overflow-hidden border-2 border-gray-100/10 bg-background group relative">
                                                <img src={img} alt="Inspection" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                        ))}

                                        {/* Dynamic Evidence Photos */}
                                        {(liveBooking.serviceImages?.before || []).map((img, i) => (
                                            <div key={`before-${i}`} className="aspect-square rounded-2xl overflow-hidden border-2 border-brand/20 bg-background group relative shadow-lg shadow-brand/5">
                                                <img src={img} alt="Before Wash" className="w-full h-full object-cover" />
                                                <div className="absolute top-1 right-1 bg-brand text-white text-[6px] px-1 rounded-sm font-black uppercase">Before</div>
                                            </div>
                                        ))}
                                        {(liveBooking.serviceImages?.after || []).map((img, i) => (
                                            <div key={`after-${i}`} className="aspect-square rounded-2xl overflow-hidden border-2 border-green-500/20 bg-background group relative shadow-lg shadow-green-500/5">
                                                <img src={img} alt="After Wash" className="w-full h-full object-cover" />
                                                <div className="absolute top-1 right-1 bg-green-500 text-white text-[6px] px-1 rounded-sm font-black uppercase">After</div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => document.getElementById('photo-upload').click()}
                                            disabled={uploading}
                                            className="aspect-square rounded-2xl border-2 border-dashed border-gray-100/10 bg-background flex flex-col items-center justify-center gap-2 text-content-subtle hover:border-brand hover:text-brand transition-all"
                                        >
                                            {uploading ? <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /> : <Camera size={20} />}
                                            <span className="text-[8px] font-black uppercase tracking-widest">{uploading ? 'Processing' : 'Add Info'}</span>
                                        </button>
                                        <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Sidebar Tasks */}
                            <div className="space-y-6">
                                {/* Driver Control */}
                                <div className="bg-surface p-6 rounded-[2rem] border border-gray-100/10 shadow-soft space-y-4">
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Staff Management</h3>

                                    {/* Pickup Driver */}
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest">Pickup Staff</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-background border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted">
                                                <Truck size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-content">{assignedStaff.pickup?.name || 'Unassigned'}</p>
                                                <p className="text-[9px] font-bold text-brand uppercase tracking-widest">Role: Pickup</p>
                                            </div>
                                            <button onClick={() => openDriverPicker('pickup')} className="text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand/20">
                                                {assignedStaff.pickup ? 'Change' : 'Assign'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Delivery Driver */}
                                    <div className="space-y-2 pt-2 border-t border-gray-100/10">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest">Delivery Staff</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-background border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted">
                                                <Truck size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-content">{assignedStaff.delivery?.name || 'Unassigned'}</p>
                                                <p className="text-[9px] font-bold text-brand uppercase tracking-widest">Role: Delivery</p>
                                            </div>
                                            <button onClick={() => openDriverPicker('delivery')} className="text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand/20">
                                                {assignedStaff.delivery ? 'Change' : 'Assign'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Mini Map Placeholder */}
                                <div className="bg-surface p-6 rounded-[2rem] border border-gray-100/10 shadow-soft space-y-4">
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Location Details</h3>
                                    <div className="h-32 bg-background rounded-2xl border border-gray-100/10 relative overflow-hidden group">
                                        <div className="absolute inset-0 flex items-center justify-center text-content-subtle">
                                            <MapPin size={24} className="group-hover:scale-125 transition-transform" />
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-bold text-content leading-snug">{liveBooking.consumer?.profile?.address?.city || 'Address Not Provided'}</p>
                                </div>

                                {/* Timeline */}
                                <div className="bg-surface p-6 rounded-[2rem] border border-gray-100/10 shadow-soft space-y-6">
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Job Timeline</h3>
                                    <div className="space-y-4 relative">
                                        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100/10" />
                                        {timeline.map((step, i) => (
                                            <div key={i} className="flex gap-4 relative z-10">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.status === 'completed' ? 'bg-brand text-white' :
                                                    step.status === 'active' ? 'bg-surface border-2 border-brand text-brand shadow-lg shadow-brand/20' :
                                                        'bg-surface border-2 border-gray-100/10 text-content-subtle/20'
                                                    }`}>
                                                    {step.status === 'completed' ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                                </div>
                                                <div>
                                                    <p className={`text-[11px] font-black uppercase tracking-tight ${step.status === 'pending' ? 'text-content-subtle' : 'text-content'}`}>{step.label}</p>
                                                    <p className="text-[9px] font-bold text-content-subtle italic">{step.time}</p>
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
                        className="fixed inset-0 z-[110] bg-content/80 backdrop-blur-xl flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-surface w-full max-w-sm rounded-[3rem] border border-gray-100/10 p-10 space-y-8 text-center"
                        >
                            <div className="space-y-2">
                                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck size={32} />
                                </div>
                                <h2 className="text-2xl font-black text-content italic tracking-tight">Handover Security</h2>
                                <p className="text-sm font-bold text-content-subtle leading-relaxed italic">Verify the 4-digit PIN provided by the customer to confirm car collection.</p>
                            </div>

                            <div className="flex justify-center gap-3">
                                <input
                                    type="text"
                                    maxLength="4"
                                    value={enteredPin}
                                    onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="----"
                                    className="w-full h-20 bg-background border-2 border-gray-100/10 rounded-3xl text-center text-4xl font-black tracking-[0.5em] outline-none focus:border-amber-500 transition-all text-content"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleVerifyPin}
                                    disabled={enteredPin.length !== 4}
                                    className="w-full h-14 bg-amber-500 disabled:opacity-30 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all active:scale-95"
                                >
                                    Confirm Handover
                                </button>
                                <button
                                    onClick={() => setShowPinModal(false)}
                                    className="w-full h-14 bg-transparent text-content-subtle rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-content transition-all"
                                >
                                    Cancel
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
                        className="fixed inset-0 z-[100] bg-content/60 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-surface w-full max-w-md rounded-[2.5rem] border border-gray-100/10 p-8 space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black text-content italic tracking-tight">Assign Driver</h2>
                                <button onClick={() => setShowDriverPicker(false)} className="w-10 h-10 bg-background border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted">✕</button>
                            </div>
                            <div className="space-y-2">
                                {staffList.length > 0 ? (
                                    staffList.map(driver => (
                                        <button
                                            key={driver.id}
                                            onClick={() => handleAssignStaff(driver.id)}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100/10 bg-background hover:border-brand hover:bg-brand/5 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-surface border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted group-hover:bg-brand group-hover:text-white transition-all">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-content tracking-tight">{driver.name}</p>
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest text-green-500`}>Available</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-brand" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-8 text-center bg-background rounded-2xl border border-dashed border-gray-100/10">
                                        <p className="text-sm font-bold text-content-subtle">No staff members found.</p>
                                        <button onClick={() => navigate('/vendor/fleet')} className="text-[10px] font-black text-brand uppercase tracking-widest mt-2 border-b border-brand/20">Add Staff</button>
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
