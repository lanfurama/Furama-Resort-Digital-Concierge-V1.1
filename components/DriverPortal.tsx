import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Zap, History } from 'lucide-react';
import { BuggyStatus } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import ServiceChat from './ServiceChat';
import { DriverHeader } from './driver/DriverHeader';
import { DriverTabs } from './driver/DriverTabs';
import { LoadingOverlay } from './driver/LoadingOverlay';
import { EmptyState } from './driver/EmptyState';
import { CurrentJobBanner } from './driver/CurrentJobBanner';
import { CurrentJobCard } from './driver/CurrentJobCard';
import { CurrentJobCardMerged } from './driver/CurrentJobCardMerged';
import { MergeSuggestionCard } from './driver/MergeSuggestionCard';
import { RideRequestCard } from './driver/RideRequestCard';
import { DriverAlertType, DriverPulseNotification } from './driver/DriverPulseNotification';
import { useDriverAlertFeedback } from './driver/hooks/useDriverAlertFeedback';
import { useDriverMerge } from './driver/hooks/useDriverMerge';
import { HistoryRideCard } from './driver/HistoryRideCard';
import { ScheduleSection } from './driver/ScheduleSection';
import { CreateRideModal } from './driver/CreateRideModal';
import { useDriverData } from './driver/hooks/useDriverData';
import { useRides } from './driver/hooks/useRides';
import { useRideActions } from './driver/hooks/useRideActions';
import { useCreateRide } from './driver/hooks/useCreateRide';
import { getPendingRides, getHistoryRides, getCurrentRide } from './driver/utils/rideFilters';

const DriverPortal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'REQUESTS' | 'HISTORY'>('REQUESTS');
    const { t } = useTranslation();
    const { driverInfo, locations, schedules, currentTime, currentDriverId, currentDriverActualId } = useDriverData();

    useEffect(() => {
        if (currentDriverActualId === null) {
            navigate('/driver/login', { replace: true });
        }
    }, [currentDriverActualId, navigate]);
    const { rides, setRides, myRideId, setMyRideId, showChat, setShowChat, setHasUnreadChat } = useRides(currentDriverActualId);
    const { loadingAction, acceptRide, pickUpGuest, completeRide, advanceMergedProgress, completeMergedRide } = useRideActions(setRides, setMyRideId, setShowChat);

    const pendingRides = getPendingRides(rides, currentTime);
    const historyRides = getHistoryRides(rides, currentDriverActualId);
    const myCurrentRide = getCurrentRide(rides, myRideId);

    const { mergeSuggestion, acceptMerge, rejectMerge, isMerging } = useDriverMerge(pendingRides, locations, setRides, setMyRideId, currentDriverActualId);
    const { showCreateModal, setShowCreateModal, isCreatingRide, manualRideData, setManualRideData, handleCreateManualRide } = useCreateRide(setRides, setMyRideId, setViewMode);

    const activeAlert = useMemo((): { type: DriverAlertType; message: string; detail?: string } | null => {
        if (mergeSuggestion) {
            return { type: 'MERGE', message: t('driver_alert_merge'), detail: t('driver_alert_merge_detail') };
        }
        if (pendingRides.length > 0) {
            const first = pendingRides[0];
            const msg = viewMode === 'HISTORY' ? t('driver_alert_request_switch') : t('driver_alert_request');
            const roomPrefix = t('driver_room_prefix');
            return { type: 'REQUEST', message: msg, detail: first ? `${roomPrefix}${first.roomNumber}` : undefined };
        }
        if (myCurrentRide) {
            const canPickUp = myCurrentRide.status === BuggyStatus.ARRIVING || myCurrentRide.status === BuggyStatus.ASSIGNED;
            if (canPickUp) {
                return { type: 'PICKUP', message: t('driver_alert_pickup'), detail: `${t('driver_room_prefix')}${myCurrentRide.roomNumber}` };
            }
            const segments = myCurrentRide.segments ?? [];
            const totalSteps = segments.length * 2;
            const progress = myCurrentRide.mergedProgress ?? 0;
            const needCompleteMerged = myCurrentRide.isMerged && segments.length > 0 && progress === totalSteps - 1;
            const needCompleteNormal = myCurrentRide.status === BuggyStatus.ON_TRIP;
            if (needCompleteNormal || needCompleteMerged) {
                return { type: 'COMPLETE', message: t('driver_alert_complete'), detail: `${t('driver_room_prefix')}${myCurrentRide.roomNumber}` };
            }
        }
        return null;
    }, [mergeSuggestion, pendingRides, viewMode, myCurrentRide, t]);

    useDriverAlertFeedback(!!activeAlert, { soundEnabled: true, vibrateEnabled: true, intervalMs: 2500 });

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 flex flex-col relative">
            {activeAlert && (
                <DriverPulseNotification
                    type={activeAlert.type}
                    message={activeAlert.message}
                    detail={activeAlert.detail}
                    soundEnabled={true}
                    vibrateEnabled={true}
                    intervalMs={2500}
                    topClass="top-20"
                />
            )}
            <LoadingOverlay loadingAction={loadingAction} />
            <DriverHeader
                driverInfo={driverInfo}
                schedules={schedules}
                currentDriverId={currentDriverId}
                onLogout={onLogout}
            />

            <DriverTabs
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                requestsCount={pendingRides.length + (myCurrentRide ? 1 : 0)}
                historyCount={historyRides.length}
            />

            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
                {/* CURRENT JOB Banner */}
                {myCurrentRide && viewMode === 'REQUESTS' && (
                    <CurrentJobBanner ride={myCurrentRide} currentTime={currentTime} />
                )}

                {/* REQUESTS VIEW */}
                {viewMode === 'REQUESTS' && (
                    <>
                        {myCurrentRide ? (
                            myCurrentRide.isMerged && (myCurrentRide.segments?.length ?? 0) > 0 ? (
                                <CurrentJobCardMerged
                                    ride={myCurrentRide}
                                    loadingAction={loadingAction}
                                    onAdvanceStep={advanceMergedProgress}
                                    onComplete={completeMergedRide}
                                    onOpenChat={() => {
                                        setShowChat(true);
                                        setHasUnreadChat(false);
                                    }}
                                />
                            ) : (
                                <CurrentJobCard
                                    ride={myCurrentRide}
                                    loadingAction={loadingAction}
                                    onPickUp={pickUpGuest}
                                    onComplete={completeRide}
                                    onOpenChat={() => {
                                        setShowChat(true);
                                        setHasUnreadChat(false);
                                    }}
                                />
                            )
                        ) : (
                            <div className="p-4 space-y-3">
                                {mergeSuggestion && (
                                    <MergeSuggestionCard
                                        suggestion={mergeSuggestion}
                                        onAccept={acceptMerge}
                                        onReject={rejectMerge}
                                        isMerging={isMerging}
                                    />
                                )}
                                {pendingRides.length === 0 ? (
                                    <EmptyState
                                        icon={Zap}
                                        title={t('driver_waiting_requests')}
                                        description={t('driver_new_requests_desc')}
                                    />
                                ) : (
                                    pendingRides.map((ride) => (
                                        <RideRequestCard
                                            key={ride.id}
                                            ride={ride}
                                            currentTime={currentTime}
                                            loadingAction={loadingAction}
                                            onAccept={acceptRide}
                                        />
                                    ))
                                )}

                                <ScheduleSection schedules={schedules} />
                            </div>
                        )}
                    </>
                )}

                {/* HISTORY VIEW */}
                {viewMode === 'HISTORY' && (
                    <div className="p-4">
                        {historyRides.length === 0 ? (
                            <EmptyState
                                icon={History}
                                title={t('driver_no_history')}
                                description={t('driver_history_desc')}
                                iconColor="text-gray-500"
                            />
                        ) : (
                            <div className="space-y-3">
                                {historyRides.map(ride => (
                                    <HistoryRideCard key={ride.id} ride={ride} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Manual Ride Button - Enhanced FAB */}
            {!myCurrentRide && viewMode === 'REQUESTS' && (
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-20 h-20 md:w-18 md:h-18 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl flex items-center justify-center text-white z-40 border-4 border-white/50 hover:shadow-emerald-500/60 hover:scale-110 transition-all active:scale-95"
                    style={{
                        bottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))',
                        boxShadow: '0 15px 40px -5px rgba(16, 185, 129, 0.5)'
                    }}
                    title="Create Ride"
                >
                    <Plus size={32} className="md:w-8 md:h-8" strokeWidth={3.5} />
                </button>
            )}

            <CreateRideModal
                isOpen={showCreateModal}
                isCreating={isCreatingRide}
                rideData={manualRideData}
                locations={locations}
                onClose={() => setShowCreateModal(false)}
                onDataChange={setManualRideData}
                onSubmit={handleCreateManualRide}
            />

            {/* Chat Widget for Driver (hidden for merged rides - roomNumber like "101+205") */}
            {myCurrentRide && showChat && !myCurrentRide.roomNumber?.includes('+') && (
                <ServiceChat
                    serviceType="BUGGY"
                    roomNumber={myCurrentRide.roomNumber}
                    label={`Guest Room ${myCurrentRide.roomNumber}`}
                    autoOpen={true}
                    userRole="staff"
                    onClose={() => setShowChat(false)}
                />
            )}
        </div>
    );
};

export default DriverPortal;
