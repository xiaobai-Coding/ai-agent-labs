<template>
  <NInput
    :value="props.modelValue"
    :placeholder="field.placeholder || field.label || field.name"
    clearable
    @update:value="(v) => emit('update:modelValue', v ?? '')"
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
  modelValue: string | null | undefined
  field: SchemaField
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null | undefined): void
}>()

const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val ?? '')
})
</script>

