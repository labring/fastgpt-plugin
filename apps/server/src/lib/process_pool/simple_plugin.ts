/**
 * 最简插件示例 - 展示最简洁的插件写法
 */

import { ChildIpcTransport, BasePluginRouter } from '@fastgpt-plugin/helpers';

const transport = new ChildIpcTransport();
const router = new BasePluginRouter(transport);

router.handle('add', async (params: { a: number; b: number }) => {
  return { result: params.a + params.b };
});

router.handle('multiply', async (params: { a: number; b: number }) => {
  return { result: params.a * params.b };
});

router.handle('greet', async (params: { name: string }) => {
  return { message: `Hello, ${params.name}!` };
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

await transport.sendReady();
