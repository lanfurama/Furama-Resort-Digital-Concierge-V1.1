import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Clock, AlertCircle } from 'lucide-react';
import { getEvents } from '../services/dataService';
import { ResortEvent } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface EventsListProps {
    onBack: () => void;
}

const EventsList: React.FC<EventsListProps> = ({ onBack }) => {
    const { t, language } = useTranslation();
    const [events, setEvents] = useState<ResortEvent[]>([]);
    
    // Load events on mount
    useEffect(() => {
        getEvents().then(setEvents).catch(console.error);
    }, []);

    // Helper to format date nicely
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return { month: 'NOV', day: '20' }; // Fallback for demo data
        return {
            month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
            day: date.getDate()
        };
    };

    // Helper to check if event is expired
    const isEventExpired = (event: ResortEvent): boolean => {
        try {
            // Parse date and time
            const eventDate = new Date(event.date);
            if (isNaN(eventDate.getTime())) return false; // Invalid date, don't mark as expired
            
            // Parse time (format: HH:MM:SS or HH:MM)
            const timeParts = event.time.split(':');
            if (timeParts.length >= 2) {
                const hours = parseInt(timeParts[0], 10);
                const minutes = parseInt(timeParts[1], 10);
                
                // Set the time on the event date
                eventDate.setHours(hours, minutes, 0, 0);
                
                // Compare with current time
                return eventDate.getTime() < Date.now();
            }
            return false;
        } catch (error) {
            console.error('Error checking event expiration:', error);
            return false;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="p-4 bg-pink-700 text-white shadow-md flex items-center z-10 sticky top-0">
                <button onClick={onBack} className="mr-4 text-white hover:text-gray-200">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-serif font-bold">{t('events')}</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {events.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                        <Calendar className="w-16 h-16 mb-4 opacity-20" />
                        <p>No upcoming events scheduled.</p>
                    </div>
                ) : (
                    events.map(event => {
                        const dateObj = formatDate(event.date);
                        const expired = isEventExpired(event);
                        
                        // Translation Fallback
                        const tr = event.translations?.[language];
                        const title = tr?.title || event.title;
                        const description = tr?.description || event.description;
                        const location = tr?.location || event.location;

                        return (
                            <div 
                                key={event.id} 
                                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition ${
                                    expired 
                                        ? 'opacity-60 border-gray-300 cursor-not-allowed' 
                                        : 'border-pink-100 hover:shadow-md'
                                }`}
                            >
                                <div className="flex">
                                    {/* Date Column */}
                                    <div className={`p-4 flex flex-col items-center justify-center min-w-[5rem] border-r ${
                                        expired 
                                            ? 'bg-gray-100 border-gray-200' 
                                            : 'bg-pink-50 border-pink-100'
                                    }`}>
                                        <span className={`text-xs font-bold ${
                                            expired ? 'text-gray-500' : 'text-pink-700'
                                        }`}>{dateObj.month}</span>
                                        <span className={`text-2xl font-bold ${
                                            expired ? 'text-gray-400' : 'text-gray-800'
                                        }`}>{dateObj.day}</span>
                                    </div>
                                    
                                    {/* Info Column */}
                                    <div className="p-4 flex-1 relative">
                                        {/* Expired Badge */}
                                        {expired && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-semibold border border-red-200">
                                                <AlertCircle size={12} />
                                                <span>{language === 'vi' ? 'Đã hết hạn' : 'Expired'}</span>
                                            </div>
                                        )}
                                        
                                        <h3 className={`font-bold text-lg leading-tight mb-1 ${
                                            expired ? 'text-gray-400 line-through' : 'text-gray-800'
                                        }`}>{title}</h3>
                                        
                                        <div className={`flex items-center text-sm font-medium mb-2 ${
                                            expired ? 'text-gray-400' : 'text-pink-700'
                                        }`}>
                                            <Clock size={14} className="mr-1" />
                                            {event.time}
                                        </div>
                                        
                                        <p className={`text-sm mb-3 line-clamp-2 ${
                                            expired ? 'text-gray-400' : 'text-gray-600'
                                        }`}>{description}</p>
                                        
                                        <div className={`flex items-center text-xs p-2 rounded-lg inline-flex ${
                                            expired 
                                                ? 'text-gray-400 bg-gray-100' 
                                                : 'text-gray-500 bg-gray-50'
                                        }`}>
                                            <MapPin size={14} className={`mr-1.5 ${
                                                expired ? 'text-gray-300' : 'text-gray-400'
                                            }`} />
                                            {location}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                
                <div className="text-center text-xs text-gray-400 mt-8">
                    Events are subject to change without prior notice.
                </div>
            </div>
        </div>
    );
};

export default EventsList;