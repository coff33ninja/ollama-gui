import { ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { currentModel } from './appConfig'

export interface ModelParameters {
  temperature: number
  top_p: number
  max_tokens: number
}

const defaultParams: ModelParameters = {
  temperature: 0.7,
  top_p: 1,
  max_tokens: 2048
}

// Store parameters for each model
const modelParamsStore = useLocalStorage<Record<string, ModelParameters>>('modelParams', {})

// Current model's parameters
const currentParams = ref<ModelParameters>(defaultParams)

// Update current parameters when model changes
watch(currentModel, (newModel) => {
  if (newModel && newModel !== 'none') {
    currentParams.value = modelParamsStore.value[newModel] || defaultParams
  }
})

export function useModelParams() {
  const updateModelParams = (model: string, params: Partial<ModelParameters>) => {
    if (!modelParamsStore.value[model]) {
      modelParamsStore.value[model] = { ...defaultParams }
    }
    
    modelParamsStore.value[model] = {
      ...modelParamsStore.value[model],
      ...params
    }

    if (model === currentModel.value) {
      currentParams.value = modelParamsStore.value[model]
    }
  }

  const getModelParams = (model: string): ModelParameters => {
    return modelParamsStore.value[model] || defaultParams
  }

  const getCurrentParams = (): ModelParameters => {
    return currentParams.value
  }

  return {
    updateModelParams,
    getModelParams,
    getCurrentParams,
    defaultParams
  }
}
