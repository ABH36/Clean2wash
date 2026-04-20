import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Offline Queue Hook for Spare Driver App
 * Handles location updates and booking actions when offline
 * Auto-syncs when connection is restored
 */

const STORAGE_KEY = 'spare_driver_offline_queue';
const MAX_QUEUE_SIZE = 100;
const SYNC_RETRY_DELAY = 5000; // 5 seconds

export const useOfflineQueue = (api) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queueSize, setQueueSize] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const syncTimeoutRef = useRef(null);
    const lastSyncAttempt = useRef(0);

    // Load queue from localStorage
    const loadQueue = useCallback(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[OfflineQueue] Failed to load queue:', error);
            return [];
        }
    }, []);

    // Save queue to localStorage
    const saveQueue = useCallback((queue) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
            setQueueSize(queue.length);
        } catch (error) {
            console.error('[OfflineQueue] Failed to save queue:', error);
        }
    }, []);

    // Add item to queue
    const enqueue = useCallback((type, data, priority = 'normal') => {
        const queue = loadQueue();
        
        // Check queue size limit
        if (queue.length >= MAX_QUEUE_SIZE) {
            console.warn('[OfflineQueue] Queue is full, removing oldest item');
            queue.shift();
        }

        const item = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type, // 'location', 'booking_accept', 'booking_reject', 'status_update'
            data,
            priority, // 'high', 'normal', 'low'
            timestamp: Date.now(),
            attempts: 0,
            maxAttempts: 3
        };

        // Add based on priority
        if (priority === 'high') {
            queue.unshift(item);
        } else {
            queue.push(item);
        }

        saveQueue(queue);
        console.log(`[OfflineQueue] Enqueued ${type}:`, item.id);
        
        return item.id;
    }, [loadQueue, saveQueue]);

    // Remove item from queue
    const dequeue = useCallback((itemId) => {
        const queue = loadQueue();
        const filtered = queue.filter(item => item.id !== itemId);
        saveQueue(filtered);
        console.log(`[OfflineQueue] Dequeued:`, itemId);
    }, [loadQueue, saveQueue]);

    // Update item attempts
    const incrementAttempts = useCallback((itemId) => {
        const queue = loadQueue();
        const item = queue.find(q => q.id === itemId);
        if (item) {
            item.attempts += 1;
            item.lastAttempt = Date.now();
            saveQueue(queue);
        }
    }, [loadQueue, saveQueue]);

    // Sync queue with server
    const syncQueue = useCallback(async () => {
        if (!navigator.onLine) {
            console.log('[OfflineQueue] Cannot sync: offline');
            return { success: false, reason: 'offline' };
        }

        if (isSyncing) {
            console.log('[OfflineQueue] Sync already in progress');
            return { success: false, reason: 'syncing' };
        }

        // Rate limiting: Don't sync more than once every 3 seconds
        const now = Date.now();
        if (now - lastSyncAttempt.current < 3000) {
            console.log('[OfflineQueue] Sync rate limited');
            return { success: false, reason: 'rate_limited' };
        }

        lastSyncAttempt.current = now;
        setIsSyncing(true);

        const queue = loadQueue();
        if (queue.length === 0) {
            setIsSyncing(false);
            return { success: true, synced: 0 };
        }

        console.log(`[OfflineQueue] Syncing ${queue.length} items...`);

        let synced = 0;
        let failed = 0;

        // Process queue items
        for (const item of queue) {
            // Skip if max attempts reached
            if (item.attempts >= item.maxAttempts) {
                console.warn(`[OfflineQueue] Max attempts reached for ${item.id}, removing`);
                dequeue(item.id);
                failed++;
                continue;
            }

            try {
                // Process based on type
                switch (item.type) {
                    case 'location':
                        await api.updateLocation(item.data.lat, item.data.lng);
                        break;
                    
                    case 'booking_accept':
                        await api.acceptBooking(item.data.bookingId);
                        break;
                    
                    case 'booking_reject':
                        await api.rejectBooking(item.data.bookingId, item.data.reason);
                        break;
                    
                    case 'status_update':
                        await api.updateBookingStatus(
                            item.data.bookingId, 
                            item.data.status, 
                            item.data.pin
                        );
                        break;
                    
                    default:
                        console.warn(`[OfflineQueue] Unknown type: ${item.type}`);
                        dequeue(item.id);
                        continue;
                }

                // Success - remove from queue
                dequeue(item.id);
                synced++;
                console.log(`[OfflineQueue] Synced ${item.type}:`, item.id);

            } catch (error) {
                console.error(`[OfflineQueue] Failed to sync ${item.id}:`, error);
                incrementAttempts(item.id);
                failed++;

                // If it's a critical error (auth, validation), remove item
                if (error.message?.includes('unauthorized') || 
                    error.message?.includes('invalid') ||
                    error.message?.includes('not found')) {
                    console.warn(`[OfflineQueue] Critical error, removing ${item.id}`);
                    dequeue(item.id);
                }
            }
        }

        setIsSyncing(false);
        console.log(`[OfflineQueue] Sync complete: ${synced} synced, ${failed} failed`);

        // Schedule retry if there are failed items
        if (failed > 0 && navigator.onLine) {
            console.log(`[OfflineQueue] Scheduling retry in ${SYNC_RETRY_DELAY}ms`);
            syncTimeoutRef.current = setTimeout(syncQueue, SYNC_RETRY_DELAY);
        }

        return { success: true, synced, failed };
    }, [api, isSyncing, loadQueue, dequeue, incrementAttempts]);

    // Clear queue
    const clearQueue = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setQueueSize(0);
        console.log('[OfflineQueue] Queue cleared');
    }, []);

    // Get queue stats
    const getQueueStats = useCallback(() => {
        const queue = loadQueue();
        return {
            total: queue.length,
            byType: queue.reduce((acc, item) => {
                acc[item.type] = (acc[item.type] || 0) + 1;
                return acc;
            }, {}),
            byPriority: queue.reduce((acc, item) => {
                acc[item.priority] = (acc[item.priority] || 0) + 1;
                return acc;
            }, {}),
            oldestTimestamp: queue.length > 0 ? queue[0].timestamp : null,
            newestTimestamp: queue.length > 0 ? queue[queue.length - 1].timestamp : null
        };
    }, [loadQueue]);

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => {
            console.log('[OfflineQueue] Connection restored');
            setIsOnline(true);
            
            // Auto-sync when coming back online
            setTimeout(() => {
                syncQueue();
            }, 1000);
        };

        const handleOffline = () => {
            console.log('[OfflineQueue] Connection lost');
            setIsOnline(false);
            
            // Clear any pending sync timeout
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
                syncTimeoutRef.current = null;
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial queue size
        setQueueSize(loadQueue().length);

        // Initial sync if online and queue has items
        if (navigator.onLine && loadQueue().length > 0) {
            setTimeout(syncQueue, 2000);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, [loadQueue, syncQueue]);

    return {
        isOnline,
        queueSize,
        isSyncing,
        enqueue,
        dequeue,
        syncQueue,
        clearQueue,
        getQueueStats
    };
};

export default useOfflineQueue;
