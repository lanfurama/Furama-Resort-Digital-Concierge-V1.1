
import React, { useState, useEffect } from 'react';
import { getRides, updateRideStatus, getLastMessage, createManualRide, getLocations } from '../services/dataService';
import { RideRequest, BuggyStatus } from '../types';
import { Car, MapPin, Navigation, CheckCircle, Clock, MessageSquare, History, List, Plus, X } from 'lucide-react';
import NotificationBell from './NotificationBell';
import ServiceChat from './ServiceChat';

const DriverPortal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [myRideId, setMyRideId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
    
    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [hasUnreadChat, setHasUnreadChat] = useState(false);

    // Create Manual Ride State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [manualRideData, setManualRideData] = useState({
        roomNumber: '',
        pickup: '',
        destination: ''
    });
    const [locations, setLocations] = useState<any[]>([]);

    // Load locations on mount
    useEffect(() => {
        const loadLocations = async () => {
            try {
                const locs = await getLocations();
                setLocations(locs);
            } catch (error) {
                console.error('Failed to load locations:', error);
                setLocations([]);
            }
        };
        loadLocations();
    }, []);

    // Polling for new rides and chat messages
    useEffect(() => {
        const loadRides = async () => {
            try {
                const allRides = await getRides();
                setRides(allRides);
                
                // Check if I have an active ride
                const active = allRides.find(r => 
                    (r.status === BuggyStatus.ASSIGNED || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ON_TRIP) 
                    // In a real app check driver ID, here we simulate single driver session
                );
                
                if (active) {
                    setMyRideId(active.id);
                    // Check for unread messages from Guest for this ride
                    const lastMsg = await getLastMessage(active.roomNumber, 'BUGGY');
                    // If last message exists and was sent by 'user' (Guest), it's unread for the Driver
                    if (lastMsg && lastMsg.role === 'user') {
                        setHasUnreadChat(true);
                    }
                } else {
                    setMyRideId(null);
                    setShowChat(false);
                    setHasUnreadChat(false);
                }
            } catch (error) {
                console.error('Failed to load rides:', error);
            }
        };

        // Initial load
        loadRides();

        const interval = setInterval(loadRides, 2000); // Poll every 2 seconds
        return () => clearInterval(interval);
    }, []);

    const acceptRide = async (id: string) => {
        try {
            console.log('Accepting ride:', id);
            await updateRideStatus(id, BuggyStatus.ARRIVING, 'driver-1', 5); // 5 min ETA mock
            console.log('Ride accepted successfully');
            // Refresh rides after update
            const allRides = await getRides();
            setRides(allRides);
        } catch (error) {
            console.error('Failed to accept ride:', error);
            alert('Failed to accept ride. Please try again.');
        }
    };

    const pickUpGuest = async (id: string) => {
        try {
            console.log('Picking up guest for ride:', id);
            await updateRideStatus(id, BuggyStatus.ON_TRIP);
            console.log('Guest picked up successfully');
            // Refresh rides after update
            const allRides = await getRides();
            setRides(allRides);
        } catch (error) {
            console.error('Failed to pick up guest:', error);
            alert('Failed to update ride status. Please try again.');
        }
    };

    const completeRide = async (id: string) => {
        try {
            console.log('Completing ride:', id);
            await updateRideStatus(id, BuggyStatus.COMPLETED);
            console.log('Ride completed successfully');
            setShowChat(false);
            // Refresh rides after update
            const allRides = await getRides();
            setRides(allRides);
        } catch (error) {
            console.error('Failed to complete ride:', error);
            alert('Failed to complete ride. Please try again.');
        }
    };

    const handleCreateManualRide = async () => {
        if (!manualRideData.pickup || !manualRideData.destination) return;
        
        try {
            console.log('Creating manual ride:', manualRideData);
            const newRide = await createManualRide(
                'driver-1', 
                manualRideData.roomNumber, 
                manualRideData.pickup, 
                manualRideData.destination
            );
            
            console.log('Manual ride created successfully:', newRide);
            
            // Immediately set this as my active ride and switch view
            setMyRideId(newRide.id);
            setViewMode('ACTIVE');
            setShowCreateModal(false);
            setManualRideData({ roomNumber: '', pickup: '', destination: '' });
            
            // Refresh rides after create
            const allRides = await getRides();
            setRides(allRides);
        } catch (error) {
            console.error('Failed to create manual ride:', error);
            alert('Failed to create ride. Please try again.');
        }
    };

    const pendingRides = rides.filter(r => r.status === BuggyStatus.SEARCHING);
    // Filter history for this driver (mocked as 'driver-1')
    const historyRides = rides.filter(r => r.status === BuggyStatus.COMPLETED && r.driverId === 'driver-1').sort((a,b) => b.timestamp - a.timestamp);
    const myCurrentRide = rides.find(r => r.id === myRideId);

    const formatTime = (ts?: number) => ts ? new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-';

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col relative">
            <header className="p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold">
                        <Car size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">Driver App</h1>
                        <p className="text-xs text-emerald-400 flex items-center"><span className="w-2 h-2 bg-emerald-400 rounded-full mr-1 animate-pulse"></span> Online</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                     <NotificationBell userId="driver" />
                     <button onClick={onLogout} className="text-slate-400 hover:text-white">Logout</button>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="flex p-2 bg-slate-800 space-x-2 border-b border-slate-700">
                <button 
                    onClick={() => setViewMode('ACTIVE')}
                    className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center transition ${viewMode === 'ACTIVE' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-700/50'}`}
                >
                    <List size={18} className="mr-2"/> Active
                </button>
                <button 
                    onClick={() => setViewMode('HISTORY')}
                    className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center transition ${viewMode === 'HISTORY' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-700/50'}`}
                >
                    <History size={18} className="mr-2"/> History
                </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto pb-20">
                {viewMode === 'ACTIVE' ? (
                    <>
                        {myCurrentRide ? (
                            <div className="bg-emerald-600 rounded-xl p-6 shadow-2xl animate-in zoom-in duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-1">{myCurrentRide.status === BuggyStatus.ON_TRIP ? 'On Trip' : 'Pick Up Guest'}</h2>
                                        <p className="opacity-80">Ride #{myCurrentRide.id.slice(-4)}</p>
                                    </div>
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Clock className="text-white" />
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                     <div className="bg-black/20 p-4 rounded-lg flex justify-between items-center">
                                        <div>
                                            <label className="text-xs uppercase opacity-60 font-bold tracking-wider">Guest</label>
                                            <div className="text-lg font-semibold">{myCurrentRide.guestName}</div>
                                            <div className="text-sm opacity-80">Room {myCurrentRide.roomNumber}</div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setShowChat(true);
                                                setHasUnreadChat(false);
                                            }}
                                            className={`relative px-4 py-2 rounded-lg font-bold flex items-center shadow-md transition ${
                                                hasUnreadChat 
                                                ? 'bg-white text-red-600 animate-pulse' 
                                                : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-900'
                                            }`}
                                        >
                                            <MessageSquare size={18} className="mr-2"/>
                                            Chat
                                            {hasUnreadChat && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>}
                                        </button>
                                     </div>

                                     <div className="flex space-x-4">
                                        <div className="flex-1 bg-black/20 p-4 rounded-lg">
                                            <label className="text-xs uppercase opacity-60 font-bold tracking-wider mb-1 block">From</label>
                                            <div className="font-medium flex items-center"><MapPin size={14} className="mr-1"/> {myCurrentRide.pickup}</div>
                                        </div>
                                        <div className="flex-1 bg-white text-emerald-900 p-4 rounded-lg shadow-lg">
                                            <label className="text-xs uppercase opacity-60 font-bold tracking-wider mb-1 block">To</label>
                                            <div className="font-bold flex items-center"><Navigation size={14} className="mr-1"/> {myCurrentRide.destination}</div>
                                        </div>
                                     </div>
                                     
                                     <div className="grid grid-cols-2 gap-2 text-xs opacity-70">
                                         <div>Request: {formatTime(myCurrentRide.timestamp)}</div>
                                         {myCurrentRide.pickedUpAt && <div>Pickup: {formatTime(myCurrentRide.pickedUpAt)}</div>}
                                     </div>
                                </div>

                                {myCurrentRide.status === BuggyStatus.ARRIVING || myCurrentRide.status === BuggyStatus.ASSIGNED ? (
                                    <button 
                                        onClick={() => pickUpGuest(myCurrentRide.id)}
                                        className="w-full bg-white text-emerald-900 font-bold py-4 rounded-xl text-xl hover:bg-gray-100 transition shadow-lg"
                                    >
                                        Guest Picked Up
                                    </button>
                                ) : (
                                     <button 
                                        onClick={() => completeRide(myCurrentRide.id)}
                                        className="w-full bg-emerald-900 text-white border border-emerald-400 font-bold py-4 rounded-xl text-xl hover:bg-emerald-800 transition shadow-lg"
                                    >
                                        <CheckCircle className="inline mr-2 mb-1" /> Complete Trip
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <h2 className="text-slate-400 font-semibold mb-4 uppercase tracking-wider text-sm">Available Requests ({pendingRides.length})</h2>
                                <div className="space-y-3">
                                    {pendingRides.length === 0 ? (
                                        <div className="text-center py-10 opacity-50">
                                            <p>No active requests.</p>
                                        </div>
                                    ) : (
                                        pendingRides.map(ride => (
                                            <div key={ride.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-emerald-500 transition group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">NEW</span>
                                                        <h3 className="font-bold text-lg mt-1">Room {ride.roomNumber}</h3>
                                                        <p className="text-slate-400 text-sm">{ride.guestName}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs text-slate-500">{formatTime(ride.timestamp)}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 mb-4">
                                                    <div className="bg-black/20 p-2 rounded">
                                                        <div className="text-[10px] uppercase text-slate-500">Pickup</div>
                                                        <div className="text-sm truncate">{ride.pickup}</div>
                                                    </div>
                                                    <div className="bg-black/20 p-2 rounded">
                                                        <div className="text-[10px] uppercase text-slate-500">Dropoff</div>
                                                        <div className="text-sm truncate">{ride.destination}</div>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => acceptRide(ride.id)}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition"
                                                >
                                                    Accept Ride
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    /* HISTORY VIEW */
                    <div className="space-y-4">
                        <h2 className="text-slate-400 font-semibold mb-2 uppercase tracking-wider text-sm">Completed Trips</h2>
                         {historyRides.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <History size={48} className="mx-auto mb-2 opacity-50"/>
                                <p>No completed trips history.</p>
                            </div>
                        ) : (
                            historyRides.map(ride => (
                                <div key={ride.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                    <div className="flex justify-between items-start mb-3 border-b border-slate-700 pb-2">
                                        <div>
                                            <h3 className="font-bold text-base text-slate-200">Room {ride.roomNumber}</h3>
                                            <p className="text-slate-500 text-xs">{ride.guestName}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">COMPLETED</span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                                        <div>
                                            <div className="text-[10px] uppercase text-slate-500">From</div>
                                            <div className="text-sm text-slate-300 truncate">{ride.pickup}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase text-slate-500">To</div>
                                            <div className="text-sm text-slate-300 truncate">{ride.destination}</div>
                                        </div>
                                    </div>

                                    <div className="bg-black/20 rounded p-2 text-[10px] text-slate-400 flex justify-between">
                                        <span>Req: {formatTime(ride.timestamp)}</span>
                                        <span>Pick: {formatTime(ride.pickedUpAt)}</span>
                                        <span className="text-emerald-500">Drop: {formatTime(ride.completedAt)}</span>
                                    </div>

                                    {ride.rating && (
                                        <div className="mt-2 text-xs text-yellow-500">
                                            Rating: {ride.rating}/5 {ride.feedback && ` - "${ride.feedback}"`}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Create Manual Ride Button */}
            {!myCurrentRide && viewMode === 'ACTIVE' && (
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 rounded-full shadow-lg flex items-center justify-center text-slate-900 transition transform hover:scale-105"
                    title="Create Ride"
                >
                    <Plus size={32} />
                </button>
            )}

            {/* Create Ride Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm border border-slate-600">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700">
                            <h3 className="font-bold text-lg">Create New Ride</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Room Number (Optional)</label>
                                <input 
                                    type="text" 
                                    value={manualRideData.roomNumber}
                                    onChange={(e) => setManualRideData({...manualRideData, roomNumber: e.target.value})}
                                    placeholder="e.g. 101"
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Pickup Location</label>
                                <select
                                    value={manualRideData.pickup}
                                    onChange={(e) => setManualRideData({...manualRideData, pickup: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="">Select Pickup...</option>
                                    <option value="Current Location">Current Location</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Destination</label>
                                <select
                                    value={manualRideData.destination}
                                    onChange={(e) => setManualRideData({...manualRideData, destination: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="">Select Destination...</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <button 
                                onClick={handleCreateManualRide}
                                disabled={!manualRideData.pickup || !manualRideData.destination}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 mt-4"
                            >
                                Start Trip
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
