import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    MapPin,
    Car,
    Clock,
    CheckCircle2,
    Search,
    LayoutList,
    Map as MapIcon,
    ArrowRight,
    Building2
} from 'lucide-react';

import CaptainLayout from '../components/CaptainLayout';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import { useCaptain } from '../../../hooks/useCaptain';
import { useTheme } from '../../../context/ThemeContext';

const CaptainApartmentRoute = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { captainJobs, captainJobsLoading, loadCaptainDashboard } = useCaptain();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list');

    useEffect(() => {
        loadCaptainDashboard?.();
    }, [loadCaptainDashboard]);

    const apartmentJobs = useMemo(() => (
        captainJobs
            .filter((job) => job.isApartment)
            .sort((a, b) => {
                const aDate = new Date(a.schedule?.date || a.timestamp || 0).getTime();
                const bDate = new Date(b.schedule?.date || b.timestamp || 0).getTime();
                return aDate - bDate;
            })
    ), [captainJobs]);

    const filteredJobs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return apartmentJobs;

        return apartmentJobs.filter((job) => [
            job.vehicle,
            job.address,
            job.hubName,
            job.apartmentRoute,
            job.parkingDetails?.slotNumber,
            job.parkingDetails?.pillar,
            job.parkingDetails?.block,
            job.parkingDetails?.basement
        ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
    }, [apartmentJobs, searchQuery]);

    const apartmentMarkers = filteredJobs
        .filter((job) => job.location?.address?.coordinates?.lat)
        .map((job) => ({
            id: job.id,
            position: {
                lat: job.location.address.coordinates.lat,
                lng: job.location.address.coordinates.lng
            },
            title: `${job.hubName || 'Apartment'} · ${job.vehicle || 'Vehicle'}`
        }));

    const stats = {
        total: apartmentJobs.length,
        active: apartmentJobs.filter((job) => ['confirmed', 'accepted', 'en_route', 'arrived', 'before_photo', 'washing', 'after_photo', 'in_progress', 'active'].includes(job.status)).length,
        completed: apartmentJobs.filter((job) => job.status === 'completed').length
    };

    return (
        <CaptainLayout hideNav>
            <div className="min-h-screen px-4 pt-10 pb-24">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/captain')}
                        className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/5 border-white/5 text-content '}`}
                    >
                        <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>
                    <div className="text-center">
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Captain Route Desk</p>
                        <h1 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>Apartment Wash Route</h1>
                    </div>
                    <div className="w-10" />
                </div>

                <div className={`rounded-[2rem] border p-4 mb-4 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/30' : 'bg-white/5 border-white/5 shadow-soft'}`}>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                            { label: 'Total', value: stats.total, tone: isDarkMode ? 'text-white' : 'text-content' },
                            { label: 'Live', value: stats.active, tone: 'text-brand' },
                            { label: 'Done', value: stats.completed, tone: 'text-green-500' }
                        ].map((item) => (
                            <div key={item.label} className={`${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/[0.02] border-white/5'} border rounded-2xl p-3`}>
                                <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>{item.label}</p>
                                <p className={`text-xl font-black mt-1 ${item.tone}`}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="relative mb-4">
                        <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`} />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search apartment, route, slot or vehicle"
                            className={`w-full rounded-2xl border py-3.5 pl-12 pr-4 text-sm font-bold outline-none transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-white/[0.02] border-white/5 text-content placeholder:text-content-subtle'}`}
                        />
                    </div>

                    <div className={`flex rounded-2xl p-1 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5'}`}>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-brand text-white shadow-lg shadow-brand/20' : isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}
                        >
                            <LayoutList size={15} /> List
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-brand text-white shadow-lg shadow-brand/20' : isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}
                        >
                            <MapIcon size={15} /> Map
                        </button>
                    </div>
                </div>

                {captainJobsLoading ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-white/5 border-brand border-t-transparent rounded-full animate-spin" />
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Loading route...</p>
                    </div>
                ) : viewMode === 'map' ? (
                    <div className={`rounded-[2rem] overflow-hidden border h-[58vh] ${isDarkMode ? 'border-white/5 shadow-2xl shadow-black/30' : 'border-white/5 shadow-soft'}`}>
                        <GoogleMapBox
                            center={apartmentMarkers[0]?.position || { lat: 28.6139, lng: 77.2090 }}
                            zoom={14}
                            markers={apartmentMarkers}
                        />
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className={`rounded-[2rem] border p-10 text-center ${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white/5 border-white/5 shadow-soft'}`}>
                        <Building2 size={42} className="mx-auto text-brand mb-4" />
                        <p className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-content'}`}>No apartment route jobs</p>
                        <p className={`text-[11px] font-bold mt-2 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>As soon as apartment wash missions are assigned, they will appear here in parking order.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredJobs.map((job) => (
                            <button
                                key={job.id}
                                onClick={() => navigate(`/captain/job?id=${job.id}`)}
                                className={`w-full text-left rounded-[2rem] border p-4 transition-all active:scale-[0.99] ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/20' : 'bg-white/5 border-white/5 shadow-soft'}`}
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-1 rounded-lg bg-brand/10 border border-brand/10 text-brand text-[8px] font-black uppercase tracking-widest">Apartment Wash</span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${job.status === 'completed' ? 'text-green-500' : 'text-brand'}`}>{job.status.replace('_', ' ')}</span>
                                        </div>
                                        <h3 className={`text-sm font-black uppercase tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-content'}`}>{job.vehicle || job.serviceName}</h3>
                                        <p className={`text-[10px] font-bold mt-1 ${isDarkMode ? 'text-white/35' : 'text-content-subtle'}`}>{job.hubName || 'Apartment Hub'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-brand text-[9px] font-black uppercase tracking-widest">{job.schedule?.timeSlot?.start || 'Instant'}</p>
                                        <p className={`text-[10px] font-black mt-1 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{job.price}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-white/5' : 'bg-white/[0.02]'}`}>
                                        <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Route</p>
                                        <p className={`text-[11px] font-black uppercase mt-1 ${isDarkMode ? 'text-white' : 'text-content'}`}>{job.apartmentRoute || 'Parking details pending'}</p>
                                    </div>
                                    <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-white/5' : 'bg-white/[0.02]'}`}>
                                        <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Slot</p>
                                        <p className={`text-[11px] font-black uppercase mt-1 ${isDarkMode ? 'text-white' : 'text-content'}`}>{job.parkingDetails?.slotNumber || job.parkingDetails?.pillar || 'Not tagged'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                                        <MapPin size={16} className="text-brand" fill="currentColor" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[11px] font-bold leading-tight ${isDarkMode ? 'text-white/80' : 'text-content'}`}>{job.address}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/25' : 'text-content-subtle'}`}>
                                                <Clock size={11} /> {job.schedule?.timeSlot?.start || 'Instant'}
                                            </span>
                                            {job.status === 'completed' && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-500">
                                                    <CheckCircle2 size={11} /> Completed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
                                        <ArrowRight size={16} strokeWidth={2.5} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </CaptainLayout>
    );
};

export default CaptainApartmentRoute;
