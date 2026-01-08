import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '每日天气',
    en: 'Daily Weather'
  },
  description: {
    'zh-CN': '获取指定城市的每日天气信息',
    en: 'Get daily weather information for specified city'
  },
  toolDescription: '获取指定城市的每日天气信息，包括温度、湿度、风力等详细数据',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          key: 'province',
          label: '省份',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          description: '省份名称，如：浙江省',
          toolDescription: '省份名称'
        },
        {
          key: 'city',
          label: '城市',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          description: '城市名称，如：杭州市',
          toolDescription: '城市名称'
        },
        {
          key: 'towns',
          label: '区县',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          description: '区县名称，如：余杭区',
          toolDescription: '区县名称'
        },
        {
          key: 'start_time',
          label: '开始时间',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          description: '开始日期，格式：YYYY-MM-DD，如：2024-07-18',
          placeholder: '格式：YYYY-MM-DD，如：2024-07-18',
          toolDescription: '开始日期'
        },
        {
          key: 'end_time',
          label: '结束时间',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          description: '结束日期，格式：YYYY-MM-DD，如：2024-07-20',
          placeholder: '格式：YYYY-MM-DD，如：2024-07-20，最多获取未来15天的天气数据',
          toolDescription: '结束日期'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'data',
          label: '天气数据',
          description: '指定时间范围内的天气数据数组'
        }
      ]
    }
  ]
});
