import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

const VerifiedBadge = ({ type = 'specialist', className = '' }) => {
    if (type === 'specialist') {
        return (
            <div className={`flex items-center gap-1 bg-black text-amber-400 px-2 py-0.5 rounded-lg border border-amber-400/30 shadow-sm ${className}`}>
                <ShieldCheck size={10} strokeWidth={3} className="fill-amber-400/10" />
                <span className="text-[8px] font-black uppercase tracking-widest">Verified Specialist</span>
            </div>
        );
    }

    if (type === 'purchase') {
        return (
            <div className={`flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-100 ${className}`}>
                <CheckCircle2 size={10} strokeWidth={3} />
                <span className="text-[8px] font-black uppercase tracking-widest">Verified Purchase</span>
            </div>
        );
    }

    return null;
};

export default VerifiedBadge;
