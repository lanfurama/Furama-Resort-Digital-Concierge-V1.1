import React from 'react';
import { Navigation, Clock, Loader2 } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { RideRequest } from '../../types';
import { formatTime, formatWaitingTime, getWaitingTimeColor, getPriorityInfo } from './utils/rideUtils';

interface RideRequestCardProps {
    ride: RideRequest;
    currentTime: number;
    loadingAction: string | null;
    onAccept: (id: string) => void;
}

export const RideRequestCard: React.FC<RideRequestCardProps> = ({
    ride,
    currentTime,
    loadingAction,
    onAccept
}) => {
    const { t } = useTranslation();
    const priorityInfo = getPriorityInfo(ride, currentTime);
    const isAccepting = loadingAction === ride.id;
    const isDisabled = loadingAction !== null;

    return (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-gray-200 hover:border-emerald-400 hover:shadow-xl transition-all shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:min-w-[80px]">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-700">#{ride.roomNumber}</div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-center sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">{formatTime(ride.timestamp)}</span>
                        <div className={`${priorityInfo.color} ${priorityInfo.textColor} px-2 py-1 rounded-lg text-xs font-bold ${priorityInfo.border ? `border ${priorityInfo.border}` : ''}`}>
                            {t(priorityInfo.labelKey)}
                        </div>
                        <div className={`text-xs sm:text-sm flex items-center gap-1.5 font-bold ${getWaitingTimeColor(ride.timestamp, currentTime)}`}>
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>{formatWaitingTime(ride.timestamp, currentTime)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3">{ride.guestName}</div>
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
                <button
                    onClick={() => onAccept(ride.id)}
                    disabled={isAccepting || isDisabled}
                    className="w-full sm:w-auto sm:min-w-[120px] min-h-[48px] sm:min-h-[56px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-6 py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center touch-manipulation"
                >
                    {isAccepting ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        t('driver_accept')
                    )}
                </button>
            </div>
        </div>
    );
};
