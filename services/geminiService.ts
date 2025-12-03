
import { GoogleGenAI, Modality, Type, LiveServerMessage, Schema } from "@google/genai";
import { RESORT_CENTER } from '../constants';
import { getEvents, getMenu, getPromotions, getKnowledgeBase, getRoomTypes } from "./dataService";

// Get API key from Vite environment variables (prefixed with VITE_)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn('GEMINI_API_KEY is not set. Please set VITE_GEMINI_API_KEY in your environment variables.');
}
const ai = new GoogleGenAI({ apiKey });

// --- Admin AI Helpers ---

// Parses natural language input into structured JSON for Admin forms
export const parseAdminInput = async (input: string, type: 'MENU_ITEM' | 'LOCATION' | 'RESORT_EVENT' | 'PROMOTION' | 'KNOWLEDGE_ITEM' | 'ROOM_INVENTORY') => {
  const model = 'gemini-2.5-flash';
  
  let schema: Schema;
  
  if (type === 'MENU_ITEM') {
    schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        price: { type: Type.NUMBER },
        category: { type: Type.STRING, description: "Must be 'Dining' or 'Spa'" },
        description: { type: Type.STRING },
      },
      required: ['name', 'price', 'category'],
    };
  } else if (type === 'RESORT_EVENT') {
    schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        date: { type: Type.STRING, description: "YYYY-MM-DD format" },
        time: { type: Type.STRING, description: "HH:mm format" },
        location: { type: Type.STRING },
        description: { type: Type.STRING }
      },
      required: ['title', 'date', 'location'],
    };
  } else if (type === 'PROMOTION') {
    schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            discount: { type: Type.STRING, description: "e.g. '50% OFF' or '$10'" },
            validUntil: { type: Type.STRING, description: "e.g. 'Nov 30' or 'Daily 5pm'" }
        },
        required: ['title', 'description']
    };
  } else if (type === 'KNOWLEDGE_ITEM') {
      schema = {
          type: Type.OBJECT,
          properties: {
              question: { type: Type.STRING, description: "The topic or user question" },
              answer: { type: Type.STRING, description: "The factual answer" }
          },
          required: ['question', 'answer']
      };
  } else if (type === 'ROOM_INVENTORY') {
      schema = {
          type: Type.OBJECT,
          properties: {
              number: { type: Type.STRING, description: "The room number (e.g. 101)" },
              typeName: { type: Type.STRING, description: "The name of the Room Type (e.g. Ocean Suite)" }
          },
          required: ['number', 'typeName']
      };
  } else {
    schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        lat: { type: Type.NUMBER },
        lng: { type: Type.NUMBER },
        type: { type: Type.STRING, enum: ['VILLA', 'FACILITY', 'RESTAURANT'] }
      },
      required: ['name', 'lat', 'lng'],
    };
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Extract the following information from this text: "${input}". 
                 For locations, if coordinates aren't provided, estimate them based on typical Da Nang beach resort coordinates near 16.04, 108.25.
                 For events, assume current year is 2024 if not specified.
                 For Menu Items, strictly categorize as 'Dining' or 'Spa' based on context.
                 For Room Inventory, match Room Type names closely.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("AI Parse Error", e);
    return null;
  }
};

// --- Text Chat (Gemini 2.5 Flash) ---
export const createChatSession = () => {
  // Construct dynamic knowledge base
  const knowledge = getKnowledgeBase().map(k => `Q: ${k.question} A: ${k.answer}`).join('\n');
  const events = getEvents().map(e => `Event: ${e.title} at ${e.time} on ${e.date} (${e.location})`).join('\n');
  const promos = getPromotions().map(p => `Promo: ${p.title} - ${p.description} (${p.discount})`).join('\n');

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are the virtual concierge for Furama Resort & Villas Da Nang. 
      Your tone is polite, luxurious, and helpful. 
      Assist guests with booking buggies, finding restaurants, and general information.
      
      Here is the current Resort Knowledge Base (Answer these exactly):
      ${knowledge}

      Current Resort Events:
      ${events}

      Active Promotions:
      ${promos}

      The resort is located in Da Nang, Vietnam.
      Keep answers concise and suitable for a mobile screen.`,
      tools: [{ googleMaps: {} }], // Enable Maps grounding
    },
  });
};

// --- Translation Service (Gemini 2.5 Flash) ---
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    if (!text || !targetLanguage) return text;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the following text into ${targetLanguage}. 
            Preserve the original tone (polite, service-oriented). 
            Only output the translated text, no explanations.
            
            Text: "${text}"`,
        });
        return response.text || text;
    } catch (e) {
        console.error("Translation Error", e);
        return text; // Fallback to original
    }
};

// --- Maps Query (Specialized) ---
export const queryResortInfo = async (query: string, userLocation?: {lat: number, lng: number}) => {
  const latitude = userLocation?.lat ?? RESORT_CENTER.lat;
  const longitude = userLocation?.lng ?? RESORT_CENTER.lng;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: latitude,
              longitude: longitude
            }
          }
        }
      }
    });
    return response;
  } catch (error) {
    console.error("Maps query failed", error);
    return null;
  }
};

// --- TTS (Gemini 2.5 Flash TTS) ---
export const speakText = async (text: string): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        audioContext,
        24000,
        1
    );
    await audioContext.close();
    return audioBuffer;

  } catch (e) {
    console.error("TTS Error", e);
    return null;
  }
};

// --- Live API Helpers ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const connectLiveSession = async (
    onOpen: () => void,
    onMessage: (msg: LiveServerMessage) => void,
    onClose: () => void,
    onError: (err: any) => void
) => {
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: onOpen,
            onmessage: onMessage,
            onclose: onClose,
            onerror: onError
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: "You are a helpful, real-time voice concierge for Furama Resort. Keep responses brief and conversational.",
        }
    });
};
