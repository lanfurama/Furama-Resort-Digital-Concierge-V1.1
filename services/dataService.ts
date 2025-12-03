
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
export const getNotifications = (recipientId: string) => {
    return notifications.filter(n => n.recipientId === recipientId).sort((a,b) => b.timestamp - a.timestamp);
};

export const markNotificationRead = (id: string) => {
    notifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
};

export const sendNotification = (recipientId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO') => {
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
};

const notifyStaffByDepartment = (department: string, title: string, message: string) => {
    const staff = users.filter(u => u.role === UserRole.STAFF && (u.department === department || u.department === 'All'));
    staff.forEach(s => sendNotification(s.roomNumber, title, message, 'INFO'));
};


// --- USERS ---
export const getUsers = () => users;

export const addUser = (user: User) => {
    // Default password for new manually created users is '123'
    users = [...users, { ...user, id: Date.now().toString(), password: user.password || '123' }];
};

export const deleteUser = (id: string) => {
    users = users.filter(u => u.id !== id);
};

export const resetUserPassword = (userId: string, newPass: string) => {
    users = users.map(u => u.id === userId ? { ...u, password: newPass } : u);
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
  try {
    // Get user by room number first
    const user = await apiClient.get<any>(`/users/room/${roomNumber}`).catch(() => null);
    if (user && user.id) {
      // Update user with language (if language field exists in database)
      // For now, we'll store in localStorage as database doesn't have language column
      const savedUser = localStorage.getItem('furama_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        parsedUser.language = language;
        localStorage.setItem('furama_user', JSON.stringify(parsedUser));
      }
    }
  } catch (error) {
    console.error('Failed to update user language:', error);
    // Fallback to localStorage
    const savedUser = localStorage.getItem('furama_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      parsedUser.language = language;
      localStorage.setItem('furama_user', JSON.stringify(parsedUser));
    }
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
export const importGuestsFromCSV = (csvContent: string): number => {
    const lines = csvContent.split(/\r?\n/);
    let count = 0;

    lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 2) {
            const lastName = parts[0].trim();
            const roomNumber = parts[1].trim();
            const villaType = parts[2]?.trim() || "Standard Room";
            const checkIn = parts[3]?.trim();
            const checkOut = parts[4]?.trim();
            const language = parts[5]?.trim() || "English";

            if (lastName && roomNumber) {
                const existingIdx = users.findIndex(u => u.roomNumber === roomNumber && u.role === UserRole.GUEST);
                
                const newUser: User = {
                    id: existingIdx >= 0 ? users[existingIdx].id : Date.now().toString() + Math.random(),
                    lastName,
                    roomNumber,
                    role: UserRole.GUEST,
                    department: 'All',
                    villaType,
                    checkIn,
                    checkOut,
                    language
                };

                if (existingIdx >= 0) {
                    users[existingIdx] = newUser;
                } else {
                    users.push(newUser);
                }
                count++;
            }
        }
    });
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
    const dbLocations = await apiClient.get<any[]>('/locations');
    return dbLocations.map(loc => ({
      id: loc.id.toString(),
      lat: parseFloat(loc.lat),
      lng: parseFloat(loc.lng),
      name: loc.name,
      type: loc.type as 'VILLA' | 'FACILITY' | 'RESTAURANT'
    }));
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return locations; // Fallback to mock data
  }
};

// Sync version for backward compatibility (used by AdminPortal)
export const getLocationsSync = () => locations;
export const addLocation = (loc: Location) => {
  locations = [...locations, { ...loc, id: Date.now().toString() }];
};
export const deleteLocation = (name: string) => {
    locations = locations.filter(l => l.name !== name);
};

// --- ROOM TYPES ---
export const getRoomTypes = async (): Promise<RoomType[]> => {
  try {
    const dbRoomTypes = await apiClient.get<any[]>('/room-types');
    return dbRoomTypes.map(rt => ({
      id: rt.id.toString(),
      name: rt.name,
      description: rt.description || undefined,
      locationId: rt.location_id ? rt.location_id.toString() : undefined
    }));
  } catch (error) {
    console.error('Failed to fetch room types:', error);
    return roomTypes; // Fallback to mock data
  }
};

export const addRoomType = async (rt: RoomType): Promise<RoomType> => {
  try {
    const dbRoomType = await apiClient.post<any>('/room-types', {
      name: rt.name,
      description: rt.description || null,
      location_id: rt.locationId ? parseInt(rt.locationId) : null
    });
    return {
      id: dbRoomType.id.toString(),
      name: dbRoomType.name,
      description: dbRoomType.description || undefined,
      locationId: dbRoomType.location_id ? dbRoomType.location_id.toString() : undefined
    };
  } catch (error) {
    console.error('Failed to add room type:', error);
    // Fallback to local
    const newRt = { ...rt, id: Date.now().toString() };
    roomTypes = [...roomTypes, newRt];
    return newRt;
  }
};

export const deleteRoomType = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/room-types/${id}`);
  } catch (error) {
    console.error('Failed to delete room type:', error);
    // Fallback to local
    roomTypes = roomTypes.filter(rt => rt.id !== id);
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
    const dbMenuItems = await apiClient.get<any[]>('/menu-items');
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
    
    return filtered;
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
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
export const addMenuItem = (item: MenuItem) => {
  menuItems = [...menuItems, { ...item, id: Date.now().toString() }];
};
export const deleteMenuItem = (id: string) => {
    menuItems = menuItems.filter(m => m.id !== id);
};

// --- EVENTS ---
export const getEvents = async (): Promise<ResortEvent[]> => {
  try {
    const dbEvents = await apiClient.get<any[]>('/resort-events');
    return dbEvents.map(event => ({
      id: event.id.toString(),
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description || undefined
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return events; // Fallback to mock data
  }
};

// Sync version for backward compatibility (used by AdminPortal)
export const getEventsSync = () => events;
export const addEvent = (event: ResortEvent) => {
    events = [...events, { ...event, id: Date.now().toString() }];
};
export const deleteEvent = (id: string) => {
    events = events.filter(e => e.id !== id);
};

// --- PROMOTIONS ---
export const getPromotions = async (): Promise<Promotion[]> => {
  try {
    const dbPromotions = await apiClient.get<any[]>('/promotions');
    return dbPromotions.map(promo => ({
      id: promo.id.toString(),
      title: promo.title,
      description: promo.description || undefined,
      discount: promo.discount || undefined,
      validUntil: promo.valid_until || undefined,
      imageColor: promo.image_color || 'bg-emerald-500'
    }));
  } catch (error) {
    console.error('Failed to fetch promotions:', error);
    return promotions; // Fallback to mock data
  }
};

// Sync version for backward compatibility (used by AdminPortal)
export const getPromotionsSync = () => promotions;
export const addPromotion = (promo: Promotion) => {
    promotions = [...promotions, { ...promo, id: Date.now().toString(), imageColor: 'bg-emerald-500' }];
};
export const deletePromotion = (id: string) => {
    promotions = promotions.filter(p => p.id !== id);
};

// --- KNOWLEDGE BASE (AI Training) ---
export const getKnowledgeBase = () => knowledgeBase;
export const addKnowledgeItem = (item: KnowledgeItem) => {
    knowledgeBase = [...knowledgeBase, { ...item, id: Date.now().toString() }];
};
export const deleteKnowledgeItem = (id: string) => {
    knowledgeBase = knowledgeBase.filter(k => k.id !== id);
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
    notifyStaffByDepartment(readableType, 'New Service Request', `Room ${req.roomNumber}: ${req.details}`);
    
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
    // Get all messages for this room number
    const dbMessages = await apiClient.get<any[]>(`/chat-messages/room/${roomNumber}`);
    
    // Filter by service type if needed (for now, we'll get all messages for the room)
    // You can add a service field to chat_messages table later if needed
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
      room_number: roomNumber
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
            room_number: roomNumber
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
