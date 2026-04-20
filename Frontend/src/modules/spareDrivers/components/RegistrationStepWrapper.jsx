import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';

const RegistrationStepWrapper = ({ title, subtitle, step, totalSteps, children, onNext, onBack, loading, nextLabel = "Continue" }) => {
    const progress = (step / totalSteps) * 100;

    return (
        <div className="flex flex-col relative min-h-[420px]">
            {/* ── Ultra-Compact Header ── */}
            <div className="mb-4 relative z-10 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {onBack ? (
                            <button
                                onClick={onBack}
                                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:bg-yellow-500 hover:text-white transition-all active:scale-90 border border-white/5"
                            >
                                <ArrowLeft size={14} strokeWidth={3} />
                            </button>
                        ) : (
                            <div className="w-8 h-8" /> 
                        )}
                    </div>
                    
                    <div className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                        <span className="text-[7px] font-bold text-yellow-500 uppercase tracking-widest">Protocol {step}/{totalSteps}</span>
                    </div>
                    
                    <div className="w-8 h-8" />
                </div>

                <div className="text-center px-4">
                    <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                        {title.split(' ').map((word, i) => (
                            <span key={i} className={i === 0 ? "text-white" : "text-yellow-500 ml-1"}>
                                {word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()}
                            </span>
                        ))}
                    </h1>
                    <p className="text-[8px] font-medium text-white/30 uppercase tracking-widest leading-none">{subtitle}</p>
                </div>

                {/* ── Progress Linear ── */}
                <div className="mt-4 px-8">
                    <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="absolute inset-y-0 left-0 bg-yellow-500 rounded-full"
                        />
                    </div>
                </div>
            </div>

            {/* ── Compact Body ── */}
            <div className="flex-1 relative z-10 px-1 py-1">
                {children}
            </div>

            {/* ── Fixed Bottom Button ── */}
            <div className="mt-4 sticky bottom-0 pt-2 pb-1 bg-gradient-to-t from-[#0A0F0D] via-[#0A0F0D]/95 to-transparent">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onNext}
                    disabled={loading}
                    className="w-full h-12 bg-yellow-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-white/5 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>{nextLabel}</span>
                            <ChevronRight size={14} strokeWidth={4} />
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
};

export default RegistrationStepWrapper;