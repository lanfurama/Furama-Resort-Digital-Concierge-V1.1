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

// ============================================================================
// Main Assignment Logic
// ============================================================================

/**
 * Main AI assignment logic function
 * 
 * @param pendingRides - List of rides waiting to be assigned
 * @param availableDrivers - List of available drivers
 * @param allRides - All rides (to check driver's current ride status)
 * @param roomTypes - List of room types (to check VIP status)
 * @param checkDriverAvailabilityFn - Function to check if driver is available by schedule
 * @returns Array of assignments: { driver, ride, cost }
 */
export async function aiAssignmentLogic(
    pendingRides: RideRequest[],
    availableDrivers: User[],
    allRides: RideRequest[],
    roomTypes?: Array<{ id: string; name: string; isVIP?: boolean }>,
    checkDriverAvailabilityFn?: (driverId: string, date: string, time?: string) => Promise<boolean>
): Promise<Array<{ driver: User; ride: RideRequest; cost: number }>> {
    const now = Date.now();
    const assignments: Array<{ driver: User; ride: RideRequest; cost: number }> = [];

    // Helper to check if ride requires VIP vehicle
    const requiresVIPVehicle = (ride: RideRequest): boolean => {
        if (!roomTypes || !ride.roomNumber) return false;
        
        // Try to find room type by matching room number with room type name
        // Check if any VIP room type name appears in the room number or vice versa
        const roomType = roomTypes.find(rt => {
            if (!rt.isVIP) return false;
            
            const roomNumLower = ride.roomNumber.toLowerCase().trim();
            const typeNameLower = rt.name.toLowerCase();
            
            // Check if room number contains room type name (e.g., "Presidential Suite" in room number)
            if (roomNumLower.includes(typeNameLower) || typeNameLower.includes(roomNumLower)) {
                return true;
            }
            
            // Check common VIP prefixes
            if (roomNumLower.startsWith('v') || roomNumLower.startsWith('p') || 
                roomNumLower.startsWith('presidential') || roomNumLower.startsWith('vip')) {
                return true;
            }
            
            return false;
        });
        
        return roomType?.isVIP === true;
    };

    // Helper to check if driver matches vehicle type requirement
    const driverMatchesVehicleType = (driver: User, requiresVIP: boolean): boolean => {
        if (!requiresVIP) return true; // Normal rides can use any vehicle
        return driver.vehicleType === 'VIP'; // VIP rides require VIP vehicle
    };

    // Calculate cost for each (driver, ride) pair
    for (const ride of pendingRides) {
        const rideRequiresVIP = requiresVIPVehicle(ride);
        const rideDate = new Date(ride.timestamp).toISOString().split('T')[0];
        const rideTime = new Date(ride.timestamp).toTimeString().substring(0, 8); // HH:MM:SS

        for (const driver of availableDrivers) {
            // Check vehicle type match
            if (!driverMatchesVehicleType(driver, rideRequiresVIP)) {
                continue; // Skip drivers who don't have the required vehicle type
            }

            // Check driver schedule availability
            let isScheduleAvailable = true;
            if (checkDriverAvailabilityFn) {
                try {
                    isScheduleAvailable = await checkDriverAvailabilityFn(
                        driver.id ? String(driver.id) : '',
                        rideDate,
                        rideTime
                    );
                } catch (error) {
                    // If check fails, default to available (don't block assignment)
                    isScheduleAvailable = true;
                }
            }

            // Check driver's current ride status
            const driverIdStr = driver.id ? String(driver.id) : '';
            const driverActiveRides = allRides.filter((r) => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return (
                    rideDriverId === driverIdStr &&
                    (r.status === 'ASSIGNED' ||
                        r.status === 'ARRIVING' ||
                        r.status === 'ON_TRIP')
                );
            });
            const isDriverAvailable = driverActiveRides.length === 0;
            const currentRide = driverActiveRides[0] || null;

            // Calculate wait time
            const waitTimeSeconds = Math.floor((now - ride.timestamp) / 1000);

            // Calculate chain trip distance (if driver has current ride)
            let chainDistanceMeters: number | null = null;
            if (currentRide) {
                // Simplified: assume chain trip if same destination or nearby
                // In production, you'd calculate actual GPS distance
                if (currentRide.destination === ride.pickup) {
                    chainDistanceMeters = 0; // Same location
                } else {
                    // For now, set to null (no chain trip bonus)
                    chainDistanceMeters = null;
                }
            }

            // Compute assignment cost
            const cost = computeAssignmentCost({
                isScheduleAvailable,
                isDriverAvailable,
                currentRide,
                waitTimeSeconds,
                chainDistanceMeters,
                now
            });

            assignments.push({ driver, ride, cost });
        }
    }

    // Sort by cost (lower = better)
    assignments.sort((a, b) => a.cost - b.cost);

    // Greedy assignment: assign each ride to the best available driver
    const assignedRides = new Set<string>();
    const assignedDrivers = new Set<string>();
    const finalAssignments: Array<{ driver: User; ride: RideRequest; cost: number }> = [];

    for (const assignment of assignments) {
        const rideId = assignment.ride.id;
        const driverId = assignment.driver.id ? String(assignment.driver.id) : '';

        // Skip if ride or driver already assigned
        if (assignedRides.has(rideId) || assignedDrivers.has(driverId)) {
            continue;
        }

        // Skip if cost is too high (driver not available)
        if (assignment.cost >= COST_UNAVAILABLE_SCHEDULE) {
            continue;
        }

        assignedRides.add(rideId);
        assignedDrivers.add(driverId);
        finalAssignments.push(assignment);
    }

    return finalAssignments;
}
