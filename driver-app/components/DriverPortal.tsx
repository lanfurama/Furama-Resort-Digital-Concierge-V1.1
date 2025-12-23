
import React, { useState, useEffect, useRef } from 'react';
import { getRides, updateRideStatus, getLastMessage, createManualRide, getLocations, setDriverOnlineFor10Hours, markDriverOffline, updateDriverLocation, updateUser, getUsers } from '../services/dataService';
import { RideRequest, BuggyStatus, User } from '../types';
import { Car, MapPin, Navigation, CheckCircle, Clock, MessageSquare, History, List, Plus, X, Loader2, User as UserIcon, Star, Volume2, VolumeX, Zap, Settings, Save } from 'lucide-react';
import NotificationBell from './NotificationBell';
import ServiceChat from './ServiceChat';
import { useTranslation } from '../contexts/LanguageContext';

type Language = 'English' | 'Vietnamese' | 'Korean' | 'Japanese' | 'Chinese' | 'French' | 'Russian';

const DriverPortal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { setLanguage } = useTranslation();
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [myRideId, setMyRideId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'REQUESTS' | 'HISTORY'>('REQUESTS');
    const [displayMode, setDisplayMode] = useState<'list' | 'grid'>('list'); // List or Grid view
    const [driverInfo, setDriverInfo] = useState<{name: string, rating: number, location: string}>({
        name: 'Mr. Tuan',
        rating: 5,
        location: "Near Don Cipriani's Italian Restaurant"
    });
    const [currentDriver, setCurrentDriver] = useState<User | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileName, setProfileName] = useState('');
    const [profileLanguage, setProfileLanguage] = useState<Language>('English');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    
    // Loading states for better UX
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    
    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [hasUnreadChat, setHasUnreadChat] = useState(false);

    // Sound/Notification State
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('driver_sound_enabled');
        return saved !== null ? saved === 'true' : true; // Default to enabled
    });
    const [previousRideId, setPreviousRideId] = useState<string | null>(null);

    // Helper: Play notification sound
    const playNotificationSound = () => {
        if (!soundEnabled) return;
        
        try {
            // Create audio context for a simple beep sound
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800; // Frequency in Hz
            oscillator.type = 'sine';
            
            // Longer duration: 0.6 seconds with smoother fade
            const duration = 0.6;
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.2); // Hold at 0.3 for 0.2s
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
            console.error('Failed to play notification sound:', error);
        }
    };

    // Create Manual Ride State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [manualRideData, setManualRideData] = useState({
        roomNumber: '',
        pickup: '',
        destination: ''
    });
    const [locations, setLocations] = useState<any[]>([]);
    const [gpsPermissionStatus, setGpsPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
    const [showGpsPermissionAlert, setShowGpsPermissionAlert] = useState(false);

    // Load driver info from localStorage and setup heartbeat
    useEffect(() => {
        const loadDriverInfo = async () => {
            const savedUser = localStorage.getItem('furama_user');
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    setCurrentDriver(user);
                    setDriverInfo({
                        name: user.lastName ? `Mr. ${user.lastName}` : 'Driver',
                        rating: 5, // Default rating, can be fetched from API if available
                        location: "Near Don Cipriani's Italian Restaurant" // Default location, can be updated
                    });
                    
                    // Load from database if available
                    if (user.id) {
                        try {
                            const users = await getUsers();
                            const dbDriver = users.find(u => u.id === user.id);
                            if (dbDriver) {
                                setCurrentDriver(dbDriver);
                                setDriverInfo({
                                    name: dbDriver.lastName ? `Mr. ${dbDriver.lastName}` : 'Driver',
                                    rating: 5,
                                    location: driverInfo.location
                                });
                                // Set language from database
                                if (dbDriver.language) {
                                    setProfileLanguage(dbDriver.language as Language);
                                    setLanguage(dbDriver.language as Language);
                                }
                            }
                        } catch (error) {
                            console.error('Failed to load driver from database:', error);
                        }
                    }
                    
                    // Set driver online for 10 hours on first login
                    if (user.id && user.role === 'DRIVER') {
                        setDriverOnlineFor10Hours(user.id);
                    }
                } catch (e) {
                    console.error('Failed to parse user from localStorage:', e);
                }
            }
        };
        
        loadDriverInfo();
    }, []);
    
    // Initialize profile form when modal opens
    useEffect(() => {
        if (showProfileModal && currentDriver) {
            setProfileName(currentDriver.lastName || '');
            setProfileLanguage((currentDriver.language as Language) || 'English');
        }
    }, [showProfileModal, currentDriver]);
    
    // Handle save profile
    const handleSaveProfile = async () => {
        if (!currentDriver || !currentDriver.id) {
            alert('Driver information not found');
            return;
        }
        
        setIsSavingProfile(true);
        try {
            // Update driver name and language
            const updatedUser = await updateUser(currentDriver.id, {
                lastName: profileName,
                language: profileLanguage
            });
            
            console.log('Profile updated successfully:', updatedUser);
            
            // Update local state with the values we sent (in case API response is incomplete)
            const finalLastName = updatedUser?.lastName || profileName;
            const finalLanguage = (updatedUser?.language as Language) || profileLanguage;
            
            setCurrentDriver({
                ...currentDriver,
                lastName: finalLastName,
                language: finalLanguage
            });
            
            setDriverInfo({
                ...driverInfo,
                name: finalLastName ? `Mr. ${finalLastName}` : 'Driver'
            });
            
            // Update localStorage
            const savedUser = localStorage.getItem('furama_user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                parsedUser.lastName = finalLastName;
                parsedUser.language = finalLanguage;
                localStorage.setItem('furama_user', JSON.stringify(parsedUser));
            }
            
            // Update language context
            setLanguage(finalLanguage);
            
            setShowProfileModal(false);
            
            // Show success message
            alert('Profile updated successfully!');
        } catch (error: any) {
            console.error('Failed to save profile:', error);
            console.error('Error details:', {
                message: error?.message,
                response: error?.response,
                status: error?.response?.status
            });
            
            // Check if it's actually a success (status 200-299) but caught as error
            const status = error?.response?.status;
            if (status && status >= 200 && status < 300) {
                // Success response but caught as error - update anyway
                setCurrentDriver({
                    ...currentDriver,
                    lastName: profileName,
                    language: profileLanguage
                });
                setDriverInfo({
                    ...driverInfo,
                    name: profileName ? `Mr. ${profileName}` : 'Driver'
                });
                const savedUser = localStorage.getItem('furama_user');
                if (savedUser) {
                    const parsedUser = JSON.parse(savedUser);
                    parsedUser.lastName = profileName;
                    parsedUser.language = profileLanguage;
                    localStorage.setItem('furama_user', JSON.stringify(parsedUser));
                }
                setLanguage(profileLanguage);
                setShowProfileModal(false);
                alert('Profile updated successfully!');
            } else {
                // Real error - show error message
                alert(`Failed to save profile: ${error?.message || 'Unknown error'}. Please try again.`);
            }
        } finally {
            setIsSavingProfile(false);
        }
    };
    
    // Set driver online status to 10 hours on first login
    useEffect(() => {
        const savedUser = localStorage.getItem('furama_user');
        if (!savedUser) return;
        
        try {
            const user = JSON.parse(savedUser);
            if (!user.id || user.role !== 'DRIVER') return;
            
            // Set driver online for 10 hours on first login
            setDriverOnlineFor10Hours(user.id);
        } catch (e) {
            console.error('Failed to set driver online for 10 hours:', e);
        }
    }, []);

    // Check GPS Permission Status
    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsPermissionStatus('denied');
            setShowGpsPermissionAlert(true);
            return;
        }

        // Check permission status using Permissions API if available
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
                setGpsPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
                if (result.state === 'denied') {
                    setShowGpsPermissionAlert(true);
                }
                
                // Listen for permission changes
                result.onchange = () => {
                    setGpsPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
                    if (result.state === 'denied') {
                        setShowGpsPermissionAlert(true);
                    } else if (result.state === 'granted') {
                        setShowGpsPermissionAlert(false);
                    }
                };
            }).catch(() => {
                // Permissions API not supported, will check on first geolocation call
                setGpsPermissionStatus('prompt');
            });
        } else {
            // Permissions API not available, will check on first geolocation call
            setGpsPermissionStatus('prompt');
        }
    }, []);

    // GPS Location Tracking: Update driver location every 15 seconds
    useEffect(() => {
        const savedUser = localStorage.getItem('furama_user');
        if (!savedUser) return;
        
        try {
            const user = JSON.parse(savedUser);
            if (!user.id || user.role !== 'DRIVER') return;

            // Check if geolocation is available
            if (!navigator.geolocation) {
                console.warn('[GPS] Geolocation is not supported by this browser');
                setGpsPermissionStatus('denied');
                setShowGpsPermissionAlert(true);
                return;
            }

            let watchId: number | null = null;
            let lastSentLat: number | null = null;
            let lastSentLng: number | null = null;

            // Function to update location
            const updateLocation = (position: GeolocationPosition) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Permission granted
                setGpsPermissionStatus('granted');
                setShowGpsPermissionAlert(false);
                
                // Only update if location changed significantly (more than 10 meters)
                if (lastSentLat !== null && lastSentLng !== null) {
                    const distance = Math.sqrt(
                        Math.pow(lat - lastSentLat, 2) + Math.pow(lng - lastSentLng, 2)
                    ) * 111000; // Convert to meters (rough approximation)
                    
                    if (distance < 10) {
                        // Location hasn't changed significantly, skip update
                        return;
                    }
                }

                // Update location on server
                updateDriverLocation(user.id, lat, lng);
                lastSentLat = lat;
                lastSentLng = lng;

                // Update local driver info with location name if available
                if (locations.length > 0) {
                    // Find nearest location
                    let nearestLocation = locations[0];
                    let minDistance = Infinity;
                    
                    locations.forEach(loc => {
                        const dist = Math.sqrt(
                            Math.pow(lat - loc.lat, 2) + Math.pow(lng - loc.lng, 2)
                        );
                        if (dist < minDistance) {
                            minDistance = dist;
                            nearestLocation = loc;
                        }
                    });
                    
                    if (minDistance < 0.001) { // Within ~100 meters
                        setDriverInfo(prev => ({
                            ...prev,
                            location: `Near ${nearestLocation.name}`
                        }));
                    }
                }
            };

            const handleError = (error: GeolocationPositionError) => {
                console.error('[GPS] Error getting location:', error);
                
                if (error.code === error.PERMISSION_DENIED) {
                    setGpsPermissionStatus('denied');
                    setShowGpsPermissionAlert(true);
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    console.warn('[GPS] Position unavailable');
                } else if (error.code === error.TIMEOUT) {
                    console.warn('[GPS] Request timeout');
                }
            };

            // Request location updates every 15 seconds
            const locationOptions: PositionOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000
            };

            // Get initial location
            navigator.geolocation.getCurrentPosition(updateLocation, handleError, locationOptions);

            // Watch position for continuous updates
            watchId = navigator.geolocation.watchPosition(updateLocation, handleError, locationOptions);

            return () => {
                if (watchId !== null) {
                    navigator.geolocation.clearWatch(watchId);
                }
            };
        } catch (e) {
            console.error('Failed to setup GPS tracking:', e);
        }
    }, [locations]);

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

    // Track previous pending rides count to detect new requests
    const previousPendingRidesRef = useRef<Set<string>>(new Set());

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
                
                // Check for new pending requests (SEARCHING status)
                const pendingRides = allRides.filter(r => r.status === BuggyStatus.SEARCHING);
                const currentPendingIds = new Set(pendingRides.map(r => r.id));
                
                // Detect new requests (not in previous set)
                const newRequests = pendingRides.filter(r => !previousPendingRidesRef.current.has(r.id));
                if (newRequests.length > 0 && soundEnabled) {
                    // New request(s) detected - play notification sound
                    playNotificationSound();
                }
                
                // Update previous pending rides set
                previousPendingRidesRef.current = currentPendingIds;
                
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
                    // Check if this is a new ride assignment (different from previous)
                    if (previousRideId !== active.id && previousRideId !== null) {
                        // New ride assigned - play sound notification
                        if (soundEnabled) {
                            playNotificationSound();
                        }
                    }
                    setPreviousRideId(active.id);
                    setMyRideId(active.id);
                    // Check for unread messages from Guest for this ride
                    const lastMsg = await getLastMessage(active.roomNumber, 'BUGGY');
                    // If last message exists and was sent by 'user' (Guest), it's unread for the Driver
                    if (lastMsg && lastMsg.role === 'user') {
                        setHasUnreadChat(true);
                        // Play sound for new message
                        if (soundEnabled) {
                            playNotificationSound();
                        }
                    }
                } else {
                    setMyRideId(null);
                    setShowChat(false);
                    setHasUnreadChat(false);
                    setPreviousRideId(null);
                }
            } catch (error) {
                console.error('Failed to load rides:', error);
            }
        };

        // Initial load
        loadRides();

        const interval = setInterval(loadRides, 2000); // Poll every 2 seconds
        return () => clearInterval(interval);
    }, [soundEnabled]);

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
            
            await updateRideStatus(id, BuggyStatus.ON_TRIP);
            
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
            await updateRideStatus(id, BuggyStatus.COMPLETED);
            
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
            
            const newRide = await createManualRide(
                driverId, 
                manualRideData.roomNumber, 
                manualRideData.pickup, 
                manualRideData.destination
            );
            
            
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

    // Helper function to determine ride type (PU, DO, AC)
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
            {/* GPS Permission Alert */}
            {showGpsPermissionAlert && (
                <div className="bg-yellow-500 text-white px-4 py-3 flex items-center justify-between z-50 border-b-2 border-yellow-600">
                    <div className="flex items-center gap-3 flex-1">
                        <MapPin size={20} className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm mb-0.5">Location Permission Required</div>
                            <div className="text-xs text-yellow-100">
                                {gpsPermissionStatus === 'denied' 
                                    ? 'Please enable location access in your browser settings to track your position.'
                                    : 'Please allow location access to enable GPS tracking for better ride management.'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowGpsPermissionAlert(false)}
                        className="ml-2 p-1 hover:bg-yellow-600 rounded transition-colors flex-shrink-0"
                        title="Dismiss"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Header - Enhanced Design */}
            <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg p-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar - Enhanced */}
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-lg">
                        {driverInfo.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    
                    {/* Driver Info - Enhanced */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="font-bold text-lg text-white truncate">{driverInfo.name}</h1>
                            <div className="flex items-center gap-1 bg-yellow-400/20 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-yellow-300/30">
                                <Star size={14} className="text-yellow-300 fill-yellow-300" />
                                <span className="text-xs font-bold text-white">{driverInfo.rating}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin size={13} className={`flex-shrink-0 ${
                                gpsPermissionStatus === 'granted' 
                                    ? 'text-white/80' 
                                    : 'text-yellow-300'
                            }`} />
                            <p className="text-sm text-white/90 truncate font-medium">
                                {gpsPermissionStatus === 'granted' 
                                    ? driverInfo.location 
                                    : gpsPermissionStatus === 'denied'
                                    ? 'Location access denied'
                                    : 'Requesting location...'}
                            </p>
                            {gpsPermissionStatus === 'granted' && (
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" title="GPS Active"></div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Right Icons - Enhanced */}
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <button 
                        onClick={() => setShowProfileModal(true)}
                        className="p-2 rounded-xl hover:bg-white/10 transition-all text-white/80"
                        title="Edit Profile"
                    >
                        <Settings size={18} />
                    </button>
                    <button 
                        onClick={() => {
                            const newState = !soundEnabled;
                            setSoundEnabled(newState);
                            localStorage.setItem('driver_sound_enabled', String(newState));
                            
                            // Play a test sound if enabling
                            if (newState) {
                                playNotificationSound();
                            }
                        }}
                        className={`p-2 rounded-xl hover:bg-white/10 transition-all ${
                            soundEnabled ? 'text-white' : 'text-white/60'
                        }`}
                        title={soundEnabled ? 'Sound On - Click to mute' : 'Sound Off - Click to unmute'}
                    >
                        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                    <button 
                        onClick={async () => {
                            // Mark driver as offline before logout
                            const savedUser = localStorage.getItem('furama_user');
                            if (savedUser) {
                                try {
                                    const user = JSON.parse(savedUser);
                                    if (user.id && user.role === 'DRIVER') {
                                        await markDriverOffline(user.id);
                                    }
                                } catch (e) {
                                    console.error('Failed to mark driver offline:', e);
                                }
                            }
                            onLogout();
                        }}
                        className="p-2 rounded-xl hover:bg-white/10 transition-all text-white/80"
                        title="Logout"
                    >
                        <X size={18} />
                    </button>
                </div>
            </header>

            {/* Tab Navigation - Enhanced Design */}
            <div className="bg-white border-b border-gray-200 shadow-sm px-4">
                <div className="flex space-x-2">
                    <button 
                        onClick={() => setViewMode('REQUESTS')}
                        className={`py-3.5 px-5 font-bold text-sm transition-all duration-300 border-b-2 relative ${
                            viewMode === 'REQUESTS' 
                                ? 'text-emerald-600 border-emerald-600' 
                                : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Car size={16} />
                            REQUESTS
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                viewMode === 'REQUESTS' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                {pendingRides.length + (myCurrentRide ? 1 : 0)}
                            </span>
                        </span>
                    </button>
                    <button 
                        onClick={() => setViewMode('HISTORY')}
                        className={`py-3.5 px-5 font-bold text-sm transition-all duration-300 border-b-2 relative ${
                            viewMode === 'HISTORY' 
                                ? 'text-emerald-600 border-emerald-600' 
                                : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <History size={16} />
                            HISTORY
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                viewMode === 'HISTORY' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                {historyRides.length}
                            </span>
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50/20 to-emerald-50/20">
                {/* CURRENT JOB Banner - Enhanced Design */}
                {myCurrentRide && viewMode === 'REQUESTS' && (
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-4 py-3 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            <span className="font-bold text-sm">CURRENT JOB</span>
                        </div>
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold border border-white/30">
                            {myCurrentRide.status === BuggyStatus.ON_TRIP ? '🚗 ON TRIP' : 
                             myCurrentRide.status === BuggyStatus.ARRIVING ? '📍 ARRIVING' : '✅ ASSIGNED'}
                        </span>
                    </div>
                )}
                
                {/* REQUESTS VIEW */}
                {viewMode === 'REQUESTS' && (
                    <>
                        {/* Current Job Card - Enhanced Design */}
                        {myCurrentRide ? (
                            <div className="m-4 bg-white rounded-2xl shadow-xl border-2 border-emerald-200 overflow-hidden">
                                {/* Status Header */}
                                <div className={`bg-gradient-to-r ${
                                    myCurrentRide.status === BuggyStatus.ON_TRIP 
                                        ? 'from-purple-500 to-pink-500' 
                                        : 'from-emerald-500 to-teal-500'
                                } text-white px-4 py-2.5`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Car size={18} />
                                            <span className="font-bold text-sm">Active Ride</span>
                                        </div>
                                        <div className="text-xs bg-white/20 px-2 py-1 rounded-full font-semibold">
                                            {myCurrentRide.status === BuggyStatus.ON_TRIP ? 'En Route' : 
                                             myCurrentRide.status === BuggyStatus.ARRIVING ? 'Arriving' : 'Assigned'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-5">
                                    <div className="flex items-start gap-4">
                                        {/* Room Number Badge */}
                                        <div className="flex flex-col items-center min-w-[70px]">
                                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center border-2 border-emerald-200">
                                                <div className="text-2xl font-black text-emerald-700">#{myCurrentRide.roomNumber}</div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2 font-medium">{formatTime(myCurrentRide.timestamp)}</div>
                                        </div>
                                        
                                        {/* Ride Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="font-bold text-lg text-gray-900">{myCurrentRide.guestName}</div>
                                                <button 
                                                    onClick={() => {
                                                        setShowChat(true);
                                                        setHasUnreadChat(false);
                                                    }}
                                                    className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                                                        hasUnreadChat 
                                                            ? 'bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-300' 
                                                            : 'bg-gray-100 hover:bg-emerald-100 text-emerald-600 border-2 border-transparent'
                                                    }`}
                                                    title="Chat with guest"
                                                >
                                                    <MessageSquare size={18} strokeWidth={2.5} />
                                                    <span className="text-sm font-semibold">
                                                        {hasUnreadChat ? 'New Message' : 'Chat'}
                                                    </span>
                                                    {hasUnreadChat && (
                                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md animate-pulse"></span>
                                                    )}
                                                </button>
                                            </div>
                                            
                                            {/* Route */}
                                            <div className="space-y-2.5 mb-4">
                                                <div className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Pickup</div>
                                                        <div className="text-sm font-semibold text-gray-800">{myCurrentRide.pickup}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 px-2">
                                                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-emerald-300"></div>
                                                    <Navigation size={16} className="text-emerald-500" />
                                                    <div className="flex-1 h-px bg-gradient-to-r from-emerald-300 to-gray-300"></div>
                                                </div>
                                                <div className="flex items-start gap-2.5 p-2.5 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0 animate-pulse"></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] font-semibold text-emerald-600 uppercase mb-0.5">Destination</div>
                                                        <div className="text-sm font-bold text-emerald-700">{myCurrentRide.destination}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Action Button */}
                                            <div className="mt-4">
                                                {(myCurrentRide.status === BuggyStatus.ARRIVING || myCurrentRide.status === BuggyStatus.ASSIGNED) ? (
                                                    <button 
                                                        onClick={() => pickUpGuest(myCurrentRide.id)}
                                                        disabled={loadingAction === `pickup-${myCurrentRide.id}`}
                                                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        {loadingAction === `pickup-${myCurrentRide.id}` ? (
                                                            <>
                                                                <Loader2 size={18} className="animate-spin" />
                                                                <span>Processing...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Car size={18} />
                                                                <span>Pick Up Guest</span>
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => completeRide(myCurrentRide.id)}
                                                        disabled={loadingAction === `complete-${myCurrentRide.id}`}
                                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        {loadingAction === `complete-${myCurrentRide.id}` ? (
                                                            <>
                                                                <Loader2 size={18} className="animate-spin" />
                                                                <span>Completing...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle size={18} />
                                                                <span>Complete Ride</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Requests List - Enhanced Design */
                            <div className="p-4 space-y-3">
                                {pendingRides.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                            <Zap size={36} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-600 font-bold text-lg mb-1">Waiting for requests...</p>
                                        <p className="text-gray-400 text-sm">New ride requests will appear here</p>
                                    </div>
                                ) : (
                                    pendingRides.map((ride) => {
                                        const waitingMinutes = getWaitingTime(ride.timestamp);
                                        const priorityInfo = getPriorityInfo(ride);
                                        const rideType = getRideType(ride);
                                        
                                        return (
                                            <div 
                                                key={ride.id} 
                                                className="bg-white rounded-2xl shadow-md border-2 border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 overflow-hidden group"
                                            >
                                                {/* Header: Priority + Ride Type Labels + Wait Time */}
                                                <div className={`${priorityInfo.color} ${priorityInfo.textColor} px-3 py-2 flex items-center justify-between`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                                                        <span className="text-xs font-bold">{priorityInfo.label}</span>
                                                        {/* Ride Type Labels */}
                                                        {rideType.labels.length > 0 && (
                                                            <div className="flex items-center gap-1 ml-2">
                                                                {rideType.labels.map((label, idx) => (
                                                                    <span 
                                                                        key={idx}
                                                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                                            label === 'AC' 
                                                                                ? 'bg-purple-500 text-white' 
                                                                                : label === 'PU'
                                                                                ? 'bg-blue-500 text-white'
                                                                                : 'bg-emerald-500 text-white'
                                                                        }`}
                                                                    >
                                                                        {label}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-semibold opacity-90">
                                                        {waitingMinutes > 0 ? `${waitingMinutes}m` : 'Now'}
                                                    </div>
                                                </div>
                                                
                                                <div className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        {/* Room Number - Compact but Prominent */}
                                                        <div className="flex flex-col items-center min-w-[65px]">
                                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center border-2 border-blue-200 shadow-sm">
                                                                <div className="text-2xl font-black text-blue-700">#{ride.roomNumber}</div>
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 mt-1 font-medium">{formatTime(ride.timestamp)}</div>
                                                        </div>
                                                        
                                                        {/* Ride Details - Compact Layout */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Top Row: Guest Name + Route Inline */}
                                                            <div className="mb-2">
                                                                <div className="font-bold text-lg text-gray-900 mb-1.5">{ride.guestName}</div>
                                                                {/* Route - Inline Compact */}
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded border border-gray-200 flex-1 min-w-0">
                                                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                                        <span className="text-gray-700 font-medium truncate">{ride.pickup}</span>
                                                                    </div>
                                                                    <Navigation size={14} className="text-emerald-500 rotate-90 flex-shrink-0" />
                                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded border-2 border-emerald-200 flex-1 min-w-0">
                                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0 animate-pulse"></div>
                                                                        <span className="text-emerald-700 font-bold truncate">{ride.destination}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Accept Button - Compact but Clear */}
                                                        <div className="flex flex-col justify-center flex-shrink-0">
                                                            <button 
                                                                onClick={() => acceptRide(ride.id)}
                                                                disabled={loadingAction === ride.id || loadingAction !== null}
                                                                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] flex items-center justify-center gap-2"
                                                            >
                                                                {loadingAction === ride.id ? (
                                                                    <>
                                                                        <Loader2 size={16} className="animate-spin" />
                                                                        <span>...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle size={16} />
                                                                        <span>Accept</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </>
                )}
                
                {/* HISTORY VIEW - Compact & Clear Layout */}
                {viewMode === 'HISTORY' && (
                    <div className="p-3">
                        {historyRides.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                    <History size={36} className="text-gray-400"/>
                                </div>
                                <p className="text-gray-600 font-bold text-lg mb-1">No completed trips</p>
                                <p className="text-gray-400 text-sm">Your ride history will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {historyRides.map(ride => (
                                    <div 
                                        key={ride.id} 
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-emerald-200 transition-all overflow-hidden"
                                    >
                                        <div className="p-3">
                                            {/* Top Row: Room, Guest, Rating, Time */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                    {/* Room Number Badge - Smaller */}
                                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center border border-emerald-200 flex-shrink-0">
                                                        <div className="text-base font-black text-emerald-700">#{ride.roomNumber}</div>
                                                    </div>
                                                    
                                                    {/* Guest Name & Route - Inline */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="font-bold text-sm text-gray-900">{ride.guestName}</div>
                                                            <div className="text-xs text-gray-500">{formatTime(ride.timestamp)}</div>
                                                        </div>
                                                        {/* Route - Compact Inline */}
                                                        <div className="flex items-center gap-1.5 text-xs">
                                                            <span className="text-gray-600 truncate">{ride.pickup}</span>
                                                            <Navigation size={10} className="text-emerald-500 rotate-90 flex-shrink-0" />
                                                            <span className="text-emerald-700 font-semibold truncate">{ride.destination}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Rating */}
                                                {ride.rating ? (
                                                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200 flex-shrink-0 ml-2">
                                                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                                        <span className="text-xs font-bold text-yellow-700">{ride.rating}</span>
                                                    </div>
                                                ) : (
                                                    <Star size={14} className="text-gray-300 flex-shrink-0 ml-2" />
                                                )}
                                            </div>
                                            
                                            {/* Bottom Row: Timestamps - Compact */}
                                            <div className="flex items-center gap-3 text-xs text-gray-500 pt-1.5 border-t border-gray-100">
                                                {ride.pickedUpAt && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={10} className="text-gray-400" />
                                                        <span>Pick: {formatTime(ride.pickedUpAt)}</span>
                                                    </div>
                                                )}
                                                {ride.completedAt && (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle size={10} className="text-emerald-500" />
                                                        <span>Done: {formatTime(ride.completedAt)}</span>
                                                    </div>
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
                                    onChange={(e) => setManualRideData({...manualRideData, roomNumber: e.target.value})}
                                    placeholder="e.g. 101"
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3.5 md:p-3 text-gray-900 text-sm md:text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[44px] transition-all caret-emerald-600"
                                    style={{ caretColor: '#10b981' }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs md:text-sm uppercase text-gray-600 font-bold mb-2">Pickup Location</label>
                                <select
                                    value={manualRideData.pickup}
                                    onChange={(e) => setManualRideData({...manualRideData, pickup: e.target.value})}
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
                                    onChange={(e) => setManualRideData({...manualRideData, destination: e.target.value})}
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
                    label={`${myCurrentRide.guestName} (Room ${myCurrentRide.roomNumber})`}
                    autoOpen={true}
                    userRole="staff"
                    onClose={() => setShowChat(false)}
                />
            )}

            {/* Profile Edit Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in" onClick={() => setShowProfileModal(false)}>
                    <div className="backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl w-full max-w-md border-2 border-gray-200/60 max-h-[90vh] overflow-y-auto"
                        style={{
                            boxShadow: '0 25px 70px -20px rgba(0,0,0,0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-5 border-b-2 border-gray-200/60 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                            <h3 className="font-bold text-lg text-gray-900">Edit Profile</h3>
                            <button 
                                onClick={() => setShowProfileModal(false)} 
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="p-5 space-y-4">
                            {/* Name Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-white"
                                    style={{ color: '#111827' }}
                                />
                            </div>
                            
                            {/* Language Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Language
                                </label>
                                <select
                                    value={profileLanguage}
                                    onChange={(e) => setProfileLanguage(e.target.value as Language)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-white"
                                    style={{ color: '#111827' }}
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
                            
                            {/* Save Button */}
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-emerald-500/50"
                            >
                                {isSavingProfile ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Save Profile</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverPortal;
