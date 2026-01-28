import { useEffect, useRef } from 'react';

/** Hai nốt ding-dong qua Web Audio API */
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
    playTone(523.25, now, 0.14, 0.11);       // C5
    playTone(659.25, now + 0.16, 0.16, 0.1); // E5
}

/** Chuỗi rung: 150ms rung, 80ms nghỉ, 150ms rung — cảm giác "ding-dong" */
const VIBRATE_PATTERN = [150, 80, 150];

export interface UseDriverAlertFeedbackOptions {
    soundEnabled?: boolean;
    vibrateEnabled?: boolean;
    intervalMs?: number;
}

/**
 * Chỉ phát tiếng chuông + rung máy khi có cảnh báo, không hiện UI.
 * Gọi khi có request / cần đón / cần hoàn thành / gợi ý gộp chuyến.
 */
export function useDriverAlertFeedback(
    hasAlert: boolean,
    options: UseDriverAlertFeedbackOptions = {}
) {
    const { soundEnabled = true, vibrateEnabled = true, intervalMs = 2500 } = options;
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!hasAlert) return;

        const tick = () => {
            if (soundEnabled) {
                try {
                    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                    if (Ctx) {
                        const ctx = audioContextRef.current ?? new Ctx();
                        if (!audioContextRef.current) audioContextRef.current = ctx;
                        const play = () => playNotificationChime(ctx);
                        if (ctx.state === 'suspended') {
                            ctx.resume().then(play).catch(() => {});
                        } else {
                            play();
                        }
                    }
                } catch {
                    // Ignore autoplay / audio errors
                }
            }
            if (vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
                try {
                    navigator.vibrate(VIBRATE_PATTERN);
                } catch {
                    // Ignore
                }
            }
        };

        intervalRef.current = setInterval(tick, intervalMs);
        tick();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
        };
    }, [hasAlert, soundEnabled, vibrateEnabled, intervalMs]);
}
