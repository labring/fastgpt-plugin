import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '最新成交价查询',
    en: 'Latest Trade Price Query'
  },
  description: {
    'zh-CN': '获取AllTick的最新成交价数据（最新tick、当前价、最新价）',
    en: 'Get AllTick latest trade price data (latest tick, current price, latest price)'
  },
  toolDescription:
    'Query real-time latest trade price data including price, volume, turnover and trade direction for stocks, forex, cryptocurrencies and other financial instruments from AllTick API',
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
          label: '最新成交价数据',
          description: '包含产品代码、序号、时间戳、成交价、成交量、成交额、交易方向等信息'
        }
      ]
    }
  ]
});
