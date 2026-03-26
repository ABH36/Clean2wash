import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, MapPin, Star, Clock, Calendar, Shield, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../hooks/useCaptain';
import { useTheme } from '../../../context/ThemeContext';

const CaptainPortfolio = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { captainJobs } = useCaptain();
    const [selectedJob, setSelectedJob] = useState(null);

    // Filter only completed jobs that have both before and after photos in serviceImages
    const portfolioJobs = captainJobs.filter(job =>
        job.status === 'completed' &&
        (job.serviceImages?.before?.length > 0 || job.beforePhoto) &&
        (job.serviceImages?.after?.length > 0 || job.afterPhoto)
    ).map(job => ({
        ...job,
        displayBefore: job.serviceImages?.before?.[0] || job.beforePhoto,
        displayAfter: job.serviceImages?.after?.[0] || job.afterPhoto
    }));

    const renderJobDetails = (job) => (
        <AnimatePresence>
            {selectedJob?.id === job.id && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'} space-y-4`}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock size={12} className="text-brand" />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Duration</span>
                                </div>
                                <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-content'}`}>45 Mins</p>
                            </div>
                            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Star size={12} className="text-yellow-400" />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Rating</span>
                                </div>
                                <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-content'}`}>5.0 / 5.0</p>
                            </div>
                        </div>

                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Service Performed</p>
                            <div className="flex flex-wrap gap-2">
                                {['Exterior Wash', 'Interior Vacuum', 'Tyre Polish'].map(tag => (
                                    <span key={tag} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'bg-brand/20 text-brand' : 'bg-brand/10 text-brand'}`}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-100'}`}>
                            <div className="flex items-center gap-2">
                                <Shield size={14} className="text-green-500" />
                                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Quality Verified</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <IndianRupee size={12} className="text-green-600" />
                                <span className="font-black text-sm text-green-600">{job.price} Earned</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <CaptainLayout>
            <div className={`min-h-screen pb-24 transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
                {/* Header */}
                <header className={`${isDarkMode ? 'bg-[#1E293B]/70 border-white/5' : 'bg-white/70 border-gray-100'} backdrop-blur-xl px-4 pt-10 pb-4 border-b sticky top-0 z-40 relative overflow-hidden`}>
                    <div className="relative z-10 flex items-center gap-3 mb-6">
                        <button onClick={() => navigate('/captain')} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-gray-50 border-gray-100 text-content hover:bg-gray-100'}`}>
                            <ChevronLeft size={18} strokeWidth={2.5} />
                        </button>
                        <div className="flex-1">
                            <h1 className={`text-xl font-black tracking-tight leading-none uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>Work Portfolio</h1>
                            <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Showcase of Excellence</p>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="flex gap-3 relative z-10">
                        <div className={`flex-1 p-4 rounded-2xl border ${isDarkMode ? 'bg-brand/10 border-brand/20' : 'bg-brand/5 border-brand/10'}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">Total Transformations</p>
                            <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-content'}`}>{portfolioJobs.length}</p>
                        </div>
                    </div>

                    <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[80px] pointer-events-none transition-colors ${isDarkMode ? 'bg-brand/20' : 'bg-brand/10'}`} />
                </header>

                <div className="px-4 py-6 space-y-6">
                    {portfolioJobs.length > 0 ? (
                        portfolioJobs.map((job) => (
                            <motion.div
                                key={job.id}
                                layout
                                onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                                className={`rounded-3xl border overflow-hidden cursor-pointer transition-all duration-300 ${isDarkMode ? 'bg-[#1E293B] border-white/10 shadow-2xl shadow-black/40 hover:border-brand/40' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50 hover:border-brand/30'}`}
                            >
                                {/* Header Info */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <span className={`font-black text-sm uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>{job.vehicleType?.[0] || 'V'}</span>
                                        </div>
                                        <div>
                                            <h3 className={`font-black text-sm uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{job.vehicleDetails || 'Premium Vehicle'}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Calendar size={10} className={isDarkMode ? 'text-white/40' : 'text-content-subtle'} />
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>{new Date(job.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${isDarkMode ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-100 text-green-600'}`}>
                                        Verified
                                    </div>
                                </div>

                                {/* Images Comparison */}
                                <div className="relative h-[200px] flex overflow-hidden">
                                    <div className="flex-1 relative group">
                                        <img src={job.displayBefore} alt="Before" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                                        <div className="absolute bottom-3 left-3 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg backdrop-blur-sm">
                                            Before
                                        </div>
                                    </div>

                                    {/* Diagonal separator */}
                                    <div className={`absolute left-1/2 top-0 bottom-0 w-8 -ml-4 skew-x-[-15deg] border-x-[4px] z-10 ${isDarkMode ? 'bg-[#1E293B] border-[#1E293B]' : 'bg-white border-white'}`}>
                                        <div className="absolute inset-y-0 left-1/2 w-0.5 -ml-px bg-brand" />
                                    </div>

                                    <div className="flex-1 relative group">
                                        <img src={job.displayAfter} alt="After" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                                        <div className="absolute bottom-3 right-3 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg backdrop-blur-sm">
                                            After
                                        </div>
                                    </div>
                                </div>

                                {/* Address Context */}
                                <div className="p-4 pb-2 flex items-center gap-2">
                                    <MapPin size={12} className="text-brand flex-shrink-0" />
                                    <p className={`text-[10px] font-bold truncate ${isDarkMode ? 'text-white/60' : 'text-content-subtle'}`}>{job.address}</p>
                                </div>

                                {/* Expandable Details */}
                                <div className="px-4 pb-4">
                                    {renderJobDetails(job)}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center mb-6 shadow-xl ${isDarkMode ? 'bg-[#1E293B] border border-white/10' : 'bg-white border border-gray-100'}`}>
                                <Camera size={32} className={isDarkMode ? 'text-white/20' : 'text-gray-300'} />
                            </div>
                            <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-content'}`}>No Portfolio Items Yet</h3>
                            <p className={`text-[11px] font-bold max-w-[220px] leading-relaxed mx-auto uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Complete jobs with before and after photos to build your showcase here.</p>
                        </div>
                    )}
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainPortfolio;
