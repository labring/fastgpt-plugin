// 你应该修改本文件
// You should modify this file

import { defineToolSet } from '@tool/type';
import tool from './tool';
// import tool2 from './tool2'; 添加更多 tools

export default defineToolSet({
  name: {
    'zh-CN': '样例工具集',
    en: 'Template Tool Set'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '这是一个样例工具集',
    en: 'This is a sample tool set'
  },
  icon: '',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version'
    }
  ],
  author: 'FastGPT',
  children: [tool] // 添加更多 tools
});
