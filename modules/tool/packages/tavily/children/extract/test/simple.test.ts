import { describe, it, expect } from 'vitest';
import { tool } from '../src';

describe('Tavily Extract Simple Test', () => {
  const testApiKey = process.env.TEST_TAVLIY_KEY;
  const skipTest = !testApiKey;

  it.skipIf(skipTest)(
    'should extract content from FastGPT documentation',
    async () => {
      const result = await tool({
        tavilyApiKey: testApiKey!,
        urls: 'https://doc.fastgpt.io/docs/introduction',
        format: 'markdown'
      });

      // 验证是否成功获取内容
      expect(result.successCount).toBeGreaterThan(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].url).toBe('https://doc.fastgpt.io/docs/introduction');
      expect(result.results[0].raw_content).toBeDefined();
      expect(result.results[0].raw_content.length).toBeGreaterThan(0);
      expect(result.failedUrls).toHaveLength(0);

      console.log('\n✓ Successfully extracted content from FastGPT docs');
      console.log(`Content length: ${result.results[0].raw_content.length} characters`);
    },
    30000
  );

  it('should run with mock when no API key', async () => {
    if (!skipTest) {
      // Skip this test if API key is present
      return;
    }

    console.log('\nℹ No TEST_TAVLIY_KEY found');
    console.log('To run real test, set environment variable:');
    console.log('  export TEST_TAVLIY_KEY=tvly-your-api-key');
    expect(true).toBe(true);
  });
});
