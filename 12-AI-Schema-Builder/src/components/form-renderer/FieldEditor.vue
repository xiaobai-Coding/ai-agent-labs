<template>
  <NDrawer v-model:show="visible" :width="380" placement="right">
    <NDrawerContent :title="`正在编辑字段 ${selectedFieldKey}`">
      <NForm label-placement="top" :show-require-mark="false" :model="formState">
        <NFormItem label="标题 (title)">
          <NInput v-model:value="formState.title" placeholder="字段标题" @update:value="applyChanges" />
        </NFormItem>
        <NFormItem label="描述 (description)">
          <NInput v-model:value="formState.description" placeholder="字段描述" @update:value="applyChanges" />
        </NFormItem>
        <NFormItem label="占位符 (placeholder)">
          <NInput v-model:value="formState.placeholder" placeholder="占位提示" @update:value="applyChanges" />
        </NFormItem>
        <NFormItem label="默认值 (default)">
          <NInput v-model:value="formState.default" placeholder="默认值" @update:value="applyChanges" />
        </NFormItem>
        <NFormItem label="必填 (required)">
          <NSwitch v-model:value="formState.required" @update:value="applyChanges" />
        </NFormItem>
      </NForm>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { NDrawer, NDrawerContent, NForm, NFormItem, NInput, NSwitch } from 'naive-ui'

const props = defineProps<{
  schema: any
  selectedFieldKey: string
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'update-schema', value: any): void
}>()

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const formState = reactive({
  title: '',
  description: '',
  placeholder: '',
  default: '',
  required: false
})

watch(
  () => [props.selectedFieldKey, props.schema],
  () => {
    const key = props.selectedFieldKey
    const fieldSchema = props.schema?.properties?.[key]
    if (!fieldSchema) return
    formState.title = fieldSchema.title ?? ''
    formState.description = fieldSchema.description ?? ''
    formState.placeholder = fieldSchema.placeholder ?? ''
    formState.default = fieldSchema.default ?? ''
    const requiredList: string[] = Array.isArray(props.schema?.required) ? props.schema.required : []
    formState.required = requiredList.includes(key)
  },
  { immediate: true, deep: false }
)

const applyChanges = () => {
  const key = props.selectedFieldKey
  if (!props.schema?.properties?.[key]) return

  const nextSchema = {
    ...props.schema,
    properties: {
      ...props.schema.properties,
      [key]: {
        ...props.schema.properties[key],
        title: formState.title,
        description: formState.description,
        placeholder: formState.placeholder,
        default: formState.default
      }
    }
  }

  const requiredList: string[] = Array.isArray(props.schema.required) ? [...props.schema.required] : []
  const existsIndex = requiredList.indexOf(key)
  if (formState.required && existsIndex === -1) {
    requiredList.push(key)
  }
  if (!formState.required && existsIndex !== -1) {
    requiredList.splice(existsIndex, 1)
  }

  if (requiredList.length > 0) {
    nextSchema.required = requiredList
  } else {
    delete nextSchema.required
  }

  emit('update-schema', nextSchema)
}
</script>

