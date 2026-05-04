import React, { useState, useEffect } from 'react';
import { 
    RefreshCcw, Search, Filter, ArrowUpRight, 
    Download, AlertCircle, CheckCircle2, XCircle,
    ChevronRight, Clock, Wallet, User, MessageSquare, X
} from 'lucide-react';
import { adminAPI } from '../../../../utils/adminApi';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ─── ADMIN REFUNDS MANAGER (PHASE 5 WIRING) ──────────────────────────
 * Handles approval and rejection of customer refund requests.
 */

const AdminRefunds = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [adminNote, setAdminNote] = useState('');

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getRefundRequests();
            if (res.status === 'success') {
                setRefunds(res.data.bookings || []);
            }
        } catch (err) {
            toast.error("Failed to fetch refund queue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRefunds(); }, []);

    const handleProcessRefund = async (action) => {
        if (!selectedRefund) return;
        try {
            setProcessing(true);
            const res = await adminAPI.processRefund(selectedRefund._id, action, adminNote);
            if (res.status === 'success') {
                toast.success(`Refund request ${action}ed successfully`);
                setSelectedRefund(null);
                setAdminNote('');
                fetchRefunds();
            }
        } catch (err) {
            toast.error(err.message || "Action failed");
        } finally {
            setProcessing(false);
        }
    };

    const filteredRefunds = refunds.filter(r => 
        r.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.consumer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Refund Requests</h1>
                    <p className="text-xs font-medium text-slate-400 mt-1">Manage and process customer refund requests.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchRefunds} className="bg-white border border-slate-100 text-slate-600 p-2 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="bg-white border border-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-500"><Clock size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Refunds</p>
                        <h3 className="text-xl font-black text-slate-800">{refunds.length}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-500"><CheckCircle2 size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</p>
                        <h3 className="text-xl font-black text-slate-800">₹{refunds.reduce((acc, curr) => acc + (curr.pricing?.totalAmount || 0), 0).toLocaleString()}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-500"><AlertCircle size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgent</p>
                        <h3 className="text-xl font-black text-slate-800">0</h3>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-full md:w-80">
                        <Search size={16} className="text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by Booking ID or Name..." 
                            className="bg-transparent outline-none text-xs font-medium text-slate-700 w-full" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="p-2 border border-slate-100 rounded-lg text-slate-500 hover:bg-slate-50"><Filter size={18} /></button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking ID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRefunds.length > 0 ? filteredRefunds.map(refund => (
                                <tr key={refund._id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-black text-slate-800 uppercase">#{refund.bookingId}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                <User size={12} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-800">{refund.consumer?.name || 'N/A'}</p>
                                                <p className="text-[9px] font-medium text-slate-400">{refund.consumer?.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-black text-slate-800">₹{refund.pricing?.totalAmount}</span>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-bold text-slate-500">
                                        {new Date(refund.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{refund.payment?.method}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setSelectedRefund(refund)}
                                            className="text-[10px] font-black uppercase text-amber-600 hover:text-amber-700 underline tracking-widest"
                                        >
                                            Process
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center opacity-40">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCcw size={48} className={`text-slate-200 ${loading ? 'animate-spin' : ''}`} />
                                            <p className="text-xs font-black text-slate-400 uppercase">No active refund requests found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Process Refund Modal */}
            <AnimatePresence>
                {selectedRefund && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedRefund(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Process Refund</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Booking #{selectedRefund.bookingId}</p>
                                </div>
                                <button onClick={() => setSelectedRefund(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Refund Amount</span>
                                        <span className="text-lg font-black text-slate-800">₹{selectedRefund.pricing?.totalAmount}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Wallet size={16} />
                                        <span className="text-[11px] font-bold">Via {selectedRefund.payment?.method} ({selectedRefund.payment?.transactionId || 'Direct'})</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Internal Admin Note</label>
                                    <textarea 
                                        rows="3" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-400" 
                                        placeholder="Reason for approval/rejection..."
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <button 
                                        onClick={() => handleProcessRefund('reject')}
                                        disabled={processing}
                                        className="w-full bg-white border-2 border-slate-100 text-slate-400 py-3 rounded-xl font-black uppercase tracking-widest hover:border-rose-200 hover:text-rose-500 transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        onClick={() => handleProcessRefund('approve')}
                                        disabled={processing}
                                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                                    >
                                        {processing ? <RefreshCcw size={16} className="animate-spin" /> : 'Approve Refund'}
                                    </button>
                                </div>
                                <p className="text-[9px] text-center text-slate-400 font-medium px-4">
                                    * Approving this refund will automatically credit the amount back to the customer's wallet or initiate a gateway reversal.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminRefunds;
