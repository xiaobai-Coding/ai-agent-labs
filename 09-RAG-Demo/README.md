# 09-RAG-Demo

一个基于 Vue 3 + TypeScript 的 RAG (Retrieval-Augmented Generation) 演示项目，展示了向量检索和语义相似度搜索的核心概念。

## 📋 项目简介

本项目是一个 RAG 系统的前端演示，实现了文档检索和相似度匹配的核心功能。虽然使用的是 Mock 数据，但完整展示了 RAG 系统的工作流程：

1. **文本向量化 (Embedding)**：将查询文本和文档转换为向量表示
2. **相似度计算 (Similarity)**：使用余弦相似度计算查询与文档的匹配度
3. **文档检索 (Retrieval)**：根据相似度分数返回 Top-K 相关文档
4. **结果展示 (Generation)**：将检索到的文档片段组合成答案

## ✨ 核心功能

- 🔍 **语义搜索**：基于向量相似度的文档检索
- 📊 **相似度评分**：显示每个检索结果的匹配分数
- 🎯 **Top-K 检索**：返回最相关的 K 个文档片段
- 💡 **实时查询**：输入问题即时返回检索结果
- 🎨 **现代化 UI**：采用玻璃态设计风格，响应式布局

## 🛠️ 技术栈

- **前端框架**：Vue 3 (Composition API + `<script setup>`)
- **类型系统**：TypeScript
- **构建工具**：Vite
- **样式方案**：Scoped CSS

## 📁 项目结构

```
09-RAG-Demo/
├── src/
│   ├── App.vue              # 主应用组件
│   ├── main.ts              # 应用入口
│   ├── style.css            # 全局样式
│   └── rag/                 # RAG 核心模块
│       ├── docs.ts          # Mock 文档数据
│       ├── embedding.ts     # 文本向量化（Mock）
│       ├── similarity.ts    # 余弦相似度计算
│       └── search.ts         # 文档检索逻辑
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 📖 使用说明

1. **输入查询**：在搜索框中输入问题，例如"北京有什么值得去的？"
2. **执行检索**：点击 "Search" 按钮或按 Enter 键
3. **查看结果**：
   - 左侧卡片显示检索到的文档片段（Top-K）
   - 每个片段显示排名、相似度分数和文档 ID
   - 右侧卡片显示基于检索结果生成的答案

## 🔧 核心实现

### 文本向量化 (Embedding)

```typescript
// src/rag/embedding.ts
export const embedText = (text: string): number[] => {
  // Mock embedding：简单数字转换
  // 真实场景应使用 BERT、OpenAI Embeddings 等模型
  return Array.from(text).map(char => char.charCodeAt(0) % 10).slice(0, 4);
};
```

### 余弦相似度计算

```typescript
// src/rag/similarity.ts
export const cosineSimilarity = (a: number[], b: number[]): number => {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
};
```

### 文档检索

```typescript
// src/rag/search.ts
export const searchRelevantDocs = (query: string, topK = 2) => {
  const queryVec = embedText(query);
  const scored = documents.map(doc => ({
    ...doc,
    score: cosineSimilarity(queryVec, doc.embedding)
  }));
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
};
```

## 📝 Mock 数据说明

当前项目使用 Mock 数据演示 RAG 功能：

- **文档库**：包含 9 个预定义的文档片段（关于北京、上海、广州等城市）
- **向量维度**：4 维向量（真实场景通常为 768/1024 维）
- **Embedding 方法**：基于字符编码的简单转换（真实场景应使用预训练模型）

## 🎨 UI 特性

- **玻璃态设计**：半透明背景、柔和阴影
- **渐变背景**：径向渐变营造层次感
- **状态指示**：绿色/蓝色状态点标识
- **响应式布局**：适配移动端和桌面端
- **深色代码块**：答案区域采用深色主题

## 🔮 扩展方向

1. **真实 Embedding**：集成 OpenAI Embeddings API 或本地模型
2. **向量数据库**：使用 Pinecone、Weaviate 等向量数据库
3. **文档切分**：实现文档自动分块（Chunking）
4. **LLM 集成**：结合大语言模型生成更智能的答案
5. **多模态支持**：支持图片、表格等复杂内容

## 📄 许可证

MIT License

## 👤 作者

AI Agent Labs

---

**注意**：本项目仅用于演示 RAG 系统的核心概念，实际生产环境需要使用真实的 Embedding 模型和向量数据库。

