import { ref } from 'vue'
import { useApi } from './api'

export type SpeechModel = {
  name: string
  type: 'tts' | 'stt'
  installed: boolean
  size?: number
  modified_at?: string
}

export const useAISpeech = () => {
  const { listLocalModels, pullModel, deleteModel } = useApi()
  const loading = ref(false)
  const speechModels = ref<SpeechModel[]>([])

  // Known speech model prefixes/identifiers
  const knownModels = {
    tts: ['bark-', 'coqui-', 'fastspeech-'],
    stt: ['whisper-', 'wav2vec-']
  }

  const isSpeechModel = (modelName: string): { is: boolean, type?: 'tts' | 'stt' } => {
    for (const [type, prefixes] of Object.entries(knownModels)) {
      if (prefixes.some(prefix => modelName.toLowerCase().startsWith(prefix))) {
        return { is: true, type: type as 'tts' | 'stt' }
      }
    }
    return { is: false }
  }

  const fetchSpeechModels = async () => {
    try {
      loading.value = true
      const response = await listLocalModels()
      
      // Filter and categorize speech models
      speechModels.value = response.models
        .filter(model => isSpeechModel(model.name).is)
        .map(model => ({
          ...model,
          type: isSpeechModel(model.name).type!,
          installed: true
        }))
    } catch (error) {
      console.error('Error fetching speech models:', error)
    } finally {
      loading.value = false
    }
  }

  const getRecommendedModels = () => {
    return [
      {
        name: 'whisper:base',
        type: 'stt' as const,
        description: 'OpenAI Whisper Base model for speech recognition',
        installed: speechModels.value.some(m => m.name === 'whisper:base')
      },
      {
        name: 'bark:small',
        type: 'tts' as const,
        description: 'Suno Bark small model for text-to-speech',
        installed: speechModels.value.some(m => m.name === 'bark:small')
      }
    ]
  }

  const installModel = async (modelName: string) => {
    try {
      loading.value = true
      await pullModel({ name: modelName })
      await fetchSpeechModels()
    } catch (error) {
      console.error('Error installing model:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const removeModel = async (modelName: string) => {
    try {
      loading.value = true
      await deleteModel({ model: modelName })
      await fetchSpeechModels()
    } catch (error) {
      console.error('Error removing model:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const getInstalledModels = (type: 'tts' | 'stt') => {
    return speechModels.value.filter(model => model.type === type)
  }

  return {
    loading,
    speechModels,
    fetchSpeechModels,
    getRecommendedModels,
    installModel,
    removeModel,
    getInstalledModels,
  }
}
