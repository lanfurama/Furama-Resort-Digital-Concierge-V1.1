import React, { useState, useEffect, useRef } from 'react';
import { Car, Settings, RefreshCw, Zap, Users, List, Grid3x3, CheckCircle, MapPin, AlertCircle, Info, X, Map, Star, Loader2, Brain, ArrowRight, Clock, UtensilsCrossed } from 'lucide-react';
import { getRides, getRidesSync, getUsers, getUsersSync, updateRideStatus, getLocations, getServiceRequests, updateServiceStatus } from '../services/dataService';
import { User, UserRole, RideRequest, BuggyStatus, Location, ServiceRequest } from '../types';

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
        autoAssignEnabled: true
    });
    
    // Driver View Mode State
    const [driverViewMode, setDriverViewMode] = useState<'LIST' | 'MAP'>('LIST');
    
    // AI Assignment Modal State
    const [showAIAssignment, setShowAIAssignment] = useState(false);
    const [aiAssignmentData, setAIAssignmentData] = useState<{
        status: 'analyzing' | 'matching' | 'completed' | 'error';
        pendingRides: RideRequest[];
        onlineDrivers: User[];
        assignments: Array<{ driver: User; ride: RideRequest; cost: number; isChainTrip?: boolean }>;
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

    // Auto-assign logic: Automatically assign rides that have been waiting too long
    useEffect(() => {
        // Only run if auto-assign is enabled
        if (!fleetConfig.autoAssignEnabled) return;

        const checkAndAutoAssign = async () => {
            const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING);
            if (pendingRides.length === 0) return;

            // Prevent too frequent auto-assign calls (at least 10 seconds between calls)
            const now = Date.now();
            if (now - lastAutoAssignRef.current < 10000) {
                return; // Skip if last auto-assign was less than 10 seconds ago
            }

            // Check if any ride has been waiting longer than maxWaitTimeBeforeAutoAssign
            const ridesToAutoAssign = pendingRides.filter(ride => {
                const waitTime = Math.floor((now - ride.timestamp) / 1000); // seconds
                return waitTime >= fleetConfig.maxWaitTimeBeforeAutoAssign;
            });

            if (ridesToAutoAssign.length > 0) {
                lastAutoAssignRef.current = now;
                // Trigger auto-assign for these rides (silently, without showing modal)
                await handleAutoAssign(true); // Pass true to indicate auto-triggered
            }
        };

        // Check every 5 seconds if there are rides that need auto-assignment
        const autoAssignInterval = setInterval(checkAndAutoAssign, 5000);
        
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
            
            // Check if driver has recent heartbeat (updated_at within last 2 minutes)
            // This is the PRIMARY way to determine if driver is online
            // When driver logs out, updatedAt is set to 3 minutes ago, so they will be offline
            if (driver.updatedAt) {
                const timeSinceUpdate = Date.now() - driver.updatedAt;
                if (timeSinceUpdate < 120000) { // 2 minutes
                    return true; // Driver is online (heartbeat active)
                }
                // If updatedAt is more than 2 minutes ago, driver is offline
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
                return timeSinceUpdate < 120000; // 2 minutes
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
                return timeSinceUpdate < 120000; // 2 minutes
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
        
        // Check if there are any online drivers (not just offline)
        // Use the same logic as getOnlineDriversCount to ensure consistency
        const onlineDrivers = allDrivers.filter(driver => {
            const driverIdStr = driver.id ? String(driver.id) : '';
            const hasActiveRide = rides.some(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverIdStr && 
                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
            });
            if (hasActiveRide) return true; // Busy drivers are considered online
            
            // Check if driver has recent heartbeat (updated_at within last 2 minutes)
            // This indicates driver portal is open and active
            if (driver.updatedAt) {
                const timeSinceUpdate = Date.now() - driver.updatedAt;
                if (timeSinceUpdate < 120000) { // 2 minutes
                    return true; // Driver is online (heartbeat active)
                }
            }
            
            // Check if driver has recent activity (completed ride in last hour)
            const recentCompleted = rides.filter(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverIdStr && 
                    r.status === BuggyStatus.COMPLETED && 
                    r.completedAt && 
                    (Date.now() - r.completedAt < 3600000);
            });
            return recentCompleted.length > 0;
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
            
            // Skip if ride or driver already assigned
            if (assignedRides.has(rideId) || assignedDrivers.has(driverId)) {
                continue;
            }
            
            // Check if driver can take this ride (if busy, only allow chain trips)
            const driverActiveRides = rides.filter(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverId && 
                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
            });
            
            let isChainTrip = false;
            if (driverActiveRides.length > 0) {
                // Driver is busy - only allow if it's a chain trip (cost is very negative)
                if (assignment.cost > -5000) {
                    continue; // Not a chain trip, skip
                }
                isChainTrip = true;
            }
            
            // Assign this pair
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
                await updateRideStatus(ride.id, BuggyStatus.ASSIGNED, driver.id, 5); // 5 min ETA
                assignmentCount++;
            } catch (error) {
                console.error(`Failed to assign ride ${ride.id} to driver ${driver.id}:`, error);
            }
        }

        // Update to completed status (only if showing modal)
        if (!isAutoTriggered) {
            setAIAssignmentData(prev => prev ? { ...prev, status: 'completed' } : null);
        } else {
            // For auto-triggered assignments, just log success
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

    return (
        <div className={`${embedded ? '' : 'min-h-screen'} bg-gray-100 flex flex-col font-sans`}>
            {/* Header */}
            {!embedded && (
                <header className="bg-emerald-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
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
                            onClick={() => setViewMode('SERVICE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                viewMode === 'SERVICE'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
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
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-semibold">
                                            Auto: {fleetConfig.maxWaitTimeBeforeAutoAssign}s
                                        </span>
                                        <span className="text-[9px] text-gray-500">(Active)</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {rides.filter(r => r.status === BuggyStatus.SEARCHING).length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-xs">
                                        No pending requests.
                                    </div>
                                ) : (
                                    (() => {
                                        // Helper function to determine ride type
                                        const getRideType = (ride: RideRequest): { type: 'PU' | 'DO' | 'AC' | 'OTHER', labels: string[] } => {
                                            const pickupLower = ride.pickup.toLowerCase();
                                            const destLower = ride.destination.toLowerCase();
                                            const labels: string[] = [];
                                            
                                            // Check for Airport Concierge
                                            if (pickupLower.includes('airport') || destLower.includes('airport') || 
                                                pickupLower.includes('sân bay') || destLower.includes('sân bay')) {
                                                labels.push('AC');
                                                return { type: 'AC', labels };
                                            }
                                            
                                            // Check for Pick Up (from room)
                                            const pickupIsRoom = pickupLower.includes('room') || pickupLower.includes('villa') || 
                                                                pickupLower.match(/\b\d{3}\b/) || pickupLower.includes('phòng');
                                            // Check for Drop Off (to room)
                                            const destIsRoom = destLower.includes('room') || destLower.includes('villa') || 
                                                             destLower.match(/\b\d{3}\b/) || destLower.includes('phòng');
                                            
                                            if (pickupIsRoom && !destIsRoom) {
                                                labels.push('PU');
                                            }
                                            if (destIsRoom && !pickupIsRoom) {
                                                labels.push('DO');
                                            }
                                            if (pickupIsRoom && destIsRoom) {
                                                labels.push('PU', 'DO');
                                            }
                                            
                                            return { type: labels.length > 0 ? (labels[0] as 'PU' | 'DO') : 'OTHER', labels };
                                        };
                                        
                                        // Sort by wait time (longest first) and map to display
                                        const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING)
                                            .map(ride => {
                                                const waitTime = Math.floor((Date.now() - ride.timestamp) / 1000);
                                                return { ride, waitTime };
                                            })
                                            .sort((a, b) => b.waitTime - a.waitTime); // Longest wait first
                                        
                                        return pendingRides.map(({ ride, waitTime }) => {
                                            const waitMinutes = Math.floor(waitTime / 60);
                                            const waitSeconds = waitTime % 60;
                                            const rideType = getRideType(ride);
                                            
                                            // Determine urgency level based on wait time
                                            let urgencyLevel: 'normal' | 'warning' | 'urgent' = 'normal';
                                            let bgColor = 'bg-gray-50';
                                            let borderColor = 'border-gray-200';
                                            let textColor = 'text-gray-900';
                                            let accentColor = 'bg-gray-100';
                                            
                                            if (waitTime >= 600) { // 10+ minutes = urgent
                                                urgencyLevel = 'urgent';
                                                bgColor = 'bg-red-50';
                                                borderColor = 'border-red-300';
                                                textColor = 'text-red-900';
                                                accentColor = 'bg-red-100';
                                            } else if (waitTime >= 300) { // 5-10 minutes = warning
                                                urgencyLevel = 'warning';
                                                bgColor = 'bg-orange-50';
                                                borderColor = 'border-orange-300';
                                                textColor = 'text-orange-900';
                                                accentColor = 'bg-orange-100';
                                            }
                                            
                                            return (
                                                <div 
                                                    key={ride.id} 
                                                    className={`${bgColor} ${borderColor} p-3 rounded-lg border-2 transition-all duration-200 ${
                                                        urgencyLevel === 'urgent' ? 'shadow-md ring-2 ring-red-200' : 
                                                        urgencyLevel === 'warning' ? 'shadow-sm' : ''
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`font-bold text-sm ${textColor}`}>
                                                                Room {ride.roomNumber}
                                                            </div>
                                                            {rideType.labels.length > 0 && (
                                                                <div className="flex gap-1">
                                                                    {rideType.labels.map((label, idx) => (
                                                                        <span 
                                                                            key={idx}
                                                                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                                                label === 'AC' 
                                                                                    ? 'bg-purple-200 text-purple-800' 
                                                                                    : label === 'PU'
                                                                                    ? 'bg-blue-200 text-blue-800'
                                                                                    : 'bg-emerald-200 text-emerald-800'
                                                                            }`}
                                                                        >
                                                                            {label}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={`flex items-center gap-1 ${urgencyLevel === 'urgent' ? 'text-red-700' : urgencyLevel === 'warning' ? 'text-orange-700' : 'text-gray-600'}`}>
                                                            <span className="text-xs font-bold">
                                                                ⏱ {waitMinutes}m {waitSeconds}s
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className={`text-xs font-medium ${urgencyLevel === 'urgent' ? 'text-red-800' : urgencyLevel === 'warning' ? 'text-orange-800' : 'text-gray-700'} mb-2`}>
                                                        {ride.guestName}
                                                    </div>
                                                    
                                                    <div className="space-y-1.5">
                                                        <div className={`flex items-start gap-2 ${accentColor} p-2 rounded-md`}>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                                                                <div className={`w-2 h-2 rounded-full ${
                                                                    rideType.labels.includes('PU') ? 'bg-blue-500' : 'bg-gray-400'
                                                                }`}></div>
                                                                <span className="text-[9px] font-semibold text-gray-600 uppercase">
                                                                    {rideType.labels.includes('PU') ? 'Pick Up' : 'From'}
                                                                </span>
                                                            </div>
                                                            <span className={`text-[11px] font-medium ${urgencyLevel === 'urgent' ? 'text-red-900' : urgencyLevel === 'warning' ? 'text-orange-900' : 'text-gray-800'} flex-1`}>
                                                                {ride.pickup}
                                                            </span>
                                                        </div>
                                                        <div className={`flex items-start gap-2 ${accentColor} p-2 rounded-md`}>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                                                                <div className={`w-2 h-2 rounded-full ${
                                                                    rideType.labels.includes('DO') ? 'bg-emerald-500' : 'bg-gray-400'
                                                                }`}></div>
                                                                <span className="text-[9px] font-semibold text-gray-600 uppercase">
                                                                    {rideType.labels.includes('DO') ? 'Drop Off' : 'To'}
                                                                </span>
                                                            </div>
                                                            <span className={`text-[11px] font-medium ${urgencyLevel === 'urgent' ? 'text-red-900' : urgencyLevel === 'warning' ? 'text-orange-900' : 'text-gray-800'} flex-1`}>
                                                                {ride.destination}
                                                            </span>
                                                        </div>
                                                    </div>
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
                                        }`}
                                        title="Map View"
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
                                            const currentRide = driverRides[0];
                                            const hasActiveRide = currentRide && 
                                                (currentRide.status === BuggyStatus.ASSIGNED || 
                                                 currentRide.status === BuggyStatus.ARRIVING || 
                                                 currentRide.status === BuggyStatus.ON_TRIP);
                                            
                                            // Determine driver status
                                            let driverStatus: 'AVAILABLE' | 'BUSY' | 'NEAR_COMPLETION' | 'OFFLINE' = 'OFFLINE';
                                            let isNearCompletion = false;
                                            
                                            if (hasActiveRide) {
                                                // Check if trip is near completion (ON_TRIP status and has been on trip for a while)
                                                if (currentRide.status === BuggyStatus.ON_TRIP) {
                                                    const tripDuration = currentRide.pickedUpAt 
                                                        ? Math.floor((Date.now() - currentRide.pickedUpAt) / 1000)
                                                        : 0;
                                                    // If on trip for more than 3 minutes, consider near completion
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
                                                // Check if driver has recent heartbeat (updated_at within last 2 minutes)
                                                // This is the PRIMARY way to determine if driver is online
                                                if (driver.updatedAt) {
                                                    const timeSinceUpdate = Date.now() - driver.updatedAt;
                                                    if (timeSinceUpdate < 120000) { // 2 minutes
                                                        driverStatus = 'AVAILABLE';
                                                    } else {
                                                        // Driver has been offline for more than 2 minutes
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
                                            
                                            return { driver, currentRide, hasActiveRide, driverStatus, isNearCompletion, priorityScore };
                                        }).sort((a, b) => {
                                            // Sort by priority score first
                                            if (a.priorityScore !== b.priorityScore) {
                                                return a.priorityScore - b.priorityScore;
                                            }
                                            // Then alphabetically
                                            return a.driver.lastName.localeCompare(b.driver.lastName);
                                        });
                                    
                                        return sortedDrivers.map(({ driver, currentRide, hasActiveRide, driverStatus, isNearCompletion }) => {
                                            const driverIdStr = driver.id ? String(driver.id) : '';
                                            const driverDisplayName = driver.lastName || 'Unknown Driver';
                                            
                                            // Get driver location
                                            const driverLocation = getDriverLocation(driver);
                                            
                                            // Calculate trip progress if on trip
                                            let tripProgress = null;
                                            if (currentRide && currentRide.status === BuggyStatus.ON_TRIP && currentRide.pickedUpAt) {
                                                const tripDuration = Math.floor((Date.now() - currentRide.pickedUpAt) / 1000);
                                                const tripMinutes = Math.floor(tripDuration / 60);
                                                tripProgress = tripMinutes;
                                            }
                                            
                                            // Determine styling based on status
                                            let bgColor = 'bg-gray-50';
                                            let borderColor = 'border-gray-200';
                                            let statusBadgeClass = '';
                                            let statusText = '';
                                            
                                            if (driverStatus === 'AVAILABLE') {
                                                bgColor = 'bg-green-50';
                                                borderColor = 'border-green-300';
                                                statusBadgeClass = 'bg-green-500 text-white';
                                                statusText = 'AVAILABLE';
                                            } else if (driverStatus === 'NEAR_COMPLETION') {
                                                bgColor = 'bg-blue-50';
                                                borderColor = 'border-blue-300';
                                                statusBadgeClass = 'bg-blue-500 text-white';
                                                statusText = 'NEAR DONE';
                                            } else if (driverStatus === 'BUSY') {
                                                bgColor = 'bg-orange-50';
                                                borderColor = 'border-orange-300';
                                                statusBadgeClass = 'bg-orange-500 text-white';
                                                statusText = 'BUSY';
                                            } else {
                                                bgColor = 'bg-gray-50';
                                                borderColor = 'border-gray-200';
                                                statusBadgeClass = 'bg-gray-400 text-white';
                                                statusText = 'OFFLINE';
                                            }

                                            return (
                                                <div 
                                                    key={driver.id} 
                                                    className={`${bgColor} ${borderColor} p-3 rounded-lg border-2 transition-all duration-200 ${
                                                        driverStatus === 'AVAILABLE' ? 'shadow-sm ring-1 ring-green-200' :
                                                        driverStatus === 'NEAR_COMPLETION' ? 'shadow-md ring-2 ring-blue-300' :
                                                        driverStatus === 'BUSY' ? 'shadow-sm' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-2.5 mb-2">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                            driverStatus === 'AVAILABLE' ? 'bg-green-200' :
                                                            driverStatus === 'NEAR_COMPLETION' ? 'bg-blue-200' :
                                                            driverStatus === 'BUSY' ? 'bg-orange-200' : 'bg-gray-200'
                                                        }`}>
                                                            <Users size={16} className={
                                                                driverStatus === 'AVAILABLE' ? 'text-green-700' :
                                                                driverStatus === 'NEAR_COMPLETION' ? 'text-blue-700' :
                                                                driverStatus === 'BUSY' ? 'text-orange-700' : 'text-gray-600'
                                                            } />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className={`font-bold text-sm ${
                                                                    driverStatus === 'AVAILABLE' ? 'text-green-900' :
                                                                    driverStatus === 'NEAR_COMPLETION' ? 'text-blue-900' :
                                                                    driverStatus === 'BUSY' ? 'text-orange-900' : 'text-gray-900'
                                                                }`}>
                                                                    {driverDisplayName}
                                                                </div>
                                                                {driverStatus === 'AVAILABLE' && (
                                                                    <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                                                        READY
                                                                    </span>
                                                                )}
                                                                {isNearCompletion && (
                                                                    <span className="text-[9px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded font-bold animate-pulse">
                                                                        SOON
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className={`text-[11px] flex items-center ${
                                                                driverStatus === 'AVAILABLE' ? 'text-green-700' :
                                                                driverStatus === 'NEAR_COMPLETION' ? 'text-blue-700' :
                                                                driverStatus === 'BUSY' ? 'text-orange-700' : 'text-gray-500'
                                                            }`}>
                                                                <MapPin size={10} className="mr-1" />
                                                                {driverLocation}
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap ${statusBadgeClass}`}>
                                                            {statusText}
                                                        </span>
                                                    </div>
                                                    
                                                    {currentRide && hasActiveRide && (
                                                        <div className={`mt-2 rounded-md p-2 border ${
                                                            isNearCompletion ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
                                                        }`}>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={`text-xs font-bold whitespace-nowrap ${
                                                                            isNearCompletion ? 'text-blue-700' : 'text-orange-700'
                                                                        }`}>
                                                                            Job:
                                                                        </span>
                                                                        <span className={`text-sm font-semibold truncate ${
                                                                            isNearCompletion ? 'text-blue-900' : 'text-orange-900'
                                                                        }`}>
                                                                            Room {currentRide.roomNumber}
                                                                        </span>
                                                                        <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                                                                            currentRide.status === BuggyStatus.ON_TRIP
                                                                                ? 'bg-emerald-200 text-emerald-900'
                                                                                : currentRide.status === BuggyStatus.ARRIVING
                                                                                ? 'bg-blue-200 text-blue-900'
                                                                                : 'bg-blue-200 text-blue-900'
                                                                        }`}>
                                                                            {currentRide.status === BuggyStatus.ON_TRIP ? 'ON TRIP' :
                                                                             currentRide.status === BuggyStatus.ARRIVING ? 'ARRIVING' : 'ASSIGNED'}
                                                                        </span>
                                                                    </div>
                                                                    <div className={`text-xs flex items-center gap-2 ${
                                                                        isNearCompletion ? 'text-blue-700' : 'text-orange-700'
                                                                    }`}>
                                                                        <span className="flex items-center gap-1 truncate">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0"></div>
                                                                            <span className="truncate">{currentRide.pickup}</span>
                                                                        </span>
                                                                        <span className="text-gray-400 font-bold">→</span>
                                                                        <span className="flex items-center gap-1 truncate">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                                                            <span className="truncate">{currentRide.destination}</span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {tripProgress !== null && (
                                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                                                                        isNearCompletion ? 'bg-blue-200 text-blue-900' : 'bg-orange-200 text-orange-900'
                                                                    }`}>
                                                                        {tripProgress}m
                                                                    </span>
                                                                )}
                                                            </div>
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
                                                    if (timeSinceUpdate < 120000) {
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
                                                if (d.updatedAt && (Date.now() - d.updatedAt < 120000)) return true;
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
                                                if (d.updatedAt && (Date.now() - d.updatedAt < 120000)) return true;
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
                                        const rideDriverId = ride.driverId ? String(ride.driverId) : '';
                                        const driver = users.find(u => {
                                            const userIdStr = u.id ? String(u.id) : '';
                                            return userIdStr === rideDriverId;
                                        });
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
                                <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
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
                                                <div 
                                                    key={ride.id} 
                                                    className="bg-gray-50 p-2.5 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <span className="text-xs font-bold text-gray-800">Room {ride.roomNumber}</span>
                                                                {ride.rating && (
                                                                    <div className="flex items-center gap-0.5">
                                                                        <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                                                        <span className="text-[9px] font-semibold text-gray-600">{ride.rating}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-600 mb-0.5">
                                                                <span className="font-medium">Driver:</span> {driverName}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 space-y-0.5">
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                                                    <span className="truncate" title={ride.pickup}>{truncateText(ride.pickup, 25)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                                                    <span className="truncate" title={ride.destination}>{truncateText(ride.destination, 25)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                            <span className="flex items-center gap-0.5 text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                                                                <CheckCircle size={9} />
                                                                Done
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
                                    <span className="text-[10px] text-gray-500">Pending</span>
                                </div>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <div className="flex items-center gap-1">
                                    <CheckCircle size={14} className="text-blue-500" />
                                    <span className="text-xs font-semibold text-gray-700">
                                        {getConfirmedServiceRequestsCount()}
                                    </span>
                                    <span className="text-[10px] text-gray-500">Confirmed</span>
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
                                            
                                            const isOnline = staff.updatedAt && (Date.now() - staff.updatedAt < 120000);
                                            
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
                                                                Done
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

