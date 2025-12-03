
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Utensils, Sparkles, X, Calendar, Megaphone, BrainCircuit, Filter, Users, Shield, FileText, Upload, UserCheck, Download, Home, List, History, Clock, Star, Key } from 'lucide-react';
import { getLocations, getLocationsSync, addLocation, deleteLocation, getMenu, getMenuSync, addMenuItem, deleteMenuItem, getEvents, getEventsSync, addEvent, deleteEvent, getPromotions, getPromotionsSync, addPromotion, deletePromotion, getKnowledgeBase, getKnowledgeBaseSync, addKnowledgeItem, deleteKnowledgeItem, getUsers, addUser, deleteUser, resetUserPassword, importGuestsFromCSV, getGuestCSVContent, getRoomTypes, addRoomType, updateRoomType, deleteRoomType, getRooms, addRoom, deleteRoom, importRoomsFromCSV, getUnifiedHistory } from '../services/dataService';
import { parseAdminInput, generateTranslations } from '../services/geminiService';
import { Location, MenuItem, ResortEvent, Promotion, KnowledgeItem, User, UserRole, Department, RoomType, Room } from '../types';

interface AdminPortalProps {
    onLogout: () => void;
    user: User;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ onLogout, user }) => {
    const [tab, setTab] = useState<'LOCATIONS' | 'MENU' | 'EVENTS' | 'PROMOS' | 'KNOWLEDGE' | 'USERS' | 'GUESTS' | 'ROOMS' | 'HISTORY'>('LOCATIONS');
    
    // Data State
    const [locations, setLocations] = useState<Location[]>([]);
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [events, setEvents] = useState<ResortEvent[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [serviceHistory, setServiceHistory] = useState<any[]>([]);
    
    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load locations first - CRITICAL for room types to match location IDs
                let locationsData: Location[];
                try {
                    locationsData = await getLocations();
                    console.log('Locations loaded from database:', locationsData);
                } catch (error) {
                    console.error('Failed to load locations from database, using sync:', error);
                    locationsData = getLocationsSync();
                }
                
                const [menuData, eventsData, promotionsData, roomTypesData] = await Promise.all([
                    getMenu().catch(() => getMenuSync()),
                    getEvents().catch(() => getEventsSync()),
                    getPromotions().catch(() => getPromotionsSync()),
                    getRoomTypes().catch(() => [])
                ]);
                
                // Load knowledge items from API
                let knowledgeData: KnowledgeItem[];
                try {
                    knowledgeData = await getKnowledgeBase();
                    console.log('Knowledge items loaded from database:', knowledgeData);
                } catch (error) {
                    console.error('Failed to load knowledge items from database:', error);
                    knowledgeData = getKnowledgeBaseSync();
                }
                
                setLocations(locationsData);
                setMenu(menuData);
                setEvents(eventsData);
                setPromotions(promotionsData);
                setRoomTypes(roomTypesData);
                setKnowledge(knowledgeData);
                // Load users from API
                try {
                    const usersData = await getUsers();
                    setUsers(usersData);
                    console.log('Users loaded from database:', usersData);
                } catch (error) {
                    console.error('Failed to load users from database:', error);
                    setUsers(getUsersSync());
                }
                setServiceHistory([...getUnifiedHistory()]);
                
                // Debug: Check location ID matches
                console.log('Data loaded - Checking location matches:', {
                    locations: locationsData.map(l => ({ id: l.id, name: l.name })),
                    roomTypes: roomTypesData.map(rt => ({
                        id: rt.id,
                        name: rt.name,
                        locationId: rt.locationId,
                        matchedLocation: rt.locationId ? locationsData.find(l => String(l.id) === String(rt.locationId))?.name || 'NOT FOUND' : 'NONE'
                    }))
                });
            } catch (error) {
                console.error('Failed to load data:', error);
                // Fallback to sync versions
                const fallbackLocations = getLocationsSync();
                setLocations(fallbackLocations);
                setMenu(getMenuSync());
                setEvents(getEventsSync());
                setPromotions(getPromotionsSync());
                setKnowledge(getKnowledgeBaseSync());
                setUsers(getUsersSync());
                setServiceHistory([...getUnifiedHistory()]);
            }
        };
        
        loadData();
        getRooms().then(setRooms).catch(console.error);
    }, []);
    
    // UI State
    const [isParsing, setIsParsing] = useState(false);
    const [aiInput, setAiInput] = useState('');
    const [showAiInput, setShowAiInput] = useState(false);
    const [menuFilter, setMenuFilter] = useState<'ALL' | 'Dining' | 'Spa'>('ALL');

    // New User State (Staff)
    const [newUser, setNewUser] = useState<Partial<User>>({ role: UserRole.STAFF, department: 'Dining' });
    const [showUserForm, setShowUserForm] = useState(false);

    // Reset Password State
    const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
    const [resetNewPassword, setResetNewPassword] = useState('');

    // Guest Management State
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [newGuest, setNewGuest] = useState<{lastName: string, room: string, type: string, checkIn: string, checkOut: string, language: string}>({
        lastName: '', room: '', type: 'Ocean Suite', checkIn: '', checkOut: '', language: 'English'
    });
    const [csvFile, setCsvFile] = useState<File | null>(null);

    // Rooms Tab State
    const [roomView, setRoomView] = useState<'TYPES' | 'LIST'>('TYPES');
    const [showRoomTypeForm, setShowRoomTypeForm] = useState(false);
    const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
    const [newRoomType, setNewRoomType] = useState<Partial<RoomType>>({ name: '', description: '', locationId: '' });
    
    const [showRoomForm, setShowRoomForm] = useState(false);
    const [newRoom, setNewRoom] = useState<{number: string, typeId: string}>({ number: '', typeId: '' });
    const [roomCsvFile, setRoomCsvFile] = useState<File | null>(null);

    // History Tab State
    const [historyFilterType, setHistoryFilterType] = useState<string>('ALL');
    const [historyFilterDate, setHistoryFilterDate] = useState<string>('');

    const refreshData = async () => {
        // Load data asynchronously from API
        const [locationsData, menuData, eventsData, promotionsData, knowledgeData] = await Promise.all([
            getLocations().catch(() => getLocationsSync()),
            getMenu().catch(() => getMenuSync()),
            getEvents().catch(() => getEventsSync()),
            getPromotions().catch(() => getPromotionsSync()),
            getKnowledgeBase().catch(() => getKnowledgeBaseSync())
        ]);
        
        setLocations(locationsData);
        setMenu(menuData);
        setEvents(eventsData);
        setPromotions(promotionsData);
        setKnowledge(knowledgeData);
        // Refresh users from API
        try {
            const usersData = await getUsers();
            setUsers(usersData);
            console.log('Users refreshed:', usersData);
        } catch (error) {
            console.error('Failed to refresh users:', error);
            setUsers(getUsersSync());
        }
        // Refresh room types and rooms asynchronously
        getRoomTypes().then(setRoomTypes).catch(console.error);
        getRooms().then(setRooms).catch(console.error);
        setServiceHistory([...getUnifiedHistory()]);
    };

    const handleAiSubmit = async () => {
        if (!aiInput.trim()) return;
        setIsParsing(true);
        
        let type: any = 'LOCATION';
        if (tab === 'MENU') type = 'MENU_ITEM';
        if (tab === 'EVENTS') type = 'RESORT_EVENT';
        if (tab === 'PROMOS') type = 'PROMOTION';
        if (tab === 'KNOWLEDGE') type = 'KNOWLEDGE_ITEM';
        if (tab === 'ROOMS' && roomView === 'LIST') type = 'ROOM_INVENTORY';

        const result = await parseAdminInput(aiInput, type);
        
        // Auto-Translate Content if applicable
        if (result && (tab === 'MENU' || tab === 'EVENTS' || tab === 'PROMOS')) {
             let contentToTranslate: Record<string, string> = {};
             if (tab === 'MENU') {
                 contentToTranslate = { name: result.name, description: result.description };
             } else if (tab === 'EVENTS') {
                 contentToTranslate = { title: result.title, description: result.description, location: result.location };
             } else if (tab === 'PROMOS') {
                 contentToTranslate = { title: result.title, description: result.description, discount: result.discount };
             }

             if (Object.keys(contentToTranslate).length > 0) {
                 const translations = await generateTranslations(contentToTranslate);
                 result.translations = translations;
             }
        }

        setIsParsing(false);

        if (result) {
            try {
                if (tab === 'LOCATIONS') await addLocation(result as Location);
                else if (tab === 'MENU') {
                    await addMenuItem(result as MenuItem);
                    // Refresh menu specifically after adding
                    try {
                        const refreshedMenu = await getMenu();
                        setMenu(refreshedMenu);
                        console.log('Menu refreshed after add:', refreshedMenu);
                    } catch (error) {
                        console.error('Failed to refresh menu after add:', error);
                    }
                }
                else if (tab === 'EVENTS') {
                    await addEvent(result as ResortEvent);
                    // Refresh events specifically after adding
                    try {
                        const refreshedEvents = await getEvents();
                        setEvents(refreshedEvents);
                        console.log('Events refreshed after add:', refreshedEvents);
                    } catch (error) {
                        console.error('Failed to refresh events after add:', error);
                    }
                }
                else if (tab === 'PROMOS') {
                    await addPromotion(result as Promotion);
                    // Refresh promotions specifically after adding
                    try {
                        const refreshedPromotions = await getPromotions();
                        setPromotions(refreshedPromotions);
                        console.log('Promotions refreshed after add:', refreshedPromotions);
                    } catch (error) {
                        console.error('Failed to refresh promotions after add:', error);
                    }
                }
                else if (tab === 'KNOWLEDGE') {
                    await addKnowledgeItem(result as KnowledgeItem);
                    // Refresh knowledge specifically after adding
                    try {
                        const refreshedKnowledge = await getKnowledgeBase();
                        setKnowledge(refreshedKnowledge);
                        console.log('Knowledge refreshed after add:', refreshedKnowledge);
                    } catch (error) {
                        console.error('Failed to refresh knowledge after add:', error);
                    }
                }
                else if (tab === 'ROOMS' && roomView === 'LIST') {
                 // Map typeName to TypeId
                 const typeName = result.typeName;
                 const typeObj = roomTypes.find(rt => rt.name.toLowerCase() === typeName.toLowerCase());
                 if (typeObj) {
                     await addRoom({ id: '', number: result.number, typeId: typeObj.id, status: 'Available' });
                 } else {
                     alert(`Room Type '${typeName}' not found. Please create it first.`);
                     return;
                 }
            }
            
            await refreshData();
            setAiInput('');
            setShowAiInput(false);
            } catch (error: any) {
                console.error('Failed to add item:', error);
                alert(`Failed to add item: ${error?.message || 'Unknown error'}. Please check console for details.`);
            }
        }
    };

    const handleAddUser = async () => {
        if (!newUser.lastName || !newUser.roomNumber) {
            alert('Please enter both name and username.');
            return;
        }
        try {
            console.log('Adding user - Input:', newUser);
            await addUser({
                lastName: newUser.lastName,
                roomNumber: newUser.roomNumber,
                role: newUser.role || UserRole.STAFF,
                department: newUser.department || 'All',
                villaType: 'Staff',
                password: '123' // Default password
            });
            console.log('User added successfully');
            alert(`Staff "${newUser.lastName}" created successfully!`);
            setNewUser({ role: UserRole.STAFF, department: 'Dining' });
            setShowUserForm(false);
            // Refresh users specifically after adding
            try {
                const refreshedUsers = await getUsers();
                setUsers(refreshedUsers);
                console.log('Users refreshed after add:', refreshedUsers);
            } catch (error) {
                console.error('Failed to refresh users after add:', error);
            }
            await refreshData();
        } catch (error: any) {
            console.error('Failed to add user:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            alert(`Failed to add user: ${errorMessage}. Please check console for details.`);
        }
    };

    const handleAddGuest = async () => {
        if (!newGuest.lastName || !newGuest.room) {
            alert('Please enter both last name and room number.');
            return;
        }
        try {
            console.log('Adding guest - Input:', newGuest);
            await addUser({
                lastName: newGuest.lastName,
                roomNumber: newGuest.room,
                role: UserRole.GUEST,
                department: 'All',
                villaType: newGuest.type,
                checkIn: newGuest.checkIn ? new Date(newGuest.checkIn).toISOString() : undefined,
                checkOut: newGuest.checkOut ? new Date(newGuest.checkOut).toISOString() : undefined,
                language: newGuest.language
            });
            console.log('Guest added successfully');
            alert(`Guest "${newGuest.lastName}" created successfully!`);
            setNewGuest({ lastName: '', room: '', type: 'Ocean Suite', checkIn: '', checkOut: '', language: 'English' });
            setShowGuestForm(false);
            // Refresh users specifically after adding
            try {
                const refreshedUsers = await getUsers();
                setUsers(refreshedUsers);
                console.log('Users refreshed after add:', refreshedUsers);
            } catch (error) {
                console.error('Failed to refresh users after add:', error);
            }
            await refreshData();
        } catch (error: any) {
            console.error('Failed to add guest:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            alert(`Failed to add guest: ${errorMessage}. Please check console for details.`);
        }
    };

    const handleAddRoomType = async () => {
        if (!newRoomType.name) {
            alert('Please enter a room type name.');
            return;
        }
        try {
            if (editingRoomType) {
                // Update existing room type
                console.log('Updating room type - Editing:', editingRoomType);
                console.log('Updating room type - New Data:', newRoomType);
                const updated = await updateRoomType(editingRoomType.id, {
                    name: newRoomType.name,
                    description: newRoomType.description || '',
                    locationId: newRoomType.locationId || '' // Ensure it's a string, empty string will be converted to null
                });
                console.log('Room type updated successfully:', updated);
                setEditingRoomType(null);
                alert(`Room type "${updated.name}" updated successfully!`);
            } else {
                // Create new room type
                console.log('Creating new room type - Input:', newRoomType);
                const created = await addRoomType({
                    id: '', // Handled by service
                    name: newRoomType.name,
                    description: newRoomType.description || '',
                    locationId: newRoomType.locationId || '' // Ensure it's a string, empty string will be converted to null
                });
                console.log('Room type created successfully:', created);
                alert(`Room type "${created.name}" created successfully!`);
            }
            setNewRoomType({ name: '', description: '', locationId: '' });
            setShowRoomTypeForm(false);
            // Refresh room types and locations to ensure data is in sync
            let refreshedLocations: Location[];
            try {
                refreshedLocations = await getLocations();
                console.log('Locations refreshed from database:', refreshedLocations);
            } catch (error) {
                console.error('Failed to refresh locations from database:', error);
                refreshedLocations = getLocationsSync();
            }
            
            const refreshedRoomTypes = await getRoomTypes();
            setRoomTypes(refreshedRoomTypes);
            setLocations(refreshedLocations);
            
            console.log('Room types refreshed:', refreshedRoomTypes);
            console.log('Locations refreshed:', refreshedLocations);
            console.log('Checking location matches:', refreshedRoomTypes.map(rt => ({
                name: rt.name,
                locationId: rt.locationId,
                locationIdType: typeof rt.locationId,
                matchedLocation: rt.locationId ? refreshedLocations.find(l => {
                    const match = String(l.id) === String(rt.locationId);
                    if (!match && rt.locationId) {
                        console.log('Location ID mismatch:', {
                            roomTypeLocationId: rt.locationId,
                            locationIdType: typeof rt.locationId,
                            availableLocationIds: refreshedLocations.map(l => ({ id: l.id, idType: typeof l.id, name: l.name }))
                        });
                    }
                    return match;
                })?.name || 'NOT FOUND' : 'NONE'
            })));
        } catch (error: any) {
            console.error('Failed to save room type:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            alert(`Failed to save room type: ${errorMessage}. Please check the console for details.`);
        }
    };

    const handleEditRoomType = (rt: RoomType) => {
        setEditingRoomType(rt);
        setNewRoomType({
            name: rt.name,
            description: rt.description || '',
            locationId: rt.locationId || ''
        });
        setShowRoomTypeForm(true);
    };

    const handleCancelEditRoomType = () => {
        setEditingRoomType(null);
        setNewRoomType({ name: '', description: '', locationId: '' });
        setShowRoomTypeForm(false);
    };

    const handleAddRoom = async () => {
        if (!newRoom.number || !newRoom.typeId) return;
        try {
            await addRoom({
            id: '',
            number: newRoom.number,
            typeId: newRoom.typeId,
            status: 'Available'
        });
        setNewRoom({ number: '', typeId: '' });
        setShowRoomForm(false);
            // Refresh rooms
            getRooms().then(setRooms).catch(console.error);
        } catch (error) {
            console.error('Failed to add room:', error);
            alert('Failed to add room. Please try again.');
        }
    };

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setCsvFile(e.target.files[0]);
        }
    };
    
    const handleRoomCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setRoomCsvFile(e.target.files[0]);
        }
    };

    const processCsvImport = async () => {
        if (!csvFile) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            if (evt.target?.result) {
                try {
                    console.log('Starting CSV import...');
                    const count = await importGuestsFromCSV(evt.target.result as string);
                    console.log(`CSV import completed: ${count} guests imported`);
                    alert(`Successfully imported ${count} guests.`);
                    // Refresh users specifically after import
                    try {
                        const refreshedUsers = await getUsers();
                        setUsers(refreshedUsers);
                        console.log('Users refreshed after CSV import:', refreshedUsers);
                    } catch (error) {
                        console.error('Failed to refresh users after CSV import:', error);
                    }
                    await refreshData();
                    setCsvFile(null);
                } catch (error: any) {
                    console.error('Failed to import CSV:', error);
                    const errorMessage = error?.message || error?.toString() || 'Unknown error';
                    alert(`Failed to import CSV: ${errorMessage}. Please check console for details.`);
                }
            }
        };
        reader.readAsText(csvFile);
    };

    const processRoomCsvImport = () => {
        if (!roomCsvFile) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            if (evt.target?.result) {
                try {
                    const count = await importRoomsFromCSV(evt.target.result as string);
                alert(`Successfully imported ${count} rooms.`);
                    // Refresh rooms
                    getRooms().then(setRooms).catch(console.error);
                refreshData();
                setRoomCsvFile(null);
                } catch (error) {
                    console.error('Failed to import rooms:', error);
                    alert('Failed to import rooms. Please check the CSV format.');
                }
            }
        };
        reader.readAsText(roomCsvFile);
    };

    const handleExportGuests = () => {
        const csvContent = getGuestCSVContent();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `furama_guests_export_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleDelete = async (id: string, type: 'LOC' | 'ITEM' | 'EVENT' | 'PROMO' | 'KNOW' | 'USER' | 'ROOM_TYPE' | 'ROOM') => {
        if (!confirm(`Are you sure you want to delete this ${type === 'ROOM_TYPE' ? 'room type' : type.toLowerCase()}?`)) {
            return;
        }
        try {
            if (type === 'LOC') await deleteLocation(id);
            else if (type === 'ITEM') await deleteMenuItem(id);
            else if (type === 'EVENT') {
                await deleteEvent(id);
                // Refresh events specifically after deleting
                try {
                    const refreshedEvents = await getEvents();
                    setEvents(refreshedEvents);
                    console.log('Events refreshed after delete:', refreshedEvents);
                } catch (error) {
                    console.error('Failed to refresh events after delete:', error);
                }
            }
            else if (type === 'PROMO') {
                await deletePromotion(id);
                // Refresh promotions specifically after deleting
                try {
                    const refreshedPromotions = await getPromotions();
                    setPromotions(refreshedPromotions);
                    console.log('Promotions refreshed after delete:', refreshedPromotions);
                } catch (error) {
                    console.error('Failed to refresh promotions after delete:', error);
                }
            }
            else if (type === 'KNOW') {
                await deleteKnowledgeItem(id);
                // Refresh knowledge specifically after deleting
                try {
                    const refreshedKnowledge = await getKnowledgeBase();
                    setKnowledge(refreshedKnowledge);
                    console.log('Knowledge refreshed after delete:', refreshedKnowledge);
                } catch (error) {
                    console.error('Failed to refresh knowledge after delete:', error);
                }
            }
            else if (type === 'USER') {
                await deleteUser(id);
                // Refresh users specifically after deleting
                try {
                    const refreshedUsers = await getUsers();
                    setUsers(refreshedUsers);
                    console.log('Users refreshed after delete:', refreshedUsers);
                } catch (error) {
                    console.error('Failed to refresh users after delete:', error);
                }
            }
            else if (type === 'ROOM_TYPE') {
                console.log('Deleting room type:', id);
                await deleteRoomType(id);
                console.log('Room type deleted successfully');
            }
            else if (type === 'ROOM') await deleteRoom(id);
            
            // Refresh data after successful delete
            await refreshData();
            
            // Also refresh specific data if needed
            if (type === 'ROOM_TYPE') {
                const refreshedRoomTypes = await getRoomTypes();
                setRoomTypes(refreshedRoomTypes);
            } else if (type === 'ITEM') {
                // Refresh menu specifically after deleting menu item
                try {
                    const refreshedMenu = await getMenu();
                    setMenu(refreshedMenu);
                    console.log('Menu refreshed after delete:', refreshedMenu);
                } catch (error) {
                    console.error('Failed to refresh menu after delete:', error);
                }
            }
        } catch (error: any) {
            console.error('Failed to delete:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            alert(`Failed to delete: ${errorMessage}. Please check the console for details.`);
        }
    };

    const getPlaceholder = () => {
        if (tab === 'LOCATIONS') return "e.g., Add a new spot called 'Sunset Bar' at coordinates 16.03, 108.24";
        if (tab === 'MENU') return "e.g., Add Grilled Lobster to Dining category for $45, desc: Fresh local catch.";
        if (tab === 'EVENTS') return "e.g., Pool Party on Dec 24th at 2pm at Lagoon Pool.";
        if (tab === 'PROMOS') return "e.g., Happy Hour: 50% off cocktails daily 5-7pm.";
        if (tab === 'KNOWLEDGE') return "e.g., Check-out time is 12:00 PM.";
        if (tab === 'ROOMS' && roomView === 'LIST') return "e.g. Add Room 204 as a Garden Villa";
        return "";
    };

    const filteredMenu = menuFilter === 'ALL' ? menu : menu.filter(m => m.category === menuFilter);
    const guestUsers = users.filter(u => u.role === UserRole.GUEST);
    const staffUsers = users.filter(u => u.role !== UserRole.GUEST);
    
    // Filter History
    const filteredHistory = serviceHistory.filter(req => {
        const matchesType = historyFilterType === 'ALL' || req.type === historyFilterType;
        // Basic Date string comparison (YYYY-MM-DD)
        const reqDate = new Date(req.timestamp).toISOString().split('T')[0];
        const matchesDate = !historyFilterDate || reqDate === historyFilterDate;
        return matchesType && matchesDate;
    });

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            <header className="bg-emerald-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
                <div>
                    <h1 className="text-xl font-serif font-bold">Furama Admin CMS</h1>
                    <div className="flex items-center space-x-2">
                         <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${user.role === UserRole.SUPERVISOR ? 'bg-amber-500 text-white' : 'bg-emerald-700 text-emerald-100'}`}>
                            {user.role === UserRole.SUPERVISOR ? 'Supervisor (Restricted)' : user.role}
                        </span>
                        <p className="text-xs text-emerald-300">System Management</p>
                    </div>
                </div>
                <button onClick={onLogout} className="text-sm bg-emerald-800 px-3 py-1 rounded hover:bg-emerald-700 border border-emerald-700">Logout</button>
            </header>

            {/* Navigation Tabs */}
            <div className="flex bg-white shadow-sm border-b border-gray-200 overflow-x-auto">
                <button onClick={() => setTab('LOCATIONS')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'LOCATIONS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <MapPin size={18} /> <span className="text-xs md:text-sm">Locs</span>
                </button>
                <button onClick={() => setTab('ROOMS')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'ROOMS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <Home size={18} /> <span className="text-xs md:text-sm">Rooms</span>
                </button>
                <button onClick={() => setTab('MENU')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'MENU' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <Utensils size={18} /> <span className="text-xs md:text-sm">Menu</span>
                </button>
                <button onClick={() => setTab('EVENTS')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'EVENTS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <Calendar size={18} /> <span className="text-xs md:text-sm">Events</span>
                </button>
                <button onClick={() => setTab('PROMOS')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'PROMOS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <Megaphone size={18} /> <span className="text-xs md:text-sm">Promo</span>
                </button>
                <button onClick={() => setTab('KNOWLEDGE')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'KNOWLEDGE' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <BrainCircuit size={18} /> <span className="text-xs md:text-sm">AI</span>
                </button>
                {/* Only ADMIN can see Users/Staff Management */}
                {user.role === UserRole.ADMIN && (
                    <button onClick={() => setTab('USERS')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'USERS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                        <Users size={18} /> <span className="text-xs md:text-sm">Staff</span>
                    </button>
                )}
                <button onClick={() => setTab('GUESTS')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'GUESTS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <UserCheck size={18} /> <span className="text-xs md:text-sm">Guests</span>
                </button>
                <button onClick={() => setTab('HISTORY')} className={`flex-1 min-w-[80px] py-4 font-semibold flex flex-col md:flex-row items-center justify-center md:space-x-2 border-b-2 ${tab === 'HISTORY' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}>
                    <History size={18} /> <span className="text-xs md:text-sm">History</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        {/* Tab Headers */}
                        {tab === 'LOCATIONS' && 'Resort Locations'}
                        {tab === 'ROOMS' && (roomView === 'TYPES' ? 'Room Definitions' : 'Room Inventory')}
                        {tab === 'MENU' && 'Dining & Spa Menus'}
                        {tab === 'EVENTS' && 'Events Calendar'}
                        {tab === 'PROMOS' && 'Active Promotions'}
                        {tab === 'KNOWLEDGE' && 'AI Chatbot Knowledge Base'}
                        {tab === 'USERS' && 'Staff Management'}
                        {tab === 'GUESTS' && 'Guest Check-in Management'}
                        {tab === 'HISTORY' && 'Service Order History'}
                    </h2>
                    
                    <div className="flex items-center space-x-2 w-full md:w-auto">
                        {/* History Filters */}
                        {tab === 'HISTORY' && (
                            <div className="flex space-x-2 bg-white p-1.5 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-1 px-2 border-r border-gray-200">
                                    <Filter size={14} className="text-gray-400" />
                                    <select 
                                        className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
                                        value={historyFilterType}
                                        onChange={(e) => setHistoryFilterType(e.target.value)}
                                    >
                                        <option value="ALL">All Services</option>
                                        <option value="BUGGY">Buggy</option>
                                        <option value="DINING">Dining</option>
                                        <option value="SPA">Spa</option>
                                        <option value="POOL">Pool</option>
                                        <option value="BUTLER">Butler</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-1 px-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    <input 
                                        type="date" 
                                        className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
                                        value={historyFilterDate}
                                        onChange={(e) => setHistoryFilterDate(e.target.value)}
                                    />
                                    {historyFilterDate && (
                                        <button onClick={() => setHistoryFilterDate('')} className="text-gray-400 hover:text-red-500">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {tab === 'MENU' && (
                            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                                <button onClick={() => setMenuFilter('ALL')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'ALL' ? 'bg-gray-100 font-bold' : 'text-gray-500'}`}>All</button>
                                <button onClick={() => setMenuFilter('Dining')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Dining' ? 'bg-orange-100 text-orange-800 font-bold' : 'text-gray-500'}`}>Dining</button>
                                <button onClick={() => setMenuFilter('Spa')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Spa' ? 'bg-purple-100 text-purple-800 font-bold' : 'text-gray-500'}`}>Spa</button>
                            </div>
                        )}

                        {tab === 'ROOMS' && (
                            <div className="flex bg-white rounded-lg border border-gray-200 p-1 mr-2">
                                <button onClick={() => setRoomView('TYPES')} className={`px-3 py-1 text-xs rounded ${roomView === 'TYPES' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-gray-500'}`}>Types</button>
                                <button onClick={() => setRoomView('LIST')} className={`px-3 py-1 text-xs rounded ${roomView === 'LIST' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-gray-500'}`}>List</button>
                            </div>
                        )}
                        
                        {tab === 'USERS' && user.role === UserRole.ADMIN && (
                             <button 
                                onClick={() => setShowUserForm(!showUserForm)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showUserForm ? <X size={18}/> : <Plus size={18}/>}
                                <span>Add Staff</span>
                            </button>
                        )}

                        {tab === 'ROOMS' && roomView === 'TYPES' && (
                             <button 
                                onClick={() => setShowRoomTypeForm(!showRoomTypeForm)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showRoomTypeForm ? <X size={18}/> : <Plus size={18}/>}
                                <span>Add Type</span>
                            </button>
                        )}
                        {tab === 'ROOMS' && roomView === 'LIST' && (
                             <button 
                                onClick={() => setShowRoomForm(!showRoomForm)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showRoomForm ? <X size={18}/> : <Plus size={18}/>}
                                <span>Add Room</span>
                            </button>
                        )}

                        {tab === 'GUESTS' && (
                            <>
                             <button 
                                onClick={handleExportGuests}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 shadow-md transition flex-1 md:flex-none"
                            >
                                <Download size={18}/>
                                <span>Export CSV</span>
                            </button>
                             <button 
                                onClick={() => setShowGuestForm(!showGuestForm)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showGuestForm ? <X size={18}/> : <Plus size={18}/>}
                                <span>Add Guest</span>
                            </button>
                            </>
                        )}

                        {/* AI Button for other tabs */}
                        {['LOCATIONS', 'MENU', 'EVENTS', 'PROMOS', 'KNOWLEDGE'].includes(tab) && (
                            <button 
                                onClick={() => setShowAiInput(!showAiInput)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showAiInput ? <X size={18}/> : <Plus size={18}/>}
                                <span>{showAiInput ? 'Cancel' : 'Smart Add'}</span>
                            </button>
                        )}
                        {tab === 'ROOMS' && roomView === 'LIST' && (
                            <button 
                                onClick={() => setShowAiInput(!showAiInput)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                            >
                                {showAiInput ? <X size={18}/> : <Plus size={18}/>}
                                <span>{showAiInput ? 'Cancel' : 'Smart Add'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* AI Input Box */}
                {showAiInput && (
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Sparkles className="w-4 h-4 text-amber-500 mr-2" />
                            AI Natural Input (Auto-Translate Enabled)
                        </label>
                        <textarea
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            rows={2}
                            placeholder={getPlaceholder()}
                        />
                        <div className="mt-2 flex justify-end">
                            <button 
                                onClick={handleAiSubmit}
                                disabled={isParsing || !aiInput}
                                className="bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 disabled:opacity-50"
                            >
                                {isParsing ? <span>Translating & Adding...</span> : <span><Sparkles className="inline w-3 h-3 mr-1"/> Generate & Add</span>}
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Forms and Tables */}
                
                {/* Room TYPE Add Form */}
                {showRoomTypeForm && tab === 'ROOMS' && roomView === 'TYPES' && (
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                         <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">{editingRoomType ? 'Edit Room Type' : 'Create Room Type'}</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                             <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Type Name</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                    value={newRoomType.name || ''}
                                    onChange={e => setNewRoomType({...newRoomType, name: e.target.value})}
                                    placeholder="e.g. Lagoon Villa"
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Linked Location (Optional)</label>
                                <select 
                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                    value={newRoomType.locationId || ''}
                                    onChange={e => setNewRoomType({...newRoomType, locationId: e.target.value})}
                                >
                                    <option value="">-- No Location Linked --</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                             </div>
                             <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                    value={newRoomType.description || ''}
                                    onChange={e => setNewRoomType({...newRoomType, description: e.target.value})}
                                    placeholder="Brief description"
                                />
                             </div>
                         </div>
                         <div className="flex justify-end gap-2">
                            {editingRoomType && (
                                <button 
                                    onClick={handleCancelEditRoomType}
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
                
                 {/* ROOM LIST Add Form */}
                {showRoomForm && tab === 'ROOMS' && roomView === 'LIST' && (
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                        <div className="flex gap-8 flex-col md:flex-row">
                             <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Manual Room Entry</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Room Number</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded p-2 text-sm" 
                                            placeholder="e.g. 105" 
                                            value={newRoom.number} 
                                            onChange={e => setNewRoom({...newRoom, number: e.target.value})} 
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Room Type</label>
                                        <select 
                                            className="w-full border border-gray-300 rounded p-2 text-sm"
                                            value={newRoom.typeId} 
                                            onChange={e => setNewRoom({...newRoom, typeId: e.target.value})}
                                        >
                                            <option value="">-- Select Type --</option>
                                            {roomTypes.map(rt => (
                                                <option key={rt.id} value={rt.name}>{rt.name}</option>
                                            ))}
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
                                    <input type="file" accept=".csv" onChange={handleRoomCsvUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <Upload className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 font-medium">{roomCsvFile ? roomCsvFile.name : 'Click to Upload CSV'}</p>
                                </div>
                                <button onClick={processRoomCsvImport} disabled={!roomCsvFile} className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold w-full disabled:opacity-50">Process Import</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manual User Add Form */}
                {showUserForm && tab === 'USERS' && user.role === UserRole.ADMIN && (
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Create New Staff Account</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Display Name</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                    value={newUser.lastName || ''}
                                    onChange={e => setNewUser({...newUser, lastName: e.target.value})}
                                    placeholder="e.g. StaffName"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Username</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                    value={newUser.roomNumber || ''}
                                    onChange={e => setNewUser({...newUser, roomNumber: e.target.value})}
                                    placeholder="Login ID"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                                <select 
                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                    value={newUser.role}
                                    onChange={e => {
                                        const role = e.target.value as UserRole;
                                        setNewUser({
                                            ...newUser, 
                                            role: role,
                                            department: role === UserRole.SUPERVISOR ? 'All' : newUser.department
                                        });
                                    }}
                                >
                                    {Object.values(UserRole).filter(r => r !== UserRole.GUEST).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Service Department</label>
                                <select 
                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                    value={newUser.department}
                                    disabled={newUser.role === UserRole.SUPERVISOR} 
                                    onChange={e => setNewUser({...newUser, department: e.target.value as Department})}
                                >
                                    <option value="All">All / Supervisor</option>
                                    <option value="Buggy">Buggy</option>
                                    <option value="Dining">Dining</option>
                                    <option value="Spa">Spa</option>
                                    <option value="Pool">Pool</option>
                                    <option value="Butler">Butler</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={handleAddUser}
                                className="bg-emerald-800 text-white px-6 py-2 rounded-lg text-sm font-bold"
                            >
                                Create Staff
                            </button>
                        </div>
                    </div>
                )}

                {/* GUEST Add Form */}
                {showGuestForm && tab === 'GUESTS' && (
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                        <div className="flex gap-8 flex-col md:flex-row">
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Manual Guest Entry</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <input type="text" className="border border-gray-300 rounded p-2 text-sm" placeholder="Last Name" value={newGuest.lastName} onChange={e => setNewGuest({...newGuest, lastName: e.target.value})} />
                                    <input type="text" className="border border-gray-300 rounded p-2 text-sm" placeholder="Room Number" value={newGuest.room} onChange={e => setNewGuest({...newGuest, room: e.target.value})} />
                                    
                                    <div className="col-span-2">
                                        <select 
                                            className="w-full border border-gray-300 rounded p-2 text-sm"
                                            value={newGuest.type} 
                                            onChange={e => setNewGuest({...newGuest, type: e.target.value})}
                                        >
                                            {roomTypes.map(rt => (
                                                <option key={rt.id} value={rt.name}>{rt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="col-span-2">
                                        <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Language</label>
                                        <select
                                            className="w-full border border-gray-300 rounded p-2 text-sm"
                                            value={newGuest.language}
                                            onChange={e => setNewGuest({...newGuest, language: e.target.value})}
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

                                    <div className="col-span-2 grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] uppercase text-gray-500 font-bold">Check In</label>
                                            <input type="datetime-local" className="w-full border border-gray-300 rounded p-2 text-sm" value={newGuest.checkIn} onChange={e => setNewGuest({...newGuest, checkIn: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase text-gray-500 font-bold">Check Out</label>
                                            <input type="datetime-local" className="w-full border border-gray-300 rounded p-2 text-sm" value={newGuest.checkOut} onChange={e => setNewGuest({...newGuest, checkOut: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleAddGuest} className="bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-bold w-full">Create Guest</button>
                            </div>
                            
                            <div className="w-px bg-gray-200 hidden md:block"></div>

                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Bulk Import (CSV)</h3>
                                <p className="text-xs text-gray-500 mb-4">Format: LastName, Room, VillaType, CheckIn(ISO), CheckOut(ISO), Language</p>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                                    <input type="file" accept=".csv" onChange={handleCsvUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <Upload className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 font-medium">{csvFile ? csvFile.name : 'Click to Upload CSV'}</p>
                                </div>
                                <button onClick={processCsvImport} disabled={!csvFile} className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold w-full disabled:opacity-50">Process Import</button>
                            </div>
                        </div>
                    </div>
                )}

                 {/* Tables Section */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* LOCATIONS TABLE */}
                    {tab === 'LOCATIONS' && (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Coordinates</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.map((loc, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-800">
                                            {loc.name}
                                            <div className="md:hidden text-xs text-gray-400 mt-1">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</div>
                                        </td>
                                        <td className="p-4 text-sm font-mono text-gray-500 hidden md:table-cell">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDelete(loc.id || loc.name, 'LOC')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    
                    {/* MENU TABLE */}
                    {tab === 'MENU' && (
                        <table className="w-full text-left">
                             <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Item Details</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Category</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Price</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right"></th>
                                </tr>
                            </thead>
                             <tbody>
                                {filteredMenu.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">{item.name}</div>
                                            <div className="text-xs text-gray-400 line-clamp-1">{item.description}</div>
                                            {item.translations && <div className="text-[10px] text-emerald-600 mt-0.5">Translated: {Object.keys(item.translations).length} languages</div>}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.category === 'Dining' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-sm font-bold text-emerald-600">${item.price}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDelete(item.id, 'ITEM')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    
                    {tab === 'EVENTS' && (
                        <div className="divide-y divide-gray-100">
                             {events.map((event) => (
                                 <div key={event.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                     <div>
                                         <div className="font-bold text-gray-800">{event.title}</div>
                                         <div className="text-sm text-emerald-600">{event.date} • {event.time}</div>
                                         <div className="text-xs text-gray-500 mt-1">{event.location}</div>
                                     </div>
                                     <button onClick={() => handleDelete(event.id, 'EVENT')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                 </div>
                             ))}
                        </div>
                    )}

                    {/* PROMOTIONS TABLE */}
                    {tab === 'PROMOS' && (
                        <div className="divide-y divide-gray-100">
                             {promotions.map((p) => (
                                 <div key={p.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                     <div className="flex-1">
                                         <div className="flex items-center space-x-2">
                                             <span className="font-bold text-gray-800">{p.title}</span>
                                             <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{p.discount}</span>
                                         </div>
                                         <div className="text-sm text-gray-500">{p.description}</div>
                                         <div className="text-xs text-gray-400 mt-1">Valid: {p.validUntil}</div>
                                     </div>
                                     <button onClick={() => handleDelete(p.id, 'PROMO')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                 </div>
                             ))}
                        </div>
                    )}
                    
                    {/* KNOWLEDGE TABLE */}
                    {tab === 'KNOWLEDGE' && (
                         <div className="divide-y divide-gray-100">
                            {knowledge.map((k) => (
                                <div key={k.id} className="p-4 flex justify-between items-start hover:bg-gray-50">
                                    <div className="pr-4">
                                        <div className="font-semibold text-emerald-800 text-sm mb-1">Q: {k.question}</div>
                                        <div className="text-gray-600 text-sm">A: {k.answer}</div>
                                    </div>
                                    <button onClick={() => handleDelete(k.id, 'KNOW')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                </div>
                            ))}
                       </div>
                    )}

                     {tab === 'ROOMS' && roomView === 'TYPES' && (
                         <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Type Name</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Linked Location</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roomTypes.map((rt) => {
                                    // Find linked location by matching ID
                                    // Both IDs are strings, but ensure proper comparison
                                    const linkedLoc = rt.locationId 
                                        ? locations.find(l => {
                                            const locIdStr = String(l.id || '').trim();
                                            const rtLocIdStr = String(rt.locationId || '').trim();
                                            const match = locIdStr === rtLocIdStr && locIdStr !== '';
                                            if (rt.locationId && !match) {
                                                console.log('Location ID mismatch:', {
                                                    roomTypeId: rt.id,
                                                    roomTypeName: rt.name,
                                                    roomTypeLocationId: rt.locationId,
                                                    rtLocIdStr,
                                                    locations: locations.map(l => ({ id: l.id, name: l.name })),
                                                    tryingToMatch: locIdStr
                                                });
                                            }
                                            return match;
                                        })
                                        : null;
                                    return (
                                        <tr key={rt.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">{rt.name}</div>
                                                <div className="text-xs text-gray-500">{rt.description}</div>
                                            </td>
                                            <td className="p-4">
                                                {linkedLoc ? (
                                                    <span className="flex items-center text-sm text-emerald-600">
                                                        <MapPin size={14} className="mr-1"/> {linkedLoc.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">
                                                        {rt.locationId ? `Unlinked (ID: ${rt.locationId})` : 'Unlinked'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditRoomType(rt)} className="text-emerald-600 hover:text-emerald-700 p-2" title="Edit Location Link"><MapPin size={16}/></button>
                                                    <button onClick={() => handleDelete(rt.id, 'ROOM_TYPE')} className="text-red-500 hover:text-red-700 p-2" title="Delete"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    
                    {tab === 'ROOMS' && roomView === 'LIST' && (
                         <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Room #</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Room Type</th>
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
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                    r.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {r.status || 'Available'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDelete(r.id, 'ROOM')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {tab === 'USERS' && user.role === UserRole.ADMIN && (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Name / ID</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Role</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Department</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staffUsers.map((u, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{u.lastName}</div>
                                            <div className="text-xs text-gray-500">ID: {u.roomNumber}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                u.role === UserRole.ADMIN ? 'bg-red-100 text-red-800' : 
                                                u.role === UserRole.SUPERVISOR ? 'bg-amber-100 text-amber-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-gray-600 flex items-center">
                                                {u.role === UserRole.ADMIN ? <Shield size={14} className="mr-1 text-amber-500"/> : 
                                                 u.role === UserRole.SUPERVISOR ? <Users size={14} className="mr-1 text-amber-500"/> :
                                                 <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>}
                                                {u.department || 'General'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right flex justify-end space-x-1">
                                            <button onClick={() => { setResetPasswordUserId(u.id || ''); setResetNewPassword(''); }} className="text-amber-500 hover:text-amber-700 p-2"><Key size={16}/></button>
                                            <button onClick={() => handleDelete(u.id || '', 'USER')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    
                    {tab === 'GUESTS' && (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Guest Info</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Stay Duration</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {guestUsers.map((u, i) => {
                                    const now = new Date();
                                    const start = u.checkIn ? new Date(u.checkIn) : null;
                                    const end = u.checkOut ? new Date(u.checkOut) : null;
                                    let status = 'Active';
                                    let statusColor = 'bg-green-100 text-green-700';
                                    
                                    if (start && now < start) { status = 'Future'; statusColor = 'bg-blue-100 text-blue-700'; }
                                    else if (end && now > end) { status = 'Expired'; statusColor = 'bg-gray-100 text-gray-500'; }

                                    return (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
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
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDelete(u.id || '', 'USER')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    
                    {tab === 'HISTORY' && (
                        <>
                            {filteredHistory.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                                    <History size={48} className="mb-4 opacity-20"/>
                                    <p>No service history found matching your filters.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="p-4 text-sm font-semibold text-gray-600">Time</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600">Room</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600">Service Type</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600">Details</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.map((req, i) => (
                                            <tr key={req.id || i} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="p-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <Clock size={12} className="mr-1.5 text-gray-400"/>
                                                        {new Date(req.timestamp).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-bold text-gray-800">{req.roomNumber}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        req.type === 'DINING' ? 'bg-orange-100 text-orange-700' :
                                                        req.type === 'SPA' ? 'bg-purple-100 text-purple-700' :
                                                        req.type === 'POOL' ? 'bg-blue-100 text-blue-700' :
                                                        req.type === 'BUGGY' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {req.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-600">
                                                    <div className="truncate max-w-xs">{req.details}</div>
                                                    {req.rating && (
                                                        <div className="mt-1 flex items-center text-xs text-amber-500">
                                                            <div className="flex mr-1">
                                                                {[...Array(req.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor"/>)}
                                                            </div>
                                                            {req.feedback && <span className="text-gray-400 italic truncate max-w-[150px]">"{req.feedback}"</span>}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        req.status === 'COMPLETED' ? 'text-green-600 bg-green-50' : 
                                                        req.status === 'CONFIRMED' ? 'text-blue-600 bg-blue-50' : 
                                                        'text-orange-600 bg-orange-50'
                                                    }`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Reset Password Modal */}
            {resetPasswordUserId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
                        <h3 className="font-bold text-lg mb-4">Reset Password</h3>
                        <p className="text-sm text-gray-500 mb-4">Enter new password for user.</p>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded p-2 mb-4"
                            placeholder="New Password"
                            value={resetNewPassword}
                            onChange={(e) => setResetNewPassword(e.target.value)}
                        />
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setResetPasswordUserId(null)} 
                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={async () => {
                                    if(resetPasswordUserId && resetNewPassword) {
                                        try {
                                            console.log('Resetting password for user:', resetPasswordUserId);
                                            await resetUserPassword(resetPasswordUserId, resetNewPassword);
                                            console.log('Password reset successfully');
                                            alert('Password reset successfully!');
                                            setResetPasswordUserId(null);
                                            setResetNewPassword('');
                                            // Refresh users specifically after reset
                                            try {
                                                const refreshedUsers = await getUsers();
                                                setUsers(refreshedUsers);
                                                console.log('Users refreshed after password reset:', refreshedUsers);
                                            } catch (error) {
                                                console.error('Failed to refresh users after password reset:', error);
                                            }
                                            await refreshData();
                                        } catch (error: any) {
                                            console.error('Failed to reset password:', error);
                                            const errorMessage = error?.message || error?.toString() || 'Unknown error';
                                            alert(`Failed to reset password: ${errorMessage}. Please check console for details.`);
                                        }
                                    }
                                }} 
                                className="px-4 py-2 bg-emerald-600 text-white rounded font-bold"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPortal;
