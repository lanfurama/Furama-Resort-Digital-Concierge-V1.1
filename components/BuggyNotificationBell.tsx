import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Car, Clock, CheckCircle } from 'lucide-react';
import { RideRequest, BuggyStatus, User } from '../types';

interface BuggyNotificationBellProps {
    rides: RideRequest[];
    users: User[];
    onNavigate?: () => void; // Callback when clicking on notification item
    soundEnabled: boolean;
    onSoundToggle: (enabled: boolean) => void;
    localStorageKey?: string; // For saving sound preference
    showCompleted?: boolean; // Show completed rides (for Admin)
    showAssigned?: boolean; // Show assigned rides (for Admin)
    showActive?: boolean; // Show active rides (for Admin)
}

const BuggyNotificationBell: React.FC<BuggyNotificationBellProps> = ({
    rides,
    users,
    onNavigate,
    soundEnabled,
    onSoundToggle,
    localStorageKey = 'buggy_notification_sound_enabled',
    showCompleted = false,
    showAssigned = false,
    showActive = false
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'warning'} | null>(null);
    const prevRidesRef = useRef<RideRequest[]>([]);
    const notificationBellRef = useRef<HTMLDivElement>(null);

    // Helper: Play notification sound
    const playNotificationSound = useCallback(() => {
        if (!soundEnabled) return;
        
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            const duration = 0.6;
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.2);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
            console.error('Failed to play notification sound:', error);
        }
    }, [soundEnabled]);

    // Track changes in rides and show notifications
    useEffect(() => {
        const prevRides = prevRidesRef.current;
        
        if (prevRides.length > 0) {
            // Find new requests (SEARCHING)
            const newRequests = rides.filter(newRide => 
                newRide.status === BuggyStatus.SEARCHING &&
                !prevRides.some(prevRide => prevRide.id === newRide.id)
            );
            
            // Find status changes
            rides.forEach(newRide => {
                const prevRide = prevRides.find(pr => pr.id === newRide.id);
                if (!prevRide) return;
                
                // Driver accepted booking (SEARCHING -> ASSIGNED)
                if (prevRide.status === BuggyStatus.SEARCHING && newRide.status === BuggyStatus.ASSIGNED) {
                    const driver = users.find(u => u.id === newRide.driverId);
                    const driverName = driver ? driver.lastName : 'Driver';
                    const guestName = newRide.guestName || `Guest ${newRide.roomNumber}`;
                    setNotification({
                        message: `✅ Driver ${driverName} accepted booking for ${guestName}`,
                        type: 'success'
                    });
                    playNotificationSound();
                }
                
                // Driver arrived/picked up (ASSIGNED -> ARRIVING or ON_TRIP)
                if (prevRide.status === BuggyStatus.ASSIGNED && 
                    (newRide.status === BuggyStatus.ARRIVING || newRide.status === BuggyStatus.ON_TRIP)) {
                    const driver = users.find(u => u.id === newRide.driverId);
                    const driverName = driver ? driver.lastName : 'Driver';
                    const guestName = newRide.guestName || `Guest ${newRide.roomNumber}`;
                    const action = newRide.status === BuggyStatus.ARRIVING ? 'arrived' : 'picked up';
                    setNotification({
                        message: `🚗 Driver ${driverName} ${action} ${guestName}`,
                        type: 'info'
                    });
                    playNotificationSound();
                }
                
                // Completed (any status -> COMPLETED)
                if (prevRide.status !== BuggyStatus.COMPLETED && newRide.status === BuggyStatus.COMPLETED) {
                    const driver = users.find(u => u.id === newRide.driverId);
                    const driverName = driver ? driver.lastName : 'Driver';
                    const guestName = newRide.guestName || `Guest ${newRide.roomNumber}`;
                    setNotification({
                        message: `✅ Buggy completed: ${guestName} (${newRide.pickup} → ${newRide.destination})`,
                        type: 'success'
                    });
                    playNotificationSound();
                }
            });
            
            // Notify new requests
            if (newRequests.length > 0) {
                if (newRequests.length === 1) {
                    const guestName = newRequests[0].guestName || `Guest ${newRequests[0].roomNumber}`;
                    setNotification({
                        message: `🆕 New buggy request from ${guestName}`,
                        type: 'info'
                    });
                } else {
                    setNotification({
                        message: `🆕 ${newRequests.length} new buggy requests!`,
                        type: 'info'
                    });
                }
                playNotificationSound();
            }
        }
        
        // Update previous rides state
        prevRidesRef.current = rides;
    }, [rides, users, playNotificationSound]);

    // Auto-hide notification after 5 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Get pending requests count
    const getPendingCount = () => {
        return rides.filter(r => r.status === BuggyStatus.SEARCHING).length;
    };

    // Get total activities count (for badge display)
    const getTotalActivitiesCount = () => {
        const allActivities = getAllActivities();
        const count = allActivities.length;
        console.log('BuggyNotificationBell: Total activities count:', count);
        return count;
    };

    // Get all activities for dropdown
    const getAllActivities = () => {
        console.log('BuggyNotificationBell: getAllActivities called');
        console.log('BuggyNotificationBell: rides:', rides);
        console.log('BuggyNotificationBell: showCompleted:', showCompleted, 'showAssigned:', showAssigned, 'showActive:', showActive);
        
        const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING);
        console.log('BuggyNotificationBell: pendingRides (SEARCHING):', pendingRides.length);
        
        const activities: Array<{ ride: RideRequest; activityType: 'PENDING' | 'ASSIGNED' | 'ACTIVE' | 'COMPLETED' }> = [
            ...pendingRides.map(r => ({ ride: r, activityType: 'PENDING' as const }))
        ];

        if (showAssigned) {
            const assignedRides = rides.filter(r => r.status === BuggyStatus.ASSIGNED);
            console.log('BuggyNotificationBell: assignedRides (ASSIGNED):', assignedRides.length);
            activities.push(...assignedRides.map(r => ({ ride: r, activityType: 'ASSIGNED' as const })));
        }

        if (showActive) {
            const activeRides = rides.filter(r => r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP);
            console.log('BuggyNotificationBell: activeRides (ARRIVING/ON_TRIP):', activeRides.length);
            activities.push(...activeRides.map(r => ({ ride: r, activityType: 'ACTIVE' as const })));
        }

        if (showCompleted) {
            const completedRides = rides
                .filter(r => r.status === BuggyStatus.COMPLETED)
                .filter(r => {
                    // Use completedAt if available, otherwise use timestamp
                    const completedTime = r.completedAt || r.timestamp || 0;
                    // Show completed rides from last 30 minutes (increased from 5 minutes for Reception)
                    return Date.now() - completedTime < 1800000; // Last 30 minutes
                })
                .sort((a, b) => {
                    // Sort by completedAt if available, otherwise by timestamp
                    const timeA = a.completedAt || a.timestamp || 0;
                    const timeB = b.completedAt || b.timestamp || 0;
                    return timeB - timeA;
                })
                .slice(0, 10); // Show last 10 completed (increased from 5)
            console.log('BuggyNotificationBell: completedRides:', completedRides.length);
            activities.push(...completedRides.map(r => ({ ride: r, activityType: 'COMPLETED' as const })));
        }
        
        console.log('BuggyNotificationBell: Total activities after filtering:', activities.length);

        return activities.sort((a, b) => {
            const timeA = a.activityType === 'COMPLETED' ? (a.ride.completedAt || 0) : a.ride.timestamp;
            const timeB = b.activityType === 'COMPLETED' ? (b.ride.completedAt || 0) : b.ride.timestamp;
            return timeB - timeA;
        });
    };

    return (
        <>
            {/* Toast Notification */}
            {notification && (
                <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-5 ${
                    notification.type === 'success' ? 'bg-emerald-500' :
                    notification.type === 'info' ? 'bg-blue-500' :
                    'bg-amber-500'
                } text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 max-w-sm`}>
                    <CheckCircle size={20} />
                    <span className="font-semibold">{notification.message}</span>
                </div>
            )}

            {/* Notification Bell */}
            <div className="relative z-[100]" ref={notificationBellRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="relative p-2 rounded-lg transition-all bg-emerald-800 text-white hover:bg-emerald-700"
                    title="View notifications"
                >
                    <Bell size={18} />
                    {getTotalActivitiesCount() > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-emerald-900 animate-pulse">
                            {getTotalActivitiesCount() > 9 ? '9+' : getTotalActivitiesCount()}
                        </span>
                    )}
                </button>
                
                {/* Notification Dropdown */}
                {showDropdown && (
                    <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setShowDropdown(false)}></div>
                        <div className="absolute right-0 mt-2 w-96 backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl border-2 border-gray-200/60 overflow-hidden z-[101]"
                            style={{
                                boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3)'
                            }}
                        >
                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50/50 border-b border-gray-200/60 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-base">Notifications</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSoundToggle(!soundEnabled);
                                        }}
                                        className={`p-1.5 rounded-lg transition-all ${
                                            soundEnabled 
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                        }`}
                                        title={soundEnabled ? 'Sound enabled - Click to disable' : 'Sound disabled - Click to enable'}
                                    >
                                        <Bell size={16} className={soundEnabled ? '' : 'opacity-50'} />
                                    </button>
                                    <button 
                                        onClick={() => setShowDropdown(false)} 
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                    >
                                        <X size={18} strokeWidth={2.5}/>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {(() => {
                                    const allActivities = getAllActivities();
                                    
                                    if (allActivities.length === 0) {
                                        return (
                                            <div className="p-12 text-center">
                                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p className="text-gray-400 text-sm font-medium">No buggy activities</p>
                                            </div>
                                        );
                                    }
                                    
                                    return (
                                        <div className="divide-y divide-gray-100">
                                            {allActivities.map(({ ride, activityType }) => {
                                                const driver = users.find(u => u.id === ride.driverId);
                                                const driverName = driver ? driver.lastName : 'Unknown';
                                                
                                                const getActivityBadge = () => {
                                                    switch (activityType) {
                                                        case 'PENDING':
                                                            return { label: 'NEW REQUEST', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-800' };
                                                        case 'ASSIGNED':
                                                            return { label: 'DRIVER ACCEPTED', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800' };
                                                        case 'ACTIVE':
                                                            return { label: ride.status === BuggyStatus.ARRIVING ? 'ARRIVING' : 'ON TRIP', bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-800' };
                                                        case 'COMPLETED':
                                                            return { label: 'COMPLETED', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-800' };
                                                        default:
                                                            return { label: 'BUGGY', bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-800' };
                                                    }
                                                };
                                                
                                                const badge = getActivityBadge();
                                                const displayTime = activityType === 'COMPLETED' && ride.completedAt
                                                    ? new Date(ride.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                                    : new Date(ride.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                                
                                                return (
                                                    <div 
                                                        key={ride.id}
                                                        className="p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all cursor-pointer"
                                                        onClick={() => {
                                                            setShowDropdown(false);
                                                            if (onNavigate) onNavigate();
                                                        }}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border-2 ${badge.bg} ${badge.border} ${badge.text}`}>
                                                                {badge.label}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 font-medium">
                                                                {displayTime}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-bold mb-1 text-gray-900">{ride.guestName || `Guest ${ride.roomNumber}`}</h4>
                                                        <p className="text-xs text-gray-500 leading-relaxed">
                                                            {ride.pickup} → {ride.destination}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-0.5">Room {ride.roomNumber}</p>
                                                        {activityType === 'PENDING' && (
                                                            <p className="text-[10px] text-orange-600 mt-1 font-semibold">
                                                                Waiting: {Math.floor((Date.now() - ride.timestamp) / 1000 / 60)} min
                                                            </p>
                                                        )}
                                                        {(activityType === 'ASSIGNED' || activityType === 'ACTIVE') && (
                                                            <p className="text-[10px] text-blue-600 mt-1 font-semibold">
                                                                Driver: {driverName}
                                                            </p>
                                                        )}
                                                        {activityType === 'COMPLETED' && (
                                                            <p className="text-[10px] text-emerald-600 mt-1 font-semibold">
                                                                Completed {Math.floor((Date.now() - (ride.completedAt || 0)) / 1000 / 60)} min ago
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default BuggyNotificationBell;



