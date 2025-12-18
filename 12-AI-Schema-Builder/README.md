
## AI Schema Builder

An AI-powered JSON Schema form builder that turns natural language into editable, production-ready forms.

AI Schema Builder is a schema-driven form design tool: users describe their needs in natural language, and the system generates a structured JSON Schema that can be rendered, edited, patched, and exported.  
Unlike typical “one-shot” AI demos, this project focuses on **engineering-grade control, validation, and incremental evolution**.

---

### Features (EN)

- **Natural language → JSON Schema**
  - Describe your form in plain language
  - AI generates a structured JSON Schema with a strict, machine-parseable format

- **Schema-driven form rendering**
  - JSON Schema is the **single source of truth**
  - Dynamic form rendering based on `schema.fields`
  - Supports `string / number / boolean / select (enum)` field types

- **Two-way editable schema**
  - Left: dark-themed JSON editor for raw schema
  - Right: live form preview
  - Validation guard ensures:
    - Invalid JSON does not break the UI
    - The last valid schema is always preserved

- **Field-level editor (Field Editor)**
  - Click any field to open a drawer editor
  - Edit label, description, required, default, enum, constraints, etc.
  - Type-aware editing (string / number / boolean / select / array)
  - Supports “apply immediately”, “cancel with rollback”, and “reset this field”

- **Schema import / export**
  - Export schema as JSON (copy or download `.json`)
  - Import schema by paste or uploading `.json`
  - Invalid schemas never overwrite the current valid schema

---

### AI Patch System (EN)

- **Intent classification**
  - Classifies each user request into:
    - `FULL_GENERATE`
    - `PATCH_UPDATE`
    - `REGENERATE`
    - `UNKNOWN`
  - Prevents accidental full rewrites when the user only wants small changes

- **Incremental patch updates**
  - For `PATCH_UPDATE`, the model always receives:
    - `current_schema`: the current full JSON Schema
    - `user_instruction`: the user’s natural-language modification request
  - The model returns **only patch operations**, never a full schema dump

- **Patch preview & diff**
  - Patch Preview Modal shows:
    - High-level diff summary (added / updated / removed fields)
    - Raw patch operations list
  - Changes are only applied after explicit user confirmation

- **Patch history & rollback**
  - Stores the last N applied patches with:
    - Human-readable summary
    - `beforeSchema` / `afterSchema` snapshots
  - History bar allows one-click rollback to any previous version
  - Rollback never creates new history entries (pure restore)

---

### Architecture & Tech Stack (EN)

- **Architecture concepts**
  - **Schema as single source of truth**
  - AI proposes, the system validates and applies
  - Validation-first, human-in-the-loop control
  - Patch-based schema evolution rather than repeated full regeneration

- **Tech stack**
  - **Framework**: Vue 3 (`<script setup>`) + TypeScript
  - **UI Library**: Naive UI (custom purple/blue theme)
  - **Build Tool**: Vite
  - **AI API**: DeepSeek Chat Completions (OpenAI-style)

---

### Core Structure (EN)

- **`src/App.vue`**
  - Overall layout: prompt input + left JSON editor + right form preview
  - Maintains `schema` / `schemaText` as the only trusted schema state
  - Orchestrates AI calls, patch preview, patch application, history, and rollback

- **`src/components/PromptInput.vue`**
  - Natural-language input box
  - Chat-style send button with loading states

- **`src/components/form-renderer/FormRenderer.vue`**
  - Renders form based on `schema.fields`
  - Accepts `highlightMap` to visually mark added/updated fields

- **`src/components/form-renderer/FieldRenderer.vue`**
  - Chooses concrete field components based on `field.type`
  - Uses `v-model` for two-way binding

- **`src/components/form-renderer/FieldEditor.vue`**
  - Drawer-based field editor
  - Real-time edits to `schema.fields` with cancel/rollback/reset flows

- **`src/components/PatchPreviewModal.vue`**
  - AI patch preview modal
  - Patch diff summary + raw operations list
  - Confirm / cancel actions with project-themed UI

- **`src/utils/applyPatch.ts`**
  - Pure function to apply `add / update / remove` operations to schema

- **`src/prompts/schemaPrompt.ts`**
  - Intent classifier prompt
  - `PATCH_UPDATE_PROMPT` (expects `current_schema` + `user_instruction`)
  - Full schema generator prompt

---

### Run & Develop (EN)

- **Install dependencies**

```bash
pnpm install
# or
npm install
```

- **Start dev server**

```bash
pnpm dev
# or
npm run dev
```

Then open `http://localhost:5173` (or the port reported by Vite).

---

### Environment Variables (EN)

Create `.env.local` in the project root:

```bash
VITE_AI_API_KEY=your_deepseek_api_key
VITE_AI_API_BASE_URL=https://api.deepseek.com
VITE_APP_TITLE=AI Schema Builder
VITE_APP_DEBUG=false
```

---

## AI Schema Builder（中文说明）

一个基于 AI 的 JSON Schema 表单设计器，通过自然语言快速生成、编辑并管理表单结构。

AI Schema Builder 以 JSON Schema 为核心，所有表单都由 Schema 驱动进行渲染、编辑与导出。  
它的目标不是做一个“炫酷但一次性的 Demo”，而是展示 **如何把 AI 融入真实前端工程，做到可控、可回滚、可维护**。

---

### 功能特性（中文）

- **自然语言 → JSON Schema**
  - 使用中文自然语言描述表单需求
  - AI 输出结构化的 JSON Schema，格式受严格约束，便于机器解析与后续处理

- **Schema 驱动的表单渲染**
  - JSON Schema 是唯一数据源
  - 根据 Schema 动态渲染表单
  - 支持字段类型：文本 / 数字 / 布尔 / 下拉选择（enum）等

- **Schema 双向可编辑**
  - 左侧：深色 JSON 文本编辑器
  - 右侧：实时表单预览
  - 内置 Schema 校验机制：
    - 非法 JSON 不会直接破坏当前界面
    - 始终保留最近一次合法的 Schema

- **字段级编辑器（Field Editor）**
  - 点击表单字段打开右侧编辑抽屉
  - 可编辑：label、描述、必填、默认值、枚举、校验规则等
  - 针对不同字段类型展示不同编辑项（如字符串长度、数字范围、数组 items 类型等）
  - 支持“实时生效 + 取消回滚 + 单字段重置”

- **Schema 导入 / 导出**
  - 导出：一键复制 JSON，或下载 `.json` 文件
  - 导入：粘贴 JSON 或上传 `.json` 文件
  - 校验失败时不会覆盖当前合法 Schema

---

### AI Patch 机制（中文）

- **意图识别（Intent Classification）**
  - AI 在生成前先判断当前请求属于：
    - 全量生成（FULL_GENERATE）
    - 增量修改（PATCH_UPDATE）
    - 重新生成（REGENERATE）
    - 无法识别（UNKNOWN）
  - 避免用户只想“小改一下”，结果却被“整份重写”。

- **增量 Patch 更新**
  - 在 PATCH_UPDATE 模式下，Prompt 严格约定输入为两部分：
    - `current_schema`：当前完整 Schema JSON
    - `user_instruction`：用户自然语言修改需求
  - 模型 **只返回 Patch operations**，不会返回完整 Schema：
    - `add`：新增字段
    - `update`：修改字段或 Schema 元信息
    - `remove`：删除字段

- **Patch 预览与 Diff**
  - Patch Preview Modal 中展示：
    - 语义级变更摘要（新增 / 修改 / 删除了哪些字段）
    - 原始 patch operations 列表
  - 用户确认后才会真正调用 `applyPatch` 更新 `schema`。

- **Patch 历史与回滚**
  - 仅对“已成功应用的 Patch”写入历史记录，包含：
    - 人类可读的 summary
    - `beforeSchema` / `afterSchema` 深拷贝快照
  - 下方历史标签区支持一键回滚到任一版本
  - 回滚行为只恢复状态，不会新增新的历史记录。

---

### 设计理念（中文）

- **Schema 是唯一事实源**
  - 所有渲染 / 编辑 / 导入 / 导出都围绕同一个 `schema` 状态
  - AI 生成、Patch 应用、手工编辑最终都统一收敛到这一份 Schema

- **AI 负责“想”，系统负责“执行”**
  - AI 负责生成 Patch 建议
  - 前端负责：
    - 校验、预览、控制边界
    - 管理历史与回滚
    - 保证状态一致性与可预期性

- **安全优先，增量优先**
  - 所有修改都可解释、可追溯、可回退
  - 推荐“小步快跑”的增量修改，而不是频繁全量重生成

---

### 项目意义（中文）

大多数 AI 表单 Demo 止步于“生成一次就截图”。  
本项目展示的是：**如何在真实前端工程中，把 AI 做成一个可用、可控、可维护的表单设计工具**。

适合作为：

- **AI + 前端工程实践示例**
- **Agent 系统设计 Demo**
- **面试 / 分享场景下的展示项目**

---
---

## 🧑‍💻 作者

**xiaoBaiCoding**
前端工程师 → AI 工程师转型中
专注 LLM 应用、智能体、Function Calling、AI 开发体系。

欢迎交流！

---

### License

MIT