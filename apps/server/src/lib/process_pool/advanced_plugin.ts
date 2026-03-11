/**
 * 高级插件示例 - 展示批量注册和自定义配置
 */

import { ChildIpcTransport, BasePluginRouter } from '@fastgpt-plugin/helpers';

const transport = new ChildIpcTransport();
const router = new BasePluginRouter(transport);

// 数学运算方法
router.handle('add', async (params: { a: number; b: number }) => {
  return { result: params.a + params.b, operation: 'add' };
});

router.handle('subtract', async (params: { a: number; b: number }) => {
  return { result: params.a - params.b, operation: 'subtract' };
});

router.handle('multiply', async (params: { a: number; b: number }) => {
  return { result: params.a * params.b, operation: 'multiply' };
});

router.handle('divide', async (params: { a: number; b: number }) => {
  if (params.b === 0) throw new Error('除数不能为零');
  return { result: params.a / params.b, operation: 'divide' };
});

// 字符串方法
router.handle('concat', async (params: { a: string; b: string }) => {
  return { result: params.a + params.b };
});

router.handle('reverse', async (params: { str: string }) => {
  return { result: params.str.split('').reverse().join('') };
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

await transport.sendReady();
