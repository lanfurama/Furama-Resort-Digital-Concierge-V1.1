import React from 'react';
import { MapPin, Utensils, Calendar, Megaphone, BrainCircuit, Users, UserCheck, History, Home, Car } from 'lucide-react';
import { UserRole } from '../../types';

type TabType = 'LOCATIONS' | 'MENU' | 'EVENTS' | 'PROMOS' | 'KNOWLEDGE' | 'USERS' | 'GUESTS' | 'ROOMS' | 'HISTORY' | 'FLEET';

interface AdminTabsProps {
    currentTab: TabType;
    onTabChange: (tab: TabType) => void;
    userRole: UserRole;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ currentTab, onTabChange, userRole }) => {
    const tabs = [
        { id: 'LOCATIONS', icon: MapPin, label: 'Locs' },
        { id: 'ROOMS', icon: Home, label: 'Rooms' },
        { id: 'FLEET', icon: Car, label: 'Fleet' },
        { id: 'MENU', icon: Utensils, label: 'Resort Services' },
        { id: 'EVENTS', icon: Calendar, label: 'Events' },
        { id: 'PROMOS', icon: Megaphone, label: 'Promo' },
        { id: 'KNOWLEDGE', icon: BrainCircuit, label: 'AI' },
        ...(userRole === UserRole.ADMIN ? [{ id: 'USERS', icon: Users, label: 'Staff' }] : []),
        { id: 'GUESTS', icon: UserCheck, label: 'Guests' },
        { id: 'HISTORY', icon: History, label: 'History' },
    ];

    return (
        <div className="flex bg-white shadow-md border-b border-gray-200 overflow-x-auto scrollbar-hide sticky top-[73px] md:top-[81px] z-20">
            <div className="flex min-w-full">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id as TabType)}
                            className={`relative flex-1 min-w-[90px] md:min-w-[120px] py-3 md:py-4 font-semibold flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 transition-all duration-200 group ${
                                isActive 
                                    ? 'text-emerald-700 bg-emerald-50/50' 
                                    : 'text-gray-500 hover:text-emerald-600 hover:bg-gray-50'
                            }`}
                        >
                            <div className={`relative transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                                <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-500'} />
                            </div>
                            <span className={`text-xs md:text-sm transition-colors ${isActive ? 'text-emerald-700 font-bold' : 'text-gray-500 group-hover:text-emerald-600'}`}>
                                {tab.label}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 shadow-sm"></div>
                            )}
                            {!isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-emerald-200/50 transition-colors"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
