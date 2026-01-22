import { useState, useEffect, useRef } from 'react';
import { BuggyStatus, RideRequest } from '../types';
import { getUsers } from '../services/dataService';
import { useTranslation } from '../contexts/LanguageContext';

export const useDriverName = (activeRide: RideRequest | undefined): string => {
  const { t } = useTranslation();
  const [driverName, setDriverName] = useState<string>(t('driver'));
  const driverNameCacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const fetchDriverName = async () => {
      if (!activeRide) {
        setDriverName(t('driver'));
        return;
      }

      if (activeRide.status === BuggyStatus.SEARCHING) {
        setDriverName(`${t('driver')} (${t('finding_driver')})`);
        return;
      }

      if (activeRide.driverId) {
        const driverIdStr = String(activeRide.driverId);

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
            driverNameCacheRef.current[driverIdStr] = driver.lastName;
            setDriverName(driver.lastName);
          } else {
            const statusLabel = activeRide.status === BuggyStatus.ASSIGNED ? t('driver_assigned') :
              activeRide.status === BuggyStatus.ARRIVING ? t('driver_arriving') :
                activeRide.status === BuggyStatus.ON_TRIP ? t('en_route') :
                  t('driver');
            setDriverName(`${t('driver')} (${statusLabel})`);
          }
        } catch (error) {
          console.error('[useDriverName] Failed to fetch driver name:', error);
          setDriverName(t('driver'));
        }
      } else {
        setDriverName(`${t('driver')} (${t('finding_driver')})`);
      }
    };

    fetchDriverName();
  }, [activeRide?.driverId, activeRide?.status, t]);

  return driverName;
};
