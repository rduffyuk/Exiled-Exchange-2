import { Host } from '@/web/background/IPC'
import type { ParsedItem } from '@/parser'

export interface AIBridgeConfig {
  baseUrl: string
  timeout: number
  enabled: boolean
}

export interface AIInsights {
  analysis?: string
  confidence: 'low' | 'medium' | 'high'
  source: string
  recommendations?: string[]
  marketTrends?: {
    direction: 'up' | 'down' | 'stable'
    confidence: number
    reasoning: string
  }
}

export interface EnhancedPriceResult {
  success: boolean
  item: {
    name: string
    type: string
    mods: string[]
    rawText: string
  }
  pricing: {
    searchId?: string
    total?: number
    error?: string
    fallback?: boolean
  }
  aiInsights?: AIInsights
  timestamp: string
  enhanced: boolean
}

export interface MarketAnalysis {
  success: boolean
  league: string
  market: {
    currency: string
    timestamp: string
  }
  analysis?: {
    analysis: string
    confidence: 'low' | 'medium' | 'high'
    source: string
  }
}

class AIBridgeClient {
  private config: AIBridgeConfig

  constructor(config: Partial<AIBridgeConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:3001',
      timeout: 15000,
      enabled: true,
      ...config
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.config.enabled) return false

    try {
      return await Host.call('ai-bridge:health-check')
    } catch (error) {
      console.warn('AI Bridge health check failed:', error)
      return false
    }
  }

  async enhancePriceCheck(item: ParsedItem, league: string): Promise<EnhancedPriceResult> {
    if (!this.config.enabled) {
      throw new Error('AI Bridge is disabled')
    }

    try {
      const payload = {
        itemText: item.rawText,
        league: league
      }

      const result = await Host.call('ai-bridge:price-check', payload)
      return {
        ...result,
        enhanced: true
      }

    } catch (error) {
      console.error('AI-enhanced price check failed:', error)
      throw error
    }
  }

  async getMarketAnalysis(league: string, currency: string = 'divine'): Promise<MarketAnalysis> {
    try {
      return await Host.call('ai-bridge:market-analysis', league, currency)
    } catch (error) {
      console.error('Market analysis failed:', error)
      throw error
    }
  }

  async chatWithAI(message: string, context: any = {}): Promise<any> {
    try {
      const payload = {
        message,
        context: {
          model: 'Multimodal Lite',
          ...context
        }
      }

      return await Host.call('ai-bridge:chat', payload)
    } catch (error) {
      console.error('AI chat failed:', error)
      throw error
    }
  }

  async askAboutItem(item: ParsedItem, question: string): Promise<any> {
    const context = {
      itemName: item.info.name,
      itemType: item.category,
      itemMods: item.modifiers.map(mod => mod.toString()).join(' | ')
    }

    const enhancedMessage = `Question about this ${item.category} "${item.info.name}": ${question}

Item details:
- Name: ${item.info.name}
- Type: ${item.category}
- Mods: ${context.itemMods}

Please provide specific advice for this item.`

    return this.chatWithAI(enhancedMessage, { 
      itemContext: context,
      model: 'Multimodal Lite'
    })
  }

  setEnabled(enabled: boolean) {
    this.config.enabled = enabled
  }

  isEnabled(): boolean {
    return this.config.enabled
  }
}

// Create singleton instance
export const aiBridge = new AIBridgeClient()

// Configuration helpers
export function configureAIBridge(config: Partial<AIBridgeConfig>) {
  Object.assign(aiBridge['config'], config)
}

export function isAIBridgeAvailable(): Promise<boolean> {
  return aiBridge.healthCheck()
}