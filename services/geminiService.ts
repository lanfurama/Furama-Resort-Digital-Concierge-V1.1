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

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env ? process.env.VITE_GEMINI_API_KEY : undefined);
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

  // Build detailed location context as JSON Array for stricter parsing
  const locationContext = JSON.stringify(locations.map(l => l.name), null, 2);

  // Build driver context if available
  let driverContext = "";
  if (drivers && drivers.length > 0) {
    const onlineDrivers = drivers.filter(d => d.currentLat && d.currentLng);
    driverContext = `\n\nAvailable Drivers (${onlineDrivers.length} online):\n${onlineDrivers.map((d, idx) =>
      `${idx + 1}. ${d.lastName} (ID: ${d.id}, Status: Online)`
    ).join("\n")}`;
  }

  const prompt = `You are an intelligent assistant for Furama Resort & Villas Da Nang. Strictly extract ride request information from this VIETNAMESE text: "${input}"

VALID LOCATIONS (you MUST match locations exactly to these names - case-sensitive matching):
${locationContext}

${driverContext ? driverContext : ""}

CRITICAL EXTRACTION RULES (follow these precisely for >95% accuracy):

1. ROOM NUMBER EXTRACTION (>95% accuracy required):
   - Extract room number if mentioned in ANY format:
     * "Room 101", "Phòng 101", "R101" → "101"
     * "Villa D03", "Biệt thự D5", "Villa D11" → "D03", "D5", "D11"
     * "D03", "D11", "P03" → "D03", "D11", "P03"
     * "ACC", "ABC" (2-3 letters) → "ACC", "ABC"
      * "101", "2001", "101A" → "101", "2001", "101A"
     * PHONETIC NUMBERS (Vietnamese style):
       - "một linh một" -> "101"
       - "hai không năm" / "hai lẻ năm" -> "205" ("lẻ" = 0)
       - "một một hai" -> "112"
       - "ba lẻ năm" -> "305" ("lẻ" = 0)
   - Common patterns: [Letter][Digits] (D11, A101), [Digits] (101, 2001), [2-3 Letters] (ACC)
   - If room number is in pickup text, extract it separately
   - Room numbers are typically: 2-4 digits, or 1 letter + 1-3 digits, or 2-3 letters

2. PICKUP LOCATION MATCHING (>90% accuracy required):
   - Match location names EXACTLY from the valid locations list above
   - If pickup is NOT specified, use the extracted room number as pickup location
   - Keywords indicating PICKUP: "từ", "ở", "tại", "đón", "pickup", "from", "lấy".
   - Smart matching for common terms (use EXACT names from list):
     * "pool" or "hồ bơi", "bể bơi" → prefer "Lagoon Pool" or "Ocean Pool" (check context for which one)
     * "restaurant" or "nhà hàng" or "ăn" or "ăn sáng" → match to specific restaurant: "ACC", "Cafe Indochine", "Don Cipriani's", etc.
     * "villa" or "biệt thự" → match villa areas: "D1", "D2", "D3", "D4", "D5", "D6", "D7", "Villas"
     * "lobby" or "sảnh" or "reception" or "lễ tân" → match "Reception" or "Main Lobby"
     * "beach" or "bãi biển" or "biển" or "ra biển" → match "Beach Access" or "Beach"
     * SHORT NAMES: If user says "B11" and list has "Villa B11", match to "Villa B11". If "Indochine", match "Cafe Indochine".
   - If multiple matches possible, choose the MOST COMMON/POPULAR one from the list
   - IMPORTANT: Return the EXACT name as it appears in the valid locations list (case-sensitive)

3. DESTINATION LOCATION MATCHING (>90% accuracy required):
   - Same rules as pickup location
   - Keywords indicating DESTINATION: "đến", "tới", "đi", "ra", "về", "to", "go to", "cho".
   - MUST be different from pickup location
   - Match EXACTLY from valid locations list

4. GUEST NAME: Extract if mentioned (optional)

5. GUEST COUNT: Default to 1 if not specified

6. NOTES: Extract special requests (luggage, baby seat, urgent, many bags, etc.)

VALIDATION:
- Room number format: Must match patterns [A-Z]{1,3}\\d{0,3}[A-Z]? or \\d{2,4}[A-Z]? or [A-Z]\\d{1,3}
- Location names: Must be EXACT matches from the valid locations list
- Pickup and destination: Must be different

SPEECH RECOGNITION ERROR HANDLING & PHONETICS:
- Vietnamese STT often mistakes "Đón" (Pick up) for "Yên", "Yến", "Đơn", "Đông". If you see "Yên khách", "Yến khách", interpret as "Đón khách" (Pick up guest).
- "acc" usually refers to "ACC" (Asian Civic Center / Restaurant). Matches to "ACC".
- "lobby" refers to "Reception".
- "về" often means going back to room or lobby.
- "Khách" or "Người" means "Guest". "Năm khách" = "5 guests". Do NOT parse "Khách" or "KH" as a location unless it is in the exact locations list.
- "Nam" or "Năm" usually means "5" (number), especially if followed by "khách". Do NOT parse as location "NAM" unless extracted from "Nam Tram" etc.
- "ACB" often refers to "ACC" (Asian Civic Center).
- "ICP" often refers to "ICP" (International Convention Palace).
- "vi la" / "villa" -> match to valid Villa location.

- "vi la" / "villa" -> match to valid Villa location.


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

    // Post-processing validation and correction for >90% location accuracy
    const locationNames = locations.map(loc => loc.name);

    // Validate and fix pickup location
    if (parsed.pickup) {
      if (!locationNames.includes(parsed.pickup)) {
        // Try to find closest match with improved algorithm
        const closestPickup = findClosestLocation(parsed.pickup, locations);
        if (closestPickup) {
          console.log(`[AI Parse] Fixed pickup: "${parsed.pickup}" → "${closestPickup.name}"`);
          parsed.pickup = closestPickup.name;
        } else {
          console.warn(`[AI Parse] Could not match pickup location: "${parsed.pickup}" strictly.Clearing.`);
          parsed.pickup = null;
        }
      }
    }

    // Validate and fix destination location
    if (parsed.destination) {
      if (!locationNames.includes(parsed.destination)) {
        const closestDest = findClosestLocation(parsed.destination, locations);
        if (closestDest) {
          console.log(`[AI Parse] Fixed destination: "${parsed.destination}" → "${closestDest.name}"`);
          parsed.destination = closestDest.name;
        } else {
          console.warn(`[AI Parse] Could not match destination location: "${parsed.destination}" strictly.Clearing.`);
          parsed.destination = null;
        }
      }
    }

    // Post-processing validation for room number (>95% accuracy)
    if (parsed.roomNumber) {
      // Use enhanced extraction function to validate/improve room number
      const extracted = extractRoomNumber(parsed.roomNumber);
      if (extracted && extracted !== parsed.roomNumber) {
        console.log(`[AI Parse] Improved room number: "${parsed.roomNumber}" → "${extracted}"`);
        parsed.roomNumber = extracted;
      } else if (!extracted) {
        // Try to extract from pickup if room number seems invalid
        if (parsed.pickup) {
          const fromPickup = extractRoomNumber(parsed.pickup);
          if (fromPickup) {
            console.log(`[AI Parse] Extracted room number from pickup: "${fromPickup}"`);
            parsed.roomNumber = fromPickup;
          }
        }
      }
    } else if (parsed.pickup) {
      // Try to extract room number from pickup if not provided
      const extracted = extractRoomNumber(parsed.pickup);
      if (extracted) {
        console.log(`[AI Parse] Extracted room number from pickup: "${extracted}"`);
        parsed.roomNumber = extracted;
      }
    }

    // Ensure pickup and destination are different
    if (parsed.pickup && parsed.destination && parsed.pickup === parsed.destination) {
      console.warn(`[AI Parse] Pickup and destination are the same: "${parsed.pickup}"`);
      // If pickup is a room number, keep it; otherwise try to use room number as pickup
      if (parsed.roomNumber && !locationNames.includes(parsed.roomNumber)) {
        parsed.pickup = parsed.roomNumber;
      }
    }

    return parsed;
  } catch (e) {
    console.error("AI Parse Error (Ride Request)", e);
    console.log("[AI Parse] Attempting fallback parsing...");
    return parseRideRequestFallback(input, locations);
  }
};

// Fallback parser using Regex and string matching (Robust offline support)
export const parseRideRequestFallback = (
  input: string,
  locations: Array<{ id?: string; name: string; type?: string }>
): any => {
  const normalizedInput = input.toLowerCase().replace(/\s+/g, " ").trim();
  const result: any = {
    guestCount: 1
  };

  // 1. Extract Room Number
  const roomNumber = extractRoomNumber(input);
  if (roomNumber) {
    result.roomNumber = roomNumber;
  }

  // 2. Identify Intent & Locations
  // Common patterns: 
  // "Room X to Y", "From X to Y", "Pickup at X go to Y"
  // "Phòng X đi Y", "Từ X đến Y", "Đón tại X đi Y"

  const locationNames = locations.map(l => l.name);

  // Helper to find location in a text segment
  const findLocationInText = (text: string): string | null => {
    if (!text) return null;
    const match = findClosestLocation(text, locations);
    return match ? match.name : null;
  };

  // Split input by directional keywords
  // English: to, go to, for
  // Vietnamese: đi, đến, tới, cho, ra
  // Use non-capturing group for delimiters to avoid word boundary issues with Unicode
  // Regex includes unicode escapes for solidity: đi (\u0111i), đến (\u0111\u1EBFn), tới (t\u1EDBi), ra (ra)
  const dirRegex = /(?:\s|^)(to|go to|\u0111i|\u0111\u1EBFn|t\u1EDBi|ra)(?:\s|$)/i;
  const toSplit = normalizedInput.split(dirRegex);

  // e.g. "room 205" "to" "restaurant"
  if (toSplit.length >= 3) {
    const fromPart = toSplit[0];
    const toPart = toSplit.slice(2).join(" "); // everything after the delimiter

    const destMatch = findLocationInText(toPart);
    if (destMatch) {
      result.destination = destMatch;
    }

    // Try to find pickup in the first part (if it's not just the room number)
    // Avoid re-matching the room number as a location if possible, unless it really looks like one
    const pickupMatch = findLocationInText(fromPart);
    if (pickupMatch && pickupMatch !== destMatch) {
      // Only if pickupMatch is NOT the room number (unless it's a location ID like villa)
      if (pickupMatch !== result.roomNumber) {
        result.pickup = pickupMatch;
      }
    }
  } else {
    // No explicit "to" keyword, try to find any mentioned locations
    // e.g. "Italian Restaurant" (Implies destination if room provided)
    const foundLocation = findLocationInText(normalizedInput);
    if (foundLocation) {
      // If we found a location, assume it's destination
      result.destination = foundLocation;
    }
  }

  // 3. Default Pickup Logic
  // If we have room number but no pickup, pickup = room number (standard logic)
  // If no room number and no pickup, default to "Lobby" (Reception)
  if (!result.pickup) {
    if (result.roomNumber) {
      result.pickup = result.roomNumber;
    } else {
      // If simply "Go to Italian Restaurant", assume from Lobby
      // But only if we have a destination
      if (result.destination) {
        result.pickup = "Reception"; // Default to Reception
      }
    }
  }

  // 4. Pickup/Destination Collision Fix
  if (result.pickup === result.destination) {
    if (result.roomNumber) result.pickup = result.roomNumber;
    else result.pickup = "Reception";
  }

  // 5. Special keyword handling (Guests count)
  const guestMatch = normalizedInput.match(/\b(\d+)\s*(khách|người|guest|people|pax)\b/i);
  if (guestMatch) {
    result.guestCount = parseInt(guestMatch[1]);
  }

  console.log("[AI Parse] Fallback result:", result);
  return result;
};

// Levenshtein distance for fuzzy string matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
}

// Calculate similarity score (0-1, higher is better)
function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
}

// Enhanced room number extraction with high accuracy (>95%)
export function extractRoomNumber(text: string): string | null {
  if (!text) return null;
  const trimmed = text.trim();

  // Pattern 1: Room/Villa keywords followed by room number (most common)
  const roomPatterns = [
    /(?:room|phòng|rồm|r)\s*:?\s*([A-Z]{1,3}\d{0,3}[A-Z]?|\d{2,4}[A-Z]?)/i,
    /(?:villa|biệt thự|v)\s*:?\s*([A-Z]\d{1,3})/i,
    /(?:số|number|no\.?|#)\s*:?\s*([A-Z]{1,3}\d{0,3}[A-Z]?|\d{2,4}[A-Z]?)/i,
  ];

  for (const pattern of roomPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim().toUpperCase();
      // Validate extracted room number format
      if (/^[A-Z]{1,3}\d{0,3}[A-Z]?$|^\d{2,4}[A-Z]?$|^[A-Z]\d{1,3}$/.test(extracted)) {
        return extracted;
      }
    }
  }

  // Pattern 2: Direct room number formats (standalone)
  const directPatterns = [
    /^([A-Z]{2,3})$/i,  // ACC, ABC (2-3 letters)
    /^([A-Z]\d{1,3})$/i,  // D11, A101, D03 (letter + 1-3 digits)
    /^([A-Z]?\d{2,4}[A-Z]?)$/i,  // 101, 101A, A101, 2001
    /^([DP]\d{1,2})$/i,  // D11, P03
  ];

  for (const pattern of directPatterns) {
    if (pattern.test(trimmed)) {
      return trimmed.toUpperCase();
    }
  }

  // Pattern 3: Room number in text (word boundary - more precise)
  const inTextPatterns = [
    /\b([A-Z]{2,3})\b/i,  // ACC, ABC
    /\b([A-Z]\d{1,3})\b/i,  // D11, A101, D03
    /\b([A-Z]?\d{2,4}[A-Z]?)\b/i,  // 101, 101A, 2001
    /\b([DP]\d{1,2})\b/i,  // D11, P03
  ];

  for (const pattern of inTextPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim().toUpperCase();
      // Additional validation: exclude common words that might match
      const excludeWords = ['ACC', 'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'ITS', 'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE'];
      if (!excludeWords.includes(extracted) && extracted.length >= 2) {
        return extracted;
      }
    }
  }

  return null;
}

// Helper function to find closest location match with improved accuracy (>90%)
function findClosestLocation(
  searchTerm: string,
  locations: Array<{ id?: string; name: string; type?: string }>
): { id?: string; name: string; type?: string } | null {
  if (!searchTerm || !locations || locations.length === 0) return null;

  const lowerSearch = searchTerm.toLowerCase().trim();
  console.log(`[FindClosestLocation] Searching for: "${lowerSearch}" amongst ${locations.length} locations`);

  // 0. Explicit Synonym Map (Robust Fallback)
  const synonymMap: Record<string, string> = {
    "nhà hàng ý": "Don Cipriani's Italian Restaurant",
    "italian restaurant": "Don Cipriani's Italian Restaurant",
    "italian": "Don Cipriani's Italian Restaurant",
    "don cipriani": "Don Cipriani's Italian Restaurant",
    "nhà hàng": "Cafe Indochine", // Default to main restaurant if unspecified
    "lễ tân": "Main Lobby",
    "sảnh": "Main Lobby",
    "lobby": "Main Lobby",
    "reception": "Main Lobby",
    "hồ bơi": "Lagoon Pool", // Default pool
    "pool": "Lagoon Pool",
    "biển": "Main Lobby", // Usually drop off at lobby for beach access if not specific
    "bãi biển": "Main Lobby",
    "villa reception": "Furama Villas Reception",
    "lễ tân khu villa": "Furama Villas Reception"
  };

  // Check synonyms (Exact + Fuzzy)
  for (const [key, target] of Object.entries(synonymMap)) {
    // Exact/Contains match
    if (lowerSearch.includes(key) || key.includes(lowerSearch)) {
      const match = locations.find(l => l.name === target);
      if (match) return match;
    }

    // Fuzzy match against synonym key (handle minor typos like "nhà h ng" instead of "nhà hàng")
    if (similarityScore(lowerSearch, key) > 0.85) {
      console.log(`[FindClosestLocation] Fuzzy synonym match: "${lowerSearch}" ~= "${key}" -> "${target}"`);
      const match = locations.find(l => l.name === target);
      if (match) return match;

      console.warn(`[FindClosestLocation] Target "${target}" not found in locations! Ignoring synonym.`);
      // STRICT MODE: Do not return partial match if not in DB
    }
  }

  // 1. Exact match (case insensitive) - highest priority
  let match = locations.find(loc => loc.name.toLowerCase() === lowerSearch);
  if (match) return match;

  // 2. Exact match with normalized spaces
  match = locations.find(loc =>
    loc.name.toLowerCase().replace(/\s+/g, ' ') === lowerSearch.replace(/\s+/g, ' ')
  );
  if (match) return match;

  // 3. Contains match (search term contains location name or vice versa)
  match = locations.find(loc => {
    const lowerLoc = loc.name.toLowerCase();
    return lowerLoc.includes(lowerSearch) || lowerSearch.includes(lowerLoc);
  });
  if (match) return match;

  // 4. Fuzzy matching with Levenshtein distance (similarity > 0.7)
  const matchesWithScore = locations.map(loc => ({
    location: loc,
    score: similarityScore(lowerSearch, loc.name.toLowerCase())
  })).filter(m => m.score > 0.7).sort((a, b) => b.score - a.score);

  if (matchesWithScore.length > 0 && matchesWithScore[0].score > 0.7) {
    return matchesWithScore[0].location;
  }

  // 5. Smart matching for common terms - check location types
  const typeMatch = lowerSearch.match(/(pool|hồ bơi|restaurant|nhà hàng|villa|biệt thự|lobby|sảnh|beach|bãi biển|reception|spa)/i);
  if (typeMatch) {
    const term = typeMatch[1].toLowerCase();

    // Pool matches - prefer more specific matches
    if (term === "pool" || term === "hồ bơi") {
      // Try to match specific pool names first
      const specificPool = locations.find(loc =>
        loc.type === "FACILITY" &&
        (loc.name.toLowerCase().includes("lagoon pool") || loc.name.toLowerCase().includes("ocean pool"))
      );
      if (specificPool) return specificPool;

      const poolLocs = locations.filter(loc =>
        loc.type === "FACILITY" && loc.name.toLowerCase().includes("pool")
      );
      if (poolLocs.length > 0) return poolLocs[0];
    }

    // Restaurant matches - prefer main restaurants
    if (term === "restaurant" || term === "nhà hàng") {
      const restaurantLocs = locations.filter(loc => loc.type === "RESTAURANT");
      // Prefer ACC, Cafe Indochine, Don Cipriani's (common restaurants)
      const preferred = restaurantLocs.find(loc =>
        loc.name.toLowerCase().includes("acc") ||
        loc.name.toLowerCase().includes("indochine") ||
        loc.name.toLowerCase().includes("cipriani")
      );
      if (preferred) return preferred;
      if (restaurantLocs.length > 0) return restaurantLocs[0];
    }

    // Villa matches
    if (term === "villa" || term === "biệt thự") {
      const villaLocs = locations.filter(loc =>
        loc.type === "VILLA" || /^[D\d]/.test(loc.name)
      );
      if (villaLocs.length > 0) return villaLocs[0];
    }

    // Lobby/Reception matches
    if (term === "lobby" || term === "sảnh" || term === "reception") {
      match = locations.find(loc =>
        loc.name.toLowerCase().includes("reception") ||
        loc.name.toLowerCase().includes("lobby") ||
        loc.name.toLowerCase().includes("main entrance")
      );
      if (match) return match;
    }

    // Beach matches
    if (term === "beach" || term === "bãi biển") {
      match = locations.find(loc =>
        loc.name.toLowerCase().includes("beach") ||
        loc.name.toLowerCase().includes("bãi biển")
      );
      if (match) return match;
    }

    // Spa matches
    if (term === "spa") {
      match = locations.find(loc =>
        loc.name.toLowerCase().includes("spa")
      );
      if (match) return match;
    }
  }

  // 6. Partial word match with minimum word length (e.g., "lagoon" matches "Lagoon Pool")
  match = locations.find(loc => {
    const words = lowerSearch.split(/\s+/).filter(w => w.length > 2);
    const locWords = loc.name.toLowerCase().split(/\s+/);
    return words.some(word =>
      locWords.some(locWord => locWord.includes(word) || word.includes(locWord))
    );
  });
  if (match) return match;

  // 7. Character-based similarity (fallback)
  const charSimilarity = locations.map(loc => ({
    location: loc,
    score: similarityScore(lowerSearch, loc.name.toLowerCase())
  })).sort((a, b) => b.score - a.score);

  if (charSimilarity.length > 0 && charSimilarity[0].score > 0.5) {
    return charSimilarity[0].location;
  }

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
                    - Match location names exactly to the provided valid locations list.Use fuzzy matching for common variations(e.g., "pool" should match "Lagoon Pool" or "Ocean Pool", "restaurant" should match restaurant names).
                    - For locations, be smart about synonyms: "pool" = any pool location, "restaurant" = any restaurant, "villa" = villa areas, "lobby" = reception / lobby areas, "beach" = beach access points.
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
      .map((k) => `Q: ${k.question} A: ${k.answer} `)
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

        Here is the current Resort Knowledge Base(Answer these exactly):
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
            Preserve the original tone(polite, service - oriented).
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
        Return a JSON object where keys are the language names(Vietnamese, Korean, Japanese, Chinese, Russian) and values are objects containing the translated fields.

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
