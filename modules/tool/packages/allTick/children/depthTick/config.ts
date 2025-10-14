import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '深度行情查询',
    en: 'Depth Tick Query'
  },
  description: {
    'zh-CN': '获取AllTick的最新盘口深度行情数据（Order Book）',
    en: 'Get AllTick latest depth tick data (Order Book)'
  },
  toolDescription:
    'Query real-time market depth data including bid/ask prices and volumes for stocks, forex, cryptocurrencies and other financial instruments from AllTick API',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'symbol',
          label: '产品代码',
          description: '支持股票、外汇、贵金属、加密货币等，如："857.HK","UNH.US"',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'is_stock',
          label: '是否为股票类产品',
          description: '是否为股票类产品，决定使用哪个API端点。股票类包括：A股、港股、美股等',
          renderTypeList: [FlowNodeInputTypeEnum.switch, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'data',
          label: '深度行情数据',
          description: '包含产品代码、报价序号、时间戳、买卖盘深度等完整的盘口信息'
        }
      ]
    }
  ]
});
