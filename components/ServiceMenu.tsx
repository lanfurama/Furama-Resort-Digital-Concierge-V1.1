
import React from 'react';
import { Utensils, Waves, Sparkles, User, Calendar } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface ServiceMenuProps {
    onSelect: (service: string) => void;
}

const ServiceMenu: React.FC<ServiceMenuProps> = ({ onSelect }) => {
    const { t } = useTranslation();

    const services = [
        {
            id: 'DINING',
            name: t('dining'),
            icon: Utensils,
            gradient: 'from-orange-500 via-orange-600 to-red-600',
            lightBg: 'from-orange-50 to-amber-50',
            iconBg: 'bg-gradient-to-br from-orange-100 to-amber-100',
            iconColor: 'text-orange-600',
            borderColor: 'border-orange-200',
            shadowColor: 'shadow-orange-300/50'
        },
        {
            id: 'SPA',
            name: t('spa'),
            icon: Sparkles,
            gradient: 'from-purple-500 via-purple-600 to-pink-600',
            lightBg: 'from-purple-50 to-pink-50',
            iconBg: 'bg-gradient-to-br from-purple-100 to-pink-100',
            iconColor: 'text-purple-600',
            borderColor: 'border-purple-200',
            shadowColor: 'shadow-purple-300/50'
        },
        {
            id: 'POOL',
            name: t('pool'),
            icon: Waves,
            gradient: 'from-blue-500 via-cyan-500 to-teal-600',
            lightBg: 'from-blue-50 to-cyan-50',
            iconBg: 'bg-gradient-to-br from-blue-100 to-cyan-100',
            iconColor: 'text-blue-600',
            borderColor: 'border-blue-200',
            shadowColor: 'shadow-blue-300/50'
        },
        {
            id: 'BUTLER',
            name: t('butler'),
            icon: User,
            gradient: 'from-slate-500 via-slate-600 to-gray-700',
            lightBg: 'from-slate-50 to-gray-50',
            iconBg: 'bg-gradient-to-br from-slate-100 to-gray-100',
            iconColor: 'text-slate-600',
            borderColor: 'border-slate-200',
            shadowColor: 'shadow-slate-300/50'
        },
        {
            id: 'EVENTS',
            name: t('events'),
            icon: Calendar,
            gradient: 'from-pink-500 via-rose-500 to-red-600',
            lightBg: 'from-pink-50 to-rose-50',
            iconBg: 'bg-gradient-to-br from-pink-100 to-rose-100',
            iconColor: 'text-pink-600',
            borderColor: 'border-pink-200',
            shadowColor: 'shadow-pink-300/50'
        },
    ];

    return (
        <div className="p-4 grid grid-cols-2 gap-3">
            {services.map((s) => (
                <button
                    key={s.id}
                    onClick={() => onSelect(s.id)}
                    className={`relative flex flex-col items-center justify-center p-5 bg-white/80 backdrop-blur-sm rounded-3xl border-2 ${s.borderColor} transition-transform active:scale-95 overflow-hidden`}
                    style={{
                        boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.5)'
                    }}
                >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${s.lightBg} opacity-100`}></div>

                    {/* Decorative Pattern - Simplified */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1)_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    </div>

                    {/* Icon Container */}
                    <div className={`relative z-10 p-4 rounded-2xl mb-3 ${s.iconBg} border-2 ${s.borderColor} shadow-lg`}
                        style={{
                            boxShadow: `0 4px 16px -4px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5)`
                        }}
                    >
                        <s.icon size={26} className={s.iconColor} strokeWidth={2.5} />
                    </div>

                    {/* Service Name */}
                    <span className={`relative z-10 font-bold text-gray-800 text-center text-sm leading-tight`}>
                        {s.name}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default ServiceMenu;
