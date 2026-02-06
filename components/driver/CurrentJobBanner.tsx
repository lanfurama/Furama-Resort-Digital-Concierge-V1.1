import React from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { BuggyStatus } from '../../types';
import { formatWaitingTime, getWaitingTime } from './utils/rideUtils';

interface CurrentJobBannerProps {
    ride: {
        id: string;
        timestamp: number;
        status: BuggyStatus;
    };
    currentTime: number;
}

export const CurrentJobBanner: React.FC<CurrentJobBannerProps> = ({ ride, currentTime }) => {
    const { t } = useTranslation();
    const waitingMinutes = getWaitingTime(ride.timestamp, currentTime);

    return (
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 sm:px-5 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-2 shadow-lg">
            <div className="flex items-center gap-3 sm:gap-4">
                <span className="font-bold text-sm sm:text-base uppercase tracking-wide">{t('driver_current_job')}</span>
                <div className={`text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold ${
                    waitingMinutes >= 10
                        ? 'bg-red-500 text-white shadow-lg animate-pulse'
                        : waitingMinutes >= 5
                            ? 'bg-orange-500 text-white'
                            : 'bg-white/25 text-white'
                }`}>
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{formatWaitingTime(ride.timestamp, currentTime)}</span>
                </div>
            </div>
            <span className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wide border border-white/30">
                {ride.status === BuggyStatus.ON_TRIP ? t('ON_TRIP') :
                    ride.status === BuggyStatus.ARRIVING ? t('ARRIVING') : t('ASSIGNED')}
            </span>
        </div>
    );
};
