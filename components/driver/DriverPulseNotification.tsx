import React from 'react';
import { Zap, UserCheck, CheckCircle, Users } from 'lucide-react';

export type DriverAlertType = 'REQUEST' | 'PICKUP' | 'COMPLETE' | 'MERGE';

interface DriverPulseNotificationProps {
    type: DriverAlertType;
    message: string;
    /** Optional: room number or short detail for context */
    detail?: string;
    /** Reserved: sound is handled by useDriverAlertFeedback in DriverPortal to avoid double beep. */
    soundEnabled?: boolean;
    /** Reserved: beep interval is controlled by the hook. */
    beepIntervalMs?: number;
    /** Tailwind top class for fixed position, e.g. "top-14". Default "top-2". */
    topClass?: string;
}

const typeConfig: Record<DriverAlertType, { icon: typeof Zap; bg: string; border: string }> = {
    REQUEST: { icon: Zap, bg: 'bg-amber-500', border: 'border-amber-400' },
    PICKUP: { icon: UserCheck, bg: 'bg-blue-500', border: 'border-blue-400' },
    COMPLETE: { icon: CheckCircle, bg: 'bg-emerald-500', border: 'border-emerald-400' },
    MERGE: { icon: Users, bg: 'bg-violet-500', border: 'border-violet-400' },
};

/** Visual-only alert banner. Chime + vibrate are handled by useDriverAlertFeedback in DriverPortal. */
export const DriverPulseNotification: React.FC<DriverPulseNotificationProps> = ({
    type,
    message,
    detail,
    topClass = 'top-2',
}) => {
    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div
            className={`fixed left-2 right-2 ${topClass} z-[60] flex items-center gap-3 rounded-2xl border-2 ${config.border} ${config.bg} px-4 py-3 shadow-2xl animate-pulse`}
            style={{ boxShadow: '0 8px 24px -8px rgba(0,0,0,0.35)' }}
            role="alert"
        >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/90 text-gray-800">
                <Icon className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1 text-white">
                <p className="font-bold drop-shadow-sm">{message}</p>
                {detail && <p className="text-sm font-medium opacity-95">{detail}</p>}
            </div>
            <div className="flex-shrink-0 text-right">
                <span className="inline-block h-3 w-3 rounded-full bg-white animate-ping" style={{ animationDuration: '1.2s' }} />
            </div>
        </div>
    );
};
