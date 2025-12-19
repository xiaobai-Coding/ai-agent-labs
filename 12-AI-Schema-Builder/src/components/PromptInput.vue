<script setup lang="ts">
// @ts-nocheck
import { ref, computed } from 'vue'
import { NCard, NInput, NButton, NSpace } from 'naive-ui'

type GeneratePhase = 'idle' | 'classifying' | 'generating' | 'patching' | 'applying' | 'done' | 'error'

const props = defineProps<{
  onGenerate?: (prompt: string) => Promise<any> | void
  hasSchema?: boolean // 是否有已存在的 schema
  phase?: GeneratePhase // 当前生成阶段
}>()
const emit = defineEmits(['generate'])

const userPrompt = ref<string>('')

// 示例 prompt
const examplePrompts = [
  '创建一个包含姓名、邮箱、手机号的注册表单',
  '在当前表单中新增一个手机号字段，必填'
]

// 状态提示文案
const statusText = computed(() => {
  const phase = props.phase || 'idle'
  const statusMap: Record<GeneratePhase, string> = {
    idle: '描述你的表单需求，AI 将为你生成 Schema',
    classifying: '正在理解你的意图…',
    generating: '正在生成 Schema，请稍候…',
    patching: '正在基于当前 Schema 生成修改方案…',
    applying: '正在应用修改…',
    done: '已完成，你可以继续修改或新增需求',
    error: '执行失败，请检查输入或重试'
  }
  return statusMap[phase]
})

// 按钮文案根据 phase 动态变化
const buttonText = computed(() => {
  const phase = props.phase || 'idle'
  const textMap: Record<GeneratePhase, string> = {
    idle: '生成 Schema',
    classifying: '处理中…',
    generating: '处理中…',
    patching: '处理中…',
    applying: '处理中…',
    done: '继续修改',
    error: '重试'
  }
  return textMap[phase]
})

// 按钮是否禁用
const isButtonDisabled = computed(() => {
  const phase = props.phase || 'idle'
  if (phase === 'idle' || phase === 'done' || phase === 'error') {
    return !userPrompt.value.trim()
  }
  return true
})

const handleGenerate = async () => {
  if (!userPrompt.value.trim() || isButtonDisabled.value) return
  try {
    if (props.onGenerate) {
      await props.onGenerate(userPrompt.value.trim())
    } else {
      emit('generate', userPrompt.value.trim())
    }
  } catch (e) {
    // swallow to allow UI reset
  }
}

// 处理键盘事件：Enter 提交，Shift+Enter 换行
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (userPrompt.value.trim() && !isButtonDisabled.value) {
      handleGenerate()
    }
  }
}

// 清空输入框
const handleClear = () => {
  userPrompt.value = ''
}

// 填充示例（不触发生成）
const handleFillExample = () => {
  const randomIndex = Math.floor(Math.random() * examplePrompts.length)
  userPrompt.value = examplePrompts[randomIndex]
}

// 计算 placeholder 文本
const inputPlaceholder = computed(() => {
  return `描述你的表单需求，AI 将为你生成 Schema

例如：
• 创建一个注册表单：姓名、邮箱、手机号，手机号需要正则校验
• 在当前表单中新增一个"手机号"字段，必填`
})
</script>

<template>
  <NCard class="prompt-card" :bordered="true">
    <div class="prompt-header">
      <h1 class="prompt-title">AI Schema Builder</h1>
      <p class="prompt-subtitle">描述需求 → 生成 Schema → 实时预览表单（支持增量 Patch）</p>
    </div>
    
    <div class="prompt-input-section">
      <NInput
        :value="userPrompt"
        type="textarea"
        :placeholder="inputPlaceholder"
        :rows="5"
        class="prompt-textarea"
        @update:value="(val) => userPrompt = val"
        @keydown="handleKeydown"
      />
    </div>

    <div class="prompt-status">
      <span class="status-text">{{ statusText }}</span>
    </div>

    <div class="prompt-actions">
      <NSpace :wrap="true" :size="[12, 12]">
        <NButton
          type="primary"
          :disabled="isButtonDisabled"
          @click="handleGenerate"
        >
          {{ buttonText }}
        </NButton>
        <NButton
          quaternary
          :disabled="props.phase === 'classifying' || props.phase === 'generating' || props.phase === 'patching' || props.phase === 'applying'"
          @click="handleClear"
        >
          清空
        </NButton>
        <NButton
          quaternary
          :disabled="props.phase === 'classifying' || props.phase === 'generating' || props.phase === 'patching' || props.phase === 'applying'"
          @click="handleFillExample"
        >
          示例
        </NButton>
      </NSpace>
    </div>
  </NCard>
</template>

<style scoped>
.prompt-card {
  padding: 24px;
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 50%, #fafbfc 100%);
  border: 1px solid rgba(99, 102, 241, 0.06);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
}

.prompt-header {
  margin-bottom: 20px;
}

.prompt-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.prompt-subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

.prompt-input-section {
  margin-bottom: 12px;
}

.prompt-status {
  margin-bottom: 16px;
}

.status-text {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
}

.prompt-textarea :deep(.n-input__textarea-el) {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  min-height: 120px;
  background: #ffffff;
  transition: border-color 0.15s;
}

.prompt-textarea :deep(.n-input__textarea-el):focus {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.06);
}

.prompt-textarea :deep(.n-input__textarea-el::placeholder) {
  color: #94a3b8;
  white-space: pre-line;
}

.prompt-actions {
  display: flex;
  align-items: center;
}

.prompt-actions :deep(.n-space) {
  width: 100%;
}

.prompt-actions :deep(.n-button) {
  font-weight: 500;
}

.prompt-actions :deep(.n-button--primary-type) {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

.prompt-actions :deep(.n-button--quaternary-type) {
  opacity: 0.7;
  font-weight: 400;
}

.prompt-actions :deep(.n-button--quaternary-type):hover {
  opacity: 1;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .prompt-card {
    padding: 18px;
  }

  .prompt-title {
    font-size: 20px;
  }

  .prompt-subtitle {
    font-size: 13px;
  }

  .prompt-actions :deep(.n-space) {
    flex-wrap: wrap;
  }

  .prompt-actions :deep(.n-button) {
    flex: 1;
    min-width: 100px;
  }
}
.prompt-card :deep(.n-card__content) {
  padding: 0;
}
</style>
