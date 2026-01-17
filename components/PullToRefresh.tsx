import React, { useState, useRef, useEffect } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    threshold?: number; // Distance in pixels to pull to trigger refresh
    maxPull?: number; // Maximum distance to pull
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
    onRefresh,
    children,
    threshold = 80,
    maxPull = 160
}) => {
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number>(0);
    const currentY = useRef<number>(0);
    const isDragging = useRef<boolean>(false);

    // Helper to check if we are at the top of the scroll container
    const isAtTop = () => {
        if (!contentRef.current) return false;
        return contentRef.current.scrollTop <= 0;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only enable pull if we are at the top
        if (!isAtTop()) return;

        startY.current = e.touches[0].clientY;
        isDragging.current = true;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;

        // Check again if we are currently at top, if user scrolled back up during drag
        // But simplified: if we started at top, we track the pull.

        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;

        // If pulling down (positive diff) and we were at top
        if (diff > 0 && isAtTop()) {
            // Prevent default to stop native browser scroll sometimes (though often passive listener prevents this)
            // e.preventDefault(); // Note: React touch events are passive by default, so specific handling might be needed if preventing default is critical.

            // Apply resistance
            const dampedDiff = Math.min(diff * 0.5, maxPull);
            setPullDistance(dampedDiff);
            setIsPulling(true);
        } else {
            // If we scroll back up or it wasn't a pull down
            setPullDistance(0);
            setIsPulling(false);
        }
    };

    const handleTouchEnd = async () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        if (isPulling && pullDistance >= threshold) {
            setIsRefreshing(true);
            setPullDistance(60); // Snap to loading position

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
                setIsPulling(false);
            }
        } else {
            // Cancel pull
            setIsPulling(false);
            setPullDistance(0);
        }
    };

    // Mouse events for desktop testing capability
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isAtTop()) return;
        startY.current = e.clientY;
        isDragging.current = true;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;

        // If buttons is 0, mouse is not pressed (e.g. moved out and released)
        if (e.buttons === 0) {
            isDragging.current = false;
            setPullDistance(0);
            setIsPulling(false);
            return;
        }

        currentY.current = e.clientY;
        const diff = currentY.current - startY.current;

        if (diff > 0 && isAtTop()) {
            const dampedDiff = Math.min(diff * 0.5, maxPull);
            setPullDistance(dampedDiff);
            setIsPulling(true);
        }
    };

    const handleMouseUp = async () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        if (isPulling && pullDistance >= threshold) {
            setIsRefreshing(true);
            setPullDistance(60);

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
                setIsPulling(false);
            }
        } else {
            setPullDistance(0);
            setIsPulling(false);
        }
    };

    return (
        <div
            className="relative h-full flex flex-col overflow-hidden"
        >
            {/* Loading Indicator */}
            <div
                className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-10"
                style={{
                    height: `${Math.max(pullDistance, 0)}px`,
                    opacity: Math.min(pullDistance / 40, 1),
                    transition: isDragging.current ? 'none' : 'height 0.3s ease-out, opacity 0.3s ease-out'
                }}
            >
                <div className="flex items-center justify-center p-2 rounded-full bg-white shadow-md border border-gray-100 mt-2">
                    {isRefreshing ? (
                        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                    ) : (
                        <ArrowDown
                            className="w-5 h-5 text-emerald-600 transition-transform duration-200"
                            style={{ transform: `rotate(${pullDistance >= threshold ? 180 : 0}deg)` }}
                        />
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div
                ref={contentRef}
                className="flex-1 overflow-y-auto no-scrollbar scroll-smooth"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
