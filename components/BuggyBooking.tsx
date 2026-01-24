import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Car, Navigation, LocateFixed, CheckCircle, AlertCircle, Loader2, ChevronDown, Map, Calendar, Clock } from 'lucide-react';
import { BuggyStatus, User, Location } from '../types';
import { getLocations, getDriversWithLocations, updateRide } from '../services/dataService';
import { calculateETAFromDriverToPickup, getDriverCoordinates } from '../services/locationService';
import ServiceChat from './ServiceChat';
import { useTranslation } from '../contexts/LanguageContext';
import Loading from './Loading';
import LocationDetectionModal from './LocationDetectionModal';
import { RideStatusCard } from './RideStatusCard';
import { LocationPickerModal } from './LocationPickerModal';
import { useRideStatus } from '../hooks/useRideStatus';
import { useRideTimers } from '../hooks/useRideTimers';
import { useRideBooking } from '../hooks/useRideBooking';
import { useDriverName } from '../hooks/useDriverName';
import { useBuggyLocation } from '../hooks/useBuggyLocation';

interface BuggyBookingProps {
  user: User;
  onBack: () => void;
}

const BuggyBooking: React.FC<BuggyBookingProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [pickup, setPickup] = useState<string>(`Villa ${user.roomNumber}`);
  const [showChat, setShowChat] = useState(false);
  const [destination, setDestination] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' | 'warning' } | null>(null);
  const [recentLocations, setRecentLocations] = useState<string[]>(() => {
    const saved = localStorage.getItem('buggy_recent_locations');
    return saved ? JSON.parse(saved) : [];
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Sound notification state
  const [soundEnabled] = useState(() => {
    const saved = localStorage.getItem('guest_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Play notification sound
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
    } catch {
      // Notification sound optional; fail silently
    }
  }, [soundEnabled]);

  // Use hooks for ride management
  const { activeRide, isLoading: isLoadingRide, sharedRidesInfo, previousStatus } = useRideStatus({
    roomNumber: user.roomNumber,
    onNotification: (message, type) => setNotification({ message, type }),
    playNotificationSound
  });

  const { elapsedTime, arrivingElapsedTime } = useRideTimers(activeRide);
  const driverName = useDriverName(activeRide);
  const { isBooking, bookRide, cancelRide: cancelRideRequest } = useRideBooking({
    user,
    onRideCreated: (ride) => {
      setDestination('');
      setGuestCount(1);
      setNotes('');
    },
    onRideCancelled: () => {
      setDestination('');
    }
  });

  const locationDetectionAttemptedRef = useRef<boolean>(false);
  const pickupDropdownRef = useRef<HTMLDivElement>(null);
  const destinationDropdownRef = useRef<HTMLDivElement>(null);

  // Use buggy location hook for GPS detection
  const { isDetecting: isDetectingLocation, detectedLocation } = useBuggyLocation(
    locations,
    !isLoadingLocations && locations.length > 0 && !locationDetectionAttemptedRef.current
  );

  // Handle GPS detection result
  useEffect(() => {
    if (isDetectingLocation) {
      setShowGpsModal(true);
      locationDetectionAttemptedRef.current = true;
    } else if (detectedLocation) {
      setPickup(detectedLocation.name);
      setShowGpsModal(false);
    } else if (!isDetectingLocation && locationDetectionAttemptedRef.current) {
      setShowGpsModal(false);
    }
  }, [isDetectingLocation, detectedLocation]);

  // Load locations on mount
  useEffect(() => {
    setIsLoadingLocations(true);
    getLocations()
      .then(setLocations)
      .catch(() => {})
      .finally(() => setIsLoadingLocations(false));
  }, []);

  // Removed click outside handlers - now using LocationPickerModal which handles its own closing



  // Real-time ETA calculation and update
  useEffect(() => {
    const updateETA = async () => {
      // Only update ETA for rides that are ASSIGNED or ARRIVING (driver is on the way)
      if (!activeRide ||
        !(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) ||
        !activeRide.driverId) {
        return;
      }

      try {
        // Fetch driver location
        const drivers = await getDriversWithLocations();
        const driver = drivers.find(d => d.id === activeRide.driverId);

        if (!driver) return;

        // Get driver coordinates
        const driverCoords = getDriverCoordinates(driver, locations);
        if (!driverCoords) return;

        // Calculate ETA
        const eta = calculateETAFromDriverToPickup(
          driverCoords.lat,
          driverCoords.lng,
          activeRide.pickup,
          locations
        );

        // Only update if ETA is different (to avoid unnecessary API calls)
        if (eta !== null && eta !== activeRide.eta) {
          try {
            await updateRide({
              id: activeRide.id,
              eta: eta
            });
            // ETA will be updated automatically by useRideStatus hook on next poll
          } catch {
            // ETA update optional; skip on error
          }
        }
      } catch {
        // ETA calculation optional; skip on error
      }
    };

    // Update ETA every 10 seconds (less frequent than location updates)
    const etaInterval = setInterval(updateETA, 10000);
    return () => clearInterval(etaInterval);
  }, [activeRide, locations]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);




  const MAX_WAIT_TIME = 10 * 60;
  const MAX_ARRIVING_WAIT_TIME = 15 * 60;

  // Handlers
  const handleSetDestination = (dest: string) => {
    if (!activeRide) {
      if (dest === pickup) {
        setNotification({
          message: t('pickup_destination_same_error'),
          type: 'warning'
        });
        return;
      }
      setDestination(dest);
      // Save to recent locations
      const updated = [dest, ...recentLocations.filter(loc => loc !== dest)].slice(0, 5);
      setRecentLocations(updated);
      localStorage.setItem('buggy_recent_locations', JSON.stringify(updated));
    }
  };

  const handleBook = async () => {
    if (!destination || isBooking) return;
    if (pickup === destination) {
      setNotification({
        message: t('pickup_destination_same_error'),
        type: 'warning'
      });
      return;
    }
    try {
      await bookRide(pickup, destination, guestCount || 1, notes || undefined);
    } catch {
      setNotification({ message: t('failed_to_request_ride'), type: 'warning' });
    }
  };

  const handleCancel = async () => {
    if (!activeRide) return;
    if (activeRide.status === BuggyStatus.ON_TRIP || activeRide.status === BuggyStatus.COMPLETED) {
      setNotification({ message: t('cannot_cancel_picked_up'), type: 'warning' });
      return;
    }
    if (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) {
      // Allow cancel after 5 minutes (ARRIVING_WARNING_TIME)
      if (arrivingElapsedTime >= ARRIVING_WARNING_TIME) {
        const confirmMessage = arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME
          ? t('driver_delayed_cancel')
          : t('confirm_cancel_ride');
        if (window.confirm(confirmMessage)) {
          try {
            const cancelled = await cancelRideRequest(activeRide.id);
            if (cancelled) {
              setNotification({ message: `✅ ${t('ride_cancelled_success')}`, type: 'success' });
            }
          } catch {
            setNotification({ message: t('failed_to_cancel_ride'), type: 'warning' });
          }
        }
      } else {
        setNotification({ message: t('cannot_cancel_assigned'), type: 'warning' });
      }
      return;
    }
    if (activeRide.status === BuggyStatus.SEARCHING) {
      const confirmMessage = elapsedTime >= MAX_WAIT_TIME
        ? t('waiting_long_cancel')
        : t('confirm_cancel_ride');
      if (window.confirm(confirmMessage)) {
        try {
          const cancelled = await cancelRideRequest(activeRide.id);
          if (cancelled) {
            setNotification({ message: `✅ ${t('ride_cancelled_success')}`, type: 'success' });
          }
        } catch {
          setNotification({ message: t('failed_to_cancel_ride'), type: 'warning' });
        }
      }
    }
  };

  // Allow cancel:
  // 1. When SEARCHING (always)
  // 2. When ASSIGNED/ARRIVING and waiting over 5 minutes (ARRIVING_WARNING_TIME) - user can cancel if driver is delayed
  const ARRIVING_WARNING_TIME = 5 * 60; // 5 minutes
  const canCancel = activeRide && (
    activeRide.status === BuggyStatus.SEARCHING ||
    ((activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= ARRIVING_WARNING_TIME)
  );

  const destinationToShow = activeRide?.destination || destination;

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

  // Prevent body scroll when component mounts
  useEffect(() => {
    const originalBodyOverflow = window.getComputedStyle(document.body).overflow;
    const originalHtmlOverflow = window.getComputedStyle(document.documentElement).overflow;
    const originalBodyPosition = window.getComputedStyle(document.body).position;
    const originalBodyWidth = window.getComputedStyle(document.body).width;
    const originalBodyHeight = window.getComputedStyle(document.body).height;
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';
    
    // Add CSS to hide scrollbars globally
    const style = document.createElement('style');
    style.id = 'buggy-no-scroll';
    style.textContent = `
      body::-webkit-scrollbar,
      html::-webkit-scrollbar,
      *::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      body {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.width = originalBodyWidth;
      document.body.style.height = originalBodyHeight;
      document.body.style.top = '';
      document.body.style.left = '';
      
      // Remove the style
      const styleElement = document.getElementById('buggy-no-scroll');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // Prevent scroll on wheel and touch events
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: WheelEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // Allow scroll only inside scrollable areas (like message area in chat)
      const scrollableArea = target.closest('.overflow-y-auto');
      if (!scrollableArea) {
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', preventScroll, { passive: false });
    container.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      container.removeEventListener('wheel', preventScroll);
      container.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        overflowY: 'hidden',
        overflowX: 'hidden',
        zIndex: 1,
        touchAction: 'none',
        WebkitOverflowScrolling: 'touch',
        // Hide scrollbar completely
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none' // IE and Edge
      } as React.CSSProperties}
      onWheel={(e) => {
        const target = e.target as HTMLElement;
        const scrollableArea = target.closest('.overflow-y-auto');
        if (!scrollableArea) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onTouchMove={(e) => {
        const target = e.target as HTMLElement;
        const scrollableArea = target.closest('.overflow-y-auto');
        if (!scrollableArea) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >

      {/* New Header with light blue gradient */}
      <div className="bg-gradient-to-b from-blue-100 via-blue-50 to-white flex-shrink-0 relative overflow-hidden">
        {/* Navigation Bar */}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-gray-800 hover:bg-white/50 rounded-full p-1.5 transition-all duration-300"
          >
            <Navigation className="w-5 h-5 rotate-180" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">{t('buggy_service') || 'Di chuyển'}</h2>
          <div className="w-9"></div>
        </div>

      </div>



      {/* Status card section */}
      {activeRide && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0" style={{ maxHeight: 'calc(100% - 80px)' }}>
          <div className="flex-1 overflow-y-auto px-3 py-3" style={{ maxHeight: '100%', overflowX: 'hidden' }}>
            <RideStatusCard
              activeRide={activeRide}
              elapsedTime={elapsedTime}
              arrivingElapsedTime={arrivingElapsedTime}
              sharedRidesInfo={sharedRidesInfo}
              canCancel={canCancel}
              onCancel={handleCancel}
              driverName={driverName}
              roomNumber={user.roomNumber}
              onChatToggle={setShowChat}
              isChatOpen={showChat}
            />
          </div>
        </div>
      )}

      {/* Old status card - replaced by RideStatusCard component */}
      {false && activeRide && (
        <div
          className={`mx-3 mt-3 mb-32 rounded-2xl shadow-xl backdrop-blur-lg bg-white/90 border flex-shrink-0 p-3.5 overflow-hidden transition-all duration-500 ${activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME
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
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-500 ${activeRide.status === BuggyStatus.SEARCHING
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : activeRide.status === BuggyStatus.ON_TRIP
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeRide.status === BuggyStatus.SEARCHING ? 'bg-blue-500 animate-ping' :
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

              {/* Waiting Time for SEARCHING - Disabled to avoid customer anxiety */}
              {/* {activeRide.status === BuggyStatus.SEARCHING && elapsedTime > 0 && (
                  <div className="flex flex-col items-center bg-blue-50 px-3.5 py-2 rounded-lg border border-blue-200">
                    <div className={`text-2xl font-black leading-none ${
                      elapsedTime >= MAX_WAIT_TIME ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {formatWaitingTime(elapsedTime)}
                    </div>
                    <div className="text-[9px] text-gray-600 font-semibold mt-0.5">WAIT</div>
                  </div>
                )} */}
            </div>

            {/* Route Section - Balanced */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 relative overflow-hidden">
              {/* Pickup */}
              <div className="mb-2">
                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${activeRide.status === BuggyStatus.ON_TRIP
                  ? 'bg-purple-50 border-purple-300'
                  : 'bg-white border-gray-200'
                  }`}>
                  <div className={`w-2.5 h-2.5 rounded-full border-2 border-white ${activeRide.status === BuggyStatus.ON_TRIP ? 'bg-purple-500' : 'bg-gray-400'
                    }`}></div>
                  <span className="text-sm font-semibold text-gray-800 flex-1">{activeRide.pickup}</span>
                </div>
              </div>

              {/* Route Line with Animated Buggy */}
              <div className="relative my-2.5 mx-2">
                <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 ${activeRide.status === BuggyStatus.ON_TRIP
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
                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${activeRide.status === BuggyStatus.ON_TRIP
                  ? 'bg-purple-50 border-purple-300'
                  : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING)
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-white border-gray-200'
                  }`}>
                  <div className={`w-2.5 h-2.5 rounded-full border-2 border-white ${activeRide.status === BuggyStatus.ON_TRIP
                    ? 'bg-purple-500 animate-pulse'
                    : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING)
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-emerald-500'
                    }`}></div>
                  <span className="text-sm font-bold text-gray-900 flex-1">{activeRide.destination}</span>
                </div>
              </div>

              {/* Guest Count & Shared Ride Info */}
              <div className="mt-2.5 pt-2.5 border-t border-gray-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="font-semibold">👥</span>
                  <span>{activeRide.guestCount || 1} {activeRide.guestCount === 1 ? 'guest' : 'guests'}</span>
                </div>
                {sharedRidesInfo && sharedRidesInfo.sharedCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-200">
                    <span className="font-semibold">🔗</span>
                    <span>Shared ride ({sharedRidesInfo.totalGuests} total guests)</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {activeRide.notes && activeRide.notes.trim() && (
                <div className="mt-2.5 pt-2.5 border-t border-gray-200">
                  <div className="flex items-start gap-2 text-xs text-gray-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                    <span className="font-semibold text-amber-600 flex-shrink-0">📝</span>
                    <span className="flex-1">{activeRide.notes}</span>
                  </div>
                </div>
              )}

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
              <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs ${activeRide.status === BuggyStatus.ON_TRIP
                ? 'bg-purple-50 border-purple-200 text-purple-700'
                : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING)
                  ? arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : arrivingElapsedTime >= ARRIVING_WARNING_TIME
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                <div className={`w-2 h-2 rounded-full ${activeRide.status === BuggyStatus.ON_TRIP
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
                className={`group relative w-full py-3 font-bold rounded-xl transition-all duration-300 flex flex-row items-center justify-center gap-2 text-sm overflow-hidden touch-manipulation shadow-md hover:shadow-lg ${(activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME) ||
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

      {/* Booking Form - New Design */}
      {!activeRide && !isLoadingRide && !isLoadingLocations && (
        <div 
          className="flex-1 overflow-y-auto px-4 py-3 min-h-0"
          style={{ maxHeight: 'calc(100% - 80px)', overflowX: 'hidden' }}
        >

          {/* Recent Locations Section */}
          {recentLocations.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2">{t('recent_locations')}</h3>
              <div className="space-y-2">
                {recentLocations.map((loc, index) => {
                  const match = locations.find(l => l.name === loc);
                  const typeLabel = match?.type === 'VILLA' ? t('location_type_villa') : match?.type === 'FACILITY' ? t('location_type_facility') : match?.type === 'RESTAURANT' ? t('location_type_restaurant') : null;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSetDestination(loc)}
                      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left active:scale-[0.99] touch-manipulation"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{loc}</div>
                        {typeLabel && (
                          <div className="text-xs text-gray-500 truncate">{typeLabel}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}


          {/* Additional Booking Options */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 space-y-3">
            {/* Pickup location */}
            <div className="relative group" ref={pickupDropdownRef}>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('pickup_point')}</label>
              {isDetectingLocation ? (
                <div className="relative">
                  <LocateFixed className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 w-4 h-4 animate-pulse" />
                  <input
                    type="text"
                    value={t('detecting_location')}
                    readOnly
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg text-gray-600 font-semibold focus:outline-none transition-all cursor-default"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowPickupDropdown(!showPickupDropdown)}
                  className="w-full relative flex items-center justify-between pl-10 pr-3 py-2.5 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg text-gray-900 font-semibold hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <LocateFixed className="absolute left-3 text-blue-600 w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{pickup}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-blue-600 flex-shrink-0 transition-transform duration-200 ${showPickupDropdown ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {/* Destination location */}
            <div className="relative group">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('destination')}</label>
              <button
                onClick={() => setShowDestinationDropdown(true)}
                className={`w-full relative flex items-center justify-between pl-10 pr-3 py-2.5 text-sm border-2 rounded-lg font-semibold hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all ${
                  destination
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-gray-900'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MapPin className="absolute left-3 text-emerald-600 w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{destination || t('select_destination')}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              </button>
            </div>

            {/* Guest Count & Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('number_of_guests')}</label>
                <div className="relative">
                  <select
                    value={guestCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      if (value >= 1 && value <= 7) {
                        setGuestCount(value);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border-2 border-gray-200 rounded-lg text-gray-900 font-semibold hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? t('guest') : t('guests')}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
                    <span className="text-sm">👥</span>
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
              <div className="relative group">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('notes_optional')}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('luggage_special_requests')}
                  maxLength={100}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-200 rounded-lg text-gray-900 font-medium hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Book Button */}
            <button
              onClick={handleBook}
              disabled={!destination || isBooking}
              className={`w-full py-3.5 rounded-xl font-bold text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                destination && !isBooking
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white hover:shadow-emerald-400/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
              }`}
            >
              {isBooking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('processing')}</span>
                </>
              ) : (
                <>
                  <Car className="w-5 h-5" />
                  <span>{t('request_buggy')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Location Pickers */}
      <LocationPickerModal
        isOpen={showPickupDropdown}
        title={t('select_pickup_location')}
        locations={locations}
        selectedLocation={pickup}
        excludeLocation={destination}
        onSelect={setPickup}
        onClose={() => setShowPickupDropdown(false)}
        onValidationError={(msg) => setNotification({ message: msg, type: 'warning' })}
        themeColor="blue"
      />
      <LocationPickerModal
        isOpen={showDestinationDropdown}
        title={t('select_destination_location')}
        locations={locations}
        selectedLocation={destinationToShow}
        excludeLocation={pickup}
        onSelect={handleSetDestination}
        onClose={() => setShowDestinationDropdown(false)}
        onValidationError={(msg) => setNotification({ message: msg, type: 'warning' })}
        themeColor="emerald"
      />

      {/* Old Pickup Location Modal - replaced by LocationPickerModal */}
      {false && showPickupDropdown && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setShowPickupDropdown(false);
              setPickupSearchQuery('');
            }}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <LocateFixed className="w-5 h-5 text-blue-600" />
                  Select Pickup Location
                </h3>
                <button
                  onClick={() => {
                    setShowPickupDropdown(false);
                    setPickupSearchQuery('');
                  }}
                  className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Pickup Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search pickup location..."
                    value={pickupSearchQuery}
                    onChange={(e) => setPickupSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all hover:border-blue-300 caret-blue-600"
                    style={{ caretColor: '#2563eb' }}
                  />
                </div>

                {/* Pickup Filter Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setPickupFilterType('VILLA')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${pickupFilterType === 'VILLA'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-300/50'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Villas
                  </button>
                  <button
                    onClick={() => setPickupFilterType('FACILITY')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${pickupFilterType === 'FACILITY'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-300/50'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <Waves className="w-3.5 h-3.5" />
                    Facilities
                  </button>
                  <button
                    onClick={() => setPickupFilterType('RESTAURANT')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${pickupFilterType === 'RESTAURANT'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-300/50'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    Restaurants
                  </button>
                  <button
                    onClick={() => setPickupFilterType('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${pickupFilterType === 'ALL'
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-300/50'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    All
                  </button>
                </div>

                {/* Pickup Locations Grid */}
                <div className="max-h-[50vh] overflow-y-auto border-2 border-blue-200 rounded-lg bg-white p-3 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100">
                  {locations
                    .filter(loc => {
                      const matchesSearch = !pickupSearchQuery || loc.name.toLowerCase().includes(pickupSearchQuery.toLowerCase());
                      const matchesFilter = pickupFilterType === 'ALL' || loc.type === pickupFilterType;
                      return matchesSearch && matchesFilter;
                    })
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .length > 0 ? (
                    <div className="grid grid-cols-5 gap-2">
                      {locations
                        .filter(loc => {
                          const matchesSearch = !pickupSearchQuery || loc.name.toLowerCase().includes(pickupSearchQuery.toLowerCase());
                          const matchesFilter = pickupFilterType === 'ALL' || loc.type === pickupFilterType;
                          return matchesSearch && matchesFilter;
                        })
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((loc) => {
                          const isSameAsDestination = loc.name === destination;
                          return (
                            <button
                              key={loc.id || loc.name}
                              onClick={() => {
                                // Check if selected pickup is the same as destination
                                if (isSameAsDestination) {
                                  setNotification({
                                    message: 'Pickup and destination cannot be the same. Please choose a different location.',
                                    type: 'warning'
                                  });
                                  setShowPickupDropdown(false);
                                  setPickupSearchQuery('');
                                  return;
                                }
                                setPickup(loc.name);
                                setShowPickupDropdown(false);
                                setPickupSearchQuery('');
                              }}
                              title={isSameAsDestination ? 'Cannot select same as destination location' : loc.name}
                              disabled={isSameAsDestination}
                              className={`group relative min-h-[80px] h-auto p-1.5 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center ${pickup === loc.name
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-500 shadow-lg shadow-blue-300/50'
                                : isSameAsDestination
                                  ? 'bg-red-50 border-red-200 opacity-60 cursor-not-allowed'
                                  : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:shadow-md'
                                }`}
                            >
                              {/* Icon */}
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1 flex-shrink-0 transition-all ${pickup === loc.name
                                ? 'bg-white/30'
                                : isSameAsDestination
                                  ? 'bg-red-100'
                                  : 'bg-gradient-to-br from-blue-100 to-indigo-100 group-hover:from-blue-200 group-hover:to-indigo-200'
                                }`}>
                                <MapPin className={`w-3 h-3 ${pickup === loc.name ? 'text-white' : isSameAsDestination ? 'text-red-600' : 'text-blue-700'
                                  }`} />
                              </div>

                              {/* Name */}
                              <div className={`text-[10px] font-bold text-center leading-tight px-0.5 break-words ${pickup === loc.name ? 'text-white' : isSameAsDestination ? 'text-red-600' : 'text-gray-800'
                                }`}>
                                {loc.name}
                              </div>

                              {/* Selected indicator */}
                              {pickup === loc.name && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-md">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-gray-500">
                      No locations found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Old Destination Location Modal - replaced by LocationPickerModal */}
      {false && showDestinationDropdown && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setShowDestinationDropdown(false);
              setSearchQuery('');
            }}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Select Destination
                </h3>
                <button
                  onClick={() => {
                    setShowDestinationDropdown(false);
                    setSearchQuery('');
                  }}
                  className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Destination Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all hover:border-emerald-300 caret-emerald-600"
                    style={{ caretColor: '#10b981' }}
                  />
                </div>

                {/* Destination Filter Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterType('VILLA')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${filterType === 'VILLA'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md shadow-blue-300/50'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Villas
                  </button>
                  <button
                    onClick={() => setFilterType('FACILITY')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${filterType === 'FACILITY'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-300/50'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <Waves className="w-3.5 h-3.5" />
                    Facilities
                  </button>
                  <button
                    onClick={() => setFilterType('RESTAURANT')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${filterType === 'RESTAURANT'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-300/50'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    Restaurants
                  </button>
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${filterType === 'ALL'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-300/50'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    All
                  </button>
                </div>

                {/* Destination Locations Grid */}
                <div className="max-h-[50vh] overflow-y-auto border-2 border-emerald-200 rounded-lg bg-white p-3 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-gray-100">
                  {filteredLocations.length > 0 ? (
                    <div className="grid grid-cols-5 gap-2">
                      {filteredLocations.map((loc) => {
                        const isSameAsPickup = loc.name === pickup;
                        return (
                          <button
                            key={loc.id || loc.name}
                            onClick={() => {
                              handleSetDestination(loc.name);
                              setShowDestinationDropdown(false);
                              setSearchQuery('');
                            }}
                            title={isSameAsPickup ? 'Cannot select same as pickup location' : loc.name}
                            disabled={isSameAsPickup}
                            className={`group relative min-h-[80px] h-auto p-1.5 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center ${destinationToShow === loc.name
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-500 shadow-lg shadow-amber-300/50'
                              : isSameAsPickup
                                ? 'bg-red-50 border-red-200 opacity-60 cursor-not-allowed'
                                : 'bg-white border-gray-300 hover:border-emerald-400 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 hover:shadow-md'
                              }`}
                          >
                            {/* Icon */}
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1 flex-shrink-0 transition-all ${destinationToShow === loc.name
                              ? 'bg-white/30'
                              : isSameAsPickup
                                ? 'bg-red-100'
                                : 'bg-gradient-to-br from-emerald-100 to-teal-100 group-hover:from-emerald-200 group-hover:to-teal-200'
                              }`}>
                              <MapPin className={`w-3 h-3 ${destinationToShow === loc.name ? 'text-white' : isSameAsPickup ? 'text-red-600' : 'text-emerald-700'
                                }`} />
                            </div>

                            {/* Name */}
                            <div className={`text-[10px] font-bold text-center leading-tight px-0.5 break-words ${destinationToShow === loc.name ? 'text-white' : isSameAsPickup ? 'text-red-600' : 'text-gray-800'
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
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-gray-500">
                      No locations found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Chat Widget: Connected to 'BUGGY' service - Only show when driver has accepted */}
      {activeRide && activeRide.status !== BuggyStatus.SEARCHING && showChat && (
        <ServiceChat
          serviceType="BUGGY"
          roomNumber={user.roomNumber}
          label={driverName}
          hideFloatingButton={true}
          isOpen={showChat}
          onToggle={setShowChat}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-5 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl max-w-sm ${
          notification.type === 'success' ? 'bg-emerald-500' :
          notification.type === 'info' ? 'bg-blue-500' :
          'bg-amber-500'
        } text-white`}>
          {notification.type === 'warning' ? <AlertCircle size={20} className="flex-shrink-0" /> : <CheckCircle size={20} className="flex-shrink-0" />}
          <span className="font-semibold text-sm">{notification.message}</span>
        </div>
      )}

      {/* GPS Location Detection Modal */}
      <LocationDetectionModal
        isOpen={showGpsModal}
        onCancel={() => {
          setShowGpsModal(false);
        }}
        onManualSelect={() => {
          setShowGpsModal(false);
          setShowPickupDropdown(true);
        }}
      />

    </div>
  );
};

export default BuggyBooking;
