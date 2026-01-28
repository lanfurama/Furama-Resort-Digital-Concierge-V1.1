import React from 'react';
import { Users, Navigation, Loader2 } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
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
    const { t } = useTranslation();
    const { ride1, ride2, optimalRoute } = suggestion;
    const totalGuests = (ride1.guestCount || 1) + (ride2.guestCount || 1);
    const routePathDisplay = optimalRoute.routePath.join(' → ');
    const guestsSameWay = t('driver_merge_guests_same_way').replace('{count}', String(totalGuests));
    const guestWord = totalGuests === 1 ? t('guest') : t('guests');

    return (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-lg mb-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-base mb-3">
                <Users className="w-5 h-5" />
                <span>{t('driver_merge_title')}</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">
                {guestsSameWay}
            </p>
            <div className="space-y-1.5 text-sm mb-3">
                <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">#{ride1.roomNumber}</span>
                    <span>{ride1.pickup} → {ride1.destination}</span>
                    <span className="text-gray-500">({ride1.guestCount || 1} {guestWord})</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">#{ride2.roomNumber}</span>
                    <span>{ride2.pickup} → {ride2.destination}</span>
                    <span className="text-gray-500">({ride2.guestCount || 1} {guestWord})</span>
                </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-4">
                <Navigation className="w-4 h-4" />
                <span>{t('driver_merged_route')} {routePathDisplay}</span>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={onAccept}
                    disabled={isMerging}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                    {isMerging ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : null}
                    {t('driver_accept_merge')}
                </button>
                <button
                    onClick={onReject}
                    disabled={isMerging}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-4 rounded-xl disabled:opacity-50 transition-colors"
                >
                    {t('driver_reject_merge')}
                </button>
            </div>
        </div>
    );
};
