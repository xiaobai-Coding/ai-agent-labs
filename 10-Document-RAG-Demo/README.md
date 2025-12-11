# 10-Document-RAG-Demo

一个基于 Vue 3 + TypeScript 的文档解析和 AI 摘要演示项目，支持 PDF 和 DOCX 文件的文本提取、智能分块和 AI 驱动的文档摘要生成，为 RAG 系统提供完整的文档预处理能力。

## 📋 项目简介

本项目是一个完整的文档处理解决方案，不仅支持从 PDF 和 DOCX 文件中提取纯文本内容，还集成了 AI 摘要生成、智能文本分块和引用跳转功能。通过左右分栏布局，用户可以同时查看 AI 生成的摘要和原始文档内容，并通过点击引用快速定位到相关片段。

### 核心能力

- 📄 **多格式支持**：PDF (.pdf) 和 DOCX (.docx) 文件解析
- 📑 **分页处理**：自动识别并标记文档分页
- 🔍 **完整提取**：提取文档中的所有文本内容
- 🤖 **AI 摘要生成**：基于 DeepSeek API 自动生成文档摘要和关键点
- ✂️ **智能分块**：自动将文档切分为重叠的文本片段，便于向量化
- 🔗 **引用跳转**：摘要中的引用可点击跳转到原文片段并高亮显示
- 🎨 **统一视觉体系**：紫蓝色主题，符合 RAG 项目风格的现代化界面设计
- ⚡ **实时解析**：上传文件即时显示提取结果和 AI 摘要

## ✨ 功能特性

### PDF 解析
- ✅ 支持多页 PDF 文档
- ✅ 自动添加页码标记：`[第 X 页 / 共 Y 页]`
- ✅ 保留文本格式和换行
- ✅ 使用 `pdfjs-dist` 库进行解析

### DOCX 解析
- ✅ 支持复杂格式的 Word 文档
- ✅ 检测并标记分页符位置
- ✅ 保留段落结构和换行
- ✅ 使用 `mammoth` 库进行解析
- ✅ 容错处理：HTML 转换失败时自动回退

### AI 摘要生成
- ✅ 自动生成文档摘要（最多 100 字）
- ✅ 提取 3~5 条关键点
- ✅ 支持引用标记：摘要和关键点中包含 `[[#编号]]` 格式的引用
- ✅ 流式输出：实时显示 AI 生成进度
- ✅ 基于文档片段：完全基于提取的文本内容，不依赖外部知识

### 文本分块
- ✅ 智能分块：按段落切分，保留重叠区域（默认 400 字符/块，80 字符重叠）
- ✅ 自动过滤：过滤少于 20 字符的段落
- ✅ 递归切分：超过 400 字符的段落自动切半
- ✅ 编号标记：每个片段自动编号（#1, #2, #3...）

### 引用跳转
- ✅ 可点击引用：摘要中的 `[#1]`、`[#2]` 等引用可点击
- ✅ 自动定位：点击引用自动滚动到对应的文档片段
- ✅ 高亮显示：目标片段自动高亮显示（1.6 秒后自动取消）
- ✅ 多引用支持：支持 `[[#1,#2,#3]]` 格式的多引用

### 用户体验
- 🎯 拖拽上传：支持拖拽文件到上传区域
- 📊 状态反馈：实时显示解析状态（加载中/成功/错误）
- 📈 字符统计：显示提取文本的字符数量和片段数量
- 🎨 双栏布局：左侧 AI 摘要卡片，右侧文档内容卡片
- 🌈 统一配色：紫蓝色视觉体系，渐变背景和柔和阴影

## 🛠️ 技术栈

- **前端框架**：Vue 3 (Composition API + `<script setup>`)
- **类型系统**：TypeScript
- **构建工具**：Vite
- **PDF 解析**：`pdfjs-dist` (v3.11.174)
- **DOCX 解析**：`mammoth` (v1.11.0)
- **AI 服务**：DeepSeek API (流式调用)
- **文本处理**：自定义分块算法（支持重叠）

## 📁 项目结构

```
10-Document-RAG-Demo/
├── src/
│   ├── App.vue                    # 主应用组件（包含 AI 摘要和引用跳转逻辑）
│   ├── main.ts                    # 应用入口
│   ├── style.css                  # 全局样式
│   ├── env.d.ts                   # Vue 类型声明
│   ├── components/
│   │   ├── FileUploader.vue       # 文件上传组件
│   │   └── TextViewer.vue         # 文本查看器组件（支持片段高亮）
│   ├── services/
│   │   └── aiService.ts           # AI 服务（DeepSeek API 流式调用）
│   └── utils/
│       ├── pdfParser.ts           # PDF 解析工具
│       ├── docxParser.ts          # DOCX 解析工具
│       └── chunk.ts               # 文本分块工具（支持重叠）
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

### 环境配置

在项目根目录创建 `.env.local` 文件，配置 AI API：

```env
VITE_AI_API_KEY=your_deepseek_api_key
VITE_AI_API_BASE_URL=https://api.deepseek.com
```

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
   - **左侧卡片**：显示 AI 生成的摘要和关键点，包含可点击的引用标记
   - **右侧卡片**：显示提取的文档内容，按片段编号组织
   - 显示字符统计和片段数量

4. **引用跳转**：
   - 点击摘要中的 `[#1]`、`[#2]` 等引用标记
   - 自动滚动到右侧对应的文档片段
   - 目标片段会高亮显示（1.6 秒后自动取消）

5. **分页标记**：
   - PDF：每页开头显示 `[第 X 页 / 共 Y 页]`
   - DOCX：分页符位置显示 `[分页]` 标记

## 🔧 核心实现

### PDF 解析

```typescript
// src/utils/pdfParser.ts
export async function extractPdfText(file: File): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    pages.push(`[第 ${i} 页 / 共 ${pdf.numPages} 页]\n${pageText}`);
  }
  
  return pages.join("\n\n");
}
```

### DOCX 解析

```typescript
// src/utils/docxParser.ts
export async function extractDocxText(file: File): Promise<string> {
  // 方法1: 使用 convertToHtml 保留分页信息
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  // 检测分页符并添加标记
  // ...
  
  // 方法2: 回退到 extractRawText
  const rawResult = await mammoth.extractRawText({ arrayBuffer });
  return rawResult.value || "";
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
  const result: string[] = [];
  const cleaned = text.trim().replace(/\s+/g, " ");
  
  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const chunk = cleaned.slice(start, end);
    
    if (chunk.length >= 20) result.push(chunk);
    
    start += chunkSize - overlapSize; // 保留重叠
  }
  
  return result;
}
```

### AI 摘要生成

```typescript
// src/App.vue
async function generateSummary() {
  const userMessage = `请基于以下文档片段生成摘要和关键点：
${chunks.value.map((c, i) => `#${i + 1}: ${c}`).join("\n------------\n")}`;

  const res = await streamDeepSeekAPI(
    [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userMessage }],
    false,
    (partial: string) => { /* 流式更新 */ }
  );
  
  const parsed = JSON.parse(res.content);
  summary.value = {
    summary: parsed.summary,      // 包含 [[#编号]] 引用
    key_points: parsed.key_points  // 包含 [[#编号]] 引用
  };
}
```

### 引用跳转

```typescript
// src/App.vue
function parseWithRefs(str: string): Segment[] {
  // 解析 [[#1,#2]] 格式的引用
  const regex = /\[\[([#\d,\s，、]+)\]\]/g;
  // 返回文本和引用片段
}

function scrollToChunk(id: string) {
  const num = Number(id);
  textViewerRef.value?.scrollToChunk(num); // 滚动并高亮
}
```

### 文件处理流程

```typescript
// src/App.vue
async function handleFile(file: File) {
  // 1. 解析文档
  text.value = await handler(file);
  
  // 2. 文本分块
  chunks.value = splitIntoChunksWithOverlap(text.value);
  
  // 3. 生成 AI 摘要
  await generateSummary();
}
```

## 🎨 UI 特性

### 视觉设计
- **统一配色体系**：紫蓝色主题（#F3F4FF 浅色卡片，#1E2239 深色卡片）
- **渐变背景**：页面背景使用浅紫蓝色（#F7F8FF），摘要卡片使用三色渐变
- **统一设计语言**：所有卡片圆角 16px，统一阴影和边框样式
- **双栏布局**：左侧 AI 摘要卡片（浅色），右侧文档内容卡片（深色）

### 交互体验
- **拖拽上传**：支持拖拽文件，悬停效果反馈
- **状态指示**：加载/成功/错误状态的视觉反馈
- **引用高亮**：点击引用后目标片段自动高亮（霓虹边框、渐变背景、柔和阴影）
- **平滑滚动**：引用跳转时自动滚动到目标位置并居中显示
- **响应式布局**：适配移动端和桌面端

### 组件特性
- **文本查看器**：深色主题，等宽字体，自定义滚动条
- **引用标记**：浅紫蓝背景，深蓝紫字体，hover 时变亮
- **片段编号**：每个文档片段自动编号显示

## 📝 分页处理说明

### PDF 分页
- 自动遍历所有页面
- 每页添加页码标记：`[第 X 页 / 共 Y 页]`
- 页面之间用双换行符分隔

### DOCX 分页
- 优先使用 HTML 转换检测分页符
- 检测 `page-break` 样式标记
- 在分页位置添加 `[分页]` 标记
- 长文档提供启发式分页标记（仅供参考）

## ⚠️ 注意事项

1. **API 配置**：使用 AI 摘要功能需要配置 `VITE_AI_API_KEY` 环境变量
2. **文件大小**：建议上传的文件不超过 50MB
3. **浏览器兼容性**：需要支持 File API 和 ArrayBuffer 的现代浏览器
4. **PDF Worker**：使用 `pdfjs-dist` 的 worker 进行 PDF 解析
5. **DOCX 格式**：仅支持 `.docx` 格式，不支持旧的 `.doc` 格式
6. **AI 摘要**：摘要生成依赖网络连接和 API 服务可用性
7. **引用格式**：AI 返回的引用格式为 `[[#编号]]`，支持多引用如 `[[#1,#2,#3]]`

## 🔮 扩展方向

1. **更多格式支持**：
   - TXT 纯文本文件
   - Markdown (.md) 文件
   - Excel (.xlsx) 表格文件

2. **文档预处理**：
   - ✅ 自动分块 (Chunking) - 已实现
   - 文本清洗和标准化
   - 元数据提取（标题、作者等）

3. **向量化集成**：
   - 与 RAG 系统集成
   - 自动生成 Embedding
   - 存储到向量数据库

4. **批量处理**：
   - 支持多文件上传
   - 批量解析和处理
   - 进度显示

## 🐛 已知问题

- DOCX 分页检测依赖文档中的分页符标记，如果文档没有明确的分页符，可能无法准确识别
- 复杂格式的 PDF（如扫描件、图片 PDF）可能无法提取文本

## 📄 许可证

MIT License

## 👤 作者

AI Agent Labs

---

**提示**：本项目是 RAG 系统的完整文档处理模块，包含文档解析、文本分块、AI 摘要生成和引用跳转功能，提取的文本和分块可以直接用于后续的向量化和检索步骤。
