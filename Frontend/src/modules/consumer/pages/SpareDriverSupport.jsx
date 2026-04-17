import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
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
                <Header title="Chauffeur support" showBack={true} />

                <div className="p-5 space-y-6">
                    <div className="bg-brand/5 rounded-[2.5rem] p-6 border border-brand/20 relative overflow-hidden text-center flex flex-col items-center">
                        <div className="absolute top-0 right-0 w-32 h-full bg-brand/10 skew-x-[-15deg]" />
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand mb-4 shadow-xl border border-brand/10">
                            <MessageSquare size={24} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-[20px] font-black text-black uppercase tracking-tight leading-none mb-1">Live help desk</h2>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Use the fastest route based on your issue</p>
                    </div>

                    {supportBookingId && (
                        <div className="border border-[#F29F05]/25 bg-[#FFFBF0] rounded-3xl p-4 flex items-start gap-3">
                            <AlertTriangle size={18} className="text-[#F29F05] shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">
                                    {activeBookingId ? 'Active booking' : 'History booking'}
                                </p>
                                <p className="text-[11px] font-black text-black uppercase mt-1">
                                    Support linked to booking {supportBookingId.slice(-8)}
                                </p>
                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-1 rounded-md bg-black text-white text-[8px] font-black uppercase tracking-widest">
                                        {loadingBooking ? 'Loading trip...' : getSupportStatusLabel(supportBooking?.status)}
                                    </span>
                                    {supportBooking?.payment?.status && (
                                        <span className="px-2 py-1 rounded-md bg-gray-100 text-black/60 text-[8px] font-black uppercase tracking-widest">
                                            Payment {supportBooking.payment.status}
                                        </span>
                                    )}
                                    {supportBooking?.service?.name && (
                                        <span className="px-2 py-1 rounded-md bg-brand/10 text-brand text-[8px] font-black uppercase tracking-widest">
                                            {supportBooking.service.name}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => navigate(activeBookingId ? '/spare-driver' : '/spare-driver/history')}
                                    className="mt-3 text-[9px] font-black text-[#F29F05] uppercase tracking-widest inline-flex items-center gap-1"
                                >
                                    {activeBookingId ? 'Return to active trip' : 'Back to history'}
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {SUPPORT_ACTIONS.map((action) => (
                            <motion.button
                                key={action.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAction(action.id)}
                                className="bg-white border border-gray-100 rounded-3xl p-5 text-left shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-5 group"
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-gray-50 group-hover:scale-110">
                                    <action.icon size={22} style={{ color: action.color }} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[14px] font-black text-black uppercase tracking-tight mb-1">{action.title}</h3>
                                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest leading-none">{action.desc}</p>
                                    <span className="inline-flex items-center gap-1 mt-3 text-[9px] font-black uppercase tracking-widest text-[#F29F05]">
                                        {action.cta}
                                        <ArrowRight size={12} />
                                    </span>
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
                        <div>
                            <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Issue reporter</p>
                            <h3 className="text-[15px] font-black text-black uppercase tracking-tight mt-1">
                                {supportBookingId ? 'Report spare driver issue to admin' : 'Issue reporting needs a trip context'}
                            </h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {ISSUE_OPTIONS.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedIssueType(type.id)}
                                    className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-colors ${selectedIssueType === type.id ? 'bg-black text-white border-black' : 'bg-gray-50 text-black/60 border-gray-100'}`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <div className="rounded-2xl border border-black/[0.05] bg-gray-50/70 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Support hint</p>
                                    <p className="text-[11px] font-black text-black uppercase mt-1">{selectedIssueMeta.hint}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${
                                    selectedIssueMeta.priority === 'Critical'
                                        ? 'bg-red-100 text-red-600'
                                        : selectedIssueMeta.priority === 'Urgent'
                                            ? 'bg-orange-100 text-orange-600'
                                            : selectedIssueMeta.priority === 'High'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-blue-100 text-blue-600'
                                }`}>
                                    {selectedIssueMeta.priority}
                                </span>
                            </div>
                        </div>

                        <textarea
                            rows={4}
                            value={issueDescription}
                            onChange={(event) => setIssueDescription(event.target.value)}
                            placeholder={supportBookingId ? 'Explain what happened so admin can take action quickly...' : 'Start or open a spare driver trip to report an issue'}
                            disabled={!supportBookingId || submittingIssue}
                            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-[12px] font-bold text-black resize-none outline-none focus:border-black disabled:bg-gray-50 disabled:text-black/30"
                        />

                        <button
                            onClick={handleSubmitIssue}
                            disabled={!supportBookingId || submittingIssue}
                            className="w-full bg-black text-white h-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] disabled:opacity-40"
                        >
                            {submittingIssue ? 'Sending...' : (selectedIssueType === 'sos' ? 'Send SOS alert' : 'Submit support issue')}
                        </button>
                    </div>

                    {supportBooking?.issues?.length > 0 && (
                        <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Support timeline</p>
                                <h3 className="text-[15px] font-black text-black uppercase tracking-tight mt-1">
                                    Latest trip issues and admin status
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
                            className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-left"
                        >
                            <Phone size={18} className="text-red-600 mb-3" />
                            <p className="text-[10px] font-black text-black uppercase tracking-widest">Emergency</p>
                            <p className="text-[13px] font-black text-red-600 mt-1">Call 112</p>
                        </button>

                        <button
                            onClick={() => navigate(supportBookingId ? `/spare-driver/history?bookingId=${supportBookingId}` : '/spare-driver/history')}
                            className="rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left"
                        >
                            <Clock size={18} className="text-[#F29F05] mb-3" />
                            <p className="text-[10px] font-black text-black uppercase tracking-widest">Past trips</p>
                            <p className="text-[13px] font-black text-black mt-1">Open history</p>
                        </button>
                    </div>

                    <div className="pt-8 border-t border-black/[0.03] space-y-4">
                        <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em] text-center">Frequently asked questions</p>
                        {FAQS.map((faq, index) => {
                            const open = expandedFaq === index;
                            return (
                                <button
                                    key={faq.question}
                                    onClick={() => setExpandedFaq(open ? -1 : index)}
                                    className="w-full bg-gray-50 p-4 rounded-xl border border-black/[0.02] text-left"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-[11px] font-black text-black/60 uppercase">{faq.question}</span>
                                        <ChevronDown size={14} className={`text-black/20 transition-transform ${open ? 'rotate-180' : ''}`} />
                                    </div>
                                    {open && (
                                        <p className="mt-3 text-[11px] font-bold text-black/55 leading-relaxed normal-case">
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
