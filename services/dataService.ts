
import { Location, MenuItem, RideRequest, ServiceRequest, BuggyStatus, UserRole, ResortEvent, Promotion, KnowledgeItem, User, Department, RoomType, Room, HotelReview, AppNotification, ChatMessage } from '../types';
import { MOCK_LOCATIONS, MOCK_PROMOTIONS, MOCK_KNOWLEDGE, MOCK_USERS, MOCK_ROOM_TYPES, MOCK_ROOMS } from '../constants';

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
export const getLocations = () => locations;
export const addLocation = (loc: Location) => {
  locations = [...locations, { ...loc, id: Date.now().toString() }];
};
export const deleteLocation = (name: string) => {
    locations = locations.filter(l => l.name !== name);
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
export const getMenu = (categoryFilter?: 'Dining' | 'Spa' | 'Pool' | 'Butler') => {
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
export const getEvents = () => events;
export const addEvent = (event: ResortEvent) => {
    events = [...events, { ...event, id: Date.now().toString() }];
};
export const deleteEvent = (id: string) => {
    events = events.filter(e => e.id !== id);
};

// --- PROMOTIONS ---
export const getPromotions = () => promotions;
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

export const requestRide = (guestName: string, roomNumber: string, pickup: string, destination: string): RideRequest => {
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
  
  // Notify drivers (mock: notify 'driver' user)
  sendNotification('driver', 'New Ride Request', `Guest ${guestName} (Room ${roomNumber}) needs a ride.`, 'INFO');

  return newRide;
};

export const updateRideStatus = (rideId: string, status: BuggyStatus, driverId?: string, eta?: number) => {
  const ride = rides.find(r => r.id === rideId);
  if (!ride) return;

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

  // Notify Guest of status change
  if (status === BuggyStatus.ASSIGNED) {
      sendNotification(ride.roomNumber, 'Buggy Assigned', `A driver is on the way. ETA: ${eta} mins.`, 'SUCCESS');
  } else if (status === BuggyStatus.ARRIVING) {
      sendNotification(ride.roomNumber, 'Buggy Arriving', `Your buggy has arrived at ${ride.pickup}.`, 'INFO');
  } else if (status === BuggyStatus.COMPLETED) {
      sendNotification(ride.roomNumber, 'Ride Completed', `You have arrived at ${ride.destination}. Have a nice day!`, 'SUCCESS');
  }
};

export const cancelRide = (rideId: string) => {
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
        // Notify guest confirming cancellation
        sendNotification(ride.roomNumber, 'Ride Cancelled', 'Your buggy request has been cancelled.', 'WARNING');
    }
    rides = rides.filter(r => r.id !== rideId);
};

export const getActiveRideForUser = (roomNumber: string) => {
    return rides.find(r => r.roomNumber === roomNumber && r.status !== BuggyStatus.COMPLETED);
};

// --- SERVICES ---
export const getServiceRequests = () => serviceRequests;
export const addServiceRequest = (req: ServiceRequest) => {
    serviceRequests = [req, ...serviceRequests];
    
    // Notify Guest
    sendNotification(req.roomNumber, 'Order Received', `We have received your ${req.type.toLowerCase()} request.`, 'INFO');
    
    // Notify Staff of that Department
    const readableType = req.type.charAt(0) + req.type.slice(1).toLowerCase(); // Dining, Spa, etc.
    notifyStaffByDepartment(readableType, 'New Service Request', `Room ${req.roomNumber}: ${req.details}`);
};

export const updateServiceStatus = (id: string, status: 'PENDING' | 'CONFIRMED' | 'COMPLETED') => {
    const req = serviceRequests.find(s => s.id === id);
    if (!req) return;

    serviceRequests = serviceRequests.map(s => s.id === id ? { ...s, status } : s);

    // Notify Guest of status change
    if (status === 'CONFIRMED') {
        sendNotification(req.roomNumber, 'Order Confirmed', `Your ${req.type.toLowerCase()} request has been confirmed.`, 'SUCCESS');
    } else if (status === 'COMPLETED') {
        sendNotification(req.roomNumber, 'Order Completed', `Your ${req.type.toLowerCase()} service is complete.`, 'SUCCESS');
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
export const getUnifiedHistory = (): ServiceRequest[] => {
    // Map rides to ServiceRequest shape
    const buggyHistory: ServiceRequest[] = rides.map(r => ({
        id: r.id,
        type: 'BUGGY',
        status: r.status, // e.g. COMPLETED, ARRIVING...
        details: `From ${r.pickup} to ${r.destination} (${r.guestName})`,
        roomNumber: r.roomNumber,
        timestamp: r.timestamp,
        rating: r.rating,
        feedback: r.feedback
    }));

    const combined = [...serviceRequests, ...buggyHistory];
    // Sort descending by timestamp
    return combined.sort((a, b) => b.timestamp - a.timestamp);
};

// --- GUEST SPECIFIC DATA ---
export const getGuestHistory = (roomNumber: string): ServiceRequest[] => {
    return getUnifiedHistory().filter(req => req.roomNumber === roomNumber);
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
