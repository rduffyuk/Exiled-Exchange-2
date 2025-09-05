const axios = require('axios');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

class LibreChatIntegration {
  constructor(baseUrl = 'http://localhost:3080') {
    this.baseUrl = baseUrl;
    this.timeout = 30000; // LibreChat may take longer for AI responses
    this.conversationId = null;
    this.parentMessageId = null;
  }

  async sendMessage(message, context = {}) {
    try {
      const payload = {
        text: message,
        conversationId: context.conversationId || this.conversationId,
        parentMessageId: context.parentMessageId || this.parentMessageId,
        model: context.model || process.env.LIBRECHAT_DEFAULT_MODEL || 'gpt-3.5-turbo',
        ...context
      };

      logger.info('Sending message to LibreChat', { 
        messageLength: message.length,
        model: payload.model 
      });

      const response = await axios.post(`${this.baseUrl}/api/messages`, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ExiledAIBridge/1.0.0'
        }
      });

      // Update conversation context for continuity
      if (response.data.conversationId) {
        this.conversationId = response.data.conversationId;
      }
      if (response.data.messageId) {
        this.parentMessageId = response.data.messageId;
      }

      return {
        success: true,
        response: response.data.text || response.data.response,
        conversationId: response.data.conversationId,
        messageId: response.data.messageId,
        model: response.data.model
      };

    } catch (error) {
      logger.error('LibreChat request failed', { 
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText 
      });

      return {
        success: false,
        error: error.message,
        status: error.response?.status || 500
      };
    }
  }

  async sendPriceAnalysisRequest(itemData, priceData) {
    const prompt = `As an expert Path of Exile 2 trader, analyze this item:

**Item Details:**
- Name: ${itemData.name}
- Type: ${itemData.type}
- Mods: ${itemData.mods.join(' | ')}

**Market Data:**
- ${priceData.total || 0} similar listings found
- Search ID: ${priceData.searchId || 'N/A'}

**Please provide:**
1. **Value Assessment** - Is this item valuable? Why?
2. **Market Position** - How does it compare to similar items?
3. **Trading Advice** - Best pricing and timing strategy
4. **Build Relevance** - Which builds would want this item?

Keep your analysis concise but comprehensive. Focus on actionable insights for trading decisions.`;

    return await this.sendMessage(prompt, { model: 'gpt-4' });
  }

  async sendMarketAnalysisRequest(marketData, league) {
    const prompt = `Analyze the Path of Exile 2 market conditions for **${league}** league:

**Current Market Data:**
- Currency: ${marketData.currency}
- League: ${league}
- Last Updated: ${marketData.timestamp}

**Analysis Needed:**
1. **Market Trends** - Current price movements and patterns
2. **Currency Recommendations** - Best currencies to hold/trade
3. **Timing Strategy** - When to buy/sell for maximum profit
4. **Risk Assessment** - Market stability and volatility factors

Provide practical trading advice based on current market conditions. Consider both short-term opportunities and long-term investment strategies.`;

    return await this.sendMessage(prompt, { model: 'gpt-4' });
  }

  async sendCraftingAdviceRequest(itemData, craftingOptions) {
    const prompt = `As a Path of Exile 2 crafting expert, advise on this item:

**Item to Craft:**
- Base: ${itemData.type}
- Current Mods: ${itemData.mods.join(' | ')}
- Item Level: ${itemData.itemLevel || 'Unknown'}

**Crafting Goals:**
${craftingOptions.goals || 'Maximize value'}

**Budget:** ${craftingOptions.budget || 'Moderate'}

**Please provide:**
1. **Crafting Strategy** - Step-by-step crafting approach
2. **Currency Requirements** - What currencies and quantities needed
3. **Success Probability** - Realistic chances of achieving goals
4. **Risk vs Reward** - Is this crafting project worth it?
5. **Alternative Options** - Other approaches or buying suggestions

Consider the current PoE2 crafting mechanics including Runes, Omens, and Essences.`;

    return await this.sendMessage(prompt, { model: 'gpt-4' });
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/config`, {
        timeout: 5000
      });
      
      return {
        healthy: true,
        status: 'connected',
        version: response.data?.version || 'unknown'
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'disconnected',
        error: error.message
      };
    }
  }

  resetConversation() {
    this.conversationId = null;
    this.parentMessageId = null;
    logger.info('LibreChat conversation context reset');
  }
}

module.exports = LibreChatIntegration;