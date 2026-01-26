import React, { memo } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface NetworkStatusBannerProps {
  autoReload?: boolean;
  position?: 'top' | 'bottom';
  showWhenOnline?: boolean; // Show brief message when connection restored
}

/**
 * Network status banner component
 * Shows offline notification and auto-reloads when connection is restored
 */
export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = memo(({
  autoReload = true,
  position = 'top',
  showWhenOnline = false,
}) => {
  const { isOnline, wasOffline } = useNetworkStatus(autoReload);

  // Don't render if online and not showing online status
  if (isOnline && !showWhenOnline) {
    return null;
  }

  // Show brief "reconnecting" message when connection is restored
  if (isOnline && wasOffline && showWhenOnline) {
    return (
      <div
        className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-[9999] bg-emerald-500 text-white px-4 py-3 shadow-lg transition-transform duration-300 ease-out animate-slide-down`}
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform',
          WebkitTransform: 'translateZ(0)', // WebView optimization
        }}
      >
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <Wifi className="w-4 h-4 flex-shrink-0" />
          <span>Connection restored. Reloading...</span>
          <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
        </div>
      </div>
    );
  }

  // Show offline message
  if (!isOnline) {
    return (
      <div
        className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-[9999] bg-red-500 text-white px-4 py-3 shadow-lg transition-transform duration-300 ease-out`}
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform',
          WebkitTransform: 'translateZ(0)', // WebView optimization
        }}
      >
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span className="text-center">No internet connection. Waiting for connection...</span>
        </div>
      </div>
    );
  }

  return null;
});

NetworkStatusBanner.displayName = 'NetworkStatusBanner';

// Add CSS animation for slide down - Optimized for WebView
if (typeof document !== 'undefined') {
  const styleId = 'network-status-styles';
  if (!document.head.querySelector(`#${styleId}`)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slide-down {
        from {
          transform: translateY(-100%) translateZ(0);
          opacity: 0;
        }
        to {
          transform: translateY(0) translateZ(0);
          opacity: 1;
        }
      }
      .animate-slide-down {
        animation: slide-down 0.3s ease-out forwards;
        will-change: transform, opacity;
      }
      /* WebView optimizations */
      @supports (-webkit-appearance: none) {
        .animate-slide-down {
          -webkit-transform: translateZ(0);
          -webkit-backface-visibility: hidden;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
