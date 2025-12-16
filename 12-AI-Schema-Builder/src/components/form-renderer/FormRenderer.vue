<template>
  <NForm :model="formModel" :label-placement="'top'">
    <NFormItem
      v-for="field in normalizedFields"
      :key="field.name"
      :label="field.label ?? field.name"
      :path="field.name"
      :required="field.required === true"
      class="field-item"
      :class="{ active: selectedFieldKey === field.name }"
      @click="onSelect(field.name)"
    >
      <FieldRenderer
        :field="field"
        v-model="formModel[field.name]"
      />
    </NFormItem>
  </NForm>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { NForm, NFormItem } from 'naive-ui'
// @ts-ignore vue shim
import FieldRenderer from './FieldRenderer.vue'

type Primitive = string | number | boolean | null

const props = defineProps<{
  schema: any | null
  selectedFieldKey?: string
}>()

const emit = defineEmits<{
  (e: 'select-field', key: string): void
}>()

const normalizedFields = computed(() => {
  if (!props.schema) return []
  // 优先使用 JSON Schema properties
  if (props.schema.properties) {
    const requiredKeys: string[] = Array.isArray(props.schema.required) ? props.schema.required : []
    return Object.entries(props.schema.properties).map(([key, value]: [string, any]) => ({
      name: key,
      label: value?.title ?? key,
      type: value?.type ?? 'string',
      required: requiredKeys.includes(key),
      default: value?.default ?? null,
      enum: value?.enum,
      placeholder: value?.placeholder
    }))
  }
  // 兼容旧的 fields 数组结构
  if (Array.isArray(props.schema.fields)) {
    return props.schema.fields
  }
  return []
})

const formModel = reactive<Record<string, Primitive>>(
  normalizedFields.value.reduce((acc, field) => {
    acc[field.name] = field.default ?? null
    return acc
  }, {} as Record<string, Primitive>)
)

const onSelect = (key: string) => {
  emit('select-field', key)
}
</script>

<style scoped>
.field-item {
  border-radius: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.field-item.active {
  border: 1px solid rgba(99, 102, 241, 0.35);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
</style>

