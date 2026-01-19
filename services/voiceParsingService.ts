import { Location } from "../types";
import { parseRideRequestWithContext } from "./geminiService";

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
 * Normalize transcript text - minimal cleanup before sending to AI
 */
export const normalizeTranscript = (text: string): string => {
  // Unicode normalization (Critical for Vietnamese)
  let processedText = text.normalize("NFC");

  // Basic cleanup: Collapse spaced acronyms (A C C -> ACC, I C P -> ICP)
  // This is a generic fix for STT output, not specific logic
  processedText = processedText.replace(/\b([a-zA-Z])\s+([a-zA-Z])\s+([a-zA-Z])\b/gi, "$1$2$3"); // A B C -> ABC
  processedText = processedText.replace(/\b([a-zA-Z])\s+([a-zA-Z])\b/gi, "$1$2"); // A B -> AB

  // Remove Excessive spaces
  return processedText.replace(/\s+/g, " ").trim();
};

/**
 * Helper to check if text looks like a room number (for final validation)
 */
export const looksLikeRoomNumber = (text: string): boolean => {
  if (!text) return false;
  const trimmed = text.trim().toUpperCase();
  return (
    /^[A-Z]{3}$/.test(trimmed) || // ACC
    /^[A-Z]\d{1,3}$/.test(trimmed) || // D01, B11
    /^[A-Z]?\d{3,4}$/.test(trimmed) || // 101, 1001
    /^[DP]\d{1,2}$/.test(trimmed) // D1, P03
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

  // 1. Basic Normalization
  const normalizedText = normalizeTranscript(text);
  console.log("[VoiceParsing] Sending to Gemini:", normalizedText);

  try {
    // 2. AI Entity Extraction (Delegated entirely to Gemini)
    // The System Prompt in geminiService.ts handles phonetics (nằm -> 5) and logic
    const parsedData = await parseRideRequestWithContext(normalizedText, locations);

    if (!parsedData || (parsedData.status === "invalid" && !parsedData.pickup && !parsedData.dropoff)) {
      callbacks.onError("Không tìm thấy thông tin điểm đi hoặc điểm đến. Vui lòng nói lại rõ ràng hơn.");
      return null;
    }

    // 3. Database Validation (Post-AI Verification)
    let finalRoomNumber = existingData?.roomNumber;

    const findBestMatch = (term: string) => {
      if (!term) return null;
      const termUpper = term.toUpperCase().trim();

      // Exact match or ID match from DB
      const match = locations.find(l =>
        l.name.toUpperCase() === termUpper ||
        l.id?.toUpperCase() === termUpper
      );
      if (match) return match.name;

      // If AI returned a code like "ACC" or "ICP", trust it if valid format
      if (["ACC", "ICP", "LOBBY", "RECEPTION"].includes(termUpper)) return termUpper;

      // If AI returned a valid room number format, trust it
      if (looksLikeRoomNumber(term)) return termUpper;

      return term; // Return original if no strict DB match found (let human dispatch decide)
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
    // Relaxed check: if AI gave us valid pickup/dropoff, we proceed
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

