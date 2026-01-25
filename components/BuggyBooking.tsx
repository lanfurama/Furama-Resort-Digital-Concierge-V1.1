import React, { useState, useEffect, useCallback } from 'react';
import { Car, Navigation } from 'lucide-react';
import { BuggyStatus, User } from '../types';
import ServiceChat from './ServiceChat';
import { useTranslation } from '../contexts/LanguageContext';
import Loading from './Loading';
import LocationDetectionModal from './LocationDetectionModal';
import { RideStatusCard } from './RideStatusCard';
import { useRideStatus } from '../hooks/useRideStatus';
import { useRideTimers } from '../hooks/useRideTimers';
import { useRideBooking } from '../hooks/useRideBooking';
import { useDriverName } from '../hooks/useDriverName';
import { useScrollPrevention } from '../hooks/useScrollPrevention';
import { useRideETA } from '../hooks/useRideETA';
import { useRideCancel } from '../hooks/useRideCancel';
import { useBuggyBookingState } from '../hooks/useBuggyBookingState';
import { playNotificationSound } from '../utils/buggyUtils';
import { BuggyBookingForm } from './BuggyBookingForm';
import { NotificationToast } from './NotificationToast';

interface BuggyBookingProps {
  user: User;
  onBack: () => void;
}

const BuggyBooking: React.FC<BuggyBookingProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [showChat, setShowChat] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [soundEnabled] = useState(() => localStorage.getItem('guest_sound_enabled') !== 'false');

  const bookingState = useBuggyBookingState(user.roomNumber);
  const containerRef = useScrollPrevention();

  const playSound = useCallback(() => playNotificationSound(soundEnabled), [soundEnabled]);

  const { activeRide, isLoading: isLoadingRide, sharedRidesInfo } = useRideStatus({
    roomNumber: user.roomNumber,
    onNotification: (message, type) => setNotification({ message, type }),
    playNotificationSound: playSound
  });

  const { elapsedTime, arrivingElapsedTime } = useRideTimers(activeRide);
  const driverName = useDriverName(activeRide);
  const { isBooking, bookRide, cancelRide } = useRideBooking({
    user,
    onRideCreated: () => {
      bookingState.setDestination('');
      bookingState.setGuestCount(1);
      bookingState.setNotes('');
    },
    onRideCancelled: () => bookingState.setDestination('')
  });

  useRideETA(activeRide, bookingState.locations);

  const { handleCancel, canCancel } = useRideCancel({
    activeRide,
    elapsedTime,
    arrivingElapsedTime,
    cancelRide,
    onNotification: (message, type) => setNotification({ message, type }),
    t
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSetDestination = (dest: string) => {
    if (activeRide) return;
    if (dest === bookingState.pickup) {
      setNotification({ message: t('pickup_destination_same_error'), type: 'warning' });
    } else {
      bookingState.setDestination(dest);
    }
  };

  const handleBook = async () => {
    if (!bookingState.destination || isBooking) return;
    if (bookingState.pickup === bookingState.destination) {
      setNotification({ message: t('pickup_destination_same_error'), type: 'warning' });
      return;
    }
    try {
      await bookRide(bookingState.pickup, bookingState.destination, bookingState.guestCount || 1, bookingState.notes || undefined);
    } catch {
      setNotification({ message: t('failed_to_request_ride'), type: 'warning' });
    }
  };

  const preventScroll = (e: React.WheelEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.overflow-y-auto')) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50/30 relative overflow-hidden"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        zIndex: 1,
        touchAction: 'none'
      } as React.CSSProperties}
      onWheel={preventScroll}
      onTouchMove={preventScroll}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-gradient-to-b from-emerald-900/95 via-emerald-800/90 to-emerald-900/95 backdrop-blur-sm flex-shrink-0 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="px-4 py-3 flex items-center justify-between relative z-10">
          <button onClick={onBack} className="text-white hover:bg-white/20 rounded-full p-2 backdrop-blur-sm">
            <Navigation className="w-5 h-5 rotate-180" />
          </button>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Car className="w-5 h-5" />
            {t('buggy_service') || 'Di chuyển'}
          </h2>
          <div className="w-9"></div>
        </div>
      </div>

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
      {(isLoadingRide || bookingState.isLoadingLocations) && (
        <div className="flex-1 flex items-center justify-center">
          <Loading size="md" message={t('loading') || 'Loading...'} />
        </div>
      )}
      {!activeRide && !isLoadingRide && !bookingState.isLoadingLocations && (
        <BuggyBookingForm
          pickup={bookingState.pickup}
          destination={bookingState.destination}
          guestCount={bookingState.guestCount}
          notes={bookingState.notes}
          locations={bookingState.locations}
          isDetectingLocation={bookingState.isDetectingLocation}
          isBooking={isBooking}
          showPickupDropdown={bookingState.showPickupDropdown}
          showDestinationDropdown={bookingState.showDestinationDropdown}
          onPickupChange={bookingState.setPickup}
          onDestinationChange={handleSetDestination}
          onGuestCountChange={bookingState.setGuestCount}
          onNotesChange={bookingState.setNotes}
          onBook={handleBook}
          onShowPickupDropdown={bookingState.setShowPickupDropdown}
          onShowDestinationDropdown={bookingState.setShowDestinationDropdown}
          onValidationError={(msg) => setNotification({ message: msg, type: 'warning' })}
        />
      )}

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
      {notification && <NotificationToast message={notification.message} type={notification.type} />}
      <LocationDetectionModal
        isOpen={bookingState.showGpsModal}
        onCancel={() => bookingState.setShowGpsModal(false)}
        onManualSelect={() => {
          bookingState.setShowGpsModal(false);
          bookingState.setShowPickupDropdown(true);
        }}
      />
    </div>
  );
};

export default BuggyBooking;
