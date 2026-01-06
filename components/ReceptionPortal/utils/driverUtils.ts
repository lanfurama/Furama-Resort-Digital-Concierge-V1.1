import { User, RideRequest, BuggyStatus, Location } from "../../../types";
import { RESORT_CENTER } from "../../../constants";

/**
 * Get driver's current or expected location
 * Returns location name or GPS coordinates
 */
export const getDriverLocation = (
    driver: User,
    rides: RideRequest[],
    locations: Location[]
): string => {
    const driverIdStr = driver.id ? String(driver.id) : "";

    // Check if driver has an active ride
    const driverActiveRides = rides.filter((r) => {
        const rideDriverId = r.driverId ? String(r.driverId) : "";
        return (
            rideDriverId === driverIdStr &&
            (r.status === BuggyStatus.ASSIGNED ||
                r.status === BuggyStatus.ARRIVING ||
                r.status === BuggyStatus.ON_TRIP)
        );
    });

    if (driverActiveRides.length > 0) {
        // Driver is busy - use destination of current ride (where they'll be)
        return driverActiveRides[0].destination;
    }

    // Driver is available - check if we have GPS coordinates from database
    if (driver.currentLat !== undefined && driver.currentLng !== undefined) {
        // Find nearest location to driver's GPS coordinates
        let nearestLocation = locations[0];
        let minDistance = Infinity;

        locations.forEach((loc) => {
            const dist = Math.sqrt(
                Math.pow(driver.currentLat! - loc.lat, 2) +
                Math.pow(driver.currentLng! - loc.lng, 2)
            );
            if (dist < minDistance) {
                minDistance = dist;
                nearestLocation = loc;
            }
        });

        // If within ~100 meters of a known location, show location name
        if (minDistance < 0.001) {
            return `Near ${nearestLocation.name}`;
        } else {
            // Show GPS coordinates if not near any known location
            return `GPS: ${driver.currentLat.toFixed(6)}, ${driver.currentLng.toFixed(6)}`;
        }
    }

    // Fallback: try to get their location from locations array (old method)
    if (locations.length > 0) {
        const driverLocation =
            locations[parseInt(driver.id || "0") % locations.length];
        return driverLocation?.name || "Unknown Location";
    }

    return "Unknown Location";
};

/**
 * Resolve driver coordinates for map view
 * Returns lat/lng coordinates for displaying driver on map
 */
export const resolveDriverCoordinates = (
    driver: User,
    rides: RideRequest[],
    locations: Location[],
    resolveLocationCoordinates: (locationName: string) => { lat: number; lng: number } | null
): { lat: number; lng: number } => {
    // Priority 1: Use GPS coordinates from database if available
    if (driver.currentLat !== undefined && driver.currentLng !== undefined) {
        return { lat: driver.currentLat, lng: driver.currentLng };
    }

    // Priority 2: Parse GPS from location string
    const locationName = getDriverLocation(driver, rides, locations);
    if (locationName.startsWith("GPS:")) {
        const parts = locationName.replace("GPS:", "").split(",");
        if (parts.length === 2) {
            const lat = parseFloat(parts[0].trim());
            const lng = parseFloat(parts[1].trim());
            if (!isNaN(lat) && !isNaN(lng)) {
                return { lat, lng };
            }
        }
    }

    // Priority 3: Find location by name
    const coords = resolveLocationCoordinates(locationName);
    if (coords) {
        return coords;
    }

    // Fallback: Resort center with small random offset
    return {
        lat: RESORT_CENTER.lat + (Math.random() * 0.001 - 0.0005),
        lng: RESORT_CENTER.lng + (Math.random() * 0.001 - 0.0005),
    };
};
