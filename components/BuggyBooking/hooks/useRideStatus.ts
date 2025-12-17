import { useState, useEffect, useRef } from 'react';
import { BuggyStatus, RideRequest } from '../../../types';
import { getActiveRideForUser } from '../../../services/dataService';
import { MAX_WAIT_TIME, MAX_ARRIVING_WAIT_TIME, ARRIVING_WARNING_TIME } from '../utils/constants';

interface UseRideStatusProps {
  roomNumber: string;
  onStatusChange?: (ride: RideRequest | undefined) => void;
  onNotification?: (message: string, type: 'success' | 'info' | 'warning') => void;
  playNotificationSound?: () => void;
}

/**
 * Hook to manage ride status polling and time tracking
 */
export const useRideStatus = ({ 
  roomNumber, 
  onStatusChange, 
  onNotification,
  playNotificationSound 
}: UseRideStatusProps) => {
  const [activeRide, setActiveRide] = useState<RideRequest | undefined>(undefined);
  const [isLoadingRide, setIsLoadingRide] = useState(true);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Time elapsed in seconds (for SEARCHING)
  const [arrivingElapsedTime, setArrivingElapsedTime] = useState<number>(0); // Time elapsed since driver accepted (for ASSIGNED/ARRIVING)
  const [previousStatus, setPreviousStatus] = useState<BuggyStatus | null>(null);

  const previousStatusRef = useRef<BuggyStatus | null>(null);
  const activeRideRef = useRef<RideRequest | undefined>(undefined);

  // Load active ride on mount and polling for ride updates
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const ride = await getActiveRideForUser(roomNumber);
        const currentPreviousStatus = previousStatusRef.current;
        const currentActiveRide = activeRideRef.current;
        
        // Detect when ride was ON_TRIP but now is undefined (completed)
        if (currentPreviousStatus === BuggyStatus.ON_TRIP && !ride && currentActiveRide) {
          setActiveRide(undefined);
          previousStatusRef.current = null;
          activeRideRef.current = undefined;
          onNotification?.('🎊 Ride completed successfully!', 'success');
          playNotificationSound?.();
          onStatusChange?.(undefined);
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
        }
        
        // Update refs
        previousStatusRef.current = ride?.status || null;
        activeRideRef.current = ride;
        
        // Update state
        setPreviousStatus(ride?.status || null);
        setActiveRide(ride);
        onStatusChange?.(ride);
        setIsLoadingRide(false);
      } catch (error) {
        console.error('Failed to check ride status:', error);
        setIsLoadingRide(false);
      }
    };
    
    checkStatus(); // Check immediately on mount
    
    // Adaptive polling: faster when there's an active ride (3s), slower when no ride (10s)
    let interval: NodeJS.Timeout;
    const scheduleNext = () => {
      const pollingInterval = activeRideRef.current ? 3000 : 10000;
      interval = setTimeout(() => {
        checkStatus();
        scheduleNext();
      }, pollingInterval);
    };
    
    scheduleNext();
    
    return () => {
      if (interval) clearTimeout(interval);
    };
  }, [roomNumber, onStatusChange, onNotification, playNotificationSound]);

  // Countdown timer for ride waiting time
  useEffect(() => {
    if (!activeRide) {
      setElapsedTime(0);
      setArrivingElapsedTime(0);
      return;
    }

    // Track elapsed time when SEARCHING (waiting for driver)
    if (activeRide.status === BuggyStatus.SEARCHING) {
      setArrivingElapsedTime(0);
      
      let startTime: number | undefined = activeRide.timestamp;
      const now = Date.now();
      if (!startTime || startTime > now || startTime < now - (24 * 60 * 60 * 1000)) {
        startTime = now;
      }
      
      const updateElapsed = () => {
        const currentTime = Date.now();
        const elapsed = Math.max(0, Math.floor((currentTime - startTime!) / 1000));
        setElapsedTime(elapsed);
      };

      updateElapsed();
      const timer = setInterval(updateElapsed, 1000);
      
      return () => clearInterval(timer);
    }
    
    // Track elapsed time when ASSIGNED/ARRIVING
    if (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) {
      setElapsedTime(0);
      
      let startTime: number | undefined = activeRide.confirmedAt;
      const now = Date.now();
      if (!startTime || startTime > now || startTime < now - (24 * 60 * 60 * 1000)) {
        startTime = now;
      }
      
      const updateArrivingElapsed = () => {
        const currentTime = Date.now();
        const elapsed = Math.max(0, Math.floor((currentTime - startTime!) / 1000));
        setArrivingElapsedTime(elapsed);
      };

      updateArrivingElapsed();
      const timer = setInterval(updateArrivingElapsed, 1000);
      
      return () => clearInterval(timer);
    }
    
    // Track trip duration when ON_TRIP
    if (activeRide.status === BuggyStatus.ON_TRIP && activeRide.pickedUpAt) {
      setElapsedTime(0);
      setArrivingElapsedTime(0);
      
      const timer = setInterval(() => {
        setElapsedTime(prev => prev === 0 ? 1 : 0); // Toggle to trigger re-render
      }, 1000);
      
      return () => clearInterval(timer);
    }
    
    // Reset both timers for other statuses
    setElapsedTime(0);
    setArrivingElapsedTime(0);
  }, [activeRide]);

  return {
    activeRide,
    isLoadingRide,
    elapsedTime,
    arrivingElapsedTime,
    setActiveRide
  };
};

