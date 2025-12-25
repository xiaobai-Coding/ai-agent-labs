<template>
  <NDrawer :show="show" :width="380" placement="right" :mask-closable="false" :close-on-esc="false" @update:show="(val) => emit('update:show', val)">
    <NDrawerContent :title="`正在编辑字段 ${fieldKey}`">
      <NForm label-placement="top" :show-require-mark="false" :model="formState">
        <NFormItem label="标题 (label)">
          <NInput :value="formState.label" placeholder="字段标题" @update:value="(v) => (formState.label = v)" />
        </NFormItem>
        <NFormItem label="占位符 (placeholder)">
          <NInput :value="formState.placeholder" placeholder="占位提示" @update:value="(v) => (formState.placeholder = v)" />
        </NFormItem>
        <NFormItem label="默认值 (default)">
          <NInput :value="formState.default" placeholder="默认值" @update:value="(v) => (formState.default = v)" />
        </NFormItem>
        <NFormItem label="必填 (required)">
          <NSwitch :value="formState.required" @update:value="(v) => (formState.required = v)" />
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
  (e: 'confirm', changed?: boolean): void
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

// 当表单状态变化时，将变更应用到 schema（实时同步）
watch(
  formState,
  () => {
    applyChanges()
  },
  { deep: true }
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
  // 通过比较当前表单状态和备份字段，判断用户是否真的修改过内容
  const before = props.backupField ? JSON.stringify({
    label: props.backupField.label ?? '',
    placeholder: props.backupField.placeholder ?? '',
    default: props.backupField.default ?? '',
    required: !!props.backupField.required
  }) : null
  const after = JSON.stringify({
    label: formState.label ?? '',
    placeholder: formState.placeholder ?? '',
    default: formState.default ?? '',
    required: !!formState.required
  })
  const changed = before === null ? true : before !== after
  emit('confirm', changed)
}

const handleCancel = () => {
  emit('cancel')
}

const canReset = computed(() => !!props.fieldKey && !!props.backupField)

const handleReset = () => {
  emit('reset')
}
</script>
