import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '创建或更新商品',
    en: 'Create or update product'
  },
  description: {
    'zh-CN': '创建商品并更新有关商品信息的方法。',
    en: 'Create or update product'
  },
  toolDescription:
    'Create or update a product with metadata (ID, name, attributes, images, barcode, pricing, dimensions) and return a task_id for status tracking.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'offer_id',
          label: '商品ID',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'name',
          label: '商品名称',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'attributes',
          label: '商品属性',
          description:
            '商品属性，格式为JSON数组，每个元素为{"complex_id": 0, "id": 5076, "values": [{"dictionary_value_id": 971082156, "value": "麦克风架"}]}',
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.arrayAny,
          defaultValue:
            '[{"complex_id": 0, "id": 5076, "values": [{"dictionary_value_id": 971082156, "value": "麦克风架"}]}]'
        },
        {
          key: 'images',
          label: '商品图片',
          description:
            '商品图片，格式为JSON数组，每个元素为图片URL，图片需要上传到对象存储桶中公开可读',
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.arrayString
        },
        {
          key: 'barcode',
          label: '商品条码',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'description_category_id',
          label: '商品描述分类ID',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'type_id',
          label: '商品类型ID',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'currency_code',
          label: '货币代码',
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
          label: '商品价格',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'old_price',
          label: '划线价',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
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
        },
        {
          key: 'dimension_unit',
          label: '商品尺寸单位',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            { label: 'mm', value: 'mm' },
            { label: 'cm', value: 'cm' },
            { label: 'in', value: 'in' }
          ]
        },
        {
          key: 'depth',
          label: '商品深度',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'height',
          label: '商品高度',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'width',
          label: '商品宽度',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'weight_unit',
          label: '商品重量单位',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            { label: 'g', value: 'g' },
            { label: 'kg', value: 'kg' },
            { label: 'lb', value: 'lb' }
          ]
        },
        {
          key: 'weight',
          label: '商品重量',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          required: true,
          valueType: WorkflowIOValueTypeEnum.number
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'task_id',
          label: '任务ID',
          description: '任务 ID'
        }
      ]
    }
  ]
});
