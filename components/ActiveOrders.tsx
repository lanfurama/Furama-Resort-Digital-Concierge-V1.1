
import React, { useState, useEffect } from 'react';
import { User, ServiceRequest } from '../types';
import { getActiveGuestOrders } from '../services/dataService';
import { Clock, ShoppingBag, Car, Utensils, Sparkles, Waves, User as UserIcon, MessageSquarePlus, ArrowLeft } from 'lucide-react';
import ServiceChat from './ServiceChat';
import Loading from './Loading';
import { useTranslation } from '../contexts/LanguageContext';

interface ActiveOrdersProps {
    user: User;
    onBack: () => void;
}

const ActiveOrders: React.FC<ActiveOrdersProps> = ({ user, onBack }) => {
    const { t, language } = useTranslation();
    const [activeOrders, setActiveOrders] = useState<ServiceRequest[]>([]);
    const [activeChat, setActiveChat] = useState<{type: string, label: string} | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Load active orders on mount
    useEffect(() => {
        setIsLoading(true);
        getActiveGuestOrders(user.roomNumber)
            .then(setActiveOrders)
            .catch(console.error)
            .finally(() => setIsLoading(false));
        // Poll for updates every 5 seconds
        const interval = setInterval(() => {
            getActiveGuestOrders(user.roomNumber).then(setActiveOrders).catch(console.error);
        }, 5000);
        return () => clearInterval(interval);
    }, [user.roomNumber]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'DINING': return <Utensils size={18} strokeWidth={2.5} />;
            case 'SPA': return <Sparkles size={18} strokeWidth={2.5} />;
            case 'BUGGY': return <Car size={18} strokeWidth={2.5} />;
            case 'POOL': return <Waves size={18} strokeWidth={2.5} />;
            case 'BUTLER': return <UserIcon size={18} strokeWidth={2.5} />;
            default: return <ShoppingBag size={18} strokeWidth={2.5} />;
        }
    };

    const getColor = (status: string) => {
        if (status === 'COMPLETED') return 'bg-green-100 text-green-700 border-green-300';
        if (status === 'CONFIRMED' || status === 'ARRIVING' || status === 'ON_TRIP' || status === 'ASSIGNED') return 'bg-blue-100 text-blue-700 border-blue-300';
        return 'bg-orange-100 text-orange-700 border-orange-300';
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
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20 relative">
             {/* Header - Modern Design */}
            <div className="p-3 text-white shadow-lg backdrop-blur-md bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 flex items-center z-10 sticky top-0 border-b border-white/20"
                style={{
                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.2)'
                }}
            >
                <button 
                    onClick={onBack} 
                    className="mr-2.5 text-white/90 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <div className="flex items-center gap-2.5 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">{t('active_orders')}</h2>
                        <p className="text-[10px] text-white/80">{activeOrders.length} {activeOrders.length === 1 ? 'order' : 'orders'}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24 scrollbar-hide">
                {isLoading ? (
                    <Loading message={t('loading') || 'Loading orders...'} />
                ) : activeOrders.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                            <ShoppingBag className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-semibold text-sm">{t('no_active_orders')}</p>
                    </div>
                ) : (
                    activeOrders.map((req, i) => (
                        <div key={i} className="backdrop-blur-sm bg-white/95 p-4 rounded-xl shadow-md border-2 border-gray-200/60 flex flex-col transition-all hover:shadow-lg"
                            style={{
                                boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div className="flex items-start mb-3">
                                <div className={`p-2.5 rounded-xl mr-3 flex-shrink-0 ${
                                    req.type === 'DINING' ? 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 border-2 border-orange-200' :
                                    req.type === 'SPA' ? 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 border-2 border-purple-200' :
                                    req.type === 'BUGGY' ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 border-2 border-emerald-200' :
                                    'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 border-2 border-blue-200'
                                }`}>
                                    {getIcon(req.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <p className="font-bold text-gray-900 text-sm">{req.type === 'BUGGY' ? t('buggy_service') : t(req.type.toLowerCase())}</p>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border-2 flex-shrink-0 ml-2 ${getColor(req.status)}`}>
                                            {t(req.status)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 font-medium bg-gray-50 px-2 py-1 rounded border border-gray-200">{getTranslatedDetails(req)}</p>
                                    <p className="text-[10px] text-gray-500 mt-2 flex items-center font-medium">
                                        <Clock size={11} className="mr-1 text-gray-400" />
                                        {new Date(req.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t-2 border-gray-100">
                                <button 
                                    onClick={() => setActiveChat({ type: req.type, label: getChatLabel(req.type) })}
                                    className="w-full py-2.5 flex items-center justify-center text-xs text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all border-2 border-emerald-200"
                                >
                                    <MessageSquarePlus size={14} className="mr-1.5" strokeWidth={2.5} />
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
