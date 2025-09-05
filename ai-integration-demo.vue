<template>
  <div class="p-6 bg-gray-800 text-white min-h-screen">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6 flex items-center space-x-2">
        <i class="fas fa-robot text-blue-400"></i>
        <span>AI Integration Demo</span>
      </h1>
      
      <!-- Status Section -->
      <div class="bg-gray-700 rounded-lg p-4 mb-6">
        <h2 class="text-lg font-semibold mb-3">AI Bridge Status</h2>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div 
              class="w-3 h-3 rounded-full"
              :class="aiStatus.healthy ? 'bg-green-400' : 'bg-red-400'"
            ></div>
            <span>{{ aiStatus.healthy ? 'Connected' : 'Disconnected' }}</span>
          </div>
          <button 
            @click="checkAIStatus"
            :disabled="checking"
            class="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
          >
            {{ checking ? 'Checking...' : 'Refresh Status' }}
          </button>
        </div>
      </div>

      <!-- Test Item Section -->
      <div class="bg-gray-700 rounded-lg p-4 mb-6">
        <h2 class="text-lg font-semibold mb-3">Test Item Analysis</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Item Text:</label>
          <textarea
            v-model="testItemText"
            class="w-full h-32 bg-gray-800 border border-gray-600 rounded p-3 text-sm"
            placeholder="Paste Path of Exile 2 item text here..."
          ></textarea>
        </div>
        <div class="flex space-x-2 mb-4">
          <button 
            @click="analyzeItem"
            :disabled="!testItemText.trim() || analyzing"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
          >
            {{ analyzing ? 'Analyzing...' : 'Analyze Item' }}
          </button>
          <button 
            @click="loadSampleItem"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
          >
            Load Sample Item
          </button>
        </div>
        
        <!-- AI Analysis Results -->
        <div v-if="analysisResult" class="bg-gray-800 rounded p-4">
          <h3 class="font-semibold mb-2 text-green-400">AI Analysis Result:</h3>
          <div class="space-y-2 text-sm">
            <div><strong>Item:</strong> {{ analysisResult.item.name }}</div>
            <div><strong>Type:</strong> {{ analysisResult.item.type }}</div>
            <div><strong>Mods:</strong> {{ analysisResult.item.mods.length }}</div>
            
            <div v-if="analysisResult.aiInsights" class="mt-4">
              <h4 class="font-medium text-blue-400">AI Insights:</h4>
              <div class="bg-gray-900 rounded p-3 mt-2">
                <div class="text-gray-300">{{ analysisResult.aiInsights.analysis || 'No analysis available' }}</div>
                <div class="text-xs text-gray-500 mt-2">
                  Confidence: {{ analysisResult.aiInsights.confidence }} | Source: {{ analysisResult.aiInsights.source }}
                </div>
              </div>
            </div>
            
            <div v-if="analysisResult.pricing" class="mt-4">
              <h4 class="font-medium text-yellow-400">Pricing Info:</h4>
              <div class="text-sm text-gray-300">
                {{ analysisResult.pricing.error || `${analysisResult.pricing.total || 0} listings found` }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Section -->
      <div class="bg-gray-700 rounded-lg p-4 mb-6">
        <h2 class="text-lg font-semibold mb-3">AI Chat Test</h2>
        <div class="mb-4">
          <input
            v-model="chatMessage"
            @keyup.enter="sendChatMessage"
            class="w-full bg-gray-800 border border-gray-600 rounded p-3 text-sm"
            placeholder="Ask AI about Path of Exile 2..."
          />
        </div>
        <button 
          @click="sendChatMessage"
          :disabled="!chatMessage.trim() || chatting"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
        >
          {{ chatting ? 'Sending...' : 'Send Message' }}
        </button>
        
        <div v-if="chatResponse" class="bg-gray-800 rounded p-4 mt-4">
          <h3 class="font-semibold mb-2 text-blue-400">AI Response:</h3>
          <div class="text-sm text-gray-300">{{ chatResponse }}</div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-900 border border-red-600 rounded p-4 mb-6">
        <h3 class="font-semibold text-red-400 mb-2">Error:</h3>
        <div class="text-sm text-red-200">{{ error }}</div>
        <button 
          @click="error = null"
          class="mt-2 px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiBridge } from '@/web/ai-bridge/AIBridgeClient'
import { getEnhancedPricing } from '@/web/price-check/price-prediction/ai-enhanced-pricing'
import { parseItemText } from '@/parser'

const aiStatus = ref({ healthy: false })
const checking = ref(false)
const analyzing = ref(false)
const chatting = ref(false)
const error = ref<string | null>(null)

const testItemText = ref('')
const analysisResult = ref<any>(null)
const chatMessage = ref('')
const chatResponse = ref('')

const sampleItemText = `Rarity: Rare
Bone Sword
--------
One Handed Sword
Physical Damage: 15-30
Critical Strike Chance: 5%
Attack Speed: 1.3 attacks per second
--------
Requirements:
Level: 12
Str: 25
Dex: 25
--------
Sockets: R-R 
--------
Item Level: 15
--------
+40% increased Physical Damage
10% increased Attack Speed
Adds 5-10 Physical Damage
+15 to maximum Life`

async function checkAIStatus() {
  checking.value = true
  error.value = null
  
  try {
    const healthy = await aiBridge.healthCheck()
    aiStatus.value.healthy = healthy
  } catch (err) {
    error.value = `Status check failed: ${err.message}`
    aiStatus.value.healthy = false
  } finally {
    checking.value = false
  }
}

async function analyzeItem() {
  if (!testItemText.value.trim()) return
  
  analyzing.value = true
  error.value = null
  analysisResult.value = null
  
  try {
    // Parse the item text (you'll need to implement this based on your parser)
    const parsedItem = parseItemText(testItemText.value)
    
    if (parsedItem.isErr()) {
      throw new Error('Failed to parse item: ' + parsedItem.error.message)
    }
    
    // Get enhanced pricing with AI insights
    const result = await getEnhancedPricing(parsedItem.value)
    analysisResult.value = {
      item: {
        name: parsedItem.value.info.name,
        type: parsedItem.value.category,
        mods: parsedItem.value.modifiers.map(mod => mod.toString())
      },
      pricing: result.pricing || {},
      aiInsights: result.aiInsights,
      enhanced: result.enhanced
    }
    
  } catch (err) {
    error.value = `Analysis failed: ${err.message}`
  } finally {
    analyzing.value = false
  }
}

async function sendChatMessage() {
  if (!chatMessage.value.trim()) return
  
  chatting.value = true
  error.value = null
  chatResponse.value = ''
  
  try {
    const response = await aiBridge.chatWithAI(chatMessage.value)
    chatResponse.value = response.response || response.analysis || 'No response received'
    chatMessage.value = ''
  } catch (err) {
    error.value = `Chat failed: ${err.message}`
  } finally {
    chatting.value = false
  }
}

function loadSampleItem() {
  testItemText.value = sampleItemText
}

onMounted(() => {
  checkAIStatus()
})
</script>