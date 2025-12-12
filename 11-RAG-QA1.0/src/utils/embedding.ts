/**
 * DeepSeek embedding helper
 * - embedQuery: 单条查询文本向量化
 * - embedChunks: 批量片段向量化
 *
 * 注意：
 * 1. 不做归一化，保持模型原有数量级
 * 2. 对空文本做防御处理
 * 3. 调用 deepseek-embedding 接口
 */

const ALI_API_KEY = import.meta.env.VITE_ALI_API_KEY || "";
const MODEL = "text-embedding-v4"; // 模型名称

// 使用 阿里云的 DashScope 进行向量化
async function getAliEmbedding(text: string) {
  const response = await fetch("/ali-embed/compatible-mode/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ALI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      input: text
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ali Embedding failed: ${err}`);
  }

  const json = await response.json();
  if (json.data?.[0]?.embedding && Array.isArray(json.data[0].embedding)) {
    return json.data[0].embedding;
  }
  throw new Error(`Ali Embedding failed: ${json.error.message}`);
}

/**
 * 对用户查询生成 embedding
 */
export async function embedQuery(question: string): Promise<number[]> {
  return getAliEmbedding(question);
}

/**
 * 批量对文档片段生成 embedding
 */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  if (!Array.isArray(chunks) || !chunks.length) return [];
  // 顺序执行以避免过快并发触发限流；如需更快可改为 Promise.all
  const results: number[][] = [];
  for (const chunk of chunks) {
    const emb = await getAliEmbedding(chunk);
    results.push(emb);
  }
  return results;
}
