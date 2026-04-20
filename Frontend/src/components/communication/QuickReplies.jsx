import React from 'react';
import './QuickReplies.css';

const QuickReplies = ({ options, onSelect, onClose }) => {
    return (
        <div className="quick-replies">
            <div className="quick-replies-header">
                <span>Quick Replies</span>
                <button onClick={onClose} className="close-btn">×</button>
            </div>
            <div className="quick-replies-options">
                {options.map((option, index) => (
                    <button
                        key={index}
                        className="quick-reply-btn"
                        onClick={() => onSelect(option)}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickReplies;
