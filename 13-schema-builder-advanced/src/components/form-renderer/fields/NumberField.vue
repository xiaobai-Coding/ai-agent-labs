<template>
  <NInputNumber
    :value="props.modelValue"
    :placeholder="field.label || field.name"
    clearable
    :min="Number.MIN_SAFE_INTEGER"
    :max="Number.MAX_SAFE_INTEGER"
    @update:value="(v) => emit('update:modelValue', v ?? null)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NInputNumber } from 'naive-ui'

type Primitive = string | number | boolean | null

interface SchemaField {
  name: string
  label?: string
  type: string
}

const props = defineProps<{
  modelValue: number | null | undefined
  field: SchemaField
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null | undefined): void
}>()

const localValue = computed({
  get: () => (typeof props.modelValue === 'number' ? props.modelValue : null),
  set: (val) => emit('update:modelValue', val ?? null)
})
</script>

