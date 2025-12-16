<template>
  <NSelect
    v-model:value="localValue"
    :options="options"
    :placeholder="field.label || field.name"
    clearable
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NSelect } from 'naive-ui'

type Primitive = string | number | boolean | null

interface SchemaField {
  name: string
  label?: string
  type: string
  enum?: string[]
}

const props = defineProps<{
  modelValue: Primitive
  field: SchemaField
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Primitive): void
}>()

const options = computed(() => (props.field.enum ?? []).map((item) => ({ label: item, value: item })))

const localValue = computed({
  get: () => (typeof props.modelValue === 'string' ? props.modelValue : null),
  set: (val) => emit('update:modelValue', val ?? null)
})
</script>

