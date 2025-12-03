
import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Car, Navigation, Star, LocateFixed } from 'lucide-react';
import { BuggyStatus, User, RideRequest, Location } from '../types';
import { getLocations, requestRide, getActiveRideForUser, cancelRide } from '../services/dataService';
import { THEME_COLORS, RESORT_CENTER } from '../constants';
import ServiceChat from './ServiceChat';

interface BuggyBookingProps {
  user: User;
  onBack: () => void;
}

const BuggyBooking: React.FC<BuggyBookingProps> = ({ user, onBack }) => {
  const [activeRide, setActiveRide] = useState<RideRequest | undefined>(undefined);
  const [pickup, setPickup] = useState<string>(`Villa ${user.roomNumber}`);
  const [destination, setDestination] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock User Location (Fixed for demo purposes relative to center)
  const userLat = RESORT_CENTER.lat - 0.0005; 
  const userLng = RESORT_CENTER.lng - 0.0005;

  // Load locations on mount
  useEffect(() => {
    getLocations().then(setLocations).catch(console.error);
  }, []);

  // Polling for ride updates
  useEffect(() => {
      const checkStatus = async () => {
          const ride = await getActiveRideForUser(user.roomNumber);
          setActiveRide(ride);
      };
      
      checkStatus(); // Check immediately
      const interval = setInterval(checkStatus, 3000); // Check every 3 seconds
      return () => clearInterval(interval);
  }, [user.roomNumber]);

  const handleBook = async () => {
    if (!destination) return;
    setIsLoading(true);
    try {
      const newRide = await requestRide(user.lastName, user.roomNumber, pickup, destination);
      setActiveRide(newRide);
    } catch (error) {
      console.error('Failed to request ride:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
      if (activeRide) {
          await cancelRide(activeRide.id);
          setActiveRide(undefined);
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
  const selectedLocation = locations.find(l => l.name === destination);
  const destPos = selectedLocation ? getPos(selectedLocation.lat, selectedLocation.lng) : null;

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className={`p-4 text-white shadow-md ${THEME_COLORS.primary} flex items-center z-20`}>
        <button onClick={onBack} className="mr-4 text-white hover:text-gray-200">
          <Navigation className="w-6 h-6 rotate-180" />
        </button>
        <h2 className="text-xl font-serif">Buggy Service</h2>
      </div>

      {/* Interactive Map */}
      <div className="relative flex-grow bg-emerald-50 overflow-hidden shadow-inner">
        {/* Real Map Image (Placeholder for Furama Map) */}
        {/* IMPORTANT: Replace the src below with the actual Furama Resort Map image URL */}
        <img 
            src="https://furamavietnam.com/wp-content/uploads/2018/07/Furama-Resort-Danang-Map-768x552.jpg" 
            alt="Furama Resort Map"
            className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        
        {/* Overlay gradient to ensure text readability if map is busy */}
        <div className="absolute inset-0 bg-white/10 pointer-events-none"></div>

        {/* User Location Pin */}
        <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group"
            style={{ top: userPos.top, left: userPos.left }}
        >
            <div className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md mb-1 whitespace-nowrap">
                You (Villa {user.roomNumber})
            </div>
            <div className="w-4 h-4 bg-emerald-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            <div className="w-8 h-8 bg-emerald-600/20 rounded-full absolute top-5 animate-ping"></div>
        </div>

        {/* Resort Locations Pins */}
        {locations.map((loc) => {
            const pos = getPos(loc.lat, loc.lng);
            const isSelected = destination === loc.name;
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
             <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
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

      {/* Floating status card if active */}
      {activeRide && (
           <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-xl border border-gray-100 z-30">
              <div className="flex justify-between items-center mb-2">
                 <div>
                    <h3 className="font-bold text-lg text-gray-800">
                        {activeRide.status === BuggyStatus.SEARCHING && 'Finding driver...'}
                        {activeRide.status === BuggyStatus.ASSIGNED && 'Driver Assigned'}
                        {activeRide.status === BuggyStatus.ARRIVING && 'Driver Arriving'}
                        {activeRide.status === BuggyStatus.ON_TRIP && 'En Route'}
                        {activeRide.status === BuggyStatus.COMPLETED && 'Arrived'}
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

              {activeRide.status === BuggyStatus.SEARCHING && (
                  <button 
                    onClick={handleCancel}
                    className="w-full py-3 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition"
                  >
                    Cancel Booking
                  </button>
              )}
           </div>
        )}

      {/* Booking Form (Only show if Idle) */}
      {!activeRide && (
        <div className="bg-white p-6 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] -mt-6 relative z-10">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Where to?</h3>
            
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
                        <option value="" disabled>Select on map or list...</option>
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
                <span>Request Buggy</span>
            </button>
        </div>
      )}

      {/* Chat Widget: Connected to 'BUGGY' service */}
      <ServiceChat 
        serviceType="BUGGY" 
        roomNumber={user.roomNumber} 
        label="Driver" 
      />
    </div>
  );
};

export default BuggyBooking;
