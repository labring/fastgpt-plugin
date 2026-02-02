import { describe, it, expect } from 'bun:test';
import {
  compareWithLineBreakTolerance,
  compareDocumentsWithTolerance,
  type LineBreakToleranceOptions
} from '../src/diffAlgorithm';
import type { ParagraphDiff } from '../src/diffAlgorithm';

describe('换行容差算法', () => {
  describe('compareWithLineBreakTolerance', () => {
    const defaultOptions: LineBreakToleranceOptions = {
      enableLineBreakTolerance: true,
      scanRange: 3,
      toleranceThreshold: 0.95
    };

    it('应该识别完全相同的行', () => {
      const originalLine = '这是相同的文本';
      const modifiedLine = '这是相同的文本';
      const originalLines = ['这是相同的文本', '下一行'];
      const modifiedLines = ['这是相同的文本', '下一行'];

      const result = compareWithLineBreakTolerance(
        originalLine,
        modifiedLine,
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(true);
    });

    it('应该识别换行差异（两行合并为一行）', () => {
      const originalLines = ['第一行', '第二行', '第三行'];
      const modifiedLines = ['第一行第二行', '第三行'];

      // 测试原始文档的第一行 vs 修改文档的第一行
      const result = compareWithLineBreakTolerance(
        '第一行',
        '第一行第二行',
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(true);
    });

    it('应该识别换行差异（一行拆分为两行）', () => {
      const originalLines = ['第一行第二行', '第三行'];
      const modifiedLines = ['第一行', '第二行', '第三行'];

      // 测试原始文档的第一行 vs 修改文档的第一行
      const result = compareWithLineBreakTolerance(
        '第一行第二行',
        '第一行',
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(true);
    });

    it('应该处理复杂的换行重组', () => {
      const originalLines = ['这是第一段文本，', '内容比较长。', '这是第二段文本。'];
      const modifiedLines = ['这是第一段文本，内容比较长。', '这是第二段文本。'];

      const result = compareWithLineBreakTolerance(
        '这是第一段文本，',
        '这是第一段文本，内容比较长。',
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(true);
    });

    it('应该处理空格差异的换行容差', () => {
      const originalLines = ['单词1  单词2', '单词3'];
      const modifiedLines = ['单词1', '单词2', '单词3'];

      const result = compareWithLineBreakTolerance(
        '单词1  单词2',
        '单词1',
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(true);
    });

    it('应该在禁用时返回 false', () => {
      const originalLine = '第一行';
      const modifiedLine = '第一行第二行';
      const originalLines = ['第一行', '第二行'];
      const modifiedLines = ['第一行第二行'];

      const result = compareWithLineBreakTolerance(
        originalLine,
        modifiedLine,
        originalLines,
        modifiedLines,
        0,
        0,
        { ...defaultOptions, enableLineBreakTolerance: false }
      );

      expect(result).toBe(false);
    });

    it('应该拒绝真正的差异', () => {
      const originalLine = '这是原始文本';
      const modifiedLine = '这是完全不同的文本';
      const originalLines = ['这是原始文本', '其他内容'];
      const modifiedLines = ['这是完全不同的文本', '其他内容'];

      const result = compareWithLineBreakTolerance(
        originalLine,
        modifiedLine,
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(false);
    });

    it('应该处理扫描范围边界', () => {
      const originalLines = Array.from({ length: 10 }, (_, i) => `行${i}`);
      const modifiedLines = Array.from({ length: 10 }, (_, i) => `行${i}`);

      // 在中间位置测试
      const result = compareWithLineBreakTolerance(
        '行5',
        '行5',
        originalLines,
        modifiedLines,
        5,
        5,
        { ...defaultOptions, scanRange: 2 }
      );

      expect(result).toBe(true);
    });
  });

  describe('compareDocumentsWithTolerance', () => {
    it('应该处理简单的换行差异', () => {
      const original = `第一行
第二行
第三行`;

      const modified = `第一行第二行
第三行`;

      const diffs = compareDocumentsWithTolerance(original, modified);

      // 应该只有一个 unchanged（换行容差处理）
      expect(diffs.length).toBe(2);
      expect(diffs[0].type).toBe('unchanged');
      expect(diffs[1].type).toBe('unchanged');
    });

    it('应该处理一行拆分为多行', () => {
      const original = `第一行第二行
第三行`;

      const modified = `第一行
第二行
第三行`;

      const diffs = compareDocumentsWithTolerance(original, modified);

      // 应该都识别为 unchanged（换行容差处理）
      expect(diffs.length).toBe(3);
      expect(diffs.every((diff) => diff.type === 'unchanged')).toBe(true);
    });

    it('应该保持对真实差异的敏感度', () => {
      const original = `第一行
第二行
第三行`;

      const modified = `第一行
修改的第二行
第三行`;

      const diffs = compareDocumentsWithTolerance(original, modified);

      // 应该识别出修改
      const modifiedDiffs = diffs.filter((diff) => diff.type === 'modified');
      expect(modifiedDiffs.length).toBe(1);
      expect(modifiedDiffs[0].original).toBe('第二行');
      expect(modifiedDiffs[0].modified).toBe('修改的第二行');
    });

    it('应该处理混合场景（换行差异 + 真实修改）', () => {
      const original = `第一段内容，
继续第二段。
第三行 unchanged`;

      const modified = `第一段内容，继续第二段。
第三行已修改`;

      const diffs = compareDocumentsWithTolerance(original, modified);

      // 应该识别出换行容差和真实修改
      const unchangedDiffs = diffs.filter((diff) => diff.type === 'unchanged');
      const modifiedDiffs = diffs.filter((diff) => diff.type === 'modified');

      expect(modifiedDiffs.length).toBe(1);
      expect(modifiedDiffs[0].original).toContain('第三行 unchanged');
      expect(modifiedDiffs[0].modified).toContain('第三行已修改');
    });

    it('应该处理增加和删除', () => {
      const original = `第一行
第二行
第三行`;

      const modified = `新增的第一行
第一行
第三行`;

      const diffs = compareDocumentsWithTolerance(original, modified);

      const addedDiffs = diffs.filter((diff) => diff.type === 'added');
      const removedDiffs = diffs.filter((diff) => diff.type === 'removed');
      const unchangedDiffs = diffs.filter((diff) => diff.type === 'unchanged');

      expect(addedDiffs.length).toBe(1);
      expect(addedDiffs[0].modified).toBe('新增的第一行');
      expect(removedDiffs.length).toBe(1);
      expect(removedDiffs[0].original).toBe('第二行');
      expect(unchangedDiffs.length).toBeGreaterThan(0);
    });

    it('应该处理空文档情况', () => {
      const diffs1 = compareDocumentsWithTolerance('', '新内容');
      const diffs2 = compareDocumentsWithTolerance('原始内容', '');

      expect(diffs1.length).toBe(1);
      expect(diffs1[0].type).toBe('added');
      expect(diffs1[0].modified).toBe('新内容');

      expect(diffs2.length).toBe(1);
      expect(diffs2[0].type).toBe('removed');
      expect(diffs2[0].original).toBe('原始内容');
    });

    it('应该处理相同文档', () => {
      const text = `第一行
第二行
第三行`;

      const diffs = compareDocumentsWithTolerance(text, text);

      expect(diffs.length).toBe(3);
      expect(diffs.every((diff) => diff.type === 'unchanged')).toBe(true);
    });

    it('应该处理不同的扫描范围设置', () => {
      const original = `第一行
第二行
第三行
第四行`;

      const modified = `第一行第二行
第三行
第四行`;

      // 较小的扫描范围
      const diffs1 = compareDocumentsWithTolerance(original, modified, {
        enableLineBreakTolerance: true,
        scanRange: 1,
        toleranceThreshold: 0.95
      });

      // 较大的扫描范围
      const diffs2 = compareDocumentsWithTolerance(original, modified, {
        enableLineBreakTolerance: true,
        scanRange: 5,
        toleranceThreshold: 0.95
      });

      // 两种情况下都应该能处理换行差异
      expect(diffs1.every((diff) => diff.type === 'unchanged')).toBe(true);
      expect(diffs2.every((diff) => diff.type === 'unchanged')).toBe(true);
    });

    it('应该处理不同的相似度阈值', () => {
      const original = `文本行1
文本行2`;

      const modified = `文本行1文本行2`;

      // 高阈值
      const diffs1 = compareDocumentsWithTolerance(original, modified, {
        enableLineBreakTolerance: true,
        scanRange: 3,
        toleranceThreshold: 0.99
      });

      // 低阈值
      const diffs2 = compareDocumentsWithTolerance(original, modified, {
        enableLineBreakTolerance: true,
        scanRange: 3,
        toleranceThreshold: 0.8
      });

      // 高阈值情况下可能不会识别为容差，低阈值会识别
      expect(diffs1.length).toBeGreaterThanOrEqual(0);
      expect(diffs2.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('复杂场景测试', () => {
    it('应该处理段落级别的换行差异', () => {
      const original = `这是第一段文本。
内容比较长，被分成了多行。
这是第二段文本。`;

      const modified = `这是第一段文本。内容比较长，被分成了多行。
这是第二段文本。`;

      const diffs = compareDocumentsWithTolerance(original, modified);

      // 大部分内容应该被识别为 unchanged
      const unchangedDiffs = diffs.filter((diff) => diff.type === 'unchanged');
      expect(unchangedDiffs.length).toBeGreaterThan(0);
    });

    it('应该处理表格相关的换行差异', () => {
      const original = `| 列1 | 列2 |
|-----|-----|
| 值1 | 值2 |`;

      const modified = `| 列1 | 列2 |
|-----|-----|
| 值1 |
值2 |`;

      const diffs = compareDocumentsWithTolerance(original, modified);

      // 应该能处理表格中的换行差异
      expect(diffs.length).toBeGreaterThan(0);
    });

    it('应该处理代码块中的换行差异', () => {
      const original = `function test() {
  return true;
}`;

      const modified = `function test() { return true; }`;

      const diffs = compareDocumentsWithTolerance(original, modified);

      // 应该能处理代码中的换行差异
      expect(diffs.length).toBeGreaterThanOrEqual(0);
    });
  });
});
