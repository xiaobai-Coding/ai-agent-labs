<template>
  <NSwitch :value="props.modelValue" @update:value="(v) => emit('update:modelValue', v)" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NSwitch } from 'naive-ui'

type Primitive = string | number | boolean | null

interface SchemaField {
  name: string
  label?: string
  type: string
}

const props = defineProps<{
  modelValue: boolean | undefined
  field: SchemaField
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean | undefined): void
}>()

const localValue = computed({
  get: () => Boolean(props.modelValue),
  set: (val: boolean) => emit('update:modelValue', val)
})
</script>

