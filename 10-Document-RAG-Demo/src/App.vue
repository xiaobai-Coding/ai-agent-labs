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
      <div class="card summary-card">
        <div class="card-header">
          <div class="dot purple"></div>
          <span>AI 摘要</span>
          <span class="count" v-if="chunks.length">片段 {{ chunks.length }} 个</span>
        </div>

        <div v-if="summaryLoading" class="summary-loading">
          <span class="spinner"></span>
          <span>AI 正在总结文档…</span>
        </div>

        <div v-else-if="summaryError" class="summary-error">
          {{ summaryError }}
        </div>

        <div v-else-if="summary" class="summary-content">
          <h3>摘要</h3>
          <p class="summary-line">
            <span v-for="(seg, idx) in parseWithRefs(summary.summary)" :key="`s-${idx}`">
              <template v-if="seg.type === 'text'">{{ seg.text }}</template>
              <span v-else class="ref-group">
                <a
                  v-for="id in seg.ids"
                  :key="`s-${idx}-${id}`"
                  href="#"
                  class="ref-link"
                  @click.prevent="scrollToChunk(id)"
                >[#{{ id }}]</a>
              </span>
            </span>
          </p>

          <h4>关键点</h4>
          <ul>
            <li v-for="(kp, idx) in summary.key_points" :key="idx">
              <span>
                <span v-for="(seg, j) in parseWithRefs(kp)" :key="`k-${idx}-${j}`">
                  <template v-if="seg.type === 'text'">{{ seg.text }}</template>
                  <span v-else class="ref-group">
                    <a
                      v-for="id in seg.ids"
                      :key="`k-${idx}-${j}-${id}`"
                      href="#"
                      class="ref-link"
                      @click.prevent="scrollToChunk(id)"
                    >[#{{ id }}]</a>
                  </span>
                </span>
              </span>
            </li>
          </ul>
        </div>

        <div v-else class="summary-placeholder">
          上传完成后自动生成摘要…
        </div>
      </div>

      <div class="card text-card">
        <div class="card-header">
          <div class="dot blue"></div>
          <span class="text-card-title">提取的文本内容</span>
          <span class="count" v-if="text">{{ Math.ceil(text.length / 1000) }}K 字符</span>
        </div>
        <TextViewer :chunks="chunks" ref="textViewerRef" />
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
// @ts-nocheck
import { ref } from "vue";
// @ts-ignore - Vue component with script setup
import FileUploader from "./components/FileUploader.vue";
// @ts-ignore - Vue component with script setup
import TextViewer from "./components/TextViewer.vue";
import { extractPdfText } from "./utils/pdfParser";
import { extractDocxText } from "./utils/docxParser";
import { splitIntoChunksWithOverlap } from "./utils/chunk";
import { streamDeepSeekAPI } from "./services/aiService";

type SummaryResult = {
  summary: string;
  key_points: string[];
};

const text = ref("");
const loading = ref(false);
const error = ref("");
const chunks = ref<string[]>([]); // 文档片段
const summary = ref<SummaryResult | null>(null);
const summaryLoading = ref(false);
const summaryError = ref("");
const textViewerRef = ref<InstanceType<typeof TextViewer> | null>(null);
const SYSTEM_PROMPT = `
你是一个严谨的文档分析助手，专门帮用户对上传的 PDF / DOCX 文档做摘要和要点提取。

【你将收到的内容】
- 用户消息中会提供多段文本片段
- 每个片段都带有编号，例如：
  #1: ...
  #2: ...
  #3: ...

【你的任务】
1）根据所有片段，生成对整份文档的整体摘要，要求简洁明了（最多100字）
2）提取文档中最重要的 3~5 条关键点

【严格要求】
- 必须完全基于提供的片段内容，不得使用外部知识
- 不允许凭空捏造、延伸、推测超出内容的信息
- 如果文档信息不足以支持结论，请在摘要中明确说明
- 输出必须是合法 JSON，不允许有任何多余字符（如解释文字、Markdown 标记、注释等）

【引用规则（非常重要）】
- 摘要中的每一句话，末尾都要带上引用来源，例如："……句子内容 [[#1,#3]]"
- 关键点数组中的每一条也要带引用，例如："xxx 关键点 [[#2]]"
- 引用中的编号必须对应用户消息中出现过的片段编号
- 一个句子可以引用多个片段，用逗号分隔，如 [[#1,#4,#5]]

【输出 JSON 格式，不要有任何解释文字，不包含任何其他文字，只包含 JSON 格式】
{
  "summary": "string（可以包含多句，每句附带 [[#编号]] 引用）",
  "key_points": [
    "string（附带 [[#编号]] 引用）",
    "string（附带 [[#编号]] 引用）",
    "string（附带 [[#编号]] 引用）"
  ]
}
`;
// 文件类型处理器映射
const fileHandlers: Record<string, (file: File) => Promise<string>> = {
  ".pdf": (file: File) => extractPdfText(file),
  ".docx": (file: File) => extractDocxText(file),
};

async function handleFile(file: File) {
  loading.value = true;
  error.value = "";
  text.value = "";
  summary.value = null;
  summaryError.value = "";

  try {
    const fileName = file.name.toLowerCase();
    const extension = fileName.substring(fileName.lastIndexOf("."));
    const handler = fileHandlers[extension];

    if (!handler) {
      error.value = "不支持的文件类型，仅支持 PDF 和 DOCX 格式";
      return;
    }

    text.value = await handler(file);
    const overlapChunks = splitIntoChunksWithOverlap(text.value);
    chunks.value = overlapChunks as string[];
    console.log("chunks====>", chunks.value);
    // 生成摘要
    await generateSummary();
  } catch (err: any) {
    error.value = "解析失败：" + err.message;
  } finally {
    loading.value = false;
  }
}

type Segment =
  | { type: "text"; text: string }
  | { type: "ref"; ids: string[] };

function parseWithRefs(str: string): Segment[] {
  const segments: Segment[] = [];
  // 支持形如 [[#3,#4,#6,#7]]，含多重 #、空格、全角逗号/顿号
  const regex = /\[\[([#\d,\s，、]+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", text: str.slice(lastIndex, match.index) });
    }
    const ids = match[1]
      .split(/[,，、]/)
      .map((id) => id.trim().replace(/^#/, ""))
      .filter(Boolean);
    if (ids.length) {
      segments.push({ type: "ref", ids });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    segments.push({ type: "text", text: str.slice(lastIndex) });
  }
  return segments;
}

function scrollToChunk(id: string) {
  const num = Number(id);
  if (Number.isNaN(num)) return;
  textViewerRef.value?.scrollToChunk(num);
}

// 生成总结和关键点
async function generateSummary() {
  if (!chunks.value.length) return;
  summaryLoading.value = true;
  summaryError.value = "";

  const userMessage = `请基于以下文档片段生成摘要和关键点，严格输出 JSON：
片段数量：${chunks.value.length}
------------
${chunks.value.map((c, i) => `#${i + 1}: ${c}`).join("\n------------\n")}
`;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage }
  ];

  try {
    let streamed = "";
    const res = await streamDeepSeekAPI(
      messages,
      false,
      (partial: string) => {
        streamed += partial;
      }
    );
    const content = res?.content;
    console.log("content====>", content);
    const parsed = JSON.parse(content);
    if (parsed?.summary && Array.isArray(parsed?.key_points)) {
      summary.value = {
        summary: parsed.summary,
        key_points: parsed.key_points
      };
    } else {
      summaryError.value = "模型返回格式不符合预期，请重试。";
    }
  } catch (e: any) {
    console.error("[Summary] 生成摘要失败:", e);
    summaryError.value = e?.message || "生成摘要失败";
  } finally {
    summaryLoading.value = false;
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 48px 20px 64px;
  background: #F7F8FF;
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
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(79, 70, 229, 0.08);
  width: 100%;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
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
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 12px 40px rgba(79, 70, 229, 0.08);
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

  0%,
  100% {
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
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.card {
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(79, 70, 229, 0.08);
  padding: 20px 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #1E2239;
  margin-bottom: 16px;
  font-size: 16px;
}

.text-card-title {
  font-size: 16px;
  color: #fff;
  font-weight: 700;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.blue {
  background: #6366f1;
}

.dot.purple {
  background: #6366f1;
}

.count {
  margin-left: auto;
  font-size: 12px;
  color: #6366f1;
  font-weight: 500;
  padding: 4px 10px;
  background: rgba(99, 102, 241, 0.12);
  border-radius: 999px;
}

.summary-card {
  min-height: 260px;
  background: linear-gradient(135deg, rgba(236, 239, 255, 0.98), rgba(225, 234, 255, 0.95), rgba(219, 234, 254, 0.92));
  border: 1px solid rgba(99, 102, 241, 0.12);
  box-shadow: 0 12px 40px rgba(79, 70, 229, 0.08);
}

.summary-loading,
.summary-error,
.summary-placeholder {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
}

.summary-error {
  color: #dc2626;
}

.summary-content h3 {
  margin: 0 0 6px;
  font-size: 18px;
  color: #1E2239;
}

.summary-content h4 {
  margin: 12px 0 6px;
  font-size: 16px;
  color: #1E2239;
}

.summary-content p {
  margin: 0 0 10px;
  line-height: 1.6;
  color: #1E2239;
}

.summary-content ul {
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #1E2239;
}

.kp-index {
  color: #a855f7;
  margin-right: 6px;
}

.ref-group {
  margin: 0 2px;
}

.ref-link {
  color: #1E2239;
  text-decoration: none;
  margin-right: 4px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.18);
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 12px;
}

.ref-link:hover {
  background: rgba(99, 102, 241, 0.2);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.ref-link:active {
  transform: translateY(1px);
}

.text-card {
  min-height: 400px;
  background: #1E2239;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 40px rgba(79, 70, 229, 0.08);
  position: relative;
  overflow: hidden;
}

.spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  border-top-color: #6366f1;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.empty-card {
  padding: 48px 24px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 15px;
  box-shadow: 0 12px 40px rgba(79, 70, 229, 0.08);
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