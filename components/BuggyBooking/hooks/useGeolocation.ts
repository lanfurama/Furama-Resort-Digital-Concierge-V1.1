import { useState, useCallback } from 'react';
import { Location } from '../../../types';
import { findNearestLocation } from '../utils/locationUtils';

interface UseGeolocationProps {
  locations: Location[];
  onLocationFound: (locationName: string) => void;
  onLocationNotFound: () => void;
}

/**
 * Hook to handle geolocation and find nearest location
 */
export const useGeolocation = ({ locations, onLocationFound, onLocationNotFound }: UseGeolocationProps) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      // Geolocation not supported
      onLocationNotFound();
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearest = findNearestLocation(latitude, longitude, locations);
        
        if (nearest) {
          onLocationFound(nearest.name);
        } else {
          // No nearest location found
          onLocationNotFound();
        }
        setIsGettingLocation(false);
      },
      (error) => {
        // Geolocation failed
        console.error('Geolocation error:', error);
        onLocationNotFound();
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [locations, onLocationFound, onLocationNotFound]);

  return {
    isGettingLocation,
    getCurrentLocation
  };
};

