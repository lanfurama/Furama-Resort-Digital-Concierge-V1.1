import React, { useState } from 'react';
import { ServiceRequest, User } from '../types';
import { rateServiceRequest, getCompletedGuestOrders, updateRideNotes, getRideById, getUsers, sendNotification, addServiceRequest } from '../services/dataService';
import { Clock, ShoppingBag, Car, Utensils, Sparkles, Waves, User as UserIcon, Star, ThumbsUp, Filter, AlertCircle, Calendar, X } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useToast } from '../hooks/useToast';
import { UserRole } from '../types';
import Loading from './Loading';

interface ServiceHistoryProps {
    user: User;
    history: ServiceRequest[];
    isLoading: boolean;
    onHistoryUpdate?: () => void;
    onExtendStay?: () => void;
}

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

const getTranslatedDetails = (req: ServiceRequest, language: string) => {
    if (req.items && req.items.length > 0) {
        return req.items.map(item => {
            const tr = item.translations?.[language];
            return tr?.name || item.name;
        }).join(', ');
    }
    return req.details;
};

export const ServiceHistory: React.FC<ServiceHistoryProps> = ({
    user,
    history,
    isLoading,
    onHistoryUpdate,
    onExtendStay
}) => {
    const { t, language } = useTranslation();
    const toast = useToast();

    const [serviceFilter, setServiceFilter] = useState<'ALL' | 'DINING' | 'SPA' | 'POOL' | 'BUGGY' | 'BUTLER'>('ALL');
    const [activeRatingId, setActiveRatingId] = useState<string | null>(null);
    const [serviceRatingValue, setServiceRatingValue] = useState(5);
    const [serviceCommentValue, setServiceCommentValue] = useState('');
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);

    const [showLostItemModal, setShowLostItemModal] = useState(false);
    const [lostItemRideId, setLostItemRideId] = useState<string | null>(null);
    const [lostItemDescription, setLostItemDescription] = useState('');
    const [isSubmittingLostItem, setIsSubmittingLostItem] = useState(false);

    const handleSubmitServiceRating = async (id: string, requestType?: string) => {
        if (isSubmittingRating) return;

        setIsSubmittingRating(true);
        try {
            await rateServiceRequest(id, serviceRatingValue, serviceCommentValue, requestType);
            setActiveRatingId(null);
            setServiceRatingValue(5);
            setServiceCommentValue('');
            onHistoryUpdate?.();
            toast.success('Rating submitted successfully!');
        } catch (error: any) {
            console.error('Failed to submit rating:', error);
            toast.error(t('error_submit_rating') || `Failed to submit rating: ${error.message || 'Please try again.'}`);
        } finally {
            setIsSubmittingRating(false);
        }
    };

    const handleSubmitLostItem = async () => {
        if (!lostItemRideId || !lostItemDescription.trim() || isSubmittingLostItem) return;

        setIsSubmittingLostItem(true);
        try {
            const ride = await getRideById(lostItemRideId);
            if (!ride) {
                throw new Error('Ride not found');
            }

            const existingNotes = ride.notes || '';
            const timestamp = new Date().toLocaleString();
            const lostItemNote = `[Lost Item Report - ${timestamp}] ${lostItemDescription.trim()}`;
            const updatedNotes = existingNotes ? `${existingNotes}\n${lostItemNote}` : lostItemNote;

            await updateRideNotes(lostItemRideId, updatedNotes);

            try {
                const allUsers = await getUsers();
                const receptionAdmins = allUsers.filter(u =>
                    u.role === UserRole.RECEPTION || u.role === UserRole.ADMIN || u.role === UserRole.SUPERVISOR
                );
                const drivers = allUsers.filter(u => u.role === UserRole.DRIVER);

                const notificationMessage = `Room ${ride.roomNumber} (${ride.guestName}) reported a lost item on buggy ride from ${ride.pickup} to ${ride.destination}: ${lostItemDescription.trim()}`;

                for (const staff of receptionAdmins) {
                    await sendNotification(
                        staff.roomNumber,
                        'Lost Item Report - Buggy Service',
                        notificationMessage,
                        'WARNING'
                    );
                }

                if (ride.driverId) {
                    const assignedDriver = drivers.find(d => d.id === ride.driverId);
                    if (assignedDriver) {
                        await sendNotification(
                            assignedDriver.roomNumber,
                            'Lost Item Report - Your Buggy Ride',
                            notificationMessage,
                            'WARNING'
                        );
                    }
                } else {
                    for (const driver of drivers) {
                        await sendNotification(
                            driver.roomNumber,
                            'Lost Item Report - Buggy Service',
                            notificationMessage,
                            'WARNING'
                        );
                    }
                }
            } catch (notifError: any) {
                console.error('Failed to send notifications:', notifError);
            }

            toast.success('Lost item report submitted successfully!');
            setShowLostItemModal(false);
            setLostItemRideId(null);
            setLostItemDescription('');
            onHistoryUpdate?.();
        } catch (error: any) {
            console.error('Failed to submit lost item:', error);
            toast.error(`Failed to submit lost item: ${error.message || 'Please try again.'}`);
        } finally {
            setIsSubmittingLostItem(false);
        }
    };

    const filteredHistory = serviceFilter === 'ALL'
        ? history
        : history.filter(req => req.type === serviceFilter);

    return (
        <>
            <div>
                <div className="flex items-center justify-between mb-3 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full"></div>
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t('completed_orders')}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-gray-500" />
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value as 'ALL' | 'DINING' | 'SPA' | 'POOL' | 'BUGGY' | 'BUTLER')}
                            className="text-xs font-semibold bg-white text-gray-700 border-2 border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                        >
                            <option value="ALL">All</option>
                            <option value="BUGGY">{t('buggy')}</option>
                            <option value="DINING">{t('dining')}</option>
                            <option value="SPA">{t('spa')}</option>
                            <option value="POOL">{t('pool')}</option>
                            <option value="BUTLER">{t('butler')}</option>
                        </select>
                    </div>
                </div>
                {isLoading ? (
                    <Loading size="sm" message={t('loading') || 'Loading history...'} />
                ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium text-sm">
                            {serviceFilter === 'ALL'
                                ? 'No completed orders yet'
                                : `No ${t(serviceFilter.toLowerCase())} orders yet`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredHistory.map((req, i) => {
                            const notes = req.notes || '';
                            const lostItemReports: string[] = [];
                            let regularNotes = '';

                            if (notes && notes.trim()) {
                                const lines = notes.split('\n');
                                lines.forEach(line => {
                                    const trimmedLine = line.trim();
                                    if (trimmedLine.startsWith('[Lost Item Report -')) {
                                        const match = trimmedLine.match(/\[Lost Item Report - .+?\] (.+)/);
                                        if (match && match[1]) {
                                            lostItemReports.push(match[1].trim());
                                        } else {
                                            const withoutPrefix = trimmedLine.replace(/\[Lost Item Report - .+?\]\s*/, '');
                                            if (withoutPrefix.trim()) {
                                                lostItemReports.push(withoutPrefix.trim());
                                            }
                                        }
                                    } else if (trimmedLine) {
                                        regularNotes += (regularNotes ? '\n' : '') + trimmedLine;
                                    }
                                });
                            }

                            return (
                                <div key={i} className="backdrop-blur-sm bg-white/95 p-3 rounded-2xl shadow-lg border-2 border-gray-100/60 flex flex-col transition-all hover:shadow-xl"
                                    style={{ boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
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
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-1 font-medium">{getTranslatedDetails(req, language)}</p>

                                            {req.type === 'BUGGY' && (
                                                <div className="mt-1.5 space-y-1.5">
                                                    {req.guestCount && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                            <span className="font-semibold">👥</span>
                                                            <span>{req.guestCount} {req.guestCount === 1 ? 'guest' : 'guests'}</span>
                                                        </div>
                                                    )}
                                                    {regularNotes && regularNotes.trim() && (
                                                        <div className="flex items-start gap-1.5 text-xs text-gray-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                                                            <span className="font-semibold text-amber-600 flex-shrink-0 mt-0.5">📝</span>
                                                            <span className="flex-1 line-clamp-2">{regularNotes}</span>
                                                        </div>
                                                    )}
                                                    {lostItemReports.length > 0 && (
                                                        <div className="space-y-1">
                                                            {lostItemReports.map((report, idx) => (
                                                                <div key={idx} className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                                                                    <AlertCircle size={12} className="text-red-600 flex-shrink-0 mt-0.5" />
                                                                    <span className="flex-1 font-medium">Lost Item: {report}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                                                <Clock size={11} className="text-gray-400" />
                                                {new Date(req.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {req.status === 'COMPLETED' && (
                                        <div className="mt-3 pt-3 border-t-2 border-gray-100 space-y-2">
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
                                                            {[1, 2, 3, 4, 5].map(star => (
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
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setActiveRatingId(req.id)}
                                                            className="flex-1 py-2 flex items-center justify-center text-xs text-emerald-700 font-bold bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-xl transition-all border-2 border-emerald-200 hover:border-emerald-300 shadow-md"
                                                        >
                                                            <ThumbsUp size={14} className="mr-1.5" />
                                                            {t('rate_service')}
                                                        </button>
                                                        {req.type === 'BUGGY' && (
                                                            <button
                                                                onClick={() => {
                                                                    setLostItemRideId(req.id);
                                                                    setLostItemDescription('');
                                                                    setShowLostItemModal(true);
                                                                }}
                                                                className="flex-1 py-2 flex items-center justify-center text-xs text-amber-700 font-bold bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-xl transition-all border-2 border-amber-200 hover:border-amber-300 shadow-md"
                                                            >
                                                                <AlertCircle size={14} className="mr-1.5" />
                                                                Report Lost Item
                                                            </button>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lost Item Modal */}
            {showLostItemModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <AlertCircle className="text-amber-600" size={24} />
                                Report Lost Item
                            </h3>
                            <button
                                onClick={() => {
                                    setShowLostItemModal(false);
                                    setLostItemRideId(null);
                                    setLostItemDescription('');
                                }}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Item Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={lostItemDescription}
                                    onChange={(e) => setLostItemDescription(e.target.value)}
                                    placeholder="Please describe the lost item (e.g., Black wallet, iPhone 14, etc.)"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition resize-none"
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowLostItemModal(false);
                                        setLostItemRideId(null);
                                        setLostItemDescription('');
                                    }}
                                    className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitLostItem}
                                    disabled={isSubmittingLostItem || !lostItemDescription.trim()}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {isSubmittingLostItem ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
