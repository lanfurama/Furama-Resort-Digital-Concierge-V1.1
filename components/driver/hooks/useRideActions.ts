import { useState } from 'react';
import { getRides, updateRideStatus, updateRide } from '../../../services/dataService';
import { BuggyStatus } from '../../../types';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from '../../../contexts/LanguageContext';

/** Returns current driver id from localStorage, or null if missing/invalid (no fallback). */
function getDriverId(): string | null {
    const savedUser = localStorage.getItem('furama_user');
    if (!savedUser) return null;
    try {
        const user = JSON.parse(savedUser);
        const id = user?.id;
        if (id == null || id === '') return null;
        return typeof id === 'number' ? String(id) : String(id);
    } catch {
        return null;
    }
}

export const useRideActions = (
    setRides: React.Dispatch<React.SetStateAction<any[]>>,
    setMyRideId: React.Dispatch<React.SetStateAction<string | null>>,
    setShowChat: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const toast = useToast();
    const { t } = useTranslation();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const acceptRide = async (id: string) => {
        if (loadingAction) return;
        const driverId = getDriverId();
        if (!driverId) {
            toast.error(t('driver_session_invalid'));
            return;
        }
        setLoadingAction(id);
        try {
            // Optimistic update
            setRides(prevRides => prevRides.map(ride =>
                ride.id === id ? { ...ride, status: BuggyStatus.ARRIVING, driverId } : ride
            ));
            setMyRideId(id);

            await updateRideStatus(id, BuggyStatus.ARRIVING, driverId, 5);
            const allRides = await getRides();
            setRides(allRides);
            toast.success(t('driver_toast_accept_success'));
        } catch (error) {
            console.error('Failed to accept ride:', error);
            const allRides = await getRides();
            setRides(allRides);
            setMyRideId(null);
            toast.error(t('driver_toast_accept_failed'));
        } finally {
            setLoadingAction(null);
        }
    };

    const pickUpGuest = async (id: string) => {
        if (loadingAction) return;
        setLoadingAction(`pickup-${id}`);
        try {
            // Optimistic update
            setRides(prevRides => prevRides.map(ride =>
                ride.id === id ? { ...ride, status: BuggyStatus.ON_TRIP, pickedUpAt: Date.now() } : ride
            ));

            await updateRideStatus(id, BuggyStatus.ON_TRIP);
            const allRides = await getRides();
            setRides(allRides);
            toast.success(t('driver_toast_pickup_success'));
        } catch (error) {
            console.error('Failed to pick up guest:', error);
            const allRides = await getRides();
            setRides(allRides);
            toast.error(t('driver_toast_pickup_failed'));
        } finally {
            setLoadingAction(null);
        }
    };

    const completeRide = async (id: string) => {
        if (loadingAction) return;
        setLoadingAction(`complete-${id}`);
        try {
            await updateRideStatus(id, BuggyStatus.COMPLETED);
            setShowChat(false);
            setMyRideId(null);
            const allRides = await getRides();
            setRides(allRides);
            toast.success(t('driver_toast_complete_success'));
        } catch (error) {
            console.error('Failed to complete ride:', error);
            const allRides = await getRides();
            setRides(allRides);
            toast.error(t('driver_toast_complete_failed'));
        } finally {
            setLoadingAction(null);
        }
    };

    /** For merged rides: advance one step (Đã đón or Đã trả). */
    const advanceMergedProgress = async (id: string, currentProgress: number) => {
        if (loadingAction) return;
        setLoadingAction(`merge-step-${id}`);
        try {
            const next = currentProgress + 1;
            await updateRide({ id, mergedProgress: next });
            const allRides = await getRides();
            setRides(allRides);
            const isPick = next % 2 === 1;
            toast.success(isPick ? t('driver_toast_merge_step_pick') : t('driver_toast_merge_step_drop'));
        } catch (error) {
            console.error('Failed to advance merged progress:', error);
            const allRides = await getRides();
            setRides(allRides);
            toast.error(t('driver_toast_merge_update_failed'));
        } finally {
            setLoadingAction(null);
        }
    };

    /** For merged rides: mark whole trip completed (Hoàn thành khi trả xong khách cuối). */
    const completeMergedRide = async (id: string) => {
        if (loadingAction) return;
        setLoadingAction(`complete-${id}`);
        try {
            await updateRideStatus(id, BuggyStatus.COMPLETED);
            setShowChat(false);
            setMyRideId(null);
            const allRides = await getRides();
            setRides(allRides);
            toast.success(t('driver_toast_merged_complete_success'));
        } catch (error) {
            console.error('Failed to complete merged ride:', error);
            const allRides = await getRides();
            setRides(allRides);
            toast.error(t('driver_toast_merged_complete_failed'));
        } finally {
            setLoadingAction(null);
        }
    };

    return {
        loadingAction,
        acceptRide,
        pickUpGuest,
        completeRide,
        advanceMergedProgress,
        completeMergedRide
    };
};
