import React from 'react';
import { User, UserRole } from '../../types';
import BuggyNotificationBell from '../BuggyNotificationBell';
import { RideRequest, BuggyStatus } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';

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
    const { language, setLanguage, t } = useTranslation();
    
    return (
        <header className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-900 text-white p-2 md:p-3 flex justify-between items-center shadow-xl sticky top-0 z-30 border-b border-emerald-700/50">
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
                    <h1 className="text-lg md:text-xl font-serif font-bold tracking-tight">{t('admin_cms')}</h1>
                    <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`text-[10px] md:text-xs uppercase font-bold px-2 py-1 rounded-md shadow-sm ${user.role === UserRole.SUPERVISOR ? 'bg-amber-500/90 text-white ring-2 ring-amber-400/30' : 'bg-emerald-700/80 text-emerald-50 ring-2 ring-emerald-600/30'}`}>
                            {user.role === UserRole.SUPERVISOR ? 'Supervisor (Restricted)' : user.role}
                        </span>
                        <p className="text-xs text-emerald-200/90 font-medium hidden sm:block">{t('admin_system_management')}</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
                {/* Language Switch */}
                <div className="flex rounded-md border border-white/30 bg-white/10 p-0.5">
                    <button
                        type="button"
                        onClick={() => setLanguage('English')}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded ${language === 'English' ? 'bg-white text-emerald-900 shadow-sm' : 'text-white/80 hover:bg-white/10'}`}
                    >
                        EN
                    </button>
                    <button
                        type="button"
                        onClick={() => setLanguage('Vietnamese')}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded ${language === 'Vietnamese' ? 'bg-white text-emerald-900 shadow-sm' : 'text-white/80 hover:bg-white/10'}`}
                    >
                        VN
                    </button>
                </div>
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
                    className="text-sm font-semibold bg-white/15 px-4 py-2 rounded-lg border border-white/30 shadow-md"
                >
                    {t('admin_logout')}
                </button>
            </div>
        </header>
    );
};
