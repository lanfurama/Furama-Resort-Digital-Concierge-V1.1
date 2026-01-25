import { useState, useEffect, useRef } from 'react';
import { Location } from '../types';
import { getLocations } from '../services/dataService';
import { useBuggyLocation } from './useBuggyLocation';

export const useBuggyBookingState = (roomNumber: string) => {
  const [pickup, setPickup] = useState<string>(`Villa ${roomNumber}`);
  const [destination, setDestination] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const locationDetectionAttemptedRef = useRef<boolean>(false);

  useEffect(() => {
    setIsLoadingLocations(true);
    getLocations()
      .then(setLocations)
      .catch(() => {})
      .finally(() => setIsLoadingLocations(false));
  }, []);

  const { isDetecting: isDetectingLocation, detectedLocation } = useBuggyLocation(
    locations,
    !isLoadingLocations && locations.length > 0 && !locationDetectionAttemptedRef.current
  );

  useEffect(() => {
    if (isDetectingLocation) {
      setShowGpsModal(true);
      locationDetectionAttemptedRef.current = true;
    } else if (detectedLocation) {
      setPickup(detectedLocation.name);
      setShowGpsModal(false);
    } else if (!isDetectingLocation && locationDetectionAttemptedRef.current) {
      setShowGpsModal(false);
    }
  }, [isDetectingLocation, detectedLocation]);

  return {
    pickup,
    setPickup,
    destination,
    setDestination,
    guestCount,
    setGuestCount,
    notes,
    setNotes,
    locations,
    isLoadingLocations,
    showGpsModal,
    setShowGpsModal,
    showPickupDropdown,
    setShowPickupDropdown,
    showDestinationDropdown,
    setShowDestinationDropdown,
    isDetectingLocation
  };
};
