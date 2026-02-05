import React from 'react';
import { Car, LocateFixed, MapPin, CheckCircle, ChevronDown, ArrowRight, Loader2 } from 'lucide-react';
import { Location } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { LocationPickerModal } from './LocationPickerModal';

interface BuggyBookingFormProps {
  pickup: string;
  destination: string;
  guestCount: number;
  notes: string;
  locations: Location[];
  isDetectingLocation: boolean;
  isBooking: boolean;
  showPickupDropdown: boolean;
  showDestinationDropdown: boolean;
  onPickupChange: (pickup: string) => void;
  onDestinationChange: (destination: string) => void;
  onGuestCountChange: (count: number) => void;
  onNotesChange: (notes: string) => void;
  onBook: () => void;
  onShowPickupDropdown: (show: boolean) => void;
  onShowDestinationDropdown: (show: boolean) => void;
  onValidationError: (msg: string) => void;
}

export const BuggyBookingForm: React.FC<BuggyBookingFormProps> = ({
  pickup,
  destination,
  guestCount,
  notes,
  locations,
  isDetectingLocation,
  isBooking,
  showPickupDropdown,
  showDestinationDropdown,
  onPickupChange,
  onDestinationChange,
  onGuestCountChange,
  onNotesChange,
  onBook,
  onShowPickupDropdown,
  onShowDestinationDropdown,
  onValidationError
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 min-h-0" style={{ maxHeight: 'calc(100% - 80px)', overflowX: 'hidden' }}>
      {/* Booking Progress Stepper */}
      <div className="mb-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-emerald-100/50 p-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200"></div>
            <div
              className="absolute top-5 h-0.5 bg-emerald-600"
              style={{
                left: '10%',
                width: destination ? '80%' : pickup ? '30%' : '0%'
              }}
            ></div>
            {destination && (
              <div
                className="absolute top-5 h-0.5 bg-emerald-600"
                style={{
                  left: '45%',
                  width: guestCount > 1 || notes ? '30%' : '15%'
                }}
              ></div>
            )}

            {/* Step 1: Pickup */}
            <div className="flex flex-col items-center flex-1 relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  pickup
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/50'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {pickup ? <CheckCircle className="w-6 h-6" /> : <LocateFixed className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 text-center ${pickup ? 'text-emerald-700' : 'text-gray-500'}`}>
                {t('pickup_point') || 'Pickup'}
              </span>
            </div>

            {/* Step 2: Destination */}
            <div className="flex flex-col items-center flex-1 relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  destination
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/50'
                    : pickup
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-600'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {destination ? <CheckCircle className="w-6 h-6" /> : <MapPin className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 text-center ${destination ? 'text-emerald-700' : pickup ? 'text-emerald-600' : 'text-gray-500'}`}>
                {t('destination') || 'Destination'}
              </span>
            </div>

            {/* Step 3: Details */}
            <div className="flex flex-col items-center flex-1 relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  destination
                    ? guestCount > 1 || notes
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/50'
                      : 'bg-emerald-100 border-emerald-300 text-emerald-600'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {destination && (guestCount > 1 || notes) ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="text-lg">👥</span>
                )}
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 text-center ${destination ? (guestCount > 1 || notes ? 'text-emerald-700' : 'text-emerald-600') : 'text-gray-500'}`}>
                Details
              </span>
            </div>

            {/* Step 4: Ready */}
            <div className="flex flex-col items-center flex-1 relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  destination
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/50'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {destination ? <Car className="w-5 h-5" /> : <span className="text-lg opacity-50">✓</span>}
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 text-center ${destination ? 'text-emerald-700' : 'text-gray-500'}`}>
                {t('ready') || 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-emerald-100/50 p-4 space-y-3">
        {/* Pickup location */}
        <div className="relative group">
          <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-wide">{t('pickup_point')}</label>
          {isDetectingLocation ? (
            <div className="relative">
              <LocateFixed className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 w-4 h-4" />
              <input
                type="text"
                value={t('detecting_location')}
                readOnly
                className="w-full pl-10 pr-3 py-3 text-sm bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-2 border-emerald-300 rounded-xl text-emerald-700 font-semibold focus:outline-none cursor-default shadow-inner"
              />
            </div>
          ) : (
            <button
              onClick={() => onShowPickupDropdown(!showPickupDropdown)}
              className="w-full relative flex items-center justify-between pl-10 pr-3 py-3 text-sm bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-xl text-gray-900 font-semibold hover:border-emerald-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400"
              style={{ transform: 'translateZ(0)' }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <LocateFixed className="absolute left-3 text-emerald-600 w-4 h-4 flex-shrink-0" />
                <span className="truncate">{pickup}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-emerald-600 flex-shrink-0 ${showPickupDropdown ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Destination location */}
        <div className="relative group">
          <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-wide">{t('destination')}</label>
          <button
            onClick={() => onShowDestinationDropdown(true)}
            className={`w-full relative flex items-center justify-between pl-10 pr-3 py-3 text-sm border-2 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 ${
              destination
                ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-300 text-gray-900 hover:border-emerald-400 hover:shadow-md'
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-emerald-300'
            }`}
            style={{ transform: 'translateZ(0)' }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPin className={`absolute left-3 w-4 h-4 flex-shrink-0 ${destination ? 'text-emerald-600' : 'text-gray-400'}`} />
              <span className="truncate">{destination || t('select_destination')}</span>
            </div>
            <ChevronDown className={`w-4 h-4 flex-shrink-0 ${destination ? 'text-emerald-600' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Guest Count & Notes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative group">
            <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-wide">{t('number_of_guests')}</label>
            <div className="relative">
              <select
                value={guestCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  if (value >= 1 && value <= 7) {
                    onGuestCountChange(value);
                  }
                }}
                className="w-full pl-9 pr-3 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 appearance-none cursor-pointer shadow-sm hover:shadow-md"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? t('guest') : t('guests')}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                <span className="text-sm">👥</span>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
          <div className="relative group">
            <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-wide">{t('notes_optional')}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder={t('luggage_special_requests')}
              maxLength={100}
              className="w-full px-3 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-medium hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        {/* Route Summary */}
        {destination && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700 truncate flex-1">{pickup}</span>
              <ArrowRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-700 truncate flex-1 text-right">{destination}</span>
            </div>
          </div>
        )}

        {/* Book Button */}
        <button
          onClick={onBook}
          disabled={!destination || isBooking}
          className={`w-full py-4 rounded-xl font-bold text-base shadow-xl flex items-center justify-center gap-2 relative overflow-hidden group ${
            destination && !isBooking
              ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 text-white hover:shadow-2xl hover:shadow-emerald-500/50 active:scale-[0.98] cursor-pointer'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
          }`}
          style={{ transform: 'translateZ(0)' }}
        >
          <span className="relative z-10 flex items-center gap-2">
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
          </span>
        </button>
      </div>

      {/* Location Pickers */}
      <LocationPickerModal
        isOpen={showPickupDropdown}
        title={t('select_pickup_location')}
        locations={locations}
        selectedLocation={pickup}
        excludeLocation={destination}
        onSelect={onPickupChange}
        onClose={() => onShowPickupDropdown(false)}
        onValidationError={onValidationError}
        themeColor="blue"
      />
      <LocationPickerModal
        isOpen={showDestinationDropdown}
        title={t('select_destination_location')}
        locations={locations}
        selectedLocation={destination}
        excludeLocation={pickup}
        onSelect={onDestinationChange}
        onClose={() => onShowDestinationDropdown(false)}
        onValidationError={onValidationError}
        themeColor="emerald"
      />
    </div>
  );
};
