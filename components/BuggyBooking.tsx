
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Clock, Car, Navigation, Star, LocateFixed, XCircle, Search, Utensils, Coffee, Waves, Building2 } from 'lucide-react';
import { BuggyStatus, User, RideRequest, Location } from '../types';
import { getLocations, requestRide, getActiveRideForUser, cancelRide } from '../services/dataService';
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
          try {
              const ride = await getActiveRideForUser(user.roomNumber);
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
  }, [user.roomNumber]);

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
    <div className="flex flex-col h-full bg-gray-50 relative z-0">
      
      {/* Header */}
      <div className={`p-2.5 text-white shadow-md ${THEME_COLORS.primary} flex items-center flex-shrink-0 relative z-0`}>
        <button onClick={onBack} className="mr-3 text-white hover:text-gray-200">
          <Navigation className="w-5 h-5 rotate-180" />
        </button>
        <h2 className="text-lg font-serif">{t('buggy_service')}</h2>
      </div>



      {/* Status card section - Always visible when there's an active ride */}
      {activeRide && (
        <div 
          className={`bg-white shadow-lg border-t flex-shrink-0 px-3 pt-2 pb-2 md:p-3 overflow-hidden ${
            activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME
              ? 'border-red-500 border-2 shake'
              : 'border-gray-100'
          }`}
          style={{ 
            paddingBottom: 'max(1.4rem, calc(1.4rem + env(safe-area-inset-bottom)))'
          }}
        >
          <div className="flex flex-col space-y-2 md:space-y-3">
              {/* Header Section */}
              <div className="flex flex-row justify-between items-start gap-2 flex-shrink-0">
                 <div className="flex-1 min-w-0 pr-1">
                    <h3 className="font-bold text-sm md:text-lg text-gray-800 leading-tight break-words">
                        {activeRide.status === BuggyStatus.SEARCHING && t('finding_driver')}
                        {activeRide.status === BuggyStatus.ASSIGNED && t('driver_assigned')}
                        {activeRide.status === BuggyStatus.ARRIVING && t('driver_arriving')}
                        {activeRide.status === BuggyStatus.ON_TRIP && t('en_route')}
                        {activeRide.status === BuggyStatus.COMPLETED && t('arrived')}
                    </h3>
                    {/* Request Info */}
                    <div className="flex flex-col gap-0.5 mt-1">
                        <p className="text-[10px] md:text-xs text-gray-500 leading-tight">
                            <span className="font-medium">Room:</span> {activeRide.roomNumber} • <span className="font-medium">Guest:</span> {activeRide.guestName}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500">
                            <span><span className="font-medium">Requested:</span> {formatRequestTime(activeRide.timestamp)}</span>
                            {activeRide.status === BuggyStatus.SEARCHING && elapsedTime > 0 && (
                                <span className={`${elapsedTime >= MAX_WAIT_TIME ? 'text-red-600 font-bold' : ''}`}>
                                    • <span className="font-medium">Waiting:</span> {formatWaitingTime(elapsedTime)}
                                </span>
                            )}
                        </div>
                    </div>
                    {activeRide.status !== BuggyStatus.SEARCHING && (
                        <p className="text-[10px] md:text-sm text-gray-500 flex items-center leading-tight mt-0.5">
                            <Star className="w-3 h-3 md:w-3 md:h-3 text-yellow-400 mr-1 md:mr-1 fill-current flex-shrink-0"/> 
                            <span className="whitespace-nowrap">Buggy #08</span>
                        </p>
                    )}
                 </div>
                 <div className="flex flex-row items-start gap-1.5 md:gap-2 flex-shrink-0">
                    {activeRide.status === BuggyStatus.SEARCHING && elapsedTime > 0 && (
                        <div className="flex flex-col items-end">
                            <div className={`text-sm md:text-xl font-bold leading-none whitespace-nowrap ${
                                elapsedTime >= MAX_WAIT_TIME ? 'text-red-600' : 'text-gray-600'
                            }`}>
                                {formatWaitingTime(elapsedTime)}
                            </div>
                            <div className="text-[8px] md:text-xs text-gray-500 leading-none mt-0.5">Waiting</div>
                        </div>
                    )}
                    {activeRide.status !== BuggyStatus.SEARCHING && activeRide.status !== BuggyStatus.COMPLETED && activeRide.status !== BuggyStatus.ON_TRIP && (
                        <div className="flex flex-col items-end">
                            {activeRide.eta && (
                                <div className="flex flex-col items-end">
                                    <div className={`text-sm md:text-2xl font-bold leading-none whitespace-nowrap ${
                                        (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= ARRIVING_WARNING_TIME
                                            ? 'text-red-600'
                                            : 'text-emerald-600'
                                    }`}>{activeRide.eta} min</div>
                                    <div className="text-[8px] md:text-xs text-gray-500 leading-none mt-0.5">{t('estimated')}</div>
                                </div>
                            )}
                        </div>
                    )}
                 </div>
              </div>
              
              {/* Route Section */}
              <div className="flex flex-row items-start gap-2 md:gap-2 flex-shrink-0">
                 <div className="flex flex-col items-center space-y-0 flex-shrink-0 pt-0.5">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-[1px] h-3 md:h-6 bg-gray-300 my-0.5"></div>
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-600 rounded-full"></div>
                 </div>
                 <div className="flex flex-col space-y-1.5 md:space-y-3 w-full min-w-0 flex-1">
                    <div className="text-xs md:text-sm text-gray-600 bg-gray-50 px-2.5 py-1.5 md:p-2 rounded break-words leading-tight">{activeRide.pickup}</div>
                    <div className="text-xs md:text-sm font-semibold text-gray-800 bg-emerald-50 px-2.5 py-1.5 md:p-2 rounded border border-emerald-100 break-words leading-tight">{activeRide.destination}</div>
                 </div>
              </div>

              {/* CANCEL BUTTON: Visible when SEARCHING or when driver arriving too long */}
              {/* For resort service: Can cancel while searching, or if driver arriving > 15 min */}
              {canCancel && (
                  <button 
                    onClick={handleCancel}
                    className={`w-full py-2 md:py-3 font-semibold rounded-lg transition border flex flex-row items-center justify-center gap-1.5 md:gap-2 text-xs md:text-base flex-shrink-0 touch-manipulation min-h-[44px] ${
                        (activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME) ||
                        ((activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME)
                            ? 'bg-red-500 text-white hover:bg-red-600 border-red-600'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'
                    }`}
                  >
                    <XCircle size={16} className="md:w-[18px] md:h-[18px] flex-shrink-0" />
                    <span className="text-center break-words leading-tight">
                        {activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME 
                            ? `${t('cancel_request')} (Over 10 min)`
                            : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME
                            ? `${t('cancel_request')} (Driver delayed)`
                            : t('cancel_request')
                        }
                    </span>
                  </button>
              )}

              {/* Info message when driver has accepted - cannot cancel yet (unless arriving too long) */}
              {/* For resort service: Once driver commits, guest cannot cancel unless driver delayed > 15 min */}
              {activeRide && (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime < ARRIVING_WARNING_TIME && (
                  <div className="mt-0 text-[10px] md:text-xs text-gray-500 text-center leading-tight px-1 flex-shrink-0">
                      Driver has accepted your request. You cannot cancel this ride.
                  </div>
              )}
              
              {/* Warning message when driver arriving > 5 min but < 15 min - show red warning */}
              {activeRide && (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= ARRIVING_WARNING_TIME && arrivingElapsedTime < MAX_ARRIVING_WAIT_TIME && (
                  <div className="mt-0 text-[10px] md:text-xs text-red-600 text-center leading-tight px-1 flex-shrink-0 font-medium">
                      Driver has been arriving for over 5 minutes. Please wait.
                  </div>
              )}
              
              {/* Warning message when driver arriving too long (> 15 min) - can cancel */}
              {activeRide && (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME && (
                  <div className="mt-0 text-[10px] md:text-xs text-red-600 text-center leading-tight px-1 flex-shrink-0 font-medium">
                      Driver has been arriving for over 15 minutes. You can cancel if needed.
                  </div>
              )}
              
              {/* Info message when ride is in progress or completed */}
              {activeRide && (activeRide.status === BuggyStatus.ON_TRIP || activeRide.status === BuggyStatus.COMPLETED) && (
                  <div className="mt-0 text-[10px] md:text-xs text-gray-500 text-center leading-tight px-1 flex-shrink-0">
                      {activeRide.status === BuggyStatus.ON_TRIP 
                          ? "Ride is in progress. You cannot cancel."
                          : "Ride completed. You cannot cancel."
                      }
                  </div>
              )}
            </div>
        </div>
      )}

      {/* Booking Form - Fixed, always visible when idle */}
      {!activeRide && !isLoadingRide && (
        <div 
          className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] mt-2 relative z-10 p-3 pb-20 md:pb-3 flex-shrink-0 flex flex-col max-h-[80vh] overflow-hidden"
        >
            <div className="space-y-2 flex-shrink-0">
                <h3 className="text-sm md:text-base font-bold text-gray-800">{t('where_to')}</h3>
            
                <div className="relative">
                    <LocateFixed className="absolute left-2 top-2 text-emerald-600 w-3 h-3 md:w-4 md:h-4" />
                    <input 
                        type="text" 
                        value={pickup}
                        readOnly
                        className="w-full pl-7 md:pl-8 pr-3 py-1.5 md:py-2 text-xs md:text-sm bg-emerald-50 border border-emerald-100 rounded-lg text-gray-700 font-medium focus:outline-none"
                    />
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
                    <input
                        type="text"
                        placeholder={t('search_locations')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-7 md:pl-8 pr-3 py-1.5 md:py-2 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-1.5">
                    <button
                        onClick={() => setFilterType('ALL')}
                        className={`px-2 py-1 text-[10px] md:text-xs font-medium rounded-md transition-colors ${
                            filterType === 'ALL'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterType('VILLA')}
                        className={`px-2 py-1 text-[10px] md:text-xs font-medium rounded-md transition-colors ${
                            filterType === 'VILLA'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Villas
                    </button>
                    <button
                        onClick={() => setFilterType('FACILITY')}
                        className={`px-2 py-1 text-[10px] md:text-xs font-medium rounded-md transition-colors ${
                            filterType === 'FACILITY'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Facilities
                    </button>
                    <button
                        onClick={() => setFilterType('RESTAURANT')}
                        className={`px-2 py-1 text-[10px] md:text-xs font-medium rounded-md transition-colors ${
                            filterType === 'RESTAURANT'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Restaurants
                    </button>
                </div>

                {/* Filtered Locations List */}
                <div className="space-y-1.5 flex-1 min-h-0 flex flex-col">
                    <div className="text-[10px] font-semibold text-gray-600 uppercase flex-shrink-0">
                        {filteredLocations.length} {filterType === 'ALL' ? 'Locations' : filterType.toLowerCase()}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[200px]">
                        {filteredLocations.map((loc) => (
                            <button
                                key={loc.id || loc.name}
                                onClick={() => handleSetDestination(loc.name)}
                                className={`w-full text-left p-1.5 md:p-2 rounded-md border transition-colors ${
                                    destinationToShow === loc.name
                                        ? 'bg-amber-50 border-amber-300'
                                        : 'bg-white border-gray-200 hover:border-emerald-400 hover:bg-emerald-50'
                                }`}
                            >
                                <div className="flex items-center space-x-1.5">
                                    <MapPin className={`w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ${
                                        destinationToShow === loc.name ? 'text-amber-600' : 'text-emerald-600'
                                    }`} />
                                    <span className={`text-xs md:text-sm font-medium ${
                                        destinationToShow === loc.name ? 'text-amber-900' : 'text-gray-700'
                                    }`}>
                                        {loc.name}
                                    </span>
                                    {loc.type && (
                                        <span className="ml-auto text-[10px] text-gray-500 capitalize">
                                            {loc.type.toLowerCase()}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                        {filteredLocations.length === 0 && (
                            <div className="text-center py-3 text-xs text-gray-500">
                                No locations found
                            </div>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleBook}
                    disabled={!destination}
                    className={`w-full mt-2 py-2 md:py-2.5 rounded-lg font-bold text-sm md:text-base shadow-lg transition transform active:scale-95 flex items-center justify-center space-x-2 flex-shrink-0
                        ${destination ? 'bg-emerald-800 text-white hover:bg-emerald-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    `}
                >
                    <Car className="w-4 h-4 md:w-5 md:h-5" />
                    <span>{t('request_buggy')}</span>
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
    </div>
  );
};

export default BuggyBooking;
