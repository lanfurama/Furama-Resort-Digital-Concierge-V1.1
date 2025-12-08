// Script to generate SQL UPDATE statements for locations in a square grid layout
// Locations are arranged in a square grid, evenly spaced, ordered by name/number

import pg from 'pg';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';

dotenv.config();

const { Pool } = pg;

// Database connection
if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_NAME || 
    !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('❌ Missing required database environment variables.');
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = { rejectUnauthorized: false };
} else if (process.env.DB_SSL === 'false') {
  dbConfig.ssl = false;
}

const pool = new Pool(dbConfig);

// Extract number from location name (e.g., "D01" -> 1, "R39" -> 39)
function extractNumber(name) {
  const match = name.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

// Sort locations: Facilities first, then by type, then by number
function sortLocations(locations) {
  return locations.sort((a, b) => {
    // First sort by type priority: FACILITY < RESTAURANT < VILLA
    const typeOrder = { 'FACILITY': 1, 'RESTAURANT': 2, 'VILLA': 3 };
    const typeDiff = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
    if (typeDiff !== 0) return typeDiff;
    
    // Then sort by name (alphabetically, which will group by series)
    return a.name.localeCompare(b.name);
  });
}

// Calculate grid dimensions for square layout
function calculateGridSize(count) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
}

// Generate grid coordinates in a square pattern
function generateGridCoordinates(locations, startLat = 16.0500, startLng = 108.1900, spacing = 0.003) {
  const sorted = sortLocations([...locations]);
  const count = sorted.length;
  const { cols, rows } = calculateGridSize(count);
  
  console.log(`   Grid: ${rows} rows × ${cols} cols (${count} items)`);
  
  const coordinates = [];
  
  sorted.forEach((loc, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Calculate position in grid (centered if not full)
    const lat = startLat + (row * spacing);
    const lng = startLng + (col * spacing);
    
    coordinates.push({
      ...loc,
      newLat: lat,
      newLng: lng,
      row: row + 1,
      col: col + 1
    });
  });
  
  return coordinates;
}

async function generateSQL() {
  const client = await pool.connect();
  try {
    console.log('📊 Fetching all locations from database...');
    console.log(`Connecting to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    
    const result = await client.query(`
      SELECT id, name, lat, lng, type 
      FROM locations 
      ORDER BY 
        CASE 
          WHEN type = 'FACILITY' THEN 1
          WHEN type = 'RESTAURANT' THEN 2
          WHEN type = 'VILLA' THEN 3
          ELSE 4
        END,
        name
    `);
    
    const locations = result.rows;
    console.log(`✅ Found ${locations.length} locations`);
    
    // Separate by type
    const facilities = locations.filter(l => l.type === 'FACILITY' || l.type === 'RESTAURANT');
    const villas = locations.filter(l => l.type === 'VILLA');
    
    console.log(`   - Facilities/Restaurants: ${facilities.length}`);
    console.log(`   - Villas: ${villas.length}`);
    
    // Generate coordinates for facilities (top-left area)
    const facilityCoords = generateGridCoordinates(
      facilities,
      16.0530,  // startLat
      108.1940, // startLng
      0.003     // spacing (larger for facilities)
    );
    
    // Generate coordinates for villas (right area, in square grid)
    const villaCoords = generateGridCoordinates(
      villas,
      16.0500,  // startLat (below facilities)
      108.2000, // startLng (to the right)
      0.0025    // spacing (smaller for villas, more compact)
    );
    
    // Generate SQL for facilities
    let facilitiesSQL = `-- SQL UPDATE statements for Facilities and Restaurants
-- Arranged in a square grid layout, ordered by name
-- Generated automatically

`;
    
    facilityCoords.forEach(coord => {
      facilitiesSQL += `UPDATE public.locations 
SET lat = ${coord.newLat.toFixed(6)}, lng = ${coord.newLng.toFixed(6)}
WHERE name = '${coord.name.replace(/'/g, "''")}' AND type = '${coord.type}';

`;
    });
    
    // Generate SQL for villas
    let villasSQL = `-- SQL UPDATE statements for Villas
-- Arranged in a square grid layout, ordered by name
-- Generated automatically

`;
    
    villaCoords.forEach(coord => {
      villasSQL += `UPDATE public.locations 
SET lat = ${coord.newLat.toFixed(6)}, lng = ${coord.newLng.toFixed(6)}
WHERE name = '${coord.name.replace(/'/g, "''")}' AND type = '${coord.type}';

`;
    });
    
    // Add verification queries
    facilitiesSQL += `-- ============================================
-- Verification Query
-- ============================================
-- SELECT name, lat, lng, type 
-- FROM public.locations 
-- WHERE type IN ('FACILITY', 'RESTAURANT')
-- ORDER BY type, name;
`;
    
    villasSQL += `-- ============================================
-- Verification Query
-- ============================================
-- SELECT name, lat, lng, type 
-- FROM public.locations 
-- WHERE type = 'VILLA' 
-- ORDER BY name;
`;
    
    // Write files
    writeFileSync('update_facilities_locations.sql', facilitiesSQL);
    writeFileSync('update_villas_locations.sql', villasSQL);
    
    console.log('\n✅ SQL files generated successfully!');
    console.log(`   - update_facilities_locations.sql (${facilityCoords.length} locations)`);
    console.log(`   - update_villas_locations.sql (${villaCoords.length} locations)`);
    console.log('\n📝 Next steps:');
    console.log('   1. Review the generated SQL files');
    console.log('   2. Run: npm run update-locations');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

generateSQL();
