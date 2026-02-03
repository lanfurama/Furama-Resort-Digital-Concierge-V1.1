import { useState } from 'react';
import { createManualRide, getRides } from '../../../services/dataService';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from '../../../contexts/LanguageContext';

export const useCreateRide = (
    setRides: React.Dispatch<React.SetStateAction<any[]>>,
    setMyRideId: React.Dispatch<React.SetStateAction<string | null>>,
    setViewMode: React.Dispatch<React.SetStateAction<'REQUESTS' | 'HISTORY'>>
) => {
    const toast = useToast();
    const { t } = useTranslation();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreatingRide, setIsCreatingRide] = useState(false);
    const [manualRideData, setManualRideData] = useState({
        roomNumber: '',
        pickup: '',
        destination: '',
        guestCount: 1
    });

    const handleCreateManualRide = async () => {
        if (!manualRideData.pickup || !manualRideData.destination) return;
        if (isCreatingRide) return;

        const savedUser = localStorage.getItem('furama_user');
        let driverId: string | null = null;
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                const id = user?.id;
                if (id != null && id !== '') driverId = typeof id === 'number' ? String(id) : String(id);
            } catch {
                // ignore
            }
        }
        if (!driverId) {
            toast.error(t('driver_session_invalid'));
            return;
        }

        setIsCreatingRide(true);
        try {
            const guestCount = Math.min(7, Math.max(1, manualRideData.guestCount ?? 1));
            const newRide = await createManualRide(
                driverId,
                manualRideData.roomNumber,
                manualRideData.pickup,
                manualRideData.destination,
                guestCount
            );

            setMyRideId(newRide.id);
            setViewMode('REQUESTS');
            setShowCreateModal(false);
            setManualRideData({ roomNumber: '', pickup: '', destination: '', guestCount: 1 });

            const allRides = await getRides();
            setRides(allRides);
            toast.success(t('driver_toast_created_success'));
        } catch (error) {
            console.error('Failed to create manual ride:', error);
            toast.error(t('driver_toast_created_failed'));
        } finally {
            setIsCreatingRide(false);
        }
    };

    return {
        showCreateModal,
        setShowCreateModal,
        isCreatingRide,
        manualRideData,
        setManualRideData,
        handleCreateManualRide
    };
};
