import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Car, User, Clock,
    CheckCircle2, AlertCircle, Phone, MessageSquare,
    Camera, ChevronRight, Package, Truck, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';
import { useAuth } from '../../../context/AuthContext';

const VendorOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { bookings, updateBookingStatus, registeredUsers, assignStaffToBooking, getUser } = useAuth();
    const vendor = getUser('vendor');

    const [showDriverPicker, setShowDriverPicker] = useState(false);
    const [pickerRole, setPickerRole] = useState('pickup'); // 'pickup' or 'delivery'

    const liveBooking = React.useMemo(() => {
        return bookings.find(b => b.id === id) || {
            id: 'MOCK-' + id,
            userName: 'Suresh Raina',
            vehicle: 'BMW X5 · KA-01-MJ-9999',
            serviceName: 'Studio Deep Clean',
            price: '₹2,499',
            address: 'Whitefield, Bengaluru',
            status: 'pending',
            type: 'vendor'
        };
    }, [bookings, id]);

    const [status, setStatus] = useState(liveBooking.status);

    // Get Staff for this vendor
    const staffList = (registeredUsers.staff || []).filter(s => s.vendorId === vendor?.id);
    const assignedPickupStaff = staffList.find(s => s.id === liveBooking.pickupStaffId);
    const assignedDeliveryStaff = staffList.find(s => s.id === liveBooking.deliveryStaffId);

    const handleAcceptRequest = () => {
        updateBookingStatus(liveBooking.id, 'accepted', { vendorId: vendor.id });
    };

    const handleUpdateStatus = () => {
        updateBookingStatus(liveBooking.id, status);
    };

    const handleAssignStaff = (staffId) => {
        assignStaffToBooking(liveBooking.id, staffId, pickerRole, vendor.id);
        setShowDriverPicker(false);
    };

    const openDriverPicker = (role) => {
        setPickerRole(role);
        setShowDriverPicker(true);
    };

    const getProgressWidth = () => {
        const statusMap = {
            'pending': '10%',
            'accepted': '30%',
            'confirmed': '45%',
            'in-progress': '60%',
            'at-studio': '75%',
            'delivery-assigned': '90%',
            'completed': '100%'
        };
        return statusMap[liveBooking.status] || '0%';
    };

    const timeline = [
        { label: 'Booking Request', time: '10:00 AM', status: 'completed' },
        { label: 'Studio Accepted', time: liveBooking.vendorId ? '10:05 AM' : '--', status: liveBooking.vendorId ? 'completed' : 'pending' },
        { label: 'Pickup Assigned', time: liveBooking.pickupStaffId ? '10:15 AM' : '--', status: liveBooking.pickupStaffId ? 'completed' : 'pending' },
        { label: 'Vehicle at Studio', time: '--', status: liveBooking.status === 'at-studio' ? 'active' : 'pending' },
        { label: 'Service Finished', time: '--', status: liveBooking.status === 'delivery-assigned' ? 'active' : 'pending' },
        { label: 'Delivery Complete', time: '--', status: liveBooking.status === 'completed' ? 'completed' : 'pending' },
    ];



    return (
        <VendorLayout
            title={`Order ${liveBooking.id}`}
            subtitle="Job Details & Execution"
        >
            <div className="space-y-6 max-w-5xl mx-auto pb-24">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-content-subtle hover:text-content font-black text-[10px] uppercase tracking-widest transition-all">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <div className="flex gap-2">
                        {liveBooking.status === 'pending' && !liveBooking.vendorId && (
                            <button onClick={handleAcceptRequest} className="h-10 px-6 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-105 transition-all">
                                Accept Request
                            </button>
                        )}
                        <button className="h-10 px-4 border border-gray-100 bg-white rounded-xl text-content-muted font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">
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
                        <div className="bg-content rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-content/20">
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic mb-1">Current Progress</p>
                                    <h2 className="text-3xl font-black italic tracking-tighter uppercase">{liveBooking.status}</h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand transition-all duration-1000" style={{ width: getProgressWidth() }} />
                                        </div>
                                        <span className="text-[10px] font-black text-brand italic">
                                            {liveBooking.status === 'completed' ? 'Delivered successfully' : 'Live tracking active'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        className="h-14 bg-white/10 border border-white/5 rounded-2xl px-6 text-xs font-black uppercase tracking-widest outline-none focus:bg-white/20 transition-all cursor-pointer"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="accepted" className="text-content">Accepted</option>
                                        <option value="at-studio" className="text-content">In Studio</option>
                                        <option value="delivery-assigned" className="text-content">Ready for Delivery</option>
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
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Customer Profile</h3>
                                    <div className="flex gap-1">
                                        <button className="p-2 bg-gray-50 rounded-lg text-brand"><Phone size={14} /></button>
                                        <button className="p-2 bg-gray-50 rounded-lg text-brand"><MessageSquare size={14} /></button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 text-brand italic font-black text-xl">
                                        {liveBooking.userName?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-content tracking-tight">{liveBooking.userName}</h4>
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

                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft space-y-4">
                                <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Vehicle Details</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 text-content-muted font-black italic">
                                        {liveBooking.vehicle?.split('(')[0]?.trim() || 'SUV'}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-content tracking-tight">{liveBooking.vehicle}</h4>
                                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest italic">Verified Vehicle</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Service Breakdown */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-soft">
                            <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic mb-6">Service Package Breakdown</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-brand/5 rounded-xl flex items-center justify-center text-brand">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-content tracking-tight">{liveBooking.serviceName}</p>
                                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest italic">Professional Studio Grade</p>
                                        </div>
                                    </div>
                                    <span className="text-base font-black italic tracking-tighter text-content">{liveBooking.price}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {(liveBooking.addons || ['Deep Vacuum', 'Rim Polish']).map(addon => (
                                        <span key={addon} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-content-muted">
                                            + {addon}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Inspection Photos */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-soft">
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
                                    <div key={i} className="aspect-square rounded-2xl overflow-hidden border-2 border-gray-50 bg-gray-50 group relative">
                                        <img src={img} alt="Inspection" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                ))}
                                <button className="aspect-square rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2 text-content-subtle hover:border-brand hover:text-brand transition-all">
                                    <Camera size={20} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Add</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sidebar Tasks */}
                    <div className="space-y-6">
                        {/* Driver Control */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft space-y-4">
                            <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Staff Management</h3>

                            {/* Pickup Driver */}
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest">Pickup Staff</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-content-muted">
                                        <Truck size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-content">{assignedPickupStaff?.name || 'Unassigned'}</p>
                                        <p className="text-[9px] font-bold text-brand uppercase tracking-widest">Role: Pickup</p>
                                    </div>
                                    <button onClick={() => openDriverPicker('pickup')} className="text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand/20">
                                        {assignedPickupStaff ? 'Change' : 'Assign'}
                                    </button>
                                </div>
                            </div>

                            {/* Delivery Driver */}
                            <div className="space-y-2 pt-2 border-t border-gray-50">
                                <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest">Delivery Staff</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-content-muted">
                                        <Truck size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-content">{assignedDeliveryStaff?.name || 'Unassigned'}</p>
                                        <p className="text-[9px] font-bold text-brand uppercase tracking-widest">Role: Delivery</p>
                                    </div>
                                    <button onClick={() => openDriverPicker('delivery')} className="text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand/20">
                                        {assignedDeliveryStaff ? 'Change' : 'Assign'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Location Mini Map Placeholder */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft space-y-4">
                            <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Location Details</h3>
                            <div className="h-32 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden group">
                                <div className="absolute inset-0 flex items-center justify-center text-content-subtle">
                                    <MapPin size={24} className="group-hover:scale-125 transition-transform" />
                                </div>
                            </div>
                            <p className="text-[11px] font-bold text-content leading-snug">{liveBooking.address}</p>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft space-y-6">
                            <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Job Timeline</h3>
                            <div className="space-y-4 relative">
                                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100" />
                                {timeline.map((step, i) => (
                                    <div key={i} className="flex gap-4 relative z-10">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.status === 'completed' ? 'bg-brand text-white' :
                                            step.status === 'active' ? 'bg-white border-2 border-brand text-brand shadow-lg shadow-brand/20' :
                                                'bg-white border-2 border-gray-100 text-gray-200'
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
            </div>

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
                            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black text-content italic tracking-tight">Assign Driver</h2>
                                <button onClick={() => setShowDriverPicker(false)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-content-muted">✕</button>
                            </div>
                            <div className="space-y-2">
                                {staffList.length > 0 ? (
                                    staffList.map(driver => (
                                        <button
                                            key={driver.id}
                                            onClick={() => handleAssignStaff(driver.id)}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-50 hover:border-brand hover:bg-brand/5 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-content-muted group-hover:bg-brand group-hover:text-white transition-all">
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
                                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                                        <p className="text-sm font-bold text-content-subtle">No staff members found.</p>
                                        <button onClick={() => navigate('/vendor/staff')} className="text-[10px] font-black text-brand uppercase tracking-widest mt-2 border-b border-brand/20">Add Staff</button>
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
