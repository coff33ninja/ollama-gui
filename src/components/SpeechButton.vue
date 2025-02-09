<script setup lang="ts">
import { IconVolume } from '@tabler/icons-vue'
import { useSpeech } from '../services/speech'
import { isTTSEnabled, selectedVoice } from '../services/appConfig'

const props = defineProps<{
  text: string
}>()

const { speak, getVoices } = useSpeech()

const handleSpeak = async () => {
  if (!isTTSEnabled.value) return
  
  const voices = getVoices()
  const voice = voices.find(v => v.name === selectedVoice.value)
  await speak(props.text, voice)
}
</script>

<template>
  <button
    v-if="isTTSEnabled"
    @click="handleSpeak"
    class="ml-2 flex size-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
  >
    <IconVolume :size="20" />
  </button>
</template>
