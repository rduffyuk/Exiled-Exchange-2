#!/usr/bin/env node

/**
 * Enhanced Features Enabler for Exiled Exchange 2
 * Automatically enables advanced features for power users
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Determine config path based on OS
const configDir = path.join(os.homedir(), '.config', 'exiled-exchange-2', 'apt-data');
const configPath = path.join(configDir, 'config.json');
const backupPath = path.join(configDir, `config.backup.${Date.now()}.json`);

console.log('\n' + '='.repeat(60));
console.log('🚀 EXILED EXCHANGE 2 - ENHANCED FEATURES ENABLER');
console.log('='.repeat(60) + '\n');

// Check if config exists
if (!fs.existsSync(configPath)) {
  console.error('❌ Config file not found at:', configPath);
  console.log('Please run the application once to generate the config file.\n');
  process.exit(1);
}

// Read current config
let config;
try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configContent);
  console.log('✅ Config file loaded successfully');
} catch (error) {
  console.error('❌ Failed to parse config file:', error.message);
  process.exit(1);
}

// Create backup
try {
  fs.copyFileSync(configPath, backupPath);
  console.log('✅ Backup created at:', backupPath);
} catch (error) {
  console.error('⚠️  Warning: Could not create backup:', error.message);
}

// Track changes
const changes = [];

// Enable Price Check Features
const priceCheck = config.widgets?.find(w => w.wmType === 'price-check');
if (priceCheck) {
  const enhancements = {
    requestPricePrediction: true,      // AI price predictions
    usePseudo: true,                   // Pseudo-stat filtering
    showRateLimitState: true,          // Show API rate limits
    autoFillEmptyRuneSockets: true,    // Auto-fill rune sockets
    alwaysShowTier: true,              // Always show tiers
    smartInitialSearch: true,          // Smart search
    activateStockFilter: true,         // Stock filtering
    searchStatRange: 20,               // Stat range for searches
    chaosPriceThreshold: 1,            // Min chaos value to show
    showSeller: true,                  // Show seller info
    apiLatencySeconds: 1               // Reduce API latency
  };
  
  Object.entries(enhancements).forEach(([key, value]) => {
    if (priceCheck[key] !== value) {
      priceCheck[key] = value;
      changes.push(`  • Price Check: ${key} = ${value}`);
    }
  });
  
  console.log('✅ Price check features enhanced');
} else {
  console.log('⚠️  Price check widget not found');
}

// Enable Item Check External Tools
const itemCheck = config.widgets?.find(w => w.wmType === 'item-check');
if (itemCheck) {
  const hotkeys = {
    wikiKey: 'Alt + W',               // Wiki hotkey
    poedbKey: 'Alt + B',              // PoEDB hotkey
    // craftOfExileKey: 'Alt + C',    // Uncomment if needed
  };
  
  Object.entries(hotkeys).forEach(([key, value]) => {
    if (itemCheck[key] !== value) {
      itemCheck[key] = value;
      changes.push(`  • Item Check: ${key} = ${value}`);
    }
  });
  
  console.log('✅ External tool hotkeys configured');
} else {
  console.log('⚠️  Item check widget not found');
}

// Enable Item Search OCR
const itemSearch = config.widgets?.find(w => w.wmType === 'item-search');
if (itemSearch) {
  if (!itemSearch.ocrGemsKey) {
    itemSearch.ocrGemsKey = 'Alt + G';
    changes.push('  • Item Search: OCR gems hotkey = Alt + G');
  }
  console.log('✅ OCR features configured');
}

// Enable Stash Search
const stashSearch = config.widgets?.find(w => w.wmType === 'stash-search');
if (stashSearch && !stashSearch.hotkey) {
  stashSearch.hotkey = 'Alt + F';
  changes.push('  • Stash Search: hotkey = Alt + F');
  console.log('✅ Stash search hotkey configured');
}

// Enable useful global settings
const globalSettings = {
  restoreClipboard: true,            // Restore clipboard after operations
  stashScroll: true,                 // Enable stash scrolling
  fontSize: 16,                      // Comfortable font size
  overlayBackgroundClose: true,      // Click background to close
  showAttachNotification: false      // Reduce notifications
};

Object.entries(globalSettings).forEach(([key, value]) => {
  if (config[key] !== value) {
    config[key] = value;
    changes.push(`  • Global: ${key} = ${value}`);
  }
});

// Add useful commands if not present
const defaultCommands = [
  { text: '/hideout', hotkey: 'F5', send: true },
  { text: '/exit', hotkey: 'F9', send: true },
  { text: '@last ty', hotkey: null, send: true },
  { text: '/invite @last', hotkey: null, send: true },
  { text: '/dnd', hotkey: 'F6', send: true }
];

defaultCommands.forEach(cmd => {
  const exists = config.commands?.some(c => c.text === cmd.text);
  if (!exists && config.commands) {
    config.commands.push(cmd);
    changes.push(`  • Command added: ${cmd.text}`);
  }
});

// Save enhanced config
if (changes.length > 0) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('\n✅ Configuration saved with', changes.length, 'enhancements:\n');
    changes.forEach(change => console.log(change));
  } catch (error) {
    console.error('❌ Failed to save config:', error.message);
    process.exit(1);
  }
} else {
  console.log('\n✨ All features already enabled!');
}

// Show summary
console.log('\n' + '='.repeat(60));
console.log('📊 FEATURE STATUS SUMMARY');
console.log('='.repeat(60));

const features = {
  'AI Price Predictions': priceCheck?.requestPricePrediction,
  'Pseudo Stats': priceCheck?.usePseudo,
  'Rate Limit Display': priceCheck?.showRateLimitState,
  'Auto-fill Runes': priceCheck?.autoFillEmptyRuneSockets,
  'Wiki Hotkey': itemCheck?.wikiKey,
  'PoEDB Hotkey': itemCheck?.poedbKey,
  'OCR Gems': itemSearch?.ocrGemsKey,
  'Stash Search': stashSearch?.hotkey,
  'Clipboard Restore': config.restoreClipboard,
  'Smart Search': priceCheck?.smartInitialSearch
};

Object.entries(features).forEach(([feature, status]) => {
  const icon = status ? '✅' : '❌';
  const value = typeof status === 'string' ? `: ${status}` : '';
  console.log(`${icon} ${feature}${value}`);
});

// Show hotkey summary
console.log('\n' + '='.repeat(60));
console.log('⌨️  HOTKEY CONFIGURATION');
console.log('='.repeat(60));

const hotkeys = [
  ['Price Check', priceCheck?.hotkey || 'Alt + D'],
  ['Wiki Lookup', itemCheck?.wikiKey || 'Not set'],
  ['PoEDB Lookup', itemCheck?.poedbKey || 'Not set'],
  ['OCR Gems', itemSearch?.ocrGemsKey || 'Not set'],
  ['Stash Search', stashSearch?.hotkey || 'Not set'],
  ['Overlay Toggle', config.overlayKey || 'Shift + Space']
];

hotkeys.forEach(([action, key]) => {
  if (key !== 'Not set') {
    console.log(`  ${action}: ${key}`);
  }
});

// Provide instructions
console.log('\n' + '='.repeat(60));
console.log('💡 NEXT STEPS');
console.log('='.repeat(60));
console.log('\n1. Restart Exiled Exchange 2:');
console.log('   ./auto-update.sh stop');
console.log('   ./auto-update.sh run\n');
console.log('2. Test enhanced features in-game');
console.log('3. Adjust settings via overlay (Shift+Space)');
console.log('4. Rollback if needed:');
console.log(`   cp ${backupPath} ${configPath}`);

console.log('\n✨ Enjoy your enhanced Exiled Exchange 2 experience!\n');