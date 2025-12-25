<script lang="ts">
export default {}
</script>

<script setup lang="ts">
defineOptions({ name: 'FormPreview' })
// Placeholder component for previewing generated form
// @ts-ignore vue shim
import FormRenderer from './form-renderer/FormRenderer.vue'
const props = defineProps<{
  schema: any
}>()
</script>

<template>
  <section class="form-preview">
    <div class="section-header">
      <h2>表单预览</h2>
      <p v-if="props.schema?.title" class="desc">{{ props.schema.title }}</p>
    </div>
    <FormRenderer v-if="props.schema" :schema="props.schema" />
    <p v-else class="placeholder">请先生成 Schema</p>
  </section>
</template>

<style scoped>
.form-preview {
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
