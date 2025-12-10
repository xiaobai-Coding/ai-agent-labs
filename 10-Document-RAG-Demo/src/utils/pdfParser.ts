import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
/**
 * 解析PDF文件中的文本
 * @param file - PDF文件
 * @returns 解析后的文本
 */
export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  
  // 遍历所有页面，提取文本
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    
    // 添加页码标记，方便识别分页
    pages.push(`[第 ${i} 页 / 共 ${pdf.numPages} 页]\n${pageText}`);
  }

  // 用双换行符分隔不同页面，使分页更清晰
  return pages.join("\n\n");
}