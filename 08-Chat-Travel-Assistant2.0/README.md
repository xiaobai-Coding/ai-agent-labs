# 🧩 Chat Travel Assistant 2.0 - 智能旅行规划助手

> 优化版旅行规划 Agent：任务拆解 + 工具编排 + 工作流可视化 + 结构化输出（AI Agent Labs 进阶场景）

---

## 📌 项目简介

**Chat Travel Assistant 2.0** 是一个专注于旅行与出行规划的智能助手，实现了**系统执行器 1.0**架构，具备完整的任务拆解、工具编排、工作流可视化和错误恢复能力。

核心特性：
- **系统执行器架构**：由系统（而非模型）驱动工具调用链，支持步骤依赖和多工具调用链
- **两阶段请求机制**：第一阶段强制模型输出 WorkflowPlan，第二阶段系统执行器接管执行
- **错误恢复机制**：步骤执行失败时自动调用模型修正参数并重试，不中断整个工作流
- **任务规划可视化**：实时展示任务规划步骤和工具执行日志，支持简洁模式切换
- **智能滚动优化**：自动监听面板高度变化，实时调整滚动位置，确保用户能看到最新内容
- **多工具链执行**：集成天气查询、出行建议、交通时间估算、物品清单等工具
- **结构化输出**：强制模型输出标准 JSON 格式，包含判断依据和置信度

项目目标：
- 演示系统执行器架构如何实现工作流编排
- 展示错误恢复机制如何提升工作流健壮性
- 为企业级流程编排 / DAG Orchestrator 打下 Demo 级实践基础
- 展示优化后的 SYSTEM_PROMPT 如何提升模型执行质量

---

## 🎯 核心能力

- ✅ **系统执行器架构**：由系统驱动工具调用，而非模型直接调用
- ✅ **两阶段请求机制**：第一阶段生成 WorkflowPlan，第二阶段系统执行器执行
- ✅ **工作流编排**：支持步骤依赖（depends_on）、多工具调用链、状态管理
- ✅ **错误恢复机制**：步骤执行失败时自动调用模型修正参数并重试
- ✅ **工具适配器模式**：解耦工具实现与工作流系统，支持工具复用
- ✅ **多工具链执行**：calculator / unitConverter / weatherTool / travelAdviceTool / trafficTimeTool / packingListTool
- ✅ **Execution Hooks**：onPlanningUpdate + onToolEvent 全程回调
- ✅ **流式回复**：SSE 实时响应，打字机效果
- ✅ **结构化 JSON 输出**：强制模型输出标准格式，包含 judgement / result / reason / confidence / debug
- ✅ **智能滚动**：自动监听面板高度变化，实时调整滚动位置

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
- **时间顺序显示**：最先调用的工具显示在第一个，最后调用的显示在最后
- 实时耗时显示 & 运行中动态刷新（每 100ms 更新）
- 支持参数 / 结果 / 错误详情展开
- 自动滚动到最新日志
- **错误恢复记录**：显示错误恢复过程和重试结果

### 3. 系统执行器架构（核心创新）

#### 工作流编排
- **WorkflowPlan**：模型生成结构化工作流计划
  ```json
  {
    "phase": "planning",
    "params": { "destination": "北京", "date": "2025-04-09", ... },
    "steps": [
      { "id": 1, "action": "查询天气", "tool": "weatherTool", "depends_on": [] },
      { "id": 2, "action": "生成建议", "tool": "travelAdviceTool", "depends_on": [1] }
    ]
  }
  ```

#### 错误恢复机制
- **自动错误捕获**：步骤执行失败时自动捕获错误，不中断整个工作流
- **错误分析**：构造包含步骤信息、当前参数、错误信息的提示消息
- **模型参数修正**：调用模型分析错误原因，返回修正后的 `WorkflowParams`
- **参数验证**：验证修正后的参数格式（destination, date, stay_days, transportation_preference）
- **自动重试**：使用修正后的参数更新 `context.params`，重置步骤状态为 `pending`，重新执行
- **工作流继续**：重试成功后继续执行后续步骤，确保工作流完成
- **降级处理**：如果模型无法修正参数（返回 null），则抛出错误

**错误恢复流程示例**：
```
1. weatherTool 执行失败：缺少 destination 参数
2. 系统捕获错误，调用 onStepErrorRecovery
3. 模型分析错误，返回修正后的 params: { destination: "北京", ... }
4. 系统更新 context.params，重置步骤状态
5. 重新执行 weatherTool，成功
6. 继续执行后续步骤
```

#### 两阶段请求
1. **第一阶段（规划阶段）**：
   - 不暴露工具（`includeTools: false`, `toolChoice: "none"`）
   - 强制模型只输出 WorkflowPlan JSON
   - 不输出到用户界面（避免显示规划步骤）
   - 如果检测到 WorkflowPlan，进入第二阶段
   - 如果未检测到 WorkflowPlan，降级到传统模式（允许工具调用）
   
2. **第二阶段（执行阶段）**：
   - 系统执行器接管，按 WorkflowPlan 执行工具链
   - **依赖检查**：自动检查步骤依赖，按顺序执行
   - **错误恢复**：步骤失败时自动调用模型修正参数并重试
   - **状态管理**：实时更新步骤状态（pending → running → done/error）
   - **实时更新 UI**：通过 Execution Hooks 更新规划步骤和工具日志
   
3. **第三阶段（答案生成）**：
   - 将工作流执行结果发送给模型
   - 模型生成用户友好的 JSON 格式回复
   - 流式输出到用户界面

**优势**：
- ✅ 避免模型在第一阶段直接调用工具
- ✅ 确保系统执行器完全控制工具调用
- ✅ 支持工作流编排和错误恢复
- ✅ 如果第一阶段未返回 WorkflowPlan，自动降级到传统模式
- ✅ 工作流执行过程完全透明，用户可以看到每个步骤的状态

### 4. 简洁模式 & 推理开关
- **简洁模式**：隐藏规划 + 日志面板，专注于对话内容
- **推理开关**：可控地展示 `debug_reasoning`，便于调试

### 5. 智能滚动优化
- **ResizeObserver 监听**：自动监听 `ai-status-panel` 高度变化
- **实时滚动调整**：面板高度变化时自动调整滚动位置
- **用户友好**：只在用户查看最新消息时自动调整，不打断浏览历史

### 6. 结构化 JSON 输出

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
# 可选：启用错误恢复测试模式
VITE_TEST_ERROR_RECOVERY=true
```

> 💡 **提示**：也可以通过 URL 参数 `?testErrorRecovery=true` 临时启用测试模式

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
│   │   └── ChatComponent.vue      # 任务规划可视化 + 工具日志 + 工作流展示
│   ├── services/
│   │   └── aiService.ts           # 两阶段请求 + 系统执行器 + 错误恢复 + 流式响应
│   ├── workflow/
│   │   ├── types.ts               # 工作流类型定义（WorkflowPlan, WorkflowStep 等）
│   │   └── executor.ts            # 工作流执行器（runWorkflow, 依赖检查, 状态管理）
│   ├── tools/
│   │   └── index.ts               # 工具适配器（将工作流参数转换为工具参数）
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
├── DEPLOY_CHECKLIST.md            # 部署检查清单
├── TEST_ERROR_RECOVERY.md         # 错误恢复机制测试指南
├── ERROR_RECOVERY_TEST_CASES.md   # 错误恢复测试用例
└── QUICK_TEST_GUIDE.md            # 快速测试指南
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

本项目对 SYSTEM_PROMPT 进行了深度优化，主要改进：

### 1. 清晰的参数提取规则
- **必填参数明确**：`destination` 和 `date` 是必填参数，必须从用户输入中提取或合理推断
- **参数格式要求**：`date` 必须转换为具体日期格式（YYYY-MM-DD）
- **默认值处理**：`from_city` 默认为"重庆"，`travel_days` 默认为 1，`transportation_preference` 默认为"飞机"
- **重要约束**：必填参数不能为空字符串或 null，必须从上下文推断

### 2. WorkflowPlan 输出格式
- **强制输出 WorkflowPlan**：模型必须输出符合 `WorkflowPlan` 结构的 JSON
- **步骤依赖**：明确说明步骤之间的依赖关系（`depends_on`）
- **工具选择**：为每个步骤选择正确的工具（weatherTool / trafficTimeTool / travelAdviceTool / packingListTool）
- **参数提取**：从用户输入中提取完整的 `WorkflowParams`
- **步骤数量**：根据用户需求灵活构造步骤，不固定数量

### 3. 错误恢复提示优化
- **详细错误信息**：包含步骤信息、当前参数、错误内容
- **修正指导**：明确说明如何修正不同类型的错误（缺失、格式错误、无效值）
- **参数格式要求**：详细说明修正后的参数格式和验证规则
- **返回格式**：要求返回 `{ "corrected_params": WorkflowParams | null }`

### 4. 结构化输出强制
- 所有最终回复必须是 JSON 格式
- 包含 `judgement`（证据判断）、`result`（结果）、`reason`（依据）、`confidence`（置信度）、`debug`（调试信息）
- `result` 字段内容要求精简，言简意赅
- 如果用户使用英文提问，请使用英文输出

### 5. 禁止行为明确
- ✘ 直接调用工具（第一阶段不暴露工具）
- ✘ 直接输出建议或最终 JSON（只生成可执行计划）
- ✘ 跳过天气或交通步骤（如果用户需求包含）
- ✘ 输出和格式不符的内容
- ✘ 将用户原话作为 steps_text

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

#### 在全局 tools/ 目录添加工具
1. 在 `tools/` 目录创建工具文件（如 `newTool.ts`）
2. 实现工具函数和 `FunctionDefinition`
3. 在 `tools/index.ts` 中导出并添加到 `availableFunctions`
4. 在 `aiService.ts` 的 `functionDefinitions` 数组中注册

#### 在工作流系统中添加工具适配器
1. 在 `src/tools/index.ts` 中创建工具适配器函数
2. 从 `WorkflowContext` 和 `WorkflowStep` 中提取参数
3. 调用原始工具函数
4. 在 `tools: ToolRegistry` 中注册适配器

**示例**：
```typescript
// src/tools/index.ts
const newToolAdapter = async (ctx: WorkflowContext, step: WorkflowStep) => {
  const param = ctx.params.someParam;
  if (!param) {
    throw new Error("newTool 需要 someParam 参数");
  }
  return newTool({ param });
};

export const tools: ToolRegistry = {
  // ... 其他工具
  newTool: newToolAdapter
};
```

### 2. 自定义规划展示
修改 `ChatComponent.vue` 中的 `renderTodoPlannerResult` 函数，可根据业务需求：
- 为 steps 添加标签或状态图标
- 自定义步骤显示样式
- 添加步骤完成状态追踪

### 3. SYSTEM_PROMPT 调优
- 根据实际使用情况调整参数提取规则
- 明确各工具的参数要求和调用顺序
- 强调 WorkflowPlan 输出格式的重要性
- 优化错误恢复提示消息，提高参数修正成功率
- 定期检查禁止行为列表是否完整

### 4. 错误恢复机制调优
- 优化错误恢复提示消息，提供更详细的指导
- 根据实际错误类型调整参数验证逻辑
- 考虑添加重试次数限制，避免无限循环
- 记录错误恢复成功率，持续优化

### 5. 工作流编排扩展
- 支持更复杂的依赖关系（多级依赖）
- 添加步骤并行执行能力
- 支持条件分支（根据步骤结果决定后续步骤）
- 添加工作流暂停和恢复功能

---

## 🔍 对比其他项目

| 对比项 | 06-Chat-Travel-Assistant | 07-Agent-WorkFlow | 08-Chat-Travel-Assistant2.0 |
|--------|-------------------------|-------------------|------------------------------|
| **架构** | 模型直接调用工具 | 模型直接调用工具 | **系统执行器架构** |
| **工具调用** | 模型 Function Calling | 模型 Function Calling | **系统驱动工具调用** |
| **工作流编排** | ❌ | ❌ | **✅ 支持步骤依赖、多工具链** |
| **错误恢复** | 工具反制（参数修正） | 工具反制（参数修正） | **系统级错误恢复（不中断工作流）** |
| **请求机制** | 单阶段 | 单阶段 | **两阶段（WorkflowPlan + 系统执行）** |
| **工具数量** | 5 个 | 5 个 | **7 个（新增 trafficTimeTool、packingListTool）** |
| **输出格式** | 自由文本 | 自由文本 | **强制 JSON 结构化输出** |
| **SYSTEM_PROMPT** | 基础版 | 基础版 | **优化版：更清晰、更规范** |
| **智能滚动** | 基础滚动 | 基础滚动 | **ResizeObserver 自动调整** |
| **工具日志顺序** | 倒序（最新在前） | 倒序（最新在前） | **正序（最先调用在前）** |
| **教学侧重点** | 功能齐全、体验友好 | 规划链路、工具编排 | **系统执行器、工作流编排、错误恢复** |

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
