import { useState, useEffect, useRef, useCallback } from 'react';
import { Location } from '../types';

interface UseBuggyLocationResult {
    isDetecting: boolean;
    detectedLocation: Location | null;
    error: GeolocationPositionError | null;
}

/**
 * Hook for handling geolocation detection and finding nearest location
 */
export const useBuggyLocation = (
    locations: Location[],
    enabled: boolean = true
): UseBuggyLocationResult => {
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectedLocation, setDetectedLocation] = useState<Location | null>(null);
    const [error, setError] = useState<GeolocationPositionError | null>(null);
    const attemptedRef = useRef(false);

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Return distance in meters
    }, []);

    // Find nearest location within reasonable distance
    const findNearestLocation = useCallback((latitude: number, longitude: number): Location | null => {
        if (locations.length === 0) return null;

        let nearest: Location | null = null;
        let minDistance = Infinity;
        const maxDistance = 500; // Early exit threshold

        // Filter valid locations first
        const validLocations = locations.filter(loc => loc.lat && loc.lng);
        
        for (const loc of validLocations) {
            const distance = calculateDistance(latitude, longitude, loc.lat!, loc.lng!);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = loc;
                // Early exit if we find a very close match
                if (distance < 50) break;
            }
        }

        // Only return if within 500m (reasonable resort distance)
        return minDistance <= maxDistance ? nearest : null;
    }, [locations, calculateDistance]);

    // Detect location on mount
    useEffect(() => {
        if (!enabled) return;
        if (locations.length === 0) return;
        if (attemptedRef.current) return;

        attemptedRef.current = true;
        setIsDetecting(true);
        setError(null);

        if (!navigator.geolocation) {
            setIsDetecting(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const nearest = findNearestLocation(latitude, longitude);
                setDetectedLocation(nearest);
                setIsDetecting(false);
            },
            (err) => {
                console.warn('Geolocation error:', err);
                setError(err);
                setIsDetecting(false);
            },
            {
                enableHighAccuracy: false, // Faster, less accurate is fine for resort
                timeout: 5000, // Reduce timeout for faster failure
                maximumAge: 30000 // Allow cached position up to 30s old
            }
        );
    }, [enabled, locations, findNearestLocation]);

    return {
        isDetecting,
        detectedLocation,
        error
    };
};
