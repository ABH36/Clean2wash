import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

const PremiumBadge = ({ className = "" }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-1.5 px-2.5 py-1 bg-black rounded-full border border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)] ${className}`}
        >
            <motion.div
                animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    ease: "easeInOut" 
                }}
            >
                <Crown size={10} className="text-[#D4AF37]" fill="#D4AF37" />
            </motion.div>
            <span className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.2em] leading-none">
                Gold
            </span>
            
            {/* Sparkle animations */}
            <motion.div 
                className="absolute -top-1 -right-1"
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            >
                <div className="w-1 h-1 bg-white/5 rounded-full blur-[1px]" />
            </motion.div>
        </motion.div>
    );
};

export default PremiumBadge;
