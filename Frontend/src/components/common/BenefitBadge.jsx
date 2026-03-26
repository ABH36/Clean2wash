import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Tag, Gift } from 'lucide-react';

const BenefitBadge = ({ type, name, amount, description }) => {
    const config = {
        blackpass: {
            bg: 'bg-gradient-to-r from-[#1A1A1A] to-[#333333]',
            text: 'text-brand',
            icon: <Crown size={12} className="text-brand" fill="currentColor" />,
            label: 'Elite Saving'
        },
        combo: {
            bg: 'bg-orange-50 border-orange-100',
            text: 'text-orange-600',
            icon: <Zap size={12} fill="currentColor" />,
            label: 'Combo Wash'
        },
        coupon: {
            bg: 'bg-emerald-50 border-emerald-100',
            text: 'text-emerald-600',
            icon: <Tag size={12} />,
            label: 'Promotion'
        },
        loyalty: {
            bg: 'bg-indigo-50 border-indigo-100',
            text: 'text-indigo-600',
            icon: <Gift size={12} />,
            label: 'Loyalty Reward'
        }
    };

    const style = config[type] || config.coupon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${style.bg} ${style.border || ''} shadow-sm group hover:scale-[1.02] transition-transform`}
        >
            <div className={`p-1.5 rounded-lg bg-white shadow-sm`}>
                {style.icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${style.text}`}>
                        {style.label}
                    </span>
                    <span className={`text-[11px] font-[1000] ${style.text}`}>
                        -₹{amount}
                    </span>
                </div>
                <p className="text-[10px] font-bold text-black/40 truncate uppercase tracking-tighter">
                    {name}: {description}
                </p>
            </div>
        </motion.div>
    );
};

export default BenefitBadge;
