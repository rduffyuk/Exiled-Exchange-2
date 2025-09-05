// Integration example for Exiled Exchange 2 main app
// Add this to your renderer process or main process communication

interface AIBridgeConfig {
  baseUrl: string;
  timeout: number;
  enabled: boolean;
}

interface PriceCheckRequest {
  itemText: string;
  league: string;
}

interface AIInsights {
  analysis: string;
  confidence: 'low' | 'medium' | 'high';
  source: string;
}

interface PriceCheckResponse {
  success: boolean;
  item: {
    name: string;
    type: string;
    mods: string[];
    rawText: string;
  };
  pricing: {
    searchId?: string;
    total?: number;
    error?: string;
  };
  aiInsights?: AIInsights;
  timestamp: string;
}

class AIBridgeClient {
  private config: AIBridgeConfig;

  constructor(config: AIBridgeConfig = {
    baseUrl: 'http://localhost:3001',
    timeout: 10000,
    enabled: true
  }) {
    this.config = config;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.config.enabled) return false;

    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async enhancePriceCheck(request: PriceCheckRequest): Promise<PriceCheckResponse> {
    if (!this.config.enabled) {
      throw new Error('AI Bridge is disabled');
    }

    const response = await fetch(`${this.config.baseUrl}/api/price-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(`AI Bridge request failed: ${response.status}`);
    }

    return await response.json();
  }

  async getMarketAnalysis(league: string, currency: string = 'divine'): Promise<any> {
    const response = await fetch(
      `${this.config.baseUrl}/api/market/${league}?currency=${currency}`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout)
      }
    );

    if (!response.ok) {
      throw new Error(`Market analysis failed: ${response.status}`);
    }

    return await response.json();
  }

  async chatWithAI(message: string, context: any = {}): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, context }),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(`AI chat failed: ${response.status}`);
    }

    return await response.json();
  }
}

// Usage Example in your existing price check flow:

export async function enhancedPriceCheck(itemText: string, league: string) {
  const aiBridge = new AIBridgeClient();
  
  try {
    // Check if AI bridge is available
    const isHealthy = await aiBridge.healthCheck();
    if (!isHealthy) {
      console.warn('AI Bridge unavailable, using standard price check');
      return standardPriceCheck(itemText, league); // Your existing function
    }

    // Get AI-enhanced price check
    const aiResult = await aiBridge.enhancePriceCheck({ itemText, league });
    
    if (aiResult.success && aiResult.aiInsights) {
      // Display AI insights in your UI
      showAIInsights(aiResult.aiInsights);
    }

    return {
      ...aiResult,
      enhanced: true
    };

  } catch (error) {
    console.error('AI-enhanced price check failed:', error);
    // Fallback to standard price check
    return standardPriceCheck(itemText, league);
  }
}

// Example UI integration (Vue component method):
export const PriceCheckWidget = {
  methods: {
    async onPriceCheck(itemText: string) {
      this.loading = true;
      this.aiInsights = null;
      
      try {
        const result = await enhancedPriceCheck(itemText, this.selectedLeague);
        
        this.priceData = result.pricing;
        
        if (result.aiInsights) {
          this.aiInsights = {
            analysis: result.aiInsights.analysis,
            confidence: result.aiInsights.confidence,
            showAI: true
          };
        }
        
      } catch (error) {
        this.error = 'Price check failed: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
    
    async askAIAboutItem(question: string) {
      const aiBridge = new AIBridgeClient();
      
      try {
        const response = await aiBridge.chatWithAI(
          `Question about ${this.currentItem.name}: ${question}`
        );
        
        if (response.success) {
          this.showAIResponse(response.response);
        }
        
      } catch (error) {
        console.error('AI chat failed:', error);
      }
    }
  }
};

// Electron main process integration:
export function setupAIBridgeIPC() {
  const { ipcMain } = require('electron');
  const aiBridge = new AIBridgeClient();
  
  ipcMain.handle('ai-price-check', async (event, itemText, league) => {
    return await aiBridge.enhancePriceCheck({ itemText, league });
  });
  
  ipcMain.handle('ai-market-analysis', async (event, league, currency) => {
    return await aiBridge.getMarketAnalysis(league, currency);
  });
  
  ipcMain.handle('ai-chat', async (event, message, context) => {
    return await aiBridge.chatWithAI(message, context);
  });
}