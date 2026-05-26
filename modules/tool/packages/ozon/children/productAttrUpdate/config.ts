import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '更新商品特征',
    en: 'Update product attributes'
  },
  description: {
    'zh-CN': '更新商品特征',
    en: 'Update product attributes'
  },
  toolDescription: 'Update product attributes on Ozon',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'attributes',
          label: '商品特征',
          description:
            "商品特征，格式为JSON数组，每个元素为{'complex_id': 0, 'id': 5076, 'values': [{'dictionary_value_id': 971082156, 'value': '麦克风架'}]}",
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.arrayAny,
          required: true,
          defaultValue:
            '[{"complex_id": 0, "id": 5076, "values": [{"dictionary_value_id": 971082156, "value": "麦克风架"}]}]'
        },
        {
          key: 'offer_id',
          label: '商品ID',
          description: '商品ID',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          defaultValue: '123456789012'
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
