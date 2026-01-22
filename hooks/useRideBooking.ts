import { useState, useCallback } from 'react';
import { User, RideRequest } from '../types';
import { requestRide, cancelRide, getActiveRideForUser } from '../services/dataService';

interface UseRideBookingOptions {
  user: User;
  onRideCreated?: (ride: RideRequest) => void;
  onRideCancelled?: () => void;
}

interface UseRideBookingResult {
  isBooking: boolean;
  bookRide: (pickup: string, destination: string, guestCount: number, notes?: string) => Promise<RideRequest | null>;
  cancelRide: (rideId: string) => Promise<boolean>;
}

export const useRideBooking = ({
  user,
  onRideCreated,
  onRideCancelled
}: UseRideBookingOptions): UseRideBookingResult => {
  const [isBooking, setIsBooking] = useState(false);

  const bookRide = useCallback(async (
    pickup: string,
    destination: string,
    guestCount: number,
    notes?: string
  ): Promise<RideRequest | null> => {
    if (isBooking) return null;

    setIsBooking(true);
    try {
      const newRide = await requestRide(
        user.lastName,
        user.roomNumber,
        pickup,
        destination,
        guestCount || 1,
        notes
      );
      
      const updatedRide = await getActiveRideForUser(user.roomNumber);
      const finalRide = updatedRide || newRide;
      onRideCreated?.(finalRide);
      
      return finalRide;
    } catch (error) {
      console.error('Failed to request ride:', error);
      throw error;
    } finally {
      setTimeout(() => {
        setIsBooking(false);
      }, 1000);
    }
  }, [user, isBooking, onRideCreated]);

  const cancelRideRequest = useCallback(async (rideId: string): Promise<boolean> => {
    try {
      await cancelRide(rideId);
      const updatedRide = await getActiveRideForUser(user.roomNumber);
      onRideCancelled?.();
      return !updatedRide;
    } catch (error) {
      console.error('Failed to cancel ride:', error);
      throw error;
    }
  }, [user, onRideCancelled]);

  return {
    isBooking,
    bookRide,
    cancelRide: cancelRideRequest
  };
};
