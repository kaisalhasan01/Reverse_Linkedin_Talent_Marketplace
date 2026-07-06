import { getDocumentProxy } from "unpdf";

/**
 * PDF → plain text, entirely on our server (no third party sees the file).
 * unpdf wraps pdf.js compiled for serverless — no native dependencies.
 *
 * pdf.js returns positioned text fragments, not lines — naive joining loses
 * all line breaks and breaks section detection. We reconstruct lines by
 * grouping fragments on their Y coordinate.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const lines: string[] = [];

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();

    let currentY: number | null = null;
    let line = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = Math.round(item.transform[5]);
      if (currentY !== null && Math.abs(y - currentY) > 2) {
        lines.push(line.trim());
        line = "";
      }
      line += item.str + " ";
      currentY = y;
    }
    if (line.trim()) lines.push(line.trim());
    lines.push(""); // page break
  }

  return lines.join("\n").trim();
}
