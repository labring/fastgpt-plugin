import { describe, it, expect } from 'vitest';
import { tool } from '../src';

describe('Qwen-Image Tool', () => {
  const testApiKey = process.env.TEST_SILICONFLOW_KEY || 'sk-test-key';

  describe('Integration Tests', () => {
    const skipIntegration = !process.env.TEST_SILICONFLOW_KEY;

    it.skipIf(skipIntegration)(
      'should generate image successfully',
      async () => {
        const result = await tool({
          authorization: process.env.TEST_SILICONFLOW_KEY!,
          prompt: '一只可爱的熊猫在竹林中吃竹子',
          image_size: '1328x1328'
        });

        expect(result).toBeDefined();
        expect(result.imageUrl).toBeDefined();
        expect(result.imageUrl).toMatch(/^https?:\/\/.+/);

        console.log('Generated image URL:', result.imageUrl);
      },
      60000
    );
  });

  describe('Error Handling', () => {
    it('should reject with invalid API key', async () => {
      await expect(
        tool({
          authorization: 'invalid-key',
          prompt: 'test image',
          image_size: '1328x1328'
        })
      ).rejects.toThrow();
    });

    it('should reject with empty prompt', async () => {
      await expect(
        tool({
          authorization: testApiKey,
          prompt: '',
          image_size: '1328x1328'
        })
      ).rejects.toThrow();
    });

    it('should reject with invalid image size', async () => {
      const invalidSize = '999x999' as any;

      await expect(
        tool({
          authorization: testApiKey,
          prompt: 'test image',
          image_size: invalidSize
        })
      ).rejects.toThrow();
    });

    it('should reject with out of range seed', async () => {
      await expect(
        tool({
          authorization: testApiKey,
          prompt: 'test image',
          image_size: '1328x1328',
          seed: 99999999999 // exceeds max value
        })
      ).rejects.toThrow();
    });
  });
});
