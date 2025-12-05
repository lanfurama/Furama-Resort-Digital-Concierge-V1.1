
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, User, Shield, Globe, Languages } from 'lucide-react';
import { ChatMessage } from '../types';
import { getServiceMessages, sendServiceMessage } from '../services/dataService';
import { translateText } from '../services/geminiService';

interface ServiceChatProps {
    serviceType: string;
    roomNumber: string;
    label?: string; // e.g. "Driver" or "Kitchen"
    autoOpen?: boolean;
    userRole?: 'user' | 'staff'; // Determines who is 'Me' and who is 'Other'
    onClose?: () => void;
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
    onClose
}) => {
    const [isOpen, setIsOpen] = useState(autoOpen);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Translation State
    const [targetLang, setTargetLang] = useState('Original');
    const [showLangSelector, setShowLangSelector] = useState(false);
    const [translatedCache, setTranslatedCache] = useState<Record<string, string>>({});

    // Poll for new messages (simulating real-time)
    useEffect(() => {
        const fetch = async () => {
            try {
                const msgs = await getServiceMessages(roomNumber, serviceType);
            // Simple check to avoid tight loops if object ref changes but content is same
                if (msgs.length !== messages.length || JSON.stringify(msgs) !== JSON.stringify(messages)) {
                setMessages(msgs);
                }
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            }
        };

        fetch();
        const interval = setInterval(fetch, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [roomNumber, serviceType]);

    // Handle Auto-Translation when messages change or target language changes
    useEffect(() => {
        const translateIncoming = async () => {
            if (targetLang === 'Original') return;

            // Find messages that need translation (from the other person and not in cache)
            const msgsToTranslate = messages.filter(msg => 
                msg.role !== userRole && // Only translate other person's messages
                !translatedCache[msg.id] // Not yet translated
            );

            if (msgsToTranslate.length === 0) return;

            const newTranslations: Record<string, string> = {};
            
            await Promise.all(msgsToTranslate.map(async (msg) => {
                const translated = await translateText(msg.text, targetLang);
                if (translated) {
                    newTranslations[msg.id] = translated;
                }
            }));

            setTranslatedCache(prev => ({ ...prev, ...newTranslations }));
        };

        translateIncoming();
    }, [messages, targetLang, userRole, translatedCache]);

    // Auto-scroll
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

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

    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    const toggleOpen = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (!newState && onClose) onClose();
    }

    return (
        <div className="fixed bottom-24 right-4 md:right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white w-80 h-96 rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-emerald-900 text-white p-3 flex justify-between items-center shadow-md relative">
                        <div className="flex items-center space-x-2">
                             <div className="p-1.5 bg-white/10 rounded-full">
                                {userRole === 'user' ? <Shield size={16} /> : <User size={16} />}
                             </div>
                             <div>
                                 <h3 className="font-bold text-sm">Chat with {label}</h3>
                                 <p className="text-[10px] opacity-70 flex items-center"><span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span> Online</p>
                             </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                            {/* Language Selector Toggle */}
                            <button 
                                onClick={() => setShowLangSelector(!showLangSelector)}
                                className={`p-1.5 rounded-full hover:bg-white/10 transition ${targetLang !== 'Original' ? 'text-amber-300' : 'text-white'}`}
                                title="Translate Chat"
                            >
                                <Globe size={16} />
                            </button>
                            <button onClick={handleClose} className="hover:text-emerald-300 p-1"><X size={18}/></button>
                        </div>

                        {/* Language Dropdown */}
                        {showLangSelector && (
                            <div className="absolute top-12 right-2 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-100 py-2 w-32 z-50 animate-in fade-in zoom-in-95">
                                <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase">Translate to</p>
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <button 
                                        key={lang}
                                        onClick={() => { setTargetLang(lang); setShowLangSelector(false); }}
                                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 ${targetLang === lang ? 'text-emerald-600 font-bold bg-emerald-50' : ''}`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-3">
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
                                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                        isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
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
                                            {isMe ? 'You' : (userRole === 'user' ? label : 'Guest')}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={`Type a message${targetLang !== 'Original' ? ' (Auto-translating for ' + (userRole === 'user' ? 'Staff' : 'Guest') + ')' : ''}...`}
                            className="flex-1 bg-gray-100 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle Button (Only show if not auto-open or if role is user to avoid clutter on staff screen) */}
            {!autoOpen && (
                <button 
                    onClick={toggleOpen}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95 pointer-events-auto flex items-center justify-center"
                    style={{ marginBottom: '0' }}
                >
                    {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
                </button>
            )}
        </div>
    );
};

export default ServiceChat;
