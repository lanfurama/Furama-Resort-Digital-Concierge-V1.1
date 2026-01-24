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
        <div className="text-center py-24">
            <div className={`w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                <Icon size={48} className={iconColor} />
            </div>
            <p className="text-gray-700 font-bold text-lg mb-2">{title}</p>
            {description && (
                <p className="text-gray-500 text-sm">{description}</p>
            )}
        </div>
    );
};
