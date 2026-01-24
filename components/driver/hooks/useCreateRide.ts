import { useState } from 'react';
import { createManualRide, getRides } from '../../../services/dataService';
import { useToast } from '../../../hooks/useToast';

export const useCreateRide = (
    setRides: React.Dispatch<React.SetStateAction<any[]>>,
    setMyRideId: React.Dispatch<React.SetStateAction<string | null>>,
    setViewMode: React.Dispatch<React.SetStateAction<'REQUESTS' | 'HISTORY'>>
) => {
    const toast = useToast();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreatingRide, setIsCreatingRide] = useState(false);
    const [manualRideData, setManualRideData] = useState({
        roomNumber: '',
        pickup: '',
        destination: ''
    });

    const handleCreateManualRide = async () => {
        if (!manualRideData.pickup || !manualRideData.destination) return;
        if (isCreatingRide) return;

        setIsCreatingRide(true);
        try {
            const savedUser = localStorage.getItem('furama_user');
            let driverId: string = 'driver-1';
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    driverId = user.id || 'driver-1';
                } catch (e) {
                    console.error('Failed to parse user from localStorage:', e);
                }
            }

            const newRide = await createManualRide(
                driverId,
                manualRideData.roomNumber,
                manualRideData.pickup,
                manualRideData.destination
            );

            setMyRideId(newRide.id);
            setViewMode('REQUESTS');
            setShowCreateModal(false);
            setManualRideData({ roomNumber: '', pickup: '', destination: '' });

            const allRides = await getRides();
            setRides(allRides);
            toast.success('Ride created successfully!');
        } catch (error) {
            console.error('Failed to create manual ride:', error);
            toast.error('Failed to create ride. Please try again.');
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
