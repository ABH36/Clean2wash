import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Zap, Plus, ArrowDownLeft, ArrowUpRight, Gift, Clock, ChevronRight } from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { walletAPI } from '../../../utils/api';

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
    const { walletBalance, updateBalance, bookings } = useAuth();
    const [addMode, setAddMode] = useState(false);
    const [selectedAmt, setSelectedAmt] = useState(null);
    const [loading, setLoading] = useState(false);
    const [walletData, setWalletData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState('');

    // Fetch wallet data from backend
    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const response = await walletAPI.getWallet();
            setWalletData(response.data.wallet);
            setTransactions(response.data.transactions || []);
            updateBalance(response.data.wallet.balance - walletBalance);
        } catch (err) {
            console.error('Failed to fetch wallet data:', err);
            setError('Failed to load wallet data');
            // Fallback to mock data
            setTransactions(MOCK_TRANSACTIONS);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMoney = async () => {
        if (!selectedAmt) return;
        
        try {
            setLoading(true);
            setError('');
            
            const response = await walletAPI.addToWallet(Number(selectedAmt), 'wallet');
            
            // Update local state
            updateBalance(Number(selectedAmt));
            setSelectedAmt(null);
            setAddMode(false);
            
            // Refresh wallet data
            await fetchWalletData();
            
        } catch (err) {
            console.error('Failed to add money:', err);
            setError(err.message || 'Failed to add money to wallet');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 flex items-center gap-3 bg-white sticky top-0 z-50 border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                    <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                </button>
                <div>
                    <h1 className="text-lg font-black tracking-tight text-content leading-none">CarWash Wallet</h1>
                    <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">Balance & History</p>
                </div>
            </header>

            <div className="px-4 pb-24 space-y-4 pt-4">

                {/* ── Balance Card ── */}
                <div className="bg-content rounded-2xl p-6 relative overflow-hidden border border-white/5">
                    <div className="relative z-10">
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Total Balance</p>
                        <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-1">₹{walletBalance.toLocaleString()}</h2>
                        <p className="text-white/30 text-[9px] font-bold mb-5">Updated just now</p>
                        <div className="flex gap-3">
                            <button onClick={() => setAddMode(true)}
                                className="flex-1 bg-brand text-white h-11 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 shadow-md">
                                <Plus size={16} strokeWidth={3} /> Add Money
                            </button>
                            <button className="flex-1 bg-white/10 text-white h-11 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 border border-white/10">
                                <ArrowUpRight size={16} strokeWidth={2.5} /> Withdraw
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
                    <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-brand/20 rounded-full blur-3xl" />
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
                                <button onClick={handleAddMoney} className="w-full h-12 bg-brand rounded-xl text-white font-black flex items-center justify-between px-5 shadow-md">
                                    <span>Confirm & Add Money</span>
                                    <span className="font-black">₹{selectedAmt || '—'}</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Referral Banner ── */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
                    <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Gift size={22} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-black text-sm tracking-tight">Refer & Earn ₹100</p>
                        <p className="text-white/60 text-[9px] font-bold">Per friend who books a wash</p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                        <ChevronRight size={14} className="text-white" strokeWidth={2.5} />
                    </div>
                </div>

                {/* ── Transactions ── */}
                <section className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h2 className="text-base font-black tracking-tight text-content">Transactions</h2>
                        <button onClick={fetchWalletData} className="text-brand text-[9px] font-black uppercase tracking-widest">Refresh</button>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                            <p className="text-red-600 text-xs font-black">{error}</p>
                        </div>
                    )}
                    
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Clock size={20} className="text-content-subtle" />
                            </div>
                            <p className="font-black text-content-subtle text-sm">No transactions yet</p>
                        </div>
                    ) : (
                        transactions.map((txn) => (
                            <motion.div key={txn.id || txn._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${txn.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                                    {txn.type === 'credit' ? (
                                        <ArrowDownLeft size={18} className="text-green-600" strokeWidth={2.5} />
                                    ) : (
                                        <ArrowUpRight size={18} className="text-red-600" strokeWidth={2.5} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-sm text-content tracking-tight leading-none">{txn.description || txn.title}</h3>
                                    <p className="text-[10px] font-bold text-content-subtle mt-0.5">{txn.category || txn.sub}</p>
                                    <p className="text-[8px] font-black text-content-subtle/50 uppercase tracking-widest mt-1.5">
                                        {new Date(txn.createdAt || txn.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-black text-base tracking-tight ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                                    </p>
                                    <p className="text-[8px] font-black text-content-subtle/50 uppercase tracking-widest">
                                        {txn.status || 'success'}
                                    </p>
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
