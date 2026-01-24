import React from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface LocationDetectionModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onManualSelect: () => void;
}

const LocationDetectionModal: React.FC<LocationDetectionModalProps> = ({
    isOpen,
    onCancel,
    onManualSelect
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop - click to close */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
                onClick={onCancel}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors touch-manipulation"
                        aria-label={t('cancel')}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon with pulse animation */}
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
                            <div className="relative bg-emerald-50 rounded-full p-4">
                                <Navigation className="w-12 h-12 text-emerald-600 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                        {t('detecting_location')}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 text-center mb-6">
                        {t('location_detecting_desc')}
                    </p>

                    {/* Progress indicator */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full animate-shimmer"
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Manual selection button */}
                    <button
                        onClick={onManualSelect}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg active:scale-[0.98] touch-manipulation"
                    >
                        <MapPin className="w-5 h-5 flex-shrink-0" />
                        <span>{t('manual_select_location')}</span>
                    </button>

                    {/* Cancel link */}
                    <button
                        onClick={onCancel}
                        className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors py-2 touch-manipulation"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </>
    );
};

export default LocationDetectionModal;
