
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
                color: 'bg-orange-800', 
                btnColor: 'bg-orange-600 hover:bg-orange-700',
                lightBg: 'bg-orange-50',
                textColor: 'text-orange-600',
                title: t('dining'), 
                subtitle: 'Delicious meals delivered',
                icon: <Utensils /> 
            };
            case 'SPA': return { 
                color: 'bg-purple-900', 
                btnColor: 'bg-purple-600 hover:bg-purple-700',
                lightBg: 'bg-purple-50',
                textColor: 'text-purple-600',
                title: t('spa'), 
                subtitle: 'Relax & Rejuvenate',
                icon: <Sparkles /> 
            };
            case 'POOL': return { 
                color: 'bg-blue-600', 
                btnColor: 'bg-blue-500 hover:bg-blue-600',
                lightBg: 'bg-blue-50',
                textColor: 'text-blue-600',
                title: t('pool'), 
                subtitle: 'Drinks, towels & suncare',
                icon: <Waves /> 
            };
            case 'BUTLER': return { 
                color: 'bg-slate-700', 
                btnColor: 'bg-slate-600 hover:bg-slate-700',
                lightBg: 'bg-slate-50',
                textColor: 'text-slate-600',
                title: t('butler'), 
                subtitle: 'Personalized assistance',
                icon: <UserIcon /> 
            };
            default: return { 
                color: 'bg-emerald-800', 
                btnColor: 'bg-emerald-600',
                lightBg: 'bg-emerald-50',
                textColor: 'text-emerald-600',
                title: 'Service', 
                subtitle: '',
                icon: <Sparkles /> 
            };
        }
    };

    const config = getConfig();

    if (isOrderPlaced) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-emerald-50 text-emerald-900 p-8 text-center animate-in zoom-in">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-serif font-bold mb-2">{t('request_received')}</h2>
                <p className="text-gray-600">{t('request_confirm_msg')}</p>
            </div>
        );
    }

    // Determine chat label based on type
    const chatLabel = type === 'DINING' ? t('kitchen') : t('staff');

    return (
        <div className="flex flex-col h-full bg-gray-50 relative">
             {/* Header */}
            <div className={`p-4 ${config.color} text-white shadow-md flex items-center justify-between z-10`}>
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-4 text-white hover:text-gray-200">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-xl font-serif font-bold">{config.title}</h2>
                        <p className="text-xs opacity-80">{config.subtitle}</p>
                    </div>
                </div>
                <div className="relative">
                    <ShoppingBag />
                    {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                            {cart.length}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                {isLoading ? (
                    <Loading message={t('loading') || 'Loading menu...'} />
                ) : (
                    <div className="grid gap-4">
                        {items.map(item => {
                        const tr = item.translations?.[language];
                        const name = tr?.name || item.name;
                        const desc = tr?.description || item.description;

                        return (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                            <div className="flex-1">
                                    <h3 className="font-bold text-gray-800">{name}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">{desc}</p>
                                <p className={`font-bold mt-1 ${config.textColor}`}>
                                    {item.price > 0 ? `$${item.price}` : 'Complimentary'}
                                </p>
                            </div>
                            <button 
                                onClick={() => addToCart(item)}
                                className={`p-3 rounded-full ml-3 transition active:scale-95 ${config.lightBg} ${config.textColor} hover:bg-gray-100`}
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        );
                        })}
                        {items.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                No items available in this category yet.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-xl z-20">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600 font-medium">{cart.length} {t('items')}</span>
                        <span className="text-xl font-bold text-gray-800">${totalPrice}</span>
                    </div>
                    <button 
                        onClick={handlePlaceOrder}
                        className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition transform active:scale-95 ${config.btnColor}`}
                    >
                        {t('place_order')}
                    </button>
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
