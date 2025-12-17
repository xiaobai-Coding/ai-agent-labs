<template>
  <NDrawer :show="show" :width="380" placement="right" @update:show="(val) => emit('update:show', val)">
    <NDrawerContent :title="`正在编辑字段 ${fieldKey}`">
      <NForm label-placement="top" :show-require-mark="false" :model="formState">
        <NFormItem label="标题 (label)">
          <NInput v-model:value="formState.label" placeholder="字段标题" @update:value="applyChanges" />
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
      <template #footer>
        <NSpace justify="space-between" style="width: 100%">
          <NButton :disabled="!canReset" @click="handleReset">重置本字段</NButton>
          <NSpace>
            <NButton @click="handleCancel">取消</NButton>
            <NButton type="primary" @click="handleConfirm">完成</NButton>
          </NSpace>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { NDrawer, NDrawerContent, NForm, NFormItem, NInput, NSwitch, NButton, NSpace } from 'naive-ui'

const props = defineProps<{
  show: boolean
  fieldKey: string | null
  schema: any
  backupField: any
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'reset'): void
  (e: 'update-schema', value: any): void
}>()

const formState = reactive({
  label: '',
  placeholder: '',
  default: '',
  required: false
})

const findField = () => {
  return props.schema?.fields?.find((f: any) => f.name === props.fieldKey)
}

watch(
  () => [props.fieldKey, props.show],
  () => {
    if (!props.show || !props.fieldKey) return
    const field = findField()
    if (!field) return
    formState.label = field.label ?? ''
    formState.placeholder = field.placeholder ?? ''
    formState.default = field.default ?? ''
    formState.required = field.required === true
  },
  { immediate: true }
)

const applyChanges = () => {
  const fieldIndex = props.schema?.fields?.findIndex((f: any) => f.name === props.fieldKey)
  if (fieldIndex === -1 || fieldIndex === undefined) return

  const nextFields = [...props.schema.fields]
  nextFields[fieldIndex] = {
    ...nextFields[fieldIndex],
    label: formState.label,
    placeholder: formState.placeholder,
    default: formState.default,
    required: formState.required
  }

  const nextSchema = {
    ...props.schema,
    fields: nextFields
  }

  emit('update-schema', nextSchema)
}

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

const canReset = computed(() => !!props.fieldKey && !!props.backupField)

const handleReset = () => {
  emit('reset')
}
</script>
