import React from 'react';
import { Calendar } from 'lucide-react';
import { DriverSchedule } from '../../services/dataService';

interface ScheduleSectionProps {
    schedules: DriverSchedule[];
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({ schedules }) => {
    if (schedules.length === 0) return null;

    return (
        <div className="mt-6 bg-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-200 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Calendar size={20} className="text-emerald-600 sm:w-[22px] sm:h-[22px]" />
                <h3 className="font-bold text-base sm:text-lg text-gray-800">Upcoming Schedule</h3>
            </div>
            <div className="space-y-2 sm:space-y-3 max-h-[220px] sm:max-h-[250px] overflow-y-auto">
                {schedules.slice(0, 7).map(schedule => {
                    const scheduleDate = new Date(schedule.date);
                    const isToday = scheduleDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                    return (
                        <div key={schedule.id} className={`flex items-center justify-between p-3 rounded-xl ${isToday ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 shadow-md' : 'bg-gray-50 border border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-700 min-w-[100px]">
                                    {scheduleDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                {schedule.is_day_off ? (
                                    <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-bold border border-red-300">Day Off</span>
                                ) : (
                                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-300">
                                        {schedule.shift_start?.substring(0, 5)} - {schedule.shift_end?.substring(0, 5)}
                                    </span>
                                )}
                            </div>
                            {isToday && (
                                <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">Today</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
