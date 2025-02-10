import { ref } from 'vue'
import { useSpeech } from './speech'

// Web Speech API setup (fallback)
const webSpeech = useSpeech()

// Custom speech processing state
const isProcessing = ref(false)
const error = ref<string | null>(null)

// Audio recording setup
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])

export const useEnhancedSpeech = () => {
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.value = new MediaRecorder(stream)
      audioChunks.value = []

      mediaRecorder.value.ondataavailable = (event) => {
        audioChunks.value.push(event.data)
      }

      mediaRecorder.value.start()
      isProcessing.value = true
      error.value = null
    } catch (err) {
      error.value = 'Failed to start recording'
      console.error('Recording error:', err)
      // Fallback to Web Speech API
      return webSpeech.startListening()
    }
  }

  const stopRecording = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorder.value) {
        error.value = 'No active recording'
        reject('No active recording')
        return
      }

      mediaRecorder.value.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' })
          const formData = new FormData()
          formData.append('audio', audioBlob)

          // Send to our speech-to-text endpoint
          const response = await fetch('http://localhost:5000/speech-to-text', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            throw new Error('Speech-to-text failed')
          }

          const result = await response.json()
          resolve(result.text)
        } catch (err) {
          console.error('Speech-to-text error:', err)
          // Fallback to Web Speech API
          webSpeech.startListening()
            .then(resolve)
            .catch(reject)
        } finally {
          isProcessing.value = false
        }
      }

      mediaRecorder.value.stop()
      const tracks = mediaRecorder.value.stream.getTracks()
      tracks.forEach(track => track.stop())
    })
  }

  const speak = async (text: string, selectedVoice?: SpeechSynthesisVoice) => {
    try {
      // Try custom TTS first
      const response = await fetch('http://localhost:5000/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error('Text-to-speech failed')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          resolve()
        }
        audio.onerror = (err) => {
          URL.revokeObjectURL(audioUrl)
          reject(err)
        }
        audio.play()
      })
    } catch (err) {
      console.error('TTS error, falling back to Web Speech:', err)
      // Fallback to Web Speech API
      return webSpeech.speak(text, selectedVoice)
    }
  }

  return {
    isProcessing,
    error,
    startRecording,
    stopRecording,
    speak,
    // Also expose Web Speech voices for fallback
    getVoices: webSpeech.getVoices
  }
}