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
        <header className="bg-emerald-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Furama Logo" className="w-12 h-12 object-contain bg-white/90 rounded-full p-1 shadow-md" />
                <div>
                    <h1 className="text-xl font-serif font-bold">Furama Admin CMS</h1>
                    <div className="flex items-center space-x-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${user.role === UserRole.SUPERVISOR ? 'bg-amber-500 text-white' : 'bg-emerald-700 text-emerald-100'}`}>
                            {user.role === UserRole.SUPERVISOR ? 'Supervisor (Restricted)' : user.role}
                        </span>
                        <p className="text-xs text-emerald-300">System Management</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
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
                <button onClick={onLogout} className="text-sm bg-emerald-800 px-3 py-1 rounded hover:bg-emerald-700 border border-emerald-700">
                    Logout
                </button>
            </div>
        </header>
    );
};
