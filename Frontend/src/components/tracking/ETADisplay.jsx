import React from 'react';
import './ETADisplay.css';

const ETADisplay = ({ eta, trafficCondition, showDetails = true }) => {
    if (!eta) {
        return (
            <div className="eta-display loading">
                <div className="eta-spinner"></div>
                <span>Calculating ETA...</span>
            </div>
        );
    }

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const formatETA = (etaDate) => {
        const date = new Date(etaDate);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getTrafficColor = () => {
        const colors = {
            light: '#4CAF50',
            moderate: '#FFC107',
            heavy: '#FF9800',
            severe: '#F44336',
            unknown: '#9E9E9E'
        };
        return colors[trafficCondition] || colors.unknown;
    };

    const getTrafficIcon = () => {
        const icons = {
            light: '🟢',
            moderate: '🟡',
            heavy: '🟠',
            severe: '🔴',
            unknown: '⚪'
        };
        return icons[trafficCondition] || icons.unknown;
    };

    return (
        <div className="eta-display">
            <div className="eta-main">
                <div className="eta-icon">⏱️</div>
                <div className="eta-content">
                    <div className="eta-time">{formatTime(eta.duration)}</div>
                    <div className="eta-label">Estimated Time</div>
                </div>
            </div>

            {showDetails && (
                <div className="eta-details">
                    <div className="eta-detail-item">
                        <span className="detail-icon">🕐</span>
                        <span className="detail-label">Arrival:</span>
                        <span className="detail-value">{formatETA(eta.eta)}</span>
                    </div>

                    <div className="eta-detail-item">
                        <span className="detail-icon">📏</span>
                        <span className="detail-label">Distance:</span>
                        <span className="detail-value">{eta.distanceText}</span>
                    </div>

                    <div className="eta-detail-item">
                        <span className="detail-icon">{getTrafficIcon()}</span>
                        <span className="detail-label">Traffic:</span>
                        <span 
                            className="detail-value traffic-badge"
                            style={{ backgroundColor: getTrafficColor() }}
                        >
                            {trafficCondition}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ETADisplay;
