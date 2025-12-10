<template>
  <main class="page">
    <section class="hero">
      <div>
        <p class="tag">📄 Document RAG · Parser</p>
        <h1>Document Parser & Text Extraction</h1>
        <p class="sub">
          上传 PDF 或 DOCX 文档，自动提取文本内容，支持多页文档解析。
          （支持分页标记和完整文本提取）
        </p>
        <FileUploader @file-upload="handleFile" />
        <p class="hint">支持格式：PDF (.pdf) · DOCX (.docx)</p>
      </div>
    </section>

    <section class="status-section" v-if="loading || error">
      <div class="status-card" :class="{ error: error }">
        <div class="status-indicator" :class="{ loading: loading, error: error }"></div>
        <span v-if="loading">⏳ 正在解析文档中…</span>
        <span v-else-if="error" class="error-text">{{ error }}</span>
      </div>
    </section>

    <section class="layout" v-if="text">
      <div class="card text-card">
        <div class="card-header">
          <div class="dot blue"></div>
          <span>提取的文本内容</span>
          <span class="count" v-if="text">{{ Math.ceil(text.length / 1000) }}K 字符</span>
        </div>
        <TextViewer :text="text" />
      </div>
    </section>

    <section class="empty-state" v-else-if="!loading && !error">
      <div class="empty-card">
        <p>📄 请上传文档开始解析</p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
// @ts-ignore - Vue component with script setup
import FileUploader from "./components/FileUploader.vue";
// @ts-ignore - Vue component with script setup
import TextViewer from "./components/TextViewer.vue";
import { extractPdfText } from "./utils/pdfParser";
import { extractDocxText } from "./utils/docxParser";

const text = ref("");
const loading = ref(false);
const error = ref("");

// 文件类型处理器映射
const fileHandlers: Record<string, (file: File) => Promise<string>> = {
  ".pdf": (file: File) => extractPdfText(file),
  ".docx": (file: File) => extractDocxText(file),
};

async function handleFile(file: File) {
  loading.value = true;
  error.value = "";
  text.value = "";

  try {
    const fileName = file.name.toLowerCase();
    const extension = fileName.substring(fileName.lastIndexOf("."));
    const handler = fileHandlers[extension];
    
    if (!handler) {
      error.value = "不支持的文件类型，仅支持 PDF 和 DOCX 格式";
      return;
    }
    
    text.value = await handler(file);
  } catch (err: any) {
    error.value = "解析失败：" + err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 48px 20px 64px;
  background: radial-gradient(circle at 10% 20%, #eef3ff 0, #f7f9ff 25%, #ffffff 55%);
  color: #111827;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-sizing: border-box;
}

.hero {
  max-width: 1000px;
  margin: 0 auto;
  padding: 28px 24px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
  width: 100%;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #eef2ff;
  color: #4f46e5;
  border-radius: 999px;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.2px;
  margin: 0 0 10px;
}

h1 {
  margin: 0 0 8px;
  font-size: 30px;
  letter-spacing: -0.2px;
  font-weight: 700;
}

.sub {
  margin: 0 0 20px;
  color: #4b5563;
  line-height: 1.5;
  font-size: 15px;
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: #6b7280;
  text-align: center;
}

.status-section {
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.status-card {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.status-card.error {
  border-color: #fecaca;
  background: #fef2f2;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s ease-in-out infinite;
}

.status-indicator.loading {
  background: #3b82f6;
}

.status-indicator.error {
  background: #ef4444;
  animation: none;
}

.error-text {
  color: #dc2626;
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.layout {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.05);
  padding: 20px 24px;
}

.text-card {
  min-height: 400px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
  font-size: 16px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.blue {
  background: #3b82f6;
}

.count {
  margin-left: auto;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  padding: 4px 10px;
  background: #f3f4f6;
  border-radius: 999px;
}

.empty-state {
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.empty-card {
  padding: 48px 24px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 15px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

@media (max-width: 640px) {
  .page {
    padding: 32px 16px 48px;
  }

  .hero {
    padding: 22px 18px;
  }

  h1 {
    font-size: 24px;
  }

  .card {
    padding: 16px 18px;
  }
}
</style>