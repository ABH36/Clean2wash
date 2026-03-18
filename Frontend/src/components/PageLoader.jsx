import React from 'react';
import { motion } from 'framer-motion';

const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-10 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px]" />
      </div>

      {/* Main Loader Container */}
      <div className="relative flex flex-col items-center">
        {/* Animated Brand Pulse */}
        <div className="relative w-24 h-24 mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 bg-brand/10 rounded-[2.5rem] blur-xl"
          />
          <motion.div
            animate={{ 
              rotate: 360,
              borderRadius: ["2.5rem", "1.5rem", "2.5rem"]
            }}
            transition={{ 
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              borderRadius: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-full h-full border-2 border-brand/20 border-t-brand rounded-[2.5rem] flex items-center justify-center"
          >
            <span className="text-2xl">✨</span>
          </motion.div>
        </div>

        {/* Status Text Block */}
        <div className="flex flex-col items-center text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-black text-content italic uppercase tracking-tighter mb-2"
          >
            Terminal Initializing
          </motion.h2>
          
          <div className="flex items-center gap-2">
            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-brand" 
            />
            <span className="text-[10px] font-bold text-content-subtle uppercase tracking-[0.2em] animate-pulse">
              Syncing Neural Engine...
            </span>
          </div>
        </div>

        {/* Progress Bar (Indeterminate) */}
        <div className="mt-12 w-48 h-[2px] bg-gray-100 rounded-full overflow-hidden relative">
          <motion.div
            animate={{ 
              left: ["-100%", "100%"]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-brand to-transparent"
          />
        </div>
      </div>

      {/* Brand Watermark */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-content">Clean 2 Wash</p>
        <p className="text-[6px] font-bold uppercase tracking-[0.3em] text-content-subtle">Hybrid System V2.0</p>
      </motion.div>
    </div>
  );
};

export default PageLoader;
