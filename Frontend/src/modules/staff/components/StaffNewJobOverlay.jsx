import { useTheme } from '../../../context/ThemeContext';

const StaffNewJobOverlay = ({ isVisible, onAccept, onReject, jobData }) => {
    const { isDarkMode } = useTheme();

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`fixed inset-0 z-[100] flex items-end justify-center p-5 backdrop-blur-md transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]/80' : 'bg-content/60'}`}
                >
                    <motion.div
                        initial={{ y: 100, scale: 0.9 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 100, scale: 0.9 }}
                        className={`w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative transition-colors duration-500 ${isDarkMode ? 'bg-[#1E293B] border border-white/5' : 'bg-white/5'}`}
                    >
                        {/* Header Gradient */}
                        <div className={`p-8 pb-12 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-brand/90 to-orange-500/90' : 'bg-gradient-to-r from-brand to-orange-400'}`}>
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.3em] mb-2 font-black text-white/60">Invitation</p>
                                    <h2 className="text-3xl font-black text-white tracking-tighter leading-none uppercase">New Pickup <br /> Assignment</h2>
                                </div>
                                <button
                                    onClick={onReject}
                                    className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md hover:bg-white/30 transition-all"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>
                            <Truck size={120} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
                        </div>

                        {/* Content */}
                        <div className="px-8 -mt-6 relative z-20">
                            <div className={`rounded-[2.5rem] p-6 shadow-2xl shadow-black/50 space-y-6 transition-colors duration-500 ${isDarkMode ? 'bg-[#2A3547] border border-white/5' : 'bg-white/5'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border transition-colors ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/[0.02] border-white/5'}`}>
                                        <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200" className="w-full h-full object-cover" alt="User" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-lg font-black leading-none mb-1 uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>Rajesh M.</h3>
                                        <p className="text-[10px] font-black text-brand-light uppercase tracking-widest leading-none">Indirapuram Hub · 1.2km away</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Time Limit</p>
                                        <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-content'}`}>01:45</p>
                                    </div>
                                </div>

                                <div className={`space-y-4 pt-4 border-t transition-colors ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-brand/10' : 'bg-brand/5'}`}>
                                            <MapPin size={20} className="text-brand" />
                                        </div>
                                        <div>
                                            <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Pickup Address</p>
                                            <p className={`text-xs font-black leading-snug uppercase ${isDarkMode ? 'text-white/80' : 'text-content'}`}>Flat 402, Shipra Krishna Mall, Indirapuram</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-brand/10' : 'bg-brand/5'}`}>
                                            <Clock size={20} className="text-brand" />
                                        </div>
                                        <div>
                                            <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Scheduled Slot</p>
                                            <p className={`text-xs font-black leading-none uppercase ${isDarkMode ? 'text-white/80' : 'text-content'}`}>Today · 02:00 PM - 03:00 PM</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-8 pt-8 pb-10 flex gap-4">
                            <button
                                onClick={onReject}
                                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${isDarkMode ? 'bg-white/5 border-white/5 text-white/40 active:bg-white/10' : 'bg-white/[0.02] border-white/5 text-content-muted active:bg-white/[0.05]'}`}
                            >
                                Pass
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={onAccept}
                                className="flex-[2] py-4 rounded-2xl bg-brand text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-black/50 shadow-brand/30 flex items-center justify-center gap-2 hover:bg-brand-light transition-all"
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
