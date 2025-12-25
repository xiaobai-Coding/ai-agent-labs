<script lang="ts">
export default {}
</script>

<script setup lang="ts">
defineOptions({ name: 'SchemaViewer' })
// Placeholder component for viewing generated schema
const props = defineProps<{
  schema: any
}>()
</script>

<template>
  <section class="schema">
    <div class="section-header">
      <h2>Schema 预览</h2>
      <p class="desc">AI 生成的 JSON Schema</p>
    </div>
    <pre v-if="schema">{{ schema }}</pre>
    <p v-else class="placeholder">请先生成 Schema</p>
  </section>
</template>

<style scoped>
.schema {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
}

.desc {
  margin: 4px 0 0;
  color: #475569;
  font-size: 14px;
}

pre {
  flex: 1;
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  background: #0f172a;
  color: #e2e8f0;
  overflow: auto;
  min-height: 180px;
  white-space: pre-wrap;
  word-break: break-word;
}

.placeholder {
  margin: 0;
  color: #94a3b8;
}
</style>
