# AI Schema Builder

[中文版本入口](#zh-readme)

An AI-powered JSON Schema form builder that transforms natural language into **editable, incremental, and production-ready schemas**.

AI Schema Builder is **not** a one-shot AI demo.  
It is an **engineering-oriented AI system** that demonstrates how to integrate LLMs into real front-end workflows with **control, validation, patching, rollback, and cost protection**.

👉 Live Demo: https://ai-schema-builder-advanced.vercel.app

---

## 🌍 English Version

### Why This Project Exists

Most AI form builders stop at:

- “Generate once”
- “Screenshot and done”
- “Regenerate everything on every change”

These approaches fail in real usage.

Real users say things like:

- “Add a phone field”
- “Make this required”
- “Undo the last change”
- “I only want to modify this one field”

**90% of AI demos break here.**

AI Schema Builder is designed to solve this exact problem.

---

## Core Capabilities

### 1. Natural Language → JSON Schema (Controlled Generation)

- Users describe form requirements in plain language
- AI generates **strictly structured JSON Schema**
- Output is machine-parseable and validated before application

---

### 2. Schema-Driven Form Rendering

- JSON Schema is the **single source of truth**
- Forms are rendered dynamically from `schema.fields`
- Supported field types:
  - `string`
  - `number`
  - `boolean`
  - `select (enum)`

---

### 3. Two-Way Editable Schema with Safety Guards

- Left panel: raw JSON schema editor
- Right panel: live form preview
- Validation-first workflow:
  - Invalid JSON never breaks the UI
  - The last valid schema is always preserved

---

### 4. Field-Level Editor (Human-in-the-Loop)

- Click any field to open a drawer editor
- Edit:
  - label
  - description
  - required
  - default
  - enum options
  - type-specific constraints
- Supports:
  - apply immediately
  - cancel & rollback
  - reset single field

---

### 5. Schema Import / Export (Closed Loop)

- Export schema:
  - copy JSON
  - download `.json`
- Import schema:
  - paste JSON
  - upload `.json`
- Invalid schema never overwrites the current valid state

---

## AI Patch System (Core Highlight)

### Intent Classification

Before generation, AI classifies user intent as:

- `FULL_GENERATE`
- `PATCH_UPDATE`
- `REGENERATE`
- `UNKNOWN`

This prevents accidental full rewrites.

---

### Incremental Patch Updates

For `PATCH_UPDATE`:

- AI receives:
  - `current_schema`
  - `user_instruction`
- AI returns **only patch operations**, never full schema dumps:
  - `add`
  - `update`
  - `remove`

---

### Patch Preview & Diff

- Preview modal shows:
  - semantic change summary
  - raw patch operations
- Changes apply **only after explicit confirmation**

---

### Patch History & Rollback

- Stores last N applied patches
- Each entry includes:
  - human-readable summary
  - before/after schema snapshots
- One-click rollback without creating new history entries

---

## Engineering Hard Cases (Week 2)

These are the real-world failure modes where most AI demos collapse.  
This project explicitly handles them with **system-level guards**.

### 1) Patch Drift / Version Mismatch (Schema Drift)

Problem:
- AI generates a patch based on `schema@v1`
- User edits schema to `schema@v2` before patch is applied
- Applying a `v1` patch onto `v2` can corrupt state

Solution:
- `schema` maintains `version` (or hash)
- Patch returns `baseVersion`
- Before apply:
  - if `baseVersion !== currentVersion` → block apply and ask user to regenerate patch

### 2) Partial Apply (Some operations invalid)

Problem:
- Patch contains multiple operations
- Some are valid, some are invalid (e.g., update a non-existent field)

Solution:
- Validate each operation independently
- In preview:
  - mark ✔ valid operations
  - mark ✖ skipped operations with reasons
- Apply strategy: **skip invalid ops, apply the rest**
- Produce a clear final summary:
  - “Applied 2, skipped 1 (field not found: email)”

### 3) Patch Validation Enhancement (Never trust AI output)

Problem:
- AI output may include invalid field types, illegal keys, or inconsistent values

Solution:
- Strict patch validation before apply:
  - op / target must be in allowed set
  - field must exist for update/remove
  - type must be one of `string | number | boolean | select`
  - enum must be compatible with `select`
- Invalid patch never mutates schema

### 4) Intent Misclassification Fallback (intent + confidence)

Problem:
- Classifier may output `PATCH_UPDATE` but with low confidence
- Blind execution causes wrong behavior

Solution:
- intent + confidence gating:
  - if `PATCH_UPDATE` and `confidence < threshold` → do NOT execute
  - show clarify UI:
    - “Do you want to regenerate from scratch, or apply a patch?”

---

## Security & Deployment (Engineering Reality)

### Why Frontend Direct AI Calls Are Dangerous

- API keys exposed in browser
- Requests can be replayed or scripted
- Unlimited cost risk

**Frontend ≠ Security boundary**

---

### Serverless API Layer (Vercel)

All AI requests go through `/api/ai`:

Client → Vercel Serverless API → AI Provider

Benefits:

- API keys stay server-side
- Request validation & sanitization
- Centralized error handling
- Rate limiting & cost protection

---

### Cost Protection & Abuse Prevention

Implemented strategies:

- All AI requests go through `/api/ai`
- API keys are server-side only
- IP-based rate limiting using Vercel KV (Redis)
- Client token validation to prevent direct script access
- Input validation and unified error responses

---

## Architecture Philosophy

- **Schema as Single Source of Truth**
- **AI proposes, system validates and applies**
- Validation-first, human-in-the-loop
- Patch-based evolution over full regeneration
- Clear separation of responsibilities:
  - AI = reasoning & suggestion
  - System = execution, validation, and safety

---

## Tech Stack

- Vue 3 + TypeScript
- Naive UI
- Vite
- DeepSeek (OpenAI-style API)
- Vercel Serverless Functions
- Vercel KV (Redis)

---

## Project Value

This project demonstrates:

- How to build **engineering-grade AI tools**
- How to safely integrate LLMs into real applications
- How to control AI-generated state changes
- How to prevent cost abuse and production instability
- How to handle real-world AI hard cases (drift, partial apply, misclassification)

Suitable for:

- AI + Frontend engineering demos
- Agent system design examples
- Technical interviews and showcases

---

## Local Development

```
### 1) Install dependencies

```bash
pnpm install
# or
npm install
```

### **2) Set environment variables (required)**

Before starting local development, you must manually set the following environment variables (required by /api/ai):

```
export AI_API_KEY="your_api_key_here"
export AI_API_BASE_URL="https://api.deepseek.com"
export CLIENT_TOKEN="ai-schema-builder-web"
```

Tip: you can also put them into your shell profile (e.g. ~/.zshrc) for convenience.

### **3) Start local server (Vercel Dev)**

```
vercel dev
```

Then open:

- http://localhost:3000



------


# <a id="zh-readme"></a>
# **🇨🇳 中文版说明**



## **项目背景**



大多数 AI 表单 Demo 只能做到：

- 一次性生成
- 每次修改就全量重写
- 无法撤销、无法回滚
- 没有成本控制

但真实用户会说：

- “加一个手机号字段”
- “这个字段改成必填”
- “刚才那步不对，撤回”
- “我只想改这一项”

**90% 的 AI Demo 就死在这里。**

AI Schema Builder 正是为了解决这个工程级问题。

------



## **核心能力**



### **1. 自然语言 → JSON Schema（受控生成）**

- 使用自然语言描述表单需求
- AI 输出结构化 JSON Schema
- 在进入系统前进行严格校验，防止污染状态

------



### **2. Schema 驱动的表单渲染**

- JSON Schema 是唯一事实源
- 表单完全由 schema.fields 动态渲染
- 支持字段类型：
  - 文本（string）
  - 数字（number）
  - 布尔（boolean）
  - 下拉选择（enum）

------



### **3. Schema 双向可编辑 + 安全兜底**

- 左侧：JSON 编辑区
- 右侧：表单实时预览
- 校验优先机制：
  - 非法 JSON 不会破坏界面
  - 始终保留最近一次合法 Schema

------



### **4. 字段级编辑器（人类参与）**

- 点击字段打开编辑抽屉
- 可编辑：
  - label / 描述 / 必填
  - 默认值 / 枚举 / 类型约束
- 支持：
  - 即时生效
  - 取消回滚
  - 单字段重置

------



### **5. Schema 导入 / 导出（闭环）**

- 导出：
  - 复制 JSON
  - 下载 .json
- 导入：
  - 粘贴 JSON
  - 上传 .json
- 校验失败不会覆盖当前合法 Schema

------



## **AI Patch 机制（核心亮点）**

### **意图识别**

在生成前判断用户意图：

- FULL_GENERATE（全量生成）
- PATCH_UPDATE（增量修改）
- REGENERATE（重新生成）
- UNKNOWN（无法识别）

避免误触发全量重写。

------



### **增量 Patch 更新**

- AI 接收：
  - 当前 Schema（current_schema）
  - 用户修改描述（user_instruction）
- 只返回 Patch 操作：
  - 新增（add）
  - 修改（update）
  - 删除（remove）
- 不允许返回完整 Schema

------



### **Patch 预览与 Diff**

- 应用前展示：
  - 变更摘要
  - Patch 操作列表
- 用户确认后才真正修改 Schema

------



### **Patch 历史与回滚**

- 记录最近 N 次 Patch
- 每条包含：
  - 可读摘要
  - 前后 Schema 快照
- 一键回滚，不生成新历史

------



## **工程级 Hard Case 处理**

这些是真实工程里最容易出事故的点，也是多数 AI Demo 走不下去的原因。

本项目通过系统级兜底把它们补齐。

### **1) Patch 漂移 / 版本不一致（Schema Drift）**

**问题：**

- AI 基于 schema@v1 生成 Patch
- Patch 返回前，用户把 schema 改成 schema@v2
- 把 v1 Patch 应用到 v2 会导致状态污染

**方案：**

- schema 维护 version（或 hash）
- Patch 返回 baseVersion
- apply 前校验：
  - baseVersion !== currentVersion → 阻止应用，并提示重新生成 Patch

------



### **2) 部分失败（Partial Apply）**

**问题：**

- Patch 里包含多条操作
- 有的合法，有的非法（例如更新一个不存在的字段）

**方案：**

- 每条 operation 独立校验
- Preview 中标记：
  - ✔ 可应用
  - ✖ 跳过（并展示原因）
- 应用策略：跳过非法，应用其余合法操作
- 最终给出清晰摘要：
  - “成功应用 2 条，跳过 1 条（字段不存在：email）”

------



### **3) Patch 校验增强（AI 输出 ≠ 可信数据）**

**问题：**

- AI 可能输出非法 type、非法字段属性、enum 不匹配等

**方案：**

- apply 前严格校验：
  - op / target 必须在白名单
  - update/remove 必须命中字段
  - type 必须属于 string | number | boolean | select
  - enum 必须与 select 兼容
- 非法 patch 不允许污染 schema

------



### **4) 意图误判兜底（intent + confidence）**

**问题：**

- 分类器可能输出 PATCH_UPDATE 但置信度低
- 盲执行会触发错误路径

**方案：**

- intent + confidence 联合判断：
  - PATCH_UPDATE 且 confidence < 阈值 → 不执行
- 弹出澄清 UI：
  - “你是想重新生成？还是基于当前表单做增量修改？”

------



## **安全与部署（真实工程场景）**

### **为什么不能前端直连 AI**

- API Key 暴露在浏览器中
- 请求可被脚本模拟
- 极易被刷量，产生真实资金损失

------



### **Serverless API 执行层（Vercel）**

**请求链路：**

- 前端 → Vercel Serverless API → AI 模型

**优势：**

- Key 永不暴露
- 请求统一校验
- 集中限流与错误处理
- 成本与安全可控

------



### **成本与防刷策略**

已实现：

- 所有 AI 请求统一走 /api/ai
- API Key 仅存在于服务端
- 基于 IP 的限流（Vercel KV / Redis）
- 客户端 Token 校验，防止脚本直刷
- 标准化错误返回，避免异常状态扩散

------



## **设计理念**

- Schema 是唯一事实源
- AI 负责“想”，系统负责“执行”
- 所有修改：
  - 可验证
  - 可预览
  - 可追溯
  - 可回退
- 以增量演进代替全量重写

------



## **项目意义**

展示如何把 AI 真正变成工程系统的一部分，而不是一次性的 Demo。

适用于：

- AI + 前端工程实践
- Agent 系统设计展示
- 面试 / 技术分享项目

------



## **本地开发**

### **1）安装依赖**

```
pnpm install
# or
npm install
```

### **2）设置环境变量（必须）**

在本地启动前，你必须手动设置以下环境变量（/api/ai 依赖它们）：

```
export AI_API_KEY="你的_api_key"
export AI_API_BASE_URL="https://api.deepseek.com"
export CLIENT_TOKEN="ai-schema-builder-web"
```

### **3）启动本地服务（Vercel Dev）**

```
vercel dev
```

打开：



- http://localhost:3000

------



## **👨‍💻 作者**

**xiaoBaiCoding**

前端工程师 → AI 应用工程师（转型中）

专注于 LLM 应用、Agent 系统与 AI 工程实践

------



## **License**

MIT License

