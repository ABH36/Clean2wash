import React, { useState, useEffect } from 'react';
import { History, MapPin, Clock, Star, ChevronLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';

const DriverHistory = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await spareDriverAPI.getTripHistory();
                if (res.status === 'success') {
                    setTrips(res.data.bookings || []);
                }
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) {
        return (
            <DriverLayout title="Trip History">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-8 h-8 border-2 border-[#F29F05] border-t-transparent rounded-full animate-spin" />
                </div>
            </DriverLayout>
        );
    }

    return (
        <DriverLayout title="Trip History">
            <div className="px-5 py-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-black/40">
                        <ChevronLeft size={20} />
                    </button>
                    <p className="text-[10px] font-black text-black/25 uppercase tracking-widest">Past Missions ({trips.length})</p>
                </div>

                {trips.length > 0 ? (
                    trips.map((trip) => (
                        <div key={trip._id} className="border border-gray-100 rounded-lg p-4 space-y-3 bg-white">
                            <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${trip.status === 'completed' ? 'text-green-600' : 'text-red-500'}`}>
                                    {trip.status}
                                </span>
                                <span className="text-[9px] font-black text-black/30 uppercase tracking-tight">₹{trip.pricing?.totalAmount || 0}</span>
                            </div>

                            <div>
                                <h3 className="text-sm font-black text-black uppercase leading-tight">{trip.service?.name || 'Chauffeur Service'}</h3>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-1 text-black/40">
                                        <Calendar size={11} />
                                        <span className="text-[10px] font-black uppercase">{new Date(trip.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-black/40">
                                        <Clock size={11} />
                                        <span className="text-[10px] font-black uppercase">{new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 pt-2 border-t border-black/5">
                                <MapPin size={12} className="text-black/30 mt-0.5 shrink-0" />
                                <span className="text-[10px] font-black text-black/60 uppercase line-clamp-2">{trip.location?.address?.street}, {trip.location?.address?.city}</span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-black/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center font-black text-[10px] text-black">
                                        {(trip.consumer?.name || 'C')[0]}
                                    </div>
                                    <span className="text-[10px] font-black text-black uppercase">{trip.consumer?.name || 'Customer'}</span>
                                </div>
                                {trip.status === 'completed' && (
                                    <div className="flex items-center gap-0.5">
                                        <Star size={10} fill="#F29F05" className="text-[#F29F05]" />
                                        <span className="text-[10px] font-black text-black">5.0</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="border border-dashed border-gray-200 rounded-lg p-10 flex flex-col items-center gap-2">
                        <History size={24} className="text-black/10" />
                        <p className="text-[9px] font-black text-black/25 uppercase tracking-widest text-center">No past missions found</p>
                    </div>
                )}
            </div>
        </DriverLayout>
    );
};

export default DriverHistory;
