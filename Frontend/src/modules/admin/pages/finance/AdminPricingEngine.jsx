import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    DollarSign, Percent, Zap, Moon, Calendar, MapPin, 
    Save, RefreshCw, Calculator, TrendingUp, Clock,
    Car, User, CheckCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../../utils/adminApi';

const AdminPricingEngine = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [calculating, setCalculating] = useState(false);
    
    // Pricing calculator state
    const [calculator, setCalculator] = useState({
        serviceType: 'hourly',
        duration: 8,
        vehicleType: 'sedan',
        isScheduled: false,
        isSubscriber: false,
        scheduledTime: new Date().toISOString()
    });
    const [pricingResult, setPricingResult] = useState(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getPricingConfig();
            if (res.status === 'success') {
                setConfig(res.data.config);
            }
        } catch (error) {
            console.error('Failed to load pricing config:', error);
            toast.error('Failed to load pricing configuration');
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            const res = await adminAPI.updatePricingConfig(config);
            if (res.status === 'success') {
                toast.success('Pricing configuration updated successfully');
                loadConfig();
            }
        } catch (error) {
            console.error('Failed to update config:', error);
            toast.error('Failed to update configuration');
        } finally {
            setSaving(false);
        }
    };

    const calculatePrice = async () => {
        setCalculating(true);
        try {
            const res = await adminAPI.calculatePrice(calculator);
            if (res.status === 'success') {
                setPricingResult(res.data.pricing);
                toast.success('Price calculated successfully');
            }
        } catch (error) {
            console.error('Failed to calculate price:', error);
            toast.error(error.message || 'Failed to calculate price');
        } finally {
            setCalculating(false);
        }
    };

    const toggleSurge = async () => {
        try {
            const res = await adminAPI.toggleSurge();
            if (res.status === 'success') {
                toast.success(res.message);
                loadConfig();
            }
        } catch (error) {
            toast.error('Failed to toggle surge pricing');
        }
    };

    const toggleNightCharges = async () => {
        try {
            const res = await adminAPI.toggleNightCharges();
            if (res.status === 'success') {
                toast.success(res.message);
                loadConfig();
            }
        } catch (error) {
            toast.error('Failed to toggle night charges');
        }
    };

    if (loading || !config) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw size={32} className="animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10 max-w-full mx-auto px-4 bg-[var(--bg)] min-h-screen">
            {/* Header */}
            <div className="admin-card">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pricing Engine</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Configure GST, commission, surge, night charges, and more
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadConfig}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            onClick={saveConfig}
                            disabled={saving}
                            className="btn-primary flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Configuration
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN - Configuration */}
                <div className="space-y-6">
                    {/* GST Configuration */}
                    <div className="admin-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Percent size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">GST Configuration</h3>
                                    <p className="text-sm text-gray-600">Goods and Services Tax</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, isGstEnabled: !config.isGstEnabled })}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    config.isGstEnabled
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {config.isGstEnabled ? 'Enabled' : 'Disabled'}
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                GST Percentage (%)
                            </label>
                            <input
                                type="number"
                                value={config.gstPercent}
                                onChange={(e) => setConfig({ ...config, gstPercent: parseFloat(e.target.value) })}
                                className="admin-input"
                                disabled={!config.isGstEnabled}
                            />
                        </div>
                    </div>

                    {/* Platform Commission */}
                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Platform Commission</h3>
                                <p className="text-sm text-gray-600">Revenue share percentage</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Commission Percentage (%)
                            </label>
                            <input
                                type="number"
                                value={config.platformCommissionPercent}
                                onChange={(e) => setConfig({ ...config, platformCommissionPercent: parseFloat(e.target.value) })}
                                className="admin-input"
                            />
                        </div>
                    </div>

                    {/* Surge Pricing */}
                    <div className="admin-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Surge Pricing</h3>
                                    <p className="text-sm text-gray-600">Peak hours multiplier</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleSurge}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    config.isSurgeEnabled
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {config.isSurgeEnabled ? 'Enabled' : 'Disabled'}
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Surge Multiplier (e.g., 1.5x)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={config.surgeMultiplier}
                                onChange={(e) => setConfig({ ...config, surgeMultiplier: parseFloat(e.target.value) })}
                                className="admin-input"
                                disabled={!config.isSurgeEnabled}
                            />
                        </div>
                    </div>

                    {/* Night Charges */}
                    <div className="admin-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <Moon size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Night Charges</h3>
                                    <p className="text-sm text-gray-600">11 PM - 5 AM surcharge</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleNightCharges}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    config.isNightEnabled
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {config.isNightEnabled ? 'Enabled' : 'Disabled'}
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Night Charge Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={config.nightCharge}
                                onChange={(e) => setConfig({ ...config, nightCharge: parseFloat(e.target.value) })}
                                className="admin-input"
                                disabled={!config.isNightEnabled}
                            />
                        </div>
                    </div>

                    {/* Scheduled Premium */}
                    <div className="admin-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Scheduled Premium</h3>
                                    <p className="text-sm text-gray-600">Advance booking charge</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, isScheduledPremiumEnabled: !config.isScheduledPremiumEnabled })}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    config.isScheduledPremiumEnabled
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {config.isScheduledPremiumEnabled ? 'Enabled' : 'Disabled'}
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Premium Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={config.scheduledPremium}
                                onChange={(e) => setConfig({ ...config, scheduledPremium: parseFloat(e.target.value) })}
                                className="admin-input"
                                disabled={!config.isScheduledPremiumEnabled}
                            />
                        </div>
                    </div>

                    {/* Outstation Allowance */}
                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Outstation Allowance</h3>
                                <p className="text-sm text-gray-600">Driver stay & food per day</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Allowance Amount (₹/day)
                            </label>
                            <input
                                type="number"
                                value={config.outstationAllowance}
                                onChange={(e) => setConfig({ ...config, outstationAllowance: parseFloat(e.target.value) })}
                                className="admin-input"
                            />
                        </div>
                    </div>

                    {/* Wallet Hold */}
                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Wallet Hold</h3>
                                <p className="text-sm text-gray-600">Reserve amount for overtime</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Hold Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={config.walletHoldAmount}
                                onChange={(e) => setConfig({ ...config, walletHoldAmount: parseFloat(e.target.value) })}
                                className="admin-input"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - Pricing Calculator */}
                <div className="space-y-6">
                    <div className="admin-card sticky top-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                                <Calculator size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Pricing Calculator</h3>
                                <p className="text-sm text-gray-600">Preview pricing with current configuration</p>
                            </div>
                        </div>

                        {/* Calculator Inputs */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Service Type
                                </label>
                                <select
                                    value={calculator.serviceType}
                                    onChange={(e) => setCalculator({ ...calculator, serviceType: e.target.value })}
                                    className="admin-input"
                                >
                                    <option value="point">Point-to-Point</option>
                                    <option value="hourly">Hourly</option>
                                    <option value="full_day">Full Day</option>
                                    <option value="outstation">Outstation</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Duration (hours)
                                </label>
                                <input
                                    type="number"
                                    value={calculator.duration}
                                    onChange={(e) => setCalculator({ ...calculator, duration: parseFloat(e.target.value) })}
                                    className="admin-input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Vehicle Type
                                </label>
                                <select
                                    value={calculator.vehicleType}
                                    onChange={(e) => setCalculator({ ...calculator, vehicleType: e.target.value })}
                                    className="admin-input"
                                >
                                    <option value="hatchback">Hatchback (1.0x)</option>
                                    <option value="sedan">Sedan (1.2x)</option>
                                    <option value="suv">SUV (1.5x)</option>
                                    <option value="luxury">Luxury (2.0x)</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={calculator.isSubscriber}
                                        onChange={(e) => setCalculator({ ...calculator, isSubscriber: e.target.checked })}
                                        className="w-4 h-4 text-[var(--primary)] rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Subscriber</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={calculator.isScheduled}
                                        onChange={(e) => setCalculator({ ...calculator, isScheduled: e.target.checked })}
                                        className="w-4 h-4 text-[var(--primary)] rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Scheduled</span>
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={calculatePrice}
                            disabled={calculating}
                            className="btn-primary w-full flex items-center justify-center gap-2 mb-6"
                        >
                            {calculating ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    Calculating...
                                </>
                            ) : (
                                <>
                                    <Calculator size={16} />
                                    Calculate Price
                                </>
                            )}
                        </button>

                        {/* Pricing Result */}
                        {pricingResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="border-t border-gray-200 pt-4">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3">Pricing Breakdown</h4>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Base Amount:</span>
                                            <span className="font-semibold">₹{pricingResult.baseAmount.toFixed(2)}</span>
                                        </div>
                                        
                                        {pricingResult.overtimeAmount > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Overtime:</span>
                                                <span className="font-semibold">₹{pricingResult.overtimeAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        
                                        {pricingResult.addons.total > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Add-ons:</span>
                                                <span className="font-semibold">₹{pricingResult.addons.total.toFixed(2)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between pt-2 border-t">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span className="font-semibold">₹{pricingResult.subtotal.toFixed(2)}</span>
                                        </div>
                                        
                                        {pricingResult.surge.isApplied && (
                                            <div className="flex justify-between text-amber-600">
                                                <span>Surge ({pricingResult.surge.multiplier}x):</span>
                                                <span className="font-semibold">₹{pricingResult.surge.amount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        
                                        {pricingResult.gst.isApplied && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">GST ({pricingResult.gst.percent}%):</span>
                                                <span className="font-semibold">₹{pricingResult.gst.amount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                                            <span className="text-lg font-bold text-gray-900">Final Amount:</span>
                                            <span className="text-lg font-bold text-[var(--primary)]">₹{pricingResult.finalAmount.toFixed(2)}</span>
                                        </div>
                                        
                                        <div className="pt-3 border-t mt-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Platform Commission ({pricingResult.commission.percent}%):</span>
                                                <span className="font-semibold text-red-600">-₹{pricingResult.commission.amount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm mt-2">
                                                <span className="text-gray-600">Driver Earning:</span>
                                                <span className="font-semibold text-emerald-600">₹{pricingResult.driverEarning.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPricingEngine;
