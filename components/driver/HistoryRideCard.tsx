import React from 'react';
import { Navigation, Clock, CheckCircle, Star } from 'lucide-react';
import { RideRequest } from '../../types';
import { formatTime } from './utils/rideUtils';

interface HistoryRideCardProps {
    ride: RideRequest;
}

export const HistoryRideCard: React.FC<HistoryRideCardProps> = ({ ride }) => {
    return (
        <div className="bg-white py-4 px-4 sm:px-5 rounded-2xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:min-w-[70px]">
                    <div className="text-xl sm:text-2xl font-black text-emerald-700">#{ride.roomNumber}</div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">{formatTime(ride.timestamp)}</div>
                    {ride.rating != null && (
                        <div className="flex items-center gap-1 bg-yellow-100 px-2.5 py-1.5 rounded-xl border-2 border-yellow-300 sm:mt-0">
                            <span className="text-sm sm:text-base font-bold text-yellow-700">{ride.rating}</span>
                            <Star size={16} className="text-yellow-500 fill-yellow-500 sm:w-[18px] sm:h-[18px]" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-base sm:text-lg text-gray-900 mb-1.5 sm:mb-2">{ride.guestName}</div>
                    <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full flex-shrink-0" />
                            <span className="font-medium">{ride.pickup}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm sm:text-base text-emerald-700 font-bold">
                            <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                            <span>{ride.destination}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                        {ride.pickedUpAt && (
                            <span className="flex items-center gap-1.5">
                                <Clock size={14} className="text-emerald-600 sm:w-4 sm:h-4" />
                                <span className="font-medium">Pick: {formatTime(ride.pickedUpAt)}</span>
                            </span>
                        )}
                        {ride.completedAt && (
                            <span className="flex items-center gap-1.5">
                                <CheckCircle size={14} className="text-emerald-600 sm:w-4 sm:h-4" />
                                <span className="font-medium">Drop: {formatTime(ride.completedAt)}</span>
                            </span>
                        )}
                    </div>
                </div>
                {ride.rating == null && (
                    <div className="flex items-center gap-1 flex-shrink-0 self-end sm:self-center">
                        <Star size={20} className="text-gray-300" />
                    </div>
                )}
            </div>
        </div>
    );
};
