
import React, { useState, useEffect, useRef } from 'react';
import { getRides, getDriversWithLocations, updateRideStatus, getLocations, getSystemConfig, updateSystemConfig, getUsers } from '../services/dataService';
import { optimizeBuggyFleet } from '../services/geminiService';
import { RideRequest, BuggyStatus, User, UserRole } from '../types';
import { Car, Clock, MapPin, CheckCircle, RefreshCw, Zap, User as UserIcon, Settings, Save, Map, List, Navigation, AlertTriangle, X, Check, Filter, ZoomIn, ZoomOut } from 'lucide-react';
import { RESORT_CENTER } from '../constants';

// Driver type extends User with additional fields
interface Driver extends User {
    status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
    currentLocation: string;
    name: string;
    currentRideId?: string;
}

const BuggyFleetManager: React.FC = () => {
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [selectedRide, setSelectedRide] = useState<string | null>(null);
    
    // Track assignment intent before confirmation: { rideId, driverId }
    const [pendingAssignment, setPendingAssignment] = useState<{rideId: string, driverId: string} | null>(null);

    // View Mode for Drivers Column
    const [driverViewMode, setDriverViewMode] = useState<'LIST' | 'MAP'>('MAP');
    
    // Config State
    const [config, setConfig] = useState(getSystemConfig());
    const [showSettings, setShowSettings] = useState(false);
    
    // Map Filter State
    const [driverFilter, setDriverFilter] = useState<'ALL' | 'AVAILABLE' | 'BUSY'>('ALL');

    // Map State
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<any>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    
    // Initialize mapError based on API Key presence to avoid unnecessary script loads
    const [mapError, setMapError] = useState(!process.env.API_KEY); 

    // Locations for Map Mapping
    const locations = getLocations();

    const refreshData = async () => {
        const currentRides = await getRides();
        const driversWithLocations = await getDriversWithLocations();
        const allRides = await getRides();
        
        // Transform User[] to Driver[] with status and location info
        const transformedDrivers: Driver[] = driversWithLocations.map(user => {
            // Determine driver status based on active rides
            const activeRide = allRides.find(r => 
                r.driverId === user.id && 
                (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP)
            );
            
            // Determine if driver is online (updated within last 10 hours)
            const isOnline = user.updatedAt && (Date.now() - user.updatedAt) < (10 * 60 * 60 * 1000);
            
            // Get location string
            let locationStr = "Unknown Location";
            if (activeRide) {
                locationStr = activeRide.destination;
            } else if (user.currentLat !== undefined && user.currentLng !== undefined) {
                // Find nearest location to driver's GPS coordinates
                let nearestLocation = locations[0];
                let minDistance = Infinity;
                
                locations.forEach(loc => {
                    const dist = Math.sqrt(
                        Math.pow(user.currentLat! - loc.lat, 2) + Math.pow(user.currentLng! - loc.lng, 2)
                    );
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestLocation = loc;
                    }
                });
                
                // If within ~100 meters of a known location, show location name
                if (minDistance < 0.001) {
                    locationStr = `Near ${nearestLocation.name}`;
                } else {
                    locationStr = `GPS: ${user.currentLat.toFixed(6)}, ${user.currentLng.toFixed(6)}`;
                }
            } else if (locations.length > 0) {
                const driverLocation = locations[parseInt(user.id || '0') % locations.length];
                locationStr = driverLocation?.name || "Unknown Location";
            }
            
            return {
                ...user,
                status: activeRide ? 'BUSY' : (isOnline ? 'AVAILABLE' : 'OFFLINE'),
                currentLocation: locationStr,
                name: user.lastName || `Driver ${user.id}`,
                currentRideId: activeRide?.id
            } as Driver;
        });
        
        setRides(currentRides);
        setDrivers(transformedDrivers);

        // --- ADMIN SIDE AUTO-ASSIGN CHECKER ---
        if (config.autoAssignEnabled) {
            const now = Date.now();
            const longWaitRides = currentRides.filter(r => 
                r.status === BuggyStatus.SEARCHING && 
                (now - r.timestamp) > (config.maxWaitTimeBeforeAutoAssign * 1000)
            );

            const available = currentDrivers.filter(d => d.status === 'AVAILABLE');
            
            if (longWaitRides.length > 0 && available.length > 0 && !isOptimizing) {
                console.log("Auto-triggering AI Assignment due to wait time...");
                handleAutoAssign(longWaitRides, available);
            }
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 3000); // Live poll every 3 seconds
        return () => clearInterval(interval);
    }, [config]); 

    // Filtered lists (Need these for map logic too)
    const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING);
    const activeRides = rides.filter(r => r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
    const completedRides = rides.filter(r => r.status === BuggyStatus.COMPLETED);
    const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE');

    // Sorted List for Dropdown: Exclude OFFLINE, Priority: AVAILABLE > BUSY
    const assignableDrivers = drivers
        .filter(d => d.status !== 'OFFLINE')
        .sort((a, b) => {
            // 1. Status Priority
            const scoreA = a.status === 'AVAILABLE' ? 0 : 1;
            const scoreB = b.status === 'AVAILABLE' ? 0 : 1;
            if (scoreA !== scoreB) return scoreA - scoreB;
            // 2. Name Alphabetical
            return a.name.localeCompare(b.name);
        });

    // --- GOOGLE MAPS INTEGRATION ---
    useEffect(() => {
        if (driverViewMode === 'MAP' && !mapInstance && !mapError) {
            
            // Define global error handler for Auth Failure (Invalid Key)
            (window as any).gm_authFailure = () => {
                console.error("Google Maps Authentication Error (gm_authFailure). Falling back to static map.");
                setMapError(true);
                setMapInstance(null); // Clear invalid instance
            };

            // Check if script already exists
            if ((window as any).google && (window as any).google.maps) {
                initMap();
                return;
            }

            // Load Google Maps Script
            if (!document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
                const script = document.createElement('script');
                const apiKey = process.env.API_KEY || '';
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&callback=initGoogleMap&v=weekly`;
                script.async = true;
                script.defer = true;
                
                script.onerror = () => {
                    console.error("Failed to load Google Maps script (Network Error).");
                    setMapError(true);
                };
                
                (window as any).initGoogleMap = () => {
                    initMap();
                };

                document.head.appendChild(script);
            }
        }
    }, [driverViewMode, mapError]);

    const initMap = () => {
        if (!mapRef.current || !(window as any).google || mapError) return;
        
        try {
            const map = new (window as any).google.maps.Map(mapRef.current, {
                center: { lat: RESORT_CENTER.lat, lng: RESORT_CENTER.lng },
                zoom: 17,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            });
            setMapInstance(map);
        } catch (e) {
            console.error("Error initializing map constructor", e);
            setMapError(true);
        }
    };

    // Update Markers
    useEffect(() => {
        if (mapInstance && driverViewMode === 'MAP' && (window as any).google && !mapError) {
            markers.forEach(m => m.setMap(null));
            const newMarkers: any[] = [];
            
            // Filter drivers based on filter state
            const filteredDrivers = drivers.filter(d => {
                if (d.status === 'OFFLINE') return false;
                if (driverFilter === 'ALL') return true;
                return d.status === driverFilter;
            });

            filteredDrivers.forEach(driver => {
                const coords = resolveDriverCoordinates(driver);
                let infoContent = '';
                const activeRide = driver.currentRideId ? activeRides.find(r => r.id === driver.currentRideId) : null;
                
                if (activeRide) {
                    infoContent = `
                        <div style="color: #1f2937; padding: 4px; max-width: 200px;">
                            <strong style="font-size: 14px; color: #d97706;">${driver.name} (Busy)</strong>
                            <hr style="margin: 4px 0; border: 0; border-top: 1px solid #eee;"/>
                            <div style="font-size: 12px;">
                                <strong>Trip:</strong> Room ${activeRide.roomNumber}<br/>
                                <span style="color: #6b7280;">${activeRide.pickup} &rarr; ${activeRide.destination}</span>
                            </div>
                        </div>
                    `;
                } else {
                    const lastRide = completedRides
                        .filter(r => r.driverId === driver.id)
                        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
                    
                    let timeSinceStr = "No recent trips";
                    if (lastRide && lastRide.completedAt) {
                        const diffMins = Math.floor((Date.now() - lastRide.completedAt) / 60000);
                        timeSinceStr = diffMins === 0 ? "Just now" : `${diffMins} mins ago`;
                    }
                    
                    // Location info
                    let locationInfo = driver.currentLocation;
                    let gpsInfo = "";
                    if (driver.currentLat !== undefined && driver.currentLng !== undefined) {
                        gpsInfo = `<br/><strong>GPS:</strong> ${driver.currentLat.toFixed(6)}, ${driver.currentLng.toFixed(6)}`;
                        if (driver.locationUpdatedAt) {
                            const locationAge = Math.floor((Date.now() - driver.locationUpdatedAt) / 60000);
                            gpsInfo += ` <span style="color: ${locationAge > 5 ? '#ef4444' : '#10b981'}; font-size: 10px;">(${locationAge}m ago)</span>`;
                        }
                    }

                    infoContent = `
                        <div style="color: #1f2937; padding: 6px; max-width: 220px;">
                            <strong style="font-size: 14px; color: #059669;">${driver.name} (Available)</strong>
                            <hr style="margin: 4px 0; border: 0; border-top: 1px solid #eee;"/>
                            <div style="font-size: 11px; color: #6b7280;">
                                <strong>Idle:</strong> ${timeSinceStr}<br/>
                                <strong>Location:</strong> ${locationInfo}${gpsInfo}
                            </div>
                        </div>
                    `;
                }

                const color = driver.status === 'AVAILABLE' ? '#10b981' : '#f97316';
                const svgIcon = {
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                            <path fill="${color}" stroke="white" stroke-width="2" d="M20,0 C28.28,0 35,6.72 35,15 C35,25 20,40 20,40 C20,40 5,25 5,15 C5,6.72 11.72,0 20,0 Z"></path>
                            <circle cx="20" cy="15" r="10" fill="white" />
                            <path transform="translate(12, 9) scale(0.7)" fill="${color}" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2a2 2 0 0 0 4 0h3a2 2 0 0 0 4 0h3zm-3-6l1.3 2.5c.1.2.1.5.1.8v.7H6v-.7c0-.3 0-.6.2-.8L7.5 11h8.5z" />
                        </svg>
                    `)}`,
                    scaledSize: new (window as any).google.maps.Size(40, 40),
                    anchor: new (window as any).google.maps.Point(20, 40),
                    labelOrigin: new (window as any).google.maps.Point(20, -10)
                };

                const marker = new (window as any).google.maps.Marker({
                    position: coords,
                    map: mapInstance,
                    icon: svgIcon,
                    animation: (window as any).google.maps.Animation.DROP,
                    label: {
                        text: driver.name,
                        color: "#374151",
                        fontWeight: "bold",
                        fontSize: "12px",
                        className: "bg-white px-1 rounded shadow-sm"
                    }
                });

                const infoWindow = new (window as any).google.maps.InfoWindow({ content: infoContent });
                marker.addListener("click", () => infoWindow.open(mapInstance, marker));
                marker.addListener("mouseover", () => infoWindow.open(mapInstance, marker));
                newMarkers.push(marker);
            });
            setMarkers(newMarkers);
            
            // Auto-fit bounds to show all drivers
            if (newMarkers.length > 0 && mapInstance) {
                const bounds = new (window as any).google.maps.LatLngBounds();
                filteredDrivers.forEach(driver => {
                    const coords = resolveDriverCoordinates(driver);
                    bounds.extend(coords);
                });
                mapInstance.fitBounds(bounds);
                // Ensure minimum zoom level
                if (mapInstance.getZoom() && mapInstance.getZoom() > 18) {
                    mapInstance.setZoom(18);
                }
            }
        }
    }, [drivers, mapInstance, driverViewMode, mapError, activeRides, completedRides, driverFilter]);

    // ... (Keep handleAssign, handleAutoAssign, handleSaveConfig, resolveDriverCoordinates unchanged)
    const handleAssign = async (rideId: string, driverId: string) => {
        await updateRideStatus(rideId, BuggyStatus.ASSIGNED, driverId, 5); 
        setSelectedRide(null);
        setPendingAssignment(null); // Clear pending state
        await refreshData();
    };

    const handleAutoAssign = async (targetRides = pendingRides, targetDrivers = availableDrivers) => {
        if (targetRides.length === 0 || targetDrivers.length === 0) return;
        setIsOptimizing(true);
        const result = await optimizeBuggyFleet(targetRides, targetDrivers);
        if (result && result.assignments) {
            result.assignments.forEach((assignment: any) => {
                handleAssign(assignment.rideId, assignment.driverId);
            });
        }
        setIsOptimizing(false);
        refreshData();
    };

    const handleSaveConfig = () => {
        updateSystemConfig(config);
        setShowSettings(false);
    };

    const resolveDriverCoordinates = (driver: Driver) => {
        // Priority 1: Use GPS coordinates from database if available
        if (driver.currentLat !== undefined && driver.currentLng !== undefined) {
            return { lat: driver.currentLat, lng: driver.currentLng };
        }
        
        // Priority 2: Parse GPS from location string
        if (driver.currentLocation.startsWith("GPS:")) {
            const parts = driver.currentLocation.replace("GPS:", "").split(",");
            if (parts.length === 2) {
                const lat = parseFloat(parts[0].trim());
                const lng = parseFloat(parts[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) {
                    return { lat, lng };
                }
            }
        }
        
        // Priority 3: Find location by name
        const loc = locations.find(l => 
            driver.currentLocation.includes(l.name) || 
            l.name.includes(driver.currentLocation) ||
            driver.currentLocation.includes(`Near ${l.name}`)
        );
        if (loc) return { lat: loc.lat, lng: loc.lng };
        
        // Fallback: Resort center with small random offset
        return { 
            lat: RESORT_CENTER.lat + (Math.random() * 0.001 - 0.0005), 
            lng: RESORT_CENTER.lng + (Math.random() * 0.001 - 0.0005) 
        }; 
    };

    // --- STATIC MAP HELPERS ---
    const mapBounds = { minLat: 16.0375, maxLat: 16.0420, minLng: 108.2460, maxLng: 108.2500 };
    const getPos = (lat: number, lng: number) => {
        const clampedLat = Math.max(mapBounds.minLat, Math.min(mapBounds.maxLat, lat));
        const clampedLng = Math.max(mapBounds.minLng, Math.min(mapBounds.maxLng, lng));
        const y = ((mapBounds.maxLat - clampedLat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
        const x = ((clampedLng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
        return { top: `${Math.max(5, Math.min(95, y))}%`, left: `${Math.max(5, Math.min(95, x))}%` };
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-4 gap-4 overflow-hidden relative">
            {/* Top Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <Car className="mr-2 text-emerald-600"/> Buggy Fleet Dispatch
                    </h2>
                    <p className="text-xs text-slate-500">Manage real-time buggy requests and driver fleet.</p>
                </div>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => setShowSettings(!showSettings)} 
                        className={`p-2 rounded-lg transition ${showSettings ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Settings size={20} />
                    </button>
                    <button onClick={refreshData} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                        <RefreshCw size={20} />
                    </button>
                    <button 
                        onClick={() => handleAutoAssign()}
                        disabled={isOptimizing || pendingRides.length === 0}
                        className={`flex items-center px-4 py-2 rounded-lg font-bold text-white shadow-md transition ${isOptimizing ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        <Zap size={18} className={`mr-2 ${isOptimizing ? 'animate-pulse' : ''}`} />
                        {isOptimizing ? 'Optimizing...' : 'Assign by AI'}
                    </button>
                </div>
            </div>

            {/* Configuration Panel Overlay */}
            {showSettings && (
                <div className="absolute top-20 right-4 z-20 bg-white p-6 rounded-xl shadow-2xl border border-slate-200 w-80 animate-in fade-in slide-in-from-top-5">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <Settings size={16} className="mr-2"/> Dispatch Configuration
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Wait Time (Seconds)</label>
                            <input 
                                type="number" 
                                className="w-full border border-slate-300 rounded p-2 text-sm"
                                value={config.maxWaitTimeBeforeAutoAssign}
                                onChange={(e) => setConfig({...config, maxWaitTimeBeforeAutoAssign: parseInt(e.target.value) || 0})}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Enable Auto-Assign</span>
                            <input 
                                type="checkbox" 
                                checked={config.autoAssignEnabled}
                                onChange={(e) => setConfig({...config, autoAssignEnabled: e.target.checked})}
                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                        </div>
                        <button onClick={handleSaveConfig} className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg hover:bg-emerald-700 transition">Save Settings</button>
                    </div>
                </div>
            )}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
                {/* Column 1: Pending Requests */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-3 bg-amber-50 border-b border-amber-100 font-bold text-amber-800 flex justify-between items-center">
                        <span>Pending Requests ({pendingRides.length})</span>
                        {config.autoAssignEnabled && <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded text-amber-900">Auto: {config.maxWaitTimeBeforeAutoAssign}s</span>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
                        {pendingRides.length === 0 && <div className="text-center text-slate-400 py-10 text-sm">No pending requests.</div>}
                        {pendingRides.map(ride => {
                            const waitTime = (Date.now() - ride.timestamp) / 1000;
                            const isOverdue = waitTime > config.maxWaitTimeBeforeAutoAssign;
                            const isExpanded = selectedRide === ride.id;
                            const isPendingConfirmation = pendingAssignment?.rideId === ride.id;

                            return (
                                <div 
                                    key={ride.id} 
                                    className={`rounded-lg border transition ${isExpanded ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-300'}`}
                                >
                                    {/* Header Section - Click to Toggle */}
                                    <div 
                                        onClick={() => setSelectedRide(isExpanded ? null : ride.id)}
                                        className="p-4 cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-900">Room {ride.roomNumber}</span>
                                            <span className={`text-xs flex items-center font-bold ${isOverdue ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                                                <Clock size={12} className="mr-1"/> {Math.floor(waitTime / 60)}m {Math.floor(waitTime % 60)}s
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-400 mr-2"/> {ride.pickup}</div>
                                            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"/> {ride.destination}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Details Section - Interactive */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 pt-0">
                                            <div className="pt-3 border-t border-gray-200/50 animate-in slide-in-from-top-2">
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">Assign Driver:</label>
                                                
                                                {isPendingConfirmation ? (
                                                    <div className="bg-white p-2 rounded border border-emerald-200 shadow-sm animate-in fade-in">
                                                        <div className="text-xs text-emerald-800 mb-2 font-bold text-center">
                                                            Assign to {drivers.find(d => d.id === pendingAssignment.driverId)?.name}?
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button 
                                                                onClick={() => setPendingAssignment(null)}
                                                                className="flex-1 py-1.5 px-2 bg-gray-50 border border-gray-300 rounded text-gray-600 text-xs font-medium hover:bg-gray-100 flex items-center justify-center"
                                                            >
                                                                <X size={12} className="mr-1"/> Cancel
                                                            </button>
                                                            <button 
                                                                onClick={() => handleAssign(ride.id, pendingAssignment.driverId)}
                                                                className="flex-1 py-1.5 px-2 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center justify-center"
                                                            >
                                                                <Check size={12} className="mr-1"/> Confirm
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <select
                                                            className="w-full p-2 pl-3 pr-8 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    setPendingAssignment({ rideId: ride.id, driverId: e.target.value });
                                                                }
                                                            }}
                                                            value=""
                                                            onClick={(e) => e.stopPropagation()} 
                                                        >
                                                            <option value="" disabled>Select a driver...</option>
                                                            {assignableDrivers.map(d => (
                                                                <option key={d.id} value={d.id} className="py-1">
                                                                    {d.status === 'AVAILABLE' ? '🟢' : '🟠'} {d.name} — {d.currentLocation} {d.status === 'BUSY' ? '(Busy)' : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                        </div>
                                                    </div>
                                                )}

                                                {!isPendingConfirmation && assignableDrivers.length === 0 && (
                                                    <p className="text-[10px] text-red-500 mt-1 italic">No drivers currently online.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Column 2: Driver Fleet (With Map Toggle) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-2 bg-blue-50 border-b border-blue-100 font-bold text-blue-800 flex justify-between items-center">
                        <span className="pl-2">Driver Fleet ({drivers.filter(d => d.status !== 'OFFLINE').length} online)</span>
                        <div className="flex items-center gap-2">
                            {driverViewMode === 'MAP' && (
                                <div className="flex bg-white rounded-lg p-0.5 border border-blue-100 mr-1">
                                    <button 
                                        onClick={() => setDriverFilter('ALL')} 
                                        className={`px-2 py-1 text-[10px] rounded ${driverFilter === 'ALL' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        All
                                    </button>
                                    <button 
                                        onClick={() => setDriverFilter('AVAILABLE')} 
                                        className={`px-2 py-1 text-[10px] rounded ${driverFilter === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Available
                                    </button>
                                    <button 
                                        onClick={() => setDriverFilter('BUSY')} 
                                        className={`px-2 py-1 text-[10px] rounded ${driverFilter === 'BUSY' ? 'bg-orange-100 text-orange-700 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Busy
                                    </button>
                                </div>
                            )}
                            <div className="flex bg-white rounded-lg p-0.5 border border-blue-100">
                                <button onClick={() => setDriverViewMode('LIST')} className={`p-1.5 rounded ${driverViewMode === 'LIST' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={14}/></button>
                                <button onClick={() => setDriverViewMode('MAP')} className={`p-1.5 rounded ${driverViewMode === 'MAP' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Map size={14}/></button>
                            </div>
                        </div>
                    </div>
                    
                    {driverViewMode === 'LIST' ? (
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {drivers.map(driver => {
                                const isAvailable = driver.status === 'AVAILABLE';
                                const activeRide = driver.currentRideId ? activeRides.find(r => r.id === driver.currentRideId) : null;
                                return (
                                    <div key={driver.id} className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 bg-white">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center">
                                                <div className="bg-slate-200 p-1.5 rounded-full mr-2"><User size={16}/></div>
                                                <div>
                                                    <div className="font-bold text-sm text-gray-900">{driver.name}</div>
                                                    <div className="text-[10px] text-gray-500 flex items-center">
                                                        <MapPin size={10} className="mr-1"/> {driver.currentLocation}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                isAvailable ? 'bg-green-100 text-green-700' : 
                                                driver.status === 'OFFLINE' ? 'bg-slate-100 text-slate-500' : 'bg-orange-100 text-orange-700'
                                            }`}>{driver.status}</span>
                                        </div>
                                        {activeRide && (
                                            <div className="mt-2 bg-orange-50 p-2 rounded text-xs border border-orange-100">
                                                <p className="font-bold text-orange-800 mb-1">Current Job:</p>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-800">Room {activeRide.roomNumber}</span>
                                                    <span className="text-orange-700">{activeRide.status}</span>
                                                </div>
                                                <div className="text-orange-600 truncate mt-1">{activeRide.pickup} → {activeRide.destination}</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // MAP VIEW (Keep same)
                        <div className="flex-1 relative bg-emerald-50 overflow-hidden min-h-[300px]">
                            {mapError ? (
                                <>
                                    <img src="https://furamavietnam.com/wp-content/uploads/2018/07/Furama-Resort-Danang-Map-768x552.jpg" alt="Map" className="absolute inset-0 w-full h-full object-cover opacity-80"/>
                                    {drivers
                                        .filter(d => {
                                            if (d.status === 'OFFLINE') return false;
                                            if (driverFilter === 'ALL') return true;
                                            return d.status === driverFilter;
                                        })
                                        .map(driver => {
                                            const coords = resolveDriverCoordinates(driver);
                                            const pos = getPos(coords.lat, coords.lng);
                                            const isBusy = driver.status === 'BUSY';
                                            return (
                                                <div key={driver.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer hover:z-50" style={{ top: pos.top, left: pos.left }}>
                                                    <div className="bg-white/90 backdrop-blur-sm text-[9px] font-bold px-1.5 py-0.5 rounded shadow mb-1 whitespace-nowrap z-20 text-black">{driver.name.split(' ')[0]}</div>
                                                    <div className={`p-1.5 rounded-full shadow-lg border-2 border-white transition-transform duration-300 relative z-10 ${isBusy ? 'bg-orange-500' : 'bg-emerald-600'} ${!isBusy ? 'animate-bounce' : ''}`}>
                                                        <Car size={14} className="text-white"/>
                                                    </div>
                                                    {driver.currentLat !== undefined && driver.currentLng !== undefined && (
                                                        <div className="mt-1 bg-white/90 backdrop-blur-sm text-[8px] px-1 py-0.5 rounded shadow text-gray-600">
                                                            GPS
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </>
                            ) : ( <div ref={mapRef} className="w-full h-full" /> )}
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur p-2 rounded text-[10px] shadow border border-gray-200 z-10">
                                <div className="flex items-center mb-1 text-gray-800"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></div> Available Driver</div>
                                <div className="flex items-center text-gray-800"><div className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-1.5"></div> Busy / On Trip</div>
                                {mapError && <div className="mt-1 text-red-500 font-bold text-[9px] flex items-center"><AlertTriangle size={8} className="mr-1"/> Static View (Map Error)</div>}
                                {!mapError && (
                                    <div className="mt-1 text-emerald-600 font-bold text-[9px] flex items-center">
                                        <MapPin size={8} className="mr-1"/> Real-time GPS Tracking
                                    </div>
                                )}
                            </div>
                            {!mapError && mapInstance && (
                                <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                                    <button 
                                        onClick={() => mapInstance.setZoom(mapInstance.getZoom()! + 1)}
                                        className="bg-white/90 backdrop-blur p-1.5 rounded shadow border border-gray-200 hover:bg-white transition"
                                        title="Zoom In"
                                    >
                                        <ZoomIn size={14} className="text-gray-700"/>
                                    </button>
                                    <button 
                                        onClick={() => mapInstance.setZoom(mapInstance.getZoom()! - 1)}
                                        className="bg-white/90 backdrop-blur p-1.5 rounded shadow border border-gray-200 hover:bg-white transition"
                                        title="Zoom Out"
                                    >
                                        <ZoomOut size={14} className="text-gray-700"/>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (mapInstance) {
                                                const bounds = new (window as any).google.maps.LatLngBounds();
                                                drivers.filter(d => d.status !== 'OFFLINE').forEach(driver => {
                                                    const coords = resolveDriverCoordinates(driver);
                                                    bounds.extend(coords);
                                                });
                                                mapInstance.fitBounds(bounds);
                                            }
                                        }}
                                        className="bg-white/90 backdrop-blur p-1.5 rounded shadow border border-gray-200 hover:bg-white transition"
                                        title="Fit All Drivers"
                                    >
                                        <Navigation size={14} className="text-gray-700"/>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Column 3: Active & Completed */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                     <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between">
                        <span>Active Trips ({activeRides.length})</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
                        {activeRides.length === 0 && <div className="text-center text-slate-400 py-10 text-sm">No active trips.</div>}
                        {activeRides.map(ride => (
                            <div key={ride.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-sm text-gray-900">Room {ride.roomNumber}</span>
                                    <span className="text-xs text-blue-600 font-bold">{ride.status}</span>
                                </div>
                                <div className="text-xs text-gray-500 mb-2">Driver: {drivers.find(d => d.id === ride.driverId)?.name || 'Unknown'}</div>
                                <div className="flex items-center text-xs text-gray-600">
                                    <span className="truncate w-1/2">{ride.pickup}</span>
                                    <span className="mx-1">→</span>
                                    <span className="truncate w-1/2">{ride.destination}</span>
                                </div>
                            </div>
                        ))}

                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Recent Completed</h4>
                            {completedRides.slice(0, 5).map(ride => (
                                <div key={ride.id} className="flex justify-between text-xs text-gray-500 py-1">
                                    <span>Room {ride.roomNumber}</span>
                                    <span className="text-green-600 flex items-center"><CheckCircle size={10} className="mr-1"/> Done</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuggyFleetManager;
