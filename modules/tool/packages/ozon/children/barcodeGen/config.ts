import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '创建商品条形码',
    en: 'Generate product barcodes'
  },
  description: {
    'zh-CN':
      '如果商品没有条形码，您可以通过此方法生成条形码。 如果商品已有条形码但未在 Ozon 系统中登记，您可以通过 /v1/barcode/add 方法进行绑定。 每次请求最多可为 100 个商品生成条形码。 每个卖家账号每分钟最多可使用该方法 20 次。',
    en: 'Generate barcodes for products without one. If a product already has a barcode but it is not registered in Ozon, use /v1/barcode/add to bind it. Up to 100 products per request. Up to 20 requests per minute per seller account.'
  },
  toolDescription:
    'Generate barcodes on Ozon for the provided product_ids and return the API response including any errors.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'product_ids',
          label: '商品标识符列表',
          description: '需要生成条形码的商品标识符（字符串 int64），JSON 数组["product_ids"]',
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.arrayString,
          required: true,
          defaultValue: '["product_ids"]'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'result',
          label: '结果',
          description: '生成结果（包含 errors 等）'
        }
      ]
    }
  ]
});
