import React, { useState, useEffect } from 'react';
import { User, ServiceRequest } from '../types';
import { getCompletedGuestOrders, addServiceRequest } from '../services/dataService';
import { ArrowLeft, Calendar, X } from 'lucide-react';
import Loading from './Loading';
import { useTranslation } from '../contexts/LanguageContext';
import { useToast } from '../hooks/useToast';
import PullToRefresh from './PullToRefresh';
import { ProfileCard } from './ProfileCard';
import { ServiceHistory } from './ServiceHistory';
import { HotelReviewComponent } from './HotelReview';

interface GuestAccountProps {
    user: User;
    onBack: () => void;
}


const GuestAccount: React.FC<GuestAccountProps> = ({ user, onBack }) => {
    const { t } = useTranslation();
    const toast = useToast();

    const [history, setHistory] = useState<ServiceRequest[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [currentUser, setCurrentUser] = useState<User>(user);

    // Extend Stay State
    const [showExtendStayModal, setShowExtendStayModal] = useState(false);
    const [newCheckOutDate, setNewCheckOutDate] = useState('');
    const [extendStayReason, setExtendStayReason] = useState('');
    const [isSubmittingExtend, setIsSubmittingExtend] = useState(false);

    // Load history on mount
    useEffect(() => {
        setIsLoadingHistory(true);
        getCompletedGuestOrders(user.roomNumber)
            .then(setHistory)
            .catch(console.error)
            .finally(() => setIsLoadingHistory(false));
    }, [user.roomNumber]);

    const handleRefresh = async () => {
        setIsLoadingHistory(true);
        try {
            const orders = await getCompletedGuestOrders(user.roomNumber);
            setHistory(orders);
        } catch (error) {
            console.error('Failed to refresh account data:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleHistoryUpdate = async () => {
        const orders = await getCompletedGuestOrders(user.roomNumber);
        setHistory(orders);
    };

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
            </div>

            <PullToRefresh onRefresh={handleRefresh}>
                <div className="flex-1 px-3 py-4 space-y-4 -mt-1 relative z-20 pb-24 min-h-full">
                    {isLoadingHistory && (
                        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                            <Loading size="md" message={t('loading') || 'Loading account data...'} />
                        </div>
                    )}

                    {/* Profile Card */}
                    <ProfileCard user={currentUser} onUserUpdate={setCurrentUser} />

                    {/* Extend Stay Button - Add to ProfileCard later */}
                    {currentUser.checkOut && (
                        <div className="backdrop-blur-lg bg-white/95 p-3 rounded-3xl shadow-xl border border-white/60">
                            <button
                                onClick={() => {
                                    const currentCheckOut = new Date(currentUser.checkOut!);
                                    const minDate = new Date(currentCheckOut);
                                    minDate.setDate(minDate.getDate() + 1);
                                    setNewCheckOutDate(minDate.toISOString().split('T')[0]);
                                    setShowExtendStayModal(true);
                                }}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Calendar size={18} />
                                <span>Request to Extend Stay</span>
                            </button>
                        </div>
                    )}

                    {/* Hotel Review */}
                    <HotelReviewComponent user={currentUser} />

                    {/* Service History */}
                    <ServiceHistory
                        user={currentUser}
                        history={history}
                        isLoading={isLoadingHistory}
                        onHistoryUpdate={handleHistoryUpdate}
                    />

                </div>

                {/* Extend Stay Modal */}
                {showExtendStayModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Calendar className="text-amber-600" size={24} />
                                    Request to Extend Stay
                                </h3>
                                <button
                                    onClick={() => setShowExtendStayModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Current Check-out Date
                                    </label>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {user.checkOut ? new Date(user.checkOut).toLocaleDateString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        New Check-out Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={newCheckOutDate}
                                        onChange={(e) => setNewCheckOutDate(e.target.value)}
                                        min={user.checkOut ? new Date(new Date(user.checkOut).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Reason (Optional)
                                    </label>
                                    <textarea
                                        value={extendStayReason}
                                        onChange={(e) => setExtendStayReason(e.target.value)}
                                        placeholder="Please let us know why you'd like to extend your stay..."
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowExtendStayModal(false);
                                            setNewCheckOutDate('');
                                            setExtendStayReason('');
                                        }}
                                        className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!newCheckOutDate) {
                                                toast.warning('Please select a new check-out date');
                                                return;
                                            }

                                            setIsSubmittingExtend(true);
                                            try {
                                                const newDate = new Date(newCheckOutDate);
                                                const currentDate = user.checkOut ? new Date(user.checkOut) : new Date();

                                                if (newDate <= currentDate) {
                                                    toast.warning('New check-out date must be after current check-out date');
                                                    setIsSubmittingExtend(false);
                                                    return;
                                                }

                                                const daysExtended = Math.ceil((newDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                                                // Store new check-out date in ISO format at the end for easy parsing
                                                const details = `Request to extend stay from ${currentDate.toLocaleDateString()} to ${newDate.toLocaleDateString()} (${daysExtended} day${daysExtended > 1 ? 's' : ''}). ${extendStayReason ? `Reason: ${extendStayReason}` : ''} [NEW_CHECKOUT_DATE:${newDate.toISOString()}]`;

                                                await addServiceRequest({
                                                    id: '',
                                                    type: 'EXTEND_STAY',
                                                    status: 'PENDING',
                                                    details: details,
                                                    roomNumber: user.roomNumber,
                                                    timestamp: Date.now(),
                                                    newCheckOutDate: newDate.toISOString()
                                                });

                                                toast.success('Your extend stay request has been submitted. Reception will review and confirm shortly.');
                                                setShowExtendStayModal(false);
                                                setNewCheckOutDate('');
                                                setExtendStayReason('');
                                            } catch (error: any) {
                                                console.error('Failed to submit extend stay request:', error);
                                                toast.error(error.message || 'Failed to submit request. Please try again.');
                                            } finally {
                                                setIsSubmittingExtend(false);
                                            }
                                        }}
                                        disabled={isSubmittingExtend || !newCheckOutDate}
                                        className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmittingExtend ? (
                                            <>
                                                <span className="animate-spin">⏳</span>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Calendar size={18} />
                                                Submit Request
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </PullToRefresh>
        </div>
    );
};

export default GuestAccount;
