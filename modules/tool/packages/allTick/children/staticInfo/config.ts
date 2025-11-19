import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '股票基础信息查询',
    en: 'Stock Static Info Query'
  },
  description: {
    'zh-CN': '批量查询美股、港股、A股产品的基础信息',
    en: 'Batch query basic information for US stocks, Hong Kong stocks, and A-shares'
  },
  toolDescription:
    'Query basic stock information including company name, book value per share, circulating shares, currency, dividend yield, earnings per share and other fundamental data from AllTick API',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'symbol',
          label: '股票代码',
          description: '股票代码，支持美股、港股、A股，如："857.HK","UNH.US","000001.SZ"',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'data',
          label: '股票基础信息',
          description: '包含股票名称、每股净资产、流通股本、交易币种、股息、每股盈利等基础信息'
        }
      ]
    }
  ]
});
