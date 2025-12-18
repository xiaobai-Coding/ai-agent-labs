<template>
  <component
    :is="componentType"
    v-model="modelValue"
    :field="field"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TextField from './fields/TextField.vue'
import NumberField from './fields/NumberField.vue'
import BooleanField from './fields/BooleanField.vue'
import SelectField from './fields/SelectField.vue'
import FallbackField from './fields/FallbackField.vue'

type Primitive = string | number | boolean | null

interface SchemaField {
  name: string
  label?: string
  type: string
  required?: boolean
  default?: Primitive
  enum?: string[]
}

const props = defineProps<{
  field: SchemaField
  modelValue: Primitive
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Primitive): void
}>()

const componentMap: Record<string, any> = {
  string: TextField,
  number: NumberField,
  boolean: BooleanField,
  select: SelectField
}

const componentType = computed(() => componentMap[props.field.type] ?? FallbackField)

const modelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

