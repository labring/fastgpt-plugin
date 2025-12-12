import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '通过SKU创建商品',
    en: 'Create product by SKU'
  },
  description: {
    'zh-CN':
      '该方法会创建指定SKU的商品卡片副本。 如果卖家禁止复制， 将无法创建卡片副本。无法通过SKU更新商品。',
    en: 'Create a product with metadata (ID, name, attributes, images, barcode, pricing, dimensions) and return a task_id for status tracking.'
  },
  toolDescription:
    'Create a product with metadata (ID, name, attributes, images, barcode, pricing, dimensions) and return a task_id for status tracking.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'sku',
          label: 'SKU',
          description: '在 Ozon 系统中的商品 ID — SKU',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'name',
          label: '商品名称',
          description: '商品名称（不超过 500 字符）',
          required: true,
          maxLength: 500,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'offer_id',
          label: '商品ID',
          description: '在卖家系统中的商品ID — 货号（不超过 50 字符）',
          required: true,
          maxLength: 50,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'currency_code',
          label: '货币代码',
          description:
            '价格显示的货币，需与个人中心设置一致。默认 RUB。若设置为人民币请传 CNY，否则会报错',
          required: false,
          defaultValue: 'RUB',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            { label: 'RUB', value: 'RUB' },
            { label: 'BYN', value: 'BYN' },
            { label: 'KZT', value: 'KZT' },
            { label: 'EUR', value: 'EUR' },
            { label: 'USD', value: 'USD' },
            { label: 'CNY', value: 'CNY' }
          ]
        },
        {
          key: 'price',
          label: '价格',
          description:
            '含折扣的商品价格。无折扣时与 old_price 相同。以卢布表示，点号为小数分隔符，最多两位小数',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'old_price',
          label: '划线价格',
          description: '折扣前的价格（商品卡片上划掉）。以卢布表示，点号为小数分隔符，最多两位小数',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'vat',
          label: '增值税税率',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            { label: '0', value: '0' },
            { label: '0.05', value: '0.05' },
            { label: '0.07', value: '0.07' },
            { label: '0.1', value: '0.1' },
            { label: '0.2', value: '0.2' }
          ]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'task_id',
          label: '任务ID',
          description: '任务 ID'
        },
        {
          valueType: WorkflowIOValueTypeEnum.arrayAny,
          key: 'unmatched_sku_list',
          label: '未匹配SKU列表',
          description: '未匹配的SKU列表'
        }
      ]
    }
  ]
});
