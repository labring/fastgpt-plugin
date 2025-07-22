// 测试临床试验工具的简单脚本
const testClinicalTrials = async () => {
  try {
    const response = await fetch('http://localhost:5100/tool/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('API响应:', JSON.stringify(result, null, 2));

    const tools = Array.isArray(result) ? result : result.tools || result.data || [];
    console.log('总工具数量:', tools.length);

    // 查找临床试验工具
    const clinicalTool = tools.find(
      (tool) =>
        tool.name &&
        (tool.name['zh-CN']?.includes('临床试验') || tool.name.en?.includes('Clinical'))
    );

    if (clinicalTool) {
      console.log('✅ 找到临床试验工具:');
      console.log('- 工具ID:', clinicalTool.toolId);
      console.log('- 中文名称:', clinicalTool.name['zh-CN']);
      console.log('- 英文名称:', clinicalTool.name.en);
      console.log('- 描述:', clinicalTool.description['zh-CN']);
      console.log('- 输入参数数量:', clinicalTool.versionList[0]?.inputs?.length || 0);
      console.log('- 输出参数数量:', clinicalTool.versionList[0]?.outputs?.length || 0);
    } else {
      console.log('❌ 未找到临床试验工具');
      console.log('可用工具列表:');
      tools.forEach((tool) => {
        console.log(`- ${tool.toolId}: ${tool.name?.['zh-CN'] || tool.name?.en || 'Unknown'}`);
      });
    }
  } catch (error) {
    console.error('测试失败:', error.message);
  }
};

// 运行测试
testClinicalTrials();
