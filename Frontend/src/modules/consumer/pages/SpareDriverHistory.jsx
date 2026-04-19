import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, History, MapPin, Clock, Star } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MobileLayout from '../components/layout/MobileLayout';
import api, { bookingAPI } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../../components/common/Header';

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
                name: 'Spare Driver Chauffeur Settlement',
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
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
                <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-[60] border-b border-gray-100 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center active:scale-95 transition-all">
                            <ChevronLeft size={18} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[17px] font-[1000] text-slate-900 tracking-tighter uppercase leading-none">Trip Logs</h1>
                        </div>
                    </div>
                </header>

                <div className="p-5 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-10 h-10 border-[3px] border-gray-50 border-t-[#FF9900] rounded-full animate-spin shadow-lg" />
                            <p className="mt-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Sinking Archives</p>
                        </div>
                    ) : orderedTrips.length > 0 ? (
                        orderedTrips.map((trip) => {
                            const isSelected = selectedBookingId === trip._id;
                            const issueCount = (trip.issues || []).filter((issue) => ['open', 'investigating'].includes(issue.status)).length;
                            const destination = getTripDestination(trip);
                            const hasPendingSettlement = trip.payment?.status === 'settlement_pending' && Number(trip.payment?.pendingAmount || 0) > 0;

                            return (
                                <motion.div key={trip._id} whileTap={{ scale: 0.98 }}
                                    className={`bg-white border rounded-[28px] p-4 shadow-sm space-y-4 relative overflow-hidden group transition-all ${isSelected ? 'border-[#FF9900]/40 ring-1 ring-[#FF9900]/10 shadow-xl' : 'border-gray-50'}`}>
                                    <div className="absolute top-4 right-4 text-right">
                                        <p className="text-[13px] font-[1000] text-slate-900 leading-none">{formatMoney(trip.pricing?.totalAmount)}</p>
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Settled Assets</p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-[#FF9900]/10 rounded-[14px] flex items-center justify-center text-[#FF9900] border border-[#FF9900]/20 shadow-inner">
                                            <History size={18} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h3 className="text-[11px] font-[1000] text-slate-900 uppercase tracking-tight leading-none mb-1.5">
                                                {trip.service?.name || 'Professional Chauffeur'}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${trip.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                    Trip {trip.status} • {new Date(trip.createdAt).toLocaleDateString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                                                <span className="px-2 py-1 rounded-md bg-slate-50 text-slate-400 text-[7px] font-black tracking-widest uppercase border border-gray-100">
                                                    #{trip.bookingId || trip._id?.slice(-6)}
                                                </span>
                                                {trip.payment?.status && (
                                                    <span className={`px-2 py-1 rounded-md text-[7px] font-black tracking-widest uppercase border ${trip.payment.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-gray-100'}`}>
                                                        {trip.payment.status}
                                                    </span>
                                                )}
                                                {trip.payment?.status === 'settlement_pending' && Number(trip.payment?.pendingAmount || 0) > 0 && (
                                                    <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[7px] font-black tracking-widest uppercase">
                                                        Debt {formatMoney(trip.payment.pendingAmount)}
                                                    </span>
                                                )}
                                                {trip.feedback?.rating && (
                                                    <span className="px-2 py-1 rounded-md bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/20 text-[7px] font-black tracking-widest uppercase">
                                                        Rated {trip.feedback.rating}★
                                                    </span>
                                                )}
                                                {issueCount > 0 && (
                                                    <span className="px-2 py-1 rounded-md bg-rose-50 text-rose-600 border border-rose-100 text-[7px] font-black tracking-widest uppercase">
                                                        {issueCount} Alert{issueCount > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center border border-gray-50 shadow-inner">
                                                <Clock size={12} className="text-slate-400" />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight leading-none">
                                                {new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight leading-none">
                                                Pilot: {trip.provider?.id?.name || 'Assigned'}
                                            </span>
                                            <Star size={10} fill="#FF9900" className="text-[#FF9900]" />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 border-t border-slate-50 pt-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-3 h-3 rounded-full bg-[#FF9900]/10 border border-[#FF9900]/20 flex items-center justify-center mt-0.5 shrink-0">
                                                <div className="w-1 h-1 rounded-full bg-[#FF9900]" />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight leading-tight">
                                                {getTripAddress(trip)}
                                            </span>
                                        </div>
                                        {destination && (
                                            <div className="flex items-start gap-3">
                                                <div className="w-3 h-3 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mt-0.5 shrink-0">
                                                    <div className="w-1 h-1 rounded-full bg-rose-500" />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-tight leading-tight">
                                                    {destination}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        {hasPendingSettlement ? (
                                            <>
                                                <button onClick={() => handleSettlement(trip, 'wallet')} disabled={settlingTripId === trip._id}
                                                    className="h-11 rounded-[16px] bg-[#FF9900] text-slate-900 text-[10px] font-black uppercase tracking-[0.15em] active:scale-95 transition-all shadow-lg shadow-[#FF9900]/20 disabled:opacity-50">
                                                    {settlingTripId === trip._id ? 'Processing' : 'Vault Payout'}
                                                </button>
                                                <button onClick={() => handleSettlement(trip, 'online')} disabled={settlingTripId === trip._id}
                                                    className="h-11 rounded-[16px] bg-slate-900 text-[#FF9900] text-[10px] font-black uppercase tracking-[0.15em] active:scale-95 transition-all shadow-lg disabled:opacity-50">
                                                    {settlingTripId === trip._id ? 'Opening' : 'Gateway Settle'}
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => navigate(`/rate?id=${trip._id}`)} disabled={trip.status !== 'completed'}
                                                    className={`h-11 rounded-[16px] text-[10px] font-black uppercase tracking-[0.15em] active:scale-95 transition-all shadow-lg ${trip.feedback?.rating ? 'bg-slate-100 text-slate-400 border border-gray-100 shadow-none' : 'bg-slate-900 text-[#FF9900]'}`}>
                                                    {trip.feedback?.rating ? 'Audit Submitted' : 'Submit Audit'}
                                                </button>
                                                <button onClick={() => navigate(`/spare-driver/support?bookingId=${trip._id}`)}
                                                    className="h-11 rounded-[16px] border border-gray-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] shadow-sm active:scale-95 transition-all">
                                                    Incident Help
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
                            <p className="text-sm font-black uppercase tracking-widest">No trips found</p>
                        </div>
                    )}

                    <div className="pt-8 flex flex-col items-center">
                        <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">End of history</p>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default SpareDriverHistory;
