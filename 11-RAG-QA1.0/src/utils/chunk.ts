/**
 * Overlap 重叠切片
 * @param text 输入文本
 * @param chunkSize 每个切片最大长度
 * @param overlapSize 上下重叠长度
 */
export function splitIntoChunksWithOverlap(
    text: string,
    chunkSize: number = 400,
    overlapSize: number = 80
  ): string[] {
    if (!text || chunkSize <= 0) return [];
  
    const result: string[] = [];
    const cleaned = text.trim().replace(/\s+/g, " "); // 简单清洗
  
    let start = 0;
    while (start < cleaned.length) {
      const end = Math.min(start + chunkSize, cleaned.length);
      const chunk = cleaned.slice(start, end);
  
      if (chunk.length >= 20) result.push(chunk);
  
      start += chunkSize - overlapSize; // 往前走但保留部分重叠
    }
  
    return result;
  }