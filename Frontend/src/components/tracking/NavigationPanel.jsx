import React, { useState } from 'react';
import './NavigationPanel.css';

const NavigationPanel = ({ origin, destination, onNavigate }) => {
    const [selectedApp, setSelectedApp] = useState(null);

    const openGoogleMaps = () => {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
        window.open(url, '_blank');
        onNavigate?.('google');
    };

    const openWaze = () => {
        const url = `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
        window.open(url, '_blank');
        onNavigate?.('waze');
    };

    const openAppleMaps = () => {
        const url = `http://maps.apple.com/?saddr=${origin.lat},${origin.lng}&daddr=${destination.lat},${destination.lng}&dirflg=d`;
        window.open(url, '_blank');
        onNavigate?.('apple');
    };

    const copyCoordinates = () => {
        const coords = `${destination.lat}, ${destination.lng}`;
        navigator.clipboard.writeText(coords);
        alert('Coordinates copied to clipboard!');
    };

    return (
        <div className="navigation-panel">
            <h3 className="panel-title">Navigate to Destination</h3>
            
            <div className="navigation-options">
                <button 
                    className="nav-option google-maps"
                    onClick={openGoogleMaps}
                >
                    <div className="nav-icon">🗺️</div>
                    <div className="nav-content">
                        <span className="nav-name">Google Maps</span>
                        <span className="nav-desc">Turn-by-turn navigation</span>
                    </div>
                </button>

                <button 
                    className="nav-option waze"
                    onClick={openWaze}
                >
                    <div className="nav-icon">🚗</div>
                    <div className="nav-content">
                        <span className="nav-name">Waze</span>
                        <span className="nav-desc">Real-time traffic alerts</span>
                    </div>
                </button>

                <button 
                    className="nav-option apple-maps"
                    onClick={openAppleMaps}
                >
                    <div className="nav-icon">🍎</div>
                    <div className="nav-content">
                        <span className="nav-name">Apple Maps</span>
                        <span className="nav-desc">iOS navigation</span>
                    </div>
                </button>

                <button 
                    className="nav-option copy-coords"
                    onClick={copyCoordinates}
                >
                    <div className="nav-icon">📋</div>
                    <div className="nav-content">
                        <span className="nav-name">Copy Coordinates</span>
                        <span className="nav-desc">Paste in any app</span>
                    </div>
                </button>
            </div>

            <div className="destination-info">
                <div className="info-icon">📍</div>
                <div className="info-text">
                    <div className="info-label">Destination</div>
                    <div className="info-value">
                        {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavigationPanel;
