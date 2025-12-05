
import { GoogleGenAI, Modality, Type, LiveServerMessage, Schema } from "@google/genai";
import { RESORT_CENTER } from '../constants';
import { getEvents, getMenu, getPromotions, getKnowledgeBase, getRoomTypes } from "./dataService";
import { ContentTranslation } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY is not set. Please check your .env file.');
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
export const createChatSession = async () => {
  // Construct dynamic knowledge base
  const knowledgeItems = await getKnowledgeBase();
  const eventsList = await getEvents();
  const promosList = await getPromotions();
  
  const knowledge = knowledgeItems.map(k => `Q: ${k.question} A: ${k.answer}`).join('\n');
  const events = eventsList.map(e => `Event: ${e.title} at ${e.time} on ${e.date} (${e.location})`).join('\n');
  const promos = promosList.map(p => `Promo: ${p.title} - ${p.description} (${p.discount})`).join('\n');

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
    if (!text || !targetLanguage || targetLanguage === 'Original') return text;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the following text into ${targetLanguage}. 
            Preserve the original tone (polite, service-oriented). 
            Only output the translated text, no explanations.
            
            Text: "${text}"`,
        });
        return response.text?.trim() || text;
    } catch (e) {
        console.error("Translation Error", e);
        return text; // Fallback to original
    }
};

// --- Batch Translation for CMS Content ---
export const generateTranslations = async (content: Record<string, string>): Promise<ContentTranslation> => {
    try {
        const languages = ['Vietnamese', 'Korean', 'Japanese', 'Chinese', 'Russian'];
        const prompt = `Translate the following content fields into Vietnamese, Korean, Japanese, Chinese, and Russian.
        Return a JSON object where keys are the language names (Vietnamese, Korean, Japanese, Chinese, Russian) and values are objects containing the translated fields.
        
        Source Content: ${JSON.stringify(content)}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Batch Translation Error", e);
        return {};
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
    console.log('TTS: Calling Gemini API with text:', text.substring(0, 50) + '...');
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

    console.log('TTS: Response received', response);
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      console.error('TTS: No audio data in response');
      console.log('TTS: Response structure:', JSON.stringify(response, null, 2));
      return null;
    }
    
    console.log('TTS: Audio data found, length:', base64Audio.length);
    
    // Create a temporary AudioContext just for decoding
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Resume context if suspended (required for autoplay policies)
    if (outputAudioContext.state === 'suspended') {
      console.log('TTS: Resuming suspended AudioContext');
      await outputAudioContext.resume();
    }
    
    // decodeAudioData requires ArrayBuffer
    const decodedBytes = decode(base64Audio);
    console.log('TTS: Decoded bytes length:', decodedBytes.length);
    
    try {
      const audioBuffer = await outputAudioContext.decodeAudioData(decodedBytes.buffer);
      console.log('TTS: Audio buffer decoded successfully, duration:', audioBuffer.duration, 'sampleRate:', audioBuffer.sampleRate);
      
      // Don't close the context here - let the caller handle it
      // The context will be garbage collected or can be closed after playback
      return audioBuffer;
    } catch (decodeError) {
      console.error('TTS: Error decoding audio data', decodeError);
      outputAudioContext.close();
      return null;
    }
  } catch (error) {
    console.error("TTS Error", error);
    if (error instanceof Error) {
      console.error("TTS Error details:", error.message, error.stack);
    }
    return null;
  }
};

// --- Live API ---
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
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: { parts: [{ text: 'You are a helpful resort concierge.' }] }
        }
    });
};

// --- Helpers ---

// Decodes a base64 string into a Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Encodes a Uint8Array into a base64 string
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
