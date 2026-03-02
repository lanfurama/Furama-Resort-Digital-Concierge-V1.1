import { useState, useEffect } from 'react';
import { getAllDriverSchedulesByDateRange, upsertDriverSchedule, updateDriverSchedule, deleteDriverSchedule } from '../services/dataService';
import { DriverSchedule, UserRole } from '../types';

export const useScheduleManagement = (
    tab: string,
    staffRoleFilter: UserRole | 'ALL',
    users: any[]
) => {
    const [driverSchedules, setDriverSchedules] = useState<DriverSchedule[]>([]);
    const [selectedDriverForSchedule, setSelectedDriverForSchedule] = useState<string | null>(null);
    const [scheduleDateRange, setScheduleDateRange] = useState<{ start: string; end: string }>({
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    const [editingSchedule, setEditingSchedule] = useState<DriverSchedule | null>(null);
    const [newSchedule, setNewSchedule] = useState<Omit<DriverSchedule, 'id' | 'driver_id' | 'created_at' | 'updated_at'>>({
        date: new Date().toISOString().split('T')[0],
        shift_start: '08:00:00',
        shift_end: '17:00:00',
        is_day_off: false,
        notes: null
    });

    // Load driver schedules when USERS tab is active and filter is DRIVER
    useEffect(() => {
        if (tab !== 'USERS' || staffRoleFilter !== UserRole.DRIVER) return;

        const loadSchedules = async () => {
            try {
                const schedules = await getAllDriverSchedulesByDateRange(
                    scheduleDateRange.start,
                    scheduleDateRange.end
                );
                setDriverSchedules(schedules);
            } catch (error) {
                console.error('Failed to load driver schedules:', error);
            }
        };

        loadSchedules();
    }, [tab, staffRoleFilter, scheduleDateRange.start, scheduleDateRange.end]);

    const refreshSchedules = async () => {
        try {
            const schedules = await getAllDriverSchedulesByDateRange(
                scheduleDateRange.start,
                scheduleDateRange.end
            );
            setDriverSchedules(schedules);
        } catch (error) {
            console.error('Failed to refresh schedules:', error);
        }
    };

    const validateShiftSchedule = (shiftStart: string | null, shiftEnd: string | null, isDayOff: boolean): string | null => {
        if (isDayOff) return null; // Day off không cần validation
        
        if (!shiftStart || !shiftEnd) {
            return 'Shift start and end times are required for work days.';
        }

        const startTime = shiftStart.substring(0, 5); // HH:MM
        const endTime = shiftEnd.substring(0, 5); // HH:MM
        
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        // Ca ngày: 07:00 - 23:00
        const dayShiftStart = 7 * 60; // 07:00
        const dayShiftEnd = 23 * 60; // 23:00
        
        // Ca đêm: 22:00 - 07:00 (qua đêm)
        const nightShiftStart = 22 * 60; // 22:00
        const nightShiftEnd = 7 * 60; // 07:00
        
        // Kiểm tra ca ngày
        const isDayShift = startMinutes >= dayShiftStart && endMinutes <= dayShiftEnd && startMinutes < endMinutes;
        
        // Kiểm tra ca đêm (qua đêm)
        const isNightShift = (startMinutes >= nightShiftStart && endMinutes <= 24 * 60) || 
                            (startMinutes >= 0 && endMinutes <= nightShiftEnd) ||
                            (startMinutes >= nightShiftStart && endMinutes <= nightShiftEnd);
        
        if (!isDayShift && !isNightShift) {
            return 'Invalid shift time. Day shift: 07:00-23:00, Night shift: 22:00-07:00';
        }
        
        return null;
    };

    const saveSchedule = async () => {
        if (!selectedDriverForSchedule) return;

        // Validate shift schedule
        if (!newSchedule.is_day_off) {
            const validationError = validateShiftSchedule(
                newSchedule.shift_start || null,
                newSchedule.shift_end || null,
                newSchedule.is_day_off || false
            );
            
            if (validationError) {
                alert(validationError);
                return;
            }
        }

        try {
            if (editingSchedule) {
                await updateDriverSchedule(selectedDriverForSchedule, newSchedule);
                alert('Schedule updated successfully!');
                setEditingSchedule(null);
            } else {
                await upsertDriverSchedule(selectedDriverForSchedule, newSchedule);
                alert('Schedule saved successfully!');
            }
            await refreshSchedules();
            setNewSchedule({
                date: new Date().toISOString().split('T')[0],
                shift_start: '08:00:00',
                shift_end: '17:00:00',
                is_day_off: false,
                notes: null
            });
        } catch (error: any) {
            alert(`Failed to save schedule: ${error?.message || 'Unknown error'}`);
        }
    };

    const deleteSchedule = async (driverId: string, date: string) => {
        if (!confirm('Delete this schedule?')) return;

        try {
            await deleteDriverSchedule(driverId, date);
            await refreshSchedules();
            if (editingSchedule?.date === date) {
                setEditingSchedule(null);
                setNewSchedule({
                    date: new Date().toISOString().split('T')[0],
                    shift_start: '08:00:00',
                    shift_end: '17:00:00',
                    is_day_off: false,
                    notes: null
                });
            }
        } catch (error: any) {
            alert(`Failed to delete schedule: ${error?.message || 'Unknown error'}`);
        }
    };

    return {
        driverSchedules,
        selectedDriverForSchedule,
        setSelectedDriverForSchedule,
        scheduleDateRange,
        setScheduleDateRange,
        editingSchedule,
        setEditingSchedule,
        newSchedule,
        setNewSchedule,
        refreshSchedules,
        saveSchedule,
        deleteSchedule
    };
};
