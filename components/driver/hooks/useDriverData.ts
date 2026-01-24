import { useState, useEffect } from 'react';
import { getLocations, setDriverOnlineFor10Hours, getDriverSchedules, DriverSchedule } from '../../../services/dataService';

interface DriverInfo {
    name: string;
    rating: number;
    location: string;
}

export const useDriverData = () => {
    const [driverInfo, setDriverInfo] = useState<DriverInfo>({
        name: 'Mr. Tuan',
        rating: 5,
        location: "Near Don Cipriani's Italian Restaurant"
    });
    const [locations, setLocations] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<DriverSchedule[]>([]);
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Load driver info from localStorage
    useEffect(() => {
        const savedUser = localStorage.getItem('furama_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setDriverInfo({
                    name: user.lastName ? `Mr. ${user.lastName}` : 'Driver',
                    rating: 5,
                    location: "Near Don Cipriani's Italian Restaurant"
                });
            } catch (e) {
                console.error('Failed to parse user from localStorage:', e);
            }
        }
    }, []);

    // Load locations on mount
    useEffect(() => {
        const loadLocations = async () => {
            try {
                const locs = await getLocations();
                setLocations(locs);
            } catch (error) {
                console.error('Failed to load locations:', error);
                setLocations([]);
            }
        };
        loadLocations();
    }, []);

    // Load driver schedules
    useEffect(() => {
        const loadSchedules = async () => {
            const savedUser = localStorage.getItem('furama_user');
            if (!savedUser) return;

            try {
                const user = JSON.parse(savedUser);
                if (!user.id) return;

                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);

                const allSchedules = await getDriverSchedules(String(user.id));
                const upcomingSchedules = allSchedules.filter(s => {
                    const scheduleDate = new Date(s.date);
                    return scheduleDate >= today && scheduleDate <= nextWeek;
                });
                setSchedules(upcomingSchedules);
            } catch (error) {
                console.error('Failed to load driver schedules:', error);
            }
        };

        loadSchedules();
        const interval = setInterval(loadSchedules, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Set driver online status to 10 hours on first login
    useEffect(() => {
        const savedUser = localStorage.getItem('furama_user');
        if (!savedUser) return;

        try {
            const user = JSON.parse(savedUser);
            if (!user.id) return;
            setDriverOnlineFor10Hours(user.id);
        } catch (e) {
            console.error('Failed to set driver online for 10 hours:', e);
        }
    }, []);

    // Update current time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Get current driver ID from localStorage
    const getCurrentDriverId = (): string | null => {
        try {
            const savedUser = localStorage.getItem('furama_user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                return user.roomNumber || user.id || null;
            }
        } catch (error) {
            console.error('Failed to get driver ID from localStorage:', error);
        }
        return null;
    };

    // Get current driver's actual ID (not roomNumber) for matching with ride driverId
    const getCurrentDriverActualId = (): string | null => {
        try {
            const savedUser = localStorage.getItem('furama_user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                return user.id ? user.id.toString() : null;
            }
        } catch (error) {
            console.error('Failed to get driver actual ID from localStorage:', error);
        }
        return null;
    };

    return {
        driverInfo,
        locations,
        schedules,
        currentTime,
        currentDriverId: getCurrentDriverId(),
        currentDriverActualId: getCurrentDriverActualId()
    };
};
