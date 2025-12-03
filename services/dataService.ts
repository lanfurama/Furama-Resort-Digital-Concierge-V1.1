
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
    { lastName: "Smith", roomNumber: "101", villaType: "Ocean Suite", role: UserRole.GUEST, checkIn: yesterday.toISOString(), checkOut: nextWeek.toISOString(), notes: "Allergic to peanuts." },
    { lastName: "Nguyen", roomNumber: "205", villaType: "Garden Villa", role: UserRole.GUEST, checkIn: yesterday.toISOString(), checkOut: nextWeek.toISOString() },
    { lastName: "Doe", roomNumber: "888", villaType: "Presidential Suite", role: UserRole.GUEST, checkIn: yesterday.toISOString(), checkOut: nextWeek.toISOString() },
    
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
  { id: '1', name: 'Wagyu Burger', price: 25, category: 'Dining', description: 'Premium beef with truffle fries' },
  { id: '2', name: 'Vietnamese Pho', price: 15, category: 'Dining', description: 'Traditional beef noodle soup' },
  { id: '3', name: 'Club Sandwich', price: 18, category: 'Dining', description: 'Classic triple-decker with chicken and bacon' },
  // Spa
  { id: '4', name: 'Aromatherapy Massage', price: 80, category: 'Spa', description: '60 mins relaxing massage' },
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
    { id: 'r1', guestName: 'Doe', roomNumber: '888', pickup: 'Villa 888', destination: 'Main Lobby', status: BuggyStatus.COMPLETED, timestamp: Date.now() - 7200000, rating: 5, feedback: "Driver was very polite!" },
];

// Populate some initial history for demo purposes
let serviceRequests: ServiceRequest[] = [
    { id: 'h1', type: 'DINING', status: 'COMPLETED', details: 'Order for: Wagyu Burger, Club Sandwich', roomNumber: '101', timestamp: Date.now() - 86400000 }, // Yesterday
    { id: 'h2', type: 'SPA', status: 'COMPLETED', details: 'Order for: Aromatherapy Massage', roomNumber: '205', timestamp: Date.now() - 172800000 }, // 2 days ago
    { id: 'h3', type: 'BUTLER', status: 'COMPLETED', details: 'Order for: Ice Bucket', roomNumber: '101', timestamp: Date.now() - 3600000 }, // 1 hour ago
    { id: 'h4', type: 'POOL', status: 'PENDING', details: 'Order for: Fresh Coconut', roomNumber: '888', timestamp: Date.now() - 900000 }, // 15 mins ago
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

export const updateUserNotes = (roomNumber: string, notes: string) => {
    const user = users.find(u => u.roomNumber === roomNumber && u.role === UserRole.GUEST);
    if (user) {
        user.notes = notes;
    }
};

// Staff Login - Calls API
export const loginStaff = async (username: string, password: string): Promise<User | undefined> => {
    try {
        const response = await apiClient.post<{ success: boolean; user?: User; message?: string }>('/auth/staff', {
            username,
            password
        });
        
        if (response.success && response.user) {
            return response.user;
        }
        return undefined;
    } catch (error: any) {
        console.error('Login staff error:', error);
        return undefined;
    }
};

// Guest Login - Calls API
export const loginGuest = async (lastName: string, roomNumber: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
        const response = await apiClient.post<{ success: boolean; user?: User; message?: string }>('/auth/guest', {
            lastName,
            roomNumber
        });
        
        return response;
    } catch (error: any) {
        console.error('Login guest error:', error);
        return { 
            success: false, 
            message: error.message || 'Login failed. Please try again.' 
        };
    }
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
                    checkOut
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
    const header = "LastName,RoomNumber,VillaType,CheckIn,CheckOut";
    const rows = guests.map(g => {
        return `${g.lastName},${g.roomNumber},${g.villaType || ''},${g.checkIn || ''},${g.checkOut || ''}`;
    });
    return [header, ...rows].join('\n');
};

// --- LOCATIONS ---
export const getLocations = async (): Promise<Location[]> => {
  try {
    const dbLocations = await apiClient.get<any[]>('/locations');
    // Map database format to frontend format
    return dbLocations.map(loc => ({
      id: loc.id.toString(),
      lat: parseFloat(loc.lat),
      lng: parseFloat(loc.lng),
      name: loc.name,
      type: loc.type
    }));
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return locations; // Fallback to mock data
  }
};

// Keep sync version for backward compatibility (will be deprecated)
let locationsCache: Location[] = [...MOCK_LOCATIONS];
getLocations().then(locs => locationsCache = locs).catch(() => {});

export const getLocationsSync = () => locationsCache;

export const addLocation = async (loc: Location) => {
  try {
    const dbLocation = await apiClient.post<any>('/locations', {
      lat: loc.lat,
      lng: loc.lng,
      name: loc.name,
      type: loc.type
    });
    locationsCache = [...locationsCache, {
      id: dbLocation.id.toString(),
      lat: parseFloat(dbLocation.lat),
      lng: parseFloat(dbLocation.lng),
      name: dbLocation.name,
      type: dbLocation.type
    }];
  } catch (error) {
    console.error('Failed to add location:', error);
  }
};

export const deleteLocation = async (name: string) => {
  try {
    // Find location by name and delete by ID
    const loc = locationsCache.find(l => l.name === name);
    if (loc) {
      await apiClient.delete(`/locations/${loc.id}`);
      locationsCache = locationsCache.filter(l => l.name !== name);
    }
  } catch (error) {
    console.error('Failed to delete location:', error);
  }
};

// --- ROOM TYPES ---
export const getRoomTypes = () => roomTypes;
export const addRoomType = (rt: RoomType) => {
    roomTypes = [...roomTypes, { ...rt, id: Date.now().toString() }];
};
export const deleteRoomType = (id: string) => {
    roomTypes = roomTypes.filter(rt => rt.id !== id);
};

// --- ROOMS (Inventory) ---
export const getRooms = () => rooms;
export const addRoom = (r: Room) => {
    rooms = [...rooms, { ...r, id: r.id || Date.now().toString() }];
};
export const deleteRoom = (id: string) => {
    rooms = rooms.filter(r => r.id !== id);
};
export const importRoomsFromCSV = (csvContent: string): number => {
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
    const endpoint = categoryFilter 
      ? `/menu-items?category=${categoryFilter}` 
      : '/menu-items';
    const dbMenuItems = await apiClient.get<any[]>(endpoint);
    // Map database format to frontend format
    return dbMenuItems.map(item => ({
      id: item.id.toString(),
      name: item.name,
      price: parseFloat(item.price),
      category: item.category,
      description: item.description || ''
    }));
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return categoryFilter 
      ? menuItems.filter(item => item.category === categoryFilter)
      : menuItems; // Fallback to mock data
  }
};

// Keep sync version for backward compatibility
let menuItemsCache: MenuItem[] = menuItems;
getMenu().then(items => menuItemsCache = items).catch(() => {});

export const getMenuSync = (categoryFilter?: 'Dining' | 'Spa' | 'Pool' | 'Butler') => {
  if (categoryFilter) {
    return menuItemsCache.filter(item => item.category === categoryFilter);
  }
  return menuItemsCache;
};

export const addMenuItem = async (item: MenuItem) => {
  try {
    const dbItem = await apiClient.post<any>('/menu-items', {
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description
    });
    menuItemsCache = [...menuItemsCache, {
      id: dbItem.id.toString(),
      name: dbItem.name,
      price: parseFloat(dbItem.price),
      category: dbItem.category,
      description: dbItem.description || ''
    }];
  } catch (error) {
    console.error('Failed to add menu item:', error);
  }
};

export const deleteMenuItem = async (id: string) => {
  try {
    await apiClient.delete(`/menu-items/${id}`);
    menuItemsCache = menuItemsCache.filter(m => m.id !== id);
  } catch (error) {
    console.error('Failed to delete menu item:', error);
  }
};

// --- EVENTS ---
export const getEvents = async (): Promise<ResortEvent[]> => {
  try {
    const dbEvents = await apiClient.get<any[]>('/resort-events');
    // Map database format to frontend format
    return dbEvents.map(event => ({
      id: event.id.toString(),
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description || ''
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return events; // Fallback to mock data
  }
};

// Keep sync version for backward compatibility
let eventsCache: ResortEvent[] = events;
getEvents().then(evts => eventsCache = evts).catch(() => {});

export const getEventsSync = () => eventsCache;

export const addEvent = async (event: ResortEvent) => {
  try {
    const dbEvent = await apiClient.post<any>('/resort-events', {
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description
    });
    eventsCache = [...eventsCache, {
      id: dbEvent.id.toString(),
      title: dbEvent.title,
      date: dbEvent.date,
      time: dbEvent.time,
      location: dbEvent.location,
      description: dbEvent.description || ''
    }];
  } catch (error) {
    console.error('Failed to add event:', error);
  }
};

export const deleteEvent = async (id: string) => {
  try {
    await apiClient.delete(`/resort-events/${id}`);
    eventsCache = eventsCache.filter(e => e.id !== id);
  } catch (error) {
    console.error('Failed to delete event:', error);
  }
};

// --- PROMOTIONS ---
export const getPromotions = async (): Promise<Promotion[]> => {
  try {
    const dbPromotions = await apiClient.get<any[]>('/promotions');
    // Map database format to frontend format
    return dbPromotions.map(promo => ({
      id: promo.id.toString(),
      title: promo.title,
      description: promo.description || '',
      discount: promo.discount,
      validUntil: promo.valid_until,
      imageColor: promo.image_color || 'bg-emerald-500'
    }));
  } catch (error) {
    console.error('Failed to fetch promotions:', error);
    return promotions; // Fallback to mock data
  }
};

// Keep sync version for backward compatibility
let promotionsCache: Promotion[] = [...MOCK_PROMOTIONS];
getPromotions().then(promos => promotionsCache = promos).catch(() => {});

export const getPromotionsSync = () => promotionsCache;

export const addPromotion = async (promo: Promotion) => {
  try {
    const dbPromo = await apiClient.post<any>('/promotions', {
      title: promo.title,
      description: promo.description,
      discount: promo.discount,
      valid_until: promo.validUntil,
      image_color: promo.imageColor || 'bg-emerald-500'
    });
    promotionsCache = [...promotionsCache, {
      id: dbPromo.id.toString(),
      title: dbPromo.title,
      description: dbPromo.description || '',
      discount: dbPromo.discount,
      validUntil: dbPromo.valid_until,
      imageColor: dbPromo.image_color || 'bg-emerald-500'
    }];
  } catch (error) {
    console.error('Failed to add promotion:', error);
  }
};

export const deletePromotion = async (id: string) => {
  try {
    await apiClient.delete(`/promotions/${id}`);
    promotionsCache = promotionsCache.filter(p => p.id !== id);
  } catch (error) {
    console.error('Failed to delete promotion:', error);
  }
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
// Helper function to map database ride to frontend format
const mapRideToFrontend = (dbRide: any): RideRequest => ({
  id: dbRide.id.toString(),
  guestName: dbRide.guest_name,
  roomNumber: dbRide.room_number,
  pickup: dbRide.pickup,
  destination: dbRide.destination,
  status: dbRide.status as BuggyStatus,
  timestamp: dbRide.timestamp,
  driverId: dbRide.driver_id?.toString(),
  eta: dbRide.eta
});

export const getRides = async (): Promise<RideRequest[]> => {
  try {
    const dbRides = await apiClient.get<any[]>('/ride-requests');
    return dbRides.map(mapRideToFrontend);
  } catch (error) {
    console.error('Failed to fetch rides:', error);
    return rides; // Fallback to mock data
  }
};

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
    
    const newRide = mapRideToFrontend(dbRide);
    rides = [...rides, newRide];
    
    // Notify drivers (mock: notify 'driver' user)
    sendNotification('driver', 'New Ride Request', `Guest ${guestName} (Room ${roomNumber}) needs a ride.`, 'INFO');

    return newRide;
  } catch (error) {
    console.error('Failed to request ride:', error);
    // Fallback to mock behavior
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

export const updateRideStatus = async (rideId: string, status: BuggyStatus, driverId?: string, eta?: number) => {
  try {
    const updateData: any = { status };
    if (driverId !== undefined) updateData.driver_id = parseInt(driverId);
    if (eta !== undefined) updateData.eta = eta;
    
    await apiClient.put(`/ride-requests/${rideId}`, updateData);
    
    // Update local cache
    rides = rides.map(r => {
      if (r.id === rideId) {
        return { 
          ...r, 
          status, 
          driverId: driverId || r.driverId, 
          eta: eta !== undefined ? eta : r.eta 
        };
      }
      return r;
    });

    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      // Notify Guest of status change
      if (status === BuggyStatus.ASSIGNED) {
          sendNotification(ride.roomNumber, 'Buggy Assigned', `A driver is on the way. ETA: ${eta} mins.`, 'SUCCESS');
      } else if (status === BuggyStatus.ARRIVING) {
          sendNotification(ride.roomNumber, 'Buggy Arriving', `Your buggy has arrived at ${ride.pickup}.`, 'INFO');
      } else if (status === BuggyStatus.COMPLETED) {
          sendNotification(ride.roomNumber, 'Ride Completed', `You have arrived at ${ride.destination}. Have a nice day!`, 'SUCCESS');
      }
    }
  } catch (error) {
    console.error('Failed to update ride status:', error);
  }
};

export const cancelRide = async (rideId: string) => {
  try {
    await apiClient.delete(`/ride-requests/${rideId}`);
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      sendNotification(ride.roomNumber, 'Ride Cancelled', 'Your buggy request has been cancelled.', 'WARNING');
    }
    rides = rides.filter(r => r.id !== rideId);
  } catch (error) {
    console.error('Failed to cancel ride:', error);
  }
};

export const getActiveRideForUser = async (roomNumber: string): Promise<RideRequest | undefined> => {
  try {
    const dbRide = await apiClient.get<any>(`/ride-requests/room/${roomNumber}/active`);
    return mapRideToFrontend(dbRide);
  } catch (error: any) {
    // 404 means no active ride, which is fine
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return undefined;
    }
    console.error('Failed to get active ride:', error);
    // Fallback to local cache
    return rides.find(r => r.roomNumber === roomNumber && r.status !== BuggyStatus.COMPLETED);
  }
};

// --- SERVICES ---
// Helper function to map database service to frontend format
const mapServiceToFrontend = (dbService: any): ServiceRequest => ({
  id: dbService.id.toString(),
  type: dbService.type,
  status: dbService.status,
  details: dbService.details,
  roomNumber: dbService.room_number,
  timestamp: dbService.timestamp
});

export const getServiceRequests = async (): Promise<ServiceRequest[]> => {
  try {
    const dbServices = await apiClient.get<any[]>('/service-requests');
    return dbServices.map(mapServiceToFrontend);
  } catch (error) {
    console.error('Failed to fetch service requests:', error);
    return serviceRequests; // Fallback to mock data
  }
};

export const addServiceRequest = async (req: ServiceRequest): Promise<ServiceRequest> => {
  try {
    const dbService = await apiClient.post<any>('/service-requests', {
      type: req.type,
      status: 'PENDING',
      details: req.details,
      room_number: req.roomNumber,
      timestamp: req.timestamp || Date.now()
    });
    
    const newService = mapServiceToFrontend(dbService);
    serviceRequests = [newService, ...serviceRequests];
    
    // Notify Guest
    sendNotification(req.roomNumber, 'Order Received', `We have received your ${req.type.toLowerCase()} request.`, 'INFO');
    
    // Notify Staff of that Department
    const readableType = req.type.charAt(0) + req.type.slice(1).toLowerCase(); // Dining, Spa, etc.
    notifyStaffByDepartment(readableType, 'New Service Request', `Room ${req.roomNumber}: ${req.details}`);
    
    return newService;
  } catch (error) {
    console.error('Failed to add service request:', error);
    // Fallback to mock behavior
    serviceRequests = [req, ...serviceRequests];
    return req;
  }
};

export const updateServiceStatus = async (id: string, status: 'PENDING' | 'CONFIRMED' | 'COMPLETED') => {
  try {
    await apiClient.put(`/service-requests/${id}`, { status });
    
    const req = serviceRequests.find(s => s.id === id);
    if (!req) return;

    serviceRequests = serviceRequests.map(s => s.id === id ? { ...s, status } : s);

    // Notify Guest of status change
    if (status === 'CONFIRMED') {
        sendNotification(req.roomNumber, 'Order Confirmed', `Your ${req.type.toLowerCase()} request has been confirmed.`, 'SUCCESS');
    } else if (status === 'COMPLETED') {
        sendNotification(req.roomNumber, 'Order Completed', `Your ${req.type.toLowerCase()} service is complete.`, 'SUCCESS');
    }
  } catch (error) {
    console.error('Failed to update service status:', error);
  }
};

export const rateServiceRequest = (id: string, rating: number, feedback: string) => {
    // Check service requests
    const serviceIdx = serviceRequests.findIndex(s => s.id === id);
    if (serviceIdx >= 0) {
        serviceRequests[serviceIdx] = { ...serviceRequests[serviceIdx], rating, feedback };
        return;
    }
    // Check rides
    const rideIdx = rides.findIndex(r => r.id === id);
    if (rideIdx >= 0) {
        rides[rideIdx] = { ...rides[rideIdx], rating, feedback };
        return;
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


// --- UNIFIED HISTORY (Services + Buggy) ---
export const getUnifiedHistory = async (): Promise<ServiceRequest[]> => {
  try {
    // Fetch both services and rides
    const [dbServices, dbRides] = await Promise.all([
      apiClient.get<any[]>('/service-requests').catch(() => []),
      apiClient.get<any[]>('/ride-requests').catch(() => [])
    ]);
    
    // Map services
    const services = dbServices.map(mapServiceToFrontend);
    
    // Map rides to ServiceRequest shape
    const buggyHistory: ServiceRequest[] = dbRides.map((r: any) => ({
        id: r.id.toString(),
        type: 'BUGGY',
        status: r.status,
        details: `From ${r.pickup} to ${r.destination} (${r.guest_name})`,
        roomNumber: r.room_number,
        timestamp: r.timestamp
    }));

    const combined = [...services, ...buggyHistory];
    // Sort descending by timestamp
    return combined.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to fetch unified history:', error);
    // Fallback to local cache
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
    // Fetch guest-specific data
    const [dbServices, dbRides] = await Promise.all([
      apiClient.get<any[]>(`/service-requests/room/${roomNumber}`).catch(() => []),
      apiClient.get<any[]>(`/ride-requests/room/${roomNumber}`).catch(() => [])
    ]);
    
    const services = dbServices.map(mapServiceToFrontend);
    const buggyHistory: ServiceRequest[] = dbRides.map((r: any) => ({
        id: r.id.toString(),
        type: 'BUGGY',
        status: r.status,
        details: `From ${r.pickup} to ${r.destination} (${r.guest_name})`,
        roomNumber: r.room_number,
        timestamp: r.timestamp
    }));
    
    const combined = [...services, ...buggyHistory];
    return combined.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to fetch guest history:', error);
    // Fallback to local cache
    return getUnifiedHistory().then(history => 
      history.filter(req => req.roomNumber === roomNumber)
    ).catch(() => []);
  }
};

// --- SERVICE CHATS ---
export const getServiceMessages = (roomNumber: string, service: string) => {
    const key = `${roomNumber}_${service}`;
    return serviceChats[key] || [];
};

export const getLastMessage = (roomNumber: string, service: string): ChatMessage | undefined => {
    const key = `${roomNumber}_${service}`;
    const msgs = serviceChats[key];
    if (msgs && msgs.length > 0) {
        return msgs[msgs.length - 1];
    }
    return undefined;
};

export const sendServiceMessage = (roomNumber: string, service: string, text: string, senderRole: 'user' | 'staff' = 'user') => {
    const key = `${roomNumber}_${service}`;
    if (!serviceChats[key]) serviceChats[key] = [];
    
    // Add Message
    serviceChats[key] = [...serviceChats[key], { id: Date.now().toString(), role: senderRole, text }];

    // Simulate Staff Response only if User sent message
    if (senderRole === 'user') {
        setTimeout(() => {
            const replies = [
                `Our ${service.toLowerCase()} team has received your message.`,
                "We are checking on that for you right now.",
                "Thank you, noted.",
                "A staff member will be with you shortly."
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            
            serviceChats[key] = [...serviceChats[key], { 
                id: Date.now().toString(), 
                role: 'staff', 
                text: randomReply 
            }];
        }, 2500);
    }
};
