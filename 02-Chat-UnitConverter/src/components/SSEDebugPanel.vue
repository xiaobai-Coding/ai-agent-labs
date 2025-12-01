<template>
  <div class="debug-wrapper" :class="{open: isOpen}" :style="panelStyle" ref="panel">
    
    <!-- 折叠按钮（浮动） -->
    <button class="toggle-btn" @click="togglePanel">
      🛠 调试
    </button>

    <!-- 调试面板内容 -->
    <div v-if="isOpen" class="debug-panel">

      <div class="drag-header" @mousedown="startDrag">
        <span>DeepSeek SSE 调试面板</span>
        <button class="close-btn" @click="togglePanel">✕</button>
      </div>

      <div class="controls">
        <button class="run-btn" @click="runDebug" :disabled="loading">
          {{ loading ? "请求中..." : "运行调试" }}
        </button>
      </div>

      <div class="tabs">
        <button v-for="t in tabList"
                :key="t"
                @click="activeTab = t"
                :class="{active: activeTab === t}">
          {{ t }}
        </button>
      </div>

      <div class="tab-content">
        <pre>{{ tabData }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";

const API_KEY = import.meta.env.VITE_AI_API_KEY;
const API_URL = import.meta.env.VITE_AI_API_BASE_URL || "https://api.deepseek.com/chat/completions";

const isOpen = ref(false);
const loading = ref(false);

// 拖动相关
const panel = ref<HTMLElement | null>(null);
const pos = reactive({ x: 20, y: 20 });
let dragOffset = { x: 0, y: 0 };
let dragging = false;

function startDrag(e: MouseEvent) {
  dragging = true;
  dragOffset.x = e.clientX - pos.x;
  dragOffset.y = e.clientY - pos.y;
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
}

function onDrag(e: MouseEvent) {
  if (!dragging) return;
  pos.x = e.clientX - dragOffset.x;
  pos.y = e.clientY - dragOffset.y;
}

function stopDrag() {
  dragging = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
}

const panelStyle = computed(() => ({
  right: `${pos.x}px`,
  bottom: `${pos.y}px`
}));

// ------------------ 调试数据 ------------------
const rawChunks = ref("");
const sseEvents = ref("");
const deltaOutput = ref("");
const resultDebug = ref("");
const finalJson = ref("");

// Tabs
const tabList = ["Raw Chunk", "SSE Event", "Delta", "Result 解析", "Final JSON"];
const activeTab = ref("Raw Chunk");

const tabData = computed(() => {
  switch (activeTab.value) {
    case "Raw Chunk": return rawChunks.value;
    case "SSE Event": return sseEvents.value;
    case "Delta": return deltaOutput.value;
    case "Result 解析": return resultDebug.value;
    case "Final JSON": return finalJson.value;
  }
});

// 切换面板
function togglePanel() {
  isOpen.value = !isOpen.value;
}

// 追加文本
function append(target: any, text: string) {
  target.value += text + "\n";
}

// ------------------ 调试核心逻辑 ------------------
async function runDebug() {
  rawChunks.value = "";
  sseEvents.value = "";
  deltaOutput.value = "";
  resultDebug.value = "";
  finalJson.value = "";

  loading.value = true;
    const endpoint = `${API_URL}/chat/completions`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        stream: true,
        messages: [{ role: "user", content: "请介绍李白，以 JSON 输出 { result, reason, confidence }" }]
      })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      append(finalJson, "❌ 无 response.body");
      return;
    }

    let buffer = "";
    let aggregatedContent = "";
    let resultValue = "";
    let inResult = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      append(rawChunks, chunk);

      buffer += chunk;

      let idx;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);

        if (!rawEvent.startsWith("data:")) continue;

        const payload = rawEvent.replace("data:", "").trim();
        append(sseEvents, payload);

        if (payload === "[DONE]") continue;

        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta || {};

        append(deltaOutput, JSON.stringify(delta, null, 2));

        // content 分析
        if (delta.content) {
          aggregatedContent += delta.content;

          if (!inResult) {
            const mark = `"result":"`;
            const pos = aggregatedContent.indexOf(mark);
            if (pos !== -1) {
              inResult = true;
              aggregatedContent = aggregatedContent.slice(pos + mark.length);
            }
          }

          if (inResult) {
            for (const ch of delta.content) {
              if (ch === `"`) {
                inResult = false;
                break;
              }
              resultValue += ch;
              append(resultDebug, ch);
            }
          }
        }

        if (delta.reasoning_content) {
          append(resultDebug, `🧠 reasoning: ${delta.reasoning_content}`);
        }
      }
    }

    try {
      finalJson.value = JSON.stringify(JSON.parse(aggregatedContent), null, 2);
    } catch {
      finalJson.value = JSON.stringify({ result: resultValue }, null, 2);
    }

  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.debug-wrapper {
  position: fixed;
  bottom: 120px !important;
  z-index: 9999;
}
.toggle-btn {
  background: #444;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
}
.debug-panel {
  width: 420px;
  background: #ffffff;
  border: 1px solid #ccc;
  border-radius: 10px;
  margin-top: 10px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}
.drag-header {
  background: #333;
  color: white;
  padding: 8px;
  cursor: move;
  display: flex;
  justify-content: space-between;
}
.close-btn {
  background: none;
  border: none;
  color: white;
}
.controls {
  padding: 10px;
}
.run-btn {
  padding: 8px 16px;
  border-radius: 6px;
  background: #1976d2;
  color: white;
  border: none;
}
.tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
}
.tabs button {
  flex: 1;
  padding: 8px;
  background: #eee;
  border: none;
}
.tabs button.active {
  background: #fff;
  border-bottom: 2px solid #1976d2;
}
.tab-content {
  max-height: 350px;
  overflow-y: auto;
  padding: 10px;
  font-size: 13px;
}
pre {
  white-space: pre-wrap;
}
</style>
