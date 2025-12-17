<template>
  <NInput
    v-model:value="localValue"
    :placeholder="field.placeholder || field.label || field.name"
    clearable
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NInput } from 'naive-ui'

type Primitive = string | number | boolean | null

interface SchemaField {
  name: string
  label?: string
  type: string
  placeholder?: string
}

const props = defineProps<{
  modelValue: Primitive
  field: SchemaField
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Primitive): void
}>()

const localValue = computed({
  get: () => props.modelValue as string | null,
  set: (val) => emit('update:modelValue', val ?? '')
})
</script>

