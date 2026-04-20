import React from 'react';
import { motion } from 'framer-motion';
import { 
    Check, CheckCheck, MapPin, AlertCircle, 
    Reply, Copy, Clock, User
} from 'lucide-react';

/**
 * Enhanced Chat Bubble Component
 * Supports multiple message types with rich interactions
 */
const ChatBubble = ({ 
    message, 
    isOwn = false, 
    onReply, 
    onCopy, 
    onLongPress,
    showActions = false 
}) => {
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusIcon = () => {
        if (!isOwn) return null;
        
        switch (message.status) {
            case 'sent':
                return <Check size={12} className="text-gray-400" />;
            case 'delivered':
                return <CheckCheck size={12} className="text-gray-400" />;
            case 'read':
                return <CheckCheck size={12} className="text-blue-500" />;
            default:
                return null;
        }
    };

    const renderMessageContent = () => {
        switch (message.messageType) {
            case 'text':
                return (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content?.text}
                    </p>
                );

            case 'location':
                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-current" />
                            <span className="text-sm font-bold">Location Shared</span>
                        </div>
                        <p className="text-xs opacity-80">
                            {message.content?.location?.address || 'Current Location'}
                        </p>
                        <button 
                            onClick={() => {
                                const { lat, lng } = message.content.location;
                                window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
                            }}
                            className="text-xs underline opacity-80 hover:opacity-100 transition-opacity"
                        >
                            View on Maps
                        </button>
                    </div>
                );

            case 'system':
                return (
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} />
                        <p className="text-sm font-bold">
                            {message.content?.text}
                        </p>
                    </div>
                );

            case 'image':
                return (
                    <div className="space-y-2">
                        <img 
                            src={message.content?.imageUrl} 
                            alt="Shared image"
                            className="max-w-full h-auto rounded-lg"
                        />
                        {message.content?.text && (
                            <p className="text-sm">{message.content.text}</p>
                        )}
                    </div>
                );

            case 'voice':
                return (
                    <div className="flex items-center gap-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Volume2 size={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-white/20 rounded-full">
                                    <div className="w-1/3 h-full bg-white rounded-full" />
                                </div>
                                <span className="text-xs opacity-80">0:15</span>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <p className="text-sm text-gray-400 italic">
                        Unsupported message type
                    </p>
                );
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
        >
            <div 
                className={`max-w-[85%] relative ${isOwn ? 'ml-12' : 'mr-12'}`}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onLongPress?.(message);
                }}
            >
                {/* Reply Reference */}
                {message.replyTo && (
                    <div className="mb-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-2 border-blue-500">
                        <div className="flex items-center gap-2 mb-1">
                            <Reply size={12} className="text-blue-500" />
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                {message.replyTo.sender?.name}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {message.replyTo.content?.text}
                        </p>
                    </div>
                )}

                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 relative ${
                    message.messageType === 'system'
                        ? 'bg-yellow-100 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300'
                        : isOwn
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                }`}>
                    {/* Sender Name (for group chats) */}
                    {!isOwn && message.sender?.name && (
                        <div className="flex items-center gap-2 mb-2">
                            <User size={12} className="text-gray-500" />
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                {message.sender.name}
                            </span>
                        </div>
                    )}

                    {/* Message Content */}
                    {renderMessageContent()}

                    {/* Message Footer */}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                            <Clock size={10} className={`${
                                isOwn ? 'text-white/60' : 'text-gray-400'
                            }`} />
                            <span className={`text-xs ${
                                isOwn ? 'text-white/60' : 'text-gray-400'
                            }`}>
                                {formatTime(message.createdAt)}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            {getStatusIcon()}
                        </div>
                    </div>
                </div>

                {/* Quick Actions (Show on Hover) */}
                {showActions && (
                    <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 shadow-lg">
                            <button
                                onClick={() => onReply?.(message)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                title="Reply"
                            >
                                <Reply size={12} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={() => onCopy?.(message)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                title="Copy"
                            >
                                <Copy size={12} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ChatBubble;