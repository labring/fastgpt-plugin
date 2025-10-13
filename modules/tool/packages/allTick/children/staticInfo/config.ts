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
          key: 'symbol_list',
          label: '股票代码列表',
          description:
            '股票代码列表，支持美股、港股、A股，格式如：[{"code":"857.HK"},{"code":"UNH.US"},{"code":"000001.SZ"}]',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.arrayObject
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
