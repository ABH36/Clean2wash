import React from 'react';

const RiskScoreBadge = ({ score, size = 'md' }) => {
    const getRiskBadge = (score) => {
        if (score <= 30) return { label: 'Low', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
        if (score <= 60) return { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
        return { label: 'High', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    };

    const riskBadge = getRiskBadge(score);
    
    const sizeClasses = {
        sm: 'w-12 h-12 text-[10px]',
        md: 'w-16 h-16 text-[12px]',
        lg: 'w-20 h-20 text-[14px]'
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full border-4 ${riskBadge.border} ${riskBadge.bg} flex items-center justify-center relative`}>
            <span className={`font-black ${riskBadge.color}`}>{score}</span>
            <div 
                className={`absolute inset-0 rounded-full border-4 ${riskBadge.border}`} 
                style={{
                    background: `conic-gradient(${score <= 30 ? '#10b981' : score <= 60 ? '#f59e0b' : '#ef4444'} ${score * 3.6}deg, transparent 0deg)`
                }}
            />
        </div>
    );
};

export default RiskScoreBadge;