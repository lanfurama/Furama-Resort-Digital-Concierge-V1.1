
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Clock, Car, Navigation, LocateFixed, XCircle, Search, Utensils, Coffee, Waves, Building2, CheckCircle, Loader2 } from 'lucide-react';
import { BuggyStatus, User, RideRequest, Location } from '../types';
import { getLocations, requestRide, getActiveRideForUser, cancelRide, getUsers } from '../services/dataService';
import { THEME_COLORS, RESORT_CENTER } from '../constants';
import ServiceChat from './ServiceChat';
import { useTranslation } from '../contexts/LanguageContext';
import Loading from './Loading';

interface BuggyBookingProps {
  user: User;
  onBack: () => void;
}

const BuggyBooking: React.FC<BuggyBookingProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [activeRide, setActiveRide] = useState<RideRequest | undefined>(undefined);
  const [pickup, setPickup] = useState<string>(`Villa ${user.roomNumber}`);
  const [destination, setDestination] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingRide, setIsLoadingRide] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Time elapsed in seconds (for SEARCHING)
  const [arrivingElapsedTime, setArrivingElapsedTime] = useState<number>(0); // Time elapsed since driver accepted (for ASSIGNED/ARRIVING)
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search query for locations
  const [filterType, setFilterType] = useState<'ALL' | 'VILLA' | 'FACILITY' | 'RESTAURANT'>('VILLA'); // Filter by location type - default to Villas
  const [isBooking, setIsBooking] = useState(false); // Prevent double-click/multiple submissions
  
  // Completion Modal & Rating State
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedRide, setCompletedRide] = useState<RideRequest | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<BuggyStatus | null>(null);
  
  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'warning'} | null>(null);
  
  // Driver name state for chat label
  const [driverName, setDriverName] = useState<string>(t('driver'));
  
  // Sound notification state
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('guest_sound_enabled');
    return saved !== null ? saved === 'true' : true; // Default to enabled
  });
  
  // Helper: Play notification sound
  const playNotificationSound = useCallback(() => {
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
  }, [soundEnabled]);
  
  // Track which ride ID we've already shown completion modal for
  const completedRideIdRef = useRef<string | null>(null);
  
  const MAX_WAIT_TIME = 10 * 60; // 10 minutes in seconds (for SEARCHING status)
  const MAX_ARRIVING_WAIT_TIME = 15 * 60; // 15 minutes in seconds (for ASSIGNED/ARRIVING status - driver arriving too long)
  const ARRIVING_WARNING_TIME = 5 * 60; // 5 minutes in seconds (for ASSIGNED/ARRIVING status - show red warning)
  
  // Load locations on mount
  useEffect(() => {
    setIsLoadingLocations(true);
    getLocations()
      .then(setLocations)
      .catch(console.error)
      .finally(() => setIsLoadingLocations(false));
  }, []);


  // Use refs to track previous values without causing re-renders
  const previousStatusRef = useRef<BuggyStatus | null>(null);
  const activeRideRef = useRef<RideRequest | undefined>(undefined);

  // Load active ride on mount and polling for ride updates
  useEffect(() => {
      const checkStatus = async () => {
          try {
              const ride = await getActiveRideForUser(user.roomNumber);
              const currentPreviousStatus = previousStatusRef.current;
              const currentActiveRide = activeRideRef.current;
              
              // Detect when ride was ON_TRIP but now is undefined (completed)
              // getActiveRideForUser doesn't return completed rides, so if we had ON_TRIP and now it's undefined, it means completed
              if (currentPreviousStatus === BuggyStatus.ON_TRIP && !ride && currentActiveRide) {
                  // Ride was completed - just clear the active ride
                  setActiveRide(undefined);
                  previousStatusRef.current = null;
                  activeRideRef.current = undefined;
                  setNotification({ message: '🎊 Ride completed successfully!', type: 'success' });
                  playNotificationSound(); // Play sound when ride completed
                  return; // Exit early to prevent further processing
              }
              
              // Detect status changes for notifications
              if (ride && currentPreviousStatus !== null && currentPreviousStatus !== ride.status) {
                  if (currentPreviousStatus === BuggyStatus.SEARCHING && ride.status === BuggyStatus.ASSIGNED) {
                      setNotification({ message: '🎉 Driver accepted your ride!', type: 'success' });
                      playNotificationSound(); // Play sound when driver accepts
                  } else if (currentPreviousStatus === BuggyStatus.ASSIGNED && ride.status === BuggyStatus.ARRIVING) {
                      setNotification({ message: '🚗 Driver is arriving!', type: 'info' });
                      playNotificationSound(); // Play sound when driver is arriving
                  } else if (currentPreviousStatus === BuggyStatus.ARRIVING && ride.status === BuggyStatus.ON_TRIP) {
                      setNotification({ message: '✅ You\'ve been picked up!', type: 'success' });
                      playNotificationSound(); // Play sound when picked up
                  } else if (currentPreviousStatus === BuggyStatus.ON_TRIP && ride.status === BuggyStatus.COMPLETED) {
                      setNotification({ message: '🎊 Ride completed successfully!', type: 'success' });
                      playNotificationSound(); // Play sound when ride completed
                  }
              }
              
              // Update refs
              previousStatusRef.current = ride?.status || null;
              activeRideRef.current = ride;
              
              // Update state
              setPreviousStatus(ride?.status || null);
              setActiveRide(ride);
              // Restore destination from active ride if exists
              if (ride && ride.destination) {
                  setDestination(ride.destination);
              }
              setIsLoadingRide(false);
          } catch (error) {
              console.error('Failed to check ride status:', error);
              setIsLoadingRide(false);
          }
      };
      
      checkStatus(); // Check immediately on mount
      
      // Adaptive polling: faster when there's an active ride (3s), slower when no ride (10s)
      let interval: NodeJS.Timeout;
      const scheduleNext = () => {
          const pollingInterval = activeRideRef.current ? 3000 : 10000;
          interval = setTimeout(() => {
              checkStatus();
              scheduleNext();
          }, pollingInterval);
      };
      
      scheduleNext();
      
      return () => {
          if (interval) clearTimeout(interval);
      };
  }, [user.roomNumber]); // Only depend on roomNumber to avoid recreating interval

  // Cache for driver names to avoid repeated API calls
  const driverNameCacheRef = useRef<Record<string, string>>({});

  // Fetch driver name when activeRide has driverId (only when driverId changes)
  useEffect(() => {
      const fetchDriverName = async () => {
          if (!activeRide) {
              setDriverName(t('driver'));
              return;
          }

          // If ride is still searching, show searching status
          if (activeRide.status === BuggyStatus.SEARCHING) {
              setDriverName(`${t('driver')} (${t('finding_driver')})`);
              return;
          }

          // If ride has driverId, fetch driver name (only if not cached)
          if (activeRide.driverId) {
              const driverIdStr = String(activeRide.driverId);
              
              // Check cache first
              if (driverNameCacheRef.current[driverIdStr]) {
                  setDriverName(driverNameCacheRef.current[driverIdStr]);
                  return;
              }

              try {
                  const users = await getUsers();
                  const driver = users.find(u => {
                      const userIdStr = String(u.id || '');
                      return userIdStr === driverIdStr;
                  });
                  
                  if (driver && driver.lastName) {
                      // Cache the driver name
                      driverNameCacheRef.current[driverIdStr] = driver.lastName;
                      setDriverName(driver.lastName);
                      console.log('[BuggyBooking] Driver name found:', driver.lastName, 'for driverId:', driverIdStr);
                  } else {
                      console.warn('[BuggyBooking] Driver not found for driverId:', driverIdStr);
                      // Fallback: show driver with status
                      const statusLabel = activeRide.status === BuggyStatus.ASSIGNED ? t('driver_assigned') :
                                        activeRide.status === BuggyStatus.ARRIVING ? t('driver_arriving') :
                                        activeRide.status === BuggyStatus.ON_TRIP ? t('en_route') :
                                        t('driver');
                      setDriverName(`${t('driver')} (${statusLabel})`);
                  }
              } catch (error) {
                  console.error('[BuggyBooking] Failed to fetch driver name:', error);
                  setDriverName(t('driver'));
              }
          } else {
              // No driver assigned yet
              setDriverName(`${t('driver')} (${t('finding_driver')})`);
          }
      };
      
      fetchDriverName();
  }, [activeRide?.driverId, activeRide?.status, t]); // Removed activeRide and user.roomNumber from deps
  
  // Auto-hide notification after 5 seconds
  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => {
              setNotification(null);
          }, 5000);
          return () => clearTimeout(timer);
      }
  }, [notification]);


  // Countdown timer for ride waiting time
  // Track time differently based on ride status:
  // - SEARCHING: Track time from ride creation (timestamp)
  // - ASSIGNED/ARRIVING: Track time from when driver accepted (confirmedAt)
  useEffect(() => {
      if (!activeRide) {
          setElapsedTime(0);
          setArrivingElapsedTime(0);
          return;
      }

      // Track elapsed time when SEARCHING (waiting for driver)
      if (activeRide.status === BuggyStatus.SEARCHING) {
          setArrivingElapsedTime(0); // Reset arriving timer
          
          // Count from timestamp (when ride was created)
          let startTime: number | undefined = activeRide.timestamp;
          
          // Safety check: if startTime seems invalid (too old or in the future), use current time
          const now = Date.now();
          if (!startTime || startTime > now || startTime < now - (24 * 60 * 60 * 1000)) {
              // If timestamp is invalid or more than 24 hours ago, use current time
              startTime = now;
          }
          
          const updateElapsed = () => {
              const currentTime = Date.now();
              const elapsed = Math.max(0, Math.floor((currentTime - startTime!) / 1000)); // Convert to seconds, ensure non-negative
              setElapsedTime(elapsed);
          };

          updateElapsed(); // Update immediately
          const timer = setInterval(updateElapsed, 1000); // Update every second
          
          return () => clearInterval(timer);
      }
      
      // Track elapsed time when ASSIGNED/ARRIVING (driver has accepted but not arrived)
      if (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) {
          setElapsedTime(0); // Reset searching timer
          
          // Count from confirmedAt (when driver accepted)
          let startTime: number | undefined = activeRide.confirmedAt;
          
          // Safety check: if confirmedAt is missing or invalid, use current time
          const now = Date.now();
          if (!startTime || startTime > now || startTime < now - (24 * 60 * 60 * 1000)) {
              // If confirmedAt is invalid or more than 24 hours ago, use current time
              startTime = now;
          }
          
          const updateArrivingElapsed = () => {
              const currentTime = Date.now();
              const elapsed = Math.max(0, Math.floor((currentTime - startTime!) / 1000)); // Convert to seconds, ensure non-negative
              setArrivingElapsedTime(elapsed);
          };

          updateArrivingElapsed(); // Update immediately
          const timer = setInterval(updateArrivingElapsed, 1000); // Update every second
          
          return () => clearInterval(timer);
      }
      
      // Track trip duration when ON_TRIP (already picked up)
      if (activeRide.status === BuggyStatus.ON_TRIP && activeRide.pickedUpAt) {
          setElapsedTime(0); // Reset searching timer
          setArrivingElapsedTime(0); // Reset arriving timer
          
          // Force re-render every second to update trip duration display
          const timer = setInterval(() => {
              // Trigger re-render by updating state (component will recalculate trip duration)
              setElapsedTime(prev => prev === 0 ? 1 : 0); // Toggle to trigger re-render
          }, 1000);
          
          return () => clearInterval(timer);
      }
      
      // Reset both timers for other statuses
      setElapsedTime(0);
      setArrivingElapsedTime(0);
  }, [activeRide]);


  // Handler to set destination
  const handleSetDestination = (dest: string) => {
    if (!activeRide) {
      setDestination(dest);
    }
  };

  const handleBook = async () => {
    if (!destination || isBooking) return; // Prevent multiple submissions
    
    setIsBooking(true); // Set booking state immediately to prevent double-click
    try {
      const newRide = await requestRide(user.lastName, user.roomNumber, pickup, destination);
      setActiveRide(newRide);
      setDestination(''); // Clear destination after booking
    } catch (error) {
      console.error('Failed to request ride:', error);
      alert('Failed to request ride. Please try again.');
    } finally {
      // Reset booking state after a short delay to prevent rapid re-clicks
      setTimeout(() => {
        setIsBooking(false);
      }, 1000);
    }
  };

  const handleCancel = async () => {
      if (!activeRide) return;

      // Business Logic for Resort Buggy Service:
      // 1. SEARCHING: Can cancel anytime (if waiting > 10 min, show warning)
      // 2. ASSIGNED/ARRIVING: Can cancel ONLY if driver arriving too long (> 15 min) - exceptional case
      // 3. ON_TRIP/COMPLETED: Cannot cancel (already in progress or done)
      
      // Prevent cancelling if already picked up or completed
      if (activeRide.status === BuggyStatus.ON_TRIP || activeRide.status === BuggyStatus.COMPLETED) {
          alert("Cannot cancel ride. Driver has already picked you up.");
          return;
      }
      
      // Allow canceling if driver has accepted BUT arriving too long (> 15 minutes)
      // This is an exceptional case for resort service - if driver is delayed significantly
      if (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) {
          if (arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME) {
              // Driver has been arriving for over 15 minutes - allow cancellation
              const confirmMessage = `Driver has been arriving for over 15 minutes. Are you sure you want to cancel this ride?`;
              if (window.confirm(confirmMessage)) {
                  try {
                      await cancelRide(activeRide.id);
                      setActiveRide(undefined);
                      setElapsedTime(0);
                      setArrivingElapsedTime(0);
                      setDestination(''); // Clear destination
                  } catch (error) {
                      console.error('Failed to cancel ride:', error);
                      alert('Failed to cancel ride. Please try again.');
                  }
              }
          } else {
              // Driver accepted but hasn't been arriving too long yet
              alert("Cannot cancel ride. Driver has already accepted your request.");
          }
          return;
      }
      
      // Only allow canceling if status is SEARCHING (waiting for driver)
      // If waiting too long (over 10 minutes), show warning message
      if (activeRide.status === BuggyStatus.SEARCHING) {
          const confirmMessage = elapsedTime >= MAX_WAIT_TIME 
              ? `You have been waiting for over 10 minutes. Are you sure you want to cancel this ride?`
              : "Are you sure you want to cancel this ride?";
              
          if (window.confirm(confirmMessage)) {
            try {
              await cancelRide(activeRide.id);
              setActiveRide(undefined);
              setElapsedTime(0);
              setArrivingElapsedTime(0);
              setDestination(''); // Clear destination
            } catch (error) {
              console.error('Failed to cancel ride:', error);
              alert('Failed to cancel ride. Please try again.');
            }
          }
      }
  };


  // Use activeRide destination if available, otherwise use selected destination
  const destinationToShow = activeRide?.destination || destination;

  // Filter and search locations
  const filteredLocations = locations.filter(loc => {
    const matchesSearch = !searchQuery || loc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'ALL' || loc.type === filterType;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => a.name.localeCompare(b.name));


  // Determine if ride can be cancelled
  // Business Logic for Resort Buggy Service:
  // - Can cancel when SEARCHING (waiting for driver, no commitment yet)
  // - Can cancel when ASSIGNED/ARRIVING ONLY if driver arriving too long (> 15 min) - exceptional case
  // - Cannot cancel when ON_TRIP/COMPLETED (service already in progress/done)
  const canCancel = activeRide && (
      activeRide.status === BuggyStatus.SEARCHING ||
      ((activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME)
  );

  // Format countdown timer - show elapsed time in MM:SS format
  const formatCountdown = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format timestamp to readable time
  const formatRequestTime = (timestamp: number): string => {
      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
  };

  // Format waiting time
  const formatWaitingTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      if (mins === 0) {
          return `${seconds}s`;
      }
      const secs = seconds % 60;
      if (secs === 0) {
          return `${mins}m`;
      }
      return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20 relative z-0" style={{ paddingBottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))' }}>
      
      {/* Header with gradient and glassmorphism */}
      <div className={`px-3 py-2 text-white shadow-lg backdrop-blur-md bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 flex items-center flex-shrink-0 relative z-10 border-b border-white/20`}>
        <button 
          onClick={onBack} 
          className="mr-2.5 text-white/90 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-all duration-300"
        >
          <Navigation className="w-4 h-4 rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-bold tracking-tight leading-tight">{t('buggy_service')}</h2>
          <p className="text-[10px] text-white/80 mt-0.5 leading-tight">Fast & Convenient Transportation</p>
        </div>
        <Car className="w-5 h-5 text-white/20" />
      </div>



      {/* Status card section - Always visible when there's an active ride */}
      {activeRide && (
        <div 
          className={`mx-3 mt-3 mb-32 rounded-2xl shadow-xl backdrop-blur-lg bg-white/90 border flex-shrink-0 p-3.5 overflow-hidden transition-all duration-500 ${
            activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME
              ? 'border-red-400 border-2 animate-pulse ring-4 ring-red-200'
              : 'border-white/60'
          }`}
          style={{ 
            paddingBottom: 'max(0.875rem, calc(0.875rem + env(safe-area-inset-bottom)))',
            boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3)'
          }}
        >
          <div className="flex flex-col space-y-2.5">
              {/* Status & ETA - Balanced Header */}
              <div className="flex items-center justify-between gap-2.5">
                {/* Status Badge */}
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-500 ${
                  activeRide.status === BuggyStatus.SEARCHING 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : activeRide.status === BuggyStatus.ON_TRIP
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeRide.status === BuggyStatus.SEARCHING ? 'bg-blue-500 animate-ping' :
                    activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING ? 'bg-emerald-500 animate-pulse' :
                    activeRide.status === BuggyStatus.ON_TRIP ? 'bg-purple-500' :
                    'bg-green-500'
                  }`}></div>
                  {activeRide.status === BuggyStatus.SEARCHING && <span>{t('finding_driver')}</span>}
                  {activeRide.status === BuggyStatus.ASSIGNED && <span>{t('driver_assigned')}</span>}
                  {activeRide.status === BuggyStatus.ARRIVING && <span>{t('driver_arriving')}</span>}
                  {activeRide.status === BuggyStatus.ON_TRIP && <span>{t('en_route')}</span>}
                  {activeRide.status === BuggyStatus.COMPLETED && <span>{t('arrived')}</span>}
                </div>
                
                {/* ETA - Balanced */}
                {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && activeRide.eta && (
                  <div className="flex flex-col items-center bg-emerald-50 px-3.5 py-2 rounded-lg border border-emerald-300">
                    <div className="text-2xl font-black text-emerald-700 leading-none">{activeRide.eta}</div>
                    <div className="text-[9px] text-gray-600 font-semibold mt-0.5">MIN</div>
                  </div>
                )}
                
                {/* Trip Duration for ON_TRIP */}
                {activeRide.status === BuggyStatus.ON_TRIP && activeRide.pickedUpAt && (() => {
                  const tripDuration = Math.floor((Date.now() - activeRide.pickedUpAt) / 1000);
                  return (
                    <div className="flex flex-col items-center bg-purple-50 px-3.5 py-2 rounded-lg border border-purple-300">
                      <div className="text-2xl font-black text-purple-700 leading-none">{formatWaitingTime(tripDuration)}</div>
                      <div className="text-[9px] text-gray-600 font-semibold mt-0.5">EN ROUTE</div>
                    </div>
                  );
                })()}
                
                {/* Waiting Time for SEARCHING */}
                {activeRide.status === BuggyStatus.SEARCHING && elapsedTime > 0 && (
                  <div className="flex flex-col items-center bg-blue-50 px-3.5 py-2 rounded-lg border border-blue-200">
                    <div className={`text-2xl font-black leading-none ${
                      elapsedTime >= MAX_WAIT_TIME ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {formatWaitingTime(elapsedTime)}
                    </div>
                    <div className="text-[9px] text-gray-600 font-semibold mt-0.5">WAIT</div>
                  </div>
                )}
              </div>
              
              {/* Route Section - Balanced */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 relative overflow-hidden">
                {/* Pickup */}
                <div className="mb-2">
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
                    activeRide.status === BuggyStatus.ON_TRIP
                      ? 'bg-purple-50 border-purple-300'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white ${
                      activeRide.status === BuggyStatus.ON_TRIP ? 'bg-purple-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm font-semibold text-gray-800 flex-1">{activeRide.pickup}</span>
                  </div>
                </div>
                
                {/* Route Line with Animated Buggy */}
                <div className="relative my-2.5 mx-2">
                  <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 ${
                    activeRide.status === BuggyStatus.ON_TRIP
                      ? 'bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500'
                      : 'bg-gradient-to-r from-gray-300 via-emerald-300 to-emerald-500'
                  }`}></div>
                  
                  {/* Animated Buggy - Coming to pickup */}
                  {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && (
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-1000 ease-out"
                      style={{
                        left: `${Math.min(95, Math.max(5, 5 + (arrivingElapsedTime / Math.max(1, (activeRide.eta ? activeRide.eta * 60 : 300))) * 90))}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="relative bg-emerald-600 p-1.5 rounded-lg shadow-lg border-2 border-white">
                        <Car size={14} className="text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                  )}
                  
                  {/* Animated Buggy - On trip */}
                  {activeRide.status === BuggyStatus.ON_TRIP && activeRide.pickedUpAt && (() => {
                    const tripDuration = Math.floor((Date.now() - activeRide.pickedUpAt) / 1000);
                    const estimatedTripTime = activeRide.eta ? activeRide.eta * 60 : 300;
                    const progress = Math.min(95, Math.max(5, 5 + (tripDuration / estimatedTripTime) * 90));
                    return (
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-1000 ease-out"
                        style={{
                          left: `${progress}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="relative bg-purple-600 p-1.5 rounded-lg shadow-lg border-2 border-white">
                          <Car size={14} className="text-white" strokeWidth={2.5} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Destination */}
                <div>
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
                    activeRide.status === BuggyStatus.ON_TRIP
                      ? 'bg-purple-50 border-purple-300'
                      : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING)
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white ${
                      activeRide.status === BuggyStatus.ON_TRIP
                        ? 'bg-purple-500 animate-pulse'
                        : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING)
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-emerald-500'
                    }`}></div>
                    <span className="text-sm font-bold text-gray-900 flex-1">{activeRide.destination}</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-200">
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, Math.max(15, 100 - (arrivingElapsedTime / Math.max(1, (activeRide.eta ? activeRide.eta * 60 : 300))) * 85))}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {activeRide.status === BuggyStatus.ON_TRIP && activeRide.pickedUpAt && (() => {
                  const tripDuration = Math.floor((Date.now() - activeRide.pickedUpAt) / 1000);
                  const estimatedTripTime = activeRide.eta ? activeRide.eta * 60 : 300;
                  const progress = Math.min(100, Math.max(10, (tripDuration / estimatedTripTime) * 100));
                  return (
                    <div className="mt-2.5 pt-2.5 border-t border-gray-200">
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Consolidated Status Message */}
              {activeRide && (
                <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs ${
                  activeRide.status === BuggyStatus.ON_TRIP
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING)
                    ? arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : arrivingElapsedTime >= ARRIVING_WARNING_TIME
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    activeRide.status === BuggyStatus.ON_TRIP
                      ? 'bg-purple-500 animate-pulse'
                      : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING)
                      ? arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME
                        ? 'bg-red-600 animate-pulse'
                        : arrivingElapsedTime >= ARRIVING_WARNING_TIME
                        ? 'bg-orange-500'
                        : 'bg-emerald-500 animate-pulse'
                      : 'bg-blue-500 animate-pulse'
                  }`}></div>
                  <p className="font-semibold flex-1">
                    {activeRide.status === BuggyStatus.ON_TRIP && `🎉 On the way to ${activeRide.destination}`}
                    {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && 
                      arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME && 
                      'Driver delayed over 15 min. You can cancel if needed.'}
                    {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && 
                      arrivingElapsedTime >= ARRIVING_WARNING_TIME && 
                      arrivingElapsedTime < MAX_ARRIVING_WAIT_TIME && 
                      'Driver arriving for over 5 min. Please wait.'}
                    {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && 
                      arrivingElapsedTime < ARRIVING_WARNING_TIME && 
                      `🚗 Driver ${activeRide.status === BuggyStatus.ASSIGNED ? 'on the way' : 'arriving'}${activeRide.eta ? ` (${activeRide.eta} min)` : ''}`}
                    {activeRide.status === BuggyStatus.SEARCHING && '⏳ Searching for available driver...'}
                  </p>
                </div>
              )}

              {/* CANCEL BUTTON */}
              {canCancel && (
                  <button 
                    onClick={handleCancel}
                    className={`group relative w-full py-3 font-bold rounded-xl transition-all duration-300 flex flex-row items-center justify-center gap-2 text-sm overflow-hidden touch-manipulation shadow-md hover:shadow-lg ${
                        (activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME) ||
                        ((activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME)
                            ? 'bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white hover:from-red-600 hover:via-red-700 hover:to-pink-700'
                            : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-600 hover:from-red-100 hover:to-pink-100 border-2 border-red-200'
                    }`}
                  >
                    <XCircle className="w-5 h-5 flex-shrink-0 relative z-10" />
                    <span className="relative z-10 text-center break-words leading-tight">
                        {activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME 
                            ? `${t('cancel_request')} (Over 10 min)`
                            : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME
                            ? `${t('cancel_request')} (Driver delayed)`
                            : t('cancel_request')
                        }
                    </span>
                  </button>
              )}
            </div>
        </div>
      )}

      {/* Loading State */}
      {(isLoadingRide || isLoadingLocations) && (
        <div className="flex-1 flex items-center justify-center">
          <Loading size="md" message={t('loading') || 'Loading...'} />
        </div>
      )}

      {/* Booking Form - Modern glassmorphism design */}
      {!activeRide && !isLoadingRide && !isLoadingLocations && (
        <div 
          className="mx-3 mt-3 mb-24 rounded-3xl shadow-2xl backdrop-blur-lg bg-white/95 border border-white/60 flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            boxShadow: '0 25px 70px -20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.5)',
            maxHeight: 'calc(100vh - 180px)',
            paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))'
          }}
        >
            {/* Fixed Header Section */}
            <div className="px-4 py-2 flex-shrink-0 space-y-2">
                {/* Title with icon */}
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                    <h3 className="text-base font-bold text-gray-800">{t('where_to')}</h3>
                    <MapPin className="w-4 h-4 text-emerald-600 ml-auto" />
                </div>
            
                {/* Pickup location with modern styling */}
                <div className="relative group">
                    <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Your Location</label>
                    <div className="relative">
                        <LocateFixed className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 w-3.5 h-3.5" />
                        <input 
                            type="text" 
                            value={pickup}
                            readOnly
                            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all cursor-default"
                        />
                    </div>
                </div>

                {/* Search Bar with modern design */}
                <div className="relative group">
                    <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Search Destination</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 group-hover:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={t('search_locations')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all hover:border-gray-300 caret-emerald-600"
                            style={{ caretColor: '#10b981' }}
                        />
                    </div>
                </div>

                {/* Filter Buttons with modern pill design */}
                <div>
                    <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Category</label>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setFilterType('VILLA')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all duration-300 flex items-center gap-1 ${
                                filterType === 'VILLA'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md shadow-blue-300/50'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Building2 className="w-3 h-3" />
                            Villas
                        </button>
                        <button
                            onClick={() => setFilterType('FACILITY')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all duration-300 flex items-center gap-1 ${
                                filterType === 'FACILITY'
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-300/50'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Waves className="w-3 h-3" />
                            Public Areas
                        </button>
                        <button
                            onClick={() => setFilterType('RESTAURANT')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all duration-300 flex items-center gap-1 ${
                                filterType === 'RESTAURANT'
                                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-300/50'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Utensils className="w-3 h-3" />
                            Restaurants
                        </button>
                        <button
                            onClick={() => setFilterType('ALL')}
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-full transition-all duration-300 ${
                                filterType === 'ALL'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-300/50'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All Locations
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Locations Grid - Cinema Seat Style */}
            <div className="flex-1 min-h-0 flex flex-col px-4 pb-3" style={{ maxHeight: 'calc(100vh - 380px)' }}>
                <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                    <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                        {filteredLocations.length} {filterType === 'ALL' ? 'Locations' : filterType.toLowerCase()}
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-gray-100 min-h-0">
                    {filteredLocations.length > 0 ? (
                        <div className="grid grid-cols-5 gap-2">
                            {filteredLocations.map((loc) => (
                                <button
                                    key={loc.id || loc.name}
                                    onClick={() => handleSetDestination(loc.name)}
                                    title={loc.name}
                                    className={`group relative min-h-[80px] h-auto p-1.5 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center ${
                                        destinationToShow === loc.name
                                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-500 shadow-lg shadow-amber-300/50'
                                            : 'bg-white border-gray-300 hover:border-emerald-400 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 hover:shadow-md'
                                    }`}
                                >
                                    {/* Icon */}
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1 flex-shrink-0 transition-all ${
                                        destinationToShow === loc.name 
                                            ? 'bg-white/30' 
                                            : 'bg-gradient-to-br from-emerald-100 to-teal-100 group-hover:from-emerald-200 group-hover:to-teal-200'
                                    }`}>
                                        <MapPin className={`w-3 h-3 ${
                                            destinationToShow === loc.name ? 'text-white' : 'text-emerald-700'
                                        }`} />
                                    </div>
                                    
                                    {/* Name */}
                                    <div className={`text-[10px] font-bold text-center leading-tight px-0.5 break-words ${
                                        destinationToShow === loc.name ? 'text-white' : 'text-gray-800'
                                    }`}>
                                        {loc.name}
                                    </div>
                                    
                                    {/* Selected indicator */}
                                    {destinationToShow === loc.name && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-md">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 px-4">
                            <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-1.5" />
                            <p className="text-xs text-gray-500 font-medium">No locations found</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Try a different search or filter</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Footer Section - Book Button */}
            <div className="p-4 pt-1.5 flex-shrink-0 space-y-1.5 border-t border-gray-100 bg-gradient-to-b from-white/50 to-white/95 sticky bottom-0 z-20">
                {/* Book Button with modern gradient and hover effects */}
                <button 
                    onClick={handleBook}
                    disabled={!destination || isBooking}
                    className={`group relative w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden ${
                        destination && !isBooking
                            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white hover:shadow-emerald-400/50 cursor-pointer' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {destination && !isBooking && (
                        <>
                            {/* Animated gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                        </>
                    )}
                    {isBooking ? (
                        <>
                            <Loader2 className="w-4 h-4 relative z-10 animate-spin" />
                            <span className="relative z-10">Requesting...</span>
                        </>
                    ) : (
                        <>
                            <Car className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">{t('request_buggy')}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
      )}

      {/* Chat Widget: Connected to 'BUGGY' service - Only show when driver has accepted */}
      {activeRide && activeRide.status !== BuggyStatus.SEARCHING && (
        <ServiceChat 
          serviceType="BUGGY" 
          roomNumber={user.roomNumber} 
          label={driverName}
        />
      )}

      {/* Notification Toast */}
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

    </div>
  );
};

export default BuggyBooking;
