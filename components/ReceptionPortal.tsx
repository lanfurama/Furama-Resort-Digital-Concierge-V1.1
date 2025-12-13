import React, { useState, useEffect } from 'react';
import { Car, Settings, RefreshCw, Zap, Users, List, Grid3x3, CheckCircle, MapPin } from 'lucide-react';
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

    // AI Auto-Assign Logic
    const handleAutoAssign = async () => {
        const pendingRidesList = rides.filter(r => r.status === BuggyStatus.SEARCHING);
        const driverUsers = users.filter(u => u.role === UserRole.DRIVER);
        
        if (pendingRidesList.length === 0) {
            alert('No pending rides to assign.');
            return;
        }

        // Get available drivers (drivers without active rides)
        const availableDrivers = driverUsers.filter(driver => {
            const driverIdStr = driver.id ? String(driver.id) : '';
            const hasActiveRide = rides.some(r => {
                const rideDriverId = r.driverId ? String(r.driverId) : '';
                return rideDriverId === driverIdStr && 
                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
            });
            return !hasActiveRide;
        });

        if (availableDrivers.length === 0) {
            alert('No available drivers at the moment.');
            return;
        }

        // Sort drivers: Priority AVAILABLE > BUSY, then alphabetically
        const sortedDrivers = availableDrivers.sort((a, b) => {
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
            
            if (aHasActive !== bHasActive) {
                return aHasActive ? 1 : -1;
            }
            
            return a.lastName.localeCompare(b.lastName);
        });

        // Assign pending rides to available drivers (round-robin style)
        let assignmentCount = 0;
        for (let i = 0; i < pendingRidesList.length && i < sortedDrivers.length; i++) {
            const ride = pendingRidesList[i];
            const driver = sortedDrivers[i % sortedDrivers.length];
            
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
                alert(`Successfully assigned ${assignmentCount} ride(s) to available drivers.`);
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
                        <div className="flex items-center gap-1.5">
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
                            <button 
                                onClick={async () => {
                                    await handleAutoAssign();
                                }}
                                disabled={rides.filter(r => r.status === BuggyStatus.SEARCHING).length === 0}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Zap size={16} />
                                <span>Assign by AI</span>
                            </button>
                        </div>
                    </div>

                    {/* Dispatch Configuration Modal */}
                    {showFleetSettings && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-96 p-6 animate-in slide-in-from-top-5">
                                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
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

