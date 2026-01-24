import { useState } from 'react';
import { useAdaptivePolling } from '../../../hooks/useAdaptivePolling';
import { getRides, getLastMessage } from '../../../services/dataService';
import { RideRequest, BuggyStatus } from '../../../types';

export const useRides = (currentDriverActualId: string | null) => {
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [myRideId, setMyRideId] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [hasUnreadChat, setHasUnreadChat] = useState(false);

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
                    const lastMsg = await getLastMessage(active.roomNumber, 'BUGGY');
                    if (lastMsg && lastMsg.role === 'user') {
                        setHasUnreadChat(true);
                    }
                } else {
                    setMyRideId(null);
                    setShowChat(false);
                    setHasUnreadChat(false);
                }
            } catch (error) {
                console.error('Failed to load rides:', error);
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
