<script setup lang="ts">
import { computed } from 'vue'
import { NModal, NAlert } from 'naive-ui'

interface PatchOperation {
  op: 'add' | 'update' | 'remove'
  target: 'schema' | 'field'
  name?: string
  value?: any
  label?: string
}

interface Patch {
  operations: PatchOperation[]
}

interface DiffItem {
  key: string
  type: 'add' | 'update' | 'remove'
  text: string
}

import type { OpDecision } from '../utils/types'
import type { PatchModelOutput } from '../utils/validatePatch'

const props = defineProps<{
  show: boolean
  patch: Patch | null
  schema: any | null
  validation?: {
    ok: boolean
    baseVersion?: number
    summary?: string
    modelError?: string
    validOps: any[]
    invalidOps: Array<{ op: any; reason: string }>
    stats: { total: number; valid: number; invalid: number }
  } | null
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

// 根据 schema 和 patch 构建语义级 diff 摘要
function buildPatchDiffSummary(schema: any, patch: Patch | null): DiffItem[] {
  if (!patch || !patch.operations || patch.operations.length === 0) {
    return []
  }

  const items: DiffItem[] = []
  const fields = schema?.fields || []

  patch.operations.forEach((op, index) => {
    if (op.op === 'add' && op.target === 'field') {
      const fieldValue = op.value || {}
      const requiredText = fieldValue.required ? '必填' : '选填'
      items.push({
        key: `add-${index}`,
        type: 'add',
        text: `新增字段：${fieldValue.label || fieldValue.name || '未知'}（${fieldValue.type || 'unknown'}，${requiredText}）`
      })
    } else if (op.op === 'update' && op.target === 'field') {
      const fieldName = op.name
      const changes = op.value || {}
      const existingField = fields.find((f: any) => f.name === fieldName)
      
      const changeDetails = Object.keys(changes).map((key) => {
        const oldVal = existingField?.[key]
        const newVal = changes[key]
        return `${key}: ${formatValue(oldVal)} → ${formatValue(newVal)}`
      }).join('，')

      items.push({
        key: `update-${index}`,
        type: 'update',
        text: `修改字段：${existingField?.label || fieldName}（${changeDetails}）`
      })
    } else if (op.op === 'update' && op.target === 'schema') {
      const changes = op.value || {}
      const changeDetails = Object.keys(changes).map((key) => {
        const oldVal = schema?.[key]
        const newVal = changes[key]
        return `${key}: ${formatValue(oldVal)} → ${formatValue(newVal)}`
      }).join('，')

      items.push({
        key: `update-schema-${index}`,
        type: 'update',
        text: `修改 Schema（${changeDetails}）`
      })
    } else if (op.op === 'remove' && op.target === 'field') {
      const fieldName = op.name
      const existingField = fields.find((f: any) => f.name === fieldName)
      items.push({
        key: `remove-${index}`,
        type: 'remove',
        text: `删除字段：${existingField?.label || fieldName}`
      })
    }
  })

  return items
}

function formatValue(val: any): string {
  if (val === undefined || val === null) return '无'
  if (typeof val === 'boolean') return val ? '是' : '否'
  if (typeof val === 'string') return val || '空'
  return String(val)
}

const diffItems = computed(() => buildPatchDiffSummary(props.schema, props.patch))

const validation = computed(() => props.validation)
console.log('validation in modal', validation.value)

const appliedCount = computed(() => validation.value?.stats.valid ?? 0)
const skippedCount = computed(() => validation.value?.stats.invalid ?? 0)

// whether the Apply button should be disabled
const isApplyDisabled = computed(() => appliedCount.value <= 0)

function getOpText(op: any): string {
  if (op.op === 'add' && op.target === 'field') {
    return `新增字段：${op.value?.label || op.value?.name || '未知'}（type=${op.value?.type || 'unknown'}）`
  }
  if (op.op === 'update' && op.target === 'field') {
    const changedProps = Object.keys(op.value || {}).join('、')
    return `修改字段：${op.name}（修改了：${changedProps}）`
  }
  if (op.op === 'update' && op.target === 'schema') {
    const changedProps = Object.keys(op.value || {}).join('、')
    return `修改 Schema（修改了：${changedProps}）`
  }
  if (op.op === 'remove' && op.target === 'field') {
    return `删除字段：${op.name}`
  }
  return `未知操作：${op.op}`
}

const isVersionMismatch = computed(() => {
  if (!props.patch || !props.schema) return false
  const base = (props.patch as any).baseVersion ?? null
  const current = props.schema?.meta?.version ?? null
  return base !== null && current !== null && base !== current
})

// friendly versions for template (avoid TS assertions inside template)
const patchBaseVersion = computed(() => (validation.value?.baseVersion ?? 'unknown'))
const schemaCurrentVersion = computed(() => (props.schema?.version ?? 'unknown'))

// 原有 patchItems（用于展示原始 patch 操作）
const patchItems = computed(() => {
  if (!props.patch || !props.patch.operations) return []
  return props.patch.operations.map((op, index) => {
    if (op.op === 'add' && op.target === 'field') {
      return {
        key: `add-${index}`,
        type: 'add_field',
        text: `新增字段：${op.value?.label || op.value?.name || '未知'}（type=${op.value?.type || 'unknown'}）`
      }
    }
    if (op.op === 'update' && op.target === 'field') {
      const changedProps = Object.keys(op.value || {}).join('、')
      return {
        key: `update-${index}`,
        type: 'update_field',
        text: `修改字段：${op.name}（修改了：${changedProps}）`
      }
    }
    if (op.op === 'update' && op.target === 'schema') {
      const changedProps = Object.keys(op.value || {}).join('、')
      return {
        key: `update-schema-${index}`,
        type: 'update_schema',
        text: `修改 Schema（修改了：${changedProps}）`
      }
    }
    if (op.op === 'remove' && op.target === 'field') {
      return {
        key: `remove-${index}`,
        type: 'remove_field',
        text: `删除字段：${op.name}`
      }
    }
    return {
      key: `unknown-${index}`,
      type: 'unknown',
      text: `未知操作：${op.op}`
    }
  })
})

function handleConfirm() {
  // safety: prevent confirm if there is nothing to apply
  if (appliedCount.value <= 0) {
    return
  }
  emit('confirm')
  emit('update:show', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:show', false)
}
</script>

<template>
  <NModal
    :show="show"
    :mask-closable="false"
    transform-origin="center"
    @update:show="(val) => {
      emit('update:show', val)
      if (!val) {
        emit('cancel')
      }
    }"
  >
    <div class="ai-modal">
      <div class="modal-header">
        <div class="ai-icon">
          <span class="sparkle">✦</span>
        </div>
        <div class="header-text">
          <h3>请确认以下变更</h3>
          <p class="subtitle">以下变更将应用到当前 Schema</p>
          <p class="meta" v-if="props.patch && props.schema">
            Patch 基于版本：{{ patchBaseVersion }} · 当前 Schema 版本：{{ schemaCurrentVersion }}
          </p>
        </div>
        <button class="close-btn" @click="handleCancel">×</button>
      </div>

      <!-- 版本警示（若 patch 基于的版本与当前 schema 不符） -->
      <!-- <div class="version-alert" v-if="isVersionMismatch">
        <NAlert show-icon type="warning" title="版本不匹配">
          <div>该 Patch 基于的版本与当前 Schema 不一致，应用前请确认或重新生成 Patch。</div>
        </NAlert>
      </div> -->

      <!-- 变更摘要区块 -->
      <div class="diff-summary">
        <div class="section-title">变更摘要</div>
        <ul v-if="diffItems.length > 0" class="summary-list">
          <li
            v-for="item in diffItems"
            :key="item.key"
            :class="item.type"
          >
            <span class="prefix">{{ item.type === 'add' ? '+' : item.type === 'update' ? '~' : '-' }}</span>
            {{ item.text }}
          </li>
        </ul>
        <p v-else class="empty-hint">未检测到任何有效修改</p>
      </div>

      <!-- 操作决策列表 -->
      <div class="decision-summary" style="padding: 12px 20px; border-bottom: 1px solid rgba(99,102,241,0.06); display:flex; gap:12px; align-items:center;">
        <div style="display:flex; gap:8px; align-items:center;">
          <div style="background:#ecfdf5; color:#16a34a; padding:6px 10px; border-radius:8px; font-weight:600;">将应用 {{ appliedCount }} 条</div>
          <div style="background:#fff7ed; color:#d97706; padding:6px 10px; border-radius:8px; font-weight:600;">将跳过 {{ skippedCount }} 条</div>
        </div>
        <div style="margin-left:auto; color:#64748b; font-size:13px;">按操作顺序展示</div>
      </div>

      <!-- Patch 操作详情 -->
      <div class="patch-list">
        <div class="section-title">Patch 操作详情</div>
        <template v-if="validation && (validation.validOps.length > 0 || validation.invalidOps.length > 0)">
          <!-- Valid operations -->
          <div
            v-for="(op, idx) in validation.validOps"
            :key="`valid-${idx}`"
            class="patch-item"
          >
            <span class="op-icon" style="background: linear-gradient(135deg,#22c55e 0%,#16a34a 100%);">
              ✅
            </span>
            <div style="flex:1">
              <div class="op-text">{{ getOpText(op) }}</div>
            </div>
          </div>

          <!-- Invalid operations -->
          <div
            v-for="(invalid, idx) in validation.invalidOps"
            :key="`invalid-${idx}`"
            class="patch-item"
          >
            <span class="op-icon" style="background: linear-gradient(135deg,#f59e0b 0%,#d97706 100%);">
              ⚠️
            </span>
            <div style="flex:1">
              <div class="op-text">{{ getOpText(invalid.op) }}</div>
              <div style="font-size:12px; color:#b45309; margin-top:6px;">
                跳过原因：{{ invalid.reason }}
              </div>
            </div>
          </div>
        </template>
        <p v-else class="empty">暂无操作</p>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" @click="handleCancel">取消</button>
        <button class="btn btn-primary" :disabled="isApplyDisabled" @click="handleConfirm">
          Apply ({{ appliedCount }}) 
        </button>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.ai-modal {
  width: 420px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  border: 1px solid rgba(99, 102, 241, 0.15);
  box-shadow:
    0 25px 50px -12px rgba(99, 102, 241, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 20px 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  position: relative;
}

.ai-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.sparkle {
  color: #fff;
  font-size: 18px;
  animation: sparkle-pulse 2s ease-in-out infinite;
}

@keyframes sparkle-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.header-text {
  flex: 1;
}

.header-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(100, 116, 139, 0.1);
  border-radius: 8px;
  font-size: 18px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(100, 116, 139, 0.2);
  color: #0f172a;
}

.patch-list {
  padding: 16px 20px;
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.patch-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.patch-item:hover {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
}

.patch-item.add_field {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.04) 100%);
  border-color: rgba(34, 197, 94, 0.2);
}

.patch-item.add_field .op-icon {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.patch-item.update_field,
.patch-item.update_schema {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%);
  border-color: rgba(245, 158, 11, 0.2);
}

.patch-item.update_field .op-icon,
.patch-item.update_schema .op-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.patch-item.remove_field {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%);
  border-color: rgba(239, 68, 68, 0.2);
}

.patch-item.remove_field .op-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.op-icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.op-text {
  font-size: 14px;
  color: #334155;
  line-height: 1.4;
}

/* 变更摘要区块样式 */
.diff-summary {
  padding: 16px 20px 8px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.summary-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-list li {
  font-size: 13px;
  color: #334155;
  padding: 6px 10px;
  border-radius: 6px;
  background: #f8fafc;
}

.summary-list li .prefix {
  font-weight: 700;
  margin-right: 6px;
}

.summary-list li.add {
  color: #16a34a;
  background: rgba(34, 197, 94, 0.08);
}

.summary-list li.add .prefix {
  color: #22c55e;
}

.summary-list li.update {
  color: #d97706;
  background: rgba(245, 158, 11, 0.08);
}

.summary-list li.update .prefix {
  color: #f59e0b;
}

.summary-list li.remove {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.08);
}

.summary-list li.remove .prefix {
  color: #ef4444;
}

.empty-hint {
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
  padding: 12px;
  margin: 0;
}

.empty {
  text-align: center;
  color: #94a3b8;
  padding: 32px 20px;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  background: #f8fafc;
  border-top: 1px solid rgba(99, 102, 241, 0.1);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-ghost {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-ghost:hover {
  background: #f1f5f9;
  color: #334155;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
  transform: translateY(-1px);
}

.btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
  box-shadow: none;
  transform: none;
}

.btn-icon {
  font-size: 13px;
}
</style>

