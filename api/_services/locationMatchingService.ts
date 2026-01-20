import { Location } from "../../types";

/**
 * Intelligent Location Matching Service
 * Combines exact matching, fuzzy search, and context-aware ranking
 */

export interface LocationMatchRequest {
    userInput: string;
    allLocations: Location[];
    context?: {
        previousPickup?: string;
        previousDestination?: string;
        currentStep?: "pickup" | "destination";
    };
}

export interface LocationMatch {
    location: Location;
    confidence: number; // 0-100
    reason:
    | "exact_match"
    | "exact_id_match"
    | "fuzzy_match"
    | "type_match"
    | "context_boost";
    matchedTerm?: string;
}

export interface LocationMatchResponse {
    matches: LocationMatch[];
    topSuggestion: Location | null;
    alternatives: Location[];
    hasExactMatch: boolean;
}

/**
 * Calculate Levenshtein distance for fuzzy matching
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
 * Calculate similarity score (0-100)
 */
function similarityScore(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 100;
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return Math.round((1 - distance / maxLen) * 100);
}

/**
 * Normalize Vietnamese text for matching
 */
function normalizeVietnamese(text: string): string {
    return text
        .normalize("NFC")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

/**
 * Synonym map for common Vietnamese location terms
 */
const SYNONYM_MAP: Record<string, string[]> = {
    "Main Lobby": [
        "lễ tân",
        "sảnh",
        "lobby",
        "reception",
        "tiền sảnh",
        "lễ tân chính",
    ],
    "Lagoon Pool": ["hồ bơi", "pool", "bể bơi", "hồ"],
    "Beach Access": ["biển", "bãi biển", "beach", "bờ biển"],
    "Don Cipriani's Italian Restaurant": [
        "nhà hàng ý",
        "italian",
        "don cipriani",
        "cipriani",
        "ý",
    ],
    "Cafe Indochine": [
        "nhà hàng",
        "cafe indochine",
        "indochine",
        "đông dương",
    ],
    "International Convention Palace": ["icp", "hội nghị", "convention"],
    "Asian Civic Center": ["acc", "nhà hàng châu á", "asian center"],
};

/**
 * Get location type for context-aware ranking
 */
function getLocationType(location: Location): string {
    if (location.type) return location.type;

    const name = location.name.toLowerCase();
    if (
        name.includes("restaurant") ||
        name.includes("nhà hàng") ||
        name.includes("cafe")
    )
        return "RESTAURANT";
    if (
        name.includes("pool") ||
        name.includes("hồ bơi") ||
        name.includes("spa")
    )
        return "FACILITY";
    if (name.includes("villa") || name.includes("biệt thự")) return "VILLA";
    if (name.includes("lobby") || name.includes("reception")) return "LOBBY";
    if (name.includes("beach") || name.includes("biển")) return "BEACH";

    return "OTHER";
}

/**
 * Context-aware boost scoring
 */
function getContextBoost(
    location: Location,
    context?: LocationMatchRequest["context"]
): number {
    if (!context) return 0;

    const locationType = getLocationType(location);
    let boost = 0;

    // If previous pickup was a villa, boost restaurants and facilities
    if (context.previousPickup) {
        const pickupType = context.previousPickup.toLowerCase();
        if (
            (pickupType.includes("villa") ||
                pickupType.includes("room") ||
                /^[A-Z]\d{1,3}$/.test(context.previousPickup)) &&
            (locationType === "RESTAURANT" || locationType === "FACILITY")
        ) {
            boost += 15;
        }
    }

    // If asking for destination and pickup was lobby, boost facilities/restaurants
    if (
        context.currentStep === "destination" &&
        context.previousPickup?.toLowerCase().includes("lobby")
    ) {
        if (locationType === "RESTAURANT" || locationType === "FACILITY") {
            boost += 10;
        }
    }

    return boost;
}

/**
 * Main smart matching function
 */
export async function smartMatchLocation(
    request: LocationMatchRequest
): Promise<LocationMatchResponse> {
    const { userInput, allLocations, context } = request;

    if (!userInput || userInput.trim().length === 0) {
        return {
            matches: [],
            topSuggestion: null,
            alternatives: [],
            hasExactMatch: false,
        };
    }

    const normalizedInput = normalizeVietnamese(userInput);
    const matches: LocationMatch[] = [];

    // Step 1: Check for exact match by ID (e.g., "ACC", "ICP", "D1")
    for (const location of allLocations) {
        if (location.id && normalizedInput === location.id.toLowerCase()) {
            matches.push({
                location,
                confidence: 100,
                reason: "exact_id_match",
                matchedTerm: location.id,
            });
        }
    }

    // Step 2: Check for exact name match
    for (const location of allLocations) {
        const normalizedName = normalizeVietnamese(location.name);
        if (normalizedName === normalizedInput) {
            const contextBoost = getContextBoost(location, context);
            matches.push({
                location,
                confidence: Math.min(100, 95 + contextBoost),
                reason: "exact_match",
                matchedTerm: location.name,
            });
        }
    }

    // Step 3: Check synonym map
    for (const [targetName, synonyms] of Object.entries(SYNONYM_MAP)) {
        for (const synonym of synonyms) {
            if (normalizedInput.includes(synonym) || synonym.includes(normalizedInput)) {
                const location = allLocations.find((l) => l.name === targetName);
                if (location && !matches.find((m) => m.location.id === location.id)) {
                    const contextBoost = getContextBoost(location, context);
                    matches.push({
                        location,
                        confidence: Math.min(95, 90 + contextBoost),
                        reason: "exact_match",
                        matchedTerm: synonym,
                    });
                }
            }
        }
    }

    // Step 4: Fuzzy matching (Levenshtein distance)
    for (const location of allLocations) {
        // Skip if already matched
        if (matches.find((m) => m.location.id === location.id)) continue;

        const nameScore = similarityScore(normalizedInput, location.name);
        const contextBoost = getContextBoost(location, context);

        if (nameScore >= 70) {
            matches.push({
                location,
                confidence: Math.min(100, nameScore + contextBoost),
                reason: "fuzzy_match",
                matchedTerm: location.name,
            });
        }

        // Also check against ID if exists
        if (location.id) {
            const idScore = similarityScore(normalizedInput, location.id);
            if (idScore >= 70 && !matches.find((m) => m.location.id === location.id)) {
                matches.push({
                    location,
                    confidence: Math.min(100, idScore + contextBoost),
                    reason: "fuzzy_match",
                    matchedTerm: location.id,
                });
            }
        }
    }

    // Step 5: Type-based matching for generic queries
    const typeKeywords: Record<string, string[]> = {
        RESTAURANT: ["nhà hàng", "restaurant", "ăn", "food"],
        FACILITY: ["hồ bơi", "pool", "spa", "gym", "tiện ích"],
        VILLA: ["villa", "biệt thự", "phòng", "room"],
        BEACH: ["biển", "beach", "bãi biển"],
    };

    for (const [type, keywords] of Object.entries(typeKeywords)) {
        if (keywords.some((kw) => normalizedInput.includes(kw))) {
            const typeLocations = allLocations.filter(
                (l) => getLocationType(l) === type
            );
            for (const location of typeLocations) {
                if (!matches.find((m) => m.location.id === location.id)) {
                    const contextBoost = getContextBoost(location, context);
                    matches.push({
                        location,
                        confidence: Math.min(80, 60 + contextBoost),
                        reason: "type_match",
                        matchedTerm: type,
                    });
                }
            }
        }
    }

    // Sort by confidence (descending)
    matches.sort((a, b) => b.confidence - a.confidence);

    // Get top 5 unique matches
    const uniqueMatches: LocationMatch[] = [];
    const seenIds = new Set<string>();

    for (const match of matches) {
        const id = match.location.id || match.location.name;
        if (!seenIds.has(id) && uniqueMatches.length < 5) {
            uniqueMatches.push(match);
            seenIds.add(id);
        }
    }

    const hasExactMatch = uniqueMatches.some(
        (m) => m.confidence >= 95 && m.reason !== "type_match"
    );

    return {
        matches: uniqueMatches,
        topSuggestion: uniqueMatches.length > 0 ? uniqueMatches[0].location : null,
        alternatives: uniqueMatches.slice(1, 4).map((m) => m.location),
        hasExactMatch,
    };
}

/**
 * Get top suggestions for a step (no user input yet)
 */
export function getDefaultSuggestions(
    allLocations: Location[],
    context?: LocationMatchRequest["context"]
): Location[] {
    // If asking for destination after pickup from villa/room, suggest popular destinations
    if (
        context?.currentStep === "destination" &&
        context.previousPickup &&
        /^[A-Z]\d{1,3}$|villa/i.test(context.previousPickup)
    ) {
        const popular = allLocations.filter((l) => {
            const type = getLocationType(l);
            return type === "RESTAURANT" || type === "FACILITY" || type === "BEACH";
        });
        return popular.slice(0, 5);
    }

    // Default: return most common locations
    const priority = [
        "Main Lobby",
        "Asian Civic Center",
        "International Convention Palace",
        "Lagoon Pool",
        "Beach Access",
    ];

    const suggestions: Location[] = [];
    for (const name of priority) {
        const location = allLocations.find((l) => l.name === name);
        if (location) suggestions.push(location);
    }

    return suggestions.length > 0 ? suggestions : allLocations.slice(0, 5);
}
