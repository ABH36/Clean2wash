import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Zap, Plus, ArrowDownLeft, ArrowUpRight, 
    Gift, Clock, ChevronRight, AlertCircle, Wallet as WalletIcon,
    ShieldCheck, RefreshCw, Smartphone, CreditCard, Banknote, Sparkles, X, Loader2
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { walletAPI, referralAPI } from '../../../utils/api';

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
            const keyRes = await getRazorpayKey();
            const key_id = keyRes?.data?.key_id;
            if (!key_id) throw new Error("Payment gateway key missing. Please contact support.");
            
            const orderRes = await walletAPI.createOrder(Number(selectedAmt));
            if (orderRes.status !== 'success') throw new Error('Failed to initiate recharge order');
            const { order_id, amount: orderAmount, currency } = orderRes.data;

            const options = {
                key: key_id,
                amount: orderAmount,
                currency: currency,
                name: 'Spare Driver',
                description: `Wallet recharge: ₹${selectedAmt}`,
                image: 'https://cdn-icons-png.flaticon.com/512/3003/3003984.png',
                order_id: order_id,
                handler: async (response) => {
                    try {
                        setLoading(true);
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
                        setError('Payment verification failed.');
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || ''
                },
                theme: { color: '#f47521' },
                modal: { ondismiss: () => setLoading(false) }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
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
            setError(err.message || 'Withdrawal failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-5 pt-8 pb-4 flex items-center justify-between bg-white sticky top-0 z-[60] border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                        <ChevronLeft size={22} className="text-slate-900" />
                    </button>
                    <div>
                        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">Wallet</h1>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">Manage your balance</p>
                    </div>
                </div>
                <button onClick={fetchWalletData} className={`p-2 rounded-lg bg-gray-50 text-slate-400 active:scale-75 transition-all ${loading ? 'animate-spin' : ''}`}>
                    <RefreshCw size={18} />
                </button>
            </header>

            <div className="px-5 pb-24 space-y-5 pt-5">
                
                {/* ── Compact Balance Card ── */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }}
                    className="relative rounded-[2rem] overflow-hidden shadow-xl"
                >
                    <div className="absolute inset-0 bg-slate-900" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[40px]" />

                    <div className="relative z-10 p-7">
                        <div className="flex justify-between items-center mb-6">
                            <div className="space-y-1">
                                <p className="text-white/40 text-[11px] font-medium">Available balance</p>
                                <h2 className="text-[34px] font-bold text-white tracking-tighter leading-none">
                                    <span className="text-white/40 font-semibold mr-1">₹</span>
                                    {walletBalance.toLocaleString()}
                                </h2>
                            </div>
                            <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                <WalletIcon size={22} className="text-brand" />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => { setAddMode(true); setWithdrawMode(false); }}
                                className="flex-1 h-11 bg-brand text-black rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                                <Plus size={16} strokeWidth={3} /> Top up
                            </button>
                            <button onClick={() => { setWithdrawMode(true); setAddMode(false); }}
                                className="flex-1 h-11 bg-white/10 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                                <ArrowUpRight size={16} /> Withdraw
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ── Action Sections ── */}
                <AnimatePresence mode="wait">
                    {addMode && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900 text-[15px]">Add money</h3>
                                    <button onClick={() => setAddMode(false)} className="text-slate-400"><X size={18} /></button>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {QUICK_AMOUNTS.map((amt) => (
                                        <button key={amt} onClick={() => setSelectedAmt(amt)}
                                            className={`h-10 rounded-lg font-bold text-[12px] transition-all ${selectedAmt === amt ? 'bg-brand text-black' : 'bg-gray-50 text-slate-500 border border-gray-100'}`}>
                                            ₹{amt}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand font-bold">₹</div>
                                    <input type="number" placeholder="Enter amount" value={selectedAmt || ''}
                                        onChange={(e) => setSelectedAmt(Number(e.target.value))}
                                        className="w-full h-12 bg-gray-50 rounded-xl px-10 font-bold text-slate-900 outline-none border border-transparent focus:border-brand/30 transition-all placeholder:text-slate-300" />
                                </div>
                                <button onClick={handleAddMoney} disabled={loading || !selectedAmt} className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30">
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : 'Process recharge'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {withdrawMode && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900 text-[15px]">Withdraw funds</h3>
                                    <button onClick={() => setWithdrawMode(false)} className="text-slate-400"><X size={18} /></button>
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₹</div>
                                    <input type="number" placeholder="Withdrawal amount" value={withdrawAmt}
                                        onChange={(e) => setWithdrawAmt(e.target.value)}
                                        className="w-full h-12 bg-gray-50 rounded-xl px-10 font-bold text-slate-900 outline-none border border-transparent focus:border-brand/30 transition-all placeholder:text-slate-300" />
                                </div>
                                <button onClick={handleWithdraw} disabled={loading || !withdrawAmt} className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30">
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : 'Process withdrawal'}
                                </button>
                                <p className="text-[10px] text-slate-400 text-center">Funds will be credited to your linked account</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Compact Referral Card ── */}
                <div onClick={() => navigate('/refer')} className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-gray-100 cursor-pointer active:scale-[0.98] transition-all">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                        <Gift size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[13px] font-bold text-slate-900 leading-tight">Refer and Earn {referralStats?.rewardDetails?.userGets || '₹50'}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Share your code: {referralStats?.referralCode || '...'}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                </div>

                {/* ── Activity History ── */}
                <section className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-[17px] font-bold text-slate-900">Recent activity</h2>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-[12px] font-medium flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        {loading && transactions.length === 0 ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="bg-gray-50 h-16 rounded-xl animate-pulse" />
                            ))
                        ) : transactions.length === 0 ? (
                            <div className="py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                <Clock size={24} className="mx-auto text-slate-200 mb-2" />
                                <p className="text-[12px] text-slate-400">No activity yet</p>
                            </div>
                        ) : (
                            transactions.map((txn) => (
                                <motion.div 
                                    key={txn._id} 
                                    className="bg-white rounded-xl p-4 border border-gray-50 flex items-center gap-3 shadow-sm"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${txn.type === 'credit' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-500'}`}>
                                        {txn.type === 'credit' ? <ArrowDownLeft size={18} strokeWidth={2.5} /> : <ArrowUpRight size={18} strokeWidth={2.5} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[13px] font-bold text-slate-900 truncate">{txn.description}</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {new Date(txn.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {txn.category.replace('_', ' ')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[15px] font-bold ${txn.type === 'credit' ? 'text-emerald-500' : 'text-slate-900'}`}>
                                            {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                                        </p>
                                        <p className="text-[9px] text-slate-300 mt-0.5 capitalize">{txn.status}</p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </MobileLayout>
    );
};

export default Wallet;
