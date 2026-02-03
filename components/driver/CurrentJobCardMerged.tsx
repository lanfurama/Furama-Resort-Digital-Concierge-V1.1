import React from 'react';
import { Navigation, Loader2, UserCheck, MapPin } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { RideRequest, RouteSegment } from '../../types';
import { formatTime } from './utils/rideUtils';

interface CurrentJobCardMergedProps {
    ride: RideRequest;
    loadingAction: string | null;
    onAdvanceStep: (rideId: string, currentProgress: number) => void;
    onComplete: (rideId: string) => void;
    onOpenChat: () => void;
}

export const CurrentJobCardMerged: React.FC<CurrentJobCardMergedProps> = ({
    ride,
    loadingAction,
    onAdvanceStep,
    onComplete,
    onOpenChat: _onOpenChat // Not used: chat disabled for merged rides
}) => {
    const { t } = useTranslation();
    const segments: RouteSegment[] = ride.segments || [];
    const progress = ride.mergedProgress ?? 0;
    const totalSteps = segments.length * 2;
    const isPickStep = progress < totalSteps && progress % 2 === 0;
    const segmentIndex = Math.floor(progress / 2);
    const isLastStep = progress === totalSteps - 1;

    const isLoadingStep = loadingAction === `merge-step-${ride.id}`;
    const isCompleting = loadingAction === `complete-${ride.id}`;

    const currentSegment = segments[segmentIndex];
    const buttonLabel = isPickStep
        ? t('driver_picked_up')
        : isLastStep
            ? t('driver_complete')
            : t('driver_drop_off');

    const actionButtonClass = isPickStep
        ? 'bg-sky-600 hover:bg-sky-700'
        : isLastStep
            ? 'bg-teal-600 hover:bg-teal-700'
            : 'bg-slate-600 hover:bg-slate-700';

    const handleAction = () => {
        if (isLastStep && !isPickStep) {
            onComplete(ride.id);
        } else {
            onAdvanceStep(ride.id, progress);
        }
    };

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 border-b-2 border-amber-200 shadow-lg">
            <div className="flex items-start gap-4">
                <div className="flex flex-col items-center min-w-[80px]">
                    <div className="text-3xl font-black text-amber-700 mb-1">#{ride.roomNumber}</div>
                    <div className="text-xs text-amber-600 font-medium">{t('driver_merged_trip')}</div>
                    <div className="text-sm text-gray-600 font-medium mt-1">{formatTime(ride.timestamp)}</div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg text-gray-900 mb-2">{ride.guestName}</div>
                    <div className="space-y-2 mb-4">
                        {segments.map((seg, idx) => {
                            const stepIndex = idx * 2;
                            const done = progress > stepIndex + 1;
                            const current = progress === stepIndex || progress === stepIndex + 1;
                            const guestWord = t('guests');
                            const onBoardStr = seg.onBoard.map((g) => `#${g.roomNumber} (${g.count} ${guestWord})`).join(', ');
                            return (
                                <div
                                    key={idx}
                                    className={`rounded-lg p-2 border-2 text-sm ${
                                        done
                                            ? 'bg-gray-100 border-gray-200 text-gray-600'
                                            : current
                                                ? 'bg-amber-100 border-amber-400 text-amber-900'
                                                : 'bg-white border-gray-200 text-gray-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 font-medium">
                                        {done ? (
                                            <span className="text-emerald-600">✓</span>
                                        ) : current ? (
                                            <MapPin className="w-4 h-4 text-amber-600" />
                                        ) : (
                                            <span className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                        )}
                                        <span>{seg.from} → {seg.to}</span>
                                    </div>
                                    <div className="ml-6 text-xs text-gray-600 mt-0.5">
                                        {t('driver_on_board')} {onBoardStr || '—'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                    {/* Chat hidden for merged rides - roomNumber is "101+205", not a single room */}
                    <button
                        onClick={handleAction}
                        disabled={isLoadingStep || isCompleting}
                        className={`${actionButtonClass} text-white px-6 py-4 rounded-xl font-bold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md min-w-[140px] min-h-[56px] flex items-center justify-center gap-2`}
                    >
                        {isLoadingStep || isCompleting ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                {isPickStep && <UserCheck size={20} />}
                                {buttonLabel}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
