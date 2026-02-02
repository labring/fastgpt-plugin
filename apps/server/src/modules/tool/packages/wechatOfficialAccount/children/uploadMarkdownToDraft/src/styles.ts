import * as cheerio from 'cheerio';

/**
 * 使用 cheerio 为 HTML 元素添加内联样式
 */
export function addInlineStyles(html: string): string {
  const $ = cheerio.load(html, {
    xmlMode: false
  });

  // 标题样式
  $('h1').css({
    color: '#000000',
    'font-weight': 'bold',
    'font-size': '24px',
    'margin-top': '1.5em',
    'margin-bottom': '0.8em',
    'line-height': '1.3',
    'border-bottom': '2px solid #e0e0e0',
    'padding-bottom': '10px'
  });

  $('h2').css({
    color: '#000000',
    'font-weight': 'bold',
    'font-size': '20px',
    'margin-top': '1.5em',
    'margin-bottom': '0.8em',
    'line-height': '1.3',
    'border-bottom': '1px solid #e0e0e0',
    'padding-bottom': '8px'
  });

  $('h3').css({
    color: '#000000',
    'font-weight': 'bold',
    'font-size': '18px',
    'margin-top': '1.5em',
    'margin-bottom': '0.8em',
    'line-height': '1.3'
  });

  $('h4').css({
    color: '#000000',
    'font-weight': 'bold',
    'font-size': '16px',
    'margin-top': '1.5em',
    'margin-bottom': '0.8em',
    'line-height': '1.3'
  });

  $('h5').css({
    color: '#000000',
    'font-weight': 'bold',
    'font-size': '14px',
    'margin-top': '1.5em',
    'margin-bottom': '0.8em',
    'line-height': '1.3'
  });

  $('h6').css({
    color: '#000000',
    'font-weight': 'bold',
    'font-size': '12px',
    'margin-top': '1.5em',
    'margin-bottom': '0.8em',
    'line-height': '1.3'
  });

  // 段落样式
  $('p').css({
    margin: '1em 0',
    'text-align': 'justify',
    'font-size': '16px',
    'line-height': '1.6'
  });

  // 链接样式
  $('a').css({
    color: '#576b95',
    'text-decoration': 'none'
  });

  // 强调样式
  $('strong').css({
    'font-weight': 'bold',
    color: '#000000'
  });

  $('b').css({
    'font-weight': 'bold',
    color: '#000000'
  });

  $('em').css({
    'font-style': 'italic',
    color: '#666666'
  });

  $('i').css({
    'font-style': 'italic',
    color: '#666666'
  });

  // 代码样式（排除 pre 内的 code）
  $('code').each(function () {
    const $code = $(this);
    // 如果不是 pre 内的 code，才应用行内代码样式
    if ($code.parent().prop('tagName') !== 'PRE') {
      $code.css({
        'font-family': "'Consolas', 'Monaco', 'Courier New', monospace",
        'background-color': '#f5f5f5',
        padding: '2px 4px',
        'border-radius': '3px',
        'font-size': '0.9em',
        color: '#e74c3c'
      });
    }
  });

  // 预格式化代码块样式
  $('pre').css({
    'background-color': '#f8f9fa',
    border: '1px solid #e9ecef',
    'border-radius': '4px',
    padding: '12px',
    'overflow-x': 'auto',
    margin: '1em 0',
    'font-size': '14px'
  });

  // pre 内的 code 元素（重置样式）
  $('pre code').css({
    'background-color': 'transparent',
    padding: '0',
    'border-radius': '0',
    'font-size': '0.9em',
    color: '#495057',
    'font-family': "'Consolas', 'Monaco', 'Courier New', monospace"
  });

  // 引用样式
  $('blockquote').css({
    'border-left': '4px solid #576b95',
    margin: '1em 0',
    padding: '0.5em 1em',
    'background-color': '#f8f9fa',
    color: '#6c757d'
  });

  // 列表样式
  $('ul').css({
    margin: '1em 0',
    'padding-left': '2em',
    'font-size': '16px',
    'line-height': '1.6'
  });

  $('ol').css({
    margin: '1em 0',
    'padding-left': '2em',
    'font-size': '16px',
    'line-height': '1.6'
  });

  $('li').css({
    margin: '0.5em 0',
    'font-size': '16px',
    'line-height': '1.6'
  });

  // 表格样式
  $('table').css({
    width: '100%',
    'border-collapse': 'collapse',
    margin: '1em 0',
    'font-size': '14px'
  });

  $('th').css({
    border: '1px solid #e0e0e0',
    padding: '8px 12px',
    'text-align': 'left',
    'background-color': '#f5f5f5',
    'font-weight': 'bold'
  });

  $('td').css({
    border: '1px solid #e0e0e0',
    padding: '8px 12px',
    'text-align': 'left'
  });

  // 分隔线样式
  $('hr').css({
    border: 'none',
    'border-top': '1px solid #e0e0e0',
    margin: '2em 0'
  });

  // 图片样式
  $('img').css({
    'max-width': '100%',
    height: 'auto',
    display: 'block',
    margin: '1em auto',
    'border-radius': '4px'
  });

  // 特殊样式类处理
  $('.highlight').css({
    'background-color': '#fff3cd',
    border: '1px solid #ffeaa7',
    'border-radius': '4px',
    padding: '8px 12px',
    margin: '1em 0'
  });

  $('.info').css({
    'background-color': '#d1ecf1',
    border: '1px solid #bee5eb',
    'border-radius': '4px',
    padding: '8px 12px',
    margin: '1em 0'
  });

  $('.warning').css({
    'background-color': '#fff3cd',
    border: '1px solid #ffeaa7',
    'border-radius': '4px',
    padding: '8px 12px',
    margin: '1em 0'
  });

  $('.error').css({
    'background-color': '#f8d7da',
    border: '1px solid #f5c6cb',
    'border-radius': '4px',
    padding: '8px 12px',
    margin: '1em 0'
  });

  $('.success').css({
    'background-color': '#d4edda',
    border: '1px solid #c3e6cb',
    'border-radius': '4px',
    padding: '8px 12px',
    margin: '1em 0'
  });

  // 移除原有的 class 属性（因为已经转为内联样式）
  $('[class]').removeAttr('class');

  return $.html();
}
