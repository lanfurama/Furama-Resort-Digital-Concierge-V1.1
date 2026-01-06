import { RideRequest, BuggyStatus, User, UserRole, ServiceRequest } from "../../../types";

/**
 * Get count of pending ride requests
 */
export const getPendingRequestsCount = (rides: RideRequest[]): number => {
    return rides.filter((r) => r.status === BuggyStatus.SEARCHING).length;
};

/**
 * Get count of active rides (ASSIGNED, ARRIVING, ON_TRIP)
 */
export const getActiveRidesCount = (rides: RideRequest[]): number => {
    return rides.filter(
        (r) =>
            r.status === BuggyStatus.ASSIGNED ||
            r.status === BuggyStatus.ARRIVING ||
            r.status === BuggyStatus.ON_TRIP
    ).length;
};

/**
 * Get count of completed rides today
 */
export const getCompletedRidesTodayCount = (rides: RideRequest[]): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return rides.filter((r) => {
        if (r.status !== BuggyStatus.COMPLETED) return false;
        if (!r.completedAt) return false;
        const completedDate = new Date(r.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
    }).length;
};

/**
 * Get total count of drivers
 */
export const getTotalDriversCount = (users: User[]): number => {
    return users.filter((u) => u.role === UserRole.DRIVER).length;
};

/**
 * Get count of online drivers
 */
export const getOnlineDriversCount = (users: User[], rides: RideRequest[]): number => {
    const driverUsers = users.filter((u) => u.role === UserRole.DRIVER);

    return driverUsers.filter((driver) => {
        const driverIdStr = driver.id ? String(driver.id) : "";

        // Check if driver has active rides
        const hasActiveRide = rides.some((r) => {
            const rideDriverId = r.driverId ? String(r.driverId) : "";
            return (
                rideDriverId === driverIdStr &&
                (r.status === BuggyStatus.ASSIGNED ||
                    r.status === BuggyStatus.ARRIVING ||
                    r.status === BuggyStatus.ON_TRIP)
            );
        });

        if (hasActiveRide) return true;

        // Check if driver was recently updated (within 30 seconds)
        if (driver.updatedAt) {
            const timeSinceUpdate = Date.now() - driver.updatedAt;
            if (timeSinceUpdate < 30000) return true;
        }

        return false;
    }).length;
};

/**
 * Get count of offline drivers
 */
export const getOfflineDriversCount = (users: User[], rides: RideRequest[]): number => {
    const totalDrivers = getTotalDriversCount(users);
    return totalDrivers - getOnlineDriversCount(users, rides);
};

/**
 * Get count of pending service requests (non-buggy)
 */
export const getPendingServiceRequestsCount = (serviceRequests: ServiceRequest[]): number => {
    return serviceRequests.filter(
        (sr) => sr.status === "PENDING" && sr.type !== "BUGGY"
    ).length;
};

/**
 * Get count of confirmed service requests (non-buggy)
 */
export const getConfirmedServiceRequestsCount = (serviceRequests: ServiceRequest[]): number => {
    return serviceRequests.filter(
        (sr) => sr.status === "CONFIRMED" && sr.type !== "BUGGY"
    ).length;
};

/**
 * Map service type to staff department
 */
export const getDepartmentForServiceType = (serviceType: string): string => {
    switch (serviceType) {
        case "DINING":
            return "Dining";
        case "SPA":
            return "Spa";
        case "POOL":
            return "Pool";
        case "BUTLER":
            return "Butler";
        default:
            return "General";
    }
};
