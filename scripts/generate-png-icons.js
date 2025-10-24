const fs = require('fs');
const path = require('path');

// This script creates placeholder PNG icons using data URIs
// For production, use a proper design tool or online converter

const sizes = [192, 512];

const createPNGDataURI = (size) => {
  // Create a simple colored square as base64 PNG
  // This is a minimal PNG with blue background and "SL" text representation

  const canvas = `
  <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background with gradient -->
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>

    <!-- Decorative circles -->
    <circle cx="${size * 0.25}" cy="${size * 0.25}" r="${size * 0.08}" fill="#3b82f6" opacity="0.3"/>
    <circle cx="${size * 0.75}" cy="${size * 0.75}" r="${size * 0.08}" fill="#3b82f6" opacity="0.3"/>

    <!-- Calendar icon -->
    <rect x="${size * 0.27}" y="${size * 0.31}" width="${size * 0.45}" height="${size * 0.45}" rx="${size * 0.03}" fill="white"/>
    <rect x="${size * 0.27}" y="${size * 0.31}" width="${size * 0.45}" height="${size * 0.12}" rx="${size * 0.03}" fill="#1e40af"/>
    <rect x="${size * 0.33}" y="${size * 0.28}" width="${size * 0.04}" height="${size * 0.08}" rx="${size * 0.02}" fill="#1e40af"/>
    <rect x="${size * 0.63}" y="${size * 0.28}" width="${size * 0.04}" height="${size * 0.08}" rx="${size * 0.02}" fill="#1e40af"/>

    <!-- Calendar dots -->
    <circle cx="${size * 0.35}" cy="${size * 0.49}" r="${size * 0.015}" fill="#2563eb"/>
    <circle cx="${size * 0.43}" cy="${size * 0.49}" r="${size * 0.015}" fill="#2563eb"/>
    <circle cx="${size * 0.51}" cy="${size * 0.49}" r="${size * 0.015}" fill="#2563eb"/>
    <circle cx="${size * 0.59}" cy="${size * 0.49}" r="${size * 0.015}" fill="#2563eb"/>
    <circle cx="${size * 0.67}" cy="${size * 0.49}" r="${size * 0.015}" fill="#2563eb"/>

    <circle cx="${size * 0.35}" cy="${size * 0.57}" r="${size * 0.015}" fill="#2563eb"/>
    <circle cx="${size * 0.43}" cy="${size * 0.57}" r="${size * 0.015}" fill="#2563eb"/>
    <circle cx="${size * 0.51}" cy="${size * 0.57}" r="${size * 0.02}" fill="#ef4444"/>
    <circle cx="${size * 0.59}" cy="${size * 0.57}" r="${size * 0.015}" fill="#2563eb"/>
    <circle cx="${size * 0.67}" cy="${size * 0.57}" r="${size * 0.015}" fill="#2563eb"/>

    <circle cx="${size * 0.35}" cy="${size * 0.65}" r="${size * 0.015}" fill="#2563eb"/>
    <circle cx="${size * 0.43}" cy="${size * 0.65}" r="${size * 0.015}" fill="#2563eb"/>
    <circle cx="${size * 0.51}" cy="${size * 0.65}" r="${size * 0.015}" fill="#2563eb"/>
    <circle cx="${size * 0.59}" cy="${size * 0.65}" r="${size * 0.015}" fill="#2563eb"/>

    <!-- Ticket icon -->
    <g transform="translate(${size * 0.68}, ${size * 0.59})">
      <path d="M 0 0 L ${size * 0.16} 0 L ${size * 0.16} ${size * 0.03} Q ${size * 0.14} ${size * 0.03} ${size * 0.14} ${size * 0.05} Q ${size * 0.14} ${size * 0.07} ${size * 0.16} ${size * 0.07} L ${size * 0.16} ${size * 0.1} L 0 ${size * 0.1} L 0 ${size * 0.07} Q ${size * 0.02} ${size * 0.07} ${size * 0.02} ${size * 0.05} Q ${size * 0.02} ${size * 0.03} 0 ${size * 0.03} Z"
            fill="#fbbf24" stroke="#f59e0b" stroke-width="${size * 0.004}"/>
      <line x1="${size * 0.03}" y1="${size * 0.03}" x2="${size * 0.13}" y2="${size * 0.03}" stroke="#f59e0b" stroke-width="${size * 0.004}"/>
      <line x1="${size * 0.03}" y1="${size * 0.05}" x2="${size * 0.13}" y2="${size * 0.05}" stroke="#f59e0b" stroke-width="${size * 0.004}"/>
      <line x1="${size * 0.03}" y1="${size * 0.07}" x2="${size * 0.13}" y2="${size * 0.07}" stroke="#f59e0b" stroke-width="${size * 0.004}"/>
    </g>
  </svg>
  `.trim();

  return canvas;
};

console.log('Generating PWA icon files...\n');

sizes.forEach(size => {
  const svgContent = createPNGDataURI(size);
  const filename = `icon-${size}.svg`;
  const filepath = path.join(__dirname, '../public', filename);

  fs.writeFileSync(filepath, svgContent);
  console.log(`✓ Created ${filename} (${size}x${size})`);
});

console.log('\n✓ Icon generation complete!');
console.log('\nNote: These are SVG icons. For production PNG icons:');
console.log('1. Use an online SVG to PNG converter (e.g., https://svgtopng.com)');
console.log('2. Convert icon-192.svg to icon-192.png');
console.log('3. Convert icon-512.svg to icon-512.png');
console.log('4. Replace the SVG icons in public/ with the PNG versions');
console.log('5. Update manifest.json to use .png extensions\n');
