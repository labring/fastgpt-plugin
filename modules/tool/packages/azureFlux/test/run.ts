import { tool } from '../src';
import { writeFile } from 'node:fs/promises';

const endpoint = process.env.AZURE_ENDPOINT;
const apiKey = process.env.AZURE_API_KEY;

if (!endpoint || !apiKey) {
  throw new Error('请设置环境变量 AZURE_ENDPOINT 和 AZURE_API_KEY');
}

const result = await tool({
  endpoint,
  apiKey,
  model: 'FLUX-1.1-pro',
  prompt: 'A photograph of a red fox in an autumn forest',
  width: 1024,
  height: 1024,
  safetyTolerance: 2
});

console.log('b64Json (前100字符):', result.b64Json.slice(0, 100));
console.log('b64Json 长度:', result.b64Json.length);

await writeFile('output.png', Buffer.from(result.b64Json, 'base64'));
console.log('图片已保存为 output.png');
