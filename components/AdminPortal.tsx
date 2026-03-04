import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { DataLoader } from './DataLoader';
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
    
    // Memoize data extraction to prevent unnecessary re-renders
    const locations = useMemo(() => data.locations, [data.locations]);
    const menu = useMemo(() => data.menu, [data.menu]);
    const events = useMemo(() => data.events, [data.events]);
    const promotions = useMemo(() => data.promotions, [data.promotions]);
    const knowledge = useMemo(() => data.knowledge, [data.knowledge]);
    const users = useMemo(() => data.users, [data.users]);
    const rides = useMemo(() => data.rides, [data.rides]);
    const serviceHistory = useMemo(() => data.serviceHistory, [data.serviceHistory]);
    const roomTypes = useMemo(() => data.roomTypes, [data.roomTypes]);
    const rooms = useMemo(() => data.rooms, [data.rooms]);
    
    // Memoize helper functions to prevent re-renders
    const setLocations = useCallback((locs: typeof locations) => setData(prev => ({ ...prev, locations: locs })), [setData]);
    const setMenu = useCallback((m: typeof menu) => setData(prev => ({ ...prev, menu: m })), [setData]);
    const setEvents = useCallback((e: typeof events) => setData(prev => ({ ...prev, events: e })), [setData]);
    const setPromotions = useCallback((p: typeof promotions) => setData(prev => ({ ...prev, promotions: p })), [setData]);
    const setKnowledge = useCallback((k: typeof knowledge) => setData(prev => ({ ...prev, knowledge: k })), [setData]);
    const setUsers = useCallback((u: typeof users) => setData(prev => ({ ...prev, users: u })), [setData]);
    const setRoomTypes = useCallback((rt: typeof roomTypes) => setData(prev => ({ ...prev, roomTypes: rt })), [setData]);
    const setRooms = useCallback((r: typeof rooms) => setData(prev => ({ ...prev, rooms: r })), [setData]);
    
    // Sound state
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('admin_sound_enabled');
        return saved !== null ? saved === 'true' : true;
    });
    
    // History filter state
    const [historyFilterType, setHistoryFilterType] = useState<string>('ALL');
    const [historyFilterDate, setHistoryFilterDate] = useState<string>('');

    // Polling when tab is HISTORY or FLEET and document is visible (realtime feel)
    const POLL_INTERVAL_MS = 30000;
    const refreshDataRef = useRef(refreshData);
    refreshDataRef.current = refreshData;
    useEffect(() => {
        if (tab !== 'HISTORY' && tab !== 'FLEET') return;
        const tick = () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                if (tab === 'HISTORY') refreshDataRef.current('serviceHistory');
                if (tab === 'FLEET') refreshDataRef.current('rides');
            }
        };
        const id = setInterval(tick, POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [tab]);

    return (
        <DataLoader isLoading={isLoading} fullScreen message="Loading...">
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
                        onDelete={async (id: string) => {
                            await handleDelete(id, 'LOCATION');
                            await refreshData('locations');
                        }}
                        onRefresh={async () => await refreshData('locations')}
                    />
                )}

                {tab === 'MENU' && (
                    <MenuTab
                        menu={menu}
                        onDelete={async (id: string) => {
                            await handleDelete(id, 'MENU_ITEM');
                            await refreshData('menu');
                        }}
                        onRefresh={async () => await refreshData('menu')}
                    />
                )}

                {tab === 'EVENTS' && (
                    <EventsTab
                        events={events}
                        onDelete={async (id: string) => {
                            await handleDelete(id, 'EVENT');
                            await refreshData('events');
                        }}
                        onRefresh={async () => await refreshData('events')}
                        setEvents={setEvents}
                    />
                )}

                {tab === 'PROMOS' && (
                    <PromosTab
                        promotions={promotions}
                        onDelete={async (id: string) => {
                            await handleDelete(id, 'PROMOTION');
                            await refreshData('promotions');
                        }}
                        onRefresh={async () => await refreshData('promotions')}
                        setPromotions={setPromotions}
                    />
                )}

                {tab === 'KNOWLEDGE' && (
                    <KnowledgeTab
                        knowledge={knowledge}
                        onDelete={async (id: string) => {
                            await handleDelete(id, 'KNOWLEDGE_ITEM');
                            await refreshData('knowledge');
                        }}
                        onRefresh={async () => await refreshData('knowledge')}
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
                        onRefresh={async () => await refreshData('serviceHistory')}
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
                        onDelete={async (id: string, type: 'ROOM_TYPE' | 'ROOM') => {
                            await handleDelete(id, type);
                            await refreshData('roomTypes');
                            await refreshData('rooms');
                        }}
                        onRefresh={async () => {
                            await refreshData('roomTypes');
                            await refreshData('rooms');
                        }}
                        setRoomTypes={setRoomTypes}
                        setRooms={setRooms}
                        setLocations={setLocations}
                    />
                )}

                {tab === 'USERS' && (
                    <UsersTab
                        users={users}
                        userRole={user.role}
                        onDelete={async (id: string) => {
                            await handleDelete(id, 'USER');
                            await refreshData('users');
                        }}
                        onRefresh={async () => await refreshData('users')}
                        setUsers={setUsers}
                    />
                )}

                {tab === 'GUESTS' && (
                    <GuestsTab
                        users={users}
                        roomTypes={roomTypes}
                        onDelete={async (id: string) => {
                            await handleDelete(id, 'USER');
                            await refreshData('users');
                        }}
                        onRefresh={async () => await refreshData('users')}
                        setUsers={setUsers}
                    />
                )}
            </div>
        </div>
        </DataLoader>
    );
};

export default AdminPortal;
