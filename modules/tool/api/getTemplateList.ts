import { s } from '@/router/init';
import { contract } from '@/contract';
import { promises as fs } from 'fs';
import path from 'path';
import { addLog } from '@/utils/log';
import { isProd } from '@/constants';

export const getTemplateHandler = s.route(contract.tool.getTemplateList, async () => {
  // get template data from workflows directory
  const publicWorkflowsPath = isProd
    ? path.join(process.cwd(), 'dist', 'workflows')
    : path.join(process.cwd(), 'modules', 'workflows');

  const templates = [];

  // according to the environment to decide to read the way
  const items = await fs.readdir(publicWorkflowsPath, { withFileTypes: true });
  const templateItems = isProd
    ? items.filter((item) => item.isFile() && item.name.endsWith('.json'))
    : items.filter((item) => item.isDirectory());

  addLog.debug(`Found template items (${isProd ? 'prod' : 'dev'})`, {
    items: templateItems.map((item) => item.name)
  });

  for (const item of templateItems) {
    const dirName = isProd ? item.name.replace('.json', '') : item.name;
    const templatePath = isProd
      ? path.join(publicWorkflowsPath, item.name)
      : path.join(publicWorkflowsPath, item.name, 'template.json');

    try {
      const fileContent = await fs.readFile(templatePath, 'utf-8');
      const templateData = JSON.parse(fileContent);

      const template = {
        ...templateData,
        templateId: dirName,
        isActive: true
      };

      templates.push(template);
      addLog.debug(`Template loaded successfully`, {
        dirName,
        templateId: template.templateId
      });
    } catch (error) {
      addLog.warn(`Failed to load template ${dirName}`, { error });
    }
  }

  console.log('templates', templates);

  return {
    status: 200,
    body: templates
  };
});
