
import React, { useState, useEffect } from 'react';
import { User, ServiceRequest, HotelReview } from '../types';
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
    const [existingReview, setExistingReview] = useState<HotelReview | undefined>(undefined);
    const [notes, setNotes] = useState(user.notes || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isLoadingReview, setIsLoadingReview] = useState(true);
    
    // Load history and hotel review on mount
    useEffect(() => {
        setIsLoadingHistory(true);
        setIsLoadingReview(true);
        
        // Load completed orders
        getCompletedGuestOrders(user.roomNumber)
            .then(setHistory)
            .catch(console.error)
            .finally(() => setIsLoadingHistory(false));
        
        // Load hotel review from API
        getHotelReview(user.roomNumber)
            .then(review => {
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
            })
            .catch(console.error)
            .finally(() => setIsLoadingReview(false));
    }, [user.roomNumber]);
    
    // Language State - Load from database on mount
    const [selectedLang, setSelectedLang] = useState(user.language || 'English');
    const [isLangSaving, setIsLangSaving] = useState(false);
    const [isLoadingUserData, setIsLoadingUserData] = useState(true);
    
    // Sync language and notes from database when component mounts
    useEffect(() => {
        const loadUserDataFromDB = async () => {
            setIsLoadingUserData(true);
            try {
                const { apiClient } = await import('../services/apiClient');
                const dbUser = await apiClient.get<any>(`/users/room/${user.roomNumber}`).catch(() => null);
                if (dbUser) {
                    // Update language if exists in database
                    if (dbUser.language) {
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
                    
                    // Update notes if exists in database
                    if (dbUser.notes !== undefined && dbUser.notes !== null) {
                        console.log('Loaded notes from database:', dbUser.notes);
                        setNotes(dbUser.notes);
                        // Update localStorage
                        const savedUser = localStorage.getItem('furama_user');
                        if (savedUser) {
                            const parsedUser = JSON.parse(savedUser);
                            parsedUser.notes = dbUser.notes;
                            localStorage.setItem('furama_user', JSON.stringify(parsedUser));
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load user data from database:', error);
            } finally {
                setIsLoadingUserData(false);
            }
        };
        loadUserDataFromDB();
    }, [user.roomNumber, setContextLanguage]);
    
    // Service Rating State
    const [activeRatingId, setActiveRatingId] = useState<string | null>(null);
    const [serviceRatingValue, setServiceRatingValue] = useState(5);
    const [serviceCommentValue, setServiceCommentValue] = useState('');
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    
    // Hotel Review State
    const [showHotelReview, setShowHotelReview] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    
    // Initialize detailed ratings from default to 5 (will be updated when review loads)
    const initialRatings = REVIEW_CATEGORIES.map(cat => ({
        id: cat.id,
        label: cat.label,
        value: 5
    }));

    const [ratings, setRatings] = useState(initialRatings);
    const [hotelComment, setHotelComment] = useState('');
    const [isHotelReviewSubmitted, setIsHotelReviewSubmitted] = useState(false);

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

    const handleSubmitServiceRating = async (id: string, requestType?: string) => {
        if (isSubmittingRating) return;
        
        setIsSubmittingRating(true);
        try {
            await rateServiceRequest(id, serviceRatingValue, serviceCommentValue, requestType);
            setActiveRatingId(null);
            setServiceRatingValue(5);
            setServiceCommentValue('');
            // Refresh history to show updated rating
            const updatedHistory = await getCompletedGuestOrders(user.roomNumber);
            setHistory(updatedHistory);
        } catch (error: any) {
            console.error('Failed to submit rating:', error);
            alert(t('error_submit_rating') || `Failed to submit rating: ${error.message || 'Please try again.'}`);
        } finally {
            setIsSubmittingRating(false);
        }
    };

    const handleCategoryRate = (id: string, stars: number) => {
        setRatings(prev => prev.map(r => r.id === id ? { ...r, value: stars } : r));
    };

    const handleSubmitHotelReview = async () => {
        if (isSubmittingReview) return;
        
        setIsSubmittingReview(true);
        try {
            // Calculate Average
            const sum = ratings.reduce((acc, curr) => acc + curr.value, 0);
            const avg = parseFloat((sum / ratings.length).toFixed(1));

            const review = {
                id: existingReview?.id || Date.now().toString(),
                roomNumber: user.roomNumber,
                guestName: user.lastName,
                categoryRatings: ratings.map(r => ({ category: r.label, rating: r.value })),
                averageRating: avg,
                comment: hotelComment,
                timestamp: existingReview?.timestamp || Date.now()
            };
            
            // If there's an existing review, update it; otherwise create new
            const reviewId = existingReview?.id;
            await submitHotelReview(review, reviewId);
            
            // Reload review from API to get updated data
            const updatedReview = await getHotelReview(user.roomNumber);
            if (updatedReview) {
                setExistingReview(updatedReview);
            } else {
                setExistingReview(review);
            }
            
            setIsHotelReviewSubmitted(true);
            setShowHotelReview(false);
        } catch (error: any) {
            console.error('Failed to submit hotel review:', error);
            alert(t('error_submit_review') || `Failed to submit review: ${error.message || 'Please try again.'}`);
        } finally {
            setIsSubmittingReview(false);
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
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20 relative">
            {/* Modern Header with Gradient & Glassmorphism */}
            <div 
                className="backdrop-blur-md bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white p-3 pb-4 rounded-b-3xl shadow-2xl relative z-10"
                style={{
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)'
                }}
            >
                {/* Back Button */}
                <button 
                    onClick={onBack} 
                    className="absolute top-2.5 left-2.5 text-white/90 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-all duration-300"
                >
                    <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                </button>
                
                <h2 className="text-lg font-bold text-center tracking-tight">{t('my_account')}</h2>
                
                <div className="mt-3 flex flex-col items-center">
                    <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-xl backdrop-blur-sm">
                            <span className="text-2xl font-bold text-white">{user.lastName.charAt(0)}</span>
                        </div>
                        {/* Active indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-emerald-800 shadow-md"></div>
                    </div>
                    <h3 className="text-base font-bold mt-2 text-white">Mr/Ms {user.lastName}</h3>
                    <div className="mt-1 px-2.5 py-0.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                        <p className="text-emerald-200 text-[10px] font-semibold">{t('room')} {user.roomNumber}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 -mt-4 relative z-20 pb-24">
                {(isLoadingHistory || isLoadingReview || isLoadingUserData) && (
                    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                        <Loading size="md" message={t('loading') || 'Loading account data...'} />
                    </div>
                )}
                
                {/* Profile Card - Modern Design */}
                <div className="backdrop-blur-lg bg-white/95 p-5 rounded-3xl shadow-xl border border-white/60"
                    style={{
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)'
                    }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t('reservation_details')}</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-xl border border-blue-100">
                            <p className="text-xs text-gray-600 font-medium mb-1">{t('villa_type')}</p>
                            <p className="font-bold text-gray-800 text-sm">{user.villaType || 'Standard Room'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-100">
                            <p className="text-xs text-gray-600 font-medium mb-1">{t('stay_duration')}</p>
                            <p className="font-bold text-gray-800 text-sm">
                                {user.checkIn ? new Date(user.checkIn).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'N/A'} - 
                                {user.checkOut ? new Date(user.checkOut).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'N/A'}
                            </p>
                        </div>
                        
                        {/* Language Selector */}
                        <div className="col-span-2 mt-2 pt-4 border-t-2 border-gray-100">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-xs text-gray-600 font-semibold flex items-center gap-1.5">
                                    <Globe size={14} className="text-emerald-600"/> 
                                    {t('app_language')}
                                </p>
                                {isLangSaving && (
                                    <span className="text-[10px] text-emerald-600 font-bold animate-pulse bg-emerald-50 px-2 py-1 rounded-full">
                                        Updating...
                                    </span>
                                )}
                            </div>
                            <select 
                                value={selectedLang}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="w-full bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl p-3 text-sm text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                            >
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Hotel Rating Card - Modern Design */}
                <div className="backdrop-blur-lg bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-5 rounded-3xl shadow-xl border-2 border-emerald-100/60"
                    style={{
                        boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.2)'
                    }}
                >
                     <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                            <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-2">
                                <Hotel size={16} className="text-emerald-600"/> 
                                {t('experience_feedback')}
                            </h4>
                        </div>
                        {isHotelReviewSubmitted && !isLoadingReview && (
                            <div className="flex items-center bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-1.5 rounded-xl border-2 border-amber-200 shadow-md">
                                <Star size={14} className="fill-amber-400 text-amber-400 mr-1.5"/>
                                <span className="text-sm font-black text-gray-800">{averageRatingDisplay}</span>
                            </div>
                        )}
                     </div>
                     
                     {isLoadingReview ? (
                         <Loading size="sm" message={t('loading') || 'Loading review...'} />
                     ) : !showHotelReview && !isHotelReviewSubmitted ? (
                         <button 
                            onClick={() => setShowHotelReview(true)}
                            className="group relative w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <Star className="w-5 h-5" />
                                {t('rate_stay')}
                            </span>
                         </button>
                     ) : showHotelReview ? (
                         <div className="animate-in fade-in slide-in-from-top-2">
                                 <p className="text-xs text-gray-500 mb-3 text-center">Please rate us on the following categories:</p>
                                 
                                 <div className="space-y-3 mb-4">
                                     {ratings.map((item) => (
                                         <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/80 backdrop-blur-sm p-3 rounded-xl border-2 border-gray-100 shadow-md hover:shadow-lg transition-all">
                                             <span className="text-xs font-bold text-gray-800 mb-2 sm:mb-0">{item.label}</span>
                                             <div className="flex space-x-1.5">
                                                 {[1,2,3,4,5].map(star => (
                                                     <button 
                                                        key={star} 
                                                        onClick={() => handleCategoryRate(item.id, star)}
                                                        className="focus:outline-none transition-all duration-200 hover:scale-110"
                                                     >
                                                         <Star 
                                                             size={22} 
                                                             className={`transition-all ${star <= item.value ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-gray-200'}`} 
                                                         />
                                                     </button>
                                                 ))}
                                             </div>
                                         </div>
                                     ))}
                                 </div>

                                 <textarea 
                                    className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-400 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all caret-emerald-600"
                                    style={{ caretColor: '#10b981' }}
                                    rows={3}
                                    placeholder="Any additional comments or suggestions?"
                                    value={hotelComment}
                                    onChange={(e) => setHotelComment(e.target.value)}
                                 ></textarea>

                                 <div className="flex space-x-2">
                                     <button 
                                        onClick={() => setShowHotelReview(false)} 
                                        disabled={isSubmittingReview}
                                        className="flex-1 py-3 text-gray-600 text-xs font-bold hover:bg-gray-100 rounded-xl border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                     >
                                        {t('cancel')}
                                     </button>
                                     <button 
                                        onClick={handleSubmitHotelReview} 
                                        disabled={isSubmittingReview}
                                        className="group relative flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden flex items-center justify-center"
                                     >
                                        {isSubmittingReview ? (
                                            <>
                                                <span className="animate-spin mr-2">⏳</span>
                                                {t('submitting') || 'Submitting...'}
                                            </>
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                                <span className="relative z-10">{t('submit')}</span>
                                            </>
                                        )}
                                     </button>
                                 </div>
                             </div>
                     ) : (
                         <div className="bg-gradient-to-br from-white/80 to-emerald-50/50 rounded-2xl p-4 border-2 border-emerald-100 shadow-md">
                             <div className="text-center mb-4">
                                 <p className="text-sm text-gray-700 italic font-medium leading-relaxed">"{hotelComment || existingReview?.comment || 'Thank you for your valuable feedback!'}"</p>
                             </div>
                             {/* Mini Breakdown Display */}
                             <div className="grid grid-cols-2 gap-2 mb-3">
                                 {existingReview?.categoryRatings.map((cat, idx) => (
                                     <div key={idx} className="flex justify-between items-center bg-white/60 backdrop-blur-sm px-2 py-1.5 rounded-lg border border-gray-200">
                                         <span className="truncate mr-1 text-[10px] font-semibold text-gray-700">{cat.category}</span>
                                         <span className="flex items-center font-bold text-amber-600 gap-0.5">
                                             {cat.rating} <Star size={10} className="fill-current"/>
                                         </span>
                                     </div>
                                 ))}
                             </div>
                             <button 
                                 onClick={() => {
                                     setShowHotelReview(true);
                                     // Load existing review data into form
                                     if (existingReview) {
                                         const initialRatings = REVIEW_CATEGORIES.map(cat => {
                                             const existing = existingReview.categoryRatings?.find(r => r.category === cat.label);
                                             return { 
                                                 id: cat.id, 
                                                 label: cat.label, 
                                                 value: existing ? existing.rating : 5 
                                             };
                                         });
                                         setRatings(initialRatings);
                                         setHotelComment(existingReview.comment || '');
                                     }
                                 }} 
                                 className="w-full text-center text-xs text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 py-2 rounded-xl border border-emerald-200 transition-all"
                             >
                                 Edit Review
                             </button>
                         </div>
                     )}
                </div>

                {/* Personal Notes - Modern Design */}
                <div className="backdrop-blur-lg bg-white/95 p-5 rounded-3xl shadow-xl border border-white/60"
                    style={{
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)'
                    }}
                >
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></div>
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t('personal_notes')}</h4>
                        </div>
                        {isSaving && (
                            <span className="text-xs text-emerald-600 font-bold animate-pulse bg-emerald-50 px-2 py-1 rounded-full">
                                Saved!
                            </span>
                        )}
                    </div>
                    <textarea 
                        className="w-full bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-400 focus:outline-none resize-none transition-all caret-yellow-600"
                        style={{ caretColor: '#d97706' }}
                        rows={3}
                        placeholder="e.g. Extra pillows, No nuts in food..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                    <button 
                        onClick={handleSaveNotes}
                        className="group relative mt-3 w-full py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 font-bold text-xs rounded-xl hover:from-emerald-100 hover:to-teal-100 transition-all border-2 border-emerald-200 hover:border-emerald-300 flex items-center justify-center shadow-md"
                    >
                        <Save size={14} className="mr-1.5" /> 
                        {t('save_notes')}
                    </button>
                </div>

                {/* Completed Order History */}
                <div>
                    <div className="flex items-center gap-2 mb-3 px-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full"></div>
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t('completed_orders')}</h4>
                    </div>
                    {isLoadingHistory ? (
                        <Loading size="sm" message={t('loading') || 'Loading history...'} />
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <ShoppingBag className="w-8 h-8 text-gray-400"/>
                            </div>
                            <p className="text-gray-500 font-medium text-sm">No completed orders yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((req, i) => (
                                <div key={i} className="backdrop-blur-sm bg-white/95 p-4 rounded-2xl shadow-lg border-2 border-gray-100/60 flex flex-col transition-all hover:shadow-xl"
                                    style={{
                                        boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2.5 rounded-xl flex-shrink-0 shadow-md border-2 ${
                                            req.type === 'DINING' ? 'bg-gradient-to-br from-orange-100 to-red-100 text-orange-600 border-orange-200' :
                                            req.type === 'SPA' ? 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 border-purple-200' :
                                            req.type === 'BUGGY' ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 border-emerald-200' :
                                            'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 border-blue-200'
                                        }`}>
                                            {getIcon(req.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-bold text-gray-800 text-sm">{req.type === 'BUGGY' ? t('buggy') : t(req.type.toLowerCase())}</p>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border-2 ${getColor(req.status)} shadow-sm`}>
                                                    {t(req.status)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-1 font-medium">{getTranslatedDetails(req)}</p>
                                            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                                                <Clock size={11} className="text-gray-400" />
                                                {new Date(req.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* RATING AREA (Only for Completed Orders) */}
                                    {req.status === 'COMPLETED' && (
                                        <div className="mt-3 pt-3 border-t-2 border-gray-100">
                                            {req.rating ? (
                                                <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 p-2 rounded-xl border border-amber-200">
                                                    <div className="flex text-amber-400 gap-0.5">
                                                        {[...Array(req.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" className="drop-shadow-sm" />)}
                                                    </div>
                                                    {req.feedback && <span className="text-xs text-gray-600 italic font-medium">"{req.feedback}"</span>}
                                                </div>
                                            ) : (
                                                activeRatingId === req.id ? (
                                                    <div className="animate-in fade-in bg-gradient-to-br from-gray-50 to-blue-50 p-3 rounded-xl border-2 border-gray-200">
                                                        <div className="flex items-center justify-center space-x-2 mb-3">
                                                            {[1,2,3,4,5].map(star => (
                                                                <button key={star} onClick={() => setServiceRatingValue(star)} className="transition-all hover:scale-110">
                                                                    <Star size={22} className={`${star <= serviceRatingValue ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-gray-200'}`} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Comments (optional)..."
                                                            className="w-full text-xs bg-white border-2 border-gray-200 rounded-xl p-2.5 mb-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all caret-emerald-600"
                                                            style={{ caretColor: '#10b981' }}
                                                            value={serviceCommentValue}
                                                            onChange={(e) => setServiceCommentValue(e.target.value)}
                                                        />
                                                        <div className="flex space-x-2">
                                                            <button 
                                                                onClick={() => {
                                                                    setActiveRatingId(null);
                                                                    setServiceRatingValue(5);
                                                                    setServiceCommentValue('');
                                                                }} 
                                                                disabled={isSubmittingRating}
                                                                className="flex-1 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                                                            >
                                                                {t('cancel')}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSubmitServiceRating(req.id, req.type)} 
                                                                disabled={isSubmittingRating}
                                                                className="group relative flex-1 py-2 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg overflow-hidden"
                                                            >
                                                                {isSubmittingRating ? (
                                                                    <>
                                                                        <span className="animate-spin mr-1">⏳</span>
                                                                        {t('submitting') || 'Submitting...'}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                                                        <span className="relative z-10">{t('submit')}</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => setActiveRatingId(req.id)}
                                                        className="w-full py-2 flex items-center justify-center text-xs text-emerald-700 font-bold bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-xl transition-all border-2 border-emerald-200 hover:border-emerald-300 shadow-md"
                                                    >
                                                        <ThumbsUp size={14} className="mr-1.5"/> 
                                                        {t('rate_service')}
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
