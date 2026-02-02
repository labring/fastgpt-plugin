/**
 * 文本标准化模块
 * 用于预处理文本，移除格式化语法和多余空格
 */

interface NormalizationOptions {
  /** 是否移除 Markdown 格式化语法 */
  removeMarkdownFormatting?: boolean;
  /** 是否保留表格格式 */
  preserveTables?: boolean;
  /** 是否移除文本中间的多余空格 */
  removeExtraSpaces?: boolean;
  /** 是否删除所有文本间的空格（更激进的处理，包括中英文间空格） */
  removeTextSpaces?: boolean;
  /** 是否智能处理中英文混排空格（删除中英文间空格，保留英文单词内结构） */
  removeIntelligentSpaces?: boolean;
  /** 是否将全角标点符号转换为半角 */
  convertPunctuation?: boolean;
}

/**
 * 标准化文本
 */
function normalizeText(text: string, options: NormalizationOptions = {}): string {
  const {
    removeMarkdownFormatting = true,
    preserveTables = true,
    removeExtraSpaces = true,
    removeTextSpaces = false,
    removeIntelligentSpaces: enableIntelligentSpaces = false,
    convertPunctuation = false
  } = options;

  let result = text;

  // 标准化处理顺序：
  // 1. 全角转半角（最先进行，避免影响后续格式识别）
  if (convertPunctuation) {
    result = convertFullWidthToHalfWidth(result);
  }

  // 2. 合并多个空行（在格式处理前进行，避免空行影响格式识别）
  result = mergeMultipleEmptyLines(result);

  // 3. 根据是否保留表格采用不同的处理策略
  if (preserveTables) {
    // 保留表格：逐行处理，区分表格行和非表格行
    const lines = result.split('\n');
    const processedLines = lines.map((line) => {
      if (isTableRow(line)) {
        // 表格行：跳过 Markdown 处理，只处理空格
        return processTableRow(line, {
          removeTextSpaces,
          enableIntelligentSpaces,
          removeExtraSpaces
        });
      } else {
        // 非表格行：应用完整处理流程
        let processedLine = line;

        // 先处理 Markdown 格式
        if (removeMarkdownFormatting) {
          processedLine = removeMarkdownFormattingSyntax(processedLine);
        }

        // 再处理空格
        processedLine = processSpaces(processedLine, {
          removeTextSpaces,
          enableIntelligentSpaces,
          removeExtraSpaces
        });

        return processedLine;
      }
    });
    result = processedLines.join('\n');
  } else {
    // 不保留表格：直接应用完整处理流程
    // 3. 处理 Markdown 格式（如果启用）
    if (removeMarkdownFormatting) {
      result = removeMarkdownFormattingSyntax(result);
    }

    // 4. 最后处理空格（避免影响格式化识别）
    result = processSpaces(result, {
      removeTextSpaces,
      enableIntelligentSpaces,
      removeExtraSpaces
    });
  }

  return result;
}

/**
 * 合并多个空行
 * 将连续的空行（2个或更多）合并为单个空行
 */
function mergeMultipleEmptyLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n');
}

/**
 * 处理空格的统一函数
 */
function processSpaces(
  text: string,
  options: {
    removeTextSpaces: boolean;
    enableIntelligentSpaces: boolean;
    removeExtraSpaces: boolean;
  }
): string {
  const { removeTextSpaces, enableIntelligentSpaces, removeExtraSpaces } = options;

  if (removeTextSpaces) {
    return removeAllTextSpaces(text);
  } else if (enableIntelligentSpaces) {
    return removeIntelligentSpaces(text);
  } else if (removeExtraSpaces) {
    return removeExtraWhitespace(text);
  } else {
    return text;
  }
}

/**
 * 处理表格行的空格，保留表格结构
 */
function processTableRow(
  line: string,
  options: {
    removeTextSpaces: boolean;
    enableIntelligentSpaces: boolean;
    removeExtraSpaces: boolean;
  }
): string {
  const { removeTextSpaces, enableIntelligentSpaces, removeExtraSpaces } = options;

  if (removeTextSpaces) {
    // 删除所有空格，保留表格分隔符
    return line
      .replace(/\s+/g, '') // 删除所有空格
      .replace(/\|\|/g, '|') // 修复可能连续的分隔符
      .replace(/^\||\|$/g, ''); // 删除首尾多余的分隔符
  } else if (enableIntelligentSpaces) {
    // 智能处理表格单元格内的空格
    return line
      .split('|')
      .map((cell) => {
        // eslint-disable-next-line no-control-regex
        const hasNonEnglish = /[^\x00-\x7F]/.test(cell);
        const isPureEnglish = /^[a-zA-Z0-9\s]*$/.test(cell.trim());

        if (cell.trim() === '') return cell; // 空单元格

        if (isPureEnglish) {
          // 纯英文：保留单词间的单个空格
          return cell.replace(/\s+/g, ' ').trim();
        } else if (hasNonEnglish) {
          // 包含中文：删除所有空格
          return cell.replace(/\s+/g, '');
        } else {
          // 其他情况：删除多余空格
          return cell.replace(/\s+/g, ' ').trim();
        }
      })
      .join('|');
  } else if (removeExtraSpaces) {
    return removeExtraWhitespace(line);
  } else {
    return line;
  }
}

/**
 * 判断是否是表格行
 */
function isTableRow(line: string): boolean {
  // 表格行的特征：
  // 1. 包含管道符 |
  // 2. 以 | 开头或包含 | | 模式（分隔行）
  // 3. 不是普通文本中的单个 |
  const trimmed = line.trim();
  return (
    trimmed.includes('|') &&
    (trimmed.startsWith('|') ||
      trimmed.includes('| |') ||
      /^[\s]*\|.*\|[\s]*$/.test(line) ||
      /^[\s]*\|[\s\-:]+\|[\s]*$/.test(line))
  );
}

/**
 * 移除 Markdown 格式化语法（保留表格结构）
 */
function removeMarkdownFormattingSyntax(text: string): string {
  // 1. 移除标题格式
  text = text.replace(/^(#{1,6})\s+/gm, '');

  // 2. 移除加粗格式 **text**
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');

  // 3. 移除斜体格式 *text* 和 _text_
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // 4. 移除删除线格式 ~~text~~
  text = text.replace(/~~([^~]+)~~/g, '$1');

  // 5. 移除行内代码格式 `text`
  text = text.replace(/`([^`]+)`/g, '$1');

  // 6. 移除链接格式 [text](url)
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 7. 移除引用格式 >
  text = text.replace(/^[>\s]+/gm, '');

  // 8. 移除列表标记（-、*、+、数字.）
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');

  // 9. 移除代码块标记 ```
  text = text.replace(/```(\w+)?\s*([\s\S]*?)\s*```/g, '$2');

  return text;
}

/**
 * 移除多余的空格
 */
function removeExtraWhitespace(text: string): string {
  // 1. 将多个连续空格替换为单个空格
  text = text.replace(/[ \t]+/g, ' ');

  // 2. 移除行首行尾空格
  text = text.replace(/^[ \t]+|[ \t]+$/gm, '');

  // 3. 移除多余的换行符（保留空行结构）
  text = text.replace(/\n{3,}/g, '\n\n');

  return text;
}

/**
 * 删除所有文本间的空格（更激进的处理）
 * 对于中英文混排，会删除所有空格包括中英文之间的空格
 */
function removeAllTextSpaces(text: string): string {
  // 保留表格结构，但删除表格内容中的空格
  const lines = text.split('\n');
  return lines
    .map((line) => {
      if (isTableRow(line)) {
        // 表格行：保留表格分隔符，但删除单元格内容中的空格
        return line
          .split('|')
          .map((cell) => {
            // 删除单元格内的所有空格，但保留基本结构
            return cell.replace(/\s+/g, '');
          })
          .join('|');
      } else {
        // 普通行：删除所有空格（包括中英文之间的空格）
        return line.replace(/\s+/g, '');
      }
    })
    .join('\n');
}

/**
 * 将全角标点符号转换为半角
 */
function convertFullWidthToHalfWidth(text: string): string {
  // 全角字符到半角字符的映射
  const fullWidthToHalfWidth = {
    // 标点符号
    '，': ',',
    '。': '.',
    '！': '!',
    '？': '?',
    '；': ';',
    '：': ':',
    '（': '(',
    '）': ')',
    '【': '[',
    '】': ']',
    '｛': '{',
    '｝': '}',
    '"': '"',
    "'": "'",
    '《': '<',
    '》': '>',
    '〈': '<',
    '〉': '>',
    '…': '...',
    '—': '-',
    '——': '--',
    '·': '.',
    // 数字
    '０': '0',
    '１': '1',
    '２': '2',
    '３': '3',
    '４': '4',
    '５': '5',
    '６': '6',
    '７': '7',
    '８': '8',
    '９': '9',
    // 字母
    ａ: 'a',
    ｂ: 'b',
    ｃ: 'c',
    ｄ: 'd',
    ｅ: 'e',
    ｆ: 'f',
    ｇ: 'g',
    ｈ: 'h',
    ｉ: 'i',
    ｊ: 'j',
    ｋ: 'k',
    ｌ: 'l',
    ｍ: 'm',
    ｎ: 'n',
    ｏ: 'o',
    ｐ: 'p',
    ｑ: 'q',
    ｒ: 'r',
    ｓ: 's',
    ｔ: 't',
    ｕ: 'u',
    ｖ: 'v',
    ｗ: 'w',
    ｘ: 'x',
    ｙ: 'y',
    ｚ: 'z',
    Ａ: 'A',
    Ｂ: 'B',
    Ｃ: 'C',
    Ｄ: 'D',
    Ｅ: 'E',
    Ｆ: 'F',
    Ｇ: 'G',
    Ｈ: 'H',
    Ｉ: 'I',
    Ｊ: 'J',
    Ｋ: 'K',
    Ｌ: 'L',
    Ｍ: 'M',
    Ｎ: 'N',
    Ｏ: 'O',
    Ｐ: 'P',
    Ｑ: 'Q',
    Ｒ: 'R',
    Ｓ: 'S',
    Ｔ: 'T',
    Ｕ: 'U',
    Ｖ: 'V',
    Ｗ: 'W',
    Ｘ: 'X',
    Ｙ: 'Y',
    Ｚ: 'Z',
    // 空格
    '　': ' '
  };

  // 使用正则表达式替换所有全角字符
  return text.replace(/[\uff00-\uffef]/g, (char) => {
    return fullWidthToHalfWidth[char as keyof typeof fullWidthToHalfWidth] || char;
  });
}

/**
 * 智能处理中英文混排的空格
 * 保留必要的分隔，但删除多余的空格
 */
function removeIntelligentSpaces(text: string): string {
  const lines = text.split('\n');
  return lines
    .map((line) => {
      if (isTableRow(line)) {
        // 表格行：保留表格结构，但智能处理单元格内容
        return line
          .split('|')
          .map((cell) => {
            // 保留英文单词间的单个空格，删除其他多余空格
            const processedCell = cell
              .replace(/\s+/g, ' ') // 多个空格合并为单个
              // 移除中英文之间的空格，但保留英文单词间的空格
              // eslint-disable-next-line no-control-regex
              .replace(/([a-zA-Z]+)\s+([^\x00-\x7F]+)/g, '$1$2') // 英文后跟中文，移除空格
              // eslint-disable-next-line no-control-regex
              .replace(/([^\x00-\x7F]+)\s+([a-zA-Z]+)/g, '$1$2'); // 中文后跟英文，移除空格

            // 判断是否是纯英文内容
            // eslint-disable-next-line no-control-regex
            const hasNonEnglish = /[^\x00-\x7F]/.test(processedCell);

            if (!hasNonEnglish) {
              // 纯英文：保留单词间的单个空格
              return processedCell.replace(/\s+/g, ' ').trim();
            } else {
              // 包含中文：删除所有剩余空格
              return processedCell.replace(/\s+/g, '').trim();
            }
          })
          .join('|');
      } else {
        // 普通行：智能处理空格
        const processedLine = line
          .replace(/\s+/g, ' ') // 多个空格合并为单个
          // 移除中英文之间的空格，但保留英文单词间的空格
          // eslint-disable-next-line no-control-regex
          .replace(/([a-zA-Z]+)\s+([^\x00-\x7F]+)/g, '$1$2') // 英文后跟中文，移除空格
          // eslint-disable-next-line no-control-regex
          .replace(/([^\x00-\x7F]+)\s+([a-zA-Z]+)/g, '$1$2'); // 中文后跟英文，移除空格

        // 判断是否是纯英文内容
        // eslint-disable-next-line no-control-regex
        const hasNonEnglish = /[^\x00-\x7F]/.test(processedLine);

        if (!hasNonEnglish) {
          // 纯英文：保留单词间的单个空格
          return processedLine.replace(/\s+/g, ' ').trim();
        } else {
          // 包含中文：删除所有剩余空格
          return processedLine.replace(/\s+/g, '').trim();
        }
      }
    })
    .join('\n');
}

/**
 * 应用完整的标准化流程
 */
export function applyFullNormalization(text: string): string {
  // 使用默认的标准化配置
  return normalizeText(text, {
    removeMarkdownFormatting: true,
    preserveTables: true,
    removeExtraSpaces: true,
    removeTextSpaces: false,
    removeIntelligentSpaces: true,
    convertPunctuation: true
  });
}
