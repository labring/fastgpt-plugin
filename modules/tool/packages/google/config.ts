import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.search,
  name: {
    'zh-CN': 'Google 搜索',
    en: 'Google search'
  },
  description: {
    'zh-CN': '在 Google 中搜索',
    en: 'Search in Google'
  },
  icon: 'core/workflow/template/google',
  courseUrl:
    'https://fael3z0zfze.feishu.cn/wiki/Vqk1w4ltNiuLifkHTuoc0hSrnVg?fromScene=spaceOverview',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'query',
          label: 'query',
          description: '查询字段值',
          required: true,
          toolDescription: '查询字段值'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'result',
          label: 'result'
        }
      ]
    }
  ],
  secretInputConfig: [
    {
      key: 'key',
      label: 'key',
      description: 'Google搜索key',
      required: true,
      inputType: 'secret'
    },
    {
      key: 'cx',
      label: 'cx',
      description: 'Google搜索cxID',
      required: true,
      inputType: 'secret'
    }
  ]
});
