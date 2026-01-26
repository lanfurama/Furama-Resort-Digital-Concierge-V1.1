import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, X, Search, MapPin } from 'lucide-react';
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
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1 w-full lg:w-auto min-w-[250px]">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative">
                                <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    value={locationSearch}
                                    onChange={(e) => setLocationSearch(e.target.value)}
                                    placeholder="Search locations..."
                                    className="w-full pl-12 pr-10 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder-gray-400"
                                />
                                {locationSearch && (
                                    <button
                                        onClick={() => setLocationSearch('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 bg-gray-50/80 backdrop-blur-sm rounded-xl p-1.5 border border-gray-200">
                        <button
                            onClick={() => setLocationFilter('ALL')}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all duration-200 ${
                                locationFilter === 'ALL' 
                                    ? 'bg-white text-gray-900 shadow-md border border-gray-200' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                            }`}
                        >
                            <span>All</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                locationFilter === 'ALL' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-gray-200 text-gray-600'
                            }`}>
                                {locations.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setLocationFilter('FACILITY')}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all duration-200 ${
                                locationFilter === 'FACILITY' 
                                    ? 'bg-blue-50 text-blue-900 shadow-md border border-blue-200' 
                                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50/50'
                            }`}
                        >
                            <span>Public Areas</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                locationFilter === 'FACILITY' 
                                    ? 'bg-blue-200 text-blue-800' 
                                    : 'bg-gray-200 text-gray-600'
                            }`}>
                                {locations.filter(l => l.type === 'FACILITY').length}
                            </span>
                        </button>
                        <button
                            onClick={() => setLocationFilter('VILLA')}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all duration-200 ${
                                locationFilter === 'VILLA' 
                                    ? 'bg-purple-50 text-purple-900 shadow-md border border-purple-200' 
                                    : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50/50'
                            }`}
                        >
                            <span>Villa</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                locationFilter === 'VILLA' 
                                    ? 'bg-purple-200 text-purple-800' 
                                    : 'bg-gray-200 text-gray-600'
                            }`}>
                                {locations.filter(l => l.type === 'VILLA').length}
                            </span>
                        </button>
                        <button
                            onClick={() => setLocationFilter('RESTAURANT')}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all duration-200 ${
                                locationFilter === 'RESTAURANT' 
                                    ? 'bg-amber-50 text-amber-900 shadow-md border border-amber-200' 
                                    : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50/50'
                            }`}
                        >
                            <span>Restaurant</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                locationFilter === 'RESTAURANT' 
                                    ? 'bg-amber-200 text-amber-800' 
                                    : 'bg-gray-200 text-gray-600'
                            }`}>
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
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 font-semibold whitespace-nowrap"
                    >
                        <Plus size={18} />
                        <span>Add Location</span>
                    </button>
                </div>
            </div>

            {/* Location Edit Modal */}
            {showLocationForm && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4"
                    onClick={() => {
                        setEditingLocation(null);
                        setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
                        setShowLocationForm(false);
                    }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl p-6 md:p-8 animate-in slide-in-from-top-5 relative max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setEditingLocation(null);
                                setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
                                setShowLocationForm(false);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-2">
                                {editingLocation ? 'Edit Location' : 'Create New Location'}
                            </h3>
                            <p className="text-sm text-gray-500">Fill in the details below to {editingLocation ? 'update' : 'add'} a location</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Location Name</label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm bg-white/80 backdrop-blur-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                                    value={newLocation.name || ''}
                                    onChange={e => setNewLocation({ ...newLocation, name: e.target.value })}
                                    placeholder="e.g. Main Pool, Beach Bar, Villa D1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm bg-white/80 backdrop-blur-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 font-mono"
                                    value={newLocation.lat || ''}
                                    onChange={e => setNewLocation({ ...newLocation, lat: parseFloat(e.target.value) || 0 })}
                                    placeholder="e.g. 16.0471"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm bg-white/80 backdrop-blur-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 font-mono"
                                    value={newLocation.lng || ''}
                                    onChange={e => setNewLocation({ ...newLocation, lng: parseFloat(e.target.value) || 0 })}
                                    placeholder="e.g. 108.2068"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Location Type</label>
                                <select
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm bg-white/80 backdrop-blur-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all duration-200 text-gray-900"
                                    value={newLocation.type || 'FACILITY'}
                                    onChange={e => setNewLocation({ ...newLocation, type: e.target.value as 'VILLA' | 'FACILITY' | 'RESTAURANT' })}
                                >
                                    <option value="VILLA">Villa</option>
                                    <option value="FACILITY">Public Area</option>
                                    <option value="RESTAURANT">Restaurant</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setEditingLocation(null);
                                    setNewLocation({ name: '', lat: 0, lng: 0, type: 'FACILITY' });
                                    setShowLocationForm(false);
                                }}
                                className="px-6 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                            >
                                {editingLocation ? 'Update Location' : 'Create Location'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table View */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">Coordinates</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLocations.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                                <MapPin className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 font-medium">No locations found</p>
                                            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLocations.map((loc, index) => (
                                    <tr 
                                        key={loc.id || loc.name} 
                                        className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all duration-150 group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    loc.type === 'VILLA' ? 'bg-purple-500' :
                                                    loc.type === 'FACILITY' ? 'bg-blue-500' :
                                                    'bg-amber-500'
                                                }`}></div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                                                        {loc.name}
                                                    </div>
                                                    <div className="md:hidden text-xs text-gray-500 mt-1 font-mono">
                                                        {loc.lat}, {loc.lng}
                                                    </div>
                                                    <div className="md:hidden mt-1">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                            loc.type === 'VILLA' ? 'bg-purple-100 text-purple-700' :
                                                            loc.type === 'FACILITY' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {loc.type === 'VILLA' ? 'Villa' :
                                                             loc.type === 'FACILITY' ? 'Public Area' :
                                                             'Restaurant'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-600 hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Lat:</span>
                                                <span className="font-semibold">{loc.lat}</span>
                                                <span className="text-gray-300 mx-2">|</span>
                                                <span className="text-gray-400">Lng:</span>
                                                <span className="font-semibold">{loc.lng}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
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
                                                    className="p-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200 group/edit"
                                                    title="Edit"
                                                    type="button"
                                                >
                                                    <Pencil size={18} className="group-hover/edit:scale-110 transition-transform" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(loc.id || loc.name)}
                                                    className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 group/delete"
                                                    title="Delete"
                                                    type="button"
                                                >
                                                    <Trash2 size={18} className="group-hover/delete:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
