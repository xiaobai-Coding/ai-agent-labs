<template>
  <div class="text-viewer" ref="containerRef">
    <div
      v-for="(chunk, index) in chunks"
      :key="index"
      class="chunk-block"
      :data-chunk-id="`chunk-${index + 1}`"
      :class="{ active: activeId === index + 1 }"
    >
      <div class="chunk-meta">#{{ index + 1 }}</div>
      <pre class="text-content">{{ chunk }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{ chunks: string[] }>();

const containerRef = ref<HTMLElement | null>(null);
const activeId = ref<number | null>(null);
let highlightTimer: number | null = null;

function scrollToChunk(id: number) {
  if (!containerRef.value) return;
  const target = containerRef.value.querySelector(
    `[data-chunk-id="chunk-${id}"]`
  ) as HTMLElement | null;
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    activeId.value = id;
    if (highlightTimer) window.clearTimeout(highlightTimer);
    highlightTimer = window.setTimeout(() => {
      activeId.value = null;
    }, 1600);
  }
}

defineExpose({
  scrollToChunk
});
</script>

<style scoped>
.text-viewer {
  width: 100%;
  max-height: 600px;
  overflow-y: auto;
  border-radius: 12px;
  background: transparent;
  border: none;
  position: relative;
  padding: 12px;
}

.chunk-block {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px 14px 12px;
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 12px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, transform 0.2s ease;
  position: relative;
  overflow: hidden;
}

.chunk-block.active {
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow:
    0 0 0 1px rgba(99, 102, 241, 0.4),
    0 10px 30px rgba(99, 102, 241, 0.3),
    0 0 25px rgba(99, 102, 241, 0.25);
  background: rgba(99, 102, 241, 0.15);
  transform: translateY(-1px);
  outline: 1px solid rgba(99, 102, 241, 0.4);
  outline-offset: 0;
}

.chunk-meta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  margin-bottom: 8px;
  font-weight: 600;
}

.text-content {
  margin: 0;
  padding: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, "Courier New", monospace;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  background: transparent;
  overflow-x: auto;
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