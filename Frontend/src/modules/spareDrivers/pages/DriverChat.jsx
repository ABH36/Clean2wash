import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Send, Phone, MapPin, Clock, 
    Camera, Mic, MoreVertical, Navigation,
    MessageSquare, AlertCircle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { socketService } from '../../../utils/socket';
import DriverLayout from '../components/DriverLayout';

const DriverChat = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

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
                socket.on('new_message', (message) => {
                    if (message.bookingId === bookingId) {
                        setMessages(prev => [...prev, message]);
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
            }
        }

        return () => {
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('new_message');
                socket.off('user_typing');
                socket.off('user_stopped_typing');
            }
            clearTimeout(typingTimeoutRef.current);
        };
    }, [bookingId, navigate]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await spareDriverAPI.sendChatMessage(bookingId, {
                message: newMessage.trim(),
                type: 'text'
            });
            setNewMessage('');
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleTyping = () => {
        socketService.emit('typing', { bookingId, userType: 'driver' });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketService.emit('stopped_typing', { bookingId, userType: 'driver' });
        }, 1000);
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const quickReplies = [
        "I'm on my way",
        "Reached your location",
        "Running 5 minutes late",
        "Please share exact location",
        "Trip completed successfully"
    ];

    if (loading) {
        return (
            <DriverLayout title="Chat" showBack>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-white/5 border-brand/30 border-t-brand rounded-full animate-spin" />
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
                    <p className="text-white/40 text-sm">This booking may have been cancelled or completed.</p>
                </div>
            </DriverLayout>
        );
    }

    return (
        <DriverLayout hideNav>
            {/* Header */}
            <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex items-center gap-3">
                <button 
                    onClick={() => navigate('/spare-driver/bookings')}
                    className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center"
                >
                    <ArrowLeft size={20} />
                </button>
                
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 truncate">{booking.consumer?.name || 'Customer'}</h2>
                    <p className="text-xs text-white/40 truncate">
                        {booking.service?.name} • {booking.location?.address?.street}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <a 
                        href={`tel:${booking.consumer?.phone}`}
                        className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"
                    >
                        <Phone size={18} />
                    </a>
                    <button className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white/[0.02]">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare size={48} className="text-gray-300 mb-4" />
                        <h3 className="font-bold text-white/40 mb-2">Start the conversation</h3>
                        <p className="text-gray-400 text-sm">Send a message to your customer</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <motion.div
                            key={message._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.senderType === 'driver' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                message.senderType === 'driver'
                                    ? 'bg-brand text-white'
                                    : 'bg-white/5 text-gray-900 border border-white/5'
                            }`}>
                                <p className="text-sm">{message.content}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className={`text-xs ${
                                        message.senderType === 'driver' ? 'text-white/60' : 'text-white/40'
                                    }`}>
                                        {formatTime(message.timestamp)}
                                    </span>
                                    {message.senderType === 'driver' && (
                                        <CheckCircle2 size={12} className={
                                            message.readBy?.includes(booking.consumer?._id) 
                                                ? 'text-blue-600' 
                                                : 'text-white/40'
                                        } />
                                    )}
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
                            <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="px-4 py-2 bg-white/5 border-t border-white/5">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {quickReplies.map((reply, index) => (
                        <button
                            key={index}
                            onClick={() => setNewMessage(reply)}
                            className="px-3 py-2 bg-white/[0.05] rounded-full text-xs font-medium text-white/80 whitespace-nowrap hover:bg-gray-200 transition-colors"
                        >
                            {reply}
                        </button>
                    ))}
                </div>
            </div>

            {/* Message Input */}
            <div className="bg-white/5 border-t border-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="w-full px-4 py-3 bg-white/[0.05] rounded-full text-sm outline-none focus:bg-gray-200 transition-colors"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center text-white/60">
                            <Camera size={18} />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center text-white/60">
                            <Mic size={18} />
                        </button>
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sending}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                newMessage.trim() && !sending
                                    ? 'bg-brand text-white'
                                    : 'bg-gray-200 text-gray-400'
                            }`}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </DriverLayout>
    );
};

export default DriverChat;