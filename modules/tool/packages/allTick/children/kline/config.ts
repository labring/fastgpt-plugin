import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'K线数据查询',
    en: 'AllTick K-Line Data Query'
  },
  description: {
    'zh-CN': '获取AllTick平台的K线图表数据，支持股票、外汇、贵金属、加密货币等多种金融产品',
    en: 'Retrieve K-line chart data from AllTick platform, supporting stocks, forex, precious metals, cryptocurrencies and other financial products'
  },
  toolDescription:
    'Query K-line (candlestick) chart data from AllTick API for various financial instruments including stocks, forex, precious metals, and cryptocurrencies',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'code',
          label: '产品代码',
          description: '金融产品的唯一标识符，支持股票代码、外汇对、贵金属代码、加密货币代码等',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'kline_type',
          label: 'K线周期类型',
          description:
            'K线时间周期设置：\n' +
            '• 1: 1分钟线\n' +
            '• 2: 5分钟线\n' +
            '• 3: 15分钟线\n' +
            '• 4: 30分钟线\n' +
            '• 5: 1小时线\n' +
            '• 6: 2小时线（股票不支持）\n' +
            '• 7: 4小时线（股票不支持）\n' +
            '• 8: 日K线\n' +
            '• 9: 周K线\n' +
            '• 10: 月K线\n' +
            '注：查询昨日收盘价请使用日K线（8）',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'kline_timestamp_end',
          label: 'K线查询截止时间',
          description:
            'K线数据查询的时间基准点：\n' +
            '• 传入 0：从当前最新交易日开始向前查询\n' +
            '• 传入时间戳：从指定时间戳开始向前查询\n' +
            '注：时间戳查询仅支持外汇、贵金属、加密货币，股票类产品无效',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'query_kline_num',
          label: 'K线数据条数',
          description:
            '指定查询的K线数据条数，单次请求最多500条。\n' +
            '可通过时间戳分批循环查询更多历史数据。\n' +
            '提示：查询昨日收盘价时，设置K线周期为8（日K），数据条数为2，返回结果中时间戳较小的即为昨日收盘价',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'adjust_type',
          label: '复权类型',
          description:
            '股票数据的复权处理方式（仅对股票类产品有效）：\n• 0: 不复权（除权）\n• 1: 前复权\n注：目前仅支持不复权模式（0）',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'is_stock',
          label: '股票类产品标识',
          description: '标识当前查询的产品是否为股票类型，用于系统选择合适的API接口进行数据查询',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'data',
          label: 'K线数据结果',
          description:
            '返回完整的K线数据对象，包含产品代码、K线周期类型、K线数据列表以及数据总条数等详细信息'
        }
      ]
    }
  ]
});
