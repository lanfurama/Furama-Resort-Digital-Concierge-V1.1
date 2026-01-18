
import { parseVoiceTranscript, normalizeTranscript } from '../services/voiceParsingService';
import { Location } from '../types';

// Mock Locations based on typical resort data
const mockLocations: Location[] = [
    { id: '1', name: 'Main Lobby', type: 'FACILITY', lat: 0, lng: 0 },
    { id: '2', name: 'Lagoon Pool', type: 'FACILITY', lat: 0, lng: 0 },
    { id: '3', name: 'Ocean Pool', type: 'FACILITY', lat: 0, lng: 0 },
    { id: '4', name: 'Don Cipriani\'s Italian Restaurant', type: 'RESTAURANT', lat: 0, lng: 0 },
    { id: '5', name: 'Cafe Indochine', type: 'RESTAURANT', lat: 0, lng: 0 },
    { id: '6', name: 'Furama Villas Reception', type: 'FACILITY', lat: 0, lng: 0 },
    { id: '7', name: 'Beach', type: 'FACILITY', lat: 0, lng: 0 },
    { id: '8', name: 'Health Club', type: 'FACILITY', lat: 0, lng: 0 },
    // Add some villa locations for completeness if regex checks them
    { id: '9', name: 'Villa D3', type: 'VILLA', lat: 0, lng: 0 },
];


import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const testCases = [
    // 1. Vietnamese Room Numbers & Directions
    {
        input: "Cho xe đón phòng một linh một đi ăn sáng",
        expected: { roomNumber: "101", destination: "Cafe Indochine" } // 'ăn sáng' -> Cafe Indochine
    },
    {
        input: "Đón tại số hai lẻ năm về sảnh",
        expected: { roomNumber: "205", destination: "Main Lobby" }
    },
    {
        input: "Xe bốn chỗ đón khách ở vi la đê ba đi ra hồ bơi",
        expected: { roomNumber: "D3", destination: "Lagoon Pool" } // 'vi la đê ba' -> Villa D3
    },

    // 2. Synonyms & Natural Language
    {
        input: "Đi ăn nhà hàng ý",
        expected: { destination: "Don Cipriani's Italian Restaurant" }
    },
    {
        input: "Về lễ tân",
        expected: { destination: "Main Lobby" }
    },
    {
        input: "Ra biển chơi",
        expected: { destination: "Beach" }
    },
    {
        input: "Đi gym",
        expected: { destination: "Health Club" }
    },

    // 3. English/Bilingual (Phonetic)
    {
        input: "Niu rai rùm oan zia rô oan tu bích",
        expected: { roomNumber: "101", destination: "Beach" } // New ride room 101 to beach
    },
    {
        input: "Pic úp ất sảnh go tu pul",
        expected: { pickup: "Main Lobby", destination: "Lagoon Pool" }
    }
];

async function runTests() {
    console.log("Starting Voice Parsing Verification...\n");
    let passed = 0;
    let failed = 0;

    for (const test of testCases) {
        console.log(`Input: "${test.input}"`);

        // We are testing the FALLBACK logic primarily (simulate AI failure or offline)
        // But we can also simulate the pre-processing that might happen.
        // For now, testing parseVoiceTranscript directly.
        const result = parseVoiceTranscript(test.input, mockLocations);

        let isPass = true;
        const errors: string[] = [];

        if (test.expected.roomNumber && result.roomNumber !== test.expected.roomNumber) {
            isPass = false;
            errors.push(`Expected Room: ${test.expected.roomNumber}, Got: ${result.roomNumber}`);
        }

        if (test.expected.destination && result.destination !== test.expected.destination) {
            isPass = false;
            errors.push(`Expected Destination: ${test.expected.destination}, Got: ${result.destination}`);
        }

        if (test.expected.pickup && result.pickup !== test.expected.pickup) {
            // If expectation is explicit about pickup
            if (test.expected.pickup !== result.pickup) {
                isPass = false;
                errors.push(`Expected Pickup: ${test.expected.pickup}, Got: ${result.pickup}`);
            }
        }

        if (isPass) {
            console.log("✅ PASS");
            passed++;
        } else {
            console.log("❌ FAIL");
            errors.forEach(e => console.log(`   - ${e}`));
            failed++;
        }
        console.log("---------------------------------------------------");
    }

    console.log(`\nResults: ${passed} PASSED, ${failed} FAILED`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
