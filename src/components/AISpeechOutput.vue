<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { IconVolume, IconVolumeOff, IconPlayerPause, IconSettings } from '@tabler/icons-vue'
import { useAISpeech } from '../services/aiSpeech'
import { useAISpeechApi } from '../services/aiSpeechApi'
import { AudioProcessor } from '../services/audioProcessor'

// Add type for input event
type InputEvent = Event & { target: HTMLInputElement }

const props = defineProps<{
  text: string
}>()

const { getInstalledModels, getRecommendedModels } = useAISpeech()
const speechApi = useAISpeechApi()
const audioProcessor = ref<AudioProcessor>()

const isPlaying = ref(false)
const isPaused = ref(false)
const error = ref<string | null>(null)
const volume = ref(0.8)

// Settings
const showSettings = ref(false)
const settings = ref({
  splitSentences: true,
  addSilence: true,
  silenceDuration: 0.25,
  speed: 1.0,
  pitch: 1.0
})

onMounted(() => {
  audioProcessor.value = new AudioProcessor()
  audioProcessor.value.setVolume(volume.value)
})

onBeforeUnmount(() => {
  if (isPlaying.value) {
    stopPlayback()
  }
})

const ttsModels = computed(() => getInstalledModels('tts'))
const hasTTSModel = computed(() => ttsModels.value.length > 0)
const recommendedTTSModel = computed(() => {
  return getRecommendedModels().find(model => model.type === 'tts')?.name || 'bark:small'
})

const currentModel = computed(() => {
  return ttsModels.value[0]
})

const modelCapabilities = computed(() => {
  if (!currentModel.value) return null
  return {
    supportsLongForm: false,
    recommendedChunkSize: 200
  }
})

const stopPlayback = () => {
  isPlaying.value = false
  isPaused.value = false
  // Additional cleanup if needed
}

const speak = async () => {
  if (isPlaying.value || !props.text || !hasTTSModel.value || !audioProcessor.value) return

  try {
    isPlaying.value = true
    error.value = null

    const response = await speechApi.processTextToSpeech({
      model: currentModel.value.name,
      text: props.text,
      options: {
        splitSentences: settings.value.splitSentences && modelCapabilities.value?.supportsLongForm,
        addSilence: settings.value.addSilence,
        silenceDuration: settings.value.silenceDuration,
        speed: settings.value.speed,
        pitch: settings.value.pitch
      }
    })

    const audioBuffer = await audioProcessor.value.arrayBufferToAudioBuffer(response.audio)
    const normalizedBuffer = await audioProcessor.value.normalizeAudio(audioBuffer)
    await audioProcessor.value.playAudio(normalizedBuffer)
    
    isPlaying.value = false
  } catch (err) {
    error.value = 'Failed to process text-to-speech'
    console.error('TTS error:', err)
    isPlaying.value = false
  }
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const updateVolume = (event: InputEvent | number) => {
  const newVolume = typeof event === 'number' ? event : parseFloat(event.target.value)
  volume.value = newVolume
  if (audioProcessor.value) {
    audioProcessor.value.setVolume(newVolume)
  }
}
</script>

<template>
  <div class="relative inline-flex items-center gap-2">
    <button
      @click="speak"
      :disabled="!hasTTSModel"
      class="group flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      :class="{ 'animate-pulse': isPlaying }"
      :title="error || (hasTTSModel ? 'Click to play text-to-speech' : `Install ${recommendedTTSModel} for text-to-speech`)"
    >
      <IconVolume v-if="hasTTSModel && !isPlaying" :size="20" />
      <IconPlayerPause v-else-if="isPlaying" :size="20" />
      <IconVolumeOff v-else :size="20" />
    </button>

    <button
      v-if="hasTTSModel"
      @click="toggleSettings"
      class="flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      :class="{ 'bg-gray-200 dark:bg-gray-700': showSettings }"
    >
      <IconSettings :size="20" />
    </button>

    <!-- Settings Panel -->
    <div
      v-if="showSettings"
      class="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800"
    >
      <div class="space-y-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm text-gray-700 dark:text-gray-300">Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            :value="volume"
            @input="updateVolume($event as InputEvent)"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm text-gray-700 dark:text-gray-300">Speed</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            v-model="settings.speed"
            class="w-full"
          />
        </div>

        <div class="flex items-center justify-between">
          <label class="text-sm text-gray-700 dark:text-gray-300">Split sentences</label>
          <input
            type="checkbox"
            v-model="settings.splitSentences"
            :disabled="!modelCapabilities?.supportsLongForm"
          />
        </div>

        <div class="flex items-center justify-between">
          <label class="text-sm text-gray-700 dark:text-gray-300">Add silence between sentences</label>
          <input
            type="checkbox"
            v-model="settings.addSilence"
          />
        </div>
      </div>
    </div>

    <div
      v-if="!hasTTSModel"
      class="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
    >
      Install {{ recommendedTTSModel }} for text-to-speech
    </div>
  </div>
</template>