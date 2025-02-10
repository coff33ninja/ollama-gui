<template>
  <span class="status-badge px-2.5 py-0.5 rounded-full text-xs font-medium" :class="badgeClass">
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: 'success' | 'warning' | 'error'
}>()

const badgeClass = computed(() => ({
  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400': props.status === 'success',
  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400': props.status === 'warning',
  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400': props.status === 'error'
}))

const statusText = computed(() => ({
  success: 'Ready',
  warning: 'Update Needed',
  error: 'Not Installed'
}[props.status]))
</script>