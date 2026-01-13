/**
 * Embedding helper - 调用本地 /api/embedding 服务
 * - embedQuery: 单条查询文本向量化
 * - embedChunks: 批量片段向量化
 *
 * 注意：
 * 1. 通过本地API调用DashScope Embedding服务
 * 2. 支持注入风险检测
 * 3. 统一错误处理
 */

interface EmbeddingResponse {
  status: 'ok' | 'error';
  data?: { embeddings: number[][] };
  meta?: {
    provider: string;
    model: string;
    hasInjectionRisk: boolean;
    flaggedIndexes: number[];
    requestId: string;
  };
  code?: string;
  message?: string;
}

/**
 * 调用本地 embedding API
 */
async function callEmbeddingAPI(texts: string[], purpose?: 'query' | 'doc'): Promise<number[][]> {
  const response = await fetch('/api/embedding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      texts,
      purpose
    })
  });

  if (!response.ok) {
    // 尝试解析错误响应
    let errorMessage = '网络请求失败';
    try {
      const errorData: EmbeddingResponse = await response.json();
      if (errorData.status === 'error' && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // 解析失败，使用默认错误信息
    }
    throw new Error(errorMessage);
  }

  const data: EmbeddingResponse = await response.json();

  if (data.status !== 'ok' || !data.data?.embeddings) {
    throw new Error('API响应格式错误');
  }

  return data.data.embeddings;
}

/**
 * 对用户查询生成 embedding
 */
export async function embedQuery(question: string): Promise<number[]> {
  const embeddings = await callEmbeddingAPI([question], 'query');
  if (!embeddings || embeddings.length === 0) {
    throw new Error('Failed to generate embedding for query');
  }
  return embeddings[0]!;
}

/**
 * 批量对文档片段生成 embedding
 */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  if (!Array.isArray(chunks) || !chunks.length) return [];

  // 直接批量调用API，更高效
  return callEmbeddingAPI(chunks, 'doc');
}
