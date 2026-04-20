import React from 'react';
import './TrafficIndicator.css';

const TrafficIndicator = ({ traffic }) => {
    if (!traffic) return null;

    const getTrafficColor = (condition) => {
        switch (condition) {
            case 'light':
                return '#4caf50';
            case 'moderate':
                return '#ff9800';
            case 'heavy':
                return '#f44336';
            case 'severe':
                return '#d32f2f';
            default:
                return '#9e9e9e';
        }
    };

    const getTrafficIcon = (condition) => {
        switch (condition) {
            case 'light':
                return '🟢';
            case 'moderate':
                return '🟡';
            case 'heavy':
                return '🟠';
            case 'severe':
                return '🔴';
            default:
                return '⚪';
        }
    };

    const getTrafficLabel = (condition) => {
        switch (condition) {
            case 'light':
                return 'Light Traffic';
            case 'moderate':
                return 'Moderate Traffic';
            case 'heavy':
                return 'Heavy Traffic';
            case 'severe':
                return 'Severe Traffic';
            default:
                return 'Unknown';
        }
    };

    return (
        <div 
            className="traffic-indicator"
            style={{ borderColor: getTrafficColor(traffic.condition) }}
        >
            <span className="traffic-icon">{getTrafficIcon(traffic.condition)}</span>
            <div className="traffic-info">
                <div className="traffic-label">{getTrafficLabel(traffic.condition)}</div>
                {traffic.delay > 0 && (
                    <div className="traffic-delay">{traffic.delayText}</div>
                )}
            </div>
        </div>
    );
};

export default TrafficIndicator;
