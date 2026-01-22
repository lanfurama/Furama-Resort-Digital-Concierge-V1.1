import React, { useEffect } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';

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
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 pointer-events-auto animate-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
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
                        Đang xác định vị trí
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 text-center mb-6">
                        Đang sử dụng GPS để tìm vị trí hiện tại của bạn...
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
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
                    >
                        <MapPin className="w-5 h-5" />
                        <span>Chọn vị trí thủ công</span>
                    </button>

                    {/* Cancel link */}
                    <button
                        onClick={onCancel}
                        className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Hủy
                    </button>
                </div>
            </div>
        </>
    );
};

export default LocationDetectionModal;
