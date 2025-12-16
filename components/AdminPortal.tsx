
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Utensils, Sparkles, X, Calendar, Megaphone, BrainCircuit, Filter, Users, Shield, FileText, Upload, UserCheck, Download, Home, List, History, Clock, Star, Key, Car, Settings, RefreshCw, Zap, Grid3x3, CheckCircle, Map, AlertCircle, Info, Brain, ArrowRight, Loader2, Pencil } from 'lucide-react';
import { getLocations, getLocationsSync, addLocation, updateLocation, deleteLocation, getMenu, getMenuSync, addMenuItem, updateMenuItem, deleteMenuItem, getEvents, getEventsSync, addEvent, deleteEvent, getPromotions, getPromotionsSync, addPromotion, updatePromotion, deletePromotion, getKnowledgeBase, getKnowledgeBaseSync, addKnowledgeItem, deleteKnowledgeItem, getUsers, getUsersSync, addUser, updateUser, deleteUser, resetUserPassword, importGuestsFromCSV, getGuestCSVContent, getRoomTypes, addRoomType, updateRoomType, deleteRoomType, getRooms, addRoom, deleteRoom, importRoomsFromCSV, getUnifiedHistory, getRides, getRidesSync, updateRideStatus } from '../services/dataService';
import { parseAdminInput, generateTranslations } from '../services/geminiService';
import { Location, MenuItem, ResortEvent, Promotion, KnowledgeItem, User, UserRole, Department, RoomType, Room, RideRequest, BuggyStatus } from '../types';
import Loading from './Loading';
import ReceptionPortal from './ReceptionPortal';

interface AdminPortalProps {
    onLogout: () => void;
    user: User;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ onLogout, user }) => {
    const [tab, setTab] = useState<'LOCATIONS' | 'MENU' | 'EVENTS' | 'PROMOS' | 'KNOWLEDGE' | 'USERS' | 'GUESTS' | 'ROOMS' | 'HISTORY' | 'FLEET'>('LOCATIONS');
    
    // Data State
    const [locations, setLocations] = useState<Location[]>([]);
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [events, setEvents] = useState<ResortEvent[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [serviceHistory, setServiceHistory] = useState<any[]>([]);
    const [rides, setRides] = useState<RideRequest[]>([]);
    
    // Fleet Config State
    const [showFleetSettings, setShowFleetSettings] = useState(false);
    const [fleetConfig, setFleetConfig] = useState({
        maxWaitTimeBeforeAutoAssign: 300, // seconds
        autoAssignEnabled: true
    });
    
    // Fleet UI State
    const [driverViewMode, setDriverViewMode] = useState<'LIST' | 'MAP'>('LIST');
    const [showAIAssignment, setShowAIAssignment] = useState(false);
    const [aiAssignmentData, setAIAssignmentData] = useState<any>(null);
    const lastAutoAssignRef = React.useRef<number>(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    
    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Load locations first - CRITICAL for room types to match location IDs
                let locationsData: Location[];
                try {
                    locationsData = await getLocations();
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
                } catch (error) {
                    console.error('Failed to load knowledge items from database:', error);
                    knowledgeData = getKnowledgeBaseSync();
                }
                
                setLocations(locationsData);
                setMenu(menuData);
                setEvents(eventsData);
                setPromotions(promotionsData);
                setRoomTypes(roomTypesData);
                setKnowledge(knowledgeData);
                // Load users from API
                try {
                    const usersData = await getUsers();
                    setUsers(usersData);
                } catch (error) {
                    console.error('Failed to load users from database:', error);
                    setUsers(getUsersSync());
                }
                // Load service history from API
                try {
                    const historyData = await getUnifiedHistory();
                    setServiceHistory(historyData);
                } catch (error) {
                    console.error('Failed to load service history from database:', error);
                    setServiceHistory([]);
                }
                // Load rides from API
                try {
                    const ridesData = await getRides();
                    setRides(ridesData);
                } catch (error) {
                    console.error('Failed to load rides from database:', error);
                    setRides(getRidesSync());
                }
                
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
                const fallbackLocations = getLocationsSync();
                setLocations(fallbackLocations);
                setMenu(getMenuSync());
                setEvents(getEventsSync());
                setPromotions(getPromotionsSync());
                setKnowledge(getKnowledgeBaseSync());
                setUsers(getUsersSync());
                // Try to load service history from API even in fallback
                getUnifiedHistory().then(setServiceHistory).catch(() => setServiceHistory([]));
            } finally {
                setIsLoading(false);
            }
        };
        
        loadData();
        getRooms().then(setRooms).catch(console.error);
        
        // Load fleet config from localStorage
        const savedConfig = localStorage.getItem('fleetConfig');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                setFleetConfig(parsed);
            } catch (error) {
                console.error('Failed to load fleet config:', error);
            }
        }
    }, []);
    
    // Auto-refresh rides and users when FLEET tab is active
    useEffect(() => {
        if (tab !== 'FLEET') return;
        
        const refreshInterval = setInterval(async () => {
            try {
                const [refreshedRides, refreshedUsers] = await Promise.all([
                    getRides().catch(() => getRidesSync()),
                    getUsers().catch(() => getUsersSync())
                ]);
                setRides(refreshedRides);
                setUsers(refreshedUsers);
            } catch (error) {
                console.error('Failed to auto-refresh fleet data:', error);
            }
        }, 3000); // Refresh every 3 seconds
        
        return () => clearInterval(refreshInterval);
    }, [tab]);

    // Auto-assign logic: Automatically assign rides that have been waiting too long
    useEffect(() => {
        if (!fleetConfig.autoAssignEnabled || tab !== 'FLEET') return;

        const checkAndAutoAssign = async () => {
            const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING);
            if (pendingRides.length === 0) return;

            const now = Date.now();
            if (now - lastAutoAssignRef.current < 10000) {
                return;
            }

            const ridesToAutoAssign = pendingRides.filter(ride => {
                const waitTime = Math.floor((now - ride.timestamp) / 1000);
                return waitTime >= fleetConfig.maxWaitTimeBeforeAutoAssign;
            });

            if (ridesToAutoAssign.length > 0) {
                console.log(`[Auto-Assign] Found ${ridesToAutoAssign.length} ride(s) waiting over ${fleetConfig.maxWaitTimeBeforeAutoAssign}s, triggering auto-assign...`);
                lastAutoAssignRef.current = now;
                await handleAutoAssign(true);
            }
        };

        const autoAssignInterval = setInterval(checkAndAutoAssign, 5000);
        
        return () => clearInterval(autoAssignInterval);
    }, [rides, fleetConfig.autoAssignEnabled, fleetConfig.maxWaitTimeBeforeAutoAssign, tab]);
    
    // UI State
    const [isParsing, setIsParsing] = useState(false);
    const [aiInput, setAiInput] = useState('');
    const [showAiInput, setShowAiInput] = useState(false);
    const [menuFilter, setMenuFilter] = useState<'ALL' | 'Dining' | 'Spa' | 'Pool' | 'Butler'>('ALL');
    const [locationFilter, setLocationFilter] = useState<'ALL' | 'VILLA' | 'FACILITY' | 'RESTAURANT'>('ALL');

    // New User State (Staff)
    const [newUser, setNewUser] = useState<Partial<User>>({ role: UserRole.STAFF, department: 'Dining' });
    const [showUserForm, setShowUserForm] = useState(false);

    // Reset Password State
    const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
    const [resetNewPassword, setResetNewPassword] = useState('');

    // Guest Management State
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [newGuest, setNewGuest] = useState<{lastName: string, room: string, type: string, checkIn: string, checkOut: string, language: string}>({
        lastName: '', room: '', type: 'Ocean Suite', checkIn: '', checkOut: '', language: 'English'
    });
    const [csvFile, setCsvFile] = useState<File | null>(null);

    // Rooms Tab State
    const [roomView, setRoomView] = useState<'TYPES' | 'LIST'>('TYPES');
    const [showRoomTypeForm, setShowRoomTypeForm] = useState(false);
    const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
    const [newRoomType, setNewRoomType] = useState<Partial<RoomType>>({ name: '', description: '', locationId: '' });
    
    // Promotion Edit State
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [showPromotionForm, setShowPromotionForm] = useState(false);
    const [newPromotion, setNewPromotion] = useState<Partial<Promotion>>({ title: '', description: '', discount: '', validUntil: '', imageColor: 'bg-emerald-500', imageUrl: '' });
    
    // Location Edit State
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [showLocationForm, setShowLocationForm] = useState(false);
    const [newLocation, setNewLocation] = useState<Partial<Location>>({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
    
    // Menu Item Edit State
    const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
    const [showMenuItemForm, setShowMenuItemForm] = useState(false);
    const [newMenuItem, setNewMenuItem] = useState<Partial<MenuItem>>({ name: '', price: 0, category: 'Dining', description: '' });
    
    // Guest Edit State
    const [editingGuest, setEditingGuest] = useState<User | null>(null);
    const [showGuestEditForm, setShowGuestEditForm] = useState(false);
    const [editGuest, setEditGuest] = useState<Partial<User>>({ lastName: '', roomNumber: '', villaType: '', language: 'English', checkIn: '', checkOut: '' });
    
    const [showRoomForm, setShowRoomForm] = useState(false);
    const [newRoom, setNewRoom] = useState<{number: string, typeId: string}>({ number: '', typeId: '' });
    const [roomCsvFile, setRoomCsvFile] = useState<File | null>(null);

    // History Tab State
    const [historyFilterType, setHistoryFilterType] = useState<string>('ALL');
    const [historyFilterDate, setHistoryFilterDate] = useState<string>('');

    const refreshData = async () => {
        // Load data asynchronously from API
        const [locationsData, menuData, eventsData, promotionsData, knowledgeData] = await Promise.all([
            getLocations().catch(() => getLocationsSync()),
            getMenu().catch(() => getMenuSync()),
            getEvents().catch(() => getEventsSync()),
            getPromotions().catch(() => getPromotionsSync()),
            getKnowledgeBase().catch(() => getKnowledgeBaseSync())
        ]);
        
        setLocations(locationsData);
        setMenu(menuData);
        setEvents(eventsData);
        setPromotions(promotionsData);
        setKnowledge(knowledgeData);
        // Refresh users from API
        try {
            const usersData = await getUsers();
            setUsers(usersData);
            console.log('Users refreshed:', usersData);
        } catch (error) {
            console.error('Failed to refresh users:', error);
            setUsers(getUsersSync());
        }
        // Refresh room types and rooms asynchronously
        getRoomTypes().then(setRoomTypes).catch(console.error);
        getRooms().then(setRooms).catch(console.error);
        // Refresh service history from API
        try {
            const historyData = await getUnifiedHistory();
            setServiceHistory(historyData);
        } catch (error) {
            console.error('Failed to refresh service history:', error);
            setServiceHistory([]);
        }
    };

    // Helper: Resolve location coordinates from location name
    const resolveLocationCoordinates = (locationName: string): { lat: number; lng: number } | null => {
        if (!locationName || locationName === "Unknown Location") return null;
        
        if (locationName.startsWith("GPS:")) {
            const parts = locationName.replace("GPS:", "").split(",");
            if (parts.length === 2) {
                const lat = parseFloat(parts[0]);
                const lng = parseFloat(parts[1]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    return { lat, lng };
                }
            }
        }
        
        let loc = locations.find(l => 
            locationName.toLowerCase().trim() === l.name.toLowerCase().trim()
        );
        
        if (!loc) {
            loc = locations.find(l => 
                locationName.toLowerCase().includes(l.name.toLowerCase()) || 
                l.name.toLowerCase().includes(locationName.toLowerCase())
            );
        }
        
        if (loc) {
            return { lat: loc.lat, lng: loc.lng };
        }
        
        return null;
    };

    // Helper: Calculate distance between two coordinates using Haversine formula (in meters)
    const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
        const R = 6371000; // Earth radius in meters
        const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
        const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
    };

    // Helper: Get driver's current or expected location
    const getDriverLocation = (driver: User): string => {
        const driverIdStr = driver.id ? String(driver.id) : '';
        
        const driverActiveRides = rides.filter(r => {
            const rideDriverId = r.driverId ? String(r.driverId) : '';
            return rideDriverId === driverIdStr && 
                (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
        });
        
        if (driverActiveRides.length > 0) {
            return driverActiveRides[0].destination;
        }
        
        // Driver is available - check if we have GPS coordinates from database
        if (driver.currentLat !== undefined && driver.currentLng !== undefined) {
            // Find nearest location to driver's GPS coordinates
            let nearestLocation = locations[0];
            let minDistance = Infinity;
            
            locations.forEach(loc => {
                const dist = Math.sqrt(
                    Math.pow(driver.currentLat! - loc.lat, 2) + Math.pow(driver.currentLng! - loc.lng, 2)
                );
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestLocation = loc;
                }
            });
            
            // If within ~100 meters of a known location, show location name
            if (minDistance < 0.001) {
                return `Near ${nearestLocation.name}`;
            } else {
                // Show GPS coordinates if not near any known location
                return `GPS: ${driver.currentLat.toFixed(6)}, ${driver.currentLng.toFixed(6)}`;
            }
        }
        
        // Fallback: try to get their location from locations array (old method)
        if (locations.length > 0) {
            const driverLocation = locations[parseInt(driver.id || '0') % locations.length];
            return driverLocation?.name || "Unknown Location";
        }
        
        return "Unknown Location";
    };

    // Helper: Get online drivers count
    const getOnlineDriversCount = (): number => {
        const driverUsers = users.filter(u => u.role === UserRole.DRIVER);
        return driverUsers.filter(driver => {
            const driverIdStr = driver.id ? String(driver.id) : '';
            const hasActiveRide = rides.some(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverIdStr && 
                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
            });
            if (hasActiveRide) return true;
            
            if (driver.updatedAt) {
                const timeSinceUpdate = Date.now() - driver.updatedAt;
                if (timeSinceUpdate < 120000) { // 2 minutes
                    return true;
                }
                return false;
            }
            
            return false;
        }).length;
    };

    // Helper: Get pending requests count
    const getPendingRequestsCount = (): number => {
        return rides.filter(r => r.status === BuggyStatus.SEARCHING).length;
    };

    // Helper: Calculate cost for a (driver, ride) pair
    const calculateAssignmentCost = (driver: User, ride: RideRequest): number => {
        const driverIdStr = driver.id ? String(driver.id) : '';
        
        // Check driver status
        const driverActiveRides = rides.filter(r => {
            const rideDriverId = r.driverId ? String(r.driverId) : '';
            return rideDriverId === driverIdStr && 
                (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
        });
        const isAvailable = driverActiveRides.length === 0;
        const currentRide = driverActiveRides[0];
        
        // Check if driver has GPS location
        const hasGpsLocation = driver.currentLat !== undefined && driver.currentLng !== undefined;
        
        // Calculate wait time in seconds (longer wait = higher priority = lower cost)
        const waitTimeSeconds = Math.floor((Date.now() - ride.timestamp) / 1000);
        const waitTimeBonus = waitTimeSeconds * 10; // Each second of wait reduces cost by 10 points
        
        let cost = 0;
        
        if (hasGpsLocation) {
            // Driver has GPS location: Use distance-based calculation
            const driverCoords = { lat: driver.currentLat!, lng: driver.currentLng! };
            const pickupCoords = resolveLocationCoordinates(ride.pickup);
            
            if (!pickupCoords) {
                return 1000000; // Very high cost if can't resolve pickup
            }
            
            // Calculate distance from driver's current GPS location to pickup point (in meters)
            let distance = calculateDistance(driverCoords, pickupCoords);
            cost = distance; // Start with distance as base cost
            
            if (isAvailable) {
                // Driver is AVAILABLE: Low cost (subtract a bonus)
                cost -= 5000; // Available drivers get priority
            } else if (currentRide) {
                // Driver is BUSY: Check for Chain Trip opportunity
                const dropoffCoords = resolveLocationCoordinates(currentRide.destination);
                if (dropoffCoords) {
                    const chainDistance = calculateDistance(dropoffCoords, pickupCoords);
                    // If drop-off is very close to new pickup (Chain Trip), give very low cost
                    if (chainDistance < 200) { // Within 200 meters = Chain Trip
                        cost = chainDistance - 10000; // Very low cost for chain trips
                    } else {
                        // Busy driver but not a chain trip: higher cost
                        cost += 10000; // Penalty for busy drivers
                    }
                } else {
                    // Can't resolve drop-off location, use distance from current GPS location
                    cost += 10000; // Penalty for busy drivers
                }
            }
        } else {
            // Driver does NOT have GPS location: Use time-based priority
            // Priority: Driver near completion of current ride > Available driver > Busy driver
            
            if (isAvailable) {
                // Driver is AVAILABLE: Medium priority (not as good as near-completion)
                cost = 5000; // Base cost for available drivers without GPS
            } else if (currentRide) {
                // Driver is BUSY: Calculate how close they are to completing current ride
                const now = Date.now();
                let rideDuration = 0;
                
                // Calculate ride duration based on status
                if (currentRide.status === BuggyStatus.ON_TRIP && currentRide.pickedUpAt) {
                    // Driver is on trip: time since pickup
                    rideDuration = now - currentRide.pickedUpAt;
                } else if (currentRide.status === BuggyStatus.ARRIVING && currentRide.confirmedAt) {
                    // Driver is arriving: time since assignment
                    rideDuration = now - currentRide.confirmedAt;
                } else if (currentRide.status === BuggyStatus.ASSIGNED && currentRide.confirmedAt) {
                    // Driver is assigned: time since assignment
                    rideDuration = now - currentRide.confirmedAt;
                }
                
                // Average ride duration is about 5-10 minutes (300000-600000 ms)
                // Drivers who have been on trip for > 5 minutes are likely near completion
                const rideDurationMinutes = rideDuration / (1000 * 60);
                
                if (rideDurationMinutes >= 5) {
                    // Driver is likely near completion: HIGH PRIORITY (very low cost)
                    // The longer the ride, the lower the cost (closer to completion)
                    cost = 1000 - (rideDurationMinutes - 5) * 200; // Lower cost for longer rides
                    cost = Math.max(0, cost); // Don't go negative
                } else if (rideDurationMinutes >= 3) {
                    // Driver is getting close: Medium-high priority
                    cost = 2000;
                } else {
                    // Driver just started: Lower priority
                    cost = 8000; // Higher cost for drivers who just started
                }
                
                // Also check for chain trip opportunity (if we can resolve locations)
                const dropoffCoords = resolveLocationCoordinates(currentRide.destination);
                const pickupCoords = resolveLocationCoordinates(ride.pickup);
                if (dropoffCoords && pickupCoords) {
                    const chainDistance = calculateDistance(dropoffCoords, pickupCoords);
                    if (chainDistance < 200) {
                        // Chain trip: Very high priority
                        cost = chainDistance - 10000; // Very low cost for chain trips
                    }
                }
            } else {
                // Driver is OFFLINE or unknown status: Very high cost
                cost = 100000;
            }
        }
        
        // Subtract wait time bonus (longer wait = lower cost = higher priority)
        cost -= waitTimeBonus;
        
        return cost;
    };

    // AI Auto-Assign Logic with Cost-Based Algorithm
    const handleAutoAssign = async (isAutoTriggered: boolean = false) => {
        const pendingRidesList = rides.filter(r => r.status === BuggyStatus.SEARCHING);
        const driverUsers = users.filter(u => u.role === UserRole.DRIVER);
        const totalDrivers = driverUsers.length;
        
        // Show modal with error if no pending rides (only if manual trigger)
        if (pendingRidesList.length === 0) {
            if (!isAutoTriggered) {
                setAIAssignmentData({
                    status: 'error',
                    pendingRides: [],
                    onlineDrivers: [],
                    assignments: [],
                    errorMessage: `⚠️ Không có yêu cầu nào đang chờ được gán.\n\n⚠️ No pending rides to assign.\n\n📊 Trạng thái / Status:\n- Pending Requests: 0\n- Total Drivers: ${totalDrivers}\n- Online Drivers: ${getOnlineDriversCount()}`
                });
                setShowAIAssignment(true);
            }
            return;
        }

        // Get all drivers (including busy ones for chain trip opportunities)
        const allDrivers = driverUsers;
        
        if (allDrivers.length === 0) {
            if (!isAutoTriggered) {
                setAIAssignmentData({
                    status: 'error',
                    pendingRides: pendingRidesList,
                    onlineDrivers: [],
                    assignments: [],
                    errorMessage: `❌ Không có tài xế nào trong hệ thống.\n\n❌ No drivers available at the moment.\n\n📊 Trạng thái / Status:\n- Pending Requests: ${pendingRidesList.length}\n- Total Drivers: 0\n- Online Drivers: 0`
                });
                setShowAIAssignment(true);
            }
            return;
        }
        
        // Check if there are any online drivers
        const onlineDrivers = allDrivers.filter(driver => {
            const driverIdStr = driver.id ? String(driver.id) : '';
            const hasActiveRide = rides.some(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverIdStr && 
                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
            });
            if (hasActiveRide) return true;
            
            if (driver.updatedAt) {
                const timeSinceUpdate = Date.now() - driver.updatedAt;
                if (timeSinceUpdate < 120000) {
                    return true;
                }
            }
            
            return false;
        });
        
        const offlineDrivers = totalDrivers - onlineDrivers.length;
        
        if (onlineDrivers.length === 0) {
            if (!isAutoTriggered) {
                setAIAssignmentData({
                    status: 'error',
                    pendingRides: pendingRidesList,
                    onlineDrivers: [],
                    assignments: [],
                    errorMessage: `⚠️ Tất cả tài xế đang offline.\n\n⚠️ All drivers are offline.\n\n📊 Trạng thái / Status:\n- Pending Requests: ${pendingRidesList.length}\n- Total Drivers: ${totalDrivers}\n- Online Drivers: 0\n- Offline Drivers: ${offlineDrivers}`
                });
                setShowAIAssignment(true);
            }
            return;
        }

        // Show modal with analyzing status (only if manual trigger)
        if (!isAutoTriggered) {
            setAIAssignmentData({
                status: 'analyzing',
                pendingRides: pendingRidesList,
                onlineDrivers: onlineDrivers,
                assignments: []
            });
            setShowAIAssignment(true);
        }

        // Simulate AI analysis delay (only if showing modal)
        if (!isAutoTriggered) {
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        // Calculate cost for all (driver, ride) pairs
        const assignments: Array<{ driver: User; ride: RideRequest; cost: number }> = [];
        
        for (const ride of pendingRidesList) {
            for (const driver of allDrivers) {
                const cost = calculateAssignmentCost(driver, ride);
                assignments.push({ driver, ride, cost });
            }
        }
        
        // Sort by cost (lowest first)
        assignments.sort((a, b) => a.cost - b.cost);
        
        // Update to matching status (only if showing modal)
        if (!isAutoTriggered) {
            setAIAssignmentData(prev => prev ? { ...prev, status: 'matching' } : null);
            await new Promise(resolve => setTimeout(resolve, 600));
        }
        
        // Greedy assignment: assign each ride to the best available driver
        const assignedRides = new Set<string>();
        const assignedDrivers = new Set<string>();
        const finalAssignments: Array<{ driver: User; ride: RideRequest; cost: number; isChainTrip?: boolean }> = [];
        
        for (const assignment of assignments) {
            const rideId = assignment.ride.id;
            const driverId = assignment.driver.id ? String(assignment.driver.id) : '';
            
            if (assignedRides.has(rideId) || assignedDrivers.has(driverId)) {
                continue;
            }
            
            const driverActiveRides = rides.filter(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverId && 
                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
            });
            
            let isChainTrip = false;
            if (driverActiveRides.length > 0) {
                if (assignment.cost > -5000) {
                    continue;
                }
                isChainTrip = true;
            }
            
            assignedRides.add(rideId);
            assignedDrivers.add(driverId);
            finalAssignments.push({ ...assignment, isChainTrip });
        }

        // Update modal with assignments (only if showing modal)
        if (!isAutoTriggered) {
            setAIAssignmentData(prev => prev ? { ...prev, status: 'matching', assignments: finalAssignments } : null);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Execute assignments
        let assignmentCount = 0;
        for (const { driver, ride } of finalAssignments) {
            try {
                await updateRideStatus(ride.id, BuggyStatus.ASSIGNED, driver.id, 5);
                assignmentCount++;
            } catch (error) {
                console.error(`Failed to assign ride ${ride.id} to driver ${driver.id}:`, error);
            }
        }

        // Update to completed status (only if showing modal)
        if (!isAutoTriggered) {
            setAIAssignmentData(prev => prev ? { ...prev, status: 'completed' } : null);
        } else {
        }

        // Refresh data after assignments
        try {
            const refreshedRides = await getRides();
            setRides(refreshedRides);
        } catch (error) {
            console.error('Failed to refresh rides after assignment:', error);
            setRides(getRidesSync());
        }
    };

    const handleAiSubmit = async () => {
        if (!aiInput.trim()) return;
        setIsParsing(true);
        
        let type: any = 'LOCATION';
        if (tab === 'MENU') type = 'MENU_ITEM';
        if (tab === 'EVENTS') type = 'RESORT_EVENT';
        if (tab === 'PROMOS') type = 'PROMOTION';
        if (tab === 'KNOWLEDGE') type = 'KNOWLEDGE_ITEM';
        if (tab === 'ROOMS' && roomView === 'LIST') type = 'ROOM_INVENTORY';

        const result = await parseAdminInput(aiInput, type);
        
        // Auto-Translate Content if applicable
        if (result && (tab === 'MENU' || tab === 'EVENTS' || tab === 'PROMOS')) {
             let contentToTranslate: Record<string, string> = {};
             if (tab === 'MENU') {
                 contentToTranslate = { name: result.name, description: result.description };
             } else if (tab === 'EVENTS') {
                 contentToTranslate = { title: result.title, description: result.description, location: result.location };
             } else if (tab === 'PROMOS') {
                 contentToTranslate = { title: result.title, description: result.description, discount: result.discount };
             }

             if (Object.keys(contentToTranslate).length > 0) {
                 const translations = await generateTranslations(contentToTranslate);
                 result.translations = translations;
             }
        }

        setIsParsing(false);

        if (result) {
            try {
                if (tab === 'LOCATIONS') await addLocation(result as Location);
                else if (tab === 'MENU') {
                    await addMenuItem(result as MenuItem);
                    // Refresh menu specifically after adding
                    try {
                        const refreshedMenu = await getMenu();
                        setMenu(refreshedMenu);
                        console.log('Menu refreshed after add:', refreshedMenu);
                    } catch (error) {
                        console.error('Failed to refresh menu after add:', error);
                    }
                }
                else if (tab === 'EVENTS') {
                    await addEvent(result as ResortEvent);
                    // Refresh events specifically after adding
                    try {
                        const refreshedEvents = await getEvents();
                        setEvents(refreshedEvents);
                    } catch (error) {
                        console.error('Failed to refresh events after add:', error);
                    }
                }
                else if (tab === 'PROMOS') {
                    if (editingPromotion) {
                        await updatePromotion(editingPromotion.id, result as Promotion);
                        setEditingPromotion(null);
                        alert(`Promotion "${result.title}" updated successfully!`);
                    } else {
                    await addPromotion(result as Promotion);
                    }
                    // Refresh promotions specifically after adding/updating
                    try {
                        const refreshedPromotions = await getPromotions();
                        setPromotions(refreshedPromotions);
                    } catch (error) {
                        console.error('Failed to refresh promotions after add/update:', error);
                    }
                }
                else if (tab === 'KNOWLEDGE') {
                    await addKnowledgeItem(result as KnowledgeItem);
                    // Refresh knowledge specifically after adding
                    try {
                        const refreshedKnowledge = await getKnowledgeBase();
                        setKnowledge(refreshedKnowledge);
                    } catch (error) {
                        console.error('Failed to refresh knowledge after add:', error);
                    }
                }
                else if (tab === 'ROOMS' && roomView === 'LIST') {
                 // Map typeName to TypeId
                 const typeName = result.typeName;
                 const typeObj = roomTypes.find(rt => rt.name.toLowerCase() === typeName.toLowerCase());
                 if (typeObj) {
                     await addRoom({ id: '', number: result.number, typeId: typeObj.id, status: 'Available' });
                 } else {
                     alert(`Room Type '${typeName}' not found. Please create it first.`);
                     return;
                 }
            }
            
            await refreshData();
            setAiInput('');
            setShowAiInput(false);
            } catch (error: any) {
                console.error('Failed to add item:', error);
                alert(`Failed to add item: ${error?.message || 'Unknown error'}. Please check console for details.`);
            }
        }
    };

    const handleAddUser = async () => {
        if (!newUser.lastName || !newUser.roomNumber) {
            alert('Please enter both name and username.');
            return;
        }
        try {
            await addUser({
                lastName: newUser.lastName,
                roomNumber: newUser.roomNumber,
                role: newUser.role || UserRole.STAFF,
                department: newUser.department || 'All',
                villaType: 'Staff',
                password: '123' // Default password
            });
            console.log('User added successfully');
            alert(`Staff "${newUser.lastName}" created successfully!`);
            setNewUser({ role: UserRole.STAFF, department: 'Dining' });
            setShowUserForm(false);
            // Refresh users specifically after adding
            try {
                const refreshedUsers = await getUsers();
                setUsers(refreshedUsers);
                console.log('Users refreshed after add:', refreshedUsers);
            } catch (error) {
                console.error('Failed to refresh users after add:', error);
            }
            await refreshData();
        } catch (error: any) {
            console.error('Failed to add user:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            alert(`Failed to add user: ${errorMessage}. Please check console for details.`);
        }
    };

    const handleAddGuest = async () => {
        if (!newGuest.lastName || !newGuest.room) {
            alert('Please enter both last name and room number.');
            return;
        }
        try {
            await addUser({
                lastName: newGuest.lastName,
                roomNumber: newGuest.room,
                role: UserRole.GUEST,
                department: 'All',
                villaType: newGuest.type,
                checkIn: newGuest.checkIn ? new Date(newGuest.checkIn).toISOString() : undefined,
                checkOut: newGuest.checkOut ? new Date(newGuest.checkOut).toISOString() : undefined,
                language: newGuest.language
            });
            console.log('Guest added successfully');
            alert(`Guest "${newGuest.lastName}" created successfully!`);
            setNewGuest({ lastName: '', room: '', type: 'Ocean Suite', checkIn: '', checkOut: '', language: 'English' });
            setShowGuestForm(false);
            // Refresh users specifically after adding
            try {
                const refreshedUsers = await getUsers();
                setUsers(refreshedUsers);
                console.log('Users refreshed after add:', refreshedUsers);
            } catch (error) {
                console.error('Failed to refresh users after add:', error);
            }
            await refreshData();
        } catch (error: any) {
            console.error('Failed to add guest:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            alert(`Failed to add guest: ${errorMessage}. Please check console for details.`);
        }
    };

    const handleAddRoomType = async () => {
        if (!newRoomType.name) {
            alert('Please enter a room type name.');
            return;
        }
        try {
            if (editingRoomType) {
                // Update existing room type
                const updated = await updateRoomType(editingRoomType.id, {
                    name: newRoomType.name,
                    description: newRoomType.description || '',
                    locationId: newRoomType.locationId || '' // Ensure it's a string, empty string will be converted to null
                });
                console.log('Room type updated successfully:', updated);
                setEditingRoomType(null);
                alert(`Room type "${updated.name}" updated successfully!`);
            } else {
                // Create new room type
                console.log('Creating new room type - Input:', newRoomType);
                const created = await addRoomType({
                    id: '', // Handled by service
                    name: newRoomType.name,
                    description: newRoomType.description || '',
                    locationId: newRoomType.locationId || '' // Ensure it's a string, empty string will be converted to null
                });
                console.log('Room type created successfully:', created);
                alert(`Room type "${created.name}" created successfully!`);
            }
            setNewRoomType({ name: '', description: '', locationId: '' });
            setShowRoomTypeForm(false);
            // Refresh room types and locations to ensure data is in sync
            let refreshedLocations: Location[];
            try {
                refreshedLocations = await getLocations();
            } catch (error) {
                console.error('Failed to refresh locations from database:', error);
                refreshedLocations = getLocationsSync();
            }
            
            const refreshedRoomTypes = await getRoomTypes();
            setRoomTypes(refreshedRoomTypes);
            setLocations(refreshedLocations);
        } catch (error: any) {
            console.error('Failed to save room type:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            alert(`Failed to save room type: ${errorMessage}. Please check the console for details.`);
        }
    };

    const handleEditRoomType = (rt: RoomType) => {
        setEditingRoomType(rt);
        setNewRoomType({
            name: rt.name,
            description: rt.description || '',
            locationId: rt.locationId || ''
        });
        setShowRoomTypeForm(true);
    };

    const handleCancelEditRoomType = () => {
        setEditingRoomType(null);
        setNewRoomType({ name: '', description: '', locationId: '' });
        setShowRoomTypeForm(false);
    };

    const handleAddRoom = async () => {
        if (!newRoom.number || !newRoom.typeId) return;
        try {
            await addRoom({
            id: '',
            number: newRoom.number,
            typeId: newRoom.typeId,
            status: 'Available'
        });
        setNewRoom({ number: '', typeId: '' });
        setShowRoomForm(false);
            // Refresh rooms
            getRooms().then(setRooms).catch(console.error);
        } catch (error) {
            console.error('Failed to add room:', error);
            alert('Failed to add room. Please try again.');
        }
    };

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setCsvFile(e.target.files[0]);
        }
    };
    
    const handleRoomCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setRoomCsvFile(e.target.files[0]);
        }
    };

    const processCsvImport = async () => {
        if (!csvFile) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            if (evt.target?.result) {
                try {
                    console.log('Starting CSV import...');
                    const count = await importGuestsFromCSV(evt.target.result as string);
                    console.log(`CSV import completed: ${count} guests imported`);
                    alert(`Successfully imported ${count} guests.`);
                    // Refresh users specifically after import
                    try {
                        const refreshedUsers = await getUsers();
                        setUsers(refreshedUsers);
                    } catch (error) {
                        console.error('Failed to refresh users after CSV import:', error);
                    }
                    await refreshData();
                    setCsvFile(null);
                } catch (error: any) {
                    console.error('Failed to import CSV:', error);
                    const errorMessage = error?.message || error?.toString() || 'Unknown error';
                    alert(`Failed to import CSV: ${errorMessage}. Please check console for details.`);
                }
            }
        };
        reader.readAsText(csvFile);
    };

    const processRoomCsvImport = () => {
        if (!roomCsvFile) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            if (evt.target?.result) {
                try {
                    const count = await importRoomsFromCSV(evt.target.result as string);
                alert(`Successfully imported ${count} rooms.`);
                    // Refresh rooms
                    getRooms().then(setRooms).catch(console.error);
                refreshData();
                setRoomCsvFile(null);
                } catch (error) {
                    console.error('Failed to import rooms:', error);
                    alert('Failed to import rooms. Please check the CSV format.');
                }
            }
        };
        reader.readAsText(roomCsvFile);
    };

    const handleExportGuests = () => {
        const csvContent = getGuestCSVContent();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `furama_guests_export_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleDelete = async (id: string, type: 'LOC' | 'ITEM' | 'EVENT' | 'PROMO' | 'KNOW' | 'USER' | 'ROOM_TYPE' | 'ROOM') => {
        if (!confirm(`Are you sure you want to delete this ${type === 'ROOM_TYPE' ? 'room type' : type.toLowerCase()}?`)) {
            return;
        }
        try {
            if (type === 'LOC') {
                await deleteLocation(id);
                console.log('Location deleted successfully, refreshing...');
                // Refresh locations specifically after deleting
                try {
                    const refreshedLocations = await getLocations();
                    setLocations(refreshedLocations);
                } catch (error) {
                    console.error('Failed to refresh locations after delete:', error);
                    // Fallback to sync version
                    const fallbackLocations = getLocationsSync();
                    setLocations(fallbackLocations);
                    console.log('Using fallback locations:', fallbackLocations);
                }
            }
            else if (type === 'ITEM') await deleteMenuItem(id);
            else if (type === 'EVENT') {
                await deleteEvent(id);
                // Refresh events specifically after deleting
                try {
                    const refreshedEvents = await getEvents();
                    setEvents(refreshedEvents);
                } catch (error) {
                    console.error('Failed to refresh events after delete:', error);
                }
            }
            else if (type === 'PROMO') {
                await deletePromotion(id);
                // Refresh promotions specifically after deleting
                try {
                    const refreshedPromotions = await getPromotions();
                    setPromotions(refreshedPromotions);
                } catch (error) {
                    console.error('Failed to refresh promotions after delete:', error);
                }
            }
            else if (type === 'KNOW') {
                await deleteKnowledgeItem(id);
                // Refresh knowledge specifically after deleting
                try {
                    const refreshedKnowledge = await getKnowledgeBase();
                    setKnowledge(refreshedKnowledge);
                } catch (error) {
                    console.error('Failed to refresh knowledge after delete:', error);
                }
            }
            else if (type === 'USER') {
                await deleteUser(id);
                // Refresh users specifically after deleting
                try {
                    const refreshedUsers = await getUsers();
                    setUsers(refreshedUsers);
                } catch (error) {
                    console.error('Failed to refresh users after delete:', error);
                }
            }
            else if (type === 'ROOM_TYPE') {
                await deleteRoomType(id);
                console.log('Room type deleted successfully');
            }
            else if (type === 'ROOM') await deleteRoom(id);
            
            // Refresh data after successful delete (except for LOC which is already refreshed above)
            if (type !== 'LOC') {
                await refreshData();
            }
            
            // Also refresh specific data if needed
            if (type === 'ROOM_TYPE') {
                const refreshedRoomTypes = await getRoomTypes();
                setRoomTypes(refreshedRoomTypes);
            } else if (type === 'ITEM') {
                // Refresh menu specifically after deleting menu item
                try {
                    const refreshedMenu = await getMenu();
                    setMenu(refreshedMenu);
                } catch (error) {
                    console.error('Failed to refresh menu after delete:', error);
                }
            }
        } catch (error: any) {
            console.error('Failed to delete:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            alert(`Failed to delete: ${errorMessage}. Please check the console for details.`);
        }
    };

    const getPlaceholder = () => {
        if (tab === 'LOCATIONS') return "e.g., Add a new spot called 'Sunset Bar' at coordinates 16.03, 108.24";
        if (tab === 'MENU') return "e.g., Add Grilled Lobster to Dining category for $45, desc: Fresh local catch.";
        if (tab === 'EVENTS') return "e.g., Pool Party on Dec 24th at 2pm at Lagoon Pool.";
        if (tab === 'PROMOS') return "e.g., Happy Hour: 50% off cocktails daily 5-7pm.";
        if (tab === 'KNOWLEDGE') return "e.g., Check-out time is 12:00 PM.";
        if (tab === 'ROOMS' && roomView === 'LIST') return "e.g. Add Room 204 as a Garden Villa";
        return "";
    };

    const formatEventDate = (dateString: string): string => {
        try {
            // Try parsing as ISO date string
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            // If ISO parse fails, try YYYY-MM-DD format
            const parts = dateString.split('T')[0].split('-');
            if (parts.length === 3) {
                const yyyy = parseInt(parts[0]);
                const mm = parseInt(parts[1]) - 1;
                const dd = parseInt(parts[2]);
                const dateObj = new Date(yyyy, mm, dd);
                if (!isNaN(dateObj.getTime())) {
                    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }
            }
            // Return original if can't parse
            return dateString;
        } catch {
            return dateString;
        }
    };

    const filteredMenu = menuFilter === 'ALL' ? menu : menu.filter(m => m.category === menuFilter);
    const filteredLocations = locationFilter === 'ALL' ? locations : locations.filter(l => l.type === locationFilter);
    const guestUsers = users.filter(u => u.role === UserRole.GUEST);
    const staffUsers = users.filter(u => u.role !== UserRole.GUEST);
    
    // Filter History
    const filteredHistory = serviceHistory.filter(req => {
        const matchesType = historyFilterType === 'ALL' || req.type === historyFilterType;
        // Basic Date string comparison (YYYY-MM-DD)
        const reqDate = new Date(req.timestamp).toISOString().split('T')[0];
        const matchesDate = !historyFilterDate || reqDate === historyFilterDate;
        return matchesType && matchesDate;
    });

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            <header className="bg-emerald-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
                <div>
                    <h1 className="text-xl font-serif font-bold">Furama Admin CMS</h1>
                    <div className="flex items-center space-x-2">
                         <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${user.role === UserRole.SUPERVISOR ? 'bg-amber-500 text-white' : 'bg-emerald-700 text-emerald-100'}`}>
                            {user.role === UserRole.SUPERVISOR ? 'Supervisor (Restricted)' : user.role}
                        </span>
                        <p className="text-xs text-emerald-300">System Management</p>
                    </div>
                </div>
                <button onClick={onLogout} className="text-sm bg-emerald-800 px-3 py-1 rounded hover:bg-emerald-700 border border-emerald-700">Logout</button>
            </header>

            {/* Navigation Tabs */}
            <div className="flex bg-white shadow-sm border-b border-gray-200 overflow-x-auto">
                <button onClick={() => setTab('LOCATIONS')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'LOCATIONS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <MapPin size={18} /> <span className="text-xs md:text-sm">Locs</span>
                </button>
                <button onClick={() => setTab('ROOMS')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'ROOMS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <Home size={18} /> <span className="text-xs md:text-sm">Rooms</span>
                </button>
                <button onClick={() => setTab('FLEET')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'FLEET' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <Car size={18} /> <span className="text-xs md:text-sm">Fleet</span>
                </button>
                <button onClick={() => setTab('MENU')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'MENU' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <Utensils size={18} /> <span className="text-xs md:text-sm">Resort Services</span>
                </button>
                <button onClick={() => setTab('EVENTS')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'EVENTS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <Calendar size={18} /> <span className="text-xs md:text-sm">Events</span>
                </button>
                <button onClick={() => setTab('PROMOS')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'PROMOS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <Megaphone size={18} /> <span className="text-xs md:text-sm">Promo</span>
                </button>
                <button onClick={() => setTab('KNOWLEDGE')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'KNOWLEDGE' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <BrainCircuit size={18} /> <span className="text-xs md:text-sm">AI</span>
                </button>
                {/* Only ADMIN can see Users/Staff Management */}
                {user.role === UserRole.ADMIN && (
                    <button onClick={() => setTab('USERS')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'USERS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                        <Users size={18} /> <span className="text-xs md:text-sm">Staff</span>
                    </button>
                )}
                <button onClick={() => setTab('GUESTS')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'GUESTS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <UserCheck size={18} /> <span className="text-xs md:text-sm">Guests</span>
                </button>
                <button onClick={() => setTab('HISTORY')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'HISTORY' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <History size={18} /> <span className="text-xs md:text-sm">History</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
                {tab !== 'FLEET' && (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            {/* Tab Headers */}
                            {tab === 'LOCATIONS' && 'Resort Locations'}
                            {tab === 'ROOMS' && (roomView === 'TYPES' ? 'Room Definitions' : 'Room Inventory')}
                            {tab === 'MENU' && 'Dining & Spa Menus'}
                            {tab === 'EVENTS' && 'Events Calendar'}
                            {tab === 'PROMOS' && 'Active Promotions'}
                            {tab === 'KNOWLEDGE' && 'AI Chatbot Knowledge Base'}
                            {tab === 'USERS' && 'Staff Management'}
                            {tab === 'GUESTS' && 'Guest Check-in Management'}
                            {tab === 'HISTORY' && 'Service Order History'}
                        </h2>
                    
                    <div className="flex items-center space-x-2 w-full md:w-auto">
                        {/* History Filters */}
                        {tab === 'HISTORY' && (
                            <div className="flex space-x-2 bg-white p-1.5 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-1 px-2 border-r border-gray-200">
                                    <Filter size={14} className="text-gray-400" />
                                    <select 
                                        className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
                                        value={historyFilterType}
                                        onChange={(e) => setHistoryFilterType(e.target.value)}
                                    >
                                        <option value="ALL">All Services</option>
                                        <option value="BUGGY">Buggy</option>
                                        <option value="DINING">Dining</option>
                                        <option value="SPA">Spa</option>
                                        <option value="POOL">Pool</option>
                                        <option value="BUTLER">Butler</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-1 px-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    <input 
                                        type="date" 
                                        className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
                                        value={historyFilterDate}
                                        onChange={(e) => setHistoryFilterDate(e.target.value)}
                                    />
                                    {historyFilterDate && (
                                        <button onClick={() => setHistoryFilterDate('')} className="text-gray-400 hover:text-red-500">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {tab === 'MENU' && (
                            <>
                                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                                    <button onClick={() => setMenuFilter('ALL')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'ALL' ? 'bg-gray-100 text-gray-800 font-bold' : 'text-gray-500'}`}>All</button>
                                    <button onClick={() => setMenuFilter('Dining')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Dining' ? 'bg-orange-100 text-orange-800 font-bold' : 'text-gray-500'}`}>Dining</button>
                                    <button onClick={() => setMenuFilter('Spa')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Spa' ? 'bg-purple-100 text-purple-800 font-bold' : 'text-gray-500'}`}>Spa</button>
                                    <button onClick={() => setMenuFilter('Pool')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Pool' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-500'}`}>Pool</button>
                                    <button onClick={() => setMenuFilter('Butler')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Butler' ? 'bg-amber-100 text-amber-800 font-bold' : 'text-gray-500'}`}>Butler</button>
                                </div>
                                <button 
                                    onClick={() => {
                                        setShowMenuItemForm(!showMenuItemForm);
                                        if (!showMenuItemForm) {
                                            setEditingMenuItem(null);
                                            setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
                                        }
                                    }}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                                >
                                    {showMenuItemForm && !editingMenuItem ? <X size={18}/> : <Plus size={18}/>}
                                    <span>{showMenuItemForm && !editingMenuItem ? 'Cancel' : 'Add Item'}</span>
                                </button>
                            </>
                        )}

                        {tab === 'LOCATIONS' && (
                            <>
                                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                                    <button onClick={() => setLocationFilter('ALL')} className={`px-3 py-1 text-xs rounded ${locationFilter === 'ALL' ? 'bg-gray-100 text-gray-800 font-bold' : 'text-gray-500'}`}>All</button>
                                    <button onClick={() => setLocationFilter('FACILITY')} className={`px-3 py-1 text-xs rounded ${locationFilter === 'FACILITY' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-500'}`}>Public Areas</button>
                                    <button onClick={() => setLocationFilter('VILLA')} className={`px-3 py-1 text-xs rounded ${locationFilter === 'VILLA' ? 'bg-purple-100 text-purple-800 font-bold' : 'text-gray-500'}`}>Villa</button>
                                </div>
                                <button 
                                    onClick={() => {
                                        setShowLocationForm(!showLocationForm);
                                        if (!showLocationForm) {
                                            setEditingLocation(null);
                                            setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
                                        }
                                    }}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                                >
                                    {showLocationForm && !editingLocation ? <X size={18}/> : <Plus size={18}/>}
                                    <span>{showLocationForm && !editingLocation ? 'Cancel' : 'Add Location'}</span>
                                </button>
                            </>
                        )}

                        {tab === 'ROOMS' && (
                            <div className="flex bg-white rounded-lg border border-gray-200 p-1 mr-2">
                                <button onClick={() => setRoomView('TYPES')} className={`px-3 py-1 text-xs rounded ${roomView === 'TYPES' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-gray-500'}`}>Types</button>
                                <button onClick={() => setRoomView('LIST')} className={`px-3 py-1 text-xs rounded ${roomView === 'LIST' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-gray-500'}`}>List</button>
                            </div>
                        )}
                        
                        {tab === 'USERS' && user.role === UserRole.ADMIN && (
                             <button 
                                onClick={() => setShowUserForm(!showUserForm)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showUserForm ? <X size={18}/> : <Plus size={18}/>}
                                <span>Add Staff</span>
                            </button>
                        )}

                        {tab === 'ROOMS' && roomView === 'TYPES' && (
                             <button 
                                onClick={() => setShowRoomTypeForm(!showRoomTypeForm)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showRoomTypeForm ? <X size={18}/> : <Plus size={18}/>}
                                <span>Add Type</span>
                            </button>
                        )}
                        {tab === 'ROOMS' && roomView === 'LIST' && (
                             <button 
                                onClick={() => setShowRoomForm(!showRoomForm)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showRoomForm ? <X size={18}/> : <Plus size={18}/>}
                                <span>Add Room</span>
                            </button>
                        )}

                        {tab === 'GUESTS' && (
                            <>
                             <button 
                                onClick={handleExportGuests}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 shadow-md transition flex-1 md:flex-none"
                            >
                                <Download size={18}/>
                                <span>Export CSV</span>
                            </button>
                             <button 
                                onClick={() => setShowGuestForm(!showGuestForm)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showGuestForm ? <X size={18}/> : <Plus size={18}/>}
                                <span>Add Guest</span>
                            </button>
                            </>
                        )}

                        {/* AI Button for other tabs */}
                        {['LOCATIONS', 'MENU', 'EVENTS', 'KNOWLEDGE'].includes(tab) && (
                            <button 
                                onClick={() => setShowAiInput(!showAiInput)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showAiInput ? <X size={18}/> : <Plus size={18}/>}
                                <span>{showAiInput ? 'Cancel' : 'Smart Add'}</span>
                            </button>
                        )}
                        {tab === 'PROMOS' && (
                            <button 
                                onClick={() => {
                                    if (showPromotionForm && !editingPromotion) {
                                        setShowPromotionForm(false);
                                        setNewPromotion({ title: '', description: '', discount: '', validUntil: '', imageColor: 'bg-emerald-500', imageUrl: '' });
                                    } else {
                                        setShowPromotionForm(!showPromotionForm);
                                        if (!showPromotionForm) {
                                            setEditingPromotion(null);
                                            setNewPromotion({ title: '', description: '', discount: '', validUntil: '', imageColor: 'bg-emerald-500', imageUrl: '' });
                                        }
                                    }
                                }}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showPromotionForm && !editingPromotion ? <X size={18}/> : <Plus size={18}/>}
                                <span>{showPromotionForm && !editingPromotion ? 'Cancel' : 'Add Promotion'}</span>
                            </button>
                        )}
                        {tab === 'PROMOS' && (
                            <button 
                                onClick={() => setShowAiInput(!showAiInput)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showAiInput ? <X size={18}/> : <Plus size={18}/>}
                                <span>{showAiInput ? 'Cancel' : 'Smart Add'}</span>
                            </button>
                        )}
                        {tab === 'ROOMS' && roomView === 'LIST' && (
                            <button 
                                onClick={() => setShowAiInput(!showAiInput)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showAiInput ? <X size={18}/> : <Plus size={18}/>}
                                <span>{showAiInput ? 'Cancel' : 'Smart Add'}</span>
                            </button>
                        )}
                    </div>
                    </div>
                )}

                {/* AI Input Box */}
                {showAiInput && (
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Sparkles className="w-4 h-4 text-amber-500 mr-2" />
                            AI Natural Input (Auto-Translate Enabled)
                        </label>
                        <textarea
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                            rows={2}
                            placeholder={getPlaceholder()}
                        />
                        <div className="mt-2 flex justify-end">
                            <button 
                                onClick={handleAiSubmit}
                                disabled={isParsing || !aiInput}
                                className="bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 disabled:opacity-50"
                            >
                                {isParsing ? <span>Translating & Adding...</span> : <span><Sparkles className="inline w-3 h-3 mr-1"/> Generate & Add</span>}
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Forms and Tables */}
                
                {/* Room TYPE Add Form */}
                {showRoomTypeForm && tab === 'ROOMS' && roomView === 'TYPES' && (
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                         <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">{editingRoomType ? 'Edit Room Type' : 'Create Room Type'}</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                             <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Type Name</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newRoomType.name || ''}
                                    onChange={e => setNewRoomType({...newRoomType, name: e.target.value})}
                                    placeholder="e.g. Lagoon Villa"
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Linked Location (Optional)</label>
                                <select 
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newRoomType.locationId || ''}
                                    onChange={e => setNewRoomType({...newRoomType, locationId: e.target.value})}
                                >
                                    <option value="">-- No Location Linked --</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                             </div>
                             <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newRoomType.description || ''}
                                    onChange={e => setNewRoomType({...newRoomType, description: e.target.value})}
                                    placeholder="Brief description"
                                />
                             </div>
                         </div>
                         <div className="flex justify-end gap-2">
                            {editingRoomType && (
                                <button 
                                    onClick={handleCancelEditRoomType}
                                    className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold"
                                >
                                    Cancel
                                </button>
                            )}
                            <button 
                                onClick={handleAddRoomType}
                                className="bg-emerald-800 text-white px-6 py-2 rounded-lg text-sm font-bold"
                            >
                                {editingRoomType ? 'Update Type' : 'Create Type'}
                            </button>
                        </div>
                    </div>
                )}
                
                 {/* ROOM LIST Add Form */}
                {showRoomForm && tab === 'ROOMS' && roomView === 'LIST' && (
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                        <div className="flex gap-8 flex-col md:flex-row">
                             <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Manual Room Entry</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Room Number</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900" 
                                            placeholder="e.g. 105" 
                                            value={newRoom.number} 
                                            onChange={e => setNewRoom({...newRoom, number: e.target.value})} 
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Room Type</label>
                                        <select 
                                            className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                            value={newRoom.typeId} 
                                            onChange={e => setNewRoom({...newRoom, typeId: e.target.value})}
                                        >
                                            <option value="">-- Select Type --</option>
                                            {roomTypes.map(rt => (
                                                <option key={rt.id} value={rt.name}>{rt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button onClick={handleAddRoom} className="bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-bold w-full">Add Room</button>
                            </div>

                            <div className="w-px bg-gray-200 hidden md:block"></div>

                             <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Bulk Import Rooms (CSV)</h3>
                                <p className="text-xs text-gray-500 mb-4">Format: RoomNumber, RoomTypeName (Must match existing Type)</p>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                                    <input type="file" accept=".csv" onChange={handleRoomCsvUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <Upload className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 font-medium">{roomCsvFile ? roomCsvFile.name : 'Click to Upload CSV'}</p>
                                </div>
                                <button onClick={processRoomCsvImport} disabled={!roomCsvFile} className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold w-full disabled:opacity-50">Process Import</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manual User Add Form */}
                {showUserForm && tab === 'USERS' && user.role === UserRole.ADMIN && (
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Create New Staff Account</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Display Name</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newUser.lastName || ''}
                                    onChange={e => setNewUser({...newUser, lastName: e.target.value})}
                                    placeholder="e.g. StaffName"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Username</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newUser.roomNumber || ''}
                                    onChange={e => setNewUser({...newUser, roomNumber: e.target.value})}
                                    placeholder="Login ID"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                                <select 
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newUser.role}
                                    onChange={e => {
                                        const role = e.target.value as UserRole;
                                        setNewUser({
                                            ...newUser, 
                                            role: role,
                                            department: role === UserRole.SUPERVISOR ? 'All' : newUser.department
                                        });
                                    }}
                                >
                                    {Object.values(UserRole).filter(r => r !== UserRole.GUEST).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Service Department</label>
                                <select 
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newUser.department}
                                    disabled={newUser.role === UserRole.SUPERVISOR} 
                                    onChange={e => setNewUser({...newUser, department: e.target.value as Department})}
                                >
                                    <option value="All">All / Supervisor</option>
                                    <option value="Buggy">Buggy</option>
                                    <option value="Dining">Dining</option>
                                    <option value="Spa">Spa</option>
                                    <option value="Pool">Pool</option>
                                    <option value="Butler">Butler</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={handleAddUser}
                                className="bg-emerald-800 text-white px-6 py-2 rounded-lg text-sm font-bold"
                            >
                                Create Staff
                            </button>
                        </div>
                    </div>
                )}

                {/* GUEST Add Form */}
                {showGuestForm && tab === 'GUESTS' && (
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                        <div className="flex gap-8 flex-col md:flex-row">
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Manual Guest Entry</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <input type="text" className="border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900" placeholder="Last Name" value={newGuest.lastName} onChange={e => setNewGuest({...newGuest, lastName: e.target.value})} />
                                    <input type="text" className="border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900" placeholder="Room Number" value={newGuest.room} onChange={e => setNewGuest({...newGuest, room: e.target.value})} />
                                    
                                    <div className="col-span-2">
                                        <select 
                                            className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                            value={newGuest.type} 
                                            onChange={e => setNewGuest({...newGuest, type: e.target.value})}
                                        >
                                            {roomTypes.map(rt => (
                                                <option key={rt.id} value={rt.name}>{rt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="col-span-2">
                                        <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Language</label>
                                        <select
                                            className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                            value={newGuest.language}
                                            onChange={e => setNewGuest({...newGuest, language: e.target.value})}
                                        >
                                            <option value="English">English</option>
                                            <option value="Vietnamese">Vietnamese</option>
                                            <option value="Korean">Korean</option>
                                            <option value="Japanese">Japanese</option>
                                            <option value="Chinese">Chinese</option>
                                            <option value="French">French</option>
                                            <option value="Russian">Russian</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2 grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] uppercase text-gray-500 font-bold">Check In</label>
                                            <input type="datetime-local" className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900" value={newGuest.checkIn} onChange={e => setNewGuest({...newGuest, checkIn: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase text-gray-500 font-bold">Check Out</label>
                                            <input type="datetime-local" className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900" value={newGuest.checkOut} onChange={e => setNewGuest({...newGuest, checkOut: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleAddGuest} className="bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-bold w-full">Create Guest</button>
                            </div>
                            
                            <div className="w-px bg-gray-200 hidden md:block"></div>

                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Bulk Import (CSV)</h3>
                                <p className="text-xs text-gray-500 mb-4">Format: LastName, Room, VillaType, CheckIn(ISO), CheckOut(ISO), Language</p>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                                    <input type="file" accept=".csv" onChange={handleCsvUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <Upload className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 font-medium">{csvFile ? csvFile.name : 'Click to Upload CSV'}</p>
                                </div>
                                <button onClick={processCsvImport} disabled={!csvFile} className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold w-full disabled:opacity-50">Process Import</button>
                            </div>
                        </div>
                    </div>
                )}

                 {/* Tables Section */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    {isLoading ? (
                        <Loading message="Loading data..." />
                    ) : (
                        <>
                    {/* LOCATIONS TABLE */}
                    {tab === 'LOCATIONS' && (
                        <>
                            {/* Location Edit Modal */}
                            {showLocationForm && (
                                <div 
                                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in"
                                    onClick={() => {
                                        setEditingLocation(null);
                                        setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
                                        setShowLocationForm(false);
                                    }}
                                >
                                    <div 
                                        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[90vw] max-w-2xl p-6 animate-in slide-in-from-top-5 relative"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => {
                                                setEditingLocation(null);
                                                setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
                                                setShowLocationForm(false);
                                            }}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                                            aria-label="Close"
                                        >
                                            <X size={20} />
                                        </button>
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 pr-8">{editingLocation ? 'Edit Location' : 'Create Location'}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="col-span-1 md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                                                <input 
                                                    type="text"
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                    value={newLocation.name || ''}
                                                    onChange={e => setNewLocation({...newLocation, name: e.target.value})}
                                                    placeholder="e.g. Main Pool"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Latitude</label>
                                                <input 
                                                    type="number"
                                                    step="any"
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                    value={newLocation.lat || ''}
                                                    onChange={e => setNewLocation({...newLocation, lat: parseFloat(e.target.value) || 0})}
                                                    placeholder="e.g. 16.0471"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Longitude</label>
                                                <input 
                                                    type="number"
                                                    step="any"
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                    value={newLocation.lng || ''}
                                                    onChange={e => setNewLocation({...newLocation, lng: parseFloat(e.target.value) || 0})}
                                                    placeholder="e.g. 108.2068"
                                                />
                                            </div>
                                            <div className="col-span-1 md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                                                <select 
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                    value={newLocation.type || 'FACILITY'}
                                                    onChange={e => setNewLocation({...newLocation, type: e.target.value as 'VILLA' | 'FACILITY' | 'RESTAURANT'})}
                                                >
                                                    <option value="VILLA">Villa</option>
                                                    <option value="FACILITY">Public Area</option>
                                                    <option value="RESTAURANT">Restaurant</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => {
                                                    setEditingLocation(null);
                                                    setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
                                                    setShowLocationForm(false);
                                                }}
                                                className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    if (!newLocation.name) {
                                                        alert('Please enter a name.');
                                                        return;
                                                    }
                                                    if (!newLocation.lat || !newLocation.lng) {
                                                        alert('Please enter valid coordinates.');
                                                        return;
                                                    }
                                                    try {
                                                        if (editingLocation && editingLocation.id) {
                                                            await updateLocation(editingLocation.id, newLocation as Location);
                                                            setEditingLocation(null);
                                                            alert(`Location "${newLocation.name}" updated successfully!`);
                                                        } else {
                                                            await addLocation(newLocation as Location);
                                                            alert(`Location "${newLocation.name}" added successfully!`);
                                                        }
                                                        setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
                                                        setShowLocationForm(false);
                                                        await refreshData();
                                                    } catch (error) {
                                                        console.error('Failed to save location:', error);
                                                        alert('Failed to save location. Please try again.');
                                                    }
                                                }}
                                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700"
                                            >
                                                {editingLocation ? 'Update Location' : 'Create Location'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Coordinates</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLocations.map((loc) => (
                                    <tr key={loc.id || loc.name} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-800">
                                            {loc.name}
                                            <div className="md:hidden text-xs text-gray-400 mt-1">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</div>
                                        </td>
                                        <td className="p-4 text-sm font-mono text-gray-500 hidden md:table-cell">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1 relative z-10">
                                                <button 
                                                    onClick={() => {
                                                        setEditingLocation(loc);
                                                        setNewLocation({
                                                            name: loc.name,
                                                            lat: loc.lat,
                                                            lng: loc.lng,
                                                            type: loc.type || 'FACILITY'
                                                        });
                                                        setShowLocationForm(true);
                                                    }}
                                                    className="text-emerald-600 hover:text-emerald-700 p-2 relative z-10 cursor-pointer" 
                                                    title="Edit"
                                                    type="button"
                                                >
                                                    <Pencil size={16}/>
                                                </button>
                                                <button onClick={() => handleDelete(loc.id || loc.name, 'LOC')} className="text-red-500 hover:text-red-700 p-2 relative z-10 cursor-pointer" type="button"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </>
                    )}
                    
                    {/* MENU TABLE */}
                    {tab === 'MENU' && (
                        <>
                            {/* Menu Item Edit Modal */}
                            {showMenuItemForm && (
                                <div 
                                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in"
                                    onClick={() => {
                                        setEditingMenuItem(null);
                                        setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
                                        setShowMenuItemForm(false);
                                    }}
                                >
                                    <div 
                                        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[90vw] max-w-2xl p-6 animate-in slide-in-from-top-5 relative"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => {
                                                setEditingMenuItem(null);
                                                setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
                                                setShowMenuItemForm(false);
                                            }}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                                            aria-label="Close"
                                        >
                                            <X size={20} />
                                        </button>
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 pr-8">{editingMenuItem ? 'Edit Menu Item' : 'Create Menu Item'}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="col-span-1 md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                                                <input 
                                                    type="text"
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                    value={newMenuItem.name || ''}
                                                    onChange={e => setNewMenuItem({...newMenuItem, name: e.target.value})}
                                                    placeholder="e.g. Grilled Salmon"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Price ($)</label>
                                                <input 
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                    value={newMenuItem.price || ''}
                                                    onChange={e => setNewMenuItem({...newMenuItem, price: parseFloat(e.target.value) || 0})}
                                                    placeholder="e.g. 25.00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
                                                <select 
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                    value={newMenuItem.category || 'Dining'}
                                                    onChange={e => setNewMenuItem({...newMenuItem, category: e.target.value as 'Dining' | 'Spa' | 'Pool' | 'Butler'})}
                                                >
                                                    <option value="Dining">Dining</option>
                                                    <option value="Spa">Spa</option>
                                                    <option value="Pool">Pool</option>
                                                    <option value="Butler">Butler</option>
                                                </select>
                                            </div>
                                            <div className="col-span-1 md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                                                <textarea 
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                    value={newMenuItem.description || ''}
                                                    onChange={e => setNewMenuItem({...newMenuItem, description: e.target.value})}
                                                    placeholder="e.g. Fresh Atlantic salmon with lemon butter sauce"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => {
                                                    setEditingMenuItem(null);
                                                    setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
                                                    setShowMenuItemForm(false);
                                                }}
                                                className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    if (!newMenuItem.name) {
                                                        alert('Please enter a name.');
                                                        return;
                                                    }
                                                    if (!newMenuItem.price || newMenuItem.price <= 0) {
                                                        alert('Please enter a valid price.');
                                                        return;
                                                    }
                                                    try {
                                                        if (editingMenuItem && editingMenuItem.id) {
                                                            await updateMenuItem(editingMenuItem.id, newMenuItem as MenuItem);
                                                            setEditingMenuItem(null);
                                                            alert(`Menu item "${newMenuItem.name}" updated successfully!`);
                                                        } else {
                                                            await addMenuItem(newMenuItem as MenuItem);
                                                            alert(`Menu item "${newMenuItem.name}" added successfully!`);
                                                        }
                                                        setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
                                                        setShowMenuItemForm(false);
                                                        await refreshData();
                                                    } catch (error) {
                                                        console.error('Failed to save menu item:', error);
                                                        alert('Failed to save menu item. Please try again.');
                                                    }
                                                }}
                                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700"
                                            >
                                                {editingMenuItem ? 'Update Item' : 'Create Item'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        <table className="w-full text-left">
                             <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Item Details</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Category</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Price</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right"></th>
                                </tr>
                            </thead>
                             <tbody>
                                {filteredMenu.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">{item.name}</div>
                                            <div className="text-xs text-gray-400 line-clamp-1">{item.description}</div>
                                            {item.translations && <div className="text-[10px] text-emerald-600 mt-0.5">Translated: {Object.keys(item.translations).length} languages</div>}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                item.category === 'Dining' ? 'bg-orange-100 text-orange-700' : 
                                                item.category === 'Spa' ? 'bg-purple-100 text-purple-700' :
                                                item.category === 'Pool' ? 'bg-blue-100 text-blue-700' :
                                                item.category === 'Butler' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-sm font-bold text-emerald-600">${item.price}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1 relative z-10">
                                                <button 
                                                    onClick={() => {
                                                        setEditingMenuItem(item);
                                                        setNewMenuItem({
                                                            name: item.name,
                                                            price: item.price,
                                                            category: item.category,
                                                            description: item.description || ''
                                                        });
                                                        setShowMenuItemForm(true);
                                                    }}
                                                    className="text-emerald-600 hover:text-emerald-700 p-2 relative z-10 cursor-pointer" 
                                                    title="Edit"
                                                    type="button"
                                                >
                                                    <Pencil size={16}/>
                                                </button>
                                                <button onClick={() => handleDelete(item.id, 'ITEM')} className="text-red-500 hover:text-red-700 p-2 relative z-10 cursor-pointer" type="button"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </>
                    )}
                    
                    {tab === 'EVENTS' && (
                        <div className="divide-y divide-gray-100">
                             {events.map((event) => (
                                 <div key={event.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                     <div>
                                         <div className="font-bold text-gray-800">{event.title}</div>
                                         <div className="text-sm text-emerald-600">{formatEventDate(event.date)} • {event.time}</div>
                                         <div className="text-xs text-gray-500 mt-1">{event.location}</div>
                                     </div>
                                     <button onClick={() => handleDelete(event.id, 'EVENT')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                 </div>
                             ))}
                        </div>
                    )}

                    {/* PROMOTIONS TABLE */}
                    {tab === 'PROMOS' && (
                        <>
                            {/* Promotion Edit Form */}
                            {showPromotionForm && (
                                <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                                    <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">{editingPromotion ? 'Edit Promotion' : 'Create Promotion'}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
                                            <input 
                                                type="text"
                                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                value={newPromotion.title || ''}
                                                onChange={e => setNewPromotion({...newPromotion, title: e.target.value})}
                                                placeholder="e.g. Happy Hour Special"
                                            />
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                                            <textarea 
                                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                value={newPromotion.description || ''}
                                                onChange={e => setNewPromotion({...newPromotion, description: e.target.value})}
                                                placeholder="e.g. Enjoy refreshing cocktails and light bites by the pool."
                                                rows={3}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Discount</label>
                                            <input 
                                                type="text"
                                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                value={newPromotion.discount || ''}
                                                onChange={e => setNewPromotion({...newPromotion, discount: e.target.value})}
                                                placeholder="e.g. 30% OFF"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Valid Until</label>
                                            <input 
                                                type="text"
                                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                value={newPromotion.validUntil || ''}
                                                onChange={e => setNewPromotion({...newPromotion, validUntil: e.target.value})}
                                                placeholder="e.g. Daily 14:00-16:00"
                                            />
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Image URL (Optional)</label>
                                            <input 
                                                type="url"
                                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                value={newPromotion.imageUrl || ''}
                                                onChange={e => setNewPromotion({...newPromotion, imageUrl: e.target.value})}
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        {editingPromotion && (
                                            <button 
                                                onClick={() => {
                                                    setEditingPromotion(null);
                                                    setNewPromotion({ title: '', description: '', discount: '', validUntil: '', imageColor: 'bg-emerald-500', imageUrl: '' });
                                                    setShowPromotionForm(false);
                                                }}
                                                className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button 
                                            onClick={async () => {
                                                if (!newPromotion.title) {
                                                    alert('Please enter a title.');
                                                    return;
                                                }
                                                try {
                                                    if (editingPromotion) {
                                                        const updated = await updatePromotion(editingPromotion.id, newPromotion as Promotion);
                                                        alert(`Promotion "${updated.title}" updated successfully!`);
                                                        setEditingPromotion(null);
                                                    } else {
                                                        await addPromotion(newPromotion as Promotion);
                                                        alert(`Promotion "${newPromotion.title}" created successfully!`);
                                                    }
                                                    setNewPromotion({ title: '', description: '', discount: '', validUntil: '', imageColor: 'bg-emerald-500', imageUrl: '' });
                                                    setShowPromotionForm(false);
                                                    // Refresh promotions
                                                    try {
                                                        const refreshedPromotions = await getPromotions();
                                                        setPromotions(refreshedPromotions);
                                                    } catch (error) {
                                                        console.error('Failed to refresh promotions:', error);
                                                    }
                                                    await refreshData();
                                                } catch (error: any) {
                                                    console.error('Failed to save promotion:', error);
                                                    alert(`Failed to save promotion: ${error?.message || 'Unknown error'}`);
                                                }
                                            }}
                                            className="bg-emerald-800 text-white px-6 py-2 rounded-lg text-sm font-bold"
                                        >
                                            {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                        <div className="divide-y divide-gray-100">
                             {promotions.map((p) => (
                                 <div key={p.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                     <div className="flex-1">
                                         <div className="flex items-center space-x-2">
                                             <span className="font-bold text-gray-800">{p.title}</span>
                                                 {p.discount && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{p.discount}</span>}
                                         </div>
                                         <div className="text-sm text-gray-500">{p.description}</div>
                                             {p.validUntil && <div className="text-xs text-gray-400 mt-1">Valid: {p.validUntil}</div>}
                                     </div>
                                         <div className="flex items-center space-x-1">
                                             <button 
                                                onClick={() => {
                                                    setEditingPromotion(p);
                                                    setNewPromotion({
                                                        title: p.title,
                                                        description: p.description,
                                                        discount: p.discount || '',
                                                        validUntil: p.validUntil || '',
                                                        imageColor: p.imageColor || 'bg-emerald-500',
                                                        imageUrl: p.imageUrl || ''
                                                    });
                                                    setShowPromotionForm(true);
                                                }}
                                                 className="text-emerald-600 hover:text-emerald-700 p-2" 
                                                 title="Edit"
                                             >
                                                 <FileText size={16}/>
                                             </button>
                                     <button onClick={() => handleDelete(p.id, 'PROMO')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                         </div>
                                 </div>
                             ))}
                        </div>
                        </>
                    )}
                    
                    {/* KNOWLEDGE TABLE */}
                    {tab === 'KNOWLEDGE' && (
                         <div className="divide-y divide-gray-100">
                            {knowledge.map((k) => (
                                <div key={k.id} className="p-4 flex justify-between items-start hover:bg-gray-50">
                                    <div className="pr-4">
                                        <div className="font-semibold text-emerald-800 text-sm mb-1">Q: {k.question}</div>
                                        <div className="text-gray-600 text-sm">A: {k.answer}</div>
                                    </div>
                                    <button onClick={() => handleDelete(k.id, 'KNOW')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                </div>
                            ))}
                       </div>
                    )}

                     {tab === 'ROOMS' && roomView === 'TYPES' && (
                         <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Type Name</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Linked Location</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roomTypes.map((rt) => {
                                    // Find linked location by matching ID
                                    // Both IDs are strings, but ensure proper comparison
                                    const linkedLoc = rt.locationId 
                                        ? locations.find(l => {
                                            const locIdStr = String(l.id || '').trim();
                                            const rtLocIdStr = String(rt.locationId || '').trim();
                                            const match = locIdStr === rtLocIdStr && locIdStr !== '';
                                            if (rt.locationId && !match) {
                                                console.log('Location ID mismatch:', {
                                                    roomTypeId: rt.id,
                                                    roomTypeName: rt.name,
                                                    roomTypeLocationId: rt.locationId,
                                                    rtLocIdStr,
                                                    locations: locations.map(l => ({ id: l.id, name: l.name })),
                                                    tryingToMatch: locIdStr
                                                });
                                            }
                                            return match;
                                        })
                                        : null;
                                    return (
                                        <tr key={rt.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">{rt.name}</div>
                                                <div className="text-xs text-gray-500">{rt.description}</div>
                                            </td>
                                            <td className="p-4">
                                                {linkedLoc ? (
                                                    <span className="flex items-center text-sm text-emerald-600">
                                                        <MapPin size={14} className="mr-1"/> {linkedLoc.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">
                                                        {rt.locationId ? `Unlinked (ID: ${rt.locationId})` : 'Unlinked'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditRoomType(rt)} className="text-emerald-600 hover:text-emerald-700 p-2" title="Edit Location Link"><MapPin size={16}/></button>
                                                    <button onClick={() => handleDelete(rt.id, 'ROOM_TYPE')} className="text-red-500 hover:text-red-700 p-2" title="Delete"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    
                    {tab === 'ROOMS' && roomView === 'LIST' && (
                         <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Room #</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Room Type</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map((r) => {
                                    const typeObj = roomTypes.find(rt => rt.id === r.typeId);
                                    return (
                                        <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 font-bold text-gray-800">{r.number}</td>
                                            <td className="p-4 text-sm text-gray-600">{typeObj?.name || 'Unknown Type'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                    r.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {r.status || 'Available'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDelete(r.id, 'ROOM')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {tab === 'USERS' && user.role === UserRole.ADMIN && (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Name / ID</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Role</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Department</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staffUsers.map((u, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{u.lastName}</div>
                                            <div className="text-xs text-gray-500">ID: {u.roomNumber}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                u.role === UserRole.ADMIN ? 'bg-red-100 text-red-800' : 
                                                u.role === UserRole.SUPERVISOR ? 'bg-amber-100 text-amber-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-gray-600 flex items-center">
                                                {u.role === UserRole.ADMIN ? <Shield size={14} className="mr-1 text-amber-500"/> : 
                                                 u.role === UserRole.SUPERVISOR ? <Users size={14} className="mr-1 text-amber-500"/> :
                                                 <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>}
                                                {u.department || 'General'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right flex justify-end space-x-1">
                                            <button onClick={() => { setResetPasswordUserId(u.id || ''); setResetNewPassword(''); }} className="text-amber-500 hover:text-amber-700 p-2"><Key size={16}/></button>
                                            <button onClick={() => handleDelete(u.id || '', 'USER')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    
                    {tab === 'GUESTS' && (
                        <>
                            {/* Guest Edit Modal */}
                            {showGuestEditForm && (
                                <div 
                                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in"
                                    onClick={() => {
                                        setEditingGuest(null);
                                        setEditGuest({ lastName: '', roomNumber: '', villaType: '', language: 'English', checkIn: '', checkOut: '' });
                                        setShowGuestEditForm(false);
                                    }}
                                >
                                    <div 
                                        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[90vw] max-w-2xl p-6 animate-in slide-in-from-top-5 relative max-h-[90vh] overflow-y-auto"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => {
                                                setEditingGuest(null);
                                                setEditGuest({ lastName: '', roomNumber: '', villaType: '', language: 'English', checkIn: '', checkOut: '' });
                                                setShowGuestEditForm(false);
                                            }}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                                            aria-label="Close"
                                        >
                                            <X size={20} />
                                        </button>
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 pr-8">Edit Guest</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Last Name</label>
                                                <input 
                                                    type="text"
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                    value={editGuest.lastName || ''}
                                                    onChange={e => setEditGuest({...editGuest, lastName: e.target.value})}
                                                    placeholder="e.g. Smith"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Room Number</label>
                                                <input 
                                                    type="text"
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                    value={editGuest.roomNumber || ''}
                                                    onChange={e => setEditGuest({...editGuest, roomNumber: e.target.value})}
                                                    placeholder="e.g. 101"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Villa Type</label>
                                                <select 
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                    value={editGuest.villaType || ''}
                                                    onChange={e => setEditGuest({...editGuest, villaType: e.target.value})}
                                                >
                                                    <option value="">Select Villa Type</option>
                                                    {roomTypes.map(rt => (
                                                        <option key={rt.id} value={rt.name}>{rt.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Language</label>
                                                <select 
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                                    value={editGuest.language || 'English'}
                                                    onChange={e => setEditGuest({...editGuest, language: e.target.value})}
                                                >
                                                    <option value="English">English</option>
                                                    <option value="Vietnamese">Vietnamese</option>
                                                    <option value="Korean">Korean</option>
                                                    <option value="Japanese">Japanese</option>
                                                    <option value="Chinese">Chinese</option>
                                                    <option value="French">French</option>
                                                    <option value="Russian">Russian</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Check-In Date</label>
                                                <input 
                                                    type="datetime-local"
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900 cursor-pointer"
                                                    value={(() => {
                                                        if (!editGuest.checkIn || editGuest.checkIn === '') return '';
                                                        const dateStr = editGuest.checkIn as string;
                                                        // If already in datetime-local format (YYYY-MM-DDTHH:mm)
                                                        if (dateStr.includes('T') && !dateStr.includes('Z') && dateStr.length >= 16) {
                                                            return dateStr.slice(0, 16);
                                                        }
                                                        // Convert from ISO string to datetime-local format
                                                        try {
                                                            const date = new Date(dateStr);
                                                            if (isNaN(date.getTime())) return '';
                                                            const year = date.getFullYear();
                                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                                            const day = String(date.getDate()).padStart(2, '0');
                                                            const hours = String(date.getHours()).padStart(2, '0');
                                                            const minutes = String(date.getMinutes()).padStart(2, '0');
                                                            return `${year}-${month}-${day}T${hours}:${minutes}`;
                                                        } catch (e) {
                                                            return '';
                                                        }
                                                    })()}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setEditGuest({
                                                            ...editGuest, 
                                                            checkIn: value || ''
                                                        });
                                                    }}
                                                    onClick={(e) => {
                                                        // Ensure input is focused and calendar opens
                                                        e.currentTarget.focus();
                                                        e.currentTarget.showPicker?.();
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Check-Out Date</label>
                                                <input 
                                                    type="datetime-local"
                                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900 cursor-pointer"
                                                    value={(() => {
                                                        if (!editGuest.checkOut || editGuest.checkOut === '') return '';
                                                        const dateStr = editGuest.checkOut as string;
                                                        // If already in datetime-local format (YYYY-MM-DDTHH:mm)
                                                        if (dateStr.includes('T') && !dateStr.includes('Z') && dateStr.length >= 16) {
                                                            return dateStr.slice(0, 16);
                                                        }
                                                        // Convert from ISO string to datetime-local format
                                                        try {
                                                            const date = new Date(dateStr);
                                                            if (isNaN(date.getTime())) return '';
                                                            const year = date.getFullYear();
                                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                                            const day = String(date.getDate()).padStart(2, '0');
                                                            const hours = String(date.getHours()).padStart(2, '0');
                                                            const minutes = String(date.getMinutes()).padStart(2, '0');
                                                            return `${year}-${month}-${day}T${hours}:${minutes}`;
                                                        } catch (e) {
                                                            return '';
                                                        }
                                                    })()}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setEditGuest({
                                                            ...editGuest, 
                                                            checkOut: value || ''
                                                        });
                                                    }}
                                                    onClick={(e) => {
                                                        // Ensure input is focused and calendar opens
                                                        e.currentTarget.focus();
                                                        e.currentTarget.showPicker?.();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => {
                                                    setEditingGuest(null);
                                                    setEditGuest({ lastName: '', roomNumber: '', villaType: '', language: 'English', checkIn: '', checkOut: '' });
                                                    setShowGuestEditForm(false);
                                                }}
                                                className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    if (!editGuest.lastName || !editGuest.roomNumber) {
                                                        alert('Please enter last name and room number.');
                                                        return;
                                                    }
                                                    try {
                                                        if (editingGuest && editingGuest.id) {
                                                            // Convert datetime-local format to ISO string for database
                                                            const userToUpdate: Partial<User> = {
                                                                ...editGuest,
                                                                checkIn: editGuest.checkIn && editGuest.checkIn.trim() !== '' 
                                                                    ? (editGuest.checkIn.includes('T') && !editGuest.checkIn.includes('Z') 
                                                                        ? new Date(editGuest.checkIn).toISOString() 
                                                                        : editGuest.checkIn)
                                                                    : undefined,
                                                                checkOut: editGuest.checkOut && editGuest.checkOut.trim() !== '' 
                                                                    ? (editGuest.checkOut.includes('T') && !editGuest.checkOut.includes('Z') 
                                                                        ? new Date(editGuest.checkOut).toISOString() 
                                                                        : editGuest.checkOut)
                                                                    : undefined
                                                            };
                                                            await updateUser(editingGuest.id, userToUpdate as User);
                                                            setEditingGuest(null);
                                                            alert(`Guest "${editGuest.lastName}" updated successfully!`);
                                                        }
                                                        setEditGuest({ lastName: '', roomNumber: '', villaType: '', language: 'English', checkIn: '', checkOut: '' });
                                                        setShowGuestEditForm(false);
                                                        await refreshData();
                                                    } catch (error) {
                                                        console.error('Failed to save guest:', error);
                                                        alert('Failed to save guest. Please try again.');
                                                    }
                                                }}
                                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700"
                                            >
                                                Update Guest
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Guest Info</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Stay Duration</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {guestUsers.map((u, i) => {
                                    const now = new Date();
                                    const start = u.checkIn ? new Date(u.checkIn) : null;
                                    const end = u.checkOut ? new Date(u.checkOut) : null;
                                    let status = 'Active';
                                    let statusColor = 'bg-green-100 text-green-700';
                                    
                                    if (start && now < start) { status = 'Future'; statusColor = 'bg-blue-100 text-blue-700'; }
                                    else if (end && now > end) { status = 'Expired'; statusColor = 'bg-gray-100 text-gray-500'; }

                                    return (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">{u.lastName}</div>
                                                <div className="text-xs text-gray-500">Room: {u.roomNumber}</div>
                                                <div className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded w-fit mt-1 border border-emerald-100">
                                                    {u.villaType} • {u.language || 'English'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs text-gray-600">
                                                    <div>In: {start ? start.toLocaleDateString() : 'N/A'}</div>
                                                    <div>Out: {end ? end.toLocaleDateString() : 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${statusColor}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1 relative z-10">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingGuest(u);
                                                            // Convert checkIn/checkOut to local datetime format for input
                                                            const formatForInput = (dateStr: string | undefined): string => {
                                                                if (!dateStr) return '';
                                                                try {
                                                                    const date = new Date(dateStr);
                                                                    if (isNaN(date.getTime())) return '';
                                                                    const year = date.getFullYear();
                                                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                                                    const day = String(date.getDate()).padStart(2, '0');
                                                                    const hours = String(date.getHours()).padStart(2, '0');
                                                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                                                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                                                                } catch (e) {
                                                                    return '';
                                                                }
                                                            };
                                                            setEditGuest({
                                                                lastName: u.lastName,
                                                                roomNumber: u.roomNumber,
                                                                villaType: u.villaType || '',
                                                                language: u.language || 'English',
                                                                checkIn: formatForInput(u.checkIn),
                                                                checkOut: formatForInput(u.checkOut)
                                                            });
                                                            setShowGuestEditForm(true);
                                                        }}
                                                        className="text-emerald-600 hover:text-emerald-700 p-2 relative z-10 cursor-pointer" 
                                                        title="Edit"
                                                        type="button"
                                                    >
                                                        <Pencil size={16}/>
                                                    </button>
                                                    <button onClick={() => handleDelete(u.id || '', 'USER')} className="text-red-500 hover:text-red-700 p-2 relative z-10 cursor-pointer" type="button"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </>
                    )}
                    
                    {tab === 'HISTORY' && (
                        <>
                            {filteredHistory.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                                    <History size={48} className="mb-4 opacity-20"/>
                                    <p>No service history found matching your filters.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="p-4 text-sm font-semibold text-gray-600">Time</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600">Room</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600">Service Type</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600">Details</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.map((req, i) => (
                                            <tr key={req.id || i} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="p-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <Clock size={12} className="mr-1.5 text-gray-400"/>
                                                        {new Date(req.timestamp).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-bold text-gray-800">{req.roomNumber}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        req.type === 'DINING' ? 'bg-orange-100 text-orange-700' :
                                                        req.type === 'SPA' ? 'bg-purple-100 text-purple-700' :
                                                        req.type === 'POOL' ? 'bg-blue-100 text-blue-700' :
                                                        req.type === 'BUGGY' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {req.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-600">
                                                    <div className="truncate max-w-xs">{req.details}</div>
                                                    {req.rating && (
                                                        <div className="mt-1 flex items-center text-xs text-amber-500">
                                                            <div className="flex mr-1">
                                                                {[...Array(req.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor"/>)}
                                                            </div>
                                                            {req.feedback && <span className="text-gray-400 italic truncate max-w-[150px]">"{req.feedback}"</span>}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        req.status === 'COMPLETED' ? 'text-green-600 bg-green-50' : 
                                                        req.status === 'CONFIRMED' ? 'text-blue-600 bg-blue-50' : 
                                                        'text-orange-600 bg-orange-50'
                                                    }`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}

                    {/* FLEET SECTION */}
                    {tab === 'FLEET' && (
                        <ReceptionPortal 
                            user={user} 
                            onLogout={onLogout}
                            embedded={true}
                        />
                    )}
                    {false && tab === 'FLEET_OLD' && (
                        <div className="space-y-4">
                            {/* Fleet Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 bg-emerald-600 rounded-md flex items-center justify-center">
                                        <Car size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">Buggy Fleet Dispatch</h2>
                                        <p className="text-xs text-gray-500">Manage real-time buggy requests and driver fleet.</p>
                                    </div>
                                </div>
                                {/* Status Indicator */}
                                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex items-center gap-1">
                                            <AlertCircle size={14} className="text-orange-500" />
                                            <span className="text-xs font-semibold text-gray-700">
                                                {getPendingRequestsCount()}
                                            </span>
                                            <span className="text-[10px] text-gray-500">Pending</span>
                                        </div>
                                        <div className="w-px h-4 bg-gray-300"></div>
                                        <div className="flex items-center gap-1">
                                            <Users size={14} className="text-green-500" />
                                            <span className="text-xs font-semibold text-gray-700">
                                                {getOnlineDriversCount()}
                                            </span>
                                            <span className="text-[10px] text-gray-500">Online</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 relative z-30">
                                    <button 
                                        onClick={() => setShowFleetSettings(!showFleetSettings)}
                                        className={`p-1.5 rounded-md transition ${showFleetSettings ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        <Settings size={18} />
                                    </button>
                                    <button 
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (isRefreshing) return;
                                            setIsRefreshing(true);
                                            try {
                                                const [refreshedRides, refreshedUsers] = await Promise.all([
                                                    getRides(),
                                                    getUsers()
                                                ]);
                                                setRides(refreshedRides);
                                                setUsers(refreshedUsers);
                                            } catch (error) {
                                                console.error('Failed to refresh data:', error);
                                                setRides(getRidesSync());
                                                setUsers(getUsersSync());
                                            } finally {
                                                setIsRefreshing(false);
                                            }
                                        }}
                                        disabled={isRefreshing}
                                        className={`p-1.5 rounded-md transition ${
                                            isRefreshing 
                                                ? 'text-gray-400 cursor-not-allowed' 
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                        title="Refresh data"
                                    >
                                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                                    </button>
                                    <div className="relative group">
                                        <button 
                                            onClick={async () => {
                                                await handleAutoAssign();
                                            }}
                                            disabled={(() => {
                                                const hasPendingRides = getPendingRequestsCount() > 0;
                                                const hasOnlineDrivers = getOnlineDriversCount() > 0;
                                                return !hasPendingRides || !hasOnlineDrivers;
                                            })()}
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed relative"
                                        >
                                            <Zap size={16} />
                                            <span>Assign by AI</span>
                                        </button>
                                        {/* Enhanced Tooltip */}
                                        {(() => {
                                            const hasPendingRides = getPendingRequestsCount() > 0;
                                            const hasOnlineDrivers = getOnlineDriversCount() > 0;
                                            const pendingCount = getPendingRequestsCount();
                                            const onlineCount = getOnlineDriversCount();
                                            
                                            if (!hasPendingRides || !hasOnlineDrivers) {
                                                return (
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0">
                                                            <div className="border-4 border-transparent border-b-gray-900"></div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Info size={14} />
                                                            <div>
                                                                {!hasPendingRides && (
                                                                    <div>⚠️ Không có yêu cầu đang chờ</div>
                                                                )}
                                                                {!hasOnlineDrivers && (
                                                                    <div>⚠️ Không có tài xế online ({users.filter(u => u.role === UserRole.DRIVER).length} offline)</div>
                                                                )}
                                                                <div className="text-[10px] text-gray-300 mt-1">
                                                                    {!hasPendingRides && "No pending requests"}
                                                                    {!hasOnlineDrivers && " / No online drivers"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0">
                                                        <div className="border-4 border-transparent border-b-gray-900"></div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Zap size={14} />
                                                        <div>
                                                            <div>✅ Sẵn sàng gán tự động</div>
                                                            <div className="text-[10px] text-gray-300 mt-1">
                                                                {pendingCount} requests • {onlineCount} drivers online
                                                            </div>
                                                            <div className="text-[10px] text-gray-300">
                                                                Ready to assign • Cost-based algorithm
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Dispatch Configuration Modal */}
                            {showFleetSettings && (
                                <div 
                                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in"
                                    onClick={() => setShowFleetSettings(false)}
                                >
                                    <div 
                                        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-96 p-6 animate-in slide-in-from-top-5 relative"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => setShowFleetSettings(false)}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                                            aria-label="Close"
                                        >
                                            <X size={20} />
                                        </button>
                                        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center pr-8">
                                            <Settings size={18} className="mr-2"/> Dispatch Configuration
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">MAX WAIT TIME (SECONDS)</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    value={fleetConfig.maxWaitTimeBeforeAutoAssign}
                                                    onChange={(e) => setFleetConfig({...fleetConfig, maxWaitTimeBeforeAutoAssign: parseInt(e.target.value) || 300})}
                                                    min="0"
                                                    step="1"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between py-1">
                                                <span className="text-sm font-medium text-gray-700">Enable Auto-Assign</span>
                                                <input 
                                                    type="checkbox" 
                                                    checked={fleetConfig.autoAssignEnabled}
                                                    onChange={(e) => setFleetConfig({...fleetConfig, autoAssignEnabled: e.target.checked})}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    localStorage.setItem('fleetConfig', JSON.stringify(fleetConfig));
                                                    setShowFleetSettings(false);
                                                }}
                                                className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700 transition shadow-md active:scale-95"
                                            >
                                                Save Settings
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                    {/* AI Assignment Modal */}
                    {showAIAssignment && aiAssignmentData && (
                        <div 
                            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in"
                            onClick={() => {
                                if (aiAssignmentData.status === 'completed' || aiAssignmentData.status === 'error') {
                                    setShowAIAssignment(false);
                                    setAIAssignmentData(null);
                                }
                            }}
                        >
                            <div 
                                className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-top-5 relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Brain size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">AI Assignment Engine</h3>
                                            <p className="text-xs text-blue-100">Intelligent ride-driver matching</p>
                                        </div>
                                    </div>
                                    {(aiAssignmentData.status === 'completed' || aiAssignmentData.status === 'error') && (
                                        <button
                                            onClick={() => {
                                                setShowAIAssignment(false);
                                                setAIAssignmentData(null);
                                            }}
                                            className="text-white/80 hover:text-white transition-colors"
                                            aria-label="Close"
                                        >
                                            <X size={24} />
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    {aiAssignmentData.status === 'analyzing' && (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                                            <h4 className="text-xl font-bold text-gray-800 mb-2">Analyzing Requests...</h4>
                                            <p className="text-gray-600 text-center max-w-md">
                                                AI is analyzing {aiAssignmentData.pendingRides.length} pending request(s) and {aiAssignmentData.onlineDrivers.length} available driver(s)
                                            </p>
                                            <div className="mt-6 flex gap-2">
                                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    )}

                                    {aiAssignmentData.status === 'matching' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Loader2 size={24} className="text-blue-600 animate-spin" />
                                                <h4 className="text-lg font-bold text-gray-800">Matching Drivers to Requests...</h4>
                                            </div>
                                            
                                            {aiAssignmentData.assignments.length > 0 ? (
                                                <div className="space-y-3">
                                                    {aiAssignmentData.assignments.map((assignment: any, idx: number) => {
                                                        const driverLocation = getDriverLocation(assignment.driver);
                                                        const waitTime = Math.floor((Date.now() - assignment.ride.timestamp) / 1000 / 60);
                                                        
                                                        return (
                                                            <div 
                                                                key={`${assignment.driver.id}-${assignment.ride.id}`}
                                                                className="bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-lg p-4 animate-in fade-in slide-in-from-left"
                                                                style={{ animationDelay: `${idx * 100}ms` }}
                                                            >
                                                                <div className="flex items-start gap-4">
                                                                    {/* Driver Info */}
                                                                    <div className="flex-1 bg-white rounded-lg p-3 border border-blue-200">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                                <Users size={16} className="text-blue-600" />
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-sm text-gray-800">{assignment.driver.lastName}</div>
                                                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                                    <MapPin size={10} />
                                                                                    {driverLocation}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {assignment.isChainTrip && (
                                                                            <div className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-semibold">
                                                                                🔗 Chain Trip
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Arrow */}
                                                                    <div className="flex items-center pt-2">
                                                                        <ArrowRight size={24} className="text-blue-600" />
                                                                    </div>

                                                                    {/* Ride Info */}
                                                                    <div className="flex-1 bg-white rounded-lg p-3 border border-emerald-200">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                                                                <Car size={16} className="text-emerald-600" />
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-sm text-gray-800">Room {assignment.ride.roomNumber}</div>
                                                                                <div className="text-xs text-gray-500">{assignment.ride.guestName}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-1 text-xs">
                                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                                                <span className="truncate">{assignment.ride.pickup}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                                                <span className="truncate">{assignment.ride.destination}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-2 flex items-center gap-2 text-[10px]">
                                                                            <div className="flex items-center gap-1 text-orange-600">
                                                                                <Clock size={10} />
                                                                                {waitTime}m wait
                                                                            </div>
                                                                            <div className="text-gray-500">
                                                                                Cost: {Math.round(assignment.cost)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Loader2 size={32} className="animate-spin mx-auto mb-3 text-blue-600" />
                                                    <p>Calculating optimal matches...</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {aiAssignmentData.status === 'completed' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <CheckCircle size={32} className="text-green-600" />
                                                <div>
                                                    <h4 className="text-lg font-bold text-gray-800">Assignments Completed!</h4>
                                                    <p className="text-sm text-gray-600">
                                                        Successfully assigned {aiAssignmentData.assignments.length} ride(s)
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {aiAssignmentData.assignments.map((assignment: any) => {
                                                    const driverLocation = getDriverLocation(assignment.driver);
                                                    
                                                    return (
                                                        <div 
                                                            key={`${assignment.driver.id}-${assignment.ride.id}`}
                                                            className="bg-green-50 border-2 border-green-200 rounded-lg p-3"
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <CheckCircle size={16} className="text-green-600" />
                                                                    <span className="font-bold text-sm text-gray-800">
                                                                        {assignment.driver.lastName} → Room {assignment.ride.roomNumber}
                                                                    </span>
                                                                </div>
                                                                {assignment.isChainTrip && (
                                                                    <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                                                                        Chain
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-600 space-y-0.5">
                                                                <div className="truncate">{assignment.ride.pickup} → {assignment.ride.destination}</div>
                                                                <div className="text-gray-500">Driver at: {driverLocation}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Total Assignments:</span>
                                                    <span className="font-bold text-gray-800">{aiAssignmentData.assignments.length}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm mt-1">
                                                    <span className="text-gray-600">Chain Trips:</span>
                                                    <span className="font-bold text-purple-600">
                                                        {aiAssignmentData.assignments.filter((a: any) => a.isChainTrip).length}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {aiAssignmentData.status === 'error' && (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <AlertCircle size={48} className="text-red-600 mb-4" />
                                            <h4 className="text-xl font-bold text-gray-800 mb-2">Assignment Failed</h4>
                                            <p className="text-gray-600 text-center whitespace-pre-line max-w-md">
                                                {aiAssignmentData.errorMessage}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                {(aiAssignmentData.status === 'completed' || aiAssignmentData.status === 'error') && (
                                    <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
                                        <button
                                            onClick={() => {
                                                setShowAIAssignment(false);
                                                setAIAssignmentData(null);
                                            }}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                            {/* Three Columns Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Column 1: Pending Requests */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-bold text-sm text-gray-800">
                                            Pending Requests ({rides.filter(r => r.status === BuggyStatus.SEARCHING).length})
                                        </h3>
                                        {fleetConfig.autoAssignEnabled && (
                                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-semibold">
                                                Auto: {fleetConfig.maxWaitTimeBeforeAutoAssign}s
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                        {rides.filter(r => r.status === BuggyStatus.SEARCHING).length === 0 ? (
                                            <div className="text-center py-6 text-gray-400 text-xs">
                                                No pending requests.
                                            </div>
                                        ) : (
                                            rides.filter(r => r.status === BuggyStatus.SEARCHING).map((ride) => (
                                                <div key={ride.id} className="bg-gray-50 p-2.5 rounded-md border border-gray-200">
                                                    <div className="font-bold text-sm text-gray-900 mb-0.5">Room {ride.roomNumber}</div>
                                                    <div className="text-xs text-gray-600">{ride.guestName}</div>
                                                    <div className="text-[11px] text-gray-500 mt-0.5">
                                                        {ride.pickup} → {ride.destination}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Column 2: Driver Fleet */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-bold text-sm text-gray-800">
                                            Driver Fleet ({users.filter(u => u.role === UserRole.DRIVER).length})
                                        </h3>
                                        <div className="flex gap-0.5">
                                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                                <List size={14} />
                                            </button>
                                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                                <Grid3x3 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                        {(() => {
                                            // Sort drivers: AVAILABLE > BUSY > OFFLINE, then alphabetically (like BuggyFleetManager)
                                            const driverUsers = users.filter(u => u.role === UserRole.DRIVER);
                                            const sortedDrivers = driverUsers.sort((a, b) => {
                                                // Calculate status scores (handle string/number ID matching)
                                                const aIdStr = a.id ? String(a.id) : '';
                                                const bIdStr = b.id ? String(b.id) : '';
                                                const aHasActive = rides.some(r => {
                                                    const rideDriverId = r.driverId ? String(r.driverId) : '';
                                                    return rideDriverId === aIdStr && (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
                                                });
                                                const bHasActive = rides.some(r => {
                                                    const rideDriverId = r.driverId ? String(r.driverId) : '';
                                                    return rideDriverId === bIdStr && (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
                                                });
                                                
                                                // Priority: AVAILABLE (no active ride) > BUSY (has active ride) > OFFLINE
                                                const scoreA = aHasActive ? 1 : 0; // 0 = AVAILABLE, 1 = BUSY
                                                const scoreB = bHasActive ? 1 : 0;
                                                
                                                if (scoreA !== scoreB) {
                                                    return scoreA - scoreB; // AVAILABLE comes first
                                                }
                                                
                                                // Then sort alphabetically by lastName
                                                return a.lastName.localeCompare(b.lastName);
                                            });
                                            
                                            return sortedDrivers.map((driver) => {
                                                // Match driver ID (handle both string and number)
                                                const driverIdStr = driver.id ? String(driver.id) : '';
                                                const driverRides = rides.filter(r => {
                                                    const rideDriverId = r.driverId ? String(r.driverId) : '';
                                                    const matches = rideDriverId === driverIdStr && (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
                                                    if (matches) {
                                                        console.log(`Driver ${driver.lastName} (${driverIdStr}) has active ride:`, r);
                                                    }
                                                    return matches;
                                                });
                                                const currentRide = driverRides[0];
                                                const hasActiveRide = currentRide && (currentRide.status === BuggyStatus.ASSIGNED || currentRide.status === BuggyStatus.ARRIVING || currentRide.status === BuggyStatus.ON_TRIP);
                                                
                                                // Use actual driver name from database
                                                const driverDisplayName = driver.lastName || 'Unknown Driver';
                                                
                                                // Determine driver status based on actual rides (like BuggyFleetManager)
                                                let driverStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE' = 'OFFLINE';
                                                if (hasActiveRide) {
                                                    driverStatus = 'BUSY';
                                                } else {
                                                    // Check if driver has recent activity (completed rides in last hour)
                                                    const recentCompleted = rides.filter(r => {
                                                        const rideDriverId = r.driverId ? String(r.driverId) : '';
                                                        return rideDriverId === driverIdStr && 
                                                            r.status === BuggyStatus.COMPLETED && 
                                                            r.completedAt && 
                                                            (Date.now() - r.completedAt < 3600000);
                                                    });
                                                    driverStatus = recentCompleted.length > 0 ? 'AVAILABLE' : 'OFFLINE';
                                                }
                                            
                                            // Get driver location from locations (fallback to "Unknown Location")
                                            const driverLocation = locations.length > 0 
                                                ? locations[parseInt(driver.id || '0') % locations.length]?.name || "Unknown Location"
                                                : "Unknown Location";

                                            return (
                                                <div key={driver.id} className="bg-gray-50 p-2.5 rounded-md border border-gray-200">
                                                    <div className="flex items-start gap-2 mb-1.5">
                                                        <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <Users size={14} className="text-gray-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-sm text-gray-900">{driverDisplayName}</div>
                                                            <div className="text-[11px] text-gray-500 mt-0.5">{driverLocation}</div>
                                                        </div>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${
                                                            driverStatus === 'AVAILABLE'
                                                                ? 'bg-green-100 text-green-700' 
                                                                : driverStatus === 'BUSY'
                                                                ? 'bg-orange-100 text-orange-700' 
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {driverStatus}
                                                        </span>
                                                    </div>
                                                    {currentRide && hasActiveRide && (
                                                        <div className="mt-1.5 pt-1.5 bg-orange-50 rounded-md p-1.5">
                                                            <div className="text-[10px] font-semibold text-orange-700 mb-0.5">Current Job:</div>
                                                            <div className="text-[11px] text-orange-800 font-medium mb-0.5">Room {currentRide.roomNumber}</div>
                                                            <div className="text-[10px] text-orange-700 mb-1">
                                                                {currentRide.pickup} → {currentRide.destination}
                                                            </div>
                                                            <div className="flex justify-end">
                                                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                                                                    ASSIGNED
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                            });
                                        })()}
                                    </div>
                                </div>

                                {/* Column 3: Active Trips */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-bold text-sm text-gray-800">
                                            Active Trips ({rides.filter(r => r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP).length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                        {rides.filter(r => r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP).length === 0 ? (
                                            <div className="text-center py-6 text-gray-400 text-xs">
                                                No active trips.
                                            </div>
                                        ) : (
                                            rides.filter(r => r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP).map((ride) => {
                                                // Match driver ID (handle both string and number)
                                                const rideDriverId = ride.driverId ? String(ride.driverId) : '';
                                                const driver = users.find(u => {
                                                    const userIdStr = u.id ? String(u.id) : '';
                                                    return userIdStr === rideDriverId;
                                                });
                                                // Use actual driver name from database
                                                const driverName = driver ? driver.lastName || 'Unknown' : 'Unknown';
                                                return (
                                                    <div key={ride.id} className="bg-gray-50 p-2.5 rounded-md border border-gray-200">
                                                        <div className="font-bold text-sm text-gray-900 mb-0.5">Room {ride.roomNumber}</div>
                                                        <div className="text-xs text-gray-600 mb-0.5">Driver: {driverName}</div>
                                                        <div className="text-[11px] text-gray-500 mb-1.5">
                                                            {ride.pickup} → {ride.destination}
                                                        </div>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                                            ride.status === BuggyStatus.ARRIVING 
                                                                ? 'bg-blue-100 text-blue-700' 
                                                                : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {ride.status === BuggyStatus.ARRIVING ? 'ARRIVING' : 'ASSIGNED'}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Recent Completed Section */}
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                        <h4 className="font-bold text-[10px] text-gray-500 uppercase mb-2 tracking-wider">RECENT COMPLETED.</h4>
                                        <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                                            {rides.filter(r => r.status === BuggyStatus.COMPLETED).slice(0, 5).map((ride) => (
                                                <div key={ride.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-200">
                                                    <span className="text-xs font-medium text-gray-700">Room {ride.roomNumber}</span>
                                                    <span className="flex items-center gap-0.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                                                        <CheckCircle size={10} />
                                                        Done
                                                    </span>
                                                </div>
                                            ))}
                                            {rides.filter(r => r.status === BuggyStatus.COMPLETED).length === 0 && (
                                                <div className="text-center py-3 text-gray-400 text-[10px]">
                                                    No completed trips yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                        </>
                    )}
                </div>
            </div>

            {/* Reset Password Modal */}
            {resetPasswordUserId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
                        <h3 className="font-bold text-lg mb-4">Reset Password</h3>
                        <p className="text-sm text-gray-500 mb-4">Enter new password for user.</p>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded p-2 mb-4 bg-gray-50 text-gray-900"
                            placeholder="New Password"
                            value={resetNewPassword}
                            onChange={(e) => setResetNewPassword(e.target.value)}
                        />
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setResetPasswordUserId(null)} 
                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={async () => {
                                    if(resetPasswordUserId && resetNewPassword) {
                                        try {
                                            console.log('Resetting password for user:', resetPasswordUserId);
                                            await resetUserPassword(resetPasswordUserId, resetNewPassword);
                                            console.log('Password reset successfully');
                                            alert('Password reset successfully!');
                                            setResetPasswordUserId(null);
                                            setResetNewPassword('');
                                            // Refresh users specifically after reset
                                            try {
                                                const refreshedUsers = await getUsers();
                                                setUsers(refreshedUsers);
                                            } catch (error) {
                                                console.error('Failed to refresh users after password reset:', error);
                                            }
                                            await refreshData();
                                        } catch (error: any) {
                                            console.error('Failed to reset password:', error);
                                            const errorMessage = error?.message || error?.toString() || 'Unknown error';
                                            alert(`Failed to reset password: ${errorMessage}. Please check console for details.`);
                                        }
                                    }
                                }} 
                                className="px-4 py-2 bg-emerald-600 text-white rounded font-bold"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPortal;
