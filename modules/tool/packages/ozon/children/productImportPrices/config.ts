import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '更新价格',
    en: 'Update product prices'
  },
  description: {
    'zh-CN': '允许更改一个或多个商品的价格。每个商品的价格每小时不能更新超过 10 次。',
    en: 'Update prices for one or more products (max 10 updates per hour per product).'
  },
  toolDescription:
    "POST /v1/product/import/prices. Update a product's price, old_price, currency, VAT and related pricing strategy flags. If both offer_id and product_id are provided, offer_id takes precedence.",
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'offer_id',
          label: '商品编号',
          description:
            '卖家系统中的商品编号 — 商品代码。与 product_id 二选一，若同时传递则以 offer_id 为准。',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'product_id',
          label: '商品标识符',
          description: '卖家系统中的商品标识符 — product_id。与 offer_id 二选一。',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'currency_code',
          label: '货币代码',
          description:
            '价格货币，需与个人主页设置一致，默认 RUB。示例：RUB、BYN、KZT、EUR、USD、CNY。',
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
          description: '商品当前价格（含折扣）。当 old_price > 0 时需满足最小差额规则。',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'old_price',
          label: '划线价',
          description: '折扣前价格（商品卡上划掉）。无折扣请传 "0"，并将当前价格提交到 price。',
          required: false,
          defaultValue: '0',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'vat',
          label: '增值税税率',
          description: '当前有效的出价值。可选：0、0.05、0.07、0.1、0.2。',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
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
          key: 'net_price',
          label: '成本价',
          description: '产品成本价。',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'min_price',
          label: '最低价',
          description: '应用促销活动后的最低价格。启用自动应用活动或价格策略时需设置。',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'manage_elastic_boosting_through_price',
          label: '弹性提升按价格管理',
          description:
            'true：若 price 符合条件自动加入或提升促销；false：修改 price 不影响参与状态。',
          required: false,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean
        },
        {
          key: 'min_price_for_auto_actions_enabled',
          label: '促销最低价参与',
          description: 'true：Ozon 在添加到促销时考虑最低价；未传递则状态不变。',
          required: false,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean
        },
        {
          key: 'auto_action_enabled',
          label: '自动应用活动',
          description: 'UNKNOWN 不做更改；ENABLED 启用；DISABLED 关闭。',
          required: false,
          defaultValue: 'UNKNOWN',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            { label: 'UNKNOWN', value: 'UNKNOWN' },
            { label: 'ENABLED', value: 'ENABLED' },
            { label: 'DISABLED', value: 'DISABLED' }
          ]
        },
        {
          key: 'price_strategy_enabled',
          label: '自动应用价格策略',
          description: 'UNKNOWN 不做更改；ENABLED 启用；DISABLED 关闭并从策略移除。',
          required: false,
          defaultValue: 'UNKNOWN',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            { label: 'UNKNOWN', value: 'UNKNOWN' },
            { label: 'ENABLED', value: 'ENABLED' },
            { label: 'DISABLED', value: 'DISABLED' }
          ]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'result',
          label: '价格更新结果',
          description: '返回每个商品的更新状态（product_id、offer_id、updated、errors）'
        }
      ]
    }
  ]
});
