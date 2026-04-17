import React, { useCallback, memo, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle, Polyline } from '@react-google-maps/api';

const DARK_STYLES = [
    { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#7c7c7c" }] },
    { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "on" }, { "color": "#212121" }, { "lightness": 16 }] },
    { "featureType": "all", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#212121" }, { "lightness": 20 }] },
    { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#212121" }, { "lightness": 20 }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#212121" }, { "lightness": 21 }] },
    { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#212121" }, { "lightness": 17 }] },
    { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#212121" }, { "lightness": 18 }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 17 }] }
];

const LIGHT_STYLES = [
    { "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }] }
];

const LIBRARIES = ['places'];

const GoogleMapBox = ({ 
    center, 
    zoom = 15, 
    onLoad, 
    onUnmount, 
    onCenterChanged, 
    onIdle,
    markers = [], 
    circles = [],
    polylines = [],
    children,
    containerStyle = { width: '100%', height: '100%' },
    options = {},
    darkMode = true
}) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_API_KEY,
        libraries: LIBRARIES
    });

    const [map, setMap] = React.useState(null);
    const [activeInfoWindow, setActiveInfoWindow] = useState(null);

    const onInternalLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
        if (onLoad) onLoad(mapInstance);
    }, [onLoad]);

    const onInternalUnmount = useCallback((mapInstance) => {
        setMap(null);
        if (onUnmount) onUnmount(mapInstance);
    }, [onUnmount]);

    const normalizeIcon = useCallback((iconConfig) => {
        if (!iconConfig || typeof iconConfig !== 'object') return iconConfig;
        if (!window.google?.maps) return iconConfig;

        const normalized = { ...iconConfig };

        if (
            iconConfig.scaledSize
            && typeof iconConfig.scaledSize.width === 'number'
            && typeof iconConfig.scaledSize.height === 'number'
        ) {
            normalized.scaledSize = new window.google.maps.Size(
                iconConfig.scaledSize.width,
                iconConfig.scaledSize.height
            );
        }

        if (
            iconConfig.anchor
            && typeof iconConfig.anchor.x === 'number'
            && typeof iconConfig.anchor.y === 'number'
        ) {
            normalized.anchor = new window.google.maps.Point(
                iconConfig.anchor.x,
                iconConfig.anchor.y
            );
        }

        if (
            iconConfig.labelOrigin
            && typeof iconConfig.labelOrigin.x === 'number'
            && typeof iconConfig.labelOrigin.y === 'number'
        ) {
            normalized.labelOrigin = new window.google.maps.Point(
                iconConfig.labelOrigin.x,
                iconConfig.labelOrigin.y
            );
        }

        return normalized;
    }, []);

    const handleCenterChanged = () => {
        if (map && onCenterChanged) {
            const newCenter = map.getCenter();
            if (newCenter) onCenterChanged({ lat: newCenter.lat(), lng: newCenter.lng() });
        }
    };

    const handleIdle = () => {
        if (map && onIdle) {
            const newCenter = map.getCenter();
            if (newCenter) onIdle({ lat: newCenter.lat(), lng: newCenter.lng() });
        }
    };

    if (loadError) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 gap-3 p-8 text-center">
                <span className="text-2xl">🗺️</span>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                    Map unavailable — API not configured
                </p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Bail out early if center coords are not ready yet
    if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const defaultOptions = {
        styles: darkMode ? DARK_STYLES : LIGHT_STYLES,
        disableDefaultUI: true,
        clickableIcons: false,
        zoomControl: false,
        ...options
    };

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={zoom}
            onLoad={onInternalLoad}
            onUnmount={onInternalUnmount}
            onCenterChanged={handleCenterChanged}
            onIdle={handleIdle}
            options={defaultOptions}
        >
            {markers.map((marker, index) => (
                <Marker
                    key={`marker-${index}`}
                    position={marker.position}
                    icon={normalizeIcon(marker.icon)}
                    onClick={() => {
                        if (marker.infoContent) setActiveInfoWindow(index);
                        if (marker.onClick) marker.onClick();
                    }}
                >
                    {activeInfoWindow === index && marker.infoContent && (
                        <InfoWindow onCloseClick={() => setActiveInfoWindow(null)}>
                            <div>{marker.infoContent}</div>
                        </InfoWindow>
                    )}
                </Marker>
            ))}
            
            {circles.map((circle, index) => (
                <Circle
                    key={`circle-${index}`}
                    center={circle.center}
                    radius={circle.radius}
                    options={circle.options}
                />
            ))}

            {polylines.map((polyline, index) => (
                <Polyline
                    key={`polyline-${index}`}
                    path={polyline.path}
                    options={polyline.options}
                />
            ))}
            
            {children}
        </GoogleMap>
    );
};

export default memo(GoogleMapBox);
