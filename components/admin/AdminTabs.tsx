import React from 'react';
import { MapPin, Utensils, Calendar, Megaphone, BrainCircuit, Users, UserCheck, History, Home, Car } from 'lucide-react';
import { UserRole } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';

type TabType = 'LOCATIONS' | 'MENU' | 'EVENTS' | 'PROMOS' | 'KNOWLEDGE' | 'USERS' | 'GUESTS' | 'ROOMS' | 'HISTORY' | 'FLEET';

interface AdminTabsProps {
    currentTab: TabType;
    onTabChange: (tab: TabType) => void;
    userRole: UserRole;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ currentTab, onTabChange, userRole }) => {
    const { t } = useTranslation();
    const tabs = [
        { id: 'LOCATIONS', icon: MapPin, label: t('admin_tab_locations') },
        { id: 'ROOMS', icon: Home, label: t('admin_tab_rooms') },
        { id: 'FLEET', icon: Car, label: t('admin_tab_fleet') },
        { id: 'MENU', icon: Utensils, label: t('admin_tab_resort_services') },
        { id: 'EVENTS', icon: Calendar, label: t('admin_tab_events') },
        { id: 'PROMOS', icon: Megaphone, label: t('admin_tab_promo') },
        { id: 'KNOWLEDGE', icon: BrainCircuit, label: t('admin_tab_ai') },
        ...(userRole === UserRole.ADMIN ? [{ id: 'USERS', icon: Users, label: t('admin_tab_staff') }] : []),
        { id: 'GUESTS', icon: UserCheck, label: t('admin_tab_guests') },
        { id: 'HISTORY', icon: History, label: t('admin_tab_history') },
    ];

    return (
        <div className="flex bg-white shadow-md border-b-2 border-gray-300 overflow-x-auto scrollbar-hide sticky top-[73px] md:top-[81px] z-20">
            <div className="flex min-w-full">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id as TabType)}
                            className={`relative flex-1 min-w-[90px] md:min-w-[120px] lg:min-w-[140px] py-3.5 md:py-4 font-semibold flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 transition-colors hover:bg-gray-50 ${
                                isActive 
                                    ? 'text-emerald-800 bg-emerald-100 border-b-2 border-emerald-700 shadow-sm' 
                                    : 'text-gray-700 bg-white hover:text-gray-900'
                            }`}
                        >
                            <div className={`relative flex-shrink-0 ${isActive ? 'scale-110' : ''}`}>
                                <Icon size={20} className={isActive ? 'text-emerald-700' : 'text-gray-600'} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-xs md:text-sm font-medium truncate max-w-full px-1 ${isActive ? 'text-emerald-800 font-bold' : 'text-gray-700'}`}>
                                {tab.label}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
