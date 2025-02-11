import { ref } from 'vue'

export type SpeechModel = {
  name: string
  type: 'tts' | 'stt'
  available: boolean
}

export const useAISpeech = () => {
  const loading = ref(false)
  const speechModels = ref<SpeechModel[]>([
    {
      name: 'whisper',
      type: 'stt',
      available: true
    },
    {
      name: 'bark',
      type: 'tts',
      available: true
    }
  ])

  // We don't need to fetch models anymore since they're handled by Python server
  const fetchSpeechModels = async () => {
    // Just check if server is available
    try {
      loading.value = true
      const response = await fetch('http://localhost:5000/health')
      const data = await response.json()
      
      // Update models availability based on server health
      speechModels.value = speechModels.value.map(model => ({
        ...model,
        available: data.status === 'ok'
      }))
    } catch (error) {
      console.error('Speech server not available:', error)
      speechModels.value = speechModels.value.map(model => ({
        ...model,
        available: false
      }))
    } finally {
      loading.value = false
    }
  }

  const getInstalledModels = (type: 'tts' | 'stt') => {
    return speechModels.value.filter(model => model.type === type && model.available)
  }

  return {
    loading,
    speechModels,
    fetchSpeechModels,
    getInstalledModels
  }
}