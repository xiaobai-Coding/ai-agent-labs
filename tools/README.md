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
├── trafficTimeTool.ts # 交通时间估算
├── packingListTool.ts# 物品清单生成
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
  trafficTimeTool,
  trafficTimeFunction,
  packingListTool,
  packingListFunction,
  availableFunctions,
  FunctionDefinition,
  CalculatorParams,
  UnitConverterParams,
  WeatherToolParams,
  TravelAdviceParams,
  TodoPlannerParams,
  TrafficTimeParams,
  PackingListParams
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
  trafficTimeFunction,
  packingListFunction,
} from "../../../tools";

// 所有可用的函数定义
export const functionDefinitions: FunctionDefinition[] = [
  calculatorFunction,
  unitConverterFunction,
  weatherToolFunction,
  travelAdviceFunction,
  todoPlannerFunction,
  trafficTimeFunction,
  packingListFunction
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
  TodoStep,
  TrafficTimeParams,
  TrafficTimeResult,
  PackingListParams,
  PackingListResult
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

### 6. Traffic Time Tool（交通时间估算）

- **函数**: `trafficTimeTool(params: TrafficTimeParams): TrafficTimeResult`
- **定义**: `trafficTimeFunction: FunctionDefinition`
- **功能**: 根据目的地城市名称，估算从当前位置（默认北京）到目的地的里程和交通时间。支持多种交通方式（自驾、高铁、飞机、火车），返回预计时间、路况建议等信息
- **参数**:
  - `destination: string` - 目的地城市名称，例如："上海"、"广州"、"深圳"、"杭州"等
- **返回示例**:

```json
{
  "destination": "上海",
  "distance": 1213,
  "transportMode": "高铁",
  "estimatedTime": 273,
  "timeDisplay": "4小时33分钟",
  "trafficCondition": "高铁班次较多，建议提前购票",
  "suggestedDeparture": "建议选择上午或下午班次，避开早晚高峰",
  "notes": null
}
```

**特性**:
- 🗺️ 内置常见城市距离映射表（以北京为起点）
- 🚗 根据距离自动选择最优交通方式
- ⏱️ 考虑不同交通方式的平均速度和额外时间（候机、候车等）
- 📊 提供路况说明和建议出发时间
- 🎯 未知城市自动生成合理的估算数据

### 7. Packing List Tool（物品清单生成）

- **函数**: `packingListTool(params: PackingListParams): PackingListResult`
- **定义**: `packingListFunction: FunctionDefinition`
- **功能**: 根据交通方式、温度和天气描述，生成详细的携带物品清单。清单包括必需品、衣物、电子设备、个人护理、天气相关物品和交通方式特定物品等分类
- **参数**:
  - `transportMode: "自驾" | "高铁" | "飞机" | "火车"` - 出行交通方式
  - `temp: number` - 目的地温度，单位摄氏度
  - `weather: string` - 目的地天气描述，如"晴天"、"小雨"、"多云"、"雪"等
- **返回示例**:

```json
{
  "transportMode": "高铁",
  "temp": 15,
  "weather": "小雨",
  "categories": {
    "essentials": ["身份证", "手机", "充电器", "钱包", "钥匙", "车票/电子车票"],
    "clothing": ["薄外套", "长袖T恤", "长裤", "薄袜子", "运动鞋"],
    "electronics": ["手机", "充电器", "充电宝", "耳机", "平板电脑/电子书（可选）"],
    "personalCare": ["牙刷", "牙膏", "毛巾", "纸巾", "湿纸巾"],
    "weatherItems": ["雨伞", "雨衣", "防水鞋套", "防水包"],
    "transportSpecific": ["U型枕", "充电宝", "小零食", "水杯", "湿纸巾"]
  },
  "fullList": ["身份证", "手机", "充电器", "钱包", "钥匙", "车票/电子车票", "薄外套", "长袖T恤", "长裤", "薄袜子", "运动鞋", "充电宝", "耳机", "平板电脑/电子书（可选）", "牙刷", "牙膏", "毛巾", "纸巾", "湿纸巾", "雨伞", "雨衣", "防水鞋套", "防水包", "U型枕", "小零食", "水杯"],
  "summary": "根据高铁出行、15°C、小雨的天气情况，共整理了 26 件物品。天气凉爽，准备薄外套。行李相对宽松，但注意不要携带违禁品。"
}
```

**特性**:
- 📦 **分类清单**：按必需品、衣物、电子设备、个人护理、天气相关、交通特定等分类
- 🌡️ **温度适配**：根据温度范围（≤0°C、0-10°C、10-20°C、20-28°C、>28°C）生成相应衣物建议
- 🌦️ **天气适配**：根据天气类型（晴天、雨天、雪天、雾天等）添加相应物品
- 🚗 **交通适配**：不同交通方式生成特定物品（如飞机需要U型枕、自驾需要应急工具等）
- 📋 **完整清单**：提供扁平化的完整物品清单，方便核对
- 💡 **智能摘要**：自动生成清单摘要说明，包含出行建议

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

