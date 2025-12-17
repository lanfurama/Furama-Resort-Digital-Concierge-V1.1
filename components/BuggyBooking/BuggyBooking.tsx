import React, { useState, useEffect } from 'react';
import { MapPin, Car, Navigation, Loader2 } from 'lucide-react';
import { BuggyStatus, User, Location } from '../../types';
import { getLocations, requestRide, cancelRide } from '../../services/dataService';
import ServiceChat from '../ServiceChat';
import { useTranslation } from '../../contexts/LanguageContext';
import Loading from '../Loading';

// Hooks
import { useGeolocation } from './hooks/useGeolocation';
import { useRideStatus } from './hooks/useRideStatus';
import { useDriverName } from './hooks/useDriverName';
import { useNotificationSound } from './hooks/useNotificationSound';

// Components
import { StatusCard } from './components/StatusCard';
import { NotificationToast } from './components/NotificationToast';

// Utils
import { MAX_WAIT_TIME, MAX_ARRIVING_WAIT_TIME } from './utils/constants';

interface BuggyBookingProps {
  user: User;
  onBack: () => void;
}

const BuggyBooking: React.FC<BuggyBookingProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [pickup, setPickup] = useState<string>(`Villa ${user.roomNumber}`);
  const [destination, setDestination] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'VILLA' | 'FACILITY' | 'RESTAURANT'>('VILLA');
  const [isBooking, setIsBooking] = useState(false);
  
  // Pickup location states
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [pickupSearchQuery, setPickupSearchQuery] = useState<string>('');
  const [pickupFilterType, setPickupFilterType] = useState<'ALL' | 'VILLA' | 'FACILITY' | 'RESTAURANT'>('ALL');
  
  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'warning'} | null>(null);
  
  // Sound notification state
  const [soundEnabled] = useState(() => {
    const saved = localStorage.getItem('guest_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const playNotificationSound = useNotificationSound(soundEnabled);

  // Use ride status hook
  const {
    activeRide,
    isLoadingRide,
    elapsedTime,
    arrivingElapsedTime,
    setActiveRide
  } = useRideStatus({
    roomNumber: user.roomNumber,
    onStatusChange: (ride) => {
      if (ride && ride.destination) {
        setDestination(ride.destination);
      }
    },
    onNotification: (message, type) => setNotification({ message, type }),
    playNotificationSound
  });

  // Use driver name hook
  const driverName = useDriverName({ activeRide, t });

  // Use geolocation hook
  const { isGettingLocation, getCurrentLocation } = useGeolocation({
    locations,
    onLocationFound: (locationName) => setPickup(locationName),
    onLocationNotFound: () => setShowPickupDropdown(true)
  });

  // Load locations on mount
  useEffect(() => {
    setIsLoadingLocations(true);
    getLocations()
      .then(setLocations)
      .catch(console.error)
      .finally(() => setIsLoadingLocations(false));
  }, []);

  // Get current location on mount
  useEffect(() => {
    if (!activeRide && locations.length > 0) {
      getCurrentLocation();
    }
  }, [locations.length, activeRide, getCurrentLocation]);

  // Close pickup dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showPickupDropdown && !target.closest('.pickup-dropdown-container')) {
        setShowPickupDropdown(false);
      }
    };

    if (showPickupDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPickupDropdown]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handler to set destination
  const handleSetDestination = (dest: string) => {
    if (!activeRide) {
      if (dest === pickup) {
        alert('Destination cannot be the same as pickup location. Please select a different location.');
        return;
      }
      setDestination(dest);
    }
  };

  const handleBook = async () => {
    if (!destination || isBooking) return;
    
    if (pickup === destination) {
      alert('Pickup location and destination cannot be the same. Please select different locations.');
      return;
    }
    
    setIsBooking(true);
    try {
      const newRide = await requestRide(user.lastName, user.roomNumber, pickup, destination);
      setActiveRide(newRide);
      setDestination('');
    } catch (error) {
      console.error('Failed to request ride:', error);
      alert('Failed to request ride. Please try again.');
    } finally {
      setTimeout(() => {
        setIsBooking(false);
      }, 1000);
    }
  };

  const handleCancel = async () => {
    if (!activeRide) return;

    if (activeRide.status === BuggyStatus.ON_TRIP || activeRide.status === BuggyStatus.COMPLETED) {
      alert("Cannot cancel ride. Driver has already picked you up.");
      return;
    }
    
    if (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) {
      if (arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME) {
        const confirmMessage = `Driver has been arriving for over 15 minutes. Are you sure you want to cancel this ride?`;
        if (window.confirm(confirmMessage)) {
          try {
            await cancelRide(activeRide.id);
            setActiveRide(undefined);
            setDestination('');
          } catch (error) {
            console.error('Failed to cancel ride:', error);
            alert('Failed to cancel ride. Please try again.');
          }
        }
      } else {
        alert("Cannot cancel ride. Driver has already accepted your request.");
      }
      return;
    }
    
    if (activeRide.status === BuggyStatus.SEARCHING) {
      const confirmMessage = elapsedTime >= MAX_WAIT_TIME 
        ? `You have been waiting for over 10 minutes. Are you sure you want to cancel this ride?`
        : "Are you sure you want to cancel this ride?";
        
      if (window.confirm(confirmMessage)) {
        try {
          await cancelRide(activeRide.id);
          setActiveRide(undefined);
          setDestination('');
        } catch (error) {
          console.error('Failed to cancel ride:', error);
          alert('Failed to cancel ride. Please try again.');
        }
      }
    }
  };

  const destinationToShow = activeRide?.destination || destination;

  // Filter and search locations
  const filteredLocations = locations.filter(loc => {
    const matchesSearch = !searchQuery || loc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'ALL' || loc.type === filterType;
    const notPickup = loc.name !== pickup;
    return matchesSearch && matchesFilter && notPickup;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const filteredPickupLocations = locations.filter(loc => {
    const matchesSearch = !pickupSearchQuery || loc.name.toLowerCase().includes(pickupSearchQuery.toLowerCase());
    const matchesFilter = pickupFilterType === 'ALL' || loc.type === pickupFilterType;
    const notDestination = loc.name !== destination;
    return matchesSearch && matchesFilter && notDestination;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const canCancel = activeRide && (
    activeRide.status === BuggyStatus.SEARCHING ||
    ((activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME)
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20 relative z-0" style={{ paddingBottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))' }}>
      
      {/* Header */}
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

      {/* Status Card */}
      {activeRide && (
        <StatusCard
          activeRide={activeRide}
          elapsedTime={elapsedTime}
          arrivingElapsedTime={arrivingElapsedTime}
          canCancel={canCancel}
          onCancel={handleCancel}
          t={t}
        />
      )}

      {/* Loading State */}
      {(isLoadingRide || isLoadingLocations) && (
        <div className="flex-1 flex items-center justify-center">
          <Loading size="md" message={t('loading') || 'Loading...'} />
        </div>
      )}

      {/* Booking Form - Note: This section is still large and could be further split if needed */}
      {!activeRide && !isLoadingRide && !isLoadingLocations && (
        <div 
          className="mx-3 mt-3 mb-24 rounded-3xl shadow-2xl backdrop-blur-lg bg-white/95 border border-white/60 flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            boxShadow: '0 25px 70px -20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.5)',
            maxHeight: 'calc(100vh - 180px)',
            paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))'
          }}
        >
          {/* Booking form content - keeping inline for now, can be extracted to BookingForm component later */}
          <div className="px-4 py-2 flex-shrink-0 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
              <h3 className="text-base font-bold text-gray-800">{t('where_to')}</h3>
              <MapPin className="w-4 h-4 text-emerald-600 ml-auto" />
            </div>
            
            {/* Pickup location - simplified for now */}
            <div className="relative group pickup-dropdown-container">
              <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Your Location</label>
              <div className="relative">
                {isGettingLocation ? (
                  <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 w-3.5 h-3.5" />
                )}
                <input 
                  type="text" 
                  value={pickup}
                  readOnly
                  onClick={() => !activeRide && setShowPickupDropdown(!showPickupDropdown)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all cursor-pointer"
                  placeholder={isGettingLocation ? "Getting your location..." : "Click to select location"}
                  disabled={!!activeRide}
                />
                {!isGettingLocation && !activeRide && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      getCurrentLocation();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-emerald-100 rounded transition-colors"
                    title="Get current location"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                )}
              </div>
              
              {/* Pickup dropdown - simplified, can be extracted to PickupDropdown component */}
              {showPickupDropdown && !activeRide && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border-2 border-blue-400 max-h-[400px] overflow-hidden flex flex-col" style={{ boxShadow: '0 20px 60px -15px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2)' }}>
                  <div className="px-3 py-2 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 flex-shrink-0">
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={pickupSearchQuery}
                      onChange={(e) => setPickupSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-sm text-gray-900 placeholder:text-blue-400 bg-white border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      autoFocus
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
                    {filteredPickupLocations.length > 0 ? (
                      <div className="grid grid-cols-5 gap-2">
                        {filteredPickupLocations.map((loc) => (
                          <button
                            key={loc.id || loc.name}
                            onClick={() => {
                              if (loc.name === destination) {
                                alert('Pickup location cannot be the same as destination.');
                                return;
                              }
                              setPickup(loc.name);
                              if (destination === loc.name) {
                                setDestination('');
                              }
                              setShowPickupDropdown(false);
                              setPickupSearchQuery('');
                            }}
                            className={`min-h-[80px] p-1.5 rounded-lg border-2 transition-all ${
                              pickup === loc.name
                                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-400'
                                : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
                            }`}
                          >
                            <div className="text-[10px] font-bold text-center break-words">
                              {loc.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-xs text-gray-500">No locations found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Destination selection - simplified */}
            <div className="relative group">
              <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Search Destination</label>
              <input
                type="text"
                placeholder={t('search_locations')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
            </div>

            {/* Location grid - simplified */}
            <div className="flex-1 overflow-y-auto px-4 pb-3" style={{ maxHeight: 'calc(100vh - 380px)' }}>
              <div className="grid grid-cols-5 gap-2">
                {filteredLocations.map((loc) => (
                  <button
                    key={loc.id || loc.name}
                    onClick={() => handleSetDestination(loc.name)}
                    className={`min-h-[80px] p-1.5 rounded-xl border-2 transition-all ${
                      destinationToShow === loc.name
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-500'
                        : 'bg-white border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    <div className={`text-[10px] font-bold text-center break-words ${
                      destinationToShow === loc.name ? 'text-white' : 'text-gray-800'
                    }`}>
                      {loc.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Book Button */}
            <div className="p-4 pt-1.5 flex-shrink-0 border-t border-gray-100">
              <button 
                onClick={handleBook}
                disabled={!destination || isBooking}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                  destination && !isBooking
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Requesting...</span>
                  </>
                ) : (
                  <>
                    <Car className="w-4 h-4" />
                    <span>{t('request_buggy')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      {activeRide && activeRide.status !== BuggyStatus.SEARCHING && (
        <ServiceChat 
          serviceType="BUGGY" 
          roomNumber={user.roomNumber} 
          label={driverName}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <NotificationToast message={notification.message} type={notification.type} />
      )}
    </div>
  );
};

export default BuggyBooking;

