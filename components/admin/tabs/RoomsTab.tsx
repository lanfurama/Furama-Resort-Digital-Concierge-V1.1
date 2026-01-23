import React, { useState } from 'react';
import { Plus, Trash2, Pencil, X, Upload, List, Grid3x3 } from 'lucide-react';
import { RoomType, Room, Location } from '../../../types';
import { addRoomType, updateRoomType, getRoomTypes, getLocations, addRoom, updateRoom, getRooms, importRoomsFromCSV } from '../../../services/dataService';

interface RoomsTabProps {
    roomTypes: RoomType[];
    rooms: Room[];
    locations: Location[];
    onDelete: (id: string, type: 'ROOM_TYPE' | 'ROOM') => Promise<void>;
    onRefresh: () => Promise<void>;
    setRoomTypes: (types: RoomType[]) => void;
    setRooms: (rooms: Room[]) => void;
    setLocations: (locations: Location[]) => void;
}

export const RoomsTab: React.FC<RoomsTabProps> = ({
    roomTypes,
    rooms,
    locations,
    onDelete,
    onRefresh,
    setRoomTypes,
    setRooms,
    setLocations
}) => {
    const [roomView, setRoomView] = useState<'TYPES' | 'LIST'>('TYPES');
    const [showRoomTypeForm, setShowRoomTypeForm] = useState(false);
    const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
    const [newRoomType, setNewRoomType] = useState<Partial<RoomType>>({ name: '', description: '', locationId: '', isVIP: false });
    
    const [showRoomForm, setShowRoomForm] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [newRoom, setNewRoom] = useState<Partial<Room>>({ number: '', typeId: '', status: 'Available', managementType: 'FURAMA_MANAGED' });
    const [roomCsvFile, setRoomCsvFile] = useState<File | null>(null);

    const handleAddRoomType = async () => {
        if (!newRoomType.name) {
            alert('Please enter a room type name.');
            return;
        }
        try {
            if (editingRoomType) {
                const updated = await updateRoomType(editingRoomType.id, {
                    name: newRoomType.name,
                    description: newRoomType.description || '',
                    locationId: newRoomType.locationId || '',
                    isVIP: newRoomType.isVIP || false
                });
                setEditingRoomType(null);
                alert(`Room type "${updated.name}" updated successfully!`);
            } else {
                const created = await addRoomType({
                    id: '',
                    name: newRoomType.name,
                    description: newRoomType.description || '',
                    locationId: newRoomType.locationId || '',
                    isVIP: newRoomType.isVIP || false
                });
                alert(`Room type "${created.name}" created successfully!`);
            }
            setNewRoomType({ name: '', description: '', locationId: '', isVIP: false });
            setShowRoomTypeForm(false);
            const refreshedRoomTypes = await getRoomTypes();
            const refreshedLocations = await getLocations();
            setRoomTypes(refreshedRoomTypes);
            setLocations(refreshedLocations);
            await onRefresh();
        } catch (error: any) {
            console.error('Failed to save room type:', error);
            alert(`Failed to save room type: ${error?.message || 'Unknown error'}`);
        }
    };

    const handleAddRoom = async () => {
        if (!newRoom.number || !newRoom.typeId) {
            alert('Please enter room number and select a type.');
            return;
        }
        try {
            if (editingRoom) {
                await updateRoom(editingRoom.id, newRoom as Room);
                alert(`Room ${newRoom.number} updated successfully!`);
            } else {
                await addRoom(newRoom as Room);
                alert(`Room ${newRoom.number} added successfully!`);
            }
            setShowRoomForm(false);
            const refreshedRooms = await getRooms();
            setRooms(refreshedRooms);
            await onRefresh();
        } catch (error) {
            console.error('Failed to save room:', error);
            alert('Failed to save room.');
        }
    };

    const processRoomCsvImport = async () => {
        if (!roomCsvFile) return;
        try {
            const text = await roomCsvFile.text();
            await importRoomsFromCSV(text);
            alert('Rooms imported successfully!');
            setRoomCsvFile(null);
            const refreshedRooms = await getRooms();
            setRooms(refreshedRooms);
            await onRefresh();
        } catch (error: any) {
            alert(`Failed to import rooms: ${error?.message || 'Unknown error'}`);
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    {roomView === 'TYPES' ? 'Room Definitions' : 'Room Inventory'}
                </h2>
                <div className="flex items-center space-x-2">
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                        <button onClick={() => setRoomView('TYPES')} className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 ${roomView === 'TYPES' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-gray-500'}`}>
                            <Grid3x3 size={14} />
                            <span>Types</span>
                        </button>
                        <button onClick={() => setRoomView('LIST')} className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 ${roomView === 'LIST' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-gray-500'}`}>
                            <List size={14} />
                            <span>List</span>
                        </button>
                    </div>
                    {roomView === 'TYPES' && (
                        <button
                            onClick={() => {
                                setEditingRoomType(null);
                                setNewRoomType({ name: '', description: '', locationId: '', isVIP: false });
                                setShowRoomTypeForm(!showRoomTypeForm);
                            }}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition"
                        >
                            {showRoomTypeForm ? <X size={18} /> : <Plus size={18} />}
                            <span>{showRoomTypeForm ? 'Cancel' : 'Add Type'}</span>
                        </button>
                    )}
                    {roomView === 'LIST' && (
                        <button
                            onClick={() => {
                                setEditingRoom(null);
                                setNewRoom({ number: '', typeId: '', status: 'Available', managementType: 'FURAMA_MANAGED' });
                                setShowRoomForm(!showRoomForm);
                            }}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition"
                        >
                            {showRoomForm ? <X size={18} /> : <Plus size={18} />}
                            <span>{showRoomForm ? 'Cancel' : 'Add Room'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Room Type Form */}
            {showRoomTypeForm && roomView === 'TYPES' && (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-100 mb-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">{editingRoomType ? 'Edit Room Type' : 'Create Room Type'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Type Name</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newRoomType.name || ''}
                                onChange={e => setNewRoomType({ ...newRoomType, name: e.target.value })}
                                placeholder="e.g. Lagoon Villa"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Linked Location (Optional)</label>
                            <select
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newRoomType.locationId || ''}
                                onChange={e => setNewRoomType({ ...newRoomType, locationId: e.target.value })}
                            >
                                <option value="">-- No Location Linked --</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                id="isVipCheckbox"
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                                checked={newRoomType.isVIP || false}
                                onChange={e => setNewRoomType({ ...newRoomType, isVIP: e.target.checked })}
                            />
                            <label htmlFor="isVipCheckbox" className="text-sm font-medium text-gray-700">Is VIP Villa?</label>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newRoomType.description || ''}
                                onChange={e => setNewRoomType({ ...newRoomType, description: e.target.value })}
                                placeholder="Brief description"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        {editingRoomType && (
                            <button
                                onClick={() => {
                                    setEditingRoomType(null);
                                    setNewRoomType({ name: '', description: '', locationId: '', isVIP: false });
                                    setShowRoomTypeForm(false);
                                }}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleAddRoomType}
                            className="bg-emerald-800 text-white px-6 py-2 rounded-lg text-sm font-bold"
                        >
                            {editingRoomType ? 'Update Type' : 'Create Type'}
                        </button>
                    </div>
                </div>
            )}

            {/* Room Form */}
            {showRoomForm && roomView === 'LIST' && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100 mb-6">
                    <div className="flex gap-8 flex-col md:flex-row">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Manual Room Entry</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Room Number</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                        placeholder="e.g. 105"
                                        value={newRoom.number || ''}
                                        onChange={e => setNewRoom({ ...newRoom, number: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Room Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                        value={newRoom.typeId || ''}
                                        onChange={e => setNewRoom({ ...newRoom, typeId: e.target.value })}
                                    >
                                        <option value="">-- Select Type --</option>
                                        {roomTypes.map(rt => (
                                            <option key={rt.id} value={rt.id}>{rt.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                        value={newRoom.status || 'Available'}
                                        onChange={e => setNewRoom({ ...newRoom, status: e.target.value as any })}
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Occupied">Occupied</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Management Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                        value={newRoom.managementType || 'FURAMA_MANAGED'}
                                        onChange={e => setNewRoom({ ...newRoom, managementType: e.target.value as any })}
                                    >
                                        <option value="FURAMA_MANAGED">Furama Managed</option>
                                        <option value="OWNER_MANAGED">Owner Managed</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleAddRoom} className="bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-bold w-full">Add Room</button>
                        </div>
                        <div className="w-px bg-gray-200 hidden md:block"></div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Bulk Import Rooms (CSV)</h3>
                            <p className="text-xs text-gray-500 mb-4">Format: RoomNumber, RoomTypeName (Must match existing Type)</p>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                                <input type="file" accept=".csv" onChange={(e) => setRoomCsvFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <Upload className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 font-medium">{roomCsvFile ? roomCsvFile.name : 'Click to Upload CSV'}</p>
                            </div>
                            <button onClick={processRoomCsvImport} disabled={!roomCsvFile} className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold w-full disabled:opacity-50">Process Import</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tables */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                {roomView === 'TYPES' ? (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600">Type Name</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Linked Location</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">VIP Status</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roomTypes.map((rt) => {
                                const linkedLoc = rt.locationId ? locations.find(l => String(l.id) === String(rt.locationId)) : null;
                                return (
                                    <tr key={rt.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{rt.name}</div>
                                            <div className="text-xs text-gray-500">{rt.description}</div>
                                        </td>
                                        <td className="p-4">
                                            {linkedLoc ? (
                                                <span className="flex items-center text-sm text-emerald-600">
                                                    {linkedLoc.name}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Unlinked</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {rt.isVIP ? (
                                                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold border border-amber-100">VIP</span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Standard</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => {
                                                    setEditingRoomType(rt);
                                                    setNewRoomType({
                                                        name: rt.name,
                                                        description: rt.description || '',
                                                        locationId: rt.locationId || '',
                                                        isVIP: rt.isVIP || false
                                                    });
                                                    setShowRoomTypeForm(true);
                                                }} className="text-emerald-600 hover:text-emerald-700 p-2" title="Edit"><Pencil size={16} /></button>
                                                <button onClick={() => onDelete(rt.id, 'ROOM_TYPE')} className="text-red-500 hover:text-red-700 p-2" title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600">Room #</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Type</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Management</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.map((r) => {
                                const typeObj = roomTypes.find(rt => rt.id === r.typeId);
                                return (
                                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-800">{r.number}</td>
                                        <td className="p-4 text-sm text-gray-600">{typeObj?.name || 'Unknown Type'}</td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {r.managementType === 'OWNER_MANAGED' ? (
                                                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold border border-amber-100">Owner</span>
                                            ) : (
                                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-100">Furama</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${r.status === 'Available' ? 'bg-green-100 text-green-700' :
                                                r.status === 'Occupied' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {r.status || 'Available'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingRoom(r);
                                                        setNewRoom({
                                                            number: r.number,
                                                            typeId: r.typeId,
                                                            status: r.status,
                                                            managementType: r.managementType || 'FURAMA_MANAGED'
                                                        });
                                                        setShowRoomForm(true);
                                                    }}
                                                    className="text-emerald-600 hover:text-emerald-700 p-2"
                                                    title="Edit"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => onDelete(r.id, 'ROOM')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};
