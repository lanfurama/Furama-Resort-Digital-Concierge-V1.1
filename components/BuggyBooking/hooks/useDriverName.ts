import { useState, useEffect, useRef } from 'react';
import { BuggyStatus, RideRequest } from '../../../types';
import { getUsers } from '../../../services/dataService';

interface UseDriverNameProps {
  activeRide: RideRequest | undefined;
  t: (key: string) => string;
}

/**
 * Hook to fetch and cache driver name
 */
export const useDriverName = ({ activeRide, t }: UseDriverNameProps) => {
  const [driverName, setDriverName] = useState<string>(t('driver'));
  const driverNameCacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const fetchDriverName = async () => {
      if (!activeRide) {
        setDriverName(t('driver'));
        return;
      }

      // If ride is still searching, show searching status
      if (activeRide.status === BuggyStatus.SEARCHING) {
        setDriverName(`${t('driver')} (${t('finding_driver')})`);
        return;
      }

      // If ride has driverId, fetch driver name (only if not cached)
      if (activeRide.driverId) {
        const driverIdStr = String(activeRide.driverId);
        
        // Check cache first
        if (driverNameCacheRef.current[driverIdStr]) {
          setDriverName(driverNameCacheRef.current[driverIdStr]);
          return;
        }

        try {
          const users = await getUsers();
          const driver = users.find(u => {
            const userIdStr = String(u.id || '');
            return userIdStr === driverIdStr;
          });
          
          if (driver && driver.lastName) {
            // Cache the driver name
            driverNameCacheRef.current[driverIdStr] = driver.lastName;
            setDriverName(driver.lastName);
          } else {
            console.warn('[BuggyBooking] Driver not found for driverId:', driverIdStr);
            // Fallback: show driver with status
            const statusLabel = activeRide.status === BuggyStatus.ASSIGNED ? t('driver_assigned') :
                              activeRide.status === BuggyStatus.ARRIVING ? t('driver_arriving') :
                              activeRide.status === BuggyStatus.ON_TRIP ? t('en_route') :
                              t('driver');
            setDriverName(`${t('driver')} (${statusLabel})`);
          }
        } catch (error) {
          console.error('[BuggyBooking] Failed to fetch driver name:', error);
          setDriverName(t('driver'));
        }
      } else {
        // No driver assigned yet
        setDriverName(`${t('driver')} (${t('finding_driver')})`);
      }
    };
    
    fetchDriverName();
  }, [activeRide?.driverId, activeRide?.status, t]);

  return driverName;
};

