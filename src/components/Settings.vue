<script setup lang="ts">
import { IconLayoutSidebarRightCollapse } from '@tabler/icons-vue'
import ToggleInput from './Inputs/ToggleInput.vue'
import TextInput from './Inputs/TextInput.vue'
import ModelLibrary from './ModelLibrary.vue'
import ModelLibraryTabs from './ModelLibraryTabs.vue'
import SpeechSettings from './SpeechSettings.vue'
import SystemRequirements from './Settings/SystemRequirements.vue'
import {
  baseUrl,
  historyMessageLength,
  debugMode,
  gravatarEmail,
  toggleSettingsPanel,
  scrollBehavior,
  currentModel,
} from '../services/appConfig.ts'
import { useSpeech } from '../services/speech'
import { useApi } from '../services/api'
import { useModelParams } from '../services/modelParams'
import { ref, onMounted, watch } from 'vue'

const { getVoices } = useSpeech()
const { showModelInformation } = useApi()
const { updateModelParams, getCurrentParams, defaultParams } = useModelParams()

const voices = ref<SpeechSynthesisVoice[]>([])
const isLoadingParams = ref(false)
const modelParams = ref(defaultParams)

// Ollama server control
const isOllamaRunning = ref(false)

const checkOllamaStatus = async () => {
  try {
    const response = await fetch('http://localhost:5000/status') // Replace with actual status endpoint
    isOllamaRunning.value = response.ok
  } catch (error) {
    console.error('Error checking Ollama status:', error)
    isOllamaRunning.value = false
  }
}

const startOllama = async () => {
  try {
    await fetch('http://localhost:5000/start', { method: 'POST' }) // Replace with actual start endpoint
    checkOllamaStatus() // Check status after attempting to start
  } catch (error) {
    console.error('Error starting Ollama:', error)
  }
}

const stopOllama = async () => {
  try {
    await fetch('http://localhost:YOUR_OLLAMA_PORT/stop', { method: 'POST' }) // Replace with actual stop endpoint
    checkOllamaStatus() // Check status after attempting to stop
  } catch (error) {
    console.error('Error stopping Ollama:', error)
  }
}

const fetchModelParams = async (modelName: string) => {
  if (!modelName || modelName === 'none') return

  try {
    isLoadingParams.value = true
    const info = await showModelInformation({ name: modelName })

    // Parse parameters from the modelfile
    if (info.parameters) {
      try {
        const params = JSON.parse(info.parameters)
        modelParams.value = {
          temperature: params.temperature ?? defaultParams.temperature,
          top_p: params.top_p ?? defaultParams.top_p,
          max_tokens: params.max_length ?? defaultParams.max_tokens
        }
        updateModelParams(modelName, modelParams.value)
      } catch (e) {
        console.error('Error parsing model parameters:', e)
        modelParams.value = getCurrentParams()
      }
    }
  } catch (e) {
    console.error('Error fetching model information:', e)
    modelParams.value = getCurrentParams()
  } finally {
    isLoadingParams.value = false
  }
}

// Watch for parameter changes
watch(modelParams, (newParams) => {
  if (currentModel.value && currentModel.value !== 'none') {
    updateModelParams(currentModel.value, newParams)
  }
}, { deep: true })

// Watch for model changes
watch(currentModel, (newModel) => {
  if (newModel && newModel !== 'none') {
    fetchModelParams(newModel)
  }
})

onMounted(() => {
  voices.value = getVoices()
  if (currentModel.value && currentModel.value !== 'none') {
    fetchModelParams(currentModel.value)
  }
  checkOllamaStatus() // Check the initial status of Ollama
})
</script>

<template>
  <aside>
    <div
      class="relative h-screen w-[500px] overflow-y-auto border-l border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-900"
    >
      <div class="mb-4 flex items-center gap-x-2 px-4 text-gray-900 dark:text-gray-100">
        <button
          @click="toggleSettingsPanel()"
          class="inline-flex rounded-lg p-1 hover:bg-gray-100 hover:dark:bg-gray-700"
        >
          <IconLayoutSidebarRightCollapse class="h-6 w-6" />
          <span class="sr-only">Close settings sidebar</span>
        </button>
        <h2 class="text-lg font-medium">Settings</h2>
      </div>

      <!-- System Requirements Section -->
      <!-- Status Indicators -->
      <div class="mb-6 px-4 flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full" :class="isOllamaRunning ? 'bg-green-500' : 'bg-red-500'"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">Ollama</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full" :class="isSpeechServerRunning ? 'bg-green-500' : 'bg-red-500'"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">Speech</span>
        </div>
      </div>

      <!-- System Status Section -->
      <div class="mb-6 border-b border-gray-200 dark:border-gray-700 px-4">
        <!-- Status Indicators -->
        <div class="mb-6 px-4 flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full" :class="isOllamaRunning ? 'bg-green-500' : 'bg-red-500'"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Ollama</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full" :class="isSpeechServerRunning ? 'bg-green-500' : 'bg-red-500'"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Speech</span>
          </div>
        </div>
      </div>

      <!-- Model Libraries Section -->
      <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div class="px-4">
          <div class="mb-4">
            <h3 class="text-lg font-semibold dark:text-white">Models</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Manage text and speech models for your chat experience
            </p>
          </div>
          <ModelLibraryTabs />
        </div>
      </div>

      <!-- Model Parameters -->
      <div v-if="currentModel && currentModel !== 'none'" class="mb-6 border-b border-gray-200 px-4 pb-6 dark:border-gray-700">
        <h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">Model Parameters</h3>
        <div class="space-y-4">
          <div>
            <label for="temperature" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
              Temperature
              <span class="ml-1 text-xs text-gray-500">(0-1)</span>
            </label>
            <input
              type="number"
              id="temperature"
              v-model.number="modelParams.temperature"
              min="0"
              max="1"
              step="0.1"
              :disabled="isLoadingParams"
              class="block w-full rounded-lg bg-gray-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:focus:ring-blue-600"
            />
            <p class="mt-1 text-xs text-gray-500">Controls randomness: Lower values make responses more focused and deterministic</p>
          </div>

          <div>
            <label for="top-p" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
              Top P
              <span class="ml-1 text-xs text-gray-500">(0-1)</span>
            </label>
            <input
              type="number"
              id="top-p"
              v-model.number="modelParams.top_p"
              min="0"
              max="1"
              step="0.1"
              :disabled="isLoadingParams"
              class="block w-full rounded-lg bg-gray-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:focus:ring-blue-600"
            />
            <p class="mt-1 text-xs text-gray-500">Controls diversity via nucleus sampling: 0.1 means only consider tokens comprising the top 10% probability mass</p>
          </div>

          <div>
            <label for="max-tokens" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
              Max Tokens
            </label>
            <input
              type="number"
              id="max-tokens"
              v-model.number="modelParams.max_tokens"
              min="1"
              :disabled="isLoadingParams"
              class="block w-full rounded-lg bg-gray-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:focus:ring-blue-600"
            />
            <p class="mt-1 text-xs text-gray-500">Maximum number of tokens to generate in the response</p>
          </div>
        </div>
      </div>

      <!-- General Settings -->
      <div class="px-4 py-4 text-gray-900 dark:text-gray-100">
        <h3 class="mb-4 text-lg font-medium">General Settings</h3>

        <div class="space-y-4">
          <div>
            <ToggleInput label="Enable debug mode" v-model="debugMode" />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium">
              Chat Scroll Behavior
            </label>
            <select
              v-model="scrollBehavior"
              class="block w-full rounded-lg bg-gray-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:placeholder-gray-300 dark:focus:ring-blue-600"
            >
              <option value="follow">Follow AI Text</option>
              <option value="end">Scroll to End</option>
            </select>
          </div>

          <div>
            <TextInput label="Base URL" v-model="baseUrl" />
          </div>

          <div>
            <TextInput label="Gravatar Email" v-model="gravatarEmail" />
          </div>

          <!-- Speech Settings -->
          <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
            <SpeechSettings />
          </div>

          <div>
            <label for="chat-history-length" class="mb-2 block text-sm font-medium">
              Conversation History Size
            </label>
            <input
              type="number"
              min="0"
              max="100"
              id="chat-history-length"
              v-model="historyMessageLength"
              class="block w-full rounded-lg bg-gray-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:placeholder-gray-300 dark:focus:ring-blue-600"
              placeholder="Number of messages to keep in context"
            />
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>