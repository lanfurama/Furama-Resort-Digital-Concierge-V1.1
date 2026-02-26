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

  const isWarning = (activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) &&
    arrivingElapsedTime >= ARRIVING_WARNING_TIME;
  const isError = (activeRide.status === BuggyStatus.SEARCHING && elapsedTime >= MAX_WAIT_TIME) ||
    ((activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME);
  const isPrimary = activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING || activeRide.status === BuggyStatus.ON_TRIP;

  return (
    <div
      className={`mx-3 mt-3 mb-4 rounded-xl shadow border flex-shrink-0 p-3.5 overflow-hidden bg-white ${
        isError ? 'border-red-300 border-2' : 'border-gray-200'
      }`}
      style={{
        paddingBottom: 'max(0.875rem, calc(0.875rem + env(safe-area-inset-bottom)))'
      }}
    >
      <div className="flex flex-col space-y-2.5">
        {/* Buggy Icon Section */}
        <div className="flex justify-center items-center py-4 relative">
          <div className="relative">
            <div className={`p-4 rounded-xl border ${
              activeRide.status === BuggyStatus.SEARCHING
                ? 'bg-gray-100 border-gray-300'
                : activeRide.status === BuggyStatus.COMPLETED
                ? 'bg-green-100 border-green-300'
                : 'bg-emerald-100 border-emerald-300'
            }`}>
              <Car
                size={48}
                className={`${
                  activeRide.status === BuggyStatus.SEARCHING
                    ? 'text-gray-600'
                    : activeRide.status === BuggyStatus.COMPLETED
                    ? 'text-green-600'
                    : 'text-emerald-600'
                }`}
                strokeWidth={2.5}
              />
            </div>
            {activeRide.status === BuggyStatus.COMPLETED && (
              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Status & ETA */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                isError
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : isWarning
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : isPrimary
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isError ? 'bg-red-500' : isWarning ? 'bg-amber-500' : isPrimary ? 'bg-emerald-500' : 'bg-gray-500'
                }`}
              />
              {activeRide.status === BuggyStatus.SEARCHING && <span>{t('finding_driver')}</span>}
              {activeRide.status === BuggyStatus.ASSIGNED && <span>{t('driver_assigned')}</span>}
              {activeRide.status === BuggyStatus.ARRIVING && <span>{t('driver_arriving')}</span>}
              {activeRide.status === BuggyStatus.ON_TRIP && <span>{t('en_route')}</span>}
              {activeRide.status === BuggyStatus.COMPLETED && <span>{t('arrived')}</span>}
            </div>
            {activeRide.status !== BuggyStatus.SEARCHING && driverName && (
              <button
                onClick={handleChatClick}
                className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg text-xs font-semibold touch-manipulation ${
                  isChatOpen
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <MessageCircle size={14} />
                <span>Chat</span>
              </button>
            )}
          </div>

          {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && activeRide.eta && (
            <div className="flex flex-col items-center bg-emerald-50 px-3.5 py-2 rounded-lg border border-emerald-200">
              <div className="text-2xl font-black text-emerald-700 leading-none">{activeRide.eta}</div>
              <div className="text-[9px] text-gray-600 font-semibold mt-0.5">MIN</div>
            </div>
          )}

          {activeRide.status === BuggyStatus.ON_TRIP && activeRide.pickedUpAt && (() => {
            const tripDuration = Math.floor((Date.now() - activeRide.pickedUpAt) / 1000);
            return (
              <div className="flex flex-col items-center bg-emerald-50 px-3.5 py-2 rounded-lg border border-emerald-200">
                <div className="text-2xl font-black text-emerald-700 leading-none">{formatWaitingTime(tripDuration)}</div>
                <div className="text-[9px] text-gray-600 font-semibold mt-0.5">EN ROUTE</div>
              </div>
            );
          })()}
        </div>

        {/* Route Section */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 relative overflow-hidden">
          <div className="mb-2 min-w-0">
            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${isPrimary ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-200'}`}>
              <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shrink-0 ${isPrimary ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <span className="text-sm font-semibold text-gray-800 flex-1 min-w-0 truncate">{activeRide.pickup}</span>
            </div>
          </div>

          <div className="relative my-2.5 mx-2">
            <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 ${isPrimary ? 'bg-emerald-400' : 'bg-gray-300'}`} />
            {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && (
              <div
                className="absolute top-1/2 z-10"
                style={{
                  left: `${Math.min(95, Math.max(5, 5 + (arrivingElapsedTime / Math.max(1, (activeRide.eta ? activeRide.eta * 60 : 300))) * 90))}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="bg-emerald-600 p-1.5 rounded-lg border-2 border-white shadow">
                  <Car size={14} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
            )}
            {activeRide.status === BuggyStatus.ON_TRIP && activeRide.pickedUpAt && (() => {
              const tripDuration = Math.floor((Date.now() - activeRide.pickedUpAt) / 1000);
              const estimatedTripTime = activeRide.eta ? activeRide.eta * 60 : 300;
              const progress = Math.min(95, Math.max(5, 5 + (tripDuration / estimatedTripTime) * 90));
              return (
                <div
                  className="absolute top-1/2 z-10"
                  style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="bg-emerald-600 p-1.5 rounded-lg border-2 border-white shadow">
                    <Car size={14} className="text-white" strokeWidth={2.5} />
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="min-w-0">
            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${isPrimary ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-200'}`}>
              <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shrink-0 ${isPrimary ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <span className="text-sm font-bold text-gray-900 flex-1 min-w-0 truncate">{activeRide.destination}</span>
            </div>
          </div>

          {/* Guest Count & Shared Ride Info */}
          <div className="mt-2.5 pt-2.5 border-t border-gray-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="font-semibold">👥</span>
              <span>
                {activeRide.guestCount || 1} {activeRide.guestCount === 1 ? t('guest') : t('guests')}
              </span>
            </div>
            {sharedRidesInfo && sharedRidesInfo.sharedCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg border border-gray-200">
                <span className="font-semibold">🔗</span>
                <span>{t('shared_ride_total').replace('{count}', String(sharedRidesInfo.totalGuests))}</span>
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

          {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) && (
            <div className="mt-2.5 pt-2.5 border-t border-gray-200">
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(15, 100 - (arrivingElapsedTime / Math.max(1, (activeRide.eta ? activeRide.eta * 60 : 300))) * 85))}%`
                  }}
                />
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
                  <div className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Consolidated Status Message */}
        <div
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs ${
            isError ? 'bg-red-50 border-red-200 text-red-700' : isWarning ? 'bg-amber-50 border-amber-200 text-amber-700' : isPrimary ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-700'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${isError ? 'bg-red-500' : isWarning ? 'bg-amber-500' : isPrimary ? 'bg-emerald-500' : 'bg-gray-500'}`}
          />
          <p className="font-semibold flex-1 min-w-0">
            {activeRide.status === BuggyStatus.ON_TRIP && `🎉 ${t('status_on_the_way_to')} ${activeRide.destination}`}
            {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) &&
              arrivingElapsedTime >= MAX_ARRIVING_WAIT_TIME &&
              t('status_driver_delayed')}
            {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) &&
              arrivingElapsedTime >= ARRIVING_WARNING_TIME &&
              arrivingElapsedTime < MAX_ARRIVING_WAIT_TIME &&
              t('status_driver_arriving_wait')}
            {(activeRide.status === BuggyStatus.ASSIGNED || activeRide.status === BuggyStatus.ARRIVING) &&
              arrivingElapsedTime < ARRIVING_WARNING_TIME &&
              `🚗 ${t('driver_label')} ${activeRide.status === BuggyStatus.ASSIGNED ? t('status_driver_on_the_way') : t('status_driver_arriving')}${activeRide.eta ? ` (${activeRide.eta} min)` : ''}`}
            {activeRide.status === BuggyStatus.SEARCHING && `⏳ ${t('status_searching')}`}
          </p>
        </div>

        {canCancel && (
          <button
            onClick={onCancel}
            className={`w-full py-3 min-h-[44px] font-bold rounded-xl flex flex-row items-center justify-center gap-2 text-sm touch-manipulation ${
              isError ? 'bg-red-600 text-white hover:bg-red-700' : isWarning ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-white text-red-600 border-2 border-red-300 hover:bg-red-50'
            }`}
          >
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-center break-words leading-tight">
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
