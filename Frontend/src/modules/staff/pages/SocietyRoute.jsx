import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffAPI } from '../../../utils/staffApi';
import {
    ChevronLeft,
    MapPin,
    Car,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    Filter,
    ArrowRight,
    Camera,
    XCircle,
    LayoutList,
    Map as MapIcon
} from 'lucide-react';
import GoogleMapBox from '../../../components/common/GoogleMapBox';

const SocietyRoute = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSociety, setSelectedSociety] = useState('All');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await staffAPI.getTasks();
            // Filter only apartment washes or hub-linked tasks
            const filtered = (response.data?.tasks || []).filter(t =>
                t.service?.key === 'APARTMENT_WASH' || t.hubId
            );
            setTasks(filtered);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleMissedWash = async (id) => {
        const reason = window.prompt("Reason for missed wash (e.g., Car not in parking):");
        if (!reason) return;

        try {
            await staffAPI.reportMissedWash(id, { reason });
            // Refresh tasks
            fetchTasks();
        } catch (err) {
            alert("Failed to report missed wash: " + err.message);
        }
    };

    // Group tasks by society
    const societies = ['All', ...new Set(tasks.map(t => t.location?.address?.society || 'Other'))];

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.vehicle?.plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.location?.address?.society?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSociety = selectedSociety === 'All' || t.location?.address?.society === selectedSociety;
        return matchesSearch && matchesSociety;
    });

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-4" />
                <p className="text-[#D4AF37] font-black tracking-widest text-xs uppercase">Loading Daily Route...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0A] pb-24 text-white">
            {/* --- HEADER --- */}
            <div className="p-6 bg-gradient-to-b from-black/80 to-transparent sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full border border-white/10">
                        <ChevronLeft size={20} className="text-[#D4AF37]" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-black tracking-tight text-[#FAF9F6]">SOCIETY ROUTE</h1>
                        <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-[0.2em]">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                    <div className="w-10" />
                </div>

                {/* --- STATS BAR --- */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-white/50 font-bold uppercase">Total</p>
                        <p className="text-xl font-black text-[#D4AF37]">{tasks.length}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-white/50 font-bold uppercase">Pending</p>
                        <p className="text-xl font-black text-white">{tasks.filter(t => t.status === 'confirmed' || t.status === 'assigned').length}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-white/50 font-bold uppercase">Done</p>
                        <p className="text-xl font-black text-green-400">{tasks.filter(t => t.status === 'completed').length}</p>
                    </div>
                </div>

                {/* --- SEARCH & FILTER --- */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                        <input
                            type="text"
                            placeholder="Search Plate or Society..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:border-[#D4AF37] outline-none transition-all placeholder:text-white/20"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 noscroll">
                        {societies.map(s => (
                            <button
                                key={s}
                                onClick={() => setSelectedSociety(s)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedSociety === s
                                        ? 'bg-[#D4AF37] text-black'
                                        : 'bg-white/5 border border-white/10 text-white/50'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* --- VIEW TOGGLE --- */}
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-white/40'}`}
                        >
                            <LayoutList size={16} /> List
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-white/40'}`}
                        >
                            <MapIcon size={16} /> Discovery
                        </button>
                    </div>
                </div>
            </div>

            {/* --- TASK RENDERING ENGINE --- */}
            <div className="px-6 space-y-4">
                {viewMode === 'map' ? (
                    <div className="h-[60vh] rounded-[2.5rem] overflow-hidden border border-white/10 relative shadow-2xl">
                        <GoogleMapBox 
                            center={tasks[0]?.location?.address?.coordinates || { lat: 28.6139, lng: 77.2090 }}
                            zoom={13}
                            darkMode={true}
                            markers={tasks.filter(t => t.location?.address?.coordinates?.lat).map(task => ({
                                position: task.location.address.coordinates,
                                icon: {
                                    url: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png', // Building icon
                                    scaledSize: new window.google.maps.Size(42, 42),
                                    anchor: new window.google.maps.Point(21, 42)
                                },
                                infoContent: (
                                    <div className="p-1 min-w-[200px] font-outfit">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[9px] font-black text-brand uppercase">#{String(task._id).slice(-4)}</p>
                                            <span className="bg-brand/10 text-brand px-2 py-0.5 rounded text-[8px] font-black uppercase">{task.status}</span>
                                        </div>
                                        <h4 className="font-black text-xs uppercase mb-1 text-black">{task.location?.address?.society || 'Society Unit'}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{task.vehicle?.plate}</p>
                                        <button
                                            onClick={() => navigate(`/staff/task/${task._id}`)}
                                            className="w-full bg-black text-white text-[9px] py-1.5 rounded-lg font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            Inspect Mission <ArrowRight size={14} />
                                        </button>
                                    </div>
                                )
                            }))}
                        />
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="py-20 text-center">
                        <Car size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/50 font-bold">No active society tasks found.</p>
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <div
                            key={task._id}
                            className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden p-5 transition-all active:scale-[0.98]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                        {task.vehicle?.plate || 'NO PLATE'}
                                        {task.status === 'completed' && <CheckCircle2 size={16} className="text-green-400" />}
                                    </h3>
                                    <p className="text-[10px] text-white/50 font-black uppercase tracking-wider">
                                        {task.vehicle?.brand} {task.vehicle?.model}
                                    </p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${task.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                                    }`}>
                                    {task.status}
                                </div>
                            </div>

                            <div className="space-y-3 mb-5">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-[#D4AF37]/10 rounded-xl mt-0.5">
                                        <MapPin size={14} className="text-[#D4AF37]" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-white font-bold leading-tight">
                                            {task.location?.address?.society || 'Unknown Society'}
                                        </p>
                                        <p className="text-[10px] text-white/40 font-medium">
                                            {task.location?.address?.landmark || 'No specific parking details'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-xl">
                                        <Clock size={14} className="text-blue-400" />
                                    </div>
                                    <p className="text-[11px] text-white/60 font-bold">
                                        Slot: {task.schedule?.timeSlot?.start}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {task.status !== 'completed' && (
                                    <>
                                        <button
                                            onClick={() => navigate(`/staff/task/${task._id}`)}
                                            className="flex-1 bg-[#D4AF37] text-black h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest"
                                        >
                                            <ArrowRight size={16} />
                                            Open Task
                                        </button>
                                        <button
                                            onClick={() => handleMissedWash(task._id)}
                                            className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 transition-all active:bg-red-500/20"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    </>
                                )}
                                {task.status === 'completed' && (
                                    <button
                                        onClick={() => navigate(`/staff/task/${task._id}`)}
                                        className="w-full bg-white/5 border border-white/10 h-10 rounded-2xl flex items-center justify-center gap-2 font-bold text-[10px] text-white/50 uppercase tracking-widest"
                                    >
                                        View Summary
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- BOTTOM NAV HINT --- */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 px-6 py-3 rounded-full backdrop-blur-xl flex items-center gap-4">
                <div className="flex flex-col items-center">
                    <p className="text-[8px] text-white/40 font-black uppercase tracking-[0.1em]">Current Mode</p>
                    <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest">SOCIETY CLUSTER</p>
                </div>
            </div>
        </div>
    );
};

export default SocietyRoute;
