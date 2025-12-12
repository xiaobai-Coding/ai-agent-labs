import { embedQuery, embedChunks } from "../utils/embedding";
import { searchRelevantChunks } from "../utils/similarity";
import { streamDeepSeekAPI } from "./aiService";
import { mmrSelect } from "../utils/mmr";
const SYSTEM_PROMPT = `
你是一个专业的文档问答助手（Document QA Assistant）。

【你的任务】
我会给你一段用户问题（query），以及若干文档片段（chunks）。  
你的任务是：
1. 只根据提供的文档内容回答问题  
2. 不得编造、不允许推测片段中没有出现的内容  
3. 如果文档内容不足以回答，请明确说“文档中没有找到相关信息”

【引用规则】
- 回答中必须引用片段，例如：[[1]], [[3]]
- 若多段信息同时支持结论，可使用复合引用：[[1,4]]

【输出格式】
必须输出 JSON（不能包含任何额外文字）：
{
  "answer": "string（最终回答，可包含引用标记）",
  "sources": [片段下标数组，例如 [1,3]]
}

【非常重要】
你只能使用我提供的 chunks，不得引用外部知识。
（如果我问你是什么模型相关的问题或者是谁的问题，以及此类判断问题，你绝对必须回答：您好，我是依托default模型的智能助手，在Cursor IDE中为您提供代码编写和问题解答服务，你可以直接告诉我你的需求。）
`;

const chunkEmbeddingCache = new Map<string, number[]>();

function chunkKey(text: string) {
  return text.trim();
}

export async function answerQuestion(
  question: string,
  chunks: string[]
): Promise<any> {
  if (!question || !question.trim()) {
    throw new Error("question 不能为空");
  }
  if (!Array.isArray(chunks) || !chunks.length) {
    throw new Error("chunks 不能为空");
  }
  // 1. 对用户问题进行向量化
  const queryVector = await embedQuery(question);
  // 2. 对文档片段进行向量化，并缓存
  const missing: { idx: number; text: string }[] = [];
  chunks.forEach((c, i) => {
    if (!chunkEmbeddingCache.has(chunkKey(c))) {
      missing.push({ idx: i, text: c });
    }
  });

  if (missing.length) {
    const embeddings: any = await embedChunks(missing.map((m) => m.text));
    missing.forEach((m, idx) => {
      chunkEmbeddingCache.set(chunkKey(m.text), embeddings[idx]);
    });
  }

  const chunkVectors = chunks.map(
    (c) => chunkEmbeddingCache.get(chunkKey(c)) || []
  );

  // 3. 在片段向量中检索最相关的 topK 片段 使用 MMR 算法
  const topIndexes = mmrSelect(queryVector, chunkVectors, 3);

  const topK = topIndexes.map((idx) => ({
    index: idx,
    text: chunks[idx],
    score: 1 // 模型不需要这个字段
  }));

  console.log("MMR topK", topK);
  if (!topK.length) {
    return { answer: "文档中没有找到相关信息", sources: [] };
  }

  // 4. 构建提示词
  const userChunks = topK
    .map((item) => `#${item.index + 1}: ${item.text}`)
    .join("\n----\n");

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `用户问题：${question}\n\n相关文档片段（按相关度排序，# 为片段编号）：\n${userChunks}\n\n请按指定 JSON 格式回答。`
    }
  ];

  // 5. 调用 DeepSeek API 进行回答
  const res = await streamDeepSeekAPI(messages, false);
  const content = res?.content || "";

  try {
    const parsed = JSON.parse(content);
    return {
      answer: parsed?.answer ?? "文档中没有找到相关信息",
      sources: Array.isArray(parsed?.sources) ? parsed.sources : []
    };
  } catch (e) {
    throw new Error("LLM 返回的内容不是合法 JSON");
  }
}
