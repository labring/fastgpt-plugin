import { ToolPlugin, createToolHandler } from '@fastgpt-plugin/helpers';
import { InputSchema, OutputSchema } from './src/schemas';
import { handler } from './src/tool';

const plugin = new ToolPlugin();
plugin.registerTool(createToolHandler({ inputSchema: InputSchema, outputSchema: OutputSchema, handler }));

export { plugin };
