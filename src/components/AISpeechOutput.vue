<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconVolume, IconVolumeOff } from '@tabler/icons-vue'
import { useAISpeech } from '../services/aiSpeech'
import { useAISpeechApi } from '../services/aiSpeechApi'

const props = defineProps<{
  text: string
}>()

const { getInstalledModels, getRecommendedModels } = useAISpeech()
const speechApi = useAISpeechApi()

const isPlaying = ref(false)
const error = ref<string | null>(null)

const ttsModels = computed(() => getInstalledModels('tts'))
const hasTTSModel = computed(() => ttsModels.value.length > 0)
const recommendedTTSModel = computed(() => {
  return getRecommendedModels().find(model => model.type === 'tts')?.name || 'bark:small'
})

const speak = async () => {
  if (isPlaying.value || !props.text || !hasTTSModel.value) return

  try {
    isPlaying.value = true
    error.value = null

    // Use the first available TTS model
    const modelName = ttsModels.value[0].name
    const audioBuffer = await speechApi.processTextToSpeech({
      model: modelName,
      text: props.text
    })

    // Play the audio
    const audioContext = new AudioContext()
    const audioBufferSource = audioContext.createBufferSource()
    
    const decodedBuffer = await audioContext.decodeAudioData(audioBuffer)
    audioBufferSource.buffer = decodedBuffer
    audioBufferSource.connect(audioContext.destination)
    
    audioBufferSource.onended = () => {
      isPlaying.value = false
    }

    audioBufferSource.start(0)
  } catch (err) {
    error.value = 'Failed to process text-to-speech'
    console.error('TTS error:', err)
    isPlaying.value = false
  }
}
</script>

<template>
  <div class="relative">
    <button
      @click="speak"
      :disabled="!hasTTSModel"
      class="group ml-2 flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      :class="{ 'animate-pulse': isPlaying }"
      :title="error || (hasTTSModel ? 'Click to play text-to-speech' : `Install ${recommendedTTSModel} for text-to-speech`)"
    >
      <IconVolume v-if="hasTTSModel" :size="20" />
      <IconVolumeOff v-else :size="20" />
    </button>
    <div v-if="!hasTTSModel" class="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
      Install {{ recommendedTTSModel }} for text-to-speech
    </div>
  </div>
</template>
