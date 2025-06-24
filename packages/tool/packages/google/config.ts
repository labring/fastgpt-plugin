import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  toolId: 'community-google',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version'
    }
  ],
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
  inputs: [
    {
      renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
      selectedTypeIndex: 0,
      valueType: WorkflowIOValueTypeEnum.string,
      key: 'cx',
      label: 'cx',
      description: 'Google搜索cxID',
      defaultValue: '',
      list: [
        {
          label: '',
          value: ''
        }
      ],
      required: true
    },
    {
      renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
      selectedTypeIndex: 0,
      valueType: WorkflowIOValueTypeEnum.string,
      key: 'key',
      label: 'key',
      description: 'Google搜索key',
      defaultValue: '',
      required: true,
      list: []
    },
    {
      renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
      selectedTypeIndex: 0,
      valueType: WorkflowIOValueTypeEnum.string,
      key: 'query',
      label: 'query',
      description: '查询字段值',
      defaultValue: '',
      list: [
        {
          label: '',
          value: ''
        }
      ],
      required: true,
      toolDescription: '查询字段值'
    }
  ],
  outputs: [
    {
      id: 'result',
      valueType: WorkflowIOValueTypeEnum.object,
      key: 'result',
      label: 'result',
      type: FlowNodeOutputTypeEnum.static
    }
  ]
});
