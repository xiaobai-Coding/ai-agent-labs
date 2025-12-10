<script setup lang="ts">
import { ref } from "vue";
import { searchRelevantDocs } from "./rag/search";

interface Match {
  id: number;
  text: string;
  score: number;
}

const question = ref("");
const answer = ref("");
const matches = ref<Match[]>([]);

const ask = () => {
  if (!question.value.trim()) return;
  matches.value = searchRelevantDocs(question.value, 3);

  if (matches.value.length) {
    const snippets = matches.value
      .map((m, idx) => `${idx + 1}. ${m.text}`)
      .join("\n");
    answer.value = `基于检索到的片段（Top ${matches.value.length}）：\n${snippets}`;
  } else {
    answer.value = "未检索到相关内容，请尝试换个问法。";
  }
};
</script>

<template>
  <main class="page">
    <section class="hero">
      <div>
        <p class="tag">RAG · Mock Demo</p>
        <h1>Retrieval Augmented Generation</h1>
        <p class="sub">
          Ask a question, we retrieve relevant chunks and synthesize an answer.
          （仅演示检索与拼接逻辑，数据为 mock）
        </p>
        <div class="search-bar">
          <input
            v-model="question"
            placeholder="例如：北京有什么值得去的？"
            @keyup.enter="ask"
          />
          <button :disabled="!question.trim()" @click="ask">Search</button>
        </div>
        <p class="hint">回车或点击 Search 开始检索 · Top3 相似片段</p>
      </div>
    </section>

    <section class="layout">
      <div class="card">
        <div class="card-header">
          <div class="dot green"></div>
          <span>Retrieved Chunks</span>
          <span class="count" v-if="matches.length">Top {{ matches.length }}</span>
        </div>
        <div v-if="matches.length" class="chunk-list">
          <article v-for="(m, idx) in matches" :key="m.id" class="chunk">
            <div class="chunk-meta">
              <span class="pill">#{{ idx + 1 }}</span>
              <span class="score">score {{ m.score.toFixed(3) }}</span>
              <span class="id">id: {{ m.id }}</span>
            </div>
            <p class="chunk-text">{{ m.text }}</p>
          </article>
        </div>
        <div v-else class="empty">请输入问题以检索相关文档。</div>
      </div>

      <div class="card answer-card">
        <div class="card-header">
          <div class="dot blue"></div>
          <span>Answer</span>
        </div>
        <div class="answer-box" :class="{ empty: !answer }">
          <pre v-if="answer">{{ answer }}</pre>
          <p v-else>尚未生成回答。</p>
        </div>
      </div>
    </section>
  </main>
</template>

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
}

.sub {
  margin: 0 0 16px;
  color: #4b5563;
  line-height: 1.5;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.search-bar input {
  flex: 1;
  min-width: 260px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 15px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-bar input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.search-bar button {
  padding: 12px 18px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s;
}

.search-bar button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.search-bar button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
}

.hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.layout {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.05);
  padding: 16px 18px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.green {
  background: #10b981;
}
.dot.blue {
  background: #3b82f6;
}

.count {
  margin-left: auto;
  font-size: 12px;
  color: #6b7280;
}

.chunk-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chunk {
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.chunk-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.pill {
  padding: 4px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 700;
  font-size: 11px;
}

.score {
  background: #ecfdf3;
  color: #16a34a;
  padding: 3px 8px;
  border-radius: 999px;
}

.id {
  color: #9ca3af;
}

.chunk-text {
  margin: 0;
  color: #111827;
  line-height: 1.5;
}

.empty {
  color: #9ca3af;
  text-align: center;
  padding: 18px 8px;
}

.answer-card {
  min-height: 220px;
}

.answer-box {
  background: #0f172a;
  color: #e5e7eb;
  border-radius: 12px;
  padding: 14px;
  min-height: 180px;
  border: 1px solid #1f2937;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
  white-space: pre-wrap;
  line-height: 1.6;
}

.answer-box.empty {
  display: flex;
  align-items: center;
  color: #9ca3af;
}

@media (max-width: 640px) {
  .page {
    padding: 32px 16px 48px;
  }

  .hero {
    padding: 22px 18px;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-bar button {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
}
</style>