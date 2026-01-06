import { Location } from '../types';
import { RESORT_CENTER } from '../constants';

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

/**
 * Resolve location coordinates from location name
 * @param locationName Name of the location
 * @param locations Array of known locations
 * @returns Coordinates or null if not found
 */
export const resolveLocationCoordinates = (
  locationName: string,
  locations: Location[]
): { lat: number; lng: number } | null => {
  if (!locationName || locationName === 'Unknown Location') return null;

  // Check if it's a GPS coordinate string
  if (locationName.startsWith('GPS:')) {
    const parts = locationName.replace('GPS:', '').split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  }

  // Check if it contains "Near" prefix
  const cleanName = locationName.replace(/^Near\s+/i, '').trim();

  // Try exact match first
  let loc = locations.find(
    (l) => cleanName.toLowerCase().trim() === l.name.toLowerCase().trim()
  );

  // Try partial match
  if (!loc) {
    loc = locations.find(
      (l) =>
        cleanName.toLowerCase().includes(l.name.toLowerCase()) ||
        l.name.toLowerCase().includes(cleanName.toLowerCase())
    );
  }

  if (loc) {
    return { lat: loc.lat, lng: loc.lng };
  }

  return null;
};

/**
 * Calculate ETA (Estimated Time of Arrival) in minutes based on distance
 * Assumes average buggy speed of 15 km/h (4.17 m/s) in resort
 * Adds 1 minute buffer for parking/stopping
 * @param distanceMeters Distance in meters
 * @returns ETA in minutes (rounded up)
 */
export const calculateETA = (distanceMeters: number): number => {
  // Average buggy speed in resort: 15 km/h = 4.17 m/s
  const AVERAGE_SPEED_MPS = 4.17;
  // Buffer time for parking, stopping, etc. (in seconds)
  const BUFFER_SECONDS = 60;

  // Calculate time in seconds
  const timeSeconds = distanceMeters / AVERAGE_SPEED_MPS + BUFFER_SECONDS;

  // Convert to minutes and round up
  const etaMinutes = Math.ceil(timeSeconds / 60);

  // Minimum 1 minute, maximum 30 minutes (safety limit)
  return Math.max(1, Math.min(etaMinutes, 30));
};

/**
 * Calculate ETA from driver location to pickup location
 * @param driverLat Driver's current latitude
 * @param driverLng Driver's current longitude
 * @param pickupLocationName Pickup location name
 * @param locations Array of known locations
 * @returns ETA in minutes, or null if cannot calculate
 */
export const calculateETAFromDriverToPickup = (
  driverLat: number | undefined,
  driverLng: number | undefined,
  pickupLocationName: string,
  locations: Location[]
): number | null => {
  // Need driver GPS coordinates
  if (driverLat === undefined || driverLng === undefined) {
    return null;
  }

  // Resolve pickup location coordinates
  const pickupCoords = resolveLocationCoordinates(pickupLocationName, locations);
  if (!pickupCoords) {
    return null;
  }

  // Calculate distance
  const distance = calculateDistance(
    driverLat,
    driverLng,
    pickupCoords.lat,
    pickupCoords.lng
  );

  // Calculate ETA
  return calculateETA(distance);
};

/**
 * Get driver's current coordinates
 * @param driver Driver object with location info
 * @param locations Array of known locations
 * @returns Driver coordinates or null
 */
export const getDriverCoordinates = (
  driver: {
    currentLat?: number;
    currentLng?: number;
    currentLocation?: string;
  },
  locations: Location[]
): { lat: number; lng: number } | null => {
  // Priority 1: Use GPS coordinates from database
  if (driver.currentLat !== undefined && driver.currentLng !== undefined) {
    return { lat: driver.currentLat, lng: driver.currentLng };
  }

  // Priority 2: Parse from location string
  if (driver.currentLocation) {
    const coords = resolveLocationCoordinates(driver.currentLocation, locations);
    if (coords) {
      return coords;
    }
  }

  return null;
};

