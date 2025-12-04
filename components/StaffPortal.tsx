
import React, { useState, useEffect, useRef } from 'react';
import { getServiceRequests, updateServiceStatus, getLastMessage } from '../services/dataService';
import { ServiceRequest, User, UserRole } from '../types';
import { UserCheck, ShieldCheck, MessageSquare, Eye, Bell, Clock, CheckCircle, List, History } from 'lucide-react';
import ServiceChat from './ServiceChat';

const StaffPortal: React.FC<{ onLogout: () => void; user: User }> = ({ onLogout, user }) => {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [activeChatRequest, setActiveChatRequest] = useState<{roomNumber: string, type: string} | null>(null);
    const [unreadChats, setUnreadChats] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
    
    // New Order Notification State
    const [newOrderAlert, setNewOrderAlert] = useState(false);
    const prevRequestCount = useRef(0);

    useEffect(() => {
        // Initial fetch
        const loadInitialRequests = async () => {
            try {
                const initialRequests = await getServiceRequests();
                prevRequestCount.current = initialRequests.length;
                setRequests(initialRequests);
                await checkUnread(initialRequests);
            } catch (error) {
                console.error('Failed to load initial requests:', error);
                setRequests([]);
            }
        };
        loadInitialRequests();

        const interval = setInterval(async () => {
            try {
                const currentRequests = await getServiceRequests();
                
                // Check for new orders
                if (currentRequests.length > prevRequestCount.current) {
                    setNewOrderAlert(true);
                }
                prevRequestCount.current = currentRequests.length;

                setRequests(currentRequests);
                await checkUnread(currentRequests);
            } catch (error) {
                console.error('Failed to refresh requests:', error);
            }
        }, 2000); // Poll every 2 seconds instead of 1 second
        return () => clearInterval(interval);
    }, []);

    const checkUnread = async (reqs: ServiceRequest[]) => {
        const newUnread = new Set<string>();
        for (const req of reqs) {
            try {
                const lastMsg = await getLastMessage(req.roomNumber, req.type);
                // If the last message exists and was sent by 'user' (Guest), it is unread for Staff
                if (lastMsg && lastMsg.role === 'user') {
                    newUnread.add(`${req.roomNumber}_${req.type}`);
                }
            } catch (error) {
                console.error(`Failed to check unread for ${req.roomNumber}_${req.type}:`, error);
            }
        }
        setUnreadChats(newUnread);
    };

    const handleAction = async (id: string, newStatus: 'CONFIRMED' | 'COMPLETED', event?: React.MouseEvent<HTMLButtonElement>) => {
        try {
            console.log(`Updating service request ${id} to ${newStatus}`);
            
            // Show loading state
            if (event?.currentTarget) {
                const button = event.currentTarget;
                button.disabled = true;
                const originalText = button.textContent;
                button.textContent = 'Updating...';
                
                // Re-enable button after operation (in finally block)
                setTimeout(() => {
                    button.disabled = false;
                    if (originalText) button.textContent = originalText;
                }, 2000);
            }
            
            await updateServiceStatus(id, newStatus);
            console.log('Service status updated successfully');
            
            // Show success message
            alert(`Order ${newStatus.toLowerCase()} successfully!`);
            
            // Force refresh
            const refreshedRequests = await getServiceRequests();
            setRequests(refreshedRequests);
            await checkUnread(refreshedRequests);
        } catch (error: any) {
            console.error('Failed to update service status:', error);
            const errorMessage = error?.message || error?.response?.body?.error || 'Unknown error';
            alert(`Failed to update service status: ${errorMessage}. Please check console for details.`);
        }
    };

    const handleNewOrderClick = () => {
        setNewOrderAlert(false);
        setViewMode('ACTIVE');
    };

    // Filter requests based on Department and Role
    const filteredRequests = requests.filter(req => {
        // Supervisors see ALL requests
        if (user.role === UserRole.SUPERVISOR) return true;
        
        // Staff with 'All' department see ALL requests
        if (!user.department || user.department === 'All') return true;
        
        // Strict Department Mapping
        const userDeptUpper = user.department.toUpperCase();
        return req.type === userDeptUpper;
    });

    // Apply Tab Filtering (Active vs History)
    const displayedRequests = filteredRequests.filter(req => {
        if (viewMode === 'ACTIVE') {
            return req.status === 'PENDING' || req.status === 'CONFIRMED';
        } else {
            return req.status === 'COMPLETED';
        }
    });

    // Helper to get Department display name
    const getRoleDisplay = () => {
        if (user.role === UserRole.SUPERVISOR) return 'Supervisor';
        return user.department || 'General Staff';
    };

    // Format Time Helper
    const formatTime = (ts?: number) => {
        if (!ts) return '-';
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
             <header className="bg-white p-4 flex justify-between items-center shadow-sm border-b border-gray-200">
                <div className="flex items-center space-x-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${user.role === UserRole.SUPERVISOR ? 'bg-amber-600' : 'bg-indigo-600'}`}>
                        {user.role === UserRole.SUPERVISOR ? <Eye size={20} /> : <UserCheck size={20} />}
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800 flex items-center">
                            {user.role === UserRole.SUPERVISOR ? 'Supervisor Dashboard' : 'Staff Portal'}
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${
                                user.role === UserRole.SUPERVISOR 
                                ? 'bg-amber-100 text-amber-700 border-amber-200' 
                                : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                            }`}>
                                {getRoleDisplay()}
                            </span>
                        </h1>
                        <p className="text-xs text-gray-500">
                            {user.role === UserRole.SUPERVISOR ? 'Monitoring All Departments' : 'Service Management'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                    {/* New Order Notification Button */}
                    {newOrderAlert && (
                        <button 
                            onClick={handleNewOrderClick}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-md animate-pulse transition"
                        >
                            <Bell size={14} className="mr-1" />
                            New Orders!
                        </button>
                    )}

                    <button onClick={onLogout} className="text-sm font-semibold text-gray-500 hover:text-gray-800">Logout</button>
                </div>
            </header>

            {/* View Mode Tabs */}
            <div className="px-6 pt-6 pb-2">
                <div className="flex space-x-4 border-b border-gray-200">
                    <button 
                        onClick={() => setViewMode('ACTIVE')}
                        className={`pb-2 px-4 font-semibold text-sm flex items-center ${
                            viewMode === 'ACTIVE' 
                            ? 'border-b-2 border-indigo-600 text-indigo-600' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <List size={16} className="mr-2"/> Active Orders
                    </button>
                    <button 
                        onClick={() => setViewMode('HISTORY')}
                        className={`pb-2 px-4 font-semibold text-sm flex items-center ${
                            viewMode === 'HISTORY' 
                            ? 'border-b-2 border-indigo-600 text-indigo-600' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <History size={16} className="mr-2"/> Order History
                    </button>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {displayedRequests.length === 0 && (
                     <div className="col-span-full text-center py-20 text-gray-400">
                         <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                         <p>No {viewMode === 'ACTIVE' ? 'active' : 'completed'} requests found for {getRoleDisplay()}.</p>
                     </div>
                 )}
                 {displayedRequests.map(req => {
                     const isUnread = unreadChats.has(`${req.roomNumber}_${req.type}`);
                     
                     return (
                        <div key={req.id} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${
                            req.status === 'PENDING' ? 'border-orange-500' : 
                            req.status === 'CONFIRMED' ? 'border-blue-500' : 'border-green-500'
                        } ${req.status === 'COMPLETED' ? 'opacity-90' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className="font-bold text-gray-400 text-xs tracking-wider uppercase">{req.type}</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    req.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                                    req.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>{req.status}</span>
                            </div>
                            
                            <h3 className="font-serif text-xl font-bold text-gray-800 mb-1">Room {req.roomNumber}</h3>
                            <p className="text-gray-600 mb-4">{req.details}</p>

                            {/* Timeline Info */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-500 space-y-1">
                                <div className="flex justify-between">
                                    <span className="flex items-center"><Clock size={10} className="mr-1"/> Requested:</span>
                                    <span className="font-mono text-gray-700">{formatTime(req.timestamp)}</span>
                                </div>
                                {req.confirmedAt && req.type !== 'BUGGY' && (
                                     <div className="flex justify-between text-blue-600">
                                        <span className="flex items-center"><CheckCircle size={10} className="mr-1"/> Confirmed:</span>
                                        <span className="font-mono font-bold">{formatTime(req.confirmedAt)}</span>
                                    </div>
                                )}
                                {req.assignedAt && req.type === 'BUGGY' && (
                                     <div className="flex justify-between text-blue-600">
                                        <span className="flex items-center"><CheckCircle size={10} className="mr-1"/> Assigned:</span>
                                        <span className="font-mono font-bold">{formatTime(req.assignedAt)}</span>
                                    </div>
                                )}
                                {req.arrivingAt && req.type === 'BUGGY' && (
                                     <div className="flex justify-between text-purple-600">
                                        <span className="flex items-center"><CheckCircle size={10} className="mr-1"/> Arriving:</span>
                                        <span className="font-mono font-bold">{formatTime(req.arrivingAt)}</span>
                                    </div>
                                )}
                                {req.pickedUpAt && req.type === 'BUGGY' && (
                                     <div className="flex justify-between text-indigo-600">
                                        <span className="flex items-center"><CheckCircle size={10} className="mr-1"/> Picked Up:</span>
                                        <span className="font-mono font-bold">{formatTime(req.pickedUpAt)}</span>
                                    </div>
                                )}
                                {req.completedAt && (
                                     <div className="flex justify-between text-green-600">
                                        <span className="flex items-center"><CheckCircle size={10} className="mr-1"/> Completed:</span>
                                        <span className="font-mono font-bold">{formatTime(req.completedAt)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {req.status === 'PENDING' && (
                                    <button 
                                       onClick={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           handleAction(req.id, 'CONFIRMED', e);
                                       }}
                                       className="col-span-2 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Confirm
                                    </button>
                                )}
                                {req.status === 'CONFIRMED' && (
                                    <button 
                                       onClick={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           handleAction(req.id, 'COMPLETED', e);
                                       }}
                                       className="col-span-2 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Complete
                                    </button>
                                )}

                                {/* CHAT BUTTON - Only show in Active View */}
                                {(req.status === 'PENDING' || req.status === 'CONFIRMED') && (
                                    <button
                                        onClick={() => setActiveChatRequest({ roomNumber: req.roomNumber, type: req.type })}
                                        className={`col-span-2 mt-1 border py-2 rounded-lg font-semibold flex items-center justify-center relative transition
                                            ${isUnread 
                                                ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                                                : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                                            }`}
                                    >
                                        <MessageSquare size={16} className="mr-2" /> 
                                        {isUnread ? 'New Message' : 'Chat with Guest'}
                                        {isUnread && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                                    </button>
                                )}
                            </div>
                        </div>
                     );
                 })}
            </div>

            {/* Chat Widget for Staff */}
            {activeChatRequest && (
                <ServiceChat 
                    key={`${activeChatRequest.roomNumber}_${activeChatRequest.type}`}
                    serviceType={activeChatRequest.type}
                    roomNumber={activeChatRequest.roomNumber}
                    label={`Guest Room ${activeChatRequest.roomNumber}`}
                    autoOpen={true}
                    userRole="staff"
                    onClose={() => setActiveChatRequest(null)}
                />
            )}
        </div>
    );
};

export default StaffPortal;
