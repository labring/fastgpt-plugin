import { z } from 'zod';
import { docxTool } from './docx';
import { pptxTool } from './pptx';
import { xlsxTool } from './xlsx';
import { OutputType } from './type';

export const InputType = z.object({
  format: z.enum(['xlsx', 'docx', 'pptx']),
  markdown: z.string(),
  filename: z.string().optional()
});

export async function tool({
  format,
  markdown,
  filename
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  if (format === 'xlsx') {
    return xlsxTool({ markdown, filename });
  }
  if (format === 'docx') {
    return docxTool({ markdown, filename });
  }
  if (format === 'pptx') {
    return pptxTool({ markdown, filename });
  }
  return Promise.reject('Invalid format');
}
