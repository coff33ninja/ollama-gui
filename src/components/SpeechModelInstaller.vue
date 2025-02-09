<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconX } from '@tabler/icons-vue'

const props = defineProps<{
  modelName: string
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'complete'): void
}>()

const isInstalling = ref(false)
const installationComplete = ref(false)
const installationError = ref(false)
const installationCancelled = ref(false)
const progressLines = ref<string[]>([])
const currentProgress = ref('')
const lastError = ref<Error | null>(null)

const statusText = computed(() => {
  if (isInstalling.value) return 'Installing'
  if (installationComplete.value) return 'Completed'
  if (installationError.value) return 'Failed'
  if (installationCancelled.value) return 'Cancelled'
  return ''
})

const resetState = () => {
  isInstalling.value = false
  installationComplete.value = false
  installationError.value = false
  installationCancelled.value = false
  progressLines.value = []
  currentProgress.value = ''
  lastError.value = null
}

const closeModal = () => {
  emit('close')
  resetState()
}

const retryInstallation = async () => {
  resetState()
  await startInstallation()
}

const startInstallation = async () => {
  try {
    resetState()
    isInstalling.value = true
    currentProgress.value = 'Starting installation...'
    progressLines.value.push(`[${new Date().toLocaleTimeString()}] Starting installation of ${props.modelName}...`)

    const response = await fetch('http://localhost:11434/api/pull', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: props.modelName }),
    })

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to start download')
    }

    const decoder = new TextDecoder()
    while (true) {
      if (!isInstalling.value) {
        reader.cancel()
        installationCancelled.value = true
        break
      }

      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          if (data.status) {
            currentProgress.value = data.status
            progressLines.value.push(`[${new Date().toLocaleTimeString()}] ${data.status}`)
          }
          if (data.error) {
            throw new Error(data.error)
          }
        } catch (e) {
          if (e instanceof SyntaxError) {
            // Handle partial JSON or formatting issues
            continue
          }
          throw e
        }
      }
    }

    if (!installationCancelled.value) {
      progressLines.value.push(`[${new Date().toLocaleTimeString()}] Installation complete!`)
      currentProgress.value = 'Installation complete!'
      installationComplete.value = true
      isInstalling.value = false
      
      emit('complete')
      
      // Auto-close on success after 2 seconds
      setTimeout(closeModal, 2000)
    }
  } catch (error) {
    console.error('Error installing model:', error)
    installationError.value = true
    isInstalling.value = false
    lastError.value = error as Error
    if (error instanceof Error) {
      progressLines.value.push(`[${new Date().toLocaleTimeString()}] Error: ${error.message}`)
    } else {
      progressLines.value.push(`[${new Date().toLocaleTimeString()}] An unknown error occurred`)
    }
    currentProgress.value = 'Installation failed'
  }
}

const cancelInstallation = () => {
  if (isInstalling.value) {
    isInstalling.value = false
    installationCancelled.value = true
    progressLines.value.push(`[${new Date().toLocaleTimeString()}] Installation cancelled by user`)
    currentProgress.value = 'Installation cancelled'
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 shadow-xl">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold dark:text-white">
            {{ modelName }}
          </h3>
          <span 
            :class="{
              'bg-blue-100 text-blue-800': isInstalling,
              'bg-green-100 text-green-800': installationComplete,
              'bg-red-100 text-red-800': installationError,
              'bg-gray-100 text-gray-800': installationCancelled
            }"
            class="px-2 py-1 rounded-full text-xs font-medium"
          >
            {{ statusText }}
          </span>
        </div>
        <button 
          v-if="!installationComplete"
          @click="cancelInstallation" 
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          :disabled="installationComplete"
        >
          <IconX class="h-5 w-5" />
        </button>
      </div>
      
      <div class="bg-black rounded-lg p-4 font-mono text-sm text-green-400 h-64 overflow-y-auto">
        <div v-for="(line, index) in progressLines" :key="index" class="whitespace-pre-wrap">
          {{ line }}
        </div>
      </div>

      <div class="mt-4 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <div 
            v-if="isInstalling"
            class="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"
          ></div>
          <span 
            :class="{
              'text-blue-600': isInstalling,
              'text-green-600': installationComplete,
              'text-red-600': installationError,
              'text-gray-600': installationCancelled,
              'dark:text-gray-400': true
            }"
            class="text-sm"
          >
            {{ currentProgress }}
          </span>
        </div>
        <div class="flex gap-2">
          <button
            v-if="!installationComplete && !installationCancelled"
            @click="cancelInstallation"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            :disabled="installationComplete"
          >
            Cancel
          </button>
          <button
            v-if="installationComplete || installationError || installationCancelled"
            @click="closeModal"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
          <button
            v-if="installationError"
            @click="retryInstallation"
            class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
