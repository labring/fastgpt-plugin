import { describe, it, expect } from 'vitest';
import {
  calculateSimilarity,
  isHighSimilarity,
  isMediumSimilarity,
  buildMatchMatrix,
  backtrackLCS,
  compareDocuments,
  splitIntoLines
} from '../src/diffAlgorithm';

describe('灵敏相似度 Diff 算法核心功能测试', () => {
  describe('calculateSimilarity', () => {
    it('应该正确计算完全相同的文本相似度', () => {
      expect(calculateSimilarity('hello', 'hello')).toBe(1.0);
      expect(calculateSimilarity('相同内容', '相同内容')).toBe(1.0);
      expect(calculateSimilarity('', '')).toBe(1.0);
    });

    it('应该正确计算空文本的相似度', () => {
      expect(calculateSimilarity('hello', '')).toBe(0.0);
      expect(calculateSimilarity('', 'world')).toBe(0.0);
    });

    it('应该对空格变化敏感', () => {
      const sim = calculateSimilarity('hello world', 'hello  world');
      expect(sim).toBeGreaterThan(0.9); // 多一个空格，相似度应该很高
      expect(sim).toBeLessThan(1.0);
    });

    it('应该对标点符号变化敏感', () => {
      const sim = calculateSimilarity('你好，世界', '你好！世界');
      expect(sim).toBeGreaterThan(0.7); // 标点符号变化，相似度应该较高
      expect(sim).toBeLessThan(1.0);
    });

    it('应该对大小写变化敏感', () => {
      const sim = calculateSimilarity('Hello', 'hello');
      expect(sim).toBeGreaterThan(0.7); // 大小写变化，相似度应该较高
      expect(sim).toBeLessThan(1.0);
    });

    it('应该正确计算大幅修改的相似度', () => {
      const sim = calculateSimilarity('hello world', 'completely different');
      expect(sim).toBeLessThan(0.5); // 大幅修改，相似度应该较低
    });
  });

  describe('isHighSimilarity 和 isMediumSimilarity', () => {
    it('应该正确识别高相似度', () => {
      expect(isHighSimilarity(0.8)).toBe(true);
      expect(isHighSimilarity(0.71)).toBe(true);
      expect(isHighSimilarity(0.7)).toBe(false);
      expect(isHighSimilarity(1.0)).toBe(false); // 完全匹配是精确匹配，不是高相似度
    });

    it('应该正确识别中等相似度', () => {
      expect(isMediumSimilarity(0.6)).toBe(false); // 低于0.7阈值
      expect(isMediumSimilarity(0.51)).toBe(false); // 低于0.7阈值
      expect(isMediumSimilarity(0.5)).toBe(false);
      expect(isMediumSimilarity(0.8)).toBe(true);
      expect(isMediumSimilarity(1.0)).toBe(true); // 完全匹配也符合中等相似度
    });
  });

  describe('splitIntoLines', () => {
    it('应该正确分割文本行', () => {
      const text = '第1行\n第2行\n第3行';
      const lines = splitIntoLines(text);
      expect(lines).toEqual(['第1行', '第2行', '第3行']);
    });

    it('应该处理空行', () => {
      const text = '第1行\n\n第3行';
      const lines = splitIntoLines(text);
      expect(lines).toEqual(['第1行', '', '第3行']);
    });
  });

  describe('buildMatchMatrix', () => {
    it('应该为空文档构建正确大小的矩阵', () => {
      const originalLines: string[] = [];
      const modifiedLines: string[] = [];

      const matrix = buildMatchMatrix(originalLines, modifiedLines);

      expect(matrix).toHaveLength(1);
      expect(matrix[0]).toHaveLength(1);
      expect(matrix[0][0]).toBe(0);
    });

    it('应该构建正确大小的矩阵', () => {
      const originalLines = ['a', 'b'];
      const modifiedLines = ['a', 'b', 'c'];

      const matrix = buildMatchMatrix(originalLines, modifiedLines);

      expect(matrix).toHaveLength(3); // originalLines.length + 1
      expect(matrix[0]).toHaveLength(4); // modifiedLines.length + 1
    });

    it('应该正确识别高相似度的行', () => {
      const originalLines = ['第1行', '第2行'];
      const modifiedLines = ['第1行', '第2行'];

      const matrix = buildMatchMatrix(originalLines, modifiedLines);

      // 完全相同的行应该增加匹配计数
      expect(matrix[1][1]).toBe(1);
      expect(matrix[2][2]).toBe(2);
    });

    it('应该识别中等相似度的行', () => {
      const originalLines = ['hello world', 'test'];
      const modifiedLines = ['hello  world', 'test']; // 多一个空格

      const matrix = buildMatchMatrix(originalLines, modifiedLines);

      // 高相似度的行应该增加匹配计数
      expect(matrix[1][1]).toBe(1);
      expect(matrix[2][2]).toBe(2);
    });

    it('应该忽略低相似度的行', () => {
      const originalLines = ['hello', 'test'];
      const modifiedLines = ['completely different', 'test'];

      const matrix = buildMatchMatrix(originalLines, modifiedLines);

      // 低相似度的行不应该增加匹配计数
      expect(matrix[1][1]).toBe(0);
      expect(matrix[2][2]).toBe(1);
    });
  });

  describe('backtrackLCS', () => {
    it('应该正确回溯高相似度的行', () => {
      const originalLines = ['第1行', '第2行', '第3行'];
      const modifiedLines = ['第1行', '第2行', '第3行'];

      const matrix = buildMatchMatrix(originalLines, modifiedLines);
      const { origIndices, modIndices } = backtrackLCS(matrix, originalLines, modifiedLines);

      expect(origIndices).toEqual([0, 1, 2]);
      expect(modIndices).toEqual([0, 1, 2]);
    });

    it('应该处理中等相似度的匹配', () => {
      const originalLines = ['hello world', '第2行'];
      const modifiedLines = ['hello  world', '第2行'];

      const matrix = buildMatchMatrix(originalLines, modifiedLines);
      const { origIndices, modIndices } = backtrackLCS(matrix, originalLines, modifiedLines);

      // 第一行是高相似度，应该被匹配
      expect(origIndices).toContain(0);
      expect(modIndices).toContain(0);
      expect(origIndices).toContain(1);
      expect(modIndices).toContain(1);
    });
  });
});

describe('灵敏文档对比算法测试', () => {
  describe('开头插入行的处理', () => {
    it('应该正确识别在开头插入的单行', () => {
      const original = '第1行\n第2行\n第3行';
      const modified = '新插入行\n第1行\n第2行\n第3行';

      const diffs = compareDocuments(original, modified);

      // 应该识别出新插入的行
      expect(diffs.some((diff) => diff.type === 'added' && diff.modified === '新插入行')).toBe(
        true
      );

      // 后续行应该被正确识别为未修改
      const unchangedDiffs = diffs.filter((diff) => diff.type === 'unchanged');
      expect(unchangedDiffs.length).toBe(3);
    });

    it('应该正确处理开头插入多行的情况', () => {
      const original = '第1行\n第2行';
      const modified = '插入行A\n插入行B\n第1行\n第2行';

      const diffs = compareDocuments(original, modified);

      const addedDiffs = diffs.filter((diff) => diff.type === 'added');
      expect(addedDiffs.length).toBe(2);

      const unchangedDiffs = diffs.filter((diff) => diff.type === 'unchanged');
      expect(unchangedDiffs.length).toBe(2);
    });
  });

  describe('微小修改检测', () => {
    it('应该将空格变化识别为修改', () => {
      const original = 'Hello World';
      const modified = 'Hello  World'; // 多一个空格

      const diffs = compareDocuments(original, modified);

      // 应该识别为修改而不是删除+新增
      expect(diffs.length).toBe(1);
      expect(diffs[0].type).toBe('modified');
      expect(diffs[0].original).toBe('Hello World');
      expect(diffs[0].modified).toBe('Hello  World');
    });

    it('应该将标点符号变化识别为修改', () => {
      const original = '你好，世界';
      const modified = '你好！世界';

      const diffs = compareDocuments(original, modified);

      // 应该识别为修改
      expect(diffs.length).toBe(1);
      expect(diffs[0].type).toBe('modified');
      expect(diffs[0].original).toBe('你好，世界');
      expect(diffs[0].modified).toBe('你好！世界');
    });

    it('应该将大小写变化识别为修改', () => {
      const original = 'Hello World';
      const modified = 'hello world';

      const diffs = compareDocuments(original, modified);

      // 应该识别为修改
      expect(diffs.length).toBe(1);
      expect(diffs[0].type).toBe('modified');
    });
  });

  describe('大幅修改检测', () => {
    it('应该将完全不同的内容识别为删除+新增', () => {
      const original = 'Hello World';
      const modified = 'Completely Different Text';

      const diffs = compareDocuments(original, modified);

      // 应该识别为删除和新增
      expect(diffs.some((diff) => diff.type === 'removed')).toBe(true);
      expect(diffs.some((diff) => diff.type === 'added')).toBe(true);
      expect(diffs.some((diff) => diff.type === 'modified')).toBe(false);
    });

    it('应该正确处理内容完全不同的场景', () => {
      const original = '第1行\n第2行';
      const modified = '完全不同的A行\n完全不同的B行';

      const diffs = compareDocuments(original, modified);

      const removedCount = diffs.filter((diff) => diff.type === 'removed').length;
      const addedCount = diffs.filter((diff) => diff.type === 'added').length;
      const modifiedCount = diffs.filter((diff) => diff.type === 'modified').length;

      expect(removedCount).toBe(2);
      expect(addedCount).toBe(2);
      expect(modifiedCount).toBe(0);
    });
  });

  describe('中间插入行的处理', () => {
    it('应该正确识别中间插入的行', () => {
      const original = '第1行\n第2行\n第3行\n第4行';
      const modified = '第1行\n插入行A\n插入行B\n第2行\n第3行\n第4行';

      const diffs = compareDocuments(original, modified);

      const addedDiffs = diffs.filter((diff) => diff.type === 'added');
      expect(addedDiffs.length).toBe(2);

      const unchangedDiffs = diffs.filter((diff) => diff.type === 'unchanged');
      expect(unchangedDiffs.length).toBe(4);
    });
  });

  describe('删除行的处理', () => {
    it('应该正确识别删除的行', () => {
      const original = '第1行\n要删除的行\n第3行';
      const modified = '第1行\n第3行';

      const diffs = compareDocuments(original, modified);

      expect(diffs.some((diff) => diff.type === 'removed' && diff.original === '要删除的行')).toBe(
        true
      );

      const unchangedDiffs = diffs.filter((diff) => diff.type === 'unchanged');
      expect(unchangedDiffs.length).toBe(2);
    });
  });

  describe('复杂场景的处理', () => {
    it('应该正确处理各种修改类型混合的场景', () => {
      const original = `第1行
要删除的行
第3行
要微改的行
第5行
要大幅改的行`;

      const modified = `插入的新行
第1行
第3行
要微改的行${'  '}
第5行
完全不同的行`;

      const diffs = compareDocuments(original, modified);

      const addedCount = diffs.filter((diff) => diff.type === 'added').length;
      const removedCount = diffs.filter((diff) => diff.type === 'removed').length;
      const modifiedCount = diffs.filter((diff) => diff.type === 'modified').length;

      expect(addedCount).toBe(2); // 插入的新行 + 完全不同的行
      expect(removedCount).toBe(2); // 要删除的行 + 要大幅改的行
      expect(modifiedCount).toBe(1); // 要微改的行（增加了空格）
    });
  });

  describe('边界情况处理', () => {
    it('应该处理空文档对比', () => {
      const original = '';
      const modified = '新文档内容';

      const diffs = compareDocuments(original, modified);

      expect(diffs.some((diff) => diff.type === 'added')).toBe(true);
    });

    it('应该处理相同文档对比', () => {
      const text = '第1行\n第2行\n第3行';

      const diffs = compareDocuments(text, text);

      // 所有行应该都是未修改的
      expect(diffs.every((diff) => diff.type === 'unchanged')).toBe(true);
    });

    it('应该处理只有空行的文档', () => {
      const original = '\n\n\n';
      const modified = '\n\n\n\n';

      const diffs = compareDocuments(original, modified);

      // 应该能够处理而不出错
      expect(diffs.length).toBeGreaterThan(0);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内处理大文档', () => {
      const largeOriginal = Array.from({ length: 500 }, (_, i) => `第${i + 1}行`).join('\n');
      const largeModified = largeOriginal + '\n新增的最后行';

      const startTime = Date.now();
      const diffs = compareDocuments(largeOriginal, largeModified);
      const endTime = Date.now();

      expect(diffs.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(2000); // 应该在2秒内完成
    });
  });

  describe('特殊字符处理', () => {
    it('应该正确处理包含特殊字符的微小修改', () => {
      const original = '包含特殊字符的文本: <>&"\'';
      const modified = '包含特殊字符的文本: <>&"\' '; // 末尾多一个空格

      const diffs = compareDocuments(original, modified);

      // 应该识别为修改
      expect(diffs.length).toBe(1);
      expect(diffs[0].type).toBe('modified');
    });

    it('应该正确处理Unicode字符', () => {
      const original = '包含Unicode: 🚀 🌟 测试中文';
      const modified = '包含Unicode: 🎉 🌟 测试中文';

      const diffs = compareDocuments(original, modified);

      // 应该识别为修改（emoji变化，但文本相似）
      expect(diffs.some((diff) => diff.type === 'modified')).toBe(true);
    });

    it('应该处理不同语言的文本', () => {
      const original = 'Hello world\n你好世界\nこんにちは';
      const modified = 'Hello world\n你好世界！\nこんにちは'; // 标点变化

      const diffs = compareDocuments(original, modified);

      expect(diffs.some((diff) => diff.type === 'modified')).toBe(true);
    });
  });
});
