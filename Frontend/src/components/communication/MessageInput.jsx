import React, { useState } from 'react';
import './MessageInput.css';

const MessageInput = ({ onSend, onSendLocation, onToggleQuickReplies }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form className="message-input" onSubmit={handleSubmit}>
            <button
                type="button"
                className="input-btn location-btn"
                onClick={onSendLocation}
                title="Share Location"
            >
                📍
            </button>

            <button
                type="button"
                className="input-btn quick-reply-btn"
                onClick={onToggleQuickReplies}
                title="Quick Replies"
            >
                ⚡
            </button>

            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="message-text-input"
            />

            <button
                type="submit"
                className="send-btn"
                disabled={!message.trim()}
            >
                Send
            </button>
        </form>
    );
};

export default MessageInput;
