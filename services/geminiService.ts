import {
  GoogleGenAI,
  Modality,
  Type,
  LiveServerMessage,
  Schema,
} from "@google/genai";
import { RESORT_CENTER } from "../constants";
import {
  getEvents,
  getMenu,
  getPromotions,
  getKnowledgeBase,
  getRoomTypes,
} from "./dataService";
import { ContentTranslation } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is not set. Please check your .env file.");
  console.error("AI features will not work without a valid API key.");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// --- Admin AI Helpers ---

// Enhanced function to parse ride requests with full context from database
export const parseRideRequestWithContext = async (
  input: string,
  locations: Array<{ id?: string; name: string; type?: string; lat?: number; lng?: number }>,
  drivers?: Array<{ id?: string; lastName: string; roomNumber: string; currentLat?: number; currentLng?: number; updatedAt?: number }>,
) => {
  const model = "gemini-2.5-flash";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      roomNumber: {
        type: Type.STRING,
        description: "The guest's room number, e.g., '101' or 'Villa D03'",
      },
      pickup: {
        type: Type.STRING,
        description:
          "The pickup location name. Must match exactly one of the valid location names provided in context.",
      },
      destination: {
        type: Type.STRING,
        description: "The destination location name. Must match exactly one of the valid location names provided in context.",
      },
      guestName: { type: Type.STRING, description: "The name of the guest." },
      guestCount: {
        type: Type.NUMBER,
        description: "The number of guests, default to 1 if not mentioned.",
      },
      notes: {
        type: Type.STRING,
        description:
          "Any special notes or requests, like 'has luggage', 'needs baby seat', 'urgent', or 'has many bags'.",
      },
    },
    required: ["pickup", "destination"],
  };

  // Build detailed location context
  const locationContext = locations.map((loc, index) => {
    let info = `${index + 1}. "${loc.name}"`;
    if (loc.type) info += ` (Type: ${loc.type})`;
    return info;
  }).join("\n");

  // Build driver context if available
  let driverContext = "";
  if (drivers && drivers.length > 0) {
    const onlineDrivers = drivers.filter(d => d.currentLat && d.currentLng);
    driverContext = `\n\nAvailable Drivers (${onlineDrivers.length} online):\n${onlineDrivers.map((d, idx) => 
      `${idx + 1}. ${d.lastName} (ID: ${d.id}, Status: Online)`
    ).join("\n")}`;
  }

  const prompt = `You are an intelligent assistant for Furama Resort & Villas Da Nang. Extract ride request information from this Vietnamese or English text: "${input}"

VALID LOCATIONS (you MUST match locations exactly to these names):
${locationContext}

${driverContext ? driverContext : ""}

INSTRUCTIONS:
1. Room Number: Extract room number if mentioned (e.g., "101", "D03", "Villa D5")
2. Pickup Location: 
   - If not specified, use the room number as pickup location
   - Match location names EXACTLY from the valid locations list above
   - Use smart matching for common terms:
     * "pool" or "hồ bơi" → match "Lagoon Pool" or "Ocean Pool" based on context
     * "restaurant" or "nhà hàng" → match restaurant names (ACC, Cafe Indochine, Don Cipriani's, etc.)
     * "villa" or "biệt thự" → match villa areas (D1-D7, Villas, etc.)
     * "lobby" or "sảnh" → match reception/lobby areas
     * "beach" or "bãi biển" → match beach access points
   - If multiple matches possible, choose the most common/popular one
3. Destination Location: Same rules as pickup, but must be different from pickup
4. Guest Name: Extract if mentioned
5. Guest Count: Default to 1 if not specified
6. Notes: Extract special requests (luggage, baby seat, urgent, etc.)

Return JSON with exact location names matching the valid locations list.`;

  if (!ai) {
    console.error("Gemini AI is not initialized. Please check VITE_GEMINI_API_KEY in .env file.");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    
    // Validate and fix location names if needed
    const locationNames = locations.map(loc => loc.name);
    if (parsed.pickup && !locationNames.includes(parsed.pickup)) {
      // Try to find closest match
      const closestPickup = findClosestLocation(parsed.pickup, locations);
      if (closestPickup) parsed.pickup = closestPickup.name;
    }
    if (parsed.destination && !locationNames.includes(parsed.destination)) {
      // Try to find closest match
      const closestDest = findClosestLocation(parsed.destination, locations);
      if (closestDest) parsed.destination = closestDest.name;
    }

    return parsed;
  } catch (e) {
    console.error("AI Parse Error (Ride Request)", e);
    return null;
  }
};

// Helper function to find closest location match
function findClosestLocation(
  searchTerm: string,
  locations: Array<{ id?: string; name: string; type?: string }>
): { id?: string; name: string; type?: string } | null {
  const lowerSearch = searchTerm.toLowerCase().trim();
  
  // Exact match (case insensitive)
  let match = locations.find(loc => loc.name.toLowerCase() === lowerSearch);
  if (match) return match;
  
  // Contains match (search term contains location name or vice versa)
  match = locations.find(loc => {
    const lowerLoc = loc.name.toLowerCase();
    return lowerLoc.includes(lowerSearch) || lowerSearch.includes(lowerLoc);
  });
  if (match) return match;
  
  // Fuzzy matching for common terms - check location types first
  const typeMatch = lowerSearch.match(/(pool|hồ bơi|restaurant|nhà hàng|villa|biệt thự|lobby|sảnh|beach|bãi biển)/i);
  if (typeMatch) {
    const term = typeMatch[1].toLowerCase();
    
    // Pool matches
    if (term === "pool" || term === "hồ bơi") {
      const poolLocs = locations.filter(loc => 
        loc.type === "FACILITY" && loc.name.toLowerCase().includes("pool")
      );
      if (poolLocs.length > 0) return poolLocs[0]; // Return first pool
    }
    
    // Restaurant matches
    if (term === "restaurant" || term === "nhà hàng") {
      const restaurantLocs = locations.filter(loc => loc.type === "RESTAURANT");
      if (restaurantLocs.length > 0) return restaurantLocs[0]; // Return first restaurant
    }
    
    // Villa matches
    if (term === "villa" || term === "biệt thự") {
      const villaLocs = locations.filter(loc => 
        loc.type === "VILLA" || /^[D\d]/.test(loc.name)
      );
      if (villaLocs.length > 0) return villaLocs[0];
    }
    
    // Lobby/Reception matches
    if (term === "lobby" || term === "sảnh") {
      match = locations.find(loc => 
        loc.name.toLowerCase().includes("reception") || 
        loc.name.toLowerCase().includes("lobby")
      );
      if (match) return match;
    }
  }
  
  // Partial word match (e.g., "lagoon" matches "Lagoon Pool")
  match = locations.find(loc => {
    const words = lowerSearch.split(/\s+/);
    return words.some(word => 
      word.length > 2 && loc.name.toLowerCase().includes(word)
    );
  });
  if (match) return match;
  
  return null;
}

// Parses natural language input into structured JSON for Admin forms
export const parseAdminInput = async (
  input: string,
  type:
    | "MENU_ITEM"
    | "LOCATION"
    | "RESORT_EVENT"
    | "PROMOTION"
    | "KNOWLEDGE_ITEM"
    | "ROOM_INVENTORY"
    | "RIDE_REQUEST",
  context?: string,
) => {
  const model = "gemini-2.5-flash";

  let schema: Schema;

  if (type === "MENU_ITEM") {
    schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        price: { type: Type.NUMBER },
        category: {
          type: Type.STRING,
          description: "Must be 'Dining' or 'Spa'",
        },
        description: { type: Type.STRING },
      },
      required: ["name", "price", "category"],
    };
  } else if (type === "RESORT_EVENT") {
    schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        date: { type: Type.STRING, description: "YYYY-MM-DD format" },
        time: { type: Type.STRING, description: "HH:mm format" },
        location: { type: Type.STRING },
        description: { type: Type.STRING },
      },
      required: ["title", "date", "location"],
    };
  } else if (type === "PROMOTION") {
    schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        discount: { type: Type.STRING, description: "e.g. '50% OFF' or '$10'" },
        validUntil: {
          type: Type.STRING,
          description: "e.g. 'Nov 30' or 'Daily 5pm'",
        },
      },
      required: ["title", "description"],
    };
  } else if (type === "KNOWLEDGE_ITEM") {
    schema = {
      type: Type.OBJECT,
      properties: {
        question: {
          type: Type.STRING,
          description: "The topic or user question",
        },
        answer: { type: Type.STRING, description: "The factual answer" },
      },
      required: ["question", "answer"],
    };
  } else if (type === "ROOM_INVENTORY") {
    schema = {
      type: Type.OBJECT,
      properties: {
        number: {
          type: Type.STRING,
          description: "The room number (e.g. 101)",
        },
        typeName: {
          type: Type.STRING,
          description: "The name of the Room Type (e.g. Ocean Suite)",
        },
      },
      required: ["number", "typeName"],
    };
  } else if (type === "RIDE_REQUEST") {
    schema = {
      type: Type.OBJECT,
      properties: {
        roomNumber: {
          type: Type.STRING,
          description: "The guest's room number, e.g., '101' or 'Villa D03'",
        },
        pickup: {
          type: Type.STRING,
          description:
            "The pickup location name. Must match exactly one of the valid location names provided in context. If not specified, assume it's the guest's room number.",
        },
        destination: {
          type: Type.STRING,
          description: "The destination location name. Must match exactly one of the valid location names provided in context.",
        },
        guestName: { type: Type.STRING, description: "The name of the guest." },
        guestCount: {
          type: Type.NUMBER,
          description: "The number of guests, default to 1 if not mentioned.",
        },
        notes: {
          type: Type.STRING,
          description:
            "Any special notes or requests, like 'has luggage', 'needs baby seat', 'urgent', or 'has many bags'.",
        },
      },
      required: ["pickup", "destination"],
    };
  } else {
    schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        lat: { type: Type.NUMBER },
        lng: { type: Type.NUMBER },
        type: { type: Type.STRING, enum: ["VILLA", "FACILITY", "RESTAURANT"] },
      },
      required: ["name", "lat", "lng"],
    };
  }

  const prompt = `Extract the following information from this text: "${input}".
                  ${context ? `Use this context: ${context}.` : ""}
                  For Ride Requests: 
                    - If pickup is not mentioned, use the room number as the pickup location.
                    - Default guestCount to 1 if not specified.
                    - Match location names exactly to the provided valid locations list. Use fuzzy matching for common variations (e.g., "pool" should match "Lagoon Pool" or "Ocean Pool", "restaurant" should match restaurant names).
                    - For locations, be smart about synonyms: "pool" = any pool location, "restaurant" = any restaurant, "villa" = villa areas, "lobby" = reception/lobby areas, "beach" = beach access points.
                  For locations, if coordinates aren't provided, estimate them based on typical Da Nang beach resort coordinates near 16.04, 108.25.
                  For events, assume current year is 2024 if not specified.
                  For Menu Items, strictly categorize as 'Dining' or 'Spa' based on context.
                  For Room Inventory, match Room Type names closely.`;

  if (!ai) {
    console.error("Gemini AI is not initialized. Please check VITE_GEMINI_API_KEY in .env file.");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("AI Parse Error", e);
    return null;
  }
};

// --- Text Chat (Gemini 2.5 Flash) ---
export const createChatSession = async () => {
  // Check API key
  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment variables.",
    );
  }

  try {
    // Construct dynamic knowledge base
    const knowledgeItems = await getKnowledgeBase();
    const eventsList = await getEvents();
    const promosList = await getPromotions();

    const knowledge = knowledgeItems
      .map((k) => `Q: ${k.question} A: ${k.answer}`)
      .join("\n");
    const events = eventsList
      .map((e) => `Event: ${e.title} at ${e.time} on ${e.date} (${e.location})`)
      .join("\n");
    const promos = promosList
      .map((p) => `Promo: ${p.title} - ${p.description} (${p.discount})`)
      .join("\n");

    if (!ai) {
      throw new Error(
        "Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment variables.",
      );
    }

    return await ai.chats.create({
      model: "gemini-2.5-flash",
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
  } catch (error: any) {
    console.error("Error creating chat session:", error);
    // Provide more helpful error messages
    if (
      error?.message?.includes("API key") ||
      error?.status === 401 ||
      error?.status === 403
    ) {
      throw new Error(
        "Invalid or missing Gemini API key. Please check your configuration.",
      );
    }
    if (error?.message?.includes("quota") || error?.status === 429) {
      throw new Error("API quota exceeded. Please try again later.");
    }
    throw error;
  }
};

// --- Translation Service (Gemini 2.5 Flash) ---
export const translateText = async (
  text: string,
  targetLanguage: string,
): Promise<string> => {
  if (!text || !targetLanguage || targetLanguage === "Original") return text;

  if (!ai) {
    console.error("Gemini AI is not initialized. Returning original text.");
    return text;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
export const generateTranslations = async (
  content: Record<string, string>,
): Promise<ContentTranslation> => {
  if (!ai) {
    console.error("Gemini AI is not initialized. Returning empty translations.");
    return {};
  }

  try {
    const languages = [
      "Vietnamese",
      "Korean",
      "Japanese",
      "Chinese",
      "Russian",
    ];
    const prompt = `Translate the following content fields into Vietnamese, Korean, Japanese, Chinese, and Russian.
        Return a JSON object where keys are the language names (Vietnamese, Korean, Japanese, Chinese, Russian) and values are objects containing the translated fields.

        Source Content: ${JSON.stringify(content)}
        `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Batch Translation Error", e);
    return {};
  }
};

// --- Maps Query (Specialized) ---
export const queryResortInfo = async (
  query: string,
  userLocation?: { lat: number; lng: number },
) => {
  const latitude = userLocation?.lat ?? RESORT_CENTER.lat;
  const longitude = userLocation?.lng ?? RESORT_CENTER.lng;

  if (!ai) {
    console.error("Gemini AI is not initialized. Cannot query maps.");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: latitude,
              longitude: longitude,
            },
          },
        },
      },
    });
    return response;
  } catch (error) {
    console.error("Maps query failed", error);
    return null;
  }
};

// --- TTS (Gemini 2.5 Flash TTS) ---
export const speakText = async (text: string): Promise<AudioBuffer | null> => {
  if (!ai) {
    console.error("Gemini AI is not initialized. Cannot generate speech.");
    return null;
  }

  try {
    console.log(
      "TTS: Calling Gemini API with text:",
      text.substring(0, 50) + "...",
    );
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    console.log("TTS: Response received", response);
    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      console.error("TTS: No audio data in response");
      console.log(
        "TTS: Response structure:",
        JSON.stringify(response, null, 2),
      );
      return null;
    }

    console.log("TTS: Audio data found, length:", base64Audio.length);

    // Create a temporary AudioContext just for decoding
    const outputAudioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();

    // Resume context if suspended (required for autoplay policies)
    if (outputAudioContext.state === "suspended") {
      console.log("TTS: Resuming suspended AudioContext");
      await outputAudioContext.resume();
    }

    // decodeAudioData requires ArrayBuffer
    const decodedBytes = decode(base64Audio);
    console.log("TTS: Decoded bytes length:", decodedBytes.length);

    try {
      const audioBuffer = await outputAudioContext.decodeAudioData(
        decodedBytes.buffer,
      );
      console.log(
        "TTS: Audio buffer decoded successfully, duration:",
        audioBuffer.duration,
        "sampleRate:",
        audioBuffer.sampleRate,
      );

      // Don't close the context here - let the caller handle it
      // The context will be garbage collected or can be closed after playback
      return audioBuffer;
    } catch (decodeError) {
      console.error("TTS: Error decoding audio data", decodeError);
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
  onError: (err: any) => void,
) => {
  if (!ai) {
    throw new Error(
      "Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment variables.",
    );
  }
  return ai.live.connect({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    callbacks: {
      onopen: onOpen,
      onmessage: onMessage,
      onclose: onClose,
      onerror: onError,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
      },
      systemInstruction: {
        parts: [{ text: "You are a helpful resort concierge." }],
      },
    },
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
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
