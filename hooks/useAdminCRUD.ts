import { useState } from 'react';
import { parseAdminInput, generateTranslations } from '../services/geminiService';
import {
    addLocation, updateLocation, deleteLocation,
    addMenuItem, updateMenuItem, deleteMenuItem,
    addEvent, updateEvent, deleteEvent,
    addPromotion, updatePromotion, deletePromotion,
    addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem,
    addUser, updateUser, deleteUser,
    addRoom, updateRoom, deleteRoom,
    addRoomType, updateRoomType, deleteRoomType
} from '../services/dataService';
import { Location, MenuItem, ResortEvent, Promotion, KnowledgeItem, User, Room, RoomType } from '../types';

export const useAdminCRUD = () => {
    const [isParsing, setIsParsing] = useState(false);

    const handleDelete = async (id: string, type: 'LOCATION' | 'MENU_ITEM' | 'EVENT' | 'PROMOTION' | 'KNOWLEDGE_ITEM' | 'USER' | 'ROOM' | 'ROOM_TYPE') => {
        if (!confirm(`Delete this ${type}?`)) return;

        try {
            switch (type) {
                case 'LOCATION':
                    await deleteLocation(id);
                    break;
                case 'MENU_ITEM':
                    await deleteMenuItem(id);
                    break;
                case 'EVENT':
                    await deleteEvent(id);
                    break;
                case 'PROMOTION':
                    await deletePromotion(id);
                    break;
                case 'KNOWLEDGE_ITEM':
                    await deleteKnowledgeItem(id);
                    break;
                case 'USER':
                    await deleteUser(id);
                    break;
                case 'ROOM':
                    await deleteRoom(id);
                    break;
                case 'ROOM_TYPE':
                    await deleteRoomType(id);
                    break;
            }
        } catch (error: any) {
            console.error(`Failed to delete ${type}:`, error);
            alert(`Failed to delete: ${error?.message || 'Unknown error'}`);
        }
    };

    const handleAiSubmit = async (
        aiInput: string,
        tab: string,
        roomView: string,
        roomTypes: RoomType[],
        onSuccess: () => void,
        editingItem?: { type: string; id: string; data: any } | null
    ) => {
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
                if (tab === 'LOCATIONS') {
                    await addLocation(result as Location);
                } else if (tab === 'MENU') {
                    await addMenuItem(result as MenuItem);
                } else if (tab === 'EVENTS') {
                    if (editingItem && editingItem.type === 'EVENT') {
                        await updateEvent(editingItem.id, result as ResortEvent);
                    } else {
                        await addEvent(result as ResortEvent);
                    }
                } else if (tab === 'PROMOS') {
                    if (editingItem && editingItem.type === 'PROMOTION') {
                        await updatePromotion(editingItem.id, result as Promotion);
                    } else {
                        await addPromotion(result as Promotion);
                    }
                } else if (tab === 'KNOWLEDGE') {
                    if (editingItem && editingItem.type === 'KNOWLEDGE_ITEM') {
                        await updateKnowledgeItem(editingItem.id, result as KnowledgeItem);
                    } else {
                        await addKnowledgeItem(result as KnowledgeItem);
                    }
                } else if (tab === 'ROOMS' && roomView === 'LIST') {
                    const typeName = result.typeName;
                    const typeObj = roomTypes.find(rt => rt.name.toLowerCase() === typeName.toLowerCase());
                    if (typeObj) {
                        await addRoom({ id: '', number: result.number, typeId: typeObj.id, status: 'Available' });
                    } else {
                        alert(`Room Type '${typeName}' not found. Please create it first.`);
                        return;
                    }
                }

                onSuccess();
            } catch (error: any) {
                console.error('Failed to add/update item:', error);
                alert(`Failed to add/update item: ${error?.message || 'Unknown error'}. Please check console for details.`);
            }
        }
    };

    return {
        isParsing,
        handleDelete,
        handleAiSubmit
    };
};
