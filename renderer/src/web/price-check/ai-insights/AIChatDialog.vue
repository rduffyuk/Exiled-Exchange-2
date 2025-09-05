<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="close"
  >
    <div class="bg-gray-800 rounded-lg border border-gray-600 w-96 max-h-96 flex flex-col">
      <div class="flex items-center justify-between p-4 border-b border-gray-600">
        <div class="flex items-center space-x-2">
          <i class="fas fa-robot text-blue-400"></i>
          <span class="font-semibold text-blue-400">Ask AI</span>
        </div>
        <button @click="close" class="text-gray-400 hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="flex-1 p-4 overflow-y-auto">
        <div v-if="itemName" class="mb-3 p-2 bg-gray-700 rounded text-sm">
          <div class="text-gray-300">Asking about:</div>
          <div class="text-white font-medium">{{ itemName }}</div>
        </div>
        
        <div class="space-y-3">
          <div v-for="(message, index) in messages" :key="index" class="flex space-x-2">
            <div 
              class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
              :class="message.isUser ? 'bg-blue-500' : 'bg-green-500'"
            >
              <i :class="message.isUser ? 'fas fa-user' : 'fas fa-robot'"></i>
            </div>
            <div class="flex-1 text-sm">
              <div class="text-gray-300 leading-relaxed">{{ message.text }}</div>
            </div>
          </div>
          
          <div v-if="loading" class="flex space-x-2">
            <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs">
              <i class="fas fa-robot"></i>
            </div>
            <div class="flex-1 text-sm">
              <div class="text-gray-400 flex items-center space-x-2">
                <i class="fas fa-spinner fa-spin"></i>
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-4 border-t border-gray-600">
        <div class="flex space-x-2">
          <input
            v-model="currentQuestion"
            @keyup.enter="askQuestion"
            :disabled="loading"
            type="text"
            placeholder="Ask about this item..."
            class="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <button
            @click="askQuestion"
            :disabled="loading || !currentQuestion.trim()"
            class="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm font-medium text-white"
          >
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
        
        <div class="mt-2 flex flex-wrap gap-1">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            @click="currentQuestion = suggestion"
            class="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { askAIAboutItem } from '@/web/price-check/price-prediction/ai-enhanced-pricing'
import type { ParsedItem } from '@/parser'

interface Props {
  show: boolean
  item?: ParsedItem
}

interface Message {
  text: string
  isUser: boolean
  timestamp: Date
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'close': []
}>()

const currentQuestion = ref('')
const messages = ref<Message[]>([])
const loading = ref(false)

const itemName = computed(() => {
  return props.item?.info?.name || props.item?.category || 'Unknown Item'
})

const suggestions = [
  'Is this item valuable?',
  'What builds use this item?',
  'Should I sell or use this?',
  'How can I improve this item?',
  'What are similar items worth?'
]

async function askQuestion() {
  if (!currentQuestion.value.trim() || loading.value || !props.item) return
  
  const question = currentQuestion.value.trim()
  
  // Add user message
  messages.value.push({
    text: question,
    isUser: true,
    timestamp: new Date()
  })
  
  loading.value = true
  currentQuestion.value = ''
  
  try {
    const response = await askAIAboutItem(props.item, question)
    
    // Add AI response
    messages.value.push({
      text: response.response || response.analysis || 'I apologize, but I couldn\'t provide a response at this time.',
      isUser: false,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('AI question failed:', error)
    messages.value.push({
      text: 'Sorry, I\'m having trouble responding right now. The AI service might be unavailable.',
      isUser: false,
      timestamp: new Date()
    })
  } finally {
    loading.value = false
  }
}

function close() {
  emit('close')
  // Clear messages when dialog closes
  messages.value = []
  currentQuestion.value = ''
}

// Watch for show prop to reset state
watch(() => props.show, (newShow) => {
  if (newShow) {
    // Add welcome message when dialog opens
    messages.value = [{
      text: `Hello! I'm here to help you understand this ${props.item?.category || 'item'}. What would you like to know about it?`,
      isUser: false,
      timestamp: new Date()
    }]
  }
})
</script>