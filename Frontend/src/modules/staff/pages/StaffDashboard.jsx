import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    MapPin,
    Navigation,
    CheckCircle2,
    Calendar,
    ChevronRight,
    Search,
    User,
    Package,
    ShieldCheck,
    Truck,
    LogOut
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import StaffNewJobOverlay from '../components/StaffNewJobOverlay';
import { useAuth } from '../../../context/AuthContext';

const StaffDashboard = () => {
    const navigate = useNavigate();
    const { bookings, updateBookingStatus, getUser } = useAuth();
    const user = getUser('staff') || { name: 'Staff Member', id: 'STF-DEFAULT' };
    const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'ongoing' | 'completed'
    const [showNewJob, setShowNewJob] = useState(false);

    // Filter vendor bookings for the dashboard (where this staff is assigned)
    const staffBookings = bookings.filter(b =>
        b.type === 'vendor' &&
        (b.pickupStaffId === user.id || b.deliveryStaffId === user.id)
    );

    // Map local structure to context bookings
    const mappedTasks = staffBookings.map(b => {
        const isPickup = b.pickupStaffId === user.id;
        const isDelivery = b.deliveryStaffId === user.id;

        return {
            id: b.id,
            type: isPickup ? 'Pickup' : 'Delivery',
            customer: b.userName,
            address: b.address,
            time: b.slot || 'ASAP',
            vehicle: b.vehicle,
            status: (b.status === 'confirmed' || b.status === 'delivery-assigned') ? 'assigned' :
                (['in-progress', 'at-studio'].includes(b.status)) ? 'ongoing' : 'completed',
            urgent: false
        };
    });

    const filteredTasks = mappedTasks.filter(t => t.status === activeTab);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white px-5 pt-12 pb-6 sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-1">Staff Panel</p>
                        <h1 className="text-2xl font-black text-content italic leading-none">Job Dashboard</h1>
                    </div>
                    <button className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                        <User size={20} className="text-content" />
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="flex gap-3 mb-6">
                    <div className="flex-1 bg-brand/5 rounded-2xl p-3 border border-brand/10">
                        <p className="text-[8px] font-black text-brand uppercase tracking-widest mb-1">On-Time Rate</p>
                        <p className="text-xl font-black text-brand italic">98%</p>
                    </div>
                    <div className="flex-1 bg-content/5 rounded-2xl p-3 border border-content/10">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Jobs Done</p>
                        <p className="text-xl font-black text-content italic">12</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100/80 p-1 rounded-2xl border border-gray-200/20">
                    {['assigned', 'ongoing', 'completed'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab
                                ? 'bg-white text-brand shadow-sm'
                                : 'text-content-subtle'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {/* Task List */}
            <div className="px-5 pt-6 space-y-4">
                <AnimatePresence mode="wait">
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft relative overflow-hidden group"
                                onClick={() => navigate(`/staff/task/${task.id}`)}
                            >
                                {task.urgent && (
                                    <div className="absolute top-0 right-0 bg-accent-red text-white text-[7px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                                        Urgent
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${task.type === 'Pickup' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                            {task.type === 'Pickup' ? <Truck size={24} /> : <Package size={24} />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">{task.id}</p>
                                            <h3 className="text-lg font-black text-content italic uppercase">{task.type} Job</h3>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-brand uppercase">{task.time}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-5">
                                    <div className="flex items-start gap-3">
                                        <MapPin size={16} className="text-content-subtle shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-content-muted uppercase tracking-tight">{task.customer}</p>
                                            <p className="text-xs font-black text-content leading-tight mt-0.5">{task.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck size={16} className="text-brand shrink-0" />
                                        <p className="text-xs font-black text-content italic uppercase tracking-tighter">{task.vehicle}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button className="flex-1 bg-content text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-content/20 flex items-center justify-center gap-2">
                                        View Details <ChevronRight size={14} strokeWidth={3} />
                                    </button>
                                    {activeTab === 'assigned' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAccept(task.id); }}
                                            className="bg-brand text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20"
                                        >
                                            Accept
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 opacity-30">
                            <Truck size={48} className="mx-auto mb-4" />
                            <p className="font-black text-sm uppercase tracking-widest">No jobs found</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-4 flex justify-between items-center z-50">
                <button className="flex flex-col items-center gap-1 text-brand">
                    <Navigation size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Jobs</span>
                </button>
                <button onClick={() => navigate('/staff/history')} className="flex flex-col items-center gap-1 text-content-muted">
                    <Calendar size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">History</span>
                </button>
                <button onClick={() => navigate('/staff/profile')} className="flex flex-col items-center gap-1 text-content-muted">
                    <User size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
                </button>
                <button onClick={() => navigate('/staff/login')} className="flex flex-col items-center gap-1 text-content-muted">
                    <LogOut size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Exit</span>
                </button>
            </nav>

            <StaffNewJobOverlay
                isVisible={showNewJob}
                onAccept={() => handleAccept(incomingJob?.id)}
                onReject={() => setShowNewJob(false)}
            />
        </div>
    );
};

export default StaffDashboard;
