import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * Offline Indicator Component
 * Shows connection status and queue information
 */
const OfflineIndicator = ({ 
    isOnline, 
    queueSize = 0, 
    isSyncing = false,
    onSync 
}) => {
    // Don't show if online and no queue
    if (isOnline && queueSize === 0 && !isSyncing) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
            >
                <div className="max-w-[430px] mx-auto px-4 pt-4">
                    <div 
                        className={`rounded-2xl p-4 shadow-2xl backdrop-blur-xl border pointer-events-auto transition-all duration-300 ${
                            isOnline 
                                ? 'bg-blue-500/90 border-blue-400/30' 
                                : 'bg-red-500/90 border-red-400/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isOnline ? 'bg-white/20' : 'bg-white/20'
                            }`}>
                                {isSyncing ? (
                                    <RefreshCw size={20} className="text-white animate-spin" />
                                ) : isOnline ? (
                                    <Wifi size={20} className="text-white" />
                                ) : (
                                    <WifiOff size={20} className="text-white" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-white/80 uppercase tracking-widest leading-none mb-1">
                                    {isSyncing ? 'Syncing...' : isOnline ? 'Connection Restored' : 'Offline Mode'}
                                </p>
                                <p className="text-sm font-bold text-white leading-tight">
                                    {isSyncing 
                                        ? `Syncing ${queueSize} pending ${queueSize === 1 ? 'update' : 'updates'}`
                                        : isOnline && queueSize > 0
                                        ? `${queueSize} pending ${queueSize === 1 ? 'update' : 'updates'}`
                                        : isOnline
                                        ? 'All updates synced'
                                        : 'Updates will sync when online'
                                    }
                                </p>
                            </div>

                            {/* Action Button */}
                            {isOnline && queueSize > 0 && !isSyncing && onSync && (
                                <button
                                    onClick={onSync}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[9px] font-black text-white uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    Sync Now
                                </button>
                            )}

                            {/* Queue Size Badge */}
                            {queueSize > 0 && !isSyncing && (
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <span className="text-xs font-black text-white">
                                        {queueSize > 99 ? '99+' : queueSize}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Warning for large queue */}
                        {queueSize > 50 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mt-3 pt-3 border-t border-white/20"
                            >
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={14} className="text-white/80 mt-0.5 flex-shrink-0" />
                                    <p className="text-[9px] font-bold text-white/80 leading-relaxed">
                                        Large queue detected. Some older updates may be discarded to maintain performance.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default OfflineIndicator;
