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

    // Load driver schedules - optimized polling for mobile
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        let isMounted = true;
        
        const loadSchedules = async () => {
            const savedUser = localStorage.getItem('furama_user');
            if (!savedUser || !isMounted) return;

            try {
                const user = JSON.parse(savedUser);
                if (!user.id || !isMounted) return;

                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);

                const allSchedules = await getDriverSchedules(String(user.id));
                if (!isMounted) return;
                
                const upcomingSchedules = allSchedules.filter(s => {
                    const scheduleDate = new Date(s.date);
                    return scheduleDate >= today && scheduleDate <= nextWeek;
                });
                setSchedules(upcomingSchedules);
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Failed to load driver schedules:', error);
                }
            }
        };

        // Load immediately
        loadSchedules();
        
        // Adaptive polling based on visibility
        const setupPolling = () => {
            if (interval) clearInterval(interval);
            
            if (document.hidden) {
                // Background: poll every 10 minutes
                interval = setInterval(loadSchedules, 10 * 60 * 1000);
            } else {
                // Foreground: poll every 5 minutes
                interval = setInterval(loadSchedules, 5 * 60 * 1000);
            }
        };
        
        setupPolling();
        const handleVisibilityChange = () => setupPolling();
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            isMounted = false;
            if (interval) clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
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

    // Update current time - adaptive frequency for mobile performance
    useEffect(() => {
        let interval: NodeJS.Timeout;
        let isActive = true;
        
        const updateTime = () => {
            if (isActive) {
                setCurrentTime(Date.now());
            }
        };
        
        // Check visibility and adjust interval
        const handleVisibilityChange = () => {
            if (interval) clearInterval(interval);
            
            if (document.hidden) {
                // Background: update every 5 seconds
                interval = setInterval(updateTime, 5000);
            } else {
                // Foreground: update every 2 seconds (reduced from 1s for mobile performance)
                interval = setInterval(updateTime, 2000);
            }
        };
        
        // Initial setup
        handleVisibilityChange();
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            isActive = false;
            if (interval) clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
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
