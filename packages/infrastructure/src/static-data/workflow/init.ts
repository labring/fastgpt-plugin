import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { getLogger, mod } from '@infrastructure/logger';

import type { TemplateItemType, TemplateListType } from './type';

const logger = getLogger(mod.workflow);

export const workflows: TemplateListType = [];

const workflowTemplateDirs = [
  fileURLToPath(new URL('./templates', import.meta.url)),
  join(process.cwd(), 'dist', 'workflows')
];

function getWorkflowTemplateDir() {
  const target = workflowTemplateDirs.find((dir) => existsSync(dir));
  if (!target) {
    throw new Error('Workflow template directory not found');
  }
  return target;
}

export const initWorkflowTemplates = async () => {
  const publicWorkflowsPath = getWorkflowTemplateDir();

  workflows.length = 0;

  // according to the environment to decide to read the way
  const items = await readdir(publicWorkflowsPath, { withFileTypes: true });
  const templateItems = items.filter((item) => item.isFile() && item.name.endsWith('.json'));

  for (const item of templateItems) {
    const templatePath = join(publicWorkflowsPath, item.name);

    const fileBuffer = await readFile(templatePath, 'utf-8');
    const fileContent = fileBuffer.toString();
    const templateData = JSON.parse(fileContent);

    const template = {
      ...templateData,
      templateId: item.name.replace(/\.json$/i, ''),
      isActive: true
    } as TemplateItemType;

    workflows.push(template);
  }

  logger.info(`[init] workflow templates count: ${workflows.length}`);
};
