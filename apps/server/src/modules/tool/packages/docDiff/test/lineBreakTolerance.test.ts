import { describe, it, expect } from 'bun:test';
import {
  compareWithLineBreakTolerance,
  compareDocumentsWithTolerance,
  type LineBreakToleranceOptions
} from '../src/diffAlgorithm';

describe('换行容差功能', () => {
  const defaultOptions: LineBreakToleranceOptions = {
    enableLineBreakTolerance: true,
    scanRange: 3,
    toleranceThreshold: 0.95
  };

  describe('compareWithLineBreakTolerance', () => {
    it('应该检测到完全相同的行', () => {
      const originalLines = ['这是第一行', '这是第二行'];
      const modifiedLines = ['这是第一行', '这是第二行'];

      const result = compareWithLineBreakTolerance(
        '这是第一行',
        '这是第一行',
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(true);
    });

    it('应该检测到换行差异：单行拆分为多行', () => {
      const originalLines = ['这是一整行文本'];
      const modifiedLines = ['这是一整行', '文本'];

      const result = compareWithLineBreakTolerance(
        '这是一整行',
        '这是一整行',
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(true);
    });

    it('应该检测到换行差异：多行合并为单行', () => {
      const originalLines = ['这是第一行', '这是第二行'];
      const modifiedLines = ['这是第一行这是第二行'];

      const result = compareWithLineBreakTolerance(
        '这是第一行',
        '这是第一行这是第二行',
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(true);
    });

    it('应该检测到换行差异：复杂的多行重组', () => {
      const originalLines = [
        '函数的参数列表包括：',
        'name：用户名',
        'age：年龄',
        'email：邮箱地址'
      ];
      const modifiedLines = ['函数的参数列表包括：name：用户名age：年龄email：邮箱地址'];

      const result = compareWithLineBreakTolerance(
        '函数的参数列表包括：',
        '函数的参数列表包括：name：用户名age：年龄email：邮箱地址',
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(true);
    });

    it('应该对高相似度的内容应用容差', () => {
      const originalLines = ['这是原始文本内容'];
      const modifiedLines = ['这是原始文本文内容']; // 少量差异

      const result = compareWithLineBreakTolerance(
        '这是原始文本内容',
        '这是原始文本文内容',
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(true); // 相似度应该超过 0.95 阈值
    });

    it('应该对差异过大的内容不应用容差', () => {
      const originalLines = ['这是第一段内容'];
      const modifiedLines = ['这是完全不同的第二段内容'];

      const result = compareWithLineBreakTolerance(
        '这是第一段内容',
        '这是完全不同的第二段内容',
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(false);
    });

    it('应该在禁用容差时返回 false', () => {
      const originalLines = ['这是一整行文本'];
      const modifiedLines = ['这是一整行', '文本'];

      const result = compareWithLineBreakTolerance(
        '这是一整行',
        '这是一整行',
        originalLines,
        modifiedLines,
        0,
        0,
        { ...defaultOptions, enableLineBreakTolerance: false }
      );

      expect(result).toBe(false);
    });

    it('应该正确处理扫描范围限制', () => {
      const originalLines = ['第1行', '第2行', '第3行', '第4行', '第5行'];
      const modifiedLines = ['第1行', '第2行第3行第4行第5行'];

      const result = compareWithLineBreakTolerance(
        '第2行',
        '第2行第3行第4行第5行',
        originalLines,
        modifiedLines,
        1, // 从第2行开始
        0,
        { ...defaultOptions, scanRange: 2 }
      );

      expect(result).toBe(true);
    });

    it('应该处理大小写混合的内容', () => {
      const originalLines = ['HelloWorld Test'];
      const modifiedLines = ['hello', 'world', 'test'];

      const result = compareWithLineBreakTolerance(
        'HelloWorld Test',
        'hello',
        originalLines,
        modifiedLines,
        0,
        0,
        defaultOptions
      );

      expect(result).toBe(true); // 转换为小写后应该匹配
    });
  });

  describe('compareDocumentsWithTolerance', () => {
    it('应该处理简单的换行差异', () => {
      const original = `这是第一段文本。
这是第二段文本。`;
      const modified = `这是第一段文本。这是第二段文本。`;

      const diffs = compareDocumentsWithTolerance(original, modified, defaultOptions);

      // 应该识别为未修改（换行容差生效）
      expect(diffs.length).toBe(2);
      expect(diffs[0].type).toBe('unchanged');
      expect(diffs[1].type).toBe('unchanged');
    });

    it('应该保持对真正修改的检测', () => {
      const original = `这是原始文本。
这是另一段文本。`;
      const modified = `这是修改后的文本。
这是另一段文本。`;

      const diffs = compareDocumentsWithTolerance(original, modified, defaultOptions);

      // 第一段应该被识别为修改（内容确实不同）
      expect(diffs.some((diff) => diff.type === 'modified')).toBe(true);
      expect(diffs.some((diff) => diff.original === '这是原始文本。')).toBe(true);
      expect(diffs.some((diff) => diff.modified === '这是修改后的文本。')).toBe(true);
    });

    it('应该处理复杂的文档结构', () => {
      const original = `标题

第一章
这是第一章的内容。

第二章
这是第二章的内容。

结论
文档结束。`;

      const modified = `标题

第一章这是第一章的内容。

第二章这是第二章的内容。

结论文档结束。`;

      const diffs = compareDocumentsWithTolerance(original, modified, defaultOptions);

      // 应该检测到标题未修改
      expect(diffs.some((diff) => diff.type === 'unchanged' && diff.original === '标题')).toBe(
        true
      );

      // 章节内容应该通过容差处理
      expect(diffs.filter((diff) => diff.type === 'modified').length).toBeLessThan(3);
    });

    it('应该处理混合换行和内容修改', () => {
      const original = `第一段内容。
第二段内容。
第三段内容。`;

      const modified = `第一段修改后的内容。第二段内容。
第三段内容。`;

      const diffs = compareDocumentsWithTolerance(original, modified, defaultOptions);

      // 应该检测到第一段的修改
      expect(
        diffs.some(
          (diff) =>
            diff.type === 'modified' &&
            diff.original === '第一段内容。' &&
            diff.modified === '第一段修改后的内容。第二段内容。'
        )
      ).toBe(true);
    });

    it('应该在禁用容差时使用严格比较', () => {
      const original = `这是第一行。
这是第二行。`;
      const modified = `这是第一行。这是第二行。`;

      const strictDiffs = compareDocumentsWithTolerance(original, modified, {
        ...defaultOptions,
        enableLineBreakTolerance: false
      });

      const tolerantDiffs = compareDocumentsWithTolerance(original, modified, {
        ...defaultOptions,
        enableLineBreakTolerance: true
      });

      // 禁用容差应该产生更多差异
      expect(strictDiffs.length).toBeGreaterThan(tolerantDiffs.length);
    });

    it('应该处理空内容', () => {
      const original = '';
      const modified = '';

      const diffs = compareDocumentsWithTolerance(original, modified, defaultOptions);

      expect(diffs.length).toBe(0);
    });

    it('应该处理单行文档', () => {
      const original = '这是单行文本';
      const modified = '这是单行文本';

      const diffs = compareDocumentsWithTolerance(original, modified, defaultOptions);

      expect(diffs.length).toBe(1);
      expect(diffs[0].type).toBe('unchanged');
    });

    it('应该处理大量换行符的情况', () => {
      const original = `第一段



第二段`;

      const modified = `第一段
第二段`;

      const diffs = compareDocumentsWithTolerance(original, modified, defaultOptions);

      // 应该正确处理多余的换行符
      expect(diffs.some((diff) => diff.type === 'unchanged' && diff.original === '第一段')).toBe(
        true
      );
      expect(diffs.some((diff) => diff.type === 'unchanged' && diff.original === '第二段')).toBe(
        true
      );
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内处理大文档', () => {
      // 生成大文档
      const originalLines = [];
      const modifiedLines = [];

      for (let i = 0; i < 100; i++) {
        originalLines.push(`这是第${i}段文本内容。`);
        if (i % 10 === 0) {
          // 每10段合并一次
          modifiedLines.push(`这是第${i}段文本内容。这是第${i + 1}段文本内容。`);
          i++; // 跳过下一个
        } else {
          modifiedLines.push(`这是第${i}段文本内容。`);
        }
      }

      const original = originalLines.join('\n');
      const modified = modifiedLines.join('\n');

      const startTime = Date.now();
      const diffs = compareDocumentsWithTolerance(original, modified, defaultOptions);
      const endTime = Date.now();

      // 应该在合理时间内完成（2秒以内）
      expect(endTime - startTime).toBeLessThan(2000);
      expect(diffs.length).toBeGreaterThan(0);
    });
  });

  describe('边界情况', () => {
    it('应该处理完全相同的文档', () => {
      const text = `这是相同的文档内容。
没有任何差异。`;

      const diffs = compareDocumentsWithTolerance(text, text, defaultOptions);

      expect(diffs.every((diff) => diff.type === 'unchanged')).toBe(true);
    });

    it('应该处理完全不同的文档', () => {
      const original = '这是原始文档';
      const modified = '这是完全不同的文档';

      const diffs = compareDocumentsWithTolerance(original, modified, defaultOptions);

      // 应该检测到修改
      expect(diffs.some((diff) => diff.type === 'modified')).toBe(true);
    });

    it('应该处理只包含空格的行', () => {
      const original = `第一行

第三行`;
      const modified = `第一行第三行`;

      const diffs = compareDocumentsWithTolerance(original, modified, defaultOptions);

      // 空行应该被容差处理
      expect(diffs.some((diff) => diff.type === 'unchanged' && diff.original === '第一行')).toBe(
        true
      );
      expect(diffs.some((diff) => diff.type === 'unchanged' && diff.original === '第三行')).toBe(
        true
      );
    });

    it('应该处理特殊字符', () => {
      const original = `特殊字符：!@#$%^&*()
中文标点：，。！？`;
      const modified = `特殊字符：!@#$%^&*()中文标点：，。！？`;

      const diffs = compareDocumentsWithTolerance(original, modified, defaultOptions);

      // 应该通过容差处理换行
      expect(diffs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
