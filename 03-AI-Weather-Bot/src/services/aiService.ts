// DeepSeek AI服务实现
// 使用真实的DeepSeek API进行对话

import { Message } from "../types/chat";
import { FunctionDefinition } from "../../../tools/types";
import {
  delay,
  simulateTyping,
  parseModelContent,
  createResultStreamer,
  trimModelMessages,
  supportsStreaming
} from "../utils/utils";
import { tips } from "../utils/tips";
import {
  availableFunctions,
  calculatorFunction,
  unitConverterFunction,
  weatherToolFunction,
} from "../../../tools";

// 所有可用的函数定义
export const functionDefinitions: FunctionDefinition[] = [
  calculatorFunction,
  unitConverterFunction,
  weatherToolFunction
];
// 从环境变量中读取配置
const getConfig = () => ({
  apiKey: import.meta.env.VITE_AI_API_KEY || "",
  // apiKey: "",
  apiBaseUrl: import.meta.env.VITE_AI_API_BASE_URL || "https://api.deepseek.com",
  appTitle: import.meta.env.VITE_APP_TITLE || "DeepSeek AI聊天",
  debug: import.meta.env.VITE_APP_DEBUG === "true",
  model: "deepseek-chat",
  temperature: 0.3 // 控制回复的随机性
});

const config = getConfig();

// 定义解析模型返回内容的接口
interface ParsedModelContent {
  content: string;
  debug_reasoning: string | null;
}

// 简化的API调用函数 用于普通回答的流式输出
const callDeepSeekAPI = async (
  userMessages: any,
  showDebugReasoning: boolean
): Promise<any> => {
  // 确保API密钥存在
  if (!config.apiKey) {
    throw new Error("未配置API密钥，请检查.env.local文件");
  }
  // 传给模型的消息需要裁剪
  let modelMessages = trimModelMessages(userMessages); // 过滤掉工具调用消息
  try {
    const endpoint = `${config.apiBaseUrl}/chat/completions`;

    const requestBody = {
      model: config.model,
      messages: modelMessages, // 传给模型的消息需要裁剪
      tools: functionDefinitions.map((func) => ({
        type: "function",
        function: func
      })),
      tool_choice: "auto", // 自动选择使用工具还是模型生成回复
      temperature: config.temperature, // 控制回复的随机性，
      max_tokens: 300 // 限制回复的最大长度
    };

    // 验证functions参数格式
    console.log(
      "[AI Service] Functions参数:",
      JSON.stringify(functionDefinitions, null, 2)
    );

    console.log("[AI Service] 准备发送fetch请求...");

    // 发送API请求
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    console.log("fetch请求参数:", requestBody);

    console.log("[AI Service] 收到响应，状态码:", response.status);

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Service] 错误响应内容:", errorText);
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    // 解析响应数据
    const data = await response.json();
    console.log("[AI Service] 响应数据:", JSON.stringify(data, null, 2));

    // 检查响应格式
    if (
      !data.choices ||
      data.choices.length === 0 ||
      !data.choices[0].message
    ) {
      throw new Error("API响应格式不正确，未找到有效回复");
    }

    // 返回完整的响应对象，以便getAIResponse可以检查function_call
    return data;
  } catch (error: any) {
    console.error("[AI Service] API调用异常:", error);

    // 提供更详细的错误信息
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      // 网络错误或CORS错误
      const detailedError = new Error(
        `网络请求失败。可能的原因：\n` +
          `1. 网络连接问题，请检查网络连接\n` +
          `2. API端点无法访问: ${config.apiBaseUrl}\n` +
          `3. CORS跨域问题，请检查API配置\n` +
          `4. API密钥无效或已过期\n` +
          `原始错误: ${error.message}`
      );
      throw detailedError;
    }

    // 如果是其他错误，直接抛出
    throw error;
  }
};
// =========================
//   FINAL 版 streamDeepSeekAPI
//   ✔ 流式输出 result
//   ✔ 捕获 debug_reasoning（reasoning_content）
//   ✔ 任意 token 切片都能拼装
// =========================

// 极简 + 正确版：只流式输出 JSON 里的 result 字段
const streamDeepSeekAPI = async (
  userMessages: any[],
  showDebugReasoning: boolean,
  onPartialResponse?: (partial: string) => void
): Promise<any> => {
  if (!supportsStreaming()) {
    throw new Error("当前运行环境不支持 ReadableStream 流式响应");
  }

  if (!config.apiKey) {
    throw new Error("未配置 API 密钥，请检查 .env.local 文件");
  }

  // 1. 裁剪消息
  const modelMessages = trimModelMessages(userMessages);

  const endpoint = `${config.apiBaseUrl}/chat/completions`;
  const requestBody = {
    model: config.model,
    messages: modelMessages,
    tools: functionDefinitions.map((func) => ({
      type: "function",
      function: func
    })),
    tool_choice: "auto",
    temperature: config.temperature,
    max_tokens: 300,
    stream: true
  };

  // 2. 发送请求
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
  }

  if (!response.body) {
    throw new Error("未能获取到可读的响应流 (response.body 为空)");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let done = false;
  let buffer = "";

  // 用来存整段 JSON 文本（模型最终输出的完整 JSON 字符串）
  let fullJsonText = "";

  // 用来收集 reasoning_content（如果模型有单独的推理流）
  let aggregatedDebug = "";

  // 用来收集工具调用的增量信息，全部的工具调用的集合（对象）
  const toolCallBuffers: Record<
    number,
    {
      id?: string;
      type?: string;
      function?: { name?: string; arguments: string };
    }
  > = {};

  let hasToolCall = false; // 是否触发了工具调用

  // 🔥 用你之前写好的 result 字段状态机，只对 `"result": "..."` 内部字符调用 onPartialResponse
  const resultStreamer = createResultStreamer(onPartialResponse);

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      buffer += decoder.decode(value, { stream: !done });
    }

    let index: number;
    // DeepSeek SSE：每个事件之间用空行分隔
    while ((index = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);

      const line = rawEvent.trim();
      if (!line || !line.startsWith("data:")) continue;

      const dataPayload = line.replace(/^data:\s*/, "");

      if (dataPayload === "[DONE]") {
        done = true;
        break;
      }

      try {
        const parsed = JSON.parse(dataPayload);
        const delta = parsed.choices?.[0]?.delta;
        console.log("delta:", delta);
        if (!delta) continue;

        // 1️⃣ content：是 JSON 字符串的碎片
        if (typeof delta.content === "string") {
          const chunk = delta.content;
          // ① 整体 JSON 文本累积，用于最后 JSON.parse
          fullJsonText += chunk;

          // ② 把这一小块交给 resultStreamer，
          //    内部只会在解析到 "result": "..." 里的字符时调用 onPartialResponse
          resultStreamer.handleChunk(chunk);
        }
        // 2️⃣ tool_calls：流式函数调用
        if (Array.isArray(delta.tool_calls)) {
          hasToolCall = true; // 触发了工具调用

          // 遍历工具调用
          for (const toolCallDelta of delta.tool_calls) {
            // 📝 tool_calls：工具调用的索引
            const index =
              typeof toolCallDelta.index === "number" ? toolCallDelta.index : 0;
            // 如果工具调用缓冲区中没有这个索引，则创建一个
            // toolCallBuffers 是一个“收集箱”
            // toolCallBuffers = {
            //   0: { ... 收集工具0 的碎片 ... },
            //   1: { ... 收集工具1 的碎片 ... }
            // }

            if (!toolCallBuffers[index]) {
              toolCallBuffers[index] = {
                id: toolCallDelta.id,
                type: toolCallDelta.type,
                function: { name: "", arguments: "" }
              };
            }
            // 当前工具调用的缓冲区，修改 buffer === 修改 toolCallBuffers[index]
            const buffer = toolCallBuffers[index];

            // 如果工具调用ID存在，则更新工具调用ID
            if (toolCallDelta.id) {
              buffer.id = toolCallDelta.id;
            }
            // 如果工具调用类型存在，则更新工具调用类型
            if (toolCallDelta.type) {
              buffer.type = toolCallDelta.type;
            }

            // 如果工具调用函数存在，则更新工具调用函数
            if (toolCallDelta.function) {
              buffer.function = buffer.function || { name: "", arguments: "" };

              if (toolCallDelta.function.name) {
                buffer.function.name = toolCallDelta.function.name;
              }
              // 如果工具调用函数参数存在，则更新工具调用函数参数
              if (toolCallDelta.function.arguments) {
                buffer.function.arguments += toolCallDelta.function.arguments;
              }
            }
          }
        }
        // 3️⃣ reasoning_content：推理流（可选）
        if (typeof delta.debug === "string") {
          aggregatedDebug += delta.debug;
        }
      } catch (err) {
        console.error("[AI Service] 流式数据解析失败:", err);
      }
    }
  }
  console.log("最终json文本fullJsonText:", fullJsonText);
  // 告诉 resultStreamer：流已经结束，可以把尾巴处理完（比如遗留的代理对）
  resultStreamer.finalize();

  // ---- 4️⃣ 解析最终 JSON ----
  let finalContent = ""; // 最终的主内容
  let debug_reasoning: string | null = null; // 最终的推理内容
  // 将toolCallBuffers转为标准的格式，用于向模型返回
  const aggregatedToolCalls = Object.entries(toolCallBuffers)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([index, call]) => ({
      id: call.id || `tool_call_${index}`,
      type: call.type || "function",
      function: {
        name: call.function?.name || "",
        arguments: call.function?.arguments || ""
      }
    }));

  // 如果有工具调用，直接返回工具调用信息，不再尝试解析 result
  if (hasToolCall && aggregatedToolCalls.length > 0) {
    return {
      message: {
        role: "assistant",
        content: null,
        tool_calls: aggregatedToolCalls
      },
      content: "",
      debug_reasoning: aggregatedDebug || null,
      tool_calls: aggregatedToolCalls
    };
  }

  try {
    if (fullJsonText.trim()) {
      const json = JSON.parse(fullJsonText);

      // 1️⃣ 主内容：result
      const resultText = typeof json.result === "string" ? json.result : json.reason; // 如果result不是字符串，就用reason

      // 如果状态机里已经成功提取了 result，就优先用状态机里的值
      if (resultStreamer.hasValue()) {
        finalContent = resultStreamer.getValue();
      } else {
        finalContent = resultText;
      }

      // 2️⃣ debug_reasoning 优先取 JSON 里的字段，其次取 reasoning_content 流
      if (typeof json.debug === "string") {
        debug_reasoning = json.debug;
      } else if (aggregatedDebug.trim()) {
        debug_reasoning = aggregatedDebug.trim();
      } else {
        debug_reasoning = null;
      }
    } else {
      // 模型没按 JSON 来，降级为纯文本
      if (resultStreamer.hasValue()) {
        finalContent = resultStreamer.getValue();
      } else {
        finalContent = fullJsonText;
      }

      debug_reasoning = aggregatedDebug || null;
    }
  } catch (e) {
    console.warn("[AI Service] JSON 解析失败，降级为纯文本输出:", e);

    if (resultStreamer.hasValue()) {
      finalContent = resultStreamer.getValue();
    } else {
      finalContent = fullJsonText;
    }

    debug_reasoning = aggregatedDebug || null;
  }

  // ---- 返回统一结构 ----
  return {
    message: {
      role: "assistant",
      content: finalContent || debug_reasoning // 如果没有result，就用debug_reasoning
    },
    content: finalContent || debug_reasoning,
    debug_reasoning
  };
};
// 获取AI回复 具有上下文记忆功能
// 定义AI响应的返回类型
export interface AIResponse {
  content: string;
  debug_reasoning?: string | null;
  function_call?: {
    name: string;
    parameters: Record<string, any>;
  };
  tool_calls?: any[];
  message?: any;
}

interface HandleToolResponseOptions {
  showDebugReasoning?: boolean;
  stream?: boolean;
  onPartialResponse?: (partial: string) => void;
}

// 处理工具调用响应，执行工具并将结果发送回模型生成最终回复
export const handleToolResponse = async (
  userMessages: any[],
  assistantMessage: any,
  toolCalls: any[],
  options: HandleToolResponseOptions = {}
): Promise<AIResponse> => {
  const {
    showDebugReasoning = false,
    stream = false,
    onPartialResponse
  } = options;
  console.log(`[AI Service] 处理工具调用，工具数量: ${toolCalls.length}`);

  try {
    // 执行所有工具调用
    const toolResults = [];
    for (const toolCall of toolCalls) {
      const functionCall = toolCall.function;
      const functionName = functionCall.name;
      const functionArgs = JSON.parse(functionCall.arguments || "{}");

      console.log(`[AI Service] 执行工具: ${functionName}`, functionArgs);
      console.log("[AI Service] 执行工具参数:", functionArgs);
      // 1. 执行工具
      if (availableFunctions[functionName]) {
        const functionToCall = availableFunctions[functionName];
        try {
          const result = functionToCall(functionArgs);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify(result)
          });
          console.log("工具调用结果:", result);
        } catch (error) {
          console.error(`[AI Service] 执行工具失败: ${error}`);
          // 执行工具失败
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: String(error)
          });
        }
      }
    }

    // 构建包含工具调用和结果的完整消息历史
    // 注意：userMessages 不应该包含 system message，因为 callDeepSeekAPI 会在内部添加
    console.log("工具调用userMessages：", userMessages);
    const messagesWithToolResults = [
      ...userMessages,
      {
        role: "assistant",
        content: assistantMessage.content || "null",
        tool_calls: toolCalls
      },
      ...toolResults
    ];

    console.log("[AI Service] 准备发送第二次API请求，包含工具结果");
    // 2. 第二次发送请求，带上工具函数调用结果，获取模型最终回复
    if (stream) {
      const streamResult = await streamDeepSeekAPI(
        messagesWithToolResults,
        showDebugReasoning,
        onPartialResponse
      );
      console.log("[AI Service] 第二次API请求返回结果:", streamResult);
      return {
        message: streamResult.message,
        content: streamResult.content,
        debug_reasoning: streamResult.debug_reasoning,
        tool_calls: streamResult.tool_calls
      };
    }
  } catch (error: any) {
    console.error(`[AI Service] 工具调用处理失败: ${error}`);
    throw error;
  }
};

// 非流式 fallback：处理工具调用
const getAIResponseFallback = async (
  userMessages: any[],
  onPartialResponse: (partialResponse: string) => void,
  showDebugReasoning: boolean
): Promise<AIResponse> => {
  // 调用API获取响应
  const data = await callDeepSeekAPI(userMessages, showDebugReasoning);

  if (
    data.choices &&
    data.choices[0].message &&
    data.choices[0].message.tool_calls
  ) {
    const toolCalls = data.choices[0].message.tool_calls;
    const assistantMessage = data.choices[0].message;

    const finalResponse = await handleToolResponse(
      userMessages,
      assistantMessage,
      toolCalls,
      {
        showDebugReasoning
      }
    );

    await delay(500);
    await simulateTyping(finalResponse.content, (char) => {
      onPartialResponse(char);
    });

    return finalResponse;
  }

  if (data.choices && data.choices[0].message) {
    const apiResponse = data.choices[0].message.content;
    const parsed = parseModelContent(apiResponse);

    await delay(500);
    await simulateTyping(parsed.content, (char) => {
      onPartialResponse(char);
    });

    return parsed;
  }

  throw new Error("API响应格式不正确，未找到有效回复");
};
/**
 * 递归处理工具调用（支持无限重试）
 */
export const resolveToolCalls = async (
  userMessages: any[],
  assistantMessage: any,
  toolCalls: any[],
  options: HandleToolResponseOptions
): Promise<AIResponse> => {
  // 执行工具 + 再次请求模型
  const finalResponse = await handleToolResponse(
    userMessages,
    assistantMessage,
    toolCalls,
    options
  );

  console.log("[工具调用结果]", finalResponse);

  // 如果模型又返回新的工具调用 → 递归继续
  if (finalResponse.tool_calls?.length) {
    return resolveToolCalls(
      userMessages,
      finalResponse, // 上次模型的 assistant 消息
      finalResponse.tool_calls, // 下一轮工具调用
      options
    );
  }

  // 没有工具调用了，就是最终结果
  return {
    content: finalResponse.content,
    debug_reasoning: finalResponse.debug_reasoning
  };
};

// 流式回答：处理普通回答的流式输出/处理工具调用的流式输出
const getAIResponseWithStreaming = async (
  userMessages: any[],
  onPartialResponse: (partialResponse: string) => void,
  showDebugReasoning: boolean
): Promise<AIResponse> => {
  const streamResult = await streamDeepSeekAPI(
    userMessages,
    showDebugReasoning,
    onPartialResponse
  );
  console.log("streamResult:", streamResult);
  // 如果模型触发了工具调用，执行工具后再流式返回最终结果
  if (streamResult.tool_calls?.length) {
    const assistantMessage = {
      role: "assistant",
      content: streamResult.content || null,
      tool_calls: streamResult.tool_calls
    };
    // 如果模型触发了工具调用，执行工具后再流式返回最终结果，支持工具反制约
    return resolveToolCalls(
      userMessages,
      assistantMessage,
      streamResult.tool_calls,
      {
        showDebugReasoning,
        stream: true,
        onPartialResponse
      }
    );
  }

  return {
    content: streamResult.content,
    debug_reasoning: streamResult.debug_reasoning
  };
};

// 主函数：根据是否支持流式输出选择不同的处理方式
export const getAIResponse = async (
  userMessages: any[],
  onPartialResponse: (partialResponse: string) => void,
  showDebugReasoning: boolean = false
): Promise<AIResponse> => {
  console.log("[AI Service] getAIResponse被调用");

  if (!supportsStreaming()) {
    return getAIResponseFallback(
      userMessages,
      onPartialResponse,
      showDebugReasoning
    );
  }

  try {
    return await getAIResponseWithStreaming(
      userMessages,
      onPartialResponse,
      showDebugReasoning
    );
  } catch (error) {
    console.warn("[AI Service] 流式输出失败，回退到打字机模式:", error);
    return getAIResponseFallback(
      userMessages,
      onPartialResponse,
      showDebugReasoning
    );
  }
};

// 判断是否应该提出追问
export const shouldAskFollowUp = (userMessage: string): boolean => {
  return userMessage.length < 30;
};

// 生成追问建议
export const getFollowUpSuggestion = (userMessage: string): string => {
  const suggestions = [
    "你想了解更多关于哪个方面的信息？",
    "你能详细说明一下你的问题吗？",
    "有什么特定的例子你想了解吗？"
  ];
  return suggestions[Math.floor(Math.random() * suggestions.length)];
};

// 导出配置
export { config };
