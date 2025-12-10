import { documents } from "./docs";
import { cosineSimilarity } from "./similarity";
import { embedText } from "./embedding";

/**
 * 
 * 搜索相关文档
 * @param query 查询词
 * @param topK 返回的文档数量
 * @returns 相关文档
 */
export const searchRelevantDocs = (query: string, topK = 2) => {
  const queryVec = embedText(query);

  const scored = documents.map(doc => ({
    ...doc,
    score: cosineSimilarity(queryVec, doc.embedding)
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
};