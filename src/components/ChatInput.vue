<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useTextareaAutosize } from '@vueuse/core'
import { useChats } from '../services/chat.ts'
import { IconPlayerStopFilled, IconSend, IconWhirl } from '@tabler/icons-vue'
import { isSTTEnabled } from '../services/appConfig'
import { useAISpeech } from '../services/aiSpeech'
import AISpeechInput from './AISpeechInput.vue'
import SpeechButton from './SpeechButton.vue'

const { textarea, input: userInput } = useTextareaAutosize({ input: '' })
const { addUserMessage, abort, hasActiveChat } = useChats()
const { getInstalledModels, fetchSpeechModels } = useAISpeech()

const isInputValid = computed<boolean>(() => !!userInput.value.trim())
const isAiResponding = ref(false)
const flag = ref(true)

const hasSTTModel = computed(() => {
  const models = getInstalledModels('stt')
  return models.length > 0
})

onMounted(async () => {
  await fetchSpeechModels()
})

const handleSubmit = () => {
  if (isAiResponding.value) {
    abort()
    isAiResponding.value = false
    return
  }

  if (isInputValid.value) {
    addUserMessage(userInput.value.trim()).then(() => {
      isAiResponding.value = false
    })
    userInput.value = ''
    isAiResponding.value = true
  }
}

const shouldSubmit = ({ key, shiftKey }: KeyboardEvent): boolean => {
  return key === 'Enter' && !shiftKey
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (shouldSubmit(event) && flag.value) {
    // Pressing enter while the ai is responding should not abort the request
    if (isAiResponding.value) {
      return
    }

    event.preventDefault()
    handleSubmit()
  }
}

const handleCompositionStart = () => {
  flag.value = false
}

const handleCompositionEnd = () => {
  flag.value = true
}

const handleTranscription = (text: string) => {
  userInput.value = text
}

defineEmits<{
  (e: 'submit', value: string): void
}>()
</script>

<template>
  <form class="mt-2" @submit.prevent="handleSubmit">
    <div class="relative">
      <textarea
        ref="textarea"
        v-model="userInput"
        class="block max-h-[500px] w-full resize-none rounded-xl border-none bg-gray-50 p-4 pl-4 pr-24 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:text-gray-50 dark:placeholder-gray-300 dark:focus:ring-blue-600 sm:text-base"
        placeholder="Enter your prompt"
        @keydown="handleKeyDown"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
      />
      <div class="absolute bottom-2 right-2.5 flex gap-2">
        <SpeechButton 
          v-if="isSTTEnabled && hasSTTModel"
          mode="input" 
          @transcription="handleTranscription" 
        />
        <button
          type="submit"
          :disabled="!isInputValid && !isAiResponding"
          class="group flex size-10 items-center justify-center rounded-lg bg-blue-700 text-sm font-medium text-white transition duration-200 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 dark:disabled:bg-gray-600 sm:text-base"
        >
          <IconPlayerStopFilled
            v-if="isAiResponding"
            class="absolute opacity-0 transition duration-200 ease-in-out group-hover:opacity-100"
            :size="20"
          />
          <IconWhirl
            class="absolute animate-spin opacity-50 transition duration-200 ease-in-out group-hover:opacity-0"
            v-if="isAiResponding"
            :size="20"
          />
          <IconSend v-else :size="20" />
        </button>
      </div>
    </div>
  </form>
</template>