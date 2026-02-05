/**
 * 余弦相似度计算
 * 返回值范围 [0,1]（当向量包含负值时可能小于 0，此处截断为 0）
 * @param a 向量a
 * @param b 向量b
 * @returns 余弦相似度
 */
export function cosineSimilarity(a: number[] | undefined, b: number[] | undefined): number {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || !b.length) return 0;
  if (a.length !== b.length) throw new Error("Vector dimension mismatch in cosineSimilarity.");

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  if (normA === 0 || normB === 0) return 0;
  const score = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  // 截断到 [0,1]，防止数值误差
  return Math.max(0, Math.min(1, score));
}

/**
 * 在片段向量中检索最相关的 topK 片段
 * @param queryVector 查询向量
 * @param chunkVectors 片段向量
 * @param chunks 片段文本
 * @param topK 返回的片段数量
 * @returns 最相关的 topK 片段
 */
export function searchRelevantChunks(
  queryVector: number[],
  chunkVectors: number[][],
  chunks: string[],
  topK: number = 3
): { index: number; text: string; score: number }[] {
  if (!Array.isArray(queryVector) || !queryVector.length) return [];
  if (!Array.isArray(chunkVectors) || !Array.isArray(chunks) || !chunkVectors.length) return [];

  const results: { index: number; text: string; score: number }[] = [];

  for (let i = 0; i < chunkVectors.length; i++) {
    const vec = chunkVectors[i];
    const text = chunks[i] ?? "";
    if (!Array.isArray(vec) || !vec.length || !text) continue;
    const score = cosineSimilarity(queryVector, vec);
    results.push({ index: i, text, score });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

