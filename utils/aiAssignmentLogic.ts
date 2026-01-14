/**
 * AI Assignment Logic - Pure Functions for Unit Testing
 *
 * Các hàm này được tách ra từ ReceptionPortal.tsx để có thể test độc lập
 * mà không cần mock React hooks hoặc component state.
 */

import type { User, RideRequest, BuggyStatus, Location } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface AssignmentCostParams {
    isScheduleAvailable: boolean;
    isDriverAvailable: boolean;
    currentRide: RideRequest | null;
    waitTimeSeconds: number;
    chainDistanceMeters: number | null;
    now?: number; // Current timestamp for testing
}

export interface ActiveRideInfo {
    status: BuggyStatus;
    pickedUpAt?: number;
    confirmedAt?: number;
}

// ============================================================================
// Constants
// ============================================================================

export const COST_UNAVAILABLE_SCHEDULE = 10_000_000;
export const COST_AVAILABLE_DRIVER = 5_000;
export const COST_OFFLINE_DRIVER = 100_000;
export const COST_BUSY_JUST_STARTED = 8_000;
export const COST_BUSY_GETTING_CLOSE = 2_000;
export const COST_BUSY_NEAR_COMPLETION_BASE = 1_000;
export const WAIT_TIME_BONUS_PER_SECOND = 10;
export const CHAIN_TRIP_DISTANCE_THRESHOLD = 200;
export const CHAIN_TRIP_BONUS = 10_000;

// ============================================================================
// Pure Calculation Functions
// ============================================================================

/**
 * Tính cost cho driver available (không có ride đang active)
 */
export function calculateAvailableDriverCost(): number {
    return COST_AVAILABLE_DRIVER;
}

/**
 * Tính cost dựa trên thời gian ride đang chạy (phút)
 *
 * Logic:
 * - < 3 phút: Driver vừa bắt đầu → cost cao (8000)
 * - 3-5 phút: Driver đang gần xong → cost trung bình (2000)
 * - >= 5 phút: Driver sắp hoàn thành → cost thấp (giảm dần từ 1000)
 */
export function calculateBusyDriverCost(rideDurationMinutes: number): number {
    if (rideDurationMinutes >= 5) {
        // Driver is likely near completion: HIGH PRIORITY (very low cost)
        // The longer the ride, the lower the cost (closer to completion)
        const cost = COST_BUSY_NEAR_COMPLETION_BASE - (rideDurationMinutes - 5) * 200;
        return Math.max(0, cost); // Don't go negative
    } else if (rideDurationMinutes >= 3) {
        // Driver is getting close: Medium-high priority
        return COST_BUSY_GETTING_CLOSE;
    } else {
        // Driver just started: Lower priority
        return COST_BUSY_JUST_STARTED;
    }
}

/**
 * Tính wait time bonus - mỗi giây chờ giảm 10 điểm cost
 * (longer wait = higher priority = lower cost)
 */
export function calculateWaitTimeBonus(waitTimeSeconds: number): number {
    return waitTimeSeconds * WAIT_TIME_BONUS_PER_SECOND;
}

/**
 * Tính chain trip cost bonus
 * Chain trip = dropoff của ride hiện tại gần pickup của ride mới
 *
 * @param chainDistanceMeters - Khoảng cách giữa dropoff và pickup (meters)
 * @returns Cost adjustment (negative = high priority, null = no chain trip)
 */
export function calculateChainTripCost(chainDistanceMeters: number): number | null {
    if (chainDistanceMeters < CHAIN_TRIP_DISTANCE_THRESHOLD) {
        // Chain trip: Very high priority (negative cost)
        return chainDistanceMeters - CHAIN_TRIP_BONUS;
    }
    return null;
}

/**
 * Tính ride duration dựa trên status và timestamps
 */
export function calculateRideDuration(
    ride: ActiveRideInfo,
    now: number
): number {
    let rideDuration = 0;

    if (ride.status === 'ON_TRIP' && ride.pickedUpAt) {
        rideDuration = now - ride.pickedUpAt;
    } else if (ride.status === 'ARRIVING' && ride.confirmedAt) {
        rideDuration = now - ride.confirmedAt;
    } else if (ride.status === 'ASSIGNED' && ride.confirmedAt) {
        rideDuration = now - ride.confirmedAt;
    }

    return rideDuration;
}

/**
 * Tính tổng assignment cost (pure function version)
 *
 * Đây là phiên bản thuần túy của calculateAssignmentCost,
 * không phụ thuộc vào async API calls hoặc component state.
 */
export function computeAssignmentCost(params: AssignmentCostParams): number {
    const { isScheduleAvailable, isDriverAvailable, currentRide, waitTimeSeconds, chainDistanceMeters, now = Date.now() } = params;

    // Driver không available theo schedule → cost cực cao
    if (!isScheduleAvailable) {
        return COST_UNAVAILABLE_SCHEDULE;
    }

    let cost = 0;

    if (isDriverAvailable) {
        // Driver is AVAILABLE: Medium priority
        cost = calculateAvailableDriverCost();
    } else if (currentRide) {
        // Driver is BUSY: Calculate how close they are to completing current ride
        const rideDuration = calculateRideDuration(
            {
                status: currentRide.status,
                pickedUpAt: currentRide.pickedUpAt,
                confirmedAt: currentRide.confirmedAt
            },
            now
        );
        const rideDurationMinutes = rideDuration / (1000 * 60);

        cost = calculateBusyDriverCost(rideDurationMinutes);

        // Check for chain trip opportunity
        if (chainDistanceMeters !== null) {
            const chainCost = calculateChainTripCost(chainDistanceMeters);
            if (chainCost !== null) {
                cost = chainCost;
            }
        }
    } else {
        // Driver is OFFLINE or unknown status
        cost = COST_OFFLINE_DRIVER;
    }

    // Subtract wait time bonus
    cost -= calculateWaitTimeBonus(waitTimeSeconds);

    return cost;
}

// ============================================================================
// Auto-Assign Helper Functions
// ============================================================================

/**
 * Lọc các rides cần auto-assign dựa trên wait time threshold
 */
export function filterRidesForAutoAssign(
    pendingRides: RideRequest[],
    maxWaitTimeBeforeAutoAssign: number,
    now: number = Date.now()
): RideRequest[] {
    return pendingRides.filter((ride) => {
        const waitTime = Math.floor((now - ride.timestamp) / 1000);
        return waitTime >= maxWaitTimeBeforeAutoAssign;
    });
}

/**
 * Kiểm tra rate limiting cho auto-assign
 * Returns true nếu đã đủ thời gian từ lần gọi trước
 */
export function canTriggerAutoAssign(
    lastAutoAssignTime: number,
    minIntervalMs: number = 10000,
    now: number = Date.now()
): boolean {
    return now - lastAutoAssignTime >= minIntervalMs;
}
