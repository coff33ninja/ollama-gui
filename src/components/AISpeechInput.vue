<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { IconMicrophone, IconMicrophoneOff, IconSettings } from '@tabler/icons-vue'
import { useAISpeech } from '../services/aiSpeech'
import { useAISpeechApi } from '../services/aiSpeechApi'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
}>()

const { getInstalledModels, getRecommendedModels } = useAISpeech()
const speechApi = useAISpeechApi()

const isRecording = ref(false)
const error = ref<string | null>(null)
const showSettings = ref(false)

// Settings
const settings = ref({
  maxDuration: 30,
  language: 'en',
  autoSubmit: true,
  autoStopSilence: true,
  silenceThreshold: 0.1, // seconds
})

const audioContext = ref<AudioContext>()
const mediaRecorder = ref<MediaRecorder>()
const analyserNode = ref<AnalyserNode>()
const silenceStart = ref<number>(0)
const recordingStart = ref<number>(0)

// Add type for number input event
type NumberInputEvent = Event & { target: HTMLInputElement }

const hasSTTModel = computed(() => {
  const models = getInstalledModels('stt')
  return models.length > 0
})

const recommendedSTTModel = computed(() => {
  return getRecommendedModels().find(model => model.type === 'stt')?.name || 'whisper:base'
})

const setupAudioContext = async (stream: MediaStream) => {
  audioContext.value = new AudioContext()
  analyserNode.value = audioContext.value.createAnalyser()
  const source = audioContext.value.createMediaStreamSource(stream)
  source.connect(analyserNode.value)
  
  analyserNode.value.fftSize = 2048
}

const checkSilence = () => {
  if (!analyserNode.value || !isRecording.value) return
  
  const dataArray = new Float32Array(analyserNode.value.frequencyBinCount)
  analyserNode.value.getFloatTimeDomainData(dataArray)
  
  const rms = Math.sqrt(dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length)
  
  if (rms < 0.01) { // Silence threshold
    if (silenceStart.value === 0) {
      silenceStart.value = Date.now()
    } else if (Date.now() - silenceStart.value > settings.value.silenceThreshold * 1000) {
      stopRecording()
    }
  } else {
    silenceStart.value = 0
  }
}

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    await setupAudioContext(stream)
    
    const audioChunks: Blob[] = []
    mediaRecorder.value = new MediaRecorder(stream)
    
    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.value.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      try {
        const models = getInstalledModels('stt')
        if (models.length === 0) {
          throw new Error('No STT models installed')
        }

        const result = await speechApi.processSpeechToText({
          model: models[0].name,
          audio: audioBlob,
          language: settings.value.language
        })

        emit('update:modelValue', result.text)
        if (settings.value.autoSubmit) {
          emit('submit')
        }
      } catch (err) {
        error.value = 'Failed to process speech'
        console.error('Processing error:', err)
      } finally {
        isRecording.value = false
        cleanup()
      }
    }

    mediaRecorder.value.start()
    isRecording.value = true
    error.value = null
    recordingStart.value = Date.now()
    silenceStart.value = 0

    // Set up silence detection
    if (settings.value.autoStopSilence) {
      const checkSilenceInterval = setInterval(() => {
        checkSilence()
        
        // Also check max duration
        if (Date.now() - recordingStart.value > settings.value.maxDuration * 1000) {
          stopRecording()
          clearInterval(checkSilenceInterval)
        }
      }, 100)
    }

  } catch (err) {
    error.value = 'Failed to start recording'
    console.error('Recording error:', err)
    isRecording.value = false
  }
}

const stopRecording = () => {
  if (mediaRecorder.value?.state === 'recording') {
    mediaRecorder.value.stop()
  }
}

const cleanup = () => {
  if (audioContext.value) {
    audioContext.value.close()
  }
  mediaRecorder.value?.stream.getTracks().forEach(track => track.stop())
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const updateMaxDuration = (event: NumberInputEvent) => {
  const value = parseInt(event.target.value, 10)
  if (!isNaN(value)) {
    settings.value.maxDuration = Math.max(5, Math.min(300, value))
  }
}

onBeforeUnmount(() => {
  cleanup()
})

const handleClick = () => {
  if (!isRecording.value) {
    startRecording()
  } else {
    stopRecording()
  }
}
</script>

<template>
  <div class="relative inline-flex items-center gap-2">
    <button
      type="button"
      @click="handleClick"
      :disabled="!hasSTTModel"
      class="group flex size-10 items-center justify-center rounded-lg bg-blue-700 text-sm font-medium text-white transition duration-200 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 dark:disabled:bg-gray-600 sm:text-base"
      :class="{ 'animate-pulse': isRecording }"
      :title="error || (isRecording ? 'Recording...' : hasSTTModel ? 'Click to start speech recognition' : `Install ${recommendedSTTModel} for speech recognition`)"
    >
      <IconMicrophone v-if="hasSTTModel" :size="20" />
      <IconMicrophoneOff v-else :size="20" />
    </button>

    <button
      v-if="hasSTTModel"
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
          <label class="text-sm text-gray-700 dark:text-gray-300">Max Duration (seconds)</label>
          <input
            type="number"
            :value="settings.maxDuration"
            @input="updateMaxDuration($event as NumberInputEvent)"
            min="5"
            max="300"
            class="rounded border p-1 dark:bg-gray-700"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm text-gray-700 dark:text-gray-300">Language</label>
          <select
            v-model="settings.language"
            class="rounded border p-1 dark:bg-gray-700"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <!-- Add more languages as needed -->
          </select>
        </div>

        <div class="flex items-center justify-between">
          <label class="text-sm text-gray-700 dark:text-gray-300">Auto-submit</label>
          <input
            type="checkbox"
            v-model="settings.autoSubmit"
          />
        </div>

        <div class="flex items-center justify-between">
          <label class="text-sm text-gray-700 dark:text-gray-300">Auto-stop on silence</label>
          <input
            type="checkbox"
            v-model="settings.autoStopSilence"
          />
        </div>
      </div>
    </div>

    <div
      v-if="!hasSTTModel"
      class="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
    >
      Install {{ recommendedSTTModel }} for speech recognition
    </div>
  </div>
</template>