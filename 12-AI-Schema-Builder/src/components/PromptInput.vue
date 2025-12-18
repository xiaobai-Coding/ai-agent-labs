<script setup lang="ts">
// @ts-nocheck
import { ref } from 'vue'
import { NButton } from 'naive-ui'

const props = defineProps<{
  onGenerate?: (prompt: string) => Promise<any> | void
}>()
const emit = defineEmits(['generate'])

const userPrompt = ref<string>('')
const loading = ref(false)

const handleGenerate = async () => {
  if (!userPrompt.value || loading.value) return
  loading.value = true
  try {
    if (props.onGenerate) {
      await props.onGenerate(userPrompt.value)
    } else {
      emit('generate', userPrompt.value)
    }
  } catch (e) {
    // swallow to allow UI reset
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="prompt">
    <div class="section-header">
      <h1 class="eyebrow">AI Schema Builder</h1>
      <p class="desc">让 AI 帮你生成表单与 Schema，描述需求 → 生成 Schema → 预览表单，一站式体验。</p>
    </div>
    <div class="input-wrap">
      <textarea
        rows="6"
        placeholder="例如：创建一个包含姓名、邮箱、手机号的注册表单，手机号需要正则校验"
        v-model="userPrompt"
        @keydown.enter.prevent="handleGenerate"
      ></textarea>
      <NButton
        v-if="userPrompt.trim() || loading"
        :class="['send-btn', { 'send-btn--loading': loading }]"
        type="primary"
        size="small"
        circle
        aria-label="生成 Schema"
        :disabled="loading"
        @click="handleGenerate"
      >
        <span v-if="!loading">↑</span>
        <span v-else class="send-spinner"></span>
      </NButton>
    </div>
  </section>
</template>

<style scoped>
.prompt {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-compact {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(14, 165, 233, 0.1));
  border: 1px solid rgba(99, 102, 241, 0.14);
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: 0 12px 28px rgba(99, 102, 241, 0.12);
}

.eyebrow {
  margin: 0 0 4px;
  color: #6366f1;
  font-weight: 700;
  letter-spacing: 0.4px;
}

h1 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.subtext {
  margin: 6px 0 0;
  color: #334155;
  font-size: 13px;
}

.section-header h2 {
  margin: 0;
  font-size: 16px;
}

.desc {
  margin: 4px 0 0;
  color: #475569;
  font-size: 14px;
}

textarea {
  width: 100%;
  min-height: 80px;
  height: 100px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: #f8f9ff;
  resize: vertical;
  font-size: 14px;
  color: #0f172a;
  outline: none;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.send-btn {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 0;
}

.send-btn :deep(.n-button) {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.send-btn :deep(.n-button:not(.n-button--disabled)):hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(99, 102, 241, 0.28);
}

.send-btn :deep(.n-button:not(.n-button--disabled)):active {
  transform: translateY(0);
  box-shadow: 0 8px 18px rgba(99, 102, 241, 0.22);
}

.send-btn--loading :deep(.n-button) {
  box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.7), 0 0 0 6px rgba(99, 102, 241, 0.28);
  animation: send-pulse 1.1s ease-out infinite;
}

.send-spinner {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 2px solid rgba(248, 250, 252, 0.4);
  border-top-color: #ffffff;
  border-right-color: #e5e7eb;
  animation: send-spin 0.7s linear infinite;
}

.input-wrap {
  position: relative;
}

@keyframes send-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes send-pulse {
  0% {
    box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.7), 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
  70% {
    box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.2), 0 0 0 10px rgba(129, 140, 248, 0.0);
  }
  100% {
    box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.2), 0 0 0 4px rgba(129, 140, 248, 0.0);
  }
}

@media (max-width: 768px) {
  .actions {
    justify-content: stretch;
  }

  h1 {
    font-size: 16px;
  }

  .subtext {
    font-size: 12px;
  }

  .hero-compact {
    padding: 10px 12px;
  }
}
</style>
