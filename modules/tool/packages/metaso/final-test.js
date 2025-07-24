import { MetasoApiClient } from './src/api.ts';

async function testAllAPIs() {
  const client = new MetasoApiClient({
    apiKey: 'mk-42D80172504D147AFAF1960E57385E1C',
    baseUrl: 'https://metaso.cn',
    timeout: 30000
  });
  
  console.log('=== 测试 Metaso 所有 API 功能 ===\n');
  
  try {
    // 测试搜索 API
    console.log('1. 测试搜索 API...');
    const searchResult = await client.search({
      q: '人工智能',
      scope: 'webpage',
      includeSummary: false,
      size: '3'
    });
    console.log('✅ 搜索 API 成功');
    console.log(`   - 总结果数: ${searchResult.total}`);
    console.log(`   - 返回结果数: ${searchResult.results.length}`);
    if (searchResult.results.length > 0) {
      const first = searchResult.results[0];
      console.log(`   - 第一个结果: ${first.title}`);
      console.log(`   - URL: ${first.url}`);
      console.log(`   - 摘要: ${first.snippet.substring(0, 50)}...`);
    }
    console.log('');
    
    // 测试问答 API
    console.log('2. 测试问答 API...');
    const askResult = await client.ask({
      q: '什么是机器学习？',
      scope: 'webpage'
    });
    console.log('✅ 问答 API 成功');
    console.log(`   - 问题: ${askResult.query}`);
    console.log(`   - 回答预览: ${askResult.answer.substring(0, 100)}...`);
    console.log('');
    
    // 测试网页读取 API
    console.log('3. 测试网页读取 API...');
    const readerResult = await client.reader({
      url: 'https://www.baidu.com'
    });
    console.log('✅ 网页读取 API 成功');
    console.log(`   - 内容长度: ${readerResult.content.length} 字符`);
    console.log(`   - 内容预览: ${readerResult.content.substring(0, 100)}...`);
    console.log('');
    
    console.log('🎉 所有 API 测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

testAllAPIs();