import { useState, useEffect } from 'react';
import {
    getLocations, getLocationsSync,
    getMenu, getMenuSync,
    getEvents, getEventsSync,
    getPromotions, getPromotionsSync,
    getKnowledgeBase, getKnowledgeBaseSync,
    getUsers, getUsersSync,
    getRoomTypes,
    getRooms,
    getUnifiedHistory,
    getRides, getRidesSync,
    getAllDriverSchedulesByDateRange
} from '../services/dataService';
import { Location, MenuItem, ResortEvent, Promotion, KnowledgeItem, User, RoomType, Room, DriverSchedule } from '../types';

export interface AdminData {
    locations: Location[];
    menu: MenuItem[];
    events: ResortEvent[];
    promotions: Promotion[];
    knowledge: KnowledgeItem[];
    users: User[];
    roomTypes: RoomType[];
    rooms: Room[];
    serviceHistory: any[];
    rides: any[];
    driverSchedules: DriverSchedule[];
}

export const useAdminData = () => {
    const [data, setData] = useState<AdminData>({
        locations: [],
        menu: [],
        events: [],
        promotions: [],
        knowledge: [],
        users: [],
        roomTypes: [],
        rooms: [],
        serviceHistory: [],
        rides: [],
        driverSchedules: []
    });
    const [isLoading, setIsLoading] = useState(true);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            // Load locations first - CRITICAL for room types to match location IDs
            let locationsData: Location[];
            try {
                locationsData = await getLocations();
                console.log('Locations loaded from database:', locationsData);
            } catch (error) {
                console.error('Failed to load locations from database, using sync:', error);
                locationsData = getLocationsSync();
            }

            const [menuData, eventsData, promotionsData, roomTypesData] = await Promise.all([
                getMenu().catch(() => getMenuSync()),
                getEvents().catch(() => getEventsSync()),
                getPromotions().catch(() => getPromotionsSync()),
                getRoomTypes().catch(() => [])
            ]);

            // Load knowledge items from API
            let knowledgeData: KnowledgeItem[];
            try {
                knowledgeData = await getKnowledgeBase();
                console.log('Knowledge items loaded from database:', knowledgeData);
            } catch (error) {
                console.error('Failed to load knowledge items from database:', error);
                knowledgeData = getKnowledgeBaseSync();
            }

            // Load users from API
            let usersData: User[];
            try {
                usersData = await getUsers();
                console.log('Users loaded from database:', usersData);
            } catch (error) {
                console.error('Failed to load users from database:', error);
                usersData = getUsersSync();
            }

            // Load service history from API
            let historyData: any[];
            try {
                historyData = await getUnifiedHistory();
                console.log('Service history loaded from database:', historyData);
            } catch (error) {
                console.error('Failed to load service history from database:', error);
                historyData = [];
            }

            // Load rides from API
            let ridesData: any[];
            try {
                ridesData = await getRides();
                console.log('Rides loaded from database:', ridesData);
            } catch (error) {
                console.error('Failed to load rides from database:', error);
                ridesData = getRidesSync();
            }

            // Load rooms
            let roomsData: Room[] = [];
            try {
                roomsData = await getRooms();
            } catch (error) {
                console.error('Failed to load rooms:', error);
            }

            setData({
                locations: locationsData,
                menu: menuData,
                events: eventsData,
                promotions: promotionsData,
                knowledge: knowledgeData,
                users: usersData,
                roomTypes: roomTypesData,
                rooms: roomsData,
                serviceHistory: historyData,
                rides: ridesData,
                driverSchedules: []
            });

            // Debug: Check location ID matches
            console.log('Data loaded - Checking location matches:', {
                locations: locationsData.map(l => ({ id: l.id, name: l.name })),
                roomTypes: roomTypesData.map(rt => ({
                    id: rt.id,
                    name: rt.name,
                    locationId: rt.locationId,
                    matchedLocation: rt.locationId ? locationsData.find(l => String(l.id) === String(rt.locationId))?.name || 'NOT FOUND' : 'NONE'
                }))
            });
        } catch (error) {
            console.error('Failed to load data:', error);
            // Fallback to sync versions
            setData({
                locations: getLocationsSync(),
                menu: getMenuSync(),
                events: getEventsSync(),
                promotions: getPromotionsSync(),
                knowledge: getKnowledgeBaseSync(),
                users: getUsersSync(),
                roomTypes: [],
                rooms: [],
                serviceHistory: [],
                rides: getRidesSync(),
                driverSchedules: []
            });
            // Try to load service history from API even in fallback
            getUnifiedHistory().then(history => {
                setData(prev => ({ ...prev, serviceHistory: history }));
            }).catch(() => {});
        } finally {
            setIsLoading(false);
        }
    };

    const refreshData = async (dataType?: keyof AdminData) => {
        if (dataType) {
            // Refresh specific data type
            try {
                switch (dataType) {
                    case 'locations':
                        const locations = await getLocations().catch(() => getLocationsSync());
                        setData(prev => ({ ...prev, locations }));
                        break;
                    case 'menu':
                        const menu = await getMenu().catch(() => getMenuSync());
                        setData(prev => ({ ...prev, menu }));
                        break;
                    case 'events':
                        const events = await getEvents().catch(() => getEventsSync());
                        setData(prev => ({ ...prev, events }));
                        break;
                    case 'promotions':
                        const promotions = await getPromotions().catch(() => getPromotionsSync());
                        setData(prev => ({ ...prev, promotions }));
                        break;
                    case 'knowledge':
                        const knowledge = await getKnowledgeBase().catch(() => getKnowledgeBaseSync());
                        setData(prev => ({ ...prev, knowledge }));
                        break;
                    case 'users':
                        const users = await getUsers().catch(() => getUsersSync());
                        setData(prev => ({ ...prev, users }));
                        break;
                    case 'rooms':
                        const rooms = await getRooms();
                        setData(prev => ({ ...prev, rooms }));
                        break;
                    case 'rides':
                        const rides = await getRides().catch(() => getRidesSync());
                        setData(prev => ({ ...prev, rides }));
                        break;
                }
            } catch (error) {
                console.error(`Failed to refresh ${dataType}:`, error);
            }
        } else {
            // Refresh all data
            await loadAllData();
        }
    };

    const loadDriverSchedules = async (startDate: string, endDate: string) => {
        try {
            const schedules = await getAllDriverSchedulesByDateRange(startDate, endDate);
            setData(prev => ({ ...prev, driverSchedules: schedules }));
        } catch (error) {
            console.error('Failed to load driver schedules:', error);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    return {
        data,
        isLoading,
        refreshData,
        loadDriverSchedules,
        setData
    };
};
