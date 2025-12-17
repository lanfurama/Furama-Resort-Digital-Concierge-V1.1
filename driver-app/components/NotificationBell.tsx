
import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { getNotifications, markNotificationRead } from '../services/dataService';
import { AppNotification } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface NotificationBellProps {
    userId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Poll for notifications
    useEffect(() => {
        const fetch = async () => {
            const list = await getNotifications(userId);
            setNotifications(list);
            setUnreadCount(list.filter(n => !n.isRead).length);
        };
        
        fetch();
        const interval = setInterval(fetch, 2000); // Poll every 2 seconds
        return () => clearInterval(interval);
    }, [userId]);

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleMarkRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await markNotificationRead(id);
        const list = await getNotifications(userId);
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.isRead).length);
    };

    const getTypeStyles = (type: string) => {
        if (type === 'SUCCESS') return 'bg-green-50 border-green-100 text-green-800';
        if (type === 'WARNING') return 'bg-red-50 border-red-100 text-red-800';
        return 'bg-blue-50 border-blue-100 text-blue-800';
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'SUCCESS': return t('notification_success');
            case 'WARNING': return t('notification_warning');
            case 'INFO': return t('notification_info');
            default: return type;
        }
    };

    return (
        <div className="relative z-50">
            <button 
                onClick={toggleOpen}
                className="relative p-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20 backdrop-blur-sm"
            >
                <Bell className="w-5 h-5 text-white/90" strokeWidth={2.5} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-lg border-2 border-emerald-800 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl border-2 border-gray-200/60 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/60 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-base">{t('notifications')}</h3>
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                            >
                                <X size={18} strokeWidth={2.5}/>
                            </button>
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm font-medium">{t('no_notifications')}</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif.id} 
                                        onClick={() => !notif.isRead && handleMarkRead(notif.id, {} as React.MouseEvent)}
                                        className={`p-4 border-b border-gray-100/60 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all cursor-pointer relative ${notif.isRead ? 'opacity-60' : 'bg-white'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border-2 ${getTypeStyles(notif.type)}`}>
                                                {getTypeLabel(notif.type)}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-medium">
                                                {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <h4 className={`text-sm font-bold mb-1 ${notif.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{notif.title}</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed">{notif.message}</p>
                                        
                                        {!notif.isRead && (
                                            <button 
                                                onClick={(e) => handleMarkRead(notif.id, e)}
                                                className="absolute bottom-3 right-3 text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-all border border-emerald-200 hover:border-emerald-300"
                                                title={t('mark_as_read')}
                                            >
                                                <Check size={16} strokeWidth={2.5} />
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
