import React from 'react';
import { Utensils, Waves, Sparkles, User, Calendar } from 'lucide-react';

interface ServiceMenuProps {
    onSelect: (service: string) => void;
}

const services = [
    { id: 'DINING', name: 'In-Room Dining', icon: Utensils, color: 'bg-orange-100 text-orange-700' },
    { id: 'SPA', name: 'Spa & Wellness', icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
    { id: 'POOL', name: 'Pool Services', icon: Waves, color: 'bg-blue-100 text-blue-700' },
    { id: 'BUTLER', name: 'Butler Request', icon: User, color: 'bg-gray-100 text-gray-700' },
    { id: 'EVENTS', name: 'Resort Events', icon: Calendar, color: 'bg-pink-100 text-pink-700' },
];

const ServiceMenu: React.FC<ServiceMenuProps> = ({ onSelect }) => {
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
                    <span className="font-semibold text-gray-800">{s.name}</span>
                </button>
            ))}
        </div>
    );
};

export default ServiceMenu;