// 调试 Metaso API 响应格式的脚本
const fetch = require('node-fetch');

async function testMetasoAPI() {
  const apiKey = 'mk-'; // 请替换为实际的 API 密钥
  
  const requestBody = {
    q: "人工智能",
    scope: "webpage",
    size: "5",
    includeSummary: true
  };

  try {
    console.log('发送请求到 Metaso API...');
    console.log('请求体:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://metaso.cn/api/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('响应长度:', responseText.length);
    console.log('响应内容（前 500 字符）:');
    console.log(responseText.substring(0, 500));
    
    // 尝试解析 JSON
    try {
      const jsonData = JSON.parse(responseText);
      console.log('\n解析后的 JSON 结构:');
      console.log('- 顶级键:', Object.keys(jsonData));
      
      if (jsonData.results) {
        console.log('- results 数组长度:', jsonData.results.length);
        if (jsonData.results.length > 0) {
          console.log('- 第一个结果的键:', Object.keys(jsonData.results[0]));
        }
      }
      
      if (jsonData.data) {
        console.log('- data 字段类型:', typeof jsonData.data);
        if (typeof jsonData.data === 'object') {
          console.log('- data 字段的键:', Object.keys(jsonData.data));
        }
      }
      
    } catch (parseError) {
      console.error('JSON 解析失败:', parseError.message);
    }

  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

testMetasoAPI();