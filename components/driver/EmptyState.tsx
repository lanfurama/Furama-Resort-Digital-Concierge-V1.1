import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    iconColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    iconColor = 'text-emerald-500'
}) => {
    return (
        <div className="text-center py-12 sm:py-16 md:py-24 px-4">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-lg`}>
                <Icon size={40} className={`sm:w-12 sm:h-12 ${iconColor}`} />
            </div>
            <p className="text-gray-700 font-bold text-base sm:text-lg mb-2">{title}</p>
            {description && (
                <p className="text-gray-500 text-sm max-w-xs mx-auto">{description}</p>
            )}
        </div>
    );
};
