import { RideRequest, BuggyStatus } from '../../../types';
import { calculatePriority } from './rideUtils';

export const getPendingRides = (rides: RideRequest[], currentTime: number): RideRequest[] => {
    return rides
        .filter(r => r.status === BuggyStatus.SEARCHING)
        .sort((a, b) => {
            const priorityA = calculatePriority(a, currentTime);
            const priorityB = calculatePriority(b, currentTime);
            return priorityA - priorityB;
        });
};

export const getHistoryRides = (rides: RideRequest[], currentDriverActualId: string | null): RideRequest[] => {
    return rides.filter(r => {
        if (r.status !== BuggyStatus.COMPLETED) return false;
        if (currentDriverActualId) {
            return r.driverId === currentDriverActualId || r.driverId === currentDriverActualId.toString();
        }
        return r.driverId !== undefined && r.driverId !== null;
    }).sort((a, b) => b.timestamp - a.timestamp);
};

export const getCurrentRide = (rides: RideRequest[], myRideId: string | null): RideRequest | undefined => {
    return rides.find(r => r.id === myRideId);
};
