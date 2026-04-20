import React from 'react';
import './MessageBubble.css';

const MessageBubble = ({ message, isOwn }) => {
    const formatTime = (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const renderContent = () => {
        switch (message.messageType) {
            case 'text':
                return <p className="message-text">{message.content.text}</p>;

            case 'location':
                return (
                    <div className="message-location">
                        <span className="location-icon">📍</span>
                        <div>
                            <p className="location-address">{message.content.location.address}</p>
                            <a
                                href={`https://www.google.com/maps?q=${message.content.location.lat},${message.content.location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="location-link"
                            >
                                View on Map
                            </a>
                        </div>
                    </div>
                );

            case 'image':
                return (
                    <div className="message-image">
                        <img src={message.content.imageUrl} alt="Shared" />
                    </div>
                );

            case 'system':
                return <p className="message-system">{message.content.text}</p>;

            default:
                return <p className="message-text">{message.content.text}</p>;
        }
    };

    if (message.messageType === 'system') {
        return (
            <div className="message-bubble system">
                {renderContent()}
            </div>
        );
    }

    return (
        <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
            <div className="message-content">
                {renderContent()}
                <div className="message-meta">
                    <span className="message-time">{formatTime(message.createdAt)}</span>
                    {isOwn && (
                        <span className="message-status">
                            {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
