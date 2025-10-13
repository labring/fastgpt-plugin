import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  isWorkerRun: false,
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
