import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react';
import { getEvents } from '../services/dataService';
import { ResortEvent } from '../types';

interface EventsListProps {
    onBack: () => void;
}

const EventsList: React.FC<EventsListProps> = ({ onBack }) => {
    const [events, setEvents] = useState<ResortEvent[]>([]);
    
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

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="p-4 bg-pink-700 text-white shadow-md flex items-center z-10 sticky top-0">
                <button onClick={onBack} className="mr-4 text-white hover:text-gray-200">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-serif font-bold">Resort Events</h2>
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
                        return (
                            <div key={event.id} className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-md transition">
                                <div className="flex">
                                    {/* Date Column */}
                                    <div className="bg-pink-50 p-4 flex flex-col items-center justify-center min-w-[5rem] border-r border-pink-100">
                                        <span className="text-xs text-pink-700 font-bold">{dateObj.month}</span>
                                        <span className="text-2xl font-bold text-gray-800">{dateObj.day}</span>
                                    </div>
                                    
                                    {/* Info Column */}
                                    <div className="p-4 flex-1">
                                        <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">{event.title}</h3>
                                        
                                        <div className="flex items-center text-pink-700 text-sm font-medium mb-2">
                                            <Clock size={14} className="mr-1" />
                                            {event.time}
                                        </div>
                                        
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                                        
                                        <div className="flex items-center text-xs text-gray-500 bg-gray-50 p-2 rounded-lg inline-flex">
                                            <MapPin size={14} className="mr-1.5 text-gray-400" />
                                            {event.location}
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