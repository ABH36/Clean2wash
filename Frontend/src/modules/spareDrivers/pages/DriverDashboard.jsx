import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, Clock, MapPin, ChevronRight, AlertCircle } from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';

const DriverDashboard = () => {
    const [isOnline, setIsOnline] = useState(false);
    const [driver, setDriver] = useState(null);

    useEffect(() => {
        spareDriverAPI.getProfile()
            .then(res => setDriver(res.data.driver))
            .catch(() => { });
    }, []);

    const activeJob = {
        customer: 'Rohan Verma',
        pickup: 'Vijay Nagar, Indore',
        time: 'In 25 mins',
        type: 'Point-to-Point',
        reward: '₹240'
    };

    return (
        <DriverLayout title="Dashboard">
            <div className="px-5 py-6 space-y-5">

                {/* ── Online Toggle ── */}
                <div className="border border-gray-100 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-sm font-black text-black uppercase">
                            {isOnline ? 'Online — Accepting Jobs' : 'Offline'}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsOnline(!isOnline)}
                        className={`w-12 h-6 rounded-sm relative transition-colors duration-300 flex items-center px-0.5 ${isOnline ? 'bg-[#F29F05]' : 'bg-gray-200'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-sm shadow transition-transform duration-300 ${isOnline ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Today's Pay", value: '₹1,240', note: '+12%' },
                        { label: 'Rating', value: '4.9', note: '★' },
                        { label: 'Trips', value: '12', note: 'done' },
                    ].map((s, i) => (
                        <div key={i} className="border border-gray-100 rounded-lg p-3">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">{s.label}</p>
                            <p className="text-[17px] font-black text-black leading-none">{s.value}</p>
                            <p className="text-[8px] font-black text-[#F29F05] uppercase mt-1">{s.note}</p>
                        </div>
                    ))}
                </div>

                {/* ── Active Job ── */}
                {isOnline ? (
                    <div className="border border-[#F29F05] rounded-lg p-4 space-y-3 bg-[#FFFBF0]">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-[#F29F05] uppercase tracking-widest">Upcoming Job</span>
                            <span className="text-[9px] font-black text-black/30 uppercase">{activeJob.reward}</span>
                        </div>

                        <div>
                            <p className="text-sm font-black text-black uppercase">{activeJob.type}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-black/40">
                                <Clock size={11} />
                                <span className="text-[10px] font-black uppercase">{activeJob.time}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#F29F05]/20">
                            <MapPin size={12} className="text-black/30 shrink-0" />
                            <span className="text-[10px] font-black text-black/60 uppercase">{activeJob.pickup}</span>
                        </div>

                        <button className="w-full h-10 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-md">
                            Navigate to Pickup
                        </button>
                    </div>
                ) : (
                    <div className="border border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center gap-2">
                        <AlertCircle size={20} className="text-black/15" />
                        <p className="text-[9px] font-black text-black/25 uppercase tracking-widest text-center">
                            Go online to receive jobs
                        </p>
                    </div>
                )}

                {/* ── Quick Links ── */}
                <div>
                    <p className="text-[9px] font-black text-black/25 uppercase tracking-widest mb-3">Driver Hub</p>
                    <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
                        {[
                            { label: 'Document Center', icon: TrendingUp },
                            { label: 'Training Overview', icon: Star },
                            { label: 'Help & Support', icon: AlertCircle },
                        ].map(({ label, icon: Icon }, i) => (
                            <button key={i} className="w-full px-4 py-3.5 flex items-center justify-between active:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Icon size={14} className="text-black/30" />
                                    <span className="text-[11px] font-black text-black uppercase tracking-tight">{label}</span>
                                </div>
                                <ChevronRight size={13} className="text-black/20" />
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </DriverLayout>
    );
};

export default DriverDashboard;
