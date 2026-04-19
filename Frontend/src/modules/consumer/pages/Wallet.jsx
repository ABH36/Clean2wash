import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Plus,
    ArrowDownLeft,
    ArrowUpRight,
    Gift,
    Clock,
    ChevronRight,
    AlertCircle,
    Wallet as WalletIcon,
    RefreshCw,
    X,
    Loader2
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { walletAPI, referralAPI } from '../../../utils/api';

const QUICK_AMOUNTS = [100, 250, 500, 1000];

const Wallet = () => {
    const navigate = useNavigate();
    const { updateWalletBalance, getUser, getRazorpayKey } = useAuth();
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
                const { wallet, transactions: txns } = response.data;
                const availableBalance = wallet.availableBalance ?? wallet.balance ?? 0;
                const heldBalance = wallet.heldBalance ?? 0;
                const totalBalance = wallet.totalBalance ?? (availableBalance + heldBalance);
                setTransactions(txns || []);
                setWalletSummary({ availableBalance, heldBalance, totalBalance });
                updateWalletBalance(availableBalance);
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
            if (!key_id) throw new Error('Payment gateway key missing. Please contact support.');

            const orderRes = await walletAPI.createOrder(Number(selectedAmt));
            if (orderRes.status !== 'success') throw new Error('Failed to initiate recharge order');
            const { order_id, amount: orderAmount, currency } = orderRes.data;

            const options = {
                key: key_id,
                amount: orderAmount,
                currency,
                name: 'Spare Driver',
                description: `Wallet recharge: ₹${selectedAmt}`,
                image: 'https://cdn-icons-png.flaticon.com/512/3003/3003984.png',
                order_id,
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
        if (Number(withdrawAmt) > walletSummary.availableBalance) {
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
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-[60] border-b border-gray-100 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center active:scale-95 transition-all">
                        <ChevronLeft size={18} className="text-slate-900" />
                    </button>
                    <div>
                        <h1 className="text-[17px] font-[1000] text-slate-900 tracking-tighter uppercase leading-none">Wallet</h1>
                    </div>
                </div>
                <button onClick={fetchWalletData} className={`p-2 rounded-lg bg-gray-50 text-slate-400 active:scale-75 transition-all ${loading ? 'animate-spin' : ''}`}>
                    <RefreshCw size={14} />
                </button>
            </header>
            <div className="px-4 pb-24 space-y-4 pt-4">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative rounded-[28px] overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-slate-900" />
                    <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-[#FF9900]/15 blur-[50px] rounded-full" />

                    <div className="relative z-10 p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1.5">
                                <p className="text-[#FF9900] text-[9px] font-black uppercase tracking-[0.2em] leading-none">Active Treasury</p>
                                <h2 className="text-[34px] font-[1000] text-white tracking-tighter leading-none flex items-center gap-2">
                                    <span className="text-[#FF9900]/60 text-[18px]">₹</span>
                                    {Number(walletSummary.availableBalance || 0).toLocaleString()}
                                </h2>
                            </div>
                            <div className="w-11 h-11 bg-white/5 rounded-[18px] flex items-center justify-center border border-white/10 shadow-inner">
                                <WalletIcon size={20} className="text-[#FF9900]" />
                            </div>
                        </div>

                        <div className="mb-6 grid grid-cols-2 gap-2.5">
                            <div className="rounded-[20px] bg-white/[0.03] border border-white/05 p-3.5">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none mb-2">Escrow Hold</p>
                                <p className="text-[14px] font-[1000] text-white/90 leading-none">₹{Number(walletSummary.heldBalance || 0).toLocaleString()}</p>
                            </div>
                            <div className="rounded-[20px] bg-white/[0.03] border border-white/05 p-3.5">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none mb-2">Asset Total</p>
                                <p className="text-[14px] font-[1000] text-white/90 leading-none">₹{Number(walletSummary.totalBalance || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex gap-2.5">
                            <button onClick={() => { setAddMode(true); setWithdrawMode(false); }}
                                className="flex-1 h-12 bg-[#FF9900] text-slate-900 rounded-[18px] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                                <Plus size={14} strokeWidth={4} /> Top Up
                            </button>
                            <button onClick={() => { setWithdrawMode(true); setAddMode(false); }}
                                className="flex-1 h-12 bg-white/10 text-white rounded-[18px] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all border border-white/05">
                                <ArrowUpRight size={14} strokeWidth={3} /> Cashout
                            </button>
                        </div>
                    </div>
                </motion.div>
on.div>

                <AnimatePresence mode="wait">
                    {addMode && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-xl space-y-5">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[14px] font-[1000] text-slate-900 uppercase tracking-tight">Deposit Funds</h3>
                                    <button onClick={() => setAddMode(false)} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 active:scale-90"><X size={16} /></button>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {QUICK_AMOUNTS.map((amt) => (
                                        <button key={amt} onClick={() => setSelectedAmt(amt)} 
                                            className={`h-11 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${selectedAmt === amt ? 'bg-[#FF9900] text-slate-900 shadow-md transform -translate-y-0.5' : 'bg-slate-50 text-slate-400 border border-gray-50'}`}>
                                            ₹{amt}
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Custom Amount</p>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF9900] font-black tracking-widest">₹</div>
                                        <input type="number" placeholder="0.00" value={selectedAmt || ''} onChange={(e) => setSelectedAmt(Number(e.target.value))}
                                            className="w-full h-12 bg-slate-50 border border-transparent focus:border-[#FF9900]/20 rounded-[18px] px-10 font-[1000] text-slate-900 outline-none transition-all placeholder:text-slate-300" />
                                    </div>
                                </div>
                                <button onClick={handleAddMoney} disabled={loading || !selectedAmt} className="w-full h-14 bg-slate-900 text-[#FF9900] rounded-[18px] font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 shadow-xl disabled:opacity-30">
                                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={4} />}
                                    Initiate Recharge
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {withdrawMode && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-xl space-y-5">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[14px] font-[1000] text-slate-900 uppercase tracking-tight">Withdrawal Hub</h3>
                                    <button onClick={() => setWithdrawMode(false)} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 active:scale-90"><X size={16} /></button>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Payout Volume</p>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black tracking-widest">₹</div>
                                        <input type="number" placeholder="0.00" value={withdrawAmt} onChange={(e) => setWithdrawAmt(e.target.value)}
                                            className="w-full h-12 bg-slate-50 border border-transparent focus:border-[#FF9900]/20 rounded-[18px] px-10 font-[1000] text-slate-900 outline-none transition-all placeholder:text-slate-300" />
                                    </div>
                                </div>
                                <button onClick={handleWithdraw} disabled={loading || !withdrawAmt} className="w-full h-14 bg-slate-900 text-[#FF9900] rounded-[18px] font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 shadow-xl disabled:opacity-30">
                                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <ArrowUpRight size={18} strokeWidth={4} />}
                                    Execute Payout
                                </button>
                                <p className="text-[9px] font-black text-slate-400 text-center uppercase tracking-tight opacity-60">Verified bank settlement process</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div onClick={() => navigate('/refer-earn')} className="group bg-white rounded-[24px] p-4 flex items-center gap-4 border border-gray-100 cursor-pointer active:scale-[0.98] transition-all hover:border-[#FF9900]/20 shadow-sm relative overflow-hidden">
                    <div className="absolute top-[-50%] right-[-10%] w-32 h-32 bg-indigo-50/50 blur-[30px] rounded-full pointer-events-none" />
                    <div className="w-11 h-11 bg-indigo-50 rounded-[16px] flex items-center justify-center text-indigo-600 border border-indigo-100 relative shadow-inner">
                        <Gift size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 relative">
                        <p className="text-[13px] font-[1000] text-slate-900 leading-tight uppercase tracking-tight">Referital Rewards</p>
                        <p className="text-[10px] font-black text-[#FF9900] mt-0.5 tracking-wider uppercase">Code: {referralStats?.referralCode || '...'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-[#FF9900] group-hover:bg-[#FF9900]/10 transition-colors">
                        <ChevronRight size={16} strokeWidth={3} />
                    </div>
                </div>

                <section className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Transaction History</h2>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-[12px] font-medium flex items-center gap-2">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        {loading && transactions.length === 0 ? (
                            [1, 2, 3].map((i) => (
                                <div key={i} className="bg-white/60 h-20 rounded-[22px] animate-pulse border border-gray-50" />
                            ))
                        ) : transactions.length === 0 ? (
                            <div className="py-16 text-center bg-gray-50/5 rounded-[32px] border border-dashed border-gray-200">
                                <Clock size={28} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Audit Log Empty</p>
                            </div>
                        ) : (
                            transactions.map((txn, idx) => (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                    key={txn._id} className="bg-white rounded-[22px] p-4 border border-gray-50 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                                    <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center shrink-0 shadow-inner ${txn.type === 'credit' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                                        {txn.type === 'credit' ? <ArrowDownLeft size={20} strokeWidth={3} /> : <ArrowUpRight size={20} strokeWidth={3} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[11px] font-[1000] text-slate-900 truncate uppercase tracking-tight">{txn.description}</h4>
                                        <p className="text-[9px] font-black text-slate-300 mt-1 uppercase tracking-wider flex items-center gap-1.5">
                                            {new Date(txn.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                            #{String(txn.category || 'wallet').toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[15px] font-[1000] tracking-tighter ${txn.type === 'credit' ? 'text-emerald-500' : 'text-slate-900'}`}>
                                            {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                                        </p>
                                        <div className={`mt-1 h-4 px-2 rounded-full inline-flex items-center text-[7px] font-black uppercase tracking-widest ${txn.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {txn.status}
                                        </div>
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
