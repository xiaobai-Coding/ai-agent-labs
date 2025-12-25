<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { NModal } from 'naive-ui'

const props = defineProps<{
  show: boolean
  info: { current: number; base: number }
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
}>()

function handleClose() {
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
    }"
  >
    <div class="warning-modal">
      <div class="modal-header">
        <div class="warning-icon">
          <span class="warning-symbol">⚠️</span>
        </div>
        <div class="header-text">
          <h3>Schema 版本冲突</h3>
          <p class="subtitle">检测到版本不一致，无法安全应用修改</p>
        </div>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="version-info">
        <div class="version-comparison">
          <div class="version-item">
            <span class="version-label">当前 Schema 版本</span>
            <span class="version-value current">{{ info.current }}</span>
          </div>
          <div class="version-item">
            <span class="version-label">Patch 基于版本</span>
            <span class="version-value base">{{ info.base }}</span>
          </div>
        </div>
      </div>

      <div class="warning-content">
        <div class="warning-section">
          <h4>问题原因</h4>
          <p>在 AI 生成修改期间，Schema 已被手动修改，导致版本不匹配。</p>
        </div>

        <div class="warning-section">
          <h4>建议操作</h4>
          <ul class="suggestion-list">
            <li>重新提交修改请求（推荐）</li>
            <li>或手动对比并合并差异后再尝试应用</li>
          </ul>
        </div>

        <div class="warning-section">
          <h4>安全保障</h4>
          <p>失败的 Patch 不会改变当前 Schema，也不会写入历史记录。</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-primary" @click="handleClose">
          知道了
        </button>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.warning-modal {
  width: 480px;
  background: linear-gradient(145deg, #ffffff 0%, #fef7f7 100%);
  border-radius: 20px;
  border: 1px solid rgba(239, 68, 68, 0.15);
  box-shadow:
    0 25px 50px -12px rgba(239, 68, 68, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 20px 16px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 101, 101, 0.05) 100%);
  border-bottom: 1px solid rgba(239, 68, 68, 0.1);
  position: relative;
}

.warning-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ef4444 0%, #f56565 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.warning-symbol {
  color: #fff;
  font-size: 18px;
  animation: warning-pulse 2s ease-in-out infinite;
}

@keyframes warning-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
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

.version-info {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(239, 68, 68, 0.1);
}

.version-comparison {
  display: flex;
  gap: 24px;
  justify-content: center;
}

.version-item {
  text-align: center;
  flex: 1;
}

.version-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.version-value {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  min-width: 60px;
  text-align: center;
}

.version-value.current {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.version-value.base {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.warning-content {
  padding: 16px 20px;
  max-height: 300px;
  overflow-y: auto;
}

.warning-section {
  margin-bottom: 16px;
}

.warning-section:last-child {
  margin-bottom: 0;
}

.warning-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.warning-section p {
  margin: 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

.suggestion-list {
  margin: 0;
  padding-left: 16px;
  list-style: none;
}

.suggestion-list li {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  position: relative;
  padding-left: 8px;
}

.suggestion-list li::before {
  content: "•";
  color: #f59e0b;
  font-weight: bold;
  position: absolute;
  left: -8px;
}

.suggestion-list li:first-child::before {
  content: "✓";
  color: #22c55e;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  background: #fef7f7;
  border-top: 1px solid rgba(239, 68, 68, 0.1);
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

.btn-primary {
  background: linear-gradient(135deg, #ef4444 0%, #f56565 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.45);
  transform: translateY(-1px);
}
</style>
