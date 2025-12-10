<template>
  <div class="text-viewer">
    <pre class="text-content">{{ text }}</pre>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<style scoped>
.text-viewer {
  width: 100%;
  max-height: 600px;
  overflow-y: auto;
  border-radius: 12px;
  background: #0f172a;
  border: 1px solid #1f2937;
  position: relative;
}

.text-content {
  margin: 0;
  padding: 20px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, "Courier New", monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #e5e7eb;
  background: transparent;
  overflow-x: auto;
}

/* 滚动条样式 */
.text-viewer::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.text-viewer::-webkit-scrollbar-track {
  background: #1e293b;
  border-radius: 4px;
}

.text-viewer::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

.text-viewer::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* 分页标记样式已通过文本内容本身处理 */

/* 响应式 */
@media (max-width: 640px) {
  .text-viewer {
    max-height: 400px;
  }

  .text-content {
    padding: 16px;
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>