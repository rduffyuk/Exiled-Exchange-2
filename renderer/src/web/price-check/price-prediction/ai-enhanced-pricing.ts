import { ParsedItem } from "@/parser";
import { useLeagues } from "@/web/background/Leagues";
import { aiBridge, type AIInsights } from "@/web/ai-bridge/AIBridgeClient";
import { requestPoeprices, type RareItemPrice } from "./poeprices";

export interface EnhancedPriceResult extends RareItemPrice {
  aiInsights?: AIInsights;
  dataSource: 'poeprices' | 'ai-bridge' | 'fallback';
  enhanced: boolean;
}

/**
 * Enhanced price checking with AI insights
 * Falls back gracefully to standard poeprices if AI bridge is unavailable
 */
export async function getEnhancedPricing(
  item: ParsedItem
): Promise<EnhancedPriceResult> {
  let standardResult: RareItemPrice | null = null;
  let aiInsights: AIInsights | undefined;
  let dataSource: 'poeprices' | 'ai-bridge' | 'fallback' = 'fallback';

  // Try to get standard poeprices data first
  try {
    standardResult = await requestPoeprices(item);
    dataSource = 'poeprices';
  } catch (error) {
    console.warn('Standard poeprices request failed:', error);
  }

  // Try to enhance with AI bridge
  try {
    const isAIAvailable = await aiBridge.healthCheck();
    if (isAIAvailable) {
      const league = useLeagues().selectedId.value || 'Hardcore';
      const aiResult = await aiBridge.enhancePriceCheck(item, league);
      
      if (aiResult.success && aiResult.aiInsights) {
        aiInsights = aiResult.aiInsights;
        dataSource = 'ai-bridge';
        
        // If we don't have standard pricing but AI bridge has fallback pricing
        if (!standardResult && aiResult.pricing && !aiResult.pricing.error) {
          // Create a basic price result from AI bridge data
          standardResult = createFallbackPricing(aiResult, item);
        }
      }
    }
  } catch (error) {
    console.warn('AI bridge enhancement failed:', error);
  }

  // Create final result
  if (standardResult) {
    return {
      ...standardResult,
      aiInsights,
      dataSource,
      enhanced: !!aiInsights
    };
  } else {
    // Fallback result when both services fail
    return {
      min: 0,
      max: 0,
      confidence: 0,
      currency: "div",
      explanation: [],
      aiInsights: {
        analysis: "Unable to determine price - both poeprices.info and AI analysis unavailable",
        confidence: 'low',
        source: 'fallback'
      },
      dataSource: 'fallback',
      enhanced: false
    };
  }
}

/**
 * Get AI insights for market analysis
 */
export async function getMarketInsights(league: string, currency: string = 'divine') {
  try {
    const isAvailable = await aiBridge.healthCheck();
    if (!isAvailable) {
      return null;
    }

    const analysis = await aiBridge.getMarketAnalysis(league, currency);
    return analysis;
  } catch (error) {
    console.warn('Market insights failed:', error);
    return null;
  }
}

/**
 * Ask AI about a specific item
 */
export async function askAIAboutItem(item: ParsedItem, question: string) {
  try {
    const isAvailable = await aiBridge.healthCheck();
    if (!isAvailable) {
      throw new Error('AI assistant is currently unavailable');
    }

    return await aiBridge.askAboutItem(item, question);
  } catch (error) {
    console.error('AI question failed:', error);
    throw error;
  }
}

/**
 * Create a fallback pricing result from AI bridge data
 */
function createFallbackPricing(aiResult: any, item: ParsedItem): RareItemPrice {
  return {
    min: 0,
    max: 0,
    confidence: 50, // Medium confidence for fallback
    currency: "div",
    explanation: [
      {
        name: "AI Analysis",
        contrib: 100
      }
    ]
  };
}

/**
 * Check if AI enhancements are available
 */
export async function isAIEnhancementAvailable(): Promise<boolean> {
  try {
    return await aiBridge.healthCheck();
  } catch {
    return false;
  }
}

/**
 * Configure AI bridge settings
 */
export function configureAIEnhancements(enabled: boolean) {
  aiBridge.setEnabled(enabled);
}

/**
 * Get AI bridge status for UI display
 */
export function getAIStatus() {
  return {
    enabled: aiBridge.isEnabled(),
    healthy: false // Will be updated by health check
  };
}