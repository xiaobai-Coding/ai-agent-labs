# 🧳 Chat Travel Assistant - 旅行智能助手

> 基于 DeepSeek API + Function Calling 的完整 AI Agent 实现（最新最全版本）

---

## 📌 项目简介

**Chat Travel Assistant** 是一个功能完整的 AI 智能助手，集成了计算器、单位转换、天气查询、出行建议等多种工具能力。这是 **AI Agent Labs** 中最完整的实现，展示了现代 AI Agent 的所有核心特性，包括**任务规划可视化**、**工具执行监控**、**性能分析**等高级功能。

### 核心能力

- ✅ **多工具集成**：计算器 + 单位转换 + 天气查询 + 出行建议
- ✅ **任务规划链路**：解析需求 → 工具链路 → 生成答复（完整可视化）
- ✅ **智能工具选择**：AI 自动识别需求，选择合适的工具
- ✅ **流式输出**：支持 SSE 流式响应，提供实时打字机效果
- ✅ **工具反制机制**：工具调用失败时自动修复参数并重试
- ✅ **提示系统**：内置美观的提示消息系统（info/success/warning/error）
- ✅ **上下文记忆**：支持多轮对话，保持上下文连贯性

### 🎯 独有特性（相比其他项目）

- ✨ **任务规划步骤面板**：实时展示 AI 的思考过程
  - 流式动画效果（逐字显示，带闪烁光标）
  - 自动滚动到最新步骤
  - 美观的步骤卡片布局
  
- ✨ **工具执行日志面板**：详细记录每次工具调用
  - 卡片式布局，每个工具调用独立展示
  - 状态指示：运行中（蓝色）/ 完成（绿色）/ 失败（红色）
  - **工具调用耗时展示**（实时更新，支持毫秒级精度）
  - 详细记录：工具名称、参数、结果、错误信息
  - 运行中工具实时更新耗时（每 100ms 刷新）

- ✨ **简洁模式开关**：一键隐藏/显示执行面板，专注聊天体验
- ✨ **实时滚动**：新内容自动滚动到底部，确保可见性
- ✨ **性能监控**：工具调用耗时实时追踪，便于性能分析

---

## 🎯 功能演示

### 1. 天气查询 + 出行建议

```
用户: "明天上海天气如何？需要带什么？"

🧠 任务规划步骤：
1) 🧠 解析需求 · 完成：识别为天气查询和出行建议需求
2) 💡 工具链路 · 完成：需要调用 weatherTool 和 travelAdviceTool
3) 📝 生成答复 · 完成：综合天气和出行建议生成回复

🔧 工具执行日志：
① ⚙️ 调用 weatherTool · 运行中 → ✅ 完成 (245ms)
   参数：{city: "上海", date: "明天"}
   结果：{temperature: 12, weather: "小雨", ...}
② ⚙️ 调用 travelAdviceTool · 运行中 → ✅ 完成 (12ms)
   参数：{temp: 12, weather: "小雨"}
   结果：{summary: "...", clothing: "...", essentials: [...]}

AI: 明天上海：小雨 🌧️，温度 12°C，建议穿轻便防雨外套，长袖衣物。
必备物品：雨伞、防水鞋。
```

### 2. 多工具协作

```
用户: "帮我算一下 123 加 456，然后转换成米是多少？"

🧠 任务规划步骤：
1) 🧠 解析需求 · 完成：识别为计算和单位转换需求
2) 💡 工具链路 · 完成：需要调用 calculator 和 unitConverter
3) 📝 生成答复 · 完成：综合计算结果生成回复

🔧 工具执行日志：
① ⚙️ 调用 calculator · 运行中 → ✅ 完成 (15ms)
   参数：{num1: 123, num2: 456, operation: "add"}
   结果：579
② ⚙️ 调用 unitConverter · 运行中 → ✅ 完成 (8ms)
   参数：{value: 579, from: "cm", to: "m"}
   结果：{value: 5.79, unit: "m"}

AI: 123 + 456 = 579，579 厘米 = 5.79 米。
```

### 3. 简洁模式

开启简洁模式后，任务规划步骤和工具执行日志面板会自动隐藏，界面更加简洁，专注于聊天体验。

---

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
VITE_AI_API_KEY=your_deepseek_api_key
VITE_AI_API_BASE_URL=https://api.deepseek.com
VITE_APP_TITLE=AI 迷你助手
VITE_APP_DEBUG=false
```

### 运行项目

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

---

## 🚀 部署到 Vercel

### 方式一：通过 Vercel CLI（推荐）

1. **安装 Vercel CLI**
```bash
npm i -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **在项目目录下部署**
```bash
cd 06-Chat-Travel-Assistant
vercel
```

4. **配置环境变量**
```bash
vercel env add VITE_AI_API_KEY
vercel env add VITE_AI_API_BASE_URL
vercel env add VITE_APP_TITLE
vercel env add VITE_APP_DEBUG
```

或者通过 Vercel 控制台添加环境变量：
- 进入项目设置 → Environment Variables
- 添加以下环境变量：
  - `VITE_AI_API_KEY`: 你的 DeepSeek API Key
  - `VITE_AI_API_BASE_URL`: `https://api.deepseek.com`
  - `VITE_APP_TITLE`: `个人旅行助手`（可选）
  - `VITE_APP_DEBUG`: `false`（可选）

5. **重新部署**
```bash
vercel --prod
```

### 方式二：通过 GitHub 集成（推荐）

1. **推送代码到 GitHub**
```bash
git add .
git commit -m "准备部署到 Vercel"
git push origin main
```

2. **在 Vercel 中导入项目**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "Add New Project"
   - 选择你的 GitHub 仓库
   - 选择 `06-Chat-Travel-Assistant` 目录作为根目录

3. **配置项目**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`（自动检测）
   - Output Directory: `dist`（自动检测）
   - Install Command: `npm install`（自动检测）

4. **添加环境变量**
   - 在项目设置中添加环境变量（见方式一第4步）

5. **部署**
   - 点击 "Deploy"，Vercel 会自动构建和部署

### 环境变量说明

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `VITE_AI_API_KEY` | DeepSeek API Key | ✅ 是 | - |
| `VITE_AI_API_BASE_URL` | API 基础 URL | ❌ 否 | `https://api.deepseek.com` |
| `VITE_APP_TITLE` | 应用标题 | ❌ 否 | `DeepSeek AI聊天` |
| `VITE_APP_DEBUG` | 调试模式 | ❌ 否 | `false` |

> 📝 **注意**：环境变量必须以 `VITE_` 开头，Vite 才会在构建时将其注入到客户端代码中。

### 部署后访问

部署成功后，Vercel 会提供一个 URL，例如：
```
https://your-project-name.vercel.app
```

### 自定义域名

1. 在 Vercel 项目设置中，进入 "Domains"
2. 添加你的自定义域名
3. 按照提示配置 DNS 记录

### 持续部署

- 每次推送到 GitHub 的 `main` 分支，Vercel 会自动重新部署
- 可以通过 Vercel Dashboard 查看部署历史和日志

---

## 🛠️ 技术栈

- **前端框架**：Vue 3 (Composition API)
- **构建工具**：Vite
- **语言**：TypeScript
- **AI 服务**：DeepSeek API
- **通信协议**：SSE (Server-Sent Events)

---

## 📁 项目结构

```
06-Chat-Travel-Assistant/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── ChatComponent.vue    # 聊天主组件（包含任务规划和工具日志面板）
│   │   ├── SSEDebugPanel.vue    # 调试面板
│   │   └── HelloWorld.vue       # 示例组件
│   ├── services/            # 服务层
│   │   └── aiService.ts         # AI 服务封装（包含 Execution Hooks）
│   ├── types/               # TypeScript 类型定义
│   │   └── chat.ts
│   ├── utils/               # 工具函数
│   │   ├── tools.ts             # 工具函数重导出（从 ../../tools）
│   │   ├── utils.ts             # 通用工具函数
│   │   └── tips.ts              # 提示消息系统
│   ├── App.vue              # 根组件
│   └── main.ts              # 入口文件
├── public/                  # 静态资源
├── index.html               # HTML 模板
├── vite.config.ts           # Vite 配置
├── tsconfig.app.json        # TypeScript 配置（包含 tools/ 目录）
└── package.json             # 项目配置
```

> 📝 注意：工具函数统一从 `../../tools` 目录导入，实现代码复用

---

## 🔧 工具定义

所有工具统一从 `tools/` 目录导入，详见 [tools/README.md](../../tools/README.md)

### 1. Calculator Tool

**工具名称**：`calculator`

**功能**：数学四则运算

**参数**：
```typescript
{
  num1: number,
  num2: number,
  operation: "add" | "subtract" | "multiply" | "divide"
}
```

### 2. Unit Converter Tool

**工具名称**：`unitConverter`

**功能**：单位转换（长度、质量、温度）

**参数**：
```typescript
{
  value: number,
  from: "cm" | "m" | "kg" | "g" | "C" | "F",
  to: "cm" | "m" | "kg" | "g" | "C" | "F"
}
```

### 3. Weather Tool

**工具名称**：`weatherTool`

**功能**：天气查询（当前为 mock 数据）

**参数**：
```typescript
{
  city: string,
  date: string  // "今天" | "明天" | "后天" | "YYYY-MM-DD"
}
```

**返回数据**：
```typescript
{
  city: string,
  date: string,
  temperature: number,
  weather: string,
  icon: string,
  humidity: number,
  windSpeed: string,
  windDirection: string,
  airQuality: string,
  suggestion: string,
  updateTime: string
}
```

### 4. Travel Advice Tool ⭐ 新增

**工具名称**：`travelAdviceTool`

**功能**：根据温度和天气描述生成出行建议

**参数**：
```typescript
{
  temp: number,      // 温度（摄氏度）
  weather: string    // 天气描述，例如 "晴天", "小雨", "多云"
}
```

**返回数据**：
```typescript
{
  summary: string,        // 简要建议摘要
  clothing: string,       // 穿衣建议
  essentials: string[]    // 必备物品清单
}
```

**示例**：
```typescript
travelAdviceTool({ temp: 8, weather: "小雨" })
// 返回：
{
  summary: "根据当前 8°C，小雨 的天气情况，您的出行建议如下：",
  clothing: "天气寒冷，建议穿厚外套、毛衣。轻便防雨外套，长袖衣物",
  essentials: ["雨伞", "防水鞋"]
}
```

---

## 🧠 Agent 工作流程

### 任务规划链路（可视化）

本项目实现了完整的任务规划链路，并通过可视化面板实时展示：

1. **🧠 解析需求（Intent）**
   - AI 分析用户输入，理解需求
   - 在任务规划面板中显示："🧠 解析需求 · 完成"

2. **💡 工具链路（Tool）**
   - AI 规划需要调用的工具
   - 在任务规划面板中显示："💡 工具链路 · 完成"
   - 在工具执行日志面板中记录每次工具调用

3. **📝 生成答复（Answer）**
   - AI 综合工具结果，生成最终回复
   - 在任务规划面板中显示："📝 生成答复 · 完成"

### 工具调用流程

1. **用户输入** → 自然语言需求
2. **任务规划** → AI 分析需求，规划工具调用链路（可视化展示）
3. **工具调用** → 自动调用相应工具（可能多个）
   - 实时记录到工具执行日志面板
   - 显示工具调用耗时（实时更新）
4. **结果处理** → LLM 处理工具结果
5. **流式输出** → 通过 SSE 流式返回给用户

### 工具选择规则

根据系统提示词，工具调用规则如下：

- **数学运算** → 调用 `calculator`
- **单位转换** → 调用 `unitConverter`
- **天气相关**（穿衣、天气、气温、温度、冷不冷、热不热） → 调用 `weatherTool`
- **出行建议**（需要带什么、穿衣建议、出行建议） → 调用 `travelAdviceTool`

### AI Execution Hooks

本项目实现了完整的 AI Execution Hooks 系统，用于实时追踪 AI 执行过程：

```typescript
interface AIExecutionHooks {
  onPlanningUpdate?: (payload: PlanningUpdatePayload) => void;
  onToolEvent?: (event: ToolEventPayload) => void;
}
```

- **onPlanningUpdate**：任务规划步骤更新时触发
- **onToolEvent**：工具调用事件触发（start/success/error）

---

## 🎨 特性亮点

### 1. 任务规划步骤面板 ⭐ 独有

实时展示 AI 的思考过程，包含三个阶段：

- **🧠 解析需求**：AI 理解用户意图
- **💡 工具链路**：AI 规划需要调用的工具
- **📝 生成答复**：AI 综合结果生成回复

**特性**：
- ✨ 流式动画效果：逐字显示，带闪烁光标
- 📜 自动滚动：新步骤自动滚动到底部
- 🎨 美观布局：步骤卡片，渐变数字徽章
- 🔄 实时更新：每个阶段完成后立即显示

### 2. 工具执行日志面板 ⭐ 独有

详细记录每次工具调用的完整过程：

**展示内容**：
- 工具名称和图标
- 调用状态：运行中（蓝色）/ 完成（绿色）/ 失败（红色）
- **工具调用耗时**：实时更新（运行中工具每 100ms 刷新）
- 调用参数：格式化显示
- 执行结果：格式化显示
- 错误信息：失败时显示

**特性**：
- 🎴 卡片式布局：每个工具调用独立卡片
- ⏱️ 实时耗时：运行中工具实时更新耗时
- 📊 状态可视化：颜色编码，一目了然
- 🔍 详细信息：参数和结果可展开查看

### 3. 简洁模式开关 ⭐ 独有

一键切换界面模式：

- **关闭简洁模式**：显示任务规划步骤和工具执行日志面板
- **开启简洁模式**：隐藏所有执行面板，专注聊天体验

适合不同使用场景：
- 开发调试：关闭简洁模式，查看详细执行过程
- 日常使用：开启简洁模式，享受简洁界面

### 4. 提示消息系统

内置美观的提示消息系统，支持：

```typescript
import { tips } from '../utils/tips';

tips.info('这是一条信息提示');
tips.success('操作成功！');
tips.warning('请注意...');
tips.error('发生错误');
```

### 5. 多工具协调

AI 能够智能识别需要多个工具的场景：

```
用户: "明天上海天气如何？需要带什么？"

1. 识别需要两个工具：
   - weatherTool（查询天气）
   - travelAdviceTool（生成出行建议）

2. 协调调用两个工具
   - 先调用 weatherTool 获取天气
   - 再调用 travelAdviceTool 生成建议

3. 综合结果生成最终回复
```

### 6. 工具反制机制

当工具调用失败时：
1. 捕获错误信息
2. 将错误反馈给 LLM
3. LLM 分析错误并修复参数
4. 自动发起第二次工具调用

### 7. 性能监控 ⭐ 独有

实时追踪工具调用性能：

- **耗时统计**：每个工具调用的精确耗时
- **实时更新**：运行中工具实时更新耗时
- **格式化显示**：毫秒/秒/分钟自动格式化
- **性能分析**：便于识别性能瓶颈

---

## 💡 开发说明

### 添加新工具

1. 在 `tools/` 目录下创建新工具文件（如 `tools/newTool.ts`）
2. 实现工具函数和 `FunctionDefinition`
3. 在 `tools/index.ts` 中导出工具
4. 在 `src/services/aiService.ts` 中导入并注册到 `functionDefinitions`
5. 在 `availableFunctions` 中注册工具执行函数
6. 更新系统提示词，添加工具调用规则

> 📝 详细步骤请参考 [tools/README.md](../../tools/README.md)

### 自定义输出格式

修改 `src/components/ChatComponent.vue` 中的 `SYSTEM_PROMPT`：

```typescript
const SYSTEM_PROMPT = `
你是一个数字助理...
【最终输出格式要求】：
{
  "judgement": "...",
  "result": "...",
  ...
}
`;
```

### 集成真实天气 API

当前使用模拟数据，可以替换为真实 API：

```typescript
// src/utils/tools.ts
export const weatherTool = async (params: { date: string; city: string }) => {
  const response = await axios.get('https://api.openweathermap.org/...');
  // 处理真实 API 响应
  return { ... };
};
```

### 自定义配置

修改 `src/services/aiService.ts` 中的配置：

```typescript
const config = {
  model: "deepseek-chat",
  temperature: 0.3,
  max_tokens: 300
};
```

---

## 📝 注意事项

- **输出格式**：所有回复必须符合 JSON 格式要求
- **工具调用**：必须遵循系统提示词中的工具调用规则
- **天气数据**：当前使用模拟数据，每次查询结果可能不同
- **置信度**：confidence 字段表示 AI 对回答的信心程度
- **调试信息**：debug 字段包含简短的推理摘要，用于调试

---

## 🔍 与其他项目的区别

| 特性 | 01-05 项目 | 06-Travel-Assistant |
|------|----------|---------------------|
| 工具数量 | 1-3 | **4**（包含 travelAdviceTool） |
| 任务规划可视化 | ❌ | ✅ **完整可视化** |
| 工具执行日志 | ❌ | ✅ **详细记录** |
| 工具调用耗时 | ❌ | ✅ **实时展示** |
| 简洁模式 | ❌ | ✅ **一键切换** |
| 实时滚动 | ❌ | ✅ **自动滚动** |
| 流式动画 | ❌ | ✅ **逐字显示** |
| Execution Hooks | ❌ | ✅ **完整系统** |
| 性能监控 | ❌ | ✅ **实时追踪** |

**06-Chat-Travel-Assistant 的特点**：
- ✨ **最完整的实现**：包含所有核心功能和高级特性
- 🎯 **可视化执行**：任务规划和工具调用过程完全可视化
- ⏱️ **性能监控**：实时追踪工具调用性能
- 🎨 **用户体验**：简洁模式、实时滚动、流式动画等优化
- 🔧 **工程化**：完整的 TypeScript 类型、Hooks 系统
- 📚 **最佳实践**：适合作为生产环境的基础框架和学习参考

---

## 🔗 相关链接

- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/)
- [Vue 3 文档](https://vuejs.org/)
- [Function Calling 指南](https://platform.deepseek.com/api-docs/#function-calling)

---

## 📄 License

MIT License
