<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { isTTSEnabled, isSTTEnabled, selectedVoice } from '../services/appConfig'
import ToggleInput from './Inputs/ToggleInput.vue'
import { IconDownload, IconCheck, IconX, IconLoader2 } from '@tabler/icons-vue'

const voices = ref<{ name: string; id: string; languages: string[]; gender: string }[]>([])
const serverStatus = ref<'checking' | 'running' | 'stopped'>('checking')
const isInstalling = ref(false)
const installationOutput = ref('')
const showInstallOutput = ref(false)

const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:5000/health')
    if (response.ok) {
      serverStatus.value = 'running'
      await fetchVoices()
    } else {
      serverStatus.value = 'stopped'
    }
  } catch {
    serverStatus.value = 'stopped'
  }
}

const fetchVoices = async () => {
  try {
    const response = await fetch('http://localhost:5000/voices')
    if (response.ok) {
      const data = await response.json()
      voices.value = data.voices
    }
  } catch (error) {
    console.error('Failed to fetch voices:', error)
  }
}

const installDependencies = async () => {
  isInstalling.value = true
  installationOutput.value = ''
  showInstallOutput.value = true

  try {
    // First check Python
    const pythonCheck = await fetch('/api/check-python')
    if (!pythonCheck.ok) {
      installationOutput.value += '❌ Python 3.9+ is required. Please install Python first.\n'
      return
    }
    installationOutput.value += '✅ Python detected\n'

    // Install pip dependencies
    const response = await fetch('/api/install-speech-deps', {
      method: 'POST'
    })

    if (response.ok) {
      const reader = response.body?.getReader()
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = new TextDecoder().decode(value)
          installationOutput.value += text
        }
      }
      
      // Check if installation was successful
      await checkServer()
      if (serverStatus.value === 'running') {
        installationOutput.value += '\n✅ Installation completed successfully!'
      } else {
        installationOutput.value += '\n❌ Installation completed but server is not running.'
      }
    } else {
      installationOutput.value += '\n❌ Installation failed. Check the error messages above.'
    }
  } catch (error) {
    installationOutput.value += `\n❌ Installation error: ${error}`
  } finally {
    isInstalling.value = false
  }
}

const startServer = async () => {
  try {
    await fetch('/api/start-speech-server', { method: 'POST' })
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for server to start
    await checkServer()
  } catch (error) {
    console.error('Failed to start server:', error)
  }
}

onMounted(async () => {
  await checkServer()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="text-md font-medium">Speech Settings</h4>
      <div class="flex items-center space-x-2">
        <span class="text-sm" :class="{
          'text-green-500': serverStatus === 'running',
          'text-red-500': serverStatus === 'stopped',
          'text-gray-500': serverStatus === 'checking'
        }">
          Server: {{ serverStatus === 'checking' ? 'Checking...' : serverStatus === 'running' ? 'Running' : 'Stopped' }}
        </span>
        <IconLoader2 v-if="serverStatus === 'checking'" class="h-5 w-5 animate-spin text-gray-500" />
        <IconCheck v-else-if="serverStatus === 'running'" class="h-5 w-5 text-green-500" />
        <IconX v-else class="h-5 w-5 text-red-500" />
      </div>
    </div>

    <!-- Server not running message -->
    <div v-if="serverStatus === 'stopped'" class="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/30">
      <div class="flex">
        <div class="flex-shrink-0">
          <IconX class="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Speech Server Not Running</h3>
          <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>The speech server is required for voice features. Would you like to install it now?</p>
          </div>
          <div class="mt-4">
            <div class="flex space-x-4">
              <button
                type="button"
                @click="installDependencies"
                :disabled="isInstalling"
                class="inline-flex items-center rounded-md bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-800 shadow-sm ring-1 ring-inset ring-yellow-600/20 hover:bg-yellow-100 disabled:opacity-50 dark:bg-yellow-900/30 dark:text-yellow-200"
              >
                <IconDownload v-if="!isInstalling" class="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                <IconLoader2 v-else class="-ml-0.5 mr-1.5 h-5 w-5 animate-spin" aria-hidden="true" />
                {{ isInstalling ? 'Installing...' : 'Install Dependencies' }}
              </button>
              <button
                v-if="!isInstalling"
                type="button"
                @click="startServer"
                class="inline-flex items-center rounded-md bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-800 shadow-sm ring-1 ring-inset ring-yellow-600/20 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-200"
              >
                Start Server
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Installation output -->
    <div v-if="showInstallOutput" class="mt-4 rounded-lg bg-gray-900 p-4">
      <pre class="max-h-60 overflow-auto text-sm text-gray-300">{{ installationOutput }}</pre>
    </div>

    <!-- Speech settings -->
    <div class="space-y-4">
      <div>
        <ToggleInput 
          label="Enable Text-to-Speech" 
          v-model="isTTSEnabled" 
          :disabled="serverStatus !== 'running'"
        />
      </div>

      <div v-if="isTTSEnabled">
        <label class="mb-2 block text-sm font-medium">
          Select Voice
        </label>
        <select
          v-model="selectedVoice"
          :disabled="serverStatus !== 'running'"
          class="block w-full rounded-lg bg-gray-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:placeholder-gray-300 dark:focus:ring-blue-600 disabled:opacity-50"
        >
          <option value="">Default Voice</option>
          <option v-for="voice in voices" :key="voice.id" :value="voice.id">
            {{ voice.name }} ({{ voice.gender }})
          </option>
        </select>
      </div>

      <div>
        <ToggleInput 
          label="Enable Speech-to-Text" 
          v-model="isSTTEnabled"
          :disabled="serverStatus !== 'running'"
        />
      </div>
    </div>
  </div>
</template>