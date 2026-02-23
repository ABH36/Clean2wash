// Reusable UI components for the CarWash consumer module

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// 1. BottomSheet
// Usage: <BottomSheet open={open} onClose={() => setOpen(false)} title="Hello">content</BottomSheet>
// ─────────────────────────────────────────────────────────────────────────────
export const BottomSheet = ({ open, onClose, title, children, height = 'auto' }) => {
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />

                    {/* Sheet */}
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 overflow-hidden"
                        style={{ maxHeight: '90vh' }}>
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-200 rounded-full" />
                        </div>
                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                                <h3 className="font-black text-base text-content tracking-tight">{title}</h3>
                                <button onClick={onClose} className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-content-muted">
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        )}
                        {/* Content */}
                        <div className="overflow-y-auto px-5 py-4 pb-8" style={{ maxHeight: 'calc(90vh - 100px)' }}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Toast Notification
// Usage: <Toast message="Copied!" type="success" visible={show} />
// ─────────────────────────────────────────────────────────────────────────────
export const Toast = ({ message, type = 'success', visible }) => {
    const styles = {
        success: { bg: 'bg-green-600', icon: <CheckCircle2 size={15} className="text-white" strokeWidth={2.5} /> },
        error: { bg: 'bg-red-500', icon: <XCircle size={15} className="text-white" strokeWidth={2.5} /> },
        info: { bg: 'bg-blue-600', icon: <Info size={15} className="text-white" strokeWidth={2.5} /> },
        warning: { bg: 'bg-amber-500', icon: <AlertTriangle size={15} className="text-white" strokeWidth={2.5} /> },
    };
    const s = styles[type];

    return (
        <AnimatePresence>
            {visible && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className={`fixed top-14 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 ${s.bg} text-white px-4 py-3 rounded-xl shadow-xl`}>
                    {s.icon}
                    <span className="font-black text-sm">{message}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. SearchBar
// Usage: <SearchBar placeholder="Search..." value={q} onChange={setQ} />
// ─────────────────────────────────────────────────────────────────────────────
import { Search } from 'lucide-react';

export const SearchBar = ({ placeholder = 'Search…', value, onChange, onClear, className = '' }) => (
    <div className={`flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 ${className}`}>
        <Search size={16} className="text-content-subtle flex-shrink-0" strokeWidth={2.5} />
        <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
            className="flex-1 bg-transparent text-sm font-bold text-content outline-none placeholder:text-content-subtle placeholder:font-medium" />
        {value && onClear && (
            <button onClick={onClear} className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <X size={10} strokeWidth={3} className="text-content-muted" />
            </button>
        )}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. StarRating (interactive or display)
// Usage: <StarRating value={4} onChange={setVal} /> or <StarRating value={4.5} readOnly />
// ─────────────────────────────────────────────────────────────────────────────
import { Star } from 'lucide-react';

export const StarRating = ({ value = 0, onChange, readOnly = false, size = 24 }) => {
    const [hovered, setHovered] = React.useState(0);
    const display = readOnly ? value : (hovered || value);

    return (
        <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(i => (
                <button key={i} disabled={readOnly}
                    onClick={() => !readOnly && onChange?.(i)}
                    onMouseEnter={() => !readOnly && setHovered(i)}
                    onMouseLeave={() => !readOnly && setHovered(0)}
                    className={readOnly ? 'cursor-default' : 'transition-transform hover:scale-110 active:scale-90'}>
                    <Star size={size}
                        className={i <= Math.round(display) ? 'text-yellow-400' : 'text-gray-200'}
                        fill={i <= Math.round(display) ? 'currentColor' : 'none'}
                        strokeWidth={1.5} />
                </button>
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Badge
// Usage: <Badge variant="brand">New</Badge> <Badge variant="success">Done</Badge>
// ─────────────────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'brand', className = '' }) => {
    const variants = {
        brand: 'bg-brand/10 text-brand border-brand/10',
        success: 'bg-green-50 text-green-700 border-green-100',
        warning: 'bg-amber-50 text-amber-700 border-amber-100',
        error: 'bg-red-50 text-red-600 border-red-100',
        info: 'bg-blue-50 text-blue-700 border-blue-100',
        dark: 'bg-content text-white border-content/10',
        yellow: 'bg-accent-yellow text-black border-yellow-300',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border font-black text-[8px] uppercase tracking-widest ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. EmptyState
// Usage: <EmptyState icon={<Clock />} title="No bookings" desc="Book your first wash!" cta="Book Now" onCta={() => navigate('/services')} />
// ─────────────────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, desc, cta, onCta }) => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-content-subtle">
            {icon && React.cloneElement(icon, { size: 28 })}
        </div>
        <h3 className="font-black text-base text-content tracking-tight mb-1">{title}</h3>
        {desc && <p className="text-sm font-bold text-content-subtle leading-relaxed">{desc}</p>}
        {cta && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={onCta}
                className="mt-5 bg-brand text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md shadow-brand/25">
                {cta}
            </motion.button>
        )}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. SectionHeader
// Usage: <SectionHeader title="Services" action="View All" onAction={() => {}} />
// ─────────────────────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action, onAction }) => (
    <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-black tracking-tight text-content">{title}</h2>
        {action && (
            <button onClick={onAction} className="text-brand text-[9px] font-black uppercase tracking-widest">
                {action}
            </button>
        )}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. Divider
// Usage: <Divider label="or" />
// ─────────────────────────────────────────────────────────────────────────────
export const Divider = ({ label }) => (
    <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-100" />
        {label && <span className="text-[9px] font-black text-content-subtle uppercase tracking-widest">{label}</span>}
        <div className="flex-1 h-px bg-gray-100" />
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. InfoRow — label + value pair used in summary cards
// Usage: <InfoRow label="Amount" value="₹299" />
// ─────────────────────────────────────────────────────────────────────────────
export const InfoRow = ({ label, value, valueClass = '' }) => (
    <div className="flex justify-between items-center py-1.5">
        <span className="text-sm font-bold text-content-subtle">{label}</span>
        <span className={`text-sm font-black text-content ${valueClass}`}>{value}</span>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 10. PillTag — horizontal scrollable filter chips
// Usage: <PillTags items={['All','Exterior']} active={a} onChange={setA} />
// ─────────────────────────────────────────────────────────────────────────────
export const PillTags = ({ items, active, onChange }) => (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {items.map(item => (
            <button key={item} onClick={() => onChange(item)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${active === item ? 'bg-brand text-white border-brand shadow-md' : 'bg-white text-content-muted border-gray-100 hover:border-brand/20'
                    }`}>
                {item}
            </button>
        ))}
    </div>
);
