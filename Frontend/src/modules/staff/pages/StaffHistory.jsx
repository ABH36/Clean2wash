import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Calendar,
    ChevronRight,
    Package,
    Truck,
    Navigation,
    User,
    LogOut,
    Search
} from 'lucide-react';

const StaffHistory = () => {
    const navigate = useNavigate();

    const HISTORY_JOBS = [
        { id: 'JOB-9921', date: '22 Feb 2026', customer: 'Aryan Pathak', type: 'Pickup', status: 'Completed', vehicle: 'Fortuner' },
        { id: 'JOB-9920', date: '21 Feb 2026', customer: 'Rahul Verma', type: 'Drop', status: 'Completed', vehicle: 'Creta' },
        { id: 'JOB-9919', date: '21 Feb 2026', customer: 'Sneha Gupta', type: 'Pickup', status: 'Completed', vehicle: 'i20' },
        { id: 'JOB-9918', date: '20 Feb 2026', customer: 'Amit Sharma', type: 'Drop', status: 'Completed', vehicle: 'Harrier' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white px-5 pt-12 pb-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
                <button onClick={() => navigate('/staff')} className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <ChevronLeft size={20} className="text-content" />
                </button>
                <h1 className="text-lg font-black text-content italic uppercase">Job History</h1>
                <button className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <Search size={18} className="text-content-subtle" />
                </button>
            </header>

            <div className="px-5 pt-6 space-y-4">
                {HISTORY_JOBS.map((job) => (
                    <motion.div
                        key={job.id}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-soft flex items-center justify-between"
                        onClick={() => navigate(`/staff/task/${job.id}`)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${job.type === 'Pickup' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                }`}>
                                {job.type === 'Pickup' ? <Truck size={22} /> : <Package size={22} />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-black text-content italic uppercase text-sm">{job.id}</h4>
                                    <span className="text-[8px] font-black text-green-500 uppercase bg-green-50 px-2 py-0.5 rounded-full">Success</span>
                                </div>
                                <p className="text-[10px] font-bold text-content-subtle uppercase mt-0.5 tracking-tight">{job.date} · {job.vehicle}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-200" />
                    </motion.div>
                ))}
            </div>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-4 flex justify-between items-center z-50">
                <button onClick={() => navigate('/staff')} className="flex flex-col items-center gap-1 text-content-muted">
                    <Navigation size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Jobs</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-brand">
                    <Calendar size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">History</span>
                </button>
                <button onClick={() => navigate('/staff/profile')} className="flex flex-col items-center gap-1 text-content-muted">
                    <User size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
                </button>
            </nav>
        </div>
    );
};

export default StaffHistory;
