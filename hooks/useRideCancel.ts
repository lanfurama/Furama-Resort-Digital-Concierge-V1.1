import { useCallback } from 'react';
import { BuggyStatus, RideRequest } from '../types';

const ARRIVING_WARNING_TIME = 5 * 60;
const MAX_WAIT_TIME = 10 * 60;
const MAX_ARRIVING_WAIT_TIME = 15 * 60;

interface UseRideCancelOptions {
  activeRide: RideRequest | undefined;
  elapsedTime: number;
  arrivingElapsedTime: number;
  cancelRide: (rideId: string) => Promise<boolean>;
  onNotification: (message: string, type: 'success' | 'info' | 'warning') => void;
  t: (key: string) => string;
}

export const useRideCancel = ({
  activeRide,
  elapsedTime,
  arrivingElapsedTime,
  cancelRide,
  onNotification,
  t
}: UseRideCancelOptions) => {
  const handleCancel = useCallback(async () => {
    if (!activeRide) return;
    if (activeRide.status === BuggyStatus.ON_TRIP || activeRide.status === BuggyStatus.COMPLETED) {
      onNotification(t('cannot_cancel_picked_up'), 'warning');
      return;
    }
    if (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) {
      if (arrivingElapsedTime >= ARRIVING_WARNING_TIME) {
        const confirmMessage =
          arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME ? t('driver_delayed_cancel') : t('confirm_cancel_ride');
        if (window.confirm(confirmMessage)) {
          try {
            const cancelled = await cancelRide(activeRide.id);
            if (cancelled) {
              onNotification(`✅ ${t('ride_cancelled_success')}`, 'success');
            }
          } catch {
            onNotification(t('failed_to_cancel_ride'), 'warning');
          }
        }
      } else {
        onNotification(t('cannot_cancel_assigned'), 'warning');
      }
      return;
    }
    if (activeRide.status === BuggyStatus.SEARCHING) {
      const confirmMessage = elapsedTime >= MAX_WAIT_TIME ? t('waiting_long_cancel') : t('confirm_cancel_ride');
      if (window.confirm(confirmMessage)) {
        try {
          const cancelled = await cancelRide(activeRide.id);
          if (cancelled) {
            onNotification(`✅ ${t('ride_cancelled_success')}`, 'success');
          }
        } catch {
          onNotification(t('failed_to_cancel_ride'), 'warning');
        }
      }
    }
  }, [activeRide, elapsedTime, arrivingElapsedTime, cancelRide, onNotification, t]);

  const canCancel =
    activeRide &&
    (activeRide.status === BuggyStatus.SEARCHING ||
      ((activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) &&
        arrivingElapsedTime >= ARRIVING_WARNING_TIME));

  return { handleCancel, canCancel };
};
