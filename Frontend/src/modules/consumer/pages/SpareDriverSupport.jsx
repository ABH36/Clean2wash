import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
    ChevronDown
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { bookingAPI } from '../../../utils/api';
import { toast } from 'react-hot-toast';
import Header from '../../../components/common/Header';

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
        answer: 'If a driver cancels before the trip starts, the app will continue looking for another available driver. If a refund is needed, it is handled through the booking payment flow.'
    }
];

const SUPPORT_ACTIONS = [
    {
        id: 'billing',
        title: 'Billing issue',
        icon: Wallet,
        color: '#3B82F6',
        desc: 'Review payment, extension, or fare related issues',
        cta: 'Open trip history'
    },
    {
        id: 'safety',
        title: 'Safety concerns',
        icon: Shield,
        color: '#EF4444',
        desc: 'Escalate unsafe behavior or urgent travel concerns',
        cta: 'Open active trip'
    },
    {
        id: 'emergency',
        title: 'Emergency contact',
        icon: Phone,
        color: '#10B981',
        desc: 'Call emergency services immediately during an active trip',
        cta: 'Call 112'
    }
];

const ISSUE_OPTIONS = [
    { id: 'driver_late', label: 'Driver late', hint: 'Driver delayed or not moving toward pickup', priority: 'High' },
    { id: 'driver_behavior', label: 'Driver behavior', hint: 'Unprofessional or unsafe interaction', priority: 'High' },
    { id: 'route_concern', label: 'Route concern', hint: 'Wrong route, unnecessary detour, or confusion', priority: 'Medium' },
    { id: 'billing_issue', label: 'Billing issue', hint: 'Fare, surcharge, or payment mismatch', priority: 'Urgent' },
    { id: 'refund_request', label: 'Refund request', hint: 'Need a refund review after cancellation or trip failure', priority: 'Urgent' },
    { id: 'sos', label: 'SOS', hint: 'Emergency help required right now', priority: 'Critical' }
];

const ISSUE_TYPE_LABEL_MAP = ISSUE_OPTIONS.reduce((acc, issue) => {
    acc[issue.id] = issue.label;
    return acc;
}, {});

const ISSUE_STATUS_META = {
    open: { label: 'Open', className: 'bg-red-50 text-red-600' },
    investigating: { label: 'Investigating', className: 'bg-yellow-50 text-yellow-700' },
    resolved: { label: 'Resolved', className: 'bg-green-50 text-green-700' },
    dismissed: { label: 'Dismissed', className: 'bg-gray-100 text-gray-600' }
};

const getSupportStatusLabel = (status = '') => {
    if (!status) return 'Trip selected';
    return status.replace(/_/g, ' ');
};

const SpareDriverSupport = () => {
    const navigate = useNavigate();
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
    const selectedIssueMeta = ISSUE_OPTIONS.find((issue) => issue.id === selectedIssueType) || ISSUE_OPTIONS[0];

    useEffect(() => {
        if (!supportBookingId) {
            setSupportBooking(null);
            return;
        }

        let isMounted = true;

        const fetchBookingContext = async () => {
            setLoadingBooking(true);
            try {
                const response = await bookingAPI.getBooking(supportBookingId);
                if (isMounted) {
                    setSupportBooking(response?.data?.booking || null);
                }
            } catch (error) {
                if (isMounted) {
                    setSupportBooking(null);
                }
            } finally {
                if (isMounted) {
                    setLoadingBooking(false);
                }
            }
        };

        fetchBookingContext();
        return () => {
            isMounted = false;
        };
    }, [supportBookingId]);

    const handleAction = (actionId) => {
        if (actionId === 'billing') {
            navigate(supportBookingId ? `/spare-driver/history?bookingId=${supportBookingId}` : '/spare-driver/history');
            return;
        }

        if (actionId === 'safety') {
            if (supportBookingId) {
                navigate('/spare-driver');
            } else {
                navigate('/spare-driver/history');
            }
            return;
        }

        if (actionId === 'emergency') {
            window.location.href = 'tel:112';
        }
    };

    const handleSubmitIssue = async () => {
        if (!supportBookingId) {
            toast.error('No spare driver trip selected for support');
            return;
        }

        if (!issueDescription.trim()) {
            toast.error('Please describe the issue first');
            return;
        }

        setSubmittingIssue(true);
        try {
            await bookingAPI.reportIssue(supportBookingId, {
                type: selectedIssueType === 'sos' ? 'SOS' : ISSUE_TYPE_LABEL_MAP[selectedIssueType],
                description: issueDescription.trim()
            });
            toast.success(selectedIssueType === 'sos' ? 'SOS alert sent to admin' : 'Issue reported to support');
            setSupportBooking((current) => {
                if (!current) return current;
                const nextIssue = {
                    _id: `tmp-${Date.now()}`,
                    type: selectedIssueType === 'sos' ? 'SOS' : ISSUE_TYPE_LABEL_MAP[selectedIssueType],
                    description: issueDescription.trim(),
                    status: 'open',
                    reportedAt: new Date().toISOString()
                };

                return {
                    ...current,
                    issues: [...(current.issues || []), nextIssue]
                };
            });
            setIssueDescription('');
        } catch (error) {
            toast.error(error.message || 'Could not report this issue');
        } finally {
            setSubmittingIssue(false);
        }
    };

    return (
        <MobileLayout>
            <div className="min-h-screen bg-white flex flex-col">
                <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-[60] border-b border-gray-100 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center active:scale-95 transition-all">
                            <ChevronLeft size={18} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[17px] font-[1000] text-slate-900 tracking-tighter uppercase leading-none">Support Desk</h1>
                        </div>
                    </div>
                </header>

                <div className="px-4 pb-24 space-y-4 pt-4">
                    <div className="bg-[#FF9900]/05 rounded-[22px] p-5 border border-[#FF9900]/15 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-full bg-[#FF9900]/05 skew-x-[-15deg] group-hover:bg-[#FF9900]/10 transition-colors" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#FF9900] shadow-md border border-[#FF9900]/10">
                                <MessageSquare size={18} strokeWidth={3} />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-[1000] text-black uppercase tracking-tight leading-none mb-1">Live Help Desk</h2>
                                <p className="text-[8px] font-black text-black/30 uppercase tracking-[0.2em]">24/7 Driver Support Center</p>
                            </div>
                        </div>
                    </div>

                    {supportBookingId && (
                        <div className="border border-[#FF9900]/20 bg-slate-50/50 rounded-[22px] p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#FF9900] flex items-center justify-center shrink-0">
                                <AlertTriangle size={14} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-black uppercase tracking-tight">Active Ticket Context</p>
                                <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest mt-0.5">Booking #{supportBookingId.slice(-8)}</p>
                                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                                    <span className="px-2 py-1 rounded-md bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest">
                                        {loadingBooking ? 'SYNCING...' : (getSupportStatusLabel(supportBooking?.status) || 'PENDING')}
                                    </span>
                                    <span className="px-2 py-1 rounded-md bg-[#FF9900]/10 text-[#FF9900] text-[8px] font-black uppercase tracking-widest">
                                        Support Ready
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                        {SUPPORT_ACTIONS.map((action) => (
                            <motion.button
                                key={action.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAction(action.id)}
                                className="bg-white border border-gray-100 rounded-[22px] p-x4 py-4 text-left flex items-center gap-4 group active:bg-gray-50 transition-all shadow-sm"
                            >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-slate-50 border border-slate-100">
                                    <action.icon size={18} style={{ color: action.color }} strokeWidth={3} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[12px] font-[1000] text-black uppercase tracking-tight">{action.title}</h3>
                                    <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest mt-0.5">{action.desc}</p>
                                </div>
                                <ChevronRight size={14} className="text-slate-200" />
                            </motion.button>
                        ))}
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm space-y-4">
                        <div>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Issue Reporter</p>
                            <h3 className="text-[13px] font-[1000] text-slate-900 uppercase">Describe your concern</h3>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {ISSUE_OPTIONS.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedIssueType(type.id)}
                                    className={`px-3 py-2 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all ${selectedIssueType === type.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <textarea
                            rows={3}
                            value={issueDescription}
                            onChange={(event) => setIssueDescription(event.target.value)}
                            placeholder="Explain the issue for quick support..."
                            disabled={!supportBookingId || submittingIssue}
                            className="w-full border border-slate-100 bg-slate-50/50 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-900 resize-none outline-none focus:border-[#FF9900]/30 transition-all placeholder:text-slate-300"
                        />

                        <button
                            onClick={handleSubmitIssue}
                            disabled={!supportBookingId || submittingIssue}
                            className={`w-full h-12 rounded-xl font-[1000] text-[11px] uppercase tracking-widest transition-all shadow-xl ${
                                selectedIssueType === 'sos' 
                                    ? 'bg-red-600 text-white shadow-red-200' 
                                    : 'bg-slate-900 text-white'
                            } disabled:opacity-30`}
                        >
                            {submittingIssue ? 'Sending...' : (selectedIssueType === 'sos' ? 'Send SOS alert' : 'Submit feedback')}
                        </button>
                    </div>

                    {supportBooking?.issues?.length > 0 && (
                        <div className="bg-white border border-gray-100 rounded-[22px] p-5 shadow-sm space-y-4">
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Support timeline</p>
                                <h3 className="text-[13px] font-black text-black uppercase tracking-tight mt-1">
                                    Active Ticket Status
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {[...supportBooking.issues].slice(-3).reverse().map((issue) => {
                                    const statusMeta = ISSUE_STATUS_META[issue.status] || ISSUE_STATUS_META.open;
                                    return (
                                        <div key={issue._id || `${issue.type}-${issue.reportedAt}`} className="rounded-2xl border border-black/[0.05] bg-gray-50/70 px-4 py-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-black uppercase">{issue.type || 'Support Issue'}</p>
                                                    <p className="text-[10px] font-bold text-black/50 leading-relaxed">
                                                        {issue.description || 'No description shared'}
                                                    </p>
                                                    <p className="text-[8px] font-black text-black/20 uppercase tracking-widest">
                                                        {issue.reportedAt ? new Date(issue.reportedAt).toLocaleString('en-IN') : 'Just now'}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${statusMeta.className}`}>
                                                    {statusMeta.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => window.location.href = 'tel:112'}
                            className="rounded-[22px] border border-red-50 bg-red-50/50 px-4 py-4 text-left transition-all active:scale-[0.98]"
                        >
                            <Phone size={18} className="text-red-600 mb-2" />
                            <p className="text-[11px] font-[1000] text-red-600 uppercase">Emergency</p>
                            <p className="text-[8px] font-bold text-red-900/40 uppercase tracking-widest">Call 112</p>
                        </button>

                        <button
                            onClick={() => navigate(supportBookingId ? `/spare-driver/history?bookingId=${supportBookingId}` : '/spare-driver/history')}
                            className="rounded-[22px] border border-slate-100 bg-white px-4 py-4 text-left transition-all active:scale-[0.98] shadow-sm"
                        >
                            <Clock size={18} className="text-[#FF9900] mb-2" />
                            <p className="text-[11px] font-[1000] text-slate-900 uppercase">History</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Old Trips</p>
                        </button>
                    </div>

                    <div className="pt-4 border-t border-black/[0.03] space-y-3">
                        <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] text-center">Frequently asked questions</p>
                        {FAQS.map((faq, index) => {
                            const open = expandedFaq === index;
                            return (
                                <button
                                    key={faq.question}
                                    onClick={() => setExpandedFaq(open ? -1 : index)}
                                    className="w-full bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-left transition-all active:bg-slate-100"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{faq.question}</span>
                                        <ChevronDown size={12} className={`text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
                                    </div>
                                    {open && (
                                        <p className="mt-2 text-[10px] font-bold text-slate-400 leading-relaxed">
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
