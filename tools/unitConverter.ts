import { UnitConverterParams, FunctionDefinition } from './types';

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
  // F → C
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

