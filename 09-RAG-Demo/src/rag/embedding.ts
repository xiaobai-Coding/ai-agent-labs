/**
 * 将文本转换为向量
 * @param text 文本
 * @returns 向量
 */
export const embedText = (text: string): number[] => {
    // Mock embedding：简单数字转换，不准确但够用
    return Array.from(text).map(char => char.charCodeAt(0) % 10).slice(0, 4);
  };
  
  // 将维度固定为4，真实 embedding 会有 768/1024维