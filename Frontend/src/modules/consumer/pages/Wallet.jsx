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
    Loader2,
    Sparkles
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { walletAPI, referralAPI } from '../../../utils/api';

const QUICK_AMOUNTS = [100, 250, 500, 1000];

const Wallet = () => {
    const navigate = useNavigate();
    const { updateWalletBalance, getUser, getRazorpayKey } = useAuth();
    const { isDarkMode } = useTheme();
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
            <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                <header className={`px-4 py-6 flex items-center justify-between sticky top-0 z-[60] border-b backdrop-blur-xl transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]/90 border-white/5' : 'bg-white/90 border-black/5'
                    }`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className={`w-10 h-10 border rounded-2xl flex items-center justify-center active:scale-95 transition-all ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.03] border-black/10'
                            }`}>
                            <ChevronLeft size={20} className={isDarkMode ? 'text-white' : 'text-black'} />
                        </button>
                        <div>
                            <h1 className={`text-lg font-[1000] tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>My wallet</h1>
                            <div className="flex items-center gap-1.5 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                                <span className="text-[8px] font-black text-[#F59E0B] uppercase tracking-[0.2em]">Secure Treasury</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchWalletData} className={`p-2.5 rounded-xl border active:scale-75 transition-all ${isDarkMode ? 'bg-white/[0.03] text-white/40 border-white/10' : 'bg-black/[0.03] text-black/40 border-black/10'
                            } ${loading ? 'animate-spin' : ''}`}>
                            <RefreshCw size={16} strokeWidth={3} />
                        </button>
                        <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center border border-[#F59E0B]/20">
                            <Sparkles size={16} className="text-[#F59E0B]" fill="currentColor" />
                        </div>
                    </div>
                </header>
                <div className="px-4 pb-24 space-y-4 pt-4">
                    <AnimatePresence mode="wait">
                        {loading && transactions.length === 0 ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-44 bg-[#0F1412] rounded-[28px] relative overflow-hidden border border-white/5">
                                    <div className="absolute inset-0 shimmer-effect opacity-10" />
                                </div>
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-20 bg-white/[0.03] rounded-[22px] border border-white/5 shimmer-effect opacity-50" />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`relative rounded-[28px] overflow-hidden shadow-2xl border transition-all duration-300 ${isDarkMode ? 'border-white/5 shadow-black/40' : 'bg-white border-black/5 shadow-black/5'
                                }`}>
                                <div className={`absolute inset-0 ${isDarkMode ? 'bg-[#0F1412]' : 'bg-white'}`} />
                                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-[#F59E0B]/15 blur-[50px] rounded-full" />
                                <div className="relative z-10 p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1.5">
                                            <p className="text-[#F59E0B] text-[9px] font-black uppercase tracking-[0.2em] leading-none">Active treasury</p>
                                            <h2 className={`text-[34px] font-[1000] tracking-tighter leading-none flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                <span className="text-[#F59E0B]/60 text-[18px]">₹</span>
                                                {Number(walletSummary.availableBalance || 0).toLocaleString()}
                                            </h2>
                                        </div>
                                        <div className={`w-11 h-11 rounded-[18px] flex items-center justify-center border shadow-inner ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/[0.03] border-black/5'
                                            }`}>
                                            <WalletIcon size={20} className="text-[#F59E0B]" />
                                        </div>
                                    </div>

                                    <div className="mb-6 grid grid-cols-2 gap-2.5">
                                        <div className={`rounded-[20px] border p-3.5 ${isDarkMode ? 'bg-white/[0.03] border-white/05' : 'bg-black/[0.02] border-black/5'}`}>
                                            <p className={`text-[8px] font-black tracking-tight leading-none mb-2 ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>Escrow hold</p>
                                            <p className={`text-[14px] font-black leading-none ${isDarkMode ? 'text-white/90' : 'text-black/80'}`}>₹{Number(walletSummary.heldBalance || 0).toLocaleString()}</p>
                                        </div>
                                        <div className={`rounded-[20px] border p-3.5 ${isDarkMode ? 'bg-white/[0.03] border-white/05' : 'bg-black/[0.02] border-black/5'}`}>
                                            <p className={`text-[8px] font-black tracking-tight leading-none mb-2 ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>Asset total</p>
                                            <p className={`text-[14px] font-black leading-none ${isDarkMode ? 'text-white/90' : 'text-black/80'}`}>₹{Number(walletSummary.totalBalance || 0).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2.5">
                                        <button onClick={() => { setAddMode(true); setWithdrawMode(false); }}
                                            className="flex-1 h-12 bg-[#F59E0B] text-black rounded-[18px] font-black text-[11px] tracking-tight flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                                            <Plus size={14} strokeWidth={4} /> Top up
                                        </button>
                                        <button onClick={() => { setWithdrawMode(true); setAddMode(false); }}
                                            className={`flex-1 h-12 rounded-[18px] font-black text-[11px] tracking-tight flex items-center justify-center gap-2 active:scale-95 transition-all border ${isDarkMode ? 'bg-white/10 text-white border-white/10' : 'bg-black/[0.03] text-black border-black/10'
                                                }`}>
                                            <ArrowUpRight size={14} strokeWidth={3} /> Cashout
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {addMode && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className={`rounded-[28px] p-6 border shadow-2xl transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/5 shadow-black/50' : 'bg-white border-black/5 shadow-black/5'
                                    } space-y-5`}>
                                    <div className="flex justify-between items-center">
                                        <h3 className={`text-[14px] font-[1000] uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Deposit funds</h3>
                                        <button onClick={() => setAddMode(false)} className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-white/40 active:scale-90"><X size={16} /></button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {QUICK_AMOUNTS.map((amt) => (
                                            <button key={amt} onClick={() => setSelectedAmt(amt)}
                                                className={`h-11 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${selectedAmt === amt ? 'bg-[#F59E0B] text-black shadow-2xl shadow-[#F59E0B]/20 transform -translate-y-0.5' : 'bg-white/5 text-white/40 border border-white/5'}`}>
                                                ₹{amt}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-1">Custom amount</p>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F59E0B] font-black tracking-widest">₹</div>
                                            <input type="number" placeholder="0.00" value={selectedAmt || ''} onChange={(e) => setSelectedAmt(Number(e.target.value))}
                                                className="w-full h-12 bg-white/[0.03] border border-white/10 focus:border-[#F59E0B]/40 rounded-[18px] px-10 font-[1000] text-white outline-none transition-all placeholder:text-white/10" />
                                        </div>
                                    </div>
                                    <button onClick={handleAddMoney} disabled={loading || !selectedAmt} className="w-full h-14 bg-white text-black rounded-[18px] font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 shadow-2xl shadow-black/50 disabled:opacity-30">
                                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={4} />}
                                        Initiate Recharge
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {withdrawMode && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="bg-white/[0.03] rounded-[28px] p-6 border border-white/5 shadow-2xl shadow-black/50 space-y-5">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-[14px] font-[1000] text-white uppercase tracking-tight">Withdrawal Hub</h3>
                                        <button onClick={() => setWithdrawMode(false)} className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-white/40 active:scale-90"><X size={16} /></button>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-1">Payout Volume</p>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-black tracking-widest">₹</div>
                                            <input type="number" placeholder="0.00" value={withdrawAmt} onChange={(e) => setWithdrawAmt(e.target.value)}
                                                className="w-full h-12 bg-white/[0.03] border border-white/10 focus:border-[#F59E0B]/40 rounded-[18px] px-10 font-[1000] text-white outline-none transition-all placeholder:text-white/10" />
                                        </div>
                                    </div>
                                    <button onClick={handleWithdraw} disabled={loading || !withdrawAmt} className="w-full h-14 bg-[#F59E0B] text-black rounded-[18px] font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 shadow-2xl shadow-[#F59E0B]/10 disabled:opacity-30">
                                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <ArrowUpRight size={18} strokeWidth={4} />}
                                        Execute Payout
                                    </button>
                                    <p className="text-[9px] font-black text-white/20 text-center uppercase tracking-tight">Verified bank settlement process</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div onClick={() => navigate('/refer-earn')} className={`group rounded-[24px] p-4 flex items-center gap-4 border cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden ${isDarkMode ? 'bg-white/[0.03] border-white/5 hover:border-[#F59E0B]/20' : 'bg-white border-black/5 shadow-sm'
                        }`}>
                        <div className="absolute top-[-50%] right-[-10%] w-32 h-32 bg-[#F59E0B]/5 blur-[30px] rounded-full pointer-events-none" />
                        <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center text-[#F59E0B] border relative shadow-inner ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/[0.03] border-black/5'
                            }`}>
                            <Gift size={20} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 relative">
                            <p className={`text-[13px] font-[1000] leading-tight uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Referral Rewards</p>
                            <p className="text-[10px] font-black text-[#F59E0B] mt-0.5 tracking-wider uppercase">Code: {referralStats?.referralCode || '...'}</p>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/5 text-white/20 group-hover:text-[#F59E0B] group-hover:bg-[#F59E0B]/10' : 'bg-black/5 text-black/20 group-hover:text-[#F59E0B] group-hover:bg-[#F59E0B]/05'
                            }`}>
                            <ChevronRight size={16} strokeWidth={3} />
                        </div>
                    </div>

                    <section className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h2 className={`text-[11px] font-black tracking-tight leading-none uppercase ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Transaction history</h2>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow" />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-[12px] font-medium flex items-center gap-2">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            {loading && transactions.length === 0 ? (
                                null
                            ) : transactions.length === 0 ? (
                                <div className="py-16 text-center bg-white/[0.03] rounded-[32px] border border-dashed border-white/5">
                                    <Clock size={28} className="mx-auto text-white/10 mb-3" />
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Audit log empty</p>
                                </div>
                            ) : (
                                transactions.map((txn, idx) => (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                        key={txn._id} className={`rounded-[22px] p-4 border flex items-center gap-4 transition-all ${isDarkMode ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]' : 'bg-white border-black/5 hover:bg-black/[0.01] shadow-sm'
                                            }`}>
                                        <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center shrink-0 shadow-inner ${txn.type === 'credit' ? 'bg-emerald-500/10 text-emerald-500' : (isDarkMode ? 'bg-white/5 text-white/20' : 'bg-black/5 text-black/20')}`}>
                                            {txn.type === 'credit' ? <ArrowDownLeft size={20} strokeWidth={3} /> : <ArrowUpRight size={20} strokeWidth={3} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-[11px] font-black truncate tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>{txn.description}</h4>
                                            <p className={`text-[9px] font-bold mt-1 tracking-tight flex items-center gap-1.5 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                                                {new Date(txn.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                <span className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`} />
                                                #{String(txn.category || 'wallet')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-[15px] font-[1000] tracking-tighter ${txn.type === 'credit' ? 'text-emerald-500' : (isDarkMode ? 'text-white' : 'text-black')}`}>
                                                {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                                            </p>
                                            <div className={`mt-1 h-4 px-2 rounded-full inline-flex items-center text-[7px] font-black uppercase tracking-widest ${txn.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {txn.status}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
                <p className={`text-[10px] font-black text-center py-6 tracking-[0.3em] uppercase leading-none ${isDarkMode ? 'text-white/10' : 'text-black/10'}`}>Elite Treasury v1.9</p>
            </div>
        </MobileLayout>
    );
};

export default Wallet;
