# Safe Data Update Guide for Exiled Exchange 2

## When You Search for Missing Items

### Safe Manual Update Process:

1. **Identify Missing Item**
   ```bash
   # When search fails, note the item name
   Example: "Voidforged Sword" not found
   ```

2. **Research Item Data (Safe Sources)**
   - PoE Wiki (community maintained)
   - Official patch notes
   - Reddit/Forum discussions
   - In-game observation

3. **Add to Database Manually**
   ```bash
   # Edit the data file
   nano dataParser/vendor/client/overrideData/data.txt
   
   # Add item in correct format:
   Voidforged Sword Two Hand Sword
   (200-250)% increased Physical Damage
   Adds (50-100) to (150-200) Physical Damage
   Your Physical Damage can Shock
   ```

4. **Rebuild Application**
   ```bash
   ./auto-update.sh force-build
   ```

## Safe Parsing Methods:

### Method 1: Clipboard Parser (Currently Implemented)
```javascript
// This is SAFE - only reads clipboard data
// User manually copies item text from game
async readItemText() {
  const clipboard = await this.clipboard.readText();
  return this.parseItemFromClipboard(clipboard);
}
```

### Method 2: Community Data Import (Safe)
```bash
#!/bin/bash
# Import community-maintained data files

# Download community database (if available)
wget https://community-site.com/poe2-items.json

# Parse and merge with our data
python3 merge_community_data.py

# Manual review before committing
git diff dataParser/vendor/client/overrideData/data.txt
```

### Method 3: User Contribution System
```javascript
// Allow users to submit missing items
// Store submissions for manual review
function submitMissingItem(itemData) {
  // Save to pending_items.txt for manual review
  fs.appendFileSync('pending_items.txt', itemData);
  console.log('Item submitted for review');
}
```

## What About Dynamic Updates?

### ❌ UNSAFE - Automatic Scraping
```javascript
// DO NOT DO THIS - Ban risk!
async function scrapePoEWebsite() {
  const response = await fetch('https://pathofexile.com/items');
  // Automated scraping = ToS violation
}
```

### ✅ SAFE - Trade API (With Limits)
```javascript
// SAFE if respecting rate limits
// GGG provides official trade API
async function searchTradeAPI(query) {
  // Must implement rate limiting
  await rateLimiter.wait();
  
  // Use official API endpoint
  const response = await fetch('https://www.pathofexile.com/api/trade/search/poe2', {
    method: 'POST',
    headers: {
      'User-Agent': 'ExiledExchange2/1.0',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(query)
  });
  
  // Respect rate limit headers
  const rateLimit = response.headers.get('X-Rate-Limit-Ip');
  await handleRateLimit(rateLimit);
  
  return response.json();
}
```

## Rate Limiting Implementation (Critical for Safety):

```javascript
class RateLimiter {
  constructor() {
    this.requests = [];
    this.maxRequests = 10;  // GGG's limits
    this.timeWindow = 10000; // 10 seconds
  }
  
  async wait() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}
```

## GGG's Official Stance (From ToS):

**Allowed:**
- Using official trade API with rate limiting
- Manual data entry and curation
- Community-sourced databases
- Reading clipboard data (Ctrl+C from game)
- OCR of screenshots (your own gameplay)

**Not Allowed:**
- Automated web scraping
- Reverse engineering game files
- Memory reading/injection
- Bypassing rate limits
- Using undocumented APIs

## Recommended Safe Approach:

1. **Keep current manual database** (what we have)
2. **Add user submission feature** for missing items
3. **Implement trade API search** with proper rate limiting
4. **Community data sharing** (import/export)
5. **Manual review process** for all additions

## Implementation Priority:

1. **High Priority (Safe & Useful)**
   - User submission system for missing items
   - Import/export community data files
   - Manual data entry tools

2. **Medium Priority (Safe with Care)**
   - Trade API integration with rate limiting
   - Community database synchronization
   - Crowdsourced data validation

3. **Never Implement (Ban Risk)**
   - Automated web scraping
   - Game file extraction
   - Memory reading
   - API abuse

## Example: Safe Search Enhancement

```javascript
// Safe implementation for handling missing items
async function enhancedSearch(itemName) {
  // 1. Check local database first
  let result = searchLocalDB(itemName);
  
  if (!result) {
    // 2. Log missing item for later addition
    logMissingItem(itemName);
    
    // 3. Optionally search trade API (with rate limit)
    if (settings.useTradeAPI) {
      result = await searchTradeAPIWithRateLimit(itemName);
    }
    
    // 4. Prompt user to contribute data
    showContributionPrompt(itemName);
  }
  
  return result;
}
```

## Maintaining Compliance:

- ✅ Always attribute data sources
- ✅ Respect rate limits (even if not enforced)
- ✅ Use official APIs when available
- ✅ Manual review of all data additions
- ✅ Document data sources in GGG_COMPLIANCE.md
- ✅ Never automate what should be manual
- ✅ Contribute back to community databases

Remember: It's better to have incomplete data than risk a ban. GGG is generally supportive of community tools that follow their guidelines.