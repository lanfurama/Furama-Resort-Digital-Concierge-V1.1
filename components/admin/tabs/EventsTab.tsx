import React, { useState } from 'react';
import { Plus, Trash2, FileText, X } from 'lucide-react';
import { ResortEvent } from '../../../types';
import { addEvent, updateEvent, getEvents } from '../../../services/dataService';

interface EventsTabProps {
    events: ResortEvent[];
    onDelete: (id: string) => Promise<void>;
    onRefresh: () => Promise<void>;
    setEvents: (events: ResortEvent[]) => void;
}

const formatEventDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
            const yyyy = parseInt(parts[0]);
            const mm = parseInt(parts[1]) - 1;
            const dd = parseInt(parts[2]);
            const dateObj = new Date(yyyy, mm, dd);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
        }
        return dateString;
    } catch {
        return dateString;
    }
};

export const EventsTab: React.FC<EventsTabProps> = ({ events, onDelete, onRefresh, setEvents }) => {
    const [editingEvent, setEditingEvent] = useState<ResortEvent | null>(null);
    const [showEventForm, setShowEventForm] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<ResortEvent>>({ title: '', date: '', time: '', location: '', description: '' });

    const handleSave = async () => {
        if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) {
            alert('Please fill in all required fields (Title, Date, Time, Location).');
            return;
        }
        try {
            if (editingEvent) {
                const updated = await updateEvent(editingEvent.id, newEvent as ResortEvent);
                alert(`Event "${updated.title}" updated successfully!`);
                setEditingEvent(null);
            } else {
                await addEvent(newEvent as ResortEvent);
                alert(`Event "${newEvent.title}" created successfully!`);
            }
            setNewEvent({ title: '', date: '', time: '', location: '', description: '' });
            setShowEventForm(false);
            try {
                const refreshedEvents = await getEvents();
                setEvents(refreshedEvents);
            } catch (error) {
                console.error('Failed to refresh events:', error);
            }
            await onRefresh();
        } catch (error: any) {
            console.error('Failed to save event:', error);
            alert(`Failed to save event: ${error?.message || 'Unknown error'}`);
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">Events Calendar</h2>
                <button
                    onClick={() => {
                        if (showEventForm && !editingEvent) {
                            setShowEventForm(false);
                            setNewEvent({ title: '', date: '', time: '', location: '', description: '' });
                        } else {
                            setShowEventForm(!showEventForm);
                            if (!showEventForm) {
                                setEditingEvent(null);
                                setNewEvent({ title: '', date: '', time: '', location: '', description: '' });
                            }
                        }
                    }}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2  shadow-md active:scale-95 flex-1 md:flex-none"
                >
                    {showEventForm && !editingEvent ? <X size={18} /> : <Plus size={18} />}
                    <span>{showEventForm && !editingEvent ? 'Cancel' : 'Add Event'}</span>
                </button>
            </div>

            {/* Event Edit Form */}
            {showEventForm && (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newEvent.title || ''}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                placeholder="e.g. Pool Party"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newEvent.date || ''}
                                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Time</label>
                            <input
                                type="time"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newEvent.time || ''}
                                onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Location</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newEvent.location || ''}
                                onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                placeholder="e.g. Lagoon Pool"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Description (Optional)</label>
                            <textarea
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newEvent.description || ''}
                                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                placeholder="Event description..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        {editingEvent && (
                            <button
                                onClick={() => {
                                    setEditingEvent(null);
                                    setNewEvent({ title: '', date: '', time: '', location: '', description: '' });
                                    setShowEventForm(false);
                                }}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            className="bg-emerald-800 text-white px-6 py-2 rounded-lg text-sm font-bold"
                        >
                            {editingEvent ? 'Update Event' : 'Create Event'}
                        </button>
                    </div>
                </div>
            )}

            {/* Events List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="divide-y divide-gray-100">
                    {events.map((event) => (
                        <div key={event.id} className="p-4 flex justify-between items-center ">
                            <div>
                                <div className="font-bold text-gray-800">{event.title}</div>
                                <div className="text-sm text-emerald-600">{formatEventDate(event.date)} • {event.time}</div>
                                <div className="text-xs text-gray-500 mt-1">{event.location}</div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => {
                                        setEditingEvent(event);
                                        setNewEvent({
                                            title: event.title,
                                            date: event.date,
                                            time: event.time,
                                            location: event.location,
                                            description: event.description || ''
                                        });
                                        setShowEventForm(true);
                                    }}
                                    className="text-emerald-600  p-2"
                                    title="Edit"
                                >
                                    <FileText size={16} />
                                </button>
                                <button onClick={() => onDelete(event.id)} className="text-red-500  p-2"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
