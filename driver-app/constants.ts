
import { Location, User, UserRole, Promotion, KnowledgeItem, RoomType, Room } from './types';

export const RESORT_CENTER: Location = {
  lat: 16.0396,
  lng: 108.2483,
  name: "Furama Resort Danang"
};

export const MOCK_LOCATIONS: Location[] = [
  { id: 'loc1', lat: 16.0400, lng: 108.2485, name: "Main Lobby", type: 'FACILITY' },
  { id: 'loc2', lat: 16.0390, lng: 108.2490, name: "Ocean Pool", type: 'FACILITY' },
  { id: 'loc3', lat: 16.0385, lng: 108.2480, name: "Lagoon Pool", type: 'FACILITY' },
  { id: 'loc4', lat: 16.0410, lng: 108.2475, name: "Don Cipriani's Italian Restaurant", type: 'RESTAURANT' },
  { id: 'loc5', lat: 16.0405, lng: 108.2470, name: "Furama Villas Reception", type: 'FACILITY' },
];

export const MOCK_ROOM_TYPES: RoomType[] = [
  { id: 'rt1', name: 'Ocean Suite', description: 'Luxury suite with ocean view', locationId: 'loc1' },
  { id: 'rt2', name: 'Garden Villa', description: 'Private villa surrounded by lush gardens', locationId: 'loc5' },
  { id: 'rt3', name: 'Presidential Suite', description: 'Top-tier luxury experience', locationId: 'loc1' },
  { id: 'rt4', name: 'Lagoon Bungalow', description: 'Direct access to the lagoon pool', locationId: 'loc3' }
];

export const MOCK_ROOMS: Room[] = [
    { id: 'r1', number: '101', typeId: 'rt1', status: 'Occupied' },
    { id: 'r2', number: '102', typeId: 'rt1', status: 'Available' },
    { id: 'r3', number: '205', typeId: 'rt2', status: 'Occupied' },
    { id: 'r4', number: '305', typeId: 'rt4', status: 'Available' },
    { id: 'r5', number: '888', typeId: 'rt3', status: 'Occupied' },
];

export const MOCK_USERS: User[] = [
  { lastName: "Smith", roomNumber: "101", villaType: "Ocean Suite", role: UserRole.GUEST },
  { lastName: "Nguyen", roomNumber: "205", villaType: "Garden Villa", role: UserRole.GUEST },
  { lastName: "Doe", roomNumber: "888", villaType: "Presidential Suite", role: UserRole.GUEST },
];

export const MOCK_PROMOTIONS: Promotion[] = [
    { id: '1', title: 'Sunset Happy Hour', description: 'Buy 1 Get 1 Free on all cocktails at Hai Van Lounge.', discount: '50% OFF', validUntil: 'Daily 17:00-19:00', imageColor: 'bg-orange-500' },
    { id: '2', title: 'Spa Retreat', description: '90-minute aromatherapy massage package.', discount: '20% OFF', validUntil: 'Nov 30', imageColor: 'bg-purple-500' },
    { id: '3', title: 'Seafood Buffet', description: 'Unlimited lobster and local seafood at Cafe Indochine.', discount: 'From $45', validUntil: 'Sat & Sun', imageColor: 'bg-blue-500' }
];

export const MOCK_KNOWLEDGE: KnowledgeItem[] = [
    { id: '1', question: "Check-in time", answer: "Check-in is at 2:00 PM." },
    { id: '2', question: "Check-out time", answer: "Check-out is at 12:00 PM." },
    { id: '3', question: "Breakfast hours", answer: "Breakfast is served from 6:30 AM to 10:30 AM at Cafe Indochine." },
    { id: '4', question: "Wifi Password", answer: "The wifi network is 'Furama_Guest' and there is no password required." }
];

export const THEME_COLORS = {
  primary: "bg-emerald-800",
  secondary: "bg-amber-500",
  accent: "bg-stone-100",
  text: "text-emerald-900"
};
