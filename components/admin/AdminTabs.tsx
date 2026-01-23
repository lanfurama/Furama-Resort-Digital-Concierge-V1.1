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
    return (
        <div className="flex bg-white shadow-sm border-b border-gray-200 overflow-x-auto">
            <button
                onClick={() => onTabChange('LOCATIONS')}
                className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${currentTab === 'LOCATIONS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
            >
                <MapPin size={18} /> <span className="text-xs md:text-sm">Locs</span>
            </button>
            <button
                onClick={() => onTabChange('ROOMS')}
                className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${currentTab === 'ROOMS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
            >
                <Home size={18} /> <span className="text-xs md:text-sm">Rooms</span>
            </button>
            <button
                onClick={() => onTabChange('FLEET')}
                className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${currentTab === 'FLEET' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
            >
                <Car size={18} /> <span className="text-xs md:text-sm">Fleet</span>
            </button>
            <button
                onClick={() => onTabChange('MENU')}
                className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${currentTab === 'MENU' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
            >
                <Utensils size={18} /> <span className="text-xs md:text-sm">Resort Services</span>
            </button>
            <button
                onClick={() => onTabChange('EVENTS')}
                className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${currentTab === 'EVENTS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
            >
                <Calendar size={18} /> <span className="text-xs md:text-sm">Events</span>
            </button>
            <button
                onClick={() => onTabChange('PROMOS')}
                className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${currentTab === 'PROMOS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
            >
                <Megaphone size={18} /> <span className="text-xs md:text-sm">Promo</span>
            </button>
            <button
                onClick={() => onTabChange('KNOWLEDGE')}
                className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${currentTab === 'KNOWLEDGE' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
            >
                <BrainCircuit size={18} /> <span className="text-xs md:text-sm">AI</span>
            </button>
            {/* Only ADMIN can see Users/Staff Management */}
            {userRole === UserRole.ADMIN && (
                <button
                    onClick={() => onTabChange('USERS')}
                    className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${currentTab === 'USERS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
                >
                    <Users size={18} /> <span className="text-xs md:text-sm">Staff</span>
                </button>
            )}
            <button
                onClick={() => onTabChange('GUESTS')}
                className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${currentTab === 'GUESTS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
            >
                <UserCheck size={18} /> <span className="text-xs md:text-sm">Guests</span>
            </button>
            <button
                onClick={() => onTabChange('HISTORY')}
                className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${currentTab === 'HISTORY' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
            >
                <History size={18} /> <span className="text-xs md:text-sm">History</span>
            </button>
        </div>
    );
};
