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

class ExiledExchangeIntegration {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.timeout = 5000;
  }

  async sendAIResponse(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/ai-response`, data, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ExiledAIBridge/1.0.0'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send AI response to Exiled Exchange', { error: error.message });
      throw error;
    }
  }

  async getPriceCheckData(itemHash) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/price-check/${itemHash}`, {
        timeout: this.timeout
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get price check data', { error: error.message });
      throw error;
    }
  }

  async notifyAIAvailable() {
    try {
      const response = await axios.post(`${this.baseUrl}/api/ai-status`, {
        status: 'available',
        features: ['chat', 'price-analysis', 'market-insights'],
        timestamp: new Date().toISOString()
      }, {
        timeout: this.timeout
      });

      logger.info('Successfully notified Exiled Exchange of AI availability');
      return response.data;
    } catch (error) {
      logger.warn('Failed to notify Exiled Exchange of AI availability', { error: error.message });
      // Non-critical error - continue operation
      return null;
    }
  }
}

module.exports = ExiledExchangeIntegration;