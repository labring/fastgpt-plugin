/**
 * FastGPT 插件示例 - 用于集成测试
 */

import { ChildIpcTransport, BasePluginRouter } from '@fastgpt-plugin/helpers';

const transport = new ChildIpcTransport();
const router = new BasePluginRouter(transport);

// 加法运算
router.handle('add', async (params: { a: number; b: number }) => {
  const { a, b } = params;
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('参数必须是数字');
  }
  return { result: a + b, operation: 'add' };
});

// 乘法运算
router.handle('multiply', async (params: { a: number; b: number }) => {
  const { a, b } = params;
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('参数必须是数字');
  }
  return { result: a * b, operation: 'multiply' };
});

// 异步等待
router.handle('sleep', async (params: { duration?: number }) => {
  const duration = params?.duration ?? 1000;
  await new Promise((resolve) => setTimeout(resolve, duration));
  return { slept: duration, message: `等待了 ${duration}ms` };
});

// 文本处理
router.handle('processText', async (params: {
  text: string;
  operation?: 'uppercase' | 'lowercase' | 'reverse' | 'length';
}) => {
  const { text, operation = 'uppercase' } = params;
  if (typeof text !== 'string') throw new Error('text 参数必须是字符串');

  let result: string | number;
  switch (operation) {
    case 'uppercase': result = text.toUpperCase(); break;
    case 'lowercase': result = text.toLowerCase(); break;
    case 'reverse': result = text.split('').reverse().join(''); break;
    case 'length': result = text.length; break;
    default: throw new Error(`未知操作: ${operation}`);
  }
  return { original: text, operation, result };
});

// 测试用方法
router.handle('quickMethod', async () => ({ success: true }));

router.handle('slowMethod', async (params: { delay?: number }) => {
  const delay = params?.delay ?? 100;
  await new Promise((resolve) => setTimeout(resolve, delay));
  return { success: true };
});

router.handle('errorMethod', async () => {
  throw new Error('模拟错误');
});

router.handle('crashPod', async () => {
  process.exit(1);
});

router.handle('hangMethod', async () => {
  await new Promise(() => {}); // 永久挂起
});

router.handle('getTemperature', async (params: { city: string }) => ({
  city: params.city,
  temperature: Math.floor(Math.random() * 30) + 10,
  unit: 'C'
}));

router.handle('translate', async (params: { text: string; to: string }) => ({
  original: params.text,
  translated: `翻译: ${params.text}`,
  to: params.to
}));

process.on('uncaughtException', (err) => {
  console.error('[plugin] uncaughtException:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[plugin] unhandledRejection:', reason);
  process.exit(1);
});
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

await transport.sendReady();
