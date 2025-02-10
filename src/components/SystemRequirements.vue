<template>
  <div class="system-requirements p-4">
    <h2 class="text-xl font-bold mb-4">System Requirements</h2>
    
    <div v-if="loading" class="text-gray-600">
      Checking system requirements...
    </div>
    
    <div v-else-if="error" class="text-red-500">
      {{ error }}
    </div>
    
    <div v-else class="space-y-4">
      <div v-for="req in requirements" :key="req.name" 
           class="p-4 rounded-lg" 
           :class="getStatusClass(req)">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold">{{ req.name }}</h3>
            <p class="text-sm" v-if="req.version">Version: {{ req.version }}</p>
            <p class="text-sm text-red-500" v-if="req.error">{{ req.error }}</p>
          </div>
          
          <div>
            <button v-if="!req.installed || !req.meetsRequirement"
                    @click="installRequirement(req.name)"
                    :disabled="installing === req.name"
                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50">
              {{ installing === req.name ? 'Installing...' : 'Install' }}
            </button>
            <span v-else-if="req.meetsRequirement" class="text-green-500">✓ Ready</span>
            <span v-else class="text-yellow-500">⚠ Update needed</span>
          </div>
        </div>
        
        <div v-if="installOutput[req.name]" class="mt-2">
          <pre class="text-sm bg-gray-100 p-2 rounded">{{ installOutput[req.name] }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Requirement {
  name: string
  installed: boolean
  version?: string
  meetsRequirement?: boolean
  error?: string
  required: boolean
}

const requirements = ref<Requirement[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const installing = ref<string | null>(null)
const installOutput = ref<Record<string, string>>({})

const checkRequirements = async () => {
  try {
    const response = await fetch('/api/check-system')
    if (!response.ok) throw new Error('Failed to check system requirements')
    const data = await response.json()
    requirements.value = data.results
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

const installRequirement = async (name: string) => {
  installing.value = name
  installOutput.value[name] = ''
  
  try {
    const response = await fetch('/api/install-system-requirement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const text = new TextDecoder().decode(value)
      installOutput.value[name] += text
    }

    await checkRequirements()
  } catch (err) {
    installOutput.value[name] += `\nError: ${(err as Error).message}`
  } finally {
    installing.value = null
  }
}

const getStatusClass = (req: Requirement) => {
  if (!req.installed) {
    return 'bg-red-50 border border-red-200'
  }
  if (!req.meetsRequirement) {
    return 'bg-yellow-50 border border-yellow-200'
  }
  return 'bg-green-50 border border-green-200'
}

onMounted(checkRequirements)
</script>