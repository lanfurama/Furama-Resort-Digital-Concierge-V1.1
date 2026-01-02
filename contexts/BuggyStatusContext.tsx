import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { BuggyStatus, UserRole } from '../types';
import { getActiveRideForUser } from '../services/dataService';

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
  
  // Separate effect for checking buggy status (less frequent - every 3 seconds)
  useEffect(() => {
    if (user && user.role === UserRole.GUEST && user.roomNumber) {
      const checkBuggyStatus = async () => {
        try {
          const activeRide = await getActiveRideForUser(user.roomNumber!);
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
      };
      
      // Initial check
      checkBuggyStatus();
      
      // Poll status every 5 seconds (only check for status changes)
      const interval = setInterval(checkBuggyStatus, 5000);
      return () => clearInterval(interval);
    } else {
      // Reset refs when user changes
      prevBuggyStatusRef.current = null;
      prevBuggyWaitTimeRef.current = 0;
      activeRideTimestampRef.current = null;
      setBuggyStatus(null);
      setBuggyWaitTime(0);
    }
  }, [user?.roomNumber]); // Only depend on roomNumber, not entire user object
  
  // Separate effect for updating wait time (only when SEARCHING)
  useEffect(() => {
    if (user && user.role === UserRole.GUEST && user.roomNumber && 
        buggyStatus === BuggyStatus.SEARCHING && 
        activeRideTimestampRef.current !== null) {
      const updateWaitTime = () => {
        const now = Date.now();
        const elapsed = Math.max(0, Math.floor((now - activeRideTimestampRef.current!) / 1000));
        // Only update if value actually changed (to prevent unnecessary re-renders)
        if (elapsed !== prevBuggyWaitTimeRef.current) {
          prevBuggyWaitTimeRef.current = elapsed;
          setBuggyWaitTime(elapsed);
        }
      };
      
      // Update immediately
      updateWaitTime();
      
      // Update frequency based on current page:
      // - On buggy page: every 2 seconds for accurate display
      // - On other pages: every 8 seconds to reduce re-renders and API calls
      const interval = setInterval(updateWaitTime, isOnBuggyPage ? 2000 : 8000);
      return () => clearInterval(interval);
    } else {
      // Clear wait time when not SEARCHING
      if (prevBuggyWaitTimeRef.current !== 0) {
        prevBuggyWaitTimeRef.current = 0;
        setBuggyWaitTime(0);
      }
    }
  }, [user?.roomNumber, buggyStatus, isOnBuggyPage]); // Re-run when status changes to/from SEARCHING or page changes

  return (
    <BuggyStatusContext.Provider value={{ buggyStatus, buggyWaitTime }}>
      {children}
    </BuggyStatusContext.Provider>
  );
};

export const useBuggyStatus = () => {
  const context = useContext(BuggyStatusContext);
  if (!context) {
    // Return default values if context is not available (for non-guest users)
    return { buggyStatus: null, buggyWaitTime: 0 };
  }
  return context;
};

