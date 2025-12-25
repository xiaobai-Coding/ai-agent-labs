<template>
  <NForm :model="formModel" :label-placement="'top'">
    <NFormItem
      v-for="field in normalizedFields"
      :key="field.name"
      :label="field.label ?? field.name"
      :path="field.name"
      :required="field.required === true"
      class="field-item"
      :class="{
        active: selectedFieldKey === field.name,
        'highlight-added': highlightMap?.added?.includes(field.name),
        'highlight-updated': highlightMap?.updated?.includes(field.name)
      }"
      @click="onSelect(field.name, $event)"
    >
      <FieldRenderer
        :field="field"
        :model-value="formModel[field.name] ?? null"
        @update:model-value="(val) => (formModel[field.name] = val ?? null)"
      />
    </NFormItem>
  </NForm>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { NForm, NFormItem } from 'naive-ui'
// @ts-ignore vue shim
import FieldRenderer from './FieldRenderer.vue'

type FieldValue = string | number | boolean | null

const props = defineProps<{
  schema: any | null
  selectedFieldKey?: string
  highlightMap?: { added: string[]; updated: string[] }
}>()

const emit = defineEmits<{
  (e: 'select-field', key: string): void
}>()

const normalizedFields = computed(() => {
  if (!props.schema) return []
  if (Array.isArray(props.schema.fields)) {
    return props.schema.fields
  }
  return []
})

const formModel = reactive<Record<string, FieldValue>>({})

watch(
  normalizedFields,
  (fields) => {
    fields.forEach((field: any) => {
      // 始终同步 default 值到 formModel
      formModel[field.name] = field.default ?? null
    })
  },
  { immediate: true, deep: true }
)

const onSelect = (key: string, event: MouseEvent) => {
  // 检查点击目标是否是输入框或其子元素
  const target = event.target as HTMLElement
  const isInputElement = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.tagName === 'SELECT' ||
                        target.closest('input, textarea, select, .n-input, .n-select, .n-switch')
  
  // 如果是输入框，不触发选择事件
  if (isInputElement) {
    return
  }
  
  emit('select-field', key)
}
</script>

<style scoped>
.field-item {
  border-radius: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  cursor: pointer;
}

.field-item.active {
  border: 1px solid rgba(99, 102, 241, 0.35);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

/* A: 新增字段高亮 - 绿色 */
.field-item.highlight-added {
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid rgba(34, 197, 94, 0.5);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}

/* A: 修改字段高亮 - 橙色 */
.field-item.highlight-updated {
  background: rgba(245, 158, 11, 0.1);
  border: 2px solid rgba(245, 158, 11, 0.5);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}
</style>

