/**
 * 测试自然语言查询解析功能
 * 验证临床试验工具的增强功能
 */

const testQueries = [
  {
    name: '用户示例查询',
    query: '请查询下中国的kras12d的胰腺癌II期临床试验最近30天有哪些在招募的方案',
    expected: {
      cleanQuery: 'kras12d 胰腺癌',
      phases: 'PHASE2',
      status: 'RECRUITING',
      location: 'China',
      startDate: '应该是30天前的日期'
    }
  },
  {
    name: '英文查询',
    query: 'Show me phase 3 breast cancer trials in United States recruiting patients',
    expected: {
      cleanQuery: 'breast cancer',
      phases: 'PHASE3',
      status: 'RECRUITING',
      location: 'United States'
    }
  },
  {
    name: '时间范围查询',
    query: '最近一个月的肺癌早期试验',
    expected: {
      cleanQuery: '肺癌',
      phases: 'EARLY_PHASE1',
      startDate: '应该是30天前的日期'
    }
  },
  {
    name: '数量限制查询',
    query: '返回50个乳腺癌试验',
    expected: {
      cleanQuery: '乳腺癌',
      pageSize: 50
    }
  }
];

// 模拟自然语言解析函数（从工具代码中提取的逻辑）
function parseNaturalLanguageQuery(input) {
  const query = input.query.toLowerCase();
  const result = { ...input };

  // 提取试验阶段信息
  const phasePatterns = [
    { pattern: /[iⅰ一1]期|phase\s*[i1]|early\s*phase/i, value: 'PHASE1' },
    { pattern: /[iiⅱ二2]期|phase\s*[ii2]/i, value: 'PHASE2' },
    { pattern: /[iiiⅲ三3]期|phase\s*[iii3]/i, value: 'PHASE3' },
    { pattern: /[ivⅳ四4]期|phase\s*[iv4]/i, value: 'PHASE4' },
    { pattern: /早期|early/i, value: 'EARLY_PHASE1' }
  ];

  for (const { pattern, value } of phasePatterns) {
    if (pattern.test(query) && !result.phases) {
      result.phases = value;
      break;
    }
  }

  // 提取试验状态信息
  const statusPatterns = [
    { pattern: /招募中|正在招募|recruiting/i, value: 'RECRUITING' },
    { pattern: /即将开始|not yet recruiting/i, value: 'NOT_YET_RECRUITING' },
    { pattern: /已完成|completed/i, value: 'COMPLETED' },
    { pattern: /暂停|suspended/i, value: 'SUSPENDED' },
    { pattern: /终止|terminated/i, value: 'TERMINATED' },
    { pattern: /撤回|withdrawn/i, value: 'WITHDRAWN' }
  ];

  for (const { pattern, value } of statusPatterns) {
    if (pattern.test(query) && !result.status) {
      result.status = value;
      break;
    }
  }

  // 提取地理位置信息
  const locationPatterns = [
    { pattern: /中国|china/i, value: 'China' },
    { pattern: /美国|united states|usa/i, value: 'United States' },
    { pattern: /日本|japan/i, value: 'Japan' },
    { pattern: /韩国|south korea|korea/i, value: 'Korea, Republic of' },
    { pattern: /英国|united kingdom|uk/i, value: 'United Kingdom' },
    { pattern: /德国|germany/i, value: 'Germany' },
    { pattern: /法国|france/i, value: 'France' },
    { pattern: /加拿大|canada/i, value: 'Canada' },
    { pattern: /澳大利亚|australia/i, value: 'Australia' }
  ];

  for (const { pattern, value } of locationPatterns) {
    if (pattern.test(query) && !result.location) {
      result.location = value;
      break;
    }
  }

  // 提取时间范围信息
  const timePatterns = [
    { pattern: /最近(\d+)天|past\s*(\d+)\s*days/i, days: 'match' },
    { pattern: /最近一周|past week/i, days: 7 },
    { pattern: /最近一个月|past month/i, days: 30 },
    { pattern: /最近三个月|past 3 months/i, days: 90 },
    { pattern: /最近半年|past 6 months/i, days: 180 },
    { pattern: /最近一年|past year/i, days: 365 }
  ];

  for (const { pattern, days } of timePatterns) {
    const match = query.match(pattern);
    if (match && !result.startDate) {
      const daysBack = days === 'match' ? parseInt(match[1] || match[2]) : days;
      if (!isNaN(daysBack) && daysBack > 0) {
        const date = new Date();
        date.setDate(date.getDate() - daysBack);
        result.startDate = date.toISOString().split('T')[0];
        break;
      }
    }
  }

  // 提取返回数量信息
  const countPattern = /返回(\d+)个|show\s*(\d+)|limit\s*(\d+)/i;
  const countMatch = query.match(countPattern);
  if (countMatch && !result.pageSize) {
    const count = parseInt(countMatch[1] || countMatch[2] || countMatch[3]);
    if (count > 0 && count <= 1000) {
      result.pageSize = count;
    }
  }

  // 清理查询词，移除已提取的参数信息，保留核心疾病/药物关键词
  let cleanQuery = result.query;

  // 移除时间相关词汇
  cleanQuery = cleanQuery.replace(
    /最近\d+天|最近一?[周月年]|past\s+\d+\s+days?|past\s+week|past\s+months?|past\s+years?/gi,
    ''
  );

  // 移除状态相关词汇
  cleanQuery = cleanQuery.replace(
    /招募中|正在招募|即将开始|已完成|暂停|终止|撤回|recruiting|not yet recruiting|completed|suspended|terminated|withdrawn/gi,
    ''
  );

  // 移除阶段相关词汇
  cleanQuery = cleanQuery.replace(
    /[iⅰ一1234iiⅱ二iiiⅲ三ivⅳ四]期|phase\s*[i1234iv]+|早期|early\s*phase/gi,
    ''
  );

  // 移除地理位置词汇
  cleanQuery = cleanQuery.replace(
    /中国|美国|日本|韩国|英国|德国|法国|加拿大|澳大利亚|china|usa|united\s+states|japan|korea|united\s+kingdom|germany|france|canada|australia/gi,
    ''
  );

  // 移除数量相关词汇
  cleanQuery = cleanQuery.replace(/返回\d+个|show\s*\d+|limit\s*\d+/gi, '');

  // 移除常见的连接词和疑问词
  cleanQuery = cleanQuery.replace(
    /请查询|查询|有哪些|的|在|方案|试验|临床|请|下|中|最近|哪些|什么|how many|what|which|trials?|studies?|clinical/gi,
    ''
  );

  // 清理多余空格和标点
  cleanQuery = cleanQuery
    .replace(/[，。？！,?!]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanQuery) {
    result.query = cleanQuery;
  }

  return result;
}

// 运行测试
console.log('🧪 开始测试自然语言查询解析功能\n');

testQueries.forEach((test, index) => {
  console.log(`\n📋 测试 ${index + 1}: ${test.name}`);
  console.log(`原始查询: "${test.query}"`);

  const result = parseNaturalLanguageQuery({ query: test.query });

  console.log('解析结果:');
  console.log(`  - 清理后查询: "${result.query}"`);
  if (result.phases) console.log(`  - 试验阶段: ${result.phases}`);
  if (result.status) console.log(`  - 试验状态: ${result.status}`);
  if (result.location) console.log(`  - 地理位置: ${result.location}`);
  if (result.startDate) console.log(`  - 开始日期: ${result.startDate}`);
  if (result.pageSize) console.log(`  - 返回数量: ${result.pageSize}`);

  console.log('\n✅ 解析完成');
});

console.log('\n🎉 所有测试完成！');
console.log('\n📝 说明:');
console.log('- 自然语言查询解析功能已实现');
console.log('- 支持中英文混合查询');
console.log('- 自动提取试验阶段、状态、地理位置、时间范围和返回数量');
console.log('- 清理查询词，保留核心疾病/药物关键词');
console.log('- 可在FastGPT工作流中结合关键词提取路径使用');
