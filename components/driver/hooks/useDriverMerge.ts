import { useMemo, useState, useCallback } from 'react';
import { RideRequest } from '../../../types';
import { BuggyStatus } from '../../../types';
import { Location } from '../../../types';
import { canCombineRides, calculateOptimalMergeRoute } from '../../ReceptionPortal/utils/mergeRideUtils';
import { resolveLocationCoordinates, calculateDistance } from '../../ReceptionPortal/utils/locationUtils';
import { getRides, updateRide, cancelRide, updateRideStatus } from '../../../services/dataService';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from '../../../contexts/LanguageContext';

export type MergeSuggestion = {
    ride1: RideRequest;
    ride2: RideRequest;
    optimalRoute: {
        pickup: string;
        destination: string;
        routePath: string[];
        segments: import('../../../types').RouteSegment[];
        isChainTrip: boolean;
    };
};

export const useDriverMerge = (
    pendingRides: RideRequest[],
    locations: Location[],
    setRides: React.Dispatch<React.SetStateAction<RideRequest[]>>,
    setMyRideId: React.Dispatch<React.SetStateAction<string | null>>,
    currentDriverActualId: string | null
) => {
    const toast = useToast();
    const { t } = useTranslation();
    const [dismissedPairKey, setDismissedPairKey] = useState<string | null>(null);
    const [isMerging, setIsMerging] = useState(false);

    const resolveCoord = useCallback(
        (locationName: string) => resolveLocationCoordinates(locationName, locations),
        [locations]
    );

    const calcDist = useCallback(
        (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
            calculateDistance(a, b),
        []
    );

    const mergeSuggestion: MergeSuggestion | null = useMemo(() => {
        if (pendingRides.length < 2) return null;
        const key = (id1: string, id2: string) => [id1, id2].sort().join('-');
        for (let i = 0; i < pendingRides.length; i++) {
            for (let j = i + 1; j < pendingRides.length; j++) {
                const r1 = pendingRides[i];
                const r2 = pendingRides[j];
                if (!canCombineRides(r1, r2)) continue;
                const pairKey = key(r1.id, r2.id);
                if (pairKey === dismissedPairKey) continue;
                const optimalRoute = calculateOptimalMergeRoute(r1, r2, resolveCoord, calcDist);
                return { ride1: r1, ride2: r2, optimalRoute };
            }
        }
        return null;
    }, [pendingRides, dismissedPairKey, resolveCoord, calcDist]);

    const acceptMerge = useCallback(async () => {
        if (!mergeSuggestion) return;
        const { ride1, ride2, optimalRoute } = mergeSuggestion;
        setIsMerging(true);
        try {
            const totalGuests = (ride1.guestCount || 1) + (ride2.guestCount || 1);
            const mergedNotes = [ride1.notes, ride2.notes]
                .filter((n) => n?.trim())
                .join(' | ') || '';
            const mergedGuestNames = [ride1.guestName, ride2.guestName]
                .filter((n) => n?.trim())
                .join(' + ') || 'Multiple Guests';
            const baseRide = ride1.timestamp <= ride2.timestamp ? ride1 : ride2;
            const otherRide = ride1.timestamp <= ride2.timestamp ? ride2 : ride1;

            const mergedRide: Partial<RideRequest> & { id: string } = {
                ...baseRide,
                id: baseRide.id,
                roomNumber: `${ride1.roomNumber}+${ride2.roomNumber}`,
                guestName: mergedGuestNames,
                guestCount: totalGuests,
                notes: mergedNotes,
                pickup: optimalRoute.pickup,
                destination: optimalRoute.destination,
                timestamp: Math.min(ride1.timestamp, ride2.timestamp),
                isMerged: true,
                segments: optimalRoute.segments,
                mergedProgress: 0,
            };

            await updateRide(mergedRide);
            await cancelRide(otherRide.id!);
            if (currentDriverActualId) {
                await updateRideStatus(baseRide.id, BuggyStatus.ARRIVING, currentDriverActualId, 5);
                setMyRideId(baseRide.id);
            }
            const updatedRides = await getRides();
            setRides(updatedRides);
            const roomsStr = `${ride1.roomNumber}+${ride2.roomNumber}`;
            const msg = t('driver_toast_merge_success').replace('{rooms}', roomsStr).replace('{count}', String(totalGuests));
            toast.success(msg);
        } catch (error) {
            console.error('Failed to merge rides:', error);
            toast.error(t('driver_toast_merge_failed'));
        } finally {
            setIsMerging(false);
        }
    }, [mergeSuggestion, setRides, setMyRideId, currentDriverActualId, toast, t]);

    const rejectMerge = useCallback(() => {
        if (!mergeSuggestion) return;
        const key = [mergeSuggestion.ride1.id, mergeSuggestion.ride2.id].sort().join('-');
        setDismissedPairKey(key);
        toast.success(t('driver_toast_merge_rejected'));
    }, [mergeSuggestion, toast, t]);

    return { mergeSuggestion, acceptMerge, rejectMerge, isMerging };
};
