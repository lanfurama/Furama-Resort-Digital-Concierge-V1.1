import { useState, useRef } from 'react';
import { useAdaptivePolling } from '../../../hooks/useAdaptivePolling';
import { getRides, getLastMessage } from '../../../services/dataService';
import { RideRequest, BuggyStatus } from '../../../types';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from '../../../contexts/LanguageContext';

const POLL_ERROR_TOAST_DEBOUNCE_MS = 30000;

export const useRides = (currentDriverActualId: string | null) => {
    const toast = useToast();
    const { t } = useTranslation();
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [myRideId, setMyRideId] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [hasUnreadChat, setHasUnreadChat] = useState(false);
    const lastPollErrorToastRef = useRef<number>(0);

    // Polling for new rides and chat messages
    useAdaptivePolling(() => {
        const loadRides = async () => {
            try {
                const allRides = await getRides();
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
                console.error('Failed to load rides:', error);
                const now = Date.now();
                if (now - lastPollErrorToastRef.current >= POLL_ERROR_TOAST_DEBOUNCE_MS) {
                    lastPollErrorToastRef.current = now;
                    toast.error(t('driver_toast_load_rides_failed'));
                }
            }
        };
        loadRides();
    }, {
        activeInterval: 5000,
        idleInterval: 30000,
        backgroundInterval: 60000
    });

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
