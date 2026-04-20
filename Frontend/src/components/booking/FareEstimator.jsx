import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Info, Loader2, TrendingUp, Tag, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { serviceAPI } from '../../utils/api';

/**
 * Fare Estimator Component
 * Shows real-time fare estimation before booking
 * 
 * Features:
 * - Real-time price calculation
 * - Breakdown of charges
 * - Surge pricing indicator
 * - Discount/promo display
 * - Loading states
 */

const FareEstimator = ({
    serviceType,
    vehicleType,
    duration,
    distance,
    addons = [],
    pickupLocation,
    dropLocation,
    scheduledTime,
    onPriceCalculated,
    className = ''
}) => {
    const [loading, setLoading] = useState(false);
    const [pricing, setPricing] = useState(null);
    const [error, setError] = useState(null);
    const [showBreakdown, setShowBreakdown] = useState(false);

    // Calculate fare whenever inputs change
    useEffect(() => {
        if (serviceType && vehicleType) {
            calculateFare();
        }
    }, [serviceType, vehicleType, duration, distance, addons, scheduledTime]);

    const calculateFare = async () => {
        setLoading(true);
        setError(null);

        try {
            // Determine which API to call based on service type
            const isSpareDriver = ['point', 'hourly', 'full', 'outstation'].includes(serviceType);

            let response;
            
            if (isSpareDriver) {
                // Spare driver pricing
                response = await serviceAPI.calculateSpareDriverPricing({
                    serviceType,
                    vehicleType,
                    duration: duration || '4 Hours',
                    distance: distance || 0,
                    pickupLocation,
                    dropLocation,
                    scheduledTime,
                    isScheduled: !!scheduledTime
                });
            } else {
                // Regular service pricing (wash, etc.)
                response = await serviceAPI.calculatePricing({
                    serviceId: serviceType,
                    vehicleType,
                    addons: addons.map(a => a.id || a)
                });
            }

            if (response.status === 'success' && response.data?.pricing) {
                const pricingData = response.data.pricing;
                setPricing(pricingData);
                
                // Notify parent component
                if (onPriceCalculated) {
                    onPriceCalculated(pricingData);
                }
            } else {
                throw new Error('Failed to calculate fare');
            }
        } catch (err) {
            console.error('[FareEstimator] Calculation error:', err);
            setError(err.message || 'Unable to calculate fare');
            toast.error('Unable to calculate fare. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Format currency
    const formatPrice = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate savings if discount applied
    const calculateSavings = () => {
        if (!pricing) return 0;
        
        const { discount = 0, promoDiscount = 0 } = pricing;
        return discount + promoDiscount;
    };

    const savings = calculateSavings();
    const hasSurge = pricing?.surgeMultiplier > 1;

    if (!serviceType || !vehicleType) {
        return null;
    }

    return (
        <div className={`fare-estimator ${className}`}>
            {/* Main Fare Display */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Fare Estimate
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Real-time pricing
                            </p>
                        </div>
                    </div>

                    {/* Info Button */}
                    <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        <span className="ml-3 text-slate-600 dark:text-slate-400">
                            Calculating fare...
                        </span>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-900 dark:text-red-200">
                                {error}
                            </p>
                            <button
                                onClick={calculateFare}
                                className="text-xs text-red-600 dark:text-red-400 hover:underline mt-1"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                )}

                {/* Price Display */}
                {pricing && !loading && !error && (
                    <div className="space-y-4">
                        {/* Total Amount */}
                        <div className="text-center py-4">
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                                    {formatPrice(pricing.totalAmount || pricing.total)}
                                </span>
                                {hasSurge && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                                        <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                            {pricing.surgeMultiplier}x
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {savings > 0 && (
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className="text-sm text-slate-500 dark:text-slate-400 line-through">
                                        {formatPrice((pricing.totalAmount || pricing.total) + savings)}
                                    </span>
                                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                                        <Tag className="w-3 h-3 text-green-600 dark:text-green-400" />
                                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                            Save {formatPrice(savings)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Summary */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    Base Fare
                                </p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    {formatPrice(pricing.baseAmount || pricing.baseFare)}
                                </p>
                            </div>
                            
                            {pricing.gst > 0 && (
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                        GST (18%)
                                    </p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {formatPrice(pricing.gst)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Breakdown Toggle */}
                        <AnimatePresence>
                            {showBreakdown && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700"
                                >
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                                        Price Breakdown
                                    </h4>

                                    {/* Base Amount */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            Base fare
                                        </span>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {formatPrice(pricing.baseAmount || pricing.baseFare)}
                                        </span>
                                    </div>

                                    {/* Vehicle Adjustment */}
                                    {pricing.vehicleAdjustment > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">
                                                Vehicle type adjustment
                                            </span>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                +{formatPrice(pricing.vehicleAdjustment)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Distance Charges */}
                                    {pricing.distanceCharges > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">
                                                Distance charges
                                            </span>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                +{formatPrice(pricing.distanceCharges)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Duration Charges */}
                                    {pricing.durationCharges > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">
                                                Duration charges
                                            </span>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                +{formatPrice(pricing.durationCharges)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Addons */}
                                    {pricing.addonAmount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">
                                                Add-ons
                                            </span>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                +{formatPrice(pricing.addonAmount)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Surge */}
                                    {hasSurge && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-red-600 dark:text-red-400">
                                                Surge pricing ({pricing.surgeMultiplier}x)
                                            </span>
                                            <span className="font-medium text-red-600 dark:text-red-400">
                                                +{formatPrice(pricing.surgeAmount || 0)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Discount */}
                                    {pricing.discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-green-600 dark:text-green-400">
                                                Discount
                                            </span>
                                            <span className="font-medium text-green-600 dark:text-green-400">
                                                -{formatPrice(pricing.discount)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Promo Discount */}
                                    {pricing.promoDiscount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-green-600 dark:text-green-400">
                                                Promo code
                                            </span>
                                            <span className="font-medium text-green-600 dark:text-green-400">
                                                -{formatPrice(pricing.promoDiscount)}
                                            </span>
                                        </div>
                                    )}

                                    {/* GST */}
                                    {pricing.gst > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">
                                                GST (18%)
                                            </span>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                +{formatPrice(pricing.gst)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-slate-900 dark:text-white">
                                            Total Amount
                                        </span>
                                        <span className="text-orange-500">
                                            {formatPrice(pricing.totalAmount || pricing.total)}
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Surge Warning */}
                        {hasSurge && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <TrendingUp className="w-4 h-4 text-red-500 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-red-900 dark:text-red-200">
                                        High demand pricing active
                                    </p>
                                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                        Prices are {pricing.surgeMultiplier}x higher due to high demand in your area.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Refresh Button */}
                        <button
                            onClick={calculateFare}
                            disabled={loading}
                            className="w-full py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Refresh estimate
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default FareEstimator;

