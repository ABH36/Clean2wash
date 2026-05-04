/**
 * ─── ADMIN PAGE SHELL ──────────────────────────────────────────────
 * Consistent wrapper applied to every admin section/page.
 * Provides: premium page header, breadcrumb chip, and body spacing.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const PageShell = ({ 
    title, 
    subtitle, 
    icon: Icon, 
    accent = 'blue',
    badge,
    actions, 
    children 
}) => {
    const accentMap = {
        blue:   { bg: 'bg-blue-600',   light: 'bg-blue-50',   text: 'text-blue-600',   glow: 'shadow-blue-500/20' },
        amber:  { bg: 'bg-amber-500',  light: 'bg-amber-50',  text: 'text-amber-600',  glow: 'shadow-amber-500/20' },
        emerald:{ bg: 'bg-emerald-600',light: 'bg-emerald-50',text: 'text-emerald-600',glow: 'shadow-emerald-500/20' },
        rose:   { bg: 'bg-rose-600',   light: 'bg-rose-50',   text: 'text-rose-600',   glow: 'shadow-rose-500/20' },
        purple: { bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-600', glow: 'shadow-purple-500/20' },
        navy:   { bg: 'bg-slate-900',  light: 'bg-slate-100', text: 'text-slate-700',  glow: 'shadow-slate-500/20' },
        indigo: { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600', glow: 'shadow-indigo-500/20' },
    };
    const a = accentMap[accent] || accentMap.blue;

    return (
        <div className="space-y-6 pb-12">
            {/* ── PAGE HEADER ── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className={`w-12 h-12 rounded-2xl ${a.bg} text-white flex items-center justify-center shadow-lg ${a.glow} shrink-0`}>
                            <Icon size={22} />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
                                {title}
                            </h1>
                            {badge && (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${a.light} ${a.text}`}>
                                    {badge}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions slot */}
                {actions && (
                    <div className="flex items-center gap-3 shrink-0">
                        {actions}
                    </div>
                )}
            </motion.div>

            {/* ── PAGE BODY ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
            >
                {children}
            </motion.div>
        </div>
    );
};

/** 
 * Reusable section card — wraps widget-level content 
 */
export const SectionCard = ({ title, subtitle, actions, children, className = '', noPad = false }) => (
    <div className={`bg-white rounded-[1.75rem] border border-slate-100 shadow-sm overflow-hidden ${className}`}>
        {(title || actions) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                <div>
                    <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.1em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        {title}
                    </h3>
                    {subtitle && <p className="text-[10px] text-slate-400 font-medium mt-0.5 ml-3.5">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        )}
        <div className={noPad ? '' : 'p-6'}>
            {children}
        </div>
    </div>
);

/**
 * Reusable filter/toolbar bar
 */
export const FilterBar = ({ children }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
        {children}
    </div>
);

/**
 * Search input
 */
export const SearchBox = ({ value, onChange, placeholder = 'Search...' }) => (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-amber-400 focus-within:bg-white transition-all w-full md:w-72">
        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="bg-transparent outline-none text-[12px] font-medium text-slate-700 w-full placeholder:text-slate-400"
        />
    </div>
);

/**
 * Status tabs
 */
export const StatusTabs = ({ tabs, active, onChange }) => (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
        {tabs.map(tab => (
            <button
                key={tab.value}
                onClick={() => onChange(tab.value)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    active === tab.value
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-400 hover:text-slate-700'
                }`}
            >
                {tab.label}
                {tab.count != null && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
                        active === tab.value ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                        {tab.count}
                    </span>
                )}
            </button>
        ))}
    </div>
);

/**
 * Empty state
 */
export const EmptyState = ({ icon: EIcon, title, subtitle }) => (
    <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-300">
        {EIcon && <EIcon size={48} strokeWidth={1} />}
        <div className="text-center">
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">{title}</p>
            {subtitle && <p className="text-[11px] font-medium text-slate-400 mt-1">{subtitle}</p>}
        </div>
    </div>
);

/**
 * Loading spinner
 */
export const PageLoader = () => (
    <div className="h-64 flex flex-col items-center justify-center gap-4">
        <div className="adm-spinner" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading...</p>
    </div>
);

export default PageShell;
