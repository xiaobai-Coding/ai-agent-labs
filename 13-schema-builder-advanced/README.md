# AI Schema Builder (Advanced)

[中文版本入口](#zh-readme)

An engineering-oriented AI-powered JSON Schema form builder that transforms natural language into **production-ready, incremental, and validated schemas**.

AI Schema Builder (Advanced) is **not** a one-shot AI demo. It is a robust **engineering-oriented AI system** designed to demonstrate how to integrate LLMs into real-world front-end workflows with **strict control, multi-layer validation, incremental patching, and cost protection**.

👉 Live Demo: https://ai-schema-builder-advanced.vercel.app

---

## 🌍 English Version

### 📖 Introduction

In the era of AI-driven development, most "Form Builders" focus on one-shot generation. However, real-world requirements are **iterative**. A user might say "add a phone field" or "make this field required" after the initial generation. 

**AI Schema Builder (Advanced)** solves this by treating AI as a "proposer" of changes (Patches) rather than a simple code generator. It implements a sophisticated workflow that ensures AI-generated modifications are safe, version-aware, and human-verified before being applied to the "Source of Truth" (the Schema).

### ❓ Why This Project Exists

Most AI form builders stop at "Generate once," "Screenshot and done," or "Regenerate everything on every change." These approaches fail in real usage because:
- **Regeneration causes state loss**: Custom manual edits are wiped out.
- **High cost**: Sending full schemas to LLMs for small changes is wasteful.
- **Lack of control**: Blindly applying AI output can break production UIs.

**90% of AI demos break when a user says "I only want to modify this one field."** This project is designed to solve that exact problem.

### 🛠 Core Capabilities

#### 1. Natural Language → JSON Schema (Controlled Generation)
- Users describe form requirements in plain language.
- AI generates **strictly structured JSON Schema**.
- Output is machine-parseable and validated before application.

#### 2. Schema-Driven Form Rendering
- JSON Schema is the **single source of truth**.
- Forms are rendered dynamically from `schema.fields`.
- Supported field types: `string`, `number`, `boolean`, `select (enum)`.

#### 3. Two-Way Editable Schema with Safety Guards
- **Live Form Preview**: Instant feedback as the schema changes in the raw JSON editor.
- **Validation-First**: Invalid JSON never breaks the UI; the last valid state is always preserved.

#### 4. Field-Level Editor (Human-in-the-Loop)
- Click any field to open a drawer editor for labels, descriptions, required status, defaults, and enum options.
- Supports immediate apply, cancel/rollback, and single-field reset.

#### 5. Schema Import / Export (Closed Loop)
- **Export**: Copy JSON or download as `.json`.
- **Import**: Paste JSON or upload files with strict validation guards.

#### 6. AI Patch System (Core Highlight)
- **Intent Classification**: Before generation, AI classifies user intent as `FULL_GENERATE`, `PATCH_UPDATE`, `REGENERATE`, or `UNKNOWN`. This prevents accidental full rewrites.
- **Incremental Updates**: For `PATCH_UPDATE`, AI returns **only patch operations** (`add`, `update`, `remove`), saving tokens and preserving manual edits.
- **Patch Preview & Diff**: A semantic summary and raw operations are presented for explicit confirmation.
- **History & Rollback**: Stores history records with snapshots for one-click recovery.

### 🔄 System Workflow

The system follows a rigorous "Reasoning -> Validation -> Execution" pipeline:

1.  **Input & Guard**: Receives user input. Detects vague requests (e.g., "optimize it") and clarifies if needed.
2.  **Classification**: AI determines the intent (e.g., `PATCH_UPDATE`).
3.  **Patch Generation**: AI generates a list of operations based on current schema and instructions.
4.  **Local Validation**: System validates operations (field existence, type safety, version consistency).
5.  **Confirmation**: Semantic summary and diff are presented to the user.
6.  **Application**: Valid operations applied; version increments; history saved.

### 🏗 Engineering Hard Cases

These are real-world failure modes where most AI demos collapse. AI Schema Builder (Advanced) handles them with system-level guards.

#### 1) Patch Drift / Version Mismatch (Schema Drift)
- **Problem**: User edits schema manually while AI is generating a patch.
- **Solution**: Schema maintains `version`. Patch returns `baseVersion`. If mismatch, the update is blocked to prevent state corruption.

#### 2) Partial Apply (Some operations invalid)
- **Problem**: Some operations in a patch are invalid (e.g., update a non-existent field).
- **Solution**: Validate operations independently. Mark valid ones for application and skip invalid ones with clear reasons.

#### 3) Intent Misclassification Fallback
- **Problem**: Classifier may output `PATCH_UPDATE` but with low confidence.
- **Solution**: Intent + confidence gating. If below threshold, show a clarify UI asking: “Do you want to regenerate from scratch, or apply a patch?”

### 📂 Project Directory Structure

```text
.
├── api/                    # Serverless Functions (Vercel)
│   └── ai.ts               # AI Proxy with rate limiting & security
├── src/
│   ├── components/         # UI Components
│   │   ├── form-renderer/  # Dynamic form rendering logic
│   │   ├── PatchPreview/   # Diff & confirmation UI
│   │   └── ...
│   ├── prompts/            # AI Prompts (Classification & Patching)
│   ├── services/           # Backend communication
│   ├── types/              # Type definitions (Schema, Intent)
│   ├── utils/              # Core Logic
│   │   ├── applyPatch.ts   # JSON Patch execution engine
│   │   ├── validatePatch.ts# Multi-layer safety validation
│   │   ├── intentGuard.ts  # Input sanity & confidence checks
│   │   └── patchSummary.ts # Semantic diff generator
│   └── App.vue             # Main Application Logic
└── README.md
```

### 🔒 Security & Deployment

#### Serverless API Layer (Vercel)
All AI requests go through `/api/ai` to ensure:
- **API Keys** stay server-side.
- **Rate Limiting** via Vercel KV (Redis) to prevent cost abuse.
- **Client Token Validation** to block direct script access.

### � Architecture Philosophy

- **Schema as Single Source of Truth**: AI and UI both sync to the same state.
- **AI Proposes, System Validates**: AI is for reasoning; the system is for execution and safety.
- **Validation-First, Human-in-the-Loop**: Never trust AI output blindly.
- **Patch-based Evolution**: Incremental changes are superior to full regeneration.

### �💎 Project Value

This project demonstrates:
- How to build **engineering-grade AI tools**.
- How to safely integrate LLMs into real applications with **state control**.
- How to handle real-world AI hard cases (drift, partial apply, misclassification).
- **Cost protection** and production instability prevention.

### 🚀 Local Development

#### 1) Install dependencies
```bash
npm install
# or
pnpm install
```

#### 2) Set environment variables (Required)
```bash
export AI_API_KEY="your_api_key_here"
export AI_API_BASE_URL="https://api.deepseek.com"
export CLIENT_TOKEN="ai-schema-builder-web"
```

#### 3) Start local server (Vercel Dev)
```bash
vercel dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 👨‍💻 Author
**xiaoBaiCoding**

Frontend Engineer → AI Application Engineer (Transforming).  
Focusing on LLM applications, Agent systems, and AI front-end engineering practices.

---

## <a id="zh-readme"></a>
## 🇨🇳 中文版本

### 📖 项目介绍

在 AI 驱动开发的时代，大多数“表单生成器”只关注一次性生成。然而，真实业务需求是**增量演进**的。用户往往在初始生成后提出“加个手机号字段”或“把这个设为必填”等修改。

**AI Schema Builder (Advanced)** 正是为了解决这一痛点而生。它将 AI 视为变更的“提案者”（Patch Proposer），而非简单的代码生成器。通过一套严谨的工作流，确保 AI 生成的修改在应用到“唯一事实源”（Schema）之前，是安全、感知版本且经过人工确认的。

### ❓ 项目背景

大多数 AI 表单 Demo 只能做到“一次性生成”、“截图即结束”或“每次修改就全量重写”。这种方式在真实场景中会失败：
- **重写导致状态丢失**：用户的手动微调会被 AI 覆盖。
- **高昂成本**：为了一点小改动就发送全量 Schema 给模型非常浪费。
- **缺乏控制**：盲目应用 AI 输出可能破坏生产环境界面。

**当用户说“我只想改这一项”时，90% 的 AI Demo 都会崩溃。** 本项目正是为了解决这些工程级问题。

### 🛠 核心能力

#### 1. 自然语言 → JSON Schema（受控生成）
- 用户使用自然语言描述需求。
- AI 输出严格结构化的 **JSON Schema**。
- 在应用前进行机器解析与合法性校验。

#### 2. Schema 驱动的表单渲染
- JSON Schema 是系统的**唯一事实源**。
- 表单完全由 `schema.fields` 动态渲染。
- 支持 `string`, `number`, `boolean`, `select` 等字段类型。

#### 3. Schema 双向可编辑 + 安全兜底
- **实时预览**：在 JSON 编辑区修改 Schema，右侧表单即刻看到效果。
- **校验优先**：非法 JSON 不会破坏界面，始终保留最近一次合法状态。

#### 4. 字段级编辑器（人类参与）
- 点击字段打开抽屉，编辑 label、描述、必填、默认值及枚举项。
- 支持即时生效、取消回滚及单字段重置。

#### 5. Schema 导入 / 导出（闭环）
- **导出**：复制 JSON 或下载 `.json` 文件。
- **导入**：粘贴 JSON 或上传文件，带严格校验。

#### 6. AI Patch 机制（核心亮点）
- **意图识别**：在生成前判断是“全量生成”、“增量修改”、“推翻重做”还是“无法识别”。避免误触发全量重写。
- **增量更新**：对于增量修改，AI 仅返回 **Patch 操作**（add, update, remove），节省 Token 并保护手动编辑。
- **预览与 Diff**：展示语义化摘要和原始操作，由用户显式确认。
- **历史与回滚**：记录变更快照，支持一键恢复到历史状态。

### 🔄 系统工作流程

系统遵循严格的“推理 -> 校验 -> 执行”管线：

1.  **输入与守护**：接收用户输入。识别模糊指令（如“优化一下”）并在必要时请求澄清。
2.  **分类**：AI 判定意图（如 `PATCH_UPDATE`）。
3.  **补丁生成**：AI 接收当前 Schema 和指令，生成操作列表。
4.  **本地校验**：系统逐条校验操作（字段存在性、类型安全、版本一致性）。
5.  **确认**：向用户展示语义化摘要和 Diff 预览。
6.  **执行**：应用合法操作，版本递增，记录历史。

### 🏗 工程级 Hard Case 处理

这些是真实工程中最容易导致 AI 系统崩溃的场景，本项目通过系统级兜底予以解决：

#### 1) Patch 漂移 / 版本不一致（Schema Drift）
- **问题**：AI 生成补丁期间，用户手动修改了 Schema。
- **方案**：Schema 维护 `version`，Patch 携带 `baseVersion`。若不一致则拦截更新，防止状态污染。

#### 2) 部分成功 (Partial Apply)
- **问题**：补丁中部分操作非法（如更新一个不存在的字段）。
- **方案**：独立校验每条操作。应用合法部分，跳过非法部分并给出详细原因。

#### 3) 意图误判兜底
- **问题**：分类器可能输出 `PATCH_UPDATE` 但置信度低。
- **方案**：意图 + 置信度联合判断。低于阈值时弹出澄清 UI，询问：“你是想重新生成？还是基于当前表单做增量修改？”

### 📂 项目目录说明

```text
.
├── api/                    # Serverless 云函数 (Vercel)
│   └── ai.ts               # AI 代理：集成限流与 API 安全校验
├── src/
│   ├── components/         # UI 组件
│   │   ├── form-renderer/  # 动态表单渲染核心逻辑
│   │   ├── PatchPreview/   # 补丁预览与确认 UI
│   │   └── ...
│   ├── prompts/            # AI 提示词（分类与补丁生成模板）
│   ├── services/           # 后端接口服务
│   ├── types/              # 类型定义（Schema、意图等）
│   ├── utils/              # 核心工具函数（系统大脑）
│   │   ├── applyPatch.ts   # JSON Patch 执行引擎
│   │   ├── validatePatch.ts# 多层安全校验逻辑
│   │   ├── intentGuard.ts  # 输入清洗与置信度拦截
│   │   └── patchSummary.ts # 语义化变更摘要生成
│   └── App.vue             # 应用主入口与状态管理
└── README.md
```

### 🔒 安全与部署

#### Serverless API 执行层 (Vercel)
所有 AI 请求统一走 `/api/ai`：
- **API Key** 永不暴露给前端。
- **频率限制**：基于 Vercel KV (Redis) 实现 IP 限流。
- **令牌校验**：防止脚本直刷接口。

### 📐 设计理念

- **Schema 是唯一事实源**：AI 与 UI 始终同步于同一状态。
- **AI 负责“建议”，系统负责“执行”**：AI 提供推理，系统负责安全与落地。
- **校验优先，人类参与**：绝不盲目信任 AI 输出。
- **以增量演进代替全量重写**：保护用户心智与 Token 成本。

### 💎 项目价值

展示如何把 AI 真正变成工程系统的一部分：
- 如何构建 **工程级 AI 工具**。
- 如何在实际应用中安全集成 LLM 并保持 **状态可控**。
- 如何处理真实的 AI Hard Cases（漂移、部分应用、误判）。
- **成本保护**与生产稳定性防护。

### 🚀 本地开发

#### 1）安装依赖
```bash
npm install
# 或
pnpm install
```

#### 2）设置环境变量（必须）
```bash
export AI_API_KEY="你的_api_key"
export AI_API_BASE_URL="https://api.deepseek.com"
export CLIENT_TOKEN="ai-schema-builder-web"
```

#### 3）启动本地服务 (Vercel Dev)
```bash
vercel dev
```
访问 [http://localhost:3000](http://localhost:3000)

---

## 👨‍💻 作者
**xiaoBaiCoding**

前端工程师 → AI 应用工程师（转型中）。  
专注于 LLM 应用、Agent 系统与 AI 前端工程化实践。

---

## License
MIT License
