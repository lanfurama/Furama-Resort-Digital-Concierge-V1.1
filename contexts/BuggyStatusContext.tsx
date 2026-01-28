import React, { createContext, useState, useContext, useEffect, useRef, ReactNode, useCallback } from 'react';
import { BuggyStatus, UserRole } from '../types';
import { getActiveRideForUser } from '../services/dataService';
import { useAdaptivePolling } from '../hooks/useAdaptivePolling';
import { playGuestNotificationFeedback } from '../utils/buggyUtils';

interface BuggyStatusContextProps {
  buggyStatus: BuggyStatus | null;
  buggyWaitTime: number;
}

const BuggyStatusContext = createContext<BuggyStatusContextProps | undefined>(undefined);

export const BuggyStatusProvider: React.FC<{
  children: ReactNode;
  user: { role: UserRole; roomNumber?: string } | null;
  currentView?: string; // Current view to optimize updates (optional)
}> = ({ children, user, currentView = '' }) => {
  const [buggyStatus, setBuggyStatus] = useState<BuggyStatus | null>(null);
  const [buggyWaitTime, setBuggyWaitTime] = useState<number>(0);

  // Use refs to track previous values and only update state when values actually change
  const prevBuggyStatusRef = useRef<BuggyStatus | null>(null);
  const prevBuggyWaitTimeRef = useRef<number>(0);
  const activeRideTimestampRef = useRef<number | null>(null);
  const isOnBuggyPage = currentView === 'BUGGY';

  const shouldPlayFeedback = useCallback((prev: BuggyStatus | null, next: BuggyStatus | null) => {
    if (prev === next) return false;
    if (prev === BuggyStatus.SEARCHING && next === BuggyStatus.ASSIGNED) return true;
    if (prev === BuggyStatus.ASSIGNED && next === BuggyStatus.ARRIVING) return true;
    if (prev === BuggyStatus.ARRIVING && next === BuggyStatus.ON_TRIP) return true;
    if (prev === BuggyStatus.ON_TRIP && next === null) return true;
    if (prev === BuggyStatus.ON_TRIP && next === BuggyStatus.COMPLETED) return true;
    return false;
  }, []);

  // Callback for checking buggy status
  const checkBuggyStatus = useCallback(async () => {
    if (!user || user.role !== UserRole.GUEST || !user.roomNumber) return;

    const onBuggyPage = currentView === 'BUGGY';

    try {
      const activeRide = await getActiveRideForUser(user.roomNumber);
      if (activeRide) {
        const prev = prevBuggyStatusRef.current;
        const next = activeRide.status;
        if (next !== prev) {
          if (!onBuggyPage && shouldPlayFeedback(prev, next)) {
            const sound = localStorage.getItem('guest_sound_enabled') !== 'false';
            const vibrate = localStorage.getItem('guest_vibrate_enabled') !== 'false';
            playGuestNotificationFeedback(sound, vibrate);
          }
          prevBuggyStatusRef.current = next;
          setBuggyStatus(next);
          activeRideTimestampRef.current = activeRide.timestamp;
          if (next !== BuggyStatus.SEARCHING) {
            if (prevBuggyWaitTimeRef.current !== 0) {
              prevBuggyWaitTimeRef.current = 0;
              setBuggyWaitTime(0);
            }
          }
        } else {
          activeRideTimestampRef.current = activeRide.timestamp;
        }
      } else {
        const prev = prevBuggyStatusRef.current;
        if (prev !== null) {
          if (!onBuggyPage && shouldPlayFeedback(prev, null)) {
            const sound = localStorage.getItem('guest_sound_enabled') !== 'false';
            const vibrate = localStorage.getItem('guest_vibrate_enabled') !== 'false';
            playGuestNotificationFeedback(sound, vibrate);
          }
          prevBuggyStatusRef.current = null;
          setBuggyStatus(null);
          activeRideTimestampRef.current = null;
        }
        if (prevBuggyWaitTimeRef.current !== 0) {
          prevBuggyWaitTimeRef.current = 0;
          setBuggyWaitTime(0);
        }
      }
    } catch (error) {
      console.error('Failed to check buggy status:', error);
      // Only update on error if values were not already null/0
      if (prevBuggyStatusRef.current !== null) {
        prevBuggyStatusRef.current = null;
        setBuggyStatus(null);
        activeRideTimestampRef.current = null;
      }
      if (prevBuggyWaitTimeRef.current !== 0) {
        prevBuggyWaitTimeRef.current = 0;
        setBuggyWaitTime(0);
      }
    }
  }, [user, currentView, shouldPlayFeedback]);

  // Use adaptive polling for status check (base 5s, slows down when idle/hidden)
  useAdaptivePolling(
    checkBuggyStatus,
    {
      enabled: !!(user && user.role === UserRole.GUEST),
      activeInterval: 5000,
      idleInterval: 15000,
      backgroundInterval: 30000
    }
  );

  // Callback for updating wait time
  const updateWaitTime = useCallback(() => {
    if (!user || user.role !== UserRole.GUEST || !user.roomNumber ||
      buggyStatus !== BuggyStatus.SEARCHING || activeRideTimestampRef.current === null) {
      // Clear wait time when not SEARCHING
      if (prevBuggyWaitTimeRef.current !== 0) {
        prevBuggyWaitTimeRef.current = 0;
        setBuggyWaitTime(0);
      }
      return;
    }

    const now = Date.now();
    const elapsed = Math.max(0, Math.floor((now - activeRideTimestampRef.current) / 1000));
    // Only update if value actually changed
    if (elapsed !== prevBuggyWaitTimeRef.current) {
      prevBuggyWaitTimeRef.current = elapsed;
      setBuggyWaitTime(elapsed);
    }
  }, [user, buggyStatus]);

  // Use adaptive polling for wait time update
  useAdaptivePolling(
    updateWaitTime,
    {
      enabled: !!(user && user.role === UserRole.GUEST && buggyStatus === BuggyStatus.SEARCHING),
      activeInterval: isOnBuggyPage ? 1000 : 5000, // Frequent updates when visible on buggy page
      idleInterval: 5000,
      backgroundInterval: 30000 // Very slow updates in background
    }
  );

  // Initial reset when user changes
  useEffect(() => {
    if (!user || user.role !== UserRole.GUEST) {
      prevBuggyStatusRef.current = null;
      prevBuggyWaitTimeRef.current = 0;
      activeRideTimestampRef.current = null;
      setBuggyStatus(null);
      setBuggyWaitTime(0);
    }
  }, [user]);

  return (
    <BuggyStatusContext.Provider value={{ buggyStatus, buggyWaitTime }}>
      {children}
    </BuggyStatusContext.Provider>
  );
};

export const useBuggyStatus = () => {
  const context = useContext(BuggyStatusContext);
  if (!context) {
    return { buggyStatus: null, buggyWaitTime: 0 };
  }
  return context;
};

