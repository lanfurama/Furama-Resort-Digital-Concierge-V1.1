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

    const saveSchedule = async () => {
        if (!selectedDriverForSchedule) return;

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
