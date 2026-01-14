/**
 * Unit Tests cho AI Assignment Logic
 *
 * Test các hàm calculateAssignmentCost và auto-assign logic
 */

import { describe, it, expect, vi } from 'vitest';
import {
    calculateAvailableDriverCost,
    calculateBusyDriverCost,
    calculateWaitTimeBonus,
    calculateChainTripCost,
    calculateRideDuration,
    computeAssignmentCost,
    filterRidesForAutoAssign,
    canTriggerAutoAssign,
    COST_UNAVAILABLE_SCHEDULE,
    COST_AVAILABLE_DRIVER,
    COST_OFFLINE_DRIVER,
    COST_BUSY_JUST_STARTED,
    COST_BUSY_GETTING_CLOSE,
    COST_BUSY_NEAR_COMPLETION_BASE,
    WAIT_TIME_BONUS_PER_SECOND,
    CHAIN_TRIP_DISTANCE_THRESHOLD,
    CHAIN_TRIP_BONUS,
} from './aiAssignmentLogic';
import { BuggyStatus } from '../types';

// ============================================================================
// calculateAvailableDriverCost Tests
// ============================================================================

describe('calculateAvailableDriverCost', () => {
    it('should return base cost for available driver', () => {
        expect(calculateAvailableDriverCost()).toBe(COST_AVAILABLE_DRIVER);
        expect(calculateAvailableDriverCost()).toBe(5000);
    });
});

// ============================================================================
// calculateBusyDriverCost Tests
// ============================================================================

describe('calculateBusyDriverCost', () => {
    it('should return high cost for driver who just started (< 3 min)', () => {
        expect(calculateBusyDriverCost(0)).toBe(COST_BUSY_JUST_STARTED);
        expect(calculateBusyDriverCost(1)).toBe(COST_BUSY_JUST_STARTED);
        expect(calculateBusyDriverCost(2)).toBe(COST_BUSY_JUST_STARTED);
        expect(calculateBusyDriverCost(2.9)).toBe(COST_BUSY_JUST_STARTED);
        expect(calculateBusyDriverCost(0)).toBe(8000);
    });

    it('should return medium cost for driver getting close (3-5 min)', () => {
        expect(calculateBusyDriverCost(3)).toBe(COST_BUSY_GETTING_CLOSE);
        expect(calculateBusyDriverCost(4)).toBe(COST_BUSY_GETTING_CLOSE);
        expect(calculateBusyDriverCost(4.9)).toBe(COST_BUSY_GETTING_CLOSE);
        expect(calculateBusyDriverCost(3)).toBe(2000);
    });

    it('should return low cost for driver near completion (>= 5 min)', () => {
        // At exactly 5 min: cost = 1000 - 0 = 1000
        expect(calculateBusyDriverCost(5)).toBe(1000);

        // At 6 min: cost = 1000 - 200 = 800
        expect(calculateBusyDriverCost(6)).toBe(800);

        // At 7 min: cost = 1000 - 400 = 600
        expect(calculateBusyDriverCost(7)).toBe(600);

        // At 10 min: cost = 1000 - 1000 = 0
        expect(calculateBusyDriverCost(10)).toBe(0);
    });

    it('should not return negative cost', () => {
        // At 15 min: cost would be 1000 - 2000 = -1000, but clamped to 0
        expect(calculateBusyDriverCost(15)).toBe(0);
        expect(calculateBusyDriverCost(20)).toBe(0);
        expect(calculateBusyDriverCost(100)).toBe(0);
    });
});

// ============================================================================
// calculateWaitTimeBonus Tests
// ============================================================================

describe('calculateWaitTimeBonus', () => {
    it('should return 0 for 0 wait time', () => {
        expect(calculateWaitTimeBonus(0)).toBe(0);
    });

    it('should return 10 points per second', () => {
        expect(calculateWaitTimeBonus(1)).toBe(10);
        expect(calculateWaitTimeBonus(10)).toBe(100);
        expect(calculateWaitTimeBonus(60)).toBe(600);
        expect(calculateWaitTimeBonus(300)).toBe(3000);
    });

    it('should use correct multiplier constant', () => {
        const seconds = 42;
        expect(calculateWaitTimeBonus(seconds)).toBe(seconds * WAIT_TIME_BONUS_PER_SECOND);
    });
});

// ============================================================================
// calculateChainTripCost Tests
// ============================================================================

describe('calculateChainTripCost', () => {
    it('should return negative cost for chain trip (< 200m)', () => {
        // Chain trip at 0m: cost = 0 - 10000 = -10000
        expect(calculateChainTripCost(0)).toBe(-10000);

        // Chain trip at 50m: cost = 50 - 10000 = -9950
        expect(calculateChainTripCost(50)).toBe(-9950);

        // Chain trip at 100m: cost = 100 - 10000 = -9900
        expect(calculateChainTripCost(100)).toBe(-9900);

        // Chain trip at 199m: cost = 199 - 10000 = -9801
        expect(calculateChainTripCost(199)).toBe(-9801);
    });

    it('should return null for non-chain trip (>= 200m)', () => {
        expect(calculateChainTripCost(200)).toBe(null);
        expect(calculateChainTripCost(300)).toBe(null);
        expect(calculateChainTripCost(1000)).toBe(null);
    });

    it('should use correct threshold constant', () => {
        expect(calculateChainTripCost(CHAIN_TRIP_DISTANCE_THRESHOLD - 1)).not.toBe(null);
        expect(calculateChainTripCost(CHAIN_TRIP_DISTANCE_THRESHOLD)).toBe(null);
    });
});

// ============================================================================
// calculateRideDuration Tests
// ============================================================================

describe('calculateRideDuration', () => {
    const NOW = 1700000000000; // Fixed timestamp for testing

    it('should calculate duration for ON_TRIP status from pickedUpAt', () => {
        const ride = {
            status: 'ON_TRIP' as BuggyStatus,
            pickedUpAt: NOW - 5 * 60 * 1000, // 5 minutes ago
            confirmedAt: NOW - 10 * 60 * 1000, // 10 minutes ago (ignored)
        };
        expect(calculateRideDuration(ride, NOW)).toBe(5 * 60 * 1000);
    });

    it('should calculate duration for ARRIVING status from confirmedAt', () => {
        const ride = {
            status: 'ARRIVING' as BuggyStatus,
            confirmedAt: NOW - 3 * 60 * 1000, // 3 minutes ago
        };
        expect(calculateRideDuration(ride, NOW)).toBe(3 * 60 * 1000);
    });

    it('should calculate duration for ASSIGNED status from confirmedAt', () => {
        const ride = {
            status: 'ASSIGNED' as BuggyStatus,
            confirmedAt: NOW - 2 * 60 * 1000, // 2 minutes ago
        };
        expect(calculateRideDuration(ride, NOW)).toBe(2 * 60 * 1000);
    });

    it('should return 0 for ON_TRIP without pickedUpAt', () => {
        const ride = { status: 'ON_TRIP' as BuggyStatus };
        expect(calculateRideDuration(ride, NOW)).toBe(0);
    });

    it('should return 0 for other statuses', () => {
        const ride = { status: 'SEARCHING' as BuggyStatus };
        expect(calculateRideDuration(ride, NOW)).toBe(0);
    });
});

// ============================================================================
// computeAssignmentCost Tests (Integration)
// ============================================================================

describe('computeAssignmentCost', () => {
    const NOW = 1700000000000;

    it('should return very high cost when driver is not available by schedule', () => {
        const cost = computeAssignmentCost({
            isScheduleAvailable: false,
            isDriverAvailable: true,
            currentRide: null,
            waitTimeSeconds: 0,
            chainDistanceMeters: null,
            now: NOW,
        });
        expect(cost).toBe(COST_UNAVAILABLE_SCHEDULE);
        expect(cost).toBe(10_000_000);
    });

    it('should return base cost for available driver', () => {
        const cost = computeAssignmentCost({
            isScheduleAvailable: true,
            isDriverAvailable: true,
            currentRide: null,
            waitTimeSeconds: 0,
            chainDistanceMeters: null,
            now: NOW,
        });
        expect(cost).toBe(COST_AVAILABLE_DRIVER);
    });

    it('should apply wait time bonus to available driver', () => {
        const cost = computeAssignmentCost({
            isScheduleAvailable: true,
            isDriverAvailable: true,
            currentRide: null,
            waitTimeSeconds: 60,
            chainDistanceMeters: null,
            now: NOW,
        });
        // 5000 - (60 * 10) = 4400
        expect(cost).toBe(4400);
    });

    it('should return high cost for busy driver just started', () => {
        const ride = {
            id: 'test-ride',
            guestName: 'Test',
            roomNumber: '101',
            pickup: 'Lobby',
            destination: 'Villa A1',
            status: BuggyStatus.ON_TRIP,
            timestamp: NOW - 10 * 60 * 1000,
            pickedUpAt: NOW - 2 * 60 * 1000, // 2 minutes on trip (just started)
        };
        const cost = computeAssignmentCost({
            isScheduleAvailable: true,
            isDriverAvailable: false,
            currentRide: ride,
            waitTimeSeconds: 0,
            chainDistanceMeters: null,
            now: NOW,
        });
        expect(cost).toBe(COST_BUSY_JUST_STARTED);
    });

    it('should return medium cost for busy driver getting close', () => {
        const ride = {
            id: 'test-ride',
            guestName: 'Test',
            roomNumber: '101',
            pickup: 'Lobby',
            destination: 'Villa A1',
            status: BuggyStatus.ON_TRIP,
            timestamp: NOW - 10 * 60 * 1000,
            pickedUpAt: NOW - 4 * 60 * 1000, // 4 minutes on trip
        };
        const cost = computeAssignmentCost({
            isScheduleAvailable: true,
            isDriverAvailable: false,
            currentRide: ride,
            waitTimeSeconds: 0,
            chainDistanceMeters: null,
            now: NOW,
        });
        expect(cost).toBe(COST_BUSY_GETTING_CLOSE);
    });

    it('should return low cost for busy driver near completion', () => {
        const ride = {
            id: 'test-ride',
            guestName: 'Test',
            roomNumber: '101',
            pickup: 'Lobby',
            destination: 'Villa A1',
            status: BuggyStatus.ON_TRIP,
            timestamp: NOW - 10 * 60 * 1000,
            pickedUpAt: NOW - 7 * 60 * 1000, // 7 minutes on trip
        };
        const cost = computeAssignmentCost({
            isScheduleAvailable: true,
            isDriverAvailable: false,
            currentRide: ride,
            waitTimeSeconds: 0,
            chainDistanceMeters: null,
            now: NOW,
        });
        // 7 min: cost = 1000 - (7-5)*200 = 600
        expect(cost).toBe(600);
    });

    it('should prioritize chain trip with negative cost', () => {
        const ride = {
            id: 'test-ride',
            guestName: 'Test',
            roomNumber: '101',
            pickup: 'Lobby',
            destination: 'Villa A1',
            status: BuggyStatus.ON_TRIP,
            timestamp: NOW - 10 * 60 * 1000,
            pickedUpAt: NOW - 2 * 60 * 1000,
        };
        const cost = computeAssignmentCost({
            isScheduleAvailable: true,
            isDriverAvailable: false,
            currentRide: ride,
            waitTimeSeconds: 0,
            chainDistanceMeters: 50, // 50m chain trip
            now: NOW,
        });
        // Chain trip: 50 - 10000 = -9950
        expect(cost).toBe(-9950);
    });

    it('should apply wait time bonus to chain trip', () => {
        const ride = {
            id: 'test-ride',
            guestName: 'Test',
            roomNumber: '101',
            pickup: 'Lobby',
            destination: 'Villa A1',
            status: BuggyStatus.ON_TRIP,
            timestamp: NOW - 10 * 60 * 1000,
            pickedUpAt: NOW - 2 * 60 * 1000,
        };
        const cost = computeAssignmentCost({
            isScheduleAvailable: true,
            isDriverAvailable: false,
            currentRide: ride,
            waitTimeSeconds: 30,
            chainDistanceMeters: 50,
            now: NOW,
        });
        // Chain trip (-9950) - wait bonus (300) = -10250
        expect(cost).toBe(-10250);
    });

    it('should return offline cost when no current ride but not available', () => {
        const cost = computeAssignmentCost({
            isScheduleAvailable: true,
            isDriverAvailable: false,
            currentRide: null,
            waitTimeSeconds: 0,
            chainDistanceMeters: null,
            now: NOW,
        });
        expect(cost).toBe(COST_OFFLINE_DRIVER);
    });
});

// ============================================================================
// Auto-Assign Helper Tests
// ============================================================================

describe('filterRidesForAutoAssign', () => {
    const NOW = 1700000000000;

    const createRide = (timestampSecondsAgo: number) => ({
        id: `ride-${timestampSecondsAgo}`,
        guestName: 'Test',
        roomNumber: '101',
        pickup: 'Lobby',
        destination: 'Villa A1',
        status: BuggyStatus.SEARCHING,
        timestamp: NOW - timestampSecondsAgo * 1000,
    });

    it('should filter rides waiting longer than threshold', () => {
        const rides = [
            createRide(100), // 100s ago - should be included (>= 60)
            createRide(59),  // 59s ago - should NOT be included (< 60)
            createRide(300), // 5 min ago - should be included
        ];

        const result = filterRidesForAutoAssign(rides, 60, NOW);
        expect(result).toHaveLength(2);
        expect(result.map(r => r.id)).toContain('ride-100');
        expect(result.map(r => r.id)).toContain('ride-300');
        expect(result.map(r => r.id)).not.toContain('ride-59');
    });

    it('should return empty array when no rides exceed threshold', () => {
        const rides = [
            createRide(10),
            createRide(30),
            createRide(59),
        ];

        const result = filterRidesForAutoAssign(rides, 60, NOW);
        expect(result).toHaveLength(0);
    });

    it('should return all rides when threshold is 0', () => {
        const rides = [
            createRide(10),
            createRide(30),
        ];

        const result = filterRidesForAutoAssign(rides, 0, NOW);
        expect(result).toHaveLength(2);
    });

    it('should include ride exactly at threshold', () => {
        const rides = [createRide(60)]; // Exactly 60s ago

        const result = filterRidesForAutoAssign(rides, 60, NOW);
        expect(result).toHaveLength(1);
    });
});

describe('canTriggerAutoAssign', () => {
    const NOW = 1700000000000;

    it('should return true when enough time has passed', () => {
        const lastAutoAssign = NOW - 15000; // 15s ago
        expect(canTriggerAutoAssign(lastAutoAssign, 10000, NOW)).toBe(true);
    });

    it('should return false when not enough time has passed', () => {
        const lastAutoAssign = NOW - 5000; // 5s ago
        expect(canTriggerAutoAssign(lastAutoAssign, 10000, NOW)).toBe(false);
    });

    it('should return true when exactly at threshold', () => {
        const lastAutoAssign = NOW - 10000; // Exactly 10s ago
        expect(canTriggerAutoAssign(lastAutoAssign, 10000, NOW)).toBe(true);
    });

    it('should return true when lastAutoAssign is 0 (never called)', () => {
        expect(canTriggerAutoAssign(0, 10000, NOW)).toBe(true);
    });

    it('should use default interval of 10000ms', () => {
        const lastAutoAssign = NOW - 9000; // 9s ago
        expect(canTriggerAutoAssign(lastAutoAssign, undefined, NOW)).toBe(false);

        const lastAutoAssign2 = NOW - 11000; // 11s ago
        expect(canTriggerAutoAssign(lastAutoAssign2, undefined, NOW)).toBe(true);
    });
});
