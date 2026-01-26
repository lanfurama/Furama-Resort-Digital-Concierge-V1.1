import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, Key, X, Shield, Users, RefreshCw, Clock } from 'lucide-react';
import { User, UserRole, DriverSchedule } from '../../../types';
import { addUser, updateUser, getUsers, resetUserPassword, getAllDriverSchedulesByDateRange, upsertDriverSchedule, updateDriverSchedule, deleteDriverSchedule } from '../../../services/dataService';
import { useScheduleManagement } from '../../../hooks/useScheduleManagement';

interface UsersTabProps {
    users: User[];
    userRole: UserRole;
    onDelete: (id: string) => Promise<void>;
    onRefresh: () => Promise<void>;
    setUsers: (users: User[]) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, userRole, onDelete, onRefresh, setUsers }) => {
    const [staffRoleFilter, setStaffRoleFilter] = useState<UserRole | 'ALL'>('ALL');
    const [newUser, setNewUser] = useState<Partial<User>>({ role: UserRole.STAFF, department: 'Dining' });
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingStaff, setEditingStaff] = useState<User | null>(null);
    const [showStaffEditForm, setShowStaffEditForm] = useState(false);
    const [editStaff, setEditStaff] = useState<Partial<User>>({ lastName: '', roomNumber: '', department: 'Dining', role: UserRole.STAFF, vehicleType: 'NORMAL' });
    const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
    const [resetNewPassword, setResetNewPassword] = useState('');

    const scheduleManagement = useScheduleManagement('USERS', staffRoleFilter, users);
    const {
        driverSchedules,
        selectedDriverForSchedule,
        setSelectedDriverForSchedule,
        scheduleDateRange,
        setScheduleDateRange,
        editingSchedule,
        setEditingSchedule,
        newSchedule,
        setNewSchedule,
        refreshSchedules,
        saveSchedule,
        deleteSchedule
    } = scheduleManagement;

    const staffUsers = useMemo(() => {
        return users.filter(u => {
            if (u.role === UserRole.GUEST) return false;
            if (staffRoleFilter === 'ALL') return true;
            return u.role === staffRoleFilter;
        });
    }, [users, staffRoleFilter]);

    const handleAddUser = async () => {
        if (!newUser.lastName || !newUser.roomNumber) {
            alert('Please enter both name and username.');
            return;
        }
        try {
            await addUser({
                lastName: newUser.lastName,
                roomNumber: newUser.roomNumber,
                role: newUser.role || UserRole.STAFF,
                department: newUser.department || 'All',
                villaType: 'Staff',
                password: '123'
            });
            alert(`Staff "${newUser.lastName}" created successfully!`);
            setNewUser({ role: UserRole.STAFF, department: 'Dining' });
            setShowUserForm(false);
            const refreshedUsers = await getUsers();
            setUsers(refreshedUsers);
            await onRefresh();
        } catch (error: any) {
            console.error('Failed to add user:', error);
            alert(`Failed to add user: ${error?.message || 'Unknown error'}`);
        }
    };

    const handleUpdateStaff = async () => {
        if (!editStaff.lastName || !editStaff.roomNumber) {
            alert('Please enter last name and ID.');
            return;
        }
        try {
            if (editingStaff && editingStaff.id) {
                await updateUser(editingStaff.id, editStaff as User);
                const updatedUsers = await getUsers();
                setUsers(updatedUsers);
                alert(`Staff "${editStaff.lastName}" updated successfully!`);
                setEditingStaff(null);
                setEditStaff({ lastName: '', roomNumber: '', department: 'Dining', role: UserRole.STAFF });
                setShowStaffEditForm(false);
            }
        } catch (error) {
            console.error('Error updating staff:', error);
            alert('Failed to update staff. Please try again.');
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">Staff Management</h2>
                {userRole === UserRole.ADMIN && (
                    <div className="flex items-center space-x-2">
                        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                            <button onClick={() => setStaffRoleFilter('ALL')} className={`px-3 py-1 text-xs rounded ${staffRoleFilter === 'ALL' ? 'bg-gray-100 text-gray-800 font-bold' : 'text-gray-500'}`}>All</button>
                            <button onClick={() => setStaffRoleFilter(UserRole.ADMIN)} className={`px-3 py-1 text-xs rounded ${staffRoleFilter === UserRole.ADMIN ? 'bg-red-100 text-red-800 font-bold' : 'text-gray-500'}`}>Admin</button>
                            <button onClick={() => setStaffRoleFilter(UserRole.SUPERVISOR)} className={`px-3 py-1 text-xs rounded ${staffRoleFilter === UserRole.SUPERVISOR ? 'bg-amber-100 text-amber-800 font-bold' : 'text-gray-500'}`}>Supervisor</button>
                            <button onClick={() => setStaffRoleFilter(UserRole.STAFF)} className={`px-3 py-1 text-xs rounded ${staffRoleFilter === UserRole.STAFF ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-500'}`}>Staff</button>
                            <button onClick={() => setStaffRoleFilter(UserRole.DRIVER)} className={`px-3 py-1 text-xs rounded ${staffRoleFilter === UserRole.DRIVER ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-gray-500'}`}>Driver</button>
                            <button onClick={() => setStaffRoleFilter(UserRole.RECEPTION)} className={`px-3 py-1 text-xs rounded ${staffRoleFilter === UserRole.RECEPTION ? 'bg-purple-100 text-purple-800 font-bold' : 'text-gray-500'}`}>Reception</button>
                        </div>
                        <button
                            onClick={() => setShowUserForm(!showUserForm)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2  shadow-md active:scale-95"
                        >
                            {showUserForm ? <X size={18} /> : <Plus size={18} />}
                            <span>Add Staff</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Add User Form */}
            {showUserForm && userRole === UserRole.ADMIN && (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-100 mb-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Create New Staff Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Display Name</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newUser.lastName || ''}
                                onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                                placeholder="e.g. StaffName"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Username</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newUser.roomNumber || ''}
                                onChange={e => setNewUser({ ...newUser, roomNumber: e.target.value })}
                                placeholder="Login ID"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                            <select
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newUser.role}
                                onChange={e => {
                                    const role = e.target.value as UserRole;
                                    setNewUser({
                                        ...newUser,
                                        role,
                                        vehicleType: role === UserRole.DRIVER ? 'NORMAL' : undefined
                                    });
                                }}
                            >
                                <option value={UserRole.STAFF}>Staff</option>
                                <option value={UserRole.DRIVER}>Driver</option>
                                <option value={UserRole.RECEPTION}>Reception</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                                <option value={UserRole.SUPERVISOR}>Supervisor</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Department</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newUser.department || 'Dining'}
                                onChange={e => setNewUser({ ...newUser, department: e.target.value as any })}
                                placeholder="e.g. Dining, Reception"
                            />
                        </div>
                        {newUser.role === UserRole.DRIVER && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Vehicle Type</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newUser.vehicleType || 'NORMAL'}
                                    onChange={e => setNewUser({ ...newUser, vehicleType: e.target.value as 'VIP' | 'NORMAL' })}
                                >
                                    <option value="NORMAL">Normal Buggy</option>
                                    <option value="VIP">VIP Buggy</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                setShowUserForm(false);
                                setNewUser({ role: UserRole.STAFF, department: 'Dining' });
                            }}
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddUser}
                            className="bg-emerald-800 text-white px-6 py-2 rounded-lg text-sm font-bold"
                        >
                            Create Staff
                        </button>
                    </div>
                </div>
            )}

            {/* Staff Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto mb-6">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600">Name / ID</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Role</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Department</th>
                            {staffRoleFilter === UserRole.DRIVER && (
                                <th className="p-4 text-sm font-semibold text-gray-600">Vehicle Type</th>
                            )}
                            <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffUsers.map((u) => (
                            <tr key={u.id || u.roomNumber} className="border-b border-gray-100 ">
                                <td className="p-4">
                                    <div className="font-bold text-gray-800">{u.lastName}</div>
                                    <div className="text-xs text-gray-500">ID: {u.roomNumber}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === UserRole.ADMIN ? 'bg-red-100 text-red-800' :
                                        u.role === UserRole.SUPERVISOR ? 'bg-amber-100 text-amber-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-gray-600 flex items-center">
                                        {u.role === UserRole.ADMIN ? <Shield size={14} className="mr-1 text-amber-500" /> :
                                            u.role === UserRole.SUPERVISOR ? <Users size={14} className="mr-1 text-amber-500" /> :
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>}
                                        {u.department || 'General'}
                                    </span>
                                </td>
                                {staffRoleFilter === UserRole.DRIVER && (
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.vehicleType === 'VIP' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {u.vehicleType || 'NORMAL'}
                                        </span>
                                    </td>
                                )}
                                <td className="p-4 text-right flex justify-end space-x-1">
                                    <button
                                        onClick={() => {
                                            setEditingStaff(u);
                                            setEditStaff({
                                                lastName: u.lastName || '',
                                                roomNumber: u.roomNumber || '',
                                                department: u.department || 'Dining',
                                                role: u.role || UserRole.STAFF,
                                                vehicleType: u.vehicleType || 'NORMAL'
                                            });
                                            setShowStaffEditForm(true);
                                        }}
                                        className="text-blue-500  p-2"
                                        title="Edit Staff"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => { setResetPasswordUserId(u.id || ''); setResetNewPassword(''); }} className="text-amber-500  p-2"><Key size={16} /></button>
                                    <button onClick={() => onDelete(u.id || '')} className="text-red-500  p-2"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Driver Schedule Management */}
            {userRole === UserRole.ADMIN && staffRoleFilter === UserRole.DRIVER && (
                <div className="mt-8 space-y-6 border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Driver Schedule Management</h3>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-semibold text-gray-700">Date Range:</label>
                            <input
                                type="date"
                                value={scheduleDateRange.start}
                                onChange={(e) => setScheduleDateRange({ ...scheduleDateRange, start: e.target.value })}
                                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={scheduleDateRange.end}
                                onChange={(e) => setScheduleDateRange({ ...scheduleDateRange, end: e.target.value })}
                                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                            />
                            <button
                                onClick={refreshSchedules}
                                className="px-4 py-1.5 bg-emerald-600 text-white rounded  text-sm font-semibold flex items-center gap-2"
                            >
                                <RefreshCw size={14} /> Refresh
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Driver:</label>
                        <select
                            value={selectedDriverForSchedule || ''}
                            onChange={(e) => setSelectedDriverForSchedule(e.target.value || null)}
                            className="w-full md:w-64 border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                            <option value="">All Drivers</option>
                            {users.filter(u => u.role === UserRole.DRIVER).map(driver => (
                                <option key={driver.id} value={driver.id}>
                                    {driver.lastName || `Driver ${driver.id}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedDriverForSchedule && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">Driver Schedules</h3>
                                        <p className="text-sm text-gray-500 mt-1">Manage work shifts and days off for drivers</p>
                                    </div>
                                    {editingSchedule && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-lg">
                                            <Pencil size={14} className="text-amber-700" />
                                            <span className="text-sm font-semibold text-amber-800">Editing Schedule</span>
                                            <button
                                                onClick={() => {
                                                    setEditingSchedule(null);
                                                    setNewSchedule({
                                                        date: new Date().toISOString().split('T')[0],
                                                        shift_start: '08:00:00',
                                                        shift_end: '17:00:00',
                                                        is_day_off: false,
                                                        notes: null
                                                    });
                                                }}
                                                className="ml-2 text-amber-700 "
                                                title="Cancel Edit"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4" data-schedule-form>
                                <div className={`space-y-4 ${editingSchedule ? 'bg-amber-50/50 p-4 rounded-lg border-2 border-amber-200' : ''}`}>
                                    {editingSchedule && (
                                        <div className="mb-3 p-2 bg-amber-100 border border-amber-300 rounded text-sm text-amber-800">
                                            <strong>Editing:</strong> Schedule for {editingSchedule.date} - Click "Update Schedule" to save changes or click X to cancel.
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                                            <input
                                                type="date"
                                                className={`w-full border rounded p-2 text-sm ${editingSchedule ? 'border-amber-400 bg-white' : 'border-gray-300'}`}
                                                value={newSchedule.date}
                                                onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Shift Start</label>
                                            <input
                                                type="time"
                                                className={`w-full border rounded p-2 text-sm ${editingSchedule ? 'border-amber-400 bg-white' : 'border-gray-300'}`}
                                                value={newSchedule.shift_start}
                                                onChange={(e) => setNewSchedule({ ...newSchedule, shift_start: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Shift End</label>
                                            <input
                                                type="time"
                                                className={`w-full border rounded p-2 text-sm ${editingSchedule ? 'border-amber-400 bg-white' : 'border-gray-300'}`}
                                                value={newSchedule.shift_end}
                                                onChange={(e) => setNewSchedule({ ...newSchedule, shift_end: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <button
                                                onClick={saveSchedule}
                                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold active:scale-95 ${
                                                    editingSchedule 
                                                        ? 'bg-amber-600  text-white' 
                                                        : 'bg-emerald-600  text-white'
                                                }`}
                                            >
                                                {editingSchedule ? 'Update' : 'Add'} Schedule
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={newSchedule.is_day_off}
                                            onChange={(e) => setNewSchedule({ ...newSchedule, is_day_off: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm text-gray-700">Day Off</label>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Notes (Optional)</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2 text-sm"
                                            value={newSchedule.notes || ''}
                                            onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value || null })}
                                            placeholder="Additional notes..."
                                        />
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">Existing Schedules:</h4>
                                    {driverSchedules.filter(s => s.driver_id === selectedDriverForSchedule).length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            No schedules found for this driver in the selected date range.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {driverSchedules.filter(s => s.driver_id === selectedDriverForSchedule).map((schedule) => (
                                                <div 
                                                    key={schedule.id} 
                                                    className={`flex items-center justify-between p-3 rounded-lg active:scale-95-all ${
                                                        editingSchedule?.id === schedule.id 
                                                            ? 'bg-amber-100 border-2 border-amber-400 shadow-md' 
                                                            : 'bg-gray-50 border border-gray-200 '
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <Clock size={16} className={editingSchedule?.id === schedule.id ? 'text-amber-600' : 'text-gray-400'} />
                                                        <div>
                                                            <div className={`font-semibold text-sm ${editingSchedule?.id === schedule.id ? 'text-amber-900' : 'text-gray-800'}`}>
                                                                {schedule.date}
                                                            </div>
                                                            <div className={`text-xs ${editingSchedule?.id === schedule.id ? 'text-amber-700' : 'text-gray-500'}`}>
                                                                {schedule.is_day_off ? (
                                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">Day Off</span>
                                                                ) : (
                                                                    `${schedule.shift_start.substring(0, 5)} - ${schedule.shift_end.substring(0, 5)}`
                                                                )}
                                                                {schedule.notes && (
                                                                    <span className="ml-2 text-gray-400">• {schedule.notes}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingSchedule(schedule);
                                                                setNewSchedule({
                                                                    date: schedule.date,
                                                                    shift_start: schedule.shift_start,
                                                                    shift_end: schedule.shift_end,
                                                                    is_day_off: schedule.is_day_off,
                                                                    notes: schedule.notes
                                                                });
                                                                // Scroll to form
                                                                setTimeout(() => {
                                                                    const formElement = document.querySelector('[data-schedule-form]');
                                                                    if (formElement) {
                                                                        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                                    }
                                                                }, 100);
                                                            }}
                                                            className={`p-1.5 rounded active:scale-95 ${
                                                                editingSchedule?.id === schedule.id 
                                                                    ? 'bg-amber-600 text-white ' 
                                                                    : 'text-emerald-600  '
                                                            }`}
                                                            title="Edit Schedule"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteSchedule(schedule.driver_id, schedule.date)}
                                                            className="text-red-500   p-1.5 rounded active:scale-95"
                                                            title="Delete Schedule"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Staff Edit Modal */}
            {showStaffEditForm && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in"
                    onClick={() => {
                        setEditingStaff(null);
                        setEditStaff({ lastName: '', roomNumber: '', department: 'Dining', role: UserRole.STAFF, vehicleType: 'NORMAL' });
                        setShowStaffEditForm(false);
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[90vw] max-w-lg p-6 animate-in slide-in-from-top-5 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setEditingStaff(null);
                                setEditStaff({ lastName: '', roomNumber: '', department: 'Dining', role: UserRole.STAFF, vehicleType: 'NORMAL' });
                                setShowStaffEditForm(false);
                            }}
                            className="absolute top-4 right-4 text-gray-400  active:scale-95"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 pr-8">Edit Staff</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={editStaff.lastName || ''}
                                    onChange={e => setEditStaff({ ...editStaff, lastName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">ID / Room Number</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={editStaff.roomNumber || ''}
                                    onChange={e => setEditStaff({ ...editStaff, roomNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Department</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={editStaff.department || 'Dining'}
                                    onChange={e => setEditStaff({ ...editStaff, department: e.target.value as any })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={editStaff.role || UserRole.STAFF}
                                    onChange={e => setEditStaff({ ...editStaff, role: e.target.value as UserRole })}
                                >
                                    <option value={UserRole.STAFF}>Staff</option>
                                    <option value={UserRole.DRIVER}>Driver</option>
                                    <option value={UserRole.RECEPTION}>Reception</option>
                                    <option value={UserRole.ADMIN}>Admin</option>
                                    <option value={UserRole.SUPERVISOR}>Supervisor</option>
                                </select>
                            </div>
                            {editStaff.role === UserRole.DRIVER && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vehicle Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                        value={editStaff.vehicleType || 'NORMAL'}
                                        onChange={e => setEditStaff({ ...editStaff, vehicleType: e.target.value as 'VIP' | 'NORMAL' })}
                                    >
                                        <option value="NORMAL">Normal Buggy</option>
                                        <option value="VIP">VIP Buggy</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    onClick={() => {
                                        setEditingStaff(null);
                                        setEditStaff({ lastName: '', roomNumber: '', department: 'Dining', role: UserRole.STAFF, vehicleType: 'NORMAL' });
                                        setShowStaffEditForm(false);
                                    }}
                                    className="px-4 py-2 bg-gray-200  text-gray-700 rounded-lg font-medium active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateStaff}
                                    className="px-4 py-2 bg-blue-600  text-white rounded-lg font-medium active:scale-95"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetPasswordUserId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[90vw] max-w-md p-6 relative">
                        <button
                            onClick={() => setResetPasswordUserId(null)}
                            className="absolute top-4 right-4 text-gray-400 "
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Reset Password</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">New Password</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                    value={resetNewPassword}
                                    onChange={(e) => setResetNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setResetPasswordUserId(null)}
                                    className="px-4 py-2 bg-gray-200  text-gray-700 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!resetNewPassword) {
                                            alert('Please enter a new password.');
                                            return;
                                        }
                                        try {
                                            await resetUserPassword(resetPasswordUserId, resetNewPassword);
                                            alert('Password reset successfully!');
                                            setResetPasswordUserId(null);
                                            setResetNewPassword('');
                                        } catch (error: any) {
                                            alert(`Failed to reset password: ${error?.message || 'Unknown error'}`);
                                        }
                                    }}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded font-bold"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
