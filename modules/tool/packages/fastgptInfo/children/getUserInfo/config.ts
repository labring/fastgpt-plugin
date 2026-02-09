import { defineTool } from '@tool/type';
import { WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  name: {
    'zh-CN': '模版工具',
    en: 'Template tool'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '描述',
    en: 'description'
  },
  toolDescription:
    'tool description for ai to use, fallback to English description if not provided',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'username',
          label: '账户名',
          description: '当前账户名'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'memberName',
          label: '成员名',
          description: '当前成员名'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'contact',
          label: '联系方式',
          description: '当前联系方式'
        },
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'orgs',
          label: '组织',
          description: '当前组织'
        },
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'groups',
          label: '群组',
          description: '当前群组'
        }
      ]
    }
  ]
});
