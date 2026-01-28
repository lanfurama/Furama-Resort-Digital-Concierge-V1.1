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
        <div className="bg-white border-b-2 border-gray-200 px-4 shadow-sm">
            <div className="flex space-x-2">
                <button
                    onClick={() => onViewModeChange('REQUESTS')}
                    className={`py-4 px-5 font-bold text-base transition-all duration-300 border-b-3 min-h-[56px] flex items-center ${viewMode === 'REQUESTS'
                        ? 'text-emerald-600 border-emerald-600'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                    style={{ borderBottomWidth: viewMode === 'REQUESTS' ? '3px' : '0px' }}
                >
                    {t('driver_requests')} ({requestsCount})
                </button>
                <button
                    onClick={() => onViewModeChange('HISTORY')}
                    className={`py-4 px-5 font-bold text-base transition-all duration-300 border-b-3 min-h-[56px] flex items-center ${viewMode === 'HISTORY'
                        ? 'text-emerald-600 border-emerald-600'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                    style={{ borderBottomWidth: viewMode === 'HISTORY' ? '3px' : '0px' }}
                >
                    {t('driver_history')} ({historyCount})
                </button>
            </div>
        </div>
    );
};
