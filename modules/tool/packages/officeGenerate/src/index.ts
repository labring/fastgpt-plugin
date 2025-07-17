import { z } from 'zod';
import { docxTool } from './docx';
import { xlsxTool } from './xlsx';

export const InputType = z.object({
  format: z.string(),
  markdown: z.string()
});

export const OutputType = z.object({
  downloadUrl: z.string()
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
  throw new Error('Invalid format');
}
