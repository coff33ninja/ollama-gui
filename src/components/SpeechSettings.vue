<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { isTTSEnabled, isSTTEnabled, selectedVoice } from '../services/appConfig'
import ToggleInput from './Inputs/ToggleInput.vue'

const voices = ref<{ name: string; id: string; languages: string[]; gender: string }[]>([])

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

onMounted(async () => {
  await fetchVoices()
})
</script>

<template>
  <div class="space-y-4">
    <h4 class="text-md font-medium">Speech Settings</h4>

    <!-- Speech settings -->
    <div class="space-y-4">
      <div>
        <ToggleInput 
          label="Enable Text-to-Speech" 
          v-model="isTTSEnabled" 
        />
      </div>

      <div v-if="isTTSEnabled">
        <label class="mb-2 block text-sm font-medium">
          Select Voice
        </label>
        <select
          v-model="selectedVoice"
          class="block w-full rounded-lg bg-gray-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:placeholder-gray-300 dark:focus:ring-blue-600"
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
        />
      </div>
    </div>
  </div>
</template>