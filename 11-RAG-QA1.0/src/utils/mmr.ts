import { cosineSimilarity } from "./similarity";

/**
 * MMR 最大边际相关性检索
 * @param queryEmbedding 查询向量
 * @param docEmbeddings 文档片段向量数组
 * @param topK 选取数量
 * @param lambda 相关性 - 多样性权重（0.7 为行业常用值）
 */
export function mmrSelect(
  queryEmbedding: number[],
  docEmbeddings: number[][],
  topK: number = 5,
  lambda: number = 0.7
) {
  const selected: number[] = [];
  const candidates = [...docEmbeddings.keys()];

  while (selected.length < topK && candidates.length > 0) {
    let bestIndex = -1;
    let bestScore = -Infinity;

    for (const i of candidates) {
      const relevance = cosineSimilarity(queryEmbedding, docEmbeddings[i]);

      let diversity = 0;
      if (selected.length > 0) {
        const sims = selected.map(j =>
          cosineSimilarity(docEmbeddings[i], docEmbeddings[j])
        );
        diversity = Math.max(...sims);
      }

      const mmrScore = lambda * relevance - (1 - lambda) * diversity;

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    }

    selected.push(bestIndex);
    candidates.splice(candidates.indexOf(bestIndex), 1);
  }

  return selected;
}