import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, X, Search } from 'lucide-react';
import { Location } from '../../../types';
import { addLocation, updateLocation } from '../../../services/dataService';

interface LocationsTabProps {
    locations: Location[];
    onDelete: (id: string) => Promise<void>;
    onRefresh: () => Promise<void>;
}

export const LocationsTab: React.FC<LocationsTabProps> = ({ locations, onDelete, onRefresh }) => {
    const [locationFilter, setLocationFilter] = useState<'ALL' | 'VILLA' | 'FACILITY' | 'RESTAURANT'>('ALL');
    const [locationSearch, setLocationSearch] = useState<string>('');
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [showLocationForm, setShowLocationForm] = useState(false);
    const [newLocation, setNewLocation] = useState<Partial<Location>>({ name: '', lat: 0, lng: 0, type: 'FACILITY' });

    const filteredLocations = useMemo(() => {
        return locations.filter(l => {
            const matchesType = locationFilter === 'ALL' || l.type === locationFilter;
            const matchesSearch = !locationSearch || l.name.toLowerCase().includes(locationSearch.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [locations, locationFilter, locationSearch]);

    const handleSave = async () => {
        if (!newLocation.name) {
            alert('Please enter a name.');
            return;
        }
        if (!newLocation.lat || !newLocation.lng) {
            alert('Please enter valid coordinates.');
            return;
        }
        try {
            if (editingLocation && editingLocation.id) {
                await updateLocation(editingLocation.id, newLocation as Location);
                setEditingLocation(null);
                alert(`Location "${newLocation.name}" updated successfully!`);
            } else {
                await addLocation(newLocation as Location);
                alert(`Location "${newLocation.name}" added successfully!`);
            }
            setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
            setShowLocationForm(false);
            await onRefresh();
        } catch (error) {
            console.error('Failed to save location:', error);
            alert('Failed to save location. Please try again.');
        }
    };

    return (
        <>
            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex-1 md:flex-none min-w-[200px]">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={locationSearch}
                            onChange={(e) => setLocationSearch(e.target.value)}
                            placeholder="Search locations..."
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                        {locationSearch && (
                            <button
                                onClick={() => setLocationSearch('')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                    <button
                        onClick={() => setLocationFilter('ALL')}
                        className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 ${locationFilter === 'ALL' ? 'bg-gray-100 text-gray-800 font-bold' : 'text-gray-500'}`}
                    >
                        <span>All</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${locationFilter === 'ALL' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'}`}>
                            {locations.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setLocationFilter('FACILITY')}
                        className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 ${locationFilter === 'FACILITY' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-500'}`}
                    >
                        <span>Public Areas</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${locationFilter === 'FACILITY' ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {locations.filter(l => l.type === 'FACILITY').length}
                        </span>
                    </button>
                    <button
                        onClick={() => setLocationFilter('VILLA')}
                        className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 ${locationFilter === 'VILLA' ? 'bg-purple-100 text-purple-800 font-bold' : 'text-gray-500'}`}
                    >
                        <span>Villa</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${locationFilter === 'VILLA' ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {locations.filter(l => l.type === 'VILLA').length}
                        </span>
                    </button>
                    <button
                        onClick={() => setLocationFilter('RESTAURANT')}
                        className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 ${locationFilter === 'RESTAURANT' ? 'bg-amber-100 text-amber-800 font-bold' : 'text-gray-500'}`}
                    >
                        <span>Restaurant</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${locationFilter === 'RESTAURANT' ? 'bg-amber-200 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                            {locations.filter(l => l.type === 'RESTAURANT').length}
                        </span>
                    </button>
                </div>
                <button
                    onClick={() => {
                        setEditingLocation(null);
                        setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
                        setShowLocationForm(true);
                    }}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition"
                >
                    <Plus size={18} />
                    <span>Add Location</span>
                </button>
            </div>

            {/* Location Edit Modal */}
            {showLocationForm && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in"
                    onClick={() => {
                        setEditingLocation(null);
                        setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
                        setShowLocationForm(false);
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[90vw] max-w-2xl p-6 animate-in slide-in-from-top-5 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setEditingLocation(null);
                                setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
                                setShowLocationForm(false);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 pr-8">{editingLocation ? 'Edit Location' : 'Create Location'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newLocation.name || ''}
                                    onChange={e => setNewLocation({ ...newLocation, name: e.target.value })}
                                    placeholder="e.g. Main Pool"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newLocation.lat || ''}
                                    onChange={e => setNewLocation({ ...newLocation, lat: parseFloat(e.target.value) || 0 })}
                                    placeholder="e.g. 16.0471"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newLocation.lng || ''}
                                    onChange={e => setNewLocation({ ...newLocation, lng: parseFloat(e.target.value) || 0 })}
                                    placeholder="e.g. 108.2068"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newLocation.type || 'FACILITY'}
                                    onChange={e => setNewLocation({ ...newLocation, type: e.target.value as 'VILLA' | 'FACILITY' | 'RESTAURANT' })}
                                >
                                    <option value="VILLA">Villa</option>
                                    <option value="FACILITY">Public Area</option>
                                    <option value="RESTAURANT">Restaurant</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setEditingLocation(null);
                                    setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
                                    setShowLocationForm(false);
                                }}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700"
                            >
                                {editingLocation ? 'Update Location' : 'Create Location'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List View */}
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
                        <th className="p-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Coordinates</th>
                        <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredLocations.map((loc) => (
                        <tr key={loc.id || loc.name} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-4 font-medium text-gray-800">
                                {loc.name}
                                <div className="md:hidden text-xs text-gray-400 mt-1 font-mono">{loc.lat}, {loc.lng}</div>
                            </td>
                            <td className="p-4 text-sm font-mono text-gray-500 hidden md:table-cell">{loc.lat}, {loc.lng}</td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1 relative z-10">
                                    <button
                                        onClick={() => {
                                            setEditingLocation(loc);
                                            setNewLocation({
                                                name: loc.name,
                                                lat: loc.lat,
                                                lng: loc.lng,
                                                type: loc.type || 'FACILITY'
                                            });
                                            setShowLocationForm(true);
                                        }}
                                        className="text-emerald-600 hover:text-emerald-700 p-2 relative z-10 cursor-pointer"
                                        title="Edit"
                                        type="button"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(loc.id || loc.name)}
                                        className="text-red-500 hover:text-red-700 p-2 relative z-10 cursor-pointer"
                                        type="button"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};
