import { z } from 'zod';
import { docxTool } from './docx';
import { pptxTool } from './pptx';
import { xlsxTool } from './xlsx';
import { OutputType } from './type';

export const InputType = z.object({
  format: z.enum(['xlsx', 'docx', 'pptx']),
  markdown: z.string()
});

export async function tool({
  format,
  markdown
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  if (format === 'xlsx') {
    return xlsxTool({ markdown });
  }
  if (format === 'docx') {
    return docxTool({ markdown });
  }
  if (format === 'pptx') {
    return pptxTool({ markdown });
  }
  return Promise.reject('Invalid format');
}
