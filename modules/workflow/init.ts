import { isProd } from '@/constants';
import { addLog } from '@/utils/log';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import type { TemplateItemType, TemplateListType } from './type';

export const workflows: TemplateListType = [];

export const initWorkflowTemplates = async () => {
  const publicWorkflowsPath = isProd
    ? join(process.cwd(), 'dist', 'workflows')
    : join(process.cwd(), '..', 'modules', 'workflow', 'templates');

  // according to the environment to decide to read the way
  const items = await readdir(publicWorkflowsPath, { withFileTypes: true });
  const templateItems = items.filter((item) => item.isFile() && item.name.endsWith('.json'));

  for (const item of templateItems) {
    const dirName = isProd ? item.name.replace('.json', '') : item.name; // hack: Bun and Node.js diff

    const templatePath = join(publicWorkflowsPath, item.name);

    const fileBuffer = await readFile(templatePath, 'utf-8');
    const fileContent = fileBuffer.toString();
    const templateData = JSON.parse(fileContent);

    const template = {
      ...templateData,
      templateId: dirName,
      isActive: true
    } as TemplateItemType;

    workflows.push(template);
  }

  addLog.info(`[init] workflow templates count: ${workflows.length}`);
};
