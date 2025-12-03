
import React from 'react';
import { Utensils, Waves, Sparkles, User, Calendar } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface ServiceMenuProps {
    onSelect: (service: string) => void;
}

const ServiceMenu: React.FC<ServiceMenuProps> = ({ onSelect }) => {
    const { t } = useTranslation();

    const services = [
        { id: 'DINING', name: t('dining'), icon: Utensils, color: 'bg-orange-100 text-orange-700' },
        { id: 'SPA', name: t('spa'), icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
        { id: 'POOL', name: t('pool'), icon: Waves, color: 'bg-blue-100 text-blue-700' },
        { id: 'BUTLER', name: t('butler'), icon: User, color: 'bg-gray-100 text-gray-700' },
        { id: 'EVENTS', name: t('events'), icon: Calendar, color: 'bg-pink-100 text-pink-700' },
    ];

    return (
        <div className="p-4 grid grid-cols-2 gap-4">
            {services.map((s) => (
                <button 
                    key={s.id}
                    onClick={() => onSelect(s.id)}
                    className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition active:scale-95"
                >
                    <div className={`p-4 rounded-full mb-3 ${s.color}`}>
                        <s.icon size={28} />
                    </div>
                    <span className="font-semibold text-gray-800 text-center text-sm">{s.name}</span>
                </button>
            ))}
        </div>
    );
};

export default ServiceMenu;
