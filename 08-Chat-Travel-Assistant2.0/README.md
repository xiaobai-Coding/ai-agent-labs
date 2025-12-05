# 🧩 Chat Travel Assistant 2.0 - 智能旅行规划助手

> 优化版旅行规划 Agent：任务拆解 + 工具编排 + 工作流可视化 + 结构化输出（AI Agent Labs 进阶场景）

---

## 📌 项目简介

**Chat Travel Assistant 2.0** 是一个专注于旅行与出行规划的智能助手，具备完整的任务拆解、工具编排和工作流可视化能力。

核心特性：
- **任务规划可视化**：通过 `todoPlannerTool` 将 AI 拆解的任务步骤实时展示在规划面板
- **多工具链执行**：集成天气查询、出行建议、交通时间估算、物品清单等工具
- **结构化输出**：强制模型输出标准 JSON 格式，包含判断依据和置信度
- **执行过程透明化**：实时展示任务规划步骤和工具执行日志，支持简洁模式切换

项目目标：
- 演示如何规范模型思考 → 统一工具返回格式 → 驱动 UI 工作流
- 为企业级流程编排 / DAG Orchestrator 打下 Demo 级实践基础
- 展示优化后的 SYSTEM_PROMPT 如何提升模型执行质量

---

## 🎯 核心能力

- ✅ **todoPlannerTool 首调用**：系统提示词强制模型先拆任务，再调用工具
- ✅ **结构化步骤可视化**：`todoPlannerTool` 的 `{ steps: TodoStep[] }` 直接渲染到步骤面板
- ✅ **多工具链执行**：calculator / unitConverter / weatherTool / travelAdviceTool / trafficTimeTool / packingListTool
- ✅ **Execution Hooks**：onPlanningUpdate + onToolEvent 全程回调
- ✅ **流式回复 + 工具反制**：支持递归工具调用，自动处理多轮工具链
- ✅ **结构化 JSON 输出**：强制模型输出标准格式，包含 judgement / result / reason / confidence / debug

---

## ✨ 亮点功能

### 1. todoPlannerTool → 任务规划面板（核心功能）

```json
{
  "steps": [
    { "id": 1, "title": "查询明天广州的天气信息", "status": "pending" },
    { "id": 2, "title": "查询后天广州的天气信息", "status": "pending" },
    { "id": 3, "title": "根据明天天气生成穿衣建议", "status": "pending" },
    { "id": 4, "title": "估算到广州的交通时间和距离", "status": "pending" },
    { "id": 5, "title": "生成出行物品清单", "status": "pending" }
  ]
}
```

以上结果会被实时转换成任务规划面板中的逐条打字动画，和基础阶段提示（🧠 intent / 💡 tool / 📝 answer）一起呈现。

### 2. 工具执行日志
- 卡片式布局 + 状态彩色徽章（⚙️ 运行中 / ✅ 成功 / ⚠️ 失败）
- 实时耗时显示 & 运行中动态刷新（每 100ms 更新）
- 支持参数 / 结果 / 错误详情展开
- 自动滚动到最新日志

### 3. 简洁模式 & 推理开关
- **简洁模式**：隐藏规划 + 日志面板，专注于对话内容
- **推理开关**：可控地展示 `debug_reasoning`，便于调试

### 4. 结构化 JSON 输出

所有最终回复必须遵循以下格式：

```json
{
  "judgement": "has_evidence" | "no_evidence",
  "result": null | "string",
  "reason": "string（简要说明判断和结论依据）",
  "confidence": 0.0 ~ 1.0,
  "debug": "不超过2行的简短推理摘要"
}
```

---

## 📽️ Demo 场景示例

```
用户：帮我安排广州 2 天出行计划，包含天气、穿衣建议、交通时间和物品清单

🧠 任务规划步骤：
📌 已为你拆解出 5 个可执行子任务：
1️⃣ 查询明天广州的天气信息
2️⃣ 查询后天广州的天气信息
3️⃣ 根据明天天气生成穿衣建议
4️⃣ 估算到广州的交通时间和距离（需天气信息）
5️⃣ 根据交通方式和天气生成物品清单

🔧 工具执行日志：
① ⚙️ 调用 weatherTool { city: "广州", date: "明天" } → ✅ 248ms
② ⚙️ 调用 weatherTool { city: "广州", date: "后天" } → ✅ 156ms
③ ⚙️ 调用 travelAdviceTool { temp: 24, weather: "阵雨" } → ✅ 12ms
④ ⚙️ 调用 trafficTimeTool { destination: "广州", weather: "阵雨" } → ✅ 89ms
⑤ ⚙️ 调用 packingListTool { transportMode: "高铁", temp: 24, weather: "阵雨" } → ✅ 45ms

📝 最终回复：
{
  "judgement": "has_evidence",
  "result": "根据查询结果，为您规划如下：\n\n【天气情况】\n明天：24℃，阵雨\n后天：26℃，多云\n\n【穿衣建议】\n...",
  "reason": "已通过 weatherTool、travelAdviceTool、trafficTimeTool、packingListTool 获取完整数据",
  "confidence": 0.92,
  "debug": "完成天气查询→建议生成→交通估算→物品清单的完整流程"
}
```

---

## 🚀 快速开始

```bash
cd 08-Chat-Travel-Assistant2.0
npm install
npm run dev
```

### 环境变量

在 `.env.local` 中配置：

```env
VITE_AI_API_KEY=your_deepseek_key
VITE_AI_API_BASE_URL=https://api.deepseek.com
VITE_APP_TITLE=Chat Travel Assistant 2.0
VITE_APP_DEBUG=false
```

---

## 🛠️ 技术栈

- **前端框架**：Vue 3 + Vite + TypeScript
- **AI 服务**：DeepSeek Chat Completions + SSE 流式响应
- **工具库**：全局共享 `tools/` 目录
  - `calculator` - 数学计算
  - `unitConverter` - 单位换算
  - `weatherTool` - 天气查询
  - `travelAdviceTool` - 出行建议
  - `todoPlannerTool` - 任务拆解
  - `trafficTimeTool` - 交通时间估算（需 weather 参数）
  - `packingListTool` - 物品清单生成

---

## 📁 项目结构

```
08-Chat-Travel-Assistant2.0/
├── src/
│   ├── components/
│   │   ├── ChatComponent.vue      # 任务规划可视化 + 工具日志 + todoPlanner 渲染
│   │   ├── SSEDebugPanel.vue     # SSE 调试面板
│   │   └── HelloWorld.vue
│   ├── services/
│   │   └── aiService.ts           # Execution Hooks + 工具处理 + 流式响应
│   ├── types/
│   │   └── chat.ts                # 消息类型定义
│   ├── utils/
│   │   ├── tools.ts               # re-export ../../tools
│   │   ├── utils.ts               # 工具函数（流式解析、打字机效果等）
│   │   └── tips.ts                # 提示语
│   ├── App.vue
│   └── main.ts
├── public/
├── index.html
├── tsconfig.app.json              # include ../../tools/**/*.ts
├── vite.config.ts
├── vercel.json                    # Vercel 部署配置
├── DEPLOY.md                      # 部署指南
└── DEPLOY_CHECKLIST.md            # 部署检查清单
```

---

## 🔧 工具调用策略

| 场景 | 使用工具 | 必填参数 | 说明 |
|------|----------|----------|------|
| 数学 / 预算计算 | `calculator` | `expression` | 支持四则运算 |
| 单位换算 | `unitConverter` | `value`, `from`, `to` | 长度、重量、温度等 |
| 天气查询 | `weatherTool` | `city`, `date` | date 支持"今天/明天/后天"或日期格式 |
| 出行建议 | `travelAdviceTool` | `temp`, `weather` | 基于温度和天气条件 |
| 交通时间估算 | `trafficTimeTool` | `destination`, `weather` | 默认起点北京，需提供目的地天气 |
| 物品清单生成 | `packingListTool` | `transportMode`, `temp`, `weather` | transportMode: 自驾/高铁/飞机/火车 |
| 任务拆解 | `todoPlannerTool` | `steps_text` | **必须最先调用**，多步骤任务前使用 |

> **重要提示**：
> - `todoPlannerTool` 必须在多步骤任务开始前调用
> - `trafficTimeTool` 需要 `weather` 参数，通常需要先调用 `weatherTool` 获取天气
> - `packingListTool` 需要完整的交通方式、温度和天气信息
> - 所有工具返回的数据为 mock 数据，用于演示

---

## 🧠 SYSTEM_PROMPT 优化要点

本项目对 SYSTEM_PROMPT 进行了优化，主要改进：

### 1. 清晰的决策规则
- 明确要求拆解任务为 3-7 步
- 优先使用工具，无工具时内部推理
- 每步执行后检查结果，不合理需重试

### 2. todoPlannerTool 使用规范
- 必须在多步骤任务开始前调用
- `steps_text` 必须是「已思考完成的明确子任务列表」
- 禁止将用户原话作为 `steps_text`

### 3. 工具失败处理
- 必须分析错误原因
- 修复参数并再次尝试
- 多次失败后内部推理替代

### 4. 结构化输出强制
- 所有最终回复必须是 JSON 格式
- 包含 `judgement`（证据判断）、`result`（结果）、`reason`（依据）、`confidence`（置信度）、`debug`（调试信息）

### 5. 禁止行为明确
- ✘ 直接拒绝执行
- ✘ 一次性输出全部答案跳过步骤
- ✘ 将用户原话作为 steps_text
- ✘ 输出非 JSON 文本
- ✘ 胡编乱造数据（除非明确允许模拟）

---

## 🧠 Execution Hooks & UI 交互

### Planning Hooks
- `onPlanningUpdate` → 渲染基础阶段（intent/tool/answer）
  - `stage`: "intent" | "tool" | "answer"
  - `status`: "pending" | "running" | "completed" | "error"
  - `detail`: 可选详情说明

### Tool Hooks
- `onToolEvent` → 记录工具日志
  - `type`: "start" | "success" | "error"
  - `toolName`: 工具名称
  - `args`: 工具参数
  - `result`: 执行结果（success 时）
  - `error`: 错误信息（error 时）
  - `startTime` / `duration`: 执行耗时

### UI 交互特性
- **逐字流式动画**：任务规划步骤和最终回复支持打字机效果
- **自动滚动**：规划步骤和工具日志自动滚动到最新内容
- **简洁模式切换**：一键隐藏/显示详细过程面板
- **实时耗时显示**：工具执行过程中每 100ms 更新耗时

### todoPlannerTool 特殊处理
当 `toolName === "todoPlannerTool"` 且执行成功时，系统会：
1. 解析返回的 `steps` 数组
2. 调用 `renderTodoPlannerResult` 将步骤注入规划面板
3. 每个步骤以打字机效果逐字显示

---

## 📝 开发建议

### 1. 新工具接入流程
1. 在 `tools/` 目录创建工具文件（如 `newTool.ts`）
2. 实现工具函数和 `FunctionDefinition`
3. 在 `tools/index.ts` 中导出并添加到 `availableFunctions`
4. 在 `aiService.ts` 的 `functionDefinitions` 数组中注册
5. 更新 `SYSTEM_PROMPT` 说明工具使用规则（如需要）

### 2. 自定义规划展示
修改 `ChatComponent.vue` 中的 `renderTodoPlannerResult` 函数，可根据业务需求：
- 为 steps 添加标签或状态图标
- 自定义步骤显示样式
- 添加步骤完成状态追踪

### 3. SYSTEM_PROMPT 调优
- 根据实际使用情况调整决策规则
- 明确各工具的参数要求和调用顺序
- 强调结构化输出的重要性
- 定期检查禁止行为列表是否完整

### 4. 多轮任务扩展
- 可结合 `status` 字段实现步骤完成状态追踪
- 支持步骤重试和跳过
- 添加任务进度百分比显示

---

## 🔍 对比其他项目

| 对比项 | 06-Chat-Travel-Assistant | 07-Agent-WorkFlow | 08-Chat-Travel-Assistant2.0 |
|--------|-------------------------|-------------------|------------------------------|
| **目标** | 场景最完整 | 工作流与规划最佳实践 | **优化版：提示词优化 + 工具完善** |
| **todoPlannerTool** | 选用 | 强制首调用 | **强制首调用 + 优化提示** |
| **任务面板** | 阶段提示 + 状态 | 阶段提示 + 结构化 steps | **阶段提示 + 结构化 steps + 优化展示** |
| **工具数量** | 5 个 | 5 个 | **7 个（新增 trafficTimeTool、packingListTool）** |
| **输出格式** | 自由文本 | 自由文本 | **强制 JSON 结构化输出** |
| **SYSTEM_PROMPT** | 基础版 | 基础版 | **优化版：更清晰、更规范** |
| **教学侧重点** | 功能齐全、体验友好 | 规划链路、工具编排 | **提示词优化、工具集成、结构化输出** |

---

## 🚀 部署

本项目支持部署到 Vercel，详细步骤请参考：
- [DEPLOY.md](./DEPLOY.md) - 完整部署指南
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - 部署检查清单

### 快速部署命令

```bash
# 使用 Vercel CLI
vercel

# 或通过 GitHub 集成自动部署
# 1. 推送代码到 GitHub
# 2. 在 Vercel 中导入项目
# 3. 配置环境变量
# 4. 自动部署完成
```

---

## 📄 License

MIT License
