import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '卖家库存余额（FBS 按仓库）',
    en: 'Seller stock balance by warehouse (FBS)'
  },
  description: {
    'zh-CN': '在请求中传递 offer_id 或 sku。若同时传递两者，将只使用 sku。',
    en: 'Pass either offer_id or sku. If both provided, sku is used.'
  },
  toolDescription:
    'Query stock quantities by warehouse for FBS via /v1/product/info/stocks-by-warehouse/fbs.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'id_type',
          label: '标识类型',
          description: '选择使用 sku 或 offer_id 作为查询依据',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          defaultValue: 'sku',
          list: [
            { label: 'sku', value: 'sku' },
            { label: 'offer_id', value: 'offer_id' }
          ]
        },
        {
          key: 'ids',
          label: '标识列表',
          description: '根据选择的标识类型填写对应的值（JSON 数组，字符串 int64）',
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.arrayString,
          required: true,
          defaultValue: '["123456789012"]'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'result',
          label: '库存明细',
          description:
            '库存商品的数量（包含 sku、offer_id、present、product_id、reserved、warehouse_id、warehouse_name）'
        }
      ]
    }
  ]
});
