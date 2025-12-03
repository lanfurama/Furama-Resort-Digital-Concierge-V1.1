
import React, { useState, useEffect } from 'react';
import { User, ServiceRequest } from '../types';
import { getActiveGuestOrders } from '../services/dataService';
import { Clock, ShoppingBag, Car, Utensils, Sparkles, Waves, User as UserIcon, MessageSquarePlus, ArrowLeft } from 'lucide-react';
import ServiceChat from './ServiceChat';
import { useTranslation } from '../contexts/LanguageContext';

interface ActiveOrdersProps {
    user: User;
    onBack: () => void;
}

const ActiveOrders: React.FC<ActiveOrdersProps> = ({ user, onBack }) => {
    const { t, language } = useTranslation();
    const [activeOrders, setActiveOrders] = useState<ServiceRequest[]>([]);
    const [activeChat, setActiveChat] = useState<{type: string, label: string} | null>(null);
    
    // Load active orders on mount
    useEffect(() => {
        getActiveGuestOrders(user.roomNumber).then(setActiveOrders).catch(console.error);
        // Poll for updates every 5 seconds
        const interval = setInterval(() => {
            getActiveGuestOrders(user.roomNumber).then(setActiveOrders).catch(console.error);
        }, 5000);
        return () => clearInterval(interval);
    }, [user.roomNumber]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'DINING': return <Utensils size={16} />;
            case 'SPA': return <Sparkles size={16} />;
            case 'BUGGY': return <Car size={16} />;
            case 'POOL': return <Waves size={16} />;
            case 'BUTLER': return <UserIcon size={16} />;
            default: return <ShoppingBag size={16} />;
        }
    };

    const getColor = (status: string) => {
        if (status === 'COMPLETED') return 'bg-green-100 text-green-700 border-green-200';
        if (status === 'CONFIRMED' || status === 'ARRIVING' || status === 'ON_TRIP' || status === 'ASSIGNED') return 'bg-blue-100 text-blue-700 border-blue-200';
        return 'bg-orange-100 text-orange-700 border-orange-200';
    };

    const getChatLabel = (type: string) => {
        switch (type) {
            case 'DINING': return t('kitchen');
            case 'SPA': return t('therapist');
            case 'BUGGY': return t('driver');
            case 'BUTLER': return t('butler');
            case 'POOL': return t('staff');
            default: return t('staff');
        }
    };

    const getTranslatedDetails = (req: ServiceRequest) => {
        if (req.items && req.items.length > 0) {
            return req.items.map(item => {
                const tr = item.translations?.[language];
                return tr?.name || item.name;
            }).join(', ');
        }
        return req.details;
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 relative">
             {/* Header */}
            <div className="p-4 bg-emerald-900 text-white shadow-md flex items-center z-10 sticky top-0">
                <button onClick={onBack} className="mr-4 text-white hover:text-gray-200">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-serif font-bold">{t('active_orders')}</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {activeOrders.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                        <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                        <p>{t('no_active_orders')}</p>
                    </div>
                ) : (
                    activeOrders.map((req, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col animate-in slide-in-from-bottom-2" style={{animationDelay: `${i*100}ms`}}>
                            <div className="flex items-start">
                                <div className={`p-2 rounded-full mr-3 ${
                                    req.type === 'DINING' ? 'bg-orange-100 text-orange-600' :
                                    req.type === 'SPA' ? 'bg-purple-100 text-purple-600' :
                                    req.type === 'BUGGY' ? 'bg-emerald-100 text-emerald-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                    {getIcon(req.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-gray-800 text-sm">{req.type === 'BUGGY' ? t('buggy_service') : t(req.type.toLowerCase())}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getColor(req.status)}`}>
                                            {t(req.status)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{getTranslatedDetails(req)}</p>
                                    <p className="text-[10px] text-gray-400 mt-2 flex items-center">
                                        <Clock size={10} className="mr-1" />
                                        {new Date(req.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-50">
                                <button 
                                    onClick={() => setActiveChat({ type: req.type, label: getChatLabel(req.type) })}
                                    className="w-full py-2 flex items-center justify-center text-xs text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                                >
                                    <MessageSquarePlus size={14} className="mr-1.5" />
                                    {t('chat_with')} {getChatLabel(req.type)}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

             {/* Active Service Chat Widget */}
            {activeChat && (
                <ServiceChat 
                    key={activeChat.type} 
                    serviceType={activeChat.type}
                    roomNumber={user.roomNumber}
                    label={activeChat.label}
                    autoOpen={true}
                    onClose={() => setActiveChat(null)}
                />
            )}
        </div>
    );
};

export default ActiveOrders;
