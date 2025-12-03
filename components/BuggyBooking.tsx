
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Car, Navigation, Star, LocateFixed, XCircle } from 'lucide-react';
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
  const userLocationRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Load locations on mount
  useEffect(() => {
    getLocations().then(setLocations).catch(console.error);
  }, []);

  // Mock User Location (Fixed for demo purposes relative to center)
  const userLat = RESORT_CENTER.lat - 0.0005; 
  const userLng = RESORT_CENTER.lng - 0.0005;

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
          // Double check to prevent cancelling if already picked up (race condition)
          if (activeRide.status === BuggyStatus.ON_TRIP || activeRide.status === BuggyStatus.COMPLETED) {
              alert("Cannot cancel ride. Driver has already picked you up.");
              return;
          }
          if (window.confirm("Are you sure you want to cancel this ride?")) {
            try {
              await cancelRide(activeRide.id);
              setActiveRide(undefined);
            } catch (error) {
              console.error('Failed to cancel ride:', error);
              alert('Failed to cancel ride. Please try again.');
            }
          }
      }
  };

  // Helper to project Lat/Lng to % for the map container
  // Bounding box roughly around Furama Danang
  const mapBounds = {
      minLat: 16.0375,
      maxLat: 16.0420,
      minLng: 108.2460,
      maxLng: 108.2500
  };

  const getPos = (lat: number, lng: number) => {
      const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
      const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
      return { top: `${Math.max(5, Math.min(95, y))}%`, left: `${Math.max(5, Math.min(95, x))}%` };
  };

  const userPos = getPos(userLat, userLng);
  // Use activeRide destination if available, otherwise use selected destination
  const destinationToShow = activeRide?.destination || destination;
  const selectedLocation = locations.find(l => l.name === destinationToShow);
  const destPos = selectedLocation ? getPos(selectedLocation.lat, selectedLocation.lng) : null;

  // Auto-scroll to user location on mount
  useEffect(() => {
      if (userLocationRef.current && mapContainerRef.current && !isLoadingRide) {
          // Small delay to ensure layout is complete
          setTimeout(() => {
              const userElement = userLocationRef.current;
              const container = mapContainerRef.current;
              if (userElement && container) {
                  // Get the position of user location relative to container
                  const containerRect = container.getBoundingClientRect();
                  const userRect = userElement.getBoundingClientRect();
                  
                  // Calculate scroll position to center user location
                  const scrollLeft = userRect.left - containerRect.left + container.scrollLeft - containerRect.width / 2;
                  const scrollTop = userRect.top - containerRect.top + container.scrollTop - containerRect.height / 2;
                  
                  container.scrollTo({
                      left: scrollLeft,
                      top: scrollTop,
                      behavior: 'smooth'
                  });
              }
          }, 200);
      }
  }, [isLoadingRide]);

  // Determine if ride can be cancelled (Before Pickup)
  const canCancel = activeRide && (
      activeRide.status === BuggyStatus.SEARCHING || 
      activeRide.status === BuggyStatus.ASSIGNED || 
      activeRide.status === BuggyStatus.ARRIVING
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className={`p-4 text-white shadow-md ${THEME_COLORS.primary} flex items-center flex-shrink-0`}>
        <button onClick={onBack} className="mr-4 text-white hover:text-gray-200">
          <Navigation className="w-6 h-6 rotate-180" />
        </button>
        <h2 className="text-xl font-serif">{t('buggy_service')}</h2>
      </div>

      {/* Interactive Map - Scrollable */}
      <div ref={mapContainerRef} className="relative flex-1 bg-emerald-50 overflow-auto shadow-inner">
        {/* Map Container - Larger than viewport to allow scrolling */}
        <div className="relative" style={{ minHeight: '600px', minWidth: '100%' }}>

          {/* User Location Pin - Always visible with high z-index */}
          <div 
              ref={userLocationRef}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center group"
              style={{ top: userPos.top, left: userPos.left }}
          >
              <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg mb-1 whitespace-nowrap z-50">
                  You (Villa {user.roomNumber})
              </div>
              <div className="w-5 h-5 bg-red-600 rounded-full border-3 border-white shadow-xl animate-pulse relative z-50"></div>
              <div className="w-10 h-10 bg-red-600/30 rounded-full absolute top-6 animate-ping z-40"></div>
          </div>

          {/* Resort Locations Pins */}
          {locations.map((loc) => {
              const pos = getPos(loc.lat, loc.lng);
              const isSelected = destinationToShow === loc.name;
              return (
                  <button
                      key={loc.name}
                      onClick={() => !activeRide && setDestination(loc.name)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center transition-all duration-300 ${isSelected ? 'scale-110 z-20' : 'hover:scale-110 opacity-80 hover:opacity-100'}`}
                      style={{ top: pos.top, left: pos.left }}
                  >
                      <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm mb-1 whitespace-nowrap transition-colors ${isSelected ? 'bg-amber-500 text-white' : 'bg-white text-gray-600'}`}>
                          {loc.name}
                      </div>
                      <MapPin 
                          className={`w-6 h-6 drop-shadow-md transition-colors ${isSelected ? 'text-amber-500 fill-amber-500' : 'text-emerald-800 fill-white'}`} 
                      />
                  </button>
              );
          })}

          {/* Route Line (Only if destination selected) */}
          {destPos && (
               <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ minHeight: '600px', width: '100%' }}>
                  <line 
                      x1={userPos.left} 
                      y1={userPos.top} 
                      x2={destPos.left} 
                      y2={destPos.top} 
                      stroke={activeRide ? "#10b981" : "#e11d48"} 
                      strokeWidth="3" 
                      strokeDasharray="6"
                      className={activeRide ? "animate-[dash_1s_linear_infinite]" : ""}
                  />
                   {/* Styles for svg animation */}
                  <style>{`
                      @keyframes dash {
                          to {
                              stroke-dashoffset: -12;
                          }
                      }
                  `}</style>
               </svg>
          )}

          {/* Moving Buggy Animation (If active) */}
          {activeRide && activeRide.status !== BuggyStatus.SEARCHING && destPos && (
               <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-[3000ms] ease-linear"
                  style={{ 
                      top: activeRide.status === BuggyStatus.ON_TRIP ? destPos.top : userPos.top,
                      left: activeRide.status === BuggyStatus.ON_TRIP ? destPos.left : userPos.left,
                  }}
               >
                   <div className="bg-white p-1.5 rounded-full shadow-xl border border-gray-200">
                       <Car className="text-emerald-600 w-5 h-5 fill-current" />
                   </div>
               </div>
          )}
        </div>
      </div>

      {/* Status card section - Separate section below map */}
      {activeRide && (
           <div className="bg-white p-4 shadow-lg border-t border-gray-100 flex-shrink-0">
              <div className="flex justify-between items-center mb-2">
                 <div>
                    <h3 className="font-bold text-lg text-gray-800">
                        {activeRide.status === BuggyStatus.SEARCHING && t('finding_driver')}
                        {activeRide.status === BuggyStatus.ASSIGNED && t('driver_assigned')}
                        {activeRide.status === BuggyStatus.ARRIVING && t('driver_arriving')}
                        {activeRide.status === BuggyStatus.ON_TRIP && t('en_route')}
                        {activeRide.status === BuggyStatus.COMPLETED && t('arrived')}
                    </h3>
                    {activeRide.status !== BuggyStatus.SEARCHING && (
                        <p className="text-sm text-gray-500 flex items-center">
                            <Star className="w-3 h-3 text-yellow-400 mr-1 fill-current"/> Buggy #08
                        </p>
                    )}
                 </div>
                 <div className="text-right">
                    {activeRide.eta && activeRide.status !== BuggyStatus.SEARCHING && (
                        <div className="text-2xl font-bold text-emerald-600">{activeRide.eta} min</div>
                    )}
                 </div>
              </div>
              
              <div className="flex items-center space-x-2 my-3">
                 <div className="flex-col flex items-center space-y-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-0.5 h-6 bg-gray-300"></div>
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                 </div>
                 <div className="flex-col flex space-y-3 w-full">
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded truncate">{activeRide.pickup}</div>
                    <div className="text-sm font-semibold text-gray-800 bg-emerald-50 p-2 rounded border border-emerald-100 truncate">{activeRide.destination}</div>
                 </div>
              </div>

              {/* CANCEL BUTTON: Visible if Searching, Assigned, or Arriving */}
              {canCancel && (
                  <button 
                    onClick={handleCancel}
                    className="w-full py-3 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition border border-red-100 flex items-center justify-center"
                  >
                    <XCircle size={18} className="mr-2" />
                    {activeRide.status === BuggyStatus.SEARCHING ? t('cancel_request') : t('cancel_ride')}
                  </button>
              )}
           </div>
      )}

      {/* Booking Form (Only show if Idle and not loading) */}
      {!activeRide && !isLoadingRide && (
        <div className="bg-white p-6 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] -mt-6 relative z-10">
            <h3 className="text-lg font-bold mb-4 text-gray-800">{t('where_to')}</h3>
            
            <div className="space-y-4">
                <div className="relative">
                    <LocateFixed className="absolute left-3 top-3 text-emerald-600 w-5 h-5" />
                    <input 
                        type="text" 
                        value={pickup}
                        readOnly
                        className="w-full pl-10 pr-4 py-3 bg-emerald-50 border border-emerald-100 rounded-lg text-gray-700 font-medium focus:outline-none"
                    />
                </div>
                <div className="relative">
                    <Navigation className="absolute left-3 top-3 text-amber-500 w-5 h-5" />
                    <select 
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-gray-700"
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
                className={`w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95 flex items-center justify-center space-x-2
                    ${destination ? 'bg-emerald-800 text-white hover:bg-emerald-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                `}
            >
                <Car className="w-6 h-6" />
                <span>{t('request_buggy')}</span>
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
