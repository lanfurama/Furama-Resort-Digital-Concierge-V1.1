import React, { useState, useEffect } from 'react';
import { Car, Settings, RefreshCw, Zap, Users, List, Grid3x3, CheckCircle, MapPin, AlertCircle, Info, X, Map } from 'lucide-react';
import { getRides, getRidesSync, getUsers, getUsersSync, updateRideStatus, getLocations } from '../services/dataService';
import { User, UserRole, RideRequest, BuggyStatus, Location } from '../types';

interface ReceptionPortalProps {
    onLogout: () => void;
    user: User;
}

const ReceptionPortal: React.FC<ReceptionPortalProps> = ({ onLogout, user }) => {
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    
    // Fleet Config State
    const [showFleetSettings, setShowFleetSettings] = useState(false);
    const [fleetConfig, setFleetConfig] = useState({
        maxWaitTimeBeforeAutoAssign: 300, // seconds
        autoAssignEnabled: true
    });
    
    // Driver View Mode State
    const [driverViewMode, setDriverViewMode] = useState<'LIST' | 'MAP'>('LIST');

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [ridesData, usersData, locationsData] = await Promise.all([
                    getRides().catch(() => getRidesSync()),
                    getUsers().catch(() => getUsersSync()),
                    getLocations().catch(() => [])
                ]);
                setRides(ridesData);
                setUsers(usersData);
                setLocations(locationsData);
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

    // Auto-refresh rides and users
    useEffect(() => {
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
    }, []);

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
        
        // Driver is available - try to get their location from locations array
        // This is a fallback - ideally driver location should be tracked separately
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
            
            // Check if driver has recent activity (completed ride in last hour)
            const recentCompleted = rides.filter(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverIdStr && 
                    r.status === BuggyStatus.COMPLETED && 
                    r.completedAt && 
                    (Date.now() - r.completedAt < 3600000);
            });
            return recentCompleted.length > 0;
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

    // Helper: Calculate cost for a (driver, ride) pair
    const calculateAssignmentCost = (driver: User, ride: RideRequest): number => {
        const driverIdStr = driver.id ? String(driver.id) : '';
        
        // Get driver's current or expected location
        const driverLocationName = getDriverLocation(driver);
        const driverCoords = resolveLocationCoordinates(driverLocationName);
        const pickupCoords = resolveLocationCoordinates(ride.pickup);
        
        // If we can't resolve coordinates, use a high default cost
        if (!driverCoords || !pickupCoords) {
            return 1000000; // Very high cost
        }
        
        // Calculate distance from driver's current location to pickup point (in meters)
        let distance = calculateDistance(driverCoords, pickupCoords);
        
        // Check driver status
        const driverActiveRides = rides.filter(r => {
            const rideDriverId = r.driverId ? String(r.driverId) : '';
            return rideDriverId === driverIdStr && 
                (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
        });
        const isAvailable = driverActiveRides.length === 0;
        const currentRide = driverActiveRides[0];
        
        // Calculate wait time in seconds (longer wait = higher priority = lower cost)
        const waitTimeSeconds = Math.floor((Date.now() - ride.timestamp) / 1000);
        const waitTimeBonus = waitTimeSeconds * 10; // Each second of wait reduces cost by 10 points
        
        let cost = distance; // Start with distance as base cost
        
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
                // Can't resolve drop-off location, use distance from current location
                cost += 10000; // Penalty for busy drivers
            }
        }
        
        // Subtract wait time bonus (longer wait = lower cost = higher priority)
        cost -= waitTimeBonus;
        
        return cost;
    };

    // AI Auto-Assign Logic with Cost-Based Algorithm
    const handleAutoAssign = async () => {
        const pendingRidesList = rides.filter(r => r.status === BuggyStatus.SEARCHING);
        const driverUsers = users.filter(u => u.role === UserRole.DRIVER);
        const totalDrivers = driverUsers.length;
        
        if (pendingRidesList.length === 0) {
            alert(`⚠️ Không có yêu cầu nào đang chờ được gán.\n\n⚠️ No pending rides to assign.\n\n📊 Trạng thái / Status:\n- Pending Requests: 0\n- Total Drivers: ${totalDrivers}\n- Online Drivers: ${getOnlineDriversCount()}`);
            return;
        }

        // Get all drivers (including busy ones for chain trip opportunities)
        const allDrivers = driverUsers;
        
        if (allDrivers.length === 0) {
            alert(`❌ Không có tài xế nào trong hệ thống.\n\n❌ No drivers available at the moment.\n\n📊 Trạng thái / Status:\n- Pending Requests: ${pendingRidesList.length}\n- Total Drivers: 0\n- Online Drivers: 0`);
            return;
        }
        
        // Check if there are any online drivers (not just offline)
        const onlineDrivers = allDrivers.filter(driver => {
            const driverIdStr = driver.id ? String(driver.id) : '';
            const hasActiveRide = rides.some(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverIdStr && 
                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
            });
            if (hasActiveRide) return true; // Busy drivers are considered online
            
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
            alert(`⚠️ Tất cả tài xế đang offline.\n\n⚠️ All drivers are offline.\n\n📊 Trạng thái / Status:\n- Pending Requests: ${pendingRidesList.length}\n- Total Drivers: ${totalDrivers}\n- Online Drivers: 0\n- Offline Drivers: ${offlineDrivers}\n\n💡 Vui lòng đợi tài xế online hoặc kiểm tra kết nối.\n💡 Please wait for drivers to come online or check connection.`);
            return;
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
        
        // Greedy assignment: assign each ride to the best available driver
        const assignedRides = new Set<string>();
        const assignedDrivers = new Set<string>();
        const finalAssignments: Array<{ driver: User; ride: RideRequest }> = [];
        
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
            
            if (driverActiveRides.length > 0) {
                // Driver is busy - only allow if it's a chain trip (cost is very negative)
                if (assignment.cost > -5000) {
                    continue; // Not a chain trip, skip
                }
            }
            
            // Assign this pair
            assignedRides.add(rideId);
            assignedDrivers.add(driverId);
            finalAssignments.push({ driver: assignment.driver, ride: assignment.ride });
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

        // Refresh data after assignments
        try {
            const refreshedRides = await getRides();
            setRides(refreshedRides);
            if (assignmentCount > 0) {
                const chainTripCount = finalAssignments.filter(({ driver, ride }) => {
                    const driverIdStr = driver.id ? String(driver.id) : '';
                    const hasActiveRide = rides.some(r => {
                        const rideDriverId = r.driverId ? String(r.driverId) : '';
                        return rideDriverId === driverIdStr && 
                            (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
                    });
                    return hasActiveRide;
                }).length;
                
                alert(`✅ Đã gán thành công ${assignmentCount} chuyến đi!\n\n✅ Successfully assigned ${assignmentCount} ride(s)!\n\n📊 Chi tiết / Details:\n- Tổng số gán / Total assigned: ${assignmentCount}\n- Chain trips (tài xế bận): ${chainTripCount}\n- Regular assignments: ${assignmentCount - chainTripCount}\n\n🔧 Thuật toán: Dựa trên chi phí (khoảng cách, thời gian chờ, chain trip)\n🔧 Algorithm: Cost-based (distance, wait time, chain trip)`);
            } else {
                const remainingPending = pendingRidesList.length;
                alert(`⚠️ Không thể gán chuyến đi nào.\n\n⚠️ No assignments could be made.\n\n📊 Trạng thái / Status:\n- Pending Requests: ${remainingPending}\n- Online Drivers: ${onlineDrivers.length}\n- Total Drivers: ${totalDrivers}\n\n💡 Có thể tất cả tài xế đang bận hoặc không phù hợp.\n💡 All drivers may be busy or unavailable for these requests.`);
            }
        } catch (error) {
            console.error('Failed to refresh rides after assignment:', error);
            setRides(getRidesSync());
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-emerald-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center">
                        <Car size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Buggy Dispatch Center</h1>
                        <p className="text-xs text-emerald-200">RECEPTION / FRONT DESK</p>
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

            {/* Main Content - Reuse Fleet Section from AdminPortal */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
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
                                    rides.filter(r => r.status === BuggyStatus.SEARCHING).map((ride) => {
                                        const waitTime = Math.floor((Date.now() - ride.timestamp) / 1000);
                                        const waitMinutes = Math.floor(waitTime / 60);
                                        const waitSeconds = waitTime % 60;
                                        return (
                                            <div key={ride.id} className="bg-gray-50 p-2.5 rounded-md border border-gray-200">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="font-bold text-sm text-gray-900">Room {ride.roomNumber}</div>
                                                    <span className="text-[10px] text-gray-500 flex items-center font-medium">
                                                        <span className="mr-1">⏱</span> {waitMinutes}m {waitSeconds}s
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-600 mb-1">{ride.guestName}</div>
                                                <div className="text-[11px] text-gray-500 space-y-0.5">
                                                    <div className="flex items-center">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5 flex-shrink-0"></div>
                                                        <span className="truncate">{ride.pickup}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 flex-shrink-0"></div>
                                                        <span className="truncate">{ride.destination}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
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
                                        // Sort drivers: AVAILABLE > BUSY > OFFLINE, then alphabetically
                                        const driverUsers = users.filter(u => u.role === UserRole.DRIVER);
                                    const sortedDrivers = driverUsers.sort((a, b) => {
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
                                        
                                        const scoreA = aHasActive ? 1 : 0;
                                        const scoreB = bHasActive ? 1 : 0;
                                        
                                        if (scoreA !== scoreB) {
                                            return scoreA - scoreB;
                                        }
                                        
                                        return a.lastName.localeCompare(b.lastName);
                                    });
                                    
                                    return sortedDrivers.map((driver) => {
                                        const driverIdStr = driver.id ? String(driver.id) : '';
                                        const driverRides = rides.filter(r => {
                                            const rideDriverId = r.driverId ? String(r.driverId) : '';
                                            return rideDriverId === driverIdStr && (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
                                        });
                                        const currentRide = driverRides[0];
                                        const hasActiveRide = currentRide && (currentRide.status === BuggyStatus.ASSIGNED || currentRide.status === BuggyStatus.ARRIVING || currentRide.status === BuggyStatus.ON_TRIP);
                                        
                                        const driverDisplayName = driver.lastName || 'Unknown Driver';
                                        
                                        let driverStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE' = 'OFFLINE';
                                        if (hasActiveRide) {
                                            driverStatus = 'BUSY';
                                        } else {
                                            const recentCompleted = rides.filter(r => {
                                                const rideDriverId = r.driverId ? String(r.driverId) : '';
                                                return rideDriverId === driverIdStr && 
                                                    r.status === BuggyStatus.COMPLETED && 
                                                    r.completedAt && 
                                                    (Date.now() - r.completedAt < 3600000);
                                            });
                                            driverStatus = recentCompleted.length > 0 ? 'AVAILABLE' : 'OFFLINE';
                                        }
                                    
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
                                                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center">
                                                            <MapPin size={10} className="mr-1" />
                                                            {driverLocation}
                                                        </div>
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
                            ) : (
                                // MAP VIEW
                                <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 overflow-hidden h-[400px] rounded-md border border-gray-200">
                                    <img 
                                        src="https://furamavietnam.com/wp-content/uploads/2018/07/Furama-Resort-Danang-Map-768x552.jpg" 
                                        alt="Furama Resort Map" 
                                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                                        onError={(e) => {
                                            // Hide the broken image and show SVG placeholder
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                        }}
                                    />
                                    {/* Beautiful SVG Map Placeholder */}
                                    <svg 
                                        className="absolute inset-0 w-full h-full" 
                                        viewBox="0 0 800 600" 
                                        preserveAspectRatio="xMidYMid meet"
                                    >
                                        {/* Background gradient */}
                                        <defs>
                                            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" style={{stopColor: '#d1fae5', stopOpacity: 1}} />
                                                <stop offset="100%" style={{stopColor: '#a7f3d0', stopOpacity: 1}} />
                                            </linearGradient>
                                            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style={{stopColor: '#06b6d4', stopOpacity: 0.6}} />
                                                <stop offset="100%" style={{stopColor: '#0891b2', stopOpacity: 0.8}} />
                                            </linearGradient>
                                        </defs>
                                        
                                        {/* Background */}
                                        <rect width="800" height="600" fill="url(#bgGradient)" />
                                        
                                        {/* Beach/Water area */}
                                        <path d="M 0 450 Q 200 420, 400 450 T 800 450 L 800 600 L 0 600 Z" 
                                              fill="url(#waterGradient)" opacity="0.7" />
                                        
                                        {/* Main roads */}
                                        <path d="M 100 300 Q 200 250, 300 300 T 500 300 T 700 300" 
                                              stroke="#065f46" strokeWidth="8" fill="none" opacity="0.4" strokeLinecap="round" />
                                        <path d="M 400 100 L 400 500" 
                                              stroke="#065f46" strokeWidth="8" fill="none" opacity="0.4" strokeLinecap="round" />
                                        <path d="M 150 200 Q 250 150, 350 200" 
                                              stroke="#10b981" strokeWidth="6" fill="none" opacity="0.3" strokeLinecap="round" />
                                        
                                        {/* Main Building/Lobby */}
                                        <rect x="320" y="200" width="160" height="120" rx="8"
                                              fill="#10b981" stroke="#065f46" strokeWidth="3" opacity="0.7" />
                                        <text x="400" y="260" textAnchor="middle" fontSize="16" fill="#065f46" fontWeight="bold" fontFamily="Arial, sans-serif">
                                            Main Lobby
                                        </text>
                                        
                                        {/* Pool Area */}
                                        <ellipse cx="200" cy="400" rx="80" ry="60" 
                                                 fill="#06b6d4" stroke="#0891b2" strokeWidth="3" opacity="0.6" />
                                        <text x="200" y="405" textAnchor="middle" fontSize="14" fill="#0e7490" fontWeight="bold" fontFamily="Arial, sans-serif">
                                            Pool
                                        </text>
                                        
                                        {/* Restaurant */}
                                        <rect x="500" y="350" width="140" height="90" rx="6"
                                              fill="#f59e0b" stroke="#d97706" strokeWidth="3" opacity="0.7" />
                                        <text x="570" y="400" textAnchor="middle" fontSize="14" fill="#92400e" fontWeight="bold" fontFamily="Arial, sans-serif">
                                            Restaurant
                                        </text>
                                        
                                        {/* Spa Area */}
                                        <circle cx="650" cy="250" r="50" 
                                                fill="#ec4899" stroke="#db2777" strokeWidth="3" opacity="0.7" />
                                        <text x="650" y="255" textAnchor="middle" fontSize="14" fill="#9f1239" fontWeight="bold" fontFamily="Arial, sans-serif">
                                            Spa
                                        </text>
                                        
                                        {/* Parking Area */}
                                        <rect x="100" y="100" width="120" height="80" rx="4"
                                              fill="#9ca3af" stroke="#6b7280" strokeWidth="2" opacity="0.6" />
                                        <text x="160" y="145" textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold" fontFamily="Arial, sans-serif">
                                            Parking
                                        </text>
                                        
                                        {/* Villas Area */}
                                        <rect x="50" y="150" width="100" height="80" rx="4"
                                              fill="#84cc16" stroke="#65a30d" strokeWidth="2" opacity="0.6" />
                                        <text x="100" y="195" textAnchor="middle" fontSize="11" fill="#365314" fontWeight="bold" fontFamily="Arial, sans-serif">
                                            Villas
                                        </text>
                                        
                                        {/* Garden/Green Area */}
                                        <ellipse cx="250" cy="150" rx="60" ry="50" 
                                                 fill="#22c55e" stroke="#16a34a" strokeWidth="2" opacity="0.5" />
                                        <text x="250" y="155" textAnchor="middle" fontSize="11" fill="#14532d" fontWeight="bold" fontFamily="Arial, sans-serif">
                                            Garden
                                        </text>
                                        
                                        {/* Title */}
                                        <text x="400" y="40" textAnchor="middle" fontSize="24" fill="#065f46" fontWeight="bold" fontFamily="Arial, sans-serif">
                                            Furama Resort Map
                                        </text>
                                        <text x="400" y="65" textAnchor="middle" fontSize="12" fill="#047857" fontWeight="normal" fontFamily="Arial, sans-serif">
                                            Da Nang, Vietnam
                                        </text>
                                        
                                        {/* Grid lines for reference (subtle) */}
                                        <defs>
                                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.1"/>
                                            </pattern>
                                        </defs>
                                        <rect width="800" height="600" fill="url(#grid)" />
                                    </svg>
                                    {users.filter(u => u.role === UserRole.DRIVER).map(driver => {
                                        const driverIdStr = driver.id ? String(driver.id) : '';
                                        const hasActiveRide = rides.some(r => {
                                            const rideDriverId = r.driverId ? String(r.driverId) : '';
                                            return rideDriverId === driverIdStr && 
                                                (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
                                        });
                                        
                                        // Check if driver is online
                                        const isOnline = hasActiveRide || rides.some(r => {
                                            const rideDriverId = r.driverId ? String(r.driverId) : '';
                                            return rideDriverId === driverIdStr && 
                                                r.status === BuggyStatus.COMPLETED && 
                                                r.completedAt && 
                                                (Date.now() - r.completedAt < 3600000);
                                        });
                                        
                                        if (!isOnline) return null; // Don't show offline drivers on map
                                        
                                        const coords = resolveDriverCoordinates(driver);
                                        const pos = getMapPosition(coords.lat, coords.lng);
                                        const isBusy = hasActiveRide;
                                        const driverDisplayName = driver.lastName || 'Unknown Driver';
                                        
                                        return (
                                            <div 
                                                key={driver.id} 
                                                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer hover:z-50" 
                                                style={{ top: pos.top, left: pos.left }}
                                            >
                                                <div className="bg-white/90 backdrop-blur-sm text-[9px] font-bold px-1.5 py-0.5 rounded shadow mb-1 whitespace-nowrap z-20 text-black">
                                                    {driverDisplayName.split(' ')[0]}
                                                </div>
                                                <div className={`p-1.5 rounded-full shadow-lg border-2 border-white transition-transform duration-300 relative z-10 ${
                                                    isBusy ? 'bg-orange-500' : 'bg-emerald-600'
                                                } ${!isBusy ? 'animate-bounce' : ''}`}>
                                                    <Car size={14} className="text-white"/>
                                                </div>
                                            </div>
                                        );
                                    })}
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
            </div>
        </div>
    );
};

export default ReceptionPortal;

