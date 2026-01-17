import { useEffect, useRef, useState } from 'react';

interface AdaptivePollingOptions {
    activeInterval?: number; // Interval when user is active (default: 5000ms)
    idleInterval?: number;   // Interval when user is idle (default: 30000ms)
    backgroundInterval?: number; // Interval when tab is hidden (default: 60000ms)
    idleTimeout?: number;    // Time to wait before considering user idle (default: 60000ms)
    enabled?: boolean;       // Whether polling is enabled (default: true)
}

export const useAdaptivePolling = (
    callback: () => void,
    options: AdaptivePollingOptions = {}
) => {
    const {
        activeInterval = 5000,
        idleInterval = 30000,
        backgroundInterval = 60000,
        idleTimeout = 60000,
        enabled = true,
    } = options;

    const [isIdle, setIsIdle] = useState(false);
    const [isBackground, setIsBackground] = useState(document.hidden);
    const callbackRef = useRef(callback);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Update callback ref to avoid resetting effect on callback change
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Handle visibility change
    useEffect(() => {
        if (!enabled) return;

        const handleVisibilityChange = () => {
            setIsBackground(document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [enabled]);

    // Handle user activity to detect idle state
    useEffect(() => {
        if (!enabled) return;

        const resetIdleTimer = () => {
            if (isIdle) setIsIdle(false);

            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }

            idleTimerRef.current = setTimeout(() => {
                setIsIdle(true);
            }, idleTimeout);
        };

        // Initial setup
        resetIdleTimer();

        // Listen for user interactions
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetIdleTimer, { passive: true }));

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            events.forEach(event => document.removeEventListener(event, resetIdleTimer));
        };
    }, [idleTimeout, isIdle, enabled]);

    // Set up polling interval
    useEffect(() => {
        if (!enabled) return;

        let currentInterval = activeInterval;

        if (isBackground) {
            currentInterval = backgroundInterval;
            // console.log(`[AdaptivePolling] App backgrounded. Switching to ${currentInterval}ms interval.`);
        } else if (isIdle) {
            currentInterval = idleInterval;
            // console.log(`[AdaptivePolling] User idle. Switching to ${currentInterval}ms interval.`);
        } else {
            // Active
            // console.log(`[AdaptivePolling] User active. Using ${currentInterval}ms interval.`);
        }

        // Execute immediately on start/change if enabled
        callbackRef.current();

        const intervalId = setInterval(() => {
            callbackRef.current();
        }, currentInterval);

        return () => clearInterval(intervalId);
    }, [isBackground, isIdle, activeInterval, idleInterval, backgroundInterval, enabled]);

    return { isIdle, isBackground };
};
