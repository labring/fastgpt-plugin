// 定义换行容差选项
export interface LineBreakToleranceOptions {
  /** 是否启用换行容差逻辑 */
  enableLineBreakTolerance?: boolean;
  /** 扫描范围（行数） */
  scanRange?: number;
  /** 容差阈值 */
  toleranceThreshold?: number;
}

// 定义段落差异类型
export type DiffType = 'unchanged' | 'added' | 'removed' | 'modified';

export interface ParagraphDiff {
  type: DiffType;
  original?: string;
  modified?: string;
  lineNumber?: number;
}

// 分割文档为行
export function splitIntoLines(text: string): string[] {
  return text.split('\n');
}

// 计算两个段的相似度（灵敏版本）
export function calculateSimilarity(text1: string, text2: string): number {
  // 如果完全相同，直接返回1.0
  if (text1 === text2) return 1.0;

  // 计算编辑距离
  const distance = levenshteinDistance(text1, text2);
  const maxLength = Math.max(text1.length, text2.length);

  if (maxLength === 0) return 1.0;

  // 转换为相似度（0-1之间）
  const similarity = 1 - distance / maxLength;

  return similarity;
}

// 计算编辑距离（Levenshtein距离）
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1, // 插入
          matrix[i - 1][j] + 1 // 删除
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// 判断是否为高相似度（应该视为修改）
export function isHighSimilarity(similarity: number): boolean {
  // 相似度 > 0.7 且 < 1.0 视为高相似度，应该标记为修改
  return similarity > 0.7 && similarity < 1.0;
}

// 判断是否为中等相似度（在LCS中考虑匹配）
export function isMediumSimilarity(similarity: number): boolean {
  // 提高阈值：只有相似度 > 0.7 才在LCS中考虑为潜在匹配
  return similarity > 0.7;
}

// 严格内容比较：用于完全相同的行
export function isExactMatch(text1: string, text2: string): boolean {
  return text1 === text2;
}

// 寻找精确匹配行
export function findExactMatch(
  originalLine: string,
  modifiedLines: string[],
  startModIndex: number,
  searchRange: number = 20
): { matchIndex: number; found: boolean } {
  // 向前搜索精确匹配
  for (let i = 0; i < Math.min(searchRange, modifiedLines.length - startModIndex); i++) {
    if (isExactMatch(originalLine, modifiedLines[startModIndex + i])) {
      return { matchIndex: i, found: true };
    }
  }

  // 向后搜索精确匹配（如果可能）
  for (let i = 1; i <= Math.min(searchRange, startModIndex); i++) {
    if (isExactMatch(originalLine, modifiedLines[startModIndex - i])) {
      return { matchIndex: -i, found: true }; // 负数表示向后搜索
    }
  }

  return { matchIndex: -1, found: false };
}

// 构建相似度匹配矩阵（用于LCS算法）
export function buildMatchMatrix(originalLines: string[], modifiedLines: string[]): number[][] {
  const matrix: number[][] = [];

  for (let i = 0; i <= originalLines.length; i++) {
    matrix[i] = [];
    for (let j = 0; j <= modifiedLines.length; j++) {
      if (i === 0 || j === 0) {
        matrix[i][j] = 0;
      } else {
        const similarity = calculateSimilarity(originalLines[i - 1], modifiedLines[j - 1]);
        // 中等相似度以上视为潜在匹配
        if (isMediumSimilarity(similarity)) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
      }
    }
  }

  return matrix;
}

// 回溯相似度匹配矩阵，找到匹配的行对
export function backtrackLCS(
  matrix: number[][],
  originalLines: string[],
  modifiedLines: string[]
): { origIndices: number[]; modIndices: number[] } {
  const origIndices: number[] = [];
  const modIndices: number[] = [];

  let i = originalLines.length;
  let j = modifiedLines.length;

  while (i > 0 && j > 0) {
    const similarity = calculateSimilarity(originalLines[i - 1], modifiedLines[j - 1]);

    // 中等相似度以上且是匹配路径才视为匹配
    if (isMediumSimilarity(similarity) && matrix[i][j] === matrix[i - 1][j - 1] + 1) {
      // 找到相似度匹配
      origIndices.unshift(i - 1);
      modIndices.unshift(j - 1);
      i--;
      j--;
    } else if (matrix[i - 1][j] >= matrix[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return { origIndices, modIndices };
}

// 灵敏文档对比算法：高相似度视为修改，低相似度视为删除+新增
export function compareDocuments(originalText: string, modifiedText: string): ParagraphDiff[] {
  const originalLines = splitIntoLines(originalText);
  const modifiedLines = splitIntoLines(modifiedText);

  const diffs: ParagraphDiff[] = [];
  let currentLineNumber = 1;

  // 使用相似度匹配LCS算法找到潜在的匹配行
  const matrix = buildMatchMatrix(originalLines, modifiedLines);
  const { origIndices, modIndices } = backtrackLCS(matrix, originalLines, modifiedLines);

  // 添加虚拟的结束索引，便于处理
  origIndices.push(originalLines.length);
  modIndices.push(modifiedLines.length);

  let origIndex = 0;
  let modIndex = 0;

  // 处理每个匹配段之间的差异
  for (let matchIndex = 0; matchIndex < origIndices.length; matchIndex++) {
    const matchOrigIndex = origIndices[matchIndex];
    const matchModIndex = modIndices[matchIndex];

    // 处理当前匹配之前的差异区域
    while (origIndex < matchOrigIndex || modIndex < matchModIndex) {
      // 如果原始文档已经处理完这段区域
      if (origIndex >= matchOrigIndex) {
        // 这些都是新增的行
        while (modIndex < matchModIndex) {
          const modifiedLine = modifiedLines[modIndex];
          diffs.push({
            type: 'added',
            modified: modifiedLine,
            lineNumber: currentLineNumber++
          });
          modIndex++;
        }
        break;
      }

      // 如果修改后文档已经处理完这段区域
      if (modIndex >= matchModIndex) {
        // 这些都是删除的行
        while (origIndex < matchOrigIndex) {
          const originalLine = originalLines[origIndex];
          diffs.push({
            type: 'removed',
            original: originalLine,
            lineNumber: currentLineNumber++
          });
          origIndex++;
        }
        break;
      }

      const originalLine = originalLines[origIndex];
      const modifiedLine = modifiedLines[modIndex];

      // 计算相似度
      const similarity = calculateSimilarity(originalLine, modifiedLine);

      if (isHighSimilarity(similarity)) {
        // 高相似度，视为修改
        diffs.push({
          type: 'modified',
          original: originalLine,
          modified: modifiedLine,
          lineNumber: currentLineNumber++
        });
        origIndex++;
        modIndex++;
      } else {
        // 低相似度，分别作为删除和新增处理
        diffs.push({
          type: 'removed',
          original: originalLine,
          lineNumber: currentLineNumber++
        });
        diffs.push({
          type: 'added',
          modified: modifiedLine,
          lineNumber: currentLineNumber++
        });
        origIndex++;
        modIndex++;
      }
    }

    // 添加匹配的行
    if (matchIndex < origIndices.length - 1) {
      // 只有在不是虚拟结束索引时才添加
      const originalLine = originalLines[matchOrigIndex];
      const modifiedLine = modifiedLines[matchModIndex];
      const similarity = calculateSimilarity(originalLine, modifiedLine);

      if (isExactMatch(originalLine, modifiedLine)) {
        // 完全相同，视为未修改
        diffs.push({
          type: 'unchanged',
          original: originalLine,
          modified: modifiedLine,
          lineNumber: currentLineNumber++
        });
      } else if (isHighSimilarity(similarity)) {
        // 高相似度，视为修改
        diffs.push({
          type: 'modified',
          original: originalLine,
          modified: modifiedLine,
          lineNumber: currentLineNumber++
        });
      } else {
        // 中等相似度，视为未修改（这些在LCS中已经处理过了）
        diffs.push({
          type: 'unchanged',
          original: originalLine,
          modified: modifiedLine,
          lineNumber: currentLineNumber++
        });
      }
    }

    origIndex = matchOrigIndex + 1;
    modIndex = matchModIndex + 1;
  }

  return diffs;
}

// 换行容差比较函数
export function compareWithLineBreakTolerance(
  originalLine: string,
  modifiedLine: string,
  originalLines: string[],
  modifiedLines: string[],
  origIndex: number,
  modIndex: number,
  options: LineBreakToleranceOptions = {}
): boolean {
  const { enableLineBreakTolerance = true, scanRange = 3, toleranceThreshold = 0.95 } = options;

  if (!enableLineBreakTolerance) {
    return false;
  }

  // 如果两行完全相同，直接返回 true
  if (originalLine === modifiedLine) {
    return true;
  }

  // 扫描原始文档附近几行，合并后与修改文档比较
  for (
    let i = Math.max(0, origIndex - scanRange);
    i <= Math.min(originalLines.length - 1, origIndex + scanRange);
    i++
  ) {
    for (
      let j = Math.max(0, modIndex - scanRange);
      j <= Math.min(modifiedLines.length - 1, modIndex + scanRange);
      j++
    ) {
      // 跳过当前行本身的比较
      if (i === origIndex && j === modIndex) continue;

      // 合并原始文档的多行
      const originalSegment = originalLines
        .slice(Math.min(origIndex, i), Math.max(origIndex, i) + 1)
        .join('')
        .replace(/\s+/g, '') // 移除所有空白字符
        .toLowerCase();

      // 合并修改文档的多行
      const modifiedSegment = modifiedLines
        .slice(Math.min(modIndex, j), Math.max(modIndex, j) + 1)
        .join('')
        .replace(/\s+/g, '') // 移除所有空白字符
        .toLowerCase();

      // 如果合并后的内容完全相同，则认为是换行差异
      if (originalSegment === modifiedSegment && originalSegment.length > 0) {
        return true;
      }

      // 如果合并后的内容相似度很高，也考虑容差
      const similarity = calculateSimilarity(originalSegment, modifiedSegment);
      if (similarity >= toleranceThreshold) {
        return true;
      }
    }
  }

  // 额外检查：扫描临近2行去掉换行符后的情况
  for (
    let i = Math.max(0, origIndex - 2);
    i <= Math.min(originalLines.length - 1, origIndex + 2);
    i++
  ) {
    for (
      let j = Math.max(0, modIndex - 2);
      j <= Math.min(modifiedLines.length - 1, modIndex + 2);
      j++
    ) {
      // 跳过完全相同的情况（已经处理过）
      if (i === origIndex && j === modIndex) continue;

      // 检查去掉换行符后的多行组合
      const origSegment = originalLines
        .slice(Math.min(origIndex, i), Math.max(origIndex, i) + 1)
        .join('') // 去掉换行符
        .replace(/\s+/g, '') // 移除所有空白字符
        .toLowerCase();

      const modSegment = modifiedLines
        .slice(Math.min(modIndex, j), Math.max(modIndex, j) + 1)
        .join('') // 去掉换行符
        .replace(/\s+/g, '') // 移除所有空白字符
        .toLowerCase();

      if (origSegment === modSegment && origSegment.length > 0) {
        return true;
      }
    }
  }

  return false;
}

// 带容差的文档比较函数
export function compareDocumentsWithTolerance(
  originalText: string,
  modifiedText: string,
  toleranceOptions?: LineBreakToleranceOptions
): ParagraphDiff[] {
  const originalLines = splitIntoLines(originalText);
  const modifiedLines = splitIntoLines(modifiedText);

  const diffs: ParagraphDiff[] = [];
  let currentLineNumber = 1;

  // 使用相似度匹配LCS算法找到潜在的匹配行
  const matrix = buildMatchMatrix(originalLines, modifiedLines);
  const { origIndices, modIndices } = backtrackLCS(matrix, originalLines, modifiedLines);

  // 添加虚拟的结束索引，便于处理
  origIndices.push(originalLines.length);
  modIndices.push(modifiedLines.length);

  let origIndex = 0;
  let modIndex = 0;

  // 处理每个匹配段之间的差异
  for (let matchIndex = 0; matchIndex < origIndices.length; matchIndex++) {
    const matchOrigIndex = origIndices[matchIndex];
    const matchModIndex = modIndices[matchIndex];

    // 处理当前匹配之前的差异区域
    while (origIndex < matchOrigIndex || modIndex < matchModIndex) {
      // 如果原始文档已经处理完这段区域
      if (origIndex >= matchOrigIndex) {
        // 这些都是新增的行
        while (modIndex < matchModIndex) {
          const modifiedLine = modifiedLines[modIndex];
          diffs.push({
            type: 'added',
            modified: modifiedLine,
            lineNumber: currentLineNumber++
          });
          modIndex++;
        }
        break;
      }

      // 如果修改后文档已经处理完这段区域
      if (modIndex >= matchModIndex) {
        // 这些都是删除的行
        while (origIndex < matchOrigIndex) {
          const originalLine = originalLines[origIndex];
          diffs.push({
            type: 'removed',
            original: originalLine,
            lineNumber: currentLineNumber++
          });
          origIndex++;
        }
        break;
      }

      const originalLine = originalLines[origIndex];
      const modifiedLine = modifiedLines[modIndex];

      // 计算相似度
      const similarity = calculateSimilarity(originalLine, modifiedLine);

      // 首先检查换行容差
      if (
        compareWithLineBreakTolerance(
          originalLine,
          modifiedLine,
          originalLines,
          modifiedLines,
          origIndex,
          modIndex,
          toleranceOptions
        )
      ) {
        // 换行容差匹配成功，视为未修改
        diffs.push({
          type: 'unchanged',
          original: originalLine,
          modified: modifiedLine,
          lineNumber: currentLineNumber++
        });
        origIndex++;
        modIndex++;
      } else if (isHighSimilarity(similarity)) {
        // 高相似度，视为修改
        diffs.push({
          type: 'modified',
          original: originalLine,
          modified: modifiedLine,
          lineNumber: currentLineNumber++
        });
        origIndex++;
        modIndex++;
      } else {
        // 低相似度，分别作为删除和新增处理
        diffs.push({
          type: 'removed',
          original: originalLine,
          lineNumber: currentLineNumber++
        });
        diffs.push({
          type: 'added',
          modified: modifiedLine,
          lineNumber: currentLineNumber++
        });
        origIndex++;
        modIndex++;
      }
    }

    // 添加匹配的行
    if (matchIndex < origIndices.length - 1) {
      // 只有在不是虚拟结束索引时才添加
      const originalLine = originalLines[matchOrigIndex];
      const modifiedLine = modifiedLines[matchModIndex];
      const similarity = calculateSimilarity(originalLine, modifiedLine);

      if (similarity >= 1.0) {
        // 完全相同，视为未修改
        diffs.push({
          type: 'unchanged',
          original: originalLine,
          modified: modifiedLine,
          lineNumber: currentLineNumber++
        });
      } else if (isHighSimilarity(similarity)) {
        // 高相似度，视为修改
        diffs.push({
          type: 'modified',
          original: originalLine,
          modified: modifiedLine,
          lineNumber: currentLineNumber++
        });
      } else {
        // 中等相似度，视为未修改（这些在LCS中已经处理过了）
        diffs.push({
          type: 'unchanged',
          original: originalLine,
          modified: modifiedLine,
          lineNumber: currentLineNumber++
        });
      }
    }

    origIndex = matchOrigIndex + 1;
    modIndex = matchModIndex + 1;
  }

  return diffs;
}
