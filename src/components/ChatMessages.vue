<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue'
import ChatMessage from './ChatMessage.vue'
import { useChats } from '../services/chat.ts'
import { debugMode, scrollBehavior } from '../services/appConfig.ts'

const { messages } = useChats()
const chatElement = ref<HTMLElement>()
const userInterferedWithScroll = ref(false)

const isAtBottom = () => {
  if (!chatElement.value) return false

  const { scrollTop, scrollHeight, clientHeight } = chatElement.value
  return scrollHeight - scrollTop <= clientHeight + 10 // 10 is a small threshold
}

const handleUserScroll = () => {
  userInterferedWithScroll.value = !isAtBottom()
}

// Track previous scroll height to calculate adjustment
const previousScrollHeight = ref(0)

const scrollToBottom = () => {
  if (userInterferedWithScroll.value) return

  nextTick(() => {
    if (chatElement.value) {
      const targetScrollTop = chatElement.value.scrollHeight
      chatElement.value.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      })
    }
  })
}

// Track animation frame to prevent multiple scroll animations
let scrollAnimationFrame: number | null = null

const adjustScroll = () => {
  if (!chatElement.value) return

  const element = chatElement.value
  const currentScrollHeight = element.scrollHeight
  const heightDifference = currentScrollHeight - previousScrollHeight.value

  if (heightDifference > 0 && !userInterferedWithScroll.value) {
    // Cancel any ongoing animation
    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame)
    }

    // Start new smooth scroll animation
    const startTime = performance.now()
    const startScrollTop = element.scrollTop
    const targetScrollTop = scrollBehavior.value === 'follow' 
      ? startScrollTop + heightDifference 
      : element.scrollHeight
    const duration = 300 // Duration in ms, adjust for faster/slower scroll

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out cubic function for smooth deceleration
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
      const currentProgress = easeOut(progress)
      
      element.scrollTop = startScrollTop + ((targetScrollTop - startScrollTop) * currentProgress)

      if (progress < 1) {
        scrollAnimationFrame = requestAnimationFrame(animateScroll)
      } else {
        scrollAnimationFrame = null
      }
    }

    scrollAnimationFrame = requestAnimationFrame(animateScroll)
  }

  previousScrollHeight.value = currentScrollHeight
}

// Watch for AI message completion to scroll to bottom if in 'end' mode
watch(() => messages.value, (newMessages, oldMessages) => {
  if (scrollBehavior.value === 'end' && 
      newMessages.length > 0 && 
      newMessages[newMessages.length - 1].role === 'assistant' &&
      (!oldMessages || newMessages.length > oldMessages.length)) {
    scrollToBottom()
  }
}, { deep: true })

onMounted(() => {
  if (chatElement.value) {
    previousScrollHeight.value = chatElement.value.scrollHeight
  }
  scrollToBottom()
  chatElement.value?.addEventListener('scroll', handleUserScroll)
})

onUpdated(() => {
  adjustScroll()
})

watch(messages, () => {
  if (isAtBottom()) {
    userInterferedWithScroll.value = false
  }
  nextTick(() => {
    adjustScroll()
  })
})

onUnmounted(() => {
  // Clean up scroll animation
  if (scrollAnimationFrame) {
    cancelAnimationFrame(scrollAnimationFrame)
  }
  // Remove scroll event listener
  chatElement.value?.removeEventListener('scroll', handleUserScroll)
})

const visibleMessages = computed(() =>
  debugMode.value ? messages?.value : messages?.value.filter((m) => m.role != 'system'),
)
</script>

<template>
  <div
    ref="chatElement"
    class="flex-1 overflow-y-auto scroll-smooth rounded-xl p-4 text-sm leading-6 text-gray-900 dark:text-gray-100 sm:text-base sm:leading-7"
  >
    <ChatMessage v-for="message in visibleMessages" :message="message" />
  </div>
</template>
