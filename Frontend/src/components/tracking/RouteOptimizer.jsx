import React from 'react';
import './RouteOptimizer.css';

const RouteOptimizer = ({ routes, onSelectRoute, onClose }) => {
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

    return (
        <div className="route-optimizer-overlay">
            <div className="route-optimizer">
                <div className="optimizer-header">
                    <h3>Alternative Routes</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>

                <div className="routes-list">
                    {routes.map((route, index) => (
                        <div
                            key={index}
                            className={`route-option ${route.isFastest ? 'fastest' : ''}`}
                            onClick={() => onSelectRoute(route)}
                        >
                            {route.isFastest && (
                                <div className="fastest-badge">⚡ Fastest</div>
                            )}
                            
                            <div className="route-summary">
                                <h4>{route.summary || `Route ${index + 1}`}</h4>
                            </div>

                            <div className="route-details">
                                <div className="route-stat">
                                    <span className="stat-icon">⏱️</span>
                                    <span className="stat-value">
                                        {route.durationInTraffic?.text || route.duration.text}
                                    </span>
                                </div>

                                <div className="route-stat">
                                    <span className="stat-icon">📏</span>
                                    <span className="stat-value">{route.distance.text}</span>
                                </div>

                                <div 
                                    className="route-stat traffic"
                                    style={{ color: getTrafficColor(route.trafficCondition) }}
                                >
                                    <span className="stat-icon">🚦</span>
                                    <span className="stat-value">
                                        {route.trafficCondition}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RouteOptimizer;
