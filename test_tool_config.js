// 测试临床试验工具配置的脚本
const path = require('path');

// 模拟导入工具配置
const testToolConfig = async () => {
  try {
    console.log('🔍 测试临床试验工具配置...');

    // 检查文件是否存在
    const fs = require('fs');
    const toolPath =
      '/Users/qinxiaoqiang/Downloads/fastgpt-plugin-1/modules/tool/packages/clinicalTrials';

    console.log('📁 检查工具目录结构:');
    const files = fs.readdirSync(toolPath);
    files.forEach((file) => {
      console.log(`  - ${file}`);
    });

    // 检查package.json
    const packagePath = path.join(toolPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      console.log('\n📦 Package.json 信息:');
      console.log(`  - 名称: ${packageJson.name}`);
      console.log(`  - 模块入口: ${packageJson.module}`);
      console.log(`  - 类型: ${packageJson.type}`);
    }

    // 检查构建输出
    const distPath = '/Users/qinxiaoqiang/Downloads/fastgpt-plugin-1/dist/tools';
    if (fs.existsSync(distPath)) {
      console.log('\n🏗️ 构建输出目录:');
      const distFiles = fs.readdirSync(distPath);
      const clinicalTrialsFiles = distFiles.filter((f) => f.includes('clinical'));
      if (clinicalTrialsFiles.length > 0) {
        console.log('  ✅ 找到临床试验工具构建文件:');
        clinicalTrialsFiles.forEach((file) => {
          console.log(`    - ${file}`);
        });
      } else {
        console.log('  ❌ 未找到临床试验工具构建文件');
        console.log('  📋 所有构建文件:');
        distFiles.forEach((file) => {
          console.log(`    - ${file}`);
        });
      }
    } else {
      console.log('\n❌ 构建输出目录不存在');
    }

    console.log('\n✅ 工具配置检查完成');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

// 运行测试
testToolConfig();
