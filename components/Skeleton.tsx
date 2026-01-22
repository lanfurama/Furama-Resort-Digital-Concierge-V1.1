import React from 'react';

interface SkeletonCardProps {
    variant?: 'menu-item' | 'service-card' | 'order-card';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ variant = 'menu-item' }) => {
    if (variant === 'menu-item') {
        return (
            <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 animate-pulse">
                <div className="flex gap-4">
                    {/* Image skeleton */}
                    <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0" />

                    {/* Content skeleton */}
                    <div className="flex-1 space-y-3">
                        {/* Title */}
                        <div className="h-4 bg-gray-200 rounded w-3/4" />

                        {/* Description */}
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-full" />
                            <div className="h-3 bg-gray-200 rounded w-5/6" />
                        </div>

                        {/* Price and button */}
                        <div className="flex justify-between items-center pt-2">
                            <div className="h-5 bg-gray-200 rounded w-20" />
                            <div className="h-8 bg-gray-200 rounded-full w-8" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'service-card') {
        return (
            <div className="relative flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 animate-pulse">
                {/* Icon skeleton */}
                <div className="p-3 rounded-xl mb-2 bg-gray-200 w-16 h-16" />

                {/* Text skeleton */}
                <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
        );
    }

    if (variant === 'order-card') {
        return (
            <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 animate-pulse">
                <div className="flex justify-between items-start mb-3">
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full w-20" />
                </div>
                <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
            </div>
        );
    }

    return null;
};

interface SkeletonListProps {
    count?: number;
    variant?: 'menu-item' | 'service-card' | 'order-card';
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
    count = 3,
    variant = 'menu-item'
}) => {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} variant={variant} />
            ))}
        </div>
    );
};
