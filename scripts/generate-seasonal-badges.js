/**
 * Seasonal Badge Generator Script
 * 
 * Layers (bottom to top):
 * 1. bg/ - Background based on score range
 * 2. chain/ - Chain logo (avax, base, solana, arbitrum, monad)
 * 3. quarter/ - Quarter overlay (q1, q2, q3, q4)
 * 
 * All images are centered and composited together.
 * 
 * Usage: node scripts/generate-seasonal-badges.js
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asset paths
const ASSETS_DIR = path.join(__dirname, '../public/guud-badges');
const OUTPUT_DIR = path.join(__dirname, '../public/badges/seasonal');

// Score ranges for backgrounds (base tier names)
const SCORE_RANGES = [
  { name: '0-1999', min: 0, max: 1999, baseTier: 'tourist' },
  { name: '2000-3999', min: 2000, max: 3999, baseTier: 'paperhands' },
  { name: '4000-5999', min: 4000, max: 5999, baseTier: 'maxi' },
  { name: '6000-7999', min: 6000, max: 7999, baseTier: 'veteran' },
  { name: '8000-10000', min: 8000, max: 10000, baseTier: 'guudlord' },
];

// Chain-specific tier names
const CHAIN_TIER_NAMES = {
  avax: {
    'tourist': 'tourist',
    'paperhands': 'paperhands',
    'maxi': 'avax-maxi',
    'veteran': 'arena-veteran',
    'guudlord': 'guudlord',
  },
  base: {
    'tourist': 'tourist',
    'paperhands': 'paperhands',
    'maxi': 'base-maxi',
    'veteran': 'virtuals-virgen',
    'guudlord': 'guudlord',
  },
  solana: {
    'tourist': 'tourist',
    'paperhands': 'paperhands',
    'maxi': 'sol-maxi',
    'veteran': 'pumpfun-degen',
    'guudlord': 'guudlord',
  },
  arbitrum: {
    'tourist': 'tourist',
    'paperhands': 'paperhands',
    'maxi': 'arbitrumer',
    'veteran': 'arbitrum-og',
    'guudlord': 'guudlord',
  },
  monad: {
    'tourist': 'tourist',
    'paperhands': 'paperhands',
    'maxi': 'monad-maxi',
    'veteran': 'monad-pioneer',
    'guudlord': 'guudlord',
  },
};

// Chains
const CHAINS = ['avax', 'base', 'solana', 'arbitrum', 'monad'];

// Quarters
const QUARTERS = ['q1', 'q2', 'q3', 'q4'];

// Output size
const OUTPUT_SIZE = 1000;

/**
 * Get tier name for a specific chain
 */
function getTierName(chain, baseTier) {
  return CHAIN_TIER_NAMES[chain]?.[baseTier] || baseTier;
}

/**
 * Get image dimensions
 */
async function getImageDimensions(imagePath) {
  const metadata = await sharp(imagePath).metadata();
  return { width: metadata.width, height: metadata.height };
}

/**
 * Center an image on a canvas
 */
function calculateCenterPosition(canvasSize, imageSize) {
  return Math.floor((canvasSize - imageSize) / 2);
}

/**
 * Generate a single badge by compositing layers
 */
async function generateBadge(bgName, chain, quarter) {
  const bgPath = path.join(ASSETS_DIR, 'bg', `${bgName}.png`);
  const chainPath = path.join(ASSETS_DIR, 'chain', `${chain}.png`);
  const quarterPath = path.join(ASSETS_DIR, 'quarter', `${quarter}.png`);

  // Check if all files exist
  if (!fs.existsSync(bgPath)) {
    console.error(`  ❌ Background not found: ${bgPath}`);
    return null;
  }
  if (!fs.existsSync(chainPath)) {
    console.error(`  ❌ Chain not found: ${chainPath}`);
    return null;
  }
  if (!fs.existsSync(quarterPath)) {
    console.error(`  ❌ Quarter not found: ${quarterPath}`);
    return null;
  }

  try {
    // Get dimensions of each layer
    const bgDim = await getImageDimensions(bgPath);
    const chainDim = await getImageDimensions(chainPath);
    const quarterDim = await getImageDimensions(quarterPath);

    // Use the largest dimension as canvas size
    const canvasSize = Math.max(bgDim.width, bgDim.height, chainDim.width, chainDim.height, quarterDim.width, quarterDim.height);

    // Load and resize background to fill canvas
    const bgBuffer = await sharp(bgPath)
      .resize(canvasSize, canvasSize, { fit: 'cover' })
      .toBuffer();

    // Load chain layer
    const chainBuffer = await sharp(chainPath).toBuffer();
    const chainLeft = calculateCenterPosition(canvasSize, chainDim.width);
    const chainTop = calculateCenterPosition(canvasSize, chainDim.height);

    // Load quarter layer
    const quarterBuffer = await sharp(quarterPath).toBuffer();
    const quarterLeft = calculateCenterPosition(canvasSize, quarterDim.width);
    const quarterTop = calculateCenterPosition(canvasSize, quarterDim.height);

    // Composite all layers
    const composited = await sharp(bgBuffer)
      .composite([
        {
          input: chainBuffer,
          top: chainTop,
          left: chainLeft,
        },
        {
          input: quarterBuffer,
          top: quarterTop,
          left: quarterLeft,
        },
      ])
      .resize(OUTPUT_SIZE, OUTPUT_SIZE)
      .png()
      .toBuffer();

    return composited;
  } catch (error) {
    console.error(`  ❌ Error generating badge: ${error.message}`);
    return null;
  }
}

/**
 * Generate all badge combinations
 */
async function generateAllBadges() {
  console.log('🎨 Seasonal Badge Generator');
  console.log('===========================\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}\n`);
  }

  let generated = 0;
  let failed = 0;

  for (const range of SCORE_RANGES) {
    for (const chain of CHAINS) {
      for (const quarter of QUARTERS) {
        const tierName = getTierName(chain, range.baseTier);
        const outputName = `${chain}_${quarter}_${tierName}.png`;
        const outputPath = path.join(OUTPUT_DIR, outputName);

        console.log(`🔄 Generating: ${outputName}`);

        const buffer = await generateBadge(range.name, chain, quarter);
        
        if (buffer) {
          await sharp(buffer).toFile(outputPath);
          console.log(`  ✅ Saved: ${outputPath}`);
          generated++;
        } else {
          failed++;
        }
      }
    }
  }

  console.log('\n===========================');
  console.log(`✨ Done! Generated: ${generated}, Failed: ${failed}`);
  console.log(`📂 Output: ${OUTPUT_DIR}`);
}

/**
 * Generate a specific badge
 */
async function generateSpecificBadge(scoreRange, chain, quarter, outputName) {
  console.log(`🎨 Generating specific badge: ${outputName}`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const buffer = await generateBadge(scoreRange, chain, quarter);
  
  if (buffer) {
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await sharp(buffer).toFile(outputPath);
    console.log(`✅ Saved: ${outputPath}`);
    return outputPath;
  }
  
  return null;
}

// Run based on command line args
const args = process.argv.slice(2);

if (args.length === 0) {
  // Generate all badges
  generateAllBadges().catch(console.error);
} else if (args.length >= 3) {
  // Generate specific badge: node script.js <scoreRange> <chain> <quarter> [outputName]
  const [scoreRange, chain, quarter, outputName] = args;
  const finalName = outputName || `${chain}_${quarter}_custom.png`;
  generateSpecificBadge(scoreRange, chain, quarter, finalName).catch(console.error);
} else {
  console.log('Usage:');
  console.log('  Generate all: node scripts/generate-seasonal-badges.js');
  console.log('  Generate one: node scripts/generate-seasonal-badges.js <scoreRange> <chain> <quarter> [outputName]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/generate-seasonal-badges.js 6000-7999 avax q1 arena_veteran_q1_avax.png');
  console.log('  node scripts/generate-seasonal-badges.js 8000-10000 solana q2');
}
