
export enum AppView {
  LOGIN = 'LOGIN',
  HOME = 'HOME',
  BUGGY = 'BUGGY',
  SERVICES = 'SERVICES',
  CHAT = 'CHAT',
  LIVE_CONCIERGE = 'LIVE_CONCIERGE',
  ACCOUNT = 'ACCOUNT', // New View
  // Service Sub-views
  DINING_ORDER = 'DINING_ORDER',
  SPA_BOOKING = 'SPA_BOOKING',
  POOL_ORDER = 'POOL_ORDER',
  BUTLER_REQUEST = 'BUTLER_REQUEST',
  EVENTS = 'EVENTS',
  // New Portals
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  DRIVER_DASHBOARD = 'DRIVER_DASHBOARD',
  STAFF_DASHBOARD = 'STAFF_DASHBOARD'
}

export enum UserRole {
  GUEST = 'GUEST',
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  STAFF = 'STAFF',
  SUPERVISOR = 'SUPERVISOR'
}

export type Department = 'All' | 'Buggy' | 'Dining' | 'Spa' | 'Pool' | 'Butler' | 'FrontDesk';

export interface User {
  id?: string;
  lastName: string;
  roomNumber: string; // Acts as Username/ID for staff
  password?: string; // New field for staff auth
  villaType?: string; // Name of the Room Type
  role: UserRole;
  department?: Department; // Permission group
  // Guest Access Control
  checkIn?: string; // ISO Date String
  checkOut?: string; // ISO Date String
  notes?: string; // Guest personal notes/preferences
}

export interface RoomType {
  id: string;
  name: string;
  description?: string;
  locationId?: string; // Link to a Location
}

export interface Room {
  id: string;
  number: string;
  typeId: string; // Links to RoomType
  status?: 'Available' | 'Occupied' | 'Maintenance';
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string; // 'Dining' | 'Spa' | 'Pool' | 'Butler'
  description: string;
}

export interface ResortEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount?: string;
  validUntil?: string;
  imageColor?: string; // For UI styling mock
}

export interface KnowledgeItem {
  id: string;
  question: string; // The topic or question, e.g., "Check-out time"
  answer: string;   // The fact, e.g., "12:00 PM"
  sourceFile?: string; // Name of uploaded PDF/File
}

export enum BuggyStatus {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING', // Waiting for driver
  ASSIGNED = 'ASSIGNED',   // Driver accepted
  ARRIVING = 'ARRIVING',
  ON_TRIP = 'ON_TRIP',
  COMPLETED = 'COMPLETED'
}

export interface RideRequest {
  id: string;
  guestName: string;
  roomNumber: string;
  pickup: string;
  destination: string;
  status: BuggyStatus;
  timestamp: number;
  driverId?: string;
  eta?: number;
  rating?: number;   // 1-5
  feedback?: string;
}

export interface ServiceRequest {
  id: string;
  type: 'DINING' | 'SPA' | 'POOL' | 'BUTLER' | 'HOUSEKEEPING' | 'BUGGY';
  status: string;
  details: string;
  roomNumber: string;
  timestamp: number;
  rating?: number;   // 1-5 Stars
  feedback?: string; // User comment
}

export interface HotelReview {
    id: string;
    roomNumber: string;
    guestName: string;
    // rating: number; // Deprecated in favor of detailed categories
    categoryRatings: { category: string; rating: number }[]; // Detailed ratings
    averageRating: number; // Calculated average
    comment: string;
    timestamp: number;
}

export interface Location {
  id?: string;
  lat: number;
  lng: number;
  name: string;
  type?: 'VILLA' | 'FACILITY' | 'RESTAURANT';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'staff'; // Added staff role
  text: string;
  groundingUrls?: Array<{ uri: string; title: string; type?: 'WEB' | 'MAP' }>;
}

export interface AppNotification {
    id: string;
    recipientId: string; // roomNumber for Guest, userId for Staff
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING';
    timestamp: number;
    isRead: boolean;
}
