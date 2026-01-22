import { useState, useEffect, useRef, useCallback } from 'react';
import { BuggyStatus, RideRequest } from '../types';
import { getActiveRideForUser, getRides } from '../services/dataService';

interface UseRideStatusOptions {
  roomNumber: string;
  onStatusChange?: (prevStatus: BuggyStatus | null, newStatus: BuggyStatus | null) => void;
  onNotification?: (message: string, type: 'success' | 'info' | 'warning') => void;
  playNotificationSound?: () => void;
}

interface UseRideStatusResult {
  activeRide: RideRequest | undefined;
  isLoading: boolean;
  sharedRidesInfo: { totalGuests: number; sharedCount: number } | null;
  previousStatus: BuggyStatus | null;
}

export const useRideStatus = ({
  roomNumber,
  onStatusChange,
  onNotification,
  playNotificationSound
}: UseRideStatusOptions): UseRideStatusResult => {
  const [activeRide, setActiveRide] = useState<RideRequest | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [sharedRidesInfo, setSharedRidesInfo] = useState<{ totalGuests: number; sharedCount: number } | null>(null);
  const [previousStatus, setPreviousStatus] = useState<BuggyStatus | null>(null);

  const previousStatusRef = useRef<BuggyStatus | null>(null);
  const activeRideRef = useRef<RideRequest | undefined>(undefined);
  const isMountedRef = useRef<boolean>(true);
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const checkStatus = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const ride = await getActiveRideForUser(roomNumber);

      if (!isMountedRef.current) return;

      const currentPreviousStatus = previousStatusRef.current;
      const currentActiveRide = activeRideRef.current;

      // Detect when ride was ON_TRIP but now is undefined (completed)
      if (currentPreviousStatus === BuggyStatus.ON_TRIP && !ride && currentActiveRide) {
        setActiveRide(undefined);
        previousStatusRef.current = null;
        activeRideRef.current = undefined;
        setPreviousStatus(null);
        onNotification?.('🎊 Ride completed successfully!', 'success');
        playNotificationSound?.();
        return;
      }

      // Detect status changes for notifications
      if (ride && currentPreviousStatus !== null && currentPreviousStatus !== ride.status) {
        if (currentPreviousStatus === BuggyStatus.SEARCHING && ride.status === BuggyStatus.ASSIGNED) {
          onNotification?.('🎉 Driver accepted your ride!', 'success');
          playNotificationSound?.();
        } else if (currentPreviousStatus === BuggyStatus.ASSIGNED && ride.status === BuggyStatus.ARRIVING) {
          onNotification?.('🚗 Driver is arriving!', 'info');
          playNotificationSound?.();
        } else if (currentPreviousStatus === BuggyStatus.ARRIVING && ride.status === BuggyStatus.ON_TRIP) {
          onNotification?.('✅ You\'ve been picked up!', 'success');
          playNotificationSound?.();
        } else if (currentPreviousStatus === BuggyStatus.ON_TRIP && ride.status === BuggyStatus.COMPLETED) {
          onNotification?.('🎊 Ride completed successfully!', 'success');
          playNotificationSound?.();
        }
        onStatusChange?.(currentPreviousStatus, ride.status);
      }

      // Only update state if ride data actually changed
      const currentRide = activeRideRef.current;
      const rideChanged = !currentRide ||
        currentRide.id !== ride?.id ||
        currentRide.status !== ride?.status ||
        currentRide.driverId !== ride?.driverId ||
        currentRide.guestCount !== ride?.guestCount ||
        currentRide.pickup !== ride?.pickup ||
        currentRide.destination !== ride?.destination;

      // Update refs
      previousStatusRef.current = ride?.status || null;
      activeRideRef.current = ride;

      // Only update state if something actually changed
      if (rideChanged) {
        setPreviousStatus(ride?.status || null);
        setActiveRide(ride);
      }

      // Check for shared rides
      if (ride && ride.driverId && (ride.status === BuggyStatus.ASSIGNED || ride.status === BuggyStatus.ARRIVING || ride.status === BuggyStatus.ON_TRIP)) {
        const shouldCheckShared = !currentRide || currentRide.driverId !== ride.driverId || !sharedRidesInfo;

        if (shouldCheckShared) {
          try {
            const allRides = await getRides();
            const sharedRides = allRides.filter(r =>
              r.id !== ride.id &&
              r.driverId === ride.driverId &&
              (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP)
            );

            if (sharedRides.length > 0) {
              const totalGuests = (ride.guestCount || 1) + sharedRides.reduce((sum, r) => sum + (r.guestCount || 1), 0);
              setSharedRidesInfo({ totalGuests, sharedCount: sharedRides.length });
            } else {
              setSharedRidesInfo(null);
            }
          } catch (error) {
            console.error('Failed to check shared rides:', error);
            setSharedRidesInfo(null);
          }
        }
      } else {
        if (sharedRidesInfo) {
          setSharedRidesInfo(null);
        }
      }

      setIsLoading(false);
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error('Failed to check ride status:', error);
      setIsLoading(false);
    }
  }, [roomNumber, sharedRidesInfo, onStatusChange, onNotification, playNotificationSound]);

  useEffect(() => {
    isMountedRef.current = true;

    checkStatus();

    // Adaptive polling
    const scheduleNext = () => {
      if (!isMountedRef.current) return;

      let pollingInterval = 15000; // Default: no ride
      if (activeRideRef.current) {
        if (activeRideRef.current.status === BuggyStatus.SEARCHING) {
          pollingInterval = 8000;
        } else {
          pollingInterval = 5000;
        }
      }

      const interval = setTimeout(() => {
        intervalsRef.current.delete(interval);
        if (isMountedRef.current) {
          checkStatus();
          scheduleNext();
        }
      }, pollingInterval);

      intervalsRef.current.add(interval);
    };

    scheduleNext();

    return () => {
      isMountedRef.current = false;
      intervalsRef.current.forEach(interval => clearTimeout(interval));
      intervalsRef.current.clear();
    };
  }, [checkStatus]);

  return {
    activeRide,
    isLoading,
    sharedRidesInfo,
    previousStatus
  };
};
