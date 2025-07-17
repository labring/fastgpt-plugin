import fs from 'fs';
import path from 'path';

// 测试临床试验工具配置
const testClinicalTrialsConfig = async () => {
  console.log('🔍 测试临床试验工具配置加载...');

  try {
    // 检查配置文件
    const configPath =
      '/Users/qinxiaoqiang/Downloads/fastgpt-plugin-1/modules/tool/packages/clinicalTrials/config.ts';
    const configContent = fs.readFileSync(configPath, 'utf8');

    console.log('✅ 配置文件存在');

    // 检查关键配置
    const hasPhases = configContent.includes('phases');
    const hasStatus = configContent.includes('status');
    const hasInputType = configContent.includes('FlowNodeInputTypeEnum.input');

    console.log('📋 配置检查结果:');
    console.log(`  - phases字段: ${hasPhases ? '✅' : '❌'}`);
    console.log(`  - status字段: ${hasStatus ? '✅' : '❌'}`);
    console.log(`  - input类型: ${hasInputType ? '✅' : '❌'}`);

    // 检查phases字段的renderTypeList
    const phasesMatch = configContent.match(/phases[\s\S]*?renderTypeList:\s*\[([^\]]+)\]/);
    if (phasesMatch) {
      console.log(`  - phases renderTypeList: ${phasesMatch[1]}`);
    }

    // 检查status字段的renderTypeList
    const statusMatch = configContent.match(/status[\s\S]*?renderTypeList:\s*\[([^\]]+)\]/);
    if (statusMatch) {
      console.log(`  - status renderTypeList: ${statusMatch[1]}`);
    }

    // 测试API调用
    console.log('\n🌐 测试工具API...');
    const response = await fetch('http://localhost:5100/api/tool/list');
    if (response.ok) {
      const tools = await response.json();
      const clinicalTool = tools.find((tool) => tool.name?.['zh-CN'] === '临床试验查询');

      if (clinicalTool) {
        console.log('✅ 临床试验工具已加载');
        console.log(`  - 工具ID: ${clinicalTool.toolId}`);

        // 检查phases字段配置
        const phasesField = clinicalTool.versionList?.[0]?.inputs?.find(
          (input) => input.key === 'phases'
        );
        if (phasesField) {
          console.log(
            `  - phases字段renderTypeList: ${JSON.stringify(phasesField.renderTypeList)}`
          );
        }

        // 检查status字段配置
        const statusField = clinicalTool.versionList?.[0]?.inputs?.find(
          (input) => input.key === 'status'
        );
        if (statusField) {
          console.log(
            `  - status字段renderTypeList: ${JSON.stringify(statusField.renderTypeList)}`
          );
        }
      } else {
        console.log('❌ 临床试验工具未找到');
      }
    } else {
      console.log('❌ API调用失败');
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

testClinicalTrialsConfig();
