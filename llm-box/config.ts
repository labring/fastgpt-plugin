import { defineConfig } from '@fastgpt-plugin/sdk-factory/config';

export default defineConfig({
  name: {
    en: 'llm-box',
    'zh-CN': 'llm-box'
  },
  description: {
    en: 'Execute llm-box workflows and commands. A terminal-first AI workflow engine.',
    'zh-CN': '执行 llm-box 工作流和命令。一个终端优先的 AI 工作流引擎。'
  },
  courseUrl: 'https://github.com/alib8b8/llm-box',
  author: 'llm-box Team',
  tags: ['tools', 'productivity']
});
