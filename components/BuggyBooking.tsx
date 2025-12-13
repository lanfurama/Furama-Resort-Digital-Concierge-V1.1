
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Clock, Car, Navigation, Star, LocateFixed, XCircle, Search, Utensils, Coffee, Waves, Building2, CheckCircle, Sparkles } from 'lucide-react';
import { BuggyStatus, User, RideRequest, Location } from '../types';
import { getLocations, requestRide, getActiveRideForUser, cancelRide, rateServiceRequest, getRides } from '../services/dataService';
import { THEME_COLORS, RESORT_CENTER } from '../constants';
import ServiceChat from './ServiceChat';
import { useTranslation } from '../contexts/LanguageContext';

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
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Time elapsed in seconds (for SEARCHING)
  const [arrivingElapsedTime, setArrivingElapsedTime] = useState<number>(0); // Time elapsed since driver accepted (for ASSIGNED/ARRIVING)
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search query for locations
  const [filterType, setFilterType] = useState<'ALL' | 'VILLA' | 'FACILITY' | 'RESTAURANT'>('ALL'); // Filter by location type
  
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
  
  // Track which ride ID we've already shown completion modal for
  const completedRideIdRef = useRef<string | null>(null);
  
  const MAX_WAIT_TIME = 10 * 60; // 10 minutes in seconds (for SEARCHING status)
  const MAX_ARRIVING_WAIT_TIME = 15 * 60; // 15 minutes in seconds (for ASSIGNED/ARRIVING status - driver arriving too long)
  const ARRIVING_WARNING_TIME = 5 * 60; // 5 minutes in seconds (for ASSIGNED/ARRIVING status - show red warning)
  
  // Load locations on mount
  useEffect(() => {
    getLocations().then(setLocations).catch(console.error);
  }, []);


  // Load active ride on mount and polling for ride updates
  useEffect(() => {
      const checkStatus = async () => {
          // Don't check if modal is showing
          if (showCompletionModal || completedRide) {
              return;
          }
          
          try {
              const ride = await getActiveRideForUser(user.roomNumber);
              
              // Detect when ride was ON_TRIP but now is undefined (completed)
              // getActiveRideForUser doesn't return completed rides, so if we had ON_TRIP and now it's undefined, it means completed
              if (previousStatus === BuggyStatus.ON_TRIP && !ride && activeRide) {
                  // Check if we've already shown modal for this ride (including if user skipped it)
                  const rideId = activeRide.id;
                  if (rideId && rideId !== completedRideIdRef.current) {
                      // Ride was completed - show modal
                      // Use the last known activeRide data to create completed ride object
                      const completedRideData: RideRequest = {
                          ...activeRide,
                          status: BuggyStatus.COMPLETED,
                          completedAt: Date.now()
                      };
                      // Set ref immediately to prevent duplicate modals
                      completedRideIdRef.current = rideId;
                      setCompletedRide(completedRideData);
                      setShowCompletionModal(true);
                      setNotification({ message: '🎊 Ride completed successfully!', type: 'success' });
                      // Clear activeRide and previousStatus immediately to prevent re-triggering
                      setActiveRide(undefined);
                      setPreviousStatus(null);
                      return; // Exit early to prevent further processing
                  } else {
                      // This ride was already handled (skipped or shown), clear activeRide
                      setActiveRide(undefined);
                      setPreviousStatus(null);
                  }
              }
              
              // Detect status changes for notifications
              if (ride && previousStatus !== null && previousStatus !== ride.status) {
                  if (previousStatus === BuggyStatus.SEARCHING && ride.status === BuggyStatus.ASSIGNED) {
                      setNotification({ message: '🎉 Driver accepted your ride!', type: 'success' });
                  } else if (previousStatus === BuggyStatus.ARRIVING && ride.status === BuggyStatus.ON_TRIP) {
                      setNotification({ message: '✅ You\'ve been picked up!', type: 'success' });
                  }
              }
              
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
      const interval = setInterval(checkStatus, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
  }, [user.roomNumber, previousStatus, activeRide, showCompletionModal, completedRide]);
  
  // Auto-hide notification after 5 seconds
  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => {
              setNotification(null);
          }, 5000);
          return () => clearTimeout(timer);
      }
  }, [notification]);

  // Check for recently completed ride on mount (in case user refreshes page after completion)
  useEffect(() => {
      const checkCompletedRide = async () => {
          if (showCompletionModal || completedRide) return; // Already showing modal
          
          try {
              const allRides = await getRides().catch(() => []);
              // Find most recent completed ride for this user that hasn't been rated
              const recentCompleted = allRides
                  .filter(r => 
                      r.roomNumber === user.roomNumber && 
                      r.status === BuggyStatus.COMPLETED &&
                      (!r.rating || r.rating === 0) &&
                      r.completedAt &&
                      (Date.now() - r.completedAt < 10 * 60 * 1000) // Within last 10 minutes
                  )
                  .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
              
              if (recentCompleted && recentCompleted.id !== completedRideIdRef.current) {
                  completedRideIdRef.current = recentCompleted.id;
                  setCompletedRide(recentCompleted);
                  setShowCompletionModal(true);
                  setNotification({ message: '🎊 Ride completed successfully!', type: 'success' });
              }
          } catch (error) {
              console.error('Failed to check completed ride:', error);
          }
      };
      
      // Only check once on mount, after a short delay to let active ride check complete
      const timer = setTimeout(checkCompletedRide, 2000);
      return () => clearTimeout(timer);
  }, []); // Only run once on mount - don't re-check when modal closes

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
    if (!destination) return;
    try {
      const newRide = await requestRide(user.lastName, user.roomNumber, pickup, destination);
      setActiveRide(newRide);
      setDestination(''); // Clear destination after booking
    } catch (error) {
      console.error('Failed to request ride:', error);
      alert('Failed to request ride. Please try again.');
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

   // Handle rating submission
   const handleSubmitRating = async () => {
       if (!completedRide || rating === 0) {
           alert('Please select a rating before submitting.');
           return;
       }
       
       setIsSubmittingRating(true);
       try {
           await rateServiceRequest(completedRide.id, rating, feedback, 'BUGGY');
           // Mark as handled and clear activeRide to prevent re-triggering
           completedRideIdRef.current = completedRide.id;
           setActiveRide(undefined);
           setPreviousStatus(null);
           setShowCompletionModal(false);
           setCompletedRide(null);
           setRating(0);
           setFeedback('');
           setNotification({ message: '⭐ Thank you for your feedback!', type: 'success' });
       } catch (error) {
           console.error('Failed to submit rating:', error);
           alert('Failed to submit rating. Please try again.');
       } finally {
           setIsSubmittingRating(false);
       }
   };
  
   // Skip rating (close modal without rating)
   const handleSkipRating = () => {
       if (completedRide) {
           // Mark this ride as "skipped" so we don't show modal again
           completedRideIdRef.current = completedRide.id;
           // Clear activeRide and previousStatus to prevent re-triggering
           setActiveRide(undefined);
           setPreviousStatus(null);
       }
       setShowCompletionModal(false);
       setCompletedRide(null);
       setRating(0);
       setFeedback('');
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
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20 relative z-0 pb-24" style={{ paddingBottom: 'max(6rem, calc(6rem + env(safe-area-inset-bottom)))' }}>
      
      {/* Header with gradient and glassmorphism */}
      <div className={`p-3 text-white shadow-lg backdrop-blur-md bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 flex items-center flex-shrink-0 relative z-10 border-b border-white/20`}>
        <button 
          onClick={onBack} 
          className="mr-2.5 text-white/90 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-all duration-300"
        >
          <Navigation className="w-4 h-4 rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold tracking-tight">{t('buggy_service')}</h2>
          <p className="text-[10px] text-white/80 mt-0.5">Fast & Convenient Transportation</p>
        </div>
        <Car className="w-5 h-5 text-white/20" />
      </div>



      {/* Status card section - Always visible when there's an active ride */}
      {activeRide && (
        <div 
          className={`mx-3 mt-3 mb-24 rounded-2xl shadow-xl backdrop-blur-lg bg-white/90 border flex-shrink-0 p-4 overflow-hidden transition-all duration-500 ${
            activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME
              ? 'border-red-400 border-2 animate-pulse ring-4 ring-red-200'
              : 'border-white/60'
          }`}
          style={{ 
            paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))',
            boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3)'
          }}
        >
          <div className="flex flex-col space-y-3">
              {/* Status & ETA - Simplified Header */}
              <div className="flex items-center justify-between gap-3">
                {/* Status Badge with Enhanced Animations */}
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-500 ${
                  activeRide.status === BuggyStatus.SEARCHING 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200 animate-pulse'
                    : activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse'
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
                  {activeRide.status === BuggyStatus.SEARCHING && (
                      <span className="flex items-center gap-1">
                          <span>{t('finding_driver')}</span>
                          <span className="animate-spin">⏳</span>
                      </span>
                  )}
                  {activeRide.status === BuggyStatus.ASSIGNED && (
                      <span className="flex items-center gap-1">
                          <span>{t('driver_assigned')}</span>
                          <span className="animate-bounce">🎉</span>
                      </span>
                  )}
                  {activeRide.status === BuggyStatus.ARRIVING && (
                      <span className="flex items-center gap-1">
                          <span>{t('driver_arriving')}</span>
                          <span className="animate-pulse">🚗</span>
                      </span>
                  )}
                  {activeRide.status === BuggyStatus.ON_TRIP && (
                      <span className="flex items-center gap-1">
                          <span>{t('en_route')}</span>
                          <span className="animate-pulse">✨</span>
                      </span>
                  )}
                  {activeRide.status === BuggyStatus.COMPLETED && (
                      <span className="flex items-center gap-1">
                          <span>{t('arrived')}</span>
                          <span>✅</span>
                      </span>
                  )}
                </div>
                
                {/* ETA - Large & Clear */}
                {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && activeRide.eta && (
                  <div className="flex flex-col items-center bg-emerald-50 px-4 py-2.5 rounded-xl border-2 border-emerald-300">
                    <div className="text-2xl font-black text-emerald-700 leading-none">{activeRide.eta}</div>
                    <div className="text-[9px] text-gray-600 font-semibold mt-0.5">MIN</div>
                  </div>
                )}
                
                {/* Trip Duration for ON_TRIP */}
                {activeRide.status === BuggyStatus.ON_TRIP && activeRide.pickedUpAt && (() => {
                  const tripDuration = Math.floor((Date.now() - activeRide.pickedUpAt) / 1000);
                  return (
                    <div className="flex flex-col items-center bg-purple-50 px-4 py-2.5 rounded-xl border-2 border-purple-300">
                      <div className="text-2xl font-black text-purple-700 leading-none">{formatWaitingTime(tripDuration)}</div>
                      <div className="text-[9px] text-gray-600 font-semibold mt-0.5">EN ROUTE</div>
                    </div>
                  );
                })()}
                
                {/* Waiting Time for SEARCHING */}
                {activeRide.status === BuggyStatus.SEARCHING && elapsedTime > 0 && (
                  <div className="flex flex-col items-center bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200">
                    <div className={`text-2xl font-black leading-none ${
                      elapsedTime >= MAX_WAIT_TIME ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {formatWaitingTime(elapsedTime)}
                    </div>
                    <div className="text-[9px] text-gray-600 font-semibold mt-0.5">WAIT</div>
                  </div>
                )}
              </div>
              
              {/* Route Section - With Animated Buggy */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 relative overflow-hidden">
                {/* Pickup */}
                <div className="mb-2">
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">From</div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
                    activeRide.status === BuggyStatus.ON_TRIP
                      ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
                      activeRide.status === BuggyStatus.ON_TRIP
                        ? 'bg-purple-500'
                        : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm font-semibold text-gray-800 flex-1">{activeRide.pickup}</span>
                    {activeRide.status === BuggyStatus.ON_TRIP && (
                      <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">
                        Picked Up
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Route Line with Animated Buggy */}
                <div className="relative my-3 mx-2">
                  {/* Route Line */}
                  <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 ${
                    activeRide.status === BuggyStatus.ON_TRIP
                      ? 'bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500'
                      : 'bg-gradient-to-r from-gray-300 via-emerald-300 to-emerald-500'
                  }`}></div>
                  
                  {/* Animated Buggy Moving - Coming to pickup */}
                  {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && (
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-1000 ease-out"
                      style={{
                        left: `${Math.min(95, Math.max(5, 5 + (arrivingElapsedTime / Math.max(1, (activeRide.eta ? activeRide.eta * 60 : 300))) * 90))}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="relative">
                        {/* Glow trail */}
                        <div className="absolute -left-2 -right-2 top-1/2 -translate-y-1/2 h-1 bg-emerald-400 blur-sm opacity-50"></div>
                        {/* Buggy icon */}
                        <div className="relative bg-emerald-600 p-1.5 rounded-lg shadow-lg border-2 border-white">
                          <Car size={14} className="text-white" strokeWidth={2.5} />
                        </div>
                        {/* Moving dots effect */}
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-emerald-400 rounded-full animate-ping"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Animated Buggy Moving - On trip (from pickup to destination) */}
                  {activeRide.status === BuggyStatus.ON_TRIP && activeRide.pickedUpAt && (() => {
                    const tripDuration = Math.floor((Date.now() - activeRide.pickedUpAt) / 1000);
                    const estimatedTripTime = activeRide.eta ? activeRide.eta * 60 : 300; // Default 5 minutes
                    const progress = Math.min(95, Math.max(5, 5 + (tripDuration / estimatedTripTime) * 90));
                    return (
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-1000 ease-out"
                        style={{
                          left: `${progress}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="relative">
                          {/* Glow trail */}
                          <div className="absolute -left-2 -right-2 top-1/2 -translate-y-1/2 h-1 bg-purple-400 blur-sm opacity-50"></div>
                          {/* Buggy icon with passengers */}
                          <div className="relative bg-purple-600 p-1.5 rounded-lg shadow-lg border-2 border-white">
                            <Car size={14} className="text-white" strokeWidth={2.5} />
                          </div>
                          {/* Moving dots effect */}
                          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Destination */}
                <div>
                  <div className={`text-[10px] font-bold uppercase mb-1.5 ${
                    activeRide.status === BuggyStatus.ON_TRIP ? 'text-purple-700' : 'text-emerald-700'
                  }`}>To</div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
                    activeRide.status === BuggyStatus.ON_TRIP
                      ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200'
                      : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING)
                      ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
                      activeRide.status === BuggyStatus.ON_TRIP
                        ? 'bg-purple-500 animate-pulse'
                        : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING)
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-emerald-500'
                    }`}></div>
                    <span className="text-sm font-bold text-gray-900 flex-1">{activeRide.destination}</span>
                  </div>
                </div>
                
                {/* Progress Bar - When arriving */}
                {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-emerald-700">Progress</span>
                      <span className="text-[10px] font-semibold text-gray-600">
                        {activeRide.eta ? `${activeRide.eta} min` : 'Calculating...'}
                      </span>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, Math.max(15, 100 - (arrivingElapsedTime / Math.max(1, (activeRide.eta ? activeRide.eta * 60 : 300))) * 85))}%`
                        }}
                      >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Progress Bar - When on trip */}
                {activeRide.status === BuggyStatus.ON_TRIP && activeRide.pickedUpAt && (() => {
                  const tripDuration = Math.floor((Date.now() - activeRide.pickedUpAt) / 1000);
                  const estimatedTripTime = activeRide.eta ? activeRide.eta * 60 : 300;
                  const progress = Math.min(100, Math.max(10, (tripDuration / estimatedTripTime) * 100));
                  return (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-purple-700">Trip Progress</span>
                        <span className="text-[10px] font-semibold text-gray-600">
                          {formatWaitingTime(tripDuration)}
                        </span>
                      </div>
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* CANCEL BUTTON: Modern design with glow effect */}
              {canCancel && (
                  <button 
                    onClick={handleCancel}
                    className={`group relative w-full py-3.5 font-bold rounded-2xl transition-all duration-300 flex flex-row items-center justify-center gap-2 text-sm overflow-hidden touch-manipulation min-h-[52px] shadow-lg hover:shadow-2xl ${
                        (activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME) ||
                        ((activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME)
                            ? 'bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white hover:from-red-600 hover:via-red-700 hover:to-pink-700 shadow-red-300/50'
                            : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-600 hover:from-red-100 hover:to-pink-100 border-2 border-red-200'
                    }`}
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    
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

              {/* Simple notification when driver accepted */}
              {activeRide && (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime < ARRIVING_WARNING_TIME && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <p className="text-xs font-semibold text-emerald-700">
                          Buggy is on the way to pick you up
                      </p>
                  </div>
              )}
              
              {activeRide && (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= ARRIVING_WARNING_TIME && arrivingElapsedTime < MAX_ARRIVING_WAIT_TIME && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-300 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <p className="text-xs text-orange-700 font-semibold">
                          Driver has been arriving for over 5 minutes. Please wait.
                      </p>
                  </div>
              )}
              
              {activeRide && (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-2 border-red-400">
                      <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                      <p className="text-xs text-red-700 font-bold">
                          Driver has been arriving for over 15 minutes. You can cancel if needed.
                      </p>
                  </div>
              )}
              
              {/* Enhanced Notification when picked up and on trip */}
              {activeRide && activeRide.status === BuggyStatus.ON_TRIP && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300 shadow-md animate-in slide-in-from-bottom-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
                      <div className="flex-1">
                          <p className="text-sm font-bold text-purple-800">
                              🎉 You're on the way!
                          </p>
                          <p className="text-xs text-purple-600 mt-0.5">
                              Heading to {activeRide.destination}
                          </p>
                      </div>
                      <Car className="w-5 h-5 text-purple-600 animate-bounce" />
                  </div>
              )}
              
              {/* Enhanced notification when driver assigned */}
              {activeRide && (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-300 shadow-md animate-in slide-in-from-bottom-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                      <div className="flex-1">
                          <p className="text-sm font-bold text-emerald-800">
                              {activeRide.status === BuggyStatus.ASSIGNED ? '🚗 Driver is on the way!' : '📍 Driver is arriving!'}
                          </p>
                          {activeRide.eta && (
                              <p className="text-xs text-emerald-600 mt-0.5">
                                  Estimated arrival: {activeRide.eta} minutes
                              </p>
                          )}
                      </div>
                      <Navigation className="w-5 h-5 text-emerald-600 animate-pulse" />
                  </div>
              )}
            </div>
        </div>
      )}

      {/* Booking Form - Modern glassmorphism design */}
      {!activeRide && !isLoadingRide && (
        <div 
          className="mx-3 mt-3 mb-24 rounded-3xl shadow-2xl backdrop-blur-lg bg-white/95 border border-white/60 flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            boxShadow: '0 25px 70px -20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.5)',
            maxHeight: 'calc(100vh - 200px)',
            paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))'
          }}
        >
            {/* Fixed Header Section */}
            <div className="p-5 pb-4 flex-shrink-0 space-y-4">
                {/* Title with icon */}
                <div className="flex items-center gap-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-800">{t('where_to')}</h3>
                    <MapPin className="w-5 h-5 text-emerald-600 ml-auto" />
                </div>
            
                {/* Pickup location with modern styling */}
                <div className="relative group">
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Your Location</label>
                    <div className="relative">
                        <LocateFixed className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 w-4 h-4" />
                        <input 
                            type="text" 
                            value={pickup}
                            readOnly
                            className="w-full pl-10 pr-4 py-3 text-sm bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all cursor-default"
                        />
                    </div>
                </div>

                {/* Search Bar with modern design */}
                <div className="relative group">
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Search Destination</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={t('search_locations')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all hover:border-gray-300 caret-emerald-600"
                            style={{ caretColor: '#10b981' }}
                        />
                    </div>
                </div>

                {/* Filter Buttons with modern pill design */}
                <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">Category</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterType('ALL')}
                            className={`px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 ${
                                filterType === 'ALL'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-300/50'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All Locations
                        </button>
                        <button
                            onClick={() => setFilterType('VILLA')}
                            className={`px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                                filterType === 'VILLA'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-300/50'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            Villas
                        </button>
                        <button
                            onClick={() => setFilterType('FACILITY')}
                            className={`px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                                filterType === 'FACILITY'
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-300/50'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Waves className="w-3.5 h-3.5" />
                            Facilities
                        </button>
                        <button
                            onClick={() => setFilterType('RESTAURANT')}
                            className={`px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                                filterType === 'RESTAURANT'
                                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-300/50'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Utensils className="w-3.5 h-3.5" />
                            Restaurants
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Locations List */}
            <div className="flex-1 min-h-0 flex flex-col px-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        {filteredLocations.length} {filterType === 'ALL' ? 'Locations' : filterType.toLowerCase()}
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-gray-100">
                    {filteredLocations.map((loc) => (
                        <button
                            key={loc.id || loc.name}
                            onClick={() => handleSetDestination(loc.name)}
                            className={`group w-full text-left p-3 rounded-xl border-2 transition-all duration-300 ${
                                destinationToShow === loc.name
                                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-400 shadow-lg shadow-amber-200/50'
                                    : 'bg-white border-gray-200 hover:border-emerald-400 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                    destinationToShow === loc.name 
                                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg' 
                                        : 'bg-gradient-to-br from-emerald-100 to-teal-100 group-hover:from-emerald-200 group-hover:to-teal-200'
                                }`}>
                                    <MapPin className={`w-5 h-5 ${
                                        destinationToShow === loc.name ? 'text-white' : 'text-emerald-700'
                                    }`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-bold ${
                                        destinationToShow === loc.name ? 'text-amber-900' : 'text-gray-800'
                                    }`}>
                                        {loc.name}
                                    </div>
                                    {loc.type && (
                                        <div className={`text-xs mt-0.5 font-medium capitalize ${
                                            destinationToShow === loc.name ? 'text-amber-600' : 'text-gray-500'
                                        }`}>
                                            {loc.type.toLowerCase()}
                                        </div>
                                    )}
                                </div>
                                
                                {destinationToShow === loc.name && (
                                    <div className="flex-shrink-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                    {filteredLocations.length === 0 && (
                        <div className="text-center py-8 px-4">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 font-medium">No locations found</p>
                            <p className="text-xs text-gray-400 mt-1">Try a different search or filter</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Footer Section - Selected Destination & Book Button */}
            <div className="p-5 pt-4 flex-shrink-0 space-y-3 border-t border-gray-100 bg-gradient-to-b from-white/50 to-white/95">
                {/* Selected Destination Display */}
                {destination && (
                    <div className="relative group animate-in slide-in-from-bottom duration-300">
                        <label className="text-xs font-semibold text-amber-600 mb-1.5 block">Selected Destination</label>
                        <div className="relative overflow-hidden">
                            <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 w-4 h-4 group-hover:rotate-12 transition-transform" />
                            <div className="w-full pl-10 pr-4 py-3 text-sm bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-xl text-gray-800 font-bold shadow-md">
                                {destination}
                            </div>
                            {/* Animated shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        </div>
                    </div>
                )}

                {/* Book Button with modern gradient and hover effects */}
                <button 
                    onClick={handleBook}
                    disabled={!destination}
                    className={`group relative w-full py-4 rounded-2xl font-bold text-base shadow-2xl transition-all duration-300 flex items-center justify-center gap-2.5 overflow-hidden ${
                        destination 
                            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white hover:shadow-emerald-400/50 cursor-pointer' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {destination && (
                        <>
                            {/* Animated gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                        </>
                    )}
                    <Car className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{t('request_buggy')}</span>
                </button>
            </div>
        </div>
      )}

      {/* Chat Widget: Connected to 'BUGGY' service */}
      <ServiceChat 
        serviceType="BUGGY" 
        roomNumber={user.roomNumber} 
        label={t('driver')}
      />

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

      {/* Completion Success Modal with Rating Form */}
      {showCompletionModal && completedRide && (
          <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in"
              onClick={handleSkipRating}
          >
              <div 
                  className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-5 relative"
                  onClick={(e) => e.stopPropagation()}
              >
                  {/* Success Animation Header */}
                  <div className="text-center mb-6">
                      <div className="relative inline-block mb-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                              <CheckCircle size={40} className="text-white" />
                          </div>
                          <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={24} />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Ride Completed!</h2>
                      <p className="text-gray-600 text-sm">
                          You've arrived at <span className="font-semibold text-emerald-600">{completedRide.destination}</span>
                      </p>
                  </div>

                  {/* Rating Section */}
                  <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                          How was your ride experience?
                      </label>
                      <div className="flex justify-center gap-2 mb-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  onMouseEnter={() => setHoveredRating(star)}
                                  onMouseLeave={() => setHoveredRating(0)}
                                  className="transition-transform hover:scale-125 active:scale-95"
                              >
                                  <Star
                                      size={40}
                                      className={`${
                                          star <= (hoveredRating || rating)
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-300'
                                      } transition-all duration-200`}
                                  />
                              </button>
                          ))}
                      </div>
                      {rating > 0 && (
                          <p className="text-center text-sm text-gray-600">
                              {rating === 1 && 'Poor'}
                              {rating === 2 && 'Fair'}
                              {rating === 3 && 'Good'}
                              {rating === 4 && 'Very Good'}
                              {rating === 5 && 'Excellent'}
                          </p>
                      )}
                  </div>

                  {/* Feedback Section */}
                  <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Additional Feedback (Optional)
                      </label>
                      <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Tell us about your experience..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none"
                          rows={3}
                      />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                      <button
                          onClick={handleSkipRating}
                          className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                      >
                          Skip
                      </button>
                      <button
                          onClick={handleSubmitRating}
                          disabled={rating === 0 || isSubmittingRating}
                          className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                              rating === 0 || isSubmittingRating
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
                          }`}
                      >
                          {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default BuggyBooking;
