import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Send, Phone, MapPin, Clock, Camera, Mic, MoreVertical, 
    Navigation, MessageSquare, AlertCircle, CheckCircle2, Check, 
    CheckCheck, Image, Volume2, VolumeX, Copy, Reply, Trash2,
    Paperclip, Smile, Info, Star, ThumbsUp, Heart, Laugh, Zap, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { socketService } from '../../../utils/socket';
import DriverLayout from '../components/DriverLayout';

const DriverChatEnhanced = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showMessageActions, setShowMessageActions] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!bookingId) return;

        const fetchData = async () => {
            try {
                const [bookingRes, messagesRes] = await Promise.all([
                    spareDriverAPI.getBooking(bookingId),
                    spareDriverAPI.getChatMessages(bookingId)
                ]);

                setBooking(bookingRes.data.booking);
                setMessages(messagesRes.data.messages || []);
            } catch (error) {
                console.error('Failed to load chat data:', error);
                toast.error('Failed to load chat');
                navigate('/spare-driver/bookings');
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Join chat room
        const token = localStorage.getItem('chauffeur_token');
        if (token) {
            socketService.connect(token);
            socketService.joinBookingRoom(bookingId);

            const socket = socketService.getSocket();
            if (socket) {
                socket.on('new_message', (data) => {
                    if (data.bookingId === bookingId) {
                        setMessages(prev => [...prev, data.message]);
                        // Mark as read if chat is open
                        spareDriverAPI.markChatAsRead(bookingId);
                    }
                });

                socket.on('user_typing', (data) => {
                    if (data.bookingId === bookingId && data.userType === 'consumer') {
                        setIsTyping(true);
                        clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = setTimeout(() => {
                            setIsTyping(false);
                        }, 3000);
                    }
                });

                socket.on('user_stopped_typing', (data) => {
                    if (data.bookingId === bookingId && data.userType === 'consumer') {
                        setIsTyping(false);
                    }
                });

                socket.on('messages_read', (data) => {
                    if (data.bookingId === bookingId) {
                        setMessages(prev => prev.map(msg => 
                            msg.sender?.type === 'SpareDriver' 
                                ? { ...msg, status: 'read' }
                                : msg
                        ));
                    }
                });
            }
        }

        return () => {
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('new_message');
                socket.off('user_typing');
                socket.off('user_stopped_typing');
                socket.off('messages_read');
            }
            clearTimeout(typingTimeoutRef.current);
        };
    }, [bookingId, navigate]);

    const handleSendMessage = async (messageType = 'text', content = null) => {
        const messageContent = content || newMessage.trim();
        if (!messageContent || sending) return;

        setSending(true);
        try {
            const messageData = {
                messageType,
                content: messageType === 'text' 
                    ? { text: messageContent }
                    : content
            };

            if (replyingTo) {
                messageData.replyTo = replyingTo._id;
            }

            await spareDriverAPI.sendChatMessage(bookingId, messageData);
            setNewMessage('');
            setReplyingTo(null);
            setShowQuickReplies(false);
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleSendLocation = async () => {
        if (!navigator.geolocation) {
            toast.error('Location not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await spareDriverAPI.sendLocation(bookingId, {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        address: 'Current Location'
                    });
                    toast.success('Location shared');
                } catch (error) {
                    toast.error('Failed to share location');
                }
            },
            () => {
                toast.error('Failed to get location');
            }
        );
    };

    const handleTyping = () => {
        socketService.emit('typing', { bookingId, userType: 'driver' });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketService.emit('stopped_typing', { bookingId, userType: 'driver' });
        }, 1000);
    };

    const handleMessageLongPress = (message) => {
        setSelectedMessage(message);
        setShowMessageActions(true);
    };

    const handleCopyMessage = (message) => {
        if (message.content?.text) {
            navigator.clipboard.writeText(message.content.text);
            toast.success('Message copied');
        }
        setShowMessageActions(false);
    };

    const handleReplyToMessage = (message) => {
        setReplyingTo(message);
        setShowMessageActions(false);
    };

    const startVoiceRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('file', blob, `voice_${Date.now()}.webm`);
                formData.append('bookingId', bookingId);

                try {
                    setSending(true);
                    const uploadResponse = await spareDriverAPI.uploadChatFile(formData);
                    
                    await spareDriverAPI.sendChatMessage(bookingId, {
                        messageType: 'voice',
                        content: {
                            voiceUrl: uploadResponse.data.fileUrl,
                            duration: recordingTime
                        }
                    });
                    
                    toast.success('Voice message sent!');
                } catch (error) {
                    toast.error('Failed to send voice message');
                } finally {
                    setSending(false);
                }

                // Clean up
                stream.getTracks().forEach(track => track.stop());
            };

            setMediaRecorder(recorder);
            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            const timer = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 60) { // Max 60 seconds
                        stopVoiceRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

            // Store timer reference
            recorder.timer = timer;

        } catch (error) {
            toast.error('Microphone access denied');
        }
    };

    const stopVoiceRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            clearInterval(mediaRecorder.timer);
            setIsRecording(false);
            setRecordingTime(0);
            setMediaRecorder(null);
        }
    };

    const handleToggleReaction = async (messageId, emoji) => {
        try {
            // Check if user already reacted with this emoji
            const message = messages.find(m => m._id === messageId);
            const reaction = message?.reactions?.find(r => r.emoji === emoji);
            const userId = localStorage.getItem('chauffeur_user_id');
            const hasReacted = reaction?.users?.includes(userId);

            if (hasReacted) {
                await spareDriverAPI.removeMessageReaction(bookingId, messageId, emoji);
            } else {
                await spareDriverAPI.addMessageReaction(bookingId, messageId, emoji);
            }

            // Update local state optimistically
            setMessages(prev => prev.map(msg => {
                if (msg._id === messageId) {
                    const updatedReactions = [...(msg.reactions || [])];
                    const reactionIndex = updatedReactions.findIndex(r => r.emoji === emoji);
                    
                    if (reactionIndex >= 0) {
                        if (hasReacted) {
                            // Remove user from reaction
                            updatedReactions[reactionIndex].users = updatedReactions[reactionIndex].users.filter(id => id !== userId);
                            updatedReactions[reactionIndex].count--;
                            
                            // Remove reaction if no users left
                            if (updatedReactions[reactionIndex].count === 0) {
                                updatedReactions.splice(reactionIndex, 1);
                            }
                        } else {
                            // Add user to reaction
                            updatedReactions[reactionIndex].users.push(userId);
                            updatedReactions[reactionIndex].count++;
                        }
                    } else if (!hasReacted) {
                        // Create new reaction
                        updatedReactions.push({
                            emoji,
                            count: 1,
                            users: [userId]
                        });
                    }
                    
                    return { ...msg, reactions: updatedReactions };
                }
                return msg;
            }));

        } catch (error) {
            toast.error('Failed to add reaction');
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMessageStatusIcon = (message) => {
        if (message.sender?.type !== 'SpareDriver') return null;
        
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

    const quickReplies = [
        "I'm on my way 🚗",
        "Reached your location 📍",
        "Running 5 minutes late ⏰",
        "Please share exact location 🗺️",
        "Trip completed successfully ✅",
        "Thank you for choosing us 🙏",
        "Have a great day! 😊"
    ];

    const emojis = ['👍', '❤️', '😊', '😂', '🙏', '👌', '🚗', '⭐', '🔥', '💯'];

    if (loading) {
        return (
            <DriverLayout title="Chat" showBack>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
            </DriverLayout>
        );
    }

    if (!booking) {
        return (
            <DriverLayout title="Chat" showBack>
                <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                    <AlertCircle size={48} className="text-gray-400 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Booking Not Found</h3>
                    <p className="text-gray-400 text-sm">This booking may have been cancelled or completed.</p>
                </div>
            </DriverLayout>
        );
    }

    return (
        <DriverLayout hideNav>
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-brand/10 to-brand/5 border-b border-brand/10 px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                    <button 
                        onClick={() => navigate('/spare-driver/bookings')}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                    >
                        <ArrowLeft size={20} className="text-content" />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                        <h2 className="font-black text-content text-lg truncate">
                            {booking.consumer?.name || 'Customer'}
                        </h2>
                        <p className="text-xs text-content/60 truncate">
                            {booking.service?.name} • {booking.bookingId}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <a 
                            href={`tel:${booking.consumer?.phone}`}
                            className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center"
                        >
                            <Phone size={18} />
                        </a>
                        <button 
                            onClick={() => navigate(`/spare-driver/bookings/${bookingId}`)}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                        >
                            <Info size={18} className="text-content" />
                        </button>
                    </div>
                </div>

                {/* Trip Status */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
                    <MapPin size={14} className="text-brand" />
                    <p className="text-xs font-bold text-content/80 truncate">
                        {booking.location?.address?.street || 'Location not available'}
                    </p>
                    <div className="ml-auto flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-black text-green-500 uppercase">
                            {booking.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-surface/50 to-surface">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare size={48} className="text-content/20 mb-4" />
                        <h3 className="font-black text-content/40 mb-2 uppercase">Start Conversation</h3>
                        <p className="text-content/20 text-sm">Send a message to your customer</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <motion.div
                            key={message._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.sender?.type === 'SpareDriver' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div 
                                className={`max-w-[85%] group ${
                                    message.sender?.type === 'SpareDriver' ? 'ml-12' : 'mr-12'
                                }`}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    handleMessageLongPress(message);
                                }}
                            >
                                {/* Reply Reference */}
                                {message.replyTo && (
                                    <div className="mb-2 px-3 py-2 bg-content/5 rounded-lg border-l-2 border-brand">
                                        <p className="text-xs text-content/60 font-bold">
                                            Replying to {message.replyTo.sender?.name}
                                        </p>
                                        <p className="text-xs text-content/80 truncate">
                                            {message.replyTo.content?.text}
                                        </p>
                                    </div>
                                )}

                                <div className={`rounded-2xl px-4 py-3 relative ${
                                    message.sender?.type === 'SpareDriver'
                                        ? 'bg-brand text-white'
                                        : message.messageType === 'system'
                                        ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                                        : 'bg-surface border border-content/10 text-content'
                                }`}>
                                    {/* Message Content */}
                                    {message.messageType === 'text' && (
                                        <p className="text-sm leading-relaxed">
                                            {message.content?.text}
                                        </p>
                                    )}

                                    {message.messageType === 'location' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-current" />
                                                <span className="text-sm font-bold">Location Shared</span>
                                            </div>
                                            <p className="text-xs opacity-80">
                                                {message.content?.location?.address}
                                            </p>
                                            <button 
                                                onClick={() => {
                                                    const { lat, lng } = message.content.location;
                                                    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
                                                }}
                                                className="text-xs underline opacity-80 hover:opacity-100"
                                            >
                                                View on Maps
                                            </button>
                                        </div>
                                    )}

                                    {message.messageType === 'image' && (
                                        <div className="space-y-2">
                                            <img 
                                                src={message.content?.fileUrl} 
                                                alt="Shared image"
                                                className="max-w-full h-auto rounded-lg cursor-pointer"
                                                onClick={() => window.open(message.content?.fileUrl, '_blank')}
                                            />
                                            {message.content?.text && (
                                                <p className="text-sm">{message.content.text}</p>
                                            )}
                                        </div>
                                    )}

                                    {message.messageType === 'voice' && (
                                        <div className="flex items-center gap-3 py-2">
                                            <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                                                <Volume2 size={16} />
                                            </button>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1 bg-white/20 rounded-full">
                                                        <div className="w-1/3 h-full bg-white rounded-full" />
                                                    </div>
                                                    <span className="text-xs opacity-80">
                                                        {message.content?.duration || 0}s
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {message.messageType === 'file' && (
                                        <div className="flex items-center gap-3 p-2 bg-white/10 rounded-lg">
                                            <Paperclip size={16} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">
                                                    {message.content?.fileName}
                                                </p>
                                                <p className="text-xs opacity-80">
                                                    {(message.content?.fileSize / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => window.open(message.content?.fileUrl, '_blank')}
                                                className="text-xs underline opacity-80 hover:opacity-100"
                                            >
                                                Open
                                            </button>
                                        </div>
                                    )}

                                    {message.messageType === 'system' && (
                                        <div className="flex items-center gap-2">
                                            <AlertCircle size={16} />
                                            <p className="text-sm font-bold">
                                                {message.content?.text}
                                            </p>
                                        </div>
                                    )}

                                    {/* Message Reactions */}
                                    {message.reactions && message.reactions.length > 0 && (
                                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                                            {message.reactions.map((reaction, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleToggleReaction(message._id, reaction.emoji)}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                                                        reaction.users?.includes(localStorage.getItem('chauffeur_user_id'))
                                                            ? 'bg-brand/20 text-brand border border-brand/30'
                                                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                                                    }`}
                                                >
                                                    <span>{reaction.emoji}</span>
                                                    <span className="font-bold">{reaction.count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Message Footer */}
                                    <div className="flex items-center justify-between mt-2">
                                        <span className={`text-xs ${
                                            message.sender?.type === 'SpareDriver' 
                                                ? 'text-white/60' 
                                                : 'text-content/40'
                                        }`}>
                                            {formatTime(message.createdAt)}
                                        </span>
                                        
                                        <div className="flex items-center gap-1">
                                            {getMessageStatusIcon(message)}
                                        </div>
                                    </div>

                                    {/* Message Actions (Hidden by default) */}
                                    <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-1 bg-surface border border-content/10 rounded-lg px-2 py-1 shadow-lg">
                                            <button
                                                onClick={() => handleReplyToMessage(message)}
                                                className="p-1 hover:bg-content/5 rounded"
                                            >
                                                <Reply size={12} className="text-content/60" />
                                            </button>
                                            <button
                                                onClick={() => handleCopyMessage(message)}
                                                className="p-1 hover:bg-content/5 rounded"
                                            >
                                                <Copy size={12} className="text-content/60" />
                                            </button>
                                            {/* Quick Reactions */}
                                            <div className="flex items-center gap-1 ml-1 pl-1 border-l border-content/10">
                                                {['👍', '❤️', '😊'].map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleToggleReaction(message._id, emoji)}
                                                        className="p-1 hover:bg-content/5 rounded text-xs"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}

                {/* Typing indicator */}
                <AnimatePresence>
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex justify-start"
                        >
                            <div className="bg-surface border border-content/10 rounded-2xl px-4 py-3">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-content/40 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-content/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2 h-2 bg-content/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="px-4 py-2 bg-brand/5 border-t border-brand/10"
                    >
                        <div className="flex items-center gap-3">
                            <Reply size={16} className="text-brand" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-brand">
                                    Replying to {replyingTo.sender?.name}
                                </p>
                                <p className="text-xs text-content/60 truncate">
                                    {replyingTo.content?.text}
                                </p>
                            </div>
                            <button
                                onClick={() => setReplyingTo(null)}
                                className="p-1 hover:bg-content/5 rounded"
                            >
                                <X size={16} className="text-content/40" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Replies */}
            <AnimatePresence>
                {showQuickReplies && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 py-3 bg-surface/50 border-t border-content/5"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={14} className="text-brand" />
                            <span className="text-xs font-black text-content/60 uppercase tracking-wider">
                                Quick Replies
                            </span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {quickReplies.map((reply, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSendMessage('text', { text: reply })}
                                    className="px-3 py-2 bg-brand/10 border border-brand/20 rounded-full text-xs font-bold text-brand whitespace-nowrap hover:bg-brand/20 transition-colors"
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Enhanced Message Input */}
            <div className="bg-surface border-t border-content/5 px-4 py-3">
                <div className="flex items-end gap-3">
                    {/* Attachment Button */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 rounded-full bg-content/5 flex items-center justify-center text-content/60 hover:bg-content/10 transition-colors"
                    >
                        <Paperclip size={18} />
                    </button>

                    {/* Message Input Container */}
                    <div className="flex-1 relative">
                        <div className="flex items-end bg-content/5 rounded-2xl border border-content/10 focus-within:border-brand/20 transition-colors">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-3 bg-transparent text-sm outline-none placeholder:text-content/40"
                            />
                            
                            {/* Emoji Button */}
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="p-2 text-content/60 hover:text-brand transition-colors"
                            >
                                <Smile size={18} />
                            </button>
                        </div>

                        {/* Emoji Picker */}
                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full right-0 mb-2 bg-surface border border-content/10 rounded-xl p-3 shadow-lg"
                                >
                                    <div className="grid grid-cols-5 gap-2">
                                        {emojis.map((emoji, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setNewMessage(prev => prev + emoji);
                                                    setShowEmojiPicker(false);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-content/5 rounded-lg transition-colors"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Location Button */}
                        <button 
                            onClick={handleSendLocation}
                            className="w-10 h-10 rounded-full bg-content/5 flex items-center justify-center text-content/60 hover:bg-content/10 transition-colors"
                        >
                            <MapPin size={18} />
                        </button>

                        {/* Voice Button */}
                        <button 
                            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                isRecording 
                                    ? 'bg-red-500 text-white animate-pulse' 
                                    : 'bg-content/5 text-content/60 hover:bg-content/10'
                            }`}
                        >
                            {isRecording ? (
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    <span className="text-xs font-bold">{recordingTime}s</span>
                                </div>
                            ) : (
                                <Mic size={18} />
                            )}
                        </button>

                        {/* Send Button */}
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!newMessage.trim() || sending}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                newMessage.trim() && !sending
                                    ? 'bg-brand text-white shadow-lg shadow-brand/20'
                                    : 'bg-content/10 text-content/40'
                            }`}
                        >
                            {sending ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        try {
                            setSending(true);
                            
                            // Create FormData for file upload
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('bookingId', bookingId);
                            
                            // Determine message type based on file
                            let messageType = 'file';
                            if (file.type.startsWith('image/')) {
                                messageType = 'image';
                            } else if (file.type.startsWith('video/')) {
                                messageType = 'video';
                            } else if (file.type.startsWith('audio/')) {
                                messageType = 'voice';
                            }
                            
                            // Upload file and send message
                            const uploadResponse = await spareDriverAPI.uploadChatFile(formData);
                            
                            await spareDriverAPI.sendChatMessage(bookingId, {
                                messageType,
                                content: {
                                    fileUrl: uploadResponse.data.fileUrl,
                                    fileName: file.name,
                                    fileSize: file.size,
                                    mimeType: file.type
                                }
                            });
                            
                            toast.success('File sent successfully!');
                        } catch (error) {
                            console.error('File upload error:', error);
                            toast.error('Failed to send file');
                        } finally {
                            setSending(false);
                        }
                    }
                }}
            />

            {/* Message Actions Modal */}
            <AnimatePresence>
                {showMessageActions && selectedMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6"
                        onClick={() => setShowMessageActions(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm bg-surface rounded-2xl p-6 shadow-2xl"
                        >
                            <h3 className="text-lg font-black text-content mb-4">Message Actions</h3>
                            
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleReplyToMessage(selectedMessage)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-content/5 rounded-xl transition-colors"
                                >
                                    <Reply size={18} className="text-content/60" />
                                    <span className="font-bold text-content">Reply</span>
                                </button>
                                
                                <button
                                    onClick={() => handleCopyMessage(selectedMessage)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-content/5 rounded-xl transition-colors"
                                >
                                    <Copy size={18} className="text-content/60" />
                                    <span className="font-bold text-content">Copy</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DriverLayout>
    );
};

export default DriverChatEnhanced;