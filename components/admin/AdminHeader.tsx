import React from 'react';
import { User, UserRole } from '../../types';
import BuggyNotificationBell from '../BuggyNotificationBell';
import { RideRequest, BuggyStatus } from '../../types';

interface AdminHeaderProps {
    user: User;
    onLogout: () => void;
    tab: string;
    rides?: RideRequest[];
    users?: User[];
    soundEnabled: boolean;
    onSoundToggle: (enabled: boolean) => void;
    onNavigate?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
    user,
    onLogout,
    tab,
    rides = [],
    users = [],
    soundEnabled,
    onSoundToggle,
    onNavigate
}) => {
    return (
        <header className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-900 text-white p-4 md:p-5 flex justify-between items-center shadow-xl sticky top-0 z-30 border-b border-emerald-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 md:gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-lg"></div>
                    <img 
                        src="/logo.png" 
                        alt="Furama Logo" 
                        className="relative w-12 h-12 md:w-14 md:h-14 object-contain bg-white/95 rounded-full p-1.5 shadow-lg ring-2 ring-white/30" 
                    />
                </div>
                <div>
                    <h1 className="text-lg md:text-xl font-serif font-bold tracking-tight">Furama Admin CMS</h1>
                    <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`text-[10px] md:text-xs uppercase font-bold px-2 py-1 rounded-md shadow-sm transition-all ${user.role === UserRole.SUPERVISOR ? 'bg-amber-500/90 text-white ring-2 ring-amber-400/30' : 'bg-emerald-700/80 text-emerald-50 ring-2 ring-emerald-600/30'}`}>
                            {user.role === UserRole.SUPERVISOR ? 'Supervisor (Restricted)' : user.role}
                        </span>
                        <p className="text-xs text-emerald-200/90 font-medium hidden sm:block">System Management</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
                {/* Notification Bell - Only show when FLEET tab is active */}
                {tab === 'FLEET' && (
                    <BuggyNotificationBell
                        rides={rides}
                        users={users}
                        onNavigate={onNavigate || (() => {})}
                        soundEnabled={soundEnabled}
                        onSoundToggle={(enabled) => {
                            onSoundToggle(enabled);
                            localStorage.setItem('admin_sound_enabled', String(enabled));
                        }}
                        localStorageKey="admin_sound_enabled"
                        showCompleted={true}
                        showAssigned={true}
                        showActive={true}
                    />
                )}
                <button 
                    onClick={onLogout} 
                    className="text-sm font-semibold bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30 active:scale-95 shadow-md"
                >
                    Logout
                </button>
            </div>
        </header>
    );
};
