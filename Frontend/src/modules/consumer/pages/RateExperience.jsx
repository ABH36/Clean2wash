import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, ThumbsUp, Camera, Award, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingAPI } from '../../../utils/api';

const TAGS = ['On Time', 'Friendly', 'Professional', 'Careful', 'Safe Driving', 'Smooth Experience'];

const isChauffeurBooking = (booking = {}) => (
    booking.service?.category === 'Chauffeur'
    || booking.service?.type === 'sparedriver'
    || String(booking.service?.name || '').toLowerCase().includes('driver')
    || String(booking.serviceName || '').toLowerCase().includes('driver')
    || booking.type === 'sparedriver'
);

const formatMoney = (booking = {}) => {
    const amount = booking.pricing?.totalAmount || booking.price || 0;
    if (typeof amount === 'string') return amount;
    return `Rs ${Number(amount || 0).toLocaleString('en-IN')}`;
};

const RateExperience = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const bookingId = searchParams.get('id');
    const [booking, setBooking] = useState(null);
    const [loadingBooking, setLoadingBooking] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [selectedTags, setSelectedTags] = useState([]);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!bookingId) {
            setLoadingBooking(false);
            return;
        }

        let isMounted = true;

        const fetchBooking = async () => {
            try {
                const res = await bookingAPI.getBooking(bookingId);
                if (isMounted) {
                    const nextBooking = res?.data?.booking || null;
                    setBooking(nextBooking);
                    if (nextBooking?.feedback?.rating) {
                        setRating(nextBooking.feedback.rating);
                        setComment(nextBooking.feedback.review || '');
                    }
                }
            } catch (err) {
                console.error('Failed to load booking for feedback:', err);
            } finally {
                if (isMounted) {
                    setLoadingBooking(false);
                }
            }
        };

        fetchBooking();
        return () => {
            isMounted = false;
        };
    }, [bookingId]);

    const chauffeurMode = useMemo(() => isChauffeurBooking(booking || {}), [booking]);
    const performer = booking?.provider?.id || {};
    const performerLabel = 'Chauffeur';
    const successRoute = `/spare-driver/history?bookingId=${bookingId}`;

    const toggleTag = (tag) => {
        setSelectedTags((prev) => (
            prev.includes(tag) ? prev.filter((entry) => entry !== tag) : [...prev, tag]
        ));
    };

    const handleSubmit = async () => {
        if (!rating || isSubmitting || !bookingId) return;

        try {
            setIsSubmitting(true);
            const res = await bookingAPI.submitFeedback(bookingId, {
                rating,
                review: comment,
                tags: selectedTags
            });

            if (res.status === 'success') {
                setSubmitted(true);
                setTimeout(() => navigate(successRoute), 1800);
            }
        } catch (err) {
            console.error('Feedback submission error:', err);
            alert(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingBooking) {
        return (
            <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[#F29F05]" />
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#0A0F0D] flex flex-col items-center justify-center px-8 text-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}>
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                        <ThumbsUp size={40} className="text-emerald-500" fill="currentColor" strokeWidth={1.5} />
                    </div>
                </motion.div>
                <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-3">Protocol Closed</h2>
                <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] max-w-[240px] leading-relaxed italic">
                    Your transmission has been logged. We appreciate your contribution to excellence.
                </p>
                <div className="mt-10 w-12 h-1 bg-[#F59E0B] rounded-full animate-pulse mx-auto shadow-[0_0_15px_#F59E0B]" />
            </div>
        );
    }

    if (booking && !chauffeurMode) {
        return (
            <div className="min-h-screen bg-[#0A0F0D] flex flex-col items-center justify-center px-6 text-center">
                <h2 className="text-2xl font-black tracking-tight text-content mb-2">Spare driver only</h2>
                <p className="text-sm font-bold text-content-subtle max-w-[280px]">
                    This feedback screen is available only for spare driver trips.
                </p>
                <button
                    onClick={() => navigate('/spare-driver/history')}
                    className="mt-8 h-12 px-8 rounded-2xl bg-brand text-white font-black text-sm"
                >
                    Open Trip History
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0F0D] flex flex-col">
            <header className="px-4 pt-10 pb-6 flex items-center gap-4 bg-[#0A0F0D]/90 sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                    <ChevronLeft size={18} strokeWidth={3} className="text-white" />
                </motion.button>
                <div>
                    <h1 className="text-lg font-black tracking-tighter text-white italic uppercase leading-none">Evaluation</h1>
                    <p className="text-[9px] text-[#F59E0B] font-black uppercase tracking-[0.2em] mt-1.5 italic">
                        Log #{booking?.bookingId || bookingId || 'TRIP'}
                    </p>
                </div>
            </header>

            <div className="px-4 py-8 space-y-8 flex-1">
                <div className="flex items-center gap-5 bg-white/[0.03] border border-white/5 rounded-[2rem] p-5 shadow-2xl">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center shadow-inner overflow-hidden">
                            <span className="font-black text-2xl text-[#F59E0B] italic">{performer?.name?.charAt(0) || 'C'}</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#F59E0B] rounded-xl flex items-center justify-center border-2 border-black shadow-xl">
                            <Award size={14} className="text-black" strokeWidth={3} />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1 italic">{performerLabel}</p>
                        <h3 className="font-black text-base text-white tracking-tighter italic uppercase truncate">{performer?.name || 'Lead Specialist'}</h3>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1 italic truncate">
                            {booking?.service?.name || 'Protocol'} · {new Date(booking?.createdAt || Date.now()).toLocaleDateString('en-IN')}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-black text-xl text-white tracking-tighter italic">{formatMoney(booking || {})}</p>
                        <p className="text-[9px] text-[#F59E0B] font-black uppercase tracking-[0.2em] mt-1 italic">
                            {booking?.payment?.status || 'Finalized'}
                        </p>
                    </div>
                </div>

                <div className="text-center py-4">
                    <p className="font-black text-white text-lg italic uppercase tracking-tighter mb-8">Trip Quality Assessment</p>
                    <div className="flex justify-center gap-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <motion.button
                                key={i}
                                whileTap={{ scale: 0.8 }}
                                onMouseEnter={() => setHovered(i)}
                                onMouseLeave={() => setHovered(0)}
                                onClick={() => setRating(i)}
                                className="relative"
                            >
                                <Star
                                    size={44}
                                    className={`transition-all duration-300 ${i <= (hovered || rating) ? 'text-[#F59E0B] drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-white/10'}`}
                                    fill={i <= (hovered || rating) ? 'currentColor' : 'none'}
                                    strokeWidth={2}
                                />
                                {i <= rating && (
                                    <motion.div layoutId="star-glow" className="absolute inset-0 bg-[#F59E0B]/5 blur-xl -z-1" />
                                )}
                            </motion.button>
                        ))}
                    </div>
                    <p className="mt-8 text-[11px] font-black text-white/20 uppercase tracking-[0.4em] italic">
                        {rating === 0 ? 'Protocol Rating Pending' : ['', 'Sub-Standard', 'Acceptable', 'Commendable', 'Exemplary', 'Elite Protocol'][rating]}
                    </p>
                </div>

                {rating >= 3 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 italic">Recognition Tokens</p>
                        <div className="flex flex-wrap gap-2.5">
                            {TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all italic ${
                                        selectedTags.includes(tag)
                                            ? 'bg-white text-black border-white shadow-[0_20px_40px_rgba(255,255,255,0.1)]'
                                            : 'bg-white/5 border-white/5 text-white/20'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 ml-1 italic">Dossier Annotation</p>
                    <textarea
                        rows={4}
                        placeholder="Encrypted notes on trip performance..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] px-5 py-5 text-[13px] font-black uppercase italic italic-black text-white outline-none focus:border-[#F59E0B]/30 placeholder:text-white/10 resize-none shadow-inner"
                    />
                </div>

                <button className="w-full flex items-center gap-4 bg-white/[0.03] border border-dashed border-white/10 rounded-[2rem] p-5 hover:border-white/20 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#F59E0B]/10 transition-colors">
                        <Camera size={20} className="text-white/20 group-hover:text-[#F59E0B]" strokeWidth={3} />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-[12px] text-white uppercase italic tracking-widest">Visual Evidence</p>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">
                            Optional trip proof or reference
                        </p>
                    </div>
                </button>
            </div>

            <div className="px-5 pb-10 pt-4 bg-[#0A0F0D]/90 backdrop-blur-xl border-t border-white/5 sticky bottom-0">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={rating === 0 || isSubmitting || !bookingId}
                    className={`w-full h-16 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl transition-all ${
                        rating > 0 && bookingId ? 'bg-[#F59E0B] text-black shadow-[#F59E0B]/20' : 'bg-white/5 text-white/10'
                    }`}
                >
                    {isSubmitting ? 'Transmitting...' : 'Submit Evaluation'}
                </motion.button>
            </div>
        </div>
    );
};

export default RateExperience;
