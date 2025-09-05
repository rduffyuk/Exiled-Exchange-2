<template>
  <div class="flex items-center space-x-2">
    <div 
      class="w-2 h-2 rounded-full"
      :class="statusColor"
    ></div>
    <span class="text-xs text-gray-400">
      AI {{ status }}
    </span>
    <button
      v-if="!aiEnabled"
      @click="$emit('enable-ai')"
      class="text-xs text-blue-400 hover:text-blue-300"
    >
      Enable
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { isAIEnhancementAvailable, getAIStatus } from '@/web/price-check/price-prediction/ai-enhanced-pricing'

const emit = defineEmits<{
  'enable-ai': []
}>()

const aiHealthy = ref(false)
const aiEnabled = ref(true)
const checking = ref(false)

const status = computed(() => {
  if (checking.value) return 'checking...'
  if (!aiEnabled.value) return 'disabled'
  if (aiHealthy.value) return 'ready'
  return 'unavailable'
})

const statusColor = computed(() => {
  if (checking.value) return 'bg-yellow-400 animate-pulse'
  if (!aiEnabled.value) return 'bg-gray-400'
  if (aiHealthy.value) return 'bg-green-400'
  return 'bg-red-400'
})

async function checkAIStatus() {
  checking.value = true
  try {
    const status = getAIStatus()
    aiEnabled.value = status.enabled
    
    if (status.enabled) {
      aiHealthy.value = await isAIEnhancementAvailable()
    } else {
      aiHealthy.value = false
    }
  } catch (error) {
    aiHealthy.value = false
  } finally {
    checking.value = false
  }
}

onMounted(() => {
  checkAIStatus()
  
  // Check status periodically
  setInterval(checkAIStatus, 30000) // Every 30 seconds
})
</script>