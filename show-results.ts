import { tool } from './modules/tool/packages/pythonDataAnalysis/src/index';
import { readFile } from 'fs/promises';
import { join } from 'path';

async function test() {
  console.log('=========================================');
  console.log('🚀 正在启动本地自动化集成测试...');
  console.log('=========================================');

  try {
    // 1. 读取测试数据
    const csvPath = join(process.cwd(), 'test_data.csv');
    const csvContent = await readFile(csvPath, 'utf-8');
    console.log('📍 已加载测试数据:', csvPath);

    // 2. 模拟插件输入
    const payload = {
      data: csvContent,
      chartType: 'bar' as const,
      xAxis: '日期',
      yAxis: '销售额'
    };

    console.log('📥 模拟输入参数:', JSON.stringify(payload, null, 2));
    console.log('-----------------------------------------');

    // 3. 执行插件逻辑
    const result = await tool(payload);

    // 4. 打印最终结果
    console.log('\n✅ 测试运行成功！');
    console.log('\n📊 分析结果 (analysisResult):');
    console.log('-----------------------------------------');
    console.log(result.analysisResult);
    console.log('-----------------------------------------');

    if (result.chartUrl) {
      console.log('🖼️  图表链接:', result.chartUrl);
    } else {
      console.log('⚠️  提示: 图表已生成在本地工作目录，但由于未连接 S3 服务，未生成访问链接。');
    }

    if (result.debugInfo) {
      console.log('\n🔍 Python 内部执行详情:');
      console.log('- 解释器路径:', result.debugInfo.stdout.split('\n')[0]); // 简略打印
      console.log('- 标准输出长度:', result.debugInfo.stdout.length);
      console.log('- 错误输出 (Stderr):', result.debugInfo.stderr || '无错误');
    }
  } catch (error) {
    console.error('\n❌ 测试执行失败:');
    console.error(error);
  }
  console.log('\n=========================================');
}

test();
