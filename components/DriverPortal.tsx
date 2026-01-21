
import React, { useState, useEffect } from 'react';
import { useAdaptivePolling } from '../hooks/useAdaptivePolling';
import { getRides, updateRideStatus, getLastMessage, createManualRide, getLocations, setDriverOnlineFor10Hours, getDriverSchedules, DriverSchedule } from '../services/dataService';
import { RideRequest, BuggyStatus } from '../types';
import { Car, MapPin, Navigation, CheckCircle, Clock, MessageSquare, History, Plus, X, Loader2, User, Star, Zap, Calendar } from 'lucide-react';
import NotificationBell from './NotificationBell';
import ServiceChat from './ServiceChat';

const DriverPortal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [myRideId, setMyRideId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'REQUESTS' | 'HISTORY'>('REQUESTS');
    const [driverInfo, setDriverInfo] = useState<{ name: string, rating: number, location: string }>({
        name: 'Mr. Tuan',
        rating: 5,
        location: "Near Don Cipriani's Italian Restaurant"
    });

    // Loading states for better UX
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [hasUnreadChat, setHasUnreadChat] = useState(false);

    // Create Manual Ride State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [manualRideData, setManualRideData] = useState({
        roomNumber: '',
        pickup: '',
        destination: ''
    });
    const [locations, setLocations] = useState<any[]>([]);
    const [mySchedules, setMySchedules] = useState<DriverSchedule[]>([]);

    // Current time state for real-time waiting time updates
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Load driver info from localStorage
    useEffect(() => {
        const savedUser = localStorage.getItem('furama_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setDriverInfo({
                    name: user.lastName ? `Mr. ${user.lastName}` : 'Driver',
                    rating: 5, // Default rating, can be fetched from API if available
                    location: "Near Don Cipriani's Italian Restaurant" // Default location, can be updated
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

                // Load schedules for next 7 days
                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);

                const schedules = await getDriverSchedules(String(user.id));
                // Filter to next 7 days
                const upcomingSchedules = schedules.filter(s => {
                    const scheduleDate = new Date(s.date);
                    return scheduleDate >= today && scheduleDate <= nextWeek;
                });
                setMySchedules(upcomingSchedules);
            } catch (error) {
                console.error('Failed to load driver schedules:', error);
            }
        };

        loadSchedules();
        // Refresh schedules every 5 minutes
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

            // Set driver online for 10 hours on first login
            setDriverOnlineFor10Hours(user.id);
        } catch (e) {
            console.error('Failed to set driver online for 10 hours:', e);
        }
    }, []);

    // Polling for new rides and chat messages
    // Use adaptive polling to save battery (poll less frequently when idle/background)
    useAdaptivePolling(() => {
        const loadRides = async () => {
            try {
                const allRides = await getRides();
                setRides(allRides);

                // Get current driver ID
                const savedUser = localStorage.getItem('furama_user');
                let currentDriverId: string | null = null;
                if (savedUser) {
                    try {
                        const user = JSON.parse(savedUser);
                        currentDriverId = user.id || null;
                    } catch (e) {
                        console.error('Failed to parse user from localStorage:', e);
                    }
                }

                // Check if I have an active ride (match by driverId)
                const active = allRides.find(r => {
                    if (r.status !== BuggyStatus.ASSIGNED && r.status !== BuggyStatus.ARRIVING && r.status !== BuggyStatus.ON_TRIP) {
                        return false;
                    }
                    // If we have driver ID, match by it; otherwise show any active ride
                    if (currentDriverId) {
                        return r.driverId === currentDriverId || r.driverId === currentDriverId.toString();
                    }
                    return r.driverId !== undefined && r.driverId !== null;
                });

                if (active) {
                    setMyRideId(active.id);
                    // Check for unread messages from Guest for this ride
                    const lastMsg = await getLastMessage(active.roomNumber, 'BUGGY');
                    // If last message exists and was sent by 'user' (Guest), it's unread for the Driver
                    if (lastMsg && lastMsg.role === 'user') {
                        setHasUnreadChat(true);
                    }
                } else {
                    setMyRideId(null);
                    setShowChat(false);
                    setHasUnreadChat(false);
                }
            } catch (error) {
                console.error('Failed to load rides:', error);
            }
        };
        loadRides();
    }, {
        activeInterval: 5000,
        idleInterval: 30000,     // Poll every 30s if user is idle
        backgroundInterval: 60000 // Poll every 60s if app is in background
    });

    // Update current time every second for real-time waiting time display
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000); // Update every second
        return () => clearInterval(interval);
    }, []);

    const acceptRide = async (id: string) => {
        if (loadingAction) return; // Prevent double-click

        setLoadingAction(id);
        try {
            // Get current driver ID from localStorage
            const savedUser = localStorage.getItem('furama_user');
            let driverId: string | undefined = 'driver-1'; // Fallback
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    driverId = user.id || 'driver-1';
                } catch (e) {
                    console.error('Failed to parse user from localStorage:', e);
                }
            }

            // Optimistic update: immediately update UI
            setRides(prevRides => prevRides.map(ride =>
                ride.id === id
                    ? { ...ride, status: BuggyStatus.ARRIVING, driverId: driverId }
                    : ride
            ));
            setMyRideId(id);

            console.log('Accepting ride:', id, 'with driverId:', driverId);
            await updateRideStatus(id, BuggyStatus.ARRIVING, driverId, 5); // 5 min ETA mock
            console.log('Ride accepted successfully');

            // Refresh rides after update to ensure consistency
            const allRides = await getRides();
            setRides(allRides);
        } catch (error) {
            console.error('Failed to accept ride:', error);
            // Revert optimistic update on error
            const allRides = await getRides();
            setRides(allRides);
            setMyRideId(null);
            alert('Failed to accept ride. Please try again.');
        } finally {
            setLoadingAction(null);
        }
    };

    const pickUpGuest = async (id: string) => {
        if (loadingAction) return; // Prevent double-click

        setLoadingAction(`pickup-${id}`);
        try {
            // Optimistic update
            setRides(prevRides => prevRides.map(ride =>
                ride.id === id
                    ? { ...ride, status: BuggyStatus.ON_TRIP, pickedUpAt: Date.now() }
                    : ride
            ));

            console.log('Picking up guest for ride:', id);
            await updateRideStatus(id, BuggyStatus.ON_TRIP);
            console.log('Guest picked up successfully');

            // Refresh rides after update
            const allRides = await getRides();
            setRides(allRides);
        } catch (error) {
            console.error('Failed to pick up guest:', error);
            // Revert optimistic update on error
            const allRides = await getRides();
            setRides(allRides);
            alert('Failed to update ride status. Please try again.');
        } finally {
            setLoadingAction(null);
        }
    };

    const completeRide = async (id: string) => {
        if (loadingAction) return; // Prevent double-click

        setLoadingAction(`complete-${id}`);
        try {
            console.log('Completing ride:', id);
            await updateRideStatus(id, BuggyStatus.COMPLETED);
            console.log('Ride completed successfully');

            setShowChat(false);
            setMyRideId(null);

            // Refresh rides after update
            const allRides = await getRides();
            setRides(allRides);
        } catch (error) {
            console.error('Failed to complete ride:', error);
            // Revert on error
            const allRides = await getRides();
            setRides(allRides);
            alert('Failed to complete ride. Please try again.');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleCreateManualRide = async () => {
        if (!manualRideData.pickup || !manualRideData.destination) return;

        try {
            // Get current driver ID from localStorage
            const savedUser = localStorage.getItem('furama_user');
            let driverId: string = 'driver-1'; // Fallback
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    driverId = user.id || 'driver-1';
                } catch (e) {
                    console.error('Failed to parse user from localStorage:', e);
                }
            }

            console.log('Creating manual ride:', manualRideData, 'with driverId:', driverId);
            const newRide = await createManualRide(
                driverId,
                manualRideData.roomNumber,
                manualRideData.pickup,
                manualRideData.destination
            );

            console.log('Manual ride created successfully:', newRide);

            // Immediately set this as my active ride and switch view
            setMyRideId(newRide.id);
            setViewMode('ACTIVE');
            setShowCreateModal(false);
            setManualRideData({ roomNumber: '', pickup: '', destination: '' });

            // Refresh rides after create
            const allRides = await getRides();
            setRides(allRides);
        } catch (error) {
            console.error('Failed to create manual ride:', error);
            alert('Failed to create ride. Please try again.');
        }
    };

    // Smart priority sorting function for ride requests
    const calculatePriority = (ride: RideRequest): number => {
        const now = Date.now();
        const waitingTime = now - ride.timestamp; // milliseconds
        const waitingMinutes = waitingTime / (1000 * 60); // convert to minutes

        // Base priority: older requests get higher priority (lower number = higher priority)
        let priority = waitingMinutes;

        // Room type priority adjustment
        const roomNumber = ride.roomNumber.toUpperCase();
        const firstChar = roomNumber.charAt(0);

        // Villa series (D, P, S, Q) get slight priority boost (subtract 2 minutes)
        // Room series (R) are standard priority
        if (firstChar === 'D' || firstChar === 'P' || firstChar === 'S' || firstChar === 'Q') {
            priority -= 2; // Villa requests appear slightly higher
        }

        // Very old requests (> 10 minutes) get extra priority boost
        if (waitingMinutes > 10) {
            priority -= 5; // Urgent: waiting too long
        }

        // Very recent requests (< 1 minute) get slight delay
        if (waitingMinutes < 1) {
            priority += 1; // Let older requests be processed first
        }

        return priority;
    };

    const pendingRides = rides
        .filter(r => r.status === BuggyStatus.SEARCHING)
        .sort((a, b) => {
            // Sort by priority (lower number = higher priority)
            const priorityA = calculatePriority(a);
            const priorityB = calculatePriority(b);
            return priorityA - priorityB;
        });

    // All active rides (not completed) - for the All Trips view
    const allActiveRides = rides
        .filter(r => r.status !== BuggyStatus.COMPLETED && r.status !== BuggyStatus.CANCELLED)
        .sort((a, b) => {
            // Sort: SEARCHING first (unassigned), then by timestamp
            const statusPriority: Record<string, number> = {
                [BuggyStatus.SEARCHING]: 0,
                [BuggyStatus.ASSIGNED]: 1,
                [BuggyStatus.ARRIVING]: 2,
                [BuggyStatus.ON_TRIP]: 3,
            };
            const priorityDiff = (statusPriority[a.status] ?? 4) - (statusPriority[b.status] ?? 4);
            if (priorityDiff !== 0) return priorityDiff;
            return a.timestamp - b.timestamp; // Older first within same status
        });

    // Get current driver ID from localStorage
    // For notifications, we use roomNumber (which acts as username/ID for staff/driver)
    const getCurrentDriverId = (): string | null => {
        try {
            const savedUser = localStorage.getItem('furama_user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                // Use roomNumber for notifications (as it's used as recipientId)
                // Fallback to id if roomNumber is not available
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
                // For matching rides, use the actual user ID (not roomNumber)
                // driverId in rides is the actual user ID from database
                return user.id ? user.id.toString() : null;
            }
        } catch (error) {
            console.error('Failed to get driver actual ID from localStorage:', error);
        }
        return null;
    };

    const currentDriverId = getCurrentDriverId(); // For notifications
    const currentDriverActualId = getCurrentDriverActualId(); // For matching rides

    // Filter history for this driver - show all completed rides that have a driverId set
    // Match by actual driver ID (user.id), not roomNumber
    const historyRides = rides.filter(r => {
        if (r.status !== BuggyStatus.COMPLETED) return false;
        if (currentDriverActualId) {
            // Match by actual driver ID (as string)
            // driverId in rides is stored as string from database driver_id
            return r.driverId === currentDriverActualId || r.driverId === currentDriverActualId.toString();
        }
        // If no driver ID in localStorage, show all completed rides with any driverId
        return r.driverId !== undefined && r.driverId !== null;
    }).sort((a, b) => b.timestamp - a.timestamp);

    const myCurrentRide = rides.find(r => r.id === myRideId);

    const formatTime = (ts?: number) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

    // Calculate waiting time in minutes
    const getWaitingTime = (timestamp: number): number => {
        const waitingMs = currentTime - timestamp;
        return Math.floor(waitingMs / (1000 * 60)); // minutes
    };

    // Format waiting time for display
    const formatWaitingTime = (timestamp: number): string => {
        const minutes = getWaitingTime(timestamp);
        if (minutes < 1) return '<1m';
        return `${minutes}m`;
    };

    // Get waiting time color based on duration
    const getWaitingTimeColor = (timestamp: number): string => {
        const minutes = getWaitingTime(timestamp);
        if (minutes >= 10) {
            return 'text-red-600 font-bold'; // > 10 minutes - red
        } else if (minutes >= 5) {
            return 'text-orange-600 font-semibold'; // 5-10 minutes - orange
        } else {
            return 'text-gray-600'; // < 5 minutes - gray
        }
    };

    // Get priority badge info
    const getPriorityInfo = (ride: RideRequest) => {
        const waitingMinutes = getWaitingTime(ride.timestamp);
        const roomNumber = ride.roomNumber.toUpperCase();
        const firstChar = roomNumber.charAt(0);
        const isVilla = ['D', 'P', 'S', 'Q'].includes(firstChar);

        if (waitingMinutes > 10) {
            return { label: 'URGENT', color: 'bg-red-500', textColor: 'text-white' };
        } else if (waitingMinutes > 5) {
            return { label: 'HIGH', color: 'bg-orange-500', textColor: 'text-white' };
        } else if (isVilla) {
            return { label: 'VILLA', color: 'bg-purple-500/20', textColor: 'text-purple-300', border: 'border-purple-500/50' };
        } else {
            return { label: 'NEW', color: 'bg-emerald-500', textColor: 'text-white' };
        }
    };

    const formatDateTime = (ts?: number) => {
        if (!ts || isNaN(ts) || ts <= 0) return '-';
        try {
            const date = new Date(ts);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleString([], {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '-';
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col relative">
            {/* Header - New Design */}
            <header className="bg-white border-b border-gray-200 p-3 flex items-center justify-between z-50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {driverInfo.name.split(' ').map(n => n[0]).join('')}
                    </div>

                    {/* Driver Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-base text-gray-900 truncate">{driverInfo.name}</h1>
                            <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">
                                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-bold text-yellow-700">{driverInfo.rating}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                            <p className="text-xs text-gray-600 truncate">{driverInfo.location}</p>
                        </div>
                        {/* Today's Schedule */}
                        {(() => {
                            const today = new Date().toISOString().split('T')[0];
                            const todaySchedule = mySchedules.find(s => s.date === today);
                            if (todaySchedule) {
                                return (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Calendar size={12} className="text-emerald-500 flex-shrink-0" />
                                        <p className="text-xs text-emerald-600 font-semibold">
                                            {todaySchedule.is_day_off ? 'Day Off' :
                                                `${todaySchedule.shift_start?.substring(0, 5)} - ${todaySchedule.shift_end?.substring(0, 5)}`}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>

                {/* Right Icons */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {/* Notification Bell */}
                    {currentDriverId && (
                        <NotificationBell userId={currentDriverId} variant="light" />
                    )}
                    <button
                        onClick={onLogout}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-all text-gray-500"
                        title="Logout"
                    >
                        <X size={18} />
                    </button>
                </div>
            </header>

            {/* Tab Navigation - New Design */}
            <div className="bg-white border-b border-gray-200 px-3">
                <div className="flex space-x-1">
                    <button
                        onClick={() => setViewMode('REQUESTS')}
                        className={`py-3 px-4 font-bold text-sm transition-all duration-300 border-b-2 ${viewMode === 'REQUESTS'
                            ? 'text-emerald-600 border-emerald-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                    >
                        REQUESTS ({pendingRides.length + (myCurrentRide ? 1 : 0)})
                    </button>
                    <button
                        onClick={() => setViewMode('HISTORY')}
                        className={`py-3 px-4 font-bold text-sm transition-all duration-300 border-b-2 ${viewMode === 'HISTORY'
                            ? 'text-emerald-600 border-emerald-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                    >
                        HISTORY ({historyRides.length})
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50">
                {/* CURRENT JOB Banner - When driver has active ride */}
                {myCurrentRide && viewMode === 'REQUESTS' && (
                    <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-sm">CURRENT JOB</span>
                            {/* Waiting Time Display */}
                            <div className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded ${getWaitingTime(myCurrentRide.timestamp) >= 10
                                ? 'bg-red-500/30 text-red-100'
                                : getWaitingTime(myCurrentRide.timestamp) >= 5
                                    ? 'bg-orange-500/30 text-orange-100'
                                    : 'bg-white/20 text-white/90'
                                }`}>
                                <Clock className="w-3 h-3" />
                                <span className="font-semibold">{formatWaitingTime(myCurrentRide.timestamp)}</span>
                            </div>
                        </div>
                        <span className="bg-emerald-600 px-2.5 py-1 rounded text-xs font-bold">
                            {myCurrentRide.status === BuggyStatus.ON_TRIP ? 'ON_TRIP' :
                                myCurrentRide.status === BuggyStatus.ARRIVING ? 'ARRIVING' : 'ASSIGNED'}
                        </span>
                    </div>
                )}

                {/* REQUESTS VIEW */}
                {viewMode === 'REQUESTS' && (
                    <>
                        {/* Current Job Card - New Design */}
                        {myCurrentRide ? (
                            <div className="bg-emerald-50 p-4 border-b border-emerald-200">
                                <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center min-w-[60px]">
                                        <div className="text-2xl font-black text-gray-900">#{myCurrentRide.roomNumber}</div>
                                        <div className="text-xs text-gray-500 mt-1">{formatTime(myCurrentRide.timestamp)}</div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-900 mb-2">{myCurrentRide.guestName}</div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                                <span>{myCurrentRide.pickup}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm text-emerald-700 font-semibold">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                <span>{myCurrentRide.destination}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <button
                                            onClick={() => {
                                                setShowChat(true);
                                                setHasUnreadChat(false);
                                            }}
                                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all"
                                        >
                                            <MessageSquare size={18} className="text-gray-600" />
                                        </button>
                                        {(myCurrentRide.status === BuggyStatus.ARRIVING || myCurrentRide.status === BuggyStatus.ASSIGNED) ? (
                                            <button
                                                onClick={() => pickUpGuest(myCurrentRide.id)}
                                                disabled={loadingAction === `pickup-${myCurrentRide.id}`}
                                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loadingAction === `pickup-${myCurrentRide.id}` ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    'Pick Up Guest'
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => completeRide(myCurrentRide.id)}
                                                disabled={loadingAction === `complete-${myCurrentRide.id}`}
                                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loadingAction === `complete-${myCurrentRide.id}` ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    'Complete'
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Requests List */
                            <div className="p-3 space-y-2">
                                {pendingRides.length === 0 ? (
                                    <div className="text-center py-20">
                                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Zap size={32} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-600 font-semibold">Waiting for requests...</p>
                                    </div>
                                ) : (
                                    pendingRides.map((ride) => (
                                        <div key={ride.id} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-emerald-300 transition-all">
                                            <div className="flex items-start gap-3">
                                                <div className="flex flex-col items-center min-w-[60px]">
                                                    <div className="text-xl font-black text-gray-900">#{ride.roomNumber}</div>
                                                    <div className="text-xs text-gray-500 mt-1">{formatTime(ride.timestamp)}</div>
                                                    {/* Waiting Time Display */}
                                                    <div className={`text-xs mt-1.5 flex items-center gap-1 ${getWaitingTimeColor(ride.timestamp)}`}>
                                                        <Clock className="w-3 h-3" />
                                                        <span>{formatWaitingTime(ride.timestamp)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-gray-900 mb-1.5">{ride.guestName}</div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                                            <span>{ride.pickup}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-sm text-emerald-700 font-semibold">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                            <span>{ride.destination}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => acceptRide(ride.id)}
                                                    disabled={loadingAction === ride.id || loadingAction !== null}
                                                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loadingAction === ride.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        'Accept'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}

                                {/* Upcoming Schedule Section */}
                                {mySchedules.length > 0 && (
                                    <div className="mt-6 bg-white p-4 rounded-lg border border-emerald-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Calendar size={18} className="text-emerald-600" />
                                            <h3 className="font-bold text-sm text-gray-800">Upcoming Schedule</h3>
                                        </div>
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                            {mySchedules.slice(0, 7).map(schedule => {
                                                const scheduleDate = new Date(schedule.date);
                                                const isToday = scheduleDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                                                return (
                                                    <div key={schedule.id} className={`flex items-center justify-between p-2 rounded-lg ${isToday ? 'bg-emerald-50 border border-emerald-300' : 'bg-gray-50'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-gray-600 min-w-[80px]">
                                                                {scheduleDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </span>
                                                            {schedule.is_day_off ? (
                                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">Day Off</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                                                                    {schedule.shift_start?.substring(0, 5)} - {schedule.shift_end?.substring(0, 5)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isToday && (
                                                            <span className="text-xs font-bold text-emerald-600">Today</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* HISTORY VIEW - Detailed Design */}
                {viewMode === 'HISTORY' && (
                    <div className="p-2">
                        {historyRides.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <History size={32} className="text-gray-400" />
                                </div>
                                <p className="text-gray-600 font-semibold">No completed trips history.</p>
                            </div>
                        ) : (
                            <div className="space-y-0 divide-y divide-gray-200">
                                {historyRides.map(ride => (
                                    <div key={ride.id} className="py-2.5 px-2 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start gap-2.5">
                                            <div className="flex flex-col items-center min-w-[50px]">
                                                <div className="text-lg font-black text-gray-900">#{ride.roomNumber}</div>
                                                <div className="text-[10px] text-gray-500 mt-0.5 font-medium">{formatTime(ride.timestamp)}</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm text-gray-900 mb-1">{ride.guestName}</div>
                                                <div className="space-y-0.5 mb-1.5">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></div>
                                                        <span className="truncate">{ride.pickup}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                                                        <div className="w-1 h-1 bg-emerald-500 rounded-full flex-shrink-0"></div>
                                                        <span className="truncate">{ride.destination}</span>
                                                    </div>
                                                </div>
                                                {/* Additional details */}
                                                <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1.5">
                                                    {ride.pickedUpAt && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={10} />
                                                            Pick: {formatTime(ride.pickedUpAt)}
                                                        </span>
                                                    )}
                                                    {ride.completedAt && (
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle size={10} />
                                                            Drop: {formatTime(ride.completedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {ride.rating ? (
                                                    <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">
                                                        <span className="text-xs font-bold text-yellow-700">{ride.rating}</span>
                                                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                                    </div>
                                                ) : (
                                                    <Star size={14} className="text-gray-300" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Manual Ride Button - Modern FAB */}
            {!myCurrentRide && viewMode === 'REQUESTS' && (
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="fixed bottom-20 md:bottom-4 right-4 md:right-4 w-16 h-16 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-2xl flex items-center justify-center text-white z-40 border-2 border-emerald-400/30 hover:shadow-emerald-500/50 transition-all"
                    style={{
                        bottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))',
                        boxShadow: '0 10px 30px -5px rgba(16, 185, 129, 0.4)'
                    }}
                    title="Create Ride"
                >
                    <Plus size={28} className="md:w-7 md:h-7" strokeWidth={3} />
                </button>
            )}

            {/* Create Ride Modal - Modern Design */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in" onClick={() => setShowCreateModal(false)}>
                    <div className="backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl w-full max-w-sm border-2 border-gray-200/60 max-h-[90vh] overflow-y-auto"
                        style={{
                            boxShadow: '0 25px 70px -20px rgba(0,0,0,0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-5 border-b-2 border-gray-200/60 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                            <h3 className="font-bold text-lg md:text-xl text-gray-900">Create New Ride</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-all min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px] flex items-center justify-center"
                            >
                                <X size={20} className="md:w-5 md:h-5" strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="p-5 md:p-6 space-y-4">
                            <div>
                                <label className="block text-xs md:text-sm uppercase text-gray-600 font-bold mb-2">Room Number (Optional)</label>
                                <input
                                    type="text"
                                    value={manualRideData.roomNumber}
                                    onChange={(e) => setManualRideData({ ...manualRideData, roomNumber: e.target.value })}
                                    placeholder="e.g. 101"
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3.5 md:p-3 text-gray-900 text-sm md:text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[44px] transition-all caret-emerald-600"
                                    style={{ caretColor: '#10b981' }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs md:text-sm uppercase text-gray-600 font-bold mb-2">Pickup Location</label>
                                <select
                                    value={manualRideData.pickup}
                                    onChange={(e) => setManualRideData({ ...manualRideData, pickup: e.target.value })}
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3.5 md:p-3 text-gray-900 text-sm md:text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[44px] transition-all"
                                >
                                    <option value="">Select Pickup...</option>
                                    <option value="Current Location">Current Location</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs md:text-sm uppercase text-gray-600 font-bold mb-2">Destination</label>
                                <select
                                    value={manualRideData.destination}
                                    onChange={(e) => setManualRideData({ ...manualRideData, destination: e.target.value })}
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3.5 md:p-3 text-gray-900 text-sm md:text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[44px] transition-all"
                                >
                                    <option value="">Select Destination...</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleCreateManualRide}
                                disabled={!manualRideData.pickup || !manualRideData.destination}
                                className="group relative w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3.5 md:py-2 rounded-2xl disabled:opacity-50 mt-4 text-sm md:text-xs min-h-[52px] md:min-h-[40px] shadow-xl overflow-hidden transition-all"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                <span className="relative z-10">Start Trip</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Widget for Driver */}
            {myCurrentRide && showChat && (
                <ServiceChat
                    serviceType="BUGGY"
                    roomNumber={myCurrentRide.roomNumber}
                    label={`Guest Room ${myCurrentRide.roomNumber}`}
                    autoOpen={true}
                    userRole="staff"
                    onClose={() => setShowChat(false)}
                />
            )}
        </div>
    );
};

export default DriverPortal;
