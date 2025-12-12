<template>
  <div class="ui-card qa-card">
    <div class="card-header">
      <div class="dot purple"></div>
      <span>RAG 文档问答</span>
      <span class="count" v-if="chunks?.length">片段 {{ chunks.length }} 个</span>
    </div>

    <div class="qa-input">
      <div class="textarea-wrapper">
        <textarea
          v-model="question"
          class="qa-textarea"
          rows="3"
          placeholder="向文档提问，如：这份文档的主要结论是什么？"
          :disabled="loading"
          @keydown="handleKeyDown"
        ></textarea>
        <div class="textarea-overlay" v-if="loading">
          <div class="loading-indicator">
            <div class="loading-spinner"></div>
            <span class="loading-text">AI 正在思考中...</span>
          </div>
        </div>
      </div>
      <div class="qa-actions">
        <button class="ask-btn" :disabled="loading || !question.trim()" @click="handleAsk">
          <span v-if="loading" class="btn-spinner"></span>
          <span v-else class="btn-text">
            <span class="btn-icon">💬</span>
            问文档
          </span>
        </button>
        <span class="qa-hint">
          <span class="hint-icon">⌨️</span>
          <span>Enter 发送 · Shift+Enter 换行 · 引用格式 [[1]] 或 [[1,3]]</span>
        </span>
      </div>
    </div>

    <!-- Loading 状态 -->
    <div class="qa-loading" v-if="loading && !answer">
      <div class="loading-card">
        <div class="loading-animation">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
        <p class="loading-message">AI 正在分析文档并生成回答...</p>
      </div>
    </div>

    <!-- AI 回答卡片 -->
    <div class="qa-answer" v-else-if="answer">
      <div class="answer-header">
        <div class="answer-title-wrapper">
          <div class="answer-icon">✨</div>
          <div>
            <div class="answer-title">AI 回答</div>
            <div class="answer-subtitle">基于文档内容生成</div>
          </div>
        </div>
        <div class="answer-badge" v-if="answer.sources?.length">
          {{ answer.sources.length }} 个引用
        </div>
      </div>
      <div class="answer-content">
        <p class="answer-text">
          <span v-for="(seg, idx) in parseWithRefs(answer.answer || '')" :key="`ans-${idx}`">
            <template v-if="seg.type === 'text'">{{ seg.text }}</template>
            <span v-else class="ref-group">
              <a
                href="#"
                class="ref-link"
                @click.prevent="handleRefClick(seg.ids)"
              >[[{{ seg.ids.join(',') }}]]</a>
            </span>
          </span>
        </p>
        <div class="sources" v-if="answer.sources?.length">
          <span class="source-label">
            <span class="source-icon">📎</span>
            引用片段：
          </span>
          <div class="source-chips">
            <button
              v-for="s in answer.sources"
              :key="s"
              class="source-chip"
              @click="emit('scroll-to-chunks', [Number(s)])"
            >
              #{{ s }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div class="qa-error" v-else-if="error">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <div class="error-title">出错了</div>
        <div class="error-message">{{ error }}</div>
      </div>
    </div>

    <!-- 占位符 -->
    <div class="qa-placeholder" v-else>
      <div class="placeholder-icon">💡</div>
      <p class="placeholder-text">提问后将在这里展示 AI 回答</p>
      <p class="placeholder-hint">支持多引用格式，点击引用可跳转到对应片段</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { answerQuestion } from "../services/qaService";

const props = defineProps<{
  chunks: string[];
}>();

const emit = defineEmits<{
  (e: "scroll-to-chunks", ids: number[]): void;
}>();

const question = ref("");
const loading = ref(false);
const answer = ref<{ answer: string; sources: number[] } | null>(null);
const error = ref("");

type Segment =
  | { type: "text"; text: string }
  | { type: "ref"; ids: string[] };

/**
 * 解析文本中的引用标记，支持 [[1,4]]、[[2,5,6]] 等多引用格式
 * 返回 Segment 数组，每个 ref 类型的 segment 包含所有引用编号
 */
function parseWithRefs(str: string): Segment[] {
  const segments: Segment[] = [];
  // 支持形如 [[1,4]]、[[#2,5,6]]、[[1, 4]] 等多种格式
  const regex = /\[\[([#\d,\s，、]+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", text: str.slice(lastIndex, match.index) });
    }
    // 解析引用编号：去除 # 号，分割逗号/顿号，转换为数字数组
    const ids = match[1]
      .split(/[,，、]/)
      .map((id) => id.trim().replace(/^#/, ""))
      .filter(Boolean)
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));
    if (ids.length) {
      segments.push({ type: "ref", ids: ids.map(String) });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    segments.push({ type: "text", text: str.slice(lastIndex) });
  }
  return segments;
}

/**
 * 处理引用点击事件
 * - 解析引用编号数组
 * - 滚动到最小编号（第一个引用）
 * - 高亮所有引用的片段
 */
function handleRefClick(ids: string[]) {
  const numIds = ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
  if (numIds.length === 0) return;
  // 触发事件，传递所有引用编号数组
  emit("scroll-to-chunks", numIds);
}

/**
 * 处理键盘事件
 * - Enter: 发送（如果未按 Shift）
 * - Shift+Enter: 换行
 */
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!loading.value && question.value.trim()) {
      handleAsk();
    }
  }
}

async function handleAsk() {
  if (!question.value.trim()) return;
  loading.value = true;
  error.value = "";
  answer.value = null;
  try {
    const res = await answerQuestion(question.value, props.chunks);
    const normalized = {
      answer: res?.answer ?? "",
      sources: Array.isArray(res?.sources) ? res.sources : [],
    };
    answer.value = normalized;
  } catch (e: any) {
    error.value = e?.message || "提问失败，请重试";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.qa-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
  min-height: 400px;
  max-height: 700px;
  height: 100%; /* 填充网格单元格 */
  display: flex;
  flex-direction: column;
}

.qa-card .card-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 700;
  color: var(--text-1);
  margin-bottom: var(--space-3);
  font-size: var(--text-lg);
}

.qa-card .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
}

.qa-card .count {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--text-2);
  font-weight: 500;
  padding: 4px 10px;
  background: var(--primary-weak);
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
}

.qa-card .qa-input {
  flex-shrink: 0;
}

.qa-card .qa-loading,
.qa-card .qa-answer,
.qa-card .qa-error,
.qa-card .qa-placeholder {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* QA 卡片滚动条样式 */
.qa-card .qa-answer::-webkit-scrollbar,
.qa-card .qa-loading::-webkit-scrollbar,
.qa-card .qa-error::-webkit-scrollbar,
.qa-card .qa-placeholder::-webkit-scrollbar {
  width: 6px;
}

.qa-card .qa-answer::-webkit-scrollbar-track,
.qa-card .qa-loading::-webkit-scrollbar-track,
.qa-card .qa-error::-webkit-scrollbar-track,
.qa-card .qa-placeholder::-webkit-scrollbar-track {
  background: rgba(99, 102, 241, 0.05);
  border-radius: 3px;
}

.qa-card .qa-answer::-webkit-scrollbar-thumb,
.qa-card .qa-loading::-webkit-scrollbar-thumb,
.qa-card .qa-error::-webkit-scrollbar-thumb,
.qa-card .qa-placeholder::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.2);
  border-radius: 3px;
}

.qa-card .qa-answer::-webkit-scrollbar-thumb:hover,
.qa-card .qa-loading::-webkit-scrollbar-thumb:hover,
.qa-card .qa-error::-webkit-scrollbar-thumb:hover,
.qa-card .qa-placeholder::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.3);
}


.qa-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.textarea-wrapper {
  position: relative;
}

.qa-textarea {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(99, 102, 241, 0.12);
  padding: 14px 16px;
  font-size: 14px;
  font-family: "Inter", "PingFang SC", system-ui, -apple-system, sans-serif;
  resize: vertical;
  min-height: 100px;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(250, 251, 255, 0.95));
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.06);
}

.qa-textarea:focus {
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow: 
    0 4px 16px rgba(79, 70, 229, 0.12),
    0 0 0 3px rgba(99, 102, 241, 0.08);
  background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(250, 251, 255, 0.98));
}

.qa-textarea:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.textarea-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 13px;
  color: #6366f1;
  font-weight: 500;
}

.qa-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ask-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #8b5cf6 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 12px rgba(99, 102, 241, 0.3),
    0 0 0 0 rgba(99, 102, 241, 0.4);
  position: relative;
  overflow: hidden;
}

.ask-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.ask-btn:hover::before {
  left: 100%;
}

.ask-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.ask-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 20px rgba(99, 102, 241, 0.4),
    0 0 0 4px rgba(99, 102, 241, 0.1);
}

.ask-btn:not(:disabled):active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.btn-icon {
  font-size: 16px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.qa-hint {
  font-size: 11px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.8;
}

.hint-icon {
  font-size: 12px;
}

/* Loading 状态 */
.qa-loading {
  margin-top: 0;
}

.loading-card {
  background: linear-gradient(135deg, rgba(236, 239, 255, 0.98), rgba(225, 234, 255, 0.95), rgba(219, 234, 254, 0.92));
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 12px 40px rgba(79, 70, 229, 0.08);
}

.loading-animation {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.loading-dot {
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  animation: loadingBounce 1.4s ease-in-out infinite;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loadingBounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.loading-message {
  margin: 0;
  font-size: 14px;
  color: #6366f1;
  font-weight: 500;
}

/* AI 回答卡片 - 简约炫酷样式，与摘要卡片风格一致 */
.qa-answer {
  margin-top: 0;
  background: linear-gradient(135deg, rgba(236, 239, 255, 0.98), rgba(225, 234, 255, 0.95), rgba(219, 234, 254, 0.92));
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 12px 40px rgba(79, 70, 229, 0.08);
  position: relative;
  overflow: hidden;
  animation: answerSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes answerSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

.answer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.08);
  background: transparent;
}

.answer-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.answer-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3));
  animation: iconFloat 2s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.answer-title {
  font-weight: 800;
  font-size: 18px;
  color: #1e2239;
  margin: 0;
  background: linear-gradient(135deg, #1e2239 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.answer-subtitle {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
  opacity: 0.8;
}

.answer-badge {
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.12));
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
}

.answer-content {
  padding: 20px;
}

.answer-text {
  margin: 0 0 16px;
  line-height: 1.8;
  color: #1f2937;
  word-break: break-word;
  font-size: 15px;
}

.ref-group {
  margin: 0 2px;
}

.ref-link {
  color: #6366f1;
  text-decoration: none;
  margin: 0 2px;
  padding: 4px 8px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.12));
  border: 1px solid rgba(99, 102, 241, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 700;
  font-size: 12px;
  display: inline-block;
  position: relative;
  overflow: hidden;
}

.ref-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.ref-link:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2));
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 
    0 4px 12px rgba(99, 102, 241, 0.3),
    0 0 0 2px rgba(99, 102, 241, 0.1);
  transform: translateY(-1px);
}

.ref-link:hover::before {
  left: 100%;
}

.sources {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(99, 102, 241, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.source-label {
  font-size: 13px;
  color: #4b5563;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.source-icon {
  font-size: 14px;
}

.source-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.source-chip {
  border: 1px solid rgba(99, 102, 241, 0.25);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.1));
  color: #6366f1;
  border-radius: 12px;
  padding: 6px 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  font-size: 12px;
  position: relative;
  overflow: hidden;
}

.source-chip::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.source-chip:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.18));
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 
    0 4px 12px rgba(99, 102, 241, 0.25),
    0 0 0 2px rgba(99, 102, 241, 0.1);
  transform: translateY(-2px);
}

.source-chip:hover::before {
  width: 100px;
  height: 100px;
}

/* 错误状态 */
.qa-error {
  margin-top: 16px;
  background: linear-gradient(135deg, rgba(254, 242, 242, 0.95), rgba(254, 226, 226, 0.9));
  border: 1px solid rgba(220, 38, 38, 0.15);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 8px 24px rgba(220, 38, 38, 0.08);
}

.error-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-weight: 700;
  font-size: 15px;
  color: #dc2626;
  margin-bottom: 4px;
}

.error-message {
  font-size: 13px;
  color: #991b1b;
  line-height: 1.5;
}

/* 占位符 */
.qa-placeholder {
  margin-top: 16px;
  background: linear-gradient(135deg, rgba(236, 239, 255, 0.6), rgba(225, 234, 255, 0.5));
  border: 1px dashed rgba(99, 102, 241, 0.15);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.05);
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 12px;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(99, 102, 241, 0.2));
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

.placeholder-text {
  margin: 0 0 8px;
  color: #4b5563;
  font-size: 15px;
  font-weight: 600;
}

.placeholder-hint {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
  opacity: 0.8;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .qa-card {
    max-height: 600px;
  }
}
</style>

