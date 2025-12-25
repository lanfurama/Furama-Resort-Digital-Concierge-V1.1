import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Car, Settings, RefreshCw, Zap, Users, List, Grid3x3, CheckCircle, MapPin, AlertCircle, Info, X, Map, Star, Loader2, Brain, ArrowRight, Clock, UtensilsCrossed, Building2, Utensils, Waves, Search, Bell } from 'lucide-react';
import { getRides, getRidesSync, getUsers, getUsersSync, updateRideStatus, getLocations, getServiceRequests, updateServiceStatus, requestRide } from '../services/dataService';
import { User, UserRole, RideRequest, BuggyStatus, Location, ServiceRequest } from '../types';
import { apiClient } from '../services/apiClient';
import BuggyNotificationBell from './BuggyNotificationBell';

interface ReceptionPortalProps {
    onLogout: () => void;
    user: User;
    embedded?: boolean; // If true, hide header and use embedded styling
}

const ReceptionPortal: React.FC<ReceptionPortalProps> = ({ onLogout, user, embedded = false }) => {
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
    
    // View Mode: Switch between Buggy and Service
    const [viewMode, setViewMode] = useState<'BUGGY' | 'SERVICE'>('BUGGY');
    
    // Fleet Config State
    const [showFleetSettings, setShowFleetSettings] = useState(false);
    const [fleetConfig, setFleetConfig] = useState({
        maxWaitTimeBeforeAutoAssign: 300, // seconds
        autoAssignEnabled: false // Default OFF - manual control only
    });
    
    // Driver View Mode State
    const [driverViewMode, setDriverViewMode] = useState<'LIST' | 'MAP'>('LIST');
    
    // AI Assignment Modal State
    const [showAIAssignment, setShowAIAssignment] = useState(false);
    const [aiAssignmentData, setAIAssignmentData] = useState<{
        status: 'analyzing' | 'matching' | 'completed' | 'error';
        pendingRides: RideRequest[];
        onlineDrivers: User[];
        assignments: Array<{ 
            driver: User; 
            ride: RideRequest; 
            cost: number; 
            isChainTrip?: boolean;
            pickupLat?: number;
            pickupLng?: number;
            destinationLat?: number;
            destinationLng?: number;
        }>;
        errorMessage?: string;
    } | null>(null);
    
    // Service AI Assignment Modal State
    const [showServiceAIAssignment, setShowServiceAIAssignment] = useState(false);
    const [serviceAIAssignmentData, setServiceAIAssignmentData] = useState<{
        status: 'analyzing' | 'matching' | 'completed' | 'error';
        pendingServices: ServiceRequest[];
        onlineStaff: User[];
        assignments: Array<{ staff: User; service: ServiceRequest; cost: number }>;
        errorMessage?: string;
    } | null>(null);
    
    // Track last auto-assign time to prevent too frequent calls
    const lastAutoAssignRef = useRef<number>(0);
    const handleAutoAssignRef = useRef<((isAutoTriggered: boolean) => Promise<void>) | null>(null);
    
    // Current time state for countdown
    const [currentTime, setCurrentTime] = useState(Date.now());
    
    // Cache for guest information by room number
    const [guestInfoCache, setGuestInfoCache] = useState<Record<string, { last_name: string; villa_type?: string | null }>>({});
    
    // Create New Ride Modal State
    const [showCreateRideModal, setShowCreateRideModal] = useState(false);
    const [newRideData, setNewRideData] = useState({
        roomNumber: '',
        pickup: '',
        destination: '',
        guestName: '',
        guestCount: 1,
        notes: ''
    });
    const [pickupSearchQuery, setPickupSearchQuery] = useState('');
    const [destinationSearchQuery, setDestinationSearchQuery] = useState('');
    const [pickupFilterType, setPickupFilterType] = useState<'ALL' | 'VILLA' | 'FACILITY' | 'RESTAURANT'>('ALL');
    const [destinationFilterType, setDestinationFilterType] = useState<'ALL' | 'VILLA' | 'FACILITY' | 'RESTAURANT'>('ALL');
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [showDestinationModal, setShowDestinationModal] = useState(false);
    const [isCreatingRide, setIsCreatingRide] = useState(false);
    
    // Merge Options Modal State
    const [showMergeModal, setShowMergeModal] = useState(false);
    
    // Manual ride merging functions
    const canCombineRides = (ride1: RideRequest, ride2: RideRequest): boolean => {
        const totalGuests = (ride1.guestCount || 1) + (ride2.guestCount || 1);
        return totalGuests <= 7 && ride1.status === BuggyStatus.SEARCHING && ride2.status === BuggyStatus.SEARCHING;
    };
    
    // Calculate optimal route when merging two rides - returns detailed segments with guest info
    interface RouteSegment {
        from: string;
        to: string;
        fromLat?: number;
        fromLng?: number;
        toLat?: number;
        toLng?: number;
        roomNumber: string;
        guestName: string;
        guestCount: number;
    }
    
    const calculateOptimalMergeRoute = (ride1: RideRequest, ride2: RideRequest): { 
        pickup: string; 
        destination: string; 
        routePath: string[]; 
        segments: RouteSegment[];
        isChainTrip: boolean 
    } => {
        // Helper function to resolve coordinates for a location
        const getLocationCoords = (locationName: string) => {
            const coords = resolveLocationCoordinates(locationName);
            return coords ? { lat: coords.lat, lng: coords.lng } : { lat: undefined, lng: undefined };
        };
        
        // Same route - keep as is
        if (ride1.pickup === ride2.pickup && ride1.destination === ride2.destination) {
            const pickupCoords = getLocationCoords(ride1.pickup);
            const destCoords = getLocationCoords(ride1.destination);
            return {
                pickup: ride1.pickup,
                destination: ride1.destination,
                routePath: [ride1.pickup, ride1.destination],
                segments: [
                    {
                        from: ride1.pickup,
                        to: ride1.destination,
                        fromLat: pickupCoords.lat,
                        fromLng: pickupCoords.lng,
                        toLat: destCoords.lat,
                        toLng: destCoords.lng,
                        roomNumber: `${ride1.roomNumber}+${ride2.roomNumber}`,
                        guestName: [ride1.guestName, ride2.guestName].filter(n => n?.trim()).join(' + ') || 'Multiple Guests',
                        guestCount: (ride1.guestCount || 1) + (ride2.guestCount || 1)
                    }
                ],
                isChainTrip: false
            };
        }
        
        // Chain trip possibilities:
        // Case 1: ride1 ends where ride2 starts (ride1.destination === ride2.pickup)
        // Example: D03 → D06 và D06 → D07 → D03 → D06 → D07
        if (ride1.destination === ride2.pickup) {
            const ride1PickupCoords = getLocationCoords(ride1.pickup);
            const ride1DestCoords = getLocationCoords(ride1.destination);
            const ride2PickupCoords = getLocationCoords(ride2.pickup);
            const ride2DestCoords = getLocationCoords(ride2.destination);
            return {
                pickup: ride1.pickup,
                destination: ride2.destination,
                routePath: [ride1.pickup, ride1.destination, ride2.destination],
                segments: [
                    {
                        from: ride1.pickup,
                        to: ride1.destination,
                        fromLat: ride1PickupCoords.lat,
                        fromLng: ride1PickupCoords.lng,
                        toLat: ride1DestCoords.lat,
                        toLng: ride1DestCoords.lng,
                        roomNumber: ride1.roomNumber,
                        guestName: ride1.guestName || 'Guest',
                        guestCount: ride1.guestCount || 1
                    },
                    {
                        from: ride2.pickup,
                        to: ride2.destination,
                        fromLat: ride2PickupCoords.lat,
                        fromLng: ride2PickupCoords.lng,
                        toLat: ride2DestCoords.lat,
                        toLng: ride2DestCoords.lng,
                        roomNumber: ride2.roomNumber,
                        guestName: ride2.guestName || 'Guest',
                        guestCount: ride2.guestCount || 1
                    }
                ],
                isChainTrip: true
            };
        }
        
        // Case 2: ride2 ends where ride1 starts (ride2.destination === ride1.pickup)
        // Example: D06 → D07 và D03 → D06 → D03 → D06 → D07
        if (ride2.destination === ride1.pickup) {
            const ride1PickupCoords = getLocationCoords(ride1.pickup);
            const ride1DestCoords = getLocationCoords(ride1.destination);
            const ride2PickupCoords = getLocationCoords(ride2.pickup);
            const ride2DestCoords = getLocationCoords(ride2.destination);
            return {
                pickup: ride2.pickup,
                destination: ride1.destination,
                routePath: [ride2.pickup, ride2.destination, ride1.destination],
                segments: [
                    {
                        from: ride2.pickup,
                        to: ride2.destination,
                        fromLat: ride2PickupCoords.lat,
                        fromLng: ride2PickupCoords.lng,
                        toLat: ride2DestCoords.lat,
                        toLng: ride2DestCoords.lng,
                        roomNumber: ride2.roomNumber,
                        guestName: ride2.guestName || 'Guest',
                        guestCount: ride2.guestCount || 1
                    },
                    {
                        from: ride1.pickup,
                        to: ride1.destination,
                        fromLat: ride1PickupCoords.lat,
                        fromLng: ride1PickupCoords.lng,
                        toLat: ride1DestCoords.lat,
                        toLng: ride1DestCoords.lng,
                        roomNumber: ride1.roomNumber,
                        guestName: ride1.guestName || 'Guest',
                        guestCount: ride1.guestCount || 1
                    }
                ],
                isChainTrip: true
            };
        }
        
        // Case 3: ride1 starts where ride2 ends (ride1.pickup === ride2.destination)
        // Example: D06 → D07 và D03 → D06 → D03 → D06 → D07 (same as Case 2, just reversed)
        if (ride1.pickup === ride2.destination) {
            const ride1PickupCoords = getLocationCoords(ride1.pickup);
            const ride1DestCoords = getLocationCoords(ride1.destination);
            const ride2PickupCoords = getLocationCoords(ride2.pickup);
            const ride2DestCoords = getLocationCoords(ride2.destination);
            return {
                pickup: ride2.pickup,
                destination: ride1.destination,
                routePath: [ride2.pickup, ride2.destination, ride1.destination],
                segments: [
                    {
                        from: ride2.pickup,
                        to: ride2.destination,
                        fromLat: ride2PickupCoords.lat,
                        fromLng: ride2PickupCoords.lng,
                        toLat: ride2DestCoords.lat,
                        toLng: ride2DestCoords.lng,
                        roomNumber: ride2.roomNumber,
                        guestName: ride2.guestName || 'Guest',
                        guestCount: ride2.guestCount || 1
                    },
                    {
                        from: ride1.pickup,
                        to: ride1.destination,
                        fromLat: ride1PickupCoords.lat,
                        fromLng: ride1PickupCoords.lng,
                        toLat: ride1DestCoords.lat,
                        toLng: ride1DestCoords.lng,
                        roomNumber: ride1.roomNumber,
                        guestName: ride1.guestName || 'Guest',
                        guestCount: ride1.guestCount || 1
                    }
                ],
                isChainTrip: true
            };
        }
        
        // Case 4: ride2 starts where ride1 ends (ride2.pickup === ride1.destination)
        // Example: D03 → D06 và D06 → D07 → D03 → D06 → D07 (same as Case 1, just reversed)
        if (ride2.pickup === ride1.destination) {
            const ride1PickupCoords = getLocationCoords(ride1.pickup);
            const ride1DestCoords = getLocationCoords(ride1.destination);
            const ride2PickupCoords = getLocationCoords(ride2.pickup);
            const ride2DestCoords = getLocationCoords(ride2.destination);
            return {
                pickup: ride1.pickup,
                destination: ride2.destination,
                routePath: [ride1.pickup, ride1.destination, ride2.destination],
                segments: [
                    {
                        from: ride1.pickup,
                        to: ride1.destination,
                        fromLat: ride1PickupCoords.lat,
                        fromLng: ride1PickupCoords.lng,
                        toLat: ride1DestCoords.lat,
                        toLng: ride1DestCoords.lng,
                        roomNumber: ride1.roomNumber,
                        guestName: ride1.guestName || 'Guest',
                        guestCount: ride1.guestCount || 1
                    },
                    {
                        from: ride2.pickup,
                        to: ride2.destination,
                        fromLat: ride2PickupCoords.lat,
                        fromLng: ride2PickupCoords.lng,
                        toLat: ride2DestCoords.lat,
                        toLng: ride2DestCoords.lng,
                        roomNumber: ride2.roomNumber,
                        guestName: ride2.guestName || 'Guest',
                        guestCount: ride2.guestCount || 1
                    }
                ],
                isChainTrip: true
            };
        }
        
        // No chain trip possible - optimize route based on actual lat/lng distances
        // Get all coordinates
        const pickup1Coords = getLocationCoords(ride1.pickup);
        const dest1Coords = getLocationCoords(ride1.destination);
        const pickup2Coords = getLocationCoords(ride2.pickup);
        const dest2Coords = getLocationCoords(ride2.destination);
        
        // If we don't have coordinates for all points, fallback to simple logic
        if (!pickup1Coords.lat || !dest1Coords.lat || !pickup2Coords.lat || !dest2Coords.lat) {
            const baseRide = ride1.timestamp <= ride2.timestamp ? ride1 : ride2;
            const otherRide = ride1.timestamp <= ride2.timestamp ? ride2 : ride1;
            const finalPickup = baseRide.pickup;
            const finalDestination = [baseRide.destination, otherRide.destination].find(d => d !== finalPickup) || otherRide.destination;
            
            return {
                pickup: finalPickup,
                destination: finalDestination,
                routePath: [finalPickup, finalDestination],
                segments: [
                    {
                        from: baseRide.pickup,
                        to: baseRide.destination,
                        fromLat: pickup1Coords.lat,
                        fromLng: pickup1Coords.lng,
                        toLat: dest1Coords.lat,
                        toLng: dest1Coords.lng,
                        roomNumber: baseRide.roomNumber,
                        guestName: baseRide.guestName || 'Guest',
                        guestCount: baseRide.guestCount || 1
                    },
                    {
                        from: otherRide.pickup,
                        to: otherRide.destination,
                        fromLat: pickup2Coords.lat,
                        fromLng: pickup2Coords.lng,
                        toLat: dest2Coords.lat,
                        toLng: dest2Coords.lng,
                        roomNumber: otherRide.roomNumber,
                        guestName: otherRide.guestName || 'Guest',
                        guestCount: otherRide.guestCount || 1
                    }
                ],
                isChainTrip: false
            };
        }
        
        // Calculate distances between all points using lat/lng
        const getDistance = (from: string, to: string): number => {
            const fromCoords = getLocationCoords(from);
            const toCoords = getLocationCoords(to);
            if (!fromCoords?.lat || !toCoords?.lat) return Infinity;
            return calculateDistance(
                { lat: fromCoords.lat, lng: fromCoords.lng },
                { lat: toCoords.lat, lng: toCoords.lng }
            );
        };
        
        // Try all valid route permutations (pickup must come before destination)
        // There are only a few valid permutations: 4! = 24 total, but with constraints much fewer
        const allPoints = [ride1.pickup, ride1.destination, ride2.pickup, ride2.destination];
        const validRoutes: Array<{ path: string[]; totalDistance: number }> = [];
        
        // Generate permutations with constraint: pickup must come before destination
        const generateRoutes = (current: string[], remaining: string[]): void => {
            if (remaining.length === 0) {
                // Validate: ride1.pickup must come before ride1.destination
                if (current.indexOf(ride1.pickup) >= current.indexOf(ride1.destination)) return;
                // Validate: ride2.pickup must come before ride2.destination
                if (current.indexOf(ride2.pickup) >= current.indexOf(ride2.destination)) return;
                
                // Calculate total distance
                let totalDistance = 0;
                for (let i = 0; i < current.length - 1; i++) {
                    totalDistance += getDistance(current[i], current[i + 1]);
                }
                
                validRoutes.push({ path: [...current], totalDistance });
                return;
            }
            
            remaining.forEach((point, idx) => {
                const newRemaining = [...remaining];
                newRemaining.splice(idx, 1);
                generateRoutes([...current, point], newRemaining);
            });
        };
        
        generateRoutes([], allPoints);
        
        if (validRoutes.length === 0) {
            // Fallback
            const baseRide = ride1.timestamp <= ride2.timestamp ? ride1 : ride2;
            const otherRide = ride1.timestamp <= ride2.timestamp ? ride2 : ride1;
            return {
                pickup: baseRide.pickup,
                destination: otherRide.destination,
                routePath: [baseRide.pickup, baseRide.destination, otherRide.destination],
                segments: [
                    {
                        from: baseRide.pickup,
                        to: baseRide.destination,
                        fromLat: pickup1Coords.lat,
                        fromLng: pickup1Coords.lng,
                        toLat: dest1Coords.lat,
                        toLng: dest1Coords.lng,
                        roomNumber: baseRide.roomNumber,
                        guestName: baseRide.guestName || 'Guest',
                        guestCount: baseRide.guestCount || 1
                    },
                    {
                        from: otherRide.pickup,
                        to: otherRide.destination,
                        fromLat: pickup2Coords.lat,
                        fromLng: pickup2Coords.lng,
                        toLat: dest2Coords.lat,
                        toLng: dest2Coords.lng,
                        roomNumber: otherRide.roomNumber,
                        guestName: otherRide.guestName || 'Guest',
                        guestCount: otherRide.guestCount || 1
                    }
                ],
                isChainTrip: false
            };
        }
        
        // Find route with minimum total distance
        validRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
        const optimalPath = validRoutes[0].path;
        
        // Build segments based on optimal path
        const segments: RouteSegment[] = [];
        let guest1PickedUp = false;
        let guest2PickedUp = false;
        let guest1Dropped = false;
        let guest2Dropped = false;
        
        for (let i = 0; i < optimalPath.length - 1; i++) {
            const from = optimalPath[i];
            const to = optimalPath[i + 1];
            
            // Track guest pickup/dropoff BEFORE determining on-board guests
            // This ensures we track state at the START of the segment
            const wasGuest1PickedUp = guest1PickedUp;
            const wasGuest2PickedUp = guest2PickedUp;
            
            // Update pickup status at the START of segment (from location)
            if (from === ride1.pickup) guest1PickedUp = true;
            if (from === ride2.pickup) guest2PickedUp = true;
            
            // Determine which guests are on board during this segment
            // Guests are on board if they were picked up before or at the start of this segment
            const onBoardGuests: Array<{ name: string; roomNumber: string; count: number }> = [];
            if (guest1PickedUp && to !== ride1.destination) {
                // Guest1 is on board if picked up and not dropped at destination yet
                onBoardGuests.push({ 
                    name: ride1.guestName || 'Guest', 
                    roomNumber: ride1.roomNumber, 
                    count: ride1.guestCount || 1 
                });
            }
            if (guest2PickedUp && to !== ride2.destination) {
                // Guest2 is on board if picked up and not dropped at destination yet
                onBoardGuests.push({ 
                    name: ride2.guestName || 'Guest', 
                    roomNumber: ride2.roomNumber, 
                    count: ride2.guestCount || 1 
                });
            }
            
            // Always create segment for the route, even if no guests on board yet
            // This ensures we show the complete route path
            const fromCoords = getLocationCoords(from);
            const toCoords = getLocationCoords(to);
            
            segments.push({
                from,
                to,
                fromLat: fromCoords?.lat,
                fromLng: fromCoords?.lng,
                toLat: toCoords?.lat,
                toLng: toCoords?.lng,
                roomNumber: onBoardGuests.length > 0 ? onBoardGuests.map(g => g.roomNumber).join(' + ') : '',
                guestName: onBoardGuests.length > 0 ? onBoardGuests.map(g => g.name).join(' + ') : '',
                guestCount: onBoardGuests.reduce((sum, g) => sum + g.count, 0)
            });
            
            // Update dropoff status AFTER creating segment (at destination)
            if (to === ride1.destination && guest1PickedUp) guest1Dropped = true;
            if (to === ride2.destination && guest2PickedUp) guest2Dropped = true;
        }
        
        return {
            pickup: optimalPath[0],
            destination: optimalPath[optimalPath.length - 1],
            routePath: optimalPath,
            segments: segments.length > 0 ? segments : [
                {
                    from: ride1.pickup,
                    to: ride1.destination,
                    fromLat: pickup1Coords.lat,
                    fromLng: pickup1Coords.lng,
                    toLat: dest1Coords.lat,
                    toLng: dest1Coords.lng,
                    roomNumber: ride1.roomNumber,
                    guestName: ride1.guestName || 'Guest',
                    guestCount: ride1.guestCount || 1
                },
                {
                    from: ride2.pickup,
                    to: ride2.destination,
                    fromLat: pickup2Coords.lat,
                    fromLng: pickup2Coords.lng,
                    toLat: dest2Coords.lat,
                    toLng: dest2Coords.lng,
                    roomNumber: ride2.roomNumber,
                    guestName: ride2.guestName || 'Guest',
                    guestCount: ride2.guestCount || 1
                }
            ],
            isChainTrip: false
        };
    };
    
    const handleMergeRides = async (ride1Id: string, ride2Id: string) => {
        try {
            const ride1 = rides.find(r => r.id === ride1Id);
            const ride2 = rides.find(r => r.id === ride2Id);
            
            if (!ride1 || !ride2) {
                alert('Không tìm thấy chuyến xe để ghép');
                return;
            }
            
            if (!canCombineRides(ride1, ride2)) {
                alert('Không thể ghép 2 chuyến này - vượt quá sức chứa 7 khách');
                return;
            }
            
            // Calculate optimal route for merged ride
            const optimalRoute = calculateOptimalMergeRoute(ride1, ride2);
            
            // Confirm with user
            const totalGuests = (ride1.guestCount || 1) + (ride2.guestCount || 1);
            const routePathDisplay = optimalRoute.routePath.join(' → ');
            const routeInfo = optimalRoute.isChainTrip 
                ? `\n🔗 Chain Trip (Tối ưu): ${routePathDisplay}`
                : `\n📍 Merged Route: ${routePathDisplay}`;
            
            // Build detailed route segments info
            const segmentsInfo = optimalRoute.segments.map((segment, idx) => 
                `\n${idx + 1}. ${segment.from} → ${segment.to}\n   Room #${segment.roomNumber} • ${segment.guestName} • ${segment.guestCount} pax`
            ).join('');
            
            const message = `🚐 Ghép chuyến?\n\n` +
                `📋 Original Requests:\n` +
                `- Room #${ride1.roomNumber} (${ride1.guestCount || 1} khách): ${ride1.pickup} → ${ride1.destination}\n` +
                `- Room #${ride2.roomNumber} (${ride2.guestCount || 1} khách): ${ride2.pickup} → ${ride2.destination}` +
                routeInfo +
                `\n\n📍 Route Details (Step by Step):` +
                segmentsInfo +
                `\n\n💺 Tổng: ${totalGuests}/7 khách\n\n` +
                `📝 Lưu ý hành lý:\n` +
                `- ${ride1.roomNumber}: ${ride1.notes || 'Không có ghi chú'}\n` +
                `- ${ride2.roomNumber}: ${ride2.notes || 'Không có ghi chú'}\n\n` +
                `⚠️ Hãy kiểm tra hành lý trước khi ghép chuyến!`;
                
            if (!confirm(message)) return;
            
            // Create merged ride with combined information
            const mergedNotes = [ride1.notes, ride2.notes].filter(n => n?.trim()).join(' | ') || '';
            const mergedGuestNames = [ride1.guestName, ride2.guestName].filter(n => n?.trim()).join(' + ') || 'Multiple Guests';
            
            // Use the ride with earlier timestamp as base, combine room numbers
            const baseRide = ride1.timestamp <= ride2.timestamp ? ride1 : ride2;
            
            const mergedRide = {
                ...baseRide,
                roomNumber: `${ride1.roomNumber}+${ride2.roomNumber}`,
                guestName: mergedGuestNames,
                guestCount: totalGuests,
                notes: mergedNotes,
                pickup: optimalRoute.pickup,
                destination: optimalRoute.destination,
                timestamp: Math.min(ride1.timestamp, ride2.timestamp) // Use earliest timestamp
            };
            
            // Update the base ride and delete the other
            await updateRide(mergedRide);
            await deleteRide(otherRide.id!);
            
            // Refresh rides list
            const updatedRides = await getRides();
            setRides(updatedRides);
            
            alert(`✅ Đã ghép chuyến thành công!\n\nRoom: ${mergedRide.roomNumber}\nTổng khách: ${totalGuests}`);
            
        } catch (error) {
            console.error('Failed to merge rides:', error);
            alert('❌ Lỗi khi ghép chuyến. Vui lòng thử lại.');
        }
    };
    
    // Sound notification state
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('reception_sound_enabled');
        return saved !== null ? saved === 'true' : true; // Default to enabled
    });

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [ridesData, usersData, locationsData, servicesData] = await Promise.all([
                    getRides().catch(() => getRidesSync()),
                    getUsers().catch(() => getUsersSync()),
                    getLocations().catch(() => []),
                    getServiceRequests().catch(() => [])
                ]);
                setRides(ridesData);
                setUsers(usersData);
                setLocations(locationsData);
                setServiceRequests(servicesData);
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        };
        
        loadData();
        
        // Load fleet config from localStorage
        const savedConfig = localStorage.getItem('fleetConfig');
        if (savedConfig) {
            try {
                setFleetConfig(JSON.parse(savedConfig));
            } catch (error) {
                console.error('Failed to load fleet config:', error);
            }
        }
    }, []);

    // Update current time every second for countdown
    useEffect(() => {
        const timeInterval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000); // Update every second
        
        return () => clearInterval(timeInterval);
    }, []);

    // Auto-refresh rides, users, and service requests
    useEffect(() => {
        const refreshInterval = setInterval(async () => {
            try {
                const [refreshedRides, refreshedUsers, refreshedServices] = await Promise.all([
                    getRides().catch(() => getRidesSync()),
                    getUsers().catch(() => getUsersSync()),
                    getServiceRequests().catch(() => [])
                ]);
                
                setRides(refreshedRides);
                setUsers(refreshedUsers);
                setServiceRequests(refreshedServices);
            } catch (error) {
                console.error('Failed to auto-refresh data:', error);
            }
        }, 3000); // Refresh every 3 seconds
        
        return () => clearInterval(refreshInterval);
    }, []);

    // Load guest information for active rides
    useEffect(() => {
        const loadGuestInfo = async () => {
            // Get unique room numbers from active rides (ASSIGNED, ARRIVING, ON_TRIP)
            const activeRides = rides.filter(r => 
                r.status === BuggyStatus.ASSIGNED || 
                r.status === BuggyStatus.ARRIVING || 
                r.status === BuggyStatus.ON_TRIP
            );
            
            const roomNumbers = [...new Set(activeRides.map(r => r.roomNumber))];
            
            // Load guest info for rooms that we don't have in cache
            const roomsToLoad = roomNumbers.filter(roomNum => !guestInfoCache[roomNum]);
            
            if (roomsToLoad.length === 0) return;
            
            // Load guest info for each room
            const loadPromises = roomsToLoad.map(async (roomNumber) => {
                try {
                    const guestData = await apiClient.get<any>(`/users/room/${roomNumber}`);
                    if (guestData && guestData.role === 'GUEST') {
                        return { roomNumber, guestInfo: { last_name: guestData.last_name, villa_type: guestData.villa_type } };
                    }
                } catch (error) {
                    console.error(`Failed to load guest info for room ${roomNumber}:`, error);
                }
                return null;
            });
            
            const results = await Promise.all(loadPromises);
            const newGuestInfo: Record<string, { last_name: string; villa_type?: string | null }> = {};
            
            results.forEach(result => {
                if (result && result.roomNumber) {
                    newGuestInfo[String(result.roomNumber)] = result.guestInfo;
                }
            });
            
            if (Object.keys(newGuestInfo).length > 0) {
                setGuestInfoCache(prev => ({ ...prev, ...newGuestInfo }));
            }
        };
        
        loadGuestInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rides]);

    // Auto-assign logic: Automatically assign rides that have been waiting too long
    useEffect(() => {
        // Only run if auto-assign is enabled
        if (!fleetConfig.autoAssignEnabled) {
            console.log('[Auto-Assign] Auto-assign is disabled');
            return;
        }

        console.log('[Auto-Assign] Auto-assign is enabled, checking every 5 seconds...');

        const checkAndAutoAssign = async () => {
            const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING);
            console.log(`[Auto-Assign] Checking ${pendingRides.length} pending ride(s)...`);
            
            if (pendingRides.length === 0) {
                return;
            }

            // Prevent too frequent auto-assign calls (at least 10 seconds between calls)
            const now = Date.now();
            if (now - lastAutoAssignRef.current < 10000) {
                console.log('[Auto-Assign] Skipping - last auto-assign was less than 10 seconds ago');
                return; // Skip if last auto-assign was less than 10 seconds ago
            }

            // Check if any ride has been waiting longer than maxWaitTimeBeforeAutoAssign
            const ridesToAutoAssign = pendingRides.filter(ride => {
                const waitTime = Math.floor((now - ride.timestamp) / 1000); // seconds
                const shouldAssign = waitTime >= fleetConfig.maxWaitTimeBeforeAutoAssign;
                if (shouldAssign) {
                    console.log(`[Auto-Assign] Ride ${ride.id} has been waiting ${waitTime}s (threshold: ${fleetConfig.maxWaitTimeBeforeAutoAssign}s)`);
                }
                return shouldAssign;
            });

            if (ridesToAutoAssign.length > 0) {
                console.log(`[Auto-Assign] Found ${ridesToAutoAssign.length} ride(s) waiting over ${fleetConfig.maxWaitTimeBeforeAutoAssign}s, triggering auto-assign...`);
                lastAutoAssignRef.current = now;
                // Trigger auto-assign for these rides (silently, without showing modal)
                if (handleAutoAssignRef.current) {
                    await handleAutoAssignRef.current(true); // Pass true to indicate auto-triggered
                }
            } else {
                console.log('[Auto-Assign] No rides need auto-assignment yet');
            }
        };

        // Check every 5 seconds if there are rides that need auto-assignment
        const autoAssignInterval = setInterval(checkAndAutoAssign, 5000);
        
        // Run immediately on mount
        checkAndAutoAssign();
        
        return () => clearInterval(autoAssignInterval);
    }, [rides, fleetConfig.autoAssignEnabled, fleetConfig.maxWaitTimeBeforeAutoAssign]);

    // Helper: Resolve location coordinates from location name
    const resolveLocationCoordinates = (locationName: string): { lat: number; lng: number } | null => {
        if (!locationName || locationName === "Unknown Location") return null;
        
        // Check if it's a GPS coordinate format
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
        
        // Try exact match first
        let loc = locations.find(l => 
            locationName.toLowerCase().trim() === l.name.toLowerCase().trim()
        );
        
        // Try partial match if exact match fails
        if (!loc) {
            loc = locations.find(l => 
                locationName.toLowerCase().includes(l.name.toLowerCase()) || 
                l.name.toLowerCase().includes(locationName.toLowerCase())
            );
        }
        
        // Try matching room numbers (e.g., "Room 101" might match a villa location)
        if (!loc && locationName.toLowerCase().includes('room')) {
            const roomMatch = locationName.match(/\d+/);
            if (roomMatch) {
                // Try to find a location that might correspond to this room
                // This is a fallback - ideally room numbers should map to specific locations
                loc = locations.find(l => l.name.toLowerCase().includes('villa') || l.type === 'VILLA');
            }
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
        
        // Check if driver has an active ride
        const driverActiveRides = rides.filter(r => {
            const rideDriverId = r.driverId ? String(r.driverId) : '';
            return rideDriverId === driverIdStr && 
                (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
        });
        
        if (driverActiveRides.length > 0) {
            // Driver is busy - use destination of current ride (where they'll be)
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
            if (hasActiveRide) return true; // Busy drivers are considered online
            
            // Check if driver has recent heartbeat (updated_at within last 30 seconds)
            // This is the PRIMARY way to determine if driver is online
            // When driver logs out, updatedAt is set to 3 minutes ago, so they will be offline
            if (driver.updatedAt) {
                const timeSinceUpdate = Date.now() - driver.updatedAt;
                if (timeSinceUpdate < 30000) { // 30 seconds
                    return true; // Driver is online (heartbeat active)
                }
                // If updatedAt is more than 30 seconds ago, driver is offline
                return false;
            }
            
            // No updatedAt means driver is offline
            return false;
        }).length;
    };

    // Helper: Resolve driver coordinates for map view
    const resolveDriverCoordinates = (driver: User): { lat: number; lng: number } => {
        const locationName = getDriverLocation(driver);
        const coords = resolveLocationCoordinates(locationName);
        
        if (coords) {
            return coords;
        }
        
        // Fallback to resort center if location not found
        const RESORT_CENTER = { lat: 16.0400, lng: 108.2480 };
        return RESORT_CENTER;
    };

    // Helper: Get position on map (percentage)
    const getMapPosition = (lat: number, lng: number) => {
        const mapBounds = { minLat: 16.0375, maxLat: 16.0420, minLng: 108.2460, maxLng: 108.2500 };
        const clampedLat = Math.max(mapBounds.minLat, Math.min(mapBounds.maxLat, lat));
        const clampedLng = Math.max(mapBounds.minLng, Math.min(mapBounds.maxLng, lng));
        const y = ((mapBounds.maxLat - clampedLat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
        const x = ((clampedLng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
        return { top: `${Math.max(5, Math.min(95, y))}%`, left: `${Math.max(5, Math.min(95, x))}%` };
    };

    // Helper: Get pending requests count
    const getPendingRequestsCount = (): number => {
        return rides.filter(r => r.status === BuggyStatus.SEARCHING).length;
    };

    // Helper: Get offline drivers count
    const getOfflineDriversCount = (): number => {
        const totalDrivers = users.filter(u => u.role === UserRole.DRIVER).length;
        return totalDrivers - getOnlineDriversCount();
    };

    // Helper: Get active rides count (ASSIGNED, ARRIVING, ON_TRIP)
    const getActiveRidesCount = (): number => {
        return rides.filter(r => 
            r.status === BuggyStatus.ASSIGNED || 
            r.status === BuggyStatus.ARRIVING || 
            r.status === BuggyStatus.ON_TRIP
        ).length;
    };

    // Helper: Get completed rides count today
    const getCompletedRidesTodayCount = (): number => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return rides.filter(r => {
            if (r.status !== BuggyStatus.COMPLETED) return false;
            if (!r.completedAt) return false;
            const completedDate = new Date(r.completedAt);
            completedDate.setHours(0, 0, 0, 0);
            return completedDate.getTime() === today.getTime();
        }).length;
    };

    // Helper: Get total drivers count
    const getTotalDriversCount = (): number => {
        return users.filter(u => u.role === UserRole.DRIVER).length;
    };

    // Service Request Helpers
    const getPendingServiceRequestsCount = (): number => {
        return serviceRequests.filter(sr => sr.status === 'PENDING' && sr.type !== 'BUGGY').length;
    };

    const getConfirmedServiceRequestsCount = (): number => {
        return serviceRequests.filter(sr => sr.status === 'CONFIRMED' && sr.type !== 'BUGGY').length;
    };

    // Helper: Map service type to staff department
    const getDepartmentForServiceType = (serviceType: string): string => {
        switch (serviceType) {
            case 'DINING': return 'Dining';
            case 'SPA': return 'Spa';
            case 'POOL': return 'Pool';
            case 'BUTLER': return 'Butler';
            case 'HOUSEKEEPING': return 'Housekeeping';
            default: return 'All';
        }
    };

    // Helper: Get staff for a service type (by department)
    const getAvailableStaffForService = (serviceType: string): User[] => {
        const department = getDepartmentForServiceType(serviceType);
        return users.filter(u => 
            u.role === UserRole.STAFF && 
            (u.department === department || u.department === 'All')
        );
    };

    // Helper: Get staff status (available/busy) based on active service requests
    const getStaffStatus = (staff: User): 'AVAILABLE' | 'BUSY' => {
        const staffIdStr = staff.id ? String(staff.id) : '';
        const department = staff.department || 'All';
        
        // Count active (CONFIRMED but not COMPLETED) service requests for this staff's department
        const activeRequests = serviceRequests.filter(sr => {
            if (sr.type === 'BUGGY') return false;
            const srDepartment = getDepartmentForServiceType(sr.type);
            return (sr.status === 'CONFIRMED' && (srDepartment === department || department === 'All'));
        });
        
        // If staff has 3+ active requests, consider them busy
        // Note: Since we don't have staffId in service request, we estimate based on department
        // This is a simplified approach - in a real system, you'd track staff assignments
        const estimatedActiveCount = Math.floor(activeRequests.length / Math.max(1, getAvailableStaffForService(activeRequests[0]?.type || 'DINING').length));
        return estimatedActiveCount >= 3 ? 'BUSY' : 'AVAILABLE';
    };

    // Helper: Get online staff count for service requests
    const getOnlineStaffCount = (): number => {
        const staffUsers = users.filter(u => u.role === UserRole.STAFF);
        return staffUsers.filter(staff => {
            // Check if staff has recent heartbeat
            if (staff.updatedAt) {
                const timeSinceUpdate = Date.now() - staff.updatedAt;
                return timeSinceUpdate < 30000; // 30 seconds
            }
            return false;
        }).length;
    };

    // Helper: Calculate assignment cost (simplified - based on staff availability and workload)
    const calculateServiceAssignmentCost = (staff: User, service: ServiceRequest): number => {
        const staffStatus = getStaffStatus(staff);
        let cost = 0;
        
        // Higher cost if staff is busy
        if (staffStatus === 'BUSY') {
            cost += 1000;
        }
        
        // Add random variation for simplicity (in real system, consider location, skills, etc.)
        cost += Math.random() * 100;
        
        return cost;
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
        
        // TEMPORARILY DISABLED: GPS-based location logic (Phase 1 - drivers don't use app)
        // Use time-based priority only: Driver near completion > Available driver > Busy driver
        
        // Calculate wait time in seconds (longer wait = higher priority = lower cost)
        const waitTimeSeconds = Math.floor((Date.now() - ride.timestamp) / 1000);
        const waitTimeBonus = waitTimeSeconds * 10; // Each second of wait reduces cost by 10 points
        
        let cost = 0;
        
        if (isAvailable) {
            // Driver is AVAILABLE: Medium priority (not as good as near-completion)
            cost = 5000; // Base cost for available drivers
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
            
            // Check for chain trip opportunity (based on location names, not GPS)
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
        
        // Subtract wait time bonus (longer wait = lower cost = higher priority)
        cost -= waitTimeBonus;
        
        return cost;
    };

    // Service AI Auto-Assign Logic
    const handleServiceAutoAssign = async (isAutoTriggered: boolean = false) => {
        const pendingServicesList = serviceRequests.filter(sr => sr.status === 'PENDING' && sr.type !== 'BUGGY');
        const staffUsers = users.filter(u => u.role === UserRole.STAFF);
        const totalStaff = staffUsers.length;
        
        if (pendingServicesList.length === 0) {
            if (!isAutoTriggered) {
                setServiceAIAssignmentData({
                    status: 'error',
                    pendingServices: [],
                    onlineStaff: [],
                    assignments: [],
                    errorMessage: `⚠️ Không có yêu cầu dịch vụ nào đang chờ.\n\n⚠️ No pending service requests.\n\n📊 Trạng thái / Status:\n- Pending Requests: 0\n- Total Staff: ${totalStaff}\n- Online Staff: ${getOnlineStaffCount()}`
                });
                setShowServiceAIAssignment(true);
            }
            return;
        }

        if (staffUsers.length === 0) {
            if (!isAutoTriggered) {
                setServiceAIAssignmentData({
                    status: 'error',
                    pendingServices: pendingServicesList,
                    onlineStaff: [],
                    assignments: [],
                    errorMessage: `❌ Không có nhân viên nào trong hệ thống.\n\n❌ No staff available at the moment.\n\n📊 Trạng thái / Status:\n- Pending Requests: ${pendingServicesList.length}\n- Total Staff: 0\n- Online Staff: 0`
                });
                setShowServiceAIAssignment(true);
            }
            return;
        }
        
        const onlineStaff = staffUsers.filter(staff => {
            if (staff.updatedAt) {
                const timeSinceUpdate = Date.now() - staff.updatedAt;
                return timeSinceUpdate < 30000; // 30 seconds
            }
            return false;
        });
        
        if (onlineStaff.length === 0) {
            if (!isAutoTriggered) {
                setServiceAIAssignmentData({
                    status: 'error',
                    pendingServices: pendingServicesList,
                    onlineStaff: [],
                    assignments: [],
                    errorMessage: `⚠️ Tất cả nhân viên đang offline.\n\n⚠️ All staff are offline.\n\n📊 Trạng thái / Status:\n- Pending Requests: ${pendingServicesList.length}\n- Total Staff: ${totalStaff}\n- Online Staff: 0`
                });
                setShowServiceAIAssignment(true);
            }
            return;
        }

        if (!isAutoTriggered) {
            setServiceAIAssignmentData({
                status: 'analyzing',
                pendingServices: pendingServicesList,
                onlineStaff: onlineStaff,
                assignments: []
            });
            setShowServiceAIAssignment(true);
        }

        if (!isAutoTriggered) {
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        // Calculate cost for all (staff, service) pairs
        const assignments: Array<{ staff: User; service: ServiceRequest; cost: number }> = [];
        
        for (const service of pendingServicesList) {
            const availableStaff = getAvailableStaffForService(service.type);
            for (const staff of availableStaff) {
                const cost = calculateServiceAssignmentCost(staff, service);
                assignments.push({ staff, service, cost });
            }
        }
        
        assignments.sort((a, b) => a.cost - b.cost);
        
        if (!isAutoTriggered) {
            setServiceAIAssignmentData(prev => prev ? { ...prev, status: 'matching' } : null);
            await new Promise(resolve => setTimeout(resolve, 600));
        }
        
        // Greedy assignment
        const assignedServices = new Set<string>();
        const assignedStaff = new Set<string>();
        const finalAssignments: Array<{ staff: User; service: ServiceRequest; cost: number }> = [];
        
        for (const assignment of assignments) {
            const serviceId = assignment.service.id;
            const staffId = assignment.staff.id ? String(assignment.staff.id) : '';
            
            if (assignedServices.has(serviceId) || assignedStaff.has(staffId)) {
                continue;
            }
            
            // Check if staff is too busy
            const staffStatus = getStaffStatus(assignment.staff);
            if (staffStatus === 'BUSY') {
                // Still allow but with higher cost threshold
                if (assignment.cost > 1500) {
                    continue;
                }
            }
            
            assignedServices.add(serviceId);
            assignedStaff.add(staffId);
            finalAssignments.push(assignment);
        }

        if (!isAutoTriggered) {
            setServiceAIAssignmentData(prev => prev ? { ...prev, assignments: finalAssignments, status: 'completed' } : null);
        }

        // Actually assign services
        let assignmentCount = 0;
        for (const assignment of finalAssignments) {
            try {
                await updateServiceStatus(assignment.service.id, 'CONFIRMED');
                assignmentCount++;
            } catch (error) {
                console.error(`Failed to assign service ${assignment.service.id} to staff ${assignment.staff.id}:`, error);
            }
        }

        if (!isAutoTriggered) {
            // Status already set to completed above
        } else {
            console.log(`[Service Auto-Assign] Successfully assigned ${assignmentCount} service request(s) automatically`);
        }

        // Refresh data
        try {
            const refreshedServices = await getServiceRequests();
            setServiceRequests(refreshedServices);
        } catch (error) {
            console.error('Failed to refresh services after assignment:', error);
        }
    };

    // AI Auto-Assign Logic with Cost-Based Algorithm
    const handleAutoAssign = useCallback(async (isAutoTriggered: boolean = false) => {
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
        // Only consider drivers as online if they have:
        // 1. Active ride (busy), OR
        // 2. Recent heartbeat (updatedAt within last 30 seconds)
        // Do NOT use completed rides as indicator of online status
        const onlineDrivers = allDrivers.filter(driver => {
            const driverIdStr = driver.id ? String(driver.id) : '';
            const hasActiveRide = rides.some(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverIdStr && 
                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
            });
            if (hasActiveRide) return true; // Busy drivers are considered online
            
            // Check if driver has recent heartbeat (updated_at within last 30 seconds)
            // This is the PRIMARY indicator that driver portal is open and active
            if (driver.updatedAt) {
                const timeSinceUpdate = Date.now() - driver.updatedAt;
                if (timeSinceUpdate < 30000) { // 30 seconds
                    return true; // Driver is online (heartbeat active)
                }
            }
            
            // Driver is offline if no active ride and no recent heartbeat
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
                    errorMessage: `⚠️ Tất cả tài xế đang offline.\n\n⚠️ All drivers are offline.\n\n📊 Trạng thái / Status:\n- Pending Requests: ${pendingRidesList.length}\n- Total Drivers: ${totalDrivers}\n- Online Drivers: 0\n- Offline Drivers: ${offlineDrivers}\n\n💡 Vui lòng đợi tài xế online hoặc kiểm tra kết nối.\n💡 Please wait for drivers to come online or check connection.`
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

        // IMPORTANT: Manual merge only - NO automatic merging during assignment
        // Each ride will be assigned individually unless manually merged by staff using the Merge button
        // Rides can only be merged manually through the Merge Options modal
        const MAX_BUGGY_CAPACITY = 7;
        const rideGroups: Array<{ rides: RideRequest[]; totalGuests: number }> = [];
        
        // Create individual groups for each ride - NO automatic combining/merging
        // Staff must manually merge rides using the Merge Options feature if they want to combine rides
        pendingRidesList.forEach(ride => {
            rideGroups.push({ 
                rides: [ride],  // Each ride is in its own group - no merging
                totalGuests: ride.guestCount || 1 
            });
        });
        
        // Use individual rides for assignment - no automatic merging
        const finalRideGroups = rideGroups;
        
        // Calculate cost for all (driver, ride group) pairs - ONLY for online drivers
        const assignments: Array<{ driver: User; rides: RideRequest[]; cost: number; totalGuests: number }> = [];
        
        // Create a Set of online driver IDs for quick lookup
        const onlineDriverIds = new Set(onlineDrivers.map(d => d.id ? String(d.id) : ''));
        
        // Calculate cost for each individual ride with each online driver
        // Note: Each group contains only 1 ride (no automatic merging)
        for (const group of finalRideGroups) {
            // Each group contains exactly 1 ride (no automatic merging)
            const ride = group.rides[0];
            
            // Only calculate cost for online drivers
            for (const driver of allDrivers) {
                const driverIdStr = driver.id ? String(driver.id) : '';
                // Skip offline drivers
                if (!onlineDriverIds.has(driverIdStr)) {
                    continue;
                }
                const cost = calculateAssignmentCost(driver, ride);
                assignments.push({ driver, rides: group.rides, cost, totalGuests: group.totalGuests });
            }
        }
        
        // Sort assignments with priority order:
        // 1. Driver proximity to pickup (distance-based cost)
        // 2. Guest wait time (longer wait = higher priority)
        // 3. Driver near completion of current ride (chain trip opportunity)
        assignments.sort((a, b) => {
            const rideA = a.rides[0];
            const rideB = b.rides[0];
            
            // Priority 1: Driver proximity (distance-based cost)
            // Lower cost means closer driver
            if (Math.abs(a.cost - b.cost) > 100) {
                // Significant cost difference (>100) = prioritize by distance
                return a.cost - b.cost;
            }
            
            // Priority 2: Guest wait time (longer wait = higher priority)
            const waitTimeA = Date.now() - (rideA?.timestamp || 0);
            const waitTimeB = Date.now() - (rideB?.timestamp || 0);
            if (Math.abs(waitTimeA - waitTimeB) > 30000) {
                // Significant wait time difference (>30s) = prioritize longer wait
                return waitTimeB - waitTimeA; // Longer wait first
            }
            
            // Priority 3: Driver near completion (chain trip)
            // Check if drivers are busy and near completion
            const driverAId = a.driver.id ? String(a.driver.id) : '';
            const driverBId = b.driver.id ? String(b.driver.id) : '';
            const activeRidesA = rides.filter(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverAId && 
                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
            });
            const activeRidesB = rides.filter(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverBId && 
                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
            });
            
            const currentRideA = activeRidesA[0];
            const currentRideB = activeRidesB[0];
            
            if (currentRideA && !currentRideB) {
                // Driver A is busy, Driver B is available - prefer B
                return 1;
            }
            if (!currentRideA && currentRideB) {
                // Driver A is available, Driver B is busy - prefer A
                return -1;
            }
            if (currentRideA && currentRideB) {
                // Both busy - check ride duration (near completion)
                const now = Date.now();
                let durationA = 0;
                let durationB = 0;
                
                if (currentRideA.status === BuggyStatus.ON_TRIP && currentRideA.pickedUpAt) {
                    durationA = now - currentRideA.pickedUpAt;
                } else if (currentRideA.confirmedAt) {
                    durationA = now - currentRideA.confirmedAt;
                }
                
                if (currentRideB.status === BuggyStatus.ON_TRIP && currentRideB.pickedUpAt) {
                    durationB = now - currentRideB.pickedUpAt;
                } else if (currentRideB.confirmedAt) {
                    durationB = now - currentRideB.confirmedAt;
                }
                
                // Prefer driver closer to completion (longer duration)
                if (Math.abs(durationA - durationB) > 60000) { // >1 minute difference
                    return durationB - durationA; // Longer duration first (closer to completion)
                }
            }
            
            // Final tie-breaker: cost
            return a.cost - b.cost;
        });
        
        // Update to matching status (only if showing modal)
        if (!isAutoTriggered) {
            setAIAssignmentData(prev => prev ? { ...prev, status: 'matching' } : null);
            await new Promise(resolve => setTimeout(resolve, 600));
        }
        
        // Greedy assignment: assign each individual ride to the best available driver
        // IMPORTANT: Each ride is assigned individually - NO automatic merging during assignment
        // IMPORTANT: Each driver can only be assigned ONE ride at a time (no multiple assignments)
        // Rides can only be merged manually by staff using the Merge Options feature
        const assignedRides = new Set<string>();
        const assignedDrivers = new Set<string>();
        const finalAssignments: Array<{ driver: User; rides: RideRequest[]; cost: number; isChainTrip?: boolean; totalGuests: number }> = [];
        
        for (const assignment of assignments) {
            // Each assignment contains exactly 1 ride (no automatic merging)
            const ride = assignment.rides[0];
            
            // Check if this ride is already assigned
            if (assignedRides.has(ride.id)) {
                continue;
            }
            
            const driverId = assignment.driver.id ? String(assignment.driver.id) : '';
            
            // IMPORTANT: Each driver can only be assigned ONE ride per auto-assign cycle
            // This prevents automatic merging or multiple assignments to the same driver
            if (assignedDrivers.has(driverId)) {
                continue; // Driver already assigned a ride in this cycle
            }
            
            // Check if driver can take this ride (if busy, only allow chain trips)
            const driverActiveRides = rides.filter(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverId && 
                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
            });
            
            // Check total capacity: active rides + this single ride
            const activeRidesGuestCount = driverActiveRides.reduce((sum, r) => sum + (r.guestCount || 1), 0);
            if (activeRidesGuestCount + assignment.totalGuests > MAX_BUGGY_CAPACITY) {
                continue; // Would exceed capacity
            }
            
            let isChainTrip = false;
            if (driverActiveRides.length > 0) {
                // Driver is busy - only allow if it's a chain trip (cost is very negative)
                if (assignment.cost > -5000) {
                    continue; // Not a chain trip, skip
                }
                isChainTrip = true;
            }
            
            // Assign this individual ride to the driver (no merging, no multiple assignments)
            assignedRides.add(ride.id);
            assignedDrivers.add(driverId); // Mark driver as assigned to prevent multiple assignments
            finalAssignments.push({ ...assignment, isChainTrip });
        }

        // Update modal with assignments (only if showing modal)
        // Each assignment already contains exactly 1 ride (no merging)
        // Resolve coordinates for pickup and destination locations
        const displayAssignments = finalAssignments.map(assignment => {
            const ride = assignment.rides[0]; // Each group has exactly 1 ride
            const pickupCoords = resolveLocationCoordinates(ride.pickup);
            const destinationCoords = resolveLocationCoordinates(ride.destination);
            
            return {
                driver: assignment.driver,
                ride: ride,
                cost: assignment.cost,
                isChainTrip: assignment.isChainTrip,
                pickupLat: pickupCoords?.lat,
                pickupLng: pickupCoords?.lng,
                destinationLat: destinationCoords?.lat,
                destinationLng: destinationCoords?.lng
            };
        });
        if (!isAutoTriggered) {
            setAIAssignmentData(prev => prev ? { ...prev, status: 'matching', assignments: displayAssignments } : null);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Execute assignments - assign each individual ride to its driver
        // IMPORTANT: Each ride is assigned individually - NO automatic merging
        let assignmentCount = 0;
        for (const { driver, rides } of finalAssignments) {
            try {
                // Each group contains exactly 1 ride (no automatic merging)
                const ride = rides[0];
                await updateRideStatus(ride.id, BuggyStatus.ASSIGNED, driver.id, 5); // 5 min ETA
                assignmentCount++;
            } catch (error) {
                console.error(`Failed to assign ride to driver ${driver.id}:`, error);
            }
        }

        // Update to completed status (only if showing modal)
        if (!isAutoTriggered) {
            setAIAssignmentData(prev => prev ? { ...prev, status: 'completed' } : null);
        } else {
            // For auto-triggered assignments, just log success
            if (assignmentCount > 0) {
                console.log(`[Auto-Assign] Successfully auto-assigned ${assignmentCount} ride(s)`);
                // Auto-disable auto assign after successful assignment
                setFleetConfig(prev => ({ ...prev, autoAssignEnabled: false }));
                console.log('[Auto-Assign] Auto assign has been automatically disabled after assignment');
            } else {
                console.log('[Auto-Assign] No assignments were made (no available drivers or other constraints)');
            }
        }

        // Refresh data after assignments
        try {
            const refreshedRides = await getRides();
            setRides(refreshedRides);
        } catch (error) {
            console.error('Failed to refresh rides after assignment:', error);
            setRides(getRidesSync());
        }
    }, [rides, users, locations]);
    
    // Update ref whenever handleAutoAssign changes
    useEffect(() => {
        handleAutoAssignRef.current = handleAutoAssign;
    }, [handleAutoAssign]);

    // Handle ending a buggy ride
    const handleEndRide = async (rideId: string) => {
        try {
            await updateRideStatus(rideId, BuggyStatus.COMPLETED);
            // Refresh data after ending ride
            const refreshedRides = await getRides();
            setRides(refreshedRides);
        } catch (error) {
            console.error('Failed to end ride:', error);
            // Refresh anyway to sync state
            setRides(getRidesSync());
        }
    };

    // Handle pickup guest (mark ride as ON_TRIP)
    const handlePickupGuest = async (rideId: string) => {
        try {
            await updateRideStatus(rideId, BuggyStatus.ON_TRIP);
            // Refresh data after pickup
            const refreshedRides = await getRides();
            setRides(refreshedRides);
        } catch (error) {
            console.error('Failed to pickup guest:', error);
            // Refresh anyway to sync state
            setRides(getRidesSync());
        }
    };

    // Handle creating new ride
    const handleCreateRide = async () => {
        if (!newRideData.guestName || !newRideData.pickup || !newRideData.destination) {
            alert('Please fill in all required fields (Guest Name, Pickup, Destination)');
            return;
        }

        if (newRideData.pickup === newRideData.destination) {
            alert('Pickup and destination cannot be the same');
            return;
        }

        // Check for duplicate pending ride (any status except COMPLETED)
        // Only check by guest name (not room number)
        const duplicateRide = rides.find(r => {
            if (r.status === BuggyStatus.COMPLETED) return false;
            
            // Only check by guest name
            if (newRideData.guestName && newRideData.guestName.trim() !== '') {
                if (r.guestName && r.guestName.toLowerCase() === newRideData.guestName.toLowerCase()) {
                    return true;
                }
            }
            
            return false;
        });

        if (duplicateRide) {
            const identifier = newRideData.guestName || 'Guest';
            alert(`${identifier} already has an active ride request (${duplicateRide.pickup} → ${duplicateRide.destination}, Status: ${duplicateRide.status}). Please wait for it to complete or cancel it first.`);
            return;
        }

        setIsCreatingRide(true);
        try {
            // Use guest name from input, fallback to room number if available
            const guestName = newRideData.guestName || (newRideData.roomNumber ? `Guest ${newRideData.roomNumber}` : 'Guest');
            // Only send room number if it's not empty, otherwise send null to avoid backend duplicate check
            const roomNumber = (newRideData.roomNumber && newRideData.roomNumber.trim() !== '') ? newRideData.roomNumber : null;
            
            await requestRide(guestName, roomNumber || '', newRideData.pickup, newRideData.destination, newRideData.guestCount || 1, newRideData.notes || undefined);
            
            // Refresh rides list
            const refreshedRides = await getRides();
            setRides(refreshedRides);

            // Close modal and reset form
            setShowCreateRideModal(false);
            setNewRideData({ roomNumber: '', pickup: '', destination: '', guestName: '', guestCount: 1, notes: '' });
            setPickupSearchQuery('');
            setDestinationSearchQuery('');
        } catch (error: any) {
            console.error('Failed to create ride:', error);
            // Check if error is about duplicate
            if (error?.response?.data?.error?.includes('duplicate') || error?.message?.includes('duplicate')) {
                alert(`A pending ride already exists for Room ${newRideData.roomNumber} from ${newRideData.pickup} to ${newRideData.destination}. Please wait for it to complete or cancel it first.`);
            } else {
                alert('Failed to create ride. Please try again.');
            }
        } finally {
            setIsCreatingRide(false);
        }
    };

    // Filter locations based on search query and filter type
    const getFilteredLocations = (query: string, filterType: 'ALL' | 'VILLA' | 'FACILITY' | 'RESTAURANT' = 'ALL') => {
        let filtered = locations;
        
        // Filter by type
        if (filterType !== 'ALL') {
            filtered = filtered.filter(loc => loc.type === filterType);
        }
        
        // Filter by search query
        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = filtered.filter(loc => 
                loc.name.toLowerCase().includes(lowerQuery) ||
                loc.type.toLowerCase().includes(lowerQuery)
            );
        }
        
        // Sort alphabetically
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    };

    
    // Save sound preference to localStorage
    useEffect(() => {
        localStorage.setItem('reception_sound_enabled', String(soundEnabled));
    }, [soundEnabled]);

    return (
        <div className={`${embedded ? '' : 'min-h-screen'} bg-gray-100 flex flex-col font-sans`}>
            {/* Header */}
            {!embedded && (
                <header className="bg-emerald-900 text-white py-2 px-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            viewMode === 'BUGGY' ? 'bg-emerald-700' : 'bg-blue-600'
                        }`}>
                            {viewMode === 'BUGGY' ? (
                                <Car size={24} className="text-white" />
                            ) : (
                                <UtensilsCrossed size={24} className="text-white" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Dispatch Center</h1>
                            <p className="text-xs text-emerald-200">
                                {viewMode === 'BUGGY' ? 'BUGGY FLEET MANAGEMENT' : 'SERVICE REQUEST MANAGEMENT'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Notification Bell - Only show when BUGGY view mode */}
                        {viewMode === 'BUGGY' && (
                            <BuggyNotificationBell
                                rides={rides}
                                users={users}
                                onNavigate={() => setViewMode('BUGGY')}
                                soundEnabled={soundEnabled}
                                onSoundToggle={(enabled) => {
                                    setSoundEnabled(enabled);
                                    localStorage.setItem('reception_sound_enabled', String(enabled));
                                }}
                                localStorageKey="reception_sound_enabled"
                                showCompleted={true}
                                showAssigned={true}
                                showActive={true}
                            />
                        )}
                        <div className="text-right">
                            <div className="text-sm font-semibold">{user.lastName || 'Reception'}</div>
                            <div className="text-xs text-emerald-200">ID: {user.id || 'N/A'}</div>
                        </div>
                        <button 
                            onClick={onLogout} 
                            className="text-sm bg-emerald-800 px-3 py-1.5 rounded hover:bg-emerald-700 border border-emerald-700 flex items-center gap-1"
                        >
                            <span>Logout</span>
                        </button>
                    </div>
                </header>
            )}

            {/* Main Content - Reuse Fleet Section from AdminPortal */}
            <div className={`flex-1 ${embedded ? '' : 'p-4 md:p-6'} overflow-auto`}>
                <div className="space-y-4">
                    {/* View Mode Tabs */}
                    <div className="flex items-center gap-2 mb-4 px-4">
                        <button
                            onClick={() => setViewMode('BUGGY')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                viewMode === 'BUGGY'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <Car size={18} />
                            <span>Buggy Fleet</span>
                        </button>
                        <button
                            onClick={() => {/* Disabled temporarily */}}
                            disabled
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all opacity-50 cursor-not-allowed ${
                                viewMode === 'SERVICE'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                            title="Service Requests feature is temporarily disabled"
                        >
                            <UtensilsCrossed size={18} />
                            <span>Service Requests</span>
                        </button>
                    </div>

                    {/* Buggy Fleet Dispatch */}
                    {viewMode === 'BUGGY' && (
                        <>
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
                                    <span className="text-sm text-gray-500">Pending</span>
                                </div>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <div className="flex items-center gap-1">
                                    <Users size={14} className="text-green-500" />
                                    <span className="text-xs font-semibold text-gray-700">
                                        {getOnlineDriversCount()}
                                    </span>
                                    <span className="text-sm text-gray-500">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 relative z-10">
                            <button 
                                onClick={() => setShowFleetSettings(!showFleetSettings)}
                                className={`p-1.5 rounded-md transition ${showFleetSettings ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                            >
                                <Settings size={18} />
                            </button>
                            <button 
                                onClick={async () => {
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
                                    }
                                }}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition"
                            >
                                <RefreshCw size={18} />
                            </button>
                            <div className="relative group">
                                {(() => {
                                    const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING);
                                    const hasPendingRides = pendingRides.length > 0;
                                    const hasOnlineDrivers = getOnlineDriversCount() > 0;
                                    
                                    // Calculate countdown for auto assign
                                    let countdownSeconds = null;
                                    if (fleetConfig.autoAssignEnabled && hasPendingRides && hasOnlineDrivers) {
                                        // Find the oldest pending ride
                                        const oldestRide = pendingRides.reduce((oldest, ride) => {
                                            return ride.timestamp < oldest.timestamp ? ride : oldest;
                                        }, pendingRides[0]);
                                        
                                        const waitTimeSeconds = Math.floor((currentTime - oldestRide.timestamp) / 1000);
                                        const remainingSeconds = fleetConfig.maxWaitTimeBeforeAutoAssign - waitTimeSeconds;
                                        
                                        if (remainingSeconds > 0) {
                                            countdownSeconds = remainingSeconds;
                                        } else {
                                            countdownSeconds = 0; // Auto assign will trigger soon
                                        }
                                    }
                                    
                                    const formatCountdown = (seconds: number): string => {
                                        if (seconds <= 0) return '0s';
                                        const mins = Math.floor(seconds / 60);
                                        const secs = seconds % 60;
                                        if (mins > 0) {
                                            return `${mins}m ${secs}s`;
                                        }
                                        return `${secs}s`;
                                    };
                                    
                                    return (
                                        <button 
                                            onClick={async () => {
                                                await handleAutoAssign();
                                            }}
                                            disabled={!hasPendingRides || !hasOnlineDrivers}
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed relative"
                                        >
                                            <Zap size={16} />
                                            <span>Assign by AI</span>
                                            {countdownSeconds !== null && (
                                                <span className="ml-1 text-xs bg-blue-500/80 px-1.5 py-0.5 rounded font-bold">
                                                    {countdownSeconds <= 0 ? 'NOW' : formatCountdown(countdownSeconds)}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })()}
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

                    {/* Dashboard Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                        {/* Drivers Online */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-md p-1.5 border border-green-200/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <Users size={14} className="text-green-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-green-700">Drivers Online</span>
                                </div>
                                <span className="text-lg font-bold text-green-700">{getOnlineDriversCount()}</span>
                            </div>
                            <div className="text-xs text-green-600 opacity-75">of {getTotalDriversCount()} total</div>
                        </div>

                        {/* Drivers Offline */}
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-md p-1.5 border border-gray-200/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <Users size={14} className="text-gray-500 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-600">Drivers Offline</span>
                                </div>
                                <span className="text-lg font-bold text-gray-700">{getOfflineDriversCount()}</span>
                            </div>
                        </div>

                        {/* Active Rides */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-md p-1.5 border border-blue-200/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <Car size={14} className="text-blue-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-blue-700">Active Rides</span>
                                </div>
                                <span className="text-lg font-bold text-blue-700">{getActiveRidesCount()}</span>
                            </div>
                        </div>

                        {/* Pending Requests */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-md p-1.5 border border-orange-200/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <Clock size={14} className="text-orange-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-orange-700">Pending Requests</span>
                                </div>
                                <span className="text-lg font-bold text-orange-700">{getPendingRequestsCount()}</span>
                            </div>
                        </div>

                        {/* Completed Today */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-md p-1.5 border border-emerald-200/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-emerald-700">Completed Today</span>
                                </div>
                                <span className="text-lg font-bold text-emerald-700">{getCompletedRidesTodayCount()}</span>
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
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 flex items-center justify-between">
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
                                                    {aiAssignmentData.assignments.map((assignment, idx) => {
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
                                                                                <div className="font-bold text-sm text-gray-800">{assignment.ride.guestName || `Guest ${assignment.ride.roomNumber}`}</div>
                                                                                <div className="text-xs text-gray-500">Room {assignment.ride.roomNumber}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-1 text-xs">
                                                                            <div className="flex items-center gap-1 text-gray-600 flex-wrap">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                                                                                <span className="truncate">{assignment.ride.pickup}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1 text-gray-600 flex-wrap">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
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
                                                {aiAssignmentData.assignments.map((assignment) => {
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
                                                                        {assignment.driver.lastName} → {assignment.ride.guestName || `Guest ${assignment.ride.roomNumber}`}
                                                                    </span>
                                                                </div>
                                                                {assignment.isChainTrip && (
                                                                    <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                                                                        Chain
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-600 space-y-0.5">
                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                    <span className="truncate">{assignment.ride.pickup}</span>
                                                                    <span className="text-gray-400">→</span>
                                                                    <span className="truncate">{assignment.ride.destination}</span>
                                                                </div>
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
                                                        {aiAssignmentData.assignments.filter(a => a.isChainTrip).length}
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
                                    <div className="border-t border-gray-200 p-3 bg-gray-50 flex justify-end">
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
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col max-h-[600px]">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-sm text-gray-800">
                                    Pending Requests ({rides.filter(r => r.status === BuggyStatus.SEARCHING).length})
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowCreateRideModal(true)}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors"
                                        title="Create New Ride"
                                    >
                                        <Car size={14} />
                                        New Ride
                                    </button>
                                    
                                    {/* Merge Options Button */}
                                    {(() => {
                                        const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING);
                                        let mergeCount = 0;
                                        for (let i = 0; i < pendingRides.length - 1; i++) {
                                            for (let j = i + 1; j < pendingRides.length; j++) {
                                                if (canCombineRides(pendingRides[i], pendingRides[j])) {
                                                    mergeCount++;
                                                }
                                            }
                                        }
                                        if (mergeCount === 0) return null;
                                        return (
                                            <button
                                                onClick={() => setShowMergeModal(true)}
                                                className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded transition-colors"
                                                title="View Merge Options"
                                            >
                                                🔗 Merge ({mergeCount})
                                            </button>
                                        );
                                    })()}
                                    
                                    <div className="flex items-center gap-2">
                                        {/* Toggle Switch */}
                                        <button
                                            onClick={() => setFleetConfig({...fleetConfig, autoAssignEnabled: !fleetConfig.autoAssignEnabled})}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                                                fleetConfig.autoAssignEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                                            }`}
                                            title={fleetConfig.autoAssignEnabled ? 'Disable Auto Assign' : 'Enable Auto Assign'}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    fleetConfig.autoAssignEnabled ? 'translate-x-5' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                        
                                        {/* Auto Assign Info */}
                                        {fleetConfig.autoAssignEnabled && (
                                            <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-semibold">
                                                Auto: {fleetConfig.maxWaitTimeBeforeAutoAssign}s
                                            </span>
                                        )}
                                        {!fleetConfig.autoAssignEnabled && (
                                            <span className="text-xs text-gray-500 font-medium">
                                                Auto: Off
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 flex-1 overflow-y-auto">
                                {rides.filter(r => r.status === BuggyStatus.SEARCHING).length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-xs">
                                        No pending requests.
                                    </div>
                                ) : (
                                    (() => {
                                        // Sort by wait time (longest first) and map to display
                                        const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING)
                                            .map(ride => {
                                                const waitTime = Math.floor((Date.now() - ride.timestamp) / 1000);
                                                return { ride, waitTime };
                                            })
                                            .sort((a, b) => b.waitTime - a.waitTime); // Longest wait first
                                        
                                        return pendingRides.map(({ ride, waitTime }, index) => {
                                            const waitMinutes = Math.floor(waitTime / 60);
                                            const waitSeconds = waitTime % 60;
                                            
                                            // Determine urgency level based on wait time
                                            let urgencyLevel: 'normal' | 'warning' | 'urgent' = 'normal';
                                            if (waitTime >= 600) urgencyLevel = 'urgent';
                                            else if (waitTime >= 300) urgencyLevel = 'warning';
                                            
                                            const styles = {
                                                urgent: { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-100 text-red-700' },
                                                warning: { bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-100 text-orange-700' },
                                                normal: { bg: 'bg-white', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600' }
                                            };
                                            const style = styles[urgencyLevel];
                                            
                                            return (
                                                <div key={ride.id} className={`${style.bg} ${style.border} p-2 rounded-lg border transition-all duration-200`}>
                                                    {/* Header Row: Room + Guest + Pax + Wait Time */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className="font-semibold text-sm text-gray-800">#{ride.roomNumber}</span>
                                                            <span className="text-xs text-gray-500 truncate">{ride.guestName}</span>
                                                            <span className="text-[10px] text-gray-500">{ride.guestCount || 1} pax</span>
                                                        </div>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${style.badge}`}>
                                                            {waitMinutes}m {waitSeconds}s
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Route Row */}
                                                    <div className="flex items-center gap-1.5 text-xs mt-1">
                                                        <span className="text-gray-500">From:</span>
                                                        <span className="text-gray-700 font-medium truncate">{ride.pickup}</span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className="text-gray-500">To:</span>
                                                        <span className="text-gray-700 font-medium truncate">{ride.destination}</span>
                                                    </div>
                                                    
                                                    {/* Notes - if exists */}
                                                    {ride.notes && ride.notes.trim() && (
                                                        <div className="text-[10px] text-amber-600 truncate mt-0.5">
                                                            Note: {ride.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()
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
                                    <button 
                                        onClick={() => setDriverViewMode('LIST')}
                                        className={`p-1 rounded transition ${
                                            driverViewMode === 'LIST' 
                                                ? 'text-blue-600 bg-blue-50' 
                                                : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                        title="List View"
                                    >
                                        <List size={14} />
                                    </button>
                                    <button 
                                        onClick={() => setDriverViewMode('MAP')}
                                        className={`p-1 rounded transition ${
                                            driverViewMode === 'MAP' 
                                                ? 'text-blue-600 bg-blue-50' 
                                                : 'text-gray-400 hover:text-gray-600'
                                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400`}
                                        title="Map View"
                                        disabled={true}
                                    >
                                        <Map size={14} />
                                    </button>
                                </div>
                            </div>
                            {driverViewMode === 'LIST' ? (
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {(() => {
                                        const driverUsers = users.filter(u => u.role === UserRole.DRIVER);
                                        
                                        // Enhanced sorting: AVAILABLE > BUSY (near completion) > BUSY > OFFLINE
                                        const sortedDrivers = driverUsers.map(driver => {
                                            const driverIdStr = driver.id ? String(driver.id) : '';
                                            const driverRides = rides.filter(r => {
                                                const rideDriverId = r.driverId ? String(r.driverId) : '';
                                                return rideDriverId === driverIdStr && 
                                                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
                                            });
                                            const hasActiveRide = driverRides.length > 0;
                                            
                                            // Determine driver status
                                            let driverStatus: 'AVAILABLE' | 'BUSY' | 'NEAR_COMPLETION' | 'OFFLINE' = 'OFFLINE';
                                            
                                            if (hasActiveRide) {
                                                // Check if any trip is near completion
                                                const hasNearCompletion = driverRides.some(r => {
                                                    if (r.status === BuggyStatus.ON_TRIP && r.pickedUpAt) {
                                                        const tripDuration = Math.floor((Date.now() - r.pickedUpAt) / 1000);
                                                        return tripDuration > 180;
                                                    }
                                                    return false;
                                                });
                                                driverStatus = hasNearCompletion ? 'NEAR_COMPLETION' : 'BUSY';
                                            } else {
                                                // Check if driver has recent heartbeat (updated_at within last 30 seconds)
                                                // This is the PRIMARY way to determine if driver is online
                                                if (driver.updatedAt) {
                                                    const timeSinceUpdate = Date.now() - driver.updatedAt;
                                                    if (timeSinceUpdate < 30000) { // 30 seconds
                                                        driverStatus = 'AVAILABLE';
                                                    } else {
                                                        // Driver has been offline for more than 30 seconds
                                                        driverStatus = 'OFFLINE';
                                                    }
                                                } else {
                                                    // No updatedAt timestamp means driver is offline
                                                    driverStatus = 'OFFLINE';
                                                }
                                                
                                                // Note: We removed the fallback to completed rides because:
                                                // 1. A driver who just logged out should be OFFLINE immediately
                                                // 2. Heartbeat (updatedAt) is the most reliable indicator of online status
                                                // 3. Completed rides can be old and don't indicate current online status
                                            }
                                            
                                            // Calculate priority score (lower = higher priority)
                                            let priorityScore = 0;
                                            if (driverStatus === 'AVAILABLE') priorityScore = 1;
                                            else if (driverStatus === 'NEAR_COMPLETION') priorityScore = 2;
                                            else if (driverStatus === 'BUSY') priorityScore = 3;
                                            else priorityScore = 4; // OFFLINE
                                            
                                            return { driver, driverRides, hasActiveRide, driverStatus, priorityScore };
                                        }).sort((a, b) => {
                                            // Sort by priority score first
                                            if (a.priorityScore !== b.priorityScore) {
                                                return a.priorityScore - b.priorityScore;
                                            }
                                            // Then alphabetically
                                            return a.driver.lastName.localeCompare(b.driver.lastName);
                                        });
                                    
                                        return sortedDrivers.map(({ driver, driverRides, hasActiveRide, driverStatus }) => {
                                            const driverDisplayName = driver.lastName || 'Unknown';
                                            const driverLocation = getDriverLocation(driver);
                                            
                                            // Status styling
                                            const statusStyles = {
                                                AVAILABLE: { bg: 'bg-green-50', border: 'border-green-300', badge: 'bg-green-500 text-white', text: 'ONLINE' },
                                                NEAR_COMPLETION: { bg: 'bg-blue-50', border: 'border-blue-300', badge: 'bg-blue-500 text-white', text: 'FINISHING' },
                                                BUSY: { bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-500 text-white', text: 'BUSY' },
                                                OFFLINE: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-400 text-white', text: 'OFFLINE' }
                                            };
                                            const style = statusStyles[driverStatus];

                                            return (
                                                <div key={driver.id} className={`${style.bg} ${style.border} p-2 rounded-lg border transition-all duration-200`}>
                                                    {/* Driver Header - Compact */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="font-bold text-sm text-gray-800">{driverDisplayName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            {hasActiveRide && (
                                                                <span className="text-[10px] text-gray-600 font-medium">
                                                                    {driverRides.length} job{driverRides.length > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                            {driverStatus !== 'NEAR_COMPLETION' && (
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${style.badge}`}>
                                                                    {style.text}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Active Rides - Compact List */}
                                                    {hasActiveRide && (
                                                        <div className="mt-1.5 space-y-1">
                                                            {driverRides.map((ride, idx) => {
                                                                const tripProgress = ride.status === BuggyStatus.ON_TRIP && ride.pickedUpAt
                                                                    ? Math.floor((Date.now() - ride.pickedUpAt) / 60000)
                                                                    : null;
                                                                const guestInfo = guestInfoCache[ride.roomNumber];
                                                                
                                                                return (
                                                                    <div key={ride.id || idx} className="bg-white/60 rounded px-2 py-1.5 border border-gray-200/50">
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <div className="flex-1 min-w-0">
                                                                                {/* Room + Status + Route inline */}
                                                                                <div className="flex items-center gap-1.5 text-xs">
                                                                                    <span className="font-semibold text-gray-800">#{ride.roomNumber}</span>
                                                                                    {guestInfo && (
                                                                                        <span className="text-gray-500 truncate">{guestInfo.last_name}</span>
                                                                                    )}
                                                                                    <span className="text-[9px] text-gray-500">{ride.guestCount || 1} pax</span>
                                                                                    <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${
                                                                                        ride.status === BuggyStatus.ON_TRIP ? 'bg-emerald-100 text-emerald-700' :
                                                                                        ride.status === BuggyStatus.ARRIVING ? 'bg-blue-100 text-blue-700' :
                                                                                        'bg-amber-100 text-amber-700'
                                                                                    }`}>
                                                                                        {ride.status === BuggyStatus.ON_TRIP ? 'ON-TRIP' :
                                                                                         ride.status === BuggyStatus.ARRIVING ? 'ARRIVING' : 'ASSIGNED'}
                                                                                    </span>
                                                                                    {tripProgress !== null && (
                                                                                        <span className="text-[9px] text-gray-500">{tripProgress}m</span>
                                                                                    )}
                                                                                </div>
                                                                                {/* Route */}
                                                                                <div className="text-[10px] text-gray-600 truncate mt-0.5">
                                                                                    {ride.pickup} → {ride.destination}
                                                                                </div>
                                                                            </div>
                                                                            {/* Action Button */}
                                                                            <button
                                                                                onClick={() => ride.status === BuggyStatus.ON_TRIP 
                                                                                    ? handleEndRide(ride.id) 
                                                                                    : handlePickupGuest(ride.id)}
                                                                                className={`text-[10px] px-2 py-1 rounded font-medium transition-colors flex-shrink-0 flex items-center gap-1 ${
                                                                                    ride.status === BuggyStatus.ON_TRIP
                                                                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                                }`}
                                                                            >
                                                                                {ride.status === BuggyStatus.ON_TRIP ? (
                                                                                    <>
                                                                                        <CheckCircle size={12} />
                                                                                        <span>Completed</span>
                                                                                    </>
                                                                                ) : (
                                                                                    'Pickup'
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            ) : (
                                // MAP VIEW - CSS Only Design
                                <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 overflow-hidden h-[400px] rounded-md border border-gray-200">
                                    {/* Map Background with CSS Grid Pattern */}
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: `
                                            linear-gradient(to right, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                                            linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
                                        `,
                                        backgroundSize: '40px 40px'
                                    }}></div>
                                    
                                    {/* Simulated Areas using CSS */}
                                    <div className="absolute inset-0">
                                        {/* Main Lobby */}
                                        <div className="absolute top-[35%] left-[40%] w-32 h-24 bg-emerald-400/40 rounded-lg border-2 border-emerald-600/50 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-emerald-900">Lobby</span>
                                        </div>
                                        
                                        {/* Pool Area */}
                                        <div className="absolute bottom-[20%] left-[15%] w-24 h-20 bg-cyan-400/40 rounded-full border-2 border-cyan-600/50 flex items-center justify-center">
                                            <span className="text-[9px] font-bold text-cyan-900">Pool</span>
                                        </div>
                                        
                                        {/* Restaurant */}
                                        <div className="absolute bottom-[25%] right-[20%] w-28 h-20 bg-amber-400/40 rounded-lg border-2 border-amber-600/50 flex items-center justify-center">
                                            <span className="text-[9px] font-bold text-amber-900">Restaurant</span>
                                        </div>
                                        
                                        {/* Spa */}
                                        <div className="absolute top-[30%] right-[15%] w-20 h-20 bg-pink-400/40 rounded-full border-2 border-pink-600/50 flex items-center justify-center">
                                            <span className="text-[9px] font-bold text-pink-900">Spa</span>
                                        </div>
                                        
                                        {/* Villas Area */}
                                        <div className="absolute top-[20%] left-[5%] w-24 h-20 bg-lime-400/40 rounded-lg border-2 border-lime-600/50 flex items-center justify-center">
                                            <span className="text-[9px] font-bold text-lime-900">Villas</span>
                                        </div>
                                        
                                        {/* Parking */}
                                        <div className="absolute top-[10%] left-[20%] w-28 h-16 bg-gray-400/40 rounded border-2 border-gray-600/50 flex items-center justify-center">
                                            <span className="text-[9px] font-bold text-gray-900">Parking</span>
                                        </div>
                                        
                                        {/* Roads - Horizontal */}
                                        <div className="absolute top-[50%] left-0 right-0 h-2 bg-emerald-700/20"></div>
                                        {/* Roads - Vertical */}
                                        <div className="absolute left-[50%] top-0 bottom-0 w-2 bg-emerald-700/20"></div>
                                    </div>
                                    
                                    {/* Map Title */}
                                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm border border-gray-200">
                                            <div className="text-xs font-bold text-emerald-900">Furama Resort</div>
                                            <div className="text-[9px] text-emerald-700">Driver Locations</div>
                                        </div>
                                    </div>
                                    
                                    {/* Driver Points */}
                                    {(() => {
                                        const driverUsers = users.filter(u => u.role === UserRole.DRIVER);
                                        
                                        return driverUsers.map((driver, index) => {
                                            const driverIdStr = driver.id ? String(driver.id) : '';
                                            const driverRides = rides.filter(r => {
                                                const rideDriverId = r.driverId ? String(r.driverId) : '';
                                                return rideDriverId === driverIdStr && 
                                                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
                                            });
                                            const currentRide = driverRides[0];
                                            const hasActiveRide = currentRide && 
                                                (currentRide.status === BuggyStatus.ASSIGNED || 
                                                 currentRide.status === BuggyStatus.ARRIVING || 
                                                 currentRide.status === BuggyStatus.ON_TRIP);
                                            
                                            // Determine driver status
                                            let driverStatus: 'AVAILABLE' | 'BUSY' | 'NEAR_COMPLETION' | 'OFFLINE' = 'OFFLINE';
                                            let isNearCompletion = false;
                                            
                                            if (hasActiveRide) {
                                                if (currentRide.status === BuggyStatus.ON_TRIP) {
                                                    const tripDuration = currentRide.pickedUpAt 
                                                        ? Math.floor((Date.now() - currentRide.pickedUpAt) / 1000)
                                                        : 0;
                                                    if (tripDuration > 180) {
                                                        driverStatus = 'NEAR_COMPLETION';
                                                        isNearCompletion = true;
                                                    } else {
                                                        driverStatus = 'BUSY';
                                                    }
                                                } else {
                                                    driverStatus = 'BUSY';
                                                }
                                            } else {
                                                if (driver.updatedAt) {
                                                    const timeSinceUpdate = Date.now() - driver.updatedAt;
                                                    if (timeSinceUpdate < 30000) {
                                                        driverStatus = 'AVAILABLE';
                                                    }
                                                }
                                                
                                                if (driverStatus === 'OFFLINE') {
                                                    const recentCompleted = rides.filter(r => {
                                                        const rideDriverId = r.driverId ? String(r.driverId) : '';
                                                        return rideDriverId === driverIdStr && 
                                                            r.status === BuggyStatus.COMPLETED && 
                                                            r.completedAt && 
                                                            (Date.now() - r.completedAt < 3600000);
                                                    });
                                                    driverStatus = recentCompleted.length > 0 ? 'AVAILABLE' : 'OFFLINE';
                                                }
                                            }
                                            
                                            // Don't show offline drivers
                                            if (driverStatus === 'OFFLINE') return null;
                                            
                                            // Calculate position based on driver index (simulated positions)
                                            // Distribute drivers across the map
                                            const totalDrivers = driverUsers.filter(d => {
                                                const dIdStr = d.id ? String(d.id) : '';
                                                const dRides = rides.filter(r => {
                                                    const rideDriverId = r.driverId ? String(r.driverId) : '';
                                                    return rideDriverId === dIdStr && 
                                                        (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
                                                });
                                                const hasActive = dRides[0] && 
                                                    (dRides[0].status === BuggyStatus.ASSIGNED || 
                                                     dRides[0].status === BuggyStatus.ARRIVING || 
                                                     dRides[0].status === BuggyStatus.ON_TRIP);
                                                
                                                if (hasActive) return true;
                                                if (d.updatedAt && (Date.now() - d.updatedAt < 30000)) return true;
                                                const recent = rides.filter(r => {
                                                    const rideDriverId = r.driverId ? String(r.driverId) : '';
                                                    return rideDriverId === dIdStr && 
                                                        r.status === BuggyStatus.COMPLETED && 
                                                        r.completedAt && 
                                                        (Date.now() - r.completedAt < 3600000);
                                                });
                                                return recent.length > 0;
                                            }).length;
                                            
                                            const driverIndex = driverUsers.slice(0, index + 1).filter(d => {
                                                const dIdStr = d.id ? String(d.id) : '';
                                                const dRides = rides.filter(r => {
                                                    const rideDriverId = r.driverId ? String(r.driverId) : '';
                                                    return rideDriverId === dIdStr && 
                                                        (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
                                                });
                                                const hasActive = dRides[0] && 
                                                    (dRides[0].status === BuggyStatus.ASSIGNED || 
                                                     dRides[0].status === BuggyStatus.ARRIVING || 
                                                     dRides[0].status === BuggyStatus.ON_TRIP);
                                                
                                                if (hasActive) return true;
                                                if (d.updatedAt && (Date.now() - d.updatedAt < 30000)) return true;
                                                const recent = rides.filter(r => {
                                                    const rideDriverId = r.driverId ? String(r.driverId) : '';
                                                    return rideDriverId === dIdStr && 
                                                        r.status === BuggyStatus.COMPLETED && 
                                                        r.completedAt && 
                                                        (Date.now() - r.completedAt < 3600000);
                                                });
                                                return recent.length > 0;
                                            }).length - 1;
                                            
                                            // Simulated positions - distribute across map
                                            const positions = [
                                                { top: '25%', left: '30%' },
                                                { top: '45%', left: '25%' },
                                                { top: '65%', left: '35%' },
                                                { top: '35%', left: '60%' },
                                                { top: '55%', left: '65%' },
                                                { top: '25%', left: '70%' },
                                                { top: '70%', left: '20%' },
                                                { top: '50%', left: '75%' },
                                            ];
                                            
                                            const position = positions[driverIndex % positions.length] || { 
                                                top: `${20 + (driverIndex * 15) % 60}%`, 
                                                left: `${15 + (driverIndex * 20) % 70}%` 
                                            };
                                            
                                            const driverDisplayName = driver.lastName || 'Unknown';
                                            
                                            // Determine point color and style
                                            let pointColor = '';
                                            let pointBg = '';
                                            let pointBorder = '';
                                            let pulseClass = '';
                                            
                                            if (driverStatus === 'AVAILABLE') {
                                                pointColor = 'bg-green-500';
                                                pointBg = 'bg-green-100';
                                                pointBorder = 'border-green-600';
                                                pulseClass = 'animate-pulse';
                                            } else if (driverStatus === 'NEAR_COMPLETION') {
                                                pointColor = 'bg-blue-500';
                                                pointBg = 'bg-blue-100';
                                                pointBorder = 'border-blue-600';
                                                pulseClass = 'animate-pulse';
                                            } else {
                                                pointColor = 'bg-orange-500';
                                                pointBg = 'bg-orange-100';
                                                pointBorder = 'border-orange-600';
                                            }
                                            
                                            return (
                                                <div 
                                                    key={driver.id} 
                                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer hover:z-50 transition-all duration-200"
                                                    style={{ top: position.top, left: position.left }}
                                                >
                                                    {/* Driver Name Label */}
                                                    <div className={`${pointBg} ${pointBorder} border-2 text-[9px] font-bold px-2 py-0.5 rounded-lg shadow-md mb-1.5 whitespace-nowrap z-20 ${
                                                        driverStatus === 'AVAILABLE' ? 'text-green-900' :
                                                        driverStatus === 'NEAR_COMPLETION' ? 'text-blue-900' : 'text-orange-900'
                                                    } opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                        {driverDisplayName.split(' ')[0]}
                                                        {isNearCompletion && ' ⚡'}
                                                    </div>
                                                    
                                                    {/* Driver Point */}
                                                    <div className="relative">
                                                        {/* Pulse Ring for Available/Near Completion */}
                                                        {(driverStatus === 'AVAILABLE' || driverStatus === 'NEAR_COMPLETION') && (
                                                            <div className={`absolute inset-0 ${pointColor} rounded-full ${pulseClass} opacity-75`} 
                                                                 style={{ transform: 'scale(1.5)' }}></div>
                                                        )}
                                                        
                                                        {/* Main Point */}
                                                        <div className={`relative ${pointColor} w-4 h-4 rounded-full border-2 border-white shadow-lg ${pointColor === 'bg-green-500' ? 'ring-2 ring-green-300' : pointColor === 'bg-blue-500' ? 'ring-2 ring-blue-300' : ''} transition-transform group-hover:scale-125`}>
                                                            {/* Inner dot */}
                                                            <div className="absolute inset-0.5 bg-white rounded-full opacity-50"></div>
                                                        </div>
                                                        
                                                        {/* Status Indicator */}
                                                        {driverStatus === 'AVAILABLE' && (
                                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white"></div>
                                                        )}
                                                        {isNearCompletion && (
                                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full border border-white animate-ping"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                    
                                    {/* Legend */}
                                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1.5 rounded-lg shadow-sm border border-gray-200 z-10">
                                        <div className="text-[9px] font-bold text-gray-700 mb-1">Legend:</div>
                                        <div className="flex items-center gap-2 text-[8px]">
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                                                <span className="text-gray-600">Available</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                                                <span className="text-gray-600">Near Done</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full border border-white"></div>
                                                <span className="text-gray-600">Busy</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Column 3: Recent Completed */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-sm text-gray-800">
                                    Recent Completed
                                </h3>
                            </div>
                            
                            {/* Recent Completed Section */}
                            <div className="pt-3">
                                <div className="space-y-1.5 max-h-[450px] overflow-y-auto">
                                    {(() => {
                                        // Sort completed rides by completion time (most recent first)
                                        const completedRides = rides
                                            .filter(r => r.status === BuggyStatus.COMPLETED)
                                            .sort((a, b) => {
                                                const timeA = a.completedAt || a.timestamp || 0;
                                                const timeB = b.completedAt || b.timestamp || 0;
                                                return timeB - timeA; // Most recent first
                                            })
                                            .slice(0, 5);
                                        
                                        return completedRides.map((ride) => {
                                            // Find driver name
                                            const rideDriverId = ride.driverId ? String(ride.driverId) : '';
                                            const driver = users.find(u => {
                                                const userIdStr = u.id ? String(u.id) : '';
                                                return userIdStr === rideDriverId;
                                            });
                                            const driverName = driver ? driver.lastName || 'Unknown' : 'N/A';
                                            
                                            // Calculate time ago
                                            const completedTime = ride.completedAt || ride.timestamp || Date.now();
                                            const timeAgo = Math.floor((Date.now() - completedTime) / 1000 / 60); // minutes ago
                                            let timeAgoText = '';
                                            if (timeAgo < 1) {
                                                timeAgoText = 'Just now';
                                            } else if (timeAgo < 60) {
                                                timeAgoText = `${timeAgo}m ago`;
                                            } else {
                                                const hoursAgo = Math.floor(timeAgo / 60);
                                                timeAgoText = `${hoursAgo}h ago`;
                                            }
                                            
                                            // Truncate pickup and destination if too long
                                            const truncateText = (text: string, maxLength: number = 20) => {
                                                if (text.length <= maxLength) return text;
                                                return text.substring(0, maxLength - 3) + '...';
                                            };
                                            
                                            return (
                                                <div key={ride.id} className="bg-gray-50 p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                                    {/* Header Row: Room + Driver + Pax + Time */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className="font-semibold text-sm text-gray-800">#{ride.roomNumber}</span>
                                                            <span className="text-xs text-gray-500">{driverName}</span>
                                                            <span className="text-[10px] text-gray-500">{ride.guestCount || 1} pax</span>
                                                            {ride.rating && (
                                                                <span className="text-[9px] px-1 py-0.5 rounded font-bold bg-yellow-100 text-yellow-700">
                                                                    ★{ride.rating}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            <span className="text-[9px] px-1 py-0.5 rounded font-bold bg-green-100 text-green-700">COMPLETED</span>
                                                            <span className="text-[10px] text-gray-500">{timeAgoText}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Route Row */}
                                                    <div className="flex items-center gap-1.5 text-xs mt-1">
                                                        <span className="text-gray-500">From:</span>
                                                        <span className="text-gray-700 font-medium truncate">{ride.pickup}</span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className="text-gray-500">To:</span>
                                                        <span className="text-gray-700 font-medium truncate">{ride.destination}</span>
                                                    </div>
                                                    
                                                    {/* Notes - if exists */}
                                                    {ride.notes && ride.notes.trim() && (
                                                        <div className="text-[10px] text-amber-600 truncate mt-0.5">
                                                            Note: {ride.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                    {rides.filter(r => r.status === BuggyStatus.COMPLETED).length === 0 && (
                                        <div className="text-center py-3 text-gray-400 text-[10px]">
                                            No completed trips yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                        </>
                    )}

                    {/* Merge Options Modal */}
                    {showMergeModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden relative">
                                {/* Header */}
                                <div className="bg-blue-600 text-white p-3 flex justify-between items-center rounded-t-xl flex-shrink-0">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        🔗 Merge Options
                                    </h3>
                                    <button
                                        onClick={() => setShowMergeModal(false)}
                                        className="text-white hover:text-gray-200 transition"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                
                                {/* Content */}
                                <div className="p-4 overflow-y-auto flex-1">
                                    {(() => {
                                        const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING);
                                        const mergeOptions: Array<{
                                            ride1: RideRequest;
                                            ride2: RideRequest;
                                            totalGuests: number;
                                            isSameRoute: boolean;
                                            key: string;
                                            optimalRoute: { pickup: string; destination: string; routePath: string[]; segments: RouteSegment[]; isChainTrip: boolean };
                                        }> = [];
                                        
                                        // Find all combinable pairs
                                        for (let i = 0; i < pendingRides.length - 1; i++) {
                                            for (let j = i + 1; j < pendingRides.length; j++) {
                                                if (canCombineRides(pendingRides[i], pendingRides[j])) {
                                                    const ride1 = pendingRides[i];
                                                    const ride2 = pendingRides[j];
                                                    const totalGuests = (ride1.guestCount || 1) + (ride2.guestCount || 1);
                                                    const optimalRoute = calculateOptimalMergeRoute(ride1, ride2);
                                                    const isSameRoute = ride1.pickup === ride2.pickup && ride1.destination === ride2.destination;
                                                    
                                                    mergeOptions.push({
                                                        ride1, ride2, totalGuests, isSameRoute: isSameRoute || optimalRoute.isChainTrip,
                                                        key: `merge-${ride1.id}-${ride2.id}`,
                                                        optimalRoute
                                                    });
                                                }
                                            }
                                        }
                                        
                                        if (mergeOptions.length === 0) {
                                            return (
                                                <div className="text-center py-8 text-gray-500">
                                                    <p className="text-lg">No merge options available</p>
                                                    <p className="text-sm mt-2">Need at least 2 pending rides with combined guests ≤ 7</p>
                                                </div>
                                            );
                                        }
                                        
                                        return (
                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-600 mb-3">
                                                    Found {mergeOptions.length} merge option{mergeOptions.length > 1 ? 's' : ''}. Click "Merge" to combine.
                                                </p>
                                                {mergeOptions.map(({ ride1, ride2, totalGuests, isSameRoute, key, optimalRoute }) => (
                                                    <div key={key} className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                {/* Header row: Guest Names + Tags + Routes */}
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                                                        {ride1.guestName || 'Guest'}
                                                                    </span>
                                                                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-300 font-semibold text-xs">({ride1.pickup} → {ride1.destination})</span>
                                                                    <span className="text-blue-400 text-xs">+</span>
                                                                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                                                        {ride2.guestName || 'Guest'}
                                                                    </span>
                                                                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-300 font-semibold text-xs">({ride2.pickup} → {ride2.destination})</span>
                                                                    <span className="text-gray-400 text-xs">•</span>
                                                                    <span className="text-xs text-gray-600">{totalGuests}/7 pax</span>
                                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                                        isSameRoute ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                                    }`}>
                                                                        {isSameRoute ? 'Same' : optimalRoute.isChainTrip ? 'Chain' : 'Merge'}
                                                                    </span>
                                                                </div>
                                                                
                                                                {/* Optimal merged route - show detailed segments */}
                                                                <div className="mt-3">
                                                                    <div className="text-xs text-gray-700 font-semibold mb-2 flex items-center gap-1.5">
                                                                        <MapPin size={13} className="text-gray-600" />
                                                                        <span>Optimized Route</span>
                                                                    </div>
                                                                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                                                                        {(() => {
                                                                            // Track guest pickup/dropoff status
                                                                            const guestStatus: Record<string, { pickedUp: boolean; dropped: boolean; roomNumber: string; guestCount: number }> = {
                                                                                [ride1.guestName || 'Guest1']: { pickedUp: false, dropped: false, roomNumber: ride1.roomNumber, guestCount: ride1.guestCount || 1 },
                                                                                [ride2.guestName || 'Guest2']: { pickedUp: false, dropped: false, roomNumber: ride2.roomNumber, guestCount: ride2.guestCount || 1 }
                                                                            };
                                                                            
                                                                            const allActions: Array<{
                                                                                type: 'pickup' | 'dropoff' | 'move';
                                                                                location: string;
                                                                                guests: Array<{ name: string; roomNumber: string; guestCount: number }>;
                                                                                segment?: RouteSegment;
                                                                            }> = [];
                                                                            
                                                                            // Process each segment to extract actions
                                                                            optimalRoute.segments.forEach((segment, idx) => {
                                                                                // Determine which guests are picked up at segment.from
                                                                                const pickedUpGuests: Array<{ name: string; roomNumber: string; guestCount: number }> = [];
                                                                                if (segment.from === ride1.pickup && !guestStatus[ride1.guestName || 'Guest1'].pickedUp) {
                                                                                    pickedUpGuests.push({ name: ride1.guestName || 'Guest', roomNumber: ride1.roomNumber, guestCount: ride1.guestCount || 1 });
                                                                                    guestStatus[ride1.guestName || 'Guest1'].pickedUp = true;
                                                                                }
                                                                                if (segment.from === ride2.pickup && !guestStatus[ride2.guestName || 'Guest2'].pickedUp) {
                                                                                    pickedUpGuests.push({ name: ride2.guestName || 'Guest', roomNumber: ride2.roomNumber, guestCount: ride2.guestCount || 1 });
                                                                                    guestStatus[ride2.guestName || 'Guest2'].pickedUp = true;
                                                                                }
                                                                                
                                                                                // Determine which guests are dropped off at segment.to
                                                                                // Check both rides - both guests can be dropped at the same location
                                                                                const droppedGuests: Array<{ name: string; roomNumber: string; guestCount: number }> = [];
                                                                                
                                                                                // Check ride1
                                                                                if (segment.to === ride1.destination && guestStatus[ride1.guestName || 'Guest1'].pickedUp && !guestStatus[ride1.guestName || 'Guest1'].dropped) {
                                                                                    droppedGuests.push({ name: ride1.guestName || 'Guest', roomNumber: ride1.roomNumber, guestCount: ride1.guestCount || 1 });
                                                                                    guestStatus[ride1.guestName || 'Guest1'].dropped = true;
                                                                                }
                                                                                
                                                                                // Check ride2 - can be dropped at the same location as ride1
                                                                                if (segment.to === ride2.destination && guestStatus[ride2.guestName || 'Guest2'].pickedUp && !guestStatus[ride2.guestName || 'Guest2'].dropped) {
                                                                                    droppedGuests.push({ name: ride2.guestName || 'Guest', roomNumber: ride2.roomNumber, guestCount: ride2.guestCount || 1 });
                                                                                    guestStatus[ride2.guestName || 'Guest2'].dropped = true;
                                                                                }
                                                                                
                                                                                // Add pickup action if any
                                                                                if (pickedUpGuests.length > 0) {
                                                                                    allActions.push({
                                                                                        type: 'pickup',
                                                                                        location: segment.from,
                                                                                        guests: pickedUpGuests,
                                                                                        segment
                                                                                    });
                                                                                }
                                                                                
                                                                                // Add dropoff action if any
                                                                                if (droppedGuests.length > 0) {
                                                                                    allActions.push({
                                                                                        type: 'dropoff',
                                                                                        location: segment.to,
                                                                                        guests: droppedGuests,
                                                                                        segment
                                                                                    });
                                                                                }
                                                                                
                                                                                // Only add move/transit action if there's no pickup/dropoff at the destination
                                                                                // This prevents redundant move actions when we already have pickup/dropoff actions
                                                                                const hasActionAtDestination = pickedUpGuests.length > 0 || droppedGuests.length > 0;
                                                                                if (!hasActionAtDestination) {
                                                                                    allActions.push({
                                                                                        type: 'move',
                                                                                        location: `${segment.from} → ${segment.to}`,
                                                                                        guests: [],
                                                                                        segment
                                                                                    });
                                                                                } else if (pickedUpGuests.length === 0 && droppedGuests.length === 0) {
                                                                                    // Only add move if there's no action at destination AND no action at source
                                                                                    // But if we have pickup at source, we still need move to show route
                                                                                    const nextSegment = optimalRoute.segments[idx + 1];
                                                                                    const needsMoveToShowRoute = segment.from !== segment.to;
                                                                                    if (needsMoveToShowRoute) {
                                                                                        allActions.push({
                                                                                            type: 'move',
                                                                                            location: `${segment.from} → ${segment.to}`,
                                                                                            guests: [],
                                                                                            segment
                                                                                        });
                                                                                    }
                                                                                }
                                                                            });
                                                                            
                                                                            // Merge consecutive actions: if move action ends at a location and next action is pickup/dropoff at that location
                                                                            // Also merge multiple dropoff/pickup actions at the same location
                                                                            const mergedActions: typeof allActions = [];
                                                                            for (let i = 0; i < allActions.length; i++) {
                                                                                const current = allActions[i];
                                                                                const next = allActions[i + 1];
                                                                                
                                                                                // If current is move action and next is pickup at the destination
                                                                                if (current.type === 'move' && current.segment && next && next.type === 'pickup' && next.location === current.segment.to) {
                                                                                    // Collect all consecutive pickup actions at the same location
                                                                                    const allPickupGuests = [...next.guests];
                                                                                    let j = i + 2;
                                                                                    while (j < allActions.length && allActions[j].type === 'pickup' && allActions[j].location === next.location) {
                                                                                        allPickupGuests.push(...allActions[j].guests);
                                                                                        j++;
                                                                                    }
                                                                                    
                                                                                    // Merge: show move with pickup info
                                                                                    mergedActions.push({
                                                                                        type: 'pickup',
                                                                                        location: next.location,
                                                                                        guests: allPickupGuests,
                                                                                        segment: current.segment
                                                                                    });
                                                                                    i = j - 1; // Skip all merged actions
                                                                                }
                                                                                // If current is move action and next is dropoff at the destination
                                                                                else if (current.type === 'move' && current.segment && next && next.type === 'dropoff' && next.location === current.segment.to) {
                                                                                    // Collect all consecutive dropoff actions at the same location (including move actions that lead to the same dropoff)
                                                                                    const allDropoffGuests = [...next.guests];
                                                                                    let j = i + 2;
                                                                                    // Skip any move actions that lead to the same dropoff location
                                                                                    while (j < allActions.length) {
                                                                                        if (allActions[j].type === 'dropoff' && allActions[j].location === next.location) {
                                                                                            allDropoffGuests.push(...allActions[j].guests);
                                                                                            j++;
                                                                                        } else if (allActions[j].type === 'move' && allActions[j].segment && allActions[j].segment.to === next.location) {
                                                                                            // Skip move actions that lead to the same dropoff location
                                                                                            j++;
                                                                                        } else {
                                                                                            break;
                                                                                        }
                                                                                    }
                                                                                    
                                                                                    // Merge: show move with dropoff info
                                                                                    mergedActions.push({
                                                                                        type: 'dropoff',
                                                                                        location: next.location,
                                                                                        guests: allDropoffGuests,
                                                                                        segment: current.segment
                                                                                    });
                                                                                    i = j - 1; // Skip all merged actions
                                                                                }
                                                                                // If current is dropoff and next is move to the same location, merge them (dropoff before move)
                                                                                else if (current.type === 'dropoff' && next && next.type === 'move' && next.segment && next.segment.to === current.location && next.segment.from === current.segment?.from) {
                                                                                    // Merge: show move with dropoff info
                                                                                    mergedActions.push({
                                                                                        type: 'dropoff',
                                                                                        location: current.location,
                                                                                        guests: current.guests,
                                                                                        segment: current.segment
                                                                                    });
                                                                                    i++; // Skip next move action as it's merged
                                                                                }
                                                                                // If current is dropoff and next is also dropoff at the same location, merge them
                                                                                else if (current.type === 'dropoff' && next && next.type === 'dropoff' && next.location === current.location) {
                                                                                    const allDropoffGuests = [...current.guests, ...next.guests];
                                                                                    mergedActions.push({
                                                                                        type: 'dropoff',
                                                                                        location: current.location,
                                                                                        guests: allDropoffGuests,
                                                                                        segment: current.segment || next.segment
                                                                                    });
                                                                                    i++; // Skip next action as it's merged
                                                                                }
                                                                                // If current is pickup and next is move to the same location, merge them (pickup before move)
                                                                                else if (current.type === 'pickup' && next && next.type === 'move' && next.segment && next.segment.to === current.location && next.segment.from === current.segment?.from) {
                                                                                    // Merge: show move with pickup info
                                                                                    mergedActions.push({
                                                                                        type: 'pickup',
                                                                                        location: current.location,
                                                                                        guests: current.guests,
                                                                                        segment: current.segment
                                                                                    });
                                                                                    i++; // Skip next move action as it's merged
                                                                                }
                                                                                // Skip standalone move actions that duplicate dropoff/pickup locations
                                                                                else if (current.type === 'move' && current.segment) {
                                                                                    // Check if this move is redundant (same as previous dropoff/pickup)
                                                                                    const prevAction = mergedActions[mergedActions.length - 1];
                                                                                    if (prevAction && (
                                                                                        (prevAction.type === 'dropoff' && prevAction.location === current.segment.to) ||
                                                                                        (prevAction.type === 'pickup' && prevAction.location === current.segment.to)
                                                                                    )) {
                                                                                        // Skip this redundant move action
                                                                                        continue;
                                                                                    }
                                                                                    mergedActions.push(current);
                                                                                }
                                                                                else {
                                                                                    mergedActions.push(current);
                                                                                }
                                                                            }
                                                                            
                                                                            // Replace allActions with mergedActions
                                                                            allActions.length = 0;
                                                                            allActions.push(...mergedActions);
                                                                            
                                                                            // If no actions were created, show segments directly
                                                                            if (allActions.length === 0 && optimalRoute.segments.length > 0) {
                                                                                return (
                                                                                    <div className="space-y-2.5">
                                                                                        {optimalRoute.segments.map((segment, idx) => (
                                                                                            <div key={idx} className="flex items-start gap-3">
                                                                                                <div className="flex-shrink-0 w-6 h-6 bg-white border-2 border-gray-300 text-gray-700 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm">
                                                                                                    {idx + 1}
                                                                                                </div>
                                                                                                <div className="flex-1 flex items-center gap-1.5 text-xs pt-0.5">
                                                                                                    <span className="bg-white text-gray-900 px-2 py-0.5 rounded border border-gray-300 font-semibold shadow-sm">{segment.from}</span>
                                                                                                    <ArrowRight size={11} className="text-gray-400" />
                                                                                                    <span className="bg-white text-gray-900 px-2 py-0.5 rounded border border-gray-300 font-semibold shadow-sm">{segment.to}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            
                                                                            return (
                                                                                <div className="space-y-2.5">
                                                                                    {allActions.map((action, idx) => (
                                                                                        <div key={idx} className="flex items-start gap-3">
                                                                                            {/* Step number */}
                                                                                            <div className="flex-shrink-0 w-6 h-6 bg-white border-2 border-gray-300 text-gray-700 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm">
                                                                                                {idx + 1}
                                                                                            </div>
                                                                                            
                                                                                            {/* Action content */}
                                                                                            <div className="flex-1 min-w-0 pt-0.5">
                                                                                                {action.type === 'pickup' && (
                                                                                                    <div className="flex flex-col gap-1.5">
                                                                                                        {/* Route path if exists */}
                                                                                                        {action.segment && action.segment.from !== action.location && (
                                                                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                                                                <span className="font-medium">{action.segment.from}</span>
                                                                                                                <ArrowRight size={11} className="text-gray-400" />
                                                                                                                <span className="font-medium">{action.location}</span>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {/* Action details */}
                                                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                                                            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200 font-medium text-xs">
                                                                                                                <Users size={11} />
                                                                                                                Pick up
                                                                                                            </span>
                                                                                                            {action.guests.map((guest, gIdx) => (
                                                                                                                <span key={gIdx} className="bg-white text-gray-800 px-2 py-0.5 rounded border border-gray-300 font-medium text-xs shadow-sm">
                                                                                                                    {guest.name}
                                                                                                                </span>
                                                                                                            ))}
                                                                                                            <span className="text-gray-500 text-xs font-medium">at</span>
                                                                                                            <span className="bg-white text-gray-900 px-2 py-0.5 rounded border border-gray-300 font-semibold text-xs shadow-sm">{action.location}</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}
                                                                                                
                                                                                                {action.type === 'dropoff' && (
                                                                                                    <div className="flex flex-col gap-1.5">
                                                                                                        {/* Route path if exists */}
                                                                                                        {action.segment && action.segment.from !== action.location && (
                                                                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                                                                <span className="font-medium">{action.segment.from}</span>
                                                                                                                <ArrowRight size={11} className="text-gray-400" />
                                                                                                                <span className="font-medium">{action.location}</span>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {/* Action details */}
                                                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                                                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 px-2.5 py-1 rounded-md border border-green-200 font-medium text-xs">
                                                                                                                <CheckCircle size={11} />
                                                                                                                Drop off
                                                                                                            </span>
                                                                                                            {action.guests.map((guest, gIdx) => (
                                                                                                                <span key={gIdx} className="bg-white text-gray-800 px-2 py-0.5 rounded border border-gray-300 font-medium text-xs shadow-sm">
                                                                                                                    {guest.name}
                                                                                                                </span>
                                                                                                            ))}
                                                                                                            <span className="text-gray-500 text-xs font-medium">at</span>
                                                                                                            <span className="bg-white text-gray-900 px-2 py-0.5 rounded border border-gray-300 font-semibold text-xs shadow-sm">{action.location}</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}
                                                                                                
                                                                                                {action.type === 'move' && action.segment && (
                                                                    <div className="flex items-center gap-1.5 text-xs">
                                                                        <span className="bg-white text-gray-900 px-2 py-0.5 rounded border border-gray-300 font-semibold shadow-sm">{action.segment.from}</span>
                                                                        <ArrowRight size={11} className="text-gray-400" />
                                                                        <span className="bg-white text-gray-900 px-2 py-0.5 rounded border border-gray-300 font-semibold shadow-sm">{action.segment.to}</span>
                                                                    </div>
                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Notes - inline if exists */}
                                                                {(ride1.notes || ride2.notes) && (
                                                                    <div className="mt-1 text-xs text-amber-600 truncate">
                                                                        Note: {[ride1.notes, ride2.notes].filter(n => n?.trim()).join(' | ')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            <button
                                                                onClick={() => {
                                                                    handleMergeRides(ride1.id!, ride2.id!);
                                                                    setShowMergeModal(false);
                                                                }}
                                                                className={`px-3 py-1.5 rounded-md font-medium text-xs transition hover:scale-105 flex-shrink-0 ${
                                                                    isSameRoute 
                                                                        ? 'bg-green-500 text-white hover:bg-green-600' 
                                                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                                                }`}
                                                            >
                                                                Merge
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                                
                                {/* Footer */}
                                <div className="p-4 border-t bg-gray-50 flex justify-end">
                                    <button
                                        onClick={() => setShowMergeModal(false)}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Create New Ride Modal */}
                    {showCreateRideModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden relative">
                                {/* Header */}
                                <div className="bg-emerald-600 text-white p-3 flex justify-between items-center rounded-t-xl flex-shrink-0">
                                    <h3 className="text-lg font-bold">Create New Ride</h3>
                                    <button
                                        onClick={() => {
                                            setShowCreateRideModal(false);
                                            setNewRideData({ roomNumber: '', pickup: '', destination: '', guestName: '', guestCount: 1, notes: '' });
                                            setPickupSearchQuery('');
                                            setDestinationSearchQuery('');
                                        }}
                                        className="hover:bg-emerald-700 rounded-full p-1 transition"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Form */}
                                <div className="p-4 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-gray-100 flex-1">
                                    {/* Guest Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Guest Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newRideData.guestName}
                                            onChange={(e) => {
                                                const guestName = e.target.value;
                                                setNewRideData(prev => ({ ...prev, guestName: guestName }));
                                                // Try to find room number from guest name
                                                const guest = users.find(u => u.lastName?.toLowerCase() === guestName.toLowerCase() && u.role === UserRole.GUEST);
                                                if (guest && guest.roomNumber) {
                                                    setNewRideData(prev => ({ ...prev, roomNumber: guest.roomNumber }));
                                                }
                                            }}
                                            placeholder="eg: Smith"
                                            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    {/* Pickup Location */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Pickup Location <span className="text-red-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPickupSearchQuery('');
                                                setPickupFilterType('ALL');
                                                setShowPickupModal(true);
                                            }}
                                            className={`w-full px-3 py-2 bg-white text-left text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-400 transition ${
                                                newRideData.pickup ? 'font-medium' : 'text-gray-500'
                                            }`}
                                        >
                                            {newRideData.pickup || 'Click to select pickup location'}
                                        </button>
                                        {newRideData.pickup && (
                                            <button
                                                type="button"
                                                onClick={() => setNewRideData(prev => ({ ...prev, pickup: '' }))}
                                                className="text-xs text-red-500 hover:text-red-700 mt-1"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    {/* Destination */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Destination <span className="text-red-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDestinationSearchQuery('');
                                                setDestinationFilterType('ALL');
                                                setShowDestinationModal(true);
                                            }}
                                            className={`w-full px-3 py-2 bg-white text-left text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-400 transition ${
                                                newRideData.destination ? 'font-medium' : 'text-gray-500'
                                            }`}
                                        >
                                            {newRideData.destination || 'Click to select destination'}
                                        </button>
                                        {newRideData.destination && (
                                            <button
                                                type="button"
                                                onClick={() => setNewRideData(prev => ({ ...prev, destination: '' }))}
                                                className="text-xs text-red-500 hover:text-red-700 mt-1"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    {/* Number of Guests */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Số lượng khách <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={newRideData.guestCount || 1}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value);
                                                setNewRideData(prev => ({ ...prev, guestCount: value }));
                                            }}
                                            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value={1}>1 khách</option>
                                            <option value={2}>2 khách</option>
                                            <option value={3}>3 khách</option>
                                            <option value={4}>4 khách</option>
                                            <option value={5}>5 khách</option>
                                            <option value={6}>6 khách</option>
                                            <option value={7}>7 khách</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Tối đa 7 khách mỗi xe buggy</p>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Notes (Optional)
                                        </label>
                                        <textarea
                                            value={newRideData.notes}
                                            onChange={(e) => setNewRideData(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="E.g., 3 large suitcases, fragile items..."
                                            rows={3}
                                            maxLength={500}
                                            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Luggage info or special instructions</p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-200 p-3 bg-gray-50 flex justify-end gap-3 rounded-b-xl flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            setShowCreateRideModal(false);
                                            setNewRideData({ roomNumber: '', pickup: '', destination: '', guestName: '', guestCount: 1, notes: '' });
                                            setPickupSearchQuery('');
                                            setDestinationSearchQuery('');
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium text-gray-700"
                                        disabled={isCreatingRide}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateRide}
                                        disabled={isCreatingRide || !newRideData.guestName || !newRideData.pickup || !newRideData.destination}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isCreatingRide ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Car size={16} />
                                                Create Ride
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Location Selection Modal - Pickup */}
                    {showPickupModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden relative">
                                {/* Header */}
                                <div className="bg-emerald-600 text-white p-4 flex justify-between items-center rounded-t-xl flex-shrink-0">
                                    <h3 className="text-lg font-bold">Select Pickup Location</h3>
                                    <button
                                        onClick={() => {
                                            setShowPickupModal(false);
                                            setPickupSearchQuery('');
                                        }}
                                        className="hover:bg-emerald-700 rounded-full p-1 transition"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
                                    <input
                                        type="text"
                                        value={pickupSearchQuery}
                                        onChange={(e) => setPickupSearchQuery(e.target.value)}
                                        placeholder="Search locations..."
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                                        autoFocus
                                    />
                                </div>

                                {/* Filter Buttons */}
                                <div className="p-3 border-b-2 border-gray-300 flex gap-2 flex-wrap flex-shrink-0">
                                    {(['ALL', 'VILLA', 'FACILITY', 'RESTAURANT'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setPickupFilterType(type)}
                                            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition ${
                                                pickupFilterType === type
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {type === 'ALL' ? 'All' : type}
                                        </button>
                                    ))}
                                </div>

                                {/* Locations Grid */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {getFilteredLocations(pickupSearchQuery, pickupFilterType).length > 0 ? (
                                        <>
                                            {newRideData.destination && (
                                                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <p className="text-xs text-amber-700">
                                                        ⚠️ Cannot select the same location as destination ({newRideData.destination})
                                                    </p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                                {getFilteredLocations(pickupSearchQuery, pickupFilterType).map((loc) => {
                                                    const isSameAsDestination = newRideData.destination && loc.name === newRideData.destination;
                                                    return (
                                                        <button
                                                            key={loc.id}
                                                            onClick={() => {
                                                                if (isSameAsDestination) {
                                                                    alert('⚠️ Pickup và Destination không được trùng nhau!\n\n⚠️ Pickup and Destination cannot be the same!');
                                                                    return;
                                                                }
                                                                setNewRideData(prev => ({ ...prev, pickup: loc.name }));
                                                                setPickupSearchQuery('');
                                                                setShowPickupModal(false);
                                                            }}
                                                            disabled={isSameAsDestination}
                                                            className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition text-center min-h-[80px] group ${
                                                                isSameAsDestination
                                                                    ? 'border-red-300 bg-red-50 cursor-not-allowed opacity-60'
                                                                    : 'border-gray-300 hover:bg-emerald-50 hover:border-emerald-500'
                                                            }`}
                                                            title={isSameAsDestination ? `Cannot select same as destination (${newRideData.destination})` : loc.name}
                                                        >
                                                            <div className={`text-sm font-medium break-words w-full leading-tight ${
                                                                isSameAsDestination
                                                                    ? 'text-red-600'
                                                                    : 'text-gray-900 group-hover:text-emerald-700'
                                                            }`}>
                                                                {loc.name}
                                                            </div>
                                                            {isSameAsDestination && (
                                                                <div className="text-[10px] text-red-500 mt-1">Same as destination</div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
                                            <p className="text-lg font-medium">No locations found</p>
                                            <p className="text-sm mt-1">Try a different search term or filter</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end rounded-b-xl flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            setShowPickupModal(false);
                                            setPickupSearchQuery('');
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Location Selection Modal - Destination */}
                    {showDestinationModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden relative">
                                {/* Header */}
                                <div className="bg-emerald-600 text-white p-4 flex justify-between items-center rounded-t-xl flex-shrink-0">
                                    <h3 className="text-lg font-bold">Select Destination</h3>
                                    <button
                                        onClick={() => {
                                            setShowDestinationModal(false);
                                            setDestinationSearchQuery('');
                                        }}
                                        className="hover:bg-emerald-700 rounded-full p-1 transition"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
                                    <input
                                        type="text"
                                        value={destinationSearchQuery}
                                        onChange={(e) => setDestinationSearchQuery(e.target.value)}
                                        placeholder="Search locations..."
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                                        autoFocus
                                    />
                                </div>

                                {/* Filter Buttons */}
                                <div className="p-3 border-b-2 border-gray-300 flex gap-2 flex-wrap flex-shrink-0">
                                    {(['ALL', 'VILLA', 'FACILITY', 'RESTAURANT'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setDestinationFilterType(type)}
                                            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition ${
                                                destinationFilterType === type
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {type === 'ALL' ? 'All' : type}
                                        </button>
                                    ))}
                                </div>

                                {/* Locations Grid */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {getFilteredLocations(destinationSearchQuery, destinationFilterType).length > 0 ? (
                                        <>
                                            {newRideData.pickup && (
                                                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <p className="text-xs text-amber-700">
                                                        ⚠️ Cannot select the same location as pickup ({newRideData.pickup})
                                                    </p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                                {getFilteredLocations(destinationSearchQuery, destinationFilterType).map((loc) => {
                                                    const isSameAsPickup = newRideData.pickup && loc.name === newRideData.pickup;
                                                    return (
                                                        <button
                                                            key={loc.id}
                                                            onClick={() => {
                                                                if (isSameAsPickup) {
                                                                    alert('⚠️ Pickup và Destination không được trùng nhau!\n\n⚠️ Pickup and Destination cannot be the same!');
                                                                    return;
                                                                }
                                                                setNewRideData(prev => ({ ...prev, destination: loc.name }));
                                                                setDestinationSearchQuery('');
                                                                setShowDestinationModal(false);
                                                            }}
                                                            disabled={isSameAsPickup}
                                                            className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition text-center min-h-[80px] group ${
                                                                isSameAsPickup
                                                                    ? 'border-red-300 bg-red-50 cursor-not-allowed opacity-60'
                                                                    : 'border-gray-300 hover:bg-emerald-50 hover:border-emerald-500'
                                                            }`}
                                                            title={isSameAsPickup ? `Cannot select same as pickup (${newRideData.pickup})` : loc.name}
                                                        >
                                                            <div className={`text-sm font-medium break-words w-full leading-tight ${
                                                                isSameAsPickup
                                                                    ? 'text-red-600'
                                                                    : 'text-gray-900 group-hover:text-emerald-700'
                                                            }`}>
                                                                {loc.name}
                                                            </div>
                                                            {isSameAsPickup && (
                                                                <div className="text-[10px] text-red-500 mt-1">Same as pickup</div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
                                            <p className="text-lg font-medium">No locations found</p>
                                            <p className="text-sm mt-1">Try a different search term or filter</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end rounded-b-xl flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            setShowDestinationModal(false);
                                            setDestinationSearchQuery('');
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Service Request Management */}
                    {viewMode === 'SERVICE' && (
                        <>
                    {/* Service Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-blue-600 rounded-md flex items-center justify-center">
                                <UtensilsCrossed size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Service Request Management</h2>
                                <p className="text-xs text-gray-500">Manage dining, spa, pool, butler, and housekeeping requests.</p>
                            </div>
                        </div>
                        {/* Status Indicator */}
                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-1">
                                    <AlertCircle size={14} className="text-orange-500" />
                                    <span className="text-xs font-semibold text-gray-700">
                                        {getPendingServiceRequestsCount()}
                                    </span>
                                    <span className="text-sm text-gray-500">Pending</span>
                                </div>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <div className="flex items-center gap-1">
                                    <CheckCircle size={14} className="text-blue-500" />
                                    <span className="text-xs font-semibold text-gray-700">
                                        {getConfirmedServiceRequestsCount()}
                                    </span>
                                    <span className="text-sm text-gray-500">Confirmed</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button 
                                onClick={async () => {
                                    try {
                                        const refreshedServices = await getServiceRequests();
                                        setServiceRequests(refreshedServices);
                                    } catch (error) {
                                        console.error('Failed to refresh service requests:', error);
                                        setServiceRequests([]);
                                    }
                                }}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition"
                            >
                                <RefreshCw size={18} />
                            </button>
                            <button 
                                onClick={async () => {
                                    await handleServiceAutoAssign();
                                }}
                                disabled={(() => {
                                    const hasPendingServices = getPendingServiceRequestsCount() > 0;
                                    const hasOnlineStaff = getOnlineStaffCount() > 0;
                                    return !hasPendingServices || !hasOnlineStaff;
                                })()}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Zap size={16} />
                                <span>Assign by AI</span>
                            </button>
                        </div>
                    </div>

                    {/* Service AI Assignment Modal - Similar to Buggy */}
                    {showServiceAIAssignment && serviceAIAssignmentData && (
                        <div 
                            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in"
                            onClick={() => {
                                if (serviceAIAssignmentData.status === 'completed' || serviceAIAssignmentData.status === 'error') {
                                    setShowServiceAIAssignment(false);
                                    setServiceAIAssignmentData(null);
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
                                            <h3 className="font-bold text-lg">AI Service Assignment Engine</h3>
                                            <p className="text-xs text-blue-100">Intelligent staff-service matching</p>
                                        </div>
                                    </div>
                                    {(serviceAIAssignmentData.status === 'completed' || serviceAIAssignmentData.status === 'error') && (
                                        <button
                                            onClick={() => {
                                                setShowServiceAIAssignment(false);
                                                setServiceAIAssignmentData(null);
                                            }}
                                            className="text-white/80 hover:text-white transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    {serviceAIAssignmentData.status === 'analyzing' && (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                                            <h4 className="text-xl font-bold text-gray-800 mb-2">Analyzing Requests...</h4>
                                            <p className="text-gray-600 text-center max-w-md">
                                                AI is analyzing {serviceAIAssignmentData.pendingServices.length} pending request(s) and {serviceAIAssignmentData.onlineStaff.length} available staff member(s)
                                            </p>
                                        </div>
                                    )}

                                    {serviceAIAssignmentData.status === 'matching' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Loader2 size={24} className="text-blue-600 animate-spin" />
                                                <h4 className="text-lg font-bold text-gray-800">Matching Staff to Requests...</h4>
                                            </div>
                                        </div>
                                    )}

                                    {serviceAIAssignmentData.status === 'completed' && serviceAIAssignmentData.assignments.length > 0 && (
                                        <div className="space-y-3">
                                            {serviceAIAssignmentData.assignments.map((assignment, idx) => (
                                                <div 
                                                    key={`${assignment.staff.id}-${assignment.service.id}`}
                                                    className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-1 bg-white rounded-lg p-3 border border-blue-200">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                    <Users size={16} className="text-blue-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-sm text-gray-800">{assignment.staff.lastName}</div>
                                                                    <div className="text-xs text-gray-500">{assignment.staff.department || 'Staff'}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center pt-2">
                                                            <ArrowRight size={24} className="text-blue-600" />
                                                        </div>
                                                        <div className="flex-1 bg-white rounded-lg p-3 border border-purple-200">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                                    <UtensilsCrossed size={16} className="text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-sm text-gray-800">Room {assignment.service.roomNumber}</div>
                                                                    <div className="text-xs text-gray-500">{assignment.service.type}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-gray-600">{assignment.service.details}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {serviceAIAssignmentData.status === 'error' && (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <AlertCircle size={48} className="text-red-600 mb-4" />
                                            <h4 className="text-xl font-bold text-gray-800 mb-2">Assignment Failed</h4>
                                            <p className="text-gray-600 text-center whitespace-pre-line max-w-md">
                                                {serviceAIAssignmentData.errorMessage}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                {(serviceAIAssignmentData.status === 'completed' || serviceAIAssignmentData.status === 'error') && (
                                    <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
                                        <button
                                            onClick={() => {
                                                setShowServiceAIAssignment(false);
                                                setServiceAIAssignmentData(null);
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
                        {/* Column 1: Pending Service Requests */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-sm text-gray-800">
                                    Pending Requests ({getPendingServiceRequestsCount()})
                                </h3>
                            </div>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {getPendingServiceRequestsCount() === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-xs">
                                        No pending service requests
                                    </div>
                                ) : (
                                    (() => {
                                        // Filter and deduplicate: Remove duplicates based on roomNumber, type, and details
                                        const pendingServices = serviceRequests
                                            .filter(sr => sr.status === 'PENDING' && sr.type !== 'BUGGY')
                                            .sort((a, b) => b.timestamp - a.timestamp);
                                        
                                        // Deduplicate: Group by roomNumber + type + details, keep only the most recent
                                        const seen: { [key: string]: ServiceRequest } = {};
                                        
                                        for (const service of pendingServices) {
                                            // Create a unique key based on roomNumber, type, and details
                                            const key = `${service.roomNumber}-${service.type}-${(service.details || '').substring(0, 50)}`;
                                            
                                            if (!seen[key]) {
                                                seen[key] = service;
                                            } else {
                                                // If we've seen this before, keep the one with the most recent timestamp
                                                const existing = seen[key];
                                                if (existing && service.timestamp > existing.timestamp) {
                                                    seen[key] = service;
                                                }
                                            }
                                        }
                                        
                                        return Object.values(seen);
                                    })().map((service) => {
                                            const waitTime = Math.floor((Date.now() - service.timestamp) / 1000); // seconds
                                            const waitMinutes = Math.floor(waitTime / 60);
                                            
                                            let urgencyLevel = 'normal';
                                            let bgColor = 'bg-white';
                                            let borderColor = 'border-gray-200';
                                            let textColor = 'text-gray-900';
                                            
                                            if (waitTime >= 600) { // 10+ minutes = urgent
                                                urgencyLevel = 'urgent';
                                                bgColor = 'bg-red-50';
                                                borderColor = 'border-red-300';
                                                textColor = 'text-red-900';
                                            } else if (waitTime >= 300) { // 5-10 minutes = warning
                                                urgencyLevel = 'warning';
                                                bgColor = 'bg-orange-50';
                                                borderColor = 'border-orange-300';
                                                textColor = 'text-orange-900';
                                            }
                                            
                                            const getTypeColor = (type: string) => {
                                                switch (type) {
                                                    case 'DINING': return 'bg-purple-100 text-purple-700 border-purple-200';
                                                    case 'SPA': return 'bg-pink-100 text-pink-700 border-pink-200';
                                                    case 'POOL': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
                                                    case 'BUTLER': return 'bg-amber-100 text-amber-700 border-amber-200';
                                                    case 'HOUSEKEEPING': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
                                                    default: return 'bg-gray-100 text-gray-700 border-gray-200';
                                                }
                                            };
                                            
                                            // Parse details to extract items if present
                                            const detailsText = service.details || '';
                                            const itemsMatch = detailsText.match(/Items:\s*([^.]+)/i);
                                            const itemsText = itemsMatch ? itemsMatch[1].trim() : '';
                                            const remainingDetails = itemsText 
                                                ? detailsText.replace(/Items:\s*[^.]+\.\s*/i, '').replace(/Order for:\s*/i, '').trim()
                                                : detailsText.replace(/Order for:\s*/i, '').trim();
                                            
                                            return (
                                                <div 
                                                    key={service.id} 
                                                    className={`${bgColor} ${borderColor} p-2.5 rounded-lg border-2 transition-all duration-200 shadow-sm`}
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                                        <div className="flex-1 min-w-0">
                                                            {/* Header: Type and Room */}
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span className={`text-xs px-2 py-1 rounded font-bold border ${getTypeColor(service.type)}`}>
                                                                    {service.type}
                                                                </span>
                                                                <span className={`text-sm font-bold ${textColor}`}>
                                                                    Room {service.roomNumber}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Items if available */}
                                                            {itemsText && (
                                                                <div className={`text-xs ${textColor} mb-1 font-medium`}>
                                                                    {itemsText}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Wait time */}
                                                            <div className="flex items-center gap-1.5 text-[10px] mt-1.5 pt-1.5 border-t border-gray-200">
                                                                <Clock size={11} className={`${textColor}`} />
                                                                <span className={`font-semibold ${textColor}`}>
                                                                    Waiting {waitMinutes}m
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>

                        {/* Column 2: Staff List */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-sm text-gray-800">
                                    Staff Fleet ({users.filter(u => u.role === UserRole.STAFF).length})
                                </h3>
                            </div>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {users.filter(u => u.role === UserRole.STAFF).length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-xs">
                                        No staff members
                                    </div>
                                ) : (
                                    (() => {
                                        const staffUsers = users.filter(u => u.role === UserRole.STAFF);
                                        return staffUsers.map((staff) => {
                                            const staffStatus = getStaffStatus(staff);
                                            const department = staff.department || 'General';
                                            
                                            // Count active services for this staff's department
                                            const activeServices = serviceRequests.filter(sr => {
                                                if (sr.type === 'BUGGY') return false;
                                                const srDepartment = getDepartmentForServiceType(sr.type);
                                                return sr.status === 'CONFIRMED' && (srDepartment === department || department === 'All');
                                            });
                                            
                                            const isOnline = staff.updatedAt && (Date.now() - staff.updatedAt < 30000);
                                            
                                            let bgColor = 'bg-white';
                                            let borderColor = 'border-gray-200';
                                            let statusBadgeClass = 'bg-gray-400 text-white';
                                            let statusText = 'OFFLINE';
                                            
                                            if (isOnline) {
                                                if (staffStatus === 'BUSY') {
                                                    bgColor = 'bg-orange-50';
                                                    borderColor = 'border-orange-300';
                                                    statusBadgeClass = 'bg-orange-500 text-white';
                                                    statusText = 'BUSY';
                                                } else {
                                                    bgColor = 'bg-green-50';
                                                    borderColor = 'border-green-300';
                                                    statusBadgeClass = 'bg-green-500 text-white';
                                                    statusText = 'AVAILABLE';
                                                }
                                            }
                                            
                                            return (
                                                <div 
                                                    key={staff.id} 
                                                    className={`${bgColor} ${borderColor} p-3 rounded-lg border-2 transition-all duration-200 shadow-sm`}
                                                >
                                                    <div className="flex items-start gap-2.5 mb-2">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                            isOnline 
                                                                ? (staffStatus === 'BUSY' ? 'bg-orange-200' : 'bg-green-200')
                                                                : 'bg-gray-200'
                                                        }`}>
                                                            <Users size={16} className={
                                                                isOnline 
                                                                    ? (staffStatus === 'BUSY' ? 'text-orange-700' : 'text-green-700')
                                                                    : 'text-gray-600'
                                                            } />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className={`font-bold text-sm ${
                                                                    isOnline 
                                                                        ? (staffStatus === 'BUSY' ? 'text-orange-900' : 'text-green-900')
                                                                        : 'text-gray-900'
                                                                }`}>
                                                                    {staff.lastName || 'Staff'}
                                                                </div>
                                                            </div>
                                                            <div className={`text-[11px] ${
                                                                isOnline 
                                                                    ? (staffStatus === 'BUSY' ? 'text-orange-700' : 'text-green-700')
                                                                    : 'text-gray-500'
                                                            }`}>
                                                                {department}
                                                            </div>
                                                            {activeServices.length > 0 && (
                                                                <div className="text-[10px] text-gray-600 mt-1">
                                                                    {activeServices.length} active service(s)
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className={`text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap ${statusBadgeClass}`}>
                                                            {statusText}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()
                                )}
                            </div>
                        </div>

                        {/* Column 3: Active Service Requests (Confirmed) */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-sm text-gray-800">
                                    Active Services ({getConfirmedServiceRequestsCount()})
                                </h3>
                            </div>
                            <div className="space-y-2 max-h-[350px] overflow-y-auto">
                                {getConfirmedServiceRequestsCount() === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-xs">
                                        No active service requests
                                    </div>
                                ) : (
                                    serviceRequests
                                        .filter(sr => sr.status === 'CONFIRMED' && sr.type !== 'BUGGY')
                                        .sort((a, b) => (a.confirmedAt || 0) - (b.confirmedAt || 0))
                                        .map((service) => {
                                            const getTypeColor = (type: string) => {
                                                switch (type) {
                                                    case 'DINING': return 'bg-purple-100 text-purple-700 border-purple-200';
                                                    case 'SPA': return 'bg-pink-100 text-pink-700 border-pink-200';
                                                    case 'POOL': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
                                                    case 'BUTLER': return 'bg-amber-100 text-amber-700 border-amber-200';
                                                    case 'HOUSEKEEPING': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
                                                    default: return 'bg-gray-100 text-gray-700 border-gray-200';
                                                }
                                            };
                                            
                                            const confirmedTime = service.confirmedAt || service.timestamp;
                                            const timeSinceConfirmed = Math.floor((Date.now() - confirmedTime) / 1000 / 60); // minutes
                                            
                                            return (
                                                <div 
                                                    key={service.id} 
                                                    className="bg-blue-50 border-blue-200 p-3 rounded-lg border-2 transition-all duration-200 shadow-sm"
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-xs px-2 py-0.5 rounded font-bold border ${getTypeColor(service.type)}`}>
                                                                    {service.type}
                                                                </span>
                                                                <span className="text-sm font-bold text-blue-900">
                                                                    Room {service.roomNumber}
                                                                </span>
                                                                <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-bold">
                                                                    CONFIRMED
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-blue-900 mb-1.5">
                                                                {service.details}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-blue-600">
                                                                <CheckCircle size={10} />
                                                                <span>Confirmed {timeSinceConfirmed}m ago</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await updateServiceStatus(service.id, 'COMPLETED');
                                                                const refreshed = await getServiceRequests();
                                                                setServiceRequests(refreshed);
                                                            } catch (error) {
                                                                console.error('Failed to complete service:', error);
                                                            }
                                                        }}
                                                        className="w-full bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-emerald-700 transition"
                                                    >
                                                        Complete
                                                    </button>
                                                </div>
                                            );
                                        })
                                )}
                            </div>

                            {/* Recent Completed Section */}
                            <div className="mt-4 pt-3 border-t border-gray-200">
                                <h4 className="font-bold text-[10px] text-gray-500 uppercase mb-2 tracking-wider">RECENT COMPLETED.</h4>
                                <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
                                    {(() => {
                                        // Sort completed services by completion time (most recent first)
                                        const completedServices = serviceRequests
                                            .filter(sr => sr.status === 'COMPLETED' && sr.type !== 'BUGGY')
                                            .sort((a, b) => {
                                                const timeA = a.completedAt || a.timestamp || 0;
                                                const timeB = b.completedAt || b.timestamp || 0;
                                                return timeB - timeA; // Most recent first
                                            })
                                            .slice(0, 5);
                                        
                                        const getTypeColor = (type: string) => {
                                            switch (type) {
                                                case 'DINING': return 'bg-purple-100 text-purple-700 border-purple-200';
                                                case 'SPA': return 'bg-pink-100 text-pink-700 border-pink-200';
                                                case 'POOL': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
                                                case 'BUTLER': return 'bg-amber-100 text-amber-700 border-amber-200';
                                                case 'HOUSEKEEPING': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
                                                default: return 'bg-gray-100 text-gray-700 border-gray-200';
                                            }
                                        };
                                        
                                        return completedServices.map((service) => {
                                            // Calculate time ago
                                            const completedTime = service.completedAt || service.timestamp || Date.now();
                                            const timeAgo = Math.floor((Date.now() - completedTime) / 1000 / 60); // minutes ago
                                            let timeAgoText = '';
                                            if (timeAgo < 1) {
                                                timeAgoText = 'Just now';
                                            } else if (timeAgo < 60) {
                                                timeAgoText = `${timeAgo}m ago`;
                                            } else {
                                                const hoursAgo = Math.floor(timeAgo / 60);
                                                timeAgoText = `${hoursAgo}h ago`;
                                            }
                                            
                                            // Truncate details if too long
                                            const truncateText = (text: string, maxLength: number = 25) => {
                                                if (text.length <= maxLength) return text;
                                                return text.substring(0, maxLength - 3) + '...';
                                            };
                                            
                                            return (
                                                <div 
                                                    key={service.id} 
                                                    className="bg-gray-50 p-2.5 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${getTypeColor(service.type)}`}>
                                                                    {service.type}
                                                                </span>
                                                                <span className="text-xs font-bold text-gray-800">Room {service.roomNumber}</span>
                                                                {service.rating && (
                                                                    <div className="flex items-center gap-0.5">
                                                                        <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                                                        <span className="text-[9px] font-semibold text-gray-600">{service.rating}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-600 mb-0.5">
                                                                {truncateText(service.details)}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                            <span className="flex items-center gap-0.5 text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                                                                <CheckCircle size={9} />
                                                                Completed
                                                            </span>
                                                            <span className="text-[9px] text-gray-400 font-medium">
                                                                {timeAgoText}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                    {serviceRequests.filter(sr => sr.status === 'COMPLETED' && sr.type !== 'BUGGY').length === 0 && (
                                        <div className="text-center py-3 text-gray-400 text-[10px]">
                                            No completed services yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                        </>
                    )}
                </div>
            </div>
            
        </div>
    );
};

export default ReceptionPortal;


