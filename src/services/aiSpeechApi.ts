import { baseUrl } from './appConfig'

export type SpeechToTextRequest = {
  model: string
  audio: Blob
}

export type SpeechToTextResponse = {
  text: string
}

export type TextToSpeechRequest = {
  model: string
  text: string
}

const getApiUrl = (path: string) =>
  `${baseUrl.value || 'http://localhost:11434/api'}${path}`

export const useAISpeechApi = () => {
  const processSpeechToText = async (params: SpeechToTextRequest): Promise<SpeechToTextResponse> => {
    const formData = new FormData()
    formData.append('audio', params.audio)
    formData.append('model', params.model)

    const response = await fetch(getApiUrl('/speech-to-text'), {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to process speech-to-text')
    }

    return await response.json()
  }

  const processTextToSpeech = async (params: TextToSpeechRequest): Promise<ArrayBuffer> => {
    const response = await fetch(getApiUrl('/text-to-speech'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error('Failed to process text-to-speech')
    }

    return await response.arrayBuffer()
  }

  return {
    processSpeechToText,
    processTextToSpeech,
  }
}
