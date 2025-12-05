import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MapPin, Volume2, X, Navigation, ExternalLink } from 'lucide-react';
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
    <a href={url} target="_blank" rel="noreferrer" className="block mt-3 group w-full max-w-sm">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            {/* Visual Abstract Map Pattern */}
            <div className="h-24 bg-slate-50 relative flex items-center justify-center overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                <div className="bg-white p-2 rounded-full shadow-lg z-10 animate-bounce">
                    <MapPin className="text-red-500 w-6 h-6 fill-current" />
                </div>
            </div>
            <div className="p-3 bg-white flex justify-between items-center group-hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-sm text-gray-800 truncate">{title}</h4>
                    <p className="text-xs text-emerald-600 flex items-center mt-0.5 font-medium">
                        <Navigation size={10} className="mr-1 fill-current"/> {t('get_directions')}
                    </p>
                </div>
                <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full transform group-hover:rotate-45 transition-transform duration-300">
                    <Navigation size={16} /> 
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
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="p-4 bg-emerald-900 text-white flex justify-between items-center shadow-md z-10">
        <h2 className="text-xl font-serif">{t('concierge_ai')}</h2>
        <button onClick={onClose}><X /></button>
      </div>

      {mode === 'TEXT' ? (
        <>
           {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-emerald-700 text-white' : 'bg-white text-gray-800 border border-gray-100'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  
                  {/* Grounding Sources (Maps/Search) */}
                  {msg.groundingUrls && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                          {msg.groundingUrls.some(u => u.type !== 'MAP') && (
                              <div className="mb-2">
                                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center">
                                      <ExternalLink className="w-3 h-3 mr-1"/> {t('sources')}
                                  </p>
                                  <ul className="space-y-1">
                                      {msg.groundingUrls.filter(u => u.type !== 'MAP').map((url, i) => (
                                          <li key={i}>
                                              <a href={url.uri} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-start">
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
                        className="mt-2 p-2 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        disabled={isPlayingAudio}
                        title={t('play_audio') || 'Play audio'}
                      >
                         <Volume2 size={16} />
                      </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                   <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                   </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 flex items-center space-x-2">
             <button 
               type="button"
               onClick={toggleLiveMode}
               className="p-3 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
             >
                <Mic size={20} />
             </button>
             <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('ask_placeholder')}
                className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
             />
             <button 
                type="button"
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-3 rounded-full bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
             >
                <Send size={20} />
             </button>
          </div>
        </>
      ) : (
        /* Voice Mode UI */
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 to-emerald-800 text-white p-6">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${isLiveConnected ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-gray-600'}`}>
                <Mic size={48} className="text-white" />
            </div>
            
            <h3 className="text-2xl font-serif mb-2">{t('live_concierge')}</h3>
            <p className="text-emerald-200 mb-8 text-center max-w-xs">
                {isLiveConnected ? t('listening') : t('connecting_voice')}
            </p>

            <button 
                onClick={toggleLiveMode}
                className="px-8 py-3 bg-red-500/20 border border-red-400/50 text-red-100 rounded-full hover:bg-red-500/30 transition flex items-center"
            >
                <X className="mr-2" size={18} /> {t('end_call')}
            </button>
        </div>
      )}
    </div>
  );
};

export default ConciergeChat;