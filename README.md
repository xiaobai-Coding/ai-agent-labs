
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
│    ├── calculator.ts         # 计算器工具
│    ├── unitConverter.ts     # 单位转换工具
│    ├── weather.ts           # 天气查询工具
│    ├── travelAdviceTool.ts  # 出行建议工具
│    ├── todoPlannerTool.ts   # 任务规划拆解工具
│    ├── types.ts              # 公共类型定义
│    ├── index.ts              # 统一导出入口
│    └── README.md             # 工具库文档
│
├── 01-Chat-Calculator-Bot/   # 计算器智能体
├── 02-Chat-UnitConverter/    # 单位转换智能体
├── 03-AI-Weather-Bot/        # 天气查询智能体
├── 04-AI-Assistant-Mini/     # 多功能集成助手
├── 05-AI-Planning/           # 任务规划智能体
├── 06-Chat-Travel-Assistant/ # 旅行助手（功能最全的场景 Demo）
└── 07-Agent-WorkFlow/        # Agent 工作流编排 & 可视化（基于 todoPlannerTool）
```

特点：
- 每个项目独立可运行（无工程负担）
- 工具全部集中在 `tools/`，统一管理和复用
- 支持逐步扩展 AI 能力，快速沉淀 Demo
- 最适合作为求职作品集与个人 Agent 学习路线
- 从简单到复杂，循序渐进学习 AI Agent 开发

---

## 🧰 Tools（全局工具库）

当前支持的工具包括：

| 工具名 | 说明 | 文件 |
|-------|------|------|
| calculator | 四则运算工具 | `tools/calculator.ts` |
| unitConverter | 单位换算工具（cm/m, kg/g, C/F） | `tools/unitConverter.ts` |
| weatherTool | 天气查询工具（Mock 数据版） | `tools/weather.ts` |
| travelAdviceTool | 出行建议工具（基于天气生成建议） | `tools/travelAdviceTool.ts` |
| todoPlannerTool | 任务规划拆解工具（将模型思考好的多条子任务文本解析为结构化待办 steps） | `tools/todoPlannerTool.ts` |

工具会自动被 Agent 调用，用于真实执行能力，而不是让模型"猜"。

> 📖 详细工具文档请查看 [tools/README.md](./tools/README.md)

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

### ✔ 6. 任务规划与执行可视化（06 / 07 项目）
- **任务规划步骤面板**：实时展示 AI 的思考链路
  - 解析需求 → 工具链路 → 生成答复
  - 流式动画效果，逐字显示
- **工具执行日志面板**：详细记录工具调用过程
  - 工具名称、参数、结果、错误信息
  - 实时耗时统计（运行中工具实时更新）
  - 状态可视化（运行中/完成/失败）
- **简洁模式**：一键切换，专注聊天体验

---

## 🎯 Demo 列表（持续更新中）

### **1️⃣ Calculator Bot（计算器智能体）**
- ✅ 支持四则运算（加减乘除）
- ✅ 自动识别数学表达式
- ✅ 工具反制 + 参数修正
- 📁 路径：`01-Chat-Calculator-Bot/`

---

### **2️⃣ Unit Converter（单位换算智能体）**
- ✅ 支持 cm ⇆ m（长度）
- ✅ 支持 kg ⇆ g（质量）
- ✅ 支持 C ⇆ F（温度）
- ✅ 工具反制 + 参数修正
- 📁 路径：`02-Chat-UnitConverter/`

---

### **3️⃣ Weather Bot（天气查询智能体）**
- ✅ 天气查询（Mock 数据）
- ✅ 自动生成穿衣/出行建议
- ✅ 多工具协作（天气 + 单位转换）
- 📁 路径：`03-AI-Weather-Bot/`

---

### **4️⃣ AI Assistant Mini（多功能集成助手）**
- ✅ 集成所有工具（计算器 + 单位转换 + 天气）
- ✅ 结构化 JSON 输出
- ✅ 提示消息系统
- ✅ 调试面板
- 📁 路径：`04-AI-Assistant-Mini/`

---

### **5️⃣ AI Planning（任务规划智能体）**
- ✅ 任务规划链路
- ✅ 多步骤执行
- ✅ 工具链协调
- 📁 路径：`05-AI-Planning/`

---

### **6️⃣ Chat Travel Assistant（旅行助手）⭐ 场景最完整**

**最完整的 AI Agent 实现，包含所有最新功能特性**

#### 核心功能
- ✅ **多工具集成**：计算器 + 单位转换 + 天气 + 出行建议
- ✅ **任务规划链路**：解析需求 → 工具链路 → 生成答复
- ✅ **工具反制机制**：自动修复参数并重试
- ✅ **流式输出**：SSE 实时响应，打字机效果

#### 可视化面板（独有特性）
- ✅ **任务规划步骤面板**
  - 🎬 流式动画效果（逐字显示，带闪烁光标）
  - 📜 自动滚动到最新步骤
  - 🎨 美观的步骤卡片布局
  - 📊 实时展示 AI 思考过程

- ✅ **工具执行日志面板**
  - 🎴 卡片式布局，每个工具调用独立展示
  - 🟦 状态指示：运行中（蓝色）/ 完成（绿色）/ 失败（红色）
  - ⏱️ **工具调用耗时展示**（实时更新，支持毫秒级精度）
  - 📝 详细记录：工具名称、参数、结果、错误信息
  - 🔄 运行中工具实时更新耗时（每 100ms 刷新）

#### 用户体验优化
- ✅ **简洁模式开关**：一键隐藏/显示执行面板，专注聊天体验
- ✅ **显示推理过程开关**：可选择性查看 AI 推理细节
- ✅ **实时滚动**：新内容自动滚动到底部，确保可见性
- ✅ **性能监控**：工具调用耗时实时追踪，便于性能分析

#### 技术亮点
- 🎯 完整的 AI Execution Hooks 系统
- 🔧 统一的工具库集成（`tools/` 目录）
- 📦 TypeScript 完整类型支持
- 🎨 Vue 3 Composition API 最佳实践

📁 路径：`06-Chat-Travel-Assistant/`

---

### **7️⃣ Agent WorkFlow（任务工作流智能体）⭐ 规划链路推荐**

**专注“任务拆解 + 工具链执行” 的工作流级 Agent Demo，主打 todoPlannerTool 的使用方式**

#### 核心功能
- ✅ 使用 `todoPlannerTool` 将模型“内心规划”的任务列表解析为结构化 steps（id/title/status）
- ✅ 将工具返回的 steps **直接渲染到「任务规划步骤」面板**，可视化完整工作流
- ✅ 支持多工具协作（计算器 / 单位换算 / 天气 / 出行建议等）
- ✅ 任务链执行状态可视化（pending / running / done）

#### 主要看点
- 🧩 如何把「工具返回值」自然融合进 UI（而不是只看日志）
- 🧠 如何约束模型：先在思考里拆 task，再把结果交给工具处理
- 🪜 适合作为以后接企业级流程编排 / DAG / Orchestrator 的基础 Demo

📁 路径：`07-Agent-WorkFlow/`

> 💡 **推荐学习路径：01 → 05 打基础，06 看完整场景，07 看任务工作流的最佳实践**

---

## 🚀 如何运行

每个项目都是独立可运行的，进入对应目录即可：

### 快速开始（推荐从 06 开始体验）

```bash
# 进入最新最全的旅行助手项目
cd 06-Chat-Travel-Assistant
npm install
npm run dev
```

### 其他项目

```bash
# 计算器智能体
cd 01-Chat-Calculator-Bot
npm install
npm run dev

# 单位转换智能体
cd 02-Chat-UnitConverter
npm install
npm run dev

# 天气查询智能体
cd 03-AI-Weather-Bot
npm install
npm run dev

# 多功能集成助手
cd 04-AI-Assistant-Mini
npm install
npm run dev

# 任务规划智能体
cd 05-AI-Planning
npm install
npm run dev
```

### 环境变量配置

所有项目都需要配置 API Key，在项目根目录创建 `.env` 文件：

```bash
VITE_DEEPSEEK_API_KEY=your_api_key_here
```

> 📝 如果没有 API Key，可以查看各项目的 README 了解如何获取

---

## 🛠 未来规划（持续迭代）

* [x] 多工具协作 Agent（Multi-Tool Agent）✅
* [x] 基于计划的智能体（Planner Agent）✅
* [x] 任务规划与执行可视化 ✅
* [x] 工具调用耗时展示 ✅
* [x] 简洁模式开关 ✅
* [ ] 真实天气 API 版本
* [ ] 真实 HTTP 工具支持（fetchTool）
* [ ] AI 自动生成工具参数（参数推断）
* [ ] 大型任务链路 Demo（完整 agent pipeline）
* [ ] Chat UI 通用组件库
* [ ] 工具调用性能分析面板
* [ ] 多 Agent 协作框架

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



