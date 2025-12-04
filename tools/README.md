# 🛠️ 公共工具库

> AI Agent Labs 项目的共享工具集合

## 📌 简介

本目录包含所有 AI Agent 项目共享的工具函数和类型定义，避免代码重复，统一维护。

## 📁 目录结构

```
tools/
├── types.ts           # 公共类型定义
├── calculator.ts      # 计算器工具
├── unitConverter.ts   # 单位转换工具
├── weather.ts         # 天气查询工具
├── travelAdviceTool.ts# 出行建议
├── todoPlannerTool.ts # 任务规划拆解
├── index.ts           # 统一导出入口
└── README.md          # 本文件
```

## 🚀 使用方法

### 在项目中使用工具

```typescript
// 导入工具函数和类型定义
import {
  calculator,
  calculatorFunction,
  unitConverter,
  unitConverterFunction,
  weatherTool,
  weatherToolFunction,
  travelAdviceTool,
  travelAdviceFunction,
  todoPlannerTool,
  todoPlannerFunction,
  availableFunctions,
  FunctionDefinition,
  CalculatorParams,
  UnitConverterParams,
  WeatherToolParams,
  TravelAdviceParams,
  TodoPlannerParams
} from "../../../tools";

// 或者按需导入
import { calculatorFunction } from "../../../tools/calculator";
import { FunctionDefinition } from "../../../tools/types";
```

### 在 aiService.ts 中使用

```typescript
import { Message } from "../types/chat";
import { FunctionDefinition } from "../../../tools/types";
import {
  availableFunctions,
  calculatorFunction,
  unitConverterFunction,
  weatherToolFunction,
  travelAdviceFunction,
  todoPlannerFunction,
} from "../../../tools";

// 所有可用的函数定义
export const functionDefinitions: FunctionDefinition[] = [
  calculatorFunction,
  unitConverterFunction,
  weatherToolFunction,
  travelAdviceFunction,
  todoPlannerFunction
];
```

### 在 types/chat.ts 中使用

```typescript
// 从公共工具库导入类型
export type {
  FunctionDefinition,
  CalculatorParams,
  UnitConverterParams,
  WeatherToolParams,
  TravelAdviceParams,
  TravelAdviceResult,
  TodoPlannerParams,
  TodoStep
} from "../../../tools/types";

// 项目特定的类型定义
export interface Message {
  // ...
}
```

## 📦 可用工具

### 1. Calculator（计算器）

- **函数**: `calculator(params: CalculatorParams): number`
- **定义**: `calculatorFunction: FunctionDefinition`
- **功能**: 数学四则运算（加减乘除）

### 2. Unit Converter（单位转换）

- **函数**: `unitConverter(params: UnitConverterParams): { value: number; unit: string }`
- **定义**: `unitConverterFunction: FunctionDefinition`
- **功能**: 单位转换（长度、质量、温度）

### 3. Weather Tool（天气查询）

- **函数**: `weatherTool(params: WeatherToolParams): WeatherToolResult`
- **定义**: `weatherToolFunction: FunctionDefinition`
- **功能**: 天气查询（当前为 mock 数据）

### 4. Travel Advice Tool（出行建议）

- **函数**: `travelAdviceTool(params: TravelAdviceParams): TravelAdviceResult`
- **定义**: `travelAdviceFunction: FunctionDefinition`
- **功能**: 根据温度与天气描述生成 Mock 出行建议（摘要、穿衣建议、携带清单）

### 5. Todo Planner Tool（任务拆解）

- **函数**: `todoPlannerTool(params: TodoPlannerParams): { steps: TodoStep[] }`
- **定义**: `todoPlannerFunction: FunctionDefinition`
- **功能**: 将模型思考好的「多条子任务文本」解析成结构化的待办清单，为多步骤 Agent 提供可靠的任务规划结果
- **返回示例**:

```json
{
  "steps": [
    { "id": 1, "title": "查询明天广州的天气信息", "status": "pending" },
    { "id": 2, "title": "查询后天广州的天气信息", "status": "pending" },
    { "id": 3, "title": "根据明天天气生成穿衣建议", "status": "pending" }
  ]
}
```

## 🔧 添加新工具

1. 在 `tools/` 目录下创建新文件，例如 `newTool.ts`
2. 实现工具函数和 FunctionDefinition
3. 在 `tools/index.ts` 中导出
4. 更新本 README

## 📝 注意事项

- 所有工具函数都应该有完整的类型定义
- 工具函数应该包含参数验证和错误处理
- FunctionDefinition 应该详细描述工具的功能和使用场景
- 保持工具函数的纯函数特性（无副作用）

## 🔗 相关项目

- [01-Chat-Calculator-Bot](../01-Chat-Calculator-Bot/)
- [02-Chat-UnitConverter](../02-Chat-UnitConverter/)
- [03-AI-Weather-Bot](../03-AI-Weather-Bot/)
- [04-AI-Assistant-Mini](../04-AI-Assistant-Mini/)
- [05-AI-Planning](../05-AI-Planning/)
- [06-Chat-Travel-Assistant](../06-Chat-Travel-Assistant/)
- [07-Agent-WorkFlow](../07-Agent-WorkFlow/)

