import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, ArrowUpRight, ArrowDownLeft, Plus, 
    CreditCard, History, RefreshCw, Eye, EyeOff,
    AlertCircle, CheckCircle2, Clock, IndianRupee,
    TrendingUp, Download, Filter, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';

const DriverWallet = () => {
    const [driver, setDriver] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showBalance, setShowBalance] = useState(true);
    const [addMoneyModal, setAddMoneyModal] = useState(false);
    const [withdrawModal, setWithdrawModal] = useState(false);
    const [addAmount, setAddAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchWalletData = async () => {
        try {
            const [profileRes, transactionsRes] = await Promise.all([
                spareDriverAPI.getProfile(),
                spareDriverAPI.getTransactions({ limit: 50 })
            ]);
            
            setDriver(profileRes?.data?.driver || null);
            setTransactions(transactionsRes?.data?.transactions || []);
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
            toast.error('Failed to load wallet data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchWalletData();
    };

    const handleAddMoney = async () => {
        if (!addAmount || parseFloat(addAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            // Implement add money functionality
            toast.success('Add money functionality will be implemented');
            setAddMoneyModal(false);
            setAddAmount('');
        } catch (error) {
            toast.error('Failed to add money');
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        const amount = parseFloat(withdrawAmount);
        const availableBalance = (driver?.wallet?.balance || 0) - (driver?.wallet?.holdAmount || 0);

        if (amount > availableBalance) {
            toast.error('Insufficient available balance');
            return;
        }

        try {
            await spareDriverAPI.requestWithdrawal({
                amount,
                reason: 'Driver withdrawal request'
            });
            
            toast.success('Withdrawal request submitted successfully');
            setWithdrawModal(false);
            setWithdrawAmount('');
            await fetchWalletData();
        } catch (error) {
            toast.error(error.message || 'Failed to submit withdrawal request');
        }
    };

    const filteredTransactions = transactions.filter(transaction => {
        const matchesFilter = filter === 'all' || transaction.type === filter;
        const matchesSearch = !searchQuery || 
            transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transaction.bookingId?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesFilter && matchesSearch;
    });

    const formatCurrency = (amount) => `₹${amount?.toLocaleString() || 0}`;

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'credit':
            case 'earning':
                return <ArrowDownLeft size={16} className="text-green-600" />;
            case 'debit':
            case 'deduction':
                return <ArrowUpRight size={16} className="text-red-600" />;
            case 'hold':
                return <Clock size={16} className="text-amber-600" />;
            default:
                return <IndianRupee size={16} className="text-gray-600" />;
        }
    };

    const getTransactionColor = (type) => {
        switch (type) {
            case 'credit':
            case 'earning':
                return 'text-green-600';
            case 'debit':
            case 'deduction':
                return 'text-red-600';
            case 'hold':
                return 'text-amber-600';
            default:
                return 'text-gray-600';
        }
    };

    if (loading) {
        return (
            <DriverLayout title="Wallet">
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                </div>
            </DriverLayout>
        );
    }

    const walletBalance = driver?.wallet?.balance || 0;
    const holdAmount = driver?.wallet?.holdAmount || 0;
    const availableBalance = walletBalance - holdAmount;

    return (
        <DriverLayout title="Financial Hub">
            <div className="px-6 py-6 space-y-6 pb-24">
                {/* Wallet Balance Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gradient-to-br from-black to-gray-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[60px]" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-brand/20 rounded-2xl flex items-center justify-center">
                                    <Wallet size={24} className="text-brand" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Wallet Balance</p>
                                    <p className="text-xs text-brand font-bold uppercase">ID: {driver?.driverId || `SD-${driver?._id?.slice(-6)}`}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowBalance(!showBalance)}
                                    className="p-2 bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
                                >
                                    {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button
                                    onClick={handleRefresh}
                                    className="p-2 bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
                                >
                                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-3xl font-black text-white">
                                    {showBalance ? formatCurrency(walletBalance) : '₹••••••'}
                                </p>
                                <p className="text-xs text-white/40 uppercase tracking-wide mt-1">Total Balance</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-lg font-bold text-green-400">
                                        {showBalance ? formatCurrency(availableBalance) : '₹••••'}
                                    </p>
                                    <p className="text-xs text-white/60 uppercase">Available</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-lg font-bold text-amber-400">
                                        {showBalance ? formatCurrency(holdAmount) : '₹••••'}
                                    </p>
                                    <p className="text-xs text-white/60 uppercase">On Hold</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setAddMoneyModal(true)}
                        className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm"
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Plus size={24} className="text-green-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-gray-900">Add Money</p>
                            <p className="text-xs text-gray-500">Top up wallet</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setWithdrawModal(true)}
                        className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm"
                    >
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Download size={24} className="text-blue-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-gray-900">Withdraw</p>
                            <p className="text-xs text-gray-500">To bank account</p>
                        </div>
                    </button>
                </div>

                {/* Transaction Filters */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
                        <div className="flex items-center gap-2">
                            <button className="p-2 bg-gray-100 rounded-xl">
                                <Filter size={16} className="text-gray-600" />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['all', 'credit', 'debit', 'hold'].map((filterType) => (
                            <button
                                key={filterType}
                                onClick={() => setFilter(filterType)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all ${
                                    filter === filterType
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {filterType}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand transition-colors"
                        />
                    </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-3">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((transaction) => (
                            <motion.div
                                key={transaction._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                        {getTransactionIcon(transaction.type)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {transaction.description || 'Transaction'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(transaction.createdAt).toLocaleDateString('en-IN')} • 
                                            {transaction.bookingId ? ` #${transaction.bookingId}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${getTransactionColor(transaction.type)}`}>
                                        {transaction.type === 'debit' || transaction.type === 'deduction' ? '-' : '+'}
                                        {formatCurrency(Math.abs(transaction.amount))}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <History size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-500 mb-2">No Transactions</h3>
                            <p className="text-gray-400 text-sm">Your transaction history will appear here</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Money Modal */}
            <AnimatePresence>
                {addMoneyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-md"
                        >
                            <h3 className="text-xl font-bold mb-4">Add Money to Wallet</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-600 mb-2 block">Amount</label>
                                    <input
                                        type="number"
                                        value={addAmount}
                                        onChange={(e) => setAddAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold outline-none focus:border-brand"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setAddMoneyModal(false)}
                                        className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddMoney}
                                        className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold"
                                    >
                                        Add Money
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Withdraw Modal */}
            <AnimatePresence>
                {withdrawModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-md"
                        >
                            <h3 className="text-xl font-bold mb-4">Withdraw to Bank</h3>
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-sm text-gray-600">Available Balance</p>
                                    <p className="text-lg font-bold text-green-600">{formatCurrency(availableBalance)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-600 mb-2 block">Withdrawal Amount</label>
                                    <input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        max={availableBalance}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold outline-none focus:border-brand"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setWithdrawModal(false)}
                                        className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleWithdraw}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold"
                                    >
                                        Withdraw
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DriverLayout>
    );
};

export default DriverWallet;