
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getMenu, addServiceRequest } from '../services/dataService';
import { User, MenuItem } from '../types';
import { ArrowLeft, ShoppingBag, Plus, Sparkles, Utensils, Waves, User as UserIcon, Search, ArrowUpDown, Filter, X, Clock } from 'lucide-react';
import ServiceChat from './ServiceChat';
import Loading from './Loading';
import { SkeletonList } from './Skeleton';
import { useTranslation } from '../contexts/LanguageContext';
import { fuzzyMatch, getSearchSuggestions, saveSearchHistory, getSearchHistory, clearSearchHistory } from '../utils/fuzzySearch';

interface ServiceBookingProps {
    type: 'DINING' | 'SPA' | 'POOL' | 'BUTLER';
    user: User;
    onBack: () => void;
}

const ServiceBooking: React.FC<ServiceBookingProps> = React.memo(({ type, user, onBack }) => {
    const { t, language } = useTranslation();
    const [cart, setCart] = useState<MenuItem[]>([]);
    const [isOrderPlaced, setIsOrderPlaced] = useState(false);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const [priceFilter, setPriceFilter] = useState<'ALL' | 'UNDER_100K' | '100K_300K' | '300K_500K' | 'OVER_500K'>('ALL');
    const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEGETARIAN' | 'VEGAN'>('ALL');
    const [durationFilter, setDurationFilter] = useState<'ALL' | '15_MIN' | '30_MIN' | '1_HOUR' | '2_HOURS' | '4_HOURS'>('ALL');
    const [sortBy, setSortBy] = useState<'NAME' | 'PRICE_LOW' | 'PRICE_HIGH'>('NAME');

    // Popular searches based on service type
    const popularSearches = useMemo(() => {
        switch (type) {
            case 'DINING':
                return language === 'Vietnamese' 
                    ? ['Phở', 'Bún bò', 'Gà nướng', 'Salad', 'Pizza']
                    : ['Pho', 'Beef noodle', 'Grilled chicken', 'Salad', 'Pizza'];
            case 'SPA':
                return language === 'Vietnamese'
                    ? ['Massage', 'Facial', 'Body treatment', 'Relaxation', 'Aromatherapy']
                    : ['Massage', 'Facial', 'Body treatment', 'Relaxation', 'Aromatherapy'];
            case 'POOL':
                return language === 'Vietnamese'
                    ? ['Cocktail', 'Nước ép', 'Bia', 'Nước dừa', 'Smoothie']
                    : ['Cocktail', 'Juice', 'Beer', 'Coconut water', 'Smoothie'];
            default:
                return [];
        }
    }, [type, language]);

    // Load search history on mount
    useEffect(() => {
        setSearchHistory(getSearchHistory(type));
    }, [type]);

    // Get suggestions
    const suggestions = useMemo(() => {
        return getSearchSuggestions(searchQuery, searchHistory, popularSearches, 5);
    }, [searchQuery, searchHistory, popularSearches]);

    // Handle search query change
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setShowSuggestions(value.length > 0 || suggestions.length > 0);
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: string) => {
        setSearchQuery(suggestion);
        setShowSuggestions(false);
        saveSearchHistory(suggestion, type);
        setSearchHistory(getSearchHistory(type));
        searchInputRef.current?.focus();
    };

    // Handle search submit
    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            saveSearchHistory(searchQuery.trim(), type);
            setSearchHistory(getSearchHistory(type));
            setShowSuggestions(false);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper function to detect dietary restrictions from name/description
    const isVegetarian = (item: MenuItem): boolean => {
        const tr = item.translations?.[language];
        const name = (tr?.name || item.name).toLowerCase();
        const desc = (tr?.description || item.description || '').toLowerCase();
        const text = `${name} ${desc}`;

        const vegetarianKeywords = ['vegetarian', 'chay', 'rau', 'vegetable', 'salad', 'fruit', 'tofu', 'đậu'];
        const meatKeywords = ['beef', 'pork', 'chicken', 'meat', 'bò', 'heo', 'gà', 'thịt', 'burger', 'steak', 'fish', 'cá', 'seafood', 'hải sản'];

        // Check for meat keywords first
        if (meatKeywords.some(keyword => text.includes(keyword))) {
            return false;
        }

        // Check for vegetarian keywords
        return vegetarianKeywords.some(keyword => text.includes(keyword));
    };

    const isVegan = (item: MenuItem): boolean => {
        const tr = item.translations?.[language];
        const name = (tr?.name || item.name).toLowerCase();
        const desc = (tr?.description || item.description || '').toLowerCase();
        const text = `${name} ${desc}`;

        const veganKeywords = ['vegan', 'thuần chay', 'plant-based', 'không sữa', 'no dairy', 'no egg', 'không trứng'];
        const nonVeganKeywords = ['milk', 'cheese', 'butter', 'egg', 'sữa', 'phô mai', 'bơ', 'trứng', 'cream', 'kem'];

        // Must be vegetarian first
        if (!isVegetarian(item)) return false;

        // Check for non-vegan keywords
        if (nonVeganKeywords.some(keyword => text.includes(keyword))) {
            return false;
        }

        // Check for vegan keywords
        return veganKeywords.some(keyword => text.includes(keyword));
    };

    // Helper function to detect duration from name/description
    const getDuration = (item: MenuItem): '15_MIN' | '30_MIN' | '1_HOUR' | '2_HOURS' | '4_HOURS' | null => {
        const tr = item.translations?.[language];
        const name = (tr?.name || item.name).toLowerCase();
        const desc = (tr?.description || item.description || '').toLowerCase();
        const text = `${name} ${desc}`;

        // Check for 15 minutes / 15 phút
        if (text.includes('15 phút') || text.includes('15 minutes') || text.includes('15분') || text.includes('15分') || text.includes('15分钟')) {
            return '15_MIN';
        }

        // Check for 30 minutes / 30 phút / 1/2 hour / nửa giờ
        if (text.includes('30 phút') || text.includes('30 minutes') || text.includes('30분') || text.includes('30分') ||
            text.includes('30分钟') || text.includes('1/2 hour') || text.includes('nửa giờ') || text.includes('half hour') ||
            text.includes('半時間') || text.includes('半小时')) {
            return '30_MIN';
        }

        // Check for 1 hour / 1 giờ
        if (text.includes('1 giờ') || text.includes('1 hour') || text.includes('1시간') || text.includes('1時間') ||
            text.includes('1小时') || text.includes('une heure') || text.includes('1 час')) {
            return '1_HOUR';
        }

        // Check for 2 hours / 2 giờ
        if (text.includes('2 giờ') || text.includes('2 hours') || text.includes('2시간') || text.includes('2時間') ||
            text.includes('2小时') || text.includes('2 heures') || text.includes('2 часа')) {
            return '2_HOURS';
        }

        // Check for 4 hours / 4 giờ
        if (text.includes('4 giờ') || text.includes('4 hours') || text.includes('4시간') || text.includes('4時間') ||
            text.includes('4小时') || text.includes('4 heures') || text.includes('4 часа')) {
            return '4_HOURS';
        }

        return null;
    };

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
            const result = await addServiceRequest({
                id: Date.now().toString(),
                type: type,
                status: 'PENDING',
                details: `Order for: ${details}`,
                items: cart, // Save full items for translation support
                roomNumber: user.roomNumber,
                timestamp: Date.now()
            });

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

    // Filter and sort items
    const filteredAndSortedItems = useMemo(() => {
        let filtered = items.filter(item => {
            const tr = item.translations?.[language];
            const name = tr?.name || item.name;
            const desc = tr?.description || item.description || '';

            // Search filter with fuzzy matching
            const matchesSearch = !searchQuery ||
                name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fuzzyMatch(searchQuery, name) ||
                fuzzyMatch(searchQuery, desc);

            // Price filter
            const matchesPrice = priceFilter === 'ALL' ||
                (priceFilter === 'UNDER_100K' && item.price < 100000) ||
                (priceFilter === '100K_300K' && item.price >= 100000 && item.price < 300000) ||
                (priceFilter === '300K_500K' && item.price >= 300000 && item.price < 500000) ||
                (priceFilter === 'OVER_500K' && item.price >= 500000);

            // Dietary filter - Only apply for DINING
            const matchesDietary = type !== 'DINING' || dietaryFilter === 'ALL' ||
                (dietaryFilter === 'VEGETARIAN' && isVegetarian(item)) ||
                (dietaryFilter === 'VEGAN' && isVegan(item));

            // Duration filter - Only apply for POOL
            const matchesDuration = type !== 'POOL' || durationFilter === 'ALL' ||
                (durationFilter !== 'ALL' && getDuration(item) === durationFilter);

            return matchesSearch && matchesPrice && matchesDietary && matchesDuration;
        });

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'PRICE_LOW') return a.price - b.price;
            if (sortBy === 'PRICE_HIGH') return b.price - a.price;
            // NAME sort
            const aName = a.translations?.[language]?.name || a.name;
            const bName = b.translations?.[language]?.name || b.name;
            return aName.localeCompare(bName);
        });

        return filtered;
    }, [items, searchQuery, priceFilter, dietaryFilter, durationFilter, sortBy, language, type]);

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
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20 relative overflow-x-hidden">
            {/* Header with gradient and glassmorphism */}
            <div className={`p-2 text-white shadow-lg backdrop-blur-md bg-gradient-to-r ${config.gradient} flex items-center justify-between z-10 border-b border-white/20 overflow-x-hidden`}>
                <div className="flex items-center flex-1 min-w-0">
                    <button
                        onClick={onBack}
                        className="mr-3 text-white/90 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all duration-300 flex-shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <h2 className="text-xl font-bold tracking-tight truncate">{config.title}</h2>
                        <p className="text-xs text-white/80 mt-0.5 truncate">{config.subtitle}</p>
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 pb-32">
                {isLoading ? (
                    <SkeletonList count={4} variant="menu-item" />
                ) : (
                    <>
                        {/* Filters Section */}
                        <div className="mb-4 space-y-2.5">
                            {/* Search Bar with Suggestions */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={(() => {
                                        // Dynamic placeholder based on service type
                                        switch (type) {
                                            case 'DINING': return language === 'Vietnamese' ? 'Tìm kiếm món ăn...' : 'Search food...';
                                            case 'SPA': return language === 'Vietnamese' ? 'Tìm kiếm dịch vụ...' : 'Search spa services...';
                                            case 'POOL': return language === 'Vietnamese' ? 'Tìm kiếm đồ uống...' : 'Search drinks...';
                                            case 'BUTLER': return language === 'Vietnamese' ? 'Tìm kiếm yêu cầu...' : 'Search requests...';
                                            default: return t('search_locations') || 'Search items...';
                                        }
                                    })()}
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearchSubmit();
                                        }
                                    }}
                                    className="w-full pl-10 pr-10 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setShowSuggestions(false);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                                
                                {/* Suggestions Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div
                                        ref={suggestionsRef}
                                        className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
                                    >
                                        {suggestions.map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-emerald-50 transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                                            >
                                                <Clock size={14} className="text-gray-400 flex-shrink-0" />
                                                <span className="flex-1 truncate">{suggestion}</span>
                                            </button>
                                        ))}
                                        {searchHistory.length > 0 && (
                                            <div className="px-4 py-2 border-t border-gray-200">
                                                <button
                                                    onClick={() => {
                                                        clearSearchHistory(type);
                                                        setSearchHistory([]);
                                                        setShowSuggestions(false);
                                                    }}
                                                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                                                >
                                                    {language === 'Vietnamese' ? 'Xóa lịch sử' : 'Clear history'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Filter Dropdowns Row */}
                            <div className="flex flex-wrap items-center gap-2 overflow-x-hidden">
                                {/* Dietary Filter Dropdown - Only for DINING */}
                                {type === 'DINING' && (
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0 basis-[calc(50%-4px)]">
                                        <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                        <select
                                            value={dietaryFilter}
                                            onChange={(e) => setDietaryFilter(e.target.value as 'ALL' | 'VEGETARIAN' | 'VEGAN')}
                                            className="flex-1 min-w-0 text-xs font-semibold bg-white text-gray-700 border-2 border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                                        >
                                            <option value="ALL">{t('filter_all_dietary')}</option>
                                            <option value="VEGETARIAN">{t('filter_vegetarian')}</option>
                                            <option value="VEGAN">{t('filter_vegan')}</option>
                                        </select>
                                    </div>
                                )}

                                {/* Duration Filter Dropdown - Only for POOL */}
                                {type === 'POOL' && (
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0 basis-[calc(50%-4px)]">
                                        <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                        <select
                                            value={durationFilter}
                                            onChange={(e) => setDurationFilter(e.target.value as 'ALL' | '15_MIN' | '30_MIN' | '1_HOUR' | '2_HOURS' | '4_HOURS')}
                                            className="flex-1 min-w-0 text-xs font-semibold bg-white text-gray-700 border-2 border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                                        >
                                            <option value="ALL">{t('filter_all_duration')}</option>
                                            <option value="15_MIN">{t('filter_duration_15min')}</option>
                                            <option value="30_MIN">{t('filter_duration_30min')}</option>
                                            <option value="1_HOUR">{t('filter_duration_1hour')}</option>
                                            <option value="2_HOURS">{t('filter_duration_2hours')}</option>
                                            <option value="4_HOURS">{t('filter_duration_4hours')}</option>
                                        </select>
                                    </div>
                                )}

                                {/* Price Filter Dropdown */}
                                <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${type === 'DINING' || type === 'POOL' ? 'basis-[calc(50%-4px)]' : 'basis-[calc(50%-4px)]'}`}>
                                    <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <select
                                        value={priceFilter}
                                        onChange={(e) => setPriceFilter(e.target.value as 'ALL' | 'UNDER_100K' | '100K_300K' | '300K_500K' | 'OVER_500K')}
                                        className="flex-1 min-w-0 text-xs font-semibold bg-white text-gray-700 border-2 border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                                    >
                                        <option value="ALL">{t('filter_all_prices')}</option>
                                        <option value="UNDER_100K">{t('filter_price_under_100k')}</option>
                                        <option value="100K_300K">{t('filter_price_100k_300k')}</option>
                                        <option value="300K_500K">{t('filter_price_300k_500k')}</option>
                                        <option value="OVER_500K">{t('filter_price_over_500k')}</option>
                                    </select>
                                </div>

                                {/* Sort Dropdown */}
                                <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${type === 'DINING' || type === 'POOL' ? 'basis-full' : 'basis-[calc(50%-4px)]'}`}>
                                    <ArrowUpDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as 'NAME' | 'PRICE_LOW' | 'PRICE_HIGH')}
                                        className="flex-1 min-w-0 text-xs font-semibold bg-white text-gray-700 border-2 border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                                    >
                                        <option value="NAME">{t('sort_name_az')}</option>
                                        <option value="PRICE_LOW">{t('sort_price_low_high')}</option>
                                        <option value="PRICE_HIGH">{t('sort_price_high_low')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            {filteredAndSortedItems.map(item => {
                                const tr = item.translations?.[language];
                                const name = tr?.name || item.name;
                                const desc = tr?.description || item.description;

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg border-2 border-gray-100/60 flex justify-between items-start gap-3 transition-all hover:shadow-xl hover:border-gray-200 overflow-hidden"
                                        style={{
                                            boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-base mb-1.5 leading-snug" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"' }}>{name}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-2 leading-relaxed">{desc}</p>
                                            <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-sm ${config.lightBg} ${config.textColor} border ${config.borderColor}`}>
                                                {item.price > 0 ? `${item.price.toLocaleString('vi-VN')} VND` : 'Complimentary'}
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
                            {filteredAndSortedItems.length === 0 && (
                                <div className="text-center py-16 px-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium text-base">
                                        {searchQuery || priceFilter !== 'ALL' || durationFilter !== 'ALL' || dietaryFilter !== 'ALL'
                                            ? 'No items found'
                                            : 'No items available'}
                                    </p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {searchQuery || priceFilter !== 'ALL' || durationFilter !== 'ALL' || dietaryFilter !== 'ALL'
                                            ? 'Try adjusting your filters'
                                            : 'in this category yet'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Cart Summary - Modern fixed footer */}
            {cart.length > 0 && (
                <div
                    className="fixed left-1/2 -translate-x-1/2 backdrop-blur-lg bg-white/95 border-t-2 border-gray-200/60 p-4 shadow-2xl z-30 max-w-md w-full"
                    style={{
                        bottom: 'calc(5rem + 0.75rem)', // 80px nav + 12px gap for safety
                        boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.2)',
                        paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))'
                    }}
                >
                    <div className="w-full">
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
                                <span className="text-2xl font-black text-gray-800">{totalPrice.toLocaleString('vi-VN')}</span>
                                <span className="text-xs text-gray-500">VND</span>
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
});

ServiceBooking.displayName = 'ServiceBooking';

export default ServiceBooking;

