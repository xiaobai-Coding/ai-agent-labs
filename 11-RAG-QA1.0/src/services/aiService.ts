import { createResultStreamer } from "../utils/utils";
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

  // 极简 + 正确版：只流式输出 JSON 里的 result 字段
type StreamResult = {
  message: { role: string; content: string | null; tool_calls?: any[] };
  content: string;
  debug_reasoning: string | null;
  tool_calls?: any[];
  raw?: string;
};
/**
 * 流式输出 JSON 里的 result 字段
 * @param userMessages 用户消息
 * @param _showDebugReasoning 是否显示推理内容
 * @param onPartialResponse 部分响应回调
 * @returns StreamResult
 */
export const streamDeepSeekAPI = async (
  userMessages: any[],
  _showDebugReasoning: boolean = false, // 保留签名，暂未使用
  onPartialResponse?: (partial: string) => void
): Promise<StreamResult> => {
   
  
    if (!config.apiKey) {
      throw new Error("未配置 API 密钥，请检查 .env.local 文件");
    }
  
  
    const endpoint = `${config.apiBaseUrl}/chat/completions`;
    const requestBody = {
      model: config.model,
      messages: userMessages,
      temperature: config.temperature,
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
    // 🔥 用你之前写好的 result 字段状态机，只对 `"result": "..."` 内部字符调用 onPartialResponse
    const resultStreamer = onPartialResponse ? createResultStreamer(onPartialResponse) : null;
  
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
  
            // ② 如果有回调，优先尝试通过 resultStreamer 解析 "result" 字段
            //    如果模型返回的 JSON 不包含 "result" 字段，resultStreamer 不会调用回调
            //    此时直接调用回调以确保实时流式输出
            if (resultStreamer) {
              resultStreamer.handleChunk(chunk);
            }
            // 直接调用回调以确保实时流式输出（适用于模型返回的 JSON 不包含 "result" 字段的情况）
            // 注意：如果模型返回的 JSON 包含 "result" 字段，resultStreamer 也会调用回调，可能会重复调用
            // 但这样可以确保无论哪种情况都能实时看到流式输出
            if (onPartialResponse) {
              onPartialResponse(chunk);
            }
          }
        } catch (err) {
          console.error("[AI Service] 流式数据解析失败:", err);
        }
      }
    }
    
    // 在流处理完成后调用 finalize
    if (resultStreamer) {
      resultStreamer.finalize();
    }
    
    console.log("最终json文本fullJsonText:", fullJsonText);

  
 

  
    // ---- 返回统一结构 ----
    return {
      message: { role: "assistant", content: fullJsonText },
      content: fullJsonText,
      debug_reasoning: null
    }
  };