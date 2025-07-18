import { defineTool, ToolTypeEnum } from '../../types/tool';

export default defineTool({
  id: 'simple-tool-template',
  name: '简单工具模板',
  type: ToolTypeEnum.SIMPLE,
  description: '这是一个简单工具的模板，用于快速创建功能单一的工具插件',
  avatar: '🔧',
  author: 'FastGPT',
  version: '1.0.0',
  updateTime: '2024-01-01',
  versionList: [
    {
      version: '1.0.0',
      updateTime: '2024-01-01',
      description: '初始版本',
      inputs: [
        {
          key: 'input',
          label: '输入内容',
          description: '需要处理的输入内容',
          type: 'string',
          required: true
        },
        {
          key: 'options',
          label: '选项配置',
          description: '可选的配置参数',
          type: 'string',
          required: false
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '处理结果',
          description: '工具处理后的结果',
          type: 'string'
        },
        {
          key: 'metadata',
          label: '元数据',
          description: '处理过程中的元数据信息',
          type: 'object'
        }
      ]
    }
  ],
  handler: './src/index'
});