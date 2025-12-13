import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MapPin, Volume2, X, Navigation, ExternalLink, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../types';
import { createChatSession, speakText, connectLiveSession, encode } from '../services/geminiService';
import { GenerateContentResponse, LiveServerMessage } from '@google/genai';
import { useTranslation } from '../contexts/LanguageContext';
import { apiClient } from '../services/apiClient';

interface ConciergeChatProps {
  onClose: () => void;
}

const ConciergeChat: React.FC<ConciergeChatProps> = ({ onClose }) => {
  const { t } = useTranslation();
  
  // Get roomNumber from localStorage
  const getRoomNumber = (): string | null => {
    const savedUser = localStorage.getItem('furama_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      return parsedUser.roomNumber || null;
    }
    return null;
  };

  // Helper to save message to database
  const saveMessageToDB = async (role: 'user' | 'model', text: string) => {
    const roomNumber = getRoomNumber();
    if (!roomNumber) {
      console.warn('No room number found, skipping database save');
      return;
    }

    try {
      // Get user ID if available
      const savedUser = localStorage.getItem('furama_user');
      let userId: number | undefined;
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        userId = parsedUser.id ? parseInt(parsedUser.id) : undefined;
      }

      await apiClient.post('/chat-messages', {
        role: role === 'user' ? 'user' : 'model',
        text,
        user_id: userId || null,
        room_number: roomNumber,
        service_type: 'CONCIERGE' // Mark as concierge chat
      });
    } catch (error) {
      console.error('Failed to save message to database:', error);
      // Don't throw - allow chat to continue even if DB save fails
    }
  };

  // Helper to load messages from database
  const loadMessagesFromDB = async (): Promise<ChatMessage[]> => {
    const roomNumber = getRoomNumber();
    if (!roomNumber) {
      return [];
    }

    try {
      const dbMessages = await apiClient.get<any[]>(`/chat-messages/room/${roomNumber}?service_type=CONCIERGE`);
      
      // Map database format to frontend format
      return dbMessages.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role === 'model' ? 'model' : 'user',
        text: msg.text
      }));
    } catch (error) {
      console.error('Failed to load messages from database:', error);
      return [];
    }
  };
  
  const MapCard: React.FC<{ url: string; title: string }> = ({ url, title }) => (
    <a href={url} target="_blank" rel="noreferrer" className="block mt-2 group w-full max-w-sm">
        <div className="bg-white/95 backdrop-blur-sm border-2 border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
            {/* Visual Abstract Map Pattern */}
            <div className="h-20 bg-gradient-to-br from-blue-50 to-cyan-50 relative flex items-center justify-center overflow-hidden bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-100/30 to-transparent"></div>
                <div className="bg-white p-2 rounded-xl shadow-lg z-10 border-2 border-blue-200">
                    <MapPin className="text-red-500 w-5 h-5 fill-current" />
                </div>
            </div>
            <div className="p-3 bg-white flex justify-between items-center group-hover:bg-emerald-50/50 transition-colors">
                <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-sm text-gray-800 truncate">{title}</h4>
                    <p className="text-xs text-emerald-600 flex items-center mt-1 font-semibold">
                        <Navigation size={10} className="mr-1 fill-current"/> {t('get_directions')}
                    </p>
                </div>
                <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg border border-emerald-200 group-hover:bg-emerald-200 transition-all duration-300">
                    <Navigation size={16} strokeWidth={2.5} /> 
                </div>
            </div>
        </div>
    </a>
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Chat Session Refs
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live API Refs
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const liveSessionPromise = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    // Load messages from database
    const loadMessages = async () => {
      const dbMessages = await loadMessagesFromDB();
      if (dbMessages.length > 0) {
        // If we have saved messages, use them
        setMessages(dbMessages);
      } else {
        // Otherwise, show welcome message
        const welcomeMsg: ChatMessage = {
          id: 'welcome',
          role: 'model',
          text: t('concierge_welcome')
        };
        setMessages([welcomeMsg]);
        // Save welcome message to database
        await saveMessageToDB('model', welcomeMsg.text);
      }
    };

    loadMessages();

    // Initialize text chat session
    createChatSession().then(session => {
      chatSessionRef.current = session;
    }).catch(error => {
      console.error('Failed to create chat session:', error);
    });

    return () => {
       // Cleanup Live API if active
       if (liveSessionPromise.current) {
         liveSessionPromise.current.then(session => session.close());
       }
       if (audioContextRef.current) {
         audioContextRef.current.close();
       }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    // Ensure chat session is initialized
    if (!chatSessionRef.current) {
      console.warn('Chat session not ready yet');
      return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    
    // Save user message to database
    await saveMessageToDB('user', userMsg.text);
    
    setInput('');
    setIsLoading(true);

    try {
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const responseText = result.text;
      
      // Extract grounding metadata if available (for Maps)
      let groundingUrls: Array<{uri: string, title: string, type?: 'WEB' | 'MAP'}> = [];
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
          chunks.forEach((chunk: any) => {
              if (chunk.web?.uri) {
                  groundingUrls.push({ 
                    uri: chunk.web.uri, 
                    title: chunk.web.title || "Web Source", 
                    type: 'WEB' 
                  });
              }
              if (chunk.maps?.uri) { 
                  groundingUrls.push({ 
                    uri: chunk.maps.uri, 
                    title: chunk.maps.title || "Map Location", 
                    type: 'MAP' 
                  });
              }
          });
      }

      const modelMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: responseText || t('sorry_couldnt_process'),
        groundingUrls: groundingUrls.length > 0 ? groundingUrls : undefined
      };

      setMessages(prev => [...prev, modelMsg]);
      
      // Save model response to database
      await saveMessageToDB('model', modelMsg.text);

    } catch (error) {
      console.error("Chat Error", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: t('connection_error')
      };
      setMessages(prev => [...prev, errorMsg]);
      
      // Save error message to database
      await saveMessageToDB('model', errorMsg.text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTTS = async (text: string) => {
      if (isPlayingAudio) {
        console.log('TTS: Already playing audio');
        return;
      }
      if (!text || text.trim().length === 0) {
        console.warn('TTS: Empty text provided');
        return;
      }
      
      setIsPlayingAudio(true);
      try {
        console.log('TTS: Requesting audio for text:', text.substring(0, 50) + '...');
        const audioBuffer = await speakText(text);
        
        if (!audioBuffer) {
          console.error('TTS: No audio buffer returned');
          setIsPlayingAudio(false);
          return;
        }
        
        console.log('TTS: Audio buffer received, duration:', audioBuffer.duration, 'sampleRate:', audioBuffer.sampleRate);
        
        // Create AudioContext for playback
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume context if suspended (required for autoplay policies in browsers)
        if (ctx.state === 'suspended') {
          console.log('TTS: Resuming suspended playback AudioContext');
          await ctx.resume();
          console.log('TTS: AudioContext state after resume:', ctx.state);
        }
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        source.onended = () => {
          console.log('TTS: Audio playback ended');
          setIsPlayingAudio(false);
          // Close context after a short delay to ensure cleanup
          setTimeout(() => {
            if (ctx.state !== 'closed') {
              ctx.close().catch(err => console.warn('TTS: Error closing AudioContext', err));
            }
          }, 100);
        };
        
        source.onerror = (error) => {
          console.error('TTS: Audio playback error', error);
          setIsPlayingAudio(false);
          ctx.close().catch(err => console.warn('TTS: Error closing AudioContext on error', err));
        };
        
        console.log('TTS: Starting audio playback, AudioContext state:', ctx.state);
        source.start(0);
      } catch (error) {
        console.error('TTS: Error in handleTTS', error);
        setIsPlayingAudio(false);
      }
  };

  const toggleLiveMode = async () => {
    if (mode === 'TEXT') {
        setMode('VOICE');
        startLiveSession();
    } else {
        setMode('TEXT');
        stopLiveSession();
    }
  };

  const startLiveSession = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
        
        // Output context for playing audio
        const outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        nextStartTimeRef.current = 0;

        liveSessionPromise.current = connectLiveSession(
            () => {
                setIsLiveConnected(true);
                // Setup Input Stream
                if (!audioContextRef.current) return;
                inputSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                
                processorRef.current.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    // Convert Float32 to Int16 PCM
                    const l = inputData.length;
                    const int16 = new Int16Array(l);
                    for (let i = 0; i < l; i++) {
                        int16[i] = inputData[i] * 32768;
                    }
                    const base64Data = encode(new Uint8Array(int16.buffer));
                    
                    if (liveSessionPromise.current) {
                        liveSessionPromise.current.then(session => {
                            session.sendRealtimeInput({
                                media: {
                                    mimeType: 'audio/pcm;rate=16000',
                                    data: base64Data
                                }
                            });
                        });
                    }
                };

                inputSourceRef.current.connect(processorRef.current);
                processorRef.current.connect(audioContextRef.current.destination);
            },
            async (msg: LiveServerMessage) => {
                // Handle Audio Output
                const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio) {
                    const binaryString = atob(base64Audio);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                    
                    const dataInt16 = new Int16Array(bytes.buffer);
                    const buffer = outputContext.createBuffer(1, dataInt16.length, 24000);
                    const channelData = buffer.getChannelData(0);
                    for (let i = 0; i < dataInt16.length; i++) {
                        channelData[i] = dataInt16[i] / 32768.0;
                    }

                    const source = outputContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(outputContext.destination);
                    
                    const now = outputContext.currentTime;
                    // Ensure smooth playback
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += buffer.duration;
                }
            },
            () => { setIsLiveConnected(false); },
            (err) => { console.error("Live Error", err); setIsLiveConnected(false); }
        );

    } catch (err) {
        console.error("Failed to start live session", err);
        setMode('TEXT');
    }
  };

  const stopLiveSession = () => {
    if (liveSessionPromise.current) {
        liveSessionPromise.current.then(session => session.close());
        liveSessionPromise.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    setIsLiveConnected(false);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20 relative">
      {/* Header - Modern Design */}
      <div className="p-3 text-white shadow-lg backdrop-blur-md bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 flex justify-between items-center z-10 border-b border-white/20"
        style={{
          boxShadow: '0 4px 20px -5px rgba(0,0,0,0.2)'
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{t('concierge_ai')}</h2>
            <p className="text-[10px] text-white/80">AI Assistant</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {mode === 'TEXT' ? (
        <>
           {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-transparent scrollbar-hide">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 shadow-md backdrop-blur-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white' 
                    : 'bg-white/95 text-gray-800 border border-gray-200/60'
                }`}
                style={{
                  boxShadow: msg.role === 'user' 
                    ? '0 4px 20px -5px rgba(16, 185, 129, 0.3)' 
                    : '0 2px 10px -5px rgba(0,0,0,0.1)'
                }}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                  
                  {/* Grounding Sources (Maps/Search) */}
                  {msg.groundingUrls && (
                      <div className="mt-3 pt-3 border-t border-gray-200/60">
                          {msg.groundingUrls.some(u => u.type !== 'MAP') && (
                              <div className="mb-3">
                                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                                      <ExternalLink className="w-3 h-3"/> {t('sources')}
                                  </p>
                                  <ul className="space-y-1.5">
                                      {msg.groundingUrls.filter(u => u.type !== 'MAP').map((url, i) => (
                                          <li key={i}>
                                              <a href={url.uri} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-start font-medium bg-blue-50 px-2 py-1.5 rounded border border-blue-100">
                                                  <span className="truncate">{url.title}</span>
                                              </a>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                          
                          {/* Map Cards */}
                          <div className="space-y-2">
                              {msg.groundingUrls.filter(u => u.type === 'MAP').map((url, i) => (
                                  <MapCard key={i} url={url.uri} title={url.title} />
                              ))}
                          </div>
                      </div>
                  )}

                  {/* TTS Button for Model */}
                  {msg.role === 'model' && (
                      <button 
                        type="button"
                        onClick={() => handleTTS(msg.text)} 
                        className="mt-2 p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-emerald-200"
                        disabled={isPlayingAudio}
                        title={t('play_audio') || 'Play audio'}
                      >
                         <Volume2 size={16} strokeWidth={2.5} />
                      </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                   <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-md border border-gray-200/60 flex space-x-1.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                   </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Modern Design */}
          <div className="p-3 backdrop-blur-xl bg-white/95 border-t-2 border-gray-200/60 flex items-center space-x-2 safe-area-bottom"
            style={{
              boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.1)',
              paddingBottom: 'max(0.75rem, calc(0.75rem + env(safe-area-inset-bottom)))'
            }}
          >
             <button 
               type="button"
               onClick={toggleLiveMode}
               className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer border border-emerald-200"
             >
                <Mic size={18} strokeWidth={2.5} />
             </button>
             <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('ask_placeholder')}
                className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-gray-900 text-sm border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all placeholder:text-gray-400"
             />
             <button 
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg disabled:shadow-none"
             >
                <Send size={18} strokeWidth={2.5} />
             </button>
          </div>
        </>
      ) : (
        /* Voice Mode UI - Modern Design */
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]"></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
                <div className={`w-28 h-28 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 shadow-2xl ${
                    isLiveConnected 
                        ? 'bg-white text-emerald-600 shadow-emerald-300/50 animate-pulse' 
                        : 'bg-white/20 backdrop-blur-sm border-2 border-white/30'
                }`}>
                    <Mic size={40} className={isLiveConnected ? 'text-emerald-600' : 'text-white'} strokeWidth={2.5} />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{t('live_concierge')}</h3>
                <p className="text-white/90 mb-8 text-center max-w-xs text-sm">
                    {isLiveConnected ? t('listening') : t('connecting_voice')}
                </p>

                <button 
                    onClick={toggleLiveMode}
                    className="px-6 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 font-semibold shadow-lg"
                >
                    <X size={18} strokeWidth={2.5} /> {t('end_call')}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ConciergeChat;