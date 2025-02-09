<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconMicrophone, IconMicrophoneOff } from '@tabler/icons-vue'
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

const hasSTTModel = computed(() => {
  const models = getInstalledModels('stt')
  return models.length > 0
})

const recommendedSTTModel = computed(() => {
  return getRecommendedModels().find(model => model.type === 'stt')?.name || 'whisper:base'
})

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)
    const audioChunks: Blob[] = []

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      try {
        const models = getInstalledModels('stt')
        if (models.length === 0) {
          throw new Error('No STT models installed')
        }

        const result = await speechApi.processSpeechToText({
          model: models[0].name,
          audio: audioBlob
        })

        emit('update:modelValue', result.text)
        emit('submit')
      } catch (err) {
        error.value = 'Failed to process speech'
        console.error('Processing error:', err)
      } finally {
        isRecording.value = false
      }
    }

    mediaRecorder.start()
    isRecording.value = true
    error.value = null

    // Stop recording after 10 seconds
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
        stream.getTracks().forEach(track => track.stop())
      }
    }, 10000)
  } catch (err) {
    error.value = 'Failed to start recording'
    console.error('Recording error:', err)
    isRecording.value = false
  }
}

const handleClick = () => {
  if (!isRecording.value) {
    startRecording()
  }
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      @click="handleClick"
      :disabled="!hasSTTModel"
      class="group flex size-10 items-center justify-center rounded-lg bg-blue-700 text-sm font-medium text-white transition duration-200 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 dark:disabled:bg-gray-600 sm:text-base"
      :class="{ 'animate-pulse': isRecording }"
      :title="error || (isRecording ? 'Recording... (max 10s)' : hasSTTModel ? 'Click to start speech recognition' : `Install ${recommendedSTTModel} for speech recognition`)"
    >
      <IconMicrophone v-if="hasSTTModel" :size="20" />
      <IconMicrophoneOff v-else :size="20" />
    </button>
    <div v-if="!hasSTTModel" class="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
      Install {{ recommendedSTTModel }} for speech recognition
    </div>
  </div>
</template>
