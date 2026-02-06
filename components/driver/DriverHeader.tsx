import React from 'react';
import { MapPin, Star, Calendar, X, Volume2, VolumeX, Smartphone } from 'lucide-react';
import NotificationBell from '../NotificationBell';
import { useTranslation } from '../../contexts/LanguageContext';
import { DriverSchedule } from '../../services/dataService';

interface DriverHeaderProps {
    driverInfo: {
        name: string;
        rating: number;
        location: string;
    };
    schedules: DriverSchedule[];
    currentDriverId: string | null;
    onLogout: () => void;
    soundEnabled?: boolean;
    vibrateEnabled?: boolean;
    onSoundToggle?: () => void;
    onVibrateToggle?: () => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
    driverInfo,
    schedules,
    currentDriverId,
    onLogout,
    soundEnabled = true,
    vibrateEnabled = true,
    onSoundToggle,
    onVibrateToggle
}) => {
    const { language, setLanguage, t } = useTranslation();
    const today = new Date().toISOString().split('T')[0];
    const todaySchedule = schedules.find(s => s.date === today);

    return (
        <header
            className="bg-white border-b-2 border-emerald-100 shadow-sm px-2 sm:px-3 py-2.5 sm:py-3 md:p-4 flex items-center justify-between gap-2 flex-nowrap z-50 safe-area-top"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
            {/* Left: Logo + Info - must truncate on narrow */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-1 min-w-0 overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain flex-shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mb-0.5 md:mb-1 flex-wrap">
                        <h1 className="font-bold text-sm sm:text-base md:text-lg text-gray-900 truncate hidden sm:block min-w-0">{driverInfo.name}</h1>
                        <div className="flex items-center gap-1 bg-yellow-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg border border-yellow-300 flex-shrink-0 min-h-[28px] sm:min-h-[32px]">
                            <Star size={12} className="text-yellow-500 fill-yellow-500 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                            <span className="text-xs font-bold text-yellow-700">{driverInfo.rating}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-0">
                        <MapPin size={11} className="text-emerald-600 flex-shrink-0 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                        <p className="text-xs sm:text-sm text-gray-700 truncate font-medium min-w-0">{driverInfo.location}</p>
                    </div>
                    {todaySchedule && (
                        <div className="hidden sm:flex items-center gap-1.5 mt-1 md:mt-1.5 min-w-0">
                            <Calendar size={12} className="text-emerald-600 flex-shrink-0 md:w-3.5 md:h-3.5" />
                            <p className="text-xs md:text-sm text-emerald-700 font-semibold truncate min-w-0">
                                {todaySchedule.is_day_off ? t('driver_day_off') :
                                    `${todaySchedule.shift_start?.substring(0, 5)} - ${todaySchedule.shift_end?.substring(0, 5)}`}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Language + Notification + Logout - compact on very narrow */}
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
                <div className="flex rounded-md sm:rounded-lg border border-gray-200 bg-gray-50 p-0.5" role="group" aria-label={t('app_language')}>
                    <button
                        type="button"
                        onClick={() => setLanguage('English')}
                        className={`min-h-[36px] min-w-[32px] sm:min-h-[40px] sm:min-w-[40px] md:min-h-0 md:min-w-0 px-1.5 sm:px-2 md:px-2.5 py-1.5 sm:py-2 md:py-1.5 text-[10px] sm:text-xs md:text-sm font-bold rounded transition-colors touch-manipulation ${language === 'English' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'}`}
                    >
                        {t('driver_lang_en')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setLanguage('Vietnamese')}
                        className={`min-h-[36px] min-w-[32px] sm:min-h-[40px] sm:min-w-[40px] md:min-h-0 md:min-w-0 px-1.5 sm:px-2 md:px-2.5 py-1.5 sm:py-2 md:py-1.5 text-[10px] sm:text-xs md:text-sm font-bold rounded transition-colors touch-manipulation ${language === 'Vietnamese' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'}`}
                    >
                        {t('driver_lang_vi')}
                    </button>
                </div>
                {onSoundToggle != null && (
                    <button
                        type="button"
                        onClick={onSoundToggle}
                        className={`min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-lg transition-colors touch-manipulation flex-shrink-0 ${soundEnabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={t('driver_alert_sound')}
                        aria-label={t('driver_alert_sound')}
                        aria-pressed={soundEnabled}
                    >
                        {soundEnabled ? <Volume2 size={18} className="sm:w-5 sm:h-5" /> : <VolumeX size={18} className="sm:w-5 sm:h-5" />}
                    </button>
                )}
                {onVibrateToggle != null && (
                    <button
                        type="button"
                        onClick={onVibrateToggle}
                        className={`min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-lg transition-colors touch-manipulation flex-shrink-0 ${vibrateEnabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={t('driver_alert_vibrate')}
                        aria-label={t('driver_alert_vibrate')}
                        aria-pressed={vibrateEnabled}
                    >
                        <Smartphone size={18} className={`sm:w-5 sm:h-5 ${vibrateEnabled ? '' : 'opacity-50'}`} />
                    </button>
                )}
                {currentDriverId && (
                    <div className="min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center flex-shrink-0">
                        <NotificationBell userId={currentDriverId} variant="light" />
                    </div>
                )}
                <button
                    type="button"
                    onClick={onLogout}
                    className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl hover:bg-red-50 active:bg-red-100 transition-all text-gray-500 hover:text-red-600 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center touch-manipulation flex-shrink-0"
                    title={t('logout')}
                    aria-label={t('logout')}
                >
                    <X size={18} className="sm:w-5 sm:h-5" />
                </button>
            </div>
        </header>
    );
};
