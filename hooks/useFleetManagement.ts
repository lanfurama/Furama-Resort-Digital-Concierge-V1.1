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
                console.error('Failed to load fleet config:', error);
            }
        }
    }, []);

    // Save fleet config to localStorage
    useEffect(() => {
        localStorage.setItem('fleetConfig', JSON.stringify(fleetConfig));
    }, [fleetConfig]);

    // Auto-refresh rides and users when FLEET tab is active
    useEffect(() => {
        if (tab !== 'FLEET') return;

        const refreshInterval = setInterval(async () => {
            try {
                const [refreshedRides, refreshedUsers] = await Promise.all([
                    getRides().catch(() => getRidesSync()),
                    getUsers().catch(() => getUsersSync())
                ]);
                // Note: This hook doesn't update rides/users directly
                // The parent component should handle the state updates
            } catch (error) {
                console.error('Failed to auto-refresh fleet data:', error);
            }
        }, 3000);

        return () => clearInterval(refreshInterval);
    }, [tab]);

    // Auto-assign logic
    useEffect(() => {
        if (!fleetConfig.autoAssignEnabled || tab !== 'FLEET') return;

        const checkAndAutoAssign = async () => {
            const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING);
            if (pendingRides.length === 0) return;

            const now = Date.now();
            if (now - lastAutoAssignRef.current < 10000) {
                return;
            }

            const ridesToAutoAssign = pendingRides.filter(ride => {
                const waitTime = Math.floor((now - ride.timestamp) / 1000);
                return waitTime >= fleetConfig.maxWaitTimeBeforeAutoAssign;
            });

            if (ridesToAutoAssign.length > 0) {
                console.log(`[Auto-Assign] Found ${ridesToAutoAssign.length} ride(s) waiting over ${fleetConfig.maxWaitTimeBeforeAutoAssign}s, triggering auto-assign...`);
                lastAutoAssignRef.current = now;
                await handleAutoAssign(true);
            }
        };

        const autoAssignInterval = setInterval(checkAndAutoAssign, 5000);
        return () => clearInterval(autoAssignInterval);
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
                console.error(`Failed to assign ride ${assignment.ride.id} to driver ${assignment.driver.id}:`, error);
            }
        }

        if (!isAutoTriggered) {
            setAIAssignmentData({ status: 'completed', assignments });
        } else {
            console.log(`[Auto-Assign] Successfully assigned ${assignmentCount} ride(s) automatically`);
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
