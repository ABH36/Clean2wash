import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';

const RegistrationStepWrapper = ({ title, subtitle, step, totalSteps, children, onNext, onBack, loading, nextLabel = "Continue" }) => {
    const progress = (step / totalSteps) * 100;

    return (
        <div className="flex flex-col min-h-[550px] relative">
            {/* Header Section Centered */}
            <div className="mb-10 relative z-10 flex flex-col items-center">
                <div className="w-full flex items-center justify-center relative mb-6">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="absolute left-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-yellow-500 hover:text-black transition-all active:scale-90 border border-white/5"
                        >
                            <ArrowLeft size={16} strokeWidth={3} />
                        </button>
                    )}
                    <div className="px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                        <span className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.2em]">Step {step} of {totalSteps}</span>
                    </div>
                </div>

                <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-2 text-center">
                    {title.split(' ').map((word, i) => (
                        <span key={i} className={i === 0 ? "text-white" : "text-yellow-500 block mt-1"}>{word} </span>
                    ))}
                </h1>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-3 leading-relaxed text-center">{subtitle}</p>

                {/* Progress Visualizer */}
                <div className="mt-8 relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                    />
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 relative z-10">
                {children}
            </div>

            {/* Action Area */}
            <div className="mt-12 sticky bottom-0 pt-6 bg-gradient-to-t from-[#0A0F0D] via-[#0A0F0D]/90 to-transparent">
                <button
                    onClick={onNext}
                    disabled={loading}
                    className="w-full h-16 bg-yellow-500 text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 shadow-[0_15px_35px_-10px_rgba(234,179,8,0.5)] active:scale-[0.98] hover:bg-yellow-400 hover:shadow-yellow-500/40 transition-all disabled:opacity-50 group"
                >
                    {loading ? (
                        <div className="w-6 h-6 border-4 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>{nextLabel}</span>
                            <ChevronRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default RegistrationStepWrapper;
