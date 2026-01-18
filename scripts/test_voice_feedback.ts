
import { processTranscript, ParsedVoiceData } from '../services/voiceParsingService';
import { Location } from '../types';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const mockLocations: Location[] = [
    { id: '1', name: 'Main Lobby', type: 'FACILITY', lat: 0, lng: 0 },
    { id: '2', name: 'Lagoon Pool', type: 'FACILITY', lat: 0, lng: 0 },
];

const mockCallbacks = {
    onSuccess: (data: ParsedVoiceData) => console.log('SUCCESS:', data),
    onError: (msg: string) => console.log('ERROR:', msg),
    onPartialSuccess: (data: ParsedVoiceData, found: string[], missing: string[]) => {
        console.log('PARTIAL:', {
            data,
            found,
            missing
        });
    }
};

async function run() {
    console.log('--- Test 1: Full Command (Fallback) ---');
    // Note: AI might fail if no key, falling back to keyword matching
    await processTranscript("room 101 go to lobby", mockLocations, mockCallbacks);

    console.log('\n--- Test 2: Partial Command (Missing Dest) ---');
    await processTranscript("room 101", mockLocations, mockCallbacks);

    console.log('\n--- Test 3: Partial Command (Missing Room) ---');
    await processTranscript("go to lobby", mockLocations, mockCallbacks);

    console.log('\n--- Test 4: Partial Command (Missing Pickup & Room) ---');
    await processTranscript("go to lobby", mockLocations, mockCallbacks);
}

run();
