import { describe, it, expect } from 'vitest';
import { tool } from '../src/index';

describe('docDiff 工具集成测试', () => {
  it('应该正确处理开头插入行的场景', async () => {
    const result = await tool({
      originalText: `第1行
第2行
第3行`,
      originalTitle: '原始文档',

      modifiedText: `新插入的行
第1行
第2行
第3行`,
      modifiedTitle: '修改后文档',

      title: '开头插入测试'
    });

    expect(result).toHaveProperty('htmlUrl');
    expect(result).toHaveProperty('diffs');
    expect(Array.isArray(result.diffs)).toBe(true);

    // 检查是否正确识别了新增的行
    const addedDiffs = result.diffs.filter((diff) => diff.type === 'added');
    expect(addedDiffs.length).toBe(1);
    expect(addedDiffs[0].modified).toBe('新插入的行');
  });

  it('应该正确处理复杂修改场景', async () => {
    const result = await tool({
      originalText: `这是原始文档的第一行
这是要修改的行
这是第三行`,
      originalTitle: '原始文档',

      modifiedText: `这是原始文档的第一行
这是修改后的行
这是新增的行
这是第三行`,
      modifiedTitle: '修改后文档',

      title: '复杂场景测试'
    });

    expect(result).toHaveProperty('htmlUrl');
    expect(result.diffs.length).toBeGreaterThan(0);

    const types = result.diffs.map((diff) => diff.type);
    // 严格模式下应该有新增、删除操作，但没有修改类型
    expect(types).toContain('added');
    expect(types).toContain('removed');
    expect(types).not.toContain('modified');
  });

  it('应该能处理只有一行的文档对比', async () => {
    const result = await tool({
      originalText: '单行内容',
      originalTitle: '原始文档',

      modifiedText: '修改后的单行内容',
      modifiedTitle: '修改后文档',

      title: '单行文档测试'
    });

    expect(result).toHaveProperty('htmlUrl');
    expect(result.diffs.length).toBeGreaterThan(0);
  });

  it('应该能处理相同文档', async () => {
    const result = await tool({
      originalText: '相同内容',
      originalTitle: '原始文档',

      modifiedText: '相同内容',
      modifiedTitle: '修改后文档',

      title: '相同文档测试'
    });

    expect(result).toHaveProperty('htmlUrl');
    expect(result.diffs.length).toBe(0);
  });
});
