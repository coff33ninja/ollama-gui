import { ref } from 'vue'

// Speech recognition setup
const recognition = 'webkitSpeechRecognition' in window
  ? new (window as any).webkitSpeechRecognition()
  : null

if (recognition) {
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = 'en-US'
}

// Speech synthesis setup
const synthesis = window.speechSynthesis
const voices = ref<SpeechSynthesisVoice[]>([])

if (synthesis) {
  // Load voices
  const loadVoices = () => {
    voices.value = synthesis.getVoices()
  }
  loadVoices()
  synthesis.onvoiceschanged = loadVoices
}

export const useSpeech = () => {
  const isListening = ref(false)
  const error = ref<string | null>(null)

  const startListening = () => {
    return new Promise<string>((resolve, reject) => {
      if (!recognition) {
        error.value = 'Speech recognition not supported'
        reject('Speech recognition not supported')
        return
      }

      isListening.value = true
      error.value = null

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        isListening.value = false
        resolve(transcript)
      }

      recognition.onerror = (event: any) => {
        error.value = event.error
        isListening.value = false
        reject(event.error)
      }

      recognition.start()
    })
  }

  const stopListening = () => {
    if (recognition) {
      recognition.stop()
      isListening.value = false
    }
  }

  const speak = (text: string, selectedVoice?: SpeechSynthesisVoice) => {
    return new Promise<void>((resolve, reject) => {
      if (!synthesis) {
        error.value = 'Speech synthesis not supported'
        reject('Speech synthesis not supported')
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      utterance.onend = () => resolve()
      utterance.onerror = (event) => {
        error.value = event.error
        reject(event.error)
      }

      synthesis.speak(utterance)
    })
  }

  const getVoices = () => voices.value

  return {
    isListening,
    error,
    startListening,
    stopListening,
    speak,
    getVoices,
  }
}
