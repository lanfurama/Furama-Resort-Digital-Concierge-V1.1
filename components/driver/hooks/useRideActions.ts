import { useState } from 'react';
import { getRides, updateRideStatus, updateRide } from '../../../services/dataService';
import { BuggyStatus } from '../../../types';
import { useToast } from '../../../hooks/useToast';

export const useRideActions = (
    setRides: React.Dispatch<React.SetStateAction<any[]>>,
    setMyRideId: React.Dispatch<React.SetStateAction<string | null>>,
    setShowChat: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const toast = useToast();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const getDriverId = (): string => {
        const savedUser = localStorage.getItem('furama_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                return user.id || 'driver-1';
            } catch (e) {
                console.error('Failed to parse user from localStorage:', e);
            }
        }
        return 'driver-1';
    };

    const acceptRide = async (id: string) => {
        if (loadingAction) return;
        setLoadingAction(id);
        try {
            const driverId = getDriverId();
            // Optimistic update
            setRides(prevRides => prevRides.map(ride =>
                ride.id === id ? { ...ride, status: BuggyStatus.ARRIVING, driverId } : ride
            ));
            setMyRideId(id);

            await updateRideStatus(id, BuggyStatus.ARRIVING, driverId, 5);
            const allRides = await getRides();
            setRides(allRides);
            toast.success('Ride accepted successfully!');
        } catch (error) {
            console.error('Failed to accept ride:', error);
            const allRides = await getRides();
            setRides(allRides);
            setMyRideId(null);
            toast.error('Failed to accept ride. Please try again.');
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
            toast.success('Guest picked up! Trip started.');
        } catch (error) {
            console.error('Failed to pick up guest:', error);
            const allRides = await getRides();
            setRides(allRides);
            toast.error('Failed to update ride status. Please try again.');
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
            toast.success('Ride completed successfully!');
        } catch (error) {
            console.error('Failed to complete ride:', error);
            const allRides = await getRides();
            setRides(allRides);
            toast.error('Failed to complete ride. Please try again.');
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
            toast.success(isPick ? 'Đã đón khách.' : 'Đã trả khách.');
        } catch (error) {
            console.error('Failed to advance merged progress:', error);
            const allRides = await getRides();
            setRides(allRides);
            toast.error('Cập nhật thất bại. Vui lòng thử lại.');
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
            toast.success('Đã hoàn thành chuyến gộp.');
        } catch (error) {
            console.error('Failed to complete merged ride:', error);
            const allRides = await getRides();
            setRides(allRides);
            toast.error('Không thể hoàn thành. Vui lòng thử lại.');
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
