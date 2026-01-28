import React, { useEffect, useRef } from 'react';
import { Zap, UserCheck, CheckCircle, Users } from 'lucide-react';

export type DriverAlertType = 'REQUEST' | 'PICKUP' | 'COMPLETE' | 'MERGE';

interface DriverPulseNotificationProps {
    type: DriverAlertType;
    message: string;
    /** Optional: room number or short detail for context */
    detail?: string;
    /** Play repeating beep. Default true. */
    soundEnabled?: boolean;
    /** Beep interval in ms. Default 2500. */
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

/** Pleasant two-tone chime (ding-dong style) via Web Audio API */
function playNotificationChime(ctx: AudioContext) {
    const now = ctx.currentTime;
    const playTone = (freq: number, start: number, duration: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.start(start);
        osc.stop(start + duration);
    };
    // Hai nốt C5 -> E5, nghe nhẹ kiểu "ding-dong" thông báo
    playTone(523.25, now, 0.14, 0.11);       // C5
    playTone(659.25, now + 0.16, 0.16, 0.1); // E5
}

/** Repeating notification chime loop */
function useBeepLoop(enabled: boolean, intervalMs: number) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!enabled) return;
        const play = () => {
            try {
                const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (!Ctx) return;
                const ctx = audioContextRef.current ?? new Ctx();
                if (!audioContextRef.current) audioContextRef.current = ctx;
                if (ctx.state === 'suspended') ctx.resume();
                playNotificationChime(ctx);
            } catch {
                // Ignore autoplay / audio errors
            }
        };
        intervalRef.current = setInterval(play, intervalMs);
        play();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
        };
    }, [enabled, intervalMs]);
}

export const DriverPulseNotification: React.FC<DriverPulseNotificationProps> = ({
    type,
    message,
    detail,
    soundEnabled = true,
    beepIntervalMs = 2500,
    topClass = 'top-2',
}) => {
    const config = typeConfig[type];
    const Icon = config.icon;

    useBeepLoop(soundEnabled, beepIntervalMs);

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
