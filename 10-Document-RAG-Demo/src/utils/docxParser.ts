import * as mammoth from "mammoth";

/**
 * 解析DOCX文件中的文本
 * @param file - DOCX文件
 * @returns 解析后的文本（保留分页信息）
 */
export async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    // 方法1: 使用 convertToHtml 可以更好地保留文档结构，包括分页符
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    
    if (htmlResult.value) {
      // 将 HTML 转换为纯文本，但保留分页标记
      // mammoth 会将分页符转换为包含 page-break 的样式
      let text = htmlResult.value
        // 检测分页符标记（多种可能的格式）
        .replace(/<p[^>]*style="[^"]*page-break[^"]*"[^>]*>/gi, '\n\n[分页]\n\n')
        .replace(/<p[^>]*class="[^"]*page-break[^"]*"[^>]*>/gi, '\n\n[分页]\n\n')
        .replace(/<div[^>]*style="[^"]*page-break[^"]*"[^>]*>/gi, '\n\n[分页]\n\n')
        // 处理换行和段落
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        // 移除所有其他 HTML 标签
        .replace(/<[^>]+>/g, '')
        // 解码 HTML 实体
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // 清理多余的空白和换行
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
      
      return text || "";
    }
  } catch (error) {
    console.warn("HTML 转换失败，回退到纯文本提取:", error);
  }
  
  // 方法2: 如果 HTML 转换失败，回退到 extractRawText
  // 注意：extractRawText 不会保留分页信息，但至少能提取所有文本
  const rawResult = await mammoth.extractRawText({ arrayBuffer });
  const rawText = rawResult.value || "";
  
  // 如果文本较长，可以尝试根据段落长度推断分页（简单启发式方法）
  // 但这只是近似，因为 DOCX 的分页信息在 extractRawText 中已丢失
  if (rawText.length > 2000) {
    // 对于长文档，在每 1500 字符左右添加一个分隔标记（仅供参考）
    const chunks = rawText.match(/.{1,1500}(?:\s|$)/g) || [rawText];
    return chunks.map((chunk, index) => 
      index > 0 ? `\n\n[可能的分页位置 ${index + 1}]\n\n${chunk}` : chunk
    ).join('');
  }
  return rawText;
}