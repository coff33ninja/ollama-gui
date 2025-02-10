<script setup lang="ts">
import { ref } from 'vue'
import { IconVolume, IconMicrophone } from '@tabler/icons-vue'
import { useEnhancedSpeech } from '../services/enhancedSpeech'
import { isTTSEnabled, selectedVoice } from '../services/appConfig'

const props = defineProps<{
  text?: string
  mode?: 'input' | 'output'
}>()

const emit = defineEmits<{
  (e: 'transcription', text: string): void
}>()

const { speak, getVoices, startRecording, stopRecording, isProcessing } = useEnhancedSpeech()
const isRecording = ref(false)

const handleSpeak = async () => {
  if (!isTTSEnabled.value || !props.text) return
  
  const voices = getVoices()
  const voice = voices.find(v => v.name === selectedVoice.value)
  await speak(props.text, voice)
}

const handleRecordingStart = async () => {
  isRecording.value = true
  await startRecording()
}

const handleRecordingStop = async () => {
  isRecording.value = false
  try {
    const text = await stopRecording()
    emit('transcription', text)
  } catch (err) {
    console.error('Recording error:', err)
  }
}

const isInput = props.mode === 'input'
const buttonClass = `ml-2 flex size-8 items-center justify-center rounded-lg 
  ${isRecording.value ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'} 
  dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300
  ${isProcessing.value ? 'animate-pulse' : ''}`
</script>

<template>
  <!-- Input mode (microphone) -->
  <button
    v-if="isInput"
    @mousedown="handleRecordingStart"
    @mouseup="handleRecordingStop"
    @mouseleave="handleRecordingStop"
    :class="buttonClass"
  >
    <IconMicrophone :size="20" />
  </button>

  <!-- Output mode (speaker) -->
  <button
    v-else-if="isTTSEnabled && text"
    @click="handleSpeak"
    :class="buttonClass"
  >
    <IconVolume :size="20" />
  </button>
</template>