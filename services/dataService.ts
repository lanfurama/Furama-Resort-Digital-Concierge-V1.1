
import { Location, MenuItem, RideRequest, ServiceRequest, BuggyStatus, UserRole, ResortEvent, Promotion, KnowledgeItem, User, Department, RoomType, Room, HotelReview, AppNotification, ChatMessage } from '../types';
import { MOCK_LOCATIONS, MOCK_PROMOTIONS, MOCK_KNOWLEDGE, MOCK_USERS, MOCK_ROOM_TYPES, MOCK_ROOMS } from '../constants';
import { apiClient } from './apiClient';

// Initial Mock Data
let locations: Location[] = [...MOCK_LOCATIONS];
let roomTypes: RoomType[] = [...MOCK_ROOM_TYPES];
let rooms: Room[] = [...MOCK_ROOMS];

// Helper to get today/tomorrow dates for mock users ensuring they can login
const today = new Date();
const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

// Combine guest users with some mock staff users
// Note: roomNumber acts as 'Username' for staff, and we added a simple password '123'
let users: User[] = [
    // Mock Guests with valid dates
    { lastName: "Smith", roomNumber: "101", villaType: "Ocean Suite", role: UserRole.GUEST, checkIn: yesterday.toISOString(), checkOut: nextWeek.toISOString(), notes: "Allergic to peanuts.", language: "English" },
    { lastName: "Nguyen", roomNumber: "205", villaType: "Garden Villa", role: UserRole.GUEST, checkIn: yesterday.toISOString(), checkOut: nextWeek.toISOString(), language: "Vietnamese" },
    { lastName: "Doe", roomNumber: "888", villaType: "Presidential Suite", role: UserRole.GUEST, checkIn: yesterday.toISOString(), checkOut: nextWeek.toISOString(), language: "English" },
    
    // Staff
    { id: 'admin1', lastName: 'Admin', roomNumber: 'admin', password: '123', role: UserRole.ADMIN, department: 'All' },
    { id: 'sup1', lastName: 'Supervisor', roomNumber: 'supervisor', password: '123', role: UserRole.SUPERVISOR, department: 'All' }, // Mock Supervisor
    { id: 'driver1', lastName: 'Driver', roomNumber: 'driver', password: '123', role: UserRole.DRIVER, department: 'Buggy' },
    { id: 'staff1', lastName: 'Chef', roomNumber: 'dining', password: '123', role: UserRole.STAFF, department: 'Dining' },
    { id: 'staff2', lastName: 'Therapist', roomNumber: 'spa', password: '123', role: UserRole.STAFF, department: 'Spa' },
    { id: 'staff3', lastName: 'PoolBoy', roomNumber: 'pool', password: '123', role: UserRole.STAFF, department: 'Pool' },
    { id: 'staff4', lastName: 'Butler', roomNumber: 'butler', password: '123', role: UserRole.STAFF, department: 'Butler' },
];

let menuItems: MenuItem[] = [
  // Dining
  { 
      id: '1', name: 'Wagyu Burger', price: 25, category: 'Dining', description: 'Premium beef with truffle fries',
      translations: {
          Vietnamese: { name: 'Burger Bò Wagyu', description: 'Thịt bò cao cấp kèm khoai tây chiên nấm truffle' },
          Korean: { name: '와규 버거', description: '트러플 감자튀김을 곁들인 프리미엄 소고기' },
          Japanese: { name: '和牛バーガー', description: 'トリュフフライ付きのプレミアムビーフ' },
          Chinese: { name: '和牛汉堡', description: '优质牛肉配松露薯条' },
          Russian: { name: 'Вагю Бургер', description: 'Мраморная говядина с картофелем фри с трюфелем' }
      }
  },
  { 
      id: '2', name: 'Vietnamese Pho', price: 15, category: 'Dining', description: 'Traditional beef noodle soup',
      translations: {
          Vietnamese: { name: 'Phở Bò', description: 'Món súp mì bò truyền thống' },
          Korean: { name: '베트남 쌀국수', description: '전통 소고기 쌀국수' },
          Japanese: { name: 'ベトナムのフォー', description: '伝統的な牛肉麺スープ' },
          Chinese: { name: '越南河粉', description: '传统牛肉粉' },
          Russian: { name: 'Вьетнамский Фо', description: 'Традиционный суп с лапшой и говядиной' }
      }
  },
  { 
      id: '3', name: 'Club Sandwich', price: 18, category: 'Dining', description: 'Classic triple-decker with chicken and bacon',
      translations: {
          Vietnamese: { name: 'Bánh Mì Club', description: 'Bánh mì kẹp 3 tầng cổ điển với gà và thịt xông khói' },
          Korean: { name: '클럽 샌드위치', description: '치킨과 베이컨이 들어간 클래식 3단 샌드위치' },
          Japanese: { name: 'クラブサンドイッチ', description: 'チキンとベーコンのクラシックな3段重ね' },
          Chinese: { name: '公司三明治', description: '经典三层鸡肉培根三明治' },
          Russian: { name: 'Клубный Сэндвич', description: 'Классический трехслойный сэндвич с курицей и беконом' }
      }
  },
  // Spa
  { 
      id: '4', name: 'Aromatherapy Massage', price: 80, category: 'Spa', description: '60 mins relaxing massage',
      translations: {
          Vietnamese: { name: 'Massage Tinh Dầu', description: '60 phút thư giãn' },
          Korean: { name: '아로마테라피 마사지', description: '60분 릴렉싱 마사지' },
          Japanese: { name: 'アロマテラピーマッサージ', description: '60分間のリラックスマッサージ' },
          Chinese: { name: '香薰按摩', description: '60分钟放松按摩' },
          Russian: { name: 'Ароматерапевтический Массаж', description: '60 минут расслабляющего массажа' }
      }
  },
  { id: '5', name: 'Hot Stone Therapy', price: 95, category: 'Spa', description: '75 mins deep tissue relief' },
  { id: '6', name: 'Facial Rejuvenation', price: 60, category: 'Spa', description: '45 mins organic facial' },
  // Pool
  { id: '7', name: 'Fresh Coconut', price: 5, category: 'Pool', description: 'Chilled fresh coconut' },
  { id: '8', name: 'Sunscreen SPF 50', price: 15, category: 'Pool', description: 'Water resistant sun protection' },
  { id: '9', name: 'Pool Towel Request', price: 0, category: 'Pool', description: 'Extra large resort towel' },
  // Butler
  { id: '10', name: 'Ice Bucket', price: 0, category: 'Butler', description: 'Bucket of ice cubes' },
  { id: '11', name: 'Shoe Shine Service', price: 0, category: 'Butler', description: 'Complimentary shoe polishing' },
  { id: '12', name: 'Unpacking Service', price: 0, category: 'Butler', description: 'Assistance with unpacking luggage' },
];

let events: ResortEvent[] = [
    { id: '1', title: 'Sunrise Yoga', date: '2023-11-20', time: '06:00', location: 'Ocean Beach', description: 'Start your day with a relaxing yoga session by the sea.' },
    { id: '2', title: 'Seafood Buffet', date: '2023-11-20', time: '18:30', location: 'Cafe Indochine', description: 'All-you-can-eat fresh local seafood.' }
];

let promotions: Promotion[] = [...MOCK_PROMOTIONS];
let knowledgeBase: KnowledgeItem[] = [...MOCK_KNOWLEDGE];

let rides: RideRequest[] = [
    // Mock History Ride
    { id: 'r1', guestName: 'Doe', roomNumber: '888', pickup: 'Villa 888', destination: 'Main Lobby', status: BuggyStatus.COMPLETED, timestamp: Date.now() - 7200000, rating: 5, feedback: "Driver was very polite!", pickedUpAt: Date.now() - 7100000, completedAt: Date.now() - 7000000 },
];

// Populate some initial history for demo purposes
let serviceRequests: ServiceRequest[] = [
    { id: 'h1', type: 'DINING', status: 'COMPLETED', details: 'Order for: Wagyu Burger, Club Sandwich', roomNumber: '101', timestamp: Date.now() - 86400000, confirmedAt: Date.now() - 85000000, completedAt: Date.now() - 83000000 }, 
    { id: 'h2', type: 'SPA', status: 'COMPLETED', details: 'Order for: Aromatherapy Massage', roomNumber: '205', timestamp: Date.now() - 172800000, confirmedAt: Date.now() - 171800000, completedAt: Date.now() - 169000000 }, 
    { id: 'h3', type: 'BUTLER', status: 'COMPLETED', details: 'Order for: Ice Bucket', roomNumber: '101', timestamp: Date.now() - 3600000, confirmedAt: Date.now() - 3500000, completedAt: Date.now() - 3400000 }, 
    { id: 'h4', type: 'POOL', status: 'PENDING', details: 'Order for: Fresh Coconut', roomNumber: '888', timestamp: Date.now() - 900000 }, 
];

let hotelReviews: HotelReview[] = [];

let notifications: AppNotification[] = [
    { id: 'n1', recipientId: '101', title: 'Welcome', message: 'Welcome to Furama Resort & Villas!', type: 'INFO', timestamp: Date.now() - 100000, isRead: false }
];

// Service Chats Store: Key is `${roomNumber}_${serviceType}`
let serviceChats: Record<string, ChatMessage[]> = {};

// --- NOTIFICATIONS ---
export const getNotifications = async (recipientId: string): Promise<AppNotification[]> => {
    try {
        const dbNotifications = await apiClient.get<any[]>(`/notifications/recipient/${recipientId}`);
        // Map database notifications to frontend format
        return dbNotifications.map(n => ({
            id: n.id.toString(),
            recipientId: n.recipient_id,
            title: n.title,
            message: n.message,
            type: n.type,
            timestamp: new Date(n.created_at).getTime(),
            isRead: n.is_read
        }));
    } catch (error) {
        console.error('Failed to fetch notifications from API:', error);
        // Fallback to local mock data
        return notifications.filter(n => n.recipientId === recipientId).sort((a,b) => b.timestamp - a.timestamp);
    }
};

export const markNotificationRead = async (id: string): Promise<void> => {
    try {
        await apiClient.put(`/notifications/${id}/read`);
        // Update local state
        notifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        // Fallback to local state
        notifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    }
};

export const sendNotification = async (recipientId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO'): Promise<void> => {
    try {
        const dbNotification = await apiClient.post<any>('/notifications', {
            recipient_id: recipientId,
            title,
            message,
            type,
            is_read: false
        });
        
        // Update local state
        const notif: AppNotification = {
            id: dbNotification.id.toString(),
            recipientId: dbNotification.recipient_id,
            title: dbNotification.title,
            message: dbNotification.message,
            type: dbNotification.type,
            timestamp: new Date(dbNotification.created_at).getTime(),
            isRead: dbNotification.is_read
        };
        notifications = [notif, ...notifications];
    } catch (error) {
        console.error('Failed to send notification via API:', error);
        // Fallback to local state
        const notif: AppNotification = {
            id: Date.now().toString() + Math.random(),
            recipientId,
            title,
            message,
            type,
            timestamp: Date.now(),
            isRead: false
        };
        notifications = [notif, ...notifications];
    }
};

const notifyStaffByDepartment = async (department: string, title: string, message: string) => {
    const staff = users.filter(u => u.role === UserRole.STAFF && (u.department === department || u.department === 'All'));
    for (const s of staff) {
        await sendNotification(s.roomNumber, title, message, 'INFO');
    }
};


// --- USERS ---
export const getUsers = async (): Promise<User[]> => {
  try {
    console.log('Fetching users from API...');
    const dbUsers = await apiClient.get<any[]>('/users');
    console.log('Users API response:', dbUsers);
    
    const mapped = dbUsers.map(user => ({
      id: user.id.toString(),
      lastName: user.last_name,
      roomNumber: user.room_number,
      password: user.password || undefined,
      villaType: user.villa_type || undefined,
      role: user.role as UserRole,
      department: 'All' as Department, // Default, database doesn't have department field
      checkIn: user.check_in || undefined,
      checkOut: user.check_out || undefined,
      language: user.language || undefined,
      notes: undefined // Database doesn't have notes field
    }));
    
    console.log('Mapped users:', mapped);
    // Update local cache
    users = mapped;
    return mapped;
  } catch (error) {
    console.error('Failed to fetch users from API:', error);
    console.warn('Falling back to mock users. This means users are NOT loaded from database!');
    return users; // Fallback to mock data
  }
};

// Sync version for backward compatibility
export const getUsersSync = () => users;

export const addUser = async (user: User): Promise<void> => {
  try {
    const requestBody = {
      last_name: user.lastName,
      room_number: user.roomNumber,
      villa_type: user.villaType || null,
      role: user.role,
      password: user.password || '123', // Default password for new users
      language: user.language || 'English'
    };
    
    console.log('Adding user via API - Input:', user);
    console.log('Adding user via API - Request Body:', requestBody);
    
    const dbUser = await apiClient.post<any>('/users', requestBody);
    
    console.log('User added successfully - API Response:', dbUser);
    
    // Update local cache
    const mappedUser: User = {
      id: dbUser.id.toString(),
      lastName: dbUser.last_name,
      roomNumber: dbUser.room_number,
      password: dbUser.password || undefined,
      villaType: dbUser.villa_type || undefined,
      role: dbUser.role as UserRole,
      department: 'All' as Department,
      checkIn: dbUser.check_in || undefined,
      checkOut: dbUser.check_out || undefined,
      language: dbUser.language || undefined
    };
    
    users = [...users, mappedUser];
    console.log('User added to local cache:', mappedUser);
  } catch (error: any) {
    console.error('Failed to add user via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. User will NOT be saved to database!');
    // Fallback to local state
    users = [...users, { ...user, id: Date.now().toString(), password: user.password || '123' }];
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    console.log('Deleting user via API:', id);
    await apiClient.delete(`/users/${id}`);
    console.log('User deleted successfully from database');
    // Update local cache
    users = users.filter(u => u.id !== id);
    console.log('User removed from local cache');
  } catch (error: any) {
    console.error('Failed to delete user via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. User will NOT be deleted from database!');
    // Fallback to local state
    users = users.filter(u => u.id !== id);
    throw error; // Re-throw để component có thể handle error
  }
};

export const resetUserPassword = async (userId: string, newPass: string): Promise<void> => {
  try {
    console.log('Resetting user password via API:', { userId, newPass });
    await apiClient.put(`/users/${userId}`, { password: newPass });
    console.log('User password reset successfully');
    // Update local cache
    users = users.map(u => u.id === userId ? { ...u, password: newPass } : u);
    console.log('User password updated in local cache');
  } catch (error: any) {
    console.error('Failed to reset user password via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. Password will NOT be updated in database!');
    // Fallback to local state
    users = users.map(u => u.id === userId ? { ...u, password: newPass } : u);
    throw error; // Re-throw để component có thể handle error
  }
};

export const updateUserNotes = async (roomNumber: string, notes: string): Promise<void> => {
  try {
    // Get user by room number first
    const user = await apiClient.get<any>(`/users/room/${roomNumber}`).catch(() => null);
    if (user && user.id) {
      // Update user with notes (if notes field exists in database)
      // For now, we'll store in localStorage as database doesn't have notes column
      const savedUser = localStorage.getItem('furama_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        parsedUser.notes = notes;
        localStorage.setItem('furama_user', JSON.stringify(parsedUser));
      }
    }
  } catch (error) {
    console.error('Failed to update user notes:', error);
    // Fallback to localStorage
    const savedUser = localStorage.getItem('furama_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      parsedUser.notes = notes;
      localStorage.setItem('furama_user', JSON.stringify(parsedUser));
    }
  }
};

export const updateUserLanguage = async (roomNumber: string, language: string): Promise<void> => {
  console.log('=== updateUserLanguage START ===');
  console.log('Parameters:', { roomNumber, language });
  
  try {
    // Get user by room number first
    console.log('Step 1: Fetching user by room number...');
    const user = await apiClient.get<any>(`/users/room/${roomNumber}`);
    console.log('Step 1: User found:', user);
    
    if (!user || !user.id) {
      const error = new Error('User not found or missing ID');
      console.error('Step 1: FAILED -', error.message, user);
      throw error;
    }
    
    console.log('Step 2: Updating user language via API...');
    console.log('Step 2: Request URL:', `/users/${user.id}`);
    console.log('Step 2: Request body:', { language });
    
    // Update user language in database
    const updatedUser = await apiClient.put(`/users/${user.id}`, { language });
    console.log('Step 2: SUCCESS - User updated:', updatedUser);
    console.log('Step 2: Updated language value:', updatedUser.language);
    
    // Verify the update
    if (updatedUser.language !== language) {
      console.warn('WARNING: Language mismatch! Expected:', language, 'Got:', updatedUser.language);
    }
    
    // Update localStorage
    console.log('Step 3: Updating localStorage...');
    const savedUser = localStorage.getItem('furama_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      parsedUser.language = language;
      localStorage.setItem('furama_user', JSON.stringify(parsedUser));
      console.log('Step 3: localStorage updated');
    }
    
    console.log('=== updateUserLanguage SUCCESS ===');
  } catch (error: any) {
    console.error('=== updateUserLanguage ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Try to get more details from fetch error
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response body:', error.response.body);
    }
    
    // Fallback to localStorage
    console.log('Fallback: Updating localStorage only...');
    const savedUser = localStorage.getItem('furama_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      parsedUser.language = language;
      localStorage.setItem('furama_user', JSON.stringify(parsedUser));
      console.log('Fallback: localStorage updated');
    }
    
    // Re-throw error so component can handle it
    throw error;
  }
};

// Staff Login verification
export const loginStaff = (username: string, password: string): User | undefined => {
    return users.find(u => 
        u.roomNumber.toLowerCase() === username.toLowerCase() && 
        u.password === password
    );
};

// Guest Login Validation
export const loginGuest = (lastName: string, roomNumber: string): { success: boolean; user?: User; message?: string } => {
    const user = users.find(u => 
        u.lastName.toLowerCase() === lastName.toLowerCase() && 
        u.roomNumber.toLowerCase() === roomNumber.toLowerCase() &&
        u.role === UserRole.GUEST
    );

    if (!user) {
        return { success: false, message: "Guest not found. Please check Room # and Last Name." };
    }

    if (user.checkIn && user.checkOut) {
        const now = new Date();
        const checkIn = new Date(user.checkIn);
        const checkOut = new Date(user.checkOut);

        if (now < checkIn) {
            return { success: false, message: `Check-in time starts at ${checkIn.toLocaleString()}.` };
        }
        if (now > checkOut) {
            return { success: false, message: "Your stay has expired. Please contact reception." };
        }
    }

    return { success: true, user };
};

export const findUserByCredentials = (lastName: string, roomNumber: string): User | undefined => {
    // Legacy support
    return users.find(u => 
        u.lastName.toLowerCase() === lastName.toLowerCase() && 
        u.roomNumber.toLowerCase() === roomNumber.toLowerCase()
    );
};

// CSV Import Logic (Guests)
export const importGuestsFromCSV = async (csvContent: string): Promise<number> => {
    const lines = csvContent.split(/\r?\n/);
    let count = 0;
    const errors: string[] = [];

    for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 2) {
            const lastName = parts[0].trim();
            const roomNumber = parts[1].trim();
            const villaType = parts[2]?.trim() || "Standard Room";
            const checkIn = parts[3]?.trim();
            const checkOut = parts[4]?.trim();
            const language = parts[5]?.trim() || "English";

            if (lastName && roomNumber) {
                try {
                    const newUser: User = {
                        lastName,
                        roomNumber,
                        role: UserRole.GUEST,
                        department: 'All',
                        villaType,
                        checkIn,
                        checkOut,
                        language
                    };
                    
                    console.log('Importing guest from CSV:', newUser);
                    await addUser(newUser);
                    count++;
                    console.log(`Guest "${lastName}" (${roomNumber}) imported successfully`);
                } catch (error: any) {
                    console.error(`Failed to import guest "${lastName}" (${roomNumber}):`, error);
                    errors.push(`${lastName} (${roomNumber}): ${error?.message || 'Unknown error'}`);
                    // Continue with next user even if one fails
                }
            }
        }
    }
    
    if (errors.length > 0) {
        console.warn('Some guests failed to import:', errors);
    }
    
    console.log(`CSV import completed: ${count} guests imported${errors.length > 0 ? `, ${errors.length} failed` : ''}`);
    
    // Refresh users after import
    try {
        const refreshedUsers = await getUsers();
        users = refreshedUsers;
        console.log('Users refreshed after CSV import');
    } catch (error) {
        console.error('Failed to refresh users after CSV import:', error);
    }
    
    return count;
};

// CSV Export Logic
export const getGuestCSVContent = (): string => {
    const guests = users.filter(u => u.role === UserRole.GUEST);
    const header = "LastName,RoomNumber,VillaType,CheckIn,CheckOut,Language";
    const rows = guests.map(g => {
        return `${g.lastName},${g.roomNumber},${g.villaType || ''},${g.checkIn || ''},${g.checkOut || ''},${g.language || 'English'}`;
    });
    return [header, ...rows].join('\n');
};

// --- LOCATIONS ---
export const getLocations = async (): Promise<Location[]> => {
  try {
    console.log('Fetching locations from API...');
    const dbLocations = await apiClient.get<any[]>('/locations');
    console.log('Locations API response:', dbLocations);
    
    const mappedLocations = dbLocations.map(loc => ({
      id: loc.id.toString(),
      lat: parseFloat(loc.lat),
      lng: parseFloat(loc.lng),
      name: loc.name,
      type: loc.type as 'VILLA' | 'FACILITY' | 'RESTAURANT'
    }));
    
    console.log('Mapped locations:', mappedLocations);
    return mappedLocations;
  } catch (error) {
    console.error('Failed to fetch locations from API:', error);
    console.warn('Falling back to mock locations. This may cause location ID mismatches with room types from database!');
    return locations; // Fallback to mock data
  }
};

// Sync version for backward compatibility (used by AdminPortal)
export const getLocationsSync = () => locations;

export const addLocation = async (loc: Location): Promise<void> => {
  try {
    const dbLocation = await apiClient.post<any>('/locations', {
      lat: loc.lat,
      lng: loc.lng,
      name: loc.name,
      type: loc.type || null
    });
    
    // Update local cache
    locations = [...locations, {
      id: dbLocation.id.toString(),
      lat: parseFloat(dbLocation.lat),
      lng: parseFloat(dbLocation.lng),
      name: dbLocation.name,
      type: dbLocation.type as 'VILLA' | 'FACILITY' | 'RESTAURANT'
    }];
  } catch (error) {
    console.error('Failed to add location:', error);
    // Fallback to local state
    locations = [...locations, { ...loc, id: Date.now().toString() }];
    throw error;
  }
};

export const deleteLocation = async (idOrName: string): Promise<void> => {
  try {
    // Try to find location by name first (for backward compatibility)
    const location = locations.find(l => l.name === idOrName || l.id === idOrName);
    
    if (location && location.id) {
      // Try to delete by ID
      await apiClient.delete(`/locations/${location.id}`);
      // Update local cache
      locations = locations.filter(l => l.id !== location.id);
    } else {
      // Fallback: delete by name from local state
      locations = locations.filter(l => l.name !== idOrName);
    }
  } catch (error) {
    console.error('Failed to delete location:', error);
    // Fallback to local state
    locations = locations.filter(l => l.name !== idOrName && l.id !== idOrName);
    throw error;
  }
};

// --- ROOM TYPES ---
export const getRoomTypes = async (): Promise<RoomType[]> => {
  try {
    console.log('Fetching room types from API...');
    const dbRoomTypes = await apiClient.get<any[]>('/room-types');
    console.log('Room types API response:', dbRoomTypes);
    
    const mapped = dbRoomTypes.map(rt => ({
      id: rt.id.toString(),
      name: rt.name,
      description: rt.description || undefined,
      locationId: rt.location_id ? rt.location_id.toString() : undefined
    }));
    
    console.log('Mapped room types:', mapped);
    return mapped;
  } catch (error) {
    console.error('Failed to fetch room types from API:', error);
    console.warn('Falling back to mock room types. This means room types are NOT loaded from database!');
    return roomTypes; // Fallback to mock data
  }
};

export const addRoomType = async (rt: RoomType): Promise<RoomType> => {
  try {
    // Prepare location_id: if locationId is empty string or undefined, send null; otherwise parse as int
    let location_id: number | null = null;
    if (rt.locationId && rt.locationId.trim() !== '') {
      location_id = parseInt(rt.locationId);
      if (isNaN(location_id)) {
        console.warn('Invalid locationId, setting to null:', rt.locationId);
        location_id = null;
      }
    }
    
    const requestBody = {
      name: rt.name,
      description: rt.description || null,
      location_id: location_id
    };
    
    console.log('Adding room type via API - Input:', rt);
    console.log('Adding room type via API - Request Body:', requestBody);
    
    const dbRoomType = await apiClient.post<any>('/room-types', requestBody);
    
    console.log('Room type added successfully - API Response:', dbRoomType);
    
    const result = {
      id: dbRoomType.id.toString(),
      name: dbRoomType.name,
      description: dbRoomType.description || undefined,
      locationId: dbRoomType.location_id ? dbRoomType.location_id.toString() : undefined
    };
    
    console.log('Mapped room type result:', result);
    return result;
  } catch (error: any) {
    console.error('Failed to add room type via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status
    });
    console.warn('Falling back to local mock data. Room type will NOT be saved to database!');
    // Fallback to local
    const newRt = { ...rt, id: Date.now().toString() };
    roomTypes = [...roomTypes, newRt];
    throw error; // Re-throw để component có thể handle error
  }
};

export const updateRoomType = async (id: string, rt: Partial<RoomType>): Promise<RoomType> => {
  try {
    // Prepare location_id: if locationId is empty string or undefined, send null; otherwise parse as int
    let location_id: number | null | undefined = undefined;
    if (rt.locationId !== undefined) {
      if (rt.locationId && rt.locationId.trim() !== '') {
        const parsed = parseInt(rt.locationId);
        if (isNaN(parsed)) {
          console.warn('Invalid locationId, setting to null:', rt.locationId);
          location_id = null;
        } else {
          location_id = parsed;
        }
      } else {
        location_id = null; // Empty string or whitespace -> null
      }
    }
    
    // Build request body - only include fields that are defined
    const requestBody: any = {};
    if (rt.name !== undefined) {
      requestBody.name = rt.name;
    }
    if (rt.description !== undefined) {
      requestBody.description = rt.description || null;
    }
    if (rt.locationId !== undefined) {
      requestBody.location_id = location_id;
    }
    
    console.log('updateRoomType - Input:', { id, rt });
    console.log('updateRoomType - Request Body:', requestBody);
    
    const dbRoomType = await apiClient.put<any>(`/room-types/${id}`, requestBody);
    
    console.log('updateRoomType - API Response:', dbRoomType);
    
    const result = {
      id: dbRoomType.id.toString(),
      name: dbRoomType.name,
      description: dbRoomType.description || undefined,
      locationId: dbRoomType.location_id ? dbRoomType.location_id.toString() : undefined
    };
    
    console.log('updateRoomType - Mapped Result:', result);
    return result;
  } catch (error: any) {
    console.error('Failed to update room type:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    // Fallback to local
    const existing = roomTypes.find(r => r.id === id);
    if (existing) {
      const updated = { ...existing, ...rt };
      roomTypes = roomTypes.map(r => r.id === id ? updated : r);
      return updated;
    }
    throw error; // Re-throw để component có thể handle error
  }
};

export const deleteRoomType = async (id: string): Promise<void> => {
  try {
    console.log('Deleting room type via API:', id);
    await apiClient.delete(`/room-types/${id}`);
    console.log('Room type deleted successfully');
  } catch (error) {
    console.error('Failed to delete room type via API:', error);
    console.warn('Falling back to local mock data. Room type will NOT be deleted from database!');
    // Fallback to local
    roomTypes = roomTypes.filter(rt => rt.id !== id);
    throw error; // Re-throw để component có thể handle error
  }
};

// --- ROOMS (Inventory) ---
export const getRooms = async (): Promise<Room[]> => {
  try {
    const dbRooms = await apiClient.get<any[]>('/rooms');
    return dbRooms.map(r => ({
      id: r.id.toString(),
      number: r.number,
      typeId: r.type_id.toString(),
      status: r.status as 'Available' | 'Occupied' | 'Maintenance'
    }));
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return rooms; // Fallback to mock data
  }
};

export const addRoom = async (r: Room): Promise<Room> => {
  try {
    const dbRoom = await apiClient.post<any>('/rooms', {
      number: r.number,
      type_id: parseInt(r.typeId),
      status: r.status || 'Available'
    });
    return {
      id: dbRoom.id.toString(),
      number: dbRoom.number,
      typeId: dbRoom.type_id.toString(),
      status: dbRoom.status as 'Available' | 'Occupied' | 'Maintenance'
    };
  } catch (error) {
    console.error('Failed to add room:', error);
    // Fallback to local
    const newRoom = { ...r, id: r.id || Date.now().toString() };
    rooms = [...rooms, newRoom];
    return newRoom;
  }
};

export const deleteRoom = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/rooms/${id}`);
  } catch (error) {
    console.error('Failed to delete room:', error);
    // Fallback to local
    rooms = rooms.filter(r => r.id !== id);
  }
};

export const importRoomsFromCSV = async (csvContent: string): Promise<number> => {
    // Format: RoomNumber, RoomTypeName
    const lines = csvContent.split(/\r?\n/);
    let count = 0;

    lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 2) {
            const number = parts[0].trim();
            const typeName = parts[1].trim();

            if (number && typeName) {
                // Find matching type ID
                const typeObj = roomTypes.find(rt => rt.name.toLowerCase() === typeName.toLowerCase());
                if (typeObj) {
                     const existingIdx = rooms.findIndex(r => r.number === number);
                     const newRoom: Room = {
                         id: existingIdx >= 0 ? rooms[existingIdx].id : Date.now().toString() + Math.random(),
                         number,
                         typeId: typeObj.id,
                         status: 'Available'
                     };

                     if (existingIdx >= 0) rooms[existingIdx] = newRoom;
                     else rooms.push(newRoom);
                     count++;
                }
            }
        }
    });
    return count;
};


// --- MENU ---
export const getMenu = async (categoryFilter?: 'Dining' | 'Spa' | 'Pool' | 'Butler'): Promise<MenuItem[]> => {
  try {
    console.log('Fetching menu items from API...');
    const dbMenuItems = await apiClient.get<any[]>('/menu-items');
    console.log('Menu items API response:', dbMenuItems);
    
    let filtered = dbMenuItems.map(item => ({
      id: item.id.toString(),
      name: item.name,
      price: parseFloat(item.price),
      category: item.category as 'Dining' | 'Spa' | 'Pool' | 'Butler',
      description: item.description || undefined
    }));
    
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    console.log('Mapped menu items:', filtered);
    return filtered;
  } catch (error) {
    console.error('Failed to fetch menu items from API:', error);
    console.warn('Falling back to mock menu data. This means menu items are NOT saved to database!');
    // Fallback to mock data
    if (categoryFilter) {
      return menuItems.filter(item => item.category === categoryFilter);
    }
    return menuItems;
  }
};

// Sync version for backward compatibility (used by AdminPortal)
export const getMenuSync = (categoryFilter?: 'Dining' | 'Spa' | 'Pool' | 'Butler') => {
    if (categoryFilter) {
        return menuItems.filter(item => item.category === categoryFilter);
    }
    return menuItems;
};
export const addMenuItem = async (item: MenuItem): Promise<void> => {
  try {
    const requestBody = {
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description || null
    };
    
    console.log('Adding menu item via API - Input:', item);
    console.log('Adding menu item via API - Request Body:', requestBody);
    
    const dbMenuItem = await apiClient.post<any>('/menu-items', requestBody);
    
    console.log('Menu item added successfully - API Response:', dbMenuItem);
    
    // Update local cache
    const mappedItem = {
      id: dbMenuItem.id.toString(),
      name: dbMenuItem.name,
      price: parseFloat(dbMenuItem.price),
      category: dbMenuItem.category as 'Dining' | 'Spa' | 'Pool' | 'Butler',
      description: dbMenuItem.description || undefined
    };
    
    menuItems = [...menuItems, mappedItem];
    console.log('Menu item added to local cache:', mappedItem);
  } catch (error: any) {
    console.error('Failed to add menu item via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. Menu item will NOT be saved to database!');
    // Fallback to local state
    menuItems = [...menuItems, { ...item, id: Date.now().toString() }];
    throw error;
  }
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  try {
    console.log('Deleting menu item via API:', id);
    await apiClient.delete(`/menu-items/${id}`);
    console.log('Menu item deleted successfully from database');
    // Update local cache
    menuItems = menuItems.filter(m => m.id !== id);
    console.log('Menu item removed from local cache');
  } catch (error: any) {
    console.error('Failed to delete menu item via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. Menu item will NOT be deleted from database!');
    // Fallback to local state
    menuItems = menuItems.filter(m => m.id !== id);
    throw error; // Re-throw để component có thể handle error
  }
};

// --- EVENTS ---
export const getEvents = async (): Promise<ResortEvent[]> => {
  try {
    console.log('Fetching events from API...');
    const dbEvents = await apiClient.get<any[]>('/resort-events');
    console.log('Events API response:', dbEvents);
    
    const mapped = dbEvents.map(event => ({
      id: event.id.toString(),
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description || undefined
    }));
    
    console.log('Mapped events:', mapped);
    return mapped;
  } catch (error) {
    console.error('Failed to fetch events from API:', error);
    console.warn('Falling back to mock events. This means events are NOT loaded from database!');
    return events; // Fallback to mock data
  }
};

// Sync version for backward compatibility (used by AdminPortal)
export const getEventsSync = () => events;

export const addEvent = async (event: ResortEvent): Promise<void> => {
  try {
    const requestBody = {
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description || null
    };
    
    console.log('Adding event via API - Input:', event);
    console.log('Adding event via API - Request Body:', requestBody);
    
    const dbEvent = await apiClient.post<any>('/resort-events', requestBody);
    
    console.log('Event added successfully - API Response:', dbEvent);
    
    // Update local cache
    const mappedEvent = {
      id: dbEvent.id.toString(),
      title: dbEvent.title,
      date: dbEvent.date,
      time: dbEvent.time,
      location: dbEvent.location,
      description: dbEvent.description || undefined
    };
    
    events = [...events, mappedEvent];
    console.log('Event added to local cache:', mappedEvent);
  } catch (error: any) {
    console.error('Failed to add event via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. Event will NOT be saved to database!');
    // Fallback to local state
    events = [...events, { ...event, id: Date.now().toString() }];
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    console.log('Deleting event via API:', id);
    await apiClient.delete(`/resort-events/${id}`);
    console.log('Event deleted successfully from database');
    // Update local cache
    events = events.filter(e => e.id !== id);
    console.log('Event removed from local cache');
  } catch (error: any) {
    console.error('Failed to delete event via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. Event will NOT be deleted from database!');
    // Fallback to local state
    events = events.filter(e => e.id !== id);
    throw error; // Re-throw để component có thể handle error
  }
};

// --- PROMOTIONS ---
export const getPromotions = async (): Promise<Promotion[]> => {
  try {
    console.log('Fetching promotions from API...');
    const dbPromotions = await apiClient.get<any[]>('/promotions');
    console.log('Promotions API response:', dbPromotions);
    
    const mapped = dbPromotions.map(promo => ({
      id: promo.id.toString(),
      title: promo.title,
      description: promo.description || undefined,
      discount: promo.discount || undefined,
      validUntil: promo.valid_until || undefined,
      imageColor: promo.image_color || 'bg-emerald-500'
    }));
    
    console.log('Mapped promotions:', mapped);
    return mapped;
  } catch (error) {
    console.error('Failed to fetch promotions from API:', error);
    console.warn('Falling back to mock promotions. This means promotions are NOT loaded from database!');
    return promotions; // Fallback to mock data
  }
};

// Sync version for backward compatibility (used by AdminPortal)
export const getPromotionsSync = () => promotions;

export const addPromotion = async (promo: Promotion): Promise<void> => {
  try {
    const requestBody = {
      title: promo.title,
      description: promo.description || null,
      discount: promo.discount || null,
      valid_until: promo.validUntil || null,
      image_color: promo.imageColor || 'bg-emerald-500',
      image_url: null
    };
    
    console.log('Adding promotion via API - Input:', promo);
    console.log('Adding promotion via API - Request Body:', requestBody);
    
    const dbPromotion = await apiClient.post<any>('/promotions', requestBody);
    
    console.log('Promotion added successfully - API Response:', dbPromotion);
    
    // Update local cache
    const mappedPromo = {
      id: dbPromotion.id.toString(),
      title: dbPromotion.title,
      description: dbPromotion.description || undefined,
      discount: dbPromotion.discount || undefined,
      validUntil: dbPromotion.valid_until || undefined,
      imageColor: dbPromotion.image_color || 'bg-emerald-500'
    };
    
    promotions = [...promotions, mappedPromo];
    console.log('Promotion added to local cache:', mappedPromo);
  } catch (error: any) {
    console.error('Failed to add promotion via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. Promotion will NOT be saved to database!');
    // Fallback to local state
    promotions = [...promotions, { ...promo, id: Date.now().toString(), imageColor: 'bg-emerald-500' }];
    throw error;
  }
};

export const deletePromotion = async (id: string): Promise<void> => {
  try {
    console.log('Deleting promotion via API:', id);
    await apiClient.delete(`/promotions/${id}`);
    console.log('Promotion deleted successfully from database');
    // Update local cache
    promotions = promotions.filter(p => p.id !== id);
    console.log('Promotion removed from local cache');
  } catch (error: any) {
    console.error('Failed to delete promotion via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. Promotion will NOT be deleted from database!');
    // Fallback to local state
    promotions = promotions.filter(p => p.id !== id);
    throw error; // Re-throw để component có thể handle error
  }
};

// --- KNOWLEDGE BASE (AI Training) ---
export const getKnowledgeBase = async (): Promise<KnowledgeItem[]> => {
  try {
    console.log('Fetching knowledge items from API...');
    const dbKnowledgeItems = await apiClient.get<any[]>('/knowledge-items');
    console.log('Knowledge items API response:', dbKnowledgeItems);
    
    const mapped = dbKnowledgeItems.map(item => ({
      id: item.id.toString(),
      question: item.question,
      answer: item.answer
    }));
    
    console.log('Mapped knowledge items:', mapped);
    // Update local cache
    knowledgeBase = mapped;
    return mapped;
  } catch (error) {
    console.error('Failed to fetch knowledge items from API:', error);
    console.warn('Falling back to mock knowledge. This means knowledge items are NOT loaded from database!');
    return knowledgeBase; // Fallback to mock data
  }
};

// Sync version for backward compatibility
export const getKnowledgeBaseSync = () => knowledgeBase;

export const addKnowledgeItem = async (item: KnowledgeItem): Promise<void> => {
  try {
    const requestBody = {
      question: item.question,
      answer: item.answer
    };
    
    console.log('Adding knowledge item via API - Input:', item);
    console.log('Adding knowledge item via API - Request Body:', requestBody);
    
    const dbKnowledgeItem = await apiClient.post<any>('/knowledge-items', requestBody);
    
    console.log('Knowledge item added successfully - API Response:', dbKnowledgeItem);
    
    // Update local cache
    const mappedItem = {
      id: dbKnowledgeItem.id.toString(),
      question: dbKnowledgeItem.question,
      answer: dbKnowledgeItem.answer
    };
    
    knowledgeBase = [...knowledgeBase, mappedItem];
    console.log('Knowledge item added to local cache:', mappedItem);
  } catch (error: any) {
    console.error('Failed to add knowledge item via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. Knowledge item will NOT be saved to database!');
    // Fallback to local state
    knowledgeBase = [...knowledgeBase, { ...item, id: Date.now().toString() }];
    throw error;
  }
};

export const deleteKnowledgeItem = async (id: string): Promise<void> => {
  try {
    console.log('Deleting knowledge item via API:', id);
    await apiClient.delete(`/knowledge-items/${id}`);
    console.log('Knowledge item deleted successfully from database');
    // Update local cache
    knowledgeBase = knowledgeBase.filter(k => k.id !== id);
    console.log('Knowledge item removed from local cache');
  } catch (error: any) {
    console.error('Failed to delete knowledge item via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. Knowledge item will NOT be deleted from database!');
    // Fallback to local state
    knowledgeBase = knowledgeBase.filter(k => k.id !== id);
    throw error; // Re-throw để component có thể handle error
  }
};

// --- RIDES (Buggy) ---
export const getRides = () => rides;

export const requestRide = async (guestName: string, roomNumber: string, pickup: string, destination: string): Promise<RideRequest> => {
  try {
    const dbRide = await apiClient.post<any>('/ride-requests', {
      guest_name: guestName,
      room_number: roomNumber,
      pickup,
      destination,
      status: 'SEARCHING',
      timestamp: Date.now()
    });
    
    // Map database format to frontend format
    const ride: RideRequest = {
      id: dbRide.id.toString(),
      guestName: dbRide.guest_name,
      roomNumber: dbRide.room_number,
      pickup: dbRide.pickup,
      destination: dbRide.destination,
      status: dbRide.status as BuggyStatus,
      timestamp: dbRide.timestamp,
      driverId: dbRide.driver_id ? dbRide.driver_id.toString() : undefined,
      eta: dbRide.eta
    };
    
    // Notify drivers (if notification system exists)
    // sendNotification('driver', 'New Ride Request', `Guest ${guestName} (Room ${roomNumber}) needs a ride.`, 'INFO');
    
    return ride;
  } catch (error) {
    console.error('Failed to request ride:', error);
    // Fallback to local
    const newRide: RideRequest = {
      id: Date.now().toString(),
      guestName,
      roomNumber,
      pickup,
      destination,
      status: BuggyStatus.SEARCHING,
      timestamp: Date.now()
    };
    rides = [...rides, newRide];
    return newRide;
  }
};

// Driver creates ride manually (e.g. walk-in guest)
export const createManualRide = (driverId: string, roomNumber: string, pickup: string, destination: string): RideRequest => {
    // Try to find guest name if room number exists
    const guest = users.find(u => u.roomNumber === roomNumber && u.role === UserRole.GUEST);
    const guestName = guest ? guest.lastName : (roomNumber ? `Guest ${roomNumber}` : 'Walk-in Guest');

    const newRide: RideRequest = {
        id: Date.now().toString(),
        guestName: guestName,
        roomNumber: roomNumber || 'Walk-in',
        pickup,
        destination,
        status: BuggyStatus.ASSIGNED, // Directly assigned to the driver
        driverId: driverId,
        timestamp: Date.now(),
        eta: 0 // Assume driver is there
    };
    
    rides = [...rides, newRide];
    return newRide;
};

export const updateRideStatus = (rideId: string, status: BuggyStatus, driverId?: string, eta?: number) => {
  const ride = rides.find(r => r.id === rideId);
  if (!ride) return;

  rides = rides.map(r => {
    if (r.id === rideId) {
      const updatedRide = { 
        ...r, 
        status, 
        driverId: driverId || r.driverId, 
        eta: eta !== undefined ? eta : r.eta 
      };

      if (status === BuggyStatus.ON_TRIP && !updatedRide.pickedUpAt) {
          updatedRide.pickedUpAt = Date.now();
      }
      if (status === BuggyStatus.COMPLETED && !updatedRide.completedAt) {
          updatedRide.completedAt = Date.now();
      }

      return updatedRide;
    }
    return r;
  });

  // Notify Guest of status change
  if (status === BuggyStatus.ASSIGNED) {
      sendNotification(ride.roomNumber, 'Buggy Assigned', `A driver is on the way. ETA: ${eta} mins.`, 'SUCCESS');
  } else if (status === BuggyStatus.ARRIVING) {
      sendNotification(ride.roomNumber, 'Buggy Arriving', `Your buggy has arrived at ${ride.pickup}.`, 'INFO');
  } else if (status === BuggyStatus.COMPLETED) {
      sendNotification(ride.roomNumber, 'Ride Completed', `You have arrived at ${ride.destination}. Have a nice day!`, 'SUCCESS');
  }
};

export const cancelRide = async (rideId: string): Promise<void> => {
  try {
    await apiClient.delete(`/ride-requests/${rideId}`);
    
    // Notify guest confirming cancellation (if notification system exists)
    // const ride = rides.find(r => r.id === rideId);
    // if (ride) {
    //   sendNotification(ride.roomNumber, 'Ride Cancelled', 'Your buggy request has been cancelled.', 'WARNING');
    //   if (ride.driverId) {
    //     sendNotification(ride.driverId, 'Ride Cancelled', `Ride for Room ${ride.roomNumber} has been cancelled by guest.`, 'WARNING');
    //   } else {
    //     sendNotification('driver', 'Request Cancelled', `Search for Room ${ride.roomNumber} cancelled.`, 'WARNING');
    //   }
    // }
  } catch (error) {
    console.error('Failed to cancel ride:', error);
    // Fallback to local
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      // sendNotification(ride.roomNumber, 'Ride Cancelled', 'Your buggy request has been cancelled.', 'WARNING');
    }
    rides = rides.filter(r => r.id !== rideId);
  }
};

export const getActiveRideForUser = async (roomNumber: string): Promise<RideRequest | undefined> => {
  try {
    // Try to get active ride - API returns 404 if no active ride, which is OK
    const dbRide = await apiClient.get<any>(`/ride-requests/room/${roomNumber}/active`).catch((error: any) => {
      // 404 means no active ride, which is fine
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        return null;
      }
      throw error; // Re-throw other errors
    });
    
    if (!dbRide) {
      return undefined;
    }
    
    // Map database format to frontend format
    return {
      id: dbRide.id.toString(),
      guestName: dbRide.guest_name,
      roomNumber: dbRide.room_number,
      pickup: dbRide.pickup,
      destination: dbRide.destination,
      status: dbRide.status as BuggyStatus,
      timestamp: dbRide.timestamp,
      driverId: dbRide.driver_id ? dbRide.driver_id.toString() : undefined,
      eta: dbRide.eta
    };
  } catch (error) {
    console.error('Failed to get active ride:', error);
    // Fallback to local
    return rides.find(r => r.roomNumber === roomNumber && r.status !== BuggyStatus.COMPLETED);
  }
};

// --- SERVICES ---
export const getServiceRequests = async (): Promise<ServiceRequest[]> => {
  try {
    const dbRequests = await apiClient.get<any[]>('/service-requests');
    return dbRequests.map(mapServiceRequestToFrontend);
  } catch (error) {
    console.error('Failed to get service requests:', error);
    return serviceRequests; // Fallback to local
  }
};

export const addServiceRequest = async (req: ServiceRequest): Promise<ServiceRequest> => {
  try {
    // Prepare request body for API
    // Note: Database doesn't have items column, so we include items info in details
    const itemsInfo = req.items && req.items.length > 0 
      ? `Items: ${req.items.map(i => i.name).join(', ')}. ` 
      : '';
    const requestBody: any = {
      type: req.type,
      status: req.status || 'PENDING',
      details: itemsInfo + req.details,
      room_number: req.roomNumber,
      timestamp: req.timestamp || Date.now()
    };

    const dbRequest = await apiClient.post<any>('/service-requests', requestBody);
    const newRequest = mapServiceRequestToFrontend(dbRequest);
    
    // Update local state
    serviceRequests = [newRequest, ...serviceRequests];
    
    // Notify Guest
    sendNotification(req.roomNumber, 'Order Received', `We have received your ${req.type.toLowerCase()} request.`, 'INFO');
    
    // Notify Staff of that Department
    const readableType = req.type.charAt(0) + req.type.slice(1).toLowerCase(); // Dining, Spa, etc.
    notifyStaffByDepartment(readableType, 'New Service Request', `Room ${req.roomNumber}: ${req.details}`);
    
    return newRequest;
  } catch (error) {
    console.error('Failed to add service request:', error);
    // Fallback to local
    serviceRequests = [req, ...serviceRequests];
    
    // Notify Guest
    sendNotification(req.roomNumber, 'Order Received', `We have received your ${req.type.toLowerCase()} request.`, 'INFO');
    
    // Notify Staff of that Department
    const readableType = req.type.charAt(0) + req.type.slice(1).toLowerCase();
    await notifyStaffByDepartment(readableType, 'New Service Request', `Room ${req.roomNumber}: ${req.details}`);
    
    return req;
  }
};

export const updateServiceStatus = (id: string, status: 'PENDING' | 'CONFIRMED' | 'COMPLETED') => {
    const req = serviceRequests.find(s => s.id === id);
    if (!req) return;

    // Update with Timestamps
    serviceRequests = serviceRequests.map(s => {
        if (s.id === id) {
            const updated = { ...s, status };
            if (status === 'CONFIRMED' && !s.confirmedAt) updated.confirmedAt = Date.now();
            if (status === 'COMPLETED' && !s.completedAt) updated.completedAt = Date.now();
            return updated;
        }
        return s;
    });

    // Notify Guest of status change
    if (status === 'CONFIRMED') {
        sendNotification(req.roomNumber, 'Order Confirmed', `Your ${req.type.toLowerCase()} request has been confirmed.`, 'SUCCESS');
    } else if (status === 'COMPLETED') {
        sendNotification(req.roomNumber, 'Order Completed', `Your ${req.type.toLowerCase()} service is complete.`, 'SUCCESS');
    }
};

export const rateServiceRequest = async (id: string, rating: number, feedback: string): Promise<void> => {
  try {
    // Try to update service request first
    try {
      await apiClient.put(`/service-requests/${id}`, { rating, feedback });
      // Update local state
      const serviceIdx = serviceRequests.findIndex(s => s.id === id);
      if (serviceIdx >= 0) {
        serviceRequests[serviceIdx] = { ...serviceRequests[serviceIdx], rating, feedback };
        return;
      }
    } catch (serviceError) {
      // If not a service request, try ride request
      try {
        await apiClient.put(`/ride-requests/${id}`, { rating, feedback });
        // Update local state
        const rideIdx = rides.findIndex(r => r.id === id);
        if (rideIdx >= 0) {
          rides[rideIdx] = { ...rides[rideIdx], rating, feedback };
          return;
        }
      } catch (rideError) {
        console.error('Failed to rate service/ride request:', serviceError, rideError);
        // Fallback to local state
        const serviceIdx = serviceRequests.findIndex(s => s.id === id);
        if (serviceIdx >= 0) {
          serviceRequests[serviceIdx] = { ...serviceRequests[serviceIdx], rating, feedback };
          return;
        }
        const rideIdx = rides.findIndex(r => r.id === id);
        if (rideIdx >= 0) {
          rides[rideIdx] = { ...rides[rideIdx], rating, feedback };
          return;
        }
      }
    }
  } catch (error) {
    console.error('Failed to rate service request:', error);
    // Fallback to local state
    const serviceIdx = serviceRequests.findIndex(s => s.id === id);
    if (serviceIdx >= 0) {
      serviceRequests[serviceIdx] = { ...serviceRequests[serviceIdx], rating, feedback };
      return;
    }
    const rideIdx = rides.findIndex(r => r.id === id);
    if (rideIdx >= 0) {
      rides[rideIdx] = { ...rides[rideIdx], rating, feedback };
      return;
    }
  }
};

// --- HOTEL REVIEWS ---
export const submitHotelReview = (review: HotelReview) => {
    // Remove existing review if updating
    hotelReviews = hotelReviews.filter(r => r.roomNumber !== review.roomNumber);
    hotelReviews.push(review);
};

export const getHotelReview = (roomNumber: string): HotelReview | undefined => {
    return hotelReviews.find(r => r.roomNumber === roomNumber);
};

export const getAllHotelReviews = () => hotelReviews;


// Helper function to map database service request to frontend format
const mapServiceRequestToFrontend = (dbReq: any): ServiceRequest => {
  let items: MenuItem[] = [];
  try {
    if (dbReq.items) {
      items = typeof dbReq.items === 'string' ? JSON.parse(dbReq.items) : dbReq.items;
    }
  } catch (e) {
    console.error('Failed to parse items:', e);
  }

  return {
    id: dbReq.id.toString(),
    type: dbReq.type,
    status: dbReq.status,
    details: dbReq.details || '',
    items: items,
    roomNumber: dbReq.room_number || dbReq.roomNumber,
    timestamp: dbReq.created_at ? new Date(dbReq.created_at).getTime() : Date.now(),
    rating: dbReq.rating || undefined,
    feedback: dbReq.feedback || undefined,
    confirmedAt: dbReq.confirmed_at ? new Date(dbReq.confirmed_at).getTime() : undefined,
    completedAt: dbReq.completed_at ? new Date(dbReq.completed_at).getTime() : undefined
  };
};

// --- UNIFIED HISTORY (Services + Buggy) ---
export const getUnifiedHistory = async (): Promise<ServiceRequest[]> => {
  try {
    // Get service requests from API
    const dbServiceRequests = await apiClient.get<any[]>('/service-requests');
    const apiServiceRequests = dbServiceRequests.map(mapServiceRequestToFrontend);
    
    // Get ride requests from API
    const dbRideRequests = await apiClient.get<any[]>('/ride-requests');
    const buggyHistory: ServiceRequest[] = dbRideRequests.map(r => ({
      id: r.id.toString(),
      type: 'BUGGY',
      status: r.status,
      details: `From ${r.pickup} to ${r.destination} (${r.guest_name || r.guestName})`,
      roomNumber: r.room_number || r.roomNumber,
      timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      rating: r.rating || undefined,
      feedback: r.feedback || undefined
    }));

    const combined = [...apiServiceRequests, ...buggyHistory];
    // Sort descending by timestamp
    return combined.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to get unified history from API:', error);
    // Fallback to local state
    const buggyHistory: ServiceRequest[] = rides.map(r => ({
      id: r.id,
      type: 'BUGGY',
      status: r.status,
      details: `From ${r.pickup} to ${r.destination} (${r.guestName})`,
      roomNumber: r.roomNumber,
      timestamp: r.timestamp,
      rating: r.rating,
      feedback: r.feedback
    }));

    const combined = [...serviceRequests, ...buggyHistory];
    return combined.sort((a, b) => b.timestamp - a.timestamp);
  }
};

// --- GUEST SPECIFIC DATA ---
export const getGuestHistory = async (roomNumber: string): Promise<ServiceRequest[]> => {
  try {
    const all = await getUnifiedHistory();
    return all.filter(req => req.roomNumber === roomNumber);
  } catch (error) {
    console.error('Failed to get guest history:', error);
    return [];
  }
};

export const getActiveGuestOrders = async (roomNumber: string): Promise<ServiceRequest[]> => {
  try {
    const all = await getGuestHistory(roomNumber);
    return all.filter(req => 
        req.status === 'PENDING' || 
        req.status === 'CONFIRMED' || 
        req.status === 'ARRIVING' || 
        req.status === 'ASSIGNED' || 
        req.status === 'ON_TRIP' ||
        req.status === 'SEARCHING' // Buggy status
    );
  } catch (error) {
    console.error('Failed to get active guest orders:', error);
    return [];
  }
};

export const getCompletedGuestOrders = async (roomNumber: string): Promise<ServiceRequest[]> => {
  try {
    const all = await getGuestHistory(roomNumber);
    return all.filter(req => req.status === 'COMPLETED');
  } catch (error) {
    console.error('Failed to get completed guest orders:', error);
    return [];
  }
};

// --- SERVICE CHATS ---
// Helper function to map database chat message to frontend format
const mapChatMessageToFrontend = (dbMsg: any): ChatMessage => ({
  id: dbMsg.id.toString(),
  role: dbMsg.role === 'model' ? 'staff' : dbMsg.role, // Map 'model' to 'staff' for frontend
  text: dbMsg.text
});

export const getServiceMessages = async (roomNumber: string, service: string): Promise<ChatMessage[]> => {
  try {
    // Get messages filtered by service type
    const dbMessages = await apiClient.get<any[]>(`/chat-messages/room/${roomNumber}?service_type=${service}`);
    return dbMessages.map(mapChatMessageToFrontend);
  } catch (error) {
    console.error('Failed to fetch service messages:', error);
    // Fallback to local cache
    const key = `${roomNumber}_${service}`;
    return serviceChats[key] || [];
  }
};

// Keep sync version for backward compatibility
let serviceChatsCache: Record<string, ChatMessage[]> = {};

export const getServiceMessagesSync = (roomNumber: string, service: string): ChatMessage[] => {
  const key = `${roomNumber}_${service}`;
  return serviceChatsCache[key] || serviceChats[key] || [];
};

export const getLastMessage = async (roomNumber: string, service: string): Promise<ChatMessage | undefined> => {
  try {
    const messages = await getServiceMessages(roomNumber, service);
    return messages.length > 0 ? messages[messages.length - 1] : undefined;
  } catch (error) {
    console.error('Failed to get last message:', error);
    // Fallback to sync version
    const key = `${roomNumber}_${service}`;
    const msgs = serviceChats[key];
    if (msgs && msgs.length > 0) {
      return msgs[msgs.length - 1];
    }
    return undefined;
  }
};

export const sendServiceMessage = async (roomNumber: string, service: string, text: string, senderRole: 'user' | 'staff' = 'user'): Promise<void> => {
  try {
    // Get user ID if available
    const savedUser = localStorage.getItem('furama_user');
    let userId: number | undefined;
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      userId = parsedUser.id ? parseInt(parsedUser.id) : undefined;
    }

    // Map frontend role to database role
    const dbRole = senderRole === 'staff' ? 'model' : 'user';

    // Create message via API
    const dbMessage = await apiClient.post<any>('/chat-messages', {
      role: dbRole,
      text,
      user_id: userId || null,
      room_number: roomNumber,
      service_type: service // Include service type
    });

    // Update local cache
    const key = `${roomNumber}_${service}`;
    if (!serviceChatsCache[key]) serviceChatsCache[key] = [];
    serviceChatsCache[key] = [...serviceChatsCache[key], mapChatMessageToFrontend(dbMessage)];

    // Simulate Staff Response only if User sent message (for demo purposes)
    if (senderRole === 'user') {
      setTimeout(async () => {
        const replies = [
          `Our ${service.toLowerCase()} team has received your message.`,
          "We are checking on that for you right now.",
          "Thank you, noted.",
          "A staff member will be with you shortly."
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        try {
          const staffMessage = await apiClient.post<any>('/chat-messages', {
            role: 'model',
            text: randomReply,
            user_id: null,
            room_number: roomNumber,
            service_type: service // Include service type
          });
          
          // Update local cache
          serviceChatsCache[key] = [...serviceChatsCache[key], mapChatMessageToFrontend(staffMessage)];
        } catch (error) {
          console.error('Failed to send staff reply:', error);
        }
      }, 2500);
    }
  } catch (error) {
    console.error('Failed to send service message:', error);
    // Fallback to local behavior
    const key = `${roomNumber}_${service}`;
    if (!serviceChats[key]) serviceChats[key] = [];
    serviceChats[key] = [...serviceChats[key], { id: Date.now().toString(), role: senderRole, text }];
  }
};

// --- DASHBOARD ANALYTICS (Supervisor) ---
export const getDashboardStats = () => {
    // 1. Guests
    const activeGuests = users.filter(u => u.role === UserRole.GUEST).length;
    
    // 2. Services Stats
    const allRequests = getServiceRequests();
    const pendingDining = allRequests.filter(r => r.type === 'DINING' && r.status === 'PENDING').length;
    const pendingSpa = allRequests.filter(r => r.type === 'SPA' && r.status === 'PENDING').length;
    const pendingPool = allRequests.filter(r => r.type === 'POOL' && r.status === 'PENDING').length;
    const pendingButler = allRequests.filter(r => r.type === 'BUTLER' && r.status === 'PENDING').length;

    // 3. Buggies
    const allRides = getRides();
    const activeBuggies = allRides.filter(r => r.status === BuggyStatus.ON_TRIP || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ASSIGNED).length;
    const searchingBuggies = allRides.filter(r => r.status === BuggyStatus.SEARCHING).length;

    // 4. Daily Revenue Estimation (Simple Mock)
    // In a real app, orders would have actual totals. Here we assume average order values.
    // Dining: $40, Spa: $80
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    
    const todayCompleted = allRequests.filter(r => r.status === 'COMPLETED' && r.timestamp > todayStart.getTime());
    const diningRev = todayCompleted.filter(r => r.type === 'DINING').length * 40;
    const spaRev = todayCompleted.filter(r => r.type === 'SPA').length * 80;
    const totalRevenue = diningRev + spaRev;

    // 5. Activity Feed (Unified & Sorted)
    const recentActivity = getUnifiedHistory().filter(r => r.timestamp > todayStart.getTime()).slice(0, 10);

    return {
        activeGuests,
        pendingDining,
        pendingSpa,
        pendingPool,
        pendingButler,
        activeBuggies,
        searchingBuggies,
        totalRevenue,
        recentActivity,
        todayCompletedCount: todayCompleted.length
    };
};
