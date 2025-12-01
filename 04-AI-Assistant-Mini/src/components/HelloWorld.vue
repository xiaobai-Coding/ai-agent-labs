<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  msg: string
}

const props = defineProps<Props>()

const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>
  <div class="card">
    <button type="button" @click="count++">
      count is {{ count }}
    </button>
    <p>
      Edit <code>src/App.vue</code> and save to test HMR
    </p>
  </div>
  <p class="read-the-docs">
    Click on the Vite and Vue logos to learn more
  </p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>