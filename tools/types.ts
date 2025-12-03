// 公共类型定义

// 函数定义类型
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

// 计算器函数参数类型
export interface CalculatorParams {
  num1: number;
  num2: number;
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
}

// 单位转换函数参数类型
type LengthUnits = "cm" | "m";
type MassUnits = "kg" | "g";
type TempUnits = "C" | "F";

export interface UnitConverterParams {
  value: number;
  from: LengthUnits | MassUnits | TempUnits;
  to: LengthUnits | MassUnits | TempUnits;
}

