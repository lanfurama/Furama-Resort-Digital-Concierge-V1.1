
import React, { useState, useEffect, useRef } from 'react';
import { getServiceRequests, updateServiceStatus, getLastMessage, updateDriverHeartbeat, markDriverOffline } from '../services/dataService';
import { ServiceRequest, User, UserRole } from '../types';
import { UserCheck, ShieldCheck, MessageSquare, Eye, Bell, Clock, CheckCircle, List, History, Package } from 'lucide-react';
import ServiceChat from './ServiceChat';

const StaffPortal: React.FC<{ onLogout: () => void; user: User }> = ({ onLogout, user }) => {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [activeChatRequest, setActiveChatRequest] = useState<{roomNumber: string, type: string} | null>(null);
    const [unreadChats, setUnreadChats] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
    
    // New Order Notification State
    const [newOrderAlert, setNewOrderAlert] = useState(false);
    const prevRequestCount = useRef(0);

    // Send initial heartbeat when staff portal opens
    useEffect(() => {
        if (user.id && user.role === UserRole.STAFF) {
            updateDriverHeartbeat(user.id);
        }
    }, [user.id, user.role]);

    // Heartbeat: Update staff online status every 30 seconds
    useEffect(() => {
        if (!user.id || user.role !== UserRole.STAFF) return;
        
        // Send heartbeat every 30 seconds to keep staff online
        const heartbeatInterval = setInterval(() => {
            updateDriverHeartbeat(user.id!);
        }, 30000); // 30 seconds
        
        return () => clearInterval(heartbeatInterval);
    }, [user.id, user.role]);

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex flex-col relative">
             <header className="backdrop-blur-md bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-3 flex justify-between items-center shadow-lg border-b border-white/20"
                style={{
                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.15)'
                }}
            >
                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md border border-white/30 flex-shrink-0 ${
                        user.role === UserRole.SUPERVISOR 
                            ? 'bg-amber-600' 
                            : 'bg-indigo-600'
                    }`}>
                        {user.role === UserRole.SUPERVISOR ? <Eye size={20} strokeWidth={2.5} /> : <UserCheck size={20} strokeWidth={2.5} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-base text-white flex items-center gap-1.5">
                            <span>{user.role === UserRole.SUPERVISOR ? 'Supervisor Dashboard' : 'Staff Portal'}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                user.role === UserRole.SUPERVISOR 
                                ? 'bg-amber-500/30 text-amber-100 border-amber-300/50' 
                                : 'bg-indigo-500/30 text-indigo-100 border-indigo-300/50'
                            }`}>
                                {getRoleDisplay()}
                            </span>
                        </h1>
                        <p className="text-[11px] text-white/80 mt-0.5">
                            {user.role === UserRole.SUPERVISOR ? 'Monitoring All Departments' : 'Service Management'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    {/* New Order Notification Button */}
                    {newOrderAlert && (
                        <button 
                            onClick={handleNewOrderClick}
                            className="bg-red-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-md border border-white/30 animate-pulse transition-all"
                        >
                            <Bell size={13} className="mr-1" />
                            New Orders!
                        </button>
                    )}

                    <button 
                        onClick={async () => {
                            // Mark staff as offline before logout
                            if (user.id && (user.role === UserRole.STAFF || user.role === UserRole.SUPERVISOR)) {
                                try {
                                    await markDriverOffline(user.id);
                                } catch (e) {
                                    console.error('Failed to mark staff offline:', e);
                                }
                            }
                            onLogout();
                        }}
                        className="text-sm font-semibold text-white/90 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all border border-white/20"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* View Mode Tabs - Modern Design */}
            <div className="px-3 pt-3 pb-2">
                <div className="flex space-x-2 border-b-2 border-gray-200/60">
                    <button 
                        onClick={() => setViewMode('ACTIVE')}
                        className={`group pb-2.5 px-3 font-bold text-sm flex items-center transition-all duration-300 ${
                            viewMode === 'ACTIVE' 
                            ? 'border-b-2 border-indigo-600 text-indigo-600' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <List size={16} className="mr-1.5" strokeWidth={2.5}/> 
                        Active Orders
                        {viewMode === 'ACTIVE' && displayedRequests.filter(r => r.status === 'PENDING' || r.status === 'CONFIRMED').length > 0 && (
                            <span className="ml-1.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                {displayedRequests.length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => setViewMode('HISTORY')}
                        className={`group pb-2.5 px-3 font-bold text-sm flex items-center transition-all duration-300 ${
                            viewMode === 'HISTORY' 
                            ? 'border-b-2 border-purple-600 text-purple-600' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <History size={16} className="mr-1.5" strokeWidth={2.5}/> 
                        Order History
                    </button>
                </div>
            </div>

            <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto">
                 {displayedRequests.length === 0 && (
                     <div className="col-span-full text-center py-12">
                         <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                             <ShieldCheck className="w-10 h-10 text-gray-400"/>
                         </div>
                         <p className="text-gray-600 font-semibold text-sm">No {viewMode === 'ACTIVE' ? 'active' : 'completed'} requests found for {getRoleDisplay()}.</p>
                     </div>
                 )}
                 {displayedRequests.map(req => {
                     const isUnread = unreadChats.has(`${req.roomNumber}_${req.type}`);
                     
                     // Parse order details for better display
                     let orderItems: Array<{name: string, price?: number}> = [];
                     let orderNote = '';
                     
                     if (req.items && req.items.length > 0) {
                         // Use items array if available
                         orderItems = req.items;
                     } else if (req.details) {
                         const details = req.details.trim();
                         
                         // Check if it has the format "Items: ... Order for: ..."
                         if (details.includes('Items:') && details.includes('Order for:')) {
                             // Extract items part (between "Items:" and "Order for:")
                             const itemsMatch = details.match(/Items:\s*(.+?)\s*Order for:/);
                             if (itemsMatch && itemsMatch[1]) {
                                 const itemsText = itemsMatch[1].trim().replace(/\.$/, '');
                                 orderItems = itemsText.split(',').filter(i => i.trim()).map(name => ({ name: name.trim() }));
                             }
                             
                             // Extract note part (after "Order for:")
                             const noteMatch = details.match(/Order for:\s*(.+)/);
                             if (noteMatch && noteMatch[1]) {
                                 orderNote = noteMatch[1].trim().replace(/\.$/, '');
                             }
                         } else if (details.includes('Items:')) {
                             // Only has Items, no Order for
                             const itemsMatch = details.match(/Items:\s*(.+)/);
                             if (itemsMatch && itemsMatch[1]) {
                                 const itemsText = itemsMatch[1].trim().replace(/\.$/, '');
                                 orderItems = itemsText.split(',').filter(i => i.trim()).map(name => ({ name: name.trim() }));
                             }
                         } else if (details.includes('Order for:')) {
                             // Only has Order for, no Items
                             const noteMatch = details.match(/Order for:\s*(.+)/);
                             if (noteMatch && noteMatch[1]) {
                                 orderNote = noteMatch[1].trim().replace(/\.$/, '');
                             }
                         }
                     }
                     
                     return (
                        <div key={req.id} className={`bg-white p-4 rounded-xl shadow-md border-2 transition-all hover:shadow-lg ${
                            req.status === 'PENDING' ? 'border-orange-300 bg-orange-50/50' : 
                            req.status === 'CONFIRMED' ? 'border-blue-300 bg-blue-50/50' : 
                            'border-green-300 bg-green-50/50'
                        }`}
                        >
                            <div className="flex justify-between items-start mb-3 pb-2.5 border-b border-gray-200">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-1.5 mb-1">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Room</span>
                                        <span className="text-xl font-black text-gray-900">{req.roomNumber}</span>
                                    </div>
                                    <span className="font-bold text-gray-500 text-[10px] tracking-wider uppercase">{req.type}</span>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold border flex-shrink-0 ml-2 ${
                                    req.status === 'PENDING' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                    req.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                                    'bg-green-100 text-green-700 border-green-200'
                                }`}>{req.status}</span>
                            </div>
                            
                            {/* Order Details - Visual & Clear */}
                            <div className="mb-3 bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                                {orderItems.length > 0 ? (
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                            <Package size={12} className="text-indigo-500"/>
                                            Order Items ({orderItems.length})
                                        </div>
                                        <div className="space-y-1">
                                            {orderItems.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-gray-200">
                                                    <span className="text-sm font-semibold text-gray-800 flex-1">{item.name}</span>
                                                    {item.price !== undefined && item.price > 0 ? (
                                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded ml-2">${item.price}</span>
                                                    ) : item.price === 0 ? (
                                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded ml-2">Free</span>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                        {orderNote && orderNote !== orderItems.map(i => i.name).join(', ') && (
                                            <div className="mt-2.5 pt-2.5 border-t border-gray-200">
                                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Note</div>
                                                <p className="text-xs font-medium text-gray-700 bg-white rounded p-1.5 border border-gray-200">
                                                    {orderNote}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Details</div>
                                        <p className="text-sm font-medium text-gray-700 leading-relaxed">
                                            {req.details}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Timeline Info - Compact */}
                            <div className="bg-gray-50 rounded-lg p-2.5 mb-3 text-[11px] text-gray-600 space-y-1.5 border border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1 font-medium text-gray-600">
                                        <Clock size={11} className="text-gray-400"/> 
                                        Requested:
                                    </span>
                                    <span className="font-semibold text-gray-900">{formatTime(req.timestamp)}</span>
                                </div>
                                {req.confirmedAt && req.type !== 'BUGGY' && (
                                     <div className="flex justify-between items-center text-blue-700">
                                        <span className="flex items-center gap-1 font-medium">
                                            <CheckCircle size={11} className="text-blue-500"/> 
                                            Confirmed:
                                        </span>
                                        <span className="font-semibold">{formatTime(req.confirmedAt)}</span>
                                    </div>
                                )}
                                {req.assignedAt && req.type === 'BUGGY' && (
                                     <div className="flex justify-between items-center text-blue-700">
                                        <span className="flex items-center gap-1 font-medium">
                                            <CheckCircle size={11} className="text-blue-500"/> 
                                            Assigned:
                                        </span>
                                        <span className="font-semibold">{formatTime(req.assignedAt)}</span>
                                    </div>
                                )}
                                {req.arrivingAt && req.type === 'BUGGY' && (
                                     <div className="flex justify-between items-center text-purple-700">
                                        <span className="flex items-center gap-1 font-medium">
                                            <CheckCircle size={11} className="text-purple-500"/> 
                                            Arriving:
                                        </span>
                                        <span className="font-semibold">{formatTime(req.arrivingAt)}</span>
                                    </div>
                                )}
                                {req.pickedUpAt && req.type === 'BUGGY' && (
                                     <div className="flex justify-between items-center text-indigo-700">
                                        <span className="flex items-center gap-1 font-medium">
                                            <CheckCircle size={11} className="text-indigo-500"/> 
                                            Picked Up:
                                        </span>
                                        <span className="font-semibold">{formatTime(req.pickedUpAt)}</span>
                                    </div>
                                )}
                                {req.completedAt && (
                                     <div className="flex justify-between items-center text-green-700">
                                        <span className="flex items-center gap-1 font-medium">
                                            <CheckCircle size={11} className="text-green-500"/> 
                                            Completed:
                                        </span>
                                        <span className="font-semibold">{formatTime(req.completedAt)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                {req.status === 'PENDING' && (
                                    <button 
                                       onClick={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           handleAction(req.id, 'CONFIRMED', e);
                                       }}
                                       className="group relative w-full bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-md transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] hover:bg-indigo-700"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                        <span className="relative z-10">Confirm Order</span>
                                    </button>
                                )}
                                {req.status === 'CONFIRMED' && (
                                    <button 
                                       onClick={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           handleAction(req.id, 'COMPLETED', e);
                                       }}
                                       className="group relative w-full bg-green-600 text-white py-3 rounded-lg font-bold shadow-md transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] hover:bg-green-700"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                        <span className="relative z-10">Complete Order</span>
                                    </button>
                                )}

                                {/* CHAT BUTTON - Only show in Active View */}
                                {(req.status === 'PENDING' || req.status === 'CONFIRMED') && (
                                    <button
                                        onClick={() => setActiveChatRequest({ roomNumber: req.roomNumber, type: req.type })}
                                        className={`w-full border-2 py-2.5 rounded-lg font-bold flex items-center justify-center relative transition-all min-h-[48px] ${
                                            isUnread 
                                                ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' 
                                                : 'border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                                        }`}
                                    >
                                        <MessageSquare size={16} className="mr-2" strokeWidth={2.5}/> 
                                        {isUnread ? 'New Message' : 'Chat with Guest'}
                                        {isUnread && (
                                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-md animate-pulse"></span>
                                        )}
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
