import React, { useState } from 'react';
import { Plus, Zap, History } from 'lucide-react';
import ServiceChat from './ServiceChat';
import { DriverHeader } from './driver/DriverHeader';
import { DriverTabs } from './driver/DriverTabs';
import { LoadingOverlay } from './driver/LoadingOverlay';
import { EmptyState } from './driver/EmptyState';
import { CurrentJobBanner } from './driver/CurrentJobBanner';
import { CurrentJobCard } from './driver/CurrentJobCard';
import { RideRequestCard } from './driver/RideRequestCard';
import { HistoryRideCard } from './driver/HistoryRideCard';
import { ScheduleSection } from './driver/ScheduleSection';
import { CreateRideModal } from './driver/CreateRideModal';
import { useDriverData } from './driver/hooks/useDriverData';
import { useRides } from './driver/hooks/useRides';
import { useRideActions } from './driver/hooks/useRideActions';
import { useCreateRide } from './driver/hooks/useCreateRide';
import { getPendingRides, getHistoryRides, getCurrentRide } from './driver/utils/rideFilters';

const DriverPortal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [viewMode, setViewMode] = useState<'REQUESTS' | 'HISTORY'>('REQUESTS');
    
    const { driverInfo, locations, schedules, currentTime, currentDriverId, currentDriverActualId } = useDriverData();
    const { rides, setRides, myRideId, setMyRideId, showChat, setShowChat, setHasUnreadChat } = useRides(currentDriverActualId);
    const { loadingAction, acceptRide, pickUpGuest, completeRide } = useRideActions(setRides, setMyRideId, setShowChat);
    const { showCreateModal, setShowCreateModal, isCreatingRide, manualRideData, setManualRideData, handleCreateManualRide } = useCreateRide(setRides, setMyRideId, setViewMode);

    const pendingRides = getPendingRides(rides, currentTime);
    const historyRides = getHistoryRides(rides, currentDriverActualId);
    const myCurrentRide = getCurrentRide(rides, myRideId);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 flex flex-col relative">
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
                        ) : (
                            <div className="p-4 space-y-3">
                                {pendingRides.length === 0 ? (
                                    <EmptyState
                                        icon={Zap}
                                        title="Waiting for requests..."
                                        description="New ride requests will appear here"
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
                                title="No completed trips history."
                                description="Your completed rides will appear here"
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

            {/* Chat Widget for Driver */}
            {myCurrentRide && showChat && (
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
