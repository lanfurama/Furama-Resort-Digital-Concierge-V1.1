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

// --- NEW: Phonetic & Number Mappings ---

const PHONETIC_MAPPINGS: Record<string, string> = {
  "niu rai": "new ride", "niu lai": "new ride", "nhiu lai": "new ride",
  "tạo rai": "new ride", "tạo ride": "new ride", "tạo chuyến": "new ride",
  "rum": "room", "rùm": "room", "rôm": "room", "phòng": "room",
  "oan": "1", "uân": "1", "quân": "1", "oăn": "1",
  "tu": "2", "tư": "4",
  "tri": "3", "tờ ri": "3", "thờ ri": "3", "ba": "3",
  "for": "4", "pho": "4", "phò": "4", "bốn": "4",
  "phai": "5", "phài": "5", "năm": "5", "nằm": "5", "lăm": "5",
  "xích": "6", "sích": "6", "sáu": "6",
  "se vần": "7", "xe vần": "7", "bảy": "7",
  "gâu tu": "go to", "gô tu": "go to", "đi": "go to", "đến": "go to", "tới": "go to", "ra": "go to", "về": "go to",
  "pic úp": "pick up", "bích úp": "pick up", "píc ắp": "pick up", "đón": "pick up", "lấy": "pick up", "tại": "pick up",
  "láp to": "lobby", "lốp by": "lobby", "lô bi": "lobby", "sảnh": "lobby", "lễ tân": "lobby", "reception": "lobby",
  "vui la": "villa", "vi la": "villa", "biệt thự": "villa", "v": "villa",
  "bích": "beach", "bít": "beach", "bãi biển": "beach", "biển": "beach", "bờ biển": "beach",
  "ăn sáng": "restaurant", "ăn tối": "restaurant", "đi ăn": "restaurant", "nhà hàng": "restaurant",
  "nhà hàng ý": "italian restaurant", "ý": "italian restaurant",
  "tập gym": "gym", "tập thể dục": "gym", "phòng tập": "gym",
  "hồ bơi": "pool", "bể bơi": "pool", "pua": "pool", "bơi": "pool",
  "xì pa": "spa", "spa": "spa", "mát xa": "spa",
  "hành lý": "luggage", "vali": "luggage", "đồ": "luggage",
  "gấp": "urgent", "nhanh": "urgent", "khẩn cấp": "urgent",
};

const VN_DIGITS: Record<string, string> = {
  "không": "0", "linh": "0", "lẻ": "0",
  "một": "1", "mốt": "1",
  "hai": "2",
  "ba": "3",
  "bốn": "4",
  "năm": "5", "lăm": "5",
  "sáu": "6",
  "bảy": "7",
  "tám": "8",
  "chín": "9",
  "mười": "10",
  "chục": "10",
};

const VN_LETTERS: Record<string, string> = {
  "a": "A", "bê": "B", "xê": "C", "xi": "C", "đê": "D", "đi": "D", "dê": "D",
  "e": "E", "ép": "F", "phờ": "F", "gờ": "G", "hát": "H", "hắc": "H", "y": "I", "i": "I",
  "ca": "K", "ki": "K", "lờ": "L", "em mờ": "M", "en nờ": "N", "o": "O", "pê": "P",
  "quy": "Q", "qu": "Q", "quờ": "Q", "ét": "S", "sờ": "S", "xờ": "S", "tê": "T", "ti": "T",
  "u": "U", "vê": "V", "vi": "V", "x": "X", "ích xì": "X", "y dài": "Y",
};

// Convert "một linh một" -> "101", "đê ba" -> "D3"
function convertSpokenToNumber(text: string): string {
  let processed = text.toLowerCase();

  // Replace letters
  for (const [key, val] of Object.entries(VN_LETTERS)) {
    processed = processed.replace(new RegExp(`(?<=^|\\s)${key}(?=$|\\s)`, 'g'), val);
  }

  // Replace digits
  for (const [key, val] of Object.entries(VN_DIGITS)) {
    processed = processed.replace(new RegExp(`(?<=^|\\s)${key}(?=$|\\s)`, 'g'), val);
  }

  // Clean up spaces between digits/letters to form compact number
  // e.g. "D 3" -> "D3", "1 0 1" -> "101"
  processed = processed.replace(/([a-zA-Z0-9])\s+([a-zA-Z0-9])/g, "$1$2");
  processed = processed.replace(/([a-zA-Z0-9])\s+([a-zA-Z0-9])/g, "$1$2"); // Run twice for 3+ chars

  return processed.toUpperCase();
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
  onPartialSuccess: (data: ParsedVoiceData, foundFields: string[], missingFields: string[]) => void;
}

/**
 * Normalize transcript text - remove filler words and clean up
 */
export const normalizeTranscript = (text: string): string => {
  // Unicode normalization (Critical for Vietnamese)
  let processedText = text.normalize("NFC").toLowerCase();

  // Specific fix for "Nam/Năm/Em" -> 5 when referring to guests
  processedText = processedText.replace(/(nam|năm|em|nằm|nâm)[\s\W]+(khách|người)/gi, "5 khách");

  // Fix common ICP misinterpretations
  processedText = processedText.replace(/\b(icp|ice pe|ai si pi|ai xi pi)\b/gi, "ICP");

  // Fix "B1" to "P1" if "B1" isn't a likely villa (Villa usually B + 2 digits like B11, or user intent is commonly P1)
  // Context dependent: "từ B1" -> "từ P1" if P1 is a valid room.
  // Actually, let's just normalize common room typos
  processedText = processedText.replace(/\b(bê một|b1)\b/gi, "P1"); // P1 is more common for 'room' context than B1 if B1 isn't a villa

  // ALGORITHMIC PRE-PROCESSING for STABILITY
  // 1. Prevent "Khách" being seen as Location "KH" by mapping to "guest"
  processedText = processedText.replace(/\bkhách\b/gi, "guest");
  processedText = processedText.replace(/\bngười\b/gi, "guest");

  // 2. Expand Short Location Codes (e.g. B11 -> Villa B11)
  processedText = processedText.replace(/\b([b-d])\s*(\d{1,2})\b/gi, "Villa $1$2");
  processedText = processedText.replace(/\bacc\b/gi, "ACC");

  // Fix "mùi" -> "mươi" or "mười" (10/x0)
  processedText = processedText.replace(/(mùi|mươi|mười)[\s\W]+(guest|khác)/gi, "10 guest");
  processedText = processedText.replace(/(năm|nam)[\s\W]+(mùi|mươi|mười)/gi, "50"); // Năm mươi -> 50

  // Fix "khác" -> "khách" (common STT error at end of sentence)
  processedText = processedText.replace(/(\d+)\s+khác/gi, "$1 khách");

  // Normalize other numbers with "khách"
  processedText = processedText.replace(/một\s+(khách|người|khác)/gi, "1 khách");
  processedText = processedText.replace(/hai\s+(khách|người|khác)/gi, "2 khách");
  processedText = processedText.replace(/ba\s+(khách|người|khác)/gi, "3 khách");
  processedText = processedText.replace(/bốn\s+(khách|người|khác)/gi, "4 khách");
  processedText = processedText.replace(/sáu\s+(khách|người|khác)/gi, "6 khách");
  processedText = processedText.replace(/bảy\s+(khách|người|khác)/gi, "7 khách");
  processedText = processedText.replace(/tám\s+(khách|người|khác)/gi, "8 khách");
  processedText = processedText.replace(/chín\s+(khách|người|khác)/gi, "9 khách");
  processedText = processedText.replace(/mười\s+(khách|người|khác)/gi, "10 khách");

  // Fix "resort" -> "Furama Resort" potential hallucinations
  // Or simply remove "resort" if it's noise at end of sentence
  if (processedText.endsWith("resort")) {
    processedText = processedText.replace(/\s+resort$/, "");
  }

  // Remove common filler words in Vietnamese only (removed English fillers)
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
    "kiểu",
    "kiểu như",
    "cái gì nhỉ",
    "nhé",
    "ạ",
    "vâng",
    "dạ",
    "í",
    "ý",
    "nhá",
    "nhỉ",
    "cái",
  ];

  let normalized = text.trim();

  // Remove excessive spaces
  normalized = normalized.replace(/\s+/g, " ");

  // Apply Phonetic Mappings FIRST
  for (const [key, value] of Object.entries(PHONETIC_MAPPINGS)) {
    const regex = new RegExp(`(?<=^|\\s)${key}(?=$|\\s)`, "gi");
    normalized = normalized.replace(regex, value);
  }

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
  // Pre-process text for Number Extraction
  const textForNumbers = convertSpokenToNumber(text);

  // Extract room number (improved patterns with more variations)
  const roomPatterns = [
    /(?:room|phòng|rồm|r)\s*:?\s*([A-Z]{1,3}\d{0,3}[A-Z]?|\d{2,4}[A-Z]?)/i, // Standard
    /(?:villa|biệt thự|v)\s*:?\s*([A-Z]\d{1,3})/i,
    /(?:số|number|no\.?|#)\s*:?\s*([A-Z]{1,3}\d{0,3}[A-Z]?|\d{2,4}[A-Z]?)/i,

    // Patterns for converted spoken numbers (e.g., "D3" from "đê ba")
    /\b([A-Z]{1,2}\d{1,3})\b/i,
    /\b(\d{3,4})\b/, // 3-4 digits (101, 1001)
  ];

  // Try extracting from converted text first
  for (const pattern of roomPatterns) {
    const match = textForNumbers.match(pattern);
    if (match) {
      // Validate common room formats (D3, 101, etc.)
      const cand = match[1].toUpperCase();
      if (/^[A-Z]\d{1,3}$|^\d{3,4}$/.test(cand)) {
        result.roomNumber = cand;
        break;
      }
    }
  }

  // Fallback to original text if not found
  if (!result.roomNumber) {
    const originalRoomPatterns = [
      /(?:room|phòng|rồm|r)\s*:?\s*([A-Z]{1,3}\d{0,3}[A-Z]?|\d{2,4}[A-Z]?)/i,
      /(?:villa|biệt thự|v)\s*:?\s*([A-Z]\d{1,3})/i,
      /(?:số|number|no\.?|#)\s*:?\s*([A-Z]{1,3}\d{0,3}[A-Z]?|\d{2,4}[A-Z]?)/i,
      /(?:số|number|no\.?|#)\s*:?\s*([A-Z]{1,3}\d{0,3}[A-Z]?|\d{2,4}[A-Z]?)/i,
      /\b([A-Z]{3})\b/i,  // ACC (3 letters - stricter check needed downstream or removed if too broad)
      /\b([A-Z]{2})\b/i,  // D1 (2 letters? No, usually letter+digit)
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

      // 0. Explicit Synonym Map
      const synonymMap: Record<string, string> = {
        "nhà hàng ý": "Don Cipriani's Italian Restaurant",
        "italian restaurant": "Don Cipriani's Italian Restaurant",
        "italian": "Don Cipriani's Italian Restaurant",
        "ý": "Don Cipriani's Italian Restaurant",
        "don cipriani": "Don Cipriani's Italian Restaurant",
        "nhà hàng á": "Cafe Indochine",
        "indochine": "Cafe Indochine",
        "hồ bơi": "Lagoon Pool", // Default priority
        "pool": "Lagoon Pool",
        "bể bơi": "Lagoon Pool",
        "sảnh": "Main Lobby",
        "lobby": "Main Lobby",
        "reception": "Main Lobby",
        "lễ tân": "Main Lobby",
        "cổng": "Main Entrance",
        "main entrance": "Main Entrance",
        "biển": "Beach",
        "bãi biển": "Beach",
        "ra biển": "Beach",
        "spa": "V-Senses Wellness & Spa",
        "gym": "Health Club",
        "ăn sáng": "Cafe Indochine", // Breakfast usually here
        "ăn tối": "Cafe Indochine"
      };

      for (const [key, target] of Object.entries(synonymMap)) {
        if (lowerSearch.includes(key) || key.includes(lowerSearch)) {
          const match = locations.find(l => l.name === target);
          if (match) return match.name;
        }
      }

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
        pool: ["pool", "hồ bơi", "bể bơi", "swimming pool", "hồ", "bể", "bơi"],
        restaurant: ["restaurant", "nhà hàng", "restaurant", "dining", "ăn", "nhà ăn", "buffet", "điểm tâm"],
        villa: ["villa", "biệt thự", "villas", "villa area", "khu biệt thự", "căn"],
        lobby: ["lobby", "sảnh", "reception", "lễ tân", "sảnh chính", "main lobby", "checkin", "check-in"],
        beach: ["beach", "bãi biển", "biển", "seaside", "bờ biển", "cát"],
        gym: ["gym", "phòng gym", "phòng tập", "fitness", "gymnasium", "thể hình"],
        spa: ["spa", "massage", "thư giãn", "wellness", "xông hơi", "trị liệu"],
        bar: ["bar", "quán bar", "lounge", "quầy bar", "club", "pub"],
        shop: ["shop", "cửa hàng", "store", "gift shop", "quà lưu niệm", "mua sắm"],
        parking: ["parking", "bãi đỗ xe", "parking lot", "đỗ xe", "gửi xe"],
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
      /(?:from|từ|pickup|đón|lấy|yên|yến|tại|ở)\s+(.+?)\s+(?:to|đến|destination|đi|go to|tới|ra|về)\s+(.+)/i,
      /(?:pickup|đón|lấy|yên|yến)\s+(.+?)\s+(?:destination|điểm đến|đi|tới|ra|về)\s+(.+)/i,
      /(.+?)\s+(?:to|đến|đi|tới|ra|về)\s+(.+)/i,

      // Pattern 4-6: Vietnamese variations
      /(?:đưa|chở|đưa đi|chở đi)\s+(.+?)\s+(?:đến|tới|đi|về|ra)\s+(.+)/i,
      /(?:xe|buggy)\s+(?:đến|tới|đi|ra|về)\s+(.+?)\s+(?:từ|tại|ở)\s+(.+)/i,
      /(?:cần|muốn|cho)\s*(?:xe|buggy)?\s*(?:đi|đến|tới|ra|về)\s+(.+?)\s+(?:từ|tại|ở)\s+(.+)/i,

      // Pattern 7-9: English variations
      /(?:take|bring|drive)\s+(?:me|us|guest)?\s+(?:from|at)?\s*(.+?)\s+(?:to|towards)\s+(.+)/i,
      /(?:need|want|request)\s+(?:a|an)?\s*(?:ride|buggy|car)?\s+(?:from|at)?\s*(.+?)\s+(?:to|towards)\s+(.+)/i,
      /(?:going|go)\s+(?:to|towards)\s+(.+?)\s+(?:from|at|starting at)\s+(.+)/i,

      // Pattern 10-12: Mixed language and informal
      /(?:đi|go|ra|về)\s+(.+?)\s+(?:từ|from)\s+(.+)/i,
      /(?:pickup|đón|yên|yến)\s+(?:at|tại|ở)\s+(.+?)\s+(?:go|đi|ra|về)\s+(?:to|đến|tới)\s+(.+)/i,
      /(?:start|bắt đầu)\s+(?:from|từ|tại)\s+(.+?)\s+(?:end|kết thúc|đến|tới)\s+(?:at|tại|ở)?\s*(.+)/i,

      // Pattern 13-15: Additional variations
      /(?:transport|vận chuyển|di chuyển)\s+(?:from|từ)\s+(.+?)\s+(?:to|đến)\s+(.+)/i,
      /(?:move|di chuyển)\s+(?:from|từ)\s+(.+?)\s+(?:to|đến)\s+(.+)/i,
      /(?:transfer|chuyển)\s+(?:from|từ)\s+(.+?)\s+(?:to|đến)\s+(.+)/i,

      // Pattern 16-18: Room number as pickup variations
      /(?:phòng|room|tại|ở)\s+([A-Z]?\d+[A-Z]?)\s+(?:đi|go|to|đến|ra|về)\s+(.+)/i,
      /(?:villa|biệt thự|tại|ở)\s+([A-Z]\d+)\s+(?:đi|go|to|đến|ra|về)\s+(.+)/i,
      /(?:từ|from)\s+(?:phòng|room)\s+([A-Z]?\d+[A-Z]?)\s+(?:đến|to|ra|về)\s+(.+)/i,
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
};

/**
 * Helper to check if text looks like a room number
 */
export const looksLikeRoomNumber = (text: string): boolean => {
  if (!text) return false;
  const trimmed = text.trim().toUpperCase();
  // Check various room number patterns
  return (
    /^[A-Z]{3}$/.test(trimmed) || // ACC, ABC (3 letters)
    /^[A-Z]\d{1,3}$/.test(trimmed) || // D11, A101
    /^[A-Z]?\d{2,3}[A-Z]?$/.test(trimmed) || // 101, 101A
    /^[A-Z]?\d{2,3}[A-Z]?$/.test(trimmed) || // 101, 101A
    /^[DP]\d{1,2}$/.test(trimmed) // D11, P03
  ) && !["NAM", "AND", "THE", "FOR", "HIM", "HER", "YOU", "GUY"].includes(trimmed); // Exclude common false positives
};

/**
 * Helper to check and convert potential room number from phonetic text
 */
export const extractRoomNumberFromPhonetic = (text: string): string | null => {
  const converted = convertSpokenToNumber(text);
  if (looksLikeRoomNumber(converted)) return converted;

  // Try finding patterns in converted text
  const match = converted.match(/\b([A-Z]\d{1,3}|\d{3,4})\b/);
  if (match) return match[1];

  return null;
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
 * Process transcript with AI parsing and database validation
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

  // 1. STT & Normalization
  const normalizedText = normalizeTranscript(text);
  console.log("[VoiceParsing] Original:", text);
  console.log("[VoiceParsing] Normalized:", normalizedText);

  if (!normalizedText || normalizedText.length < 5) {
    callbacks.onError("Câu nói quá ngắn hoặc không rõ ràng. Vui lòng thử lại.");
    return null;
  }

  try {
    // 2. Entity Extraction (Gemini)
    let parsedData;
    try {
      parsedData = await parseRideRequestWithContext(normalizedText, locations);
    } catch (aiError) {
      console.error("AI parsing error:", aiError);
      callbacks.onError("Lỗi khi kết nối với AI. Đang sử dụng phương pháp dự phòng...");
      parsedData = parseVoiceTranscript(normalizedText, locations);
    }

    if (!parsedData || (parsedData.status === "invalid" && !parsedData.pickup && !parsedData.dropoff)) {
      callbacks.onError("Không tìm thấy thông tin điểm đi hoặc điểm đến. Vui lòng nói lại rõ ràng hơn.");
      return null;
    }

    // 3. Database Validation (Đối soát Database)
    let finalRoomNumber = existingData?.roomNumber;

    const findBestMatch = (term: string) => {
      if (!term) return null;
      const termUpper = term.toUpperCase().trim();

      // Match by code (ACC, ICP) or exact name
      const match = locations.find(l =>
        l.name.toUpperCase() === termUpper ||
        (l.name === "Asian Civic Center" && termUpper === "ACC") ||
        (l.name === "International Convention Palace" && termUpper === "ICP") ||
        l.id?.toUpperCase() === termUpper
      );
      if (match) return match.name;

      // Match by room number pattern
      if (looksLikeRoomNumber(term)) return termUpper;

      return null;
    };

    const resolvedPickup = findBestMatch(parsedData.pickup);
    const resolvedDropoff = findBestMatch(parsedData.dropoff);

    // If pickup is a room number, update roomNumber field
    if (resolvedPickup && looksLikeRoomNumber(resolvedPickup)) {
      finalRoomNumber = resolvedPickup;
    }

    const finalData: ParsedVoiceData = {
      roomNumber: finalRoomNumber,
      pickup: resolvedPickup || parsedData.pickup,
      destination: resolvedDropoff || parsedData.dropoff || parsedData.destination,
      guestCount: parsedData.passengers || parsedData.guestCount || 1,
      notes: parsedData.notes || existingData?.notes,
    };

    // Check if we have minimum required fields for "Action"
    if (finalData.pickup && finalData.destination) {
      callbacks.onSuccess(finalData);
      return finalData;
    } else {
      const found: string[] = [];
      const missing: string[] = [];
      if (finalData.pickup) found.push("điểm đón"); else missing.push("điểm đón");
      if (finalData.destination) found.push("điểm đến"); else missing.push("điểm đến");

      callbacks.onPartialSuccess(finalData, found, missing);
      return finalData;
    }
  } catch (e) {
    console.error("Process Transcript Error:", e);
    callbacks.onError("Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại.");
    return null;
  }
};

