import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import QuickReplies from './QuickReplies';
import './ChatWindow.css';

const ChatWindow = ({ bookingId, userId, userType, onClose }) => {
    const {
        messages,
        loading,
        sendMessage,
        sendLocation,
        sendQuickReply,
        markAsRead,
        isTyping
    } = useChat(bookingId, userId, userType);

    const messagesEndRef = useRef(null);
    const [showQuickReplies, setShowQuickReplies] = useState(false);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mark messages as read when chat is opened
    useEffect(() => {
        if (messages.length > 0) {
            markAsRead();
        }
    }, [messages.length]);

    const handleSendMessage = async (text) => {
        await sendMessage(text);
    };

    const handleSendLocation = async () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    await sendLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        address: 'Current Location'
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('Unable to get your location');
                }
            );
        }
    };

    const handleQuickReply = async (text) => {
        await sendMessage(text);
        setShowQuickReplies(false);
    };

    const quickReplyOptions = userType === 'SpareDriver' ? [
        "I'm on my way",
        "Reached pickup location",
        "Running 5 minutes late",
        "Please share exact location",
        "Call me when ready",
        "Thank you!"
    ] : [
        "I'm ready",
        "Please wait 2 minutes",
        "Coming down",
        "At the gate",
        "Thank you!",
        "Drive safely"
    ];

    return (
        <div className="chat-window">
            <div className="chat-header">
                <button onClick={onClose} className="back-btn">←</button>
                <div className="chat-header-info">
                    <h3>{userType === 'User' ? 'Driver' : 'Customer'}</h3>
                    {isTyping && <span className="typing-indicator">typing...</span>}
                </div>
            </div>

            <div className="chat-messages">
                {loading && messages.length === 0 ? (
                    <div className="chat-loading">Loading messages...</div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <MessageBubble
                                key={message._id}
                                message={message}
                                isOwn={message.sender.id === userId}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {showQuickReplies && (
                <QuickReplies
                    options={quickReplyOptions}
                    onSelect={handleQuickReply}
                    onClose={() => setShowQuickReplies(false)}
                />
            )}

            <MessageInput
                onSend={handleSendMessage}
                onSendLocation={handleSendLocation}
                onToggleQuickReplies={() => setShowQuickReplies(!showQuickReplies)}
            />
        </div>
    );
};

export default ChatWindow;
