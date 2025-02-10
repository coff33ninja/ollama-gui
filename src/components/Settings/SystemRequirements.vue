<template>
  <div class="system-requirements">
    <h2 class="text-xl font-semibold mb-4 dark:text-white">System Requirements</h2>

    <!-- Status Overview -->
    <div class="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium dark:text-white">Overall Status</span>
        <StatusBadge :status="overallStatus" />
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ statusMessage }}
      </p>
    </div>

    <!-- Requirements List -->
    <div class="space-y-4">
      <div v-for="req in requirements" :key="req.name" 
           class="requirement-card p-4 rounded-lg border"
           :class="getCardClass(req)">
        <!-- Header -->
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="font-medium dark:text-white">{{ req.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400" v-if="req.version">
              Version {{ req.version }}
              <span v-if="req.expectedVersion" class="text-xs">
                (Required: {{ req.expectedVersion }}+)
              </span>
            </p>
          </div>
          <StatusBadge :status="getStatus(req)" />
        </div>

        <!-- Error Message -->
        <div v-if="req.error" class="mt-2 text-sm text-red-600 dark:text-red-400">
          {{ req.error }}
        </div>

        <!-- Install Button -->
        <div v-if="!req.installed || !req.meetsRequirement" class="mt-3">
          <button
            @click="installRequirement(req.name)"
            :disabled="installing === req.name"
            class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="installing === req.name">
              <i class="fas fa-spinner fa-spin mr-2"></i>
              Installing...
            </span>
            <span v-else>
              <i class="fas fa-download mr-2"></i>
              Install
            </span>
          </button>
        </div>

        <!-- Installation Output -->
        <div v-if="installOutput[req.name]" class="mt-3">
          <div class="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded-md overflow-x-auto">
            <pre>{{ installOutput[req.name] }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import StatusBadge from './StatusBadge.vue'

interface Requirement {
  name: string
  installed: boolean
  version?: string
  expectedVersion?: string
  meetsRequirement?: boolean
  error?: string
  required: boolean
}

const requirements = ref<Requirement[]>([])
const installing = ref<string | null>(null)
const installOutput = ref<Record<string, string>>({})
const error = ref<string | null>(null)

const checkRequirements = async () => {
  try {
    const response = await fetch('/api/check-system')
    if (!response.ok) throw new Error('Failed to check system requirements')
    const data = await response.json()
    requirements.value = data.results
  } catch (err) {
    error.value = (err as Error).message
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

const getStatus = (req: Requirement) => {
  if (!req.installed) return 'error'
  if (!req.meetsRequirement) return 'warning'
  return 'success'
}

const overallStatus = computed(() => {
  if (requirements.value.some(r => !r.installed && r.required)) return 'error'
  if (requirements.value.some(r => !r.meetsRequirement && r.required)) return 'warning'
  return 'success'
})

const statusMessage = computed(() => {
  if (overallStatus.value === 'error') {
    return 'Some required components are missing. Please install them to ensure full functionality.'
  }
  if (overallStatus.value === 'warning') {
    return 'Some components need updates. The application may work with limited functionality.'
  }
  return 'All system requirements are met!'
})

const getCardClass = (req: Requirement) => {
  const status = getStatus(req)
  return {
    'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20': status === 'error',
    'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20': status === 'warning',
    'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20': status === 'success'
  }
}

onMounted(checkRequirements)
</script>