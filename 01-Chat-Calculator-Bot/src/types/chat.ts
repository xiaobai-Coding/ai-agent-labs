// 消息类型定义
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'tool' | 'system';
  timestamp: number;
  debug_reasoning?: null | string; // 推理摘要
  type?: 'text' | 'function_call' | 'tool_response';
  function_call?: FunctionCall;
  tool_response?: ToolResponse;
}

// 函数调用类型
export interface FunctionCall {
  name: string;
  parameters: Record<string, any>;
}

// 工具响应类型
export interface ToolResponse {
  function_name: string;
  result: any;
}

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

// 聊天上下文类型
export interface ChatContext {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
}

export interface StreamCompletionResult {
  
}