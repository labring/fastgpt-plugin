// 直接测试 API 调用（使用内置 fetch）
async function testAPI() {
  console.log('测试 Metaso API 调用...');
  
  const requestBody = {
    q: "介绍下小x宝社区和小胰宝项目",
    scope: "webpage",
    includeSummary: false,
    size: "10"
  };

  try {
    const response = await fetch('https://metaso.cn/api/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mk-42D80172504D147AFAF1960E57385E1C',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('响应状态:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API 调用成功！');
      console.log('响应数据结构:');
      console.log('- 顶级键:', Object.keys(data));
      
      if (data.webpages) {
        console.log('- webpages 数组长度:', data.webpages.length);
        if (data.webpages.length > 0) {
          console.log('- 第一个结果的键:', Object.keys(data.webpages[0]));
          console.log('- 第一个结果标题:', data.webpages[0].title);
          console.log('- 第一个结果 URL:', data.webpages[0].url);
          console.log('- 第一个结果描述:', data.webpages[0].snippet || data.webpages[0].description || data.webpages[0].content);
        }
      }
      
      if (data.data) {
        console.log('- data 字段存在，类型:', typeof data.data);
      }
      
    } else {
      const errorText = await response.text();
      console.error('API 调用失败:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

testAPI();