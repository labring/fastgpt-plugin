import { ToolPlugin } from '@fastgpt-plugin/helpers/index';
import { handler } from './src/tool';

const plugin = new ToolPlugin();

plugin.registerTool(handler);

export { plugin };
