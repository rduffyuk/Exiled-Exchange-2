#!/usr/bin/env node

/**
 * Safe Data Parser for Exiled Exchange 2
 * Compliant with GGG Terms of Service
 * 
 * This script provides safe methods to update item data
 * without violating ToS or risking bans
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class SafeDataParser {
  constructor() {
    this.dataFile = path.join(__dirname, 'dataParser/vendor/client/overrideData/data.txt');
    this.pendingFile = path.join(__dirname, 'pending_items.txt');
    this.backupDir = path.join(__dirname, 'dataParser/backups');
    
    // Rate limiter for any external API calls
    this.rateLimiter = {
      requests: [],
      maxRequests: 5,  // Conservative limit
      timeWindow: 10000  // 10 seconds
    };
  }

  /**
   * SAFE: Parse item from clipboard (user manually copies)
   */
  parseClipboardItem(clipboardText) {
    const lines = clipboardText.trim().split('\n');
    if (lines.length < 2) return null;
    
    const itemName = lines[0];
    const itemType = lines[1];
    const stats = lines.slice(2);
    
    return {
      name: itemName,
      type: itemType,
      stats: stats,
      source: 'clipboard',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * SAFE: Add item manually with user confirmation
   */
  async addItemManually() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n=== Safe Manual Item Addition ===');
    console.log('This method is 100% ToS compliant\n');
    
    const item = {};
    
    item.name = await this.question(rl, 'Item name: ');
    item.type = await this.question(rl, 'Item type (e.g., "Two Hand Sword"): ');
    
    const stats = [];
    console.log('Enter item stats (empty line to finish):');
    
    let stat;
    while ((stat = await this.question(rl, 'Stat: ')) !== '') {
      stats.push(stat);
    }
    item.stats = stats;
    
    // Show preview
    console.log('\n--- Item Preview ---');
    console.log(item.name);
    console.log(item.type);
    item.stats.forEach(s => console.log(s));
    console.log('-------------------\n');
    
    const confirm = await this.question(rl, 'Add this item? (y/n): ');
    
    if (confirm.toLowerCase() === 'y') {
      this.saveItem(item);
      console.log('✅ Item added successfully!');
    } else {
      console.log('❌ Item addition cancelled.');
    }
    
    rl.close();
  }

  /**
   * SAFE: Import community-maintained data
   */
  async importCommunityData(jsonFile) {
    console.log('\n=== Importing Community Data ===');
    console.log('Source:', jsonFile);
    
    try {
      const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      
      console.log(`Found ${data.items.length} items`);
      console.log('This data will be reviewed before adding.\n');
      
      // Save to pending file for manual review
      data.items.forEach(item => {
        const entry = `\n# Pending Review - ${item.source || 'Community'}\n`;
        fs.appendFileSync(this.pendingFile, entry);
        fs.appendFileSync(this.pendingFile, `${item.name}\n`);
        fs.appendFileSync(this.pendingFile, `${item.type}\n`);
        item.stats.forEach(stat => {
          fs.appendFileSync(this.pendingFile, `${stat}\n`);
        });
      });
      
      console.log(`✅ ${data.items.length} items saved for review`);
      console.log(`Review at: ${this.pendingFile}`);
      
    } catch (error) {
      console.error('❌ Error importing data:', error.message);
    }
  }

  /**
   * SAFE: Search for missing items and log them
   */
  logMissingItem(itemName, context = '') {
    const logEntry = {
      name: itemName,
      context: context,
      timestamp: new Date().toISOString(),
      reported: false
    };
    
    const missingLog = path.join(__dirname, 'missing_items.log');
    fs.appendFileSync(missingLog, JSON.stringify(logEntry) + '\n');
    
    console.log(`📝 Logged missing item: ${itemName}`);
  }

  /**
   * SAFE: Validate data format
   */
  validateItemFormat(item) {
    const errors = [];
    
    if (!item.name || item.name.trim() === '') {
      errors.push('Item name is required');
    }
    
    if (!item.type || item.type.trim() === '') {
      errors.push('Item type is required');
    }
    
    if (item.name && item.name.length > 100) {
      errors.push('Item name seems too long (possible error)');
    }
    
    // Check for suspicious patterns that might indicate scraped data
    if (item.source && item.source.includes('automated')) {
      errors.push('⚠️  Automated sources not allowed per ToS');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * SAFE: Rate-limited API call example
   */
  async safeAPICall(endpoint, data) {
    // Check rate limit
    const now = Date.now();
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      t => now - t < this.rateLimiter.timeWindow
    );
    
    if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
      console.log('⏳ Rate limit reached, waiting...');
      const waitTime = this.rateLimiter.timeWindow - (now - this.rateLimiter.requests[0]);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Track this request
    this.rateLimiter.requests.push(now);
    
    console.log(`API calls: ${this.rateLimiter.requests.length}/${this.rateLimiter.maxRequests}`);
    
    // Make the actual call here (example only)
    // const response = await fetch(endpoint, { ... });
    
    return { success: true, message: 'Rate-limited call successful' };
  }

  /**
   * SAFE: Backup data before changes
   */
  backupData() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFile = path.join(this.backupDir, `data_${timestamp}.txt`);
    
    fs.copyFileSync(this.dataFile, backupFile);
    console.log(`✅ Backup created: ${backupFile}`);
    
    return backupFile;
  }

  /**
   * SAFE: Save item to database
   */
  saveItem(item) {
    // Create backup first
    this.backupData();
    
    // Validate item
    const validation = this.validateItemFormat(item);
    if (!validation.valid) {
      console.error('❌ Item validation failed:', validation.errors);
      return false;
    }
    
    // Append to data file
    let content = '\n';
    content += item.name + '\n';
    content += item.type + '\n';
    item.stats.forEach(stat => {
      content += stat + '\n';
    });
    
    fs.appendFileSync(this.dataFile, content);
    
    // Log the addition
    const auditLog = path.join(__dirname, 'data_audit.log');
    const auditEntry = {
      action: 'add_item',
      item: item.name,
      timestamp: new Date().toISOString(),
      method: 'manual'
    };
    fs.appendFileSync(auditLog, JSON.stringify(auditEntry) + '\n');
    
    return true;
  }

  /**
   * Helper function for readline
   */
  question(rl, prompt) {
    return new Promise(resolve => {
      rl.question(prompt, resolve);
    });
  }

  /**
   * Show compliance information
   */
  showCompliance() {
    console.log('\n' + '='.repeat(50));
    console.log('GGG TERMS OF SERVICE COMPLIANCE');
    console.log('='.repeat(50));
    console.log('\n✅ SAFE Methods Used:');
    console.log('  • Manual data entry');
    console.log('  • Clipboard parsing (user-initiated)');
    console.log('  • Community data with review');
    console.log('  • Rate-limited API calls');
    console.log('  • Data validation and backups');
    console.log('\n❌ NOT Used (Ban Risk):');
    console.log('  • Automated web scraping');
    console.log('  • Game file extraction');
    console.log('  • Memory reading');
    console.log('  • API abuse or bypass');
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

// CLI Interface
async function main() {
  const parser = new SafeDataParser();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    parser.showCompliance();
    console.log('Usage:');
    console.log('  node safe-data-parser.js add        - Add item manually');
    console.log('  node safe-data-parser.js import <file> - Import community data');
    console.log('  node safe-data-parser.js missing <name> - Log missing item');
    console.log('  node safe-data-parser.js compliance - Show ToS compliance info');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'add':
      await parser.addItemManually();
      break;
      
    case 'import':
      if (args[1]) {
        await parser.importCommunityData(args[1]);
      } else {
        console.error('Please provide a JSON file to import');
      }
      break;
      
    case 'missing':
      if (args[1]) {
        parser.logMissingItem(args[1], args[2] || '');
      } else {
        console.error('Please provide an item name');
      }
      break;
      
    case 'compliance':
      parser.showCompliance();
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SafeDataParser;