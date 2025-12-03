
import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { getNotifications, markNotificationRead } from '../services/dataService';
import { AppNotification } from '../types';

interface NotificationBellProps {
    userId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Poll for notifications
    useEffect(() => {
        const fetch = () => {
            const list = getNotifications(userId);
            setNotifications(list);
            setUnreadCount(list.filter(n => !n.isRead).length);
        };
        
        fetch();
        const interval = setInterval(fetch, 2000); // Poll every 2 seconds
        return () => clearInterval(interval);
    }, [userId]);

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleMarkRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        markNotificationRead(id);
        const list = getNotifications(userId);
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.isRead).length);
    };

    const getTypeStyles = (type: string) => {
        if (type === 'SUCCESS') return 'bg-green-50 border-green-100 text-green-800';
        if (type === 'WARNING') return 'bg-red-50 border-red-100 text-red-800';
        return 'bg-blue-50 border-blue-100 text-blue-800';
    };

    return (
        <div className="relative z-50">
            <button 
                onClick={toggleOpen}
                className="relative p-2 rounded-full hover:bg-black/10 transition"
            >
                <Bell className="w-6 h-6 text-white/90" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse border border-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 text-sm">Notifications</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    No notifications.
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif.id} 
                                        onClick={() => !notif.isRead && markNotificationRead(notif.id)}
                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer relative ${notif.isRead ? 'opacity-60' : 'bg-white'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getTypeStyles(notif.type)}`}>
                                                {notif.type}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <h4 className={`text-sm font-bold ${notif.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{notif.title}</h4>
                                        <p className="text-xs text-gray-500 mt-1 leading-snug">{notif.message}</p>
                                        
                                        {!notif.isRead && (
                                            <button 
                                                onClick={(e) => handleMarkRead(notif.id, e)}
                                                className="absolute bottom-2 right-2 text-emerald-600 hover:bg-emerald-50 p-1 rounded-full"
                                                title="Mark as read"
                                            >
                                                <Check size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
