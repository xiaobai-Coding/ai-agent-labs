<script setup lang="ts">
// @ts-nocheck
import { ref, watch } from 'vue'
import { NConfigProvider, NInput, NAlert, NButton } from 'naive-ui'
// @ts-ignore vue shim
import PromptInput from './components/PromptInput.vue'
// @ts-ignore vue shim
import FormRenderer from './components/form-renderer/FormRenderer.vue'
// @ts-ignore vue shim
import FieldEditor from './components/form-renderer/FieldEditor.vue'
import { callDeepSeekAPI } from './services/aiService'
import { ClassifierPrompt, getSchemaPrompt } from './prompts/schemaPrompt';
import { applyPatch } from './utils/applyPatch'
const themeOverrides = {
  common: {
    primaryColor: '#6366f1',
    primaryColorHover: '#818cf8',
    primaryColorPressed: '#4f46e5',
    primaryColorSuppl: '#818cf8',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
    borderRadiusLarge: '12px'
  },
  Form: {
    labelFontSize: '14px',
    labelFontWeight: '600',
    labelTextColor: '#0f172a',
    labelLineHeight: '1.6'
  },
  Input: {
    borderRadius: '10px',
    borderHover: '1px solid rgba(99, 102, 241, 0.3)',
    borderFocus: '1px solid #6366f1',
    boxShadowFocus: '0 0 0 3px rgba(99, 102, 241, 0.12)'
  },
  InputNumber: {
    borderRadius: '10px',
    borderHover: '1px solid rgba(99, 102, 241, 0.3)',
    borderFocus: '1px solid #6366f1',
    boxShadowFocus: '0 0 0 3px rgba(99, 102, 241, 0.12)'
  },
  Select: {
    borderRadius: '10px',
    borderHover: '1px solid rgba(99, 102, 241, 0.3)',
    borderFocus: '1px solid #6366f1',
    boxShadowFocus: '0 0 0 3px rgba(99, 102, 241, 0.12)'
  },
  Switch: {
    railColorActive: '#6366f1',
    buttonColor: '#ffffff'
  }
}

// 默认示例 Schema 文本
const defaultSchema = {
  title: '用户注册',
  description: '注册表单',
  fields: [
    { name: 'username', label: '用户名', type: 'string', required: true, default: '' },
    { name: 'age', label: '年龄', type: 'number' },
    { name: 'gender', label: '性别', type: 'select', enum: ['男', '女'] },
    { name: 'subscribe', label: '是否订阅', type: 'boolean' }
  ]
}

const schemaText = ref<string>('') // 用于编辑的 Schema 文本
const schema = ref<any>(null) // 用于渲染的 Schema
const parseError = ref<string>('') // 解析错误
const selectedFieldKey = ref<string | null>(null) // 当前选中的字段
const showFieldEditor = ref(false) // 控制字段编辑器抽屉
const backupField = ref<any>(null) // 打开 Drawer 时备份字段
const fileInputRef = ref<HTMLInputElement | null>(null)

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}


// 监听文本变化，尝试解析 JSON；失败时保留旧 Schema，并提示错误
watch(
  schemaText,
  (val) => {
    if (!val.trim()) return 
    validateAndApplySchema(val)
  }
)
// 验证并应用 Schema（基于 fields 结构）
function validateAndApplySchema(text: string) {
  try {
    const parsed = JSON.parse(text)

    // 基础结构校验
    if (!parsed.title || !Array.isArray(parsed.fields)) {
      throw new Error('Schema 必须包含 title 和 fields')
    }

    // 字段校验
    parsed.fields.forEach((field: any, index: number) => {
      if (!field.name) {
        throw new Error(`第 ${index + 1} 个字段缺少 name`)
      }
      if (!field.type) {
        throw new Error(`字段 ${field.name} 缺少 type`)
      }
    })

    schema.value = parsed
    parseError.value = ''
  } catch (err: any) {
    parseError.value = err.message
  }
}
// 从 AI 生成用户意图，并根据意图生成 Schema
async function handleGenerate(userPrompt: string) {
  try {
    const classification = await callDeepSeekAPI(userPrompt, ClassifierPrompt)
    await generateSchema(userPrompt, classification.intent)
  } catch (err: any) {
    parseError.value = err.message
  }
}

// 根据用户意图生成 Schema（或对现有 Schema 做 PATCH）
const generateSchema = async (userPrompt: string, intent: string) => {
  try {
    const result = await callDeepSeekAPI(userPrompt, getSchemaPrompt(intent))

    if (intent === 'PATCH_UPDATE') {
      if (!schema.value) {
        throw new Error('当前没有可用于 PATCH 的 Schema')
      }
      const patched = applyPatch(schema.value, result)
      schema.value = patched
      schemaText.value = JSON.stringify(patched, null, 2)
    } else {
      schema.value = result
      schemaText.value = JSON.stringify(result, null, 2)
    }

    parseError.value = ''
  } catch (err: any) {
    console.error('生成 Schema 失败', err)
    parseError.value = err.message
    throw err
  }
}
// 复制当前 schema
async function copySchema() {
  if (!schema.value) return
  const text = JSON.stringify(schema.value, null, 2)
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('复制失败', err)
  }
}

// 导出当前 schema 为 json 文件
function exportSchema() {
  if (!schema.value) return
  const text = JSON.stringify(schema.value, null, 2)
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${schema.value?.title || 'schema'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function openFieldEditor(key: string) {
  selectedFieldKey.value = key
  const field = schema.value?.fields?.find((f: any) => f.name === key)
  backupField.value = field ? deepClone(field) : null
  showFieldEditor.value = true
}

function handleUpdateSchema(next: any) {
  schema.value = next
  schemaText.value = JSON.stringify(next, null, 2)
}

function onConfirm() {
  showFieldEditor.value = false
  backupField.value = null
}

function onCancel() {
  if (selectedFieldKey.value && backupField.value && schema.value?.fields) {
    const fieldIndex = schema.value.fields.findIndex((f: any) => f.name === selectedFieldKey.value)
    if (fieldIndex !== -1) {
      const nextFields = [...schema.value.fields]
      nextFields[fieldIndex] = deepClone(backupField.value)
      schema.value = { ...schema.value, fields: nextFields }
      schemaText.value = JSON.stringify(schema.value, null, 2)
    }
  }
  showFieldEditor.value = false
  backupField.value = null
}

function onReset() {
  if (selectedFieldKey.value && backupField.value && schema.value?.fields) {
    const fieldIndex = schema.value.fields.findIndex((f: any) => f.name === selectedFieldKey.value)
    if (fieldIndex !== -1) {
      const nextFields = [...schema.value.fields]
      nextFields[fieldIndex] = deepClone(backupField.value)
      schema.value = { ...schema.value, fields: nextFields }
      schemaText.value = JSON.stringify(schema.value, null, 2)
    }
  }
}

function triggerFileImport() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    if (text) {
      schemaText.value = text
    }
  }
  reader.onerror = () => {
    parseError.value = '文件读取失败'
  }
  reader.readAsText(file)
  
  // 重置 input，允许重复选择同一文件
  target.value = ''
}
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <main class="layout">
      <section class="panel prompt-panel">
        <PromptInput :on-generate="handleGenerate" @generate="handleGenerate" />
      </section>

      <section class="grid">
        <div class="panel editor-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Schema JSON</p>
              <h2>可编辑的 Schema 文本</h2>
            </div>
          <div class="actions">
            <NButton
              size="tiny"
              quaternary
              type="primary"
              class="schema-action-btn"
              @click="triggerFileImport"
            >
              导入 JSON
            </NButton>
            <input
              ref="fileInputRef"
              type="file"
              accept=".json"
              style="display: none"
              @change="handleFileSelect"
            />
            <NButton
              size="tiny"
              quaternary
              type="primary"
              class="schema-action-btn"
              @click="copySchema"
            >
              复制 JSON
            </NButton>
            <NButton
              size="tiny"
              quaternary
              type="primary"
              class="schema-action-btn"
              @click="exportSchema"
            >
              导出 JSON
            </NButton>
          </div>
          </div>
          <NInput
            v-model:value="schemaText"
            type="textarea"
            :rows="18"
            placeholder="粘贴或编辑 JSON Schema"
          />
          <NAlert v-if="parseError" type="error" class="alert">
            JSON 解析错误：{{ parseError }}
          </NAlert>
        </div>

        <div class="panel form-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">实时预览</p>
              <h2>{{ schema?.title || '表单预览' }}</h2>
            </div>
            <span class="hint">Schema 为唯一数据源</span>
          </div>
          <div class="form-body">
            <FormRenderer
              v-if="schema"
              :schema="schema"
              :selected-field-key="selectedFieldKey"
              @select-field="openFieldEditor"
            />
            <p v-else class="placeholder">请先提供合法的 Schema JSON</p>
          </div>
        </div>
      </section>

      <FieldEditor
        v-if="schema && selectedFieldKey"
        :show="showFieldEditor"
        :schema="schema"
        :field-key="selectedFieldKey"
        :backup-field="backupField"
        @update:show="(val) => (showFieldEditor = val)"
        @update-schema="handleUpdateSchema"
        @confirm="onConfirm"
        @cancel="onCancel"
        @reset="onReset"
      />

    </main>
  </NConfigProvider>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.panel {
  background: #ffffff;
  border: 1px solid rgba(99, 102, 241, 0.14);
  border-radius: 18px;
  padding: 18px 18px 16px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prompt-panel {
  width: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.schema-action-btn {
  border-radius: 999px;
  padding: 0 10px;
  border: 1px solid rgba(99, 102, 241, 0.35);
  background: radial-gradient(circle at 0 0, rgba(129, 140, 248, 0.18), transparent 55%);
  color: #4f46e5;
}

.schema-action-btn:deep(.n-button__content) {
  font-size: 12px;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.4px;
  color: #6366f1;
  font-weight: 700;
}

h2 {
  margin: 4px 0 0;
  font-size: 18px;
  color: #0f172a;
}

.hint {
  font-size: 13px;
  color: #64748b;
}

.editor-panel {
  min-height: 420px;
}

.form-panel {
  min-height: 420px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  height: 100%;
}

.form-body {
  flex: 1;
  min-height: 300px;
  padding: 10px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(236, 239, 255, 0.6), rgba(225, 234, 255, 0.75));
  border: 1px solid rgba(99, 102, 241, 0.12);
  overflow: auto;
}

.alert {
  margin-top: 4px;
}

.placeholder {
  margin: 0;
  color: #94a3b8;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
