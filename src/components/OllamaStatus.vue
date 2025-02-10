<template>
  <div class="ollama-status">
    <h2>Ollama Status</h2>
    <p v-if="isRunning">Ollama is running.</p>
    <p v-else>Ollama is not running.</p>
    <button @click="checkStatus">Check Status</button>
    <button v-if="!isRunning" @click="startOllama">Start Ollama</button>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';

export default {
  setup() {
    const isRunning = ref(false);

    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/status'); // Replace with actual status endpoint
        if (response.ok) {
          isRunning.value = true;
        } else {
          isRunning.value = false;
        }
      } catch (error) {
        console.error('Error checking Ollama status:', error);
        isRunning.value = false;
      }
    };

    const startOllama = async () => {
      try {
        await fetch('http://localhost:YOUR_OLLAMA_PORT/start', { method: 'POST' }); // Replace with actual start endpoint
        checkStatus(); // Check status after attempting to start
      } catch (error) {
        console.error('Error starting Ollama:', error);
      }
    };

    return {
      isRunning,
      checkStatus,
      startOllama,
    };
  },
};
</script>

<style scoped>
.ollama-status {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-top: 1rem;
}
</style>
