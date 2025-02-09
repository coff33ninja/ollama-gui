import {
  ChatCompletedResponse,
  ChatPartResponse,
  ChatResponse,
  Model,
  useApi,
} from './api.ts'

import { ref } from 'vue'
import { Message } from './database'

// Define availableModels outside the function to ensure a shared state.
const availableModels = ref<Model[]>([])

export const useAI = () => {
  const { generateChat, listLocalModels, pullModel } = useApi()
  const generate = async (
    model: string,
    messages: Message[],
    system?: Message,
    historyMessageLength?: number,
    onMessage?: (data: ChatResponse | ChatPartResponse | ChatCompletedResponse) => void,
    onDone?: (data: ChatCompletedResponse) => void,
  ) => {
    let chatHistory = messages.slice(-(historyMessageLength ?? 0))
    if (system) {
      chatHistory.unshift(system)
    }
    await generateChat({ model, messages: chatHistory }, (data: ChatResponse) => {
      if (!data.done && onMessage) {
        onMessage(data as ChatPartResponse)
      } else if (data.done && onDone) {
        onDone(data as ChatCompletedResponse)
      }
    })
  }

  const refreshModels = async () => {
    const response = await listLocalModels()
    availableModels.value = response.models
  }

  // New method to install a model
  const installModel = async (modelName: string) => {
    await pullModel({ name: modelName })
    await refreshModels() // Refresh the model list after installation
  }

  // Use toRefs to keep reactivity when destructuring in components.
  return {
    availableModels,
    generate,
    refreshModels,
    installModel, // Expose the new method
  }
}
