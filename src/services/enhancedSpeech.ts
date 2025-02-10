import { ref } from 'vue'

export const useEnhancedSpeech = () => {
  const audioContext = ref<AudioContext | null>(null)
  const isInitialized = ref(false)

  const initializeAudio = async () => {
    if (!isInitialized.value) {
      try {
        audioContext.value = new AudioContext()
        await audioContext.value.resume()
        isInitialized.value = true
        return true
      } catch (error) {
        console.error('Failed to initialize audio context:', error)
        return false
      }
    }
    return true
  }

  const startAudio = async () => {
    if (!audioContext.value || audioContext.value.state === 'suspended') {
      return initializeAudio()
    }
    return true
  }

  const stopAudio = () => {
    if (audioContext.value && audioContext.value.state === 'running') {
      audioContext.value.suspend()
    }
  }

  return {
    audioContext,
    isInitialized,
    initializeAudio,
    startAudio,
    stopAudio
  }
}