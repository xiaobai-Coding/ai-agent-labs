<template>
  <NAlert class="fallback-field" type="warning" bordered>
    <div class="font-weight-600" >
      提示：不支持的字段类型
    </div>
    <div class="font-size-12 opacity-7" >
      field: {{ field.name }} <br />
      type: {{ field.type }}
    </div>
  </NAlert>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NAlert } from 'naive-ui'

type Primitive = string | number | boolean | null

interface SchemaField {
  name: string
  label?: string
  type: string
}

const props = defineProps<{
  modelValue: Primitive
  field: SchemaField
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Primitive): void
}>()

const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val ?? '')
})
</script>

<style scoped>
.fallback-field {
  width: 100%;
}
.font-weight-600 {
  font-weight: 600;
}
.font-size-12 {
  font-size: 12px;
}
.opacity-7 {
  opacity: 0.7;
}
</style>