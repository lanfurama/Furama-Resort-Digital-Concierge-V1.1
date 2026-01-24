import React from 'react';
import { MapPin, Star, Calendar, X } from 'lucide-react';
import NotificationBell from '../NotificationBell';
import { DriverSchedule } from '../../services/dataService';

interface DriverHeaderProps {
    driverInfo: {
        name: string;
        rating: number;
        location: string;
    };
    schedules: DriverSchedule[];
    currentDriverId: string | null;
    onLogout: () => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
    driverInfo,
    schedules,
    currentDriverId,
    onLogout
}) => {
    const today = new Date().toISOString().split('T')[0];
    const todaySchedule = schedules.find(s => s.date === today);

    return (
        <header className="bg-white border-b-2 border-emerald-100 shadow-sm p-4 flex items-center justify-between z-50">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain flex-shrink-0" />
                {/* Avatar - Larger */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                    {driverInfo.name.split(' ').map(n => n[0]).join('')}
                </div>

                {/* Driver Info - Larger Text */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="font-bold text-lg text-gray-900 truncate">{driverInfo.name}</h1>
                        <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg border border-yellow-300 flex-shrink-0">
                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-bold text-yellow-700">{driverInfo.rating}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-600 flex-shrink-0" />
                        <p className="text-sm text-gray-700 truncate font-medium">{driverInfo.location}</p>
                    </div>
                    {/* Today's Schedule */}
                    {todaySchedule && (
                        <div className="flex items-center gap-2 mt-1.5">
                            <Calendar size={14} className="text-emerald-600 flex-shrink-0" />
                            <p className="text-sm text-emerald-700 font-semibold">
                                {todaySchedule.is_day_off ? 'Day Off' :
                                    `${todaySchedule.shift_start?.substring(0, 5)} - ${todaySchedule.shift_end?.substring(0, 5)}`}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Icons - Larger Touch Targets */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                {/* Notification Bell */}
                {currentDriverId && (
                    <NotificationBell userId={currentDriverId} variant="light" />
                )}
                <button
                    onClick={onLogout}
                    className="p-3 rounded-xl hover:bg-red-50 transition-all text-gray-500 hover:text-red-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Logout"
                >
                    <X size={20} />
                </button>
            </div>
        </header>
    );
};
