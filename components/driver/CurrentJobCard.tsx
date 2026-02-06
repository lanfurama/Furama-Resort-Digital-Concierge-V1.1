import React from 'react';
import { Navigation, MessageSquare, Loader2 } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { RideRequest, BuggyStatus } from '../../types';
import { formatTime } from './utils/rideUtils';

interface CurrentJobCardProps {
    ride: RideRequest;
    loadingAction: string | null;
    onPickUp: (id: string) => void;
    onComplete: (id: string) => void;
    onOpenChat: () => void;
}

export const CurrentJobCard: React.FC<CurrentJobCardProps> = ({
    ride,
    loadingAction,
    onPickUp,
    onComplete,
    onOpenChat
}) => {
    const { t } = useTranslation();
    const isPickingUp = loadingAction === `pickup-${ride.id}`;
    const isCompleting = loadingAction === `complete-${ride.id}`;
    const canPickUp = ride.status === BuggyStatus.ARRIVING || ride.status === BuggyStatus.ASSIGNED;

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-5 border-b-2 border-emerald-200 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:min-w-[80px]">
                    <div className="text-3xl sm:text-4xl font-black text-emerald-700">#{ride.roomNumber}</div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">{formatTime(ride.timestamp)}</div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg sm:text-xl text-gray-900 mb-2 sm:mb-3">{ride.guestName}</div>
                    <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full flex-shrink-0" />
                            <span className="font-medium">{ride.pickup}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm sm:text-base text-emerald-700 font-bold">
                            <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                            <span>{ride.destination}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row sm:flex-col items-stretch sm:items-end gap-2 sm:gap-3">
                    <button
                        onClick={onOpenChat}
                        className="p-3 rounded-xl border-2 border-gray-300 hover:bg-gray-100 hover:border-emerald-400 active:bg-gray-200 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center bg-white shadow-sm touch-manipulation"
                        title={t('driver_chat')}
                    >
                        <MessageSquare size={20} className="text-emerald-600 sm:w-[22px] sm:h-[22px]" />
                    </button>
                    {canPickUp ? (
                        <button
                            onClick={() => onPickUp(ride.id)}
                            disabled={isPickingUp}
                            className="flex-1 sm:flex-none min-h-[48px] sm:min-h-[56px] sm:min-w-[140px] bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white px-6 py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center touch-manipulation"
                        >
                            {isPickingUp ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                t('driver_pick_up_guest')
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => onComplete(ride.id)}
                            disabled={isCompleting}
                            className="flex-1 sm:flex-none min-h-[48px] sm:min-h-[56px] sm:min-w-[140px] bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-6 py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center touch-manipulation"
                        >
                            {isCompleting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                t('driver_complete')
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
