export interface Model {
  name: string
  modified_at: string
  size: number
  installed?: boolean
}

export interface ChatMessage {
  role: string
  content: string
}

export interface ChatRequest {
  model: string
  messages?: ChatMessage[]
}

export interface ChatResponse {
  model: string
  created_at: string
  message: ChatMessage
  done: boolean
}

export interface ShowModelInformationResponse {
  license: string
  modelfile: string
  parameters: string
  template: string
}

export interface SpeechToTextRequest {
  model: string
  audio: Blob
}

export interface SpeechToTextResponse {
  text: string
}

export interface TextToSpeechRequest {
  model: string
  text: string
}

export interface ListModelsResponse {
  models: Model[]
}
