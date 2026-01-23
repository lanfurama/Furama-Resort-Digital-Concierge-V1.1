
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, User, Shield, Globe, Languages } from 'lucide-react';
import { ChatMessage } from '../types';
import { getServiceMessages, sendServiceMessage, markServiceMessagesAsRead, getServiceUnreadCount, getUsers } from '../services/dataService';
import { translateText } from '../services/geminiService';
import { useTranslation } from '../contexts/LanguageContext';

interface ServiceChatProps {
    serviceType: string;
    roomNumber: string;
    label?: string; // e.g. "Driver" or "Kitchen"
    autoOpen?: boolean;
    userRole?: 'user' | 'staff'; // Determines who is 'Me' and who is 'Other'
    onClose?: () => void;
    hideFloatingButton?: boolean; // Hide the floating toggle button
    isOpen?: boolean; // Control open state from parent
    onToggle?: (isOpen: boolean) => void; // Callback when chat is toggled
}

const SUPPORTED_LANGUAGES = [
    'Original', 
    'Vietnamese', 
    'English', 
    'Korean', 
    'Japanese', 
    'Chinese', 
    'French', 
    'Russian'
];

const ServiceChat: React.FC<ServiceChatProps> = ({ 
    serviceType, 
    roomNumber, 
    label = "Staff", 
    autoOpen = false, 
    userRole = 'user',
    onClose,
    hideFloatingButton = false,
    isOpen: controlledIsOpen,
    onToggle
}) => {
    const { language } = useTranslation();
    const [internalIsOpen, setInternalIsOpen] = useState(autoOpen);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const prevUnreadCountRef = useRef(0);
    const isFirstFetchRef = useRef(true);

    // Map app language to translation language
    const mapAppLangToTranslateLang = (appLang: string): string => {
        const langMap: Record<string, string> = {
            'English': 'English',
            'Vietnamese': 'Vietnamese',
            'Korean': 'Korean',
            'Japanese': 'Japanese',
            'Chinese': 'Chinese',
            'French': 'French',
            'Russian': 'Russian'
        };
        return langMap[appLang] || 'Original';
    };

    // Translation State - Auto-set to app language
    const [targetLang, setTargetLang] = useState(() => mapAppLangToTranslateLang(language));
    const [showLangSelector, setShowLangSelector] = useState(false);
    const [translatedCache, setTranslatedCache] = useState<Record<string, string>>({});
    const [userManuallyChangedLang, setUserManuallyChangedLang] = useState(false);
    const [guestLanguage, setGuestLanguage] = useState<string | null>(null);
    
    // Fetch guest language from database when userRole is 'user' (guest)
    // This runs whenever roomNumber changes to ensure we get the latest guest language
    useEffect(() => {
        const fetchGuestLanguage = async () => {
            if (userRole === 'user' && roomNumber) {
                try {
                    const users = await getUsers();
                    const guest = users.find(u => u.roomNumber === roomNumber && u.role === 'GUEST');
                    if (guest && guest.language) {
                        const guestLang = guest.language;
                        setGuestLanguage(guestLang);
                        // Only auto-set targetLang if user hasn't manually changed it
                        if (!userManuallyChangedLang) {
                            const guestLangMapped = mapAppLangToTranslateLang(guestLang);
                            setTargetLang(guestLangMapped);
                            // Clear cache when language changes
                            setTranslatedCache({});
                            console.log(`[ServiceChat] Auto-set target language to ${guestLangMapped} based on guest language: ${guestLang}`);
                        }
                    } else {
                        // If guest not found or no language set, use app language
                        setGuestLanguage(null);
                        if (!userManuallyChangedLang) {
                            const appLangMapped = mapAppLangToTranslateLang(language);
                            setTargetLang(appLangMapped);
                            setTranslatedCache({});
                            console.log(`[ServiceChat] Guest language not found, using app language: ${appLangMapped}`);
                        }
                    }
                } catch (error) {
                    console.error('[ServiceChat] Failed to fetch guest language:', error);
                    // Fallback to app language on error
                    if (!userManuallyChangedLang) {
                        const appLangMapped = mapAppLangToTranslateLang(language);
                        setTargetLang(appLangMapped);
                    }
                }
            } else if (userRole === 'staff') {
                // For staff, always use app language (staff can see original or translate to guest's language)
                if (!userManuallyChangedLang) {
                    const appLangMapped = mapAppLangToTranslateLang(language);
                    setTargetLang(appLangMapped);
                }
            }
        };
        
        fetchGuestLanguage();
    }, [userRole, roomNumber, userManuallyChangedLang, language]);
    
    // Auto-update targetLang when app language changes (unless user manually changed it)
    // This is a fallback if guest language is not available
    useEffect(() => {
        if (!userManuallyChangedLang && !guestLanguage && userRole === 'user') {
            const appLangMapped = mapAppLangToTranslateLang(language);
            setTargetLang(appLangMapped);
            // Clear cache when language changes
            setTranslatedCache({});
        }
    }, [language, userManuallyChangedLang, guestLanguage, userRole]);

    // Poll for new messages (simulating real-time)
    useEffect(() => {
        const fetch = async () => {
            try {
                const msgs = await getServiceMessages(roomNumber, serviceType);
                const currentCount = messages.length;
                
            // Simple check to avoid tight loops if object ref changes but content is same
                if (msgs.length !== currentCount || JSON.stringify(msgs) !== JSON.stringify(messages)) {
                setMessages(msgs);
                }
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            }
        };

        fetch();
        const interval = setInterval(fetch, 5000); // Poll every 5 seconds to reduce API calls
        return () => clearInterval(interval);
    }, [roomNumber, serviceType]);

    // Poll for unread count when chat is closed
    useEffect(() => {
        if (!isOpen) {
            const fetchUnread = async () => {
                try {
                    const count = await getServiceUnreadCount(roomNumber, serviceType, userRole);
                    const prevCount = prevUnreadCountRef.current;
                    
                    // Skip auto-open on first fetch (component mount) to avoid opening for old messages
                    // Only auto-open when unread count increases from a known value (indicating new message)
                    if (!isFirstFetchRef.current && prevCount >= 0 && count > prevCount) {
                        console.log(`[ServiceChat] New message detected, auto-opening chat for ${serviceType} in room ${roomNumber}`);
                        if (controlledIsOpen === undefined) {
                            setInternalIsOpen(true);
                        }
                        if (onToggle) {
                            onToggle(true);
                        }
                    }
                    
                    setUnreadCount(count);
                    prevUnreadCountRef.current = count;
                    isFirstFetchRef.current = false; // Mark first fetch as complete
                } catch (error) {
                    console.error('Failed to fetch unread count:', error);
                }
            };

            fetchUnread();
            const interval = setInterval(fetchUnread, 5000); // Poll every 5 seconds to reduce API calls
            return () => clearInterval(interval);
        } else {
            setUnreadCount(0); // Reset when chat is open
            prevUnreadCountRef.current = 0; // Reset previous count when chat is open
            isFirstFetchRef.current = true; // Reset first fetch flag when chat opens
        }
    }, [roomNumber, serviceType, userRole, isOpen]);

    // Handle Auto-Translation when messages change or target language changes
    useEffect(() => {
        const translateIncoming = async () => {
            if (targetLang === 'Original') {
                // Clear cache if switching to Original
                setTranslatedCache({});
                return;
            }

            // Find messages that need translation (from the other person and not in cache)
            const msgsToTranslate = messages.filter(msg => 
                msg.role !== userRole && // Only translate other person's messages
                !translatedCache[msg.id] && // Not yet translated
                msg.text && msg.text.trim() // Has valid text
            );

            if (msgsToTranslate.length === 0) return;

            console.log(`[ServiceChat] Translating ${msgsToTranslate.length} messages to ${targetLang} for ${userRole === 'user' ? 'guest' : 'staff'}`);

            const newTranslations: Record<string, string> = {};
            
            await Promise.all(msgsToTranslate.map(async (msg) => {
                try {
                    const translated = await translateText(msg.text, targetLang);
                    if (translated && translated !== msg.text && translated.trim()) {
                        newTranslations[msg.id] = translated;
                        console.log(`[ServiceChat] Translated message ${msg.id}: "${msg.text.substring(0, 50)}..." -> "${translated.substring(0, 50)}..."`);
                    } else {
                        console.warn(`[ServiceChat] Translation returned same text or empty for message ${msg.id}`);
                    }
                } catch (error) {
                    console.error(`[ServiceChat] Failed to translate message ${msg.id}:`, error);
                }
            }));

            if (Object.keys(newTranslations).length > 0) {
                setTranslatedCache(prev => ({ ...prev, ...newTranslations }));
                console.log(`[ServiceChat] Updated translation cache with ${Object.keys(newTranslations).length} new translations`);
            }
        };

        translateIncoming();
    }, [messages, targetLang, userRole]);

    // Auto-scroll and mark as read when new messages arrive
    useEffect(() => {
        if (isOpen && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            // Mark as read when new messages arrive and chat is open
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && typeof lastMessage.id === 'number') {
                markServiceMessagesAsRead(roomNumber, serviceType, lastMessage.id, userRole);
            }
        }
    }, [messages, isOpen, roomNumber, serviceType, userRole]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const messageText = input;
        setInput('');
        try {
            await sendServiceMessage(roomNumber, serviceType, messageText, userRole as 'user' | 'staff');
            // Refresh messages after sending
            const msgs = await getServiceMessages(roomNumber, serviceType);
            setMessages(msgs);
        } catch (error) {
            console.error('Failed to send message:', error);
            setInput(messageText); // Restore input on error
        }
    };

    const handleClose = async () => {
        if (controlledIsOpen === undefined) {
            setInternalIsOpen(false);
        }
        if (onToggle) {
            onToggle(false);
        }
        // Mark messages as read when closing chat (user has seen them)
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && typeof lastMessage.id === 'number') {
                await markServiceMessagesAsRead(roomNumber, serviceType, lastMessage.id, userRole);
            }
        }
        if (onClose) onClose();
    };

    const toggleOpen = async () => {
        const newState = !isOpen;
        if (controlledIsOpen === undefined) {
            setInternalIsOpen(newState);
        }
        if (onToggle) {
            onToggle(newState);
        }
        
        // Mark messages as read when opening chat
        if (newState && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && typeof lastMessage.id === 'number') {
                await markServiceMessagesAsRead(roomNumber, serviceType, lastMessage.id, userRole);
            }
            setUnreadCount(0);
        }
        
        if (!newState && onClose) onClose();
    }

    // Sync internal state with controlled state
    useEffect(() => {
        if (controlledIsOpen !== undefined) {
            setInternalIsOpen(controlledIsOpen);
        }
    }, [controlledIsOpen]);

    return (
        <>
            {/* Overlay Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 pointer-events-auto"
                    style={{ zIndex: 99998 }}
                    onClick={handleClose}
                />
            )}
            
            {/* Chat Window Container */}
            {isOpen && (
                <div 
                    className="fixed inset-0 flex items-center justify-center pointer-events-none"
                    style={{ 
                        zIndex: 99999,
                        paddingTop: '20px', // Giảm thêm padding-top để đưa lên trên
                        paddingBottom: '100px', // Space for bottom nav (80px + padding)
                        paddingLeft: '1rem',
                        paddingRight: '1rem'
                    }}
                >
                    {/* Chat Window */}
                    <div 
                        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border-2 border-emerald-200 flex flex-col overflow-hidden pointer-events-auto animate-in zoom-in-95 fade-in"
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                            zIndex: 100000,
                            maxHeight: 'calc(100vh - 180px)', // Viewport height - header (70px) - bottom nav (100px) - margin
                            height: 'auto',
                            minHeight: '400px'
                        }}
                    >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-3 flex justify-between items-center shadow-lg relative flex-shrink-0">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                             <div className="p-1.5 bg-white/20 rounded-full flex-shrink-0">
                                {userRole === 'user' ? <Shield size={16} /> : <User size={16} />}
                             </div>
                             <div className="min-w-0 flex-1">
                                 <h3 className="font-bold text-sm truncate">Chat with {label}</h3>
                                 <p className="text-[10px] opacity-90 flex items-center"><span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span> Online</p>
                             </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 flex-shrink-0">
                            {/* Language Selector Toggle */}
                            <button 
                                onClick={() => setShowLangSelector(!showLangSelector)}
                                className={`p-1.5 rounded-full hover:bg-white/20 transition ${targetLang !== 'Original' ? 'text-amber-300' : 'text-white'}`}
                                title="Translate Chat"
                            >
                                <Globe size={16} />
                            </button>
                            <button onClick={handleClose} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={18}/></button>
                        </div>

                        {/* Language Dropdown */}
                        {showLangSelector && (
                            <div 
                                className="absolute top-full mt-2 right-0 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 py-2 w-40 animate-in fade-in zoom-in-95"
                                style={{ zIndex: 100000 }}
                            >
                                <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase">Translate to</p>
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <button 
                                        key={lang}
                                        onClick={() => { 
                                            setTargetLang(lang); 
                                            setUserManuallyChangedLang(true);
                                            setShowLangSelector(false); 
                                        }}
                                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 ${targetLang === lang ? 'text-emerald-600 font-bold bg-emerald-50' : ''}`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white space-y-3 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-gray-100">
                        {messages.length === 0 && (
                             <div className="text-center text-gray-400 text-xs mt-10">
                                 <p>Start a conversation with {userRole === 'user' ? `the ${label.toLowerCase()}` : `Guest Room ${roomNumber}`}.</p>
                             </div>
                        )}
                        {messages.map(msg => {
                            const isMe = msg.role === userRole;
                            // Display translation if: it's not me, target lang is selected, and translation exists
                            const displayText = (!isMe && targetLang !== 'Original' && translatedCache[msg.id]) 
                                ? translatedCache[msg.id] 
                                : msg.text;
                            
                            const isTranslated = !isMe && targetLang !== 'Original' && translatedCache[msg.id];

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-md ${
                                        isMe ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                                    }`}>
                                        <p>{displayText}</p>
                                        
                                        {/* Translation Indicator */}
                                        {isTranslated && (
                                            <div className="flex items-center mt-1 pt-1 border-t border-gray-100/50">
                                                <Languages size={10} className="mr-1 text-emerald-500" />
                                                <span className="text-[9px] text-gray-400 italic">Translated to {targetLang}</span>
                                            </div>
                                        )}

                                        <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                                            {isMe ? 'You' : label}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 flex-shrink-0">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={`Type a message${targetLang !== 'Original' ? ' (Auto-translating for ' + (userRole === 'user' ? 'Staff' : 'Guest') + ')' : ''}...`}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full hover:from-emerald-700 hover:to-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ServiceChat;
