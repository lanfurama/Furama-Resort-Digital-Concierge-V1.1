import React from 'react';
import { Navigation, Clock, CheckCircle, Star } from 'lucide-react';
import { RideRequest } from '../../types';
import { formatTime } from './utils/rideUtils';

interface HistoryRideCardProps {
    ride: RideRequest;
}

export const HistoryRideCard: React.FC<HistoryRideCardProps> = ({ ride }) => {
    return (
        <div className="bg-white py-4 px-5 rounded-2xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all shadow-md">
            <div className="flex items-start gap-4">
                <div className="flex flex-col items-center min-w-[70px]">
                    <div className="text-2xl font-black text-emerald-700 mb-1">#{ride.roomNumber}</div>
                    <div className="text-sm text-gray-600 font-medium">{formatTime(ride.timestamp)}</div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg text-gray-900 mb-2">{ride.guestName}</div>
                    <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-base text-gray-700">
                            <div className="w-2 h-2 bg-gray-500 rounded-full flex-shrink-0"></div>
                            <span className="font-medium">{ride.pickup}</span>
                        </div>
                        <div className="flex items-center gap-2 text-base text-emerald-700 font-bold">
                            <Navigation className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span>{ride.destination}</span>
                        </div>
                    </div>
                    {/* Additional details - Larger */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                        {ride.pickedUpAt && (
                            <span className="flex items-center gap-2">
                                <Clock size={16} className="text-emerald-600" />
                                <span className="font-medium">Pick: {formatTime(ride.pickedUpAt)}</span>
                            </span>
                        )}
                        {ride.completedAt && (
                            <span className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-600" />
                                <span className="font-medium">Drop: {formatTime(ride.completedAt)}</span>
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {ride.rating ? (
                        <div className="flex items-center gap-1 bg-yellow-100 px-3 py-2 rounded-xl border-2 border-yellow-300">
                            <span className="text-base font-bold text-yellow-700">{ride.rating}</span>
                            <Star size={18} className="text-yellow-500 fill-yellow-500" />
                        </div>
                    ) : (
                        <Star size={20} className="text-gray-300" />
                    )}
                </div>
            </div>
        </div>
    );
};
