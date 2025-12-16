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
const selectedFieldKey = ref<string>('') // 当前选中的字段
const showFieldEditor = ref(false) // 控制字段编辑器抽屉


// 监听文本变化，尝试解析 JSON；失败时保留旧 Schema，并提示错误
watch(
  schemaText,
  (val) => {
    validateAndApplySchema(val)
  }
)
// 验证并应用 Schema
function validateAndApplySchema(text: string) {
  try {
    const parsed = JSON.parse(text)

    // 优先支持 JSON Schema properties
    if (parsed && typeof parsed === 'object' && parsed.properties) {
      schema.value = parsed
      parseError.value = ''
      return
    }

    // 兼容旧的 fields 结构，转换为 properties
    if (Array.isArray(parsed.fields)) {
      const properties: Record<string, any> = {}
      const requiredList: string[] = []
      parsed.fields.forEach((field: any, index: number) => {
        if (!field.name) {
          throw new Error(`第 ${index + 1} 个字段缺少 name`)
        }
        if (!field.type) {
          throw new Error(`字段 ${field.name} 缺少 type`)
        }
        properties[field.name] = {
          title: field.label ?? field.name,
          type: field.type,
          enum: field.enum,
          default: field.default,
          placeholder: field.placeholder
        }
        if (field.required) {
          requiredList.push(field.name)
        }
      })
      const nextSchema = {
        ...parsed,
        properties
      }
      if (requiredList.length > 0) {
        nextSchema.required = requiredList
      }
      schema.value = nextSchema
      parseError.value = ''
      return
    }

    throw new Error('Schema 需要包含 properties 对象')
  } catch (err: any) {
    // ❌ 校验失败
    parseError.value = err.message
  }
}
// 从 AI 生成 Schema，并回填到唯一数据源
async function handleGenerate(userPrompt: string) {
  try {
    const generated = await callDeepSeekAPI(userPrompt)
    schema.value = generated
    schemaText.value = JSON.stringify(generated, null, 2)
    parseError.value = ''
  } catch (err: any) {
    parseError.value = err.message
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

function handleSelectField(key: string) {
  selectedFieldKey.value = key
  showFieldEditor.value = true
}

function handleUpdateSchema(next: any) {
  schema.value = next
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
              @select-field="handleSelectField"
            />
            <p v-else class="placeholder">请先提供合法的 Schema JSON</p>
          </div>
        </div>
      </section>

      <FieldEditor
        v-if="schema && selectedFieldKey"
        :show="showFieldEditor"
        :schema="schema"
        :selected-field-key="selectedFieldKey"
        @update:show="(val) => (showFieldEditor = val)"
        @update-schema="handleUpdateSchema"
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
