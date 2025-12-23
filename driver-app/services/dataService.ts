
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
    const dbUsers = await apiClient.get<any[]>('/users');
    
    const mapped = dbUsers.map(user => ({
      id: user.id.toString(),
      lastName: user.last_name,
      roomNumber: user.room_number,
      password: user.password || undefined,
      villaType: user.villa_type || undefined,
      role: user.role as UserRole,
      department: 'All' as Department, // Default, database doesn't have department field
      checkIn: user.check_in ? (typeof user.check_in === 'string' ? user.check_in : new Date(user.check_in).toISOString()) : undefined,
      checkOut: user.check_out ? (typeof user.check_out === 'string' ? user.check_out : new Date(user.check_out).toISOString()) : undefined,
      language: user.language || undefined,
      notes: user.notes || undefined,
      updatedAt: user.updated_at ? new Date(user.updated_at).getTime() : undefined,
      currentLat: user.current_lat ? parseFloat(user.current_lat) : undefined,
      currentLng: user.current_lng ? parseFloat(user.current_lng) : undefined,
      locationUpdatedAt: user.location_updated_at ? new Date(user.location_updated_at).getTime() : undefined
    }));
    
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
    const requestBody: any = {
      last_name: user.lastName,
      room_number: user.roomNumber,
      villa_type: user.villaType || null,
      role: user.role,
      password: user.password || '123', // Default password for new users
      language: user.language || 'English'
    };
    
    // Add check_in/check_out if provided
    if (user.checkIn) {
      requestBody.check_in = user.checkIn;
    }
    if (user.checkOut) {
      requestBody.check_out = user.checkOut;
    }
    
    console.log('Adding user via API - Input:', user);
    console.log('Adding user via API - Request Body:', requestBody);
    
    const dbUser = await apiClient.post<any>('/users', requestBody);
    
    
    // Update local cache
    const mappedUser: User = {
      id: dbUser.id.toString(),
      lastName: dbUser.last_name,
      roomNumber: dbUser.room_number,
      password: dbUser.password || undefined,
      villaType: dbUser.villa_type || undefined,
      role: dbUser.role as UserRole,
      department: 'All' as Department,
      checkIn: dbUser.check_in ? (typeof dbUser.check_in === 'string' ? dbUser.check_in : new Date(dbUser.check_in).toISOString()) : undefined,
      checkOut: dbUser.check_out ? (typeof dbUser.check_out === 'string' ? dbUser.check_out : new Date(dbUser.check_out).toISOString()) : undefined,
      language: dbUser.language || undefined
    };
    
    users = [...users, mappedUser];
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

export const updateUser = async (id: string, user: Partial<User>): Promise<User> => {
  try {
    const requestBody: any = {};
    
    if (user.lastName !== undefined) requestBody.last_name = user.lastName;
    if (user.roomNumber !== undefined) requestBody.room_number = user.roomNumber;
    if (user.villaType !== undefined) requestBody.villa_type = user.villaType || null;
    if (user.language !== undefined) requestBody.language = user.language || 'English';
    if (user.notes !== undefined) requestBody.notes = user.notes || null;
    if (user.checkIn !== undefined) requestBody.check_in = user.checkIn || null;
    if (user.checkOut !== undefined) requestBody.check_out = user.checkOut || null;
    
    
    const dbUser = await apiClient.put<any>(`/users/${id}`, requestBody);
    
    
    // If response is null but request was successful, use request body to construct user
    if (!dbUser) {
      console.warn('API returned null response, constructing user from request body and existing data');
      const existingUser = users.find(u => u.id === id);
      const updatedUser: User = {
        id: id,
        lastName: user.lastName !== undefined ? user.lastName : (existingUser?.lastName || ''),
        roomNumber: user.roomNumber !== undefined ? user.roomNumber : (existingUser?.roomNumber || ''),
        password: existingUser?.password || undefined,
        villaType: user.villaType !== undefined ? user.villaType : existingUser?.villaType,
        role: existingUser?.role || 'GUEST' as UserRole,
        department: 'All' as Department,
        checkIn: user.checkIn !== undefined ? user.checkIn : existingUser?.checkIn,
        checkOut: user.checkOut !== undefined ? user.checkOut : existingUser?.checkOut,
        language: user.language !== undefined ? user.language : existingUser?.language,
        notes: user.notes !== undefined ? user.notes : existingUser?.notes
      };
      
      const existingIndex = users.findIndex(u => u.id === id);
      if (existingIndex >= 0) {
        users[existingIndex] = updatedUser;
      } else {
        users = [updatedUser, ...users];
      }
      
      console.log('User updated in local cache (from request body):', updatedUser);
      return updatedUser;
    }
    
    // Update local cache
    const updatedUser: User = {
      id: dbUser.id ? dbUser.id.toString() : id,
      lastName: dbUser.last_name !== undefined ? dbUser.last_name : (user.lastName !== undefined ? user.lastName : ''),
      roomNumber: dbUser.room_number !== undefined ? dbUser.room_number : (user.roomNumber !== undefined ? user.roomNumber : ''),
      password: dbUser.password || undefined,
      villaType: dbUser.villa_type !== undefined ? dbUser.villa_type : (user.villaType !== undefined ? user.villaType : undefined),
      role: dbUser.role ? (dbUser.role as UserRole) : (users.find(u => u.id === id)?.role || 'GUEST' as UserRole),
      department: 'All' as Department,
      checkIn: dbUser.check_in ? (typeof dbUser.check_in === 'string' ? dbUser.check_in : new Date(dbUser.check_in).toISOString()) : (user.checkIn !== undefined ? user.checkIn : undefined),
      checkOut: dbUser.check_out ? (typeof dbUser.check_out === 'string' ? dbUser.check_out : new Date(dbUser.check_out).toISOString()) : (user.checkOut !== undefined ? user.checkOut : undefined),
      language: dbUser.language !== undefined ? dbUser.language : (user.language !== undefined ? user.language : undefined),
      notes: dbUser.notes !== undefined ? dbUser.notes : (user.notes !== undefined ? user.notes : undefined)
    };
    
    const existingIndex = users.findIndex(u => u.id === id);
    if (existingIndex >= 0) {
      users[existingIndex] = updatedUser;
    } else {
      users = [updatedUser, ...users];
    }
    
    return updatedUser;
  } catch (error: any) {
    console.error('Failed to update user via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
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
    const user = await apiClient.get<any>(`/users/room/${roomNumber}`);
    
    if (!user || !user.id) {
      const error = new Error('User not found or missing ID');
      console.error('Failed to update user notes - User not found:', roomNumber);
      throw error;
    }
    
    // Update user notes in database
    const updatedUser = await apiClient.put(`/users/${user.id}`, { notes });
    
    // Update localStorage
    const savedUser = localStorage.getItem('furama_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      parsedUser.notes = notes;
      localStorage.setItem('furama_user', JSON.stringify(parsedUser));
    }
  } catch (error: any) {
    console.error('=== updateUserNotes ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Fallback to localStorage on error
    console.log('Falling back to localStorage...');
    const savedUser = localStorage.getItem('furama_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      parsedUser.notes = notes;
      localStorage.setItem('furama_user', JSON.stringify(parsedUser));
      console.log('localStorage updated as fallback');
    }
    
    throw error; // Re-throw để component có thể handle error
  }
};

// Update driver heartbeat (last seen timestamp)
export const updateDriverHeartbeat = async (userId: string): Promise<void> => {
  try {
    console.log('[Heartbeat] Sending heartbeat for driver:', userId);
    const result = await apiClient.put(`/users/${userId}`, {});
    console.log('[Heartbeat] Heartbeat successful, updated_at:', result.updated_at);
    // Empty body will just update updated_at timestamp
  } catch (error) {
    console.error('[Heartbeat] Failed to update driver heartbeat:', error);
    // Silently fail - heartbeat is not critical
  }
};

// Mark driver as offline when they logout
export const markDriverOffline = async (userId: string): Promise<void> => {
  try {
    console.log('[Logout] Marking driver offline:', userId);
    await apiClient.post(`/users/${userId}/offline`, {});
    console.log('[Logout] Driver marked offline successfully');
  } catch (error) {
    console.error('[Logout] Failed to mark driver offline:', error);
    // Silently fail - logout should still proceed even if this fails
  }
};

// Set driver online status to 10 hours from now (for first login)
export const setDriverOnlineFor10Hours = async (userId: string): Promise<void> => {
  try {
    console.log('[First Login] Setting driver online for 10 hours, userId:', userId);
    console.log('[First Login] Calling API: POST /users/' + userId + '/online-10hours');
    const response = await apiClient.post(`/users/${userId}/online-10hours`, {});
    console.log('[First Login] API response:', response);
    console.log('[First Login] Driver set online for 10 hours successfully, updated_at:', response?.updated_at);
  } catch (error: any) {
    console.error('[First Login] Failed to set driver online for 10 hours:', error);
    console.error('[First Login] Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      data: error?.response?.data
    });
    // Silently fail - should still proceed even if this fails
  }
};

// Update driver location (GPS coordinates)
export const updateDriverLocation = async (userId: string, lat: number, lng: number): Promise<void> => {
  try {
    console.log('[Location] Updating driver location:', userId, { lat, lng });
    await apiClient.put(`/users/${userId}/location`, { lat, lng });
    console.log('[Location] Driver location updated successfully');
  } catch (error) {
    console.error('[Location] Failed to update driver location:', error);
    // Silently fail - location update is not critical for app functionality
  }
};

// Get all drivers with their current locations
export const getDriversWithLocations = async (): Promise<User[]> => {
  try {
    const dbDrivers = await apiClient.get<any[]>('/users/drivers/locations');
    return dbDrivers.map(user => ({
      id: user.id.toString(),
      lastName: user.last_name,
      roomNumber: user.room_number,
      password: user.password || undefined,
      villaType: user.villa_type || undefined,
      role: user.role as UserRole,
      department: 'All' as Department,
      language: user.language || undefined,
      notes: user.notes || undefined,
      updatedAt: user.updated_at ? new Date(user.updated_at).getTime() : undefined,
      currentLat: user.current_lat ? parseFloat(user.current_lat) : undefined,
      currentLng: user.current_lng ? parseFloat(user.current_lng) : undefined,
      locationUpdatedAt: user.location_updated_at ? new Date(user.location_updated_at).getTime() : undefined
    }));
  } catch (error) {
    console.error('Failed to fetch drivers with locations:', error);
    // Fallback to regular getUsers and filter
    const allUsers = await getUsers();
    return allUsers.filter(u => u.role === UserRole.DRIVER);
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

export const updateLocation = async (id: string, loc: Partial<Location>): Promise<Location> => {
  try {
    const requestBody: any = {};
    if (loc.name !== undefined) requestBody.name = loc.name;
    if (loc.lat !== undefined) requestBody.lat = loc.lat;
    if (loc.lng !== undefined) requestBody.lng = loc.lng;
    if (loc.type !== undefined) requestBody.type = loc.type || null;
    
    console.log('Updating location via API - ID:', id);
    console.log('Updating location via API - Request Body:', requestBody);
    
    const dbLocation = await apiClient.put<any>(`/locations/${id}`, requestBody);
    
    console.log('Location updated successfully - API Response:', dbLocation);
    
    // Update local cache
    const updatedLocation: Location = {
      id: dbLocation.id.toString(),
      lat: parseFloat(dbLocation.lat),
      lng: parseFloat(dbLocation.lng),
      name: dbLocation.name,
      type: dbLocation.type as 'VILLA' | 'FACILITY' | 'RESTAURANT'
    };
    
    const existingIndex = locations.findIndex(l => l.id === id);
    if (existingIndex >= 0) {
      locations[existingIndex] = updatedLocation;
    } else {
      locations = [updatedLocation, ...locations];
    }
    
    console.log('Location updated in local cache:', updatedLocation);
    return updatedLocation;
  } catch (error) {
    console.error('Failed to update location:', error);
    throw error;
  }
};

export const deleteLocation = async (idOrName: string): Promise<void> => {
  try {
    console.log('[deleteLocation] Attempting to delete location with id/name:', idOrName);
    console.log('[deleteLocation] Current locations cache:', locations.map(l => ({ id: l.id, name: l.name, idType: typeof l.id })));
    
    // Try to find location by ID or name (handle both string and number ID comparison)
    const location = locations.find(l => {
      // Compare by name
      if (l.name === idOrName) return true;
      // Compare by ID (handle both string and number)
      if (l.id) {
        const locationId = String(l.id);
        const searchId = String(idOrName);
        if (locationId === searchId) return true;
      }
      return false;
    });
    
    console.log('[deleteLocation] Found location:', location);
    
    if (location && location.id) {
      // Try to delete by ID
      const locationId = String(location.id);
      console.log('[deleteLocation] Deleting via API with ID:', locationId);
      const deleteResult = await apiClient.delete(`/locations/${locationId}`);
      console.log('[deleteLocation] API delete successful, response:', deleteResult);
      // Update local cache - compare IDs as strings to handle type mismatch
      const beforeCount = locations.length;
      locations = locations.filter(l => {
        if (!l.id) return true;
        return String(l.id) !== locationId;
      });
      const afterCount = locations.length;
      console.log(`[deleteLocation] Local cache updated: ${beforeCount} -> ${afterCount} locations`);
    } else {
      console.warn('[deleteLocation] Location not found in cache, trying to delete directly via API');
      // Try to delete directly via API using idOrName (could be ID or name)
      try {
        const deleteResult = await apiClient.delete(`/locations/${idOrName}`);
        console.log('[deleteLocation] API delete successful (direct delete), response:', deleteResult);
        // Refresh locations from API to update cache
        try {
          const refreshedLocations = await apiClient.get<any[]>('/locations');
          locations = refreshedLocations.map(loc => ({
            id: loc.id.toString(),
            lat: parseFloat(loc.lat),
            lng: parseFloat(loc.lng),
            name: loc.name,
            type: loc.type as 'VILLA' | 'FACILITY' | 'RESTAURANT'
          }));
          console.log('[deleteLocation] Locations cache refreshed from API');
        } catch (refreshError) {
          console.error('[deleteLocation] Failed to refresh locations after delete:', refreshError);
          // Fallback: try to remove from local cache by name
          const beforeCount = locations.length;
          locations = locations.filter(l => l.name !== idOrName);
          const afterCount = locations.length;
          console.log(`[deleteLocation] Fallback local delete: ${beforeCount} -> ${afterCount} locations`);
        }
      } catch (apiError) {
        console.error('[deleteLocation] Direct API delete failed:', apiError);
        // Final fallback: delete by name from local state
        const beforeCount = locations.length;
        locations = locations.filter(l => l.name !== idOrName);
        const afterCount = locations.length;
        console.log(`[deleteLocation] Final fallback local delete: ${beforeCount} -> ${afterCount} locations`);
        if (beforeCount === afterCount) {
          console.warn('[deleteLocation] No location was deleted! Location may not exist.');
        }
        throw apiError;
      }
    }
  } catch (error: any) {
    console.error('[deleteLocation] Failed to delete location:', error);
    console.error('[deleteLocation] Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      data: error?.response?.data
    });
    // Fallback to local state
    const beforeCount = locations.length;
    locations = locations.filter(l => l.name !== idOrName && l.id !== idOrName);
    const afterCount = locations.length;
    console.log(`[deleteLocation] Fallback local delete: ${beforeCount} -> ${afterCount} locations`);
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


// Helper function to get current user language
const getCurrentLanguage = (): string => {
  try {
    const savedUser = localStorage.getItem('furama_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      return parsedUser.language || 'English';
    }
  } catch (error) {
    console.error('Failed to get user language from localStorage:', error);
  }
  return 'English';
};

// --- MENU ---
export const getMenu = async (categoryFilter?: 'Dining' | 'Spa' | 'Pool' | 'Butler'): Promise<MenuItem[]> => {
  try {
    const language = getCurrentLanguage();
    console.log('Fetching menu items from API...', { language, categoryFilter });
    const queryParams = new URLSearchParams();
    if (language) queryParams.append('language', language);
    if (categoryFilter) queryParams.append('category', categoryFilter);
    const queryString = queryParams.toString();
    const endpoint = `/menu-items${queryString ? `?${queryString}` : ''}`;
    const dbMenuItems = await apiClient.get<any[]>(endpoint);
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
    const language = getCurrentLanguage();
    const requestBody = {
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description || null,
      language: language
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

export const updateMenuItem = async (id: string, item: Partial<MenuItem>): Promise<MenuItem> => {
  try {
    const language = getCurrentLanguage();
    const requestBody: any = {};
    if (item.name !== undefined) requestBody.name = item.name;
    if (item.price !== undefined) requestBody.price = item.price;
    if (item.category !== undefined) requestBody.category = item.category;
    if (item.description !== undefined) requestBody.description = item.description || null;
    requestBody.language = language;
    
    console.log('Updating menu item via API - ID:', id);
    console.log('Updating menu item via API - Request Body:', requestBody);
    
    const dbMenuItem = await apiClient.put<any>(`/menu-items/${id}`, requestBody);
    
    console.log('Menu item updated successfully - API Response:', dbMenuItem);
    
    // Update local cache
    const updatedItem: MenuItem = {
      id: dbMenuItem.id.toString(),
      name: dbMenuItem.name,
      price: parseFloat(dbMenuItem.price),
      category: dbMenuItem.category as 'Dining' | 'Spa' | 'Pool' | 'Butler',
      description: dbMenuItem.description || undefined
    };
    
    const existingIndex = menuItems.findIndex(m => m.id === id);
    if (existingIndex >= 0) {
      menuItems[existingIndex] = updatedItem;
    } else {
      menuItems = [updatedItem, ...menuItems];
    }
    
    console.log('Menu item updated in local cache:', updatedItem);
    return updatedItem;
  } catch (error: any) {
    console.error('Failed to update menu item via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
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
    const language = getCurrentLanguage();
    console.log('Fetching events from API...', { language });
    const queryParams = new URLSearchParams();
    if (language) queryParams.append('language', language);
    const queryString = queryParams.toString();
    const endpoint = `/resort-events${queryString ? `?${queryString}` : ''}`;
    const dbEvents = await apiClient.get<any[]>(endpoint);
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
    const language = getCurrentLanguage();
    const requestBody = {
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description || null,
      language: language
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
    const language = getCurrentLanguage();
    console.log('Fetching promotions from API...', { language });
    const queryParams = new URLSearchParams();
    if (language) queryParams.append('language', language);
    const queryString = queryParams.toString();
    const endpoint = `/promotions${queryString ? `?${queryString}` : ''}`;
    const dbPromotions = await apiClient.get<any[]>(endpoint);
    console.log('Promotions API response:', dbPromotions);
    
    const mapped = dbPromotions.map(promo => ({
      id: promo.id.toString(),
      title: promo.title,
      description: promo.description || undefined,
      discount: promo.discount || undefined,
      validUntil: promo.valid_until || undefined,
      imageColor: promo.image_color || 'bg-emerald-500',
      imageUrl: promo.image_url || undefined
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
    const language = getCurrentLanguage();
    const requestBody = {
      title: promo.title,
      description: promo.description || null,
      discount: promo.discount || null,
      valid_until: promo.validUntil || null,
      image_color: promo.imageColor || 'bg-emerald-500',
      image_url: promo.imageUrl || null,
      language: language
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
      imageColor: dbPromotion.image_color || 'bg-emerald-500',
      imageUrl: dbPromotion.image_url || undefined
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

export const updatePromotion = async (id: string, promo: Partial<Promotion>): Promise<Promotion> => {
  try {
    const language = getCurrentLanguage();
    const requestBody: any = {};
    
    // Text fields (language-specific)
    if (promo.title !== undefined) requestBody.title = promo.title;
    if (promo.description !== undefined) requestBody.description = promo.description || null;
    requestBody.language = language;
    
    // Shared fields (will be updated for all languages)
    if (promo.discount !== undefined) requestBody.discount = promo.discount || null;
    if (promo.validUntil !== undefined) requestBody.valid_until = promo.validUntil || null;
    if (promo.imageColor !== undefined) requestBody.image_color = promo.imageColor || 'bg-emerald-500';
    if (promo.imageUrl !== undefined) requestBody.image_url = promo.imageUrl || null;
    
    console.log('Updating promotion via API - ID:', id);
    console.log('Updating promotion via API - Request Body:', requestBody);
    console.log('Note: Shared fields (discount, valid_until, image_color, image_url) will be updated for all languages');
    
    const dbPromotion = await apiClient.put<any>(`/promotions/${id}`, requestBody);
    
    console.log('Promotion updated successfully - API Response:', dbPromotion);
    
    // Refresh all promotions to get updated data for all languages
    try {
      const allPromotions = await getPromotions();
      promotions = allPromotions;
      console.log('All promotions refreshed after update');
    } catch (refreshError) {
      console.warn('Failed to refresh promotions, using single update result:', refreshError);
    }
    
    // Update local cache
    const mappedPromo: Promotion = {
      id: dbPromotion.id.toString(),
      title: dbPromotion.title,
      description: dbPromotion.description || '',
      discount: dbPromotion.discount || undefined,
      validUntil: dbPromotion.valid_until || undefined,
      imageColor: dbPromotion.image_color || 'bg-emerald-500',
      imageUrl: dbPromotion.image_url || undefined,
      translations: dbPromotion.translations || undefined
    };
    
    promotions = promotions.map(p => p.id === id ? mappedPromo : p);
    console.log('Promotion updated in local cache:', mappedPromo);
    
    return mappedPromo;
  } catch (error: any) {
    console.error('Failed to update promotion via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
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
export const getRides = async (): Promise<RideRequest[]> => {
  try {
    console.log('Fetching rides from API...');
    const dbRides = await apiClient.get<any[]>('/ride-requests');
    console.log('Rides API response:', dbRides);
    
    const mapped = dbRides.map(r => {
      // Handle timestamp: prefer timestamp (bigint), fallback to created_at, then Date.now()
      let reqTimestamp: number;
      if (r.timestamp && typeof r.timestamp === 'number' && r.timestamp > 0) {
        reqTimestamp = r.timestamp;
      } else if (r.created_at) {
        const createdDate = new Date(r.created_at);
        reqTimestamp = isNaN(createdDate.getTime()) ? Date.now() : createdDate.getTime();
      } else {
        // Fallback: use Date.now() if both are missing
        console.warn(`[getRides] Missing timestamp for ride ${r.id}, using Date.now()`, { timestamp: r.timestamp, created_at: r.created_at });
        reqTimestamp = Date.now();
      }
      
      return {
      id: r.id.toString(),
      guestName: r.guest_name || r.guestName || 'Guest',
      roomNumber: r.room_number || r.roomNumber,
      pickup: r.pickup,
      destination: r.destination,
      status: r.status as BuggyStatus,
        timestamp: reqTimestamp,
      driverId: r.driver_id ? r.driver_id.toString() : undefined,
      eta: r.eta || undefined,
        pickedUpAt: r.pick_timestamp ? new Date(r.pick_timestamp).getTime() : (r.picked_up_at ? new Date(r.picked_up_at).getTime() : undefined),
        completedAt: r.drop_timestamp ? new Date(r.drop_timestamp).getTime() : (r.completed_at ? new Date(r.completed_at).getTime() : undefined),
        confirmedAt: r.assigned_timestamp ? new Date(r.assigned_timestamp).getTime() : (r.assigned_at ? new Date(r.assigned_at).getTime() : undefined),
      rating: r.rating || undefined,
      feedback: r.feedback || undefined
      };
    });
    
    console.log('Mapped rides:', mapped);
    // Update local cache
    rides = mapped;
    return mapped;
  } catch (error) {
    console.error('Failed to fetch rides from API:', error);
    console.warn('Falling back to mock rides. This means rides are NOT loaded from database!');
    return rides; // Fallback to mock data
  }
};

// Sync version for backward compatibility
export const getRidesSync = () => rides;

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
export const createManualRide = async (driverId: string, roomNumber: string, pickup: string, destination: string): Promise<RideRequest> => {
    try {
        // Try to find guest name if room number exists
        const allUsers = await getUsers().catch(() => getUsersSync());
        const guest = allUsers.find(u => u.roomNumber === roomNumber && u.role === UserRole.GUEST);
        const guestName = guest ? guest.lastName : (roomNumber ? `Guest ${roomNumber}` : 'Walk-in Guest');

        const requestBody = {
            guest_name: guestName,
            room_number: roomNumber || 'Walk-in',
            pickup,
            destination,
            status: 'ASSIGNED', // Directly assigned to the driver
            driver_id: parseInt(driverId) || null,
            timestamp: Date.now(),
            eta: 0 // Assume driver is there
        };
        
        console.log('Creating manual ride via API - Input:', { driverId, roomNumber, pickup, destination });
        console.log('Creating manual ride via API - Request Body:', requestBody);
        
        const dbRide = await apiClient.post<any>('/ride-requests', requestBody);
        
        console.log('Manual ride created successfully - API Response:', dbRide);
        
        const mappedRide: RideRequest = {
            id: dbRide.id.toString(),
            guestName: dbRide.guest_name,
            roomNumber: dbRide.room_number,
            pickup: dbRide.pickup,
            destination: dbRide.destination,
            status: dbRide.status as BuggyStatus,
            timestamp: dbRide.timestamp || (dbRide.created_at ? new Date(dbRide.created_at).getTime() : Date.now()),
            driverId: dbRide.driver_id ? dbRide.driver_id.toString() : driverId,
            eta: dbRide.eta || 0
        };
        
        // Update local cache
        rides = [mappedRide, ...rides];
        console.log('Manual ride added to local cache:', mappedRide);
        return mappedRide;
    } catch (error: any) {
        console.error('Failed to create manual ride via API:', error);
        console.error('Error details:', {
            message: error?.message,
            response: error?.response,
            status: error?.response?.status,
            body: error?.response?.body
        });
        console.warn('Falling back to local mock data. Ride will NOT be saved to database!');
        // Fallback to local state
        const allUsers = getUsersSync();
        const guest = allUsers.find(u => u.roomNumber === roomNumber && u.role === UserRole.GUEST);
        const guestName = guest ? guest.lastName : (roomNumber ? `Guest ${roomNumber}` : 'Walk-in Guest');
        
        const newRide: RideRequest = {
            id: Date.now().toString(),
            guestName: guestName,
            roomNumber: roomNumber || 'Walk-in',
            pickup,
            destination,
            status: BuggyStatus.ASSIGNED,
            driverId: driverId,
            timestamp: Date.now(),
            eta: 0
        };
        
        rides = [...rides, newRide];
        throw error; // Re-throw để component có thể handle error
    }
};

export const updateRideStatus = async (rideId: string, status: BuggyStatus, driverId?: string, eta?: number): Promise<void> => {
  try {
    const ride = rides.find(r => r.id === rideId);
    if (!ride) {
      console.warn(`Ride ${rideId} not found in local cache, but will attempt API update anyway`);
    }

    const updateData: any = {
      status: status
    };

    if (driverId !== undefined) {
      updateData.driver_id = parseInt(driverId) || null;
    }
    if (eta !== undefined) {
      updateData.eta = eta;
    }

    console.log('Updating ride status via API - Ride ID:', rideId);
    console.log('Updating ride status via API - Update Data:', updateData);

    const dbRide = await apiClient.put<any>(`/ride-requests/${rideId}`, updateData);

    console.log('Ride status updated successfully - API Response:', dbRide);

    // Map database response to frontend format
    // Handle timestamp: prefer timestamp (bigint), fallback to created_at, then existing ride timestamp, then Date.now()
    let reqTimestamp: number;
    if (dbRide.timestamp && typeof dbRide.timestamp === 'number' && dbRide.timestamp > 0) {
      reqTimestamp = dbRide.timestamp;
    } else if (dbRide.created_at) {
      const createdDate = new Date(dbRide.created_at);
      reqTimestamp = isNaN(createdDate.getTime()) ? (ride?.timestamp || Date.now()) : createdDate.getTime();
    } else {
      reqTimestamp = ride?.timestamp || Date.now();
    }
    
    const updatedRide: RideRequest = {
      id: dbRide.id.toString(),
      guestName: dbRide.guest_name || ride?.guestName || 'Guest',
      roomNumber: dbRide.room_number || ride?.roomNumber || '',
      pickup: dbRide.pickup || ride?.pickup || '',
      destination: dbRide.destination || ride?.destination || '',
      status: dbRide.status as BuggyStatus,
      timestamp: reqTimestamp,
      driverId: dbRide.driver_id ? dbRide.driver_id.toString() : (driverId || ride?.driverId),
      eta: dbRide.eta !== undefined ? dbRide.eta : (eta !== undefined ? eta : ride?.eta),
      pickedUpAt: dbRide.pick_timestamp ? new Date(dbRide.pick_timestamp).getTime() : (dbRide.picked_up_at ? new Date(dbRide.picked_up_at).getTime() : (status === BuggyStatus.ON_TRIP && !ride?.pickedUpAt ? Date.now() : ride?.pickedUpAt)),
      completedAt: dbRide.drop_timestamp ? new Date(dbRide.drop_timestamp).getTime() : (dbRide.completed_at ? new Date(dbRide.completed_at).getTime() : (status === BuggyStatus.COMPLETED && !ride?.completedAt ? Date.now() : ride?.completedAt)),
      confirmedAt: dbRide.assigned_timestamp ? new Date(dbRide.assigned_timestamp).getTime() : (dbRide.assigned_at ? new Date(dbRide.assigned_at).getTime() : (status === BuggyStatus.ASSIGNED && !ride?.confirmedAt ? Date.now() : (status === BuggyStatus.ASSIGNED && ride?.confirmedAt ? ride.confirmedAt : (ride?.confirmedAt || undefined)))),
      rating: dbRide.rating || ride?.rating,
      feedback: dbRide.feedback || ride?.feedback
    };

    // Update local cache
    const existingIndex = rides.findIndex(r => r.id === rideId);
    if (existingIndex >= 0) {
      rides = rides.map(r => r.id === rideId ? updatedRide : r);
    } else {
      // Add to cache if not found
      rides = [updatedRide, ...rides];
    }
    console.log('Ride updated in local cache:', updatedRide);

    // Notify Guest of status change (only if we have room number)
    const roomNumber = updatedRide.roomNumber || ride?.roomNumber;
    if (roomNumber) {
      if (status === BuggyStatus.ASSIGNED) {
        sendNotification(roomNumber, 'Buggy Assigned', `A driver is on the way. ETA: ${eta} mins.`, 'SUCCESS');
      } else if (status === BuggyStatus.ARRIVING) {
        sendNotification(roomNumber, 'Buggy Arriving', `Your buggy has arrived at ${updatedRide.pickup}.`, 'INFO');
      } else if (status === BuggyStatus.COMPLETED) {
        sendNotification(roomNumber, 'Ride Completed', `You have arrived at ${updatedRide.destination}. Have a nice day!`, 'SUCCESS');
      }
    }
  } catch (error: any) {
    console.error('Failed to update ride status via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. Ride status will NOT be updated in database!');
    // Fallback to local state
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

        if ((status === BuggyStatus.ASSIGNED || status === BuggyStatus.ARRIVING) && !updatedRide.confirmedAt) {
            updatedRide.confirmedAt = Date.now();
        }
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
    throw error; // Re-throw để component có thể handle error
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
    // Handle timestamp: prefer timestamp (bigint), fallback to created_at, then Date.now()
    let reqTimestamp: number;
    if (dbRide.timestamp && typeof dbRide.timestamp === 'number' && dbRide.timestamp > 0) {
      reqTimestamp = dbRide.timestamp;
    } else if (dbRide.created_at) {
      const createdDate = new Date(dbRide.created_at);
      reqTimestamp = isNaN(createdDate.getTime()) ? Date.now() : createdDate.getTime();
    } else {
      reqTimestamp = Date.now();
    }
    
    return {
      id: dbRide.id.toString(),
      guestName: dbRide.guest_name,
      roomNumber: dbRide.room_number,
      pickup: dbRide.pickup,
      destination: dbRide.destination,
      status: dbRide.status as BuggyStatus,
      timestamp: reqTimestamp,
      driverId: dbRide.driver_id ? dbRide.driver_id.toString() : undefined,
      eta: dbRide.eta,
      confirmedAt: dbRide.assigned_timestamp ? new Date(dbRide.assigned_timestamp).getTime() : (dbRide.assigned_at ? new Date(dbRide.assigned_at).getTime() : (dbRide.status === 'ASSIGNED' && dbRide.updated_at ? new Date(dbRide.updated_at).getTime() : undefined)),
      pickedUpAt: dbRide.pick_timestamp ? new Date(dbRide.pick_timestamp).getTime() : (dbRide.picked_up_at ? new Date(dbRide.picked_up_at).getTime() : undefined),
      completedAt: dbRide.drop_timestamp ? new Date(dbRide.drop_timestamp).getTime() : (dbRide.completed_at ? new Date(dbRide.completed_at).getTime() : undefined)
    };
  } catch (error) {
    console.error('Failed to get active ride:', error);
    // Fallback to local
    const localRide = rides.find(r => r.roomNumber === roomNumber && r.status !== BuggyStatus.COMPLETED);
    // Ensure confirmedAt is set for local rides if status is ASSIGNED/ARRIVING
    if (localRide && (localRide.status === BuggyStatus.ASSIGNED || localRide.status === BuggyStatus.ARRIVING) && !localRide.confirmedAt) {
      localRide.confirmedAt = Date.now();
    }
    return localRide;
  }
};

// --- SERVICES ---
export const getServiceRequests = async (): Promise<ServiceRequest[]> => {
  try {
    const dbRequests = await apiClient.get<any[]>('/service-requests');
    const serviceReqs = dbRequests.map(mapServiceRequestToFrontend);
    
    // Also include buggy rides as service requests
    try {
      const dbRideRequests = await apiClient.get<any[]>('/ride-requests');
      const buggyReqs: ServiceRequest[] = dbRideRequests.map(r => ({
        id: r.id.toString(),
        type: 'BUGGY',
        status: r.status,
        details: `From ${r.pickup} to ${r.destination} (${r.guest_name || r.guestName})`,
        roomNumber: r.room_number || r.roomNumber,
        timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
        confirmedAt: r.assigned_at ? new Date(r.assigned_at).getTime() : (r.status === 'ASSIGNED' && r.updated_at ? new Date(r.updated_at).getTime() : undefined),
        assignedAt: r.assigned_at ? new Date(r.assigned_at).getTime() : (r.status === 'ASSIGNED' && r.updated_at ? new Date(r.updated_at).getTime() : undefined),
        pickedUpAt: r.picked_up_at ? new Date(r.picked_up_at).getTime() : (r.status === 'ON_TRIP' && r.updated_at ? new Date(r.updated_at).getTime() : undefined),
        arrivingAt: r.arriving_at ? new Date(r.arriving_at).getTime() : (r.status === 'ARRIVING' && r.updated_at ? new Date(r.updated_at).getTime() : undefined),
        completedAt: r.completed_at ? new Date(r.completed_at).getTime() : (r.status === 'COMPLETED' && r.updated_at ? new Date(r.updated_at).getTime() : undefined),
        rating: r.rating || undefined,
        feedback: r.feedback || undefined
      }));
      return [...serviceReqs, ...buggyReqs];
    } catch (buggyError) {
      console.error('Failed to get buggy requests:', buggyError);
      return serviceReqs; // Return service requests only if buggy fails
    }
  } catch (error) {
    console.error('Failed to get service requests:', error);
    // Fallback to local - include buggy rides from local cache
    const buggyReqs: ServiceRequest[] = rides.map(r => ({
      id: r.id,
      type: 'BUGGY',
      status: r.status,
      details: `From ${r.pickup} to ${r.destination} (${r.guestName})`,
      roomNumber: r.roomNumber,
      timestamp: r.timestamp,
      confirmedAt: r.status === BuggyStatus.ASSIGNED ? r.timestamp : undefined,
      assignedAt: r.status === BuggyStatus.ASSIGNED ? r.timestamp : undefined,
      pickedUpAt: r.pickedUpAt,
      arrivingAt: r.status === BuggyStatus.ARRIVING ? r.timestamp : undefined,
      completedAt: r.completedAt,
      rating: r.rating,
      feedback: r.feedback
    }));
    return [...serviceRequests, ...buggyReqs];
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

    console.log('Adding service request via API - Input:', req);
    console.log('Adding service request via API - Request Body:', requestBody);

    const dbRequest = await apiClient.post<any>('/service-requests', requestBody);
    
    console.log('Service request added successfully - API Response:', dbRequest);
    
    const newRequest = mapServiceRequestToFrontend(dbRequest);
    
    // Update local state
    serviceRequests = [newRequest, ...serviceRequests];
    
    // Notify Guest
    sendNotification(req.roomNumber, 'Order Received', `We have received your ${req.type.toLowerCase()} request.`, 'INFO');
    
    // Notify Staff of that Department
    const readableType = req.type.charAt(0) + req.type.slice(1).toLowerCase(); // Dining, Spa, etc.
    notifyStaffByDepartment(readableType, 'New Service Request', `Room ${req.roomNumber}: ${req.details}`);
    
    return newRequest;
  } catch (error: any) {
    console.error('Failed to add service request via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.data || error?.response?.body
    });
    
    // Re-throw error so component can handle it
    throw error;
  }
};

export const cancelServiceRequest = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/service-requests/${id}`);
    
    // Remove from local cache
    serviceRequests = serviceRequests.filter(s => s.id !== id);
    
    console.log('Service request cancelled successfully:', id);
  } catch (error) {
    console.error('Failed to cancel service request:', error);
    throw error;
  }
};

export const updateServiceStatus = async (id: string, status: 'PENDING' | 'CONFIRMED' | 'COMPLETED'): Promise<void> => {
  try {
    // Try to find request in local cache for notification purposes
    const req = serviceRequests.find(s => s.id === id);
    
    const updateData: any = {
      status: status
    };

    console.log('Updating service request status via API - Request ID:', id);
    console.log('Updating service request status via API - Update Data:', updateData);

    const dbRequest = await apiClient.put<any>(`/service-requests/${id}`, updateData);

    console.log('Service request status updated successfully - API Response:', dbRequest);

    // Map database response to frontend format
    const updatedRequest: ServiceRequest = {
      id: dbRequest.id.toString(),
      type: dbRequest.type,
      status: dbRequest.status,
      details: dbRequest.details || '',
      items: req?.items || [], // Keep items from original request if available
      roomNumber: dbRequest.room_number || req?.roomNumber || '',
      timestamp: dbRequest.timestamp || (dbRequest.created_at ? new Date(dbRequest.created_at).getTime() : Date.now()),
      confirmedAt: dbRequest.confirmed_at ? new Date(dbRequest.confirmed_at).getTime() : (req?.confirmedAt || undefined),
      completedAt: dbRequest.completed_at ? new Date(dbRequest.completed_at).getTime() : (req?.completedAt || undefined),
      rating: dbRequest.rating || req?.rating || undefined,
      feedback: dbRequest.feedback || req?.feedback || undefined
    };

    // Update local cache
    const existingIndex = serviceRequests.findIndex(s => s.id === id);
    if (existingIndex >= 0) {
      serviceRequests[existingIndex] = updatedRequest;
    } else {
      serviceRequests = [updatedRequest, ...serviceRequests];
    }
    console.log('Service request updated in local cache:', updatedRequest);

    // Notify Guest of status change
    const roomNumber = updatedRequest.roomNumber;
    const requestType = updatedRequest.type.toLowerCase();
    if (status === 'CONFIRMED') {
        sendNotification(roomNumber, 'Order Confirmed', `Your ${requestType} request has been confirmed.`, 'SUCCESS');
    } else if (status === 'COMPLETED') {
        sendNotification(roomNumber, 'Order Completed', `Your ${requestType} service is complete.`, 'SUCCESS');
    }
  } catch (error: any) {
    console.error('Failed to update service request status via API:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      body: error?.response?.body
    });
    console.warn('Falling back to local mock data. Service request status will NOT be updated in database!');
    // Fallback to local state
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
    throw error; // Re-throw để component có thể handle error
  }
};

export const rateServiceRequest = async (id: string, rating: number, feedback: string, requestType?: string): Promise<void> => {
  try {
    console.log('=== rateServiceRequest START ===');
    console.log('Parameters:', { id, rating, feedback, requestType });
    
    // Determine if this is a ride request or service request based on type or by checking both
    const isRideRequest = requestType === 'BUGGY';
    
    if (isRideRequest) {
      // Directly update ride request
      try {
        console.log('Updating ride request via API...');
        console.log('Request URL:', `/ride-requests/${id}`);
        console.log('Request body:', { rating, feedback });
        
        const updatedRide = await apiClient.put(`/ride-requests/${id}`, { rating, feedback });
        console.log('SUCCESS - Ride request updated:', updatedRide);
        
        // Update local state
        const rideIdx = rides.findIndex(r => r.id === id);
        if (rideIdx >= 0) {
          rides[rideIdx] = { ...rides[rideIdx], rating, feedback };
          console.log('Local cache updated for ride request');
        }
        console.log('=== rateServiceRequest SUCCESS ===');
        return;
      } catch (rideError: any) {
        console.error('Failed to update ride request via API:', rideError);
        // Fallback to local state
        const rideIdx = rides.findIndex(r => r.id === id);
        if (rideIdx >= 0) {
          rides[rideIdx] = { ...rides[rideIdx], rating, feedback };
          console.log('Fallback: Updated local cache for ride request');
          return;
        }
        throw new Error(`Failed to rate ride request: ${rideError.message}`);
      }
    } else {
      // Try service request first, then ride request as fallback
      try {
        console.log('Attempting to update service request via API...');
        console.log('Request URL:', `/service-requests/${id}`);
        console.log('Request body:', { rating, feedback });
        
        const updatedRequest = await apiClient.put(`/service-requests/${id}`, { rating, feedback });
        console.log('SUCCESS - Service request updated:', updatedRequest);
        
        // Update local state
        const serviceIdx = serviceRequests.findIndex(s => s.id === id);
        if (serviceIdx >= 0) {
          serviceRequests[serviceIdx] = { ...serviceRequests[serviceIdx], rating, feedback };
          console.log('Local cache updated for service request');
        }
        console.log('=== rateServiceRequest SUCCESS ===');
        return;
      } catch (serviceError: any) {
        console.log('Service request update failed, trying ride request...');
        console.log('Service error:', serviceError.message);
        
        // If not a service request, try ride request
        try {
          console.log('Attempting to update ride request via API...');
          console.log('Request URL:', `/ride-requests/${id}`);
          console.log('Request body:', { rating, feedback });
          
          const updatedRide = await apiClient.put(`/ride-requests/${id}`, { rating, feedback });
          console.log('SUCCESS - Ride request updated:', updatedRide);
          
          // Update local state
          const rideIdx = rides.findIndex(r => r.id === id);
          if (rideIdx >= 0) {
            rides[rideIdx] = { ...rides[rideIdx], rating, feedback };
            console.log('Local cache updated for ride request');
          }
          console.log('=== rateServiceRequest SUCCESS ===');
          return;
        } catch (rideError: any) {
          console.error('=== rateServiceRequest ERROR ===');
          console.error('Both service and ride request updates failed');
          console.error('Service error:', serviceError.message);
          console.error('Ride error:', rideError.message);
          
          // Fallback to local state
          const serviceIdx = serviceRequests.findIndex(s => s.id === id);
          if (serviceIdx >= 0) {
            serviceRequests[serviceIdx] = { ...serviceRequests[serviceIdx], rating, feedback };
            console.log('Fallback: Updated local cache for service request');
            return;
          }
          const rideIdx = rides.findIndex(r => r.id === id);
          if (rideIdx >= 0) {
            rides[rideIdx] = { ...rides[rideIdx], rating, feedback };
            console.log('Fallback: Updated local cache for ride request');
            return;
          }
          
          throw new Error(`Failed to rate request: ${serviceError.message || rideError.message}`);
        }
      }
    }
  } catch (error: any) {
    console.error('=== rateServiceRequest FATAL ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Final fallback to local state
    const serviceIdx = serviceRequests.findIndex(s => s.id === id);
    if (serviceIdx >= 0) {
      serviceRequests[serviceIdx] = { ...serviceRequests[serviceIdx], rating, feedback };
      console.log('Final fallback: Updated local cache for service request');
      return;
    }
    const rideIdx = rides.findIndex(r => r.id === id);
    if (rideIdx >= 0) {
      rides[rideIdx] = { ...rides[rideIdx], rating, feedback };
      console.log('Final fallback: Updated local cache for ride request');
      return;
    }
    
    throw error; // Re-throw để component có thể handle error
  }
};

// --- HOTEL REVIEWS ---
export const submitHotelReview = async (review: HotelReview, existingReviewId?: string): Promise<void> => {
    try {
        const requestBody = {
            room_number: review.roomNumber,
            guest_name: review.guestName,
            category_ratings: review.categoryRatings,
            average_rating: review.averageRating,
            comment: review.comment || null,
            timestamp: review.timestamp
        };
        
        let dbReview: any;
        
        // If existing review ID is provided, update instead of create
        if (existingReviewId) {
            console.log('Updating hotel review via API...', existingReviewId, review);
            dbReview = await apiClient.put<any>(`/hotel-reviews/${existingReviewId}`, requestBody);
            console.log('Hotel review updated successfully:', dbReview);
        } else {
            console.log('Submitting hotel review via API...', review);
            dbReview = await apiClient.post<any>('/hotel-reviews', requestBody);
            console.log('Hotel review submitted successfully:', dbReview);
        }
        
        // Update local cache
        const mappedReview: HotelReview = {
            id: dbReview.id.toString(),
            roomNumber: dbReview.room_number,
            guestName: dbReview.guest_name,
            categoryRatings: typeof dbReview.category_ratings === 'string' 
                ? JSON.parse(dbReview.category_ratings) 
                : dbReview.category_ratings,
            averageRating: parseFloat(dbReview.average_rating),
            comment: dbReview.comment || undefined,
            timestamp: dbReview.timestamp
        };
        
        // Update local cache (remove old review for this room, add new one)
        hotelReviews = hotelReviews.filter(r => r.roomNumber !== review.roomNumber);
        hotelReviews.push(mappedReview);
    } catch (error: any) {
        console.error('Failed to submit/update hotel review via API:', error);
        console.error('Error details:', {
            message: error?.message,
            response: error?.response,
            status: error?.response?.status,
            body: error?.response?.body
        });
        // Fallback to local storage
        hotelReviews = hotelReviews.filter(r => r.roomNumber !== review.roomNumber);
        hotelReviews.push(review);
        throw error;
    }
};

export const getHotelReview = async (roomNumber: string): Promise<HotelReview | undefined> => {
    try {
        console.log('Fetching hotel review from API for room:', roomNumber);
        const dbReview = await apiClient.get<any>(`/hotel-reviews/room/${roomNumber}`).catch(() => null);
        
        if (!dbReview) {
            // Check local cache as fallback
            return hotelReviews.find(r => r.roomNumber === roomNumber);
        }
        
        const mappedReview: HotelReview = {
            id: dbReview.id.toString(),
            roomNumber: dbReview.room_number,
            guestName: dbReview.guest_name,
            categoryRatings: typeof dbReview.category_ratings === 'string' 
                ? JSON.parse(dbReview.category_ratings) 
                : dbReview.category_ratings,
            averageRating: parseFloat(dbReview.average_rating),
            comment: dbReview.comment || undefined,
            timestamp: dbReview.timestamp
        };
        
        // Update local cache
        hotelReviews = hotelReviews.filter(r => r.roomNumber !== roomNumber);
        hotelReviews.push(mappedReview);
        
        return mappedReview;
    } catch (error) {
        console.error('Failed to fetch hotel review from API:', error);
        // Fallback to local cache
        return hotelReviews.find(r => r.roomNumber === roomNumber);
    }
};

export const getAllHotelReviews = async (): Promise<HotelReview[]> => {
    try {
        console.log('Fetching all hotel reviews from API...');
        const dbReviews = await apiClient.get<any[]>('/hotel-reviews');
        
        const mappedReviews: HotelReview[] = dbReviews.map(dbReview => ({
            id: dbReview.id.toString(),
            roomNumber: dbReview.room_number,
            guestName: dbReview.guest_name,
            categoryRatings: typeof dbReview.category_ratings === 'string' 
                ? JSON.parse(dbReview.category_ratings) 
                : dbReview.category_ratings,
            averageRating: parseFloat(dbReview.average_rating),
            comment: dbReview.comment || undefined,
            timestamp: dbReview.timestamp
        }));
        
        // Update local cache
        hotelReviews = mappedReviews;
        
        return mappedReviews;
    } catch (error) {
        console.error('Failed to fetch hotel reviews from API:', error);
        // Fallback to local cache
        return hotelReviews;
    }
};


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
      confirmedAt: r.assigned_at ? new Date(r.assigned_at).getTime() : (r.status === 'ASSIGNED' && r.updated_at ? new Date(r.updated_at).getTime() : undefined),
      assignedAt: r.assigned_at ? new Date(r.assigned_at).getTime() : (r.status === 'ASSIGNED' && r.updated_at ? new Date(r.updated_at).getTime() : undefined),
      pickedUpAt: r.picked_up_at ? new Date(r.picked_up_at).getTime() : (r.status === 'ON_TRIP' && r.updated_at ? new Date(r.updated_at).getTime() : undefined),
      arrivingAt: r.arriving_at ? new Date(r.arriving_at).getTime() : (r.status === 'ARRIVING' && r.updated_at ? new Date(r.updated_at).getTime() : undefined),
      completedAt: r.completed_at ? new Date(r.completed_at).getTime() : (r.status === 'COMPLETED' && r.updated_at ? new Date(r.updated_at).getTime() : undefined),
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
      confirmedAt: r.status === BuggyStatus.ASSIGNED ? r.timestamp : undefined,
      assignedAt: r.status === BuggyStatus.ASSIGNED ? r.timestamp : undefined,
      pickedUpAt: r.pickedUpAt,
      arrivingAt: r.status === BuggyStatus.ARRIVING ? r.timestamp : undefined,
      completedAt: r.completedAt,
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

export const markServiceMessagesAsRead = async (roomNumber: string, service: string, messageId: number, userRole: 'user' | 'staff'): Promise<void> => {
    try {
        await apiClient.post(`/chat-messages/room/${roomNumber}/mark-read`, {
            service_type: service,
            message_id: messageId,
            user_role: userRole
        });
    } catch (error) {
        console.error('Failed to mark messages as read:', error);
    }
};

export const getServiceUnreadCount = async (roomNumber: string, service: string, userRole: 'user' | 'staff'): Promise<number> => {
    try {
        const response = await apiClient.get<{ unreadCount: number }>(`/chat-messages/room/${roomNumber}/unread?service_type=${service}&user_role=${userRole}`);
        return response.unreadCount || 0;
    } catch (error) {
        console.error('Failed to get unread count:', error);
        return 0;
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
export const getDashboardStats = async () => {
    // 1. Guests
    const allUsers = await getUsers().catch(() => getUsersSync());
    const activeGuests = allUsers.filter(u => u.role === UserRole.GUEST).length;
    
    // 2. Services Stats
    const allRequests = await getServiceRequests().catch(() => []);
    const pendingDining = allRequests.filter(r => r.type === 'DINING' && r.status === 'PENDING').length;
    const pendingSpa = allRequests.filter(r => r.type === 'SPA' && r.status === 'PENDING').length;
    const pendingPool = allRequests.filter(r => r.type === 'POOL' && r.status === 'PENDING').length;
    const pendingButler = allRequests.filter(r => r.type === 'BUTLER' && r.status === 'PENDING').length;

    // 3. Buggies
    const allRides = await getRides().catch(() => getRidesSync());
    const activeBuggies = allRides.filter(r => r.status === BuggyStatus.ON_TRIP || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ASSIGNED).length;
    const searchingBuggies = allRides.filter(r => r.status === BuggyStatus.SEARCHING).length;
    const onTripBuggies = allRides.filter(r => r.status === BuggyStatus.ON_TRIP || r.status === BuggyStatus.ARRIVING || r.status === BuggyStatus.ASSIGNED).length;
    // Count all completed buggy rides (not just today)
    const completedBuggies = allRides.filter(r => r.status === BuggyStatus.COMPLETED).length;

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
    const recentActivity = (await getUnifiedHistory().catch(() => [])).filter(r => r.timestamp > todayStart.getTime()).slice(0, 10);

    return {
        activeGuests,
        pendingDining,
        pendingSpa,
        pendingPool,
        pendingButler,
        activeBuggies,
        searchingBuggies,
        onTripBuggies,
        completedBuggies,
        totalRevenue,
        recentActivity,
        todayCompletedCount: todayCompleted.length
    };
};
