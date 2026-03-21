import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../utils/api';
import LocationContext from './LocationContextBase';

export const LocationProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [primaryAddress, setPrimaryAddress] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);

    /**
     * Fetch saved addresses from backend
     */
    const fetchSavedAddresses = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            setLoading(true);
            const response = await apiClient.request('/profile/addresses');

            if (response.status === 'success') {
                const addresses = response.data.addresses;
                setSavedAddresses(addresses);
                setPrimaryAddress(addresses.find(a => a.isPrimary) || addresses[0] || null);

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
    }, [isAuthenticated]);

    /**
     * Geolocation: Get current browser coordinates
     */
    const detectCurrentLocation = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setCurrentLocation(location);
                    resolve(location);
                },
                (err) => reject(err),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        });
    }, []);

    /**
     * CRUD: Add new address
     */
    const addAddress = async (addressData) => {
        try {
            setLoading(true);
            console.log('LocationContext: Adding address payload:', addressData);

            const response = await apiClient.request('/profile/addresses', {
                method: 'POST',
                body: JSON.stringify(addressData)
            });

            console.log('LocationContext: Server response for addAddress:', response);

            if (response.status === 'success') {
                await fetchSavedAddresses();
                return response.data.address;
            } else {
                console.error('LocationContext: Server returned fail status:', response);
                throw new Error(response.message || 'Failed to add address');
            }
        } catch (error) {
            console.error('LocationContext: Add address exception:', error);
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
        if (isAuthenticated) {
            fetchSavedAddresses();
        } else {
            setSavedAddresses([]);
            setPrimaryAddress(null);
            setIsInitializing(false);
            setShowLocationPrompt(false);
        }
    }, [isAuthenticated, fetchSavedAddresses]);

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
        setShowLocationPrompt
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
};

