
import { processTranscript } from '../services/voiceParsingService';
import { Location } from '../types';

// Mock locations
const mockLocations: any[] = [
    { id: '1', name: 'Main Lobby', type: 'FACILITY' },
    { id: '2', name: 'Lagoon Pool', type: 'FACILITY' },
    { id: '3', name: 'V-Senses Wellness & Spa', type: 'FACILITY' },
    { id: '4', name: 'Don Cipriani\'s Italian Restaurant', type: 'RESTAURANT' },
];

const testCases = [
    {
        text: "Nam khách đi từ Lobby đến Pool",
        description: "Scenario: 'Nam' (Name/5 guests) from Lobby to Pool"
    },
    {
        text: "Room 101 đi Spa",
        description: "Scenario: Normal room number"
    },
    {
        text: "ACC đi ăn tối",
        description: "Scenario: Valid 3-letter room code (if ACC is valid)"
    },
    {
        text: "NAM đi spa",
        description: "Scenario: 'NAM' used as room start - should NOT be parsed as room NAM"
    }
];

import * as fs from 'fs';
import * as path from 'path';

const logFile = path.join(process.cwd(), 'test_results.txt');

function log(message: string) {
    console.log(message);
    fs.appendFileSync(logFile, message + '\n');
}

async function runTests() {
    fs.writeFileSync(logFile, "Starting verification for 'Nam' parsing fix...\n");

    for (const test of testCases) {
        log(`Test: ${test.description}`);
        log(`Input: "${test.text}"`);

        await processTranscript(
            test.text,
            mockLocations,
            {
                onSuccess: (data) => {
                    log("Result (Success): " + JSON.stringify(data, null, 2));
                    validateResult(test.text, data);
                },
                onError: (msg) => {
                    log("Result (Error): " + msg);
                },
                onPartialSuccess: (data, found, missing) => {
                    log("Result (Partial): " + JSON.stringify(data, null, 2));
                    log(`Found: ${found.join(', ')}, Missing: ${missing.join(', ')}`);
                    validateResult(test.text, data);
                }
            }
        );
        log("-".repeat(50));
    }
}

function validateResult(input: string, data: any) {
    if (input.includes("Nam khách")) {
        if (data.roomNumber === "NAM" || data.roomNumber === "Nam") {
            log("❌ FAILED: 'Nam' was incorrectly parsed as Room Number!");
        } else {
            log("✅ PASSED: 'Nam' was NOT parsed as Room Number.");
        }
        if (data.pickup === "NAM") {
            log("❌ FAILED: 'Nam' was incorrectly parsed as Pickup!");
        }
    }
    if (input.includes("Room 101")) {
        if (data.roomNumber === "101") {
            log("✅ PASSED: Room 101 correctly parsed.");
        } else {
            log(`❌ FAILED: Expected Room 101, got ${data.roomNumber}`);
        }
    }
    if (input === "NAM đi spa") {
        if (data.roomNumber === "NAM") {
            log("❌ FAILED: 'NAM' parsed as room despite stop list!");
        } else {
            log("✅ PASSED: 'NAM' not parsed as room.");
        }
    }
}

runTests().catch(e => log(e.toString()));
