
import React, { useState, useEffect } from 'react';
import { getServiceRequests, updateServiceStatus, getLastMessage } from '../services/dataService';
import { ServiceRequest, User, UserRole } from '../types';
import { UserCheck, ShieldCheck, MessageSquare, Eye } from 'lucide-react';
import ServiceChat from './ServiceChat';

const StaffPortal: React.FC<{ onLogout: () => void; user: User }> = ({ onLogout, user }) => {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [activeChatRequest, setActiveChatRequest] = useState<{roomNumber: string, type: string} | null>(null);
    const [unreadChats, setUnreadChats] = useState<Set<string>>(new Set());

    useEffect(() => {
        const interval = setInterval(() => {
            const currentRequests = getServiceRequests();
            setRequests(currentRequests);
            checkUnread(currentRequests);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const checkUnread = (reqs: ServiceRequest[]) => {
        const newUnread = new Set<string>();
        reqs.forEach(req => {
            const lastMsg = getLastMessage(req.roomNumber, req.type);
            // If the last message exists and was sent by 'user' (Guest), it is unread for Staff
            if (lastMsg && lastMsg.role === 'user') {
                newUnread.add(`${req.roomNumber}_${req.type}`);
            }
        });
        setUnreadChats(newUnread);
    };

    const handleAction = (id: string, newStatus: 'CONFIRMED' | 'COMPLETED') => {
        updateServiceStatus(id, newStatus);
        setRequests(getServiceRequests()); // Force refresh
    };

    // Filter requests based on Department and Role
    const filteredRequests = requests.filter(req => {
        // Supervisors see ALL requests
        if (user.role === UserRole.SUPERVISOR) return true;
        
        // Staff with 'All' department see ALL requests
        if (!user.department || user.department === 'All') return true;
        
        // Strict Department Mapping
        // ServiceRequest.type is uppercase (DINING, SPA, POOL, BUTLER, BUGGY)
        // User.department is Title case (Dining, Spa, Pool, Butler, Buggy)
        const userDeptUpper = user.department.toUpperCase();
        return req.type === userDeptUpper;
    });

    // Helper to get Department display name
    const getRoleDisplay = () => {
        if (user.role === UserRole.SUPERVISOR) return 'Supervisor';
        return user.department || 'General Staff';
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
                <button onClick={onLogout} className="text-sm font-semibold text-gray-500 hover:text-gray-800">Logout</button>
            </header>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {filteredRequests.length === 0 && (
                     <div className="col-span-full text-center py-20 text-gray-400">
                         <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                         <p>No active service requests for {getRoleDisplay()}.</p>
                     </div>
                 )}
                 {filteredRequests.map(req => {
                     const isUnread = unreadChats.has(`${req.roomNumber}_${req.type}`);
                     
                     return (
                        <div key={req.id} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${
                            req.status === 'PENDING' ? 'border-orange-500' : 
                            req.status === 'CONFIRMED' ? 'border-blue-500' : 'border-green-500'
                        }`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className="font-bold text-gray-400 text-xs tracking-wider uppercase">{req.type}</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    req.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                                    req.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>{req.status}</span>
                            </div>
                            
                            <h3 className="font-serif text-xl font-bold text-gray-800 mb-1">Room {req.roomNumber}</h3>
                            <p className="text-gray-600 mb-6">{req.details}</p>

                            <div className="grid grid-cols-2 gap-2">
                                {req.status === 'PENDING' && (
                                    <button 
                                       onClick={() => handleAction(req.id, 'CONFIRMED')}
                                       className="col-span-2 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700"
                                    >
                                        Confirm
                                    </button>
                                )}
                                {req.status === 'CONFIRMED' && (
                                    <button 
                                       onClick={() => handleAction(req.id, 'COMPLETED')}
                                       className="col-span-2 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                                    >
                                        Complete
                                    </button>
                                )}

                                {/* CHAT BUTTON */}
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
