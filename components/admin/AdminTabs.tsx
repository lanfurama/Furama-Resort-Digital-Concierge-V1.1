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
        <div className="flex bg-white shadow-md border-b-2 border-gray-300 overflow-x-auto scrollbar-hide sticky top-[73px] md:top-[81px] z-20">
            <div className="flex min-w-full">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id as TabType)}
                            className={`relative flex-1 min-w-[90px] md:min-w-[120px] py-3.5 md:py-4 font-semibold flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 active:scale-95 ${
                                isActive 
                                    ? 'text-emerald-800 bg-emerald-100 border-b-3 border-emerald-700 shadow-sm' 
                                    : 'text-gray-700 bg-white'
                            }`}
                        >
                            <div className={`relative ${isActive ? 'scale-110' : ''}`}>
                                <Icon size={20} className={isActive ? 'text-emerald-700' : 'text-gray-600'} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-xs md:text-sm font-medium ${isActive ? 'text-emerald-800 font-bold' : 'text-gray-700'}`}>
                                {tab.label}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-700"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
