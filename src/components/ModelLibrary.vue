<template>
  <div class="model-library p-4">
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-4 dark:text-white">Model Library</h1>
      
      <!-- Model Installation -->
      <div class="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 class="text-lg font-semibold mb-3 dark:text-white">Install Model</h2>
        <div class="flex gap-2">
          <input
            v-model="modelInput"
            placeholder="Enter model name (e.g., llama2:7b)"
            class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            @click="installModel(modelInput)"
            :disabled="!modelInput || isInstalling"
            class="inline-flex items-center justify-center gap-2 rounded-lg border-none bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
          >
            <IconDownload v-if="!isInstalling" class="h-4 w-4" />
            <div v-else class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            {{ isInstalling ? 'Installing...' : 'Install' }}
          </button>
        </div>
        <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Browse available models at <a href="https://ollama.com/library" target="_blank" class="text-blue-500 hover:underline">ollama.com/library</a></p>
        </div>
      </div>

      <!-- Installed Models -->
      <h2 class="text-lg font-semibold mb-3 dark:text-white">Installed Models</h2>
      <div class="relative">
        <input
          v-model="searchQuery"
          placeholder="Filter installed models..."
          class="w-full px-4 py-2 mb-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div v-if="loading" class="text-center py-8 dark:text-gray-300">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
      Loading models...
    </div>

    <div v-else>
      <div v-if="filteredModels.length === 0" class="text-center py-8 text-gray-600 dark:text-gray-400">
        No models found. Install a model to get started.
      </div>
      
      <div class="grid gap-4">
        <div v-for="model in filteredModels" :key="model.name" 
             class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-semibold text-lg dark:text-white">{{ model.name }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Size: {{ formatSize(model.size) }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Modified: {{ formatDate(model.modified_at) }}
              </p>
            </div>
            <div class="flex flex-col gap-2">
              <div class="flex gap-2">
                <button
                  @click="updateModel(model.name)"
                  class="inline-flex items-center justify-center gap-2 rounded-lg border-none px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  title="Update model"
                >
                  <IconDownload class="h-4 w-4" />
                  Update
                </button>
                <button
                  @click="removeModel(model.name)"
                  class="inline-flex items-center justify-center gap-2 rounded-lg border-none px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  title="Remove model"
                >
                  <IconTrash class="h-4 w-4" />
                  Remove
                </button>
              </div>
              <button
                @click="openConfigModal(model)"
                class="inline-flex items-center justify-center gap-2 rounded-lg border-none px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                title="Configure model parameters"
              >
                <IconSettings class="h-4 w-4" />
                Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Installation Progress Modal -->
    <div v-if="showProgress" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 shadow-xl">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold dark:text-white">
              {{ currentModelName }}
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

    <!-- Configuration Modal -->
    <div v-if="showConfigModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 shadow-xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold dark:text-white">
            {{ selectedModel?.name }} Configuration
          </h3>
          <button 
            @click="closeConfigModal"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <IconX class="h-5 w-5" />
          </button>
        </div>

        <div v-if="modelConfig" class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <!-- License -->
          <div>
            <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-2">License</h4>
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <pre class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{{ modelConfig.license }}</pre>
            </div>
          </div>

          <!-- Parameters -->
          <div>
            <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Model Specifications</h4>
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg space-y-2">
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-300">Size:</span>
                <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">{{ formatSize(selectedModel?.size || 0) }}</span>
              </div>
              <div v-if="modelConfig?.parameters">
                <span class="font-medium text-gray-700 dark:text-gray-300">Parameters:</span>
                <div class="mt-1">
                  <pre class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{{ modelConfig.parameters }}</pre>
                </div>
              </div>
              <div v-if="getContextSize(modelConfig?.modelfile)">
                <span class="font-medium text-gray-700 dark:text-gray-300">Context Window:</span>
                <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">{{ getContextSize(modelConfig?.modelfile) }} tokens</span>
              </div>
              <div v-if="getModelCapabilities(modelConfig?.modelfile)">
                <span class="font-medium text-gray-700 dark:text-gray-300">Capabilities:</span>
                <ul class="mt-1 list-disc list-inside">
                  <li v-for="capability in getModelCapabilities(modelConfig?.modelfile)" 
                      :key="capability"
                      class="text-sm text-gray-600 dark:text-gray-400">
                    {{ capability }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Template -->
          <div>
            <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Template</h4>
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <pre class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{{ modelConfig.template }}</pre>
            </div>
          </div>

          <!-- Modelfile -->
          <div>
            <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Modelfile</h4>
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <pre class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{{ modelConfig.modelfile }}</pre>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-600 dark:text-gray-400">
          Loading configuration...
        </div>

        <div class="mt-6 flex justify-end">
          <button
            @click="closeConfigModal"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Model, ShowModelInformationResponse } from '../services/api'
import { ref, onMounted, watch, computed } from 'vue'
import { useApi } from '../services/api'
import { useAI } from '../services/useAI'
import { IconDownload, IconTrash, IconX, IconSettings } from '@tabler/icons-vue'

const { listLocalModels, pullModel, deleteModel, showModelInformation } = useApi()
const { refreshModels } = useAI()

interface InstalledModel extends Model {
  installed: boolean
}

const models = ref<InstalledModel[]>([])
const filteredModels = ref<InstalledModel[]>([])
const loading = ref(true)
const searchQuery = ref('')
const modelInput = ref('')

// Installation states
const showProgress = ref(false)
const isInstalling = ref(false)
const installationComplete = ref(false)
const installationError = ref(false)
const installationCancelled = ref(false)
const progressLines = ref<string[]>([])
const currentProgress = ref('')
const currentModelName = ref('')
const lastError = ref<Error | null>(null)

// Configuration modal state
const showConfigModal = ref(false)
const selectedModel = ref<Model | null>(null)
const modelConfig = ref<ShowModelInformationResponse | null>(null)

const openConfigModal = async (model: Model) => {
  selectedModel.value = model
  showConfigModal.value = true
  try {
    const config = await showModelInformation({ name: model.name })
    modelConfig.value = config
  } catch (error) {
    console.error('Error fetching model configuration:', error)
  }
}

const closeConfigModal = () => {
  showConfigModal.value = false
  selectedModel.value = null
  modelConfig.value = null
}

// Computed status text
const statusText = computed(() => {
  if (isInstalling.value) return 'Installing'
  if (installationComplete.value) return 'Completed'
  if (installationError.value) return 'Failed'
  if (installationCancelled.value) return 'Cancelled'
  return ''
})

// Fetch models on component mount
onMounted(async () => {
  await fetchModels()
})

// Watch for search query changes to filter installed models
watch(searchQuery, (query) => {
  if (!query) {
    filteredModels.value = models.value
    return
  }
  
  const searchTerm = query.toLowerCase()
  filteredModels.value = models.value.filter(model => 
    model.name.toLowerCase().includes(searchTerm)
  )
})

const resetInstallationState = () => {
  isInstalling.value = false
  installationComplete.value = false
  installationError.value = false
  installationCancelled.value = false
  progressLines.value = []
  currentProgress.value = ''
  lastError.value = null
}

const closeModal = () => {
  showProgress.value = false
  resetInstallationState()
}

const retryInstallation = async () => {
  resetInstallationState()
  await installModel(currentModelName.value)
}

const fetchModels = async () => {
  try {
    loading.value = true
    const response = await listLocalModels()
    models.value = response.models.map(model => ({
      ...model,
      installed: true
    }))
    filteredModels.value = models.value
  } catch (error) {
    console.error('Error fetching models:', error)
  } finally {
    loading.value = false
  }
}

const installModel = async (modelName: string) => {
  if (!modelName) return
  
  try {
    resetInstallationState()
    isInstalling.value = true
    showProgress.value = true
    currentModelName.value = modelName
    currentProgress.value = 'Starting installation...'
    progressLines.value.push(`[${new Date().toLocaleTimeString()}] Starting installation of ${modelName}...`)

    const response = await fetch('http://localhost:11434/api/pull', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
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
      
      modelInput.value = ''
      await fetchModels()
      await refreshModels()
      
      // Auto-close on success after 2 seconds
      setTimeout(closeModal, 2000)
    }
  } catch (error) {
    console.error('Error installing model:', error)
    installationError.value = true
    isInstalling.value = false
    if (error instanceof Error) {
      lastError.value = error
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

const updateModel = async (modelName: string) => {
  await installModel(modelName) // Pull will update if model exists
}

const removeModel = async (modelName: string) => {
  try {
    loading.value = true
    await deleteModel({ model: modelName })
    await fetchModels()
    await refreshModels() // Refresh the global model list
  } catch (error) {
    console.error('Error removing model:', error)
  } finally {
    loading.value = false
  }
}

const formatSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getContextSize = (modelfile: string | undefined): number | null => {
  if (!modelfile) return null
  
  // Look for context_length in parameters
  const contextMatch = modelfile.match(/PARAMETER context_length (\d+)/)
  if (contextMatch) {
    return parseInt(contextMatch[1])
  }
  
  // Look for context window in comments or descriptions
  const windowMatch = modelfile.match(/context.*?window.*?(\d+)/i)
  if (windowMatch) {
    return parseInt(windowMatch[1])
  }
  
  return null
}

const getModelCapabilities = (modelfile: string | undefined): string[] => {
  if (!modelfile) return []
  
  const capabilities: string[] = []
  
  // Common capabilities to look for
  const patterns = [
    { pattern: /code.*generation|generate.*code/i, capability: 'Code Generation' },
    { pattern: /text.*completion|complete.*text/i, capability: 'Text Completion' },
    { pattern: /chat|conversation/i, capability: 'Chat/Conversation' },
    { pattern: /reasoning|logic/i, capability: 'Reasoning' },
    { pattern: /math|arithmetic|calculation/i, capability: 'Mathematics' },
    { pattern: /analysis|analyze/i, capability: 'Analysis' },
    { pattern: /creative.*writing|story/i, capability: 'Creative Writing' },
    { pattern: /translation|translate/i, capability: 'Translation' }
  ]
  
  patterns.forEach(({ pattern, capability }) => {
    if (pattern.test(modelfile)) {
      capabilities.push(capability)
    }
  })
  
  return capabilities
}
</script>