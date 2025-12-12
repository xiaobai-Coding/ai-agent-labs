# 11-RAG-QA1.0

一个完整的 RAG（Retrieval-Augmented Generation）文档问答系统，基于 Vue 3 + TypeScript 构建。支持 PDF/DOCX 文档解析、智能分块、向量化检索和 AI 驱动的问答功能，实现基于文档内容的精准问答。

## 📋 项目简介

本项目是一个端到端的 RAG 问答系统，集成了文档解析、文本分块、向量化、语义检索和生成式问答的完整流程。用户上传文档后，系统会自动提取文本、生成向量、建立索引，然后通过语义检索找到最相关的文档片段，最终由 AI 生成基于文档内容的准确回答。

### 核心能力

- 📄 **多格式支持**：PDF (.pdf) 和 DOCX (.docx) 文件解析
- ✂️ **智能分块**：自动将文档切分为重叠的文本片段，便于向量化
- 🔢 **向量化**：使用阿里 DashScope Embedding 生成文本向量
- 🔍 **语义检索**：基于余弦相似度的向量检索，支持 MMR 算法优化
- 🤖 **AI 问答**：基于 DeepSeek API 的智能问答，完全基于文档内容
- 🔗 **引用跳转**：回答中的引用可点击跳转到原文片段并高亮显示
- 📊 **AI 摘要**：自动生成文档摘要和关键点
- 🎨 **统一视觉体系**：紫蓝色主题，符合 RAG 项目风格的现代化界面设计

## ✨ 功能特性

### 文档解析
- ✅ 支持多页 PDF 文档，自动添加页码标记
- ✅ 支持复杂格式的 Word 文档，检测分页符
- ✅ 保留文本格式和段落结构
- ✅ 使用 `pdfjs-dist` 和 `mammoth` 库进行解析

### 文本分块
- ✅ 智能分块：按段落切分，保留重叠区域（默认 400 字符/块，80 字符重叠）
- ✅ 自动过滤：过滤少于 20 字符的段落
- ✅ 递归切分：超过 400 字符的段落自动切半
- ✅ 编号标记：每个片段自动编号（#1, #2, #3...）

### 向量化与检索
- ✅ **DashScope Embedding**：使用阿里云 `text-embedding-v4` 模型生成向量
- ✅ **向量缓存**：自动缓存已生成的向量，避免重复计算
- ✅ **余弦相似度**：计算查询向量与文档向量的相似度
- ✅ **MMR 算法**：最大边际相关性检索，平衡相关性和多样性
- ✅ **Top-K 检索**：返回最相关的 3 个文档片段

### AI 问答
- ✅ **语义检索**：根据用户问题检索最相关的文档片段
- ✅ **上下文构建**：将检索到的片段作为上下文输入 AI
- ✅ **引用标记**：回答中包含 `[[1]]`、`[[1,3]]` 等引用格式
- ✅ **流式输出**：实时显示 AI 生成进度
- ✅ **严格约束**：只基于文档内容回答，不编造信息

### AI 摘要
- ✅ 自动生成文档摘要（最多 100 字）
- ✅ 提取 3~5 条关键点
- ✅ 支持引用标记：摘要和关键点中包含 `[[#编号]]` 格式的引用
- ✅ 流式输出：实时显示 AI 生成进度

### 引用跳转
- ✅ **多引用支持**：支持 `[[1,4]]`、`[[2,5,6]]` 等多引用格式
- ✅ **智能跳转**：点击引用自动滚动到最小编号的片段位置
- ✅ **多片段高亮**：同时高亮所有引用的片段
- ✅ **Flash 动画**：跳转时显示闪烁动画，突出定位位置
- ✅ **自动取消**：3 秒后自动取消高亮

### 用户体验
- 🎯 **拖拽上传**：支持拖拽文件到上传区域
- ⌨️ **键盘快捷键**：Enter 发送，Shift+Enter 换行
- 📊 **状态反馈**：实时显示加载状态和错误信息
- 📈 **统计信息**：显示字符数量、片段数量、引用数量
- 🎨 **三栏布局**：AI 摘要、文档内容、文档问答三个卡片
- 🌈 **统一配色**：紫蓝色视觉体系，渐变背景和柔和阴影
- 📱 **响应式设计**：适配移动端和桌面端

## 🛠️ 技术栈

- **前端框架**：Vue 3 (Composition API + `<script setup>`)
- **类型系统**：TypeScript
- **构建工具**：Vite
- **PDF 解析**：`pdfjs-dist` (v3.11.174)
- **DOCX 解析**：`mammoth` (v1.11.0)
- **向量化服务**：阿里云 DashScope Embedding (`text-embedding-v4`)
- **AI 服务**：DeepSeek API (流式调用)
- **检索算法**：余弦相似度 + MMR（最大边际相关性）

## 📁 项目结构

```
11-RAG-QA1.0/
├── src/
│   ├── App.vue                    # 主应用组件（包含文档解析、摘要、问答）
│   ├── main.ts                    # 应用入口
│   ├── style.css                  # 全局样式
│   ├── env.d.ts                   # Vue 类型声明
│   ├── components/
│   │   ├── FileUploader.vue       # 文件上传组件
│   │   ├── TextViewer.vue         # 文本查看器组件（支持片段高亮和滚动）
│   │   └── QASection.vue          # 文档问答组件（输入、回答、引用）
│   ├── services/
│   │   ├── aiService.ts           # AI 服务（DeepSeek API 流式调用）
│   │   ├── qaService.ts           # RAG QA 服务（向量化、检索、问答）
│   │   └── openaiClient.ts       # OpenAI 兼容客户端
│   └── utils/
│       ├── pdfParser.ts           # PDF 解析工具
│       ├── docxParser.ts          # DOCX 解析工具
│       ├── chunk.ts               # 文本分块工具（支持重叠）
│       ├── embedding.ts           # 向量化工具（DashScope Embedding）
│       ├── similarity.ts           # 相似度计算（余弦相似度）
│       └── mmr.ts                 # MMR 检索算法
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 环境配置

在项目根目录创建 `.env.local` 文件，配置 API 密钥：

```env
# 阿里云 DashScope Embedding API
VITE_ALI_API_KEY=your_dashscope_api_key

# DeepSeek API（用于问答和摘要）
VITE_AI_API_KEY=your_deepseek_api_key
VITE_AI_API_BASE_URL=https://api.deepseek.com
```

**注意**：DashScope Embedding 需要通过代理访问，请确保已配置代理服务。

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

### 使用流程

1. **上传文档**：
   - 点击上传区域选择文件
   - 或直接拖拽文件到上传区域
   - 支持 PDF (.pdf) 和 DOCX (.docx) 格式

2. **自动处理**：
   - 文档上传后自动提取文本
   - 自动进行文本分块（带重叠）
   - 自动调用 AI 生成摘要和关键点

3. **查看结果**：
   - **左侧卡片（AI 摘要）**：显示 AI 生成的摘要和关键点，包含可点击的引用标记
   - **中间卡片（文档内容）**：显示提取的文档内容，按片段编号组织，支持高亮显示
   - **右侧卡片（文档问答）**：输入问题，获取基于文档的 AI 回答

4. **文档问答**：
   - 在问答输入框中输入问题
   - 按 `Enter` 发送，`Shift+Enter` 换行
   - 系统自动进行向量检索，找到最相关的文档片段
   - AI 基于检索到的片段生成回答，包含引用标记

5. **引用跳转**：
   - 点击摘要或回答中的 `[[1]]`、`[[1,3]]` 等引用标记
   - 自动滚动到文档内容卡片中对应的片段位置
   - 目标片段会高亮显示（Flash 动画 + 3 秒高亮）

## 🔧 核心实现

### RAG QA 流程

```typescript
// src/services/qaService.ts
export async function answerQuestion(question: string, chunks: string[]) {
  // 1. 向量化用户问题
  const queryVector = await embedQuery(question);
  
  // 2. 向量化文档片段（带缓存）
  const chunkVectors = await embedChunks(chunks);
  
  // 3. MMR 检索最相关的 Top-K 片段
  const topIndexes = mmrSelect(queryVector, chunkVectors, 3);
  
  // 4. 构建提示词，包含检索到的片段
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `用户问题：${question}\n\n相关文档片段：\n${userChunks}` }
  ];
  
  // 5. 调用 AI 生成回答
  const res = await streamDeepSeekAPI(messages, false);
  
  // 6. 解析 JSON 返回结果
  return { answer: parsed.answer, sources: parsed.sources };
}
```

### 向量化（DashScope Embedding）

```typescript
// src/utils/embedding.ts
export async function embedQuery(question: string): Promise<number[]> {
  const response = await fetch("/ali-embed/compatible-mode/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ALI_API_KEY}`
    },
    body: JSON.stringify({
      model: "text-embedding-v4",
      input: question
    })
  });
  
  const json = await response.json();
  return json.data[0].embedding;
}
```

### MMR 检索算法

```typescript
// src/utils/mmr.ts
export function mmrSelect(
  queryEmbedding: number[],
  docEmbeddings: number[][],
  topK: number = 5,
  lambda: number = 0.7  // 相关性权重
) {
  // MMR 公式：λ * relevance - (1-λ) * diversity
  // 平衡相关性和多样性，避免返回过于相似的片段
  const mmrScore = lambda * relevance - (1 - lambda) * diversity;
  // 返回 Top-K 索引
}
```

### 余弦相似度计算

```typescript
// src/utils/similarity.ts
export function cosineSimilarity(a: number[], b: number[]): number {
  // 计算两个向量的余弦相似度
  // 返回值范围 [0, 1]，1 表示完全相同
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

### 多引用跳转

```typescript
// src/App.vue
function scrollToChunks(ids: number[]) {
  // 找到最小编号（第一个引用位置）
  const minId = Math.min(...ids);
  
  // 设置高亮数组（所有引用编号）
  highlightChunks.value = ids;
  
  // 滚动到最小编号的位置
  textViewerRef.value?.scrollToChunk(minId);
  
  // 3 秒后自动取消高亮
  setTimeout(() => {
    highlightChunks.value = [];
  }, 3000);
}
```

### 文本分块（带重叠）

```typescript
// src/utils/chunk.ts
export function splitIntoChunksWithOverlap(
  text: string,
  chunkSize: number = 400,
  overlapSize: number = 80
): string[] {
  // 按 chunkSize 切分，保留 overlapSize 重叠
  // 确保上下文连续性，提高检索准确性
  start += chunkSize - overlapSize; // 保留重叠
}
```

## 🎨 UI 特性

### 视觉设计
- **统一配色体系**：紫蓝色主题（#F3F4FF 浅色卡片，#1E2239 深色卡片）
- **渐变背景**：页面背景使用浅紫蓝色（#F7F8FF），卡片使用三色渐变
- **统一设计语言**：所有卡片圆角 16px，统一阴影和边框样式
- **三栏布局**：AI 摘要（浅色）、文档内容（深色）、文档问答（浅色）

### 交互体验
- **拖拽上传**：支持拖拽文件，悬停效果反馈
- **键盘快捷键**：Enter 发送问题，Shift+Enter 换行
- **状态指示**：加载/成功/错误状态的视觉反馈
- **引用高亮**：点击引用后目标片段自动高亮（Flash 动画 + 霓虹边框）
- **平滑滚动**：引用跳转时自动滚动到目标位置并居中显示
- **多引用支持**：支持 `[[1,4]]` 格式，同时高亮多个片段
- **响应式布局**：适配移动端和桌面端，统一最大高度限制

### 组件特性
- **文本查看器**：深色主题，等宽字体，自定义滚动条，左侧竖线装饰
- **引用标记**：浅紫蓝背景，深蓝紫字体，hover 时变亮
- **片段编号**：每个文档片段自动编号显示
- **Flash 动画**：跳转时显示闪烁动画，突出定位位置

## 🔍 RAG 系统架构

### 完整流程

```
文档上传
    ↓
文档解析（PDF/DOCX）
    ↓
文本提取
    ↓
文本分块（带重叠）
    ↓
向量化（DashScope Embedding）
    ↓
向量缓存
    ↓
用户提问
    ↓
问题向量化
    ↓
语义检索（余弦相似度 + MMR）
    ↓
Top-K 片段检索
    ↓
构建提示词（问题 + 相关片段）
    ↓
AI 生成回答（DeepSeek API）
    ↓
解析回答（包含引用标记）
    ↓
展示结果 + 引用跳转
```

### 关键技术点

1. **向量化缓存**：避免重复计算，提升性能
2. **MMR 算法**：平衡相关性和多样性，避免返回重复内容
3. **重叠分块**：保留上下文连续性，提高检索准确性
4. **引用标记**：回答中包含引用，便于追溯来源
5. **多引用支持**：支持多个片段同时引用，提高回答完整性

## ⚠️ 注意事项

1. **API 配置**：
   - 需要配置 `VITE_ALI_API_KEY`（DashScope Embedding）
   - 需要配置 `VITE_AI_API_KEY`（DeepSeek API）
   - DashScope Embedding 需要通过代理访问

2. **文件大小**：建议上传的文件不超过 50MB

3. **浏览器兼容性**：需要支持 File API 和 ArrayBuffer 的现代浏览器

4. **向量维度**：DashScope `text-embedding-v4` 返回 1024 维向量

5. **检索参数**：
   - Top-K 默认值为 3
   - MMR lambda 默认值为 0.7（相关性权重）

6. **引用格式**：AI 返回的引用格式为 `[[1]]`、`[[1,3]]` 等，支持多引用

7. **网络依赖**：向量化和问答功能依赖网络连接和 API 服务可用性

## 🔮 扩展方向

1. **更多格式支持**：
   - TXT 纯文本文件
   - Markdown (.md) 文件
   - Excel (.xlsx) 表格文件

2. **向量数据库集成**：
   - 集成 Milvus、Pinecone 等向量数据库
   - 支持大规模文档索引
   - 持久化向量存储

3. **检索优化**：
   - 支持混合检索（关键词 + 向量）
   - 支持重排序（Re-ranking）
   - 支持查询扩展（Query Expansion）

4. **批量处理**：
   - 支持多文件上传
   - 批量解析和处理
   - 进度显示和任务队列

5. **高级功能**：
   - 对话历史记录
   - 多轮对话支持
   - 答案质量评估
   - 引用可信度评分

## 🐛 已知问题

- DOCX 分页检测依赖文档中的分页符标记，如果文档没有明确的分页符，可能无法准确识别
- 复杂格式的 PDF（如扫描件、图片 PDF）可能无法提取文本
- 向量化 API 调用需要网络连接，离线环境无法使用

## 📄 许可证

MIT License

## 👤 作者

AI Agent Labs

---

**提示**：本项目是完整的 RAG 问答系统，包含文档解析、文本分块、向量化、语义检索和生成式问答的完整流程。适用于文档知识库、智能客服、企业知识管理等场景。
