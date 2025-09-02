import fs from 'fs';
import path from 'path';
import { addLog } from '@/utils/log';

export interface CopyWorkflowOptions {
  sourceDir: string;
  targetDir: string;
  logPrefix?: string;
}

// export async function copyWorkflowTemplates(options: CopyWorkflowOptions): Promise<number> {
//   const { sourceDir, targetDir, logPrefix = 'Copied workflow template' } = options;

//   // create target directory if it doesn't exist
//   if (!fs.existsSync(targetDir)) {
//     fs.mkdirSync(targetDir, { recursive: true });
//   }

//   const workflows = fs.readdirSync(sourceDir, { withFileTypes: true });

//   let copiedCount = 0;

//   const templatePath = path.join(sourceDir, dirName, 'template.json');
//   const targetPath = path.join(targetDir, `${dirName}.json`);

//   if (fs.existsSync(templatePath)) {
//     fs.cpSync(templatePath, targetPath);
//     addLog.info(`📦 ${logPrefix}: ${path.relative(process.cwd(), targetPath)}`);
//     copiedCount++;
//   }

//   return copiedCount;
// }
