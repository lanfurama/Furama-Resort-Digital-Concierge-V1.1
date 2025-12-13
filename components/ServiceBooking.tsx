
import React, { useState, useEffect } from 'react';
import { getMenu, addServiceRequest } from '../services/dataService';
import { User, MenuItem } from '../types';
import { ArrowLeft, ShoppingBag, Plus, Sparkles, Utensils, Waves, User as UserIcon } from 'lucide-react';
import ServiceChat from './ServiceChat';
import Loading from './Loading';
import { useTranslation } from '../contexts/LanguageContext';

interface ServiceBookingProps {
    type: 'DINING' | 'SPA' | 'POOL' | 'BUTLER';
    user: User;
    onBack: () => void;
}

const ServiceBooking: React.FC<ServiceBookingProps> = ({ type, user, onBack }) => {
    const { t, language } = useTranslation();
    const [cart, setCart] = useState<MenuItem[]>([]);
    const [isOrderPlaced, setIsOrderPlaced] = useState(false);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filter menu by type
    let categoryFilter: 'Dining' | 'Spa' | 'Pool' | 'Butler' = 'Dining';
    if (type === 'SPA') categoryFilter = 'Spa';
    if (type === 'POOL') categoryFilter = 'Pool';
    if (type === 'BUTLER') categoryFilter = 'Butler';

    // Load menu items on mount
    useEffect(() => {
        setIsLoading(true);
        getMenu(categoryFilter)
            .then(setItems)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [categoryFilter]);

    const addToCart = (item: MenuItem) => {
        setCart([...cart, item]);
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        
        const details = cart.map(i => i.name).join(', ');
        try {
            console.log('Placing order - Type:', type, 'Cart:', cart, 'User:', user);
            const result = await addServiceRequest({
                id: Date.now().toString(),
                type: type,
                status: 'PENDING',
                details: `Order for: ${details}`,
                items: cart, // Save full items for translation support
                roomNumber: user.roomNumber,
                timestamp: Date.now()
            });
            
            console.log('Order placed successfully:', result);
            setIsOrderPlaced(true);
            setTimeout(() => {
                onBack();
            }, 2000);
        } catch (error: any) {
            console.error('Failed to place order:', error);
            const errorMessage = error?.message || error?.response?.data?.error || 'Unknown error';
            alert(`Failed to place order: ${errorMessage}. Please check console for details.`);
        }
    };

    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

    // Configuration based on Type
    const getConfig = () => {
        switch (type) {
            case 'DINING': return { 
                gradient: 'from-orange-600 via-orange-700 to-red-600',
                btnGradient: 'from-orange-500 to-red-600',
                lightBg: 'bg-orange-50',
                textColor: 'text-orange-600',
                borderColor: 'border-orange-200',
                shadowColor: 'shadow-orange-300/50',
                title: t('dining'), 
                subtitle: 'Delicious meals delivered',
                icon: <Utensils /> 
            };
            case 'SPA': return { 
                gradient: 'from-purple-600 via-purple-700 to-pink-600',
                btnGradient: 'from-purple-500 to-pink-600',
                lightBg: 'bg-purple-50',
                textColor: 'text-purple-600',
                borderColor: 'border-purple-200',
                shadowColor: 'shadow-purple-300/50',
                title: t('spa'), 
                subtitle: 'Relax & Rejuvenate',
                icon: <Sparkles /> 
            };
            case 'POOL': return { 
                gradient: 'from-blue-600 via-cyan-600 to-teal-600',
                btnGradient: 'from-blue-500 to-teal-600',
                lightBg: 'bg-blue-50',
                textColor: 'text-blue-600',
                borderColor: 'border-blue-200',
                shadowColor: 'shadow-blue-300/50',
                title: t('pool'), 
                subtitle: 'Drinks, towels & suncare',
                icon: <Waves /> 
            };
            case 'BUTLER': return { 
                gradient: 'from-slate-600 via-slate-700 to-gray-700',
                btnGradient: 'from-slate-600 to-gray-700',
                lightBg: 'bg-slate-50',
                textColor: 'text-slate-600',
                borderColor: 'border-slate-200',
                shadowColor: 'shadow-slate-300/50',
                title: t('butler'), 
                subtitle: 'Personalized assistance',
                icon: <UserIcon /> 
            };
            default: return { 
                gradient: 'from-emerald-600 via-emerald-700 to-teal-700',
                btnGradient: 'from-emerald-600 to-teal-600',
                lightBg: 'bg-emerald-50',
                textColor: 'text-emerald-600',
                borderColor: 'border-emerald-200',
                shadowColor: 'shadow-emerald-300/50',
                title: 'Service', 
                subtitle: '',
                icon: <Sparkles /> 
            };
        }
    };

    const config = getConfig();

    if (isOrderPlaced) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-emerald-300/50 animate-pulse">
                    <Sparkles className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-3 text-gray-800">{t('request_received')}</h2>
                <p className="text-gray-600 text-lg">{t('request_confirm_msg')}</p>
            </div>
        );
    }

    // Determine chat label based on type
    const chatLabel = type === 'DINING' ? t('kitchen') : t('staff');

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20 relative">
             {/* Header with gradient and glassmorphism */}
            <div className={`p-4 text-white shadow-lg backdrop-blur-md bg-gradient-to-r ${config.gradient} flex items-center justify-between z-10 border-b border-white/20`}>
                <div className="flex items-center flex-1 min-w-0">
                    <button 
                        onClick={onBack} 
                        className="mr-3 text-white/90 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all duration-300"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold tracking-tight">{config.title}</h2>
                        <p className="text-xs text-white/80 mt-0.5">{config.subtitle}</p>
                    </div>
                </div>
                <div className="relative ml-3 flex-shrink-0">
                    <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-white">
                            {cart.length}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 py-4 pb-32">
                {isLoading ? (
                    <Loading message={t('loading') || 'Loading menu...'} />
                ) : (
                    <div className="grid gap-3">
                        {items.map(item => {
                        const tr = item.translations?.[language];
                        const name = tr?.name || item.name;
                        const desc = tr?.description || item.description;

                        return (
                        <div 
                            key={item.id} 
                            className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg border-2 border-gray-100/60 flex justify-between items-start gap-3 transition-all hover:shadow-xl hover:border-gray-200"
                            style={{
                                boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 text-base mb-1">{name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-2 leading-relaxed">{desc}</p>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-sm ${config.lightBg} ${config.textColor} border ${config.borderColor}`}>
                                    {item.price > 0 ? `$${item.price}` : 'Complimentary'}
                                </div>
                            </div>
                            <button 
                                onClick={() => addToCart(item)}
                                className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 ${config.lightBg} ${config.textColor} hover:shadow-lg border-2 ${config.borderColor}`}
                                style={{
                                    boxShadow: `0 4px 12px -2px rgba(0,0,0,0.1)`
                                }}
                            >
                                <Plus size={20} className="font-bold" />
                            </button>
                        </div>
                        );
                        })}
                        {items.length === 0 && (
                            <div className="text-center py-16 px-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium text-base">No items available</p>
                                <p className="text-gray-400 text-sm mt-1">in this category yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Cart Summary - Modern fixed footer */}
            {cart.length > 0 && (
                <div 
                    className="fixed bottom-0 left-0 right-0 backdrop-blur-lg bg-white/95 border-t-2 border-gray-200/60 p-4 shadow-2xl z-20"
                    style={{
                        boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.2)',
                        paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))'
                    }}
                >
                    <div className="max-w-md mx-auto">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${config.textColor} animate-pulse`} style={{
                                    backgroundColor: config.textColor.includes('orange') ? '#ea580c' :
                                                   config.textColor.includes('purple') ? '#9333ea' :
                                                   config.textColor.includes('blue') ? '#2563eb' :
                                                   config.textColor.includes('slate') ? '#475569' : '#10b981'
                                }}></div>
                                <span className="text-gray-700 font-semibold text-sm">
                                    {cart.length} {t('items')}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-gray-800">${totalPrice}</span>
                                <span className="text-xs text-gray-500">total</span>
                            </div>
                        </div>
                        <button 
                            onClick={handlePlaceOrder}
                            className={`group relative w-full py-4 rounded-2xl font-bold text-base text-white shadow-2xl transition-all duration-300 overflow-hidden bg-gradient-to-r ${config.btnGradient} hover:shadow-2xl`}
                            style={{
                                boxShadow: `0 10px 30px -5px rgba(0,0,0,0.3)`
                            }}
                        >
                            {/* Animated gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <ShoppingBag className="w-5 h-5" />
                                {t('place_order')}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Widget: Connected to specific service type */}
            <ServiceChat 
                serviceType={type}
                roomNumber={user.roomNumber}
                label={chatLabel}
            />
        </div>
    );
};

export default ServiceBooking;

