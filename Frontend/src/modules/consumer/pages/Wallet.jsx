import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Zap, Plus, ArrowDownLeft, ArrowUpRight, Gift, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { walletAPI, referralAPI } from '../../../utils/api';

const MOCK_TRANSACTIONS = [
    { id: 'TXN001', type: 'credit', title: 'CarWash — Wallet Refill', sub: 'Added to wallet', amount: '+₹1,000', date: 'Yesterday, 10:15 AM', status: 'success' },
    { id: 'TXN002', type: 'credit', title: 'Cashback — CarWashFIRST', sub: 'Wash #CarWash-7761', amount: '+₹299', date: 'Feb 18, 2:45 PM', status: 'success' },
    { id: 'TXN004', type: 'debit', title: 'Full Deep Clean', sub: 'Paid via HDFC Card', amount: '-₹1,199', date: 'Feb 18, 10:15 AM', status: 'success' },
    { id: 'TXN005', type: 'credit', title: 'Refund Processed', sub: 'Cancelled #6490', amount: '+₹199', date: 'Feb 15, 3:00 PM', status: 'success' },
    { id: 'TXN006', type: 'debit', title: 'Add Money', sub: 'Via PhonePe', amount: '-₹500', date: 'Feb 14, 7:30 PM', status: 'pending' },
];

const QUICK_AMOUNTS = [100, 250, 500, 1000];

const Wallet = () => {
    const navigate = useNavigate();
    const { walletBalance, updateWalletBalance, getUser, getRazorpayKey } = useAuth();
    const user = getUser('consumer');
    const [addMode, setAddMode] = useState(false);
    const [withdrawMode, setWithdrawMode] = useState(false);
    const [selectedAmt, setSelectedAmt] = useState(null);
    const [withdrawAmt, setWithdrawAmt] = useState('');
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState('');
    const [referralStats, setReferralStats] = useState(null);
    const [walletSummary, setWalletSummary] = useState({
        availableBalance: 0,
        heldBalance: 0,
        totalBalance: 0
    });

    // ⚡ Razorpay SDK Lifecycle: Dynamic Loader
    useEffect(() => {
        const scriptId = 'razorpay-checkout-js';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
        }
        
        if (user?.token) {
            fetchWalletData();
            fetchReferralStats();
        }
    }, [user?.token]);

    const fetchReferralStats = async () => {
        try {
            const res = await referralAPI.getStats();
            if (res.status === 'success') {
                setReferralStats(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch referral stats in Wallet:', err);
        }
    };

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const response = await walletAPI.getBalance();
            if (response.status === 'success') {
                const { wallet, transactions } = response.data;
                setTransactions(transactions || []);
                setWalletSummary({
                    availableBalance: wallet.availableBalance ?? wallet.balance ?? 0,
                    heldBalance: wallet.heldBalance ?? 0,
                    totalBalance: wallet.totalBalance ?? ((wallet.availableBalance ?? wallet.balance ?? 0) + (wallet.heldBalance ?? 0))
                });

                // Absolute sync with global state to prevent fluctuations
                updateWalletBalance(wallet.availableBalance ?? wallet.balance ?? 0);
            }
        } catch (err) {
            console.error('Failed to fetch wallet data:', err);
            setError('Failed to load wallet data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMoney = async () => {
        if (!selectedAmt) return;

        try {
            setLoading(true);
            setError('');

            // 1. Get Razorpay Key
            const keyRes = await getRazorpayKey();
            const key_id = keyRes?.data?.key_id;

            if (!key_id) {
                throw new Error("Payment gateway key missing. Please contact support.");
            }

            // 2. Create Wallet Order
            const orderRes = await walletAPI.createOrder(Number(selectedAmt));
            if (orderRes.status !== 'success') throw new Error('Failed to initiate recharge order');
            const { order_id, amount: orderAmount, currency } = orderRes.data;

            // 3. Razorpay Options
            const options = {
                key: key_id,
                amount: orderAmount,
                currency: currency,
                name: 'Clean-2-Wash',
                description: `Wallet Top-up: ₹${selectedAmt}`,
                image: 'https://cdn-icons-png.flaticon.com/512/3003/3003984.png', // Public URL to avoid localhost loopback CORS issues
                order_id: order_id,
                handler: async (response) => {
                    try {
                        setLoading(true);
                        // 4. Verify Payment in Backend
                        const verifyRes = await walletAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.status === 'success') {
                            setSelectedAmt(null);
                            setAddMode(false);
                            await fetchWalletData();
                        }
                    } catch (err) {
                        const serverStep = err?.data?.errorStep ? ` (step: ${err.data.errorStep})` : '';
                        const detailed = err?.data?.error || err?.message;
                        setError((detailed ? `${detailed}${serverStep}` : `Payment verification failed${serverStep}.`) + ' If amount was deducted, it will reflect in 24h.');
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || ''
                },
                theme: {
                    color: '#FF6B00'
                },
                modal: {
                    ondismiss: () => setLoading(false)
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            console.error('Wallet recharge error:', err);
            setError(err.message || 'Payment failed to initiate');
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawAmt || Number(withdrawAmt) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (Number(withdrawAmt) > walletBalance) {
            setError('Insufficient balance');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await walletAPI.withdraw(Number(withdrawAmt));

            if (response.status === 'success') {
                setWithdrawAmt('');
                setWithdrawMode(false);
                await fetchWalletData();
            }
        } catch (err) {
            console.error('Withdrawal failed:', err);
            setError(err.message || 'Withdrawal failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-5 pt-10 pb-4 flex items-center gap-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center active:scale-95 transition-transform">
                    <ChevronLeft size={22} strokeWidth={3} className="text-content" />
                </button>
                <div>
                    <h1 className="text-xl font-[1000] tracking-tight text-slate-900 leading-none">CarWash Wallet</h1>
                    <p className="text-[10px] text-brand font-black uppercase tracking-widest mt-1">Balance & History</p>
                </div>
            </header>

            <div className="px-4 pb-24 space-y-4 pt-4">

                {/* ── Balance Card ── */}
                <div className="bg-content rounded-2xl p-5 relative overflow-hidden border border-white/5 shadow-2xl">
                    <div className="relative z-10">
                        <p className="text-white/40 text-[10px] font-[900] uppercase tracking-widest mb-2">Available Balance</p>
                        <h2 className="text-4xl font-extrabold text-white tracking-tighter leading-none mb-2">₹{walletBalance.toLocaleString()}</h2>
                        <p className="text-white/30 text-[9px] font-bold mb-4">Held reserve: ₹{(walletSummary.heldBalance || 0).toLocaleString()} · Total funds: ₹{(walletSummary.totalBalance || walletBalance).toLocaleString()}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setAddMode(true)}
                                className="flex-1 bg-brand text-white h-11 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98] transition-all">
                                <Plus size={18} strokeWidth={3} /> Add Money
                            </button>
                            <button onClick={() => setWithdrawMode(true)}
                                className="flex-1 bg-white/10 text-white h-11 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 border border-white/10 active:scale-[0.98] transition-all">
                                <ArrowUpRight size={18} strokeWidth={3} /> Withdraw
                            </button>
                        </div>
                    </div>
                    {/* Reward badge */}
                    <div className="absolute top-5 right-5 bg-accent-yellow/20 border border-accent-yellow/20 px-3 py-2 rounded-xl flex items-center gap-1.5">
                        <Zap size={12} className="text-accent-yellow" fill="currentColor" />
                        <div>
                            <p className="text-white/40 text-[7px] font-black uppercase tracking-widest leading-none mb-0.5">Rewards</p>
                            <p className="text-accent-yellow font-black text-sm leading-none">340 pts</p>
                        </div>
                    </div>
                    <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-brand/20 rounded-full blur-3xl opacity-50" />
                </div>

                {/* ── Add Money Panel ── */}
                <AnimatePresence>
                    {addMode && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-black text-base tracking-tight">Add Money</h3>
                                    <button onClick={() => setAddMode(false)} className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Cancel</button>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {QUICK_AMOUNTS.map((amt) => (
                                        <button key={amt} onClick={() => setSelectedAmt(amt)}
                                            className={`py-2.5 rounded-xl font-black text-sm transition-all ${selectedAmt === amt ? 'bg-brand text-white shadow-md' : 'bg-gray-50 text-content border border-gray-100'}`}>
                                            ₹{amt}
                                        </button>
                                    ))}
                                </div>
                                <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-2">
                                    <span className="font-black text-content-muted">₹</span>
                                    <input type="number" placeholder="Custom amount" value={selectedAmt || ''}
                                        onChange={(e) => setSelectedAmt(Number(e.target.value))}
                                        className="flex-1 bg-transparent font-black text-content outline-none placeholder:text-content-subtle placeholder:font-bold placeholder:text-sm" />
                                </div>
                                <button onClick={handleAddMoney} disabled={loading} className="w-full h-12 bg-content rounded-xl text-white font-black flex items-center justify-between px-5 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50">
                                    <span>{loading ? 'Processing...' : 'Confirm & Add Money'}</span>
                                    <span className="font-black">₹{selectedAmt || '—'}</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Withdraw Money Panel ── */}
                <AnimatePresence>
                    {withdrawMode && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-black text-base tracking-tight text-slate-900">Withdraw Funds</h3>
                                    <button onClick={() => setWithdrawMode(false)} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                                </div>
                                <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-2">
                                    <span className="font-black text-slate-900">₹</span>
                                    <input type="number" placeholder="Enter amount to withdraw" value={withdrawAmt}
                                        onChange={(e) => setWithdrawAmt(e.target.value)}
                                        className="flex-1 bg-transparent font-black text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-bold placeholder:text-sm" />
                                </div>
                                <button onClick={handleWithdraw} disabled={loading} className="w-full h-12 bg-slate-900 rounded-xl text-white font-black flex items-center justify-between px-5 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50">
                                    <span>{loading ? 'Processing...' : 'Confirm Withdrawal'}</span>
                                    <span className="font-black">₹{withdrawAmt || '0'}</span>
                                </button>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Funds will be credited to your linked bank account</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Referral Banner ── */}
                <div className="bg-gradient-to-r from-[#6366F1] to-[#818CF8] rounded-2xl p-4 flex items-center gap-4 shadow-xl border border-white/10 relative overflow-hidden group cursor-pointer" onClick={() => navigate('/refer')}>
                    <div className="relative z-10 w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Gift size={24} className="text-white" />
                    </div>
                    <div className="relative z-10 flex-1">
                        <p className="text-white font-[1000] text-[15px] tracking-tight leading-none uppercase">
                            Refer & Earn {referralStats?.rewardDetails?.userGets || '₹50'}
                        </p>
                        <p className="text-white/80 text-[10px] font-[900] uppercase tracking-[0.2em] mt-2 leading-none">
                            Code: <span className="text-white">{referralStats?.referralCode || '...'}</span>
                        </p>
                    </div>
                    <div className="relative z-10 bg-white/20 p-2 rounded-xl border border-white/20">
                        <ChevronRight size={16} className="text-white" strokeWidth={3} />
                    </div>
                    <div className="absolute top-[-20%] right-[-5%] w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                </div>

                {/* ── Transactions ── */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <div>
                            <h2 className="text-[19px] font-[1000] tracking-tight text-slate-900 leading-none">Recent Activity</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Financial Node Synchronized</p>
                        </div>
                        <button onClick={fetchWalletData} className="text-brand text-[10px] font-black uppercase tracking-widest bg-brand/5 px-4 py-2 rounded-xl border border-brand/10 shadow-sm active:scale-95 transition-all">Refresh</button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
                            <AlertCircle size={18} className="text-red-600" />
                            <p className="text-red-600 text-xs font-black uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    {loading && transactions.length === 0 ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 h-20 animate-pulse" />
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Clock size={24} className="text-gray-300" />
                            </div>
                            <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight mb-1">No Activity Detected</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-[150px] mx-auto text-center leading-relaxed">Transactions will appear here after your first wash</p>
                        </div>
                    ) : (
                        transactions.map((txn) => (
                            <motion.div key={txn._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-brand/30 transition-all shadow-sm group">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${txn.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {txn.type === 'credit' ? (
                                        <ArrowDownLeft size={20} strokeWidth={3} />
                                    ) : (
                                        <ArrowUpRight size={20} strokeWidth={3} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-extrabold text-[15px] text-slate-900 tracking-tight leading-none mb-1.5 group-hover:text-brand transition-colors truncate">{txn.description}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${txn.type === 'credit' ? 'bg-green-100/50 text-green-600' : 'bg-red-100/50 text-red-600'}`}>
                                            {txn.category.replace('_', ' ')}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            {new Date(txn.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-[1000] text-[20px] tracking-tighter leading-none ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                                    </p>
                                    <div className="flex items-center justify-end gap-1 mt-1.5 opacity-40">
                                        <div className={`w-1 h-1 rounded-full ${txn.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            {txn.status}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </section>

            </div>
        </MobileLayout>
);
};

export default Wallet;
