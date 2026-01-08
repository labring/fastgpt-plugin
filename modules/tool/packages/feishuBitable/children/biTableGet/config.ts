import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '获取多维表格',
    en: 'Get BiTable'
  },
  description: {
    'zh-CN': '获取指定飞书多维表格应用的元数据信息',
    en: 'Get metadata information of a specific Feishu Bitable application'
  },
  toolDescription:
    'Retrieve metadata information of a Feishu Bitable application by its app token.',

  versionList: [
    {
      value: '0.1.1',
      description: 'Initial version',
      inputs: [
        {
          key: 'biTableId',
          label: '多维表格 ID',
          description: '多维表格应用的唯一标识',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The BiTable ID (app token) of the Bitable application',
          placeholder: 'bascxxxxxx'
        }
      ],
      outputs: [
        {
          key: 'name',
          label: '应用名称',
          description: '应用名称',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
