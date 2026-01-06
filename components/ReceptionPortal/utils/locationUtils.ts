import { Location } from "../../../types";

/**
 * Resolve location coordinates from location name
 * Supports GPS format, exact match, partial match, and room number fallback
 */
export const resolveLocationCoordinates = (
    locationName: string,
    locations: Location[]
): { lat: number; lng: number } | null => {
    if (!locationName || locationName === "Unknown Location") return null;

    // Check if it's a GPS coordinate format
    if (locationName.startsWith("GPS:")) {
        const parts = locationName.replace("GPS:", "").split(",");
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
                return { lat, lng };
            }
        }
    }

    // Try exact match first
    let loc = locations.find(
        (l) => locationName.toLowerCase().trim() === l.name.toLowerCase().trim()
    );

    // Try partial match if exact match fails
    if (!loc) {
        loc = locations.find(
            (l) =>
                locationName.toLowerCase().includes(l.name.toLowerCase()) ||
                l.name.toLowerCase().includes(locationName.toLowerCase())
        );
    }

    // Try matching room numbers (e.g., "Room 101" might match a villa location)
    if (!loc && locationName.toLowerCase().includes("room")) {
        const roomMatch = locationName.match(/\d+/);
        if (roomMatch) {
            // Try to find a location that might correspond to this room
            // This is a fallback - ideally room numbers should map to specific locations
            loc = locations.find(
                (l) => l.name.toLowerCase().includes("villa") || l.type === "VILLA"
            );
        }
    }

    if (loc) {
        return { lat: loc.lat, lng: loc.lng };
    }

    return null;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export const calculateDistance = (
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((coord1.lat * Math.PI) / 180) *
        Math.cos((coord2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
};

/**
 * Get position on map as percentage (for mini-map display)
 */
export const getMapPosition = (
    lat: number,
    lng: number,
    bounds: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
    }
) => {
    const { minLat, maxLat, minLng, maxLng } = bounds;

    // Calculate percentage position
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;

    const y = ((maxLat - lat) / latRange) * 100;
    const x = ((lng - minLng) / lngRange) * 100;

    return {
        top: `${Math.max(5, Math.min(95, y))}%`,
        left: `${Math.max(5, Math.min(95, x))}%`,
    };
};
