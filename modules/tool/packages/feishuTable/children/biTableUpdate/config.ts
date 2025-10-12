import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '更新多维表格',
    en: 'Update BiTable'
  },
  description: {
    'zh-CN': '更新指定飞书多维表格应用的元数据信息',
    en: 'Update metadata information of a specific Feishu Bitable application'
  },
  toolDescription: 'Update the name or other metadata of a Feishu Bitable application.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'biTableId',
          label: '多维表格 ID',
          description: '多维表格应用的唯一标识',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The BiTable ID (app token) of the Bitable application to update',
          placeholder: 'bascxxxxxx'
        },
        {
          key: 'name',
          label: '应用名称',
          description: '新的应用名称',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The new name for the Bitable application',
          maxLength: 100
        }
      ],
      outputs: [
        {
          key: 'success',
          label: '是否成功',
          description: '操作是否成功',
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ]
    }
  ]
});
