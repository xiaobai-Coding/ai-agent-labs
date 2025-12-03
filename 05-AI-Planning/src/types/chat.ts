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

// 从公共工具库导入类型
export type { FunctionDefinition, CalculatorParams, UnitConverterParams } from "../../../tools/types";

// 聊天上下文类型
export interface ChatContext {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
}
