import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, X, Download, Copy, Check, RefreshCw } from 'lucide-react';
import { User, RoomType } from '../../../types';
import { addUser, updateUser, getUsers, generateCheckInCode, getGuestCSVContent, importGuestsFromCSV } from '../../../services/dataService';

interface GuestsTabProps {
    users: User[];
    roomTypes: RoomType[];
    onDelete: (id: string) => Promise<void>;
    onRefresh: () => Promise<void>;
    setUsers: (users: User[]) => void;
}

const getGuestStatus = (guest: User): 'Active' | 'Future' | 'Expired' => {
    const now = new Date();
    const checkIn = guest.checkIn ? new Date(guest.checkIn) : null;
    const checkOut = guest.checkOut ? new Date(guest.checkOut) : null;

    if (!checkIn) return 'Future';

    if (checkOut && checkOut < now) {
        return 'Expired';
    }

    if (checkIn > now) {
        return 'Future';
    }

    return 'Active';
};

export const GuestsTab: React.FC<GuestsTabProps> = ({ users, roomTypes, onDelete, onRefresh, setUsers }) => {
    const [guestStatusFilter, setGuestStatusFilter] = useState<'ALL' | 'Active' | 'Future' | 'Expired'>('ALL');
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [newGuest, setNewGuest] = useState<{ lastName: string, room: string, type: string, checkIn: string, checkOut: string, language: string }>({
        lastName: '', room: '', type: 'Ocean Suite', checkIn: '', checkOut: '', language: 'English'
    });
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [editingGuest, setEditingGuest] = useState<User | null>(null);
    const [showGuestEditForm, setShowGuestEditForm] = useState(false);
    const [editGuest, setEditGuest] = useState<Partial<User>>({ lastName: '', roomNumber: '', villaType: '', language: 'English', checkIn: '', checkOut: '' });
    const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

    const guestUsers = useMemo(() => {
        return users.filter(u => {
            if (u.role !== 'GUEST') return false;
            if (guestStatusFilter === 'ALL') return true;
            return getGuestStatus(u) === guestStatusFilter;
        });
    }, [users, guestStatusFilter]);

    const handleAddGuest = async () => {
        if (!newGuest.lastName || !newGuest.room) {
            alert('Please enter both last name and room number.');
            return;
        }
        try {
            await addUser({
                lastName: newGuest.lastName,
                roomNumber: newGuest.room,
                role: 'GUEST',
                department: 'All',
                villaType: newGuest.type,
                checkIn: newGuest.checkIn ? new Date(newGuest.checkIn).toISOString() : undefined,
                checkOut: newGuest.checkOut ? new Date(newGuest.checkOut).toISOString() : undefined,
                language: newGuest.language
            });
            alert(`Guest "${newGuest.lastName}" created successfully!`);
            setNewGuest({ lastName: '', room: '', type: 'Ocean Suite', checkIn: '', checkOut: '', language: 'English' });
            setShowGuestForm(false);
            const refreshedUsers = await getUsers();
            setUsers(refreshedUsers);
            await onRefresh();
        } catch (error: any) {
            console.error('Failed to add guest:', error);
            alert(`Failed to add guest: ${error?.message || 'Unknown error'}`);
        }
    };

    const handleUpdateGuest = async () => {
        if (!editGuest.lastName || !editGuest.roomNumber) {
            alert('Please enter last name and room number.');
            return;
        }
        try {
            if (editingGuest && editingGuest.id) {
                const userToUpdate: Partial<User> = {
                    ...editGuest,
                    checkIn: editGuest.checkIn && editGuest.checkIn.trim() !== ''
                        ? (editGuest.checkIn.includes('T') && !editGuest.checkIn.includes('Z')
                            ? new Date(editGuest.checkIn).toISOString()
                            : editGuest.checkIn)
                        : undefined,
                    checkOut: editGuest.checkOut && editGuest.checkOut.trim() !== ''
                        ? (editGuest.checkOut.includes('T') && !editGuest.checkOut.includes('Z')
                            ? new Date(editGuest.checkOut).toISOString()
                            : editGuest.checkOut)
                        : undefined
                };
                await updateUser(editingGuest.id, userToUpdate as User);
                setEditingGuest(null);
                alert(`Guest "${editGuest.lastName}" updated successfully!`);
                setEditGuest({ lastName: '', roomNumber: '', villaType: '', language: 'English', checkIn: '', checkOut: '' });
                setShowGuestEditForm(false);
                await onRefresh();
            }
        } catch (error) {
            console.error('Failed to save guest:', error);
            alert('Failed to save guest. Please try again.');
        }
    };

    const handleExportGuests = async () => {
        try {
            const csvContent = await getGuestCSVContent();
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `guests_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export guests:', error);
            alert('Failed to export guests.');
        }
    };

    const processCsvImport = async () => {
        if (!csvFile) return;
        try {
            const text = await csvFile.text();
            await importGuestsFromCSV(text);
            alert('Guests imported successfully!');
            setCsvFile(null);
            const refreshedUsers = await getUsers();
            setUsers(refreshedUsers);
            await onRefresh();
        } catch (error: any) {
            alert(`Failed to import guests: ${error?.message || 'Unknown error'}`);
        }
    };

    const formatForInput = (dateStr: string | undefined): string => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (e) {
            return '';
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">Guest Check-in Management</h2>
                <div className="flex items-center space-x-2">
                    <div className="flex space-x-2 bg-white p-1.5 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-1 px-2">
                            <select
                                className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
                                value={guestStatusFilter}
                                onChange={(e) => setGuestStatusFilter(e.target.value as 'ALL' | 'Active' | 'Future' | 'Expired')}
                            >
                                <option value="ALL">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Future">Future</option>
                                <option value="Expired">Expired</option>
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={handleExportGuests}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2  shadow-md active:scale-95"
                    >
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                    <button
                        onClick={() => setShowGuestForm(!showGuestForm)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2  shadow-md active:scale-95"
                    >
                        {showGuestForm ? <X size={18} /> : <Plus size={18} />}
                        <span>Add Guest</span>
                    </button>
                </div>
            </div>

            {/* Add Guest Form */}
            {showGuestForm && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100 mb-6">
                    <div className="flex gap-8 flex-col md:flex-row">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Manual Guest Entry</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                        value={newGuest.lastName}
                                        onChange={e => setNewGuest({ ...newGuest, lastName: e.target.value })}
                                        placeholder="e.g. Smith"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Room Number</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                        value={newGuest.room}
                                        onChange={e => setNewGuest({ ...newGuest, room: e.target.value })}
                                        placeholder="e.g. 101"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Villa Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                        value={newGuest.type}
                                        onChange={e => setNewGuest({ ...newGuest, type: e.target.value })}
                                    >
                                        {roomTypes.map(rt => (
                                            <option key={rt.id} value={rt.name}>{rt.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Language</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                        value={newGuest.language}
                                        onChange={e => setNewGuest({ ...newGuest, language: e.target.value })}
                                    >
                                        <option value="English">English</option>
                                        <option value="Vietnamese">Vietnamese</option>
                                        <option value="Korean">Korean</option>
                                        <option value="Japanese">Japanese</option>
                                        <option value="Chinese">Chinese</option>
                                        <option value="French">French</option>
                                        <option value="Russian">Russian</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Check-In Date</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                        value={newGuest.checkIn}
                                        onChange={e => setNewGuest({ ...newGuest, checkIn: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Check-Out Date</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                        value={newGuest.checkOut}
                                        onChange={e => setNewGuest({ ...newGuest, checkOut: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button onClick={handleAddGuest} className="bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-bold w-full">Add Guest</button>
                        </div>
                        <div className="w-px bg-gray-200 hidden md:block"></div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Bulk Import Guests (CSV)</h3>
                            <p className="text-xs text-gray-500 mb-4">Format: LastName, RoomNumber, VillaType, CheckIn, CheckOut, Language</p>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center  active:scale-95 cursor-pointer relative">
                                <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <Download className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 font-medium">{csvFile ? csvFile.name : 'Click to Upload CSV'}</p>
                            </div>
                            <button onClick={processCsvImport} disabled={!csvFile} className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold w-full disabled:opacity-50">Process Import</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guest Edit Modal */}
            {showGuestEditForm && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in"
                    onClick={() => {
                        setEditingGuest(null);
                        setEditGuest({ lastName: '', roomNumber: '', villaType: '', language: 'English', checkIn: '', checkOut: '' });
                        setShowGuestEditForm(false);
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[90vw] max-w-2xl p-6 animate-in slide-in-from-top-5 relative max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setEditingGuest(null);
                                setEditGuest({ lastName: '', roomNumber: '', villaType: '', language: 'English', checkIn: '', checkOut: '' });
                                setShowGuestEditForm(false);
                            }}
                            className="absolute top-4 right-4 text-gray-400  active:scale-95-colors"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 pr-8">Edit Guest</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={editGuest.lastName || ''}
                                    onChange={e => setEditGuest({ ...editGuest, lastName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Room Number</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={editGuest.roomNumber || ''}
                                    onChange={e => setEditGuest({ ...editGuest, roomNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Villa Type</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={editGuest.villaType || ''}
                                    onChange={e => setEditGuest({ ...editGuest, villaType: e.target.value })}
                                >
                                    <option value="">Select Villa Type</option>
                                    {roomTypes.map(rt => (
                                        <option key={rt.id} value={rt.name}>{rt.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Language</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={editGuest.language || 'English'}
                                    onChange={e => setEditGuest({ ...editGuest, language: e.target.value })}
                                >
                                    <option value="English">English</option>
                                    <option value="Vietnamese">Vietnamese</option>
                                    <option value="Korean">Korean</option>
                                    <option value="Japanese">Japanese</option>
                                    <option value="Chinese">Chinese</option>
                                    <option value="French">French</option>
                                    <option value="Russian">Russian</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Check-In Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900 cursor-pointer"
                                    value={formatForInput(editGuest.checkIn)}
                                    onChange={e => setEditGuest({ ...editGuest, checkIn: e.target.value || '' })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Check-Out Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900 cursor-pointer"
                                    value={formatForInput(editGuest.checkOut)}
                                    onChange={e => setEditGuest({ ...editGuest, checkOut: e.target.value || '' })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setEditingGuest(null);
                                    setEditGuest({ lastName: '', roomNumber: '', villaType: '', language: 'English', checkIn: '', checkOut: '' });
                                    setShowGuestEditForm(false);
                                }}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold "
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateGuest}
                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold "
                            >
                                Update Guest
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guests Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600">Guest Info</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Stay Duration</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Check-in Code</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {guestUsers.map((u) => {
                            const start = u.checkIn ? new Date(u.checkIn) : null;
                            const end = u.checkOut ? new Date(u.checkOut) : null;
                            const status = getGuestStatus(u);
                            let statusColor = 'bg-green-100 text-green-700';
                            if (status === 'Future') statusColor = 'bg-blue-100 text-blue-700';
                            else if (status === 'Expired') statusColor = 'bg-gray-100 text-gray-500';

                            return (
                                <tr key={u.id || u.roomNumber} className="border-b border-gray-100 ">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{u.lastName}</div>
                                        <div className="text-xs text-gray-500">Room: {u.roomNumber}</div>
                                        <div className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded w-fit mt-1 border border-emerald-100">
                                            {u.villaType} • {u.language || 'English'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs text-gray-600">
                                            <div>In: {start ? start.toLocaleDateString() : 'N/A'}</div>
                                            <div>Out: {end ? end.toLocaleDateString() : 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${statusColor}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {u.checkInCode ? (
                                            <div className="flex items-center gap-2">
                                                <code
                                                    onClick={async () => {
                                                        if (u.checkInCode) {
                                                            try {
                                                                await navigator.clipboard.writeText(u.checkInCode);
                                                                if (u.id) {
                                                                    setCopiedCodeId(u.id);
                                                                    setTimeout(() => setCopiedCodeId(null), 2000);
                                                                }
                                                            } catch (error) {
                                                                console.error('Failed to copy code:', error);
                                                                alert('Failed to copy code. Please try again.');
                                                            }
                                                        }
                                                    }}
                                                    className="text-xs font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded border border-gray-300 cursor-pointer  active:scale-95-colors select-all"
                                                    title="Click to copy"
                                                >
                                                    {u.checkInCode}
                                                </code>
                                                {copiedCodeId === u.id ? (
                                                    <Check size={14} className="text-green-600" />
                                                ) : (
                                                    <Copy
                                                        size={14}
                                                        className="text-gray-400  cursor-pointer"
                                                        onClick={async () => {
                                                            if (u.checkInCode) {
                                                                try {
                                                                    await navigator.clipboard.writeText(u.checkInCode);
                                                                    if (u.id) {
                                                                        setCopiedCodeId(u.id);
                                                                        setTimeout(() => setCopiedCodeId(null), 2000);
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Failed to copy code:', error);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        if (u.id) {
                                                            try {
                                                                const result = await generateCheckInCode(u.id);
                                                                alert(`New check-in code generated: ${result.checkInCode}`);
                                                                await onRefresh();
                                                            } catch (error) {
                                                                console.error('Failed to generate check-in code:', error);
                                                                alert('Failed to generate check-in code. Please try again.');
                                                            }
                                                        }
                                                    }}
                                                    className="text-emerald-600  p-1"
                                                    title="Regenerate Code"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    if (u.id) {
                                                        try {
                                                            const result = await generateCheckInCode(u.id);
                                                            alert(`Check-in code generated: ${result.checkInCode}`);
                                                            await onRefresh();
                                                        } catch (error) {
                                                            console.error('Failed to generate check-in code:', error);
                                                            alert('Failed to generate check-in code. Please try again.');
                                                        }
                                                    }
                                                }}
                                                className="text-xs text-emerald-600  px-2 py-1 border border-emerald-300 rounded "
                                                title="Generate Check-in Code"
                                            >
                                                Generate Code
                                            </button>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingGuest(u);
                                                    setEditGuest({
                                                        lastName: u.lastName,
                                                        roomNumber: u.roomNumber,
                                                        villaType: u.villaType || '',
                                                        language: u.language || 'English',
                                                        checkIn: formatForInput(u.checkIn),
                                                        checkOut: formatForInput(u.checkOut)
                                                    });
                                                    setShowGuestEditForm(true);
                                                }}
                                                className="text-emerald-600  p-2"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => onDelete(u.id || '')} className="text-red-500  p-2"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};
