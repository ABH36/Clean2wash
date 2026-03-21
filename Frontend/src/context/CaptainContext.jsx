import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { captainAPI } from '../utils/captainApi';
import { useAuth } from './AuthContext';
import { socketService } from '../utils/socket';
import CaptainContext from './CaptainContextBase';

export const CaptainProvider = ({ children }) => {
    const { sessions, setSessions, login, logout } = useAuth();

    // Captain-specific state
    const [captainJobs, setCaptainJobs] = useState([]);
    const [captainJobsLoading, setCaptainJobsLoading] = useState(false);
    const [captainEarnings, setCaptainEarnings] = useState({ balance: 0, totalEarned: 0, jobs: [] });
    const [captainEarningsLoading, setCaptainEarningsLoading] = useState(false);
    const [availableProductMissions, setAvailableProductMissions] = useState([]);
    const [productMissionsLoading, setProductMissionsLoading] = useState(false);

    // Phase 7: Offline Resilience (Hydrate from localStorage)
    useEffect(() => {
        try {
            const cachedJobs = localStorage.getItem('cleanup_captain_jobs');
            const cachedEarnings = localStorage.getItem('cleanup_captain_earnings');
            if (cachedJobs) setCaptainJobs(JSON.parse(cachedJobs));
            if (cachedEarnings) setCaptainEarnings(JSON.parse(cachedEarnings));
        } catch (e) {
            console.error('Failed to parse captain cache:', e);
        }
    }, []);

    // Phase 7: Persist State Changes to Local Cache
    useEffect(() => {
        if (captainJobs.length > 0) {
            localStorage.setItem('cleanup_captain_jobs', JSON.stringify(captainJobs));
        }
    }, [captainJobs]);

    useEffect(() => {
        if (captainEarnings.totalEarned > 0) {
            localStorage.setItem('cleanup_captain_earnings', JSON.stringify(captainEarnings));
        }
    }, [captainEarnings]);

    const loadCaptainDashboard = useCallback(async () => {
        if (!sessions.captain) return;
        try {
            setCaptainJobsLoading(true);
            const response = await captainAPI.getDashboard();
            const { stats, captain, pendingJobs, activeJob, recentCompleted } = response.data;

            // Updated earnings state with full breakdown
            setCaptainEarnings({
                totalEarned: stats.totalEarned,
                balance: stats.walletBalance,
                rating: stats.rating || captain.rating,
                today: stats.today,
                week: stats.week,
                month: stats.month,
                totalJobs: stats.completedJobs,
                recentJobs: recentCompleted || []
            });

            // Consolidate all jobs into a single list
            const allJobs = [];
            if (activeJob) allJobs.push(activeJob);

            // Only include pending jobs if captain is online
            if (captain.isOnline && pendingJobs) {
                allJobs.push(...pendingJobs);
            }

            if (recentCompleted) {
                recentCompleted.forEach(rj => {
                    if (!allJobs.find(j => (j.id === rj.id || j._id === rj._id))) allJobs.push(rj);
                });
            }

            // Map jobs to standardized format for UI if needed (keeping existing mapping logic)
            const mappedJobs = allJobs.map(job => ({
                ...job,
                id: job._id || job.id,
                price: job.pricing?.totalAmount ? `₹${job.pricing.totalAmount}` : (job.price || '₹0'),
                serviceName: job.service?.name || job.serviceName || 'Wash Service',
                userName: job.consumer?.name || job.userName || 'Customer',
                vehicle: job.vehicle ? `${job.vehicle.brand || ''} ${job.vehicle.model || ''}`.trim() : (job.vehicle || 'Vehicle'),
                address: job.location?.address ? `${job.location.address.street || ''}, ${job.location.address.city || ''}` : (job.address || 'Location provided'),
                landmark: job.location?.landmark || job.landmark || ''
            }));

            setCaptainJobs(mappedJobs);

            // Update session with fresh rating/online status if session exists
            if (sessions.captain) {
                setSessions(prev => ({
                    ...prev,
                    captain: {
                        ...prev.captain,
                        rating: stats.rating,
                        isOnline: captain.isOnline,
                        isVerified: captain.isVerified || false,
                        location: captain.location
                    }
                }));
            }
        } catch (error) {
            console.error('Failed to load captain dashboard:', error);
        } finally {
            setCaptainJobsLoading(false);
            setCaptainEarningsLoading(false);
        }
    }, [sessions.captain?.id, setSessions]); // Use .id or .token to keep reference stable during attribute updates

    const loadAvailableProductMissions = useCallback(async () => {
        if (!sessions.captain || !sessions.captain.isOnline) return;
        try {
            setProductMissionsLoading(true);
            const response = await captainAPI.getAvailableProductMissions();
            setAvailableProductMissions(response.data.missions || []);
        } catch (error) {
            console.error('Failed to load available product missions:', error);
        } finally {
            setProductMissionsLoading(false);
        }
    }, [sessions.captain?.isOnline]);

    const acceptProductMission = useCallback(async (orderId, itemId) => {
        try {
            const response = await captainAPI.acceptProductMission(orderId, itemId);
            // Remove from available ones
            setAvailableProductMissions(prev => prev.filter(m => !(m.orderId === orderId && m._id === itemId)));
            // Refresh jobs to show it as active if needed, or redirect
            await loadCaptainDashboard();
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Failed to accept product mission:', error);
            return { success: false, error: error.message };
        }
    }, [loadCaptainDashboard]);

    const acceptProductBatch = useCallback(async (batchItems) => {
        try {
            const response = await captainAPI.acceptProductBatch(batchItems);
            const itemIds = batchItems.map(bi => bi.itemId);
            setAvailableProductMissions(prev => prev.filter(m => !itemIds.includes(m.itemId)));
            await loadCaptainDashboard();
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Failed to accept product batch:', error);
            return { success: false, error: error.message };
        }
    }, [loadCaptainDashboard]);

    const loadCaptainJobs = useCallback(async () => {
        if (!sessions.captain) return;
        try {
            setCaptainJobsLoading(true);
            const response = await captainAPI.getMyJobs();
            const mappedJobs = (response.data.jobs || []).map(job => ({
                ...job,
                id: job._id,
                price: `₹${job.pricing?.totalAmount || 0}`,
                serviceName: job.service?.name || 'Wash Service',
                userName: job.consumer?.name || 'Customer',
                vehicle: `${job.vehicle?.brand || ''} ${job.vehicle?.model || ''}`.trim() || 'Vehicle',
                address: job.location?.address ? `${job.location.address.street || ''}, ${job.location.address.city || ''}` : 'Location provided',
                landmark: job.location?.landmark || ''
            }));
            setCaptainJobs(mappedJobs);
        } catch (error) {
            console.error('Failed to load captain jobs:', error);
        } finally {
            setCaptainJobsLoading(false);
        }
    }, [sessions.captain?.id]);

    const loadPendingJobs = useCallback(async () => {
        if (!sessions.captain || !sessions.captain.isOnline) return;
        try {
            const response = await captainAPI.getPendingJobs();
            const pendingJobs = (response?.data?.jobs || []).map(job => ({
                ...job,
                id: job._id,
                price: `₹${job.pricing?.totalAmount || 0}`,
                serviceName: job.service?.name || 'Wash Service',
                userName: job.consumer?.name || 'Customer',
                vehicle: `${job.vehicle?.brand || ''} ${job.vehicle?.model || ''}`.trim() || 'Vehicle',
                address: job.location?.address ? `${job.location.address.street || ''}, ${job.location.address.city || ''}` : 'Location provided',
                landmark: job.location?.landmark || ''
            }));
            setCaptainJobs(prev => {
                const existingIds = new Set(prev.map(j => j.id || j._id));
                const newJobs = pendingJobs.filter(j => !existingIds.has(j.id || j._id));
                return [...prev, ...newJobs];
            });
        } catch (error) {
            console.error('Failed to load pending jobs:', error);
        }
    }, [sessions.captain?.id, sessions.captain?.isOnline]);

    const acceptJob = useCallback(async (jobId) => {
        try {
            const response = await captainAPI.acceptJob(jobId);
            setCaptainJobs(prev => prev.map(job =>
                (job.id === jobId || job._id === jobId) ? { ...job, status: 'accepted' } : job
            ));
            return { success: true, data: response?.data };
        } catch (error) {
            console.error('Failed to accept job:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const declineJob = useCallback(async (jobId) => {
        try {
            await captainAPI.declineJob(jobId);
            setCaptainJobs(prev => prev.filter(job => job.id !== jobId && job._id !== jobId));
            return { success: true };
        } catch (error) {
            console.error('Failed to decline job:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const commitToScheduledJob = useCallback(async (jobId) => {
        try {
            const response = await captainAPI.commitToScheduledJob(jobId);
            setCaptainJobs(prev => prev.map(job =>
                (job.id === jobId || job._id === jobId) ? { ...job, isDoorstepCommitted: true } : job
            ));
            return { success: true, data: response?.data };
        } catch (error) {
            console.error('Failed to commit to job:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const updateJobStatus = useCallback(async (jobId, status, extraData = {}) => {
        try {
            const response = await captainAPI.updateJobStatus(jobId, status, extraData);
            setCaptainJobs(prev => prev.map(job =>
                (job.id === jobId || job._id === jobId) ? { ...job, status, ...response?.data?.job } : job
            ));
            return { success: true, data: response?.data };
        } catch (error) {
            console.error('Failed to update job status:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const toggleOnline = useCallback(async (isOnline) => {
        try {
            await captainAPI.toggleOnline(isOnline);
            setSessions(prev => ({
                ...prev,
                captain: prev.captain ? { ...prev.captain, isOnline } : prev.captain
            }));

            // If going online, refresh dashboard to catch existing requests
            if (isOnline) {
                loadCaptainDashboard();
            } else {
                // If going offline, clear the job list of non-active jobs
                setCaptainJobs(prev => prev.filter(j => ['confirmed', 'en_route', 'arrived', 'washing', 'completed'].includes(j.status)));
            }
            return { success: true };
        } catch (error) {
            console.error('Failed to toggle online status:', error);
            return { success: false, error: error.message };
        }
    }, [setSessions, loadCaptainDashboard]);

    // Profile methods
    const captainGetProfile = useCallback(async () => {
        try {
            const response = await captainAPI.getProfile();
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Captain Get Profile error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const captainUpdateProfile = useCallback(async (profileData) => {
        try {
            const response = await captainAPI.updateProfile(profileData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Captain Update Profile error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const updateLocation = useCallback(async (lat, lng) => {
        try {
            const response = await captainAPI.updateLocation(lat, lng);
            if (response.status === 'success') {
                // Refresh dashboard to show jobs in the newly selected region
                loadCaptainDashboard();
            }
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Captain Update Location error:', error);
            return { success: false, error: error.message };
        }
    }, [loadCaptainDashboard]);

    // Auth methods
    const captainSendOTP = useCallback(async (phone, userData = null) => {
        try {
            const response = await captainAPI.sendOTP(phone, userData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Captain Send OTP error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const captainVerifyOTP = useCallback(async (phone, otp, options = {}) => {
        try {
            const { userData = null, isSignup = false } = options;
            const response = await captainAPI.verifyOTP(phone, otp, { isSignup, userData });
            const token = response.token || response.data?.token;
            const captain = response.data?.captain || response.captain || response.data;

            if (token) {
                captainAPI.setToken(token);
            }

            const sessionData = {
                id: captain._id,
                name: captain.name,
                email: captain.email,
                phone: captain.phone,
                role: 'captain',
                token,
                ...captain
            };

            login('captain', sessionData);
            return { success: true, data: { captain: sessionData, token } };
        } catch (error) {
            console.error('Captain Verify OTP error:', error);
            return { success: false, error: error.message };
        }
    }, [login]);

    const captainLogin = useCallback(async (phone, password) => {
        try {
            const response = await captainAPI.login(phone, password);
            const token = response.token || response.data?.token;
            const captain = response.data?.captain || response.captain || response.data;

            if (token) {
                captainAPI.setToken(token);
            }

            const sessionData = {
                id: captain._id,
                name: captain.name,
                email: captain.email,
                phone: captain.phone,
                role: 'captain',
                token,
                ...captain
            };

            login('captain', sessionData);
            return { success: true, data: { captain: sessionData, token } };
        } catch (error) {
            console.error('Captain Login error:', error);
            return { success: false, error: error.message };
        }
    }, [login]);

    const captainLogout = useCallback(async () => {
        try {
            await captainAPI.logout();
            captainAPI.setToken(null);
            setCaptainJobs([]);
            setCaptainEarnings({ balance: 0, totalEarned: 0, jobs: [] });
            logout('captain');
            return { success: true };
        } catch (error) {
            console.error('Captain Logout error:', error);
            return { success: false, error: error.message };
        }
    }, [logout]);

    const withdrawEarnings = useCallback(async (amount) => {
        try {
            setCaptainEarningsLoading(true);
            const response = await captainAPI.withdrawPayout(amount);
            await loadCaptainDashboard(); // Refresh balance
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Captain Withdraw error:', error);
            return { success: false, error: error.message };
        } finally {
            setCaptainEarningsLoading(false);
        }
    }, [loadCaptainDashboard]);

    // Auto-load dashboard on login/token change
    useEffect(() => {
        if (sessions.captain?.token) {
            loadCaptainDashboard();
        }
    }, [sessions.captain?.token, loadCaptainDashboard]);

    // Live Location Tracking
    useEffect(() => {
        let watchId = null;

        const isOnline = sessions.captain?.isOnline;

        if (isOnline) {
            console.log("Captain is online, starting background location tracking...");
            if ('geolocation' in navigator) {
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        captainAPI.updateLocation(latitude, longitude).catch(err => {
                            console.error("Failed to sync background location:", err);
                        });
                    },
                    (error) => {
                        if (error.code === 3) {
                            console.warn('Geolocation Timeout: Device taking too long to fix location. Retrying...');
                        } else {
                            console.error('Geolocation Error:', error.message);
                        }
                    },
                    { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
                );
            } else {
                console.warn('Geolocation is not supported by your browser.');
            }
        } else {
            // Not strictly necessary to log offline explicitly since component mounts/unmounts
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
            console.log("Captain is offline, stopped tracking location.");
        }

        return () => {
            if (watchId !== null && 'geolocation' in navigator) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [sessions.captain?.isOnline]);

    // Socket: Connect + Join captain's personal room so targeted broadcasts work
    useEffect(() => {
        const userId = sessions.captain?.id;
        if (!userId) return;

        // 1. Join captain's own room is now handled automatically by backend upon authentication
        // 2. Join specialized booking rooms if needed, but for general broadcasts 
        //    the user room (auto-joined) is sufficient.
        console.log('[CaptainContext] Socket system active for:', userId);

        const handleBookingUpdate = (data) => {
            setCaptainJobs(prev => prev.map(job => {
                if (job.id === data.bookingId || job._id === data.bookingId) {
                    return {
                        ...job,
                        status: data.status,
                        tracking: data.tracking || job.tracking
                    };
                }
                return job;
            }));
        };

        socketService.on('booking_status_updated', handleBookingUpdate);

        // Instant Wash: Broadcast for new available jobs
        const handleNewBroadcast = (data) => {
            if (!sessions.captain?.isOnline) return;

            setCaptainJobs(prev => {
                const alreadyExists = prev.find(j => j.id === data.bookingId || j._id === data.bookingId);
                if (alreadyExists) return prev;

                const newJob = {
                    ...data,
                    id: data.bookingId,
                    _id: data.bookingId,
                    status: 'pending',
                    price: data.pricing?.total ? `₹${data.pricing.total}` : (data.price || '₹0'),
                    serviceName: data.serviceName || 'Wash Service',
                    userName: data.userName || 'Customer',
                    vehicle: data.vehicle ? `${data.vehicle.brand || ''} ${data.vehicle.model || ''}`.trim() : 'Vehicle',
                    address: data.location?.address ? `${data.location.address.street || ''}, ${data.location.address.city || ''}` : 'Location provided',
                    landmark: data.location?.landmark || ''
                };
                return [newJob, ...prev];
            });
        };

        socketService.on('new_booking_broadcast', handleNewBroadcast);

        // Instant Wash: Remove job if someone else accepted it (Broadcast Closure)
        const handleBroadcastTaken = (data) => {
            setCaptainJobs(prev => prev.filter(j => (j.id !== data.bookingId && j._id !== data.bookingId)));
        };

        socketService.on('broadcast_taken', handleBroadcastTaken);

        // Doorstep Scheduled: Commitment Prompt
        const handleCommitmentRequest = (data) => {
            // Re-load dashboard to get the latest commitment state
            loadCaptainDashboard();
        };

        socketService.on('doorstep_commitment_request', handleCommitmentRequest);

        // Phase 33: Product Gig Broadcasts
        const handleNewProductBroadcast = (data) => {
            if (!sessions.captain?.isOnline) return;
            setAvailableProductMissions(prev => {
                const alreadyExists = prev.find(m => m.orderId === data.orderId && m._id === data.itemId);
                if (alreadyExists) return prev;
                return [data, ...prev];
            });
        };

        const handleProductMissionClaimed = (data) => {
            setAvailableProductMissions(prev => prev.filter(m => !(m.orderId === data.orderId && m._id === data.itemId)));
        };

        socketService.on('new_product_broadcast', handleNewProductBroadcast);
        socketService.on('product_mission_claimed', handleProductMissionClaimed);

        return () => {
            socketService.off('booking_status_updated', handleBookingUpdate);
            socketService.off('new_booking_broadcast', handleNewBroadcast);
            socketService.off('broadcast_taken', handleBroadcastTaken);
            socketService.off('doorstep_commitment_request', handleCommitmentRequest);
            socketService.off('new_product_broadcast', handleNewProductBroadcast);
            socketService.off('product_mission_claimed', handleProductMissionClaimed);
            // Note: Don't disconnect here — socket stays alive for the session
        };
    }, [sessions.captain?.id, sessions.captain?.isOnline]);


    return (
        <CaptainContext.Provider value={{
            captainJobs,
            captainJobsLoading,
            captainEarnings,
            captainEarningsLoading,
            loadCaptainJobs,
            loadPendingJobs,
            loadCaptainDashboard,
            acceptJob,
            declineJob,
            commitToScheduledJob,
            updateJobStatus,
            toggleOnline,
            updateLocation,
            captainGetProfile,
            captainUpdateProfile,
            captainSendOTP,
            captainVerifyOTP,
            captainLogin,
            captainLogout,
            withdrawEarnings,
            availableProductMissions,
            productMissionsLoading,
            loadAvailableProductMissions,
            acceptProductMission,
            acceptProductBatch,
            updateProductMissionStatus: (orderId, itemId, status, metadata) => captainAPI.updateProductMissionStatus(orderId, itemId, status, metadata)
        }}>
            {children}
        </CaptainContext.Provider>
    );
};
