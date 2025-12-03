import { CalculatorParams, FunctionDefinition } from './types';

// 定义计算器工具函数
export const calculator = (params: CalculatorParams): number => {
  const { num1, num2, operation } = params;
  
  // 参数验证
  if (typeof num1 !== "number" || typeof num2 !== "number") {
    throw new Error("num1 和 num2 必须是数字");
  }
  if (typeof operation !== "string") {
    throw new Error("operation 必须是字符串");
  }
  if (!operation || num1 === undefined || num2 === undefined) {
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

