import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const scale = size / 512;
    
    // Background with rounded corners
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    const radius = 80 * scale;
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
    
    // Decorative border
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 8 * scale;
    ctx.beginPath();
    const borderRadius = 60 * scale;
    const borderMargin = 40 * scale;
    ctx.moveTo(borderMargin + borderRadius, borderMargin);
    ctx.lineTo(size - borderMargin - borderRadius, borderMargin);
    ctx.quadraticCurveTo(size - borderMargin, borderMargin, size - borderMargin, borderMargin + borderRadius);
    ctx.lineTo(size - borderMargin, size - borderMargin - borderRadius);
    ctx.quadraticCurveTo(size - borderMargin, size - borderMargin, size - borderMargin - borderRadius, size - borderMargin);
    ctx.lineTo(borderMargin + borderRadius, size - borderMargin);
    ctx.quadraticCurveTo(borderMargin, size - borderMargin, borderMargin, size - borderMargin - borderRadius);
    ctx.lineTo(borderMargin, borderMargin + borderRadius);
    ctx.quadraticCurveTo(borderMargin, borderMargin, borderMargin + borderRadius, borderMargin);
    ctx.closePath();
    ctx.stroke();
    
    // Letter F (using text)
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${280 * scale}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', size / 2, size / 2 + 40 * scale);
    
    // Decorative line under F
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 12 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(120 * scale, 380 * scale);
    ctx.lineTo(392 * scale, 380 * scale);
    ctx.stroke();
    
    // Decorative circles
    ctx.fillStyle = '#fbbf24';
    ctx.globalAlpha = 0.8;
    const circlePositions = [
        [150 * scale, 150 * scale, 20 * scale],
        [362 * scale, 150 * scale, 20 * scale],
        [150 * scale, 362 * scale, 20 * scale],
        [362 * scale, 362 * scale, 20 * scale]
    ];
    circlePositions.forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    
    return canvas;
}

function generateIcons() {
    console.log('🎨 Generating icons...');
    
    // Create public directory if it doesn't exist
    const publicDir = join(__dirname, 'public');
    
    // Generate 192x192 icon
    const icon192 = drawIcon(192);
    const icon192Path = join(publicDir, 'icon-192x192.png');
    writeFileSync(icon192Path, icon192.toBuffer('image/png'));
    console.log('✅ Created:', icon192Path);
    
    // Generate 512x512 icon
    const icon512 = drawIcon(512);
    const icon512Path = join(publicDir, 'icon-512x512.png');
    writeFileSync(icon512Path, icon512.toBuffer('image/png'));
    console.log('✅ Created:', icon512Path);
    
    console.log('✨ Icons generated successfully!');
}

generateIcons();

















