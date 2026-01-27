import React from 'react';
import { Users, Navigation, Loader2 } from 'lucide-react';
import { MergeSuggestion } from './hooks/useDriverMerge';

interface MergeSuggestionCardProps {
    suggestion: MergeSuggestion;
    onAccept: () => void;
    onReject: () => void;
    isMerging: boolean;
}

export const MergeSuggestionCard: React.FC<MergeSuggestionCardProps> = ({
    suggestion,
    onAccept,
    onReject,
    isMerging
}) => {
    const { ride1, ride2, optimalRoute } = suggestion;
    const totalGuests = (ride1.guestCount || 1) + (ride2.guestCount || 1);
    const routePathDisplay = optimalRoute.routePath.join(' → ');

    return (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-lg mb-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-base mb-3">
                <Users className="w-5 h-5" />
                <span>Gợi ý gộp chuyến</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">
                Có {totalGuests} khách cùng hướng, có thể gộp để tối ưu tuyến:
            </p>
            <div className="space-y-1.5 text-sm mb-3">
                <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">#{ride1.roomNumber}</span>
                    <span>{ride1.pickup} → {ride1.destination}</span>
                    <span className="text-gray-500">({ride1.guestCount || 1} khách)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">#{ride2.roomNumber}</span>
                    <span>{ride2.pickup} → {ride2.destination}</span>
                    <span className="text-gray-500">({ride2.guestCount || 1} khách)</span>
                </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-4">
                <Navigation className="w-4 h-4" />
                <span>Tuyến gộp: {routePathDisplay}</span>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={onAccept}
                    disabled={isMerging}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isMerging ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : null}
                    Chấp nhận gộp
                </button>
                <button
                    onClick={onReject}
                    disabled={isMerging}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-xl disabled:opacity-50"
                >
                    Từ chối
                </button>
            </div>
        </div>
    );
};
