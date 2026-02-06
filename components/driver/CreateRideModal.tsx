import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

interface Location {
    id: string;
    name: string;
}

interface CreateRideModalProps {
    isOpen: boolean;
    isCreating: boolean;
    rideData: {
        roomNumber: string;
        pickup: string;
        destination: string;
        guestCount?: number;
    };
    locations: Location[];
    onClose: () => void;
    onDataChange: (data: { roomNumber: string; pickup: string; destination: string; guestCount?: number }) => void;
    onSubmit: () => void;
}

export const CreateRideModal: React.FC<CreateRideModalProps> = ({
    isOpen,
    isCreating,
    rideData,
    locations,
    onClose,
    onDataChange,
    onSubmit
}) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    const handleChange = (field: keyof typeof rideData, value: string | number) => {
        onDataChange({ ...rideData, [field]: value });
    };

    const samePickupAndDestination = Boolean(rideData.pickup && rideData.destination && rideData.pickup === rideData.destination);
    const canSubmit = rideData.pickup && rideData.destination && !samePickupAndDestination && !isCreating;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in" onClick={() => !isCreating && onClose()}>
            <div className="backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl w-full max-w-sm border-2 border-gray-200/60 max-h-[90vh] overflow-y-auto"
                style={{
                    boxShadow: '0 25px 70px -20px rgba(0,0,0,0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-5 border-b-2 border-gray-200/60 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                    <h3 className="font-bold text-lg md:text-xl text-gray-900">{t('driver_create_new_ride')}</h3>
                    <button
                        onClick={() => !isCreating && onClose()}
                        disabled={isCreating}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-all min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X size={20} className="md:w-5 md:h-5" strokeWidth={2.5} />
                    </button>
                </div>
                <div className="p-5 md:p-6 space-y-4">
                    <div>
                        <label className="block text-xs md:text-sm uppercase text-gray-600 font-bold mb-2">{t('driver_room_optional')}</label>
                        <input
                            type="text"
                            value={rideData.roomNumber}
                            onChange={(e) => handleChange('roomNumber', e.target.value)}
                            placeholder="e.g. 101"
                            disabled={isCreating}
                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3.5 md:p-3 text-gray-900 text-sm md:text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[44px] transition-all caret-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ caretColor: '#10b981' }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs md:text-sm uppercase text-gray-600 font-bold mb-2">{t('driver_pickup_location')}</label>
                        <select
                            value={rideData.pickup}
                            onChange={(e) => handleChange('pickup', e.target.value)}
                            disabled={isCreating}
                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3.5 md:p-3 text-gray-900 text-sm md:text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[44px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">{t('driver_select_pickup')}</option>
                            <option value="Current Location">Current Location</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.name}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs md:text-sm uppercase text-gray-600 font-bold mb-2">{t('number_of_guests')}</label>
                        <input
                            type="number"
                            min={1}
                            max={7}
                            value={rideData.guestCount ?? 1}
                            onChange={(e) => handleChange('guestCount', parseInt(e.target.value, 10) || 1)}
                            disabled={isCreating}
                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3.5 md:p-3 text-gray-900 text-sm md:text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[44px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-xs md:text-sm uppercase text-gray-600 font-bold mb-2">{t('driver_destination')}</label>
                        <select
                            value={rideData.destination}
                            onChange={(e) => handleChange('destination', e.target.value)}
                            disabled={isCreating}
                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3.5 md:p-3 text-gray-900 text-sm md:text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[44px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">{t('driver_select_destination')}</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.name}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                    {samePickupAndDestination && (
                        <p className="text-sm text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-xl px-3 py-2" role="alert">
                            {t('pickup_destination_same_error')}
                        </p>
                    )}

                    <button
                        onClick={onSubmit}
                        disabled={!canSubmit}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 md:py-2 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-base md:text-sm min-h-[48px] md:min-h-[48px] shadow-md transition-colors flex items-center justify-center gap-2 touch-manipulation"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>{t('driver_creating_ride')}</span>
                            </>
                        ) : (
                            <span>{t('driver_start_trip')}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
