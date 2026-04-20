import React, { useState, useEffect, useRef } from 'react';
import { useTracking } from '../../hooks/useTracking';
import './LiveTrackingMap.css';

const LiveTrackingMap = ({ bookingId, origin, destination }) => {
    const {
        tracking,
        driverLocation,
        eta,
        route,
        trafficCondition,
        loading
    } = useTracking(bookingId);

    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState({});
    const [polyline, setPolyline] = useState(null);

    // Initialize Google Maps
    useEffect(() => {
        if (!window.google || !mapRef.current) return;

        const mapInstance = new window.google.maps.Map(mapRef.current, {
            center: origin || { lat: 28.6139, lng: 77.2090 }, // Default to Delhi
            zoom: 13,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        setMap(mapInstance);
    }, []);

    // Update markers and route
    useEffect(() => {
        if (!map || !window.google) return;

        // Clear existing markers
        Object.values(markers).forEach(marker => marker.setMap(null));
        if (polyline) polyline.setMap(null);

        const newMarkers = {};

        // Add origin marker
        if (origin) {
            newMarkers.origin = new window.google.maps.Marker({
                position: origin,
                map,
                icon: {
                    url: '/icons/pickup-marker.png',
                    scaledSize: new window.google.maps.Size(40, 40)
                },
                title: 'Pickup Location'
            });
        }

        // Add destination marker
        if (destination) {
            newMarkers.destination = new window.google.maps.Marker({
                position: destination,
                map,
                icon: {
                    url: '/icons/drop-marker.png',
                    scaledSize: new window.google.maps.Size(40, 40)
                },
                title: 'Drop Location'
            });
        }

        // Add driver marker
        if (driverLocation) {
            newMarkers.driver = new window.google.maps.Marker({
                position: driverLocation,
                map,
                icon: {
                    url: '/icons/car-marker.png',
                    scaledSize: new window.google.maps.Size(50, 50)
                },
                title: 'Driver Location',
                animation: window.google.maps.Animation.DROP
            });
        }

        setMarkers(newMarkers);

        // Draw route polyline
        if (route && route.polyline) {
            const decodedPath = window.google.maps.geometry.encoding.decodePath(route.polyline);
            const newPolyline = new window.google.maps.Polyline({
                path: decodedPath,
                geodesic: true,
                strokeColor: getTrafficColor(trafficCondition),
                strokeOpacity: 0.8,
                strokeWeight: 5,
                map
            });
            setPolyline(newPolyline);
        }

        // Fit bounds to show all markers
        const bounds = new window.google.maps.LatLngBounds();
        Object.values(newMarkers).forEach(marker => {
            bounds.extend(marker.getPosition());
        });
        if (Object.keys(newMarkers).length > 0) {
            map.fitBounds(bounds);
        }
    }, [map, origin, destination, driverLocation, route]);

    const getTrafficColor = (condition) => {
        const colors = {
            light: '#4CAF50',
            moderate: '#FFC107',
            heavy: '#FF9800',
            severe: '#F44336',
            unknown: '#9E9E9E'
        };
        return colors[condition] || colors.unknown;
    };

    const formatDuration = (seconds) => {
        if (!seconds) return 'Calculating...';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const formatDistance = (meters) => {
        if (!meters) return 'Calculating...';
        const km = (meters / 1000).toFixed(1);
        return `${km} km`;
    };

    const getTrafficLabel = (condition) => {
        const labels = {
            light: 'Light Traffic',
            moderate: 'Moderate Traffic',
            heavy: 'Heavy Traffic',
            severe: 'Severe Traffic',
            unknown: 'Unknown'
        };
        return labels[condition] || 'Unknown';
    };

    return (
        <div className="live-tracking-map">
            <div ref={mapRef} className="map-container" />
            
            {loading && (
                <div className="map-loading">
                    <div className="spinner"></div>
                    <p>Loading tracking data...</p>
                </div>
            )}

            {eta && (
                <div className="tracking-info">
                    <div className="info-card">
                        <div className="info-icon">⏱️</div>
                        <div className="info-content">
                            <span className="info-label">ETA</span>
                            <span className="info-value">{formatDuration(eta.duration)}</span>
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="info-icon">📍</div>
                        <div className="info-content">
                            <span className="info-label">Distance</span>
                            <span className="info-value">{formatDistance(eta.distance)}</span>
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="info-icon">🚦</div>
                        <div className="info-content">
                            <span className="info-label">Traffic</span>
                            <span 
                                className="info-value traffic-badge"
                                style={{ backgroundColor: getTrafficColor(trafficCondition) }}
                            >
                                {getTrafficLabel(trafficCondition)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveTrackingMap;
