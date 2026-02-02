import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  SystemInputKeyEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'Google 视频搜索',
    en: 'Google Videos Search'
  },
  description: {
    'zh-CN': '调用 Google 视频搜索',
    en: 'Call Google videos search'
  },
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
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
        },
        {
          key: 'time_period',
          label: '搜索日期范围',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select],
          defaultValue: 'last_year',
          list: [
            { label: 'last_hour', value: 'last_hour' },
            { label: 'last_day', value: 'last_day' },
            { label: 'last_week', value: 'last_week' },
            { label: 'last_month', value: 'last_month' },
            { label: 'last_year', value: 'last_year' }
          ]
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
