import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '更新库存商品的数量',
    en: 'Update product stock'
  },
  description: {
    'zh-CN': '可以改变一个商品的库存数量信息。',
    en: "Update the stock quantity of a product in the seller's inventory."
  },
  toolDescription: "Update the stock quantity of a product in the seller's inventory.",
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'offer_id',
          label: '商品编号',
          description: '在卖家系统中的商品编号 — 商品代码',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'product_id',
          label: '商品标识符',
          description: '在卖家系统中的商品标识符 — product_id',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'stock',
          label: '库存数量',
          description: '扣除预留库存后的可售商品数量',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'warehouse_id',
          label: '仓库编号',
          description: '仓库编号，可通过 /v1/warehouse/list 获取',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'result',
          label: '更新结果',
          description: '库存更新结果'
        }
      ]
    }
  ]
});
