import { useState, useEffect, useRef, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean; // Track if we were offline before
}

/**
 * Hook to detect network connectivity status
 * Returns online status and handles auto-reload when connection is restored
 */
export const useNetworkStatus = (autoReload: boolean = true) => {
  // Always trust navigator.onLine as initial state
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => {
    const initialOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return {
      isOnline: initialOnline,
      wasOffline: false,
    };
  });

  const wasOfflineRef = useRef(false);
  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Test actual connectivity by making a lightweight request
  // Returns null if test is inconclusive (should trust navigator.onLine)
  const testConnection = useCallback(async (): Promise<boolean | null> => {
    try {
      // First check navigator.onLine (fast check)
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return false;
      }

      // Then test actual connection with a lightweight request
      // Try API health endpoint first, fallback to favicon
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      try {
        // Try API health check endpoint if available
        const response = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-cache',
          signal: controller.signal,
          // Don't throw on network errors, just return false
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          return true;
        }
        // If response is not ok but we got a response, connection exists
        return null; // Inconclusive - trust navigator.onLine
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        // If it's an abort (timeout) or network error, might still be online
        // Don't immediately assume offline - return null to trust navigator.onLine
        if (error.name === 'AbortError' || error.message?.includes('Failed to fetch')) {
          return null; // Inconclusive - trust navigator.onLine
        }
        
        // Fallback to favicon if API endpoint fails
        try {
          const faviconController = new AbortController();
          const faviconTimeout = setTimeout(() => faviconController.abort(), 2000);
          const faviconResponse = await fetch('/favicon.ico', {
            method: 'HEAD',
            cache: 'no-cache',
            signal: faviconController.signal,
          });
          clearTimeout(faviconTimeout);
          return faviconResponse.ok;
        } catch {
          clearTimeout(timeoutId);
          // If both fail, but navigator says online, trust navigator
          return null; // Inconclusive - trust navigator.onLine
        }
      }
    } catch (error) {
      // On any error, trust navigator.onLine
      return null;
    }
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      // Trust navigator.onLine first, then verify with test
      setNetworkStatus((prev) => {
        const wasOffline = prev.wasOffline || wasOfflineRef.current;

        // If we were offline and now online, trigger reload after a short delay
        if (autoReload && wasOffline && reloadTimeoutRef.current === null) {
          reloadTimeoutRef.current = setTimeout(() => {
            // Small delay to ensure connection is stable
            window.location.reload();
          }, 1000);
        }

        return {
          isOnline: true, // Trust navigator.onLine
          wasOffline: wasOffline,
        };
      });

      wasOfflineRef.current = false;

      // Test connection in background to verify
      const connectionResult = await testConnection();
      if (connectionResult === false) {
        // Test says definitely offline, but navigator says online
        // This is rare - might be a false positive from test
        // For now, trust navigator.onLine (already set to true above)
        // Only update if we're confident
      }
      // If null (inconclusive), keep the online status we set above
    };

    const handleOffline = () => {
      wasOfflineRef.current = true;
      setNetworkStatus((prev) => ({
        isOnline: false,
        wasOffline: true,
      }));

      // Clear any pending reload
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = null;
      }
    };

    // Initial check - trust navigator.onLine completely
    // Don't test connection on initial load to avoid false positives
    if (typeof navigator !== 'undefined') {
      if (navigator.onLine) {
        // Trust navigator.onLine - set online immediately
        setNetworkStatus({
          isOnline: true,
          wasOffline: false,
        });
      } else {
        handleOffline();
      }
    }

    // Listen to online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connection check - only when offline to detect when back online
    const startPeriodicCheck = () => {
      // Clear existing interval if any
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }

      checkIntervalRef.current = setInterval(() => {
        if (typeof navigator === 'undefined') return;
        
        // Only check if we think we're offline
        if (wasOfflineRef.current && navigator.onLine) {
          // navigator says we're back online - trust it
          handleOnline();
        } else if (!navigator.onLine) {
          // navigator says offline
          handleOffline();
        }
        // If navigator.onLine = true and we're already online, do nothing
      }, 3000); // Check every 3 seconds when offline
    };

    // Only start periodic check if we're offline
    if (wasOfflineRef.current || !navigator.onLine) {
      startPeriodicCheck();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = null;
      }
    };
  }, [autoReload, testConnection]);

  return networkStatus;
};
