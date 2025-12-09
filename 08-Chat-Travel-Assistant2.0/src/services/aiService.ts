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
import { runWorkflow } from "../workflow/executor";
import { tools } from "../tools";
import type { WorkflowPlan } from "../workflow/types";

// 所有可用的函数定义
export const functionDefinitions: FunctionDefinition[] = [
  calculatorFunction,
  unitConverterFunction,
  weatherToolFunction,
  travelAdviceFunction,
  trafficTimeFunction,
  packingListFunction,
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

// 任务规划阶段类型
export type PlanningStage = "intent" | "tool" | "answer";
export type PlanningStatus = "pending" | "running" | "completed" | "error";

export interface PlanningUpdatePayload {
  stage: PlanningStage;
  status: PlanningStatus;
  detail?: string;
}

export interface ToolEventPayload {
  type: "start" | "success" | "error";
  toolName: string;
  args?: Record<string, any>;
  result?: any;
  error?: string;
}

export interface AIExecutionHooks {
  onPlanningUpdate?: (payload: PlanningUpdatePayload) => void;
  onToolEvent?: (payload: ToolEventPayload) => void;
}

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
  onPartialResponse?: (partial: string) => void,
  options?: {
    includeTools?: boolean;
    toolChoice?: "auto" | "none";
  }
): Promise<any> => {
  const includeTools = options?.includeTools ?? true;
  const toolChoice =
    options?.toolChoice ?? (includeTools ? "auto" : "none");
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
    tools: includeTools
      ? functionDefinitions.map((func) => ({
          type: "function",
          function: func
        }))
      : [],
    tool_choice: toolChoice,
    temperature: config.temperature,
    // max_tokens: 1000,
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
        // console.log("delta:", delta);
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
      console.log("json====>", json)
      // 1️⃣ 主内容：result
      const resultText = typeof json.result === "string" ? json.result : JSON.stringify(json.result) || json.reason; // 如果result不是字符串，就用reason

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
  hooks?: AIExecutionHooks;
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
    onPartialResponse,
    hooks
  } = options;
  console.log(`[AI Service] 处理工具调用，工具数量: ${toolCalls.length}`);

  try {
    hooks?.onPlanningUpdate?.({
      stage: "tool",
      status: "running",
      detail: `即将执行 ${toolCalls.length} 个工具`
    });
    // 执行所有工具调用
    const toolResults = [];
    for (const toolCall of toolCalls) {
      const functionCall = toolCall.function;
      const functionName = functionCall.name;
      const functionArgs = JSON.parse(functionCall.arguments || "{}");

      console.log(`${toolCall.name}： [AI Service] 执行工具: ${functionName}`, functionArgs);
      console.log(`${toolCall.name}： [AI Service] 执行工具参数:`, functionArgs);
      hooks?.onToolEvent?.({
        type: "start",
        toolName: functionName,
        args: functionArgs
      });
      // 1. 执行工具
      if (availableFunctions[functionName]) {
        const functionToCall = availableFunctions[functionName];
        try {
          const result = functionToCall(functionArgs);
          hooks?.onToolEvent?.({
            type: "success",
            toolName: functionName,
            args: functionArgs,
            result
          });
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify(result)
          });
          console.log(`${functionCall.name}： [AI Service] 工具执行结果:`, result);
        } catch (error) {
          console.error(`${functionCall.name}： [AI Service] 执行工具失败: ${error}`);
          hooks?.onToolEvent?.({
            type: "error",
            toolName: functionName,
            args: functionArgs,
            error: String(error)
          });
          hooks?.onPlanningUpdate?.({
            stage: "tool",
            status: "error",
            detail: `工具 ${functionName} 执行失败`
          });
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
    const messagesWithToolResults = [
      ...userMessages,
      {
        role: "assistant",
        content: assistantMessage.content || "null",
        tool_calls: toolCalls
      },
      ...toolResults
    ];

    hooks?.onPlanningUpdate?.({
      stage: "tool",
      status: "completed",
      detail: "所有工具调用完成，准备生成回答"
    });
    // 2. 第二次发送请求，带上工具函数调用结果，获取模型最终回复
    if (stream) {
      const streamResult = await streamDeepSeekAPI(
        messagesWithToolResults,
        showDebugReasoning,
        onPartialResponse
      );
      console.log(`[AI Service] 工具调用API请求返回结果:`, streamResult);
      return {
        message: streamResult.message,
        content: streamResult.content,
        debug_reasoning: streamResult.debug_reasoning,
        tool_calls: streamResult.tool_calls
      };
    }
    // 非流式：直接调用 API 获取最终回复
    const apiResult = await callDeepSeekAPI(
      messagesWithToolResults,
      showDebugReasoning
    );
    const finalMessage = apiResult.choices?.[0]?.message;
    return {
      content: finalMessage?.content || "",
      debug_reasoning: finalMessage?.debug || null,
      tool_calls: finalMessage?.tool_calls
    };
  } catch (error: any) {
    console.error(`[AI Service] 工具调用处理失败: ${error}`);
    throw error;
  }
};

// 非流式 fallback：处理工具调用
const getAIResponseFallback = async (
  userMessages: any[],
  onPartialResponse: (partialResponse: string) => void,
  showDebugReasoning: boolean,
  hooks?: AIExecutionHooks
): Promise<AIResponse> => {
  // 调用API获取响应
  const data = await callDeepSeekAPI(userMessages, showDebugReasoning);
  hooks?.onPlanningUpdate?.({
    stage: "intent",
    status: "completed",
    detail: "完成需求理解"
  });

  if (
    data.choices &&
    data.choices[0].message &&
    data.choices[0].message.tool_calls
  ) {
    const toolCalls = data.choices[0].message.tool_calls;
    const assistantMessage = data.choices[0].message;

    hooks?.onPlanningUpdate?.({
      stage: "tool",
      status: "running",
      detail: "检测到模型需要调用工具"
    });
    const finalResponse = await handleToolResponse(
      userMessages,
      assistantMessage,
      toolCalls,
      {
        showDebugReasoning,
        hooks
      }
    );
    hooks?.onPlanningUpdate?.({
      stage: "tool",
      status: "completed"
    });
    hooks?.onPlanningUpdate?.({
      stage: "answer",
      status: "running",
      detail: "整合工具结果"
    });

    await delay(500);
    await simulateTyping(finalResponse.content, (char) => {
      onPartialResponse(char);
    });

    hooks?.onPlanningUpdate?.({
      stage: "answer",
      status: "completed"
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

    hooks?.onPlanningUpdate?.({
      stage: "answer",
      status: "running"
    });
    hooks?.onPlanningUpdate?.({
      stage: "answer",
      status: "completed"
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

/**
 * 检测内容是否是 WorkflowPlan JSON
 */
function parseWorkflowPlan(content: string): WorkflowPlan | null {
  try {
    // 尝试解析 JSON
    const parsed = JSON.parse(content);
    // 检查是否符合 WorkflowPlan 结构
    if (
      parsed.phase === "planning" &&
      parsed.params &&
      parsed.steps &&
      Array.isArray(parsed.steps)
    ) {
      return parsed as WorkflowPlan;
    }
  } catch (e) {
    // 不是有效的 JSON 或不符合结构
  }
  return null;
}

/**
 * 执行工作流并生成最终答案
 */
let testNum = 0
async function executeTravelWorkflow(
  plan: WorkflowPlan,
  userMessages: any[],
  onPartialResponse: (partialResponse: string) => void,
  showDebugReasoning: boolean,
  hooks?: AIExecutionHooks
): Promise<AIResponse> {
  console.log("[Workflow] 开始执行工作流:", plan);

  // 🔥 测试模式：通过 URL 参数或环境变量控制错误恢复测试
  // 使用方法：在浏览器地址栏添加 ?testErrorRecovery=true
  // 或者在 .env.local 中设置 VITE_TEST_ERROR_RECOVERY=true
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const testErrorRecovery = 
    urlParams?.get('testErrorRecovery') === 'true' || 
    import.meta.env.VITE_TEST_ERROR_RECOVERY === 'true';
    // 只在第一次执行工作流时执行错误恢复测试
  if (testErrorRecovery && testNum === 0) {
    console.warn("[测试模式] 🔥 强制清空 destination 以测试错误恢复机制");
    console.warn("[测试模式] 原始 destination:", plan.params.destination);
    // plan.params.destination = ""; // 强制触发错误
    // plan.params.date = ""; // 强制触发错误
  }
// testNum++
console.log("testNum===>", testNum)
  hooks?.onPlanningUpdate?.({
    stage: "tool",
    status: "running",
    detail: `开始执行工作流，共 ${plan.steps.length} 个步骤`
  });

  try {
    // 执行工作流
    const { plan: executedPlan, context } = await runWorkflow(plan, tools, {
      onStepStart: (step) => {
        hooks?.onToolEvent?.({
          type: "start",
          toolName: step.tool || "unknown",
          args: { action: step.action, category: step.category }
        });
      },
      onStepSuccess: (step, result) => {
        hooks?.onToolEvent?.({
          type: "success",
          toolName: step.tool || "unknown",
          args: { action: step.action, category: step.category },
          result
        });
      },
      onStepError: (step, error) => {
        hooks?.onToolEvent?.({
          type: "error",
          toolName: step.tool || "unknown",
          args: { action: step.action, category: step.category },
          error: error.message
        });
      },
      onStepErrorRecovery: async (step, error, context) => {
        console.log("[Workflow] 尝试错误恢复，步骤:", step.id, step.action);
        
        hooks?.onPlanningUpdate?.({
          stage: "tool",
          status: "running",
          detail: `步骤 ${step.id} 执行失败，正在尝试修复参数...`
        });

        // 构造错误恢复提示消息
        const errorRecoveryMessage = {
          role: "user" as const,
          content: `🔧 工具执行错误，需要修正参数后重试

【当前步骤信息】
${JSON.stringify({
  id: step.id,
  action: step.action,
  category: step.category,
  tool: step.tool
}, null, 2)}

【当前工作流参数】
${JSON.stringify(context.params, null, 2)}

【错误信息】
${error.message}

【任务要求】
请分析错误原因，并根据以下规则返回修正后的工作流参数（WorkflowParams）：

1. 如果参数缺失，从用户原始需求中提取或合理推断
2. 如果参数格式错误，修正为正确的格式
3. 如果参数值无效，替换为有效值
4. 如果无法修正，返回 null

【参数格式要求】
{
  "destination": "string（必填，城市名称，如'北京'、'上海'）",
  "date": "string（必填，日期格式 YYYY-MM-DD，如'2025-04-09'）",
  "stay_days": number（必填，数字，如 1）,
  "transportation_preference": "string（必填，可选值：'自驾'、'高铁'、'飞机'、'火车'）"
}

【返回格式】
请以 JSON 格式返回，格式如下：
{
  "corrected_params": {
    "destination": "string",
    "date": "string",
    "stay_days": number,
    "transportation_preference": "string"
  } | null
}

⚠️ 重要：返回的参数必须符合上述格式要求，所有字段都是必填的。`
        };

        try {
          // 调用模型获取修正后的参数
          const recoveryResult = await streamDeepSeekAPI(
            [...userMessages, errorRecoveryMessage],
            showDebugReasoning,
            undefined as any, // 不输出到用户界面
            { includeTools: false, toolChoice: "none" }
          );

          if (recoveryResult.content) {
            try {
              const parsed = JSON.parse(recoveryResult.content);
              if (parsed.corrected_params) {
                const correctedParams = parsed.corrected_params;
                // 验证参数格式
                if (
                  typeof correctedParams.destination === "string" &&
                  typeof correctedParams.date === "string" &&
                  typeof correctedParams.stay_days === "number" &&
                  typeof correctedParams.transportation_preference === "string"
                ) {
                  console.log("[Workflow] 获取到修正后的参数:", correctedParams);
                  hooks?.onPlanningUpdate?.({
                    stage: "tool",
                    status: "running",
                    detail: `参数已修正，正在重试步骤 ${step.id}...`
                  });
                  return correctedParams;
                } else {
                  console.warn("[Workflow] 修正后的参数格式不正确:", correctedParams);
                }
              }
            } catch (parseError) {
              console.warn("[Workflow] 解析修正参数失败:", parseError);
            }
          }
        } catch (recoveryError) {
          console.error("[Workflow] 错误恢复请求失败:", recoveryError);
        }

        // 无法恢复，返回 null
        return null;
      }
    });

    hooks?.onPlanningUpdate?.({
      stage: "tool",
      status: "completed",
      detail: "工作流执行完成"
    });

    // 构建包含工作流执行结果的消息，发送给模型生成最终答案
    const workflowResultMessage = {
      role: "user" as const,
      content: `工作流执行完成，请根据以下结果生成最终答案（必须是 JSON 格式）：
      
工作流参数：
${JSON.stringify(context.params, null, 2)}

执行结果：
${JSON.stringify(
        executedPlan.steps.map((s) => ({
          id: s.id,
          action: s.action,
          status: s.status,
          output: s.output
        })),
        null,
        2
      )}

请生成符合以下格式的 JSON 答案：
{
  "judgement": "has_evidence" | "no_evidence",
  "result": "string（基于工作流结果的完整回答）",
  "reason": "string（简要说明判断和结论依据）",
  "confidence": 0.0 ~ 1.0,
  "debug": "不超过2行的简短推理摘要"
}`
    };

    const messagesWithWorkflowResult = [...userMessages, workflowResultMessage];

    hooks?.onPlanningUpdate?.({
      stage: "answer",
      status: "running",
      detail: "基于工作流结果生成最终答案"
    });

    // 调用模型生成最终答案
    const finalResult = await streamDeepSeekAPI(
      messagesWithWorkflowResult,
      showDebugReasoning,
      onPartialResponse
    );

    hooks?.onPlanningUpdate?.({
      stage: "answer",
      status: "completed",
      detail: "最终答案生成完成"
    });

    return {
      content: finalResult.content,
      debug_reasoning: finalResult.debug_reasoning
    };
  } catch (error: any) {
    hooks?.onPlanningUpdate?.({
      stage: "tool",
      status: "error",
      detail: `工作流执行失败: ${error.message}`
    });
    throw error;
  }
}

// 流式回答：处理普通回答的流式输出/处理工具调用的流式输出
const getAIResponseWithStreaming = async (
  userMessages: any[],
  onPartialResponse: (partialResponse: string) => void,
  showDebugReasoning: boolean,
  hooks?: AIExecutionHooks
): Promise<AIResponse> => {
  // 如果第一轮没有得到 WorkflowPlan，则走旧逻辑（允许工具调用）
  const streamResult = await streamDeepSeekAPI(
    userMessages,
    showDebugReasoning,
    undefined as any,
    { includeTools: false, toolChoice: "none" }
  );
  console.log("streamResult:", streamResult);
  hooks?.onPlanningUpdate?.({
    stage: "intent",
    status: "completed",
    detail: "完成需求理解"
  });

  // 检查模型返回的内容是否是 WorkflowPlan
  if (streamResult.content) {
    const workflowPlan = parseWorkflowPlan(streamResult.content);
    if (workflowPlan) {
      console.log("[Workflow] 检测到 WorkflowPlan，开始执行工作流");
      return await executeTravelWorkflow(
        workflowPlan,
        userMessages,
        onPartialResponse,
        showDebugReasoning,
        hooks
      );
    }
  }

  // 如果模型触发了工具调用，执行工具后再流式返回最终结果
  if (streamResult.tool_calls?.length) {
    hooks?.onPlanningUpdate?.({
      stage: "tool",
      status: "running",
      detail: "检测到模型需要调用工具"
    });
    const assistantMessage = {
      role: "assistant",
      content: streamResult.content || null,
      tool_calls: streamResult.tool_calls
    };
    // 如果模型触发了工具调用，执行工具后再流式返回最终结果，支持工具反制
    const resolved = await resolveToolCalls(
      userMessages,
      assistantMessage,
      streamResult.tool_calls,
      {
        showDebugReasoning,
        stream: true,
        onPartialResponse,
        hooks
      }
    );
    hooks?.onPlanningUpdate?.({
      stage: "tool",
      status: "completed",
      detail: "工具链执行完成"
    });
    hooks?.onPlanningUpdate?.({
      stage: "answer",
      status: "running",
      detail: "整合工具结果"
    });
    hooks?.onPlanningUpdate?.({
      stage: "answer",
      status: "completed",
      detail: "回答生成完成"
    });
    return resolved;
  }

  hooks?.onPlanningUpdate?.({
    stage: "answer",
    status: "running",
    detail: "直接生成回答"
  });
  hooks?.onPlanningUpdate?.({
    stage: "answer",
    status: "completed"
  });
  console.log("streamResult.content=======>",streamResult.content)
  return {
    content: streamResult.content,
    debug_reasoning: streamResult.debug_reasoning
  };
};

// 主函数：根据是否支持流式输出选择不同的处理方式
export const getAIResponse = async (
  userMessages: any[],
  onPartialResponse: (partialResponse: string) => void,
  showDebugReasoning: boolean = false,
  hooks?: AIExecutionHooks
): Promise<AIResponse> => {
  console.log("[AI Service] getAIResponse被调用");
  hooks?.onPlanningUpdate?.({
    stage: "intent",
    status: "running",
    detail: "AI 正在分析你的问题"
  });
  hooks?.onPlanningUpdate?.({
    stage: "tool",
    status: "pending"
  });
  hooks?.onPlanningUpdate?.({
    stage: "answer",
    status: "pending"
  });

  if (!supportsStreaming()) {
    return getAIResponseFallback(
      userMessages,
      onPartialResponse,
      showDebugReasoning,
      hooks
    );
  }

  try {
    return await getAIResponseWithStreaming(
      userMessages,
      onPartialResponse,
      showDebugReasoning,
      hooks
    );
  } catch (error) {
    console.warn("[AI Service] 流式输出失败，回退到打字机模式:", error);
    return getAIResponseWithStreaming(
      userMessages,
      onPartialResponse,
      showDebugReasoning,
      hooks
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
