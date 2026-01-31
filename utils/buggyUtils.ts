// Utility functions for BuggyBooking component

export const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatRequestTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatWaitingTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  if (mins === 0) {
    return `${seconds}s`;
  }
  const secs = seconds % 60;
  if (secs === 0) {
    return `${mins}m`;
  }
  return `${mins}m ${secs}s`;
};

export const playNotificationSound = (soundEnabled: boolean): void => {
  if (!soundEnabled) return;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    const duration = 0.6;
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Notification sound optional; fail silently
  }
};

/** Hai nốt ding-dong (C5 → E5) – dùng cho driver */
function playNotificationChime(ctx: AudioContext): void {
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

/**
 * Âm thanh guest: giai điệu 3 nốt đi lên (da-da-daa) – khác hẳn driver (ding-dong 2 nốt).
 * Dùng triangle wave, ngắn gọn, dễ phân biệt.
 */
function playGuestChime(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const playTone = (freq: number, start: number, duration: number, volume: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.start(start);
    osc.stop(start + duration);
  };
  // Ba nốt ngắn đi lên: A4 → C5 → E5 (arpeggio)
  playTone(440, now, 0.1, 0.1);             // A4
  playTone(523.25, now + 0.12, 0.1, 0.1);    // C5
  playTone(659.25, now + 0.24, 0.14, 0.12);  // E5 (nốt cuối hơi dài hơn)
}

/** Chuỗi rung ngắn: 150ms rung, 80ms nghỉ, 150ms rung */
const VIBRATE_PATTERN = [150, 80, 150];

/** Shared AudioContext for guest – mở bằng user gesture (click Request) để trình duyệt cho phép phát sau này */
let guestAudioContext: AudioContext | null = null;

const getAudioContextCtor = (): typeof AudioContext | null =>
  window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || null;

/**
 * Lấy hoặc tạo AudioContext cho guest. Dùng chung một context để có thể phát sau khi đã unlock bằng user gesture.
 */
function getOrCreateGuestAudioContext(): AudioContext | null {
  const Ctx = getAudioContextCtor();
  if (!Ctx) return null;
  if (guestAudioContext && guestAudioContext.state !== 'closed') {
    return guestAudioContext;
  }
  guestAudioContext = new Ctx();
  return guestAudioContext;
}

/**
 * Gọi khi user bấm (vd: Request Buggy) để mở AudioContext – trình duyệt chỉ cho phép âm thanh sau user gesture.
 * Gọi trước khi play lần đầu hoặc ngay khi vào màn Buggy để khi có driver assigned thì vẫn nghe được.
 */
export function unlockGuestAudioContext(): void {
  const ctx = getOrCreateGuestAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Chỉ phát chuông ding-dong (không rung). Dùng khi đang "Finding driver" – lặp mỗi vài giây.
 */
export const playGuestChimeOnly = (soundEnabled: boolean): void => {
  if (!soundEnabled) return;
  try {
    const ctx = getOrCreateGuestAudioContext();
    if (ctx) {
      const play = () => playGuestChime(ctx);
      if (ctx.state === 'suspended') {
        ctx.resume().then(play).catch(() => {});
      } else {
        play();
      }
    }
  } catch {
    // Ignore
  }
};

/**
 * Một lần: giai điệu guest (3 nốt) + rung. Dùng khi guest gửi request hoặc có cập nhật trạng thái.
 * Âm thanh guest khác hẳn driver (ding-dong 2 nốt).
 */
export const playGuestNotificationFeedback = (
  soundEnabled: boolean,
  vibrateEnabled: boolean
): void => {
  if (vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(VIBRATE_PATTERN);
    } catch {
      // Ignore
    }
  }
  if (soundEnabled) {
    try {
      const ctx = getOrCreateGuestAudioContext();
      if (ctx) {
        const play = () => playGuestChime(ctx);
        if (ctx.state === 'suspended') {
          ctx.resume().then(play).catch(() => {});
        } else {
          play();
        }
      }
    } catch {
      // Ignore
    }
  }
};
