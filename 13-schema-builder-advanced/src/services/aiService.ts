// 从环境变量中读取配置
const getConfig = () => ({
  apiKey: import.meta.env.VITE_AI_API_KEY || "",
  apiBaseUrl:
    import.meta.env.VITE_AI_API_BASE_URL || "https://api.deepseek.com",
  model: "deepseek-chat",
  temperature: 0.3 // 控制回复的随机性
});
const config = getConfig();
/**
 * 生成 JSON Schema
 * @param userPrompt 用户输入的表单需求
 * @returns JSON Schema
 */
export async function callDeepSeekAPI(
  userPrompt: string,
  prompt: string | null
) {
  const messages = [
    { role: "system", content: prompt || "" },
    { role: "user", content: userPrompt }
  ];

  const useServerApi = import.meta.env.VITE_USE_SERVER_API === "true";

  const endpoint = useServerApi
    ? "/api/ai"
    : `${config.apiBaseUrl}/chat/completions`;
  const requestBody = {
    model: config.model,
    messages: messages,
    temperature: config.temperature
    // stream: true
  };
  let headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`
  };
  if (useServerApi) {
    headers["X-Client-Token"] = import.meta.env.VITE_CLIENT_TOKEN || "";
    delete headers.Authorization;
  }
  try { 
    const res = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      let errBody: any = {};
      try {
        errBody = await res.json();
      } catch (e) {
        // ignore
      }
      const msg =
        errBody?.error ||
        res.statusText ||
        `Request failed with status ${res.status}`;
      return { error: msg };
    }

    const data = await res.json();
    const choices = data?.choices?.[0]?.message?.content;
    if (!choices) {
      return { error: "Invalid model response" };
    }
    try {
      return JSON.parse(choices);
    } catch (e) {
      return { error: "Failed to parse model response" };
    }
  } catch (error: any) {
    const msg = error?.message || "Unknown error";
    return { error: msg };
  }
}
