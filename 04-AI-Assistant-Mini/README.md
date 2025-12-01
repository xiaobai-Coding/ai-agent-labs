# 🤖 AI Assistant Mini - 迷你智能助手

> 基于 DeepSeek API + Function Calling 的多功能智能助手（集成版）

---

## 📌 项目简介

**AI Assistant Mini** 是一个集成了多种工具能力的 AI 智能助手，整合了计算器、单位转换、天气查询等功能。这是一个**综合演示项目**，展示了如何在一个 Agent 中协调多个工具，实现复杂任务处理。

### 核心能力

- ✅ **多工具集成**：计算器 + 单位转换 + 天气查询
- ✅ **智能工具选择**：AI 自动识别需求，选择合适的工具
- ✅ **结构化输出**：输出标准化的 JSON 格式，包含判断、结果、置信度等
- ✅ **流式输出**：支持 SSE 流式响应，提供实时打字机效果
- ✅ **工具反制机制**：工具调用失败时自动修复参数并重试
- ✅ **提示系统**：内置美观的提示消息系统（info/success/warning/error）
- ✅ **调试面板**：支持查看原始 SSE 数据和推理过程
- ✅ **上下文记忆**：支持多轮对话，保持上下文连贯性

---

## 🎯 功能演示

### 1. 数学计算

```
用户: "帮我算一下 123 加 456 等于多少？"
AI: {
  "judgement": "has_evidence",
  "result": "123 + 456 = 579",
  "reason": "通过调用 calculator 工具进行计算",
  "confidence": 1.0,
  "debug": "识别为数学计算需求，调用 calculator 工具"
}
```

### 2. 单位转换

```
用户: "100 厘米等于多少米？"
AI: {
  "judgement": "has_evidence",
  "result": "100 cm = 1 m",
  "reason": "通过调用 unitConverter 工具进行转换",
  "confidence": 1.0,
  "debug": "识别为单位转换需求，调用 unitConverter 工具"
}
```

### 3. 天气查询

```
用户: "明天北京天气如何？"
AI: {
  "judgement": "has_evidence",
  "result": "明天北京：晴天 ☀️，温度 25°C，湿度 60%，建议：天气温暖，适合穿短袖或薄外套，注意防晒",
  "reason": "通过调用 weatherTool 工具获取天气信息",
  "confidence": 0.95,
  "debug": "识别为天气查询需求，调用 weatherTool 工具"
}
```

### 4. 多工具协作

```
用户: "明天上海天气如何？如果温度是 25 度，那华氏度是多少？"
AI: {
  "judgement": "has_evidence",
  "result": "明天上海：多云 ⛅，温度 25°C（77°F），...",
  "reason": "先调用 weatherTool 获取天气，再调用 unitConverter 转换温度单位",
  "confidence": 0.95,
  "debug": "识别需要两个工具：weatherTool 和 unitConverter"
}
```

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

## 🛠️ 技术栈

- **前端框架**：Vue 3 (Composition API)
- **构建工具**：Vite
- **语言**：TypeScript
- **AI 服务**：DeepSeek API
- **通信协议**：SSE (Server-Sent Events)

---

## 📁 项目结构

```
04-AI-Assistant-Mini/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── ChatComponent.vue    # 聊天主组件
│   │   ├── SSEDebugPanel.vue    # 调试面板
│   │   └── HelloWorld.vue       # 示例组件
│   ├── services/            # 服务层
│   │   └── aiService.ts         # AI 服务封装
│   ├── types/               # TypeScript 类型定义
│   │   └── chat.ts
│   ├── utils/               # 工具函数
│   │   ├── tools.ts             # 工具函数定义（calculator + unitConverter + weatherTool）
│   │   ├── utils.ts             # 通用工具函数
│   │   └── tips.ts              # 提示消息系统
│   ├── App.vue              # 根组件
│   └── main.ts              # 入口文件
├── public/                  # 静态资源
├── index.html               # HTML 模板
├── vite.config.ts           # Vite 配置
└── package.json             # 项目配置
```

---

## 🔧 工具定义

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

---

## 🧠 Agent 工作流程

### 系统提示词

本项目使用严格的系统提示词，要求 AI 输出标准化的 JSON 格式：

```typescript
{
  "judgement": "has_evidence" | "no_evidence",
  "result": string | null,
  "reason": string,
  "confidence": number,  // 0 ~ 1
  "debug": string
}
```

### 工具调用流程

1. **用户输入** → 自然语言需求
2. **LLM 分析** → 识别需求类型，选择工具
3. **工具调用** → 自动调用相应工具（可能多个）
4. **结果处理** → LLM 处理工具结果
5. **格式化输出** → 生成标准 JSON 格式
6. **流式输出** → 通过 SSE 流式返回给用户

### 工具选择规则

根据系统提示词，工具调用规则如下：

- **数学运算** → 调用 `calculator`
- **单位转换** → 调用 `unitConverter`
- **天气相关**（穿衣、天气、气温、温度、冷不冷、热不热） → 调用 `weatherTool`

---

## 🎨 特性亮点

### 1. 结构化输出

所有回复都遵循标准 JSON 格式，包含：
- **judgement**：判断是否有证据支持
- **result**：最终结果
- **reason**：推理过程
- **confidence**：置信度（0-1）
- **debug**：调试信息

### 2. 提示消息系统

内置美观的提示消息系统，支持：

```typescript
import { tips } from '../utils/tips';

tips.info('这是一条信息提示');
tips.success('操作成功！');
tips.warning('请注意...');
tips.error('发生错误');
```

### 3. 调试面板

支持查看：
- 原始 SSE 数据流
- 工具调用过程
- 推理过程（debug 字段）
- API 请求/响应

### 4. 多工具协调

AI 能够智能识别需要多个工具的场景：

```
用户: "明天上海天气如何？如果温度是 25 度，那华氏度是多少？"

1. 识别需要两个工具：
   - weatherTool（查询天气）
   - unitConverter（温度转换）

2. 协调调用两个工具

3. 综合结果生成最终回复
```

### 5. 工具反制机制

当工具调用失败时：
1. 捕获错误信息
2. 将错误反馈给 LLM
3. LLM 分析错误并修复参数
4. 自动发起第二次工具调用

---

## 💡 开发说明

### 添加新工具

1. 在 `src/utils/tools.ts` 中定义工具函数和描述
2. 在 `src/services/aiService.ts` 中注册工具到 `functionDefinitions`
3. 在 `availableFunctions` 中注册工具执行函数
4. 更新系统提示词，添加工具调用规则

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

| 特性 | 01-Calculator | 02-UnitConverter | 03-Weather | 04-Mini |
|------|--------------|------------------|------------|---------|
| 工具数量 | 1 | 2 | 3 | 3 |
| 输出格式 | 自然语言 | 自然语言 | 自然语言 | **JSON 结构化** |
| 提示系统 | ❌ | ❌ | ❌ | ✅ |
| 调试面板 | 基础 | 基础 | 基础 | **增强** |
| 系统提示词 | 简单 | 简单 | 简单 | **严格规范** |

**04-Mini 的特点**：
- 集成了所有工具功能
- 输出格式更加规范和结构化
- 更适合作为生产环境的基础框架
- 展示了如何构建一个完整的 AI Agent 系统

---

## 🔗 相关链接

- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/)
- [Vue 3 文档](https://vuejs.org/)
- [Function Calling 指南](https://platform.deepseek.com/api-docs/#function-calling)

---

## 📄 License

MIT License
