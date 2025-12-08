
import React, { useState, useEffect } from 'react';
import { getRides, updateRideStatus, getLastMessage, createManualRide, getLocations } from '../services/dataService';
import { RideRequest, BuggyStatus } from '../types';
import { Car, MapPin, Navigation, CheckCircle, Clock, MessageSquare, History, List, Plus, X } from 'lucide-react';
import NotificationBell from './NotificationBell';
import ServiceChat from './ServiceChat';

const DriverPortal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [myRideId, setMyRideId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
    
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

    // Polling for new rides and chat messages
    useEffect(() => {
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

        // Initial load
        loadRides();

        const interval = setInterval(loadRides, 2000); // Poll every 2 seconds
        return () => clearInterval(interval);
    }, []);

    const acceptRide = async (id: string) => {
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
            
            console.log('Accepting ride:', id, 'with driverId:', driverId);
            await updateRideStatus(id, BuggyStatus.ARRIVING, driverId, 5); // 5 min ETA mock
            console.log('Ride accepted successfully');
            // Refresh rides after update
            const allRides = await getRides();
            setRides(allRides);
        } catch (error) {
            console.error('Failed to accept ride:', error);
            alert('Failed to accept ride. Please try again.');
        }
    };

    const pickUpGuest = async (id: string) => {
        try {
            console.log('Picking up guest for ride:', id);
            await updateRideStatus(id, BuggyStatus.ON_TRIP);
            console.log('Guest picked up successfully');
            // Refresh rides after update
            const allRides = await getRides();
            setRides(allRides);
        } catch (error) {
            console.error('Failed to pick up guest:', error);
            alert('Failed to update ride status. Please try again.');
        }
    };

    const completeRide = async (id: string) => {
        try {
            console.log('Completing ride:', id);
            await updateRideStatus(id, BuggyStatus.COMPLETED);
            console.log('Ride completed successfully');
            setShowChat(false);
            // Refresh rides after update
            const allRides = await getRides();
            setRides(allRides);
        } catch (error) {
            console.error('Failed to complete ride:', error);
            alert('Failed to complete ride. Please try again.');
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
    
    // Get current driver ID from localStorage
    const getCurrentDriverId = (): string | null => {
        try {
            const savedUser = localStorage.getItem('furama_user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                return user.id || null;
            }
        } catch (error) {
            console.error('Failed to get driver ID from localStorage:', error);
        }
        return null;
    };
    
    const currentDriverId = getCurrentDriverId();
    
    // Filter history for this driver - show all completed rides that have a driverId set
    // If we have currentDriverId, filter by it; otherwise show all completed rides with any driverId
    const historyRides = rides.filter(r => {
        if (r.status !== BuggyStatus.COMPLETED) return false;
        if (currentDriverId) {
            // Match by current driver ID (as string)
            return r.driverId === currentDriverId || r.driverId === currentDriverId.toString();
        }
        // If no driver ID in localStorage, show all completed rides with any driverId
        return r.driverId !== undefined && r.driverId !== null;
    }).sort((a,b) => b.timestamp - a.timestamp);
    
    const myCurrentRide = rides.find(r => r.id === myRideId);

    const formatTime = (ts?: number) => ts ? new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-';
    
    // Calculate waiting time in minutes
    const getWaitingTime = (timestamp: number): number => {
        const now = Date.now();
        const waitingMs = now - timestamp;
        return Math.floor(waitingMs / (1000 * 60)); // minutes
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
        <div className="min-h-screen bg-slate-900 text-white flex flex-col relative">
            <header className="fixed md:relative top-0 left-0 right-0 p-3 md:p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700 z-50 md:z-auto">
                <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold flex-shrink-0">
                        <Car size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-bold text-base md:text-lg truncate">Driver App</h1>
                        <p className="text-[10px] md:text-xs text-emerald-400 flex items-center"><span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full mr-1 animate-pulse"></span> Online</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                     <NotificationBell userId="driver" />
                     <button onClick={onLogout} className="text-slate-400 text-sm md:text-base px-2 md:px-0">Logout</button>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="fixed md:relative top-[60px] md:top-0 left-0 right-0 flex p-2 md:p-2 bg-slate-800 space-x-2 border-b border-slate-700 z-40 md:z-auto">
                <button 
                    onClick={() => setViewMode('ACTIVE')}
                    className={`flex-1 py-2.5 md:py-3 rounded-lg font-bold flex items-center justify-center transition text-sm md:text-base ${viewMode === 'ACTIVE' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-700/50'}`}
                >
                    <List size={16} className="md:w-[18px] md:h-[18px] mr-1.5 md:mr-2"/> Active
                </button>
                <button 
                    onClick={() => setViewMode('HISTORY')}
                    className={`flex-1 py-2.5 md:py-3 rounded-lg font-bold flex items-center justify-center transition text-sm md:text-base ${viewMode === 'HISTORY' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-700/50'}`}
                >
                    <History size={16} className="md:w-[18px] md:h-[18px] mr-1.5 md:mr-2"/> History
                </button>
            </div>

            <div className="flex-1 p-3 md:p-3 overflow-y-auto pb-24 md:pb-16 pt-[130px] md:pt-0" style={{ paddingBottom: 'max(6rem, calc(6rem + env(safe-area-inset-bottom)))' }}>
                {viewMode === 'ACTIVE' ? (
                    <>
                        {myCurrentRide ? (
                            <div className="bg-emerald-600 rounded-xl p-4 md:p-4 shadow-lg">
                                <div className="flex justify-between items-start mb-3 md:mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl md:text-lg font-bold mb-1">{myCurrentRide.status === BuggyStatus.ON_TRIP ? 'On Trip' : 'Pick Up Guest'}</h2>
                                        <p className="opacity-80 text-sm md:text-xs">Ride #{myCurrentRide.id.slice(-4)}</p>
                                    </div>
                                    <div className="bg-white/20 p-1.5 md:p-1.5 rounded-lg flex-shrink-0 ml-2">
                                        <Clock size={18} className="md:w-4 md:h-4 text-white" />
                                    </div>
                                </div>

                                <div className="space-y-3 md:space-y-2 mb-4 md:mb-4">
                                     <div className="bg-black/20 p-3 md:p-2 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-2">
                                        <div className="flex-1 min-w-0">
                                            <label className="text-[10px] md:text-[9px] uppercase opacity-60 font-bold tracking-wider block">Guest</label>
                                            <div className="text-base md:text-sm font-semibold truncate">{myCurrentRide.guestName}</div>
                                            <div className="text-xs md:text-[10px] opacity-80">Room {myCurrentRide.roomNumber}</div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setShowChat(true);
                                                setHasUnreadChat(false);
                                            }}
                                            className={`relative px-4 py-2.5 md:px-3 md:py-1.5 rounded-lg font-bold flex items-center justify-center shadow-md text-sm md:text-xs w-full sm:w-auto min-h-[44px] md:min-h-[36px] ${
                                                hasUnreadChat 
                                                ? 'bg-white text-red-600 animate-pulse' 
                                                : 'bg-emerald-800 text-emerald-100'
                                            }`}
                                        >
                                            <MessageSquare size={16} className="md:w-3 md:h-3 mr-2"/>
                                            Chat
                                            {hasUnreadChat && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>}
                                        </button>
                                     </div>

                                     <div className="flex flex-col sm:flex-row gap-3 md:gap-2">
                                        <div className="flex-1 bg-black/20 p-3 md:p-2 rounded-lg min-w-0">
                                            <label className="text-[10px] md:text-[9px] uppercase opacity-60 font-bold tracking-wider mb-1 block">From</label>
                                            <div className="font-medium flex items-center text-sm md:text-xs truncate"><MapPin size={12} className="md:w-3 md:h-3 mr-1 flex-shrink-0"/> <span className="truncate">{myCurrentRide.pickup}</span></div>
                                        </div>
                                        <div className="flex-1 bg-white text-emerald-900 p-3 md:p-2 rounded-lg shadow-lg min-w-0">
                                            <label className="text-[10px] md:text-[9px] uppercase opacity-60 font-bold tracking-wider mb-1 block">To</label>
                                            <div className="font-bold flex items-center text-sm md:text-xs truncate"><Navigation size={12} className="md:w-3 md:h-3 mr-1 flex-shrink-0"/> <span className="truncate">{myCurrentRide.destination}</span></div>
                                        </div>
                                     </div>
                                     
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] md:text-[9px] opacity-70">
                                         <div>Request: {formatTime(myCurrentRide.timestamp)}</div>
                                         {myCurrentRide.pickedUpAt && <div>Pickup: {formatTime(myCurrentRide.pickedUpAt)}</div>}
                                     </div>
                                </div>

                                {myCurrentRide.status === BuggyStatus.ARRIVING || myCurrentRide.status === BuggyStatus.ASSIGNED ? (
                                    <button 
                                        onClick={() => pickUpGuest(myCurrentRide.id)}
                                        className="w-full bg-white text-emerald-900 font-bold py-3.5 md:py-2.5 rounded-xl text-lg md:text-sm shadow-lg min-h-[52px] md:min-h-[40px]"
                                    >
                                        Guest Picked Up
                                    </button>
                                ) : (
                                     <button 
                                        onClick={() => completeRide(myCurrentRide.id)}
                                        className="w-full bg-emerald-900 text-white border border-emerald-400 font-bold py-3.5 md:py-2.5 rounded-xl text-lg md:text-sm shadow-lg min-h-[52px] md:min-h-[40px] flex items-center justify-center"
                                    >
                                        <CheckCircle size={20} className="md:w-4 md:h-4 inline mr-2" /> Complete Trip
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <h2 className="text-slate-300 font-bold mb-4 md:mb-3 uppercase tracking-wider text-base md:text-sm">Available Requests ({pendingRides.length})</h2>
                                <div className="space-y-4 md:space-y-3">
                                    {pendingRides.length === 0 ? (
                                        <div className="text-center py-10 opacity-50">
                                            <p className="text-base md:text-lg">No active requests.</p>
                                        </div>
                                    ) : (
                                        pendingRides.map((ride, index) => {
                                            const priorityInfo = getPriorityInfo(ride);
                                            const waitingMinutes = getWaitingTime(ride.timestamp);
                                            const isTopPriority = index === 0;
                                            
                                            return (
                                            <div key={ride.id} className={`bg-slate-800 p-4 md:p-3 rounded-xl border-2 shadow-md ${
                                                isTopPriority ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-700'
                                            }`}>
                                                {/* Header with Room and Time */}
                                                <div className="flex justify-between items-center mb-3 md:mb-2 gap-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`${priorityInfo.color} ${priorityInfo.textColor} text-xs md:text-[10px] font-bold px-3 md:px-2 py-1 md:py-0.5 rounded-full ${
                                                            priorityInfo.label === 'URGENT' || priorityInfo.label === 'HIGH' ? 'animate-pulse' : ''
                                                        } ${priorityInfo.border ? `border ${priorityInfo.border}` : ''}`}>
                                                            {priorityInfo.label}
                                                        </span>
                                                        {isTopPriority && (
                                                            <span className="bg-yellow-500 text-black text-[10px] md:text-[9px] font-bold px-2 md:px-1.5 py-0.5 rounded">#1 PRIORITY</span>
                                                        )}
                                                        <h3 className="font-bold text-lg md:text-sm text-white">Room {ride.roomNumber}</h3>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <div className="text-xs md:text-[10px] text-slate-400 whitespace-nowrap">{formatTime(ride.timestamp)}</div>
                                                        <div className="text-[10px] md:text-[9px] text-slate-500 whitespace-nowrap">
                                                            {waitingMinutes > 0 ? `Waiting: ${waitingMinutes}m` : 'Just now'}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Guest Name - Smaller */}
                                                <div className="mb-3 md:mb-2">
                                                    <p className="text-slate-400 text-sm md:text-xs">{ride.guestName}</p>
                                                </div>
                                                
                                                {/* Large PU and DO Display - Driver-Friendly */}
                                                <div className="space-y-3 md:space-y-2 mb-4 md:mb-3">
                                                    {/* PU - Pick Up */}
                                                    <div className="bg-gradient-to-r from-blue-600/30 to-blue-500/20 border-2 border-blue-500/50 p-4 md:p-2.5 rounded-xl">
                                                        <div className="flex items-center gap-3 md:gap-2 mb-2">
                                                            <div className="bg-blue-500 text-white font-bold text-lg md:text-sm px-4 md:px-3 py-2 md:py-1.5 rounded-lg min-w-[60px] md:min-w-[50px] text-center">
                                                                PU
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-blue-300 text-xs md:text-[10px] font-semibold uppercase tracking-wider mb-1">Pick Up</div>
                                                                <div className="text-white text-lg md:text-sm font-bold break-words">{ride.pickup}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* DO - Drop Off */}
                                                    <div className="bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 border-2 border-emerald-500/50 p-4 md:p-2.5 rounded-xl">
                                                        <div className="flex items-center gap-3 md:gap-2 mb-2">
                                                            <div className="bg-emerald-500 text-white font-bold text-lg md:text-sm px-4 md:px-3 py-2 md:py-1.5 rounded-lg min-w-[60px] md:min-w-[50px] text-center">
                                                                DO
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-emerald-300 text-xs md:text-[10px] font-semibold uppercase tracking-wider mb-1">Drop Off</div>
                                                                <div className="text-white text-lg md:text-sm font-bold break-words">{ride.destination}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Accept Button - Large and Prominent */}
                                                <button 
                                                    onClick={() => acceptRide(ride.id)}
                                                    className={`w-full text-white font-bold py-4 md:py-2.5 rounded-xl text-base md:text-sm shadow-lg min-h-[56px] md:min-h-[40px] ${
                                                        isTopPriority 
                                                            ? 'bg-emerald-500 ring-2 ring-emerald-400' 
                                                            : 'bg-emerald-600'
                                                    }`}
                                                >
                                                    {isTopPriority ? '✓ Accept Priority Ride' : 'Accept Ride'}
                                                </button>
                                            </div>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    /* HISTORY VIEW */
                    <div className="space-y-4 md:space-y-3">
                        <h2 className="text-slate-300 font-bold mb-4 md:mb-3 uppercase tracking-wider text-base md:text-sm">Completed Trips</h2>
                         {historyRides.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <History size={40} className="md:w-10 md:h-10 mx-auto mb-2 opacity-50"/>
                                <p className="text-base md:text-sm">No completed trips history.</p>
                            </div>
                        ) : (
                            historyRides.map(ride => (
                                <div key={ride.id} className="bg-slate-800 p-4 md:p-3 rounded-xl border-2 border-slate-700 shadow-md">
                                    {/* Header with Room and Status */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-2 gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg md:text-sm text-white mb-1">Room {ride.roomNumber}</h3>
                                            <p className="text-slate-400 text-sm md:text-xs">{ride.guestName}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className="bg-green-600/30 text-green-400 border border-green-500/50 text-xs md:text-[10px] font-bold px-3 md:px-2 py-1.5 md:py-1 rounded-lg">COMPLETED</span>
                                        </div>
                                    </div>
                                    
                                    {/* Large PU and DO Display - Driver-Friendly */}
                                    <div className="space-y-3 md:space-y-2 mb-3 md:mb-2">
                                        {/* PU - Pick Up */}
                                        <div className="bg-gradient-to-r from-blue-600/30 to-blue-500/20 border-2 border-blue-500/50 p-4 md:p-2.5 rounded-xl">
                                            <div className="flex items-center gap-3 md:gap-2 mb-2">
                                                <div className="bg-blue-500 text-white font-bold text-lg md:text-sm px-4 md:px-3 py-2 md:py-1.5 rounded-lg min-w-[60px] md:min-w-[50px] text-center">
                                                    PU
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-blue-300 text-xs md:text-[10px] font-semibold uppercase tracking-wider mb-1">Pick Up</div>
                                                    <div className="text-white text-lg md:text-sm font-bold break-words">{ride.pickup}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* DO - Drop Off */}
                                        <div className="bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 border-2 border-emerald-500/50 p-4 md:p-2.5 rounded-xl">
                                            <div className="flex items-center gap-3 md:gap-2 mb-2">
                                                <div className="bg-emerald-500 text-white font-bold text-lg md:text-sm px-4 md:px-3 py-2 md:py-1.5 rounded-lg min-w-[60px] md:min-w-[50px] text-center">
                                                    DO
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-emerald-300 text-xs md:text-[10px] font-semibold uppercase tracking-wider mb-1">Drop Off</div>
                                                    <div className="text-white text-lg md:text-sm font-bold break-words">{ride.destination}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Info */}
                                    <div className="bg-black/30 rounded-lg p-3 md:p-2 text-xs md:text-[10px] text-slate-300 flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 md:gap-2 mb-3 md:mb-2">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="md:w-3 md:h-3 text-slate-400 flex-shrink-0"/>
                                            <span><span className="text-slate-400">Req:</span> {formatDateTime(ride.timestamp)}</span>
                                        </div>
                                        {ride.pickedUpAt && (
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="md:w-3 md:h-3 text-blue-400 flex-shrink-0"/>
                                                <span><span className="text-slate-400">Pick:</span> {formatDateTime(ride.pickedUpAt)}</span>
                                            </div>
                                        )}
                                        {ride.completedAt && (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle size={14} className="md:w-3 md:h-3 text-emerald-400 flex-shrink-0"/>
                                                <span className="text-emerald-400"><span className="text-slate-400">Drop:</span> {formatDateTime(ride.completedAt)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Rating */}
                                    {ride.rating && (
                                        <div className="mt-3 md:mt-2 pt-3 md:pt-2 border-t border-slate-700">
                                            <div className="flex items-center gap-2 text-yellow-400 text-sm md:text-xs">
                                                <span className="font-bold">Rating: {ride.rating}/5</span>
                                                {ride.feedback && (
                                                    <span className="text-slate-300 text-xs md:text-[10px]">- "{ride.feedback}"</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Create Manual Ride Button */}
            {!myCurrentRide && viewMode === 'ACTIVE' && (
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="fixed bottom-20 md:bottom-4 right-4 md:right-4 w-14 h-14 md:w-12 md:h-12 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center text-slate-900 z-40"
                    style={{ 
                        bottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))'
                    }}
                    title="Create Ride"
                >
                    <Plus size={28} className="md:w-6 md:h-6" />
                </button>
            )}

            {/* Create Ride Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-slate-800 rounded-xl md:rounded-xl shadow-2xl w-full max-w-sm border border-slate-600 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
                            <h3 className="font-bold text-base md:text-lg">Create New Ride</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 p-1 min-w-[44px] min-h-[44px] md:min-w-[32px] md:min-h-[32px] flex items-center justify-center">
                                <X size={20} className="md:w-5 md:h-5" />
                            </button>
                        </div>
                        <div className="p-4 md:p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] md:text-xs uppercase text-slate-400 font-bold mb-1.5 md:mb-1">Room Number (Optional)</label>
                                <input 
                                    type="text" 
                                    value={manualRideData.roomNumber}
                                    onChange={(e) => setManualRideData({...manualRideData, roomNumber: e.target.value})}
                                    placeholder="e.g. 101"
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 md:p-3 text-white text-sm md:text-base focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs uppercase text-slate-400 font-bold mb-1.5 md:mb-1">Pickup Location</label>
                                <select
                                    value={manualRideData.pickup}
                                    onChange={(e) => setManualRideData({...manualRideData, pickup: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 md:p-3 text-white text-sm md:text-base focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
                                >
                                    <option value="">Select Pickup...</option>
                                    <option value="Current Location">Current Location</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs uppercase text-slate-400 font-bold mb-1.5 md:mb-1">Destination</label>
                                <select
                                    value={manualRideData.destination}
                                    onChange={(e) => setManualRideData({...manualRideData, destination: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 md:p-3 text-white text-sm md:text-base focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
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
                                className="w-full bg-emerald-600 text-white font-bold py-3.5 md:py-2 rounded-lg disabled:opacity-50 mt-4 text-sm md:text-xs min-h-[52px] md:min-h-[40px]"
                            >
                                Start Trip
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
