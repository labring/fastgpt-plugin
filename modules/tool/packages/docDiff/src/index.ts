import { uploadFile } from '@tool/utils/uploadFile';
import { z } from 'zod';

export const InputType = z.object({
  originalText: z.string().min(1, '原始文档内容不能为空'),
  modifiedText: z.string().min(1, '修改后文档内容不能为空'),
  title: z.string().optional().default('文档对比报告')
});

export const OutputType = z.object({
  htmlUrl: z.string()
});

// 输入类型：title 是可选的
export type InputType = {
  originalText: string;
  modifiedText: string;
  title?: string;
};

// 输出类型
export type OutputType = {
  htmlUrl: string;
};

// 定义段落差异类型
type DiffType = 'unchanged' | 'added' | 'removed' | 'modified';

interface ParagraphDiff {
  type: DiffType;
  original?: string;
  modified?: string;
  lineNumber?: number;
}

// 分割文档为行
function splitIntoLines(text: string): string[] {
  return text.split('\n');
}

// 计算两个段的相似度
function calculateSimilarity(text1: string, text2: string): number {
  // 如果两行都为空，则完全相同
  if (!text1.trim() && !text2.trim()) return 1.0;
  if (!text1.trim() || !text2.trim()) return 0.0;

  const chars1 = text1.replace(/\s/g, '').toLowerCase();
  const chars2 = text2.replace(/\s/g, '').toLowerCase();

  const longer = chars1.length > chars2.length ? chars1 : chars2;
  const shorter = chars1.length > chars2.length ? chars2 : chars1;

  if (longer.length === 0) return 1.0;

  const matches = Array.from(longer).filter(
    (char, index) => index < shorter.length && char === shorter[index]
  ).length;

  return matches / longer.length;
}

// 对比两个文档
function compareDocuments(originalText: string, modifiedText: string): ParagraphDiff[] {
  const originalLines = splitIntoLines(originalText);
  const modifiedLines = splitIntoLines(modifiedText);

  const diffs: ParagraphDiff[] = [];
  let origIndex = 0;
  let modIndex = 0;

  while (origIndex < originalLines.length || modIndex < modifiedLines.length) {
    const originalLine = originalLines[origIndex];
    const modifiedLine = modifiedLines[modIndex];

    // 如果其中一个文档已经处理完毕
    if (origIndex >= originalLines.length) {
      diffs.push({
        type: 'added',
        modified: modifiedLine,
        lineNumber: modIndex + 1
      });
      modIndex++;
      continue;
    }

    if (modIndex >= modifiedLines.length) {
      diffs.push({
        type: 'removed',
        original: originalLine,
        lineNumber: origIndex + 1
      });
      origIndex++;
      continue;
    }

    // 计算行相似度
    const similarity = calculateSimilarity(originalLine, modifiedLine);

    if (similarity > 0.8) {
      // 基本相同的行
      diffs.push({
        type: 'unchanged',
        original: originalLine,
        modified: modifiedLine,
        lineNumber: origIndex + 1
      });
      origIndex++;
      modIndex++;
    } else if (similarity > 0.1) {
      // 修改的行 - 降低阈值，让更多变化被识别为修改
      diffs.push({
        type: 'modified',
        original: originalLine,
        modified: modifiedLine,
        lineNumber: origIndex + 1
      });
      origIndex++;
      modIndex++;
    } else {
      // 寻找最佳匹配
      let bestMatchIndex = -1;
      let bestSimilarity = 0;

      for (let i = 0; i < Math.min(3, modifiedLines.length - modIndex); i++) {
        const candidateSimilarity = calculateSimilarity(originalLine, modifiedLines[modIndex + i]);
        if (candidateSimilarity > bestSimilarity) {
          bestSimilarity = candidateSimilarity;
          bestMatchIndex = i;
        }
      }

      if (bestSimilarity > 0.5) {
        // 找到匹配，插入添加的行
        for (let i = 0; i < bestMatchIndex; i++) {
          diffs.push({
            type: 'added',
            modified: modifiedLines[modIndex + i],
            lineNumber: origIndex + 1
          });
        }
        diffs.push({
          type: 'modified',
          original: originalLine,
          modified: modifiedLines[modIndex + bestMatchIndex],
          lineNumber: origIndex + 1
        });
        modIndex += bestMatchIndex + 1;
        origIndex++;
      } else {
        // 没有找到匹配，可能是删除或添加
        diffs.push({
          type: 'removed',
          original: originalLine,
          lineNumber: origIndex + 1
        });
        origIndex++;
      }
    }
  }

  return diffs;
}

// 生成 HTML 报告
function generateHtmlReport(diffs: ParagraphDiff[], title: string): string {
  const timestamp = new Date().toLocaleString('zh-CN');

  const css = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
        height: 100vh;
        overflow: hidden;
      }

      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        position: relative;
      }

      .header h1 {
        margin: 0 0 8px 0;
        font-size: 1.8em;
        font-weight: 300;
      }

      .timestamp {
        opacity: 0.9;
        font-size: 0.9em;
        margin-bottom: 15px;
      }

      .stats {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-bottom: 10px;
        flex-wrap: wrap;
      }

      .stat-card {
        background: rgba(255, 255, 255, 0.1);
        padding: 10px 15px;
        border-radius: 6px;
        text-align: center;
        backdrop-filter: blur(10px);
      }

      .stat-number {
        font-size: 1.5em;
        font-weight: bold;
        margin-bottom: 2px;
      }

      .stat-label {
        font-size: 0.8em;
        opacity: 0.9;
      }

      .unchanged { color: #4CAF50; }
      .added { color: #2196F3; }
      .removed { color: #F44336; }
      .modified { color: #FF9800; }

      .navigation {
        display: flex;
        justify-content: center;
        gap: 10px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
      }

      .nav-btn {
        padding: 8px 20px;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .nav-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .nav-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .nav-counter {
        background: rgba(255, 255, 255, 0.2);
        padding: 8px 15px;
        border-radius: 6px;
        font-size: 14px;
        color: white;
      }

      .content-container {
        display: flex;
        height: calc(100vh - 200px);
        overflow: hidden;
      }

      .column {
        flex: 1;
        overflow-y: auto;
        background: white;
        margin: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }

      .column-header {
        padding: 15px 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
        font-weight: 600;
        color: #495057;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .diff-item {
        border-bottom: 1px solid #f1f3f4;
        position: relative;
        transition: background-color 0.3s ease;
      }

      .diff-item:last-child {
        border-bottom: none;
      }

      .diff-item.highlight {
        background-color: #e3f2fd !important;
        border-left: 4px solid #2196F3 !important;
        box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
        animation: highlight-fade 2s ease-out forwards;
      }

      .diff-item.highlight .diff-paragraph {
        background-color: transparent !important;
        border-left: none !important;
      }

      @keyframes highlight-fade {
        0% {
          background-color: #bbdefb;
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.4);
        }
        70% {
          background-color: #e3f2fd;
          box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
        }
        100% {
          background-color: transparent;
          box-shadow: none;
          border-left-color: transparent !important;
        }
      }

      .diff-item.unchanged {
        opacity: 0.7;
      }

      .diff-item.added .diff-paragraph {
        border-left: 4px solid #2196F3;
        background-color: #e3f2fd;
      }

      .diff-item.removed .diff-paragraph {
        border-left: 4px solid #F44336;
        background-color: #ffebee;
      }

      .diff-item.modified .diff-paragraph {
        border-left: 4px solid #FF9800;
        background-color: #fff3e0;
      }

      .diff-item.unchanged .diff-paragraph {
        border-left: 4px solid #4CAF50;
        background-color: #e8f5e8;
      }

      .diff-paragraph {
        padding: 15px 20px;
        white-space: pre-wrap;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 0.9em;
        line-height: 1.5;
        margin: 0;
        min-height: 1.5em;
      }

      .diff-paragraph.empty-line {
        opacity: 0.3;
        font-style: italic;
        color: #999;
      }

      .diff-paragraph.empty-line::before {
        content: "·";
        display: block;
        text-align: center;
      }

      .diff-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7em;
        font-weight: 500;
        text-transform: uppercase;
      }

      .badge-added {
        background: #2196F3;
        color: white;
      }

      .badge-removed {
        background: #F44336;
        color: white;
      }

      .badge-modified {
        background: #FF9800;
        color: white;
      }

      .badge-unchanged {
        background: #4CAF50;
        color: white;
      }

      @keyframes highlight-fade {
        0% { background-color: #fff3cd; }
        100% { background-color: transparent; }
      }

      @media (max-width: 768px) {
        .content-container {
          flex-direction: column;
          height: calc(100vh - 250px);
        }

        .column {
          margin: 5px;
          height: calc(50% - 10px);
        }

        .header h1 {
          font-size: 1.5em;
        }

        .stats {
          gap: 10px;
        }

        .stat-card {
          padding: 8px 12px;
        }
      }
    </style>
  `;

  const js = `
    <script>
      let currentIndex = -1;
      let changes = [];

      // 初始化变更列表
      function initChanges() {
        // 只统计左栏的变更项，避免重复统计
        const leftColumnItems = document.querySelector('.column:first-child').querySelectorAll('.diff-item');
        leftColumnItems.forEach((item, index) => {
          // 只统计左栏的变更项（删除和修改）
          if (item.classList.contains('removed') ||
              item.classList.contains('modified')) {
            changes.push(index);
          }
        });
        updateNavigation();
      }

      // 更新导航按钮状态
      function updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const counter = document.getElementById('counter');

        prevBtn.disabled = currentIndex <= 0;
        nextBtn.disabled = currentIndex >= changes.length - 1;

        if (changes.length === 0) {
          counter.textContent = '无变更';
          prevBtn.disabled = true;
          nextBtn.disabled = true;
        } else {
          counter.textContent = \`\${currentIndex + 1} / \${changes.length}\`;
        }
      }

      // 导航到指定变更
      function navigateToChange(index) {
        // 清除之前的高亮
        document.querySelectorAll('.diff-item.highlight').forEach(item => {
          item.classList.remove('highlight');
        });

        if (index >= 0 && index < changes.length) {
          currentIndex = index;
          const targetIndex = changes[currentIndex];

          // 同时高亮左右两栏的对应项
          const leftColumnItem = document.querySelector('.column:first-child').querySelectorAll('.diff-item')[targetIndex];
          const rightColumnItem = document.querySelector('.column:last-child').querySelectorAll('.diff-item')[targetIndex];

          if (leftColumnItem && rightColumnItem) {
            // 同时滚动左右两栏到对应位置
            leftColumnItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            rightColumnItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            leftColumnItem.classList.add('highlight');
            rightColumnItem.classList.add('highlight');

            // 2秒后自动移除高亮
            setTimeout(() => {
              leftColumnItem.classList.remove('highlight');
              rightColumnItem.classList.remove('highlight');
            }, 2000);
          }
        }

        updateNavigation();
      }

      // 上一处变更
      function previousChange() {
        if (currentIndex > 0) {
          navigateToChange(currentIndex - 1);
        }
      }

      // 下一处变更
      function nextChange() {
        if (currentIndex < changes.length - 1) {
          navigateToChange(currentIndex + 1);
        }
      }

      // 页面加载完成后初始化
      document.addEventListener('DOMContentLoaded', function() {
        initChanges();

        // 如果有变更，自动导航到第一处
        if (changes.length > 0) {
          navigateToChange(0);
        }
      });

      // 键盘快捷键
      document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea')) {
          previousChange();
        } else if (e.key === 'ArrowRight' && !e.target.matches('input, textarea')) {
          nextChange();
        }
      });
    </script>
  `;

  // 计算统计信息
  const stats = diffs.reduce(
    (acc, diff) => {
      acc[diff.type]++;
      return acc;
    },
    { unchanged: 0, added: 0, removed: 0, modified: 0 }
  );

  // 生成左侧原始内容
  const originalContent = diffs
    .map((diff, index) => {
      let content = '';
      let badge = '';
      const typeClass = diff.type;

      if (diff.type === 'added') {
        // 新增的内容在左侧显示为空占位符
        content = '<div class="diff-paragraph empty-line"></div>';
      } else if (diff.type === 'removed') {
        content = `<div class="diff-paragraph">${escapeHtml(diff.original || '')}</div>`;
        badge = '<span class="diff-badge badge-removed">删除</span>';
      } else if (diff.type === 'modified') {
        content = `<div class="diff-paragraph">${escapeHtml(diff.original || '')}</div>`;
        badge = '<span class="diff-badge badge-removed">删除</span>';
      } else {
        content = `<div class="diff-paragraph">${escapeHtml(diff.original || '')}</div>`;
      }

      return `
      <div class="diff-item ${typeClass}" data-index="${index}">
        ${badge}
        ${content}
      </div>
    `;
    })
    .join('');

  // 生成右侧修改后内容
  const modifiedContent = diffs
    .map((diff, index) => {
      let content = '';
      let badge = '';
      const typeClass = diff.type;

      if (diff.type === 'removed') {
        // 删除的内容在右侧显示为空占位符
        content = '<div class="diff-paragraph empty-line"></div>';
      } else if (diff.type === 'added') {
        content = `<div class="diff-paragraph">${escapeHtml(diff.modified || '')}</div>`;
        badge = '<span class="diff-badge badge-added">新增</span>';
      } else if (diff.type === 'modified') {
        content = `<div class="diff-paragraph">${escapeHtml(diff.modified || '')}</div>`;
        badge = '<span class="diff-badge badge-added">新增</span>';
      } else {
        content = `<div class="diff-paragraph">${escapeHtml(diff.modified || '')}</div>`;
      }

      return `
      <div class="diff-item ${typeClass}" data-index="${index}">
        ${badge}
        ${content}
      </div>
    `;
    })
    .join('');

  const html = `<!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${css}
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <div class="timestamp">生成时间: ${timestamp}</div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-number added">${stats.added}</div>
            <div class="stat-label">新增</div>
          </div>
          <div class="stat-card">
            <div class="stat-number removed">${stats.removed}</div>
            <div class="stat-label">删除</div>
          </div>
          <div class="stat-card">
            <div class="stat-number modified">${stats.modified}</div>
            <div class="stat-label">修改</div>
          </div>
          <div class="stat-card">
            <div class="stat-number unchanged">${stats.unchanged}</div>
            <div class="stat-label">未修改</div>
          </div>
        </div>

        <div class="navigation">
          <button id="prevBtn" class="nav-btn" onclick="previousChange()">
            ← 上一处
          </button>
          <div id="counter" class="nav-counter">0 / 0</div>
          <button id="nextBtn" class="nav-btn" onclick="nextChange()">
            下一处 →
          </button>
        </div>
      </div>

      <div class="content-container">
        <div class="column">
          <div class="column-header">📄 原始文档</div>
          ${originalContent}
        </div>
        <div class="column">
          <div class="column-header">📝 修改后文档</div>
          ${modifiedContent}
        </div>
      </div>

      ${js}
    </body>
    </html>
  `;

  return html;
}

// HTML 转义函数
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export async function tool(input: InputType): Promise<OutputType> {
  // Zod 验证
  const validated = InputType.parse(input);

  const diffs = compareDocuments(validated.originalText, validated.modifiedText);
  const html = generateHtmlReport(diffs, validated.title);

  const { accessUrl } = await uploadFile({
    buffer: Buffer.from(html, 'utf-8'),
    defaultFilename: 'docdiff_report.html',
    contentType: 'text/html'
  });

  return {
    htmlUrl: accessUrl
  };
}
