import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    loadingAction: string | null;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ loadingAction }) => {
    if (!loadingAction) return null;

    const getMessage = () => {
        if (loadingAction.startsWith('pickup-')) return 'Picking up guest...';
        if (loadingAction.startsWith('complete-')) return 'Completing ride...';
        return 'Processing...';
    };

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 min-w-[200px]">
                <Loader2 size={32} className="animate-spin text-emerald-600" />
                <p className="text-gray-700 font-semibold text-base">
                    {getMessage()}
                </p>
            </div>
        </div>
    );
};
