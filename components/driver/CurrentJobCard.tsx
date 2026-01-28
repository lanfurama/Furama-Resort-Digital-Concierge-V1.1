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
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 border-b-2 border-emerald-200 shadow-lg">
            <div className="flex items-start gap-4">
                <div className="flex flex-col items-center min-w-[80px]">
                    <div className="text-4xl font-black text-emerald-700 mb-1">#{ride.roomNumber}</div>
                    <div className="text-sm text-gray-600 font-medium">{formatTime(ride.timestamp)}</div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-xl text-gray-900 mb-3">{ride.guestName}</div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-base text-gray-700">
                            <div className="w-2 h-2 bg-gray-500 rounded-full flex-shrink-0"></div>
                            <span className="font-medium">{ride.pickup}</span>
                        </div>
                        <div className="flex items-center gap-2 text-base text-emerald-700 font-bold">
                            <Navigation className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span>{ride.destination}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <button
                        onClick={onOpenChat}
                        className="p-3 rounded-xl border-2 border-gray-300 hover:bg-gray-100 hover:border-emerald-400 transition-all min-w-[52px] min-h-[52px] flex items-center justify-center bg-white shadow-sm"
                        title={t('driver_chat')}
                    >
                        <MessageSquare size={22} className="text-emerald-600" />
                    </button>
                    {canPickUp ? (
                        <button
                            onClick={() => onPickUp(ride.id)}
                            disabled={isPickingUp}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md min-w-[140px] min-h-[56px] flex items-center justify-center"
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
                            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md min-w-[140px] min-h-[56px] flex items-center justify-center"
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
