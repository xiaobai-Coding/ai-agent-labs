// 从环境变量中读取配置
const getConfig = () => ({
  apiKey: import.meta.env.VITE_AI_API_KEY || "",
  apiBaseUrl: import.meta.env.VITE_AI_API_BASE_URL || "https://api.deepseek.com",
  model: "deepseek-chat",
  temperature: 0.3 // 控制回复的随机性
});

const config = getConfig();
/**
 * 生成 JSON Schema
 * @param userPrompt 用户输入的表单需求
 * @returns JSON Schema
 */
export async function callDeepSeekAPI(userPrompt: string, prompt: string | null) {
  const messages = [
    { role: "system", content: prompt || '' },
    { role: "user", content: userPrompt }
  ];

  const endpoint = `${config.apiBaseUrl}/chat/completions`;
  const requestBody = {
    model: config.model,
    messages: messages,
    temperature: config.temperature,
    // stream: true
  };
  const res = await fetch('/api/ai', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await res.json();
  const choices = data.choices[0].message.content;
  // 假设模型返回的是纯 JSON 字符串
  return JSON.parse(choices);
}
