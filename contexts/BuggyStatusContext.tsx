import React, { createContext, useState, useContext, useEffect, useRef, ReactNode, useCallback } from 'react';
import { BuggyStatus, UserRole } from '../types';
import { getActiveRideForUser } from '../services/dataService';
import { useAdaptivePolling } from '../hooks/useAdaptivePolling';

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

  // Callback for checking buggy status
  const checkBuggyStatus = useCallback(async () => {
    if (!user || user.role !== UserRole.GUEST || !user.roomNumber) return;

    try {
      const activeRide = await getActiveRideForUser(user.roomNumber);
      if (activeRide) {
        // Only update status if it actually changed
        if (activeRide.status !== prevBuggyStatusRef.current) {
          prevBuggyStatusRef.current = activeRide.status;
          setBuggyStatus(activeRide.status);
          activeRideTimestampRef.current = activeRide.timestamp;

          // Reset wait time if status changed away from SEARCHING
          if (activeRide.status !== BuggyStatus.SEARCHING) {
            if (prevBuggyWaitTimeRef.current !== 0) {
              prevBuggyWaitTimeRef.current = 0;
              setBuggyWaitTime(0);
            }
          }
        } else {
          // Update timestamp if status hasn't changed but ride still exists
          activeRideTimestampRef.current = activeRide.timestamp;
        }
      } else {
        // Only update if status was not already null
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
  }, [user]);

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

