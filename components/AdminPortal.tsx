import React, { useState } from 'react';
import { User, UserRole } from '../types';
import Loading from './Loading';
import { useAdminData } from '../hooks/useAdminData';
import { useAdminCRUD } from '../hooks/useAdminCRUD';
import { AdminHeader } from './admin/AdminHeader';
import { AdminTabs } from './admin/AdminTabs';
import { LocationsTab } from './admin/tabs/LocationsTab';
import { MenuTab } from './admin/tabs/MenuTab';
import { EventsTab } from './admin/tabs/EventsTab';
import { PromosTab } from './admin/tabs/PromosTab';
import { KnowledgeTab } from './admin/tabs/KnowledgeTab';
import { HistoryTab } from './admin/tabs/HistoryTab';
import { FleetTab } from './admin/tabs/FleetTab';
import { RoomsTab } from './admin/tabs/RoomsTab';
import { UsersTab } from './admin/tabs/UsersTab';
import { GuestsTab } from './admin/tabs/GuestsTab';

interface AdminPortalProps {
    onLogout: () => void;
    user: User;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ onLogout, user }) => {
    const [tab, setTab] = useState<'LOCATIONS' | 'MENU' | 'EVENTS' | 'PROMOS' | 'KNOWLEDGE' | 'USERS' | 'GUESTS' | 'ROOMS' | 'HISTORY' | 'FLEET'>('LOCATIONS');
    
    const { data, isLoading, refreshData, setData } = useAdminData();
    const { handleDelete } = useAdminCRUD();
    
    // Extract data
    const locations = data.locations;
    const menu = data.menu;
    const events = data.events;
    const promotions = data.promotions;
    const knowledge = data.knowledge;
    const users = data.users;
    const rides = data.rides;
    const serviceHistory = data.serviceHistory;
    const roomTypes = data.roomTypes;
    const rooms = data.rooms;
    
    // Helper functions to update data
    const setLocations = (locs: typeof locations) => setData(prev => ({ ...prev, locations: locs }));
    const setMenu = (m: typeof menu) => setData(prev => ({ ...prev, menu: m }));
    const setEvents = (e: typeof events) => setData(prev => ({ ...prev, events: e }));
    const setPromotions = (p: typeof promotions) => setData(prev => ({ ...prev, promotions: p }));
    const setKnowledge = (k: typeof knowledge) => setData(prev => ({ ...prev, knowledge: k }));
    const setUsers = (u: typeof users) => setData(prev => ({ ...prev, users: u }));
    const setRoomTypes = (rt: typeof roomTypes) => setData(prev => ({ ...prev, roomTypes: rt }));
    const setRooms = (r: typeof rooms) => setData(prev => ({ ...prev, rooms: r }));
    
    // Sound state
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('admin_sound_enabled');
        return saved !== null ? saved === 'true' : true;
    });
    
    // History filter state
    const [historyFilterType, setHistoryFilterType] = useState<string>('ALL');
    const [historyFilterDate, setHistoryFilterDate] = useState<string>('');

    if (isLoading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 flex flex-col font-sans">
            <AdminHeader
                user={user}
                onLogout={onLogout}
                tab={tab}
                rides={rides}
                users={users}
                soundEnabled={soundEnabled}
                onSoundToggle={setSoundEnabled}
                onNavigate={() => setTab('FLEET')}
            />

            <AdminTabs
                currentTab={tab}
                onTabChange={setTab}
                userRole={user.role}
            />

            <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
                {tab === 'LOCATIONS' && (
                    <LocationsTab
                        locations={locations}
                        onDelete={async (id: string) => await handleDelete(id, 'LOCATION')}
                        onRefresh={async () => await refreshData('locations')}
                    />
                )}

                {tab === 'MENU' && (
                    <MenuTab
                        menu={menu}
                        onDelete={async (id: string) => await handleDelete(id, 'MENU_ITEM')}
                        onRefresh={async () => await refreshData()}
                    />
                )}

                {tab === 'EVENTS' && (
                    <EventsTab
                        events={events}
                        onDelete={async (id: string) => await handleDelete(id, 'EVENT')}
                        onRefresh={async () => await refreshData()}
                        setEvents={setEvents}
                    />
                )}

                {tab === 'PROMOS' && (
                    <PromosTab
                        promotions={promotions}
                        onDelete={async (id: string) => await handleDelete(id, 'PROMOTION')}
                        onRefresh={async () => await refreshData()}
                        setPromotions={setPromotions}
                    />
                )}

                {tab === 'KNOWLEDGE' && (
                    <KnowledgeTab
                        knowledge={knowledge}
                        onDelete={async (id: string) => await handleDelete(id, 'KNOWLEDGE_ITEM')}
                        onRefresh={async () => await refreshData()}
                        setKnowledge={setKnowledge}
                    />
                )}

                {tab === 'HISTORY' && (
                    <HistoryTab
                        serviceHistory={serviceHistory}
                        historyFilterType={historyFilterType}
                        setHistoryFilterType={setHistoryFilterType}
                        historyFilterDate={historyFilterDate}
                        setHistoryFilterDate={setHistoryFilterDate}
                    />
                )}

                {tab === 'FLEET' && (
                    <FleetTab
                        user={user}
                        onLogout={onLogout}
                    />
                )}

                {tab === 'ROOMS' && (
                    <RoomsTab
                        roomTypes={roomTypes}
                        rooms={rooms}
                        locations={locations}
                        onDelete={async (id: string, type: 'ROOM_TYPE' | 'ROOM') => await handleDelete(id, type)}
                        onRefresh={async () => await refreshData()}
                        setRoomTypes={setRoomTypes}
                        setRooms={setRooms}
                        setLocations={setLocations}
                    />
                )}

                {tab === 'USERS' && (
                    <UsersTab
                        users={users}
                        userRole={user.role}
                        onDelete={async (id: string) => await handleDelete(id, 'USER')}
                        onRefresh={async () => await refreshData()}
                        setUsers={setUsers}
                    />
                )}

                {tab === 'GUESTS' && (
                    <GuestsTab
                        users={users}
                        roomTypes={roomTypes}
                        onDelete={async (id: string) => await handleDelete(id, 'USER')}
                        onRefresh={async () => await refreshData()}
                        setUsers={setUsers}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminPortal;
