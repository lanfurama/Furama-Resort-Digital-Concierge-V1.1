import { RideRequest } from '../../../types';

/**
 * Format timestamp to time string (HH:MM)
 */
export const formatTime = (ts?: number): string => {
    return ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
};

/**
 * Calculate waiting time in minutes
 */
export const getWaitingTime = (timestamp: number, currentTime: number): number => {
    const waitingMs = currentTime - timestamp;
    return Math.floor(waitingMs / (1000 * 60)); // minutes
};

/**
 * Format waiting time for display
 */
export const formatWaitingTime = (timestamp: number, currentTime: number): string => {
    const minutes = getWaitingTime(timestamp, currentTime);
    if (minutes < 1) return '<1m';
    return `${minutes}m`;
};

/**
 * Get waiting time color based on duration
 */
export const getWaitingTimeColor = (timestamp: number, currentTime: number): string => {
    const minutes = getWaitingTime(timestamp, currentTime);
    if (minutes >= 10) {
        return 'text-red-600 font-bold'; // > 10 minutes - red
    } else if (minutes >= 5) {
        return 'text-orange-600 font-semibold'; // 5-10 minutes - orange
    } else {
        return 'text-gray-600'; // < 5 minutes - gray
    }
};

/** Translation key for priority badge (use with t() in component). */
export type PriorityLabelKey = 'driver_priority_urgent' | 'driver_priority_high' | 'driver_priority_villa' | 'driver_priority_new';

/**
 * Get priority badge info for a ride (labelKey for i18n)
 */
export const getPriorityInfo = (ride: RideRequest, currentTime: number): { labelKey: PriorityLabelKey; color: string; textColor: string; border?: string } => {
    const waitingMinutes = getWaitingTime(ride.timestamp, currentTime);
    const roomNumber = ride.roomNumber.toUpperCase();
    const firstChar = roomNumber.charAt(0);
    const isVilla = ['D', 'P', 'S', 'Q'].includes(firstChar);

    if (waitingMinutes > 10) {
        return { labelKey: 'driver_priority_urgent', color: 'bg-red-500', textColor: 'text-white' };
    } else if (waitingMinutes > 5) {
        return { labelKey: 'driver_priority_high', color: 'bg-orange-500', textColor: 'text-white' };
    } else if (isVilla) {
        return { labelKey: 'driver_priority_villa', color: 'bg-purple-500/20', textColor: 'text-purple-300', border: 'border-purple-500/50' };
    } else {
        return { labelKey: 'driver_priority_new', color: 'bg-emerald-500', textColor: 'text-white' };
    }
};

/**
 * Calculate priority for sorting ride requests
 */
export const calculatePriority = (ride: RideRequest, currentTime: number): number => {
    const waitingTime = currentTime - ride.timestamp; // milliseconds
    const waitingMinutes = waitingTime / (1000 * 60); // convert to minutes

    // Base priority: older requests get higher priority (lower number = higher priority)
    let priority = waitingMinutes;

    // Room type priority adjustment
    const roomNumber = ride.roomNumber.toUpperCase();
    const firstChar = roomNumber.charAt(0);

    // Villa series (D, P, S, Q) get slight priority boost (subtract 2 minutes)
    // Room series (R) are standard priority
    if (firstChar === 'D' || firstChar === 'P' || firstChar === 'S' || firstChar === 'Q') {
        priority -= 2; // Villa requests appear slightly higher
    }

    // Very old requests (> 10 minutes) get extra priority boost
    if (waitingMinutes > 10) {
        priority -= 5; // Urgent: waiting too long
    }

    // Very recent requests (< 1 minute) get slight delay
    if (waitingMinutes < 1) {
        priority += 1; // Let older requests be processed first
    }

    return priority;
};
