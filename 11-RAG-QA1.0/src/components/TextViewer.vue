<template>
  <div class="text-viewer" ref="containerRef">
    <div
      v-for="(chunk, index) in chunks"
      :key="index"
      class="chunk-block"
      :data-chunk-id="`chunk-${index + 1}`"
      :class="{ 
        active: isHighlighted(index + 1),
        flash: isFlashing(index + 1)
      }"
    >
      <div class="chunk-left-border"></div>
      <div class="chunk-content">
        <div class="chunk-meta">#{{ index + 1 }}</div>
        <pre class="text-content">{{ chunk }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  chunks: string[];
  highlightChunkIndices?: number[];
}>();

const containerRef = ref<HTMLElement | null>(null);
const activeId = ref<number | null>(null);
const flashingIds = ref<Set<number>>(new Set());
let highlightTimer: number | null = null;
let flashTimers: Map<number, number> = new Map();

/**
 * 判断 chunk 是否应该高亮
 * - 支持单个 activeId（临时高亮）
 * - 支持多个 highlightChunkIndices（多引用高亮）
 */
function isHighlighted(id: number) {
  if (activeId.value === id) return true;
  if (Array.isArray(props.highlightChunkIndices)) {
    return props.highlightChunkIndices.includes(id);
  }
  return false;
}

/**
 * 判断 chunk 是否正在 flash 动画
 */
function isFlashing(id: number) {
  return flashingIds.value.has(id);
}

/**
 * 滚动到指定 chunk 并触发 flash 动画
 * - 平滑滚动到目标位置
 * - 添加 flash 动画效果
 * - 3 秒后自动移除高亮
 */
function scrollToChunk(id: number) {
  if (!containerRef.value) return;
  const target = containerRef.value.querySelector(
    `[data-chunk-id="chunk-${id}"]`
  ) as HTMLElement | null;
  if (target) {
    // 平滑滚动到目标位置
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    
    // 设置临时高亮
    activeId.value = id;
    
    // 触发 flash 动画
    flashingIds.value.add(id);
    
    // 清除之前的 flash timer（如果存在）
    const existingTimer = flashTimers.get(id);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }
    
    // 300ms 后移除 flash 动画
    const flashTimer = window.setTimeout(() => {
      flashingIds.value.delete(id);
      flashTimers.delete(id);
    }, 300);
    flashTimers.set(id, flashTimer);
    
    // 清除之前的 highlight timer
    if (highlightTimer) {
      window.clearTimeout(highlightTimer);
    }
    
    // 3 秒后移除高亮
    highlightTimer = window.setTimeout(() => {
      activeId.value = null;
    }, 3000);
  }
}

defineExpose({
  scrollToChunk
});
</script>

<style scoped>
.text-viewer {
  width: 100%;
  max-height: 650px;
  overflow-y: auto;
  border-radius: 12px;
  background: transparent;
  border: none;
  position: relative;
  padding: 12px;
}

.chunk-block {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: none;
  border-radius: 0 12px 12px 0;
  margin-bottom: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden; /* 防止内容溢出容器 */
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  min-height: 60px;
  width: 100%; /* 确保不超出父容器 */
  box-sizing: border-box; /* 包含 padding 和 border 在宽度内 */
}

/* 左侧竖线 - 专业阅读器风格 */
.chunk-left-border {
  width: 4px;
  background: rgba(99, 102, 241, 0.3);
  border-radius: 2px 0 0 2px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.chunk-block.active .chunk-left-border {
  background: linear-gradient(180deg, #6366f1, #8b5cf6);
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
  width: 5px;
}

/* 内容区域 */
.chunk-content {
  flex: 1;
  min-width: 0; /* 防止 flex 子元素溢出 */
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden; /* 防止内容溢出 */
}

/* 高亮状态 - 多引用同时高亮 */
.chunk-block.active {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow:
    0 0 0 1px rgba(99, 102, 241, 0.3),
    0 8px 24px rgba(99, 102, 241, 0.2),
    0 0 20px rgba(99, 102, 241, 0.15);
  transform: translateX(2px);
}

/* Flash 动画 - 突出定位位置 */
.chunk-block.flash {
  animation: flashHighlight 0.3s ease-out;
}

@keyframes flashHighlight {
  0% {
    background: rgba(99, 102, 241, 0.25);
    box-shadow:
      0 0 0 2px rgba(99, 102, 241, 0.6),
      0 12px 32px rgba(99, 102, 241, 0.4),
      0 0 30px rgba(99, 102, 241, 0.3);
    transform: translateX(4px) scale(1.01);
  }
  50% {
    background: rgba(99, 102, 241, 0.18);
    box-shadow:
      0 0 0 1px rgba(99, 102, 241, 0.5),
      0 10px 28px rgba(99, 102, 241, 0.3),
      0 0 25px rgba(99, 102, 241, 0.25);
    transform: translateX(3px) scale(1.005);
  }
  100% {
    background: rgba(99, 102, 241, 0.12);
    box-shadow:
      0 0 0 1px rgba(99, 102, 241, 0.3),
      0 8px 24px rgba(99, 102, 241, 0.2),
      0 0 20px rgba(99, 102, 241, 0.15);
    transform: translateX(2px) scale(1);
  }
}

/* 编号标签 - 优化样式 */
.chunk-meta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 6px;
  font-weight: 700;
  letter-spacing: 0.3px;
  width: fit-content;
  transition: all 0.2s ease;
}

.chunk-block.active .chunk-meta {
  background: rgba(99, 102, 241, 0.35);
  border-color: rgba(99, 102, 241, 0.5);
  color: #fff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.text-content {
  margin: 0;
  padding: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word; /* 强制长单词换行 */
  overflow-wrap: break-word; /* 现代浏览器换行 */
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, "Courier New", monospace;
  font-size: 13px;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.88);
  background: transparent;
  overflow-x: hidden; /* 隐藏水平滚动，强制换行 */
  max-width: 100%; /* 确保不超过容器宽度 */
}

/* 滚动条样式 */
.text-viewer::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.text-viewer::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.text-viewer::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.4);
  border-radius: 4px;
}

.text-viewer::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.6);
}

/* 分页标记样式已通过文本内容本身处理 */

/* 响应式 */
@media (max-width: 640px) {
  .text-viewer {
    max-height: 400px;
  }

  .text-content {
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>