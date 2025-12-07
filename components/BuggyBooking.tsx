
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Clock, Car, Navigation, Star, LocateFixed, XCircle, ZoomIn, ZoomOut, ChevronUp, ChevronDown } from 'lucide-react';
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
  const userLocationRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInnerRef = useRef<HTMLDivElement>(null);
  
  // Map pan and zoom state
  const [mapState, setMapState] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 }
  });
  
  // Refs for smooth dragging (avoid re-renders during drag)
  const dragStateRef = useRef({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    translateX: 0,
    translateY: 0,
    scale: 1
  });
  
  const animationFrameRef = useRef<number | null>(null);
  
  const MAX_WAIT_TIME = 10 * 60; // 10 minutes in seconds
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.2;
  
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

  // Countdown timer for ride waiting time
  useEffect(() => {
      if (!activeRide || activeRide.status === BuggyStatus.COMPLETED || activeRide.status === BuggyStatus.ON_TRIP) {
          setElapsedTime(0);
          return;
      }

      // Calculate elapsed time from when ride was created or assigned
      // Use confirmedAt if available (when driver accepted), otherwise use timestamp (when ride was created)
      const startTime = activeRide.confirmedAt || activeRide.timestamp;
      
      // Safety check: if startTime seems invalid (too old or in the future), use current time
      const now = Date.now();
      if (!startTime || startTime > now || startTime < now - (24 * 60 * 60 * 1000)) {
          // If timestamp is invalid or more than 24 hours ago, reset to current time
          setElapsedTime(0);
          return;
      }
      
      const updateElapsed = () => {
          const currentTime = Date.now();
          const elapsed = Math.max(0, Math.floor((currentTime - startTime) / 1000)); // Convert to seconds, ensure non-negative
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
          
          // If driver has accepted but wait time is less than 10 minutes
          if ((activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && elapsedTime < MAX_WAIT_TIME) {
              alert(`Cannot cancel ride yet. You can cancel after waiting 10 minutes. Current wait time: ${formatCountdown(elapsedTime)}`);
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

  // Helper to project Lat/Lng to % for the map container
  // Bounding box covering all villas in Furama Resort Danang
  // Based on actual villa coordinates: 
  // - Lat range: 16.0490 (Q-series) to 16.0569 (P07)
  // - Lng range: 108.1865 (Q-series) to 108.2025 (P01)
  const mapBounds = {
      minLat: 16.0480,  // Slightly below Q-series (16.0490)
      maxLat: 16.0580,  // Slightly above P-series (16.0569)
      minLng: 108.1850, // Slightly below Q-series (108.1865)
      maxLng: 108.2035  // Slightly above P-series (108.2025)
  };

  const getPos = (lat: number, lng: number) => {
      const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
      const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
      // Remove clamping to allow full range, but keep within 0-100%
      return { 
        top: `${Math.max(0, Math.min(100, y))}%`, 
        left: `${Math.max(0, Math.min(100, x))}%` 
      };
  };

  const userPos = getPos(userLat, userLng);
  // Use activeRide destination if available, otherwise use selected destination
  const destinationToShow = activeRide?.destination || destination;
  const selectedLocation = locations.find(l => l.name === destinationToShow);
  const destPos = selectedLocation ? getPos(selectedLocation.lat, selectedLocation.lng) : null;

  // Calculate distance and estimated time
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const calculateEstimatedTime = (distanceMeters: number): number => {
    // Buggy average speed in resort: ~15 km/h = 4.17 m/s
    // Add some buffer for stops, turns, etc.
    const averageSpeedMps = 3.5; // meters per second (conservative estimate)
    const timeSeconds = distanceMeters / averageSpeedMps;
    return Math.ceil(timeSeconds / 60); // Convert to minutes and round up
  };

  const distanceInfo = selectedLocation ? (() => {
    const distance = calculateDistance(userLat, userLng, selectedLocation.lat, selectedLocation.lng);
    const estimatedTime = calculateEstimatedTime(distance);
    return { distance, estimatedTime };
  })() : null;

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setMapState(prev => {
      const newScale = Math.min(prev.scale + ZOOM_STEP, MAX_ZOOM);
      dragStateRef.current.scale = newScale;
      return {
        ...prev,
        scale: newScale
      };
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setMapState(prev => {
      const newScale = Math.max(prev.scale - ZOOM_STEP, MIN_ZOOM);
      dragStateRef.current.scale = newScale;
      return {
        ...prev,
        scale: newScale
      };
    });
  }, []);

  // Locate user function - centers map on user location and resets zoom
  const handleLocateMe = useCallback(() => {
    dragStateRef.current = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      isDragging: false,
      dragStart: { x: 0, y: 0 }
    };
    
    setMapState({
      scale: 1,
      translateX: 0,
      translateY: 0,
      isDragging: false,
      dragStart: { x: 0, y: 0 }
    });
    
    // Scroll to user location after a brief delay
    setTimeout(() => {
      if (userLocationRef.current && mapContainerRef.current) {
        const container = mapContainerRef.current;
        const userElement = userLocationRef.current;
        
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
    }, 100);
  }, []);

  // Pan/Drag handlers
  // Update transform directly for smooth dragging
  const updateTransform = useCallback(() => {
    if (!mapInnerRef.current) return;
    const { translateX, translateY, scale } = dragStateRef.current;
    mapInnerRef.current.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    // Don't drag if clicking on a button or interactive element
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input')) return;
    
    const { translateX, translateY, scale } = mapState;
    dragStateRef.current = {
      isDragging: true,
      dragStart: { 
        x: e.clientX - translateX * scale, 
        y: e.clientY - translateY * scale 
      },
      translateX,
      translateY,
      scale
    };
    
    setMapState(prev => ({
      ...prev,
      isDragging: true,
      dragStart: { 
        x: e.clientX - prev.translateX * prev.scale, 
        y: e.clientY - prev.translateY * prev.scale 
      }
    }));
    
    e.preventDefault();
  }, [mapState]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;
    
    const { dragStart, scale } = dragStateRef.current;
    const newTranslateX = (e.clientX - dragStart.x) / scale;
    const newTranslateY = (e.clientY - dragStart.y) / scale;
    
    dragStateRef.current.translateX = newTranslateX;
    dragStateRef.current.translateY = newTranslateY;
    
    // Use requestAnimationFrame for smooth updates
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => {
        updateTransform();
        // Sync with state after animation frame
        setMapState(prev => ({
          ...prev,
          translateX: dragStateRef.current.translateX,
          translateY: dragStateRef.current.translateY
        }));
        animationFrameRef.current = null;
      });
    }
    
    e.preventDefault();
  }, [updateTransform]);

  const handleMouseUp = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    dragStateRef.current.isDragging = false;
    setMapState(prev => ({ ...prev, isDragging: false }));
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('select') || target.closest('input')) return;
      
      const touch = e.touches[0];
      const { translateX, translateY, scale } = mapState;
      dragStateRef.current = {
        isDragging: true,
        dragStart: { 
          x: touch.clientX - translateX * scale, 
          y: touch.clientY - translateY * scale 
        },
        translateX,
        translateY,
        scale
      };
      
      setMapState(prev => ({
        ...prev,
        isDragging: true,
        dragStart: { 
          x: touch.clientX - prev.translateX * prev.scale, 
          y: touch.clientY - prev.translateY * prev.scale 
        }
      }));
    }
  }, [mapState]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStateRef.current.isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    
    const { dragStart, scale } = dragStateRef.current;
    const newTranslateX = (touch.clientX - dragStart.x) / scale;
    const newTranslateY = (touch.clientY - dragStart.y) / scale;
    
    dragStateRef.current.translateX = newTranslateX;
    dragStateRef.current.translateY = newTranslateY;
    
    // Use requestAnimationFrame for smooth updates
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => {
        updateTransform();
        // Sync with state after animation frame
        setMapState(prev => ({
          ...prev,
          translateX: dragStateRef.current.translateX,
          translateY: dragStateRef.current.translateY
        }));
        animationFrameRef.current = null;
      });
    }
    
    e.preventDefault();
  }, [updateTransform]);

  const handleTouchEnd = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    dragStateRef.current.isDragging = false;
    setMapState(prev => ({ ...prev, isDragging: false }));
  }, []);

  // Wheel zoom with smooth animation
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setMapState(prev => {
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.scale + delta));
      dragStateRef.current.scale = newScale;
      return {
        ...prev,
        scale: newScale
      };
    });
  }, []);

  // Sync dragStateRef with mapState (especially for zoom changes)
  useEffect(() => {
    dragStateRef.current.scale = mapState.scale;
    dragStateRef.current.translateX = mapState.translateX;
    dragStateRef.current.translateY = mapState.translateY;
    
    // Update transform when not dragging (for zoom, locate, etc.)
    if (!mapState.isDragging && mapInnerRef.current) {
      mapInnerRef.current.style.transform = `translate3d(${mapState.translateX}px, ${mapState.translateY}px, 0) scale(${mapState.scale})`;
    }
  }, [mapState.scale, mapState.translateX, mapState.translateY, mapState.isDragging]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Auto-center on user location on mount
  useEffect(() => {
      if (!isLoadingRide) {
          setTimeout(() => {
              handleLocateMe();
          }, 200);
      }
  }, [isLoadingRide, handleLocateMe]);

  // Determine if ride can be cancelled
  // Can cancel if: searching OR (assigned/arriving AND elapsed time > 10 minutes)
  const canCancel = activeRide && (
    activeRide.status === BuggyStatus.SEARCHING || 
    (elapsedTime >= MAX_WAIT_TIME && (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING))
  );

  // Format countdown timer
  const formatCountdown = (seconds: number): string => {
      if (seconds >= MAX_WAIT_TIME) {
          // Show overtime: how many minutes and seconds over 10 minutes
          const overTime = seconds - MAX_WAIT_TIME;
          const overHours = Math.floor(overTime / 3600);
          const overMinutes = Math.floor((overTime % 3600) / 60);
          const overSecs = overTime % 60;
          if (overHours > 0) {
              return `+${overHours}:${overMinutes.toString().padStart(2, '0')}:${overSecs.toString().padStart(2, '0')}`;
          }
          return `+${overMinutes}:${overSecs.toString().padStart(2, '0')}`;
      }
      // Show remaining time: how much time left until 10 minutes
      const remaining = MAX_WAIT_TIME - seconds;
      const minutes = Math.floor(remaining / 60);
      const secs = remaining % 60;
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative z-0">
      {/* Hide scrollbar styles and disable pinch zoom */}
      <style>{`
        .map-container::-webkit-scrollbar {
          display: none;
        }
        .map-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
          touch-action: pan-x pan-y pinch-zoom;
        }
        /* Disable double-tap zoom */
        * {
          touch-action: manipulation;
        }
        /* Allow text selection in inputs and textareas */
        input, textarea, select {
          touch-action: auto;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
      `}</style>
      
      {/* Header */}
      <div className={`p-2.5 text-white shadow-md ${THEME_COLORS.primary} flex items-center flex-shrink-0 relative z-0`}>
        <button onClick={onBack} className="mr-3 text-white hover:text-gray-200">
          <Navigation className="w-5 h-5 rotate-180" />
        </button>
        <h2 className="text-lg font-serif">{t('buggy_service')}</h2>
      </div>

      {/* Interactive Map - Draggable and Zoomable */}
      <div 
        ref={mapContainerRef} 
        className="relative flex-1 bg-emerald-50 overflow-auto shadow-inner z-0 map-container"
        style={{ 
          cursor: mapState.isDragging ? 'grabbing' : 'default'
        }}
        onWheel={handleWheel}
      >
        {/* Map Container - Transformable */}
        <div
          ref={mapInnerRef}
          className="relative z-0 origin-top-left"
          style={{
            minHeight: `${600 * mapState.scale}px`,
            minWidth: `${100 * mapState.scale}%`,
            transform: `translate3d(${mapState.translateX}px, ${mapState.translateY}px, 0) scale(${mapState.scale})`,
            transition: mapState.isDragging ? 'none' : 'transform 0.05s ease-out',
            willChange: 'transform',
            touchAction: 'none',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            perspective: '1000px',
            WebkitPerspective: '1000px'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >

          {/* User Location Pin - Always visible with high z-index */}
          <div 
              ref={userLocationRef}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group"
              style={{ top: userPos.top, left: userPos.left }}
          >
              <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg mb-1 whitespace-nowrap relative z-10">
                  You (Villa {user.roomNumber})
              </div>
              <div className="w-5 h-5 bg-red-600 rounded-full border-3 border-white shadow-xl animate-pulse relative z-10"></div>
              <div className="w-10 h-10 bg-red-600/30 rounded-full absolute top-6 animate-ping z-0 pointer-events-none"></div>
          </div>

          {/* Resort Locations Pins */}
          {locations
              .filter((loc, index, self) => 
                  // Remove duplicates: keep first occurrence by name
                  index === self.findIndex(l => l.name === loc.name)
              )
              .map((loc, index) => {
              const pos = getPos(loc.lat, loc.lng);
              const isSelected = destinationToShow === loc.name;
              return (
                  <button
                      key={loc.id || `${loc.name}-${index}`}
                      onClick={() => handleSetDestination(loc.name)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center transition-all duration-300 ${isSelected ? 'scale-110 z-15' : 'hover:scale-110 opacity-80 hover:opacity-100'}`}
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
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-[3000ms] ease-linear"
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

        {/* Map Controls - Zoom and Locate buttons */}
        <div className="absolute bottom-24 md:bottom-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          <div className="flex flex-col gap-2 pointer-events-auto">
            {/* Locate Me Button */}
            <button
              onClick={handleLocateMe}
              className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
              title="Locate Me"
            >
              <LocateFixed className="w-5 h-5 text-emerald-600" />
            </button>
            
            {/* Zoom In Button */}
            <button
              onClick={handleZoomIn}
              disabled={mapState.scale >= MAX_ZOOM}
              className="bg-white p-3 rounded-t-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5 text-gray-700" />
            </button>
            
            {/* Zoom Out Button */}
            <button
              onClick={handleZoomOut}
              disabled={mapState.scale <= MIN_ZOOM}
              className="bg-white p-3 rounded-b-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-200 border-t-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
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

      {/* Toggle Status Card Button - Outside map container, always visible when status card is shown */}
      {activeRide && isStatusCardVisible && (
        <div 
          className="fixed left-4 z-[100] pointer-events-none" 
          style={{ 
            bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
            paddingBottom: '0'
          }}
        >
          <button
            onClick={() => setIsStatusCardVisible(false)}
            className="bg-white p-3 rounded-full shadow-xl hover:bg-gray-50 active:bg-gray-100 transition-colors border-2 border-emerald-300 flex items-center justify-center pointer-events-auto"
            title="Hide status card"
            style={{
              transform: 'translateZ(0)',
              WebkitTransform: 'translateZ(0)',
              willChange: 'transform',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            <ChevronDown className="w-5 h-5 text-emerald-700" />
          </button>
        </div>
      )}

      {/* Status card section - Separate section below map */}
      {activeRide && (
        <div 
          className={`bg-white shadow-lg border-t border-gray-100 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
            isStatusCardVisible 
              ? 'px-1 pt-0.5 md:p-3 max-h-[200px] opacity-100' 
              : 'p-0 max-h-0 opacity-0'
          }`}
          style={{ 
            paddingBottom: isStatusCardVisible ? 'max(4rem, calc(4rem + env(safe-area-inset-bottom)))' : '0'
          }}
        >
          {isStatusCardVisible && (
            <>
              <div className="flex justify-between items-center mb-0 md:mb-1.5">
                 <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[9px] md:text-lg text-gray-800 leading-none">
                        {activeRide.status === BuggyStatus.SEARCHING && t('finding_driver')}
                        {activeRide.status === BuggyStatus.ASSIGNED && t('driver_assigned')}
                        {activeRide.status === BuggyStatus.ARRIVING && t('driver_arriving')}
                        {activeRide.status === BuggyStatus.ON_TRIP && t('en_route')}
                        {activeRide.status === BuggyStatus.COMPLETED && t('arrived')}
                    </h3>
                    {activeRide.status !== BuggyStatus.SEARCHING && (
                        <p className="text-[7px] md:text-sm text-gray-500 flex items-center leading-none">
                            <Star className="w-1 h-1 md:w-3 md:h-3 text-yellow-400 mr-0.5 md:mr-1 fill-current"/> Buggy #08
                        </p>
                    )}
                 </div>
                 <div className="flex items-center gap-0.5 md:gap-2 flex-shrink-0">
                    {activeRide.status !== BuggyStatus.SEARCHING && activeRide.status !== BuggyStatus.COMPLETED && activeRide.status !== BuggyStatus.ON_TRIP && (
                        <div className="flex flex-col items-end">
                            {activeRide.eta && (
                                <div className="text-[10px] md:text-2xl font-bold text-emerald-600 leading-none">{activeRide.eta} min</div>
                            )}
                            {/* Countdown Timer */}
                            <div className={`text-[7px] md:text-xs font-semibold leading-none ${
                                elapsedTime >= MAX_WAIT_TIME ? 'text-red-600' : 'text-gray-500'
                            }`}>
                                {elapsedTime >= MAX_WAIT_TIME ? (
                                    <span>Wait: {formatCountdown(elapsedTime)}</span>
                                ) : (
                                    <span>Wait: {formatCountdown(elapsedTime)}</span>
                                )}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setIsStatusCardVisible(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-0 flex-shrink-0"
                        title="Hide status"
                    >
                        <ChevronDown className="w-2.5 h-2.5 md:w-5 md:h-5" />
                    </button>
                 </div>
              </div>
              
              <div className="flex items-center space-x-0.5 md:space-x-2 my-0 md:my-2">
                 <div className="flex-col flex items-center space-y-0 flex-shrink-0">
                    <div className="w-0.5 h-0.5 md:w-2 md:h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-[1px] h-1.5 md:h-6 bg-gray-300"></div>
                    <div className="w-0.5 h-0.5 md:w-2 md:h-2 bg-emerald-600 rounded-full"></div>
                 </div>
                 <div className="flex-col flex space-y-0 md:space-y-3 w-full min-w-0">
                    <div className="text-[8px] md:text-sm text-gray-600 bg-gray-50 px-1 py-0.5 md:p-2 rounded truncate leading-none">{activeRide.pickup}</div>
                    <div className="text-[8px] md:text-sm font-semibold text-gray-800 bg-emerald-50 px-1 py-0.5 md:p-2 rounded border border-emerald-100 truncate leading-none">{activeRide.destination}</div>
                 </div>
              </div>

              {/* CANCEL BUTTON: Visible if Searching OR (Assigned/Arriving AND wait time >= 10 minutes) */}
              {canCancel && (
                  <button 
                    onClick={handleCancel}
                    className={`w-full py-0 md:py-3 font-semibold rounded-lg transition border flex items-center justify-center text-[8px] md:text-base mt-0 md:mt-0 ${
                        elapsedTime >= MAX_WAIT_TIME 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'
                    }`}
                  >
                    <XCircle size={8} className="md:w-[18px] md:h-[18px] mr-0.5 md:mr-2" />
                    {activeRide.status === BuggyStatus.SEARCHING 
                        ? t('cancel_request') 
                        : elapsedTime >= MAX_WAIT_TIME 
                            ? `${t('cancel_ride')} (Over 10 min)`
                            : t('cancel_ride')
                    }
                  </button>
              )}
              
              {/* Warning message if waiting but can't cancel yet */}
              {activeRide && (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && elapsedTime < MAX_WAIT_TIME && (
                  <div className="mt-0 md:mt-2 text-[7px] md:text-xs text-gray-500 text-center leading-none">
                      You can cancel after waiting 10 minutes ({formatCountdown(elapsedTime)} remaining)
                  </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Show Status Card Button - When status card is hidden */}
      {activeRide && !isStatusCardVisible && (
        <div 
          className="bg-white p-2 md:p-3 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] -mt-6 relative z-20 flex items-center justify-center" 
          style={{ 
            paddingBottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))'
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

                {/* Distance and Time Info */}
                {distanceInfo && destination && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-semibold text-gray-700">
                                    {formatDistance(distanceInfo.distance)}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-semibold text-gray-700">
                                    ~{distanceInfo.estimatedTime} {distanceInfo.estimatedTime === 1 ? 'min' : 'mins'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

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
