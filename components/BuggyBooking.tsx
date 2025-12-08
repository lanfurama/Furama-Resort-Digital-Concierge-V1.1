
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Clock, Car, Navigation, Star, LocateFixed, XCircle, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Time elapsed in seconds
  const [isBookingFormVisible, setIsBookingFormVisible] = useState(true); // Toggle for booking form
  const [isStatusCardVisible, setIsStatusCardVisible] = useState(true); // Toggle for status card
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const MAX_WAIT_TIME = 10 * 60; // 10 minutes in seconds
  
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
  useEffect(() => {
      if (!activeRide || activeRide.status === BuggyStatus.COMPLETED || activeRide.status === BuggyStatus.ON_TRIP) {
          setElapsedTime(0);
          return;
      }

      // Calculate elapsed time based on status:
      // - SEARCHING: from timestamp (when ride was created)
      // - ASSIGNED/ARRIVING: from confirmedAt (when driver accepted) - only count from this point
      let startTime: number | undefined;
      
      if (activeRide.status === BuggyStatus.SEARCHING) {
          // While searching, count from when ride was created
          startTime = activeRide.timestamp;
      } else if (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) {
          // When driver accepts, only count from confirmedAt (reset timer)
          // If confirmedAt is not set, use current time as fallback (driver just accepted)
          startTime = activeRide.confirmedAt || Date.now();
      }
      
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
  }, [activeRide]);


  // Handler to set destination and show form
  const handleSetDestination = (dest: string) => {
    if (!activeRide) {
      setDestination(dest);
      setIsBookingFormVisible(true); // Auto-show form when destination is selected
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
      if (activeRide) {
          // Prevent cancelling if already picked up
          if (activeRide.status === BuggyStatus.ON_TRIP || activeRide.status === BuggyStatus.COMPLETED) {
              alert("Cannot cancel ride. Driver has already picked you up.");
              return;
          }
          
          // Prevent cancelling if driver just accepted (button should be disabled, but double-check)
          if ((activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && elapsedTime < MAX_WAIT_TIME) {
              alert(`Cannot cancel ride yet. You can cancel after waiting 10 minutes from when driver accepted.`);
              return;
          }
          
          const confirmMessage = elapsedTime >= MAX_WAIT_TIME 
              ? `You have been waiting for over 10 minutes. Are you sure you want to cancel this ride?`
              : "Are you sure you want to cancel this ride?";
              
          if (window.confirm(confirmMessage)) {
            try {
              await cancelRide(activeRide.id);
              setActiveRide(undefined);
              setElapsedTime(0);
            } catch (error) {
              console.error('Failed to cancel ride:', error);
              alert('Failed to cancel ride. Please try again.');
            }
          }
      }
  };

  // Sort locations alphabetically for fixed grid display
  const sortedLocations = [...locations].sort((a, b) => {
    // Remove duplicates by name
    if (a.name === b.name) return 0;
    return a.name.localeCompare(b.name);
  }).filter((loc, index, self) => 
    index === self.findIndex(l => l.name === loc.name)
  );

  // Use activeRide destination if available, otherwise use selected destination
  const destinationToShow = activeRide?.destination || destination;


  // Determine if ride can be cancelled
  // Can cancel if: searching OR (assigned/arriving AND elapsed time > 10 minutes)
  const canCancel = activeRide && (
    activeRide.status === BuggyStatus.SEARCHING || 
    (elapsedTime >= MAX_WAIT_TIME && (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING))
  );

  // Format countdown timer - show elapsed time in MM:SS format
  const formatCountdown = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
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

      {/* Fixed Grid Layout for Locations */}
      <div 
        ref={mapContainerRef} 
        className="relative flex-1 bg-emerald-50 overflow-auto shadow-inner z-0 p-4"
      >
        {/* User Location Card */}
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-800">You (Villa {user.roomNumber})</span>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {sortedLocations.map((loc) => {
            const isSelected = destinationToShow === loc.name;
            return (
              <button
                key={loc.id || loc.name}
                onClick={() => handleSetDestination(loc.name)}
                className={`p-2 md:p-2.5 rounded-md border transition-all duration-200 text-left min-h-[60px] md:min-h-[70px] flex items-start ${
                  isSelected
                    ? 'bg-amber-100 border-amber-500 shadow-md scale-105'
                    : 'bg-white border-gray-200 hover:border-emerald-400 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-1.5 w-full">
                  <MapPin className={`w-3 h-3 md:w-4 md:h-4 flex-shrink-0 mt-0.5 ${
                    isSelected ? 'text-amber-600 fill-amber-600' : 'text-emerald-600'
                  }`} />
                  <span className={`text-xs md:text-sm font-medium break-words leading-relaxed flex-1 ${
                    isSelected ? 'text-amber-900' : 'text-gray-700'
                  }`}>
                    {loc.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Route Info */}
        {destinationToShow && (
          <div className="mt-4 p-3 bg-white border border-emerald-200 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex flex-col items-center space-y-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="w-[1px] h-4 bg-gray-300"></div>
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">From</div>
                <div className="font-medium text-gray-700">{pickup}</div>
                <div className="text-xs text-gray-500 mt-2">To</div>
                <div className="font-semibold text-emerald-700">{destinationToShow}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toggle Booking Form Button - Outside map container, always visible */}
      {!activeRide && !isLoadingRide && (
        <div 
          className="fixed left-4 z-[100] pointer-events-none" 
          style={{ 
            bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
            paddingBottom: '0'
          }}
        >
          <button
            onClick={() => setIsBookingFormVisible(!isBookingFormVisible)}
            className="bg-white p-3 rounded-full shadow-xl hover:bg-gray-50 active:bg-gray-100 transition-colors border-2 border-emerald-300 flex items-center justify-center pointer-events-auto"
            title={isBookingFormVisible ? "Hide booking form" : "Show booking form"}
            style={{
              transform: 'translateZ(0)',
              WebkitTransform: 'translateZ(0)',
              willChange: 'transform',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            {isBookingFormVisible ? (
              <ChevronDown className="w-5 h-5 text-emerald-700" />
            ) : (
              <ChevronUp className="w-5 h-5 text-emerald-700" />
            )}
          </button>
        </div>
      )}


      {/* Status card section - Separate section below map */}
      {activeRide && (
        <div 
          className={`bg-white shadow-lg border-t border-gray-100 flex-shrink-0 transition-all duration-300 ease-in-out ${
            isStatusCardVisible 
              ? 'px-3 pt-2 pb-2 md:p-3 opacity-100 overflow-hidden' 
              : 'p-0 max-h-0 opacity-0 overflow-hidden'
          }`}
          style={{ 
            paddingBottom: isStatusCardVisible ? 'max(1.4rem, calc(1.4rem + env(safe-area-inset-bottom)))' : '0'
          }}
        >
          {isStatusCardVisible && (
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
                    {activeRide.status !== BuggyStatus.SEARCHING && (
                        <p className="text-[10px] md:text-sm text-gray-500 flex items-center leading-tight mt-0.5">
                            <Star className="w-3 h-3 md:w-3 md:h-3 text-yellow-400 mr-1 md:mr-1 fill-current flex-shrink-0"/> 
                            <span className="whitespace-nowrap">Buggy #08</span>
                        </p>
                    )}
                 </div>
                 <div className="flex flex-row items-start gap-1.5 md:gap-2 flex-shrink-0">
                    {activeRide.status !== BuggyStatus.SEARCHING && activeRide.status !== BuggyStatus.COMPLETED && activeRide.status !== BuggyStatus.ON_TRIP && (
                        <div className="flex flex-col items-end">
                            {activeRide.eta && (
                                <div className="flex flex-col items-end">
                                    <div className="text-sm md:text-2xl font-bold text-emerald-600 leading-none whitespace-nowrap">{activeRide.eta} min</div>
                                    <div className="text-[8px] md:text-xs text-gray-500 leading-none mt-0.5">{t('estimated')}</div>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setIsStatusCardVisible(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0 touch-manipulation"
                        title="Hide status"
                    >
                        <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
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

              {/* CANCEL BUTTON: Visible if Searching OR (Assigned/Arriving AND wait time >= 10 minutes) */}
              {canCancel && (
                  <button 
                    onClick={handleCancel}
                    disabled={(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && elapsedTime < MAX_WAIT_TIME}
                    className={`w-full py-2 md:py-3 font-semibold rounded-lg transition border flex flex-row items-center justify-center gap-1.5 md:gap-2 text-xs md:text-base flex-shrink-0 touch-manipulation min-h-[44px] ${
                        elapsedTime >= MAX_WAIT_TIME 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <XCircle size={16} className="md:w-[18px] md:h-[18px] flex-shrink-0" />
                    <span className="text-center break-words leading-tight">
                      {activeRide.status === BuggyStatus.SEARCHING 
                          ? t('cancel_request') 
                          : elapsedTime >= MAX_WAIT_TIME 
                              ? `${t('cancel_ride')} (Over 10 min)`
                              : t('cancel_ride')
                      }
                    </span>
                  </button>
              )}
              
              {/* Warning message if waiting but can't cancel yet */}
              {activeRide && (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && elapsedTime < MAX_WAIT_TIME && (
                  <div className="mt-0 text-[10px] md:text-xs text-gray-500 text-center leading-tight px-1 flex-shrink-0">
                      You can cancel after waiting 10 minutes from when driver accepted
                  </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Show Status Card Button - When status card is hidden */}
      {activeRide && !isStatusCardVisible && (
        <div 
          className="bg-white p-2 md:p-3 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] -mt-6 relative z-20 flex items-center justify-center" 
          style={{ 
            paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))'
          }}
        >
            <button
                onClick={() => setIsStatusCardVisible(true)}
                className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-semibold text-xs md:text-sm transition-colors"
            >
                <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
                <span>Show Status</span>
            </button>
        </div>
      )}

      {/* Booking Form (Only show if Idle and not loading) */}
      {!activeRide && !isLoadingRide && (
        <div 
          className={`bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] -mt-6 relative z-20 transition-all duration-300 ease-in-out overflow-hidden ${
            isBookingFormVisible 
              ? 'p-4 pb-24 md:pb-4 max-h-[500px] opacity-100' 
              : 'p-0 max-h-0 opacity-0'
          }`}
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-800">{t('where_to')}</h3>
                    <button
                        onClick={() => setIsBookingFormVisible(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        title="Hide form"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </button>
                </div>
            
            <div className="space-y-2">
                <div className="relative">
                    <LocateFixed className="absolute left-2 top-2 text-emerald-600 w-4 h-4" />
                    <input 
                        type="text" 
                        value={pickup}
                        readOnly
                        className="w-full pl-8 pr-3 py-2 text-sm bg-emerald-50 border border-emerald-100 rounded-lg text-gray-700 font-medium focus:outline-none"
                    />
                </div>
                <div className="relative">
                    <Navigation className="absolute left-2 top-2 text-amber-500 w-4 h-4" />
                    <select 
                        value={destination}
                            onChange={(e) => {
                              handleSetDestination(e.target.value);
                            }}
                        className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-gray-700"
                    >
                        <option value="" disabled>{t('select_dest')}</option>
                        {locations.map((loc) => (
                            <option key={loc.name} value={loc.name}>{loc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button 
                onClick={handleBook}
                disabled={!destination}
                className={`w-full mt-3 py-2.5 rounded-lg font-bold text-base shadow-lg transition transform active:scale-95 flex items-center justify-center space-x-2
                    ${destination ? 'bg-emerald-800 text-white hover:bg-emerald-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                `}
            >
                <Car className="w-5 h-5" />
                <span>{t('request_buggy')}</span>
                </button>
            </div>
        </div>
      )}

      {/* Show Booking Form Button - When form is hidden */}
      {!activeRide && !isLoadingRide && !isBookingFormVisible && (
        <div className="bg-white p-3 pb-24 md:pb-3 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] -mt-6 relative z-20 flex items-center justify-center">
            <button
                onClick={() => setIsBookingFormVisible(true)}
                className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition-colors"
            >
                <ChevronUp className="w-5 h-5" />
                <span>{t('where_to')}</span>
            </button>
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
