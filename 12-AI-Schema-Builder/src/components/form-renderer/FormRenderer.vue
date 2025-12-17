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
import { computed, reactive, watch } from 'vue'
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
  if (Array.isArray(props.schema.fields)) {
    return props.schema.fields
  }
  return []
})

const formModel = reactive<Record<string, Primitive>>({})

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

const onSelect = (key: string) => {
  emit('select-field', key)
}
</script>

<style scoped>
.field-item {
  padding: 4px 8px;
  margin-bottom: 4px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
  cursor: pointer;
}

.field-item.active {
  border: 1px solid rgba(99, 102, 241, 0.55);
  background: radial-gradient(circle at 0 0, rgba(129, 140, 248, 0.12), rgba(191, 219, 254, 0.1));
  box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.25);
}
</style>

