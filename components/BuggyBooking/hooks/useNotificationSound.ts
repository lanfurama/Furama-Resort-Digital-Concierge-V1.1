import { useCallback } from 'react';

/**
 * Hook to play notification sound
 */
export const useNotificationSound = (soundEnabled: boolean) => {
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      // Create audio context for a simple beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      // Longer duration: 0.6 seconds with smoother fade
      const duration = 0.6;
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.2); // Hold at 0.3 for 0.2s
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [soundEnabled]);

  return playNotificationSound;
};

