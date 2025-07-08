import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  SystemInputKeyEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { defineInputConfig } from '@tool/utils/tool';

export default defineTool({
  name: {
    'zh-CN': '百度搜索',
    en: 'Baidu Search'
  },
  description: {
    'zh-CN': '调用百度搜索',
    en: 'Call Baidu search'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        defineInputConfig([
          {
            key: 'apiKey',
            label: 'Search API Key',
            required: true,
            inputType: 'secret'
          }
        ]),
        {
          key: 'q',
          label: '搜索关键词',
          toolDescription: '搜索关键词',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input]
        },
        {
          key: 'num',
          label: '最大搜索数量',
          valueType: WorkflowIOValueTypeEnum.number,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          value: 20,
          max: 100,
          min: 1
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'result',
          label: '搜索结果',
          description: '搜索结果'
        }
      ]
    }
  ]
});
