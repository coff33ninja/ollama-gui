const SPEECH_SERVER = 'http://localhost:5000'

export type SpeechToTextRequest = {
  audio: Blob
  language?: string
  task?: 'transcribe' | 'translate'
}

export type SpeechToTextResponse = {
  text: string
  confidence?: number
  language?: string
}

export type TextToSpeechRequest = {
  text: string
  voice?: string
  language?: string
  options?: {
    splitSentences?: boolean
    addSilence?: boolean
    silenceDuration?: number
    speed?: number
    pitch?: number
  }
}

export type TextToSpeechResponse = {
  audio: ArrayBuffer
  metadata?: {
    duration: number
    sampleRate: number
    format: string
  }
}

export const useAISpeechApi = () => {
  const processSpeechToText = async (params: SpeechToTextRequest): Promise<SpeechToTextResponse> => {
    const formData = new FormData()
    formData.append('audio', params.audio)
    
    if (params.language) {
      formData.append('language', params.language)
    }
    if (params.task) {
      formData.append('task', params.task)
    }

    const response = await fetch(`${SPEECH_SERVER}/speech-to-text`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to process speech-to-text')
    }

    return await response.json()
  }

  const processTextToSpeech = async (params: TextToSpeechRequest): Promise<TextToSpeechResponse> => {
    const response = await fetch(`${SPEECH_SERVER}/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error('Failed to process text-to-speech')
    }

    const audioBuffer = await response.arrayBuffer()
    const metadata = response.headers.get('X-Audio-Metadata')
    
    return {
      audio: audioBuffer,
      metadata: metadata ? JSON.parse(metadata) : undefined
    }
  }

  return {
    processSpeechToText,
    processTextToSpeech,
  }
}