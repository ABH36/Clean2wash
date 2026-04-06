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
    const performerLabel = chauffeurMode ? 'Chauffeur' : (booking?.provider?.type === 'vendor' ? 'Service Hub' : 'Captain');
    const successRoute = chauffeurMode ? `/spare-driver/history?bookingId=${bookingId}` : '/bookings';

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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[#F29F05]" />
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-green-100">
                        <ThumbsUp size={36} className="text-green-500" fill="currentColor" strokeWidth={1.5} />
                    </div>
                </motion.div>
                <h2 className="text-2xl font-black tracking-tight text-content mb-2">Thank you!</h2>
                <p className="text-sm font-bold text-content-subtle">
                    {chauffeurMode ? 'Your chauffeur feedback helps us improve every trip.' : 'Your feedback makes Clean2Wash better for everyone.'}
                </p>
                <div className="mt-6 w-8 h-1 bg-brand rounded-full animate-pulse mx-auto" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="px-4 pt-10 pb-4 flex items-center gap-3 border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                    <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                </button>
                <div>
                    <h1 className="text-lg font-black tracking-tight text-content leading-none">Rate Experience</h1>
                    <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">
                        Order #{booking?.bookingId || bookingId || 'Trip'}
                    </p>
                </div>
            </header>

            <div className="px-4 py-5 space-y-6 flex-1">
                <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20">
                            <span className="font-black text-xl text-brand">{performer?.name?.charAt(0) || 'C'}</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand rounded-lg flex items-center justify-center border-2 border-white">
                            <Award size={10} className="text-white" fill="white" strokeWidth={1} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-content-subtle mb-0.5">{performerLabel}</p>
                        <h3 className="font-black text-base text-content tracking-tight">{performer?.name || 'Assigned Specialist'}</h3>
                        <p className="text-[10px] text-content-subtle font-bold">
                            {booking?.service?.name || booking?.serviceName || 'Service'} · {new Date(booking?.createdAt || Date.now()).toLocaleDateString('en-IN')}
                        </p>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="font-black text-xl text-content">{formatMoney(booking || {})}</p>
                        <p className="text-[9px] text-green-600 font-black uppercase tracking-wider">
                            {booking?.payment?.status || 'Paid'}
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <p className="font-black text-content text-base mb-4">
                        {chauffeurMode ? 'How was your chauffeur trip?' : 'How was your experience?'}
                    </p>
                    <div className="flex justify-center gap-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <motion.button
                                key={i}
                                whileTap={{ scale: 0.85 }}
                                onMouseEnter={() => setHovered(i)}
                                onMouseLeave={() => setHovered(0)}
                                onClick={() => setRating(i)}
                            >
                                <Star
                                    size={40}
                                    className={`transition-all duration-150 ${i <= (hovered || rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                                    fill={i <= (hovered || rating) ? 'currentColor' : 'none'}
                                    strokeWidth={1.5}
                                />
                            </motion.button>
                        ))}
                    </div>
                    <p className="mt-3 text-sm font-black text-content-subtle">
                        {rating === 0 ? 'Tap to rate' : ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                    </p>
                </div>

                {rating >= 3 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-3">What went well?</p>
                        <div className="flex flex-wrap gap-2">
                            {TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-2 rounded-xl font-black text-xs border transition-all ${
                                        selectedTags.includes(tag)
                                            ? 'bg-brand text-white border-brand shadow-md'
                                            : 'bg-white border-gray-100 text-content-muted hover:border-brand/20'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div>
                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-2">Add a note (optional)</p>
                    <textarea
                        rows={3}
                        placeholder={chauffeurMode ? 'Tell us about the trip, timing, and driver behaviour...' : 'Tell us more about your experience...'}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-content outline-none focus:border-brand/30 placeholder:text-content-subtle resize-none"
                    />
                </div>

                <button className="w-full flex items-center gap-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-3.5 hover:border-brand/30 transition-colors">
                    <Camera size={18} className="text-content-subtle" strokeWidth={2} />
                    <div className="text-left">
                        <p className="font-black text-sm text-content-muted">Add Photos</p>
                        <p className="text-[9px] font-bold text-content-subtle">
                            {chauffeurMode ? 'Optional trip proof or issue reference' : 'Before & after shots welcome'}
                        </p>
                    </div>
                </button>
            </div>

            <div className="px-4 pb-8 pt-2 bg-white border-t border-gray-100">
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={rating === 0 || isSubmitting || !bookingId}
                    className={`w-full h-14 rounded-2xl font-black text-base shadow-md transition-all ${
                        rating > 0 && bookingId ? 'bg-brand text-white shadow-brand/25' : 'bg-gray-100 text-content-subtle'
                    }`}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </motion.button>
            </div>
        </div>
    );
};

export default RateExperience;
