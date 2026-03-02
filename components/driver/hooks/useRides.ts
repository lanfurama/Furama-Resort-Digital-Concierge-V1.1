import { useState, useRef, useEffect } from 'react';
import { useAdaptivePolling } from '../../../hooks/useAdaptivePolling';
import { getRides, getLastMessage } from '../../../services/dataService';
import { RideRequest, BuggyStatus } from '../../../types';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from '../../../contexts/LanguageContext';

const POLL_ERROR_TOAST_DEBOUNCE_MS = 30000;
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export const useRides = (currentDriverActualId: string | null) => {
    const toast = useToast();
    const { t } = useTranslation();
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [myRideId, setMyRideId] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [hasUnreadChat, setHasUnreadChat] = useState(false);
    const lastPollErrorToastRef = useRef<number>(0);
    const retryCountRef = useRef<number>(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Retry logic with exponential backoff
    const loadRidesWithRetry = async (attempt: number = 0): Promise<void> => {
        try {
            const allRides = await getRides();
            retryCountRef.current = 0; // Reset on success
            
            setRides(allRides);

            // Check if I have an active ride (match by driverId)
            const active = allRides.find(r => {
                if (r.status !== BuggyStatus.ASSIGNED && r.status !== BuggyStatus.ARRIVING && r.status !== BuggyStatus.ON_TRIP) {
                    return false;
                }
                if (currentDriverActualId) {
                    return r.driverId === currentDriverActualId || r.driverId === currentDriverActualId.toString();
                }
                return r.driverId !== undefined && r.driverId !== null;
            });

            if (active) {
                setMyRideId(active.id);
                // Check for unread messages from Guest for this ride
                try {
                    const lastMsg = await getLastMessage(active.roomNumber, 'BUGGY');
                    if (lastMsg && lastMsg.role === 'user') {
                        setHasUnreadChat(true);
                    }
                } catch {
                    // Non-fatal: skip unread badge
                }
            } else {
                setMyRideId(null);
                setShowChat(false);
                setHasUnreadChat(false);
            }
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to load rides:', error);
            }
            
            // Retry with exponential backoff
            if (attempt < MAX_RETRY_ATTEMPTS) {
                const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
                retryCountRef.current = attempt + 1;
                
                if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                }
                
                retryTimeoutRef.current = setTimeout(() => {
                    loadRidesWithRetry(attempt + 1);
                }, delay);
            } else {
                // Max retries reached, show error toast
                retryCountRef.current = 0;
                const now = Date.now();
                if (now - lastPollErrorToastRef.current >= POLL_ERROR_TOAST_DEBOUNCE_MS) {
                    lastPollErrorToastRef.current = now;
                    toast.error(t('driver_toast_load_rides_failed'));
                }
            }
        }
    };

    // Polling for new rides and chat messages - optimized for mobile
    useAdaptivePolling(() => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
        loadRidesWithRetry();
    }, {
        activeInterval: 5000,
        idleInterval: 30000,
        backgroundInterval: 120000 // Increased from 60s to 120s for better mobile battery life
    });

    // Cleanup retry timeout on unmount
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
        };
    }, []);

    return {
        rides,
        setRides,
        myRideId,
        setMyRideId,
        showChat,
        setShowChat,
        hasUnreadChat,
        setHasUnreadChat
    };
};
