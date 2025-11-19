import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '为商品绑定条形码',
    en: 'Add barcode to product'
  },
  description: {
    'zh-CN':
      '如果商品已有条形码但未在 Ozon 系统中登记，可通过此方法绑定。 如果没有条形码，您可以通过 /v1/barcode/generate 方法生成。每个商品最多可绑定 100 个条形码。 每个卖家账号每分钟最多可使用该方法 20 次。',
    en: 'If a product already has a barcode but it hasn’t been registered in the Ozon system, you can associate it using this method. If it doesn’t have a barcode, you can generate one using the /v1/barcode/generate method. Up to 100 barcodes can be associated with a single product. Each seller account can use this method up to 20 times per minute.'
  },
  toolDescription:
    'Add a barcode to a product in Ozon. The barcode should be a unique identifier for the product.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'barcodes',
          label: '条形码列表',
          description: 'JSON 数组，每项包含 { barcode: string; sku: number }',
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          required: true,
          defaultValue: '[{"barcode":"123456789012","sku":123456789012}]'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'result',
          label: '结果',
          description: '绑定结果'
        }
      ]
    }
  ]
});
