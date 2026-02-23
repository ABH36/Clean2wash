import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, MapPin, Clock, X, ChevronRight } from 'lucide-react';

const StaffNewJobOverlay = ({ isVisible, onAccept, onReject, jobData }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-end justify-center p-5 bg-content/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ y: 100, scale: 0.9 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 100, scale: 0.9 }}
                        className="w-full max-w-md bg-white rounded-[3rem] overflow-hidden shadow-2xl relative"
                    >
                        {/* Header Gradient */}
                        <div className="bg-gradient-to-r from-brand to-orange-400 p-8 pb-12 relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-2 font-black italic">Invitation</p>
                                    <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none">New Pickup <br /> Assignment</h2>
                                </div>
                                <button
                                    onClick={onReject}
                                    className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>
                            <Truck size={120} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
                        </div>

                        {/* Content */}
                        <div className="px-8 -mt-6">
                            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
                                        <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200" className="w-full h-full object-cover" alt="User" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-content italic leading-none mb-1">Rajesh M.</h3>
                                        <p className="text-[10px] font-black text-brand uppercase tracking-widest leading-none">Indirapuram Hub · 1.2km away</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Time Limit</p>
                                        <p className="text-sm font-black text-content italic">01:45</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-start gap-4">
                                        <MapPin size={20} className="text-brand shrink-0" />
                                        <div>
                                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 font-black italic">Pickup Address</p>
                                            <p className="text-xs font-black text-content leading-snug">Flat 402, Shipra Krishna Mall, Indirapuram</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Clock size={20} className="text-brand shrink-0" />
                                        <div>
                                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 font-black italic">Scheduled Slot</p>
                                            <p className="text-xs font-black text-content italic leading-none uppercase">Today · 02:00 PM - 03:00 PM</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-8 pt-8 pb-10 flex gap-4">
                            <button
                                onClick={onReject}
                                className="flex-1 py-4 rounded-2xl bg-gray-50 font-black text-xs text-content-muted uppercase tracking-widest border border-gray-100"
                            >
                                Pass
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={onAccept}
                                className="flex-[2] py-4 rounded-2xl bg-brand text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/30 flex items-center justify-center gap-2"
                            >
                                Accept Job <ChevronRight size={18} strokeWidth={3} />
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StaffNewJobOverlay;
