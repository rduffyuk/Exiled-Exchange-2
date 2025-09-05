<template>
  <div v-if="insights && showAI" class="bg-gray-900 border border-gray-600 rounded mt-2 p-3">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-2">
        <i class="fas fa-robot text-blue-400"></i>
        <span class="font-semibold text-blue-400">AI Analysis</span>
        <div class="flex items-center space-x-1">
          <div 
            class="w-2 h-2 rounded-full"
            :class="confidenceColor"
          ></div>
          <span class="text-xs text-gray-400">{{ insights.confidence }}</span>
        </div>
      </div>
      <button 
        @click="showAI = false"
        class="text-gray-400 hover:text-gray-200 text-xs"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div v-if="insights.analysis" class="mb-3">
      <div class="text-sm text-gray-300 leading-relaxed">
        {{ insights.analysis }}
      </div>
    </div>
    
    <div v-if="insights.recommendations && insights.recommendations.length > 0" class="mb-3">
      <div class="text-xs font-medium text-yellow-400 mb-1">Recommendations:</div>
      <ul class="text-xs text-gray-300 space-y-1">
        <li v-for="(rec, index) in insights.recommendations" :key="index" class="flex items-start space-x-2">
          <span class="text-yellow-400">•</span>
          <span>{{ rec }}</span>
        </li>
      </ul>
    </div>
    
    <div v-if="insights.marketTrends" class="mb-3">
      <div class="text-xs font-medium text-purple-400 mb-1">Market Trends:</div>
      <div class="flex items-center space-x-3 text-xs">
        <div class="flex items-center space-x-1">
          <i 
            class="fas"
            :class="{
              'fa-arrow-up text-green-400': insights.marketTrends.direction === 'up',
              'fa-arrow-down text-red-400': insights.marketTrends.direction === 'down',
              'fa-minus text-yellow-400': insights.marketTrends.direction === 'stable'
            }"
          ></i>
          <span class="text-gray-300 capitalize">{{ insights.marketTrends.direction }}</span>
        </div>
        <div class="text-gray-400">
          {{ Math.round(insights.marketTrends.confidence) }}% confident
        </div>
      </div>
      <div class="text-xs text-gray-400 mt-1">
        {{ insights.marketTrends.reasoning }}
      </div>
    </div>
    
    <div class="flex items-center justify-between text-xs text-gray-500">
      <div>Source: {{ insights.source }}</div>
      <button 
        @click="$emit('ask-question')"
        class="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
      >
        <i class="fas fa-comment-dots"></i>
        <span>Ask AI</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AIInsights } from '@/web/ai-bridge/AIBridgeClient'

interface Props {
  insights?: AIInsights
  initiallyVisible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initiallyVisible: true
})

const emit = defineEmits<{
  'ask-question': []
}>()

const showAI = ref(props.initiallyVisible)

const confidenceColor = computed(() => {
  if (!props.insights) return 'bg-gray-500'
  
  switch (props.insights.confidence) {
    case 'high':
      return 'bg-green-400'
    case 'medium':
      return 'bg-yellow-400'
    case 'low':
      return 'bg-red-400'
    default:
      return 'bg-gray-500'
  }
})

// Watch for new insights to show the panel
watch(() => props.insights, (newInsights) => {
  if (newInsights && newInsights.analysis) {
    showAI.value = true
  }
})
</script>

<style scoped>
.ai-insights-enter-active,
.ai-insights-leave-active {
  transition: all 0.3s ease;
}

.ai-insights-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.ai-insights-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>