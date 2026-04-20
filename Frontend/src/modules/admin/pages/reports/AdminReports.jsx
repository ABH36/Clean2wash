import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, DollarSign, Users, Calendar, Download,
    FileText, BarChart3, PieChart, Activity, Filter,
    ChevronDown, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { adminAPI } from '../../../../utils/adminApi';
import { toast } from 'react-hot-toast';

const AdminReports = () => {
    const [activeTab, setActiveTab] = useState('revenue');
    const [period, setPeriod] = useState('monthly');
    const [loading, setLoading] = useState(false);
    const [revenueData, setRevenueData] = useState(null);
    const [driverEarningsData, setDriverEarningsData] = useState(null);
    const [bookingAnalytics, setBookingAnalytics] = useState(null);
    const [financialSummary, setFinancialSummary] = useState(null);
    const [customDateRange, setCustomDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    const TABS = [
        { id: 'revenue', label: 'Revenue', icon: <DollarSign size={16} /> },
        { id: 'driver-earnings', label: 'Driver Earnings', icon: <Users size={16} /> },
        { id: 'bookings', label: 'Booking Analytics', icon: <BarChart3 size={16} /> },
        { id: 'financial', label: 'Financial Summary', icon: <PieChart size={16} /> }
    ];

    const PERIODS = [
        { value: 'daily', label: 'Today' },
        { value: 'weekly', label: 'This Week' },
        { value: 'monthly', label: 'This Month' },
        { value: 'custom', label: 'Custom Range' }
    ];

    useEffect(() => {
        fetchReportData();
    }, [activeTab, period]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const params = {
                period,
                ...(period === 'custom' && customDateRange.startDate && customDateRange.endDate
                    ? { startDate: customDateRange.startDate, endDate: customDateRange.endDate }
                    : {})
            };

            let response;
            switch (activeTab) {
                case 'revenue':
                    response = await adminAPI.getRevenueReport(params);
                    setRevenueData(response.data);
                    break;
                case 'driver-earnings':
                    response = await adminAPI.getDriverEarningsReport(params);
                    setDriverEarningsData(response.data);
                    break;
                case 'bookings':
                    response = await adminAPI.getBookingAnalytics(params);
                    setBookingAnalytics(response.data);
                    break;
                case 'financial':
                    response = await adminAPI.getFinancialSummary(params);
                    setFinancialSummary(response.data);
                    break;
            }
        } catch (error) {
            console.error('Error fetching report:', error);
            toast.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            toast.loading(`Exporting to ${format.toUpperCase()}...`);
            const params = {
                reportType: activeTab,
                period,
                ...(period === 'custom' && customDateRange.startDate && customDateRange.endDate
                    ? { startDate: customDateRange.startDate, endDate: customDateRange.endDate }
                    : {})
            };

            const response = await adminAPI.exportReport(format, params);
            
            // Create download link
            const url = window.URL.createObjectURL(response);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SD_${activeTab.toUpperCase()}_${new Date().toLocaleDateString().replace(/\//g, '-')}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.dismiss();
            toast.success(`Success! Check your downloads.`);
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to export report');
            console.error('Export error:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports & Analytics</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Comprehensive business insights and performance metrics
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Period Selector */}
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                        {PERIODS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>

                    {/* Export Buttons */}
                    <button
                        onClick={() => handleExport('excel')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Download size={16} />
                        Excel
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <FileText size={16} />
                        PDF
                    </button>
                </div>
            </div>

            {/* Custom Date Range */}
            {period === 'custom' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-4 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg"
                >
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={customDateRange.startDate}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={customDateRange.endDate}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                    </div>
                    <button
                        onClick={fetchReportData}
                        className="mt-6 px-6 py-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Apply
                    </button>
                </motion.div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border)]">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === tab.id
                                ? 'bg-[var(--primary)] text-white'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)]'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTab === 'revenue' && revenueData && (
                        <RevenueReport data={revenueData} />
                    )}
                    {activeTab === 'driver-earnings' && driverEarningsData && (
                        <DriverEarningsReport data={driverEarningsData} />
                    )}
                    {activeTab === 'bookings' && bookingAnalytics && (
                        <BookingAnalyticsReport data={bookingAnalytics} />
                    )}
                    {activeTab === 'financial' && financialSummary && (
                        <FinancialSummaryReport data={financialSummary} />
                    )}
                </div>
            )}
        </div>
    );
};

// Revenue Report Component
const RevenueReport = ({ data }) => {
    const { summary, serviceWise, dailyTrend, paymentMethods } = data;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Revenue"
                    value={`₹${summary.totalRevenue?.toLocaleString() || 0}`}
                    icon={<DollarSign size={20} />}
                    trend="+12.5%"
                    trendUp={true}
                />
                <StatCard
                    title="Total Bookings"
                    value={summary.totalBookings || 0}
                    icon={<Activity size={20} />}
                    trend="+8.3%"
                    trendUp={true}
                />
                <StatCard
                    title="Avg Booking Value"
                    value={`₹${Math.round(summary.averageBookingValue) || 0}`}
                    icon={<TrendingUp size={20} />}
                    trend="+5.2%"
                    trendUp={true}
                />
                <StatCard
                    title="Platform Commission"
                    value={`₹${summary.totalCommission?.toLocaleString() || 0}`}
                    icon={<PieChart size={20} />}
                    trend="+10.1%"
                    trendUp={true}
                />
            </div>

            {/* Service-wise Revenue */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Service-wise Revenue
                </h3>
                <div className="space-y-3">
                    {serviceWise?.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                            <div className="flex-1">
                                <p className="font-medium text-[var(--text-primary)]">{service._id}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                    {service.bookings} bookings • Avg: ₹{Math.round(service.avgValue)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-[var(--primary)]">
                                    ₹{service.revenue?.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Daily Trend Chart */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Revenue Trend (Last 30 Days)
                </h3>
                <div className="h-64 flex items-end justify-between gap-2">
                    {dailyTrend?.map((day, index) => {
                        const maxRevenue = Math.max(...dailyTrend.map(d => d.revenue));
                        const height = (day.revenue / maxRevenue) * 100;
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-[var(--primary)] rounded-t-lg transition-all hover:bg-[var(--primary-dark)] cursor-pointer"
                                    style={{ height: `${height}%` }}
                                    title={`₹${day.revenue} - ${day.bookings} bookings`}
                                />
                                <span className="text-[8px] text-[var(--text-muted)]">
                                    {new Date(day._id).getDate()}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Driver Earnings Report Component
const DriverEarningsReport = ({ data }) => {
    const { driverEarnings, topPerformers, summary } = data;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Drivers"
                    value={summary.totalDrivers || 0}
                    icon={<Users size={20} />}
                />
                <StatCard
                    title="Total Earnings"
                    value={`₹${summary.totalEarnings?.toLocaleString() || 0}`}
                    icon={<DollarSign size={20} />}
                />
                <StatCard
                    title="Total Trips"
                    value={summary.totalTrips || 0}
                    icon={<Activity size={20} />}
                />
                <StatCard
                    title="Avg Per Driver"
                    value={`₹${Math.round(summary.avgEarningsPerDriver) || 0}`}
                    icon={<TrendingUp size={20} />}
                />
            </div>

            {/* Top Performers */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Top 10 Performers
                </h3>
                <div className="space-y-3">
                    {topPerformers?.map((driver, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-[var(--bg-secondary)] rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-[var(--text-primary)]">{driver.driverName}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                    {driver.totalTrips} trips • Avg: ₹{Math.round(driver.avgEarningsPerTrip)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-[var(--primary)]">
                                    ₹{driver.totalEarnings?.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Booking Analytics Report Component
const BookingAnalyticsReport = ({ data }) => {
    const { summary, statusBreakdown, peakHours, serviceDistribution } = data;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Bookings"
                    value={summary.totalBookings || 0}
                    icon={<Activity size={20} />}
                />
                <StatCard
                    title="Completion Rate"
                    value={`${summary.completionRate}%`}
                    icon={<TrendingUp size={20} />}
                    trend="+3.2%"
                    trendUp={true}
                />
                <StatCard
                    title="Cancellation Rate"
                    value={`${summary.cancellationRate}%`}
                    icon={<BarChart3 size={20} />}
                    trend="-1.5%"
                    trendUp={false}
                />
                <StatCard
                    title="Avg Trip Duration"
                    value={`${summary.avgTripDuration} min`}
                    icon={<Calendar size={20} />}
                />
            </div>

            {/* Status Breakdown */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Status Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statusBreakdown?.map((status, index) => (
                        <div key={index} className="p-4 bg-[var(--bg-secondary)] rounded-lg text-center">
                            <p className="text-2xl font-bold text-[var(--primary)]">{status.count}</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 capitalize">{status._id}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Peak Hours */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Peak Hours Analysis
                </h3>
                <div className="h-48 flex items-end justify-between gap-1">
                    {peakHours?.slice(0, 24).map((hour, index) => {
                        const maxBookings = Math.max(...peakHours.map(h => h.bookings));
                        const height = (hour.bookings / maxBookings) * 100;
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-[var(--primary)] rounded-t-lg transition-all hover:bg-[var(--primary-dark)] cursor-pointer"
                                    style={{ height: `${height}%` }}
                                    title={`${hour._id}:00 - ${hour.bookings} bookings`}
                                />
                                <span className="text-[8px] text-[var(--text-muted)]">
                                    {hour._id}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Financial Summary Report Component
const FinancialSummaryReport = ({ data }) => {
    const { revenue, wallet, refunds, outstanding, profitLoss } = data;

    return (
        <div className="space-y-6">
            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Gross Revenue"
                    value={`₹${revenue.gross?.toLocaleString() || 0}`}
                    icon={<DollarSign size={20} />}
                />
                <StatCard
                    title="Platform Commission"
                    value={`₹${revenue.commission?.toLocaleString() || 0}`}
                    icon={<PieChart size={20} />}
                />
                <StatCard
                    title="Driver Payouts"
                    value={`₹${revenue.driverPayouts?.toLocaleString() || 0}`}
                    icon={<Users size={20} />}
                />
                <StatCard
                    title="Net Revenue"
                    value={`₹${revenue.net?.toLocaleString() || 0}`}
                    icon={<TrendingUp size={20} />}
                />
            </div>

            {/* Wallet & Refunds */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                        Wallet Transactions
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <span className="text-sm font-medium text-[var(--text-secondary)]">Credits</span>
                            <span className="text-lg font-bold text-green-600">₹{wallet.credits?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <span className="text-sm font-medium text-[var(--text-secondary)]">Debits</span>
                            <span className="text-lg font-bold text-red-600">₹{wallet.debits?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                            <span className="text-sm font-medium text-[var(--text-secondary)]">Net</span>
                            <span className="text-lg font-bold text-[var(--primary)]">₹{wallet.net?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                        Refunds & Outstanding
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-[var(--text-secondary)]">Total Refunds</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">{refunds.count} transactions</p>
                            </div>
                            <span className="text-lg font-bold text-red-600">₹{refunds.total?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-[var(--text-secondary)]">Outstanding Payments</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">{outstanding.count} pending</p>
                            </div>
                            <span className="text-lg font-bold text-orange-600">₹{outstanding.total?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profit & Loss */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Profit & Loss Statement
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                        <span className="text-sm font-medium text-[var(--text-secondary)]">Revenue</span>
                        <span className="text-lg font-bold text-green-600">₹{profitLoss.revenue?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                        <span className="text-sm font-medium text-[var(--text-secondary)]">Expenses</span>
                        <span className="text-lg font-bold text-red-600">₹{profitLoss.expenses?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-[var(--primary)] text-white rounded-lg">
                        <span className="text-sm font-bold">Net Profit</span>
                        <span className="text-xl font-bold">₹{profitLoss.profit?.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ title, value, icon, trend, trendUp }) => (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend}
                </div>
            )}
        </div>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">{title}</p>
    </div>
);

export default AdminReports;
