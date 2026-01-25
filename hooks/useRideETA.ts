import { useEffect } from 'react';
import { BuggyStatus, RideRequest, Location } from '../types';
import { getDriversWithLocations, updateRide } from '../services/dataService';
import { calculateETAFromDriverToPickup, getDriverCoordinates } from '../services/locationService';

export const useRideETA = (activeRide: RideRequest | undefined, locations: Location[]) => {
  useEffect(() => {
    const updateETA = async () => {
      if (
        !activeRide ||
        !(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) ||
        !activeRide.driverId
      ) {
        return;
      }

      try {
        const drivers = await getDriversWithLocations();
        const driver = drivers.find((d) => d.id === activeRide.driverId);
        if (!driver) return;

        const driverCoords = getDriverCoordinates(driver, locations);
        if (!driverCoords) return;

        const eta = calculateETAFromDriverToPickup(
          driverCoords.lat,
          driverCoords.lng,
          activeRide.pickup,
          locations
        );

        if (eta !== null && eta !== activeRide.eta) {
          try {
            await updateRide({
              id: activeRide.id,
              eta: eta
            });
          } catch {
            // ETA update optional; skip on error
          }
        }
      } catch {
        // ETA calculation optional; skip on error
      }
    };

    const etaInterval = setInterval(updateETA, 10000);
    return () => clearInterval(etaInterval);
  }, [activeRide, locations]);
};
