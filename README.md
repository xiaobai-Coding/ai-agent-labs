
# 🤖 AI Agent Labs  
> xiaoBaiCoding 的 AI 智能体实验室  
> 基于 Prompt + Tools + LLM + Function Calling 的实战型工程仓库

---

## 📌 项目简介

**AI-Agent-Labs** 是我用于学习、实践和沉淀 AI 智能体开发能力的综合实验仓库。  
这里包含多个基于 LLM（DeepSeek / OpenAI）构建的 **真实可运行的 Agent Demo**，项目重点包括：

- 🧠 **Function Calling 工具链**
- 🔧 **多工具协作**
- ♻️ **工具反制（工具错误后的自动修复与重试）**
- 🔀 **任务规划链路（Tool Planning）**
- 📡 **流式输出（SSE）解析**
- 🪢 **上下文裁剪与对话管理**
- 🧩 **可复用的工具集合 tools/**
- 🌱 **基于 Vue3 的网页 Demo 展示**

> 目标不是做“LLM 玩具”，  
> 而是训练真正的 **AI Agent 工程能力**。

---

## 📁 仓库目录结构

```

ai-agent-labs/
│
├── tools/                    # 全局工具集合（所有 Demo 共用）
│    ├── calculator.ts
│    ├── unitConverter.ts
│    ├── weather.ts
│    ├── index.ts
│
├── ai-core/                  # （可选）底层 AI 调用框架
│    ├── agent.ts
│    ├── stream.ts
│    ├── tool-handler.ts
│    └── message-trim.ts
│
└── demos/                    # 每个 Demo 都是独立项目
├── demo-weather/
├── demo-unit-converter/
├── demo-calculator/
└── ...

````

特点：
- 每个 demo 独立可运行（无工程负担）
- 工具全部集中在 `tools/`，统一管理和复用
- 支持逐步扩展 AI 能力，快速沉淀 Demo
- 最适合作为求职作品集与个人 Agent 学习路线

---

## 🧰 Tools（全局工具库）

当前支持的工具包括：

| 工具名 | 说明 | 文件 |
|-------|------|------|
| calculator | 四则运算工具 | `tools/calculator.ts` |
| unitConverter | 单位换算工具（cm/m, kg/g, C/F） | `tools/unitConverter.ts` |
| weatherTool | 天气查询工具（伪造数据版） | `tools/weather.ts` |

工具会自动被 Agent 调用，用于真实执行能力，而不是让模型“猜”。

---

## 🧠 Agent 能力简介

本仓库全面支持 **现代智能体核心能力**：

### ✔ 1. Function Calling  
基于 LLM 自动选择工具、解析参数、调用执行。

### ✔ 2. 工具反制（Tool React / Retry）  
当工具调用失败时：

- 捕获错误信息  
- 反馈给 LLM  
- 让 LLM 修复参数  
- 自动发起第二次工具调用  

这是智能体真正“能跑起来”的关键机制。

### ✔ 3. 流式能力（Streaming）  
通过 SSE 解析 `result` 字段，实现流式响应。

### ✔ 4. 对话裁剪（Message Trim）  
避免 token 过长影响成本与推理效果。

### ✔ 5. Prompt + Tools 结合  
Prompt 决策 → 工具执行 → 模型处理结果输出  
是 AI Agent 最核心的决策机制。

---

## 🎯 Demo 列表（持续更新中）

### **1️⃣ Unit Converter（单位换算智能体）**
- 支持 cm ⇆ m  
- 支持 kg ⇆ g  
- 支持 C ⇆ F  
- 工具反制 + 参数修正  
- Demo 路径：`demos/demo-unit-converter`

---

### **2️⃣ Weather Agent（天气助手）**
- 输入“明天重庆天气如何？”
- 自动调用天气工具生成伪造天气  
- 自动生成穿衣/出行建议  
- Demo 路径：`demos/demo-weather`

---

### **3️⃣ Calculator Agent（计算助手）**
- 用户输入算式  
- 自动调用 calculator 工具  
- Demo 路径：`demos/demo-calculator`

---

## 🚀 如何运行

每个 Demo 都是独立项目，进入对应目录即可：

```bash
cd demos/demo-weather
npm install
npm run dev
````

或者：

```bash
cd demos/demo-unit-converter
npm install
npm run dev
```

---

## 🛠 未来规划（持续迭代）

* [ ] 多工具协作 Agent（Multi-Tool Agent）
* [ ] 基于计划的智能体（Planner Agent）
* [ ] 真实天气 API 版本
* [ ] 真实 HTTP 工具支持（fetchTool）
* [ ] AI 自动生成工具参数（参数推断）
* [ ] 大型任务链路 Demo（完整 agent pipeline）
* [ ] Chat UI 通用组件库

---

## ✨ 背景与目标

作为一名前端工程师，我正在从传统前端转向 **AI 应用工程师 / 智能体开发工程师**。

本仓库的核心目标：

* 沉淀 AI 工具调用技术
* 强化 Prompt + Tool 思维
* 构建真实的 AI Demo
* 打造面试即用的作品集
* 训练完整的 Agent 开发能力
* 掌握未来 5 年最核心的工程技能

---

## 🧑‍💻 作者

**xiaoBaiCoding**
前端工程师 → AI 工程师转型中
专注 LLM 应用、智能体、Function Calling、AI 开发体系。

欢迎交流！

---

## 📄 License

MIT License



