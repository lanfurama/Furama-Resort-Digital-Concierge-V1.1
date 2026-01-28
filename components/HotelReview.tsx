import React, { useState, useEffect } from 'react';
import { User, HotelReview } from '../types';
import { getHotelReview, submitHotelReview } from '../services/dataService';
import { Star, Hotel } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useToast } from '../hooks/useToast';
import Loading from './Loading';

const REVIEW_CATEGORIES = [
    { id: 'reception', label: 'Reception & Front Desk', labelKey: 'review_reception' as const },
    { id: 'hygiene', label: 'Room Cleanliness (Hygiene)', labelKey: 'review_hygiene' as const },
    { id: 'fb', label: 'Food & Beverage (F&B)', labelKey: 'review_fb' as const },
    { id: 'buggy', label: 'Buggy Service', labelKey: 'review_buggy' as const },
    { id: 'facilities', label: 'Pool & Spa Facilities', labelKey: 'review_facilities' as const },
    { id: 'overall', label: 'Overall Satisfaction', labelKey: 'review_overall' as const },
];

/** Map English category (stored in API) to translation key for display */
const CATEGORY_LABEL_TO_KEY: Record<string, string> = {
    'Reception & Front Desk': 'review_reception',
    'Room Cleanliness (Hygiene)': 'review_hygiene',
    'Food & Beverage (F&B)': 'review_fb',
    'Buggy Service': 'review_buggy',
    'Pool & Spa Facilities': 'review_facilities',
    'Overall Satisfaction': 'review_overall',
};

interface HotelReviewProps {
    user: User;
    onReviewSubmitted?: () => void;
}

export const HotelReviewComponent: React.FC<HotelReviewProps> = ({ user, onReviewSubmitted }) => {
    const { t } = useTranslation();
    const toast = useToast();

    const [existingReview, setExistingReview] = useState<HotelReview | undefined>(undefined);
    const [isLoadingReview, setIsLoadingReview] = useState(true);
    const [showHotelReview, setShowHotelReview] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isHotelReviewSubmitted, setIsHotelReviewSubmitted] = useState(false);

    const initialRatings = REVIEW_CATEGORIES.map(cat => ({
        id: cat.id,
        label: cat.label,
        labelKey: cat.labelKey,
        value: 5
    }));

    const [ratings, setRatings] = useState(initialRatings);
    const [hotelComment, setHotelComment] = useState('');

    useEffect(() => {
        setIsLoadingReview(true);
        getHotelReview(user.roomNumber)
            .then(review => {
                setExistingReview(review);
                if (review) {
                    const initialRatings = REVIEW_CATEGORIES.map(cat => {
                        const existing = review.categoryRatings?.find(r => r.category === cat.label);
                        return {
                            id: cat.id,
                            label: cat.label,
                            labelKey: cat.labelKey,
                            value: existing ? existing.rating : 5
                        };
                    });
                    setRatings(initialRatings);
                    setHotelComment(review.comment || '');
                    setIsHotelReviewSubmitted(true);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoadingReview(false));
    }, [user.roomNumber]);

    const handleCategoryRate = (id: string, stars: number) => {
        setRatings(prev => prev.map(r => r.id === id ? { ...r, value: stars } : r));
    };

    const handleSubmitHotelReview = async () => {
        if (isSubmittingReview) return;

        setIsSubmittingReview(true);
        try {
            const sum = ratings.reduce((acc, curr) => acc + curr.value, 0);
            const avg = parseFloat((sum / ratings.length).toFixed(1));

            const review = {
                id: existingReview?.id || Date.now().toString(),
                roomNumber: user.roomNumber,
                averageRating: avg,
                categoryRatings: ratings.map(r => ({
                    category: r.label,
                    rating: r.value
                })),
                comment: hotelComment,
                timestamp: existingReview?.timestamp || Date.now()
            };

            const reviewId = existingReview?.id;
            await submitHotelReview(review, reviewId);

            setExistingReview(review);
            setIsHotelReviewSubmitted(true);
            setShowHotelReview(false);
            toast.success(t('review_thanks'));
            onReviewSubmitted?.();
        } catch (error: any) {
            console.error('Failed to submit review:', error);
            toast.error(`${t('review_failed')} ${error.message || ''}`);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const averageRatingDisplay = existingReview
        ? existingReview.averageRating
        : (ratings.reduce((a, b) => a + b.value, 0) / ratings.length).toFixed(1);

    return (
        <div className="backdrop-blur-lg bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-5 rounded-3xl shadow-xl border-2 border-emerald-100/60"
            style={{ boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.2)' }}
        >
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                    <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-2">
                        <Hotel size={16} className="text-emerald-600" />
                        {t('experience_feedback')}
                    </h4>
                </div>
                {isHotelReviewSubmitted && !isLoadingReview && (
                    <div className="flex items-center bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-1.5 rounded-xl border-2 border-amber-200 shadow-md">
                        <Star size={14} className="fill-amber-400 text-amber-400 mr-1.5" />
                        <span className="text-sm font-black text-gray-800">{averageRatingDisplay}</span>
                    </div>
                )}
            </div>

            {isLoadingReview ? (
                <Loading size="sm" message={t('review_loading')} />
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
                    <p className="text-xs text-gray-500 mb-3 text-center">{t('review_rate_categories')}</p>

                    <div className="space-y-3 mb-4">
                        {ratings.map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/80 backdrop-blur-sm p-3 rounded-xl border-2 border-gray-100 shadow-md hover:shadow-lg transition-all">
                                <span className="text-xs font-bold text-gray-800 mb-2 sm:mb-0">{t(item.labelKey)}</span>
                                <div className="flex space-x-1.5">
                                    {[1, 2, 3, 4, 5].map(star => (
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
                        placeholder={t('review_comment_placeholder')}
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
                                    {t('review_submitting')}
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
                        <p className="text-sm text-gray-700 italic font-medium leading-relaxed">"{hotelComment || existingReview?.comment || t('review_feedback_display')}"</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {existingReview?.categoryRatings.map((cat, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white/60 backdrop-blur-sm px-2 py-1.5 rounded-lg border border-gray-200">
                                <span className="truncate mr-1 text-[10px] font-semibold text-gray-700">{CATEGORY_LABEL_TO_KEY[cat.category] ? t(CATEGORY_LABEL_TO_KEY[cat.category]) : cat.category}</span>
                                <span className="flex items-center font-bold text-amber-600 gap-0.5">
                                    {cat.rating} <Star size={10} className="fill-current" />
                                </span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            setShowHotelReview(true);
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
                        {t('edit_review')}
                    </button>
                </div>
            )}
        </div>
    );
};
