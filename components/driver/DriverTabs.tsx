import React from 'react';
import { useTranslation } from '../../contexts/LanguageContext';

interface DriverTabsProps {
    viewMode: 'REQUESTS' | 'HISTORY';
    onViewModeChange: (mode: 'REQUESTS' | 'HISTORY') => void;
    requestsCount: number;
    historyCount: number;
}

export const DriverTabs: React.FC<DriverTabsProps> = ({
    viewMode,
    onViewModeChange,
    requestsCount,
    historyCount
}) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white border-b-2 border-gray-200 shadow-sm">
            <div className="flex">
                <button
                    onClick={() => onViewModeChange('REQUESTS')}
                    className={`flex-1 py-3.5 px-3 md:py-4 md:px-5 font-bold text-sm md:text-base transition-all duration-200 min-h-[52px] md:min-h-[56px] flex items-center justify-center touch-manipulation active:scale-[0.98] ${viewMode === 'REQUESTS'
                        ? 'text-emerald-600 border-b-3 border-emerald-600 bg-emerald-50/50'
                        : 'text-gray-500 border-b-3 border-transparent hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    style={{ borderBottomWidth: viewMode === 'REQUESTS' ? '3px' : '0px' }}
                >
                    {t('driver_requests')} ({requestsCount})
                </button>
                <button
                    onClick={() => onViewModeChange('HISTORY')}
                    className={`flex-1 py-3.5 px-3 md:py-4 md:px-5 font-bold text-sm md:text-base transition-all duration-200 min-h-[52px] md:min-h-[56px] flex items-center justify-center touch-manipulation active:scale-[0.98] ${viewMode === 'HISTORY'
                        ? 'text-emerald-600 border-b-3 border-emerald-600 bg-emerald-50/50'
                        : 'text-gray-500 border-b-3 border-transparent hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    style={{ borderBottomWidth: viewMode === 'HISTORY' ? '3px' : '0px' }}
                >
                    {t('driver_history')} ({historyCount})
                </button>
            </div>
        </div>
    );
};
