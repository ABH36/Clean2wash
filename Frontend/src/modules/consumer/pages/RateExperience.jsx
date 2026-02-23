import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, ThumbsUp, Camera, Award } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const TAGS = ['On Time', 'Very Clean', 'Friendly', 'Professional', 'Careful', 'Quick & Efficient'];

const RateExperience = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { bookings, registeredUsers } = useAuth();

    const bookingId = searchParams.get('id');
    const liveBooking = bookings.find(b => b.id === bookingId) || { id: 'CarWash-8821', serviceName: 'Eco Doorstep Wash', price: '₹473', performerId: null };

    const performer = liveBooking.performerId
        ? [...(registeredUsers.captain || []), ...(registeredUsers.staff || [])].find(u => u.id === liveBooking.performerId)
        : { name: 'Rahul Sharma' }; // Fallback

    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [selectedTags, setSelectedTags] = useState([]);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const toggleTag = (tag) =>
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

    const handleSubmit = () => {
        setSubmitted(true);
        // In a real app, we'd call updateBookingStatus here to add the rating
        setTimeout(() => navigate('/'), 2000);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-green-100">
                        <ThumbsUp size={36} className="text-green-500" fill="currentColor" strokeWidth={1.5} />
                    </div>
                </motion.div>
                <h2 className="text-2xl font-black tracking-tight text-content mb-2">Thank you!</h2>
                <p className="text-sm font-bold text-content-subtle">Your feedback makes CarWash better for everyone.</p>
                <div className="mt-6 w-8 h-1 bg-brand rounded-full animate-pulse mx-auto" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 flex items-center gap-3 border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                    <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                </button>
                <div>
                    <h1 className="text-lg font-black tracking-tight text-content leading-none">Rate Experience</h1>
                    <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">Order #{liveBooking.id}</p>
                </div>
            </header>

            <div className="px-4 py-5 space-y-6 flex-1">

                {/* ── Captain Card ── */}
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
                        <p className="text-[9px] font-black uppercase tracking-widest text-content-subtle mb-0.5">{liveBooking.type === 'vendor' ? 'Service Hub' : 'Captain'}</p>
                        <h3 className="font-black text-base text-content tracking-tight">{performer?.name || 'Rahul Sharma'}</h3>
                        <p className="text-[10px] text-content-subtle font-bold">{liveBooking.serviceName} · {new Date(liveBooking.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="font-black text-xl text-content">{liveBooking.price}</p>
                        <p className="text-[9px] text-green-600 font-black uppercase tracking-wider">Paid</p>
                    </div>
                </div>

                {/* ── Star Rating ── */}
                <div className="text-center">
                    <p className="font-black text-content text-base mb-4">How was your experience?</p>
                    <div className="flex justify-center gap-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <motion.button key={i} whileTap={{ scale: 0.85 }}
                                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)}
                                onClick={() => setRating(i)}>
                                <Star size={40}
                                    className={`transition-all duration-150 ${i <= (hovered || rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                                    fill={i <= (hovered || rating) ? 'currentColor' : 'none'}
                                    strokeWidth={1.5} />
                            </motion.button>
                        ))}
                    </div>
                    <p className="mt-3 text-sm font-black text-content-subtle">
                        {rating === 0 ? 'Tap to rate' : ['', 'Poor 😞', 'Fair 🙂', 'Good 👍', 'Great 😄', 'Excellent! 🤩'][rating]}
                    </p>
                </div>

                {/* ── Quick Tags ── */}
                {rating >= 3 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-3">What went well?</p>
                        <div className="flex flex-wrap gap-2">
                            {TAGS.map(tag => (
                                <button key={tag} onClick={() => toggleTag(tag)}
                                    className={`px-3 py-2 rounded-xl font-black text-xs border transition-all ${selectedTags.includes(tag)
                                        ? 'bg-brand text-white border-brand shadow-md'
                                        : 'bg-white border-gray-100 text-content-muted hover:border-brand/20'
                                        }`}>
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Comment ── */}
                <div>
                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-2">Add a note (optional)</p>
                    <textarea rows={3} placeholder="Tell us more about your experience…"
                        value={comment} onChange={e => setComment(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-content outline-none focus:border-brand/30 placeholder:text-content-subtle resize-none" />
                </div>

                {/* ── Photo Upload ── */}
                <button className="w-full flex items-center gap-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-3.5 hover:border-brand/30 transition-colors">
                    <Camera size={18} className="text-content-subtle" strokeWidth={2} />
                    <div className="text-left">
                        <p className="font-black text-sm text-content-muted">Add Photos</p>
                        <p className="text-[9px] font-bold text-content-subtle">Before & after shots welcome</p>
                    </div>
                </button>

            </div>

            {/* ── Submit ── */}
            <div className="px-4 pb-8 pt-2 bg-white border-t border-gray-100">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
                    disabled={rating === 0}
                    className={`w-full h-14 rounded-2xl font-black text-base shadow-md transition-all ${rating > 0 ? 'bg-brand text-white shadow-brand/25' : 'bg-gray-100 text-content-subtle'
                        }`}>
                    Submit Review
                </motion.button>
            </div>
        </div>
    );
};

export default RateExperience;
