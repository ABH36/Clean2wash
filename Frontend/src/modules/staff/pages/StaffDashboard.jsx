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
import StaffLayout from '../components/StaffLayout';
import { useAuth } from '../../../context/AuthContext';

const StaffDashboard = () => {
    const navigate = useNavigate();
    const { bookings, updateBookingStatus, getUser } = useAuth();
    const user = getUser('staff') || { name: 'Staff Member', id: 'STF-DEFAULT' };
    const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'ongoing' | 'completed'

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
                (['in-progress', 'at-studio'].includes(b.status)) ? 'ongoing' :
                    (b.status === 'completed') ? 'completed' : 'other',
            urgent: false
        };
    });

    const filteredTasks = mappedTasks.filter(t => t.status === activeTab);

    const handleAccept = (taskId) => {
        // In a real app, this would update the status to 'in-progress' or similar
        updateBookingStatus(taskId, 'in-progress');
    };

    return (
        <StaffLayout
            title="Active Jobs"
            subtitle="Enterprise Node-02"
        >
            <div className="space-y-6">
                {/* Visual Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">Efficiency</p>
                            <h4 className="text-2xl font-black text-content italic">98.4%</h4>
                            <div className="w-12 h-1 bg-brand/20 rounded-full mt-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '98%' }}
                                    className="h-full bg-brand"
                                />
                            </div>
                        </div>
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-brand/5 rounded-full blur-xl group-hover:bg-brand/10 transition-colors" />
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">Today's Earnings</p>
                            <h4 className="text-2xl font-black text-brand italic">₹1,240</h4>
                            <p className="text-[7px] font-black text-green-500 uppercase mt-1">+12% from avg</p>
                        </div>
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-green-500/5 rounded-full blur-xl group-hover:bg-green-500/10 transition-colors" />
                    </div>
                </div>

                {/* Glass Tabs */}
                <div className="flex bg-gray-100/50 p-1.5 rounded-[2rem] border border-gray-200/30 backdrop-blur-md">
                    {['assigned', 'ongoing', 'completed'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-500 ${activeTab === tab
                                ? 'bg-content text-white shadow-xl shadow-content/20 scale-[1.02]'
                                : 'text-content-subtle hover:text-content'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Task Engine */}
                <div className="space-y-4 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {filteredTasks.length > 0 ? (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                {filteredTasks.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        whileTap={{ scale: 0.98 }}
                                        className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-soft relative overflow-hidden group hover:border-brand/40 transition-all duration-500"
                                        onClick={() => navigate(`/staff/task/${task.id}`)}
                                    >
                                        <div className="flex justify-between items-start mb-5">
                                            <div className="flex gap-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${task.type === 'Pickup' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                                    }`}>
                                                    {task.type === 'Pickup' ? <Truck size={28} /> : <Package size={28} />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-0.5 italic">{task.id}</p>
                                                    <h3 className="text-xl font-black text-content italic uppercase tracking-tighter">{task.type} Request</h3>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 px-3 py-1.5 rounded-xl">
                                                <p className="text-[9px] font-black text-content uppercase tracking-widest">{task.time}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                                    <MapPin size={14} className="text-content-subtle" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest leading-none mb-1.5">{task.customer}</p>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <p className="text-sm font-black text-content leading-tight italic">{task.address}</p>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`, '_blank'); }}
                                                            className="px-3 py-2 bg-brand/10 text-brand rounded-lg text-[8px] font-black uppercase tracking-widest whitespace-nowrap"
                                                        >
                                                            Quick Route
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl">
                                                <ShieldCheck size={18} className="text-brand shrink-0" />
                                                <p className="text-xs font-black text-content uppercase tracking-widest italic">{task.vehicle}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button className="flex-1 h-14 bg-content text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-content/20 flex items-center justify-center gap-2 hover:bg-brand transition-all">
                                                Protocol Details <ChevronRight size={16} strokeWidth={3} />
                                            </button>
                                            {activeTab === 'assigned' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAccept(task.id); }}
                                                    className="h-14 bg-brand text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand/30 hover:scale-105 transition-all"
                                                >
                                                    Accept
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-dashed border-gray-200">
                                    <Truck size={40} className="text-gray-200" />
                                </div>
                                <h3 className="font-black text-content italic uppercase tracking-widest mb-2">No Active Logs</h3>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest px-10">We'll notify you when a new assignment is pushed to your terminal.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </StaffLayout>
    );
};

export default StaffDashboard;
