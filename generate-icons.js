const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'public', 'short-logo.png');
const publicDir = path.join(__dirname, 'public');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 64, name: 'favicon.ico' }, // Will be converted to ICO
  { size: 96, name: 'favicon-96x96.png' },
  { size: 128, name: 'android-chrome-128x128.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 256, name: 'android-chrome-256x256.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

const socialSizes = [
  { size: 1200, name: 'og-image.png' }, // For social sharing
  { size: 600, name: 'twitter-image.png' },
];

async function generateIcons() {
  try {
    console.log('Generating icons from logo...');

    // Generate standard icons
    for (const { size, name } of sizes) {
      const outputPath = path.join(publicDir, name);

      if (name === 'favicon.ico') {
        // For ICO, generate as PNG first
        await sharp(logoPath)
          .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .png()
          .toFile(outputPath);
        console.log(`✓ Generated ${name} (${size}x${size})`);
      } else {
        await sharp(logoPath)
          .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .png()
          .toFile(outputPath);
        console.log(`✓ Generated ${name} (${size}x${size})`);
      }
    }

    // Generate social icons (square format with padding)
    for (const { size, name } of socialSizes) {
      const outputPath = path.join(publicDir, name);
      await sharp(logoPath)
        .resize(Math.floor(size * 0.8), Math.floor(size * 0.8), { fit: 'contain' })
        .extend({
          top: Math.floor(size * 0.1),
          bottom: Math.floor(size * 0.1),
          left: Math.floor(size * 0.1),
          right: Math.floor(size * 0.1),
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${name} (${size}x${size})`);
    }

    // Generate dark version for some platforms
    const darkSizes = [
      { size: 192, name: 'android-chrome-dark-192x192.png' },
      { size: 512, name: 'android-chrome-dark-512x512.png' },
    ];

    for (const { size, name } of darkSizes) {
      const outputPath = path.join(publicDir, name);
      await sharp(logoPath)
        .resize(size, size, { fit: 'contain', background: { r: 20, g: 20, b: 20, alpha: 1 } })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${name} (${size}x${size}) - dark background`);
    }

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
