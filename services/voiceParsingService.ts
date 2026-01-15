import { Location } from "../types";
import { parseRideRequestWithContext, extractRoomNumber } from "./geminiService";

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching when exact match fails
 */
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

/**
 * Calculate similarity score (0-1, higher is better)
 */
function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
}

export interface ParsedVoiceData {
  roomNumber?: string;
  guestName?: string;
  pickup?: string;
  destination?: string;
  guestCount?: number;
  notes?: string;
}

export interface ProcessTranscriptCallbacks {
  onSuccess: (data: ParsedVoiceData) => void;
  onError: (message: string) => void;
  onPartialSuccess: (data: ParsedVoiceData, foundFields: string[]) => void;
}

/**
 * Normalize transcript text - remove filler words and clean up
 */
export const normalizeTranscript = (text: string): string => {
  // Remove common filler words in Vietnamese and English
  const fillerWords = [
    "um",
    "uh",
    "er",
    "ah",
    "à",
    "ừ",
    "ờ",
    "hmm",
    "hm",
    "you know",
    "like",
    "actually",
    "basically",
    "so",
    "well",
    "thì",
    "là",
    "và",
    "của",
    "để",
    "mà",
    "với",
    "cho",
  ];

  let normalized = text.trim();

  // Remove excessive spaces
  normalized = normalized.replace(/\s+/g, " ");

  // Remove filler words (case insensitive)
  fillerWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    normalized = normalized.replace(regex, " ").trim();
  });

  // Clean up multiple spaces again
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
};

/**
 * Smart voice parsing without AI - using keyword matching (fallback method)
 */
export const parseVoiceTranscript = (
  text: string,
  locations: Location[]
): ParsedVoiceData => {
  const lowerText = text.toLowerCase();
  const result: ParsedVoiceData = {};

  // Extract room number (improved patterns with more variations)
  const roomPatterns = [
    /(?:room|phòng|rồm|r)\s*:?\s*([A-Z]{1,3}\d{0,3}[A-Z]?|\d{2,4}[A-Z]?)/i,
    /(?:villa|biệt thự|v)\s*:?\s*([A-Z]\d{1,3})/i,
    /(?:số|number|no\.?|#)\s*:?\s*([A-Z]{1,3}\d{0,3}[A-Z]?|\d{2,4}[A-Z]?)/i,
    /\b([A-Z]{2,3})\b/i,  // ACC, ABC (2-3 letters)
    /\b([A-Z]\d{1,3})\b/i,  // D11, A101, D03 (letter + 1-3 digits)
    /\b([A-Z]?\d{2,4}[A-Z]?)\b/i,  // 101, 101A, 2001, A101
    /\b([DP]\d{1,2})\b/i,  // D11, P03
  ];
  for (const pattern of roomPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.roomNumber = match[1];
      break;
    }
  }

  // Extract guest name (improved patterns with more variations)
  const namePatterns = [
    /(?:guest|khách|name|tên|guest name|tên khách)\s+(?:is|là|:)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /(?:tên|name)\s+(?:khách|guest)?\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /(?:khách hàng|customer|client)\s+(?:tên|name)?\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /(?:tên|name)\s+(?:của|of)?\s*(?:khách|guest)?\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.guestName = match[1].trim();
      break;
    }
  }

  // Extract guest count (improved patterns with more variations)
  const countPatterns = [
    /\b(\d+)\s*(?:guests?|người|khách|people|pax|person|persons)\b/i,
    /\b(\d+)\s*(?:persons?|người)\b/i,
    /(?:có|with|for)\s+(\d+)\s*(?:người|khách|guests?|people)?/i,
    /(?:số lượng|number of|count)\s*(?:khách|guests?|people)?\s*:?\s*(\d+)/i,
  ];
  for (const pattern of countPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.guestCount = parseInt(match[1]);
      if (result.guestCount > 7) result.guestCount = 7;
      if (result.guestCount < 1) result.guestCount = 1;
      break;
    }
  }

  // Extract notes (keywords: luggage, hành lý, baby seat, urgent, gấp)
  const notesKeywords = {
    luggage: ["luggage", "hành lý", "bag", "túi", "valise"],
    babySeat: ["baby seat", "ghế trẻ em", "trẻ em"],
    urgent: ["urgent", "gấp", "nhanh", "asap"],
    wheelchair: ["wheelchair", "xe lăn"],
  };
  const foundNotes: string[] = [];
  for (const [key, keywords] of Object.entries(notesKeywords)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      foundNotes.push(
        key === "luggage"
          ? "Has luggage"
          : key === "babySeat"
            ? "Needs baby seat"
            : key === "urgent"
              ? "Urgent"
              : "Needs wheelchair"
      );
    }
  }
  if (foundNotes.length > 0) {
    result.notes = foundNotes.join(", ");
  }

  // Find locations using keyword matching with fuzzy matching (Levenshtein distance)
  const findLocation = (searchText: string): string | null => {
    if (!searchText || !locations || locations.length === 0) return null;

    const lowerSearch = searchText.toLowerCase().trim();

    // 1. Exact match (case insensitive)
    let match = locations.find(loc =>
      loc.name.toLowerCase() === lowerSearch
    );
    if (match) return match.name;

    // 2. Contains match (search term contains location name or vice versa)
    match = locations.find(loc => {
      const lowerLoc = loc.name.toLowerCase();
      return lowerLoc.includes(lowerSearch) || lowerSearch.includes(lowerLoc);
    });
    if (match) return match.name;

    // 3. Fuzzy matching with Levenshtein distance (similarity > 0.7)
    const matchesWithScore = locations.map(loc => ({
      location: loc,
      score: similarityScore(lowerSearch, loc.name.toLowerCase())
    })).filter(m => m.score > 0.7).sort((a, b) => b.score - a.score);

    if (matchesWithScore.length > 0 && matchesWithScore[0].score > 0.7) {
      return matchesWithScore[0].location.name;
    }

    // 4. Keyword matching with expanded keywords
    const keywordMap: Record<string, string[]> = {
      pool: ["pool", "hồ bơi", "bể bơi", "swimming pool", "hồ", "bể"],
      restaurant: ["restaurant", "nhà hàng", "restaurant", "dining", "ăn", "nhà ăn"],
      villa: ["villa", "biệt thự", "villas", "villa area", "khu biệt thự"],
      lobby: ["lobby", "sảnh", "reception", "lễ tân", "sảnh chính", "main lobby"],
      beach: ["beach", "bãi biển", "biển", "seaside", "bờ biển"],
      gym: ["gym", "phòng gym", "phòng tập", "fitness", "gymnasium"],
      spa: ["spa", "massage", "thư giãn", "wellness"],
      bar: ["bar", "quán bar", "lounge", "quầy bar"],
      shop: ["shop", "cửa hàng", "store", "gift shop", "quà lưu niệm"],
      parking: ["parking", "bãi đỗ xe", "parking lot", "đỗ xe"],
    };

    for (const [category, keywords] of Object.entries(keywordMap)) {
      if (keywords.some((kw) => lowerSearch.includes(kw))) {
        // Find first matching location by type or name
        if (category === "pool") {
          const pool = locations.find(
            (l) =>
              l.type === "FACILITY" && l.name.toLowerCase().includes("pool")
          );
          if (pool) return pool.name;
        } else if (category === "restaurant") {
          const restaurant = locations.find((l) => l.type === "RESTAURANT");
          if (restaurant) return restaurant.name;
        } else if (category === "villa") {
          const villa = locations.find(
            (l) => l.type === "VILLA" || /^[DP]\d/.test(l.name)
          );
          if (villa) return villa.name;
        } else if (category === "lobby") {
          const lobby = locations.find(
            (l) =>
              l.name.toLowerCase().includes("reception") ||
              l.name.toLowerCase().includes("lobby")
          );
          if (lobby) return lobby.name;
        } else {
          const match = locations.find((l) =>
            l.name.toLowerCase().includes(category)
          );
          if (match) return match.name;
        }
      }
    }

    // 5. Partial word match with fuzzy matching
    const words = lowerSearch.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      const partialMatches = locations.map(loc => {
        const locWords = loc.name.toLowerCase().split(/\s+/);
        const bestScore = Math.max(...words.map(word =>
          Math.max(...locWords.map(locWord => {
            if (locWord.includes(word) || word.includes(locWord)) {
              return similarityScore(word, locWord);
            }
            return 0;
          }))
        ));
        return { location: loc, score: bestScore };
      }).filter(m => m.score > 0.6).sort((a, b) => b.score - a.score);

      if (partialMatches.length > 0) {
        return partialMatches[0].location.name;
      }
    }

    return null;
  };

  // Extract pickup and destination
  // Enhanced patterns: 15+ variations including Vietnamese and English
  const routePatterns = [
    // Pattern 1-3: Basic from/to patterns
    /(?:from|từ|pickup|đón|lấy|yên|yến)\s+(.+?)\s+(?:to|đến|destination|đi|go to|tới)\s+(.+)/i,
    /(?:pickup|đón|lấy|yên|yến)\s+(.+?)\s+(?:destination|điểm đến|đi|tới)\s+(.+)/i,
    /(.+?)\s+(?:to|đến|đi|tới)\s+(.+)/i,

    // Pattern 4-6: Vietnamese variations
    /(?:đưa|chở|đưa đi)\s+(.+?)\s+(?:đến|tới|đi|về)\s+(.+)/i,
    /(?:xe|buggy)\s+(?:đến|tới|đi)\s+(.+?)\s+(?:từ|tại|ở)\s+(.+)/i,
    /(?:cần|muốn)\s+(?:đi|đến|tới)\s+(.+?)\s+(?:từ|tại|ở)\s+(.+)/i,

    // Pattern 7-9: English variations
    /(?:take|bring|drive)\s+(?:me|us|guest)?\s+(?:from|at)?\s*(.+?)\s+(?:to|towards)\s+(.+)/i,
    /(?:need|want|request)\s+(?:a|an)?\s*(?:ride|buggy|car)?\s+(?:from|at)?\s*(.+?)\s+(?:to|towards)\s+(.+)/i,
    /(?:going|go)\s+(?:to|towards)\s+(.+?)\s+(?:from|at|starting at)\s+(.+)/i,

    // Pattern 10-12: Mixed language and informal
    /(?:đi|go)\s+(.+?)\s+(?:từ|from)\s+(.+)/i,
    /(?:pickup|đón|yên|yến)\s+(?:at|tại|ở)\s+(.+?)\s+(?:go|đi)\s+(?:to|đến)\s+(.+)/i,
    /(?:start|bắt đầu)\s+(?:from|từ|tại)\s+(.+?)\s+(?:end|kết thúc|đến)\s+(?:at|tại|ở)?\s*(.+)/i,

    // Pattern 13-15: Additional variations
    /(?:transport|vận chuyển)\s+(?:from|từ)\s+(.+?)\s+(?:to|đến)\s+(.+)/i,
    /(?:move|di chuyển)\s+(?:from|từ)\s+(.+?)\s+(?:to|đến)\s+(.+)/i,
    /(?:transfer|chuyển)\s+(?:from|từ)\s+(.+?)\s+(?:to|đến)\s+(.+)/i,

    // Pattern 16-18: Room number as pickup variations
    /(?:phòng|room)\s+([A-Z]?\d+[A-Z]?)\s+(?:đi|go|to|đến)\s+(.+)/i,
    /(?:villa|biệt thự)\s+([A-Z]\d+)\s+(?:đi|go|to|đến)\s+(.+)/i,
    /(?:từ|from)\s+(?:phòng|room)\s+([A-Z]?\d+[A-Z]?)\s+(?:đến|to)\s+(.+)/i,
  ];

  let foundPickup: string | null = null;
  let foundDestination: string | null = null;

  for (const pattern of routePatterns) {
    const match = text.match(pattern);
    if (match) {
      const pickupText = match[1].trim();
      const destText = match[2].trim();

      foundPickup = findLocation(pickupText);
      foundDestination = findLocation(destText);

      if (foundPickup && foundDestination) break;
    }
  }

  // If not found in patterns, try to find locations anywhere in text with fuzzy matching
  if (!foundPickup || !foundDestination) {
    // First try exact/contains match
    for (const loc of locations) {
      const locLower = loc.name.toLowerCase();
      if (lowerText.includes(locLower) || locLower.includes(lowerText)) {
        if (!foundPickup) {
          foundPickup = loc.name;
        } else if (!foundDestination && loc.name !== foundPickup) {
          foundDestination = loc.name;
          break;
        }
      }
    }

    // If still not found, try fuzzy matching
    if (!foundPickup || !foundDestination) {
      const words = lowerText.split(/\s+/).filter(w => w.length > 2);
      const locationMatches = locations.map(loc => ({
        location: loc,
        score: Math.max(...words.map(word =>
          similarityScore(word, loc.name.toLowerCase())
        ))
      })).filter(m => m.score > 0.6).sort((a, b) => b.score - a.score);

      for (const match of locationMatches) {
        if (!foundPickup) {
          foundPickup = match.location.name;
        } else if (!foundDestination && match.location.name !== foundPickup) {
          foundDestination = match.location.name;
          break;
        }
      }
    }
  }

  // If pickup not found but room number exists, use room as pickup
  if (!foundPickup && result.roomNumber) {
    foundPickup = result.roomNumber;
  }

  if (foundPickup) result.pickup = foundPickup;
  if (foundDestination) result.destination = foundDestination;

  return result;
};

/**
 * Helper to check if text looks like a room number
 */
export const looksLikeRoomNumber = (text: string): boolean => {
  if (!text) return false;
  const trimmed = text.trim().toUpperCase();
  // Check various room number patterns
  return (
    /^[A-Z]{2,3}$/.test(trimmed) || // ACC, ABC
    /^[A-Z]\d{1,3}$/.test(trimmed) || // D11, A101
    /^[A-Z]?\d{2,3}[A-Z]?$/.test(trimmed) || // 101, 101A
    /^[DP]\d{1,2}$/.test(trimmed)
  ); // D11, P03
};

/**
 * Helper to check if a string is a known location name
 */
export const isLocationName = (
  text: string,
  locations: Location[]
): boolean => {
  if (!text) return false;
  return locations.some(
    (loc) =>
      loc.name.toLowerCase() === text.toLowerCase() ||
      loc.name.toLowerCase().includes(text.toLowerCase()) ||
      text.toLowerCase().includes(loc.name.toLowerCase())
  );
};

/**
 * Process transcript with AI parsing and fallback to keyword matching
 */
export const processTranscript = async (
  text: string,
  locations: Location[],
  callbacks: ProcessTranscriptCallbacks,
  existingData?: Partial<ParsedVoiceData>
): Promise<ParsedVoiceData | null> => {
  if (!text.trim()) {
    callbacks.onError("Không phát hiện giọng nói. Vui lòng thử lại.");
    return null;
  }

  // Normalize transcript first
  const normalizedText = normalizeTranscript(text);

  if (!normalizedText || normalizedText.length < 5) {
    callbacks.onError(
      "Câu nói quá ngắn hoặc không rõ ràng. Vui lòng thử lại."
    );
    return null;
  }

  try {
    // Use AI parsing instead of simple keyword matching
    let parsedData;
    try {
      parsedData = await parseRideRequestWithContext(
        normalizedText,
        locations
      );
    } catch (aiError: any) {
      console.error("AI parsing error:", aiError);

      // Check if it's a network error
      const isNetworkError =
        aiError?.message?.includes('network') ||
        aiError?.message?.includes('fetch') ||
        aiError?.message?.includes('NetworkError') ||
        aiError?.code === 'NETWORK_ERROR' ||
        !navigator.onLine;

      if (isNetworkError) {
        callbacks.onError(
          "Lỗi kết nối mạng khi gọi AI. Đang sử dụng phương pháp phân tích từ khóa..."
        );
      } else if (aiError?.message?.includes('API key') || aiError?.message?.includes('401') || aiError?.message?.includes('403')) {
        callbacks.onError(
          "Lỗi xác thực AI API. Đang sử dụng phương pháp phân tích từ khóa..."
        );
      } else {
        callbacks.onError(
          "Lỗi khi gọi AI. Đang sử dụng phương pháp phân tích từ khóa..."
        );
      }

      // Fall through to fallback parsing
      parsedData = null;
    }

    if (parsedData && (parsedData.pickup || parsedData.destination)) {
      // Process room number extraction
      let roomNumber = parsedData.roomNumber;
      // If no room number, try to extract from pickup
      if (!roomNumber && parsedData.pickup) {
        // First try to extract room number from pickup text
        roomNumber = extractRoomNumber(parsedData.pickup) || null;

        // If pickup itself looks like a room number and is not a known location, use it directly
        if (!roomNumber && !isLocationName(parsedData.pickup, locations)) {
          if (looksLikeRoomNumber(parsedData.pickup)) {
            roomNumber = parsedData.pickup.trim().toUpperCase();
          }
        }

        // If pickup is a known location that contains a room number, extract it
        if (!roomNumber && isLocationName(parsedData.pickup, locations)) {
          const extracted = extractRoomNumber(parsedData.pickup);
          if (extracted) {
            roomNumber = extracted;
          }
        }
      }
      // If still no room number, try from existing data
      if (!roomNumber && existingData) {
        roomNumber =
          (existingData.pickup && extractRoomNumber(existingData.pickup)) ||
          (existingData.pickup &&
            looksLikeRoomNumber(existingData.pickup) &&
            existingData.pickup.trim().toUpperCase()) ||
          (existingData.roomNumber && existingData.roomNumber.trim()
            ? existingData.roomNumber
            : null) ||
          null;
      }

      const finalData: ParsedVoiceData = {
        roomNumber: roomNumber || existingData?.roomNumber,
        pickup: parsedData.pickup || existingData?.pickup,
        destination: parsedData.destination || existingData?.destination,
        guestName: parsedData.guestName || existingData?.guestName,
        guestCount: parsedData.guestCount || existingData?.guestCount || 1,
        notes: parsedData.notes || existingData?.notes,
      };

      // Check if we have minimum required fields
      const finalRoomNumber = roomNumber || existingData?.roomNumber;
      if (
        parsedData.pickup &&
        parsedData.destination &&
        finalRoomNumber
      ) {
        callbacks.onSuccess(finalData);
      } else {
        // Partial data - show what was found
        const found: string[] = [];
        if (parsedData.pickup) found.push("điểm đón");
        if (parsedData.destination) found.push("điểm đến");
        if (parsedData.roomNumber) found.push("số phòng");
        if (parsedData.guestName) found.push("tên khách");

        callbacks.onPartialSuccess(finalData, found);
      }

      return finalData;
    } else {
      // Fallback to simple parsing if AI fails
      const fallbackData = parseVoiceTranscript(normalizedText, locations);

      if (fallbackData.pickup && fallbackData.destination) {
        let roomNumber = fallbackData.roomNumber;
        // If no room number, try to extract from pickup
        if (!roomNumber && fallbackData.pickup) {
          // First try to extract room number from pickup text
          roomNumber = extractRoomNumber(fallbackData.pickup) || null;

          // If pickup itself looks like a room number and is not a known location, use it directly
          if (!roomNumber && !isLocationName(fallbackData.pickup, locations)) {
            if (looksLikeRoomNumber(fallbackData.pickup)) {
              roomNumber = fallbackData.pickup.trim().toUpperCase();
            }
          }

          // If pickup is a known location that contains a room number, extract it
          if (!roomNumber && isLocationName(fallbackData.pickup, locations)) {
            const extracted = extractRoomNumber(fallbackData.pickup);
            if (extracted) {
              roomNumber = extracted;
            }
          }
        }
        // If still no room number, try from existing data
        if (!roomNumber && existingData) {
          roomNumber =
            (existingData.pickup && extractRoomNumber(existingData.pickup)) ||
            (existingData.pickup &&
              looksLikeRoomNumber(existingData.pickup) &&
              existingData.pickup.trim().toUpperCase()) ||
            (existingData.roomNumber && existingData.roomNumber.trim()
              ? existingData.roomNumber
              : null) ||
            null;
        }

        const finalData: ParsedVoiceData = {
          roomNumber: roomNumber || existingData?.roomNumber,
          pickup: fallbackData.pickup || existingData?.pickup,
          destination: fallbackData.destination || existingData?.destination,
          guestName: fallbackData.guestName || existingData?.guestName,
          guestCount: fallbackData.guestCount || existingData?.guestCount || 1,
          notes: fallbackData.notes || existingData?.notes,
        };

        const finalRoomNumber = roomNumber || existingData?.roomNumber;
        if (
          fallbackData.pickup &&
          fallbackData.destination &&
          finalRoomNumber
        ) {
          callbacks.onSuccess(finalData);
        } else {
          const found: string[] = [];
          if (fallbackData.pickup) found.push("điểm đón");
          if (fallbackData.destination) found.push("điểm đến");
          if (fallbackData.roomNumber) found.push("số phòng");
          if (fallbackData.guestName) found.push("tên khách");

          callbacks.onPartialSuccess(finalData, found);
        }

        return finalData;
      } else {
        const missing: string[] = [];
        if (!fallbackData.pickup && !parsedData?.pickup)
          missing.push("điểm đón");
        if (!fallbackData.destination && !parsedData?.destination)
          missing.push("điểm đến");

        callbacks.onError(
          `Không tìm thấy ${missing.join(" và ")}. Vui lòng nói rõ ràng hơn, ví dụ: "đón phòng 101 đi hồ bơi" hoặc "from room 101 to pool".`
        );
        return null;
      }
    }
  } catch (error) {
    console.error("Voice parsing error:", error);

    // Try fallback parsing
    try {
      const fallbackData = parseVoiceTranscript(normalizedText, locations);
      if (fallbackData.pickup && fallbackData.destination) {
        let roomNumber = fallbackData.roomNumber;
        if (!roomNumber && fallbackData.pickup) {
          roomNumber = extractRoomNumber(fallbackData.pickup) || null;
          if (!roomNumber && !isLocationName(fallbackData.pickup, locations)) {
            if (looksLikeRoomNumber(fallbackData.pickup)) {
              roomNumber = fallbackData.pickup.trim().toUpperCase();
            }
          }
          if (!roomNumber && isLocationName(fallbackData.pickup, locations)) {
            const extracted = extractRoomNumber(fallbackData.pickup);
            if (extracted) {
              roomNumber = extracted;
            }
          }
        }
        if (!roomNumber && existingData) {
          roomNumber =
            (existingData.pickup && extractRoomNumber(existingData.pickup)) ||
            (existingData.pickup &&
              looksLikeRoomNumber(existingData.pickup) &&
              existingData.pickup.trim().toUpperCase()) ||
            (existingData.roomNumber && existingData.roomNumber.trim()
              ? existingData.roomNumber
              : null) ||
            null;
        }

        const finalData: ParsedVoiceData = {
          roomNumber: roomNumber || existingData?.roomNumber,
          pickup: fallbackData.pickup || existingData?.pickup,
          destination: fallbackData.destination || existingData?.destination,
          guestName: fallbackData.guestName || existingData?.guestName,
          guestCount: fallbackData.guestCount || existingData?.guestCount || 1,
          notes: fallbackData.notes || existingData?.notes,
        };

        const finalRoomNumber = roomNumber || existingData?.roomNumber;
        if (
          fallbackData.pickup &&
          fallbackData.destination &&
          finalRoomNumber
        ) {
          callbacks.onSuccess(finalData);
        } else {
          const found: string[] = [];
          if (fallbackData.pickup) found.push("điểm đón");
          if (fallbackData.destination) found.push("điểm đến");
          if (fallbackData.roomNumber) found.push("số phòng");
          if (fallbackData.guestName) found.push("tên khách");

          callbacks.onPartialSuccess(finalData, found);
        }

        return finalData;
      } else {
        callbacks.onError(
          "Không thể phân tích yêu cầu. Vui lòng thử lại hoặc nhập thủ công."
        );
        return null;
      }
    } catch (fallbackError) {
      console.error("Fallback parsing error:", fallbackError);
      callbacks.onError(
        "Lỗi xử lý giọng nói. Vui lòng thử lại hoặc nhập thủ công."
      );
      return null;
    }
  }
};

