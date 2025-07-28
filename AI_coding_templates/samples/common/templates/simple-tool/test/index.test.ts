import { describe, it, expect } from 'vitest';
import { tool, validateTool, InputType, OutputType } from '../src/index';

describe('简单工具模板测试', () => {
  // 基础功能测试
  describe('基础功能', () => {
    it('应该正确处理基本输入', async () => {
      const input = { input: 'hello world', options: '' };
      const result = await tool(input);
      
      expect(result.result).toBe('HELLO WORLD');
      expect(result.metadata.inputLength).toBe(11);
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('应该正确处理空选项', async () => {
      const input = { input: 'test', options: '' };
      const result = await tool(input);
      
      expect(result.result).toBe('TEST');
      expect(result.metadata.inputLength).toBe(4);
    });
  });

  // 选项处理测试
  describe('选项处理', () => {
    it('应该正确处理reverse选项', async () => {
      const input = { input: 'hello', options: 'reverse' };
      const result = await tool(input);
      
      expect(result.result).toBe('OLLEH');
    });

    it('应该正确处理prefix选项', async () => {
      const input = { input: 'test', options: 'prefix' };
      const result = await tool(input);
      
      expect(result.result).toBe('[PROCESSED] TEST');
    });

    it('应该正确处理suffix选项', async () => {
      const input = { input: 'test', options: 'suffix' };
      const result = await tool(input);
      
      expect(result.result).toBe('TEST [DONE]');
    });

    it('应该正确处理未知选项', async () => {
      const input = { input: 'test', options: 'unknown' };
      const result = await tool(input);
      
      expect(result.result).toBe('TEST');
    });
  });

  // 错误处理测试
  describe('错误处理', () => {
    it('应该拒绝空输入', async () => {
      const input = { input: '', options: '' };
      
      await expect(tool(input)).rejects.toThrow('输入内容不能为空');
    });

    it('应该拒绝只包含空格的输入', async () => {
      const input = { input: '   ', options: '' };
      
      await expect(tool(input)).rejects.toThrow('输入内容不能为空');
    });
  });

  // 类型验证测试
  describe('类型验证', () => {
    it('应该验证输入类型', () => {
      const validInput = { input: 'test', options: 'prefix' };
      const result = InputType.safeParse(validInput);
      
      expect(result.success).toBe(true);
    });

    it('应该拒绝无效输入类型', () => {
      const invalidInput = { input: 123, options: 'prefix' };
      const result = InputType.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
    });

    it('应该验证输出类型', async () => {
      const input = { input: 'test', options: '' };
      const result = await tool(input);
      const validation = OutputType.safeParse(result);
      
      expect(validation.success).toBe(true);
    });
  });

  // 性能测试
  describe('性能测试', () => {
    it('应该在合理时间内完成处理', async () => {
      const input = { input: 'performance test', options: '' };
      const startTime = Date.now();
      
      await tool(input);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // 应该在100ms内完成
      expect(processingTime).toBeLessThan(100);
    });

    it('应该处理大量数据', async () => {
      const largeInput = 'a'.repeat(10000);
      const input = { input: largeInput, options: '' };
      
      const result = await tool(input);
      
      expect(result.result).toBe('A'.repeat(10000));
      expect(result.metadata.inputLength).toBe(10000);
    });
  });

  // 工具验证测试
  describe('工具验证', () => {
    it('应该通过工具验证', async () => {
      const isValid = await validateTool();
      
      expect(isValid).toBe(true);
    });
  });

  // 元数据测试
  describe('元数据', () => {
    it('应该包含正确的元数据', async () => {
      const input = { input: 'metadata test', options: '' };
      const result = await tool(input);
      
      expect(result.metadata.processedAt).toBeDefined();
      expect(result.metadata.inputLength).toBe(13);
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      
      // 验证时间戳格式
      expect(new Date(result.metadata.processedAt).getTime()).toBeGreaterThan(0);
    });
  });
});