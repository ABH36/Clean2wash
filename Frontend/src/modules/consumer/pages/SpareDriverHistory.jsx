import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, History, MapPin, Clock, Star } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MobileLayout from '../components/layout/MobileLayout';
import api, { bookingAPI } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';

const formatMoney = (amount) => `Rs ${Number(amount || 0).toLocaleString('en-IN')}`;

const getTripAddress = (trip) => (
    trip.location?.address?.street
    || trip.location?.address?.formattedAddress
    || trip.location?.pickupAddress
    || 'Pickup unavailable'
);

const getTripDestination = (trip) => (
    trip.location?.destination?.street
    || trip.location?.destination?.address?.street
    || trip.location?.destination?.formattedAddress
    || ''
);

const SpareDriverHistory = () => {
    const navigate = useNavigate();
    const { getRazorpayKey, createPaymentOrder, refreshStats } = useAuth();
    const [searchParams] = useSearchParams();
    const [historicalTrips, setHistoricalTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settlingTripId, setSettlingTripId] = useState(null);
    const selectedBookingId = searchParams.get('bookingId');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.request('/bookings/history?category=Chauffeur');
                if (res.data?.bookings) {
                    setHistoricalTrips(res.data.bookings);
                }
            } catch (err) {
                console.error('Failed to fetch Chauffeur history', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const orderedTrips = [...historicalTrips].sort((a, b) => {
        if (selectedBookingId && a._id === selectedBookingId) return -1;
        if (selectedBookingId && b._id === selectedBookingId) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const handleSettlement = async (trip, paymentMethod = 'wallet') => {
        const pendingAmount = Number(trip?.payment?.pendingAmount || 0);
        if (!trip?._id || pendingAmount <= 0) return;

        setSettlingTripId(trip._id);
        try {
            if (paymentMethod === 'wallet') {
                const res = await bookingAPI.settleBookingPayment(trip._id, { paymentMethod: 'wallet' });
                if (res?.status === 'success') {
                    setHistoricalTrips((current) => current.map((entry) => entry._id === trip._id ? res.data.booking : entry));
                    toast.success('Outstanding balance paid from wallet');
                    refreshStats();
                }
                return;
            }

            const razorKeyRes = await getRazorpayKey();
            if (!razorKeyRes.success) throw new Error('Could not fetch payment configuration');

            const orderRes = await createPaymentOrder(pendingAmount, 'INR', `sd_hist_${trip._id}`);
            if (!orderRes.success) throw new Error('Settlement order creation failed');

            const rzp = new window.Razorpay({
                key: razorKeyRes.data.key_id,
                amount: orderRes.data.amount,
                currency: 'INR',
                name: 'Clean2Wash Chauffeur Settlement',
                description: `Pending payment for ${trip.service?.name || 'chauffeur trip'}`,
                order_id: orderRes.data.order_id,
                handler: async (response) => {
                    try {
                        const res = await bookingAPI.settleBookingPayment(trip._id, {
                            paymentMethod: 'online',
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        if (res?.status === 'success') {
                            setHistoricalTrips((current) => current.map((entry) => entry._id === trip._id ? res.data.booking : entry));
                            toast.success('Pending balance settled successfully');
                            refreshStats();
                        }
                    } catch (error) {
                        toast.error(error.message || 'Could not settle the pending balance');
                    } finally {
                        setSettlingTripId(null);
                    }
                },
                theme: { color: '#F29F05' },
                modal: { ondismiss: () => setSettlingTripId(null) }
            });

            rzp.open();
        } catch (error) {
            toast.error(error.message || 'Could not start settlement');
            setSettlingTripId(null);
        } finally {
            if (paymentMethod === 'wallet') {
                setSettlingTripId(null);
            }
        }
    };

    return (
        <MobileLayout>
            <div className="min-h-screen bg-white flex flex-col">
                <header className="px-5 pt-12 pb-4 flex items-center gap-4 border-b border-gray-100">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black">
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl font-black text-black tracking-tight uppercase leading-none">Chauffeur History</h1>
                </header>

                <div className="p-5 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : orderedTrips.length > 0 ? (
                        orderedTrips.map((trip) => {
                            const isSelected = selectedBookingId === trip._id;
                            const issueCount = (trip.issues || []).filter((issue) => ['open', 'investigating'].includes(issue.status)).length;
                            const destination = getTripDestination(trip);
                            const hasPendingSettlement = trip.payment?.status === 'settlement_pending' && Number(trip.payment?.pendingAmount || 0) > 0;

                            return (
                                <motion.div
                                    key={trip._id}
                                    whileTap={{ scale: 0.98 }}
                                    className={`bg-white border rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4 relative overflow-hidden group ${isSelected ? 'border-brand/40 ring-1 ring-brand/20' : 'border-gray-100'}`}
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                        <p className="text-[14px] font-black text-black leading-none">{formatMoney(trip.pricing?.totalAmount)}</p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center text-brand border border-brand/20 text-xs font-black">
                                            <History size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-[13px] font-black text-black uppercase tracking-tight leading-none mb-1">
                                                {trip.service?.name || 'Chauffeur Service'}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${trip.status === 'completed' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">
                                                    {trip.status} - {new Date(trip.createdAt).toLocaleDateString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap mt-2">
                                                <span className="px-2 py-1 rounded-md bg-gray-100 text-black/60 text-[8px] font-black uppercase tracking-widest">
                                                    #{trip.bookingId || trip._id?.slice(-6)}
                                                </span>
                                                {trip.payment?.status && (
                                                    <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest">
                                                        Payment {trip.payment.status}
                                                    </span>
                                                )}
                                                {trip.payment?.status === 'settlement_pending' && Number(trip.payment?.pendingAmount || 0) > 0 && (
                                                    <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[8px] font-black uppercase tracking-widest">
                                                        Due {formatMoney(trip.payment.pendingAmount)}
                                                    </span>
                                                )}
                                                {trip.feedback?.rating && (
                                                    <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest">
                                                        Rated {trip.feedback.rating}/5
                                                    </span>
                                                )}
                                                {issueCount > 0 && (
                                                    <span className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-[8px] font-black uppercase tracking-widest">
                                                        {issueCount} issue{issueCount > 1 ? 's' : ''} open
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/[0.03]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center">
                                                <Clock size={12} className="text-black/40" />
                                            </div>
                                            <span className="text-[10px] font-black text-black/60 uppercase">
                                                {new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end">
                                            <span className="text-[10px] font-black text-black/60 uppercase">
                                                Driver: {trip.provider?.id?.name || 'Assigned'}
                                            </span>
                                            <Star size={10} fill="#F29F05" className="text-brand" />
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t border-black/[0.03] pt-3">
                                        <div className="flex items-start gap-2">
                                            <MapPin size={12} className="text-brand mt-0.5 shrink-0" />
                                            <span className="text-[10px] font-black text-black/55 uppercase">
                                                {getTripAddress(trip)}
                                            </span>
                                        </div>
                                        {destination && (
                                            <div className="flex items-start gap-2">
                                                <MapPin size={12} className="text-red-500 mt-0.5 shrink-0" />
                                                <span className="text-[10px] font-black text-black/45 uppercase">
                                                    {destination}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        {hasPendingSettlement ? (
                                            <>
                                                <button
                                                    onClick={() => handleSettlement(trip, 'wallet')}
                                                    disabled={settlingTripId === trip._id}
                                                    className="h-11 rounded-xl bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                                >
                                                    {settlingTripId === trip._id ? 'Processing' : 'Pay Wallet'}
                                                </button>
                                                <button
                                                    onClick={() => handleSettlement(trip, 'online')}
                                                    disabled={settlingTripId === trip._id}
                                                    className="h-11 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                                >
                                                    {settlingTripId === trip._id ? 'Opening' : 'Pay Balance'}
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => navigate(`/rate?id=${trip._id}`)}
                                                    disabled={trip.status !== 'completed'}
                                                    className="h-11 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                                                >
                                                    {trip.feedback?.rating ? 'Update Rating' : 'Rate Trip'}
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/spare-driver/support?bookingId=${trip._id}`)}
                                                    className="h-11 rounded-xl border border-gray-100 text-black/50 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Support
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center py-20 gap-3 opacity-20">
                            <History size={48} />
                            <p className="text-sm font-black uppercase tracking-widest">No Trips Found</p>
                        </div>
                    )}

                    <div className="pt-8 flex flex-col items-center">
                        <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">End of History</p>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default SpareDriverHistory;
