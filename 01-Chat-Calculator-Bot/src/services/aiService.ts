// DeepSeek AI服务实现
// 使用真实的DeepSeek API进行对话

import { Message } from "../types/chat";
import { FunctionDefinition } from "../../../tools/types";
import { calculatorFunction, availableFunctions } from "../../../tools";

// 所有可用的函数定义
export const functionDefinitions: FunctionDefinition[] = [calculatorFunction];

// 从环境变量中读取配置
const getConfig = () => ({
  apiKey: import.meta.env.VITE_AI_API_KEY || "",
  apiBaseUrl:
    import.meta.env.VITE_AI_API_BASE_URL || "https://api.deepseek.com",
  appTitle: import.meta.env.VITE_APP_TITLE || "DeepSeek AI聊天",
  debug: import.meta.env.VITE_APP_DEBUG === "true",
  model: "deepseek-chat",
  temperature: 0.3 // 控制回复的随机性
});

const config = getConfig();

// 辅助函数：延迟执行
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 模拟打字输出效果
export const simulateTyping = async (
  text: string,
  onCharacterAdd: (char: string) => void
): Promise<void> => {
  // console.log("[AI Service] 开始模拟打字效果，文本长度:", text.length);

  const chars = text.split("");
  for (const char of chars) {
    onCharacterAdd(char);
    await delay(30 + Math.random() * 30); // 固定打字速度
  }
};

// 检查是否支持流式输出
const supportsStreaming = () =>
  typeof ReadableStream !== "undefined" && typeof TextDecoder !== "undefined";

interface ParsedModelContent {
  content: string;
  debug_reasoning: string | null;
}

// 解析模型返回的内容，提取主要内容和推理摘要
const parseModelContent = (rawContent: string): ParsedModelContent => {
  let content = rawContent;
  let debugReasoning: string | null = null;

  try {
    const jsonResponse = JSON.parse(rawContent);
    if (jsonResponse && typeof jsonResponse === "object") {
      if (typeof jsonResponse.result === "string") {
        content = jsonResponse.result;
      } else if (typeof jsonResponse.reason === "string") {
        content = jsonResponse.reason;
      }

      if (typeof jsonResponse.debug_reasoning === "string") {
        debugReasoning = jsonResponse.debug_reasoning;
      }
    }
  } catch (e) {
    // 非JSON格式，直接返回原始内容
  }

  return {
    content,
    debug_reasoning: debugReasoning
  };
};

const hexRegex = /^[0-9a-fA-F]+$/;

const createResultStreamer = (onPartialResponse?: (chunk: string) => void) => {
  const RESULT_KEY = '"result"';
  type State =
    | "searchingKey"
    | "afterKey"
    | "waitingValue"
    | "inValue"
    | "done"
    | "nullValue";

  let state: State = "searchingKey";
  let keyIndex = 0;
  let escapeNext = false;
  let inUnicodeSequence = false;
  let unicodeBuffer = "";
  let pendingHighSurrogate: number | null = null;
  let resultValue = "";

  const emitChar = (char: string) => {
    resultValue += char;
    if (onPartialResponse) {
      onPartialResponse(char);
    }
  };

  const emitCodePoint = (codePoint: number) => {
    if (
      pendingHighSurrogate !== null &&
      codePoint >= 0xdc00 &&
      codePoint <= 0xdfff
    ) {
      const combined =
        ((pendingHighSurrogate - 0xd800) << 10) +
        (codePoint - 0xdc00) +
        0x10000;
      const char = String.fromCodePoint(combined);
      emitChar(char);
      pendingHighSurrogate = null;
      return;
    }

    if (pendingHighSurrogate !== null) {
      const danglingChar = String.fromCharCode(pendingHighSurrogate);
      emitChar(danglingChar);
      pendingHighSurrogate = null;
    }

    if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      pendingHighSurrogate = codePoint;
      return;
    }

    const char = String.fromCodePoint(codePoint);
    emitChar(char);
  };

  const handleEscapedChar = (char: string) => {
    switch (char) {
      case '"':
        emitChar('"');
        return;
      case "\\":
        emitChar("\\");
        return;
      case "/":
        emitChar("/");
        return;
      case "b":
        emitChar("\b");
        return;
      case "f":
        emitChar("\f");
        return;
      case "n":
        emitChar("\n");
        return;
      case "r":
        emitChar("\r");
        return;
      case "t":
        emitChar("\t");
        return;
      case "u":
        inUnicodeSequence = true;
        unicodeBuffer = "";
        return;
      default:
        emitChar(char);
    }
  };

  const handleChar = (char: string) => {
    if (state === "done" || state === "nullValue") {
      return;
    }

    if (inUnicodeSequence) {
      if (hexRegex.test(char)) {
        unicodeBuffer += char;
        if (unicodeBuffer.length === 4) {
          const codePoint = parseInt(unicodeBuffer, 16);
          emitCodePoint(codePoint);
          inUnicodeSequence = false;
          unicodeBuffer = "";
        }
        return;
      } else {
        // 非法unicode序列，结束处理
        inUnicodeSequence = false;
        unicodeBuffer = "";
      }
    }

    if (escapeNext) {
      handleEscapedChar(char);
      escapeNext = false;
      return;
    }

    switch (state) {
      case "searchingKey":
        if (char === RESULT_KEY[keyIndex]) {
          keyIndex += 1;
          if (keyIndex === RESULT_KEY.length) {
            state = "afterKey";
            keyIndex = 0;
          }
        } else {
          keyIndex = char === RESULT_KEY[0] ? 1 : 0;
        }
        break;
      case "afterKey":
        if (char === ":") {
          state = "waitingValue";
        } else if (!/\s/.test(char)) {
          state = "searchingKey";
          keyIndex = 0;
          handleChar(char);
        }
        break;
      case "waitingValue":
        if (char === '"') {
          state = "inValue";
        } else if (char === "n") {
          state = "nullValue";
        } else if (!/\s/.test(char)) {
          state = "searchingKey";
          keyIndex = 0;
          handleChar(char);
        }
        break;
      case "inValue":
        if (char === "\\") {
          escapeNext = true;
        } else if (char === '"') {
          state = "done";
        } else {
          emitChar(char);
        }
        break;
    }
  };

  return {
    handleChunk: (chunk: string) => {
      for (const char of chunk) {
        handleChar(char);
      }
    },
    hasValue: () => resultValue.length > 0,
    getValue: () => resultValue,
    finalize: () => {
      if (pendingHighSurrogate !== null) {
        const char = String.fromCharCode(pendingHighSurrogate);
        emitChar(char);
        pendingHighSurrogate = null;
      }
    }
  };
};

// 裁剪模型消息 只保留最近 6 轮对话
function trimModelMessages(modelMessages: any[]) {
  const system = modelMessages[0];
  const rest = modelMessages.slice(1);
  // 如果消息数量大于6，则裁剪只保留最近三轮对话
  if (rest.length > 6) {
    const trimmed = rest.slice(-6); // slice 传递负数时，表示从后往前数
    modelMessages = [system, ...trimmed];
    return modelMessages;
  }
  return [system, ...rest]; // 如果消息数量小于6，则不裁剪
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
      tools: [
        {
          type: "function",
          function: calculatorFunction
        }
      ],
      tool_choice: "auto",
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

// 极简版流式输出：只处理普通 content，不处理工具调用、reasoning
// =======================================================
//   DeepSeek 流式：仅提取 "result" 字符串并流式输出
// =======================================================

// ------ 最终可用版：只把 result 字段流式输出 ------

// ------ 最终可用版：只把 result 字段流式输出 ------
// =========================
//   FINAL 版 streamDeepSeekAPI
//   ✔ 稳定流式输出 result
//   ✔ 任意切碎 token 都能识别
//   ✔ 不输出其他字段
// =========================

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
        // 2️⃣ reasoning_content：推理流（可选）
        if (typeof delta.debug === "string") {
          aggregatedDebug += delta.debug;
        }
      } catch (err) {
        console.error("[AI Service] 流式数据解析失败:", err);
      }
    }
  }
  // 告诉 resultStreamer：流已经结束，可以把尾巴处理完（比如遗留的代理对）
  resultStreamer.finalize();

  // ---- 解析最终 JSON ----
  let finalContent = "";
  let debug_reasoning: string | null = null;
  try {
    if (fullJsonText.trim()) {
      const json = JSON.parse(fullJsonText);

      // 1️⃣ 主内容：result
      const resultText =
        typeof json.result === "string" ? json.result : "";

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
      content: finalContent
    },
    content: finalContent,
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
}

// availableFunctions 已从 ../../../tools 导入，无需重复定义

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

      if (availableFunctions[functionName]) {
        const functionToCall = availableFunctions[functionName];
        const result = functionToCall(functionArgs);

        console.log(`[AI Service] 工具 ${functionName} 执行结果: ${result}`);

        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(result)
        });
      } else {
        throw new Error(`未找到工具函数: ${functionName}`);
      }
    }

    // 构建包含工具调用和结果的完整消息历史
    // 注意：userMessages 不应该包含 system message，因为 callDeepSeekAPI 会在内部添加
    const messagesWithToolResults = [
      ...userMessages,
      {
        role: "assistant",
        content: assistantMessage.content || null,
        tool_calls: toolCalls
      },
      ...toolResults
    ];

    console.log("[AI Service] 准备发送第二次API请求，包含工具结果");
    console.log(
      "[AI Service] 消息历史:",
      JSON.stringify(messagesWithToolResults, null, 2)
    );

    if (stream) {
      const streamResult = await streamDeepSeekAPI(
        messagesWithToolResults,
        showDebugReasoning,
        onPartialResponse
      );
      return {
        content: streamResult.content,
        debug_reasoning: streamResult.debug_reasoning
      };
    }

    // 第二次API调用：将工具结果发送给模型，让模型生成最终回复
    const data = await callDeepSeekAPI(
      messagesWithToolResults,
      showDebugReasoning
    );

    // 处理模型的最终回复
    if (data.choices && data.choices[0].message) {
      const apiResponse = data.choices[0].message.content;
      console.log("[AI Service] 第二次请求最终响应apiResponse:", apiResponse);
      const parsed = parseModelContent(apiResponse);

      return parsed;
    }

    throw new Error("API响应格式不正确，未找到有效回复");
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

// 流式回答：处理普通回答的流式输出
const getAIResponseWithStreaming = async (
  userMessages: any[],
  onPartialResponse: (partialResponse: string) => void,
  showDebugReasoning: boolean
): Promise<AIResponse> => {
  // 这里只做“普通回答”的流式输出
  const streamResult = await streamDeepSeekAPI(
    userMessages,
    showDebugReasoning,
    onPartialResponse
  );
  console.log("streamResult:", streamResult);
  // 暂时不做工具调用的流式处理，真正需要函数调用时可以走非流式 fallback
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
