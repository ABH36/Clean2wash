import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Camera, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RatingModal = ({ isOpen, onClose, onSubmit, productName, productId, orderId }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit({ rating, comment, orderId, productId });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setRating(0);
                setComment('');
            }, 2000);
        } catch (error) {
            toast.error(error.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-onyx-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative bg-white/5 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
                    >
                        {success ? (
                            <div className="py-12 text-center space-y-4">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-black text-onyx-900 uppercase tracking-tight">Review Submitted!</h3>
                                <p className="text-onyx-500 font-medium">Thank you for helping the community grow.</p>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 p-2 text-onyx-400 hover:text-onyx-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>

                                <div className="space-y-6">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-gold-600 uppercase tracking-[0.2em] mb-2">Feedback Loop</p>
                                        <h3 className="text-xl font-bold text-onyx-900">How's the {productName}?</h3>
                                    </div>

                                    {/* Stars */}
                                    <div className="flex items-center justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onMouseEnter={() => setHover(star)}
                                                onMouseLeave={() => setHover(0)}
                                                onClick={() => setRating(star)}
                                                className="p-1 transition-transform active:scale-90"
                                            >
                                                <Star
                                                    className={`w-10 h-10 ${(hover || rating) >= star
                                                            ? 'text-gold-500 fill-gold-500'
                                                            : 'text-onyx-200'
                                                        } transition-colors`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Comment Area */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-onyx-400 uppercase tracking-widest px-1">Share your experience</label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="What did you like or dislike about this product?"
                                            className="w-full h-32 px-5 py-4 bg-onyx-50 border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-gold-500 resize-none transition-all placeholder:text-onyx-300"
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            className="flex-1 h-14 bg-onyx-50 text-onyx-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-onyx-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Camera size={18} />
                                            Add Photos
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            className="flex-[2] h-14 bg-onyx-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-onyx-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-onyx-200 disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <div className="w-5 h-5 border-white/5 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Send size={18} />
                                                    Submit Review
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RatingModal;
