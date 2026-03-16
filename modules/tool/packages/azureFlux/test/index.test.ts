import { describe, it, expect } from 'vitest';
import { InputType, calcCost, getImageDimensions } from '../src';
// calcCost 现在接收 resolvedImages: string[] 而非两个独立字段

describe('Azure Flux Image Generation', () => {
  describe('Input Schema Validation', () => {
    it('should reject empty endpoint', () => {
      expect(() => InputType.parse({ endpoint: '', apiKey: 'key', prompt: 'test' })).toThrow();
    });

    it('should reject empty apiKey', () => {
      expect(() =>
        InputType.parse({ endpoint: 'https://test.com', apiKey: '', prompt: 'test' })
      ).toThrow();
    });

    it('should reject empty prompt', () => {
      expect(() =>
        InputType.parse({ endpoint: 'https://test.com', apiKey: 'key', prompt: '' })
      ).toThrow();
    });

    it('should parse valid input', () => {
      const result = InputType.parse({
        endpoint: 'https://wangsapi2.services.ai.azure.com',
        apiKey: 'test-key',
        prompt: 'A photograph of a red fox in an autumn forest'
      });
      expect(result.endpoint).toBe('https://wangsapi2.services.ai.azure.com');
      expect(result.apiKey).toBe('test-key');
      expect(result.prompt).toBe('A photograph of a red fox in an autumn forest');
    });
  });

  describe('calcCost', () => {
    it('FLUX-1.1-pro: fixed $0.04 per image', () => {
      expect(calcCost({ model: 'FLUX-1.1-pro', width: 1024, height: 1024 })).toBe(0.04);
      expect(calcCost({ model: 'FLUX-1.1-pro', width: 512, height: 512 })).toBe(0.04);
    });

    it('FLUX-2-pro: exactly 1MP output → $0.03', () => {
      expect(calcCost({ model: 'FLUX-2-pro', width: 1000, height: 1000 })).toBe(0.03);
    });

    it('FLUX-2-pro: 1024×1024 output → 2MP → $0.03 + $0.015 = $0.045', () => {
      expect(calcCost({ model: 'FLUX-2-pro', width: 1024, height: 1024 })).toBe(0.045);
    });

    it('FLUX-2-pro: 2048×2048 output → 5MP → $0.03 + 4×$0.015 = $0.09', () => {
      expect(calcCost({ model: 'FLUX-2-pro', width: 2048, height: 2048 })).toBe(0.09);
    });

    it('FLUX-2-pro: fractional MP rounds up → 512×512 = 0.26MP → ceil = 1MP → $0.03', () => {
      expect(calcCost({ model: 'FLUX-2-pro', width: 512, height: 512 })).toBe(0.03);
    });

    it('FLUX-2-pro: no input images', () => {
      expect(calcCost({ model: 'FLUX-2-pro', width: 1000, height: 1000 })).toBe(0.03);
    });
  });

  describe('getImageDimensions', () => {
    it('should return null for invalid base64', () => {
      expect(getImageDimensions('not-an-image')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getImageDimensions('')).toBeNull();
    });

    it('should parse PNG dimensions', () => {
      // Minimal 1×1 PNG (base64)
      const png1x1 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const dims = getImageDimensions(png1x1);
      expect(dims).toEqual({ width: 1, height: 1 });
    });
  });
});
