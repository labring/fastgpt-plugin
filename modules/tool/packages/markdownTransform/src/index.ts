import { z } from 'zod';
import { docxTool } from './docx';
import { xlsxTool } from './xlsx';
import { OutputType } from './type';

export const InputType = z.object({
  format: z.enum(['xlsx', 'docx']),
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
  return Promise.reject('Invalid format');
}
