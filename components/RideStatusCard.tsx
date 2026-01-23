import React, { useState } from 'react';
import { Car, XCircle, MessageCircle } from 'lucide-react';
import { BuggyStatus, RideRequest } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface RideStatusCardProps {
  activeRide: RideRequest;
  elapsedTime: number;
  arrivingElapsedTime: number;
  sharedRidesInfo: { totalGuests: number; sharedCount: number } | null;
  canCancel: boolean;
  onCancel: () => void;
  driverName?: string;
  roomNumber?: string;
  onChatToggle?: (isOpen: boolean) => void;
  isChatOpen?: boolean;
}

const MAX_WAIT_TIME = 10 * 60; // 10 minutes
const MAX_ARRIVING_WAIT_TIME = 15 * 60; // 15 minutes
const ARRIVING_WARNING_TIME = 5 * 60; // 5 minutes

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

export const RideStatusCard: React.FC<RideStatusCardProps> = ({
  activeRide,
  elapsedTime,
  arrivingElapsedTime,
  sharedRidesInfo,
  canCancel,
  onCancel,
  driverName,
  roomNumber,
  onChatToggle,
  isChatOpen = false
}) => {
  const { t } = useTranslation();

  const handleChatClick = () => {
    if (onChatToggle) {
      onChatToggle(!isChatOpen);
    }
  };

  return (
    <div
      className={`mx-3 mt-3 mb-4 rounded-2xl shadow-xl backdrop-blur-lg bg-white/90 border flex-shrink-0 p-3.5 overflow-hidden transition-all duration-500 ${
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
        {/* Status & ETA */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Status Badge with Chat Button */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-500 ${
                activeRide.status === BuggyStatus.SEARCHING
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : activeRide.status === BuggyStatus.ON_TRIP
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-green-100 text-green-700 border border-green-200'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeRide.status === BuggyStatus.SEARCHING
                    ? 'bg-blue-500 animate-ping'
                    : activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING
                    ? 'bg-emerald-500 animate-pulse'
                    : activeRide.status === BuggyStatus.ON_TRIP
                    ? 'bg-purple-500'
                    : 'bg-green-500'
                }`}
              ></div>
              {activeRide.status === BuggyStatus.SEARCHING && <span>{t('finding_driver')}</span>}
              {activeRide.status === BuggyStatus.ASSIGNED && <span>{t('driver_assigned')}</span>}
              {activeRide.status === BuggyStatus.ARRIVING && <span>{t('driver_arriving')}</span>}
              {activeRide.status === BuggyStatus.ON_TRIP && <span>{t('en_route')}</span>}
              {activeRide.status === BuggyStatus.COMPLETED && <span>{t('arrived')}</span>}
            </div>
            
            {/* Chat Button - Only show when driver is assigned */}
            {activeRide.status !== BuggyStatus.SEARCHING && driverName && (
              <button
                onClick={handleChatClick}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  isChatOpen
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <MessageCircle size={14} />
                <span>Chat</span>
              </button>
            )}
          </div>

          {/* ETA */}
          {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) &&
            activeRide.eta && (
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
        </div>

        {/* Route Section */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 relative overflow-hidden">
          {/* Pickup */}
          <div className="mb-2">
            <div
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
                activeRide.status === BuggyStatus.ON_TRIP
                  ? 'bg-purple-50 border-purple-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 border-white ${
                  activeRide.status === BuggyStatus.ON_TRIP ? 'bg-purple-500' : 'bg-gray-400'
                }`}
              ></div>
              <span className="text-sm font-semibold text-gray-800 flex-1">{activeRide.pickup}</span>
            </div>
          </div>

          {/* Route Line with Animated Buggy */}
          <div className="relative my-2.5 mx-2">
            <div
              className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 ${
                activeRide.status === BuggyStatus.ON_TRIP
                  ? 'bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500'
                  : 'bg-gradient-to-r from-gray-300 via-emerald-300 to-emerald-500'
              }`}
            ></div>

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
            <div
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
                activeRide.status === BuggyStatus.ON_TRIP
                  ? 'bg-purple-50 border-purple-300'
                  : activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 border-white ${
                  activeRide.status === BuggyStatus.ON_TRIP
                    ? 'bg-purple-500 animate-pulse'
                    : activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-emerald-500'
                }`}
              ></div>
              <span className="text-sm font-bold text-gray-900 flex-1">{activeRide.destination}</span>
            </div>
          </div>

          {/* Guest Count & Shared Ride Info */}
          <div className="mt-2.5 pt-2.5 border-t border-gray-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="font-semibold">👥</span>
              <span>
                {activeRide.guestCount || 1} {activeRide.guestCount === 1 ? 'guest' : 'guests'}
              </span>
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
        <div
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs ${
            activeRide.status === BuggyStatus.ON_TRIP
              ? 'bg-purple-50 border-purple-200 text-purple-700'
              : activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING
              ? arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME
                ? 'bg-red-50 border-red-300 text-red-700'
                : arrivingElapsedTime >= ARRIVING_WARNING_TIME
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              activeRide.status === BuggyStatus.ON_TRIP
                ? 'bg-purple-500 animate-pulse'
                : activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING
                ? arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME
                  ? 'bg-red-600 animate-pulse'
                  : arrivingElapsedTime >= ARRIVING_WARNING_TIME
                  ? 'bg-orange-500'
                  : 'bg-emerald-500 animate-pulse'
                : 'bg-blue-500 animate-pulse'
            }`}
          ></div>
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

        {/* CANCEL BUTTON */}
        {canCancel && (
          <button
            onClick={onCancel}
            className={`group relative w-full py-3 font-bold rounded-xl transition-all duration-300 flex flex-row items-center justify-center gap-2 text-sm overflow-hidden touch-manipulation shadow-md hover:shadow-lg ${
              (activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME) ||
              ((activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) &&
                arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME)
                ? 'bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white hover:from-red-600 hover:via-red-700 hover:to-pink-700'
                : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) &&
                  arrivingElapsedTime >= ARRIVING_WARNING_TIME
                ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white hover:from-orange-600 hover:via-orange-700 hover:to-red-700'
                : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-600 hover:from-red-100 hover:to-pink-100 border-2 border-red-200'
            }`}
          >
            <XCircle className="w-5 h-5 flex-shrink-0 relative z-10" />
            <span className="relative z-10 text-center break-words leading-tight">
              {activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME
                ? `${t('cancel_request')} (Over 10 min)`
                : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) &&
                  arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME
                ? `${t('cancel_request')} (Driver delayed)`
                : (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) &&
                  arrivingElapsedTime >= ARRIVING_WARNING_TIME
                ? `${t('cancel_request')} (Over 5 min)`
                : t('cancel_request')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
