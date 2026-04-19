import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, TrendingUp, Calendar, Clock, Award,
    ArrowUpRight, ArrowDownLeft, Wallet, Download,
    RefreshCw, ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { driverAPI } from '../../../utils/driverApi';

const DriverEarnings = () => {
    const [activeTab, setActiveTab] = useState('today');
    const [loading, setLoading] = useState(true);
    const [todayEarnings, setTodayEarnings] = useState(null);
    const [weeklyEarnings, setWeeklyEarnings] = useState(null);
    const [monthlyEarnings, setMonthlyEarnings] = useState(null);
    const [summary, setSummary] = useState(null);
    const [payoutHistory, setPayoutHistory] = useState([]);
    const [withdrawalModal, setWithdrawalModal] = useState(false);
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [withdrawalReason, setWithdrawalReason] = useState('');

    useEffect(() => {
        loadEarningsData();
    }, [activeTab]);

    const loadEarningsData = async () => {
        setLoading(true);
        try {
            const [summaryRes, payoutsRes] = await Promise.all([
                driverAPI.getEarningsSummary(),
                driverAPI.getPayoutHistory({ limit: 5 })
            ]);

            if (summaryRes.status === 'success') {
                setSummary(summaryRes.data);
            }

            if (payoutsRes.status === 'success') {
                setPayoutHistory(payoutsRes.data.payouts || []);
            }

            // Load tab-specific data
            if (activeTab === 'today') {
                const res = await driverAPI.getTodayEarnings();
                if (res.status === 'success') {
                    setTodayEarnings(res.data);
                }
            } else if (activeTab === 'weekly') {
                const res = await driverAPI.getWeeklyEarnings();
                if (res.status === 'success') {
                    setWeeklyEarnings(res.data);
                }
            } else if (activeTab === 'monthly') {
                const res = await driverAPI.getMonthlyEarnings();
                if (res.status === 'success') {
                    setMonthlyEarnings(res.data);
                }
            }
        } catch (error) {
            console.error('Failed to load earnings:', error);
            toast.error('Failed to load earnings data');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawal = async () => {
        if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            const res = await driverAPI.requestWithdrawal({
                amount: parseFloat(withdrawalAmount),
                reason: withdrawalReason
            });

            if (res.status === 'success') {
                toast.success('Withdrawal request submitted successfully');
                setWithdrawalModal(false);
                setWithdrawalAmount('');
                setWithdrawalReason('');
                loadEarningsData();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to submit withdrawal request');
        }
    };

    const formatCurrency = (amount) => `₹${amount?.toLocaleString() || 0}`;

    const renderTodayEarnings = () => {
        if (!todayEarnings) return null;

        return (
            <div className="space-y-6">
                {/* Today's Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={16} className="text-emerald-600" />
                            <p className="text-xs font-bold text-gray-500 uppercase">Earnings</p>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">{formatCurrency(todayEarnings.totalEarnings)}</h3>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={16} className="text-blue-600" />
                            <p className="text-xs font-bold text-gray-500 uppercase">Trips</p>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">{todayEarnings.totalTrips}</h3>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={16} className="text-purple-600" />
                            <p className="text-xs font-bold text-gray-500 uppercase">Hours</p>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">{todayEarnings.totalHours.toFixed(1)}h</h3>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Award size={16} className="text-amber-600" />
                            <p className="text-xs font-bold text-gray-500 uppercase">Avg/Trip</p>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">{formatCurrency(todayEarnings.avgEarningPerTrip)}</h3>
                    </div>
                </div>

                {/* Today's Trips */}
                {todayEarnings.bookings && todayEarnings.bookings.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <h4 className="text-sm font-black text-gray-900 uppercase mb-3">Today's Trips</h4>
                        <div className="space-y-2">
                            {todayEarnings.bookings.map((booking, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">#{booking.bookingId}</p>
                                        <p className="text-xs text-gray-500">{new Date(booking.completedAt).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-emerald-600">{formatCurrency(booking.earning)}</p>
                                        <p className="text-xs text-gray-500">{booking.duration}h</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderWeeklyEarnings = () => {
        if (!weeklyEarnings) return null;

        return (
            <div className="space-y-6">
                {/* Weekly Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={16} className="text-emerald-600" />
                            <p className="text-xs font-bold text-gray-500 uppercase">Total Earnings</p>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">{formatCurrency(weeklyEarnings.totalEarnings)}</h3>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={16} className="text-red-600" />
                            <p className="text-xs font-bold text-gray-500 uppercase">Penalties</p>
                        </div>
                        <h3 className="text-2xl font-black text-red-600">-{formatCurrency(weeklyEarnings.totalPenalties)}</h3>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-gray-100 col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={16} className="text-blue-600" />
                            <p className="text-xs font-bold text-gray-500 uppercase">Net Earnings</p>
                        </div>
                        <h3 className="text-3xl font-black text-blue-600">{formatCurrency(weeklyEarnings.netEarnings)}</h3>
                    </div>
                </div>

                {/* Daily Breakdown */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-sm font-black text-gray-900 uppercase mb-3">Daily Breakdown</h4>
                    <div className="space-y-2">
                        {Object.entries(weeklyEarnings.dailyBreakdown).map(([day, data]) => (
                            <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-xs font-bold text-gray-900">{day}</p>
                                    <p className="text-xs text-gray-500">{data.trips} trips • {data.hours.toFixed(1)}h</p>
                                </div>
                                <p className="text-sm font-black text-emerald-600">{formatCurrency(data.earnings)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">Earnings</h1>
                        <p className="text-xs text-emerald-100 uppercase tracking-wide mt-1">Track your income</p>
                    </div>
                    <button
                        onClick={loadEarningsData}
                        className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                            <p className="text-xs text-emerald-100 uppercase mb-1">Pending Payout</p>
                            <h3 className="text-2xl font-black">{formatCurrency(summary.pendingPayout)}</h3>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                            <p className="text-xs text-emerald-100 uppercase mb-1">Lifetime</p>
                            <h3 className="text-2xl font-black">{formatCurrency(summary.lifetime.totalEarnings)}</h3>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-4 flex gap-2 overflow-x-auto">
                {['today', 'weekly', 'monthly', 'payouts'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 text-xs font-black uppercase tracking-wide whitespace-nowrap ${
                            activeTab === tab
                                ? 'text-emerald-600 border-b-2 border-emerald-600'
                                : 'text-gray-500'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw size={32} className="animate-spin text-emerald-600" />
                    </div>
                ) : (
                    <>
                        {activeTab === 'today' && renderTodayEarnings()}
                        {activeTab === 'weekly' && renderWeeklyEarnings()}
                        {activeTab === 'payouts' && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setWithdrawalModal(true)}
                                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-wide"
                                >
                                    Request Withdrawal
                                </button>

                                {payoutHistory.map((payout) => (
                                    <div key={payout._id} className="bg-white rounded-2xl p-4 border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                                payout.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                payout.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {payout.status}
                                            </span>
                                            <p className="text-lg font-black text-gray-900">{formatCurrency(payout.payoutAmount)}</p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {new Date(payout.payoutPeriod.start).toLocaleDateString()} - {new Date(payout.payoutPeriod.end).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Withdrawal Modal */}
            {withdrawalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl p-6 w-full max-w-md"
                    >
                        <h3 className="text-xl font-black uppercase mb-4">Request Withdrawal</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Amount</label>
                                <input
                                    type="number"
                                    value={withdrawalAmount}
                                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold"
                                />
                                {summary && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Available: {formatCurrency(summary.pendingPayout)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Reason (Optional)</label>
                                <textarea
                                    value={withdrawalReason}
                                    onChange={(e) => setWithdrawalReason(e.target.value)}
                                    placeholder="Enter reason"
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setWithdrawalModal(false)}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-black uppercase text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleWithdrawal}
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-sm"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default DriverEarnings;