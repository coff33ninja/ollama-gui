<script setup lang="ts">
import { IconLayoutSidebarRightCollapse } from '@tabler/icons-vue'
import ToggleInput from './Inputs/ToggleInput.vue'
import TextInput from './Inputs/TextInput.vue'
import ModelLibrary from './ModelLibrary.vue'
import {
  baseUrl,
  historyMessageLength,
  debugMode,
  gravatarEmail,
  toggleSettingsPanel,
} from '../services/appConfig.ts'
</script>

<template>
  <aside>
    <div
      class="relative h-screen w-[500px] overflow-y-auto border-l border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-900"
    >
      <div class="mb-4 flex items-center gap-x-2 px-4 text-gray-900 dark:text-gray-100">
        <button
          @click="toggleSettingsPanel()"
          class="inline-flex rounded-lg p-1 hover:bg-gray-100 hover:dark:bg-gray-700"
        >
          <IconLayoutSidebarRightCollapse class="h-6 w-6" />
          <span class="sr-only">Close settings sidebar</span>
        </button>
        <h2 class="text-lg font-medium">Settings</h2>
      </div>

      <!-- Model Library Section -->
      <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ModelLibrary />
      </div>

      <!-- General Settings -->
      <div
        class="px-4 py-4 text-gray-900 dark:text-gray-100"
      >
        <h3 class="mb-4 text-lg font-medium">General Settings</h3>
        
        <div class="space-y-4">
          <div>
            <ToggleInput label="Enable debug mode" v-model="debugMode" />
          </div>

          <div>
            <TextInput label="Base URL" v-model="baseUrl" />
          </div>

          <div>
            <TextInput label="Gravatar Email" v-model="gravatarEmail" />
          </div>

          <div>
            <label for="chat-history-length" class="mb-2 block text-sm font-medium">
              Conversation History Size
            </label>
            <input
              type="number"
              min="0"
              max="100"
              id="chat-history-length"
              v-model="historyMessageLength"
              class="block w-full rounded-lg bg-gray-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:placeholder-gray-300 dark:focus:ring-blue-600"
              placeholder="Number of messages to keep in context"
            />
          </div>
        </div>

        <div v-if="false">
          <div>
            <label for="max-tokens" class="mb-2 mt-4 block text-sm font-medium">
              Max tokens
            </label>
            <input
              type="number"
              disabled
              id="max-tokens"
              class="block w-full rounded-lg bg-gray-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:placeholder-gray-300 dark:focus:ring-blue-600"
              placeholder="2048"
            />
          </div>

          <div>
            <label for="temperature" class="mb-2 mt-4 block text-sm font-medium">
              Temperature
            </label>
            <input
              type="number"
              disabled
              id="temperature"
              class="block w-full rounded-lg bg-gray-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:placeholder-gray-300 dark:focus:ring-blue-600"
              placeholder="0.7"
            />
          </div>

          <div>
            <label for="top-p" class="mb-2 mt-4 block text-sm font-medium">
              Top P
            </label>
            <input
              type="number"
              disabled
              id="top-p"
              class="block w-full rounded-lg bg-gray-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:placeholder-gray-300 dark:focus:ring-blue-600"
              placeholder="1"
            />
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>