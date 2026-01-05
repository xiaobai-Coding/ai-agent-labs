/**
 * 轻量版Prompt Injection风险检测
 * 扫描指定关键词，检测潜在的注入攻击
 */

const INJECTION_KEYWORDS = [
  'ignore previous',
  'system prompt',
  'developer message',
  'api key',
  'reveal',
  'password',
  'token',
  'curl'
];

export interface InjectionScanResult {
  hasRisk: boolean;
  flaggedIndexes: number[];
}

/**
 * 扫描文本数组中的注入风险
 * @param texts 要扫描的文本数组
 * @returns 扫描结果，包含是否有风险和标记的索引
 */
export function scanInjectionRisk(texts: string[]): InjectionScanResult {
  const flaggedIndexes: number[] = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i]?.toLowerCase();

    if (!text) continue;

    // 检查是否包含任一关键词
    const hasKeyword = INJECTION_KEYWORDS.some(keyword =>
      text.includes(keyword.toLowerCase())
    );

    if (hasKeyword) {
      flaggedIndexes.push(i);
    }
  }

  return {
    hasRisk: flaggedIndexes.length > 0,
    flaggedIndexes
  };
}
