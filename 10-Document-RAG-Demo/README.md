# 10-Document-RAG-Demo

一个基于 Vue 3 + TypeScript 的文档解析演示项目，支持 PDF 和 DOCX 文件的文本提取，为 RAG 系统提供文档预处理能力。

## 📋 项目简介

本项目专注于文档解析和文本提取，是 RAG 系统的重要前置步骤。支持从 PDF 和 DOCX 文件中提取纯文本内容，并保留分页信息，为后续的向量化和检索做准备。

### 核心能力

- 📄 **多格式支持**：PDF (.pdf) 和 DOCX (.docx) 文件解析
- 📑 **分页处理**：自动识别并标记文档分页
- 🔍 **完整提取**：提取文档中的所有文本内容
- 🎨 **现代化 UI**：符合 RAG 项目风格的界面设计
- ⚡ **实时解析**：上传文件即时显示提取结果

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

### 用户体验
- 🎯 拖拽上传：支持拖拽文件到上传区域
- 📊 状态反馈：实时显示解析状态（加载中/成功/错误）
- 📈 字符统计：显示提取文本的字符数量
- 🎨 深色代码风格：文本查看器采用深色主题

## 🛠️ 技术栈

- **前端框架**：Vue 3 (Composition API + `<script setup>`)
- **类型系统**：TypeScript
- **构建工具**：Vite
- **PDF 解析**：`pdfjs-dist` (v3.11.174)
- **DOCX 解析**：`mammoth` (v1.11.0)

## 📁 项目结构

```
10-Document-RAG-Demo/
├── src/
│   ├── App.vue                    # 主应用组件
│   ├── main.ts                    # 应用入口
│   ├── style.css                  # 全局样式
│   ├── env.d.ts                   # Vue 类型声明
│   ├── components/
│   │   ├── FileUploader.vue       # 文件上传组件
│   │   └── TextViewer.vue         # 文本查看器组件
│   └── utils/
│       ├── pdfParser.ts           # PDF 解析工具
│       └── docxParser.ts          # DOCX 解析工具
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

1. **上传文档**：
   - 点击上传区域选择文件
   - 或直接拖拽文件到上传区域
   - 支持 PDF (.pdf) 和 DOCX (.docx) 格式

2. **查看解析结果**：
   - 解析完成后自动显示提取的文本
   - 文本查看器采用深色代码风格
   - 显示字符统计信息

3. **分页标记**：
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

### 文件处理流程

```typescript
// src/App.vue
const fileHandlers: Record<string, (file: File) => Promise<string>> = {
  ".pdf": (file: File) => extractPdfText(file),
  ".docx": (file: File) => extractDocxText(file),
};

async function handleFile(file: File) {
  const extension = fileName.substring(fileName.lastIndexOf("."));
  const handler = fileHandlers[extension];
  text.value = await handler(file);
}
```

## 🎨 UI 特性

- **玻璃态设计**：半透明背景、柔和阴影、圆角卡片
- **渐变背景**：径向渐变营造层次感
- **拖拽上传**：支持拖拽文件，悬停效果反馈
- **状态指示**：加载/成功/错误状态的视觉反馈
- **深色代码风格**：文本查看器采用深色主题，等宽字体
- **响应式布局**：适配移动端和桌面端

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

1. **文件大小**：建议上传的文件不超过 50MB
2. **浏览器兼容性**：需要支持 File API 和 ArrayBuffer 的现代浏览器
3. **PDF Worker**：使用 `pdfjs-dist` 的 worker 进行 PDF 解析
4. **DOCX 格式**：仅支持 `.docx` 格式，不支持旧的 `.doc` 格式

## 🔮 扩展方向

1. **更多格式支持**：
   - TXT 纯文本文件
   - Markdown (.md) 文件
   - Excel (.xlsx) 表格文件

2. **文档预处理**：
   - 自动分块 (Chunking)
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

**提示**：本项目是 RAG 系统的文档预处理模块，提取的文本可以用于后续的向量化和检索步骤。
