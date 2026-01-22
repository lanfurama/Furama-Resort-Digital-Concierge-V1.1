import { useState, useEffect } from 'react';
import { BuggyStatus, RideRequest } from '../types';

interface UseRideTimersResult {
  elapsedTime: number; // Time elapsed in seconds (for SEARCHING)
  arrivingElapsedTime: number; // Time elapsed since driver accepted (for ASSIGNED/ARRIVING)
}

export const useRideTimers = (activeRide: RideRequest | undefined): UseRideTimersResult => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [arrivingElapsedTime, setArrivingElapsedTime] = useState<number>(0);

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

    // Track elapsed time when ASSIGNED/ARRIVING (driver has accepted but not arrived)
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

    // Track trip duration when ON_TRIP (already picked up)
    if (activeRide.status === BuggyStatus.ON_TRIP && activeRide.pickedUpAt) {
      setElapsedTime(0);
      setArrivingElapsedTime(0);

      // Force re-render every second to update trip duration display
      const timer = setInterval(() => {
        setElapsedTime(prev => prev === 0 ? 1 : 0);
      }, 1000);

      return () => clearInterval(timer);
    }

    // Reset both timers for other statuses
    setElapsedTime(0);
    setArrivingElapsedTime(0);
  }, [activeRide]);

  return {
    elapsedTime,
    arrivingElapsedTime
  };
};
