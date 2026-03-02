import { useState, useEffect, useRef } from 'react';
import { getRides, getRidesSync, getUsers, getUsersSync, updateRideStatus } from '../services/dataService';
import { BuggyStatus } from '../types';
import { aiAssignmentLogic } from '../utils/aiAssignmentLogic';

interface FleetConfig {
    maxWaitTimeBeforeAutoAssign: number;
    autoAssignEnabled: boolean;
}

export const useFleetManagement = (tab: string, rides: any[], users: any[]) => {
    const [fleetConfig, setFleetConfig] = useState<FleetConfig>({
        maxWaitTimeBeforeAutoAssign: 300,
        autoAssignEnabled: true
    });
    const [driverViewMode, setDriverViewMode] = useState<'LIST' | 'MAP'>('LIST');
    const [showAIAssignment, setShowAIAssignment] = useState(false);
    const [aiAssignmentData, setAIAssignmentData] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const lastAutoAssignRef = useRef<number>(0);

    // Load fleet config from localStorage
    useEffect(() => {
        const savedConfig = localStorage.getItem('fleetConfig');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                setFleetConfig(parsed);
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Failed to load fleet config:', error);
                }
            }
        }
    }, []);

    // Save fleet config to localStorage
    useEffect(() => {
        localStorage.setItem('fleetConfig', JSON.stringify(fleetConfig));
    }, [fleetConfig]);

    // Auto-refresh rides and users when FLEET tab is active - optimized for mobile
    useEffect(() => {
        if (tab !== 'FLEET') return;

        let refreshInterval: NodeJS.Timeout | null = null;
        let isMounted = true;

        const refreshData = async () => {
            if (!isMounted) return;
            
            try {
                const [refreshedRides, refreshedUsers] = await Promise.all([
                    getRides().catch(() => getRidesSync()),
                    getUsers().catch(() => getUsersSync())
                ]);
                // Note: This hook doesn't update rides/users directly
                // The parent component should handle the state updates
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Failed to auto-refresh fleet data:', error);
                }
            }
        };

        // Adaptive refresh based on visibility
        const setupRefresh = () => {
            if (refreshInterval) clearInterval(refreshInterval);
            
            if (document.hidden) {
                // Background: refresh every 15 seconds
                refreshInterval = setInterval(refreshData, 15000);
            } else {
                // Foreground: refresh every 8 seconds (reduced from 3s for mobile performance)
                refreshInterval = setInterval(refreshData, 8000);
            }
        };

        // Initial load
        refreshData();
        setupRefresh();

        const handleVisibilityChange = () => setupRefresh();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isMounted = false;
            if (refreshInterval) clearInterval(refreshInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [tab]);

    // Auto-assign logic - debounced and optimized for mobile
    useEffect(() => {
        if (!fleetConfig.autoAssignEnabled || tab !== 'FLEET') return;

        let autoAssignInterval: NodeJS.Timeout | null = null;
        let debounceTimeout: NodeJS.Timeout | null = null;
        let isMounted = true;

        const checkAndAutoAssign = async () => {
            if (!isMounted) return;
            
            const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING);
            if (pendingRides.length === 0) return;

            const now = Date.now();
            // Debounce: prevent rapid consecutive checks
            if (now - lastAutoAssignRef.current < 10000) {
                return;
            }

            const ridesToAutoAssign = pendingRides.filter(ride => {
                const waitTime = Math.floor((now - ride.timestamp) / 1000);
                return waitTime >= fleetConfig.maxWaitTimeBeforeAutoAssign;
            });

            if (ridesToAutoAssign.length > 0) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`[Auto-Assign] Found ${ridesToAutoAssign.length} ride(s) waiting over ${fleetConfig.maxWaitTimeBeforeAutoAssign}s, triggering auto-assign...`);
                }
                lastAutoAssignRef.current = now;
                await handleAutoAssign(true);
            }
        };

        // Debounced check function
        const debouncedCheck = () => {
            if (debounceTimeout) clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(checkAndAutoAssign, 1000); // 1s debounce
        };

        // Adaptive interval based on visibility
        const setupAutoAssign = () => {
            if (autoAssignInterval) clearInterval(autoAssignInterval);
            
            if (document.hidden) {
                // Background: check every 15 seconds
                autoAssignInterval = setInterval(debouncedCheck, 15000);
            } else {
                // Foreground: check every 8 seconds (reduced from 5s, with debounce)
                autoAssignInterval = setInterval(debouncedCheck, 8000);
            }
        };

        setupAutoAssign();
        const handleVisibilityChange = () => setupAutoAssign();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isMounted = false;
            if (autoAssignInterval) clearInterval(autoAssignInterval);
            if (debounceTimeout) clearTimeout(debounceTimeout);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [rides, fleetConfig.autoAssignEnabled, fleetConfig.maxWaitTimeBeforeAutoAssign, tab]);

    const handleAutoAssign = async (isAutoTriggered: boolean = false) => {
        const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING);
        if (pendingRides.length === 0) {
            if (!isAutoTriggered) {
                alert('No pending rides to assign.');
            }
            return;
        }

        const availableDrivers = users.filter(u => u.role === 'DRIVER');
        if (availableDrivers.length === 0) {
            if (!isAutoTriggered) {
                alert('No drivers available.');
            }
            return;
        }

        // Show modal if not auto-triggered
        if (!isAutoTriggered) {
            setShowAIAssignment(true);
            setAIAssignmentData({ status: 'loading' });
        }

        // Use AI assignment logic
        const assignments = await aiAssignmentLogic(pendingRides, availableDrivers, rides);

        // Process assignments
        let assignmentCount = 0;
        for (const assignment of assignments) {
            try {
                await updateRideStatus(assignment.ride.id, BuggyStatus.ASSIGNED, assignment.driver.id, 5);
                assignmentCount++;
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(`Failed to assign ride ${assignment.ride.id} to driver ${assignment.driver.id}:`, error);
                }
            }
        }

        if (!isAutoTriggered) {
            setAIAssignmentData({ status: 'completed', assignments });
        } else {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[Auto-Assign] Successfully assigned ${assignmentCount} ride(s) automatically`);
            }
        }

        return assignmentCount;
    };

    return {
        fleetConfig,
        setFleetConfig,
        driverViewMode,
        setDriverViewMode,
        showAIAssignment,
        setShowAIAssignment,
        aiAssignmentData,
        setAIAssignmentData,
        isRefreshing,
        setIsRefreshing,
        handleAutoAssign
    };
};
