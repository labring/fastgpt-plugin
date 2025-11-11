import { describe, it, expect } from 'bun:test';
import { compareDocumentsWithTolerance } from '../src/diffAlgorithm';

describe('增强的换行容差集成测试', () => {
  it('应该处理OCR和docx之间的换行差异', () => {
    const docxText = `这是完整的句子。
这是另一个完整的句子，包含多个词语和标点符号。
第三行也是完整的。`;

    const ocrText = `这是完整的 句子。
这是另一个 完整的句子，包含多个词语 和 标点符号。
第三行 也是 完整的。`;

    const diffs = compareDocumentsWithTolerance(docxText, ocrText, {
      enableLineBreakTolerance: true,
      scanRange: 2,
      toleranceThreshold: 0.9
    });

    console.log('Diff结果:');
    diffs.forEach((diff, index) => {
      console.log(`${index + 1}. ${diff.type}: "${diff.original}" -> "${diff.modified}"`);
    });

    // 检查有多少行被识别为 unchanged
    const unchangedDiffs = diffs.filter((diff) => diff.type === 'unchanged');

    // 至少应该有一些行被识别为相同（考虑容差）
    expect(unchangedDiffs.length).toBeGreaterThan(0);
  });

  it('应该处理文档开头和结尾的换行差异', () => {
    // 测试文档开头
    const original1 = `第一行
第二行`;
    const modified1 = `第一行第二行`;

    const diffs1 = compareDocumentsWithTolerance(original1, modified1);

    // 测试文档结尾
    const original2 = `第一行
第二行`;
    const modified2 = `第一行
第二行第三行`;

    const diffs2 = compareDocumentsWithTolerance(original2, modified2);

    // 两种情况都应该能正确处理
    expect(diffs1.length).toBeGreaterThan(0);
    expect(diffs2.length).toBeGreaterThan(0);

    // 应该有较少的修改差异（由于换行容差）
    const modifiedDiffs1 = diffs1.filter((diff) => diff.type === 'modified');
    const modifiedDiffs2 = diffs2.filter((diff) => diff.type === 'modified');

    expect(modifiedDiffs1.length).toBeLessThan(3);
    expect(modifiedDiffs2.length).toBeLessThan(3);
  });

  it('应该处理完整的OCR文档场景', () => {
    const ocrText = `这 是 OCR 识 别 的 文本。
第 二行  继续测试，有 额外 空格。
这是 第三行，包 含全 角标点符号！
第 四行也是正 常内容。`;

    const cleanText = `这是OCR识别的文本。
第二行继续测试，有额外空格。
这是第三行，包含全角标点符号!
第四行也是正常内容。`;

    const diffs = compareDocumentsWithTolerance(ocrText, cleanText, {
      enableLineBreakTolerance: true,
      scanRange: 3,
      toleranceThreshold: 0.95
    });

    console.log('OCR场景测试结果:');
    diffs.forEach((diff, index) => {
      console.log(`${index + 1}. ${diff.type}: "${diff.original}" -> "${diff.modified}"`);
    });

    // 统计不同类型的差异
    const unchangedDiffs = diffs.filter((diff) => diff.type === 'unchanged');
    const modifiedDiffs = diffs.filter((diff) => diff.type === 'modified');

    console.log(`统计: ${unchangedDiffs.length}个相同, ${modifiedDiffs.length}个修改`);

    // 应该有一些相同的行（由于容差处理）
    expect(unchangedDiffs.length).toBeGreaterThan(0);
  });
});
