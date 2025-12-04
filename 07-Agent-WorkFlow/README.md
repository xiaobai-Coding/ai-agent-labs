# 🧩 Agent WorkFlow - 任务规划工作流智能体

> todoPlannerTool + 多工具链 + 可视化工作流（AI Agent Labs 进阶场景）

---

## 📌 项目简介

**Agent WorkFlow** 专注于“任务拆解 + 工具编排 + 工作流可视化”。  
核心思想：把模型在内心拆解好的步骤交给 `todoPlannerTool`，并 **直接把返回的结构化 steps 显示在任务规划面板**，让用户清楚看到 AI 的执行链路。

项目目标：
- 演示如何规范模型思考 → 统一工具返回格式 → 驱动 UI 工作流
- 为企业级流程编排 / DAG Orchestrator 打下 Demo 级实践基础

---

## 🎯 核心能力

- ✅ **todoPlannerTool 首调用**：系统提示词强制模型先拆任务，再调用工具
- ✅ **结构化步骤可视化**：`todoPlannerTool` 的 `{ steps: TodoStep[] }` 直接渲染到步骤面板
- ✅ **多工具链执行**：calculator / unitConverter / weatherTool / travelAdviceTool 均可接入
- ✅ **Execution Hooks**：onPlanningUpdate + onToolEvent 全程回调
- ✅ **流式回复 + 工具反制**：沿用 06 项目的完整 AI 基础设施

---

## ✨ 亮点功能

### 1. todoPlannerTool → 任务规划面板（本项目重点）

```json
{
  "steps": [
    { "id": 1, "title": "查询明天广州的天气信息", "status": "pending" },
    { "id": 2, "title": "查询后天广州的天气信息", "status": "pending" },
    { "id": 3, "title": "根据明天天气生成穿衣建议", "status": "pending" }
  ]
}
```

以上结果会被实时转换成任务规划面板中的逐条打字动画，和基础阶段提示（🧠 intent / 💡 tool / 📝 answer）一起呈现。

### 2. 工具执行日志（与 06 项目同款）
- 卡片式布局 + 状态彩色徽章
- 实时耗时 & 运行中动态刷新
- 支持参数 / 结果 / 错误详情展开

### 3. 简洁模式 & 推理开关
- 简洁模式隐藏规划 + 日志面板
- 推理开关可控地展示 `debug_reasoning`

---

## 📽️ Demo 场景示例

```
用户：帮我安排广州 2 天出行计划，包含天气、穿衣建议和最终总结

🧠 todoPlannerTool 返回的 steps：
1. 查询明天广州的天气信息
2. 查询后天广州的天气信息
3. 根据明天天气生成穿衣建议
4. 根据后天天气生成穿衣建议
5. 整理所有信息并输出最终结果

🔧 工具执行日志：
① 调用 weatherTool { city: "广州", date: "明天" } → ✅ 248ms
② 调用 travelAdviceTool { temp: 24, weather: "阵雨" } → ✅ 12ms
...

📝 最终回复：
{
  "judgement": "has_evidence",
  "result": "...",
  "confidence": 0.86,
  "debug": "天气+出行建议流程执行成功"
}
```

---

## 🚀 快速开始

```bash
cd 07-Agent-WorkFlow
npm install
npm run dev
```

### 环境变量

在 `.env.local` 中配置：
```env
VITE_AI_API_KEY=your_deepseek_key
VITE_AI_API_BASE_URL=https://api.deepseek.com
VITE_APP_TITLE=Agent WorkFlow
VITE_APP_DEBUG=false
```

---

## 🛠️ 技术栈

- Vue 3 + Vite + TypeScript
- DeepSeek Chat Completions + SSE
- 全局工具库：`tools/`（calculator / unitConverter / weather / travelAdvice / todoPlanner）

---

## 📁 项目结构

```
07-Agent-WorkFlow/
├── src/
│   ├── components/
│   │   ├── ChatComponent.vue   # 任务规划可视化 + 工具日志 + todoPlanner 渲染
│   │   ├── SSEDebugPanel.vue
│   │   └── HelloWorld.vue
│   ├── services/
│   │   └── aiService.ts        # Execution Hooks + 工具处理
│   ├── types/
│   ├── utils/
│   │   ├── tools.ts            # re-export ../../tools
│   │   ├── utils.ts
│   │   └── tips.ts
│   ├── App.vue
│   └── main.ts
├── public/
├── index.html
├── tsconfig.app.json           # include ../../tools/**/*.ts
└── vite.config.ts
```

---

## 🔧 工具调用策略

| 场景 | 使用工具 |
|------|----------|
| 数学 / 预算 | `calculator` |
| 单位换算 | `unitConverter` |
| 天气查询 | `weatherTool` |
| 穿衣 / 物品建议 | `travelAdviceTool` |
| 任务拆解 | `todoPlannerTool`（必须最先调用） |

> todoPlannerTool 负责把模型想好的任务列表格式化，返回 `{ steps: TodoStep[] }`，UI 直接消费。

---

## 🧠 Execution Hooks & UI 交互

- `onPlanningUpdate` → 渲染基础阶段（intent/tool/answer）
- `onToolEvent` → 记录工具日志；成功时，如果 `toolName === "todoPlannerTool"`，则调用 `renderTodoPlannerResult` 将 `steps` 注入规划面板
- 逐字流式动画 + 自动滚动 + 简洁模式切换

---

## 📝 开发建议

1. **新工具接入**：在 `tools/` 添加函数 → `tools/index.ts` 导出 → `aiService.ts` 注册 `functionDefinitions` & `availableFunctions`
2. **自定义规划展示**：修改 `renderTodoPlannerResult`，可根据业务对 steps 加标签或状态
3. **系统提示词约束**：`SYSTEM_PROMPT` 中明确要求“先拆解任务，再把结果传给 todoPlannerTool”
4. **多轮任务**：可结合 `status` 字段做“已完成”勾选等扩展

---

## 🔍 对比 06-Chat-Travel-Assistant

| 对比项 | 06-旅游助手 | 07-Agent WorkFlow |
|--------|-------------|-------------------|
| 目标 | 场景最完整 | 工作流与规划最佳实践 |
| todoPlannerTool | 选用 | **强制首调用，返回值直接驱动 UI** |
| 任务面板 | 阶段提示 + 状态 | 阶段提示 + **结构化 steps 动态插入** |
| 教学侧重点 | 功能齐全、体验友好 | 规划链路、工具编排、可视化绑定 |

---

## 📄 License

MIT License
