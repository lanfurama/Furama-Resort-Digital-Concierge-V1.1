
import React, { useState, useEffect } from 'react';
import { User, ServiceRequest } from '../types';
import { getActiveGuestOrders, cancelServiceRequest } from '../services/dataService';
import { Clock, ShoppingBag, Car, Utensils, Sparkles, Waves, User as UserIcon, MessageSquarePlus, ArrowLeft, X } from 'lucide-react';
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
    const [serviceTypeFilter, setServiceTypeFilter] = useState<'ALL' | 'DINING' | 'SPA' | 'POOL' | 'BUTLER' | 'HOUSEKEEPING'>('ALL');
    
    // Calculate waiting time in minutes
    const getWaitingTime = (timestamp: number): number => {
        return Math.floor((Date.now() - timestamp) / 1000 / 60);
    };
    
    // Format waiting time display
    const formatWaitingTime = (minutes: number): string => {
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m ago`;
    };
    
    // Handle cancel request
    const handleCancel = async (req: ServiceRequest) => {
        // Cannot cancel if already confirmed by staff
        if (req.status === 'CONFIRMED' || req.status === 'COMPLETED') {
            alert('Cannot cancel request. Staff has already accepted your request.');
            return;
        }
        
        const waitingMinutes = getWaitingTime(req.timestamp);
        const confirmMessage = `Are you sure you want to cancel this request?${waitingMinutes > 0 ? ` (Waiting for ${waitingMinutes} minutes)` : ''}`;
        
        if (window.confirm(confirmMessage)) {
            try {
                await cancelServiceRequest(req.id);
                // Refresh orders
                const updated = await getActiveGuestOrders(user.roomNumber);
                setActiveOrders(updated);
            } catch (error) {
                console.error('Failed to cancel request:', error);
                alert('Failed to cancel request. Please try again.');
            }
        }
    };
    
    // Load active orders on mount
    useEffect(() => {
        setIsLoading(true);
        getActiveGuestOrders(user.roomNumber)
            .then(setActiveOrders)
            .catch(console.error)
            .finally(() => setIsLoading(false));
        // Poll for updates every 8 seconds
        const interval = setInterval(() => {
            getActiveGuestOrders(user.roomNumber).then(setActiveOrders).catch(console.error);
        }, 8000);
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

    // Filter orders by service type
    const filteredOrders = activeOrders.filter(req => {
        if (serviceTypeFilter === 'ALL') return true;
        return req.type === serviceTypeFilter;
    });

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20 relative">
             {/* Header - Modern Design */}
            <div className="px-3 py-2 text-white shadow-lg backdrop-blur-md bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 flex items-center z-10 sticky top-0 border-b border-white/20"
                style={{
                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.2)'
                }}
            >
                <button 
                    onClick={onBack} 
                    className="mr-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full p-1 transition-all"
                >
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
                <div className="flex items-center gap-2 flex-1">
                    <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold tracking-tight leading-tight">{t('active_orders')}</h2>
                        <p className="text-[9px] text-white/80 leading-tight">{activeOrders.length} {activeOrders.length === 1 ? 'order' : 'orders'}</p>
                    </div>
                </div>
            </div>

            {/* Service Type Filter */}
            <div className="px-3 pb-2 pt-2">
                <div className="flex flex-wrap items-center gap-2 bg-white/80 rounded-lg border border-gray-200/60 p-2 backdrop-blur-sm">
                    <span className="text-xs font-semibold text-gray-600 mr-1">Filter:</span>
                    {(['ALL', 'DINING', 'SPA', 'POOL', 'BUTLER', 'HOUSEKEEPING'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setServiceTypeFilter(type)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                serviceTypeFilter === type
                                    ? type === 'ALL'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : type === 'DINING'
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : type === 'SPA'
                                        ? 'bg-pink-600 text-white shadow-md'
                                        : type === 'POOL'
                                        ? 'bg-cyan-600 text-white shadow-md'
                                        : type === 'BUTLER'
                                        ? 'bg-amber-600 text-white shadow-md'
                                        : 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24 scrollbar-hide">
                {isLoading ? (
                    <Loading message={t('loading') || 'Loading orders...'} />
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                            <ShoppingBag className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-semibold text-sm">
                            {serviceTypeFilter === 'ALL' ? t('no_active_orders') : `No active ${serviceTypeFilter} orders`}
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((req, i) => (
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
                                    {req.items && req.items.length > 0 ? (
                                        <div className="text-xs text-gray-600 mt-1.5 font-medium bg-gray-50 px-2 py-1.5 rounded border border-gray-200">
                                            <ul className="list-disc list-inside space-y-0.5">
                                                {req.items.map((item, idx) => {
                                                    const tr = item.translations?.[language];
                                                    const itemName = tr?.name || item.name;
                                                    return (
                                                        <li key={idx} className="text-gray-600">{itemName}</li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    ) : req.details ? (
                                        (() => {
                                            // Extract items from details if it contains "Items:" or "Order for:"
                                            const details = req.details;
                                            let itemsText = details;
                                            
                                            // Try to extract items part only
                                            if (details.includes('Items:')) {
                                                const itemsMatch = details.match(/Items:\s*([^\.]+)/);
                                                if (itemsMatch) {
                                                    itemsText = itemsMatch[1].trim();
                                                }
                                            } else if (details.includes('Order for:')) {
                                                const orderMatch = details.match(/Order for:\s*([^\.]+)/);
                                                if (orderMatch) {
                                                    itemsText = orderMatch[1].trim();
                                                }
                                            }
                                            
                                            // Split by comma and create list
                                            const itemsList = itemsText.split(',').map(item => item.trim()).filter(Boolean);
                                            
                                            return itemsList.length > 0 ? (
                                                <div className="text-xs text-gray-600 mt-1.5 font-medium bg-gray-50 px-2 py-1.5 rounded border border-gray-200">
                                                    <ul className="list-disc list-inside space-y-0.5">
                                                        {itemsList.map((item, idx) => (
                                                            <li key={idx} className="text-gray-600">{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 font-medium bg-gray-50 px-2 py-1 rounded border border-gray-200">{details}</p>
                                            );
                                        })()
                                    ) : null}
                                    <div className="mt-2 space-y-1">
                                        <p className="text-[10px] text-gray-500 flex items-center font-medium">
                                            <Clock size={11} className="mr-1 text-gray-400" />
                                            {new Date(req.timestamp).toLocaleString()}
                                        </p>
                                        {req.status === 'PENDING' && (() => {
                                            const waitingMinutes = getWaitingTime(req.timestamp);
                                            const isLongWait = waitingMinutes >= 15;
                                            return (
                                                <p className={`text-[10px] flex items-center font-semibold ${
                                                    isLongWait ? 'text-red-600' : 'text-orange-600'
                                                }`}>
                                                    <Clock size={11} className="mr-1" />
                                                    Waiting: {formatWaitingTime(waitingMinutes)}
                                                    {isLongWait && ' ⚠️'}
                                                </p>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t-2 border-gray-100 space-y-2">
                                {/* Cancel button - Show if PENDING (not confirmed by staff yet) */}
                                {req.status === 'PENDING' && (
                                    <button 
                                        onClick={() => handleCancel(req)}
                                        className="w-full py-2.5 flex items-center justify-center text-xs text-red-700 font-bold bg-red-50 hover:bg-red-100 rounded-lg transition-all border-2 border-red-200"
                                    >
                                        <X size={14} className="mr-1.5" strokeWidth={2.5} />
                                        Cancel Request
                                    </button>
                                )}
                                
                                {/* Chat button */}
                                {(req.status === 'PENDING' || req.status === 'CONFIRMED') && (
                                    <button 
                                        onClick={() => setActiveChat({ type: req.type, label: getChatLabel(req.type) })}
                                        className="w-full py-2.5 flex items-center justify-center text-xs text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all border-2 border-emerald-200"
                                    >
                                        <MessageSquarePlus size={14} className="mr-1.5" strokeWidth={2.5} />
                                        {t('chat_with')} {getChatLabel(req.type)}
                                    </button>
                                )}
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
