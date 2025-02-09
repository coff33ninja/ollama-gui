<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ModelLibrary from './ModelLibrary.vue'
import SpeechModelInstaller from './SpeechModelInstaller.vue'
import { useAISpeech } from '../services/aiSpeech'
import { IconMessageDots, IconMicrophone, IconVolume, IconInfoCircle } from '@tabler/icons-vue'

const activeTab = ref('text')
const { 
  loading, 
  speechModels, 
  fetchSpeechModels, 
  getRecommendedModels, 
  removeModel,
  getInstalledModels 
} = useAISpeech()

// Installation state
const showInstaller = ref(false)
const selectedModel = ref('')

const tabs = [
  { id: 'text', label: 'Text Models', icon: IconMessageDots },
  { id: 'stt', label: 'Speech Recognition', icon: IconMicrophone },
  { id: 'tts', label: 'Text to Speech', icon: IconVolume }
]

onMounted(async () => {
  await fetchSpeechModels()
})

const installModel = (modelName: string) => {
  selectedModel.value = modelName
  showInstaller.value = true
}

const handleInstallComplete = async () => {
  await fetchSpeechModels()
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
</script>

<template>
  <div class="model-library-tabs">
    <!-- Tab Navigation -->
    <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
      <ul class="flex flex-wrap -mb-px text-sm font-medium text-center">
        <li v-for="tab in tabs" :key="tab.id" class="mr-2">
          <button
            @click="activeTab = tab.id"
            :class="[
              'inline-flex items-center gap-2 p-4 rounded-t-lg',
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
            ]"
          >
            <component :is="tab.icon" class="w-5 h-5" />
            {{ tab.label }}
          </button>
        </li>
      </ul>
    </div>

    <!-- Requirements Notice -->
    <div v-if="activeTab !== 'text'" class="mx-4 mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
      <div class="flex items-start gap-2">
        <IconInfoCircle class="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
        <div>
          <h4 class="font-medium text-yellow-800 dark:text-yellow-300">Requirements</h4>
          <p class="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
            Speech models require Hugging Face Transformers. Install with:
            <code class="px-2 py-1 mt-2 block bg-yellow-100 dark:bg-yellow-900/40 rounded">pip install transformers torch</code>
          </p>
        </div>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Text Models Tab -->
      <div v-if="activeTab === 'text'" class="tab-pane">
        <ModelLibrary />
      </div>

      <!-- Speech Recognition Models Tab -->
      <div v-if="activeTab === 'stt'" class="tab-pane">
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4 dark:text-white">Speech Recognition Models</h2>
          
          <!-- Recommended Models -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-3 dark:text-white">Recommended Models</h3>
            <div class="grid gap-4">
              <div
                v-for="model in getRecommendedModels().filter(m => m.type === 'stt')"
                :key="model.name"
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-semibold text-lg dark:text-white">{{ model.name }}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ model.description }}</p>
                  </div>
                  <button
                    v-if="!model.installed"
                    @click="installModel(model.name)"
                    :disabled="loading"
                    class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <span v-if="loading" class="animate-spin">⌛</span>
                    Install
                  </button>
                  <button
                    v-else
                    @click="removeModel(model.name)"
                    :disabled="loading"
                    class="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Installed Models -->
          <div>
            <h3 class="text-lg font-semibold mb-3 dark:text-white">Installed Models</h3>
            <div v-if="loading" class="text-center py-8 dark:text-gray-300">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
              Loading models...
            </div>
            <div v-else-if="getInstalledModels('stt').length === 0" class="text-center py-8 text-gray-600 dark:text-gray-400">
              No speech recognition models installed.
            </div>
            <div v-else class="grid gap-4">
              <div
                v-for="model in getInstalledModels('stt')"
                :key="model.name"
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-semibold text-lg dark:text-white">{{ model.name }}</h4>
                    <p v-if="model.size" class="text-sm text-gray-600 dark:text-gray-400">
                      Size: {{ formatSize(model.size) }}
                    </p>
                    <p v-if="model.modified_at" class="text-sm text-gray-600 dark:text-gray-400">
                      Modified: {{ formatDate(model.modified_at) }}
                    </p>
                  </div>
                  <button
                    @click="removeModel(model.name)"
                    :disabled="loading"
                    class="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Text to Speech Models Tab -->
      <div v-if="activeTab === 'tts'" class="tab-pane">
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4 dark:text-white">Text to Speech Models</h2>
          
          <!-- Recommended Models -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-3 dark:text-white">Recommended Models</h3>
            <div class="grid gap-4">
              <div
                v-for="model in getRecommendedModels().filter(m => m.type === 'tts')"
                :key="model.name"
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-semibold text-lg dark:text-white">{{ model.name }}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ model.description }}</p>
                  </div>
                  <button
                    v-if="!model.installed"
                    @click="installModel(model.name)"
                    :disabled="loading"
                    class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <span v-if="loading" class="animate-spin">⌛</span>
                    Install
                  </button>
                  <button
                    v-else
                    @click="removeModel(model.name)"
                    :disabled="loading"
                    class="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Installed Models -->
          <div>
            <h3 class="text-lg font-semibold mb-3 dark:text-white">Installed Models</h3>
            <div v-if="loading" class="text-center py-8 dark:text-gray-300">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
              Loading models...
            </div>
            <div v-else-if="getInstalledModels('tts').length === 0" class="text-center py-8 text-gray-600 dark:text-gray-400">
              No text-to-speech models installed.
            </div>
            <div v-else class="grid gap-4">
              <div
                v-for="model in getInstalledModels('tts')"
                :key="model.name"
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-semibold text-lg dark:text-white">{{ model.name }}</h4>
                    <p v-if="model.size" class="text-sm text-gray-600 dark:text-gray-400">
                      Size: {{ formatSize(model.size) }}
                    </p>
                    <p v-if="model.modified_at" class="text-sm text-gray-600 dark:text-gray-400">
                      Modified: {{ formatDate(model.modified_at) }}
                    </p>
                  </div>
                  <button
                    @click="removeModel(model.name)"
                    :disabled="loading"
                    class="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Model Installation Modal -->
    <SpeechModelInstaller
      :show="showInstaller"
      :model-name="selectedModel"
      @close="showInstaller = false"
      @complete="handleInstallComplete"
    />
  </div>
</template>
