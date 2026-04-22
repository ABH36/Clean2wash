import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Phone,
    ArrowRight,
    AlertTriangle,
    Wallet,
    Shield,
    Clock,
    ChevronDown,
    X
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { bookingAPI, supportAPI } from '../../../utils/api';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';

const FAQS = [
    {
        question: 'How is waiting time calculated?',
        answer: 'Waiting charges start only after the free wait window ends. The exact charge is added to the final booking amount automatically.'
    },
    {
        question: 'Can I extend an active hourly trip?',
        answer: 'Yes. If the trip runs longer than the booked duration, extension charges are added automatically before the trip is closed.'
    },
    {
        question: 'What if my driver cancels?',
        answer: 'If a driver cancels before the trip starts, the app will continue looking for another available driver.'
    }
];

const SUPPORT_ACTIONS = [
    { id: 'billing', title: 'Billing issue', icon: Wallet, color: '#3B82F6', desc: 'Payment or fare issues' },
    { id: 'safety', title: 'Safety concerns', icon: Shield, color: '#EF4444', desc: 'Unsafe behavior reports' }
];

const ISSUE_OPTIONS = [
    { id: 'driver_late', label: 'Late' },
    { id: 'driver_behavior', label: 'Behavior' },
    { id: 'route_concern', label: 'Route' },
    { id: 'billing_issue', label: 'Billing' },
    { id: 'refund_request', label: 'Refund' },
    { id: 'sos', label: 'SOS' }
];

const ISSUE_STATUS_META = {
    open: { label: 'Open', className: 'bg-red-500 text-white' },
    investigating: { label: 'Checking', className: 'bg-[#F59E0B] text-black' },
    resolved: { label: 'Solved', className: 'bg-emerald-500 text-white' },
    dismissed: { label: 'Closed', className: 'bg-white/10 text-white/40' }
};

const SpareDriverSupport = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [searchParams] = useSearchParams();
    const [expandedFaq, setExpandedFaq] = useState(0);
    const [selectedIssueType, setSelectedIssueType] = useState('driver_late');
    const [issueDescription, setIssueDescription] = useState('');
    const [submittingIssue, setSubmittingIssue] = useState(false);
    const [supportBooking, setSupportBooking] = useState(null);
    const [loadingBooking, setLoadingBooking] = useState(false);
    const activeBookingId = useMemo(() => sessionStorage.getItem('chauffeur_active_booking_id'), []);
    const bookingIdFromHistory = searchParams.get('bookingId');
    const supportBookingId = activeBookingId || bookingIdFromHistory;

    useEffect(() => {
        if (!supportBookingId) return;
        let isMounted = true;
        const fetchBookingContext = async () => {
            setLoadingBooking(true);
            try {
                const response = await bookingAPI.getBooking(supportBookingId);
                if (isMounted) setSupportBooking(response?.data?.booking || null);
            } catch (error) {
                if (isMounted) setSupportBooking(null);
            } finally {
                if (isMounted) setLoadingBooking(false);
            }
        };
        fetchBookingContext();
        return () => { isMounted = false; };
    }, [supportBookingId]);

    const handleAction = (actionId) => {
        if (actionId === 'billing') navigate('/spare-driver/history');
        else if (actionId === 'safety') navigate(supportBookingId ? '/spare-driver' : '/spare-driver/history');
    };

    const handleSubmitIssue = async () => {
        if (!issueDescription.trim()) {
            toast.error('Enter description');
            return;
        }

        setSubmittingIssue(true);
        try {
            if (supportBookingId) {
                // Booking-specific issue (uses different endpoint/logic)
                await bookingAPI.reportIssue(supportBookingId, {
                    type: selectedIssueType.toUpperCase(),
                    description: issueDescription.trim()
                });
                toast.success('Issue reported for this trip');
            } else {
                // General support ticket (must match backend SupportTicket model enums)
                const categoryMap = {
                    'driver_late': 'TRIP_ISSUE',
                    'driver_behavior': 'TRIP_ISSUE',
                    'route_concern': 'TRIP_ISSUE',
                    'billing_issue': 'PAYMENT_WALLET',
                    'refund_request': 'PAYMENT_WALLET',
                    'sos': 'SAFETY_SOS'
                };

                await supportAPI.createTicket({
                    subject: `Support Request: ${selectedIssueType.toUpperCase()}`,
                    description: issueDescription.trim(),
                    category: categoryMap[selectedIssueType] || 'OTHER'
                });
                toast.success('Support ticket created');
            }
            setIssueDescription('');
        } catch (error) {
            console.error('Support submission error:', error);
            toast.error(error?.message || 'Failed to submit request');
        } finally {
            setSubmittingIssue(false);
        }
    };

    return (
        <MobileLayout>
            <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                <header className={`px-4 py-4 sticky top-0 z-[60] border-b backdrop-blur-xl flex items-center justify-between ${
                    isDarkMode ? 'bg-[#0A0F0D]/80 border-white/05' : 'bg-white/80 border-black/10'
                }`}>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
                            isDarkMode ? 'bg-white/5' : 'bg-black/5'
                        }`}>
                            <ChevronLeft size={20} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
                        </button>
                        <h1 className={`text-[17px] font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Support desk</h1>
                    </div>
                </header>

                <div className="px-4 pb-24 pt-4 space-y-3">
                    <div className="bg-[#0F172A] rounded-3xl p-4 flex items-center gap-4 relative overflow-hidden shadow-2xl border border-white/5">
                        <div className="w-10 h-10 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center text-[#F59E0B] shrink-0">
                            <MessageSquare size={20} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-black text-white uppercase tracking-tight">Live help desk</h2>
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">24/7 Driver Support</p>
                        </div>
                    </div>

                    {supportBookingId && (
                        <div className={`rounded-2xl p-3 border flex items-center justify-between transition-all ${
                            isDarkMode ? 'bg-white/[0.03] border-white/05' : 'bg-white border-black/05 shadow-sm'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#F59E0B] flex items-center justify-center text-black font-black text-[10px]">#</div>
                                <div>
                                    <p className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Trip Context</p>
                                    <p className={`text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>Booking ID: {supportBookingId.slice(-6)}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isDarkMode ? 'bg-white/10 text-[#F59E0B]' : 'bg-black text-[#F59E0B]'}`}>
                                {loadingBooking ? 'Syncing...' : (supportBooking?.status || 'Active')}
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-2">
                        {SUPPORT_ACTIONS.map((action) => (
                            <button key={action.id} onClick={() => handleAction(action.id)}
                                className={`rounded-2xl p-3 flex items-center gap-4 border transition-all ${
                                    isDarkMode ? 'bg-white/[0.03] border-white/05 active:bg-white/5' : 'bg-white border-black/05 active:bg-gray-50 shadow-sm'
                                }`}>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                    <action.icon size={18} style={{ color: action.color }} strokeWidth={3} />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className={`text-[11px] font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{action.title}</h3>
                                    <p className={`text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>{action.desc}</p>
                                </div>
                                <ChevronRight size={14} className={isDarkMode ? 'text-white/20' : 'text-black/20'} />
                            </button>
                        ))}
                    </div>

                    {/* REPORTER */}
                    <div className={`rounded-[2rem] p-5 border space-y-3 transition-all ${
                        isDarkMode ? 'bg-white/[0.02] border-white/05' : 'bg-white border-black/05 shadow-sm'
                    }`}>
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="text-[#F59E0B]" />
                            <h3 className={`text-[11px] font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Issue reporter</h3>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {ISSUE_OPTIONS.map((type) => (
                                <button key={type.id} onClick={() => setSelectedIssueType(type.id)}
                                    className={`px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${
                                        selectedIssueType === type.id 
                                            ? 'bg-[#F59E0B] text-black border-[#F59E0B] shadow-lg shadow-[#F59E0B]/20' 
                                            : (isDarkMode ? 'bg-white/5 border-white/10 text-white/40' : 'bg-black/5 border-black/05 text-black/40')
                                    }`}>
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <textarea 
                            rows={3} 
                            value={issueDescription} 
                            onChange={(e) => setIssueDescription(e.target.value)}
                            placeholder={supportBookingId ? "Describe the issue with this trip..." : "Describe your problem or question..."} 
                            disabled={submittingIssue}
                            className={`w-full rounded-2xl px-4 py-3 text-[11px] font-bold outline-none transition-all resize-none border ${
                                isDarkMode ? 'bg-white/[0.03] border-white/10 text-white focus:border-[#F59E0B]/40' : 'bg-black/[0.02] border-black/10 text-slate-900 focus:border-[#F59E0B]/40'
                            }`}
                        />

                        <button 
                            onClick={handleSubmitIssue} 
                            disabled={submittingIssue}
                            className={`w-full h-13 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl ${
                                selectedIssueType === 'sos' ? 'bg-red-600 text-white shadow-red-500/20' : (isDarkMode ? 'bg-white text-black' : 'bg-[#0F172A] text-white')
                            } active:scale-95 disabled:opacity-20`}>
                            {submittingIssue ? 'Sending...' : (supportBookingId ? 'Report Concern' : 'Submit Ticket')}
                        </button>
                    </div>

                    {/* STATUS TIMELINE */}
                    {supportBooking?.issues?.length > 0 && (
                        <div className={`rounded-3xl p-4 border space-y-3 transition-all ${
                            isDarkMode ? 'bg-white/[0.01] border-white/05' : 'bg-gray-50 border-black/05 shadow-inner'
                        }`}>
                            <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Previous logs</p>
                            <div className="space-y-2">
                                {supportBooking.issues.slice(-2).reverse().map((issue, i) => {
                                    const meta = ISSUE_STATUS_META[issue.status] || ISSUE_STATUS_META.open;
                                    return (
                                        <div key={i} className={`p-3 rounded-2xl border flex flex-col gap-1 ${
                                            isDarkMode ? 'bg-black/40 border-white/05' : 'bg-white border-black/05'
                                        }`}>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-[10px] font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{issue.type}</span>
                                                <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${meta.className}`}>{meta.label}</span>
                                            </div>
                                            <p className={`text-[9px] font-medium leading-tight truncate ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>{issue.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* QUICK ACTION GRID */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => window.location.href = 'tel:112'}
                            className={`rounded-2xl px-4 py-4 text-left border transition-all active:scale-[0.98] ${
                                isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200 shadow-sm'
                            }`}>
                            <Phone size={18} className="text-red-500 mb-2" />
                            <p className={`text-[11px] font-black uppercase ${isDarkMode ? 'text-red-500' : 'text-red-600'}`}>Emergency</p>
                            <p className={`text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-red-500/40' : 'text-red-900/40'}`}>Call 112</p>
                        </button>

                        <button onClick={() => navigate(supportBookingId ? `/spare-driver/history?bookingId=${supportBookingId}` : '/spare-driver/history')}
                            className={`rounded-2xl px-4 py-4 text-left border transition-all active:scale-[0.98] ${
                                isDarkMode ? 'bg-white/5 border-white/05' : 'bg-white border-black/05 shadow-sm'
                            }`}>
                            <Clock size={18} className="text-[#F59E0B] mb-2" />
                            <p className={`text-[11px] font-black uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>History</p>
                            <p className={`text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-black/30'}`}>Old Trips</p>
                        </button>
                    </div>

                    {/* FAQ */}
                    <div className="pt-2 space-y-2">
                        <p className={`text-[8px] font-black uppercase tracking-[0.3em] text-center mb-3 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Support repository</p>
                        {FAQS.map((faq, index) => {
                            const open = expandedFaq === index;
                            return (
                                <button key={index} onClick={() => setExpandedFaq(open ? -1 : index)}
                                    className={`w-full p-3 rounded-2xl border text-left transition-all ${
                                        isDarkMode ? 'bg-white/[0.02] border-white/05' : 'bg-white border-black/05 shadow-sm'
                                    }`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`text-[10px] font-black uppercase tracking-tight ${isDarkMode ? 'text-white/60' : 'text-slate-700'}`}>{faq.question}</span>
                                        <ChevronDown size={14} className={`transition-all ${open ? 'rotate-180 text-[#F59E0B]' : 'text-white/20'}`} />
                                    </div>
                                    {open && (
                                        <p className={`mt-2 text-[10px] font-bold leading-relaxed transition-all ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>
                                            {faq.answer}
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default SpareDriverSupport;
