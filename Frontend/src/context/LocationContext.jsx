import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../utils/api';

import { geocodingService } from '../utils/geocoding';
import LocationContext from './LocationContextBase';

export const LocationProvider = ({ children }) => {
    const { user } = useAuth();
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [primaryAddress, setPrimaryAddress] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);
    const [selectedAddress, setSelectedAddressState] = useState(() => {
        const saved = localStorage.getItem('clean2wash_selected_address');
        return saved ? JSON.parse(saved) : null;
    });

    const setSelectedAddress = useCallback((addr) => {
        setSelectedAddressState(addr);
        if (addr) {
            localStorage.setItem('clean2wash_selected_address', JSON.stringify(addr));
        } else {
            localStorage.removeItem('clean2wash_selected_address');
        }
    }, []);

    /**
     * Fetch saved addresses from backend
     */
    const fetchSavedAddresses = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const response = await apiClient.request('/profile/addresses');

            if (response.status === 'success') {
                const addresses = response.data.addresses;
                setSavedAddresses(addresses);
                const primary = addresses.find(a => a.isPrimary) || addresses[0] || null;
                setPrimaryAddress(primary);

                // Auto-select primary if nothing is selected or if selected address is no longer in saved list
                if (!selectedAddress && primary) {
                    setSelectedAddress(primary);
                } else if (selectedAddress && addresses.length > 0) {
                    // Refresh selected address if it's a saved one (to get latest details)
                    const latest = addresses.find(a => a.id === selectedAddress.id);
                    if (latest) setSelectedAddress(latest);
                }

                // Trigger location prompt if no addresses found after a delay
                if (addresses.length === 0) {
                    setTimeout(() => setShowLocationPrompt(true), 1500);
                }
            }
        } catch (error) {
            console.error('Failed to fetch addresses:', error);
        } finally {
            setLoading(false);
            setIsInitializing(false);
        }
    }, [user]);

    /**
     * Geolocation: Get current browser coordinates
     */
    const detectCurrentLocation = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

            const success = (pos) => {
                const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCurrentLocation(location);
                resolve(location);
            };

            const error = (err) => {
                // If high accuracy failed/timeout, try one more time with standard accuracy
                if (options.enableHighAccuracy) {
                    console.warn('High accuracy location failed, retrying with standard accuracy...');
                    options.enableHighAccuracy = false;
                    options.timeout = 10000;
                    navigator.geolocation.getCurrentPosition(success, (err2) => reject(err2), options);
                } else {
                    reject(err);
                }
            };

            navigator.geolocation.getCurrentPosition(success, error, options);
        });
    }, []);

    /**
     * CRUD: Add new address
     */
    const addAddress = async (addressData) => {
        try {
            setLoading(true);
            const response = await apiClient.request('/profile/addresses', {
                method: 'POST',
                body: JSON.stringify(addressData)
            });

            if (response.status === 'success') {
                await fetchSavedAddresses();
                return response.data.address;
            } else {
                throw new Error(response.message || 'Failed to add address');
            }
        } catch (error) {
            console.error('Add address failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * 🛰️ Save Location Protocol: Coords -> Geocode -> Backend
     */
    const saveLocation = async (lat, lng, label = 'Selected') => {
        try {
            setLoading(true);
            const geocoded = await geocodingService.reverse(lat, lng);
            
            if (!geocoded) throw new Error('Geocoding Failed');

            const addressData = {
                label,
                street: geocoded.street,
                city: geocoded.city,
                state: geocoded.state,
                pincode: geocoded.pincode,
                coordinates: { lat, lng },
                isPrimary: savedAddresses.length === 0
            };

            const saved = await addAddress(addressData);
            if (saved) {
                setSelectedAddress(saved);
                return saved;
            }
        } catch (error) {
            console.error('Save location failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * CRUD: Update address
     */
    const updateAddress = async (addressId, updates) => {
        try {
            setLoading(true);
            const response = await apiClient.request(`/profile/addresses/${addressId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });

            if (response.status === 'success') {
                await fetchSavedAddresses();
                return response.data.address;
            } else {
                throw new Error(response.message || 'Failed to update address');
            }
        } catch (error) {
            console.error('Update address failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * CRUD: Remove address
     */
    const removeAddress = async (addressId) => {
        try {
            setLoading(true);
            const response = await apiClient.request(`/profile/addresses/${addressId}`, {
                method: 'DELETE'
            });

            if (response.status === 'success') {
                await fetchSavedAddresses();
            } else {
                throw new Error(response.message || 'Failed to remove address');
            }
        } catch (error) {
            console.error('Remove address failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * CRUD: Set primary 
     */
    const setPrimary = async (addressId) => {
        try {
            setLoading(true);
            const response = await apiClient.request(`/profile/addresses/${addressId}/primary`, {
                method: 'PATCH',
                body: JSON.stringify({})
            });

            if (response.status === 'success') {
                await fetchSavedAddresses();
            }
        } catch (error) {
            console.error('Set primary failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Initialize addresses when authenticated
    useEffect(() => {
        if (user) {
            fetchSavedAddresses();
        } else {
            setSavedAddresses([]);
            setPrimaryAddress(null);
            setIsInitializing(false);
            setShowLocationPrompt(false);
        }
    }, [user, fetchSavedAddresses]);

    // Expose value
    const value = {
        savedAddresses,
        primaryAddress,
        currentLocation,
        loading,
        isInitializing,
        detectCurrentLocation,
        fetchSavedAddresses,
        addAddress,
        updateAddress,
        removeAddress,
        setPrimary,
        showLocationPrompt,
        setShowLocationPrompt,
        selectedAddress,
        setSelectedAddress,
        saveLocation
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
};

export default LocationProvider;



