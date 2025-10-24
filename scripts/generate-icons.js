const fs = require('fs');
const path = require('path');

// Simple SVG to use as icon source
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="${size * 0.4}"
        font-weight="bold" fill="white">SL</text>
</svg>
`;

const publicDir = path.join(__dirname, '../public');

// Create simple text-based icons for PWA
// In production, these should be replaced with actual designed icons
fs.writeFileSync(
  path.join(publicDir, 'icon.svg'),
  createSVG(512)
);

console.log('✓ Created icon.svg');
console.log('');
console.log('Note: icon.svg has been created as a placeholder.');
console.log('For production, please create proper PNG icons:');
console.log('  - icon-192.png (192x192)');
console.log('  - icon-512.png (512x512)');
console.log('');
console.log('You can use online tools to convert the SVG to PNG at the required sizes,');
console.log('or use a design tool like Figma/Sketch to create proper branded icons.');
