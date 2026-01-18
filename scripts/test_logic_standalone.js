
// Standalone test for Voice Parsing Logic (JS version)

// --- COPIED LOGIC FROM voiceParsingService.ts ---

const PHONETIC_MAPPINGS = {
    "niu rai": "new ride", "niu lai": "new ride", "nhiu lai": "new ride",
    "rum": "room", "rùm": "room", "rôm": "room",
    "oan": "1", "uân": "1", "quân": "1",
    "tu": "2", "tư": "4",
    "tri": "3", "tờ ri": "3", "thờ ri": "3",
    "for": "4", "pho": "4", "phò": "4",
    "phai": "5", "phài": "5",
    "xích": "6", "sích": "6",
    "se vần": "7", "xe vần": "7",
    "gâu tu": "go to", "gô tu": "go to",
    "pic úp": "pick up", "bích úp": "pick up", "píc ắp": "pick up",
    "láp to": "lobby", "lốp by": "lobby", "lô bi": "lobby",
    "vui la": "villa", "vi la": "villa", "biệt thự": "villa",
    "bích": "beach", "bít": "beach", "bãi biển": "beach", "ra biển": "to beach",
    "ăn sáng": "restaurant", "ăn tối": "restaurant", "đi ăn": "eat",
    "nhà hàng ý": "italian restaurant",
    "tập gym": "gym", "tập thể dục": "gym",
    "lễ tân": "lobby", "sảnh": "lobby",
};

const VN_DIGITS = {
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

const VN_LETTERS = {
    "a": "A", "bê": "B", "xê": "C", "xi": "C", "đê": "D", "đi": "D",
};

function convertSpokenToNumber(text) {
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

    return processed;
}

const normalizeTranscript = (text) => {
    // Remove common filler words in Vietnamese and English
    // (Simplified for this test)
    let normalized = text.trim();
    normalized = normalized.replace(/\s+/g, " ");

    // Apply Phonetic Mappings FIRST
    for (const [key, value] of Object.entries(PHONETIC_MAPPINGS)) {
        const regex = new RegExp(`(?<=^|\\s)${key}(?=$|\\s)`, "gi");
        normalized = normalized.replace(regex, value);
    }

    return normalized;
};


// --- TEST CASES ---

const testCases = [
    { input: "một linh một", expected: "101", desc: "Vietnamese digits" },
    { input: "hai lẻ năm", expected: "205", desc: "Vietnamese 'lẻ'" },
    { input: "đê ba", expected: "D3", desc: "Vietnamese letter + digit" },
    { input: "một một hai", expected: "112", desc: "Consecutive digits" },
    { input: "D một", expected: "D1", desc: "Letter + digit" }
];

const phoneticCases = [
    { input: "niu rai", expected: "new ride", desc: "Phonetic new ride" },
    { input: "vi la", expected: "villa", desc: "Phonetic villa" },
    { input: "rùm oan", expected: "room 1", desc: "Phonetic room + number fallback logic check" }
];

// Run Tests
console.log("Running Standalone Logic Verification...\n");
let passed = 0;
let failed = 0;

console.log("--- Number Conversion Tests ---");
testCases.forEach(test => {
    const result = convertSpokenToNumber(test.input);
    const isPass = result.includes(test.expected);
    if (result === test.expected || result.includes(test.expected)) {
        console.log(`✅ [PASS] ${test.desc}: "${test.input}" -> "${result}"`);
        passed++;
    } else {
        console.log(`❌ [FAIL] ${test.desc}: "${test.input}" -> "${result}" (Expected to contain "${test.expected}")`);
        failed++;
    }
});

console.log("\n--- Phonetic Mapping Tests ---");
phoneticCases.forEach(test => {
    const result = normalizeTranscript(test.input);
    if (result.includes(test.expected)) {
        console.log(`✅ [PASS] ${test.desc}: "${test.input}" -> "${result}"`);
        passed++;
    } else {
        console.log(`❌ [FAIL] ${test.desc}: "${test.input}" -> "${result}" (Expected to contain "${test.expected}")`);
        failed++;
    }
});

console.log(`\nLogic Verification Results: ${passed} PASSED, ${failed} FAILED`);
