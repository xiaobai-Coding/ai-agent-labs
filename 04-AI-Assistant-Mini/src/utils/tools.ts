import {
  CalculatorParams,
  FunctionDefinition,
  UnitConverterParams
} from "../types/chat";

// 定义计算器工具函数
export const calculator = (params: CalculatorParams): number => {
  const { num1, num2, operation } = params;
  if (typeof num1 !== "number" || typeof num2 !== "number") {
    throw new Error("num1 和 num2 必须是数字");
  }
  if (typeof operation !== "string") {
    throw new Error("operation 必须是字符串");
  }
  if (!operation || !num1 || !num2) {
    throw new Error("必须提供 operation、num1 和 num2 参数");
  }
  
  switch (operation) {
    case "add":
      return num1 + num2;
    case "subtract":
      return num1 - num2;
    case "multiply":
      return num1 * num2;
    case "divide":
      if (num2 === 0) {
        throw new Error("除数不能为零");
      }
      return num1 / num2;
    default:
      throw new Error(`不支持的操作: ${operation}`);
  }
};
// 定义计算器函数的描述
export const calculatorFunction: FunctionDefinition = {
  name: "calculator",
  description:
    "用于进行数学四则运算的计算器工具。仅在用户明确要求进行数学计算（如加减乘除运算）时使用。注意：历史事件中的年份、日期、数量等描述性数字不需要使用此工具进行计算。",
  parameters: {
    type: "object",
    properties: {
      num1: {
        type: "number",
        description: "第一个操作数（必须是需要参与计算的数字）"
      },
      num2: {
        type: "number",
        description: "第二个操作数（必须是需要参与计算的数字）"
      },
      operation: {
        type: "string",
        description:
          "运算操作类型：add(加法)、subtract(减法)、multiply(乘法)、divide(除法)",
        enum: ["add", "subtract", "multiply", "divide"]
      }
    },
    required: ["num1", "num2", "operation"]
  }
};

// 单位转换工具函数
export const unitConverter = (
  params: UnitConverterParams
): { value: number; unit: string } => {
  const { value, from, to } = params;

  // 参数类型检查
  if (typeof value !== "number" || isNaN(value)) {
    throw new Error("value must be a valid number");
  }
  if (typeof from !== "string" || typeof to !== "string") {
    throw new Error("from/to must be strings");
  }

  // ======================
  // 长度转换
  // ======================
  if (from === "cm" && to === "m") {
    return { value: value / 100, unit: "m" };
  }
  if (from === "m" && to === "cm") {
    return { value: value * 100, unit: "cm" };
  }
  // ======================
  // 质量转换
  // ======================
  if (from === "kg" && to === "g") {
    return { value: value * 1000, unit: "g" };
  }
  if (from === "g" && to === "kg") {
    return { value: value / 1000, unit: "kg" };
  }
  // ======================
  // 温度转换（双向）
  // ======================

  // C → F
  if (from === "C" && to === "F") {
    const fahrenheit = (value * 9) / 5 + 32;
    return { value: parseFloat(fahrenheit.toFixed(2)), unit: "°F" };
  }
  // F → C （必要逻辑）
  if (from === "F" && to === "C") {
    const celsius = ((value - 32) * 5) / 9;
    return { value: parseFloat(celsius.toFixed(2)), unit: "°C" };
  }

  // ======================
  // 其他非法组合
  // ======================
  throw new Error(`不支持的单位转换: ${from} 到 ${to}`);
};

// 单位转换函数的描述
export const unitConverterFunction: FunctionDefinition = {
  name: "unitConverter",
  description:
    "用于进行单位换算的工具，支持双向转换：厘米↔米(cm↔m)、千克↔克(kg↔g)、摄氏度↔华氏度(C↔F)。该工具允许双向转换，例如 cm→m 也支持 m→cm，C→F 也支持 F→C。",
  parameters: {
    type: "object",
    properties: {
      value: {
        type: "number",
        description: "要转换的数值"
      },
      from: {
        type: "string",
        enum: ["cm", "m", "kg", "g", "C", "F"],
        description:
          "原始单位: cm(厘米), m(米), kg(千克), g(克), C(摄氏度), F(华氏度)"
      },
      to: {
        type: "string",
        enum: ["cm", "m", "kg", "g", "C", "F"],
        description:
          "目标单位: cm(厘米), m(米), kg(千克), g(克), C(摄氏度), F(华氏度)"
      }
    },
    required: ["value", "from", "to"]
  }
};
// 天气查询工具（mock版）
export const weatherTool = (params: { date: string; city: string }) => {
  if (!params.date || !params.city) {
    throw new Error("必须提供日期和城市参数");
  }
  // 天气类型数组
  const weatherTypes = [
    { type: '晴天', icon: '☀️', minTemp: 10, maxTemp: 30 },
    { type: '多云', icon: '⛅', minTemp: 5, maxTemp: 25 },
    { type: '阴天', icon: '☁️', minTemp: 0, maxTemp: 20 },
    { type: '小雨', icon: '🌧️', minTemp: 5, maxTemp: 18 },
    { type: '中雨', icon: '🌧️', minTemp: 3, maxTemp: 15 },
    { type: '大雨', icon: '⛈️', minTemp: 0, maxTemp: 12 },
    { type: '雷阵雨', icon: '⚡', minTemp: 5, maxTemp: 20 },
    { type: '雪', icon: '❄️', minTemp: -10, maxTemp: 5 },
    { type: '雾', icon: '🌫️', minTemp: -5, maxTemp: 15 },
    { type: '沙尘暴', icon: '🌪️', minTemp: 0, maxTemp: 25 }
  ];

  // 获取随机的天气类型
  const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
  
  // 生成随机温度（在天气类型的温度范围内）
  const temperature = Math.floor(Math.random() * (randomWeather.maxTemp - randomWeather.minTemp + 1)) + randomWeather.minTemp;
  
  // 根据天气类型和温度生成建议
  let suggestion = '';
  if (temperature < 0) {
    suggestion = '天气非常寒冷，请穿厚羽绒服，注意防寒保暖';
  } else if (temperature < 10) {
    suggestion = '天气寒冷，建议穿厚外套，注意保暖';
  } else if (temperature < 20) {
    suggestion = '天气凉爽，建议穿外套或薄毛衣';
  } else {
    suggestion = '天气温暖，适合穿短袖或薄外套';
  }

  // 如果是雨天，添加雨具建议
  if (randomWeather.type.includes('雨')) {
    suggestion += '，记得带伞';
  } else if (randomWeather.type === '雪') {
    suggestion += '，注意防滑';
  } else if (randomWeather.type === '晴天') {
    suggestion += '，注意防晒';
  }

  return {
    city: params.city,
    date: params.date,
    temperature: temperature,
    weather: randomWeather.type,
    icon: randomWeather.icon,
    humidity: Math.floor(Math.random() * 50) + 30, // 30-80% 湿度
    windSpeed: (Math.random() * 10).toFixed(1), // 0-10 m/s
    windDirection: ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][Math.floor(Math.random() * 8)],
    airQuality: ['优', '良', '轻度污染', '中度污染', '重度污染'][Math.floor(Math.random() * 5)],
    suggestion: suggestion,
    updateTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  };
};
// 天气查询工具的描述
export const weatherToolFunction:FunctionDefinition = {
  name: "weatherTool",
  description: "获取指定城市在指定日期的详细天气信息，包括温度、天气状况、湿度、风速风向、空气质量等，并提供穿衣和生活建议。数据为随机生成，用于演示目的。",
  parameters: {
    type: "object",
    properties: {
      date: {
        type: "string",
        description: "查询日期，格式为 'YYYY-MM-DD' 或相对描述如 '今天'、'明天'、'后天'"
      },
      city: {
        type: "string",
        description: "要查询的城市名称，例如：'北京'、'上海'、'广州'、'深圳'等"
      }
    },
    required: ["date", "city"]
  }
};


// 所有可用的工具函数
export const availableFunctions: Record<string, (params: any) => any> = {
  calculator,
  unitConverter,
  weatherTool
};
