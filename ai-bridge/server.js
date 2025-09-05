const express = require('express');
const cors = require('cors');
const axios = require('axios');
const winston = require('winston');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const app = express();
const PORT = process.env.PORT || 3001;
const LIBRECHAT_URL = process.env.LIBRECHAT_URL || 'http://localhost:3080';
const POE_TRADE_API = 'https://www.pathofexile.com/api/trade2';

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Rate limiting - GGG compliance
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'poe_api',
  points: 45, // 45 requests
  duration: 60, // per 60 seconds per IP
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting middleware
const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'API rate limit exceeded. Please try again later.',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1,
    });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'exiled-ai-bridge', timestamp: new Date().toISOString() });
});

// LibreChat proxy endpoint
app.post('/api/chat', rateLimitMiddleware, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    logger.info('Processing chat request', { message: message.substring(0, 100) });
    
    // Forward to LibreChat
    const response = await axios.post(`${LIBRECHAT_URL}/api/messages`, {
      text: message,
      parentMessageId: context?.parentMessageId,
      conversationId: context?.conversationId,
      model: context?.model || 'Multimodal Lite'
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ExiledExchange2-AIBridge/1.0.0'
      }
    });

    res.json({
      success: true,
      response: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('LibreChat request failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'LibreChat communication failed',
      message: error.message
    });
  }
});

// Price checking endpoint with AI enhancement
app.post('/api/price-check', rateLimitMiddleware, async (req, res) => {
  try {
    const { itemText, league } = req.body;
    
    if (!itemText) {
      return res.status(400).json({ error: 'Item text is required' });
    }

    logger.info('Processing price check', { league, itemLength: itemText.length });

    // Basic item parsing
    const itemData = parseItemText(itemText);
    
    // Get price data from official API (GGG compliant)
    const priceData = await fetchPriceData(itemData, league || 'Hardcore');
    
    // Enhance with AI insights via LibreChat
    const aiInsights = await getAIInsights(itemData, priceData);
    
    res.json({
      success: true,
      item: itemData,
      pricing: priceData,
      aiInsights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Price check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Price check failed',
      message: error.message
    });
  }
});

// Market intelligence endpoint
app.get('/api/market/:league', rateLimitMiddleware, async (req, res) => {
  try {
    const { league } = req.params;
    const { currency } = req.query;

    logger.info('Fetching market data', { league, currency });

    // Fetch market data from official sources
    const marketData = await fetchMarketData(league, currency);
    
    // Get AI market analysis
    const aiAnalysis = await getMarketAnalysis(marketData, league);

    res.json({
      success: true,
      league,
      market: marketData,
      analysis: aiAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Market data fetch failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Market data fetch failed',
      message: error.message
    });
  }
});

// Utility functions
function parseItemText(itemText) {
  // Basic item parsing - extract name, type, mods
  const lines = itemText.split('\n').filter(line => line.trim());
  
  return {
    name: lines[0] || 'Unknown Item',
    type: extractItemType(lines),
    mods: extractMods(lines),
    rawText: itemText
  };
}

function extractItemType(lines) {
  // Find item type from common patterns
  for (const line of lines) {
    if (line.includes('Rarity:')) continue;
    if (line.includes('---')) continue;
    if (!line.includes(':') && line.length > 3) {
      return line.trim();
    }
  }
  return 'Unknown';
}

function extractMods(lines) {
  const mods = [];
  for (const line of lines) {
    if (line.includes('%') || line.includes('to ') || line.includes('increased') || line.includes('Adds')) {
      mods.push(line.trim());
    }
  }
  return mods;
}

async function fetchPriceData(itemData, league) {
  try {
    // Use official PoE trade API (GGG compliant)
    const searchPayload = {
      query: {
        name: itemData.name,
        type: itemData.type,
        status: { option: "online" }
      },
      sort: { price: "asc" }
    };

    const searchResponse = await axios.post(`${POE_TRADE_API}/search/${league}`, searchPayload, {
      headers: { 'User-Agent': 'ExiledExchange2/1.0.0' },
      timeout: 10000
    });

    return {
      searchId: searchResponse.data.id,
      total: searchResponse.data.total,
      results: searchResponse.data.result.slice(0, 10) // Limit results
    };

  } catch (error) {
    logger.warn('Official API unavailable, using fallback', { error: error.message });
    return { error: 'Official API unavailable', fallback: true };
  }
}

async function getAIInsights(itemData, priceData) {
  try {
    const prompt = `Analyze this Path of Exile 2 item:
    
Item: ${itemData.name}
Type: ${itemData.type}
Mods: ${itemData.mods.join(', ')}
Price Data: ${priceData.total || 0} listings found

Provide insights on:
1. Item value assessment
2. Market position
3. Trading recommendations
4. Build relevance

Keep response concise and actionable.`;

    const response = await axios.post(`${LIBRECHAT_URL}/api/messages`, {
      text: prompt,
      model: 'Multimodal Lite'
    }, { timeout: 15000 });

    return {
      analysis: response.data.text || response.data.response,
      confidence: 'medium',
      source: 'ai'
    };

  } catch (error) {
    logger.warn('AI insights unavailable', { error: error.message });
    return { error: 'AI analysis unavailable', fallback: true };
  }
}

async function fetchMarketData(league, currency) {
  // Placeholder for market data - integrate with poe2scout.com API when available
  return {
    league,
    currency: currency || 'divine',
    timestamp: new Date().toISOString(),
    note: 'Market data integration pending - poe2scout.com API'
  };
}

async function getMarketAnalysis(marketData, league) {
  try {
    const prompt = `Analyze Path of Exile 2 market conditions for ${league} league:

Current data indicates market activity for ${marketData.currency} currency.

Provide:
1. Market trend assessment
2. Currency recommendations
3. Trading timing suggestions
4. Risk factors

Keep analysis brief and actionable.`;

    const response = await axios.post(`${LIBRECHAT_URL}/api/messages`, {
      text: prompt,
      model: 'Multimodal Lite'
    }, { timeout: 15000 });

    return {
      analysis: response.data.text || response.data.response,
      confidence: 'low', // Lower confidence without real market data
      source: 'ai'
    };

  } catch (error) {
    logger.warn('Market analysis unavailable', { error: error.message });
    return { error: 'Market analysis unavailable', fallback: true };
  }
}

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'API endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`Exiled AI Bridge running on port ${PORT}`);
  logger.info(`LibreChat URL: ${LIBRECHAT_URL}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;