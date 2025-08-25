import { s } from '@/router/init';
import { contract } from '@/contract';
import { promises as fs } from 'fs';
import path from 'path';
import { addLog } from '@/utils/log';

export const getTemplateHandler = s.route(contract.tool.getTemplate, async () => {
  // get template name list from workflows
  const currentFileUrl = new URL(import.meta.url);
  const filePath = decodeURIComponent(
    process.platform === 'win32' ? currentFileUrl.pathname.substring(1) : currentFileUrl.pathname
  );

  const workflowsPath = path.join(path.dirname(filePath), '..', '..', 'workflows');

  const workflowDirs = await fs.readdir(workflowsPath, { withFileTypes: true });
  const directories = workflowDirs
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  addLog.debug('Found workflow directories', { directories });

  const templates = [];

  // load template data from workflows
  for (const dirName of directories) {
    const templatePath = path.join(workflowsPath, dirName, 'template.json');

    const fileContent = await fs.readFile(templatePath, 'utf-8');
    const templateData = JSON.parse(fileContent);

    const template = {
      ...templateData,
      templateId: `community-${dirName}`,
      isActive: true
    };

    templates.push(template);
    addLog.debug(`Template loaded successfully`, { dirName, templateId: template.templateId });
  }

  return {
    status: 200,
    body: templates
  };
});
