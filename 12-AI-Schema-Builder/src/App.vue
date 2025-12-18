<script setup lang="ts">
// @ts-nocheck
import { ref, watch } from 'vue'
import { NConfigProvider, NInput, NAlert, NButton, createDiscreteApi } from 'naive-ui'
// @ts-ignore vue shim
import PromptInput from './components/PromptInput.vue'
// @ts-ignore vue shim
import FormRenderer from './components/form-renderer/FormRenderer.vue'
// @ts-ignore vue shim
import FieldEditor from './components/form-renderer/FieldEditor.vue'
// @ts-ignore vue shim
import PatchPreviewModal from './components/PatchPreviewModal.vue'
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
const pendingPatch = ref<any>(null) // 待确认的 patch
const isPatchModalOpen = ref(false) // 控制 Patch Preview Modal 显示

// A: 字段高亮状态（UI 层副作用，不写入 schema）
const highlightMap = ref<{ added: string[]; updated: string[] }>({ added: [], updated: [] })

// B: 变更摘要提示（使用 createDiscreteApi 在根组件外创建）
const { message, dialog } = createDiscreteApi(['message', 'dialog'])

// Patch 历史记录（最多 5 条）
interface PatchHistoryRecord {
  id: string
  timestamp: number
  summary: string
  patch: any
  beforeSchema: any
  afterSchema: any
}

const PATCH_HISTORY_KEY = 'ai-schema-builder-patch-history'
const patchHistory = ref<PatchHistoryRecord[]>([])

// 从 localStorage 恢复历史
function loadPatchHistory() {
  try {
    const stored = localStorage.getItem(PATCH_HISTORY_KEY)
    if (stored) {
      patchHistory.value = JSON.parse(stored)
    }
  } catch (e) {
    console.error('加载 Patch 历史失败', e)
  }
}

// 保存历史到 localStorage
function savePatchHistory() {
  try {
    localStorage.setItem(PATCH_HISTORY_KEY, JSON.stringify(patchHistory.value))
  } catch (e) {
    console.error('保存 Patch 历史失败', e)
  }
}

// 添加历史记录
function addPatchHistory(record: PatchHistoryRecord) {
  patchHistory.value.unshift(record)
  if (patchHistory.value.length > 5) {
    patchHistory.value = patchHistory.value.slice(0, 5)
  }
  savePatchHistory()
}

// 回滚到指定记录
function rollbackTo(record: PatchHistoryRecord) {
  // 当存在待确认的 Patch 时，禁止回滚，避免状态冲突
  if (isPatchModalOpen.value || pendingPatch.value) {
    message.warning('当前有待确认的 Patch，请先处理后再回滚')
    return
  }
  dialog.warning({
    title: '确认回滚',
    content: `确定要回滚到「${record.summary}」之前的状态吗？`,
    positiveText: '确认回滚',
    negativeText: '取消',
    positiveButtonProps: {
      type: 'primary',
      size: 'small',
      class: 'rollback-btn'
    },
    negativeButtonProps: {
      quaternary: true,
      size: 'small'
    },
    onPositiveClick: () => {
      schema.value = deepClone(record.beforeSchema)
      schemaText.value = JSON.stringify(record.beforeSchema, null, 2)
      // 清空当前状态
      pendingPatch.value = null
      isPatchModalOpen.value = false
      highlightMap.value = { added: [], updated: [] }
      selectedFieldKey.value = null
      showFieldEditor.value = false
      backupField.value = null
      message.success('已回滚到之前的状态')
    }
  })
}

// 页面初始化时加载历史
loadPatchHistory()

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
    // 手动编辑 Schema 时，清理与字段选择/高亮相关的 UI 状态
    selectedFieldKey.value = null
    showFieldEditor.value = false
    backupField.value = null
    highlightMap.value = { added: [], updated: [] }
    parseError.value = ''
  } catch (err: any) {
    parseError.value = err.message
  }
}
// 从 AI 生成用户意图，并根据意图生成 Schema
async function handleGenerate(userPrompt: string) {
  // 当存在未处理的 Patch 预览时，禁止再次触发 AI Patch
  if (isPatchModalOpen.value || pendingPatch.value) {
    message.warning('当前有待确认的 Patch，请先处理后再继续操作')
    return
  }
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
    let result: any

    if (intent === 'PATCH_UPDATE') {
      if (!schema.value) {
        throw new Error('当前没有可用于 PATCH 的 Schema')
      }
      // 按 PATCH_UPDATE_PROMPT 约定，将 current_schema 与 user_instruction 作为两部分输入
      const patchInput = `
current_schema:
${JSON.stringify(schema.value, null, 2)}

user_instruction:
${userPrompt}
`.trim()
      result = await callDeepSeekAPI(patchInput, getSchemaPrompt(intent))
    } else {
      result = await callDeepSeekAPI(userPrompt, getSchemaPrompt(intent))
    }

    if (intent === 'PATCH_UPDATE') {
      pendingPatch.value = result
      isPatchModalOpen.value = true
    } else {
      schema.value = result
      schemaText.value = JSON.stringify(result, null, 2)
      // 重新生成 Schema 时，清理选中字段与高亮状态
      selectedFieldKey.value = null
      showFieldEditor.value = false
      backupField.value = null
      highlightMap.value = { added: [], updated: [] }
    }

    parseError.value = ''
  } catch (err: any) {
    console.error('生成 Schema 失败', err)
    parseError.value = err.message
    throw err
  }
}

function confirmPatch() {
  if (!pendingPatch.value || !schema.value) return
  try {
    const patch = pendingPatch.value
    const beforeSchema = deepClone(schema.value) // 保存应用前的快照
    const patched = applyPatch(schema.value, patch)

    // A: 生成高亮 Map
    const added: string[] = []
    const updated: string[] = []
    if (patch.operations) {
      patch.operations.forEach((op: any) => {
        if (op.op === 'add' && op.target === 'field' && op.value?.name) {
          added.push(op.value.name)
        } else if (op.op === 'update' && op.target === 'field' && op.name) {
          updated.push(op.name)
        }
      })
    }

    // B: 生成变更摘要
    const summaryParts: string[] = []
    if (added.length > 0) {
      const labels = added.map((name) => {
        const field = patched.fields?.find((f: any) => f.name === name)
        return field?.label || name
      })
      summaryParts.push(`新增「${labels.join('、')}」`)
    }
    if (updated.length > 0) {
      const labels = updated.map((name) => {
        const field = patched.fields?.find((f: any) => f.name === name)
        return field?.label || name
      })
      summaryParts.push(`修改「${labels.join('、')}」`)
    }
    const summary = summaryParts.length > 0 ? summaryParts.join('，') : '应用 Patch'

    // 添加到历史记录（仅成功应用的 Patch）
    addPatchHistory({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      summary,
      patch: deepClone(patch),
      beforeSchema,
      afterSchema: deepClone(patched)
    })

    // 更新 schema（唯一合法数据源）
    schema.value = patched
    schemaText.value = JSON.stringify(patched, null, 2)
    highlightMap.value = { added, updated }

    if (summaryParts.length > 0) {
      message.success(`已应用修改：${summary}`, { duration: 4000 })
    }

    // 4秒后清理高亮
    setTimeout(() => {
      highlightMap.value = { added: [], updated: [] }
    }, 4000)

    // 清理 Patch 相关临时状态
    pendingPatch.value = null
    isPatchModalOpen.value = false
    selectedFieldKey.value = null
    showFieldEditor.value = false
    backupField.value = null
    parseError.value = ''
  } catch (err: any) {
    console.error('应用 Patch 失败', err)
    parseError.value = err.message
  }
}

function cancelPatch() {
  // 取消预览时，只清理 Patch 预览相关状态，不影响 schema
  pendingPatch.value = null
  isPatchModalOpen.value = false
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

      <!-- Patch 历史记录 -->
      <div v-if="patchHistory.length > 0" class="history-bar">
        <span class="history-label">修改记录：</span>
        <span v-for="record in patchHistory" :key="record.id" class="history-tag"
          :title="`${new Date(record.timestamp).toLocaleString()} · 点击回滚`" @click="rollbackTo(record)">
          {{ record.summary }}
        </span>
      </div>

      <section class="grid">
        <div class="panel editor-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Schema JSON</p>
              <h2 class="text-overflow-ellipsis">可编辑的 Schema 文本 </h2>
            </div>
            <div class="actions">
              <NButton size="tiny" quaternary type="primary" class="schema-action-btn" @click="triggerFileImport">
                导入 JSON
              </NButton>
              <input ref="fileInputRef" type="file" accept=".json" style="display: none" @change="handleFileSelect" />
              <NButton size="tiny" quaternary type="primary" class="schema-action-btn" @click="copySchema">
                复制 JSON
              </NButton>
              <NButton size="tiny" quaternary type="primary" class="schema-action-btn" @click="exportSchema">
                导出 JSON
              </NButton>
            </div>
          </div>
          <NInput v-model:value="schemaText" type="textarea" placeholder="粘贴或编辑 JSON Schema" class="schema-input" />
          <NAlert v-if="parseError" type="error" class="alert">
            JSON 解析错误：{{ parseError }}
          </NAlert>
        </div>

        <div class="panel form-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">实时预览</p>
              <h2 class="text-overflow-ellipsis">{{ schema?.title || '表单预览' }}</h2>
            </div>
            <span class="hint">Schema 为唯一数据源</span>
          </div>
          <div class="form-body">
            <FormRenderer v-if="schema" :schema="schema" :selected-field-key="selectedFieldKey"
              :highlight-map="highlightMap" @select-field="openFieldEditor" />
            <p v-else class="placeholder">请先提供合法的 Schema JSON</p>
          </div>
        </div>
      </section>

      <FieldEditor v-if="schema && selectedFieldKey" :show="showFieldEditor" :schema="schema"
        :field-key="selectedFieldKey" :backup-field="backupField" @update:show="(val) => (showFieldEditor = val)"
        @update-schema="handleUpdateSchema" @confirm="onConfirm" @cancel="onCancel" @reset="onReset" />

      <PatchPreviewModal :show="isPatchModalOpen" :patch="pendingPatch" :schema="schema"
        @update:show="(val) => (isPatchModalOpen = val)" @confirm="confirmPatch" @cancel="cancelPatch" />

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
  height: 70vh;
}

.form-panel {
  height: 70vh;
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

.schema-input {
  height: 100%;
}

.schema-input :deep(textarea) {
  height: 100% !important;
  min-height: 280px;
  border-radius: 12px;
  font-family: 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 13px;
}



.alert {
  margin-top: 4px;
}

.placeholder {
  margin: 0;
  color: #94a3b8;
}

/* Patch 历史记录样式（简洁标签） */
.history-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.history-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.history-tag {
  font-size: 12px;
  color: #64748b;
  padding: 4px 10px;
  background: rgba(99, 102, 241, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-tag:hover {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* 文本溢出省略 */
.text-overflow-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.rollback-btn {
  border-radius: 999px;
  padding: 0 10px;
  border: 1px solid rgba(99, 102, 241, 0.35);
  background: radial-gradient(circle at 0 0, rgba(129, 140, 248, 0.18), transparent 55%);
  color: #4f46e5;
}
</style>
