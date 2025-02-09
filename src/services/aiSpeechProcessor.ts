import { baseUrl } from './appConfig'

export const useAISpeechProcessor = () => {
  const processSTT = async (audioBlob: Blob): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)
      
      const response = await fetch(`${baseUrl}/speech-to-text`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process speech-to-text')
      }

      const data = await response.json()
      return data.text
    } catch (error) {
      console.error('Error processing speech-to-text:', error)
      throw error
    }
  }

  const processTTS = async (text: string, modelName: string): Promise<ArrayBuffer> => {
    try {
      const response = await fetch(`${baseUrl}/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model: modelName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process text-to-speech')
      }

      return await response.arrayBuffer()
    } catch (error) {
      console.error('Error processing text-to-speech:', error)
      throw error
    }
  }

  const startRecording = (): Promise<MediaRecorder> => {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream)
          resolve(mediaRecorder)
        })
        .catch(error => {
          console.error('Error accessing microphone:', error)
          reject(error)
        })
    })
  }

  const stopRecording = (mediaRecorder: MediaRecorder): Promise<Blob> => {
    return new Promise((resolve) => {
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        resolve(blob)
      }

      mediaRecorder.stop()
    })
  }

  const playAudio = async (audioBuffer: ArrayBuffer): Promise<void> => {
    const audioContext = new AudioContext()
    const audioBufferSource = audioContext.createBufferSource()
    
    try {
      const decodedBuffer = await audioContext.decodeAudioData(audioBuffer)
      audioBufferSource.buffer = decodedBuffer
      audioBufferSource.connect(audioContext.destination)
      audioBufferSource.start(0)
    } catch (error) {
      console.error('Error playing audio:', error)
      throw error
    }
  }

  return {
    processSTT,
    processTTS,
    startRecording,
    stopRecording,
    playAudio,
  }
}
