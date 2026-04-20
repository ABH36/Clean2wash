import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, MapPin, Clock, CheckCircle, Phone, Navigation } from 'lucide-react';

/**
 * Quick Reply Panel Component
 * Provides contextual quick replies based on trip status
 */
const QuickReplyPanel = ({ 
    isVisible, 
    onClose, 
    onSelectReply, 
    tripStatus = 'pending',
    customReplies = [] 
}) => {
    const getQuickReplies = () => {
        const baseReplies = {
            pending: [
                { text: "I'll accept your trip shortly 👍", icon: Clock },
                { text: "Checking my availability 🔍", icon: Clock },
            ],
            confirmed: [
                { text: "Trip confirmed! Getting ready 🚗", icon: CheckCircle },
                { text: "I'll be there in 10 minutes ⏰", icon: Clock },
                { text: "Please share your exact location 📍", icon: MapPin },
            ],
            en_route: [
                { text: "I'm on my way to you 🚗", icon: Navigation },
                { text: "Arriving in 5 minutes ⏰", icon: Clock },
                { text: "Running slightly late, sorry! 😅", icon: Clock },
                { text: "Please wait at the pickup point 📍", icon: MapPin },
                { text: "Call me if you need directions 📞", icon: Phone },
            ],
            arrived: [
                { text: "I've arrived at your location 📍", icon: MapPin },
                { text: "I'm here! Please come out 👋", icon: CheckCircle },
                { text: "Waiting at the pickup point 🚗", icon: MapPin },
                { text: "Can't find you, please call me 📞", icon: Phone },
            ],
            active: [
                { text: "Trip started! Buckle up 🚗", icon: CheckCircle },
                { text: "We're on our way to destination 🗺️", icon: Navigation },
                { text: "ETA to destination: 15 minutes ⏰", icon: Clock },
                { text: "Traffic is light, good timing! 🚦", icon: Navigation },
                { text: "Let me know if you need AC/music 🎵", icon: CheckCircle },
            ],
            completed: [
                { text: "Trip completed successfully! ✅", icon: CheckCircle },
                { text: "Thank you for choosing us 🙏", icon: CheckCircle },
                { text: "Have a great day! 😊", icon: CheckCircle },
                { text: "Please rate your experience ⭐", icon: CheckCircle },
            ]
        };

        const statusReplies = baseReplies[tripStatus] || baseReplies.confirmed;
        
        // Add custom replies
        const allReplies = [
            ...statusReplies,
            ...customReplies.map(text => ({ text, icon: Zap }))
        ];

        return allReplies;
    };

    const quickReplies = getQuickReplies();

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Zap size={16} className="text-blue-500" />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                Quick Replies
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                {tripStatus}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <X size={16} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Quick Reply Grid */}
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                        {quickReplies.map((reply, index) => {
                            const IconComponent = reply.icon;
                            return (
                                <motion.button
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => onSelectReply(reply.text)}
                                    className="flex items-center gap-3 p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                                        <IconComponent size={14} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                        {reply.text}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Footer Tip */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            💡 Tap any message to send instantly
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QuickReplyPanel;