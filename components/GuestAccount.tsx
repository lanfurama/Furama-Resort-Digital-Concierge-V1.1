
import React, { useState, useEffect } from 'react';
import { User, ServiceRequest } from '../types';
import { getCompletedGuestOrders, updateUserNotes, rateServiceRequest, submitHotelReview, getHotelReview, updateUserLanguage } from '../services/dataService';
import { Clock, ShoppingBag, Car, Utensils, Sparkles, Waves, User as UserIcon, Save, Star, Hotel, ThumbsUp, Globe, ArrowLeft } from 'lucide-react';
import Loading from './Loading';
import { useTranslation } from '../contexts/LanguageContext';

interface GuestAccountProps {
    user: User;
    onBack: () => void;
}

const REVIEW_CATEGORIES = [
    { id: 'reception', label: 'Reception & Front Desk' },
    { id: 'hygiene', label: 'Room Cleanliness (Hygiene)' },
    { id: 'fb', label: 'Food & Beverage (F&B)' },
    { id: 'buggy', label: 'Buggy Service' },
    { id: 'facilities', label: 'Pool & Spa Facilities' },
    { id: 'overall', label: 'Overall Satisfaction' },
];

const SUPPORTED_LANGUAGES = [
    'English', 
    'Vietnamese', 
    'Korean', 
    'Japanese', 
    'Chinese', 
    'French', 
    'Russian'
];

const GuestAccount: React.FC<GuestAccountProps> = ({ user, onBack }) => {
    const { t, language, setLanguage: setContextLanguage } = useTranslation();
    
    // Only fetch Completed orders for Account History
    const [history, setHistory] = useState<ServiceRequest[]>([]);
    const [existingReview, setExistingReview] = useState(getHotelReview(user.roomNumber));
    const [notes, setNotes] = useState(user.notes || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    
    // Load history and hotel review on mount
    useEffect(() => {
        setIsLoadingHistory(true);
        getCompletedGuestOrders(user.roomNumber)
            .then(setHistory)
            .catch(console.error)
            .finally(() => setIsLoadingHistory(false));
        // Load hotel review
        const review = getHotelReview(user.roomNumber);
        setExistingReview(review);
        if (review) {
            const initialRatings = REVIEW_CATEGORIES.map(cat => {
                const existing = review.categoryRatings?.find(r => r.category === cat.label);
                return { 
                    id: cat.id, 
                    label: cat.label, 
                    value: existing ? existing.rating : 5 
                };
            });
            setRatings(initialRatings);
            setHotelComment(review.comment);
            setIsHotelReviewSubmitted(true);
        }
    }, [user.roomNumber]);
    
    // Language State - Load from database on mount
    const [selectedLang, setSelectedLang] = useState(user.language || 'English');
    const [isLangSaving, setIsLangSaving] = useState(false);
    
    // Sync language from database when component mounts
    useEffect(() => {
        const loadLanguageFromDB = async () => {
            try {
                const { apiClient } = await import('../services/apiClient');
                const dbUser = await apiClient.get<any>(`/users/room/${user.roomNumber}`).catch(() => null);
                if (dbUser && dbUser.language) {
                    console.log('Loaded language from database:', dbUser.language);
                    setSelectedLang(dbUser.language);
                    // Update localStorage
                    const savedUser = localStorage.getItem('furama_user');
                    if (savedUser) {
                        const parsedUser = JSON.parse(savedUser);
                        parsedUser.language = dbUser.language;
                        localStorage.setItem('furama_user', JSON.stringify(parsedUser));
                    }
                    // Update context
                    setContextLanguage(dbUser.language as any);
                }
            } catch (error) {
                console.error('Failed to load language from database:', error);
            }
        };
        loadLanguageFromDB();
    }, [user.roomNumber, setContextLanguage]);
    
    // Service Rating State
    const [activeRatingId, setActiveRatingId] = useState<string | null>(null);
    const [serviceRatingValue, setServiceRatingValue] = useState(5);
    const [serviceCommentValue, setServiceCommentValue] = useState('');
    
    // Hotel Review State
    const [showHotelReview, setShowHotelReview] = useState(false);
    
    // Initialize detailed ratings from existing review or default to 5
    const initialRatings = REVIEW_CATEGORIES.map(cat => {
        const existing = existingReview?.categoryRatings?.find(r => r.category === cat.label);
        return { 
            id: cat.id, 
            label: cat.label, 
            value: existing ? existing.rating : 5 
        };
    });

    const [ratings, setRatings] = useState(initialRatings);
    const [hotelComment, setHotelComment] = useState(existingReview ? existingReview.comment : '');
    const [isHotelReviewSubmitted, setIsHotelReviewSubmitted] = useState(!!existingReview);

    const handleSaveNotes = async () => {
        setIsSaving(true);
        try {
            await updateUserNotes(user.roomNumber, notes);
            // Update user in localStorage
            const savedUser = localStorage.getItem('furama_user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                parsedUser.notes = notes;
                localStorage.setItem('furama_user', JSON.stringify(parsedUser));
            }
        } catch (error) {
            console.error('Failed to save notes:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLanguageChange = async (newLang: string) => {
        console.log('=== handleLanguageChange START ===');
        console.log('New language:', newLang);
        console.log('Current language:', selectedLang);
        console.log('User room number:', user.roomNumber);
        
        setSelectedLang(newLang);
        setIsLangSaving(true);
        
        try {
            console.log('Calling updateUserLanguage...');
            await updateUserLanguage(user.roomNumber, newLang);
            console.log('updateUserLanguage completed successfully');
            
            // Update user in localStorage
            const savedUser = localStorage.getItem('furama_user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                parsedUser.language = newLang;
                localStorage.setItem('furama_user', JSON.stringify(parsedUser));
                console.log('localStorage updated');
            }
            
            // Update Context Immediately
            console.log('Updating language context...');
            setContextLanguage(newLang as any);
            console.log('Language context updated');
            
            console.log('=== handleLanguageChange SUCCESS ===');
        } catch (error: any) {
            console.error('=== handleLanguageChange ERROR ===');
            console.error('Error:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            // Revert selectedLang on error
            setSelectedLang(selectedLang);
            
            alert(`Failed to update language: ${error.message || 'Unknown error'}\n\nPlease check:\n1. Database has 'language' column\n2. Backend server is running\n3. Check browser console for details`);
        } finally {
            setIsLangSaving(false);
            console.log('=== handleLanguageChange END ===');
        }
    };

    const handleSubmitServiceRating = async (id: string) => {
        try {
            await rateServiceRequest(id, serviceRatingValue, serviceCommentValue);
            setActiveRatingId(null);
            setServiceRatingValue(5);
            setServiceCommentValue('');
            // Refresh history to show updated rating
            getCompletedGuestOrders(user.roomNumber).then(setHistory).catch(console.error);
        } catch (error) {
            console.error('Failed to submit rating:', error);
            alert('Failed to submit rating. Please try again.');
        }
    };

    const handleCategoryRate = (id: string, stars: number) => {
        setRatings(prev => prev.map(r => r.id === id ? { ...r, value: stars } : r));
    };

    const handleSubmitHotelReview = async () => {
        try {
            // Calculate Average
            const sum = ratings.reduce((acc, curr) => acc + curr.value, 0);
            const avg = parseFloat((sum / ratings.length).toFixed(1));

            const review = {
                id: Date.now().toString(),
                roomNumber: user.roomNumber,
                guestName: user.lastName,
                categoryRatings: ratings.map(r => ({ category: r.label, rating: r.value })),
                averageRating: avg,
                comment: hotelComment,
                timestamp: Date.now()
            };
            submitHotelReview(review);
            setExistingReview(review);
            setIsHotelReviewSubmitted(true);
            setShowHotelReview(false);
        } catch (error) {
            console.error('Failed to submit hotel review:', error);
            alert('Failed to submit review. Please try again.');
        }
    };

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
        return 'bg-gray-100 text-gray-700 border-gray-200';
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

    const averageRatingDisplay = existingReview ? existingReview.averageRating : (ratings.reduce((a,b)=>a+b.value,0)/ratings.length).toFixed(1);

    return (
        <div className="flex flex-col h-full bg-gray-50 relative">
            {/* Header */}
            <div className="bg-emerald-900 text-white p-6 pb-8 rounded-b-[2.5rem] shadow-xl relative z-10">
                {/* Back Button for consistency */}
                <button onClick={onBack} className="absolute top-4 left-4 text-white hover:text-emerald-200">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-serif font-bold text-center">{t('my_account')}</h2>
                <div className="mt-6 flex flex-col items-center">
                    <div className="w-20 h-20 bg-emerald-700 rounded-full flex items-center justify-center border-4 border-emerald-800 shadow-inner">
                        <span className="text-3xl font-serif text-emerald-200">{user.lastName.charAt(0)}</span>
                    </div>
                    <h3 className="text-xl font-bold mt-3">Mr/Ms {user.lastName}</h3>
                    <p className="text-emerald-300 text-sm">{t('room')} {user.roomNumber}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 -mt-4 relative z-20 pb-24">
                
                {/* Profile Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">{t('reservation_details')}</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">{t('villa_type')}</p>
                            <p className="font-semibold text-gray-800">{user.villaType || 'Standard Room'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('stay_duration')}</p>
                            <p className="font-semibold text-gray-800">
                                {user.checkIn ? new Date(user.checkIn).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'N/A'} - 
                                {user.checkOut ? new Date(user.checkOut).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'N/A'}
                            </p>
                        </div>
                        
                        {/* Language Selector */}
                        <div className="col-span-2 mt-2 pt-2 border-t border-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs text-gray-500 flex items-center"><Globe size={12} className="mr-1"/> {t('app_language')}</p>
                                {isLangSaving && <span className="text-[10px] text-emerald-600 font-bold animate-pulse">Updating...</span>}
                            </div>
                            <select 
                                value={selectedLang}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Hotel Rating Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl shadow-sm border border-emerald-100">
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wide flex items-center">
                            <Hotel size={16} className="mr-2"/> {t('experience_feedback')}
                        </h4>
                        {isHotelReviewSubmitted && (
                            <div className="flex items-center bg-white px-2 py-1 rounded-lg border border-emerald-100 shadow-sm">
                                <Star size={12} className="fill-amber-400 text-amber-400 mr-1"/>
                                <span className="text-xs font-bold text-gray-800">{averageRatingDisplay}</span>
                            </div>
                        )}
                     </div>
                     
                     {!isHotelReviewSubmitted ? (
                         !showHotelReview ? (
                             <button 
                                onClick={() => setShowHotelReview(true)}
                                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition"
                            >
                                {t('rate_stay')}
                             </button>
                         ) : (
                             <div className="animate-in fade-in slide-in-from-top-2">
                                 <p className="text-xs text-gray-500 mb-3 text-center">Please rate us on the following categories:</p>
                                 
                                 <div className="space-y-3 mb-4">
                                     {ratings.map((item) => (
                                         <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-2 rounded-lg border border-gray-50 shadow-sm">
                                             <span className="text-xs font-bold text-gray-700 mb-1 sm:mb-0">{item.label}</span>
                                             <div className="flex space-x-2">
                                                 {[1,2,3,4,5].map(star => (
                                                     <button 
                                                        key={star} 
                                                        onClick={() => handleCategoryRate(item.id, star)}
                                                        className="focus:outline-none transition transform active:scale-95"
                                                     >
                                                         <Star 
                                                             size={20} 
                                                             className={`${star <= item.value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} 
                                                         />
                                                     </button>
                                                 ))}
                                             </div>
                                         </div>
                                     ))}
                                 </div>

                                 <textarea 
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    rows={3}
                                    placeholder="Any additional comments or suggestions?"
                                    value={hotelComment}
                                    onChange={(e) => setHotelComment(e.target.value)}
                                 ></textarea>

                                 <div className="flex space-x-2">
                                     <button onClick={() => setShowHotelReview(false)} className="flex-1 py-3 text-gray-500 text-xs font-bold hover:bg-gray-100 rounded-xl">{t('cancel')}</button>
                                     <button onClick={handleSubmitHotelReview} className="flex-1 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-emerald-700">{t('submit')}</button>
                                 </div>
                             </div>
                         )
                     ) : (
                         <div className="bg-white/50 rounded-xl p-2">
                             <div className="text-center mb-3">
                                 <p className="text-sm text-gray-600 italic">"{hotelComment || 'Thank you for your valuable feedback!'}"</p>
                             </div>
                             {/* Mini Breakdown Display */}
                             <div className="grid grid-cols-2 gap-2">
                                 {existingReview?.categoryRatings.map((cat, idx) => (
                                     <div key={idx} className="flex justify-between items-center text-[10px] text-gray-500">
                                         <span className="truncate mr-1">{cat.category}</span>
                                         <span className="flex items-center font-bold text-amber-500">
                                             {cat.rating} <Star size={8} className="fill-current ml-0.5"/>
                                         </span>
                                     </div>
                                 ))}
                             </div>
                             <button onClick={() => setShowHotelReview(true)} className="w-full text-center text-[10px] text-emerald-600 underline mt-3 hover:text-emerald-800">Edit Review</button>
                         </div>
                     )}
                </div>

                {/* Personal Notes */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">{t('personal_notes')}</h4>
                        {isSaving && <span className="text-xs text-emerald-600 font-bold animate-pulse">Saved!</span>}
                    </div>
                    <textarea 
                        className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:outline-none resize-none"
                        rows={3}
                        placeholder="e.g. Extra pillows, No nuts in food..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                    <button 
                        onClick={handleSaveNotes}
                        className="mt-2 w-full py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg hover:bg-emerald-100 transition flex items-center justify-center"
                    >
                        <Save size={14} className="mr-1" /> {t('save_notes')}
                    </button>
                </div>

                {/* Completed Order History */}
                <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3 px-2">{t('completed_orders')}</h4>
                    {isLoadingHistory ? (
                        <Loading size="sm" message={t('loading') || 'Loading history...'} />
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <ShoppingBag className="mx-auto w-10 h-10 mb-2 opacity-20"/>
                            <p className="text-sm">No completed orders yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((req, i) => (
                                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
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
                                                <p className="font-bold text-gray-800 text-sm">{req.type === 'BUGGY' ? t('buggy') : t(req.type.toLowerCase())}</p>
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

                                    {/* RATING AREA (Only for Completed Orders) */}
                                    {req.status === 'COMPLETED' && (
                                        <div className="mt-3 pt-3 border-t border-gray-50">
                                            {req.rating ? (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex text-amber-400">
                                                        {[...Array(req.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                                    </div>
                                                    {req.feedback && <span className="text-xs text-gray-500 italic">"{req.feedback}"</span>}
                                                </div>
                                            ) : (
                                                activeRatingId === req.id ? (
                                                    <div className="animate-in fade-in">
                                                        <div className="flex items-center justify-center space-x-2 mb-2">
                                                            {[1,2,3,4,5].map(star => (
                                                                <button key={star} onClick={() => setServiceRatingValue(star)}>
                                                                    <Star size={20} className={`${star <= serviceRatingValue ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Comments (optional)..."
                                                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded p-2 mb-2 focus:outline-none"
                                                            value={serviceCommentValue}
                                                            onChange={(e) => setServiceCommentValue(e.target.value)}
                                                        />
                                                        <div className="flex space-x-2">
                                                            <button onClick={() => setActiveRatingId(null)} className="flex-1 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded">{t('cancel')}</button>
                                                            <button onClick={() => handleSubmitServiceRating(req.id)} className="flex-1 py-1 text-xs bg-emerald-600 text-white rounded font-bold">{t('submit')}</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => setActiveRatingId(req.id)}
                                                        className="w-full py-1.5 flex items-center justify-center text-xs text-emerald-600 font-bold bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                                                    >
                                                        <ThumbsUp size={14} className="mr-1"/> {t('rate_service')}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuestAccount;
